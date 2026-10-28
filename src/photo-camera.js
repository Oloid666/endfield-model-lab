import * as T from 'three';

// A photographer turns at a fixed optical centre. OrbitControls owns other modes.
export class PhotoCamera {
  constructor(camera,controls,surface,isActive){
    this.camera=camera;this.controls=controls;this.surface=surface;this.isActive=isActive;
    this.abort=new AbortController();this.points=new Map();this.direction=new T.Vector3();
    this.origin=new T.Vector3();this.yaw=0;this.pitch=0;this.distance=7;this.fov=50;
    const listen=(type,fn,options={})=>surface.addEventListener(type,fn,{...options,signal:this.abort.signal});
    listen('pointerdown',e=>{if(!isActive()||e.button>0)return;e.preventDefault();surface.setPointerCapture(e.pointerId);this.points.set(e.pointerId,{x:e.clientX,y:e.clientY});});
    listen('pointermove',e=>{
      if(!isActive()){this.points.clear();return;}if(!this.points.has(e.pointerId))return;
      const old=this.points.get(e.pointerId),next={x:e.clientX,y:e.clientY};
      if(this.points.size===1)this.turn((next.x-old.x)*.003,(next.y-old.y)*.003);
      else if(this.points.size===2){const other=[...this.points.entries()].find(([id])=>id!==e.pointerId)[1];const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);if(before>1&&after>1)this.zoom(before/after);}
      this.points.set(e.pointerId,next);
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])listen(type,e=>this.points.delete(e.pointerId));
    listen('wheel',e=>{if(!isActive())return;e.preventDefault();this.zoom(Math.exp(e.deltaY*.001));},{passive:false});
    window.addEventListener('blur',()=>this.points.clear(),{signal:this.abort.signal});
    surface.tabIndex=0;surface.addEventListener('keydown',e=>{if(!isActive())return;const keys={ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowUp:[0,-.04],ArrowDown:[0,.04]};if(keys[e.key]){e.preventDefault();this.turn(...keys[e.key]);}else if(['+','=','-'].includes(e.key)){e.preventDefault();this.zoom(e.key==='-'?1.08:.92);}},{signal:this.abort.signal});
  }
  reset(){
    this.origin.copy(this.camera.position);this.direction.copy(this.controls.target).sub(this.origin);this.distance=this.direction.length();this.direction.normalize();
    this.yaw=Math.atan2(this.direction.x,-this.direction.z);this.pitch=Math.asin(this.direction.y);this.baseYaw=this.yaw;this.basePitch=this.pitch;this.fov=this.camera.fov;this.points.clear();this.apply();
  }
  turn(x,y){this.yaw=T.MathUtils.clamp(this.yaw-x,this.baseYaw-.65,this.baseYaw+.65);this.pitch=T.MathUtils.clamp(this.pitch+y,Math.max(-1.2,this.basePitch-.4),Math.min(1.2,this.basePitch+.4));this.apply();}
  zoom(factor){this.fov=T.MathUtils.clamp(this.fov*factor,25,70);this.apply();}
  apply(){this.direction.set(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),-Math.cos(this.yaw)*Math.cos(this.pitch));this.camera.position.copy(this.origin);this.controls.target.copy(this.origin).addScaledVector(this.direction,this.distance);this.camera.lookAt(this.controls.target);this.camera.fov=this.fov;this.camera.updateProjectionMatrix();}
  dispose(){this.abort.abort();this.points.clear();}
}
