import * as T from 'three';

// D-F01: where Zhuang's hands meet the dinner tray, in the tray's own frame
// (x = her left/right, y = up, z = forward; origin = the support point `trayWorld`).
// Values come from the authored meshes in dinner-art.js / meal-props.js plus the mount
// offsets that performance.js already applies, so the hand follows the real underside.
//  center/half: slab centre and half-length along x; bottom/top: slab underside / top surface.
export const TRAY_GEOMETRY={
 A:{center:.025,half:.26,bottom:.004,top:.044},
 B:{center:0,half:.155,bottom:.0005,top:.0255},
 C:{center:.015,half:.17,bottom:0,top:.025},
};
// Hand skin measured on the real Zhuang GLB (scripts/tray-grip-check.mjs re-measures it):
// finger pads sit ~11 mm above the finger bones, the palm heel ~20 mm above them.
export const GRIP={
 inset:.032,        // knuckle centre this far inside the tray end; index edge reaches the rim, thumb clears it
 knuckleDrop:.015,  // knuckle bones below the underside so finger pads touch instead of sinking in
 pitch:.20,         // fingertips raised ~11 deg: the thicker palm heel drops clear while the fingers carry the tray
 roll:.07,          // outer (index) edge lowered ~4 deg so the hand lies level under the tray end
 forward:.015,      // knuckle line slightly ahead of the tray centre, as before
};

// Knuckle-centre target for one hand. `single` = one-hand carry under the middle (phone/handover).
export function gripPoint(dinner,side,single,out=new T.Vector3()){
 const g=TRAY_GEOMETRY[dinner]||TRAY_GEOMETRY.A,s=side==='L'?1:-1;
 return out.set(single?g.center:g.center+s*(g.half-GRIP.inset),g.bottom-GRIP.knuckleDrop,GRIP.forward);
}
// The tray is 4 cm thick and the GLB thumb is ~6.6 cm, so the thumb cannot reach over the top
// from under the tray. It braces the short end instead (a pinch grip on the end face), which
// stays visible from the player camera. Tray-frame points: first joint low on the end face,
// second joint near the rim, and where the pad points (up the face, slightly inward).
export function thumbPoints(dinner,side,out=[new T.Vector3(),new T.Vector3(),new T.Vector3()],single=false){
 const g=TRAY_GEOMETRY[dinner]||TRAY_GEOMETRY.A,s=side==='L'?1:-1,end=g.center+s*g.half;
 if(single){
  out[0].set(g.center+s*.065,g.bottom-.025,-.015);
  out[1].set(g.center+s*.085,g.bottom-.025,.020);
  out[2].set(g.center+s*.085,g.bottom-.025,.055);
  return out;
 }
 out[0].set(end+s*.016,g.bottom+.002,GRIP.forward-.040);
 out[1].set(end+s*.012,g.top-.006,GRIP.forward-.030);
 out[2].set(end+s*.010,g.top+.016,GRIP.forward-.016);
 return out;
}

// Rotate `bone` so the direction from it to `child` (or `fromDirection`, world) points at
// `target` (world), blended by weight. Used for thumb joints only; arm IK stays in arm-support.js.
const a=new T.Vector3(),b=new T.Vector3(),from=new T.Vector3(),to=new T.Vector3();
const turn=new T.Quaternion(),world=new T.Quaternion(),parent=new T.Quaternion(),none=new T.Quaternion();
export function aimBone(bone,child,target,weight=1,fromDirection=null){
 if(!bone||weight<=0)return;
 bone.getWorldPosition(a);
 if(fromDirection)from.copy(fromDirection);else{if(!child)return;child.getWorldPosition(b);from.subVectors(b,a);}
 to.subVectors(target,a);
 if(from.lengthSq()<1e-10||to.lengthSq()<1e-10)return;
 // Blend the computed turn toward identity without overwriting the turn first.
 // copy(identity).slerp(turn, weight) aliases `turn` and erases every partial rotation.
 turn.setFromUnitVectors(from.normalize(),to.normalize());if(weight<1)turn.slerp(none,1-weight);
 bone.getWorldQuaternion(world).premultiply(turn);bone.parent.getWorldQuaternion(parent).invert();
 bone.quaternion.copy(parent.multiply(world));bone.updateWorldMatrix(false,true);
}
