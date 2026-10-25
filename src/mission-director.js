import * as T from 'three';

const flying=new Set(['login','captcha','lever','charge','combat','energy','last','aim-final','finisher','landing']);
const cctvPhases=new Set(['flashback','heat-demo','heat','flashback-end']);
const lockedPhases=new Set(['rewind','flashback','heat-demo','heat','flashback-end','return','finisher','landing','tour']);
const cinematicPhases=new Set(['briefing','login','captcha','lever','charge','combat','energy','rewind','flashback','heat-demo','heat','flashback-end','return','last','aim-final','finisher','landing','tour','complete']);
const smooth=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
const lerp=(a,b,p,out)=>{for(let i=0;i<3;i++)out[i]=a[i]+(b[i]-a[i])*p;return out;};
function arc(a,b,p,height,out){lerp(a,b,p,out);out[1]+=Math.sin(Math.PI*p)*height;return out;}

// Coordinates actors, a single camera and pooled effects from the mission clock.
export class MissionDirector{
  constructor(world){
    this.world=world;this.state=null;this.phase='ready';this.finalBegun=false;this.launched=false;this.impacted=false;this.neighborImpacted=false;this.stuckReleased=false;
    this.home=[0,0,0];this.hand=[0,0,0];this.end=[0,0,0];this.projectile=[0,0,0];this.hero=[0,0,0];this.wall=[-8.03,2.8,-1.96];
    this.keyFrom=[-2,.33,3.25];this.keyTo=[-2,.33,3.25];this.keyQueue=[];this.keyHop=null;this.lastKeyNumber=-1;this.signImpactRevision=0;this.rewindStarted=0;this.visualTime=null;this.lastEventNode=null;
    this.lastShotAt=-Infinity;this.shotNumber=0;this.recoil=0;this.recoilAmplitude=1;this.reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraPosition=new T.Vector3();this.cameraTarget=new T.Vector3();this.point=new T.Vector3();
    const material=world.r.own(new T.MeshBasicMaterial({color:0xf3cf88,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    this.marker=world.r.mesh(world.r.geometry('TorusGeometry',.36,.012,6,48),material,world.scene);this.marker.visible=false;
  }
  reset(){
    this.world.actors?.setCinematic(null);this.world.actors?.setDragonProjectile(null);
    this.world.store.destruction.reset();this.world.siege.reset();this.world.garden.reset();this.world.tianshi?.reset();this.world.microwave?.reset();this.world.connectionStage?.reset();this.world.xaihi?.reset();
    this.keyQueue.length=0;this.keyHop=null;this.lastKeyNumber=-1;this.signImpactRevision=0;this.visualTime=null;this.lastEventNode=null;this.world.glassPass&&(this.world.glassPass.drawGlass=true);this.world.actors?.setSmile?.(0);
    this.finalBegun=false;this.launched=false;this.impacted=false;this.neighborImpacted=false;this.stuckReleased=false;this.marker.visible=false;this.lastShotAt=-Infinity;this.shotNumber=0;this.recoil=0;
    for(const mesh of this.world.shopFixtures)mesh.visible=true;
    this.world.weather.invalidateReflection();this.world.store.spill.shadow.needsUpdate=true;
  }
  stage(phase,state){
    this.phase=phase;this.state=state;
    if(phase==='intro'){
      this.world.manualUntil=this.world.time;this.world.setView('story');
    }
    if(phase==='briefing'&&this.world.time>=this.world.manualUntil)this.world.setView('investigate');
    if(phase==='login'){
      this.world.setWalking(false);this.world.actors?.setMove(0,0,false);
      this.world.actors?.teleport(-1.25,3.25);this.world.currentView=null;this.world.transition=null;
    }
    if(phase==='lever'){this.keyQueue.length=0;this.keyHop=null;}
    if(phase==='rewind'){this.rewindStarted=this.world.time;this.world.store.destruction.beginRewind();this.world.manualUntil=this.world.time;this.world.siege.reset();}
    if(cctvPhases.has(phase))this.world.store.destruction.showFlashback();
    if(phase==='return')this.world.store.destruction.restorePresent();
    if(phase==='finisher'){
      this.finalBegun=true;this.launched=false;this.impacted=false;this.neighborImpacted=false;this.stuckReleased=false;
      const actor=this.world.actors,feet=actor?.heroPosition||[-1.25,4.32,15.25];
      this.home.splice(0,3,...(actor?.dragonPosition||[-2,.325,3.25]));
      this.hand[0]=feet[0]+.2;this.hand[1]=feet[1]+1.15;this.hand[2]=feet[2]-.25;
      const rack=this.world.store.destruction.state.serverPosition;this.end.splice(0,3,...rack);
      const hole=this.world.store.destruction.neighbor?.position||[-8.03,3.15,-2.23];
      this.wall[0]=hole[0];this.wall[1]=hole[1]-.35;this.wall[2]=hole[2]+.27;
      this.world.manualUntil=this.world.time;this.world.transition=null;this.world.currentView=null;
    }
    if((phase==='landing'||phase==='complete')&&this.finalBegun){this.impact();this.hitNeighbor();}
    this.world.controls.enabled=!lockedPhases.has(phase);
    if(cinematicPhases.has(phase))this.world.transition=null;
    this.world.weather.invalidateReflection();
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
    this.world.store.destruction.destroyServer();this.world.siege.impact(this.end,1.85);
    this.world.weather.invalidateReflection();
  }
  hitNeighbor(){
    if(this.neighborImpacted)return;this.neighborImpacted=true;
    this.world.store.destruction.neighbor?.impact();this.world.siege.impact(this.wall,1.45);
    this.world.weather.invalidateReflection();
  }
  get status(){return {phase:this.phase,recoil:this.recoil,shotNumber:this.shotNumber,serverImpacted:this.impacted,neighborImpacted:this.neighborImpacted,dragonStuck:this.neighborImpacted&&!this.stuckReleased,stuckPosition:[...this.wall],flightDistance:12,lift:4,cctv:cctvPhases.has(this.phase),visualTime:this.visualTime,smile:this.world.actors?.status?.smile||0};}
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
    this.world.store.destruction.setProgress(event.progress);
    this.world.store.spill.shadow.needsUpdate=true;this.world.weather.invalidateReflection();
  }
  beforeActors(state){
    this.state=state;const actor=this.world.actors;if(!state||!actor)return;
    const phase=state.phase,e=state.phaseElapsed;
    const age=state.clock-this.lastShotAt;
    this.recoil=age>=0?Math.exp(-age*5.4)*Math.sin(Math.min(1,age/.11)*Math.PI/2)*this.recoilAmplitude:0;
    if(phase==='complete'&&this.world.walkCamera.enabled)this.stuckReleased=true;
    const cctv=cctvPhases.has(phase);actor.root.visible=this.world.charactersEnabled&&!cctv;
    this.visualTime=phase==='rewind'?this.rewindStarted-e*5:null;
    if(phase==='rewind')this.world.store.destruction.updateRewind(state.rewindProgress);
    let cast=flying.has(phase)?{phase,elapsed:e,castingElapsed:state.castingElapsed,charge:state.charge/100,flight:Math.min(1,e/9),recoil:this.recoil,distance:12,height:4}:null;
    if(['login','captcha','lever'].includes(phase))cast={...cast,castingElapsed:Math.min(state.castingElapsed,.8),distance:0,height:1.2};
    if(phase==='charge')cast.castingElapsed=e+1.15;
    if(phase==='rewind'||phase==='return'){
      const amount=phase==='rewind'?1-state.rewindProgress:smooth(e/3);
      cast={phase:'charge',elapsed:e,castingElapsed:30*amount,charge:amount,launchOverride:amount,distance:12,height:4};
    }
    actor.setCinematic(cast);actor.setSmile?.((phase==='tour'&&e>=11||phase==='complete')&&!this.world.walkCamera.enabled?1:0);
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
      if(phase==='login'&&connection.keyNumber>0){actor.setDragonProjectile(this.keyTo,0);return;}
    }
    if(phase==='captcha'){
      const point=this.world.connectionStage?.keyPosition('VERIFY')||[-.7,.64,3.3];
      actor.setDragonProjectile(point,0);return;
    }
    if(phase==='lever'){
      const point=this.world.connectionStage?.leverPosition(connection?.lever||0)||[-.2,.72,3.3];
      this.projectile.splice(0,3,...point);this.projectile[1]-=.32;
      actor.setDragonProjectile(this.projectile,-.16-(connection?.lever||0)*.3);actor.setCompanionAction?.({kind:'lever',amount:connection?.lever||0});return;
    }
    if(phase==='finisher'){
      if(e<2)arc(this.home,this.hand,smooth(e/2),.8,this.projectile);
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
    this.projectile[0]=this.wall[0]+Math.sin(clock*41)*.025;this.projectile[1]=this.wall[1]+Math.sin(clock*33)*.012;this.projectile[2]=this.wall[2]+Math.sin(clock*29)*.016;
  }
  afterActors(t,delta){
    const s=this.state,active=s&&s.phase!=='ready',clock=active?s.clock:t;
    this.world.store.destruction.update(clock,s?.paused?0:delta);
    for(const mesh of this.world.shopFixtures)mesh.visible=s?.vcr||this.world.store.destruction.state.progress<44;
    this.world.glassPass.drawGlass=!cctvPhases.has(s?.phase);
    const sign=this.world.store.destruction.signFlight?.state;
    if(sign&&sign.impactRevision>this.signImpactRevision){this.signImpactRevision=sign.impactRevision;this.world.siege.impact(sign.position,.95);this.world.weather.invalidateReflection();}
    this.world.garden.update(clock,s?.paused?0:delta,{protected:!!s&&flying.has(s.phase)});
    const feet=this.world.actors?.heroPosition||[-1.25,.32,2.48],dragon=this.world.actors?.dragonPosition||[-2,.325,2.6];
    const propState={...(s||{phase:'ready'}),hero:feet,dragon};
    if(s?.phase==='rewind'){propState.charge=(1-s.rewindProgress)*100;propState.progress=0;}
    this.world.tianshi.update(clock,s?.paused?0:delta,propState);this.world.microwave.update(clock,s?.paused?0:delta,propState);this.world.connectionStage.update(clock,s?.paused?0:delta,propState);
    this.world.xaihi?.update(clock,s?.paused?0:delta,propState);
    if(this.world.xaihi&&!this.world.charactersEnabled)this.world.xaihi.root.visible=false;
    const target=this.target(s?.target)?.position||[0,4.3,1.6];
    this.world.siege.update(clock,s?.paused?0:delta,{phase:s?.vcr?'vcr':s?.phase||'ready',elapsed:s?.phaseElapsed||0,charge:(s?.charge||0)/100,hero:feet,dragon,target,progress:s?.progress||0,recoil:this.recoil});
    this.marker.visible=!!s&&['combat','aim-final'].includes(s.phase);
    if(this.marker.visible){this.marker.position.fromArray(target);this.marker.quaternion.copy(this.world.camera.quaternion);this.marker.scale.setScalar(.9+Math.sin(clock*3)*.05);}
    if(active)this.updateCamera(delta,feet);
  }
  updateCamera(delta,feet){
    const w=this.world,s=this.state;if(!cinematicPhases.has(s.phase)||w.walkCamera.enabled||w.time<w.manualUntil)return;
    const portrait=w.camera.aspect<.85,e=s.phaseElapsed;let position,target,fov=portrait?48:42;
    const sign=w.store.destruction.signFlight?.state;
    if(s.phase==='briefing'){
      if(s.node?.event==='server-closeup'||s.nodeId?.startsWith('briefing_')&&Number(s.nodeId.split('_').at(-1))<4){position=[3.5,5.8,8.4];target=[0,4.53,1.3];fov=portrait?37:32;}
      else{position=portrait?[7.7,6.5,18.2]:[8.8,6.3,16];target=[.3,3,1];fov=37;}
    }else if(['login','captcha','lever'].includes(s.phase)){
      position=portrait?[3.4,6.4,11.5]:[4.3,5.5,10];target=portrait?[-1.3,-1,3.35]:[1.8,.8,3.35];fov=portrait?60:43;
    }else if(s.phase==='rewind'){
      const p=s.rewindProgress;position=[2+(10*(1-p)),5+4*(1-p),12+20*(1-p)];target=[-1,1.1+2*(1-p),2.2+5*(1-p)];fov=portrait?55:46;
    }else if(cctvPhases.has(s.phase)){
      const close=['heat-demo','heat'].includes(s.phase)||s.node?.event==='microwave-closeup'||s.node?.event==='warm-setting'||s.node?.event==='charred-microwave';
      // CCTV is inside the front glazing and below the canopy. Exterior eyes
      // would shoot through the sign, posters and lintel before reaching her.
      position=close?[3.6,2.15,-.35]:[3.9,2.5,-.6];target=close?[portrait?3.45:2.4,1.35,1.35]:[portrait?1.95:.9,1.35,.85];fov=portrait?(close?75:58):(close?62:48);
    }else if(s.phase==='return'){
      const p=smooth(e/3);position=[-.2+(9.2*p),4.3+4.7*p,5.2+26.8*p];target=[2.35-3.15*p,1.45+.95*p,.7+.2*p];fov=portrait?56:47;
    }else if(s.phase==='combat'&&sign?.active){
      const point=sign.position,fall=sign.elapsed/sign.duration;
      position=[point[0]+(fall<.62?3.9:2.6),Math.max(1.35,point[1]+1.5),point[2]+6.2];target=[point[0],Math.max(.42,point[1]),point[2]];fov=portrait?44:38;
    }else if(s.phase==='tour'){
      if(e<4){position=[this.wall[0]-2.4,this.wall[1]+1.1,this.wall[2]+5.1];target=[this.wall[0],this.wall[1]+.45,this.wall[2]+.1];fov=portrait?39:34;}
      else if(e<11){const p=(e-4)/7,a=.55+p*1.2;position=[Math.cos(a)*12,4.2-p*1.5,Math.sin(a)*13+2];target=[.4,1.0,.65];fov=portrait?51:43;}
      else{position=[feet[0]+.35,feet[1]+1.87,feet[2]+3.15];target=[feet[0],feet[1]+1.66,feet[2]];fov=portrait?32:28;}
    }else if(s.phase==='complete'&&e<8){
      position=[feet[0]+.35,feet[1]+1.87,feet[2]+3.15];target=[feet[0],feet[1]+1.66,feet[2]];fov=portrait?32:28;
    }else if(s.phase==='charge'){
      const wide=smooth((e-22)/8),front=smooth((e-9)/4),orbit=this.reducedMotion?0:Math.sin(e*.16)*.3;
      // Once she clears the canopy, move to the store side: her casting face points -Z.
      // Clamp the eye in front of the glass so the early orbit never passes through the facade.
      const closeX=feet[0]+5.4-front*1.9+orbit,closeZ=Math.max(2.55,feet[2]+4-front*9);
      position=[closeX+(9-closeX)*wide,feet[1]+2.3+wide*3.3,closeZ+(31-closeZ)*wide];
      target=[feet[0]+wide*.8,feet[1]+1.25-wide*1.75,feet[2]-wide*7];fov=portrait?48+wide*7:43+wide*7;
    }else if(['combat','energy','last','aim-final'].includes(s.phase)){
      const view=this.shotNumber%3;
      // Small lateral changes retain the far caster and the entire target facade on a portrait screen.
      position=portrait?(view===0?[-2,9,34]:view===1?[2,9,34]:[0,11,34]):(view===0?[8,9,31]:view===1?[-8,9,31]:[3,11,32]);
      target=[-.7,3.6,7];fov=portrait?58:50;
      if(this.recoil>.05&&!this.reducedMotion){position[0]+=Math.sin(s.clock*63)*this.recoil*.11;position[1]+=Math.sin(s.clock*47)*this.recoil*.07;}
    }else if(s.phase==='finisher'){
      if(e<2){position=[feet[0]+3.6,feet[1]+2.4,feet[2]+6.8];target=[feet[0],feet[1]+.95,feet[2]-.1];fov=50;}
      else if(e<4.9){position=portrait?[0,8,31]:[5,9,29];target=[-1,3.2,7.5];fov=portrait?58:51;}
      else if(e<6.4){position=[-2,6,12];target=[-3.6,2.6,-.4];fov=54;}
      else{position=[this.wall[0]-2.6,this.wall[1]+1.2,this.wall[2]+5.8];target=[this.wall[0],this.wall[1]+.45,this.wall[2]];fov=44;}
    }else if(s.phase==='landing'){
      position=[this.wall[0]-2.4,this.wall[1]+1.1,this.wall[2]+5.1];target=[this.wall[0],this.wall[1]+.45,this.wall[2]+.1];fov=portrait?39:34;
    }else{
      position=portrait?[9,9,32]:[11,8,24];target=[-.8,2.4,.9];fov=portrait?56:47;
    }
    this.cameraPosition.fromArray(position);this.cameraTarget.fromArray(target);
    const blend=1-Math.exp(-Math.min(.1,Math.max(0,delta))*(s.phase==='finisher'?3.6:2.5));
    w.camera.position.lerp(this.cameraPosition,blend);w.controls.target.lerp(this.cameraTarget,blend);
    const next=T.MathUtils.lerp(w.camera.fov,fov,blend);if(Math.abs(next-w.camera.fov)>.001){w.camera.fov=next;w.camera.updateProjectionMatrix();}
    w.currentView=null;
  }
  pick(ray){
    if(!this.state||!['combat','aim-final'].includes(this.state.phase))return null;
    let best=null,distance=Infinity;
    for(const target of this.targets){this.point.fromArray(target.position);if(ray.direction.dot(this.point.clone().sub(ray.origin))<0)continue;const d=ray.distanceSqToPoint(this.point);if(d<distance&&d<7){best=target.id;distance=d;}}
    return best;
  }
}
