import * as T from 'three';

const flying=new Set(['ascent','director-reminder','shoe-view','pylon-link','charge','fire-ready','combat','energy','last','aim-final','finisher','landing']);
const cctvPhases=new Set(['flashback','hack','credentials','heat-demo','heat','flashback-end']);
const lockedPhases=new Set(['rewind','flashback','hack','credentials','heat-demo','heat','flashback-end','return','finisher','landing','tour']);
const cinematicPhases=new Set(['ascent','director-reminder','shoe-view','pylon-link','ready','intro','purchase','walk-out','photo-pose','photo-talk','photo-flight','photo','photo-return','photo-check','photo-review','terminal-deploy','verify-talk','verified-talk','cargo','observation','comm-request','briefing','login','captcha','lever','charge','fire-ready','combat','energy','rewind','flashback','hack','credentials','heat-demo','heat','flashback-end','return','last','aim-final','finisher','landing','tour','complete']);
const smooth=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
const lerp=(a,b,p,out)=>{for(let i=0;i<3;i++)out[i]=a[i]+(b[i]-a[i])*p;return out;};
function arc(a,b,p,height,out){lerp(a,b,p,out);out[1]+=Math.sin(Math.PI*p)*height;return out;}
function faceFrame(feet,heading,distance=5.6,side=1.1,height=2.12,look=1.46){
  const sx=Math.sin(heading),sz=Math.cos(heading);
  return {position:[feet[0]+sx*distance+sz*side,feet[1]+height,Math.max(2.35,feet[2]+sz*distance-sx*side)],target:[feet[0],feet[1]+look,feet[2]]};
}
export function chargeCameraBeat(elapsed){
  return elapsed<2.5?'charge-lift-wide':elapsed<4?'charge-dragon-catchup':elapsed<9?'charge-pylon-one':elapsed<14?'charge-city-array':elapsed<21?'charge-orbit':elapsed<25?'charge-pylon-two':'charge-battle-wide';
}

// Coordinates actors, a single camera and pooled effects from the mission clock.
export class MissionDirector{
  constructor(world){
    this.world=world;this.state=null;this.phase='ready';this.finalBegun=false;this.launched=false;this.impacted=false;this.neighborImpacted=false;this.stuckReleased=false;
    this.home=[0,0,0];this.hand=[0,0,0];this.end=[0,0,0];this.projectile=[0,0,0];this.hero=[0,0,0];this.wall=[-8.03,2.8,-1.96];
    this.keyFrom=[-2,.33,3.25];this.keyTo=[-2,.33,3.25];this.keyQueue=[];this.keyHop=null;this.lastKeyNumber=-1;this.signImpactRevision=0;this.rewindStarted=0;this.visualTime=null;this.lastEventNode=null;
    this.lastShotAt=-Infinity;this.shotNumber=0;this.recoil=0;this.recoilAmplitude=1;this.reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraPosition=new T.Vector3();this.cameraTarget=new T.Vector3();this.point=new T.Vector3();
    this.baseCameraPosition=new T.Vector3();this.baseCameraTarget=new T.Vector3();this.rewindCameraPosition=new T.Vector3();this.rewindCameraTarget=new T.Vector3();
    this.cameraOwned=false;this.cameraBeat='street';this.cameraRoll=0;this.shakeEnvelope=0;this.baseFov=world.camera?.fov||50;this.rewindFov=this.baseFov;
    const material=world.r.own(new T.MeshBasicMaterial({color:0xf3cf88,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    this.bag=new T.Group();this.bag.name='dragon-takeaway-bag';world.scene.add(this.bag);
    world.r.box(this.bag,'#e0d7b2',[0,0,0],[.35,.31,.23],{roughness:.75});
    for(const x of [-.1,.1])world.r.box(this.bag,'#c7b98b',[x,.22,0],[.025,.18,.025]);
    world.r.box(this.bag,'#e2c186',[0,.32,0],[.22,.025,.025]);this.bag.visible=false;
    this.panic=new T.Group();world.scene.add(this.panic);for(let i=0;i<8;i++){const a=i*Math.PI/4,line=world.r.mesh(world.r.geometry('BoxGeometry',.018,.22,.018),material,this.panic,[Math.cos(a)*.48,Math.sin(a)*.48,0]);line.rotation.z=-a;}this.panic.visible=false;
    this.marker=world.r.mesh(world.r.geometry('TorusGeometry',.36,.012,6,48),material,world.scene);this.marker.visible=false;
  }
  reset(){
    this.world.actors?.setCinematic(null);this.world.actors?.setDragonProjectile(null);
    this.world.store.destruction.reset();this.world.siege.reset();this.world.garden.reset();this.world.tianshi?.reset();this.world.microwave?.reset();this.world.connectionStage?.reset();this.world.xaihi?.reset();this.world.investigationProps?.reset();
    this.keyQueue.length=0;this.keyHop=null;this.lastKeyNumber=-1;this.signImpactRevision=0;this.visualTime=null;this.lastEventNode=null;this.world.glassPass&&(this.world.glassPass.drawGlass=true);this.world.actors?.setSmile?.(0);
    this.finalBegun=false;this.launched=false;this.impacted=false;this.neighborImpacted=false;this.stuckReleased=false;this.marker.visible=false;this.lastShotAt=-Infinity;this.shotNumber=0;this.recoil=0;this.cameraOwned=false;this.cameraRoll=0;this.shakeEnvelope=0;this.cameraBeat='street';
    for(const mesh of this.world.shopFixtures)mesh.visible=true;
    this.world.weather.invalidateReflection();this.world.store.spill.shadow.needsUpdate=true;
  }
  stage(phase,state){
    this.phase=phase;this.state=state;
    if(phase==='ready')this.world.setCutaway(true);
    if(phase==='photo-return'){this.photoReturnFrom=[...(this.world.actors?.dragonPosition||[0,2.6,11.2])];this.world.setCutaway(false);}
    if(phase==='intro'){
      this.world.manualUntil=this.world.time;this.world.setCutaway(true);
    }
    if(phase==='photo'){this.world.setCutaway(false);this.world.camera.position.set(state.flight?.x||0,3.3,(state.flight?.z||11.2)-.7);this.world.controls.target.set(-.22,1.65,2.75);this.world.camera.fov=50;this.world.camera.updateProjectionMatrix();this.world.controls.update();this.cameraOwned=false;}
    if(phase==='briefing'&&this.world.time>=this.world.manualUntil)this.world.setView('investigate');
    if(phase==='login'){
      this.world.setWalking(false);this.world.actors?.setMove(0,0,false);
      this.world.currentView=null;this.world.transition=null;
    }
    if(phase==='lever'){this.keyQueue.length=0;this.keyHop=null;}
    if(phase==='rewind'){
      this.rewindStarted=this.world.time;this.rewindCameraPosition.copy(this.world.camera.position);this.rewindCameraTarget.copy(this.world.controls.target);this.rewindFov=this.world.camera.fov;
      this.world.store.destruction.beginRewind();this.world.manualUntil=this.world.time;this.world.siege.reset();this.cameraOwned=false;
    }
    if(cctvPhases.has(phase))this.world.store.destruction.showFlashback();
    if(phase==='return')this.world.store.destruction.restorePresent();
    if(phase==='finisher'){
      this.finalBegun=true;this.launched=false;this.impacted=false;this.neighborImpacted=false;this.stuckReleased=false;
      const actor=this.world.actors,feet=actor?.heroPosition||[-1.25,4.32,15.25];
      this.home.splice(0,3,...(actor?.dragonPosition||[-2,.325,3.25]));
      const grip=actor?.gripPosition||[feet[0]+.2,feet[1]+1.15,feet[2]-.25];this.hand.splice(0,3,...grip);this.hand[1]-=.3;
      const rack=this.world.store.destruction.state.serverPosition;this.end.splice(0,3,...rack);
      const neighbor=this.world.store.destruction.neighbor;
      const hole=neighbor?.position||[.8,1.5,-8];
      this.wall[0]=hole[0];this.wall[1]=hole[1]-.35;this.wall[2]=hole[2]+.27;
      this.world.manualUntil=this.world.time;this.world.transition=null;this.world.currentView=null;
    }
    if((phase==='landing'||phase==='complete')&&this.finalBegun){this.impact();this.hitNeighbor();}
    this.world.controls.enabled=phase!=='photo-flight'&&!lockedPhases.has(phase)&&phase!=='investigate';
    if(cinematicPhases.has(phase))this.world.transition=null;
    if(this.world.autoCamera===false&&phase!=='photo')this.world.manualUntil=Infinity;
    this.world.weather.invalidateReflection();
  }
  resumeCamera(){
    const w=this.world;w.setWalking?.(false);w.actors?.setMove(0,0,false);w.manualUntil=w.time;w.transition=null;w.currentView=null;
    this.cameraOwned=false;this.cameraRoll=0;this.shakeEnvelope=0;
    if(!this.state||!cinematicPhases.has(this.state.phase)){w.setView('street');return false;}
    return true;
  }
  action(event){
    if(event.type==='key'){
      // Keep each touch even when several keys arrive between rendered frames.
      const position=this.world.connectionStage?.keyPosition(event.value);
      if(position&&this.keyQueue.length<32)this.keyQueue.push([...position]);
      this.world.weather.invalidateReflection();
    }
  }
  impact(){
    if(this.impacted)return;this.impacted=true;
    this.world.store.destruction.destroyServer();this.world.investigationProps?.breakServer(this.end);this.world.siege.impact(this.end,1.85);
    this.world.weather.invalidateReflection();
  }
  hitNeighbor(){
    if(this.neighborImpacted)return;this.neighborImpacted=true;
    this.world.store.destruction.neighbor?.impact();this.world.siege.impact(this.wall,1.45);
    this.world.weather.invalidateReflection();
  }
  get status(){return {phase:this.phase,recoil:this.recoil,shotNumber:this.shotNumber,serverImpacted:this.impacted,neighborImpacted:this.neighborImpacted,dragonStuck:this.neighborImpacted&&!this.stuckReleased,stuckPosition:[...this.wall],flightDistance:12,lift:4,cctv:cctvPhases.has(this.phase),visualTime:this.visualTime,smile:this.world.actors?.status?.smile||0,cameraBeat:this.cameraBeat,cameraRoll:this.cameraRoll,shakeEnvelope:this.shakeEnvelope,cameraFov:this.world.camera.fov,reducedMotion:this.reducedMotion,cameraFocus:this.cameraTarget.toArray()};}
  get targets(){
    const d=this.world.store.destruction,s=d.state;
    if(s.progress>=99)return d.targets.filter(v=>v.id==='server');
    const next=s.milestones.find(v=>!v.active);return d.targets.filter(v=>v.id===(next?.id||'structure'));
  }
  target(id){return this.world.store.destruction.targets.find(v=>String(v.id)===String(id))||this.targets[0];}
  attack(event){
    if(event.result==='miss'||event.finisher)return;
    this.lastShotAt=event.time;this.shotNumber=event.number;this.recoilAmplitude=Number(event.recoil)||.65+event.power*.55;
    const feet=this.world.actors?.heroPosition||[-1.25,4.32,15.25],target=this.target(event.target);
    const from=[feet[0]+.15,feet[1]+1.12,feet[2]-.18];
    this.world.siege.fire({from,to:target?.position||[0,4.3,1.5],power:event.power,finisher:false});
    const priorStage=this.world.store.destruction.state.stage;
    this.world.store.destruction.setProgress(event.progress);
    if(this.world.store.destruction.state.stage!==priorStage)this.world.weather.invalidateReflection();
  }
  beforeActors(state){
    this.state=state;const actor=this.world.actors;if(!state||!actor)return;
    const phase=state.phase,e=state.phaseElapsed;actor.setSoot?.(this.neighborImpacted);actor.setDragonHeading?.(['photo-flight','photo-return'].includes(phase)?Math.PI:phase==='intro'?Math.PI:phase==='observation'?-.5:0);if(actor.heroRoot)actor.heroRoot.visible=phase!=='ready'&&!(phase==='intro'&&(Number((state.nodeId||'').split('_').at(-1))||0)<3);this.bag.visible=['intro','purchase','walk-out','photo-pose','photo-talk','photo-return','photo-check','photo-review','cargo'].includes(phase)&&(state.purchaseElapsed??0)>=3;if(this.world.photoPhone)this.world.photoPhone.visible=false;
    const age=state.clock-this.lastShotAt;
    this.recoil=age>=0?Math.exp(-age*5.4)*Math.sin(Math.min(1,age/.11)*Math.PI/2)*this.recoilAmplitude:0;
    if(phase==='complete'&&this.world.walkCamera.enabled)this.stuckReleased=true;
    const cctv=cctvPhases.has(phase);actor.root.visible=this.world.charactersEnabled&&!cctv;
    this.cameraRoll=0;
    this.visualTime=phase==='rewind'?this.rewindStarted-state.rewindProgress*35:null;
    if(phase==='rewind')this.world.store.destruction.updateRewind(state.rewindProgress);
    let cast=flying.has(phase)?{phase,elapsed:e,castingElapsed:state.castingElapsed,charge:state.charge/100,flight:Math.min(1,e/9),recoil:this.recoil,distance:12,height:4}:null;
    if(['login','captcha','verify-talk','lever'].includes(phase))cast=null;
    if(['ascent','director-reminder','shoe-view','pylon-link'].includes(phase)){
      const rise=phase==='ascent'?smooth(e/5)*.5:.5;
      cast.launchOverride=rise;cast.castingElapsed=phase==='ascent'?e*.55:2.75;
    }
    if(phase==='charge'){cast.launchOverride=.5+.5*smooth(e/12);cast.castingElapsed=2.75+e*.92;}
    if(phase==='rewind'||phase==='return'){
      const amount=phase==='rewind'?1-state.rewindProgress:smooth(e/3);
      cast={phase:'charge',elapsed:e,castingElapsed:30*amount,charge:amount,launchOverride:amount,distance:12,height:4};
    }
    actor.setCinematic(cast);actor.setSmile?.((phase==='tour'&&e>=4&&e<8||phase==='complete')&&!this.world.walkCamera.enabled?1:0);
    actor.setCompanionAction?.({kind:phase==='aim-final'?'shock':'normal',amount:1});
    const connection=state.connection;
    if(['login','captcha'].includes(phase)&&connection&&this.world.connectionStage){
      if(this.keyHop&&state.clock-this.keyHop.start>=.22)this.keyHop=null;
      if(!this.keyHop&&this.keyQueue.length){
        this.keyFrom.splice(0,3,...(actor.dragonPosition||[-2,.33,3.25]));
        this.keyTo.splice(0,3,...this.keyQueue.shift());this.keyHop={start:state.clock};
      }
      if(this.keyHop){
        const hop=Math.max(0,Math.min(1,(state.clock-this.keyHop.start)/.22));
        arc(this.keyFrom,this.keyTo,smooth(hop),.42,this.projectile);actor.setDragonProjectile(this.projectile,0);actor.setCompanionAction?.({kind:'key',amount:Math.sin(hop*Math.PI)});return;
      }
      if(phase==='login'){actor.setDragonProjectile(connection.keyNumber>0?this.keyTo:this.world.connectionStage.keyPosition('e'),0);return;}
    }
    if(['captcha','verify-talk','verified-talk'].includes(phase)){
      const point=this.world.connectionStage?.keyPosition('VERIFY')||[-.7,.64,3.3];
      actor.setDragonProjectile(point,0);return;
    }
    if(phase==='lever'){
      const point=this.world.connectionStage?.leverPosition(connection?.lever||0)||[-.2,.72,3.3];
      this.projectile.splice(0,3,...point);this.projectile[1]-=.32;
      actor.setDragonProjectile(this.projectile,-.16-(connection?.lever||0)*.3);actor.setCompanionAction?.({kind:'lever',amount:connection?.lever||0});return;
    }
    if(phase==='photo-flight'){const f=state.flight;actor.setDragonProjectile([f.x,1.1+1.5*smooth((f.z-3.25)/2.5),f.z],0);if(this.world.photoPhone){this.world.photoPhone.visible=true;this.world.photoPhone.position.set(f.x+.3,1.5+1.5*smooth((f.z-3.25)/2.5),f.z-.15);this.world.photoPhone.rotation.y=Math.PI;}return;}
    if(phase==='terminal-deploy'){actor.setMove(0,0,false);actor.setDragonProjectile([-2,.65,3.25],0);return;}
    if(phase==='intro'||phase==='ready'||phase==='purchase'){
      if(phase==='ready'||phase==='intro'&&state.purchaseElapsed===null&&e<4){const p=phase==='ready'?0:smooth(e/4);arc([-4,1.4,6.8],[-2,.65,3.25],p,.3,this.projectile);actor.setDragonProjectile(this.projectile,Math.sin(state.clock*.8)*.05);return;}
      const y=1.34+Math.abs(Math.sin(state.clock*2.8))*.12;
      const p=state.purchaseElapsed===null?0:Math.min(1,state.purchaseElapsed/6);
      const path=[[-2,.65,3.25],[-.22,1.2,2.75],[-.22,1.3,1.35],[2.48,y,.92]],part=Math.min(2,Math.floor(p*3)),mix=smooth(p*3-part);
      arc(path[part],path[part+1],mix,.15,this.projectile);actor.setDragonProjectile(this.projectile,Math.sin(state.clock*.8)*.08);
      if(this.world.photoPhone)this.world.photoPhone.visible=false;
      return;
    }
    if(phase==='walk-out'){
      this.world.setCutaway(e<2.8);actor.setMove(0,0,false);
      const path=[[2.48,1.34,.92],[-.22,1.3,1.45],[-.22,1.25,2.75],[-2,1.0,3.25]],segment=Math.min(2,Math.floor(e/1.65)),p=smooth((e-segment*1.65)/1.65);
      arc(path[segment],path[segment+1],p,.2,this.projectile);actor.setDragonProjectile(this.projectile,Math.sin(e*4)*.06);return;
    }
    if(['photo-pose','photo-talk','photo-flight','photo','photo-return','photo-check','photo-review','cargo'].includes(phase)){
      actor.setMove(0,0,false);const p=phase==='photo-pose'?smooth(Math.min(1,e/2)):1;
      const review=['photo-return','photo-check','photo-review','cargo'].includes(phase),back=phase==='photo-return'?smooth(e/2.5):1;
      const from=this.photoReturnFrom||[0,2.6,11.2];const pos=review?[from[0]+(-2-from[0])*back,from[1]+(1.1-from[1])*back+Math.sin(back*Math.PI)*.25,from[2]+(3.25-from[2])*back]:phase==='photo'?[this.world.camera.position.x,this.world.camera.position.y-.25,this.world.camera.position.z+.7]:[-2,1.1,3.25];
      actor.setDragonProjectile(pos,0);
      if(!this.world.photoPhone){const phone=new T.Group();this.world.r.box(phone,'#172f36',[0,0,0],[.24,.43,.045]);this.world.r.box(phone,'#8fbab5',[0,0,.027],[.21,.36,.006],{emissive:0x70a399,emissiveIntensity:.5});this.world.r.mesh(this.world.r.geometry('CylinderGeometry',.035,.035,.018,16),this.world.r.material('#101b24',{metalness:.6,roughness:.2}),phone,[.06,.14,-.03]).rotation.x=Math.PI/2;this.world.scene.add(phone);this.world.photoPhone=phone;}
      const phoneAsked=phase==='photo-talk'&&Number((state.nodeId||'').split('_').at(-1))>=1;
      this.world.photoPhone.visible=phoneAsked||['photo-return','photo-check','photo-review','cargo'].includes(phase);this.world.photoPhone.position.set(pos[0]+.35,pos[1]+.55,pos[2]-.2);this.world.photoPhone.rotation.y=phase==='photo-return'?Math.PI-(Math.PI-2.37)*smooth(Math.max(0,(back-.72)/.28)):review?2.37:Math.PI;if(phase==='photo-return')actor.setDragonHeading?.(this.world.photoPhone.rotation.y);return;
    }
    if(this.world.photoPhone)this.world.photoPhone.visible=false;
    if(['ascent','director-reminder','shoe-view','pylon-link','charge','fire-ready','combat','energy','last','aim-final'].includes(phase)){
      const h=actor.heroPosition,lag=phase==='charge'?smooth(Math.max(0,e-1)/3):1,loading=phase==='aim-final'?smooth(e/1.4):0;
      const floor=actor.position||{x:h[0],y:.32,z:3.25};actor.setDragonProjectile([floor.x+(h[0]-.9-floor.x)*lag+loading*.9+(phase==='combat'?Math.sin(e*.7)*.3:0),floor.y+(h[1]+.35-floor.y)*lag+loading*.95,floor.z+(h[2]-.25-floor.z)*lag],loading*.65);if(phase==='aim-final'&&e>1.4&&actor.gripPosition){const g=actor.gripPosition;actor.setDragonProjectile([g[0],g[1]-.3,g[2]],.65);}actor.setCompanionAction?.({kind:loading?'shock':'normal',amount:1});return;
    }
    if(phase==='finisher'){
      if(e<2)arc(this.home,this.hand,smooth(e/2),.12,this.projectile);
      else if(e<4.9){
        if(!this.launched){this.launched=true;this.lastShotAt=state.clock;this.recoilAmplitude=1.4;this.end.splice(0,3,...this.world.store.destruction.state.serverPosition);this.world.siege.fire({from:this.hand,to:this.end,power:1,finisher:true,duration:2.9});}
        arc(this.hand,this.end,smooth((e-2)/2.9),1.1,this.projectile);
      }else if(e<6.2){
        this.impact();arc(this.end,this.wall,smooth((e-4.9)/1.3),.6,this.projectile);
      }else{
        this.hitNeighbor();this.stuckPosition(state.clock);
      }
      actor.setDragonProjectile(this.projectile,e>=2&&e<6.2?(e-2)*9.5:Math.sin(state.clock*39)*.045);
    }else if(['landing','tour','complete'].includes(phase)&&this.neighborImpacted&&!this.stuckReleased){
      this.stuckPosition(state.clock);actor.setDragonProjectile(this.projectile,Math.sin(state.clock*39)*.045);
    }else actor.setDragonProjectile(null);
  }
  stuckPosition(clock){
    this.projectile[0]=this.wall[0]+Math.sin(clock*7)*.045;this.projectile[1]=this.wall[1]+Math.abs(Math.sin(clock*7))*.04;this.projectile[2]=this.wall[2]+Math.sin(clock*29)*.016;
  }
  afterActors(t,delta){
    const s=this.state,active=s&&s.phase!=='ready',clock=active?s.clock:t;
    this.world.store.destruction.update(clock,s?.paused?0:delta);
    for(const mesh of this.world.shopFixtures)mesh.visible=s?.vcr||this.world.store.destruction.state.progress<44;
    this.world.glassPass.drawGlass=!cctvPhases.has(s?.phase)&&!this.world.cutawayActive;
    const sign=this.world.store.destruction.signFlight?.state;
    if(sign&&sign.impactRevision>this.signImpactRevision){this.signImpactRevision=sign.impactRevision;this.world.siege.impact(sign.position,.95);this.world.weather.invalidateReflection();}
    const fx=this.world.siege.state||{};
    this.world.garden.update(clock,s?.paused?0:delta,{protected:!!s&&flying.has(s.phase),fxShock:fx.shock||0,impactRevision:fx.impactRevision||0,recoil:this.recoil});
    const feet=this.world.actors?.heroPosition||[-1.25,.32,2.48],dragon=this.world.actors?.dragonPosition||[-2,.325,2.6];
    this.panic.visible=['aim-final','finisher'].includes(s?.phase);this.panic.position.set(dragon[0],dragon[1]+.4,dragon[2]);this.panic.quaternion.copy(this.world.camera.quaternion);this.panic.scale.setScalar(1+Math.sin(clock*30)*.1);
    this.bag.position.set(dragon[0]+.25,dragon[1]-.05,dragon[2]);this.bag.rotation.z=Math.sin(clock*3)*.08;
    const personal=s?.phase==='last'&&Number((s.nodeId||'').split('_').at(-1))>=4||s?.phase==='aim-final';
    const propState={...(s||{phase:'ready'}),hero:feet,dragon,fxShock:fx.shock||0,impactRevision:fx.impactRevision||0};
    if(s?.phase==='pylon-link'){propState.phase='lever';propState.connection={lever:Math.min(1,s.phaseElapsed/4)};}
    if(s?.phase==='rewind'){propState.charge=(1-s.rewindProgress)*100;propState.progress=0;}
    this.world.tianshi.update(clock,s?.paused?0:delta,propState);this.world.microwave.update(clock,s?.paused?0:delta,propState);this.world.connectionStage.update(clock,s?.paused?0:delta,propState);
    this.world.investigationProps?.update(clock,s?.paused?0:delta,propState);
    this.world.xaihi?.update(clock,s?.paused?0:delta,propState);
    if(this.world.xaihi&&!this.world.charactersEnabled)this.world.xaihi.root.visible=false;
    const target=this.target(s?.target)?.position||[0,4.3,1.6];
    this.world.siege.update(clock,s?.paused?0:delta,{phase:s?.vcr?'vcr':s?.phase||'ready',elapsed:s?.phaseElapsed||0,charge:personal?Math.min(1,(s?.phaseElapsed||0)/3):['energy','return'].includes(s?.phase)?.08:(s?.charge||0)/100,hero:feet,dragon,target,progress:s?.progress||0,recoil:this.recoil});
    this.marker.visible=!!s&&['combat','aim-final','photo-flight'].includes(s.phase);
    if(this.marker.visible){this.marker.position.fromArray(s.phase==='photo-flight'?[0,2.6,10.5]:target);this.marker.quaternion.copy(this.world.camera.quaternion);this.marker.scale.setScalar(.9+Math.sin(clock*3)*.05);}
    if(s)this.updateCamera(delta,feet);
  }
  updateCamera(delta,feet){
    const w=this.world,s=this.state;
    this.cameraRoll=0;this.shakeEnvelope=0;
    if(s?.phase==='photo'){this.cameraOwned=false;return;}
    if(!s||!cinematicPhases.has(s.phase)||w.walkCamera.enabled||w.time<w.manualUntil||w.autoCamera===false){this.cameraOwned=false;this.cameraBeat=w.time<w.manualUntil?'manual':'street';return;}
    if(!this.cameraOwned){this.baseCameraPosition.copy(w.camera.position);this.baseCameraTarget.copy(w.controls.target);this.baseFov=w.camera.fov;this.cameraOwned=true;}
    const portrait=w.camera.aspect<.85,e=s.phaseElapsed,heading=w.actors?.status?.cinematic?.heading??2.91;
    let position,target,fov=portrait?48:42,beat=s.phase;
    const sign=w.store.destruction.signFlight?.state;
    if(['ready','intro','purchase'].includes(s.phase)){
      const node=Number((s.nodeId||'').split('_').at(-1))||0,purchase=s.purchaseElapsed;
      if(s.phase==='ready'||s.phase==='intro'&&e<4){position=[-4.5,3.8,11.3];target=[-1.7,1.6,3.25];fov=portrait?59:51;beat='street-dragon-arrival';}
      else if(purchase!==null){
        if(purchase<1.5){position=[-.5,2.1,6.6];target=[-1.8,1.2,3.25];fov=portrait?46:40;beat='dragon-enters-store';}
        else if(purchase<2.5){position=[-1.1,1.9,1.45];target=[-2.5,1.35,-1.4];fov=portrait?54:46;beat='store-shelf-insert';}
        else{position=[.6,2,2.4];target=[2.48,1.32,.92];fov=portrait?48:42;beat='dragon-at-counter';}
      }else if(s.speaker==='zhuang'){position=[-.8,2.3,6.8];target=[-1.25,1.6,2.48];fov=portrait?43:36;beat='zhuang-reveal';}
      else{position=[-3.45,1.9,5.1];target=[-2,1.1,3.25];fov=portrait?42:36;beat='dragon-opening-close';}
    }else if(s.phase==='ascent'){position=[4,10,26];target=[feet[0],feet[1]+1,feet[2]];fov=portrait?62:53;beat='authorized-wide-ascent';
    }else if(s.phase==='director-reminder'){const d=w.actors?.dragonPosition||[-2,2,4];position=[d[0]+2.1,d[1]+1.1,d[2]+4.4];target=[d[0],d[1]+.35,d[2]];fov=portrait?45:38;beat='dragon-calls-director';
    }else if(s.phase==='shoe-view'){const a=(s.shoeRounds*8+Math.min(8,s.shoeOrbitElapsed))*Math.PI/4;position=[feet[0]+Math.sin(a)*1.45,feet[1]+.16,feet[2]+Math.cos(a)*1.45];target=[feet[0],feet[1]+.15,feet[2]];fov=portrait?35:38;beat='shoe-orbit-wait';
    }else if(s.phase==='pylon-link'){const p=w.tianshi.focusTargets?.[0]?.position||[-12.8,8.8,-9.6];position=[p[0]-4,p[1]-2+e,p[2]+7];target=p;fov=38+e*3;beat='pylon-before-lift';
    }else if(s.phase==='photo-flight'){const f=s.flight;position=[f.x+4,5.2,f.z+5];target=[f.x,2.6,f.z];fov=60;beat='dragon-flight-control';
    }else if(s.phase==='photo'){
      position=[0,3.3,10.5];target=[-.22,1.65,2.75];fov=50;beat='photo-framing';
    }else if(s.phase==='walk-out'){
      const dragon=w.actors?.dragonPosition||[-2,1.1,3.25];
      if(e<1.65){position=[1.1,2.1,2.7];target=[dragon[0],dragon[1]+.1,dragon[2]];fov=portrait?46:38;beat='counter-purchase-exit';}
      else if(e<3.3){position=[-2.4,1.8,4.7];target=[dragon[0],dragon[1]+.1,dragon[2]];fov=portrait?50:42;beat='doorway-dragon-bag';}
      else{position=[.9,2.5,9.1];target=[dragon[0],dragon[1]+.1,dragon[2]];fov=portrait?46:38;beat='dragon-returns-with-dinner';}
    }else if(s.phase==='photo-pose'||s.phase==='photo-talk'){
      const close=s.speaker==='zhuang'||s.speaker==='manager';
      position=close?[-.8,2.3,6.8]:[1.1,2.5,9.4];target=close?[-1.25,1.6,2.48]:[-1.5,1.1,2.5];fov=portrait?43:36;beat=close?'intro-face':'intro-dragon';
    }else if(['photo-return','photo-check','photo-review'].includes(s.phase)){
      position=[-3.8,2.6,6.7];target=[-1.6,1.5,3.25];fov=46;beat='photo-together';
    }else if(s.phase==='cargo'){
      position=[1.1,2.5,8.4];target=[-.22,1.3,2.75];fov=portrait?42:35;beat='cargo-manifest';
    }else if(s.phase==='observation'&&s.node?.event==='phone-away'){
      position=[-3.3,1.9,5.7];target=[-2,1.2,3.25];fov=38;beat='dragon-sigh';
    }else if(s.phase==='observation'||s.phase==='comm-request'){
      position=[3.5,5.8,8.4];target=[0,4.53,1.3];fov=portrait?37:32;beat='server-window';
    }else if(s.phase==='briefing'){
      const index=Number((s.nodeId||'').split('_').at(-1))||0;
      if([0,1,2,4,8].includes(index)){
        const detail=index===2?[-1.15,4.15,.65]:index===4?[1.1,4.22,.65]:[0,4.4,1];
        position=[detail[0]+(index%2?.7:1.3),detail[1]+.3,6.4];target=detail;fov=portrait?36:31;
        beat=index===2?'server-fanbooks':index===4?'server-copier':'server-led-detail';
      }
      else{position=portrait?[7.7,6.5,18.2]:[8.8,6.3,16];target=[.3,3,1];fov=37;beat='briefing-street';}
    }else if(s.phase==='terminal-deploy'){position=[-3.6,2.7,7.1];target=[-1.65,.55,5.45];fov=50;beat='terminal-unfold';
    }else if(['terminal-deploy','login','captcha','lever','verify-talk','verified-talk'].includes(s.phase)){
      position=portrait?[.2,5.9,11.5]:[2.5,4.5,9.5];target=portrait?[-1.4,.7,5.2]:[-1.4,.7,5.2];fov=portrait?74:56;beat='dragon-terminal';
    }else if(s.phase==='rewind'){
      const p=s.rewindProgress;
      if(e<1.6){position=[2.7,2,-.2];target=w.investigationProps?.camera.position.toArray()||[3.87,2.53,-1.65];fov=portrait?34:29;beat='rewind-cctv-source';}
      else if(p<.26){const q=smooth(p/.26);position=[this.rewindCameraPosition.x+(9-this.rewindCameraPosition.x)*q,this.rewindCameraPosition.y+(10-this.rewindCameraPosition.y)*q,this.rewindCameraPosition.z+(32-this.rewindCameraPosition.z)*q];target=[this.rewindCameraTarget.x+(-.8-this.rewindCameraTarget.x)*q,this.rewindCameraTarget.y+(2.7-this.rewindCameraTarget.y)*q,this.rewindCameraTarget.z+(1-this.rewindCameraTarget.z)*q];fov=portrait?57:48;beat='rewind-pullback';}
      else{const q=smooth((p-.26)/.74);position=[9-3.1*q,10-6.7*q,32-20.4*q];target=[-.8-.45*q,2.7-1.35*q,1+2.25*q];fov=portrait?52:44;beat=p>.995?'rewind-doorway':'rewind-street';}
    }else if(cctvPhases.has(s.phase)){
      const close=['heat-demo','heat'].includes(s.phase)||['microwave-closeup','warm-setting','charred-microwave','heated-meal'].includes(s.node?.event);
      // Keep CCTV inside the frontage. These eyes retain the verified clear
      // sightlines to Xaihi and to the inward-facing microwave door.
      position=close?[3.6,2.15,-.35]:[3.9,2.5,-.6];target=close?[portrait?3.45:2.4,1.35,1.35]:[portrait?1.95:.9,1.35,.85];fov=portrait?(close?75:58):(close?62:48);beat=close?'cctv-microwave':'cctv-xaihi';
      if(s.phase==='flashback'&&s.nodeId==='flashback_6'){position=[2.85,2.1,-.25];target=[2.05,1.25,.65];fov=portrait?49:40;beat='xaihi-phone-detail';}
      if(s.phase==='heat'&&s.heat?.status==='burnt'){position=[3.5,2.25,-.8];target=[3.45,1.6,1.25];fov=portrait?78:65;beat='cctv-food-burst';}
    }else if(s.phase==='return'){
      const p=smooth(e/3);position=[3.6+5.4*p,2.15+6.85*p,-.35+32.35*p];target=[3.45-4.25*p,1.35+1.05*p,1.35-.45*p];fov=portrait?56:47;beat='return-present';
    }else if(s.phase==='combat'&&sign?.active){
      const point=sign.position,fall=sign.elapsed/sign.duration;
      position=[point[0]+(fall<.62?3.9:2.6),Math.max(1.35,point[1]+1.5),point[2]+6.2];target=[point[0],Math.max(.42,point[1]),point[2]];fov=portrait?44:38;beat='falling-sign';
    }else if(s.phase==='tour'){
      if(e<4){position=[3.5,4.8,7.5];target=this.end;fov=portrait?48:40;beat='tour-server-hole';}
      else if(e<8){position=[feet[0]+.35,feet[1]+1.87,feet[2]+3.15];target=[feet[0],feet[1]+1.66,feet[2]];fov=32;beat='tour-smile';}
      else if(e<10){const a=.4+(e-8)*.25;position=[Math.cos(a)*12,3,Math.sin(a)*13+2];target=[.4,.9,.65];fov=51;beat='tour-ruins';}
      else if(e<12){position=[3,2.4,8];target=sign?.position||[0,.4,2.5];fov=43;beat='tour-ground-sign';}
      else if(e<14){position=[10,4,6];target=[7.65,2,-.65];fov=44;beat='tour-pear';}
      else{const wide=e>=18&&e<22;position=[this.wall[0]-(wide?1.2:.55),this.wall[1]+.65,this.wall[2]+(wide?3.1:2.5)];target=[this.wall[0],this.wall[1]+.45,this.wall[2]];fov=wide?65:44;beat='tour-dragon';}
    }else if(s.phase==='complete'){
      position=[this.wall[0]-.55,this.wall[1]+.65,this.wall[2]+2.5];target=[this.wall[0],this.wall[1]+.45,this.wall[2]];fov=44;beat='final-dragon';
    }else if(s.phase==='fire-ready'){position=[3.8,9.2,28];target=[feet[0],feet[1]+1.1,feet[2]];fov=portrait?56:48;beat='fire-system-ready';
    }else if(s.phase==='charge'){
      beat=chargeCameraBeat(e);
      if(e<2.5){position=[4,10,26];target=[feet[0],feet[1]+1,feet[2]];fov=60;beat='charge-lift-wide';}
      else if(e<4){const d=w.actors.dragonPosition;position=[d[0]+2,d[1]+1,d[2]+4];target=d;fov=48;beat='charge-dragon-catchup';}
      else if(e>=14&&e<21){const a=(e-14)*.2;position=[feet[0]+Math.sin(a)*5,feet[1]+2.2,feet[2]+Math.cos(a)*5];target=[feet[0],feet[1]+1.4,feet[2]];fov=45;beat='charge-orbit';}
      else
      if(beat==='charge-lift-face'||beat==='charge-caster-face'){
        const front=faceFrame(feet,heading,beat==='charge-lift-face'?5.7:5.2,beat==='charge-lift-face'?1.25:.85,2.08,1.48);
        position=front.position;target=front.target;fov=portrait?(beat==='charge-lift-face'?42:38):35;
      }else if(beat==='charge-pylon-one'||beat==='charge-pylon-two'){
        const index=beat==='charge-pylon-one'?0:3,pylon=w.tianshi.focusTargets?.[index],point=pylon?.detailTarget||pylon?.position||(index===0?[-12.8,8.81,-9.6]:[13.6,8.85,-8.3]),side=index===0?-1:1;
        position=pylon?.detailEye||[point[0]+side*4,point[1]+2.8,point[2]+6.8];const rise=smooth((e-(beat==='charge-pylon-one'?4:21))/3);position=[position[0],position[1]-3*(1-rise),position[2]];target=[point[0],point[1]-2+2.45*rise,point[2]];fov=(portrait?38:32)+rise*5;
      }else if(beat==='charge-city-array'){
        position=portrait?[1.8,17.2,35.5]:[11,16,31];target=w.tianshi.arrayTarget||[0,7,-1];fov=portrait?74:53;
      }else{
        const p=smooth((e-25)/5);position=portrait?[2.2-2.2*p,13-2*p,34]:[8-5*p,12-p,32];target=[-.7,4.7-1.1*p,5+2*p];fov=portrait?61:51;
      }
    }else if(s.node?.event==='server-survives'){
      const server=w.store.destruction.state.serverPosition;position=[server[0]+2,server[1]+1.4,server[2]+5];target=server;fov=38;beat='surviving-server';
    }else if(s.phase==='energy'&&s.speaker==='zhuang'||s.phase==='last'&&/^last_[345]$/.test(s.nodeId||'')){
      const front=faceFrame(feet,heading,5.2,1.05,2.05,1.48);position=front.position;target=front.target;fov=portrait?39:34;beat='caster-dialogue-face';position=[feet[0]+2.4,feet[1]+2,feet[2]+4];target=[feet[0],feet[1]+1.4,feet[2]];
    }else if(s.phase==='last'&&/^last_[678]$/.test(s.nodeId||'')||s.phase==='aim-final'&&e<3){
      const dragon=w.actors?.dragonPosition||[-2,.54,3.25];position=[dragon[0]+1.65,dragon[1]+1.48,dragon[2]+4.5];target=[dragon[0],dragon[1]+.42,dragon[2]];fov=portrait?42:35;beat='dragon-ammo-reaction';
    }else if(s.phase==='aim-final'&&e<6){
      const front=faceFrame(feet,heading,5.1,1.05,2.0,1.48);position=front.position;target=front.target;fov=portrait?39:34;beat='last-round-face';
    }else if(['combat','energy','last','aim-final'].includes(s.phase)){
      const view=this.shotNumber%3;
      position=portrait?(view===0?[-2,9.2,34]:view===1?[3.8,10.2,34]:[-3.8,11.3,34]):(view===0?[8,9,31]:view===1?[-8,9.5,31]:[3,11,32]);
      target=[-.7,3.6,7];fov=portrait?61:51;beat=s.phase==='combat'?'battle-wide-'+view:'battle-report';
    }else if(s.phase==='finisher'){
      if(e<2){const front=faceFrame(feet,heading,6,1.8,2.25,1.1);position=front.position;target=front.target;fov=portrait?47:42;beat='finisher-load-face';}
      else if(e<4.35){position=portrait?[0,9.6,33]:[5,10,31];target=[-1,3.2,7.5];fov=portrait?63:54;beat='finisher-flight';}
      else if(e<6.2){
        // Arrive before the 4.9s impact. From this side the caster and halo
        // stay outside the frustum, and the server blast remains the subject.
        position=[5.8,7.5,8.5];target=this.end;fov=portrait?68:60;beat=e<4.9?'finisher-impact-approach':'finisher-city-impact';
      }else{position=[5.8,4.5,8.5];target=this.end;fov=48;beat='finisher-server-crater';}
    }else if(s.phase==='landing'){
      position=[this.wall[0]-.55,this.wall[1]+.65,this.wall[2]+1.8];target=[this.wall[0],this.wall[1]+.45,this.wall[2]+.1];fov=portrait?39:34;beat='landing-server';position=[3.5,4.8,7.5];target=this.end;
    }else{
      position=portrait?[9,9,32]:[11,8,24];target=[-.8,2.4,.9];fov=portrait?56:47;beat='street-after-hours';
    }
    if(!this.reducedMotion&&['briefing','credentials','flashback'].includes(s.phase)&&!s.node?.event){const index=Number((s.nodeId||'').split('_').at(-1))||0;const side=Math.floor(index/3)%3;if(side===1){position[0]+=.8;position[2]+=.7;}if(side===2){position[0]-=.6;fov+=5;}}
    if(!this.reducedMotion&&['intro','briefing','cargo','observation','credentials'].includes(s.phase)){position[0]+=Math.sin(e*.23)*.2;position[1]+=Math.sin(e*.17)*.05;}
    this.cameraBeat=beat;this.cameraPosition.fromArray(position);this.cameraTarget.fromArray(target);
    const blend=1-Math.exp(-Math.min(.1,Math.max(0,s.paused?0:delta))*(s.phase==='finisher'?3.9:3.1));
    this.baseCameraPosition.lerp(this.cameraPosition,blend);this.baseCameraTarget.lerp(this.cameraTarget,blend);this.baseFov=T.MathUtils.lerp(this.baseFov,fov,blend);
    w.camera.position.copy(this.baseCameraPosition);w.controls.target.copy(this.baseCameraTarget);
    const battle=['combat','energy','finisher','landing'].includes(s.phase),age=s.clock-this.lastShotAt,kick=age>=0?Math.exp(-age*5.2)*this.recoilAmplitude:0,shock=Number(w.siege.state?.shock)||0;
    const envelope=battle?Math.min(1.35,Math.max(kick*.78,shock)):0;this.shakeEnvelope=this.reducedMotion?Math.min(.22,envelope):envelope;
    if(!this.reducedMotion&&envelope>.001){
      const strength=(s.phase==='finisher'?.44:.3)*envelope;
      w.camera.position.x+=Math.sin(s.clock*49+this.shotNumber)*strength;w.camera.position.y+=Math.sin(s.clock*37+1.1)*strength*.58;w.camera.position.z+=Math.sin(s.clock*57+.4)*strength*.3;
      w.controls.target.x-=Math.sin(s.clock*49+this.shotNumber)*strength*.16;w.controls.target.y+=Math.sin(s.clock*43)*strength*.1;
      this.cameraRoll=Math.sin(s.clock*31+.3)*envelope*(s.phase==='finisher'?.028:.019);
    }
    const next=this.baseFov+this.shakeEnvelope*(this.reducedMotion?1.1:4.2);
    if(Math.abs(next-w.camera.fov)>.001){w.camera.fov=next;w.camera.updateProjectionMatrix();}
    w.currentView=null;
  }
  pick(ray){
    if(!this.state||!['combat','aim-final'].includes(this.state.phase))return null;
    let best=null,distance=Infinity;
    for(const target of this.targets){this.point.fromArray(target.position);if(ray.direction.dot(this.point.clone().sub(ray.origin))<0)continue;const d=ray.distanceSqToPoint(this.point);if(d<distance&&d<7){best=target.id;distance=d;}}
    return best;
  }
}
