import * as T from 'three';
export function songCamera(subject,age,{trapped=false,portrait=false,reduced=false}={}){
 const angle=reduced?0:trapped?Math.sin(age*.16)*.24:Math.min(1,Math.max(0,age)/20)*Math.PI*4/3;
 const radius=trapped?(portrait?3.7:3):3.6;
 return {position:[subject[0]+Math.sin(angle)*radius,subject[1]+(trapped?.65:1.1),subject[2]+Math.cos(angle)*radius],target:[subject[0],subject[1]+.4,subject[2]],fov:portrait?58:46};
}
// Shared musical phrase, individual delay and a soft wrist follow-through.
export function cheerPose(age,index,reduced=false){
 if(reduced)return {roll:(index%3-1)*.09,lift:0,pitch:0,wrist:0};
 const beat=60/104,phrase=age/(beat*8),part=phrase%1,ease=v=>{const p=Math.max(0,Math.min(1,v));return p*p*(3-2*p);},sync=Math.floor(phrase)%4===3?ease(part/.2)*ease((1-part)/.2):0;
 const t=Math.max(0,age-(index*.071% .31)),cycle=(t/beat+index*.13)%(index%3===1?4:2),arc=Math.sin(ease(cycle/1.6)*Math.PI*2),common=Math.sin(ease((age/beat%2)/1.6)*Math.PI*2),wave=arc+(common-arc)*sync,amplitude=.24+(index%3)*.065;
 return {roll:wave*(amplitude+(.30-amplitude)*sync),lift:Math.abs(wave)*.10,pitch:Math.sin(t/beat*Math.PI-index*.3)*.10*(1-sync),wrist:Math.sin((t-.10)/beat*Math.PI)*.13*(1-sync)};
}
export function buildConcertStage(scene,r){
 const root=new T.Group();root.name='dragon-concert-cheering';scene.add(root);root.visible=false;
 const props=[],offset=new T.Vector3();let wasActive=false;
 for(let i=0;i<8;i++){
  const pivot=new T.Group(),wrist=new T.Group();root.add(pivot);pivot.add(wrist);const x=(i-3.5)*.43,z=i%2*.20;
  pivot.position.set(x,i<2?.95:.80,z);props.push({pivot,wrist,y:pivot.position.y});
  if(i<2){const text=i?'安可':'龍泡泡';r.mesh(r.geometry('PlaneGeometry',.58,.24),r.label(text,{width:512,height:256,bg:'#123439',color:'#f4df9c',font:'bold 90px sans-serif'}),wrist,[0,.27,0]);for(const x of [-.30,.30])r.box(wrist,'#e6c68e',[x,.27,0],[.014,.28,.018],{emissive:0xe6c68e,emissiveIntensity:.6});}
  else{r.box(wrist,'#173b3e',[0,.04,0],[.045,.14,.045]);r.box(wrist,i%2?'#9be2d8':'#ecd48d',[0,.24,0],[.04,.28,.04],{emissive:i%2?0x9be2d8:0xecd48d,emissiveIntensity:1.3});}
  // A small grasp and forearm connect the prop to the audience silhouette.
  r.box(pivot,'#385450',[0,-.015,0],[.075,.075,.075]);r.box(pivot,'#203438',[0,-.18,0],[.085,.27,.08]);
 }
 root.traverse(n=>{if(n.isMesh)n.frustumCulled=false;});
 return {root,get state(){root.updateMatrixWorld(true);return {visible:root.visible,position:root.position.toArray(),hands:props.filter(p=>p.pivot.visible).map(p=>p.pivot.getWorldPosition(new T.Vector3()).toArray())};},reset(){root.visible=false;wasActive=false;},update(subject,age,active,camera,quality='balanced',reduced=false){
 root.visible=!!active;if(!active){wasActive=false;return;}
 // A real camera-space foreground: ordinary depth-tested meshes, no overlay pass.
 const depth=.45,foregroundScale=.084,halfH=Math.tan(camera.fov*Math.PI/360)*depth,halfW=halfH*camera.aspect;
 offset.set(0,0,-depth).applyQuaternion(camera.quaternion);root.position.copy(camera.position).add(offset);root.quaternion.copy(camera.quaternion);root.scale.setScalar(foregroundScale);wasActive=true;
 props.forEach(({pivot},i)=>{const side=i<4?-1:1,slot=i%4;pivot.position.x=side*halfW*(.63+slot*.14)/foregroundScale;pivot.position.z=0;});
 props.forEach(({pivot,wrist,y},i)=>{pivot.visible=quality!=='low'||i<6;const p=cheerPose(age,i,reduced);pivot.position.y=(-halfH*.42)/foregroundScale+p.lift;pivot.rotation.set(p.pitch,0,p.roll);wrist.rotation.z=p.wrist;});
 }};
}
