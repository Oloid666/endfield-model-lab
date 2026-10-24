import * as T from 'three';

const flying=new Set(['charge','combat','last','aim-final','finisher','landing']);
const cinematicPhases=new Set(['charge','combat','last','aim-final','finisher','landing','complete']);
const smooth=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
const lerp=(a,b,p,out)=>{for(let i=0;i<3;i++)out[i]=a[i]+(b[i]-a[i])*p;return out;};
function arc(a,b,p,height,out){lerp(a,b,p,out);out[1]+=Math.sin(Math.PI*p)*height;return out;}

// Coordinates actors, a single camera and pooled effects from the mission clock.
export class MissionDirector{
  constructor(world){
    this.world=world;this.state=null;this.phase='ready';this.finalBegun=false;this.launched=false;this.impacted=false;this.neighborImpacted=false;this.stuckReleased=false;
    this.home=[0,0,0];this.hand=[0,0,0];this.end=[0,0,0];this.projectile=[0,0,0];this.hero=[0,0,0];this.wall=[-8.03,2.8,-1.96];
    this.lastShotAt=-Infinity;this.shotNumber=0;this.recoil=0;this.recoilAmplitude=1;this.reducedMotion=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameraPosition=new T.Vector3();this.cameraTarget=new T.Vector3();this.point=new T.Vector3();
    const material=world.r.own(new T.MeshBasicMaterial({color:0xf3cf88,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    this.marker=world.r.mesh(world.r.geometry('TorusGeometry',.36,.012,6,48),material,world.scene);this.marker.visible=false;
  }
  reset(){
    this.world.actors?.setCinematic(null);this.world.actors?.setDragonProjectile(null);
    this.world.store.destruction.reset();this.world.siege.reset();this.world.garden.reset();
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
    if(phase==='charge'){
      this.world.setWalking(false);this.world.actors?.setMove(0,0,false);
      this.world.actors?.teleport(-1.25,3.25);this.world.currentView=null;this.world.transition=null;
    }
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
    this.world.controls.enabled=!['finisher','landing'].includes(phase);
    if(cinematicPhases.has(phase))this.world.transition=null;
    this.world.weather.invalidateReflection();
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
  get status(){return {phase:this.phase,recoil:this.recoil,shotNumber:this.shotNumber,serverImpacted:this.impacted,neighborImpacted:this.neighborImpacted,dragonStuck:this.neighborImpacted&&!this.stuckReleased,stuckPosition:[...this.wall],flightDistance:12,lift:4};}
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
    actor.setCinematic(flying.has(phase)?{phase,elapsed:e,charge:state.charge/100,flight:Math.min(1,e/9),recoil:this.recoil,distance:12,height:4}:null);
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
    }else if(['landing','complete'].includes(phase)&&this.neighborImpacted&&!this.stuckReleased){
      this.stuckPosition(state.clock);actor.setDragonProjectile(this.projectile,Math.sin(state.clock*39)*.045);
    }else actor.setDragonProjectile(null);
  }
  stuckPosition(clock){
    this.projectile[0]=this.wall[0]+Math.sin(clock*41)*.025;this.projectile[1]=this.wall[1]+Math.sin(clock*33)*.012;this.projectile[2]=this.wall[2]+Math.sin(clock*29)*.016;
  }
  afterActors(t,delta){
    const s=this.state,active=s&&s.phase!=='ready',clock=active?s.clock:t;
    this.world.store.destruction.update(clock,s?.paused?0:delta);
    for(const mesh of this.world.shopFixtures)mesh.visible=this.world.store.destruction.state.progress<44;
    this.world.garden.update(clock,delta,{protected:!!s&&flying.has(s.phase)});
    const feet=this.world.actors?.heroPosition||[-1.25,.32,2.48],dragon=this.world.actors?.dragonPosition||[-2,.325,2.6];
    const target=this.target(s?.target)?.position||[0,4.3,1.6];
    this.world.siege.update(clock,s?.paused?0:delta,{phase:s?.phase||'ready',elapsed:s?.phaseElapsed||0,charge:(s?.charge||0)/100,hero:feet,dragon,target,progress:s?.progress||0,recoil:this.recoil});
    this.marker.visible=!!s&&['combat','aim-final'].includes(s.phase);
    if(this.marker.visible){this.marker.position.fromArray(target);this.marker.quaternion.copy(this.world.camera.quaternion);this.marker.scale.setScalar(.9+Math.sin(clock*3)*.05);}
    if(active)this.updateCamera(delta,feet);
  }
  updateCamera(delta,feet){
    const w=this.world,s=this.state;if(!cinematicPhases.has(s.phase)||w.walkCamera.enabled||w.time<w.manualUntil)return;
    const portrait=w.camera.aspect<.85,e=s.phaseElapsed;let position,target,fov=portrait?48:42;
    if(s.phase==='charge'){
      const wide=smooth((e-22)/8),front=smooth((e-9)/4),orbit=this.reducedMotion?0:Math.sin(e*.16)*.3;
      // Once she clears the canopy, move to the store side: her casting face points -Z.
      // Clamp the eye in front of the glass so the early orbit never passes through the facade.
      const closeX=feet[0]+5.4-front*1.9+orbit,closeZ=Math.max(2.55,feet[2]+4-front*9);
      position=[closeX+(9-closeX)*wide,feet[1]+2.3+wide*3.3,closeZ+(31-closeZ)*wide];
      target=[feet[0]+wide*.8,feet[1]+1.25-wide*1.75,feet[2]-wide*7];fov=portrait?48+wide*7:43+wide*7;
    }else if(['combat','last','aim-final'].includes(s.phase)){
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
    }else if(s.phase==='landing'||s.phase==='complete'&&e<10&&!this.stuckReleased){
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
