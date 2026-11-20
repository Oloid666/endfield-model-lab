import * as T from 'three';
import {aimBone} from './tray-grip.js';

// Existing finger joints only. Curl about each finger's calibrated flexion axis,
// rather than assigning the same Euler rotation to both mirrored hands.
export function makeTabletHandPose(byId,hands){
 const turn=new T.Quaternion(),target=new T.Vector3(),origin=new T.Vector3(),direction=new T.Vector3();
 const cloth=[[326,327,.065],[350,351,.065],[353,354,.065],[356,357,.065]].map(([a,b,drop])=>({base:byId(a),tip:byId(b),drop,rest:byId(a).quaternion.clone()}));
 const rigs=hands.map((hand,i)=>{
  const ids=i?[301,305,309,313]:[229,233,237,241],wrist=byId(i?295:223),points=ids.map(id=>byId(id).getWorldPosition(new T.Vector3()));
  const forward=new T.Vector3();points.forEach(p=>forward.add(p));forward.multiplyScalar(.25).sub(wrist.getWorldPosition(origin)).normalize();
  const across=points[3].clone().sub(points[0]).normalize(),normal=forward.clone().cross(across).normalize().multiplyScalar(i?1:-1);
  const fingers=ids.map(id=>[id,id+1,id+2].map(j=>{const bone=byId(j),child=byId(j+1),axis=child.getWorldPosition(new T.Vector3()).sub(bone.getWorldPosition(new T.Vector3())).normalize().cross(normal).normalize().applyQuaternion(bone.getWorldQuaternion(new T.Quaternion()).invert());return {bone,rest:bone.quaternion.clone(),axis};}));
  const thumb=(i?[297,298,299]:[225,226,227]).map(id=>byId(id));
  return {fingers,thumb,thumbRest:thumb.map(b=>b.quaternion.clone())};
 });
 return {
  reset(){for(const c of cloth)c.base.quaternion.copy(c.rest);for(const rig of rigs){for(const finger of rig.fingers)for(const j of finger)j.bone.quaternion.copy(j.rest);rig.thumb.forEach((b,i)=>b.quaternion.copy(rig.thumbRest[i]));}},
  drape(root){for(const c of cloth){c.tip.getWorldPosition(target);direction.set(0,-c.drop,0).applyQuaternion(root.quaternion);target.add(direction);aimBone(c.base,c.tip,target);}},
  curl(index,holding=1){
   const rig=rigs[index];for(const [i,finger]of rig.fingers.entries())for(const [j,joint]of finger.entries()){
    const held=[[.14,.50,.28],[.12,.48,.26],[.17,.55,.30],[.22,.62,.33]][i][j],relaxed=[.14,.28,.16][j];
    turn.setFromAxisAngle(joint.axis,T.MathUtils.lerp(relaxed,held,holding));joint.bone.quaternion.copy(joint.rest).multiply(turn);
   }
  },
  thumb(index,phone,holding=1){
   if(holding<=0)return;const [base,middle,tip]=rigs[index].thumb,side=index?1:-1;
   target.set(side*.190,.010,-.018);phone.localToWorld(target);aimBone(base,middle,target,holding);
   target.set(side*.180,.045,.030);phone.localToWorld(target);aimBone(middle,tip,target,holding);
   middle.getWorldPosition(origin);tip.getWorldPosition(direction).sub(origin);target.set(side*.160,.070,.033);phone.localToWorld(target);aimBone(tip,null,target,holding,direction);
  }
 };
}
