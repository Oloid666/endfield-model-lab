import * as T from 'three';
export function songCamera(subject,age,{trapped=false,portrait=false,reduced=false}={}){
 const angle=reduced?0:trapped?Math.sin(age*.16)*.9:Math.min(1,Math.max(0,age)/20)*Math.PI*4/3;
 const radius=trapped?(portrait?3.7:3):3.6;
 return {position:[subject[0]+Math.sin(angle)*radius,subject[1]+(trapped?.65:1.1),subject[2]+Math.cos(angle)*radius],target:[subject[0],subject[1]+.4,subject[2]],fov:portrait?58:46};
}
export function buildConcertStage(scene,r){
 const root=new T.Group();root.name='dragon-concert-cheering';scene.add(root);root.visible=false;
 for(const [i,text]of ['龍泡泡','安可'].entries()){
  const sign=new T.Group();root.add(sign);sign.position.set(i?.55:-.55,1,0);sign.scale.setScalar(.65);
  const label=r.mesh(r.geometry('PlaneGeometry',.72,.32),r.label(text,{width:512,height:256,bg:'#123439',color:'#f4df9c',font:'bold 90px sans-serif'}),sign);
  for(const y of [-.18,.18])r.box(sign,'#98e5d1',[0,y,0],[.8,.018,.018],{emissive:0x98e5d1,emissiveIntensity:1.2});
  for(const x of [-.39,.39])r.box(sign,'#e6c68e',[x,0,0],[.018,.36,.018],{emissive:0xe6c68e,emissiveIntensity:1});
  label.material.depthWrite=false;
 }
 for(let i=0;i<6;i++){
  const rod=new T.Group();rod.position.set((i-2.5)*.25,-.65,0);root.add(rod);
  r.box(rod,'#173b3e',[0,-.12,0],[.045,.14,.045]);r.box(rod,i%2?'#9be2d8':'#ecd48d',[0,.08,0],[.04,.3,.04],{emissive:i%2?0x9be2d8:0xecd48d,emissiveIntensity:1.5});
 }
 root.traverse(n=>{if(n.isMesh){n.material=r.own(n.material.clone());n.material.depthTest=false;n.material.depthWrite=false;n.renderOrder=100;}});
 return {root,reset(){root.visible=false;},update(subject,age,active,camera,quality='balanced',reduced=false){root.visible=!!active;if(!active)return;root.position.set(subject[0],subject[1]+.5,subject[2]);root.quaternion.copy(camera.quaternion);root.children.forEach((n,i)=>{n.visible=quality!=='low'||i<6;n.rotation.z=reduced?0:Math.sin(age*2.5+i)*.08;});}};
}
