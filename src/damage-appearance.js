import * as T from 'three';
// One persistent appearance state. Phase changes cannot erase or restore the damage.
export function damageAppearance(r,root){
 const copies=new Map(),materials=[];
 root.traverse(n=>{if(!n.isMesh)return;const source=n.material;if(!copies.has(source)){const material=r.own(source.clone());material.transparent=true;copies.set(source,material);materials.push({material,opacity:source.opacity});}n.material=copies.get(source);});
 const tape=root.getObjectByName('dragon-curved-bandages'),parts=[...root.children.filter(n=>n!==tape),...(tape?.children||[])].map((node,i)=>({node,p:node.position.clone(),q:node.quaternion.clone(),s:node.scale.clone(),dx:(i%2?1:-1)*(.16+i*.012),spin:(i%2?1:-1)*.65}));
 let state='clean',at=0,progress=1;const rotation=new T.Quaternion(),axis=new T.Vector3(0,0,1);
 function update(time){
  progress=state==='clearing'?T.MathUtils.clamp((time-at)/.35,0,1):state==='clean'?1:0;
  if(state==='clearing'&&progress>=1)state='clean';root.visible=state!=='clean';
  for(const p of parts){p.node.position.copy(p.p);p.node.quaternion.copy(p.q);p.node.scale.copy(p.s);if(state==='clearing'){p.node.position.x+=p.dx*progress;p.node.position.y+=.20*Math.sin(progress*Math.PI*.7);p.node.position.z+=.18*progress;p.node.quaternion.multiply(rotation.setFromAxisAngle(axis,p.spin*progress));p.node.scale.multiplyScalar(1-progress*.45);}}
  for(const m of materials)m.material.opacity=m.opacity*(1-progress);
 }
 return {set(next,time=0){if(!['clean','dirty','clearing'].includes(next)||next===state||next==='clearing'&&state==='clean')return;state=next;at=time;update(time);},update,get state(){return {state,progress,visible:root.visible,bandagesVisible:root.visible&&!!tape};}};
}
