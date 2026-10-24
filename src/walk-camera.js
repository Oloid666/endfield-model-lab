import * as T from 'three';

// Keep the camera under the entrance lintel before moving into the shop.
export class WalkCamera{
  constructor(camera,controls,onZone=()=>{}){this.camera=camera;this.controls=controls;this.onZone=onZone;this.enabled=false;this.inside=false;this.inRoom=false;this.stage='';this.last=new T.Vector3();this.position=new T.Vector3();this.target=new T.Vector3();this.automatic=false;}
  setEnabled(value,actor){this.enabled=Boolean(value&&actor);this.automatic=false;if(actor)this.last.copy(actor);if(this.enabled){this.inside=actor.z<1.6;this.inRoom=actor.z<-.45;this.stage=(this.inRoom&&this.camera.position.z>1.8)||(!this.inRoom&&this.camera.position.z<1.8)?'align':'';this.onZone(this.inside);}else this.onZone(false);}
  update(actor,delta,manual){
    if(!this.enabled||!actor)return;
    const dx=actor.x-this.last.x,dz=actor.z-this.last.z;this.last.copy(actor);
    const zone=this.inside?actor.z<2.04:actor.z<1.58;
    if(zone!==this.inside){this.inside=zone;this.onZone(zone);}
    // A character just inside the door still needs the camera behind the doorway.
    // Enter only when there is at least ~1.9m of shop floor behind the character.
    const room=this.inRoom?actor.z<-.12:actor.z<-.45;
    if(room!==this.inRoom){this.inRoom=room;this.stage='align';}
    const resuming=!manual&&!this.automatic;this.automatic=!manual;
    if(manual){this.camera.position.x+=dx;this.camera.position.z+=dz;this.controls.target.x+=dx;this.controls.target.z+=dz;return;}
    if(resuming&&((this.inRoom&&this.camera.position.z>1.8)||(!this.inRoom&&this.camera.position.z<1.8)))this.stage='align';
    this.onZone(this.inside);
    let fov=this.inRoom?72:this.inside?74:42;
    this.target.set(actor.x+(this.inside&&!this.inRoom?-.08:.06),actor.y+1,actor.z-.12);
    if(this.stage==='align'){
      this.position.set(-.22,2.4,this.camera.position.z);
      if(Math.abs(this.camera.position.x+.22)<.18&&Math.abs(this.camera.position.y-2.4)<.13)this.stage='cross';
    }else if(this.stage==='cross'){
      this.position.set(-.22,2.4,this.inRoom?1.47:2.38);
      if(Math.abs(this.camera.position.z-this.position.z)<.11)this.stage='';
    }else if(this.inRoom){
      this.position.set(T.MathUtils.clamp(actor.x+.85,-3.7,3.7),2.68,Math.min(1.5,actor.z+3.25));
    }else if(this.inside){
      this.position.set(-.22,2.4,Math.max(4.2,actor.z+3.25));
    }else this.position.set(actor.x+.65,2.5,actor.z+5.7);
    if(this.stage)fov=58;
    const amount=1-Math.exp(-Math.min(.1,delta)*3.2);
    this.camera.position.lerp(this.position,amount);this.controls.target.lerp(this.target,amount);
    const next=T.MathUtils.lerp(this.camera.fov,fov,amount);if(Math.abs(next-this.camera.fov)>.001){this.camera.fov=next;this.camera.updateProjectionMatrix();}
  }
  get state(){return {enabled:this.enabled,inside:this.inside,inRoom:this.inRoom,stage:this.stage,automatic:this.automatic};}
}
