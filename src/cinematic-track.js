import * as T from 'three';

export const easeCinematic=x=>{const p=Math.max(0,Math.min(1,x));return p*p*(3-2*p);};
export function faceFrame(feet,heading,distance=5.6,side=1.1,height=2.12,look=1.46){
 const sx=Math.sin(heading),sz=Math.cos(heading);
 return {position:[feet[0]+sx*distance+sz*side,feet[1]+height,Math.max(2.35,feet[2]+sz*distance-sx*side)],target:[feet[0],feet[1]+look,feet[2]]};
}

// A camera track owns no input and no clock. The existing Director remains the writer.
export class CinematicTrack{
 constructor(){
  for(const key of ['p','t','fixedP','fixedT','head','pet','mid','forward','right','up','back','offset','riseOrigin','axisOrigin','axisForward','axisRight','faceP','faceT','testPoint','fitSeedP','fitOrigin'])this[key]=new T.Vector3();
  this.fitCamera=new T.PerspectiveCamera(50,1,.04,100);this.corners=Array.from({length:8},()=>new T.Vector3());
  this.returnCurve=new T.CatmullRomCurve3([new T.Vector3(-.8,2.4,6.6),new T.Vector3(-1.4,2.55,6.9),new T.Vector3(-2.4,2.3,6.5)],false,'centripetal');
  this.frame={beat:'',position:[0,0,0],target:[0,0,0],fov:45,direct:true,progress:0,fitValid:true};
  this.area={left:-.9,right:.9,top:.75,bottom:-.85};this.fitCount=0;this.context={};this.debug=null;this.reset();
 }
 reset(){this.id='';this.key='';this.started=0;this.lastClock=-Infinity;this.axisReady=false;this.riseReady=false;this.frame.beat='';this.frame.progress=0;}
 stage(phase,head){if(phase==='ascent'&&head){this.riseOrigin.fromArray(head);this.riseReady=true;}if(phase==='aim-final')this.axisReady=false;}
 enter(id,state,c,origin=state.clock||0){
  const clock=state.clock||0,key=`${id}:${c.width||0}:${c.height||0}:${c.aspect||1}:${c.reduced?1:0}`;
  const changed=this.key!==key||clock<this.lastClock;this.lastClock=clock;
  if(changed){this.id=id;this.key=key;this.started=origin;this.frame.fitValid=true;}
  this.frame.beat=id;return changed;
 }
 progress(clock,duration,reduced=false){const p=reduced?0:easeCinematic((clock-this.started)/duration);this.frame.progress=p;return p;}
 pose(position,target,fov){
  if(position.isVector3)position.toArray(this.frame.position);else for(let i=0;i<3;i++)this.frame.position[i]=position[i];
  if(target.isVector3)target.toArray(this.frame.target);else for(let i=0;i<3;i++)this.frame.target[i]=target[i];
  this.frame.fov=fov;return this.frame;
 }
 fixed(clock,duration,push,fov,reduced){
  const u=this.progress(clock,duration,reduced),distance=this.fixedP.distanceTo(this.fixedT);
  this.p.copy(this.fixedP).lerp(this.fixedT,distance>0?push*u/distance:0);return this.pose(this.p,this.fixedT,fov);
 }
 screenArea(c,profile='reading'){
  const w=c.width||390,h=c.height||844,scene=c.container?.getBoundingClientRect?.()||{left:0,top:0,right:w,bottom:h,width:w,height:h};
  let left=14,right=w-14,top=Math.min(96,h*.2),bottom=h-14;
  if(typeof document!=='undefined'&&document.querySelectorAll){
   for(const n of document.querySelectorAll('.masthead,.scene-header,.mission-panel,.mission-connect,.mission-combat,.mission-status')){
    if(!n.getClientRects().length)continue;const r=n.getBoundingClientRect();
    if(r.right<=scene.left+5||r.left>=scene.right-5)continue;
    const l=r.left-scene.left,rr=r.right-scene.left;
    // Landscape controls can cover half the renderer, rather than sit below it.
    if(r.height>=h*.35&&r.width>=w*.25&&l>=w*.38){right=Math.min(right,l-12);continue;}
    if(r.height>=h*.35&&r.width>=w*.25&&rr<=w*.62){left=Math.max(left,rr+12);continue;}
    if(r.width<w*.5)continue;
    if(r.top-scene.top<h*.35&&r.height<120)top=Math.max(top,r.bottom-scene.top+10);
    else if(r.top-scene.top>h*.35)bottom=Math.min(bottom,r.top-scene.top-10);
   }
  }
  // Reserve the largest reading/keyboard layout once, so typing never reframes it.
  if(c.portrait)bottom=Math.min(bottom,h*(profile==='input'?.45:profile==='reading'?.66:.96)-12);
  if(bottom-top<70){top=Math.min(top,h*.23);bottom=Math.max(bottom,top+70);}
  Object.assign(this.area,{left:left/w*2-1,right:right/w*2-1,top:1-top/h*2,bottom:1-bottom/h*2});return this.area;
 }
 fitBox(min,max,seedP,seedT,fov,c,profile='reading',preserveEye=false){
  this.fitSeedP.copy(seedP);this.fitOrigin.copy(seedT);this.fitCount++;this.screenArea(c,profile);const area=this.area,aspect=c.aspect||390/844;
  for(let i=0;i<8;i++)this.corners[i].set(i&1?max[0]:min[0],i&2?max[1]:min[1],i&4?max[2]:min[2]);
  this.back.subVectors(this.fitSeedP,this.fitOrigin).normalize();this.forward.copy(this.back).negate();
  this.right.crossVectors(this.forward,T.Object3D.DEFAULT_UP).normalize();this.up.crossVectors(this.right,this.forward).normalize();
  const tan=Math.tan(T.MathUtils.degToRad(fov/2)),cx=(area.left+area.right)/2,cy=(area.top+area.bottom)/2;
  const test=(distance)=>{
   this.offset.copy(this.right).multiplyScalar(-cx*distance*tan*aspect).addScaledVector(this.up,-cy*distance*tan);
   this.t.copy(this.fitOrigin).add(this.offset);this.p.copy(this.fitOrigin).addScaledVector(this.back,distance);if(!preserveEye)this.p.add(this.offset);
   const camera=this.fitCamera;camera.aspect=aspect;camera.fov=fov;camera.updateProjectionMatrix();camera.position.copy(this.p);camera.lookAt(this.t);camera.updateMatrixWorld();
   for(const corner of this.corners){this.testPoint.copy(corner).project(camera);if(this.testPoint.z>=1||this.testPoint.z<=-1||this.testPoint.x<area.left||this.testPoint.x>area.right||this.testPoint.y<area.bottom||this.testPoint.y>area.top)return false;}
   return true;
  };
  let low=Math.min(39,this.fitSeedP.distanceTo(this.fitOrigin)),high=40;const fits=test(high);for(let i=0;i<20;i++){const mid=(low+high)/2;if(test(mid))high=mid;else low=mid;}
  test(high);this.fixedP.copy(this.p);this.fixedT.copy(this.t);this.frame.fitValid=fits;this.fitDistance=high;
 }
 captureAxis(feet,head,server,heading){
  if(this.axisReady)return;this.axisReady=true;this.axisOrigin.fromArray(head);this.axisForward.fromArray(server).sub(this.axisOrigin);this.axisForward.y=0;this.axisForward.normalize();
  this.axisRight.crossVectors(this.axisForward,T.Object3D.DEFAULT_UP).normalize();
  const face=faceFrame(feet,heading,6,1.8,2.25,1.1);this.faceP.fromArray(face.position);this.faceT.fromArray(face.target);
  this.offset.copy(this.faceP).sub(this.axisOrigin);this.axisSide=this.offset.dot(this.axisRight)<0?-1:1;
 }
 sideAligned(point){
  this.p.fromArray(point);this.offset.copy(this.p).sub(this.axisOrigin);const side=this.offset.dot(this.axisRight);
  if(side*this.axisSide<0)this.p.addScaledVector(this.axisRight,-2*side);return this.p;
 }
 enableDebug(container){
  if(this.debug||typeof document==='undefined')return;const canvas=document.createElement('canvas');canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:40';container.append(canvas);
  this.debug={canvas,ctx:canvas.getContext('2d'),points:Array.from({length:17},()=>new T.Vector3())};
 }
 drawDebug(camera){
  if(!this.debug||!this.frame.beat)return;const {canvas,ctx,points}=this.debug,w=canvas.clientWidth,h=canvas.clientHeight;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  ctx.clearRect(0,0,w,h);ctx.strokeStyle='#ffe394';ctx.strokeRect((this.area.left+1)*w/2,(1-this.area.top)*h/2,(this.area.right-this.area.left)*w/2,(this.area.top-this.area.bottom)*h/2);
  ctx.fillStyle='#ffe394';ctx.font='13px monospace';ctx.fillText(`${this.id}  ${Math.round(this.frame.progress*100)}%  ${this.frame.fov.toFixed(1)}°`,14,150);
  camera.updateMatrixWorld();ctx.strokeStyle='#60e7d9';ctx.beginPath();let begun=false;
  for(let i=0;i<points.length;i++){this.returnCurve.getPointAt(i/(points.length-1),points[i]);points[i].project(camera);if(points[i].z>1){begun=false;continue;}const x=(points[i].x+1)*w/2,y=(1-points[i].y)*h/2;if(!begun)ctx.moveTo(x,y);else ctx.lineTo(x,y);begun=true;}if(this.id.startsWith('cinematic-return'))ctx.stroke();
  this.testPoint.fromArray(this.frame.target).project(camera);ctx.fillStyle='#ff7d8c';ctx.beginPath();ctx.arc((this.testPoint.x+1)*w/2,(1-this.testPoint.y)*h/2,5,0,Math.PI*2);ctx.fill();
 }
 get state(){return {id:this.id,progress:this.frame.progress,started:this.started,fitValid:this.frame.fitValid,fitCount:this.fitCount,fitDistance:this.fitDistance||0,riseOrigin:this.riseReady?this.riseOrigin.toArray():null,axisSide:this.axisSide||0,axisOrigin:this.axisOrigin.toArray(),axisRight:this.axisRight.toArray()};}
 dispose(){this.debug?.canvas.remove();this.debug=null;this.reset();}
}
