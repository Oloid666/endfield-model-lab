/** Actual MissionDirector with a small world double; no WebGL or performance claim. */
import * as T from 'three';
import fs from 'node:fs';
import {Resources} from '../src/resources.js';
import {MissionDirector,chargeCameraBeat} from '../src/mission-director.js';
import {buildConnectionStage} from '../src/connection-stage.js';

const ctx=new Proxy({measureText:s=>({width:s.length*12})},{get:(o,k)=>k in o?o[k]:(()=>{})});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})};
const checks=[];
function check(name,passed,detail=null){checks.push({name,passed,detail});if(!passed)throw Error(`${name}: ${JSON.stringify(detail)}`);}
function makeWorld(aspect=390/844){
  const r=new Resources(),scene=new T.Scene(),calls={rewind:[],updates:[],begin:0,past:0,restore:0,reflection:0};
  const actors={root:new T.Group(),heroPosition:[-1.25,1.52,3.25],dragonPosition:[-2,.54,3.25],status:{smile:0},cast:null,action:null,
    setCinematic(value){this.cast=value;},setDragonProjectile(point,roll){this.projectile=point?[...point]:null;if(point)this.dragonPosition=[...point];this.roll=roll;},
    setSmile(value){this.status.smile=value;},setCompanionAction(value){this.action=value;},setMove(){},teleport(x,z){this.heroPosition[0]=x;this.heroPosition[2]=z;}};
  scene.add(actors.root);
  const prop=name=>({root:new T.Group(),reset(){calls.updates.push({name,reset:true});},update(t,dt,state){calls.updates.push({name,t,dt,phase:state.phase});}});
  const d={state:{progress:99,serverPosition:[0,.8,1],milestones:[]},targets:[{id:'server',position:[0,.8,1]}],signFlight:null,
    reset(){this.state.progress=0;},beginRewind(){calls.begin++;},showFlashback(){calls.past++;},restorePresent(){calls.restore++;},updateRewind(p){calls.rewind.push(p);},
    update(t,dt){calls.updates.push({name:'destruction',t,dt});},setProgress(p){this.state.progress=p;},destroyServer(){},neighbor:{position:[-8.03,3.15,-2.23],impact(){}}};
  const world={r,scene,actors,calls,time:100,manualUntil:0,charactersEnabled:true,walkCamera:{enabled:false},controls:{target:new T.Vector3(),enabled:true},
    camera:new T.PerspectiveCamera(50,aspect,.05,200),store:{destruction:d,spill:{shadow:{needsUpdate:false}}},shopFixtures:[new T.Group()],glassPass:{drawGlass:true},
    garden:prop('garden'),tianshi:prop('tianshi'),microwave:prop('microwave'),siege:{...prop('siege'),fire(){},impact(){}},xaihi:prop('xaihi'),
    weather:{invalidateReflection(){calls.reflection++;}},setView(name){this.currentView=name;},setWalking(value){this.walkCamera.enabled=value;}};
  world.connectionStage=buildConnectionStage(scene,r);world.camera.position.set(4,5,10);
  world.tianshi.focusTargets=[[-12.8,8.808,-9.6],[-6.1,11.194,-16.5],[6.7,10.412,-15.3],[13.6,8.854,-8.3]].map((position,i)=>({position,detailTarget:[position[0],position[1]+.35,position[2]],detailEye:[position[0]+(i<2?-3.8:4.2),position[1]+2.7,position[2]+6.3]}));
  return world;
}
function state(phase,overrides={}){return {phase,phaseElapsed:0,clock:10,castingElapsed:0,charge:0,progress:99,paused:false,rewindProgress:0,vcr:false,node:null,connection:{field:'account',keyNumber:0,keyAt:-Infinity,lastKey:'',lever:0},...overrides};}

const w=makeWorld(),d=new MissionDirector(w),keys=[...'endfield_power'],expected=[];
w.connectionStage.update(10,0,state('login'));
for(const key of keys){expected.push(w.connectionStage.keyPosition(key));d.action({type:'key',value:key,time:10});}
check('Rapid touches preserve all fourteen ordered physical key targets',d.keyQueue.length===keys.length&&JSON.stringify(d.keyQueue)===JSON.stringify(expected),{count:d.keyQueue.length});
const visited=[];let oldHop=null;
for(let n=0;n<300;n++){
  d.beforeActors(state('login',{clock:10+n/60,phaseElapsed:n/60,castingElapsed:n/60,connection:{field:'account',keyNumber:keys.length}}));
  if(d.keyHop&&d.keyHop!==oldHop){visited.push([...d.keyTo]);oldHop=d.keyHop;}
}
check('Rendered hops consume every rapid key once in the same order',visited.length===keys.length&&JSON.stringify(visited)===JSON.stringify(expected)&&d.keyQueue.length===0&&!d.keyHop,{visited:visited.length});
check('After the last hop Dragon remains at the final key',w.actors.projectile.every((v,i)=>Math.abs(v-expected.at(-1)[i])<.0001),w.actors.projectile);
for(let n=0;n<40;n++)d.action({type:'key',value:'e',time:15});
check('Burst input queue has a fixed memory bound',d.keyQueue.length===32,d.keyQueue.length);
d.reset();check('Replay clears all queued and active key animation',d.keyQueue.length===0&&d.keyHop===null&&d.lastKeyNumber===-1&&!w.actors.projectile);

d.action({type:'key',value:'a',time:20});d.beforeActors(state('login',{clock:20,phaseElapsed:1,castingElapsed:1,connection:{keyNumber:1}}));
const paused=state('login',{clock:20.08,phaseElapsed:1.08,castingElapsed:1.08,paused:true,connection:{keyNumber:1}});d.beforeActors(paused);const heldPosition=[...w.actors.projectile],hopStarted=d.keyHop.start;
w.time+=30;for(let n=0;n<60;n++)d.beforeActors(paused);
check('Paused mission clock holds Dragon at the exact same hop pose',d.keyHop.start===hopStarted&&w.actors.projectile.every((v,i)=>v===heldPosition[i]),heldPosition);
d.afterActors(500,1/30);
check('Paused scene systems receive zero simulation delta',w.calls.updates.filter(c=>['destruction','tianshi','microwave','siege','xaihi'].includes(c.name)&&!c.reset).every(c=>c.dt===0),w.calls.updates.filter(c=>!c.reset));
d.stage('lever',state('lever'));check('Lever entry clears any remaining typing animation',d.keyQueue.length===0&&d.keyHop===null);

for(const phase of ['login','captcha','lever']){
  d.beforeActors(state(phase,{clock:100,phaseElapsed:80,castingElapsed:80}));
  check(`Long ${phase} keeps the first lift at 1.2m in front of the store`,w.actors.cast.castingElapsed===.8&&w.actors.cast.distance===0&&w.actors.cast.height===1.2,w.actors.cast);
}
d.beforeActors(state('charge',{phaseElapsed:0,castingElapsed:100,charge:0}));
check('Charge begins at age 1.15 instead of jumping to fully charged flight',w.actors.cast.castingElapsed===1.15&&w.actors.cast.distance===12&&w.actors.cast.height===4,w.actors.cast);
d.beforeActors(state('charge',{phaseElapsed:5,castingElapsed:105,charge:16.7}));
check('Slow ascent age follows charge elapsed time after login',w.actors.cast.castingElapsed===6.15,w.actors.cast);

w.time=100;w.store.destruction.state.progress=99;d.stage('rewind',state('rewind',{vcr:true}));
d.beforeActors(state('rewind',{phaseElapsed:2,rewindProgress:2/7,vcr:true}));const firstReverse=d.visualTime;
d.beforeActors(state('rewind',{phaseElapsed:3,rewindProgress:3/7,vcr:true}));
check('Rewind clock moves backward and updates the saved destruction presentation',w.calls.begin===1&&firstReverse===90&&d.visualTime===85&&w.calls.rewind.at(-1)===3/7,{begin:w.calls.begin,visualTime:d.visualTime,rewind:w.calls.rewind});
check('Rewind preserves logical mission destruction at 99 percent',w.store.destruction.state.progress===99);
for(const phase of ['flashback','heat-demo','heat','flashback-end']){
  d.stage(phase,state(phase,{vcr:true}));d.beforeActors(state(phase,{vcr:true}));
  check(`CCTV ${phase} hides present-day actors`,!w.actors.root.visible&&d.visualTime===null);
}
d.stage('return',state('return',{vcr:true}));d.beforeActors(state('return',{phaseElapsed:0,vcr:true}));
check('Return restores saved scene and reveals main actors',w.calls.restore===1&&w.actors.root.visible&&w.actors.cast.launchOverride===0&&w.store.destruction.state.progress===99,{restore:w.calls.restore,cast:w.actors.cast});
d.beforeActors(state('return',{phaseElapsed:3,vcr:true}));check('Return completes the flight interpolation',w.actors.cast.launchOverride===1,w.actors.cast);

d.beforeActors(state('tour',{phaseElapsed:10.9}));check('Ruin tour keeps the smile reserved for its final shot',w.actors.status.smile===0);
d.beforeActors(state('tour',{phaseElapsed:11}));check('Final five seconds of tour enable the real smile pose',w.actors.status.smile===1);
d.beforeActors(state('complete',{phaseElapsed:0}));check('Completion retains the final smile',w.actors.status.smile===1);
w.walkCamera.enabled=true;d.beforeActors(state('complete'));check('Walking releases the final portrait pose',w.actors.status.smile===0);w.walkCamera.enabled=false;

const projections=[];
for(const [label,aspect]of [['portrait',390/844],['landscape',844/390]]){
  const cw=makeWorld(aspect),cd=new MissionDirector(cw);cd.state=state('login');
  for(let n=0;n<180;n++){cd.updateCamera(1/30,cw.actors.heroPosition);cw.camera.lookAt(cw.controls.target);cw.camera.updateMatrixWorld(true);}
  const points={heroHead:[-1.25,3.32,3.25],boardLeftNear:[-3.59,.55,4.515],boardLeftFar:[-3.59,.55,1.985],boardRightNear:[.29,.55,4.515],boardRightFar:[.29,.55,1.985]};
  const projected=Object.fromEntries(Object.entries(points).map(([key,p])=>{const point=new T.Vector3().fromArray(p).project(cw.camera);return [key,point.toArray()];}));projections.push({label,projected});
  check(`${label} connection camera keeps actual board corners and hero head on-screen`,Object.values(projected).every(p=>Math.abs(p[0])<1&&Math.abs(p[1])<1&&p[2]>-1&&p[2]<1),projected);
  cw.r.dispose();
}
// The camera is a shot sequence, with a real front view and clear city subjects.
const shotSamples=[[1,'charge-lift-face'],[6,'charge-pylon-one'],[11,'charge-city-array'],[16,'charge-caster-face'],[23,'charge-pylon-two'],[28,'charge-battle-wide']];
const cameraShots=[];
for(const [label,aspect]of [['portrait',390/844],['landscape',844/390]]){
  const cw=makeWorld(aspect),cd=new MissionDirector(cw);cw.actors.heroPosition=[-1.25,4.32,15.25];cw.actors.status.cinematic={heading:2.91};
  for(const [elapsed,beat]of shotSamples){
    cd.state=state('charge',{phaseElapsed:elapsed,clock:30+elapsed,charge:elapsed/30*100});
    for(let n=0;n<180;n++){cd.updateCamera(1/30,cw.actors.heroPosition);cw.camera.lookAt(cw.controls.target);cw.camera.updateMatrixWorld(true);}
    const detail={label,elapsed,beat:cd.status.cameraBeat,position:cw.camera.position.toArray(),target:cw.controls.target.toArray(),fov:cw.camera.fov};cameraShots.push(detail);
    check(`${label} charge ${elapsed}s chooses ${beat}`,chargeCameraBeat(elapsed)===beat&&cd.status.cameraBeat===beat,detail);
    if(beat==='charge-pylon-one'||beat==='charge-pylon-two'){
      const point=cw.tianshi.focusTargets[beat==='charge-pylon-one'?0:3].detailTarget,p=new T.Vector3(...point).project(cw.camera);
      check(`${label} ${beat} shows its actual green core`,Math.abs(p.x)<.9&&Math.abs(p.y)<.6&&p.z>-1&&p.z<1,{projected:p.toArray(),...detail});
      check(`${label} ${beat} camera stays above and outside the shop`,Math.abs(cw.camera.position.x)>10&&cw.camera.position.y>9,detail);
    }
    if(beat==='charge-lift-face'||beat==='charge-caster-face'){
      const face=new T.Vector3(-1.25,5.98,15.25),projected=face.clone().project(cw.camera),normal=new T.Vector3(Math.sin(2.91),0,Math.cos(2.91)),toward=cw.camera.position.clone().sub(face).setY(0).normalize();
      check(`${label} ${beat} looks at the front of her actual face`,normal.dot(toward)>.8&&Math.abs(projected.x)<.5&&Math.abs(projected.y)<.6,{facing:normal.dot(toward),projected:projected.toArray()});
    }
    if(beat==='charge-city-array'){
      const points=cw.tianshi.focusTargets.map(p=>new T.Vector3(...p.position).project(cw.camera).toArray());
      check(`${label} array shot includes all four connected pylon cores`,points.every(p=>Math.abs(p[0])<.98&&Math.abs(p[1])<.95&&p[2]>-1&&p[2]<1),points);
    }
  }
  cw.r.dispose();
}
const rw=makeWorld(),rd=new MissionDirector(rw);rd.state=state('combat',{clock:40,phaseElapsed:3});
const originalState=JSON.stringify(rd.state),originalHero=[...rw.actors.heroPosition];rw.manualUntil=200;
rd.updateCamera(.016,rw.actors.heroPosition);check('Manual orbit stops automatic shot control',rd.status.cameraBeat==='manual'&&!rd.cameraOwned&&rd.cameraRoll===0);
const resumed=rd.resumeCamera();check('One-button resume returns camera without resetting story or actor',resumed&&rw.manualUntil===rw.time&&JSON.stringify(rd.state)===originalState&&JSON.stringify(rw.actors.heroPosition)===JSON.stringify(originalHero));
rd.updateCamera(.016,rw.actors.heroPosition);check('Resumed camera follows the current battle beat',rd.status.cameraBeat==='battle-wide-0'&&rd.cameraOwned);
rd.lastShotAt=40;rd.recoilAmplitude=1.8;rd.shotNumber=1;rw.siege.state={shock:1.1};rd.state=state('combat',{clock:40.1,phaseElapsed:3.1});rd.reducedMotion=false;
rd.updateCamera(.016,rw.actors.heroPosition);
check('Shot and impact envelope drive visible position shake and roll',rd.shakeEnvelope>1&&Math.abs(rd.cameraRoll)>.001&&rw.camera.position.distanceTo(rd.baseCameraPosition)>.04,{roll:rd.cameraRoll,envelope:rd.shakeEnvelope,offset:rw.camera.position.distanceTo(rd.baseCameraPosition)});
const frozenCamera=rw.camera.position.clone();rd.state.paused=true;rd.updateCamera(.5,rw.actors.heroPosition);
check('Paused shot clock keeps the same shaken camera pose',rw.camera.position.distanceTo(frozenCamera)<1e-10);
rd.reducedMotion=true;rd.state.paused=false;rd.updateCamera(.016,rw.actors.heroPosition);
check('Reduced motion removes shake and roll and limits the lens pulse',rd.cameraRoll===0&&rd.shakeEnvelope<=.22&&rw.camera.position.distanceTo(rd.baseCameraPosition)<1e-10&&rw.camera.fov-rd.baseFov<.25,{roll:rd.cameraRoll,envelope:rd.shakeEnvelope,lensPulse:rw.camera.fov-rd.baseFov});
rd.state=state('ready');check('Resume at entry enables the opening cast shot',rd.resumeCamera()===true);
rd.state=state('energy',{clock:60});rw.camera.position.set(2,7,20);rw.controls.target.set(0,3,1);rw.time=300;rd.stage('rewind',state('rewind',{vcr:true}));
rd.beforeActors(state('rewind',{phaseElapsed:.2,clock:60.2,rewindProgress:0,rewindStage:'freeze',vcr:true}));rd.updateCamera(.016,rw.actors.heroPosition);
check('VCR first approaches the physical CCTV while preserving visual clock',rd.cameraBeat==='rewind-cctv-source'&&rd.visualTime===300);
rd.beforeActors(state('rewind',{phaseElapsed:3.4,clock:63.4,rewindProgress:.5,rewindStage:'reverse',vcr:true}));rd.updateCamera(.016,rw.actors.heroPosition);
check('VCR reverse follows the shared eased progress',rd.visualTime===282.5&&rd.cameraBeat==='rewind-street');
rd.beforeActors(state('rewind',{phaseElapsed:6.7,clock:66.7,rewindProgress:1,rewindStage:'settle',vcr:true}));rd.updateCamera(.016,rw.actors.heroPosition);
check('VCR ends on the doorway before switching to the past',rd.cameraBeat==='rewind-doorway'&&Math.abs(rd.cameraPosition.z-11.6)<1e-9&&rd.cameraTarget.z===3.25);
rw.r.dispose();w.r.dispose();
fs.writeFileSync('artifacts/v10-director-check.json',JSON.stringify({kind:'actual-director-with-mock-world-no-gpu',checks,projections,cameraShots},null,2)+'\n');
console.log(`V10 director: ${checks.length} checks passed.`);
