import * as T from 'three';
// Conservative room proxies protect the camera's near plane during free viewing.
// Shots selected by the director retain their authored composition.
export class CameraSafety {
 constructor(camera,floorPlan){
  this.camera=camera;this.previous=camera.position.clone();this.direction=new T.Vector3();this.hit=new T.Vector3();this.ray=new T.Ray();this.expanded=new T.Box3();this.boxes=[];
  const add=(x,y,z,w,h,d)=>this.boxes.push(new T.Box3(new T.Vector3(x-w/2,y-h/2,z-d/2),new T.Vector3(x+w/2,y+h/2,z+d/2)));
  for(const o of floorPlan.obstacles||[])add(o.x,1,o.z,o.w,1.4,o.d);
  add(-4.65,1.9,-.5,.18,3.3,5.2);add(4.65,1.9,-.5,.18,3.3,5.2);add(0,1.9,-3.02,9.3,3.3,.18);
  // The central entrance remains passable; the glass and its frames do not.
  add(-2.85,1.9,1.95,3.6,3.3,.12);add(2.65,1.9,1.95,4,3.3,.12);
 }
 sync(){this.previous.copy(this.camera.position);}
 resolve(active,intact=true){
  const p=this.camera.position;if(!active){this.sync();return;}
  const radius=Math.max(.12,this.camera.near*Math.hypot(1,Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*this.camera.aspect));p.y=Math.max(.2+radius,p.y);
  this.direction.subVectors(p,this.previous);const distance=this.direction.length();let allowed=distance;
  if(intact&&distance>1e-6){this.ray.set(this.previous,this.direction.normalize());for(const box of this.boxes){this.expanded.copy(box).expandByScalar(radius);if(this.expanded.containsPoint(this.previous))continue;if(this.ray.intersectBox(this.expanded,this.hit))allowed=Math.min(allowed,Math.max(0,this.hit.distanceTo(this.previous)-.015));}if(allowed<distance)p.copy(this.previous).addScaledVector(this.direction,allowed);}
  this.sync();
 }
}
