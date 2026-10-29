import * as T from 'three';
// A small volumetric exhale, attached to the mouth and driven by node time.
export function buildSighBreath(scene,r){
 const root=new T.Group();root.name='dragon-sigh-breath';root.visible=false;scene.add(root);
 const material=r.own(new T.MeshBasicMaterial({color:0xe3eee8,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
 for(let i=0;i<5;i++)r.mesh(r.geometry('SphereGeometry',1,12,8),material,root);
 return {root,reset(){root.visible=false;},update(state,dragon,heading){
  const age=state?.nodeElapsed??-1;root.visible=state?.phase==='observation'&&state.node?.event==='phone-away'&&age>=.55&&age<2.4;
  if(!root.visible)return;
  const p=(age-.55)/1.85,dx=Math.sin(heading),dz=Math.cos(heading);
  root.position.set(dragon[0]+dx*.38,dragon[1]+.27,dragon[2]+dz*.38);
  material.opacity=Math.sin(Math.PI*Math.min(1,p*1.5))*.65*Math.max(0,1-p);
  root.children.forEach((n,i)=>{const trail=i/4,size=(.055+trail*.065)*(.7+p*.8);n.scale.set(size*1.3,size*.8,size);n.position.set(dx*(p*.65+trail*.17),p*.15+Math.sin(trail*Math.PI)*.05,dz*(p*.65+trail*.17));});
 }};
}
