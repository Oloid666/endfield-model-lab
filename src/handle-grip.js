import * as T from 'three';
import {aimBone} from './tray-grip.js';

// Authored red crossbar frame: x along the bar, y up, z toward Dragon's face.
// Grip only existing bones. No replacement hand, model edits or per-frame mesh raycasts.
export function makeHandleGrip(byId,wrist,hand){
 const chains=[349,353,357,361].map(id=>[id,id+1,id+2].map(byId));
 const rest=new Map([...chains.flat(),...hand.thumb].filter(Boolean).map(b=>[b,b.quaternion.clone()]));
 const cuff=byId(348),cuffRest=cuff.position.clone(),cuffQ=new T.Quaternion(),cuffPosition=new T.Vector3();
 const q=new T.Quaternion(),parent=new T.Quaternion(),flip=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),Math.PI);
 const anchor=new T.Vector3(),target=new T.Vector3(),local=new T.Vector3(),direction=new T.Vector3(),palmOffset=hand.offset.clone().multiplyScalar(.72);
 const barOffset=new T.Vector3(0,.035,.010),barOrigin=new T.Vector3(),barQ=new T.Quaternion(),barInverse=new T.Quaternion();
 function toWorld(p){return p.applyQuaternion(barQ).add(barOrigin);}
 function toBar(p){return p.sub(barOrigin).applyQuaternion(barInverse);}
 return {
  reset(){cuff.position.copy(cuffRest);for(const [b,r]of rest)b.quaternion.copy(r);},
  position(out){wrist.getWorldQuaternion(q);return out.copy(palmOffset).applyQuaternion(q).add(wrist.getWorldPosition(anchor));},
  orient(bar,weight){
   bar.getWorldQuaternion(q);q.multiply(flip).multiply(hand.calibration);
   wrist.parent.getWorldQuaternion(parent).invert();q.premultiply(parent);wrist.quaternion.slerp(q,weight);wrist.updateWorldMatrix(false,true);
  },
  barPosition(bar,out,slide=1){this.position(out);bar.getWorldQuaternion(q);out.sub(target.copy(barOffset).applyQuaternion(q));return out.add(target.set(.26*(1-slide),0,0).applyQuaternion(q));},
  wrap(bar,weight){
   bar.getWorldPosition(barOrigin);bar.getWorldQuaternion(barQ);barInverse.copy(barQ).invert();
   for(const [i,[base,middle,tip]]of chains.entries()){
    base.getWorldPosition(local);toBar(local);const x=local.x;
    // Keep joints outside the 35×47 mm cross-section; pads, not bones, meet it.
    target.set(x,i===3?.034:.012,i===3?-.060:-.044);toWorld(target);aimBone(base,middle,target,weight);
    target.set(x,-.026,-.037);toWorld(target);aimBone(middle,tip,target,weight);
    target.set(x,-.035,-.005);toWorld(target);middle.getWorldPosition(anchor);tip.getWorldPosition(direction).sub(anchor);aimBone(tip,null,target,weight,direction);
   }
   cuff.getWorldQuaternion(cuffQ);cuff.getWorldPosition(cuffPosition);
   const [base,middle,tip]=hand.thumb;
   // Thumb opposes the four fingers on the front face instead of vanishing inside the bar.
   for(const [bone,child,y,z]of [[base,middle,.009,.046],[middle,tip,-.022,.044],[tip,null,-.035,.022]]){
    bone.getWorldPosition(local);toBar(local);target.set(local.x,y,z);toWorld(target);
    if(!child){middle.getWorldPosition(anchor);tip.getWorldPosition(direction).sub(anchor);}
    aimBone(bone,child,target,weight,child?null:direction);
   }
   // The GLB parents one cuff to the thumb root. Keep cloth out of the pinch.
   cuff.parent.getWorldQuaternion(parent).invert();cuff.quaternion.copy(parent.multiply(cuffQ));
   cuff.position.copy(cuffPosition);cuff.parent.worldToLocal(cuff.position);cuff.updateWorldMatrix(false,true);
  }
 };
}
