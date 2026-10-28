import * as T from 'three';
// Reusable tractor and charging geometry; no frame-time allocation.
export function buildCaptureEffects(scene,r){
 const root=new T.Group();root.name='dragon-tractor-light';root.visible=false;scene.add(root);
 const material=r.own(new T.MeshBasicMaterial({color:0x94dfd4,transparent:true,opacity:.45,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));
 const beam=r.mesh(r.geometry('CylinderGeometry',1,1,1,8,1,true),material,root);
 const rings=[];for(let i=0;i<3;i++)rings.push(r.mesh(r.geometry('TorusGeometry',.38,.012,5,40),material,root));
 const from=new T.Vector3(),to=new T.Vector3(),direction=new T.Vector3(),up=new T.Vector3(0,1,0);
 const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
 return {root,update(clock,state,hand,dragon,captureAt){
  const pulling=state?.phase==='last'&&Number.isFinite(captureAt),charging=['aim-final','finisher'].includes(state?.phase)&&!(state.phase==='finisher'&&state.phaseElapsed>=2);root.visible=pulling||charging;if(!root.visible)return;
  from.fromArray(hand);to.fromArray(dragon);to.y+=.3;direction.subVectors(to,from);const length=direction.length();beam.visible=pulling&&length>.05;beam.position.copy(from).add(to).multiplyScalar(.5);beam.scale.set(.025,length,.025);if(length>.001)beam.quaternion.setFromUnitVectors(up,direction.normalize());
  const age=pulling?Math.max(0,clock-captureAt):state.phaseElapsed,build=pulling?1:Math.min(1,age/4);material.opacity=reduced?.28:.3+build*.22;
  rings.forEach((ring,i)=>{ring.position.copy(to);ring.rotation.set(i*Math.PI/3,reduced?0:clock*.5+i,0);ring.scale.setScalar(pulling?1:1.4-build*.65+(reduced?0:Math.sin(clock*2+i)*.04));ring.visible=i===0||!reduced;});
 },reset(){root.visible=false;}};
}
