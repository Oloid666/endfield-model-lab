import * as T from 'three';
import {streetStageFrame,streetWide} from './street-stage-camera.js';
import {STREET_SONGS,songFrame} from './street-songs.js';
export function createStreetPerformance({world,mission,mount,playEffect=()=>{},hum=()=>{}}){
 const r=world.r,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dock=document.createElement('section');dock.className='street-performance';dock.hidden=true;dock.setAttribute('aria-label','龍泡泡的街角演出');
 const text=document.createElement('p'),skip=document.createElement('button');skip.textContent='略過演出';skip.type='button';dock.append(text,skip);mount.append(dock);
 const cover=document.createElement('div');cover.className='street-stage-cover';cover.hidden=true;mount.append(cover);
 const stars=new T.Group();world.scene.add(stars);stars.visible=false;
 const mat=r.own(new T.MeshBasicMaterial({color:0xffe4a0,transparent:true,depthWrite:false,toneMapped:false}));
 const shape=new T.Shape();for(let i=0;i<8;i++){const a=i*Math.PI/4,len=i%2?.025:.12;const x=Math.cos(a)*len,y=Math.sin(a)*len;if(i)shape.lineTo(x,y);else shape.moveTo(x,y);}shape.closePath();
 const geo=r.own(new T.ShapeGeometry(shape));for(let i=0;i<9;i++){const n=r.mesh(geo,mat,stars);n.userData.index=i;}
 let active=false,age=0,last=0,first=false,kind='restore',indices={collapse:0,restore:0},lines=[],onDone=null,from=null,mode='intact',snapshotReady=false,snapped=false,wideIndex=0,nextWide=0;
 const paused=()=>document.hidden||mission.pauseReasons.some(p=>p!=='street-show');
 function setBuilding(p){const d=world.store.destruction;d.updateRewind(kind==='restore'?p:1-p);if(p===1){if(kind==='restore')d.showFlashback();else{d.restorePresent();d.beginRewind();d.updateRewind(0);}mode=kind==='restore'?'intact':'collapsed';}world.weather.invalidateReflection();}
 function applyCamera(shot){world.transition=null;world.currentView=null;world.camera.position.fromArray(shot.position);world.controls.target.fromArray(shot.target);world.camera.fov=shot.fov;world.camera.updateProjectionMatrix();world.camera.lookAt(world.controls.target);world.cameraSafety?.sync();}
 function handoff(){
  applyCamera(streetWide(wideIndex,world.camera.aspect<.85));
  // Drain OrbitControls damping while its input is disabled; never sweep collision from a stale shot.
  const damping=world.controls.enableDamping;world.controls.enableDamping=false;world.controls.update();world.controls.enableDamping=damping;applyCamera(streetWide(wideIndex,world.camera.aspect<.85));
  world.director.cameraOwned=false;world.director.previousBeat=null;world.director.cameraRoll=0;world.autoCamera=first;world.manualUntil=first?world.time:Infinity;world.controls.enabled=!first;
 }
 function finish(){if(!active)return;world.concert.reset();setBuilding(1);handoff();active=false;cover.hidden=true;mount.classList.remove('street-show-active');dock.hidden=true;stars.visible=false;world.actors.setSceneAction({homecoming:true});world.actors.setCompanionAction({kind:'normal',amount:0});world.actors.setObstacles(mode==='intact'?world.store.floorPlan:{obstacles:[],entrance:world.store.floorPlan.entrance});mission.setPaused(false,'street-show');const done=onDone;onDone=null;done?.();}
 skip.addEventListener('click',()=>{if(!first&&age>=1&&!paused())finish();});
 const api={get active(){return active;},get state(){return {active,age,first,kind,mode,line:text.textContent,indices:{...indices},snapshotReady,wideIndex,phase:streetStageFrame(age,songDuration(),first).phase,buildingProgress:streetStageFrame(age,songDuration(),first).progress};},
 start({initial=false,done=()=>{}}={}){
  if(active)return false;first=initial;wideIndex=initial?0:nextWide++%3;kind=initial||mode==='collapsed'?'restore':'collapse';lines=STREET_SONGS[kind][initial?1:indices[kind]++%4];onDone=done;
  if(!snapshotReady){world.store.destruction.beginRewind();snapshotReady=true;}
  mount.classList.add('street-show-active');if(!initial&&(world.actors.heelCenter[2]<2.7||world.remnant.state.visible&&world.remnant.state.position[2]<2.7)){cover.hidden=false;cover.style.opacity='1';if(world.actors.heelCenter[2]<2.7)world.actors.teleport(-1.25,3.25);world.remnant.placeNear(world.actors.heelCenter);world.actors.setDragonProjectile([world.actors.heelCenter[0]-1.2,1.6,world.actors.heelCenter[2]+.3],0);world.actors.update(world.time,0);}age=0;last=world.time;snapped=false;active=true;from=[...world.actors.dragonPosition];
  world.director.stuckReleased=true;world.director.finalBegun=false;world.setWalking(false);world.setCutaway(false);world.transition=null;world.currentView=null;world.controls.enabled=false;world.siege.reset();mission.setPaused(true,'street-show');dock.hidden=false;skip.hidden=first;world.actors.setSoot(false);return true;
 },
 tick(time,render=true){const dt=Math.max(0,Math.min(.1,time-last));last=time;if(!paused())age+=dt;
  if(!cover.hidden){cover.style.opacity=String(Math.max(0,1-age/.4));if(age>=.4)cover.hidden=true;}
  const stage=streetStageFrame(age,songDuration(),first),actor=world.actors,p=stage.lift,q=p*p*(3-2*p),dest=[wideIndex===2?.8:-2.25,4.3,6.2],pos=from.map((v,i)=>v+(dest[i]-v)*q);actor.setCinematic(null);actor.setDragonProjectile(pos,0);const wide=streetWide(wideIndex,world.camera.aspect<.85),eye=wide.position;actor.setDragonHeading(stage.progress>0?Math.atan2(eye[0]-pos[0],eye[2]-pos[2]):.15);actor.setMove(0,0,false);actor.setSceneAction({homecoming:true,singing:age>=stage.buildAt,mealVisible:true});actor.setCompanionAction({kind:age<stage.buildAt?'snap':'normal',amount:Math.max(0,Math.min(1,(age-(first?1.6:2.2))/.7))});actor.update(age,paused()?0:dt);
  world.portrait.fill.position.set(pos[0]+2,pos[1]+3,pos[2]+5);world.portrait.fill.target.position.set(pos[0],pos[1]+.35,pos[2]);
  const snapAt=first?2.05:2.6;
  if(age>=snapAt&&!snapped){snapped=true;playEffect('snap');}
  stars.visible=age>=snapAt&&age<snapAt+1.25;stars.position.set(pos[0]+.35,pos[1]+.5,pos[2]+.2);mat.opacity=Math.max(0,1-(age-snapAt)/1.25);for(const n of stars.children){const i=n.userData.index,a=i*2.4,t=Math.max(0,age-snapAt);n.position.set(Math.cos(a)*t*(reduced?.1:.5),Math.sin(a)*t*(reduced?.1:.5),0);n.quaternion.copy(world.camera.quaternion);n.scale.setScalar(i? .4:1.4);}
  const frame=songFrame(lines,age-stage.buildAt+2.8),caption=age<snapAt?'龍泡泡：看我的。':age<stage.buildAt?'✦ 啪！':frame.line;
  if(text.textContent!==caption)text.textContent=caption;skip.disabled=age<1||paused();
  if(stage.progress>0)setBuilding(stage.progress);
  const close={position:[pos[0]+.35,pos[1]+.65,pos[2]+(world.camera.aspect<.85?3.2:2.7)],target:[pos[0],pos[1]+.4,pos[2]],fov:42};
  let shot=wide;
  if(!first&&age<stage.buildAt){const q=reduced?(stage.phase==='pullback'?1:0):stage.pull*stage.pull*(3-2*stage.pull);shot={position:close.position.map((v,i)=>v+(wide.position[i]-v)*q),target:close.target.map((v,i)=>v+(wide.target[i]-v)*q),fov:close.fov+(wide.fov-close.fov)*q};}
  applyCamera(shot);
  world.concert.update(pos,age,age>=stage.buildAt,world.camera,'low',reduced);
  if(age>=stage.buildAt&&!paused())hum(age);if(render){world.renderer.info.reset();world.composer.render();world.renderCount++;}if(stage.done&&!paused())finish();
 },prepareIntact(){
  const d=world.store.destruction;d.reset();d.setProgress(99);d.update(world.time+12,12);d.beginRewind();d.showFlashback();snapshotReady=true;mode='intact';world.weather.invalidateReflection();
 },reset(){world.autoCamera=true;world.manualUntil=world.time;world.currentView=null;world.transition=null;world.concert.reset();cover.hidden=true;world.controls.enabled=true;if(active){active=false;mission.setPaused(false,'street-show');}mount.classList.remove('street-show-active');dock.hidden=true;stars.visible=false;indices={collapse:0,restore:0};mode='intact';snapshotReady=false;nextWide=wideIndex=0;onDone=null;},dispose(){cover.remove();dock.remove();stars.removeFromParent();}};
 function songDuration(){return lines.reduce((sum,s)=>sum+Math.max(3,Array.from(s).length/5.5+1),0);}
 world.streetShow=api;return api;
}
