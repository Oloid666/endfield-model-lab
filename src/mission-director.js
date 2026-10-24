import * as T from 'three';

const flying=new Set(['charge','combat','last','aim-final','finisher','landing']);
const cinematicPhases=new Set(['charge','combat','last','aim-final','finisher','landing','complete']);
const smooth=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
const lerp=(a,b,p,out)=>{for(let i=0;i<3;i++)out[i]=a[i]+(b[i]-a[i])*p;return out;};
function arc(a,b,p,height,out){lerp(a,b,p,out);out[1]+=Math.sin(Math.PI*p)*height;return out;}

// Coordinates actors, a single camera and pooled effects from the mission clock.
export class MissionDirector{
  constructor(world){
    this.world=world;this.state=null;this.phase='ready';this.finalBegun=false;this.launched=false;this.impacted=false;
    this.home=[0,0,0];this.hand=[0,0,0];this.end=[0,0,0];this.projectile=[0,0,0];this.hero=[0,0,0];
    this.cameraPosition=new T.Vector3();this.cameraTarget=new T.Vector3();this.point=new T.Vector3();
    const material=world.r.own(new T.MeshBasicMaterial({color:0xf3cf88,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    this.marker=world.r.mesh(world.r.geometry('TorusGeometry',.36,.012,6,48),material,world.scene);this.marker.visible=false;
  }
  reset(){
    this.world.actors?.setCinematic(null);this.world.actors?.setDragonProjectile(null);
    this.world.store.destruction.reset();this.world.siege.reset();this.world.garden.reset();
    this.finalBegun=false;this.launched=false;this.impacted=false;this.marker.visible=false;
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
      this.finalBegun=true;this.launched=false;this.impacted=false;
      const actor=this.world.actors,feet=actor?.heroPosition||[-1.25,3.02,4.45];
      this.home.splice(0,3,...(actor?.dragonPosition||[-2,.325,3.25]));
      this.hand[0]=feet[0]+.2;this.hand[1]=feet[1]+1.15;this.hand[2]=feet[2]+.25;
      const rack=this.world.store.destruction.state.serverPosition;this.end.splice(0,3,...rack);
      this.world.manualUntil=this.world.time;this.world.transition=null;this.world.currentView=null;
    }
    if((phase==='landing'||phase==='complete')&&this.finalBegun)this.impact();
    this.world.controls.enabled=!['finisher','landing'].includes(phase);
    if(cinematicPhases.has(phase))this.world.transition=null;
    this.world.weather.invalidateReflection();
  }
  impact(){
    if(this.impacted)return;this.impacted=true;
    this.world.store.destruction.destroyServer();this.world.siege.impact(this.end,1.5);
    this.world.weather.invalidateReflection();
  }
  get targets(){
    const d=this.world.store.destruction,s=d.state;
    if(s.progress>=99)return d.targets.filter(v=>v.id==='server');
    const next=s.milestones.find(v=>!v.active);return d.targets.filter(v=>v.id===(next?.id||'structure'));
  }
  target(id){return this.world.store.destruction.targets.find(v=>String(v.id)===String(id))||this.targets[0];}
  attack(event){
    if(event.result==='miss')return;
    if(event.finisher)return;
    const feet=this.world.actors?.heroPosition||[-1.25,3.02,4.45],target=this.target(event.target);
    const from=[feet[0]+.15,feet[1]+1.12,feet[2]-.18];
    this.world.siege.fire({from,to:target?.position||[0,4.3,1.5],power:event.power,finisher:false});
    this.world.store.destruction.setProgress(event.progress);
    this.world.store.spill.shadow.needsUpdate=true;this.world.weather.invalidateReflection();
  }
  beforeActors(state){
    this.state=state;const actor=this.world.actors;if(!state||!actor)return;
    const phase=state.phase,e=state.phaseElapsed;
    actor.setCinematic(flying.has(phase)?{phase,elapsed:e,charge:state.charge/100,flight:Math.min(1,e/9)}:null);
    if(phase==='finisher'){
      if(e<2)arc(this.home,this.hand,smooth(e/2),.2,this.projectile);
      else if(e<4.9){
        if(!this.launched){this.launched=true;this.end.splice(0,3,...this.world.store.destruction.state.serverPosition);this.world.siege.fire({from:this.hand,to:this.end,power:1,finisher:true,duration:2.9});}
        arc(this.hand,this.end,smooth((e-2)/2.9),1.55,this.projectile);
      }else{
        this.impact();arc(this.end,this.hand,smooth((e-4.9)/4.1),2.2,this.projectile);
      }
      actor.setDragonProjectile(this.projectile,e>=2&&e<4.9?(e-2)*8:0);
    }else if(phase==='landing'){
      lerp(this.hand,this.home,smooth(e/3),this.projectile);actor.setDragonProjectile(this.projectile,0);
    }else actor.setDragonProjectile(null);
  }
  afterActors(t,delta){
    const s=this.state,active=s&&s.phase!=='ready',clock=active?s.clock:t;
    this.world.store.destruction.update(clock,s?.paused?0:delta);
    for(const mesh of this.world.shopFixtures)mesh.visible=this.world.store.destruction.state.progress<44;
    this.world.garden.update(clock,delta,{protected:!!s&&flying.has(s.phase)});
    const feet=this.world.actors?.heroPosition||[-1.25,.32,2.48],dragon=this.world.actors?.dragonPosition||[-2,.325,2.6];
    const target=this.target(s?.target)?.position||[0,4.3,1.6];
    this.world.siege.update(clock,s?.paused?0:delta,{phase:s?.phase||'ready',elapsed:s?.phaseElapsed||0,charge:(s?.charge||0)/100,hero:feet,dragon,target,progress:s?.progress||0});
    this.marker.visible=!!s&&['combat','aim-final'].includes(s.phase);
    if(this.marker.visible){this.marker.position.fromArray(target);this.marker.quaternion.copy(this.world.camera.quaternion);this.marker.scale.setScalar(.9+Math.sin(clock*3)*.05);}
    if(active)this.updateCamera(delta,feet);
  }
  updateCamera(delta,feet){
    const w=this.world,s=this.state;if(!cinematicPhases.has(s.phase)||w.walkCamera.enabled||w.time<w.manualUntil)return;
    const portrait=w.camera.aspect<.85,e=s.phaseElapsed;let position,target,fov=portrait?48:42;
    if(s.phase==='charge'){
      const p=smooth((e-23)/7);
      position=portrait?[6.1+p*2.5,5.1+p*2.4,9.8+p*12.2]:[7+p*3,5.3+p*2.5,11+p*6];
      target=portrait?[-.8+p*.9,2.2+p*.5,3.1-p*2.6]:[-.5+p,2.6,2.5-p*2];
      if(portrait)fov=48+p*7;
    }else if(['combat','last','aim-final'].includes(s.phase)){
      position=portrait?[8.6,7.5,22]:[11,8,18];target=portrait?[.4,2.7,.8]:[.1,2.7,.5];if(portrait)fov=55;
    }else if(s.phase==='finisher'){
      if(e<2){position=portrait?[2.2,feet[1]+3,feet[2]+8.5]:[4.8,5.6,12];target=[feet[0]-.15,feet[1]+1,feet[2]];fov=52;}
      else {position=portrait?[4.8,4.6,12]:[7,5.4,11];target=[-.6,2.7,2.6];fov=54;}
    }else if(s.phase==='landing'){
      position=portrait?[3.5,feet[1]+3.2,feet[2]+9]:[7,5.1,12];target=[-1.5,feet[1]+1,feet[2]-.15];fov=48;
    }else{
      const p=smooth((e-8)/6);
      position=portrait?[3+p*11,3.8+p*5.2,12+p*18]:[6+p*7,4+p*2.5,12+p*5];
      target=portrait?[-1.5+p*4,1.3+p*.6,3.1-p*2.3]:[-1.4+p*3.4,1.3+p*.3,3-p*2.8];fov=portrait?45+p*10:40;
    }
    this.cameraPosition.fromArray(position);this.cameraTarget.fromArray(target);
    const blend=1-Math.exp(-Math.min(.1,Math.max(0,delta))*2.5);
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
