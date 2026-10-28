import * as T from 'three';
export function buildMealRemnant(scene,r){
 const root=new T.Group();root.name='purple-mystery-meal';scene.add(root);root.visible=false;
 const body=new T.Group();root.add(body);
 // One continuous, asymmetrical surface: no separate balls, no vertical hopping.
 const geometry=r.own(new T.SphereGeometry(1,28,16)),positions=geometry.attributes.position,rest=positions.array.slice();
 const material=r.material('#73508e',{roughness:.56,metalness:.02,emissive:0x4d2678,emissiveIntensity:.12});
 r.mesh(geometry,material,body);
 const points=new Float32Array(30),boltGeo=r.own(new T.BufferGeometry());boltGeo.setAttribute('position',new T.BufferAttribute(points,3));const lightning=new T.Line(boltGeo,r.own(new T.LineBasicMaterial({color:0xc9a1ff,transparent:true,opacity:.55})));root.add(lightning);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let born=false,touched=-Infinity,bornAt=0,lastShape=-Infinity;
 function shape(time,press){for(let i=0;i<positions.count;i++){const j=i*3,x=rest[j],y=rest[j+1],z=rest[j+2],wave=reduced?0:Math.sin(time*2.6+x*5+z*3)*.035;const lobe=1+.2*Math.sin(x*7+z*4)+.12*Math.cos(z*8-y*3);positions.setXYZ(i,x*.34*lobe+wave,(y+1)*.095*(1-press*.45)*(1+.25*Math.sin(x*5+time*2))+.012,z*.22*lobe-wave*.6);}positions.needsUpdate=true;geometry.computeVertexNormals();}
 shape(0,0);
 return {root,reset(){born=false;touched=-Infinity;root.visible=false;lastShape=-Infinity;},tap(ray,time){if(!root.visible||!ray.intersectObject(body,true).length)return false;touched=time;return true;},update(time,state={}){
  if(!born&&((state.heat?.failures||0)>0||state.phase==='heat-demo'&&state.phaseElapsed>=3.6||state.phase==='flashback-end')){born=true;bornAt=time;}
  const wreck=(state.progress||0)>=62&&!state.vcr;root.visible=born&&(wreck||['heat','heat-demo','flashback-end'].includes(state.phase));if(!root.visible)return;
  const age=Math.max(0,time-bornAt),crawl=reduced?0:Math.sin(age*.45)*.12,press=Math.max(0,1-(time-touched)/.8);
  root.position.set((wreck?2.8:3.06)+crawl,wreck?.35:1.35,(wreck?4.15:.8)+crawl*.35);body.rotation.y=reduced?0:Math.sin(age*.6)*.15;
  if(time-lastShape>=1/24||time<lastShape){shape(reduced?0:age,press);lastShape=time;}
  lightning.visible=!reduced&&age%4<.3;for(let i=0;i<10;i++){points[i*3]=-.31+i*.07;points[i*3+1]=.16+Math.sin(i*8+time*13)*.04;points[i*3+2]=.08+Math.cos(i*5)*.08;}boltGeo.attributes.position.needsUpdate=true;
 },get state(){return {born,visible:root.visible,shape:'crawling-lump'};}};
}
