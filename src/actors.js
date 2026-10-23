import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { config } from './config.js';
import { buildDragon } from './companion.js';

export async function loadActors(scene,r,onStage,signal) {
  onStage('正在請莊芳宜下班');
  const response=await fetch(`${import.meta.env.BASE_URL}models/zhuang-fangyi.glb`,{signal});
  if(!response.ok)throw new Error(`人物載入失敗（${response.status}）。請重新載入。`);
  const total=Number(response.headers.get('Content-Length'));
  const reader=response.body?.getReader();let buffer;
  if(reader){const chunks=[];let count=0;while(true){const {done,value}=await reader.read();if(done)break;chunks.push(value);count+=value.byteLength;if(total>0)onStage(`正在載入人物 ${Math.min(100,Math.max(0,Math.round(count/total*100)))}%`);}const all=new Uint8Array(count);let offset=0;for(const c of chunks){all.set(c,offset);offset+=c.length;}buffer=all.buffer;}
  else buffer=await response.arrayBuffer();
  onStage('正在整理衣袖');
  const gltf=await new GLTFLoader().parseAsync(buffer,`${import.meta.env.BASE_URL}models/`);
  const root=new T.Group();root.name='dinner-actors';
  const actor=new T.Group();actor.add(gltf.scene);root.add(actor);
  gltf.scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(gltf.scene,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  if(bounds.isEmpty()||!Number.isFinite(size.y)||size.y<=0)throw new Error('人物模型沒有可用的外形資料。');
  // Only the outer placement group scales. Imported nodes, materials and GLB stay intact.
  const scale=1.94/size.y;actor.scale.setScalar(scale);actor.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);actor.rotation.y=.13;
  root.position.set(.52,.32,2.52);
  gltf.scene.traverse(n=>{if(n.isMesh){r.own(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material]){r.own(m);for(const value of Object.values(m))if(value?.isTexture)r.own(value);}}});
  const bones=[];gltf.scene.traverse(n=>{if(n.isBone)bones.push(n);});const byId=id=>bones.find(n=>gltf.parser.associations.get(n)?.nodes===id);
  root.updateMatrixWorld(true);
  const poses={};for(const [name,id] of Object.entries(config.zhuangNodes)){
    const bone=byId(id);if(!bone)continue;const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();
    poses[name]={bone,q:bone.quaternion.clone(),x:new T.Vector3(1,0,0).applyQuaternion(inverse),y:new T.Vector3(0,1,0).applyQuaternion(inverse),z:new T.Vector3(0,0,1).applyQuaternion(inverse)};
  }
  const eyelids=[];for(const [uid,lid] of config.eyelids){const u=byId(uid),l=byId(lid);if(!u||!l||u.parent!==l.parent)continue;const meet=u.position.clone().lerp(l.position,.75);for(const b of [u,l])eyelids.push({b,rest:b.position.clone(),target:new T.Vector3(b.position.x,meet.y,meet.z)});}
  const q=new T.Quaternion(),axis=new T.Quaternion();
  const pose=(name,pitch=0,yaw=0,roll=0)=>{const p=poses[name];if(p){q.setFromAxisAngle(p.x,pitch).multiply(axis.setFromAxisAngle(p.y,yaw)).multiply(axis.setFromAxisAngle(p.z,roll));p.bone.quaternion.copy(p.q).multiply(q);}};
  const dragon=buildDragon(r);dragon.root.scale.setScalar(.59);dragon.root.position.set(-.87,.02,.09);dragon.root.rotation.y=.15;root.add(dragon.root);
  // Soft contact shadows, created once. They remain attached to the placement group.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');const grad=c.createRadialGradient(64,64,5,64,64,63);grad.addColorStop(0,'rgba(5,15,19,.65)');grad.addColorStop(1,'rgba(5,15,19,0)');c.fillStyle=grad;c.fillRect(0,0,128,128);const texture=r.own(new T.CanvasTexture(canvas));const mat=r.own(new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
  for(const [x,s] of [[0,.7],[-.87,.53]]){const shadow=r.mesh(r.geometry('PlaneGeometry',1,1),mat,root,[x,.006,.04],[s,.48,1]);shadow.rotation.x=-Math.PI/2;}
  scene.add(root);
  return {root,supported:Object.keys(poses).length===Object.keys(config.zhuangNodes).length,update(t){
    // Look, pause, then return. The first phase has no dialogue or looping story action.
    const phase=t%22,look=phase>7&&phase<13?Math.sin((phase-7)/6*Math.PI):0;
    pose('spine',Math.sin(t*1.35)*.008,Math.sin(t*.45)*.008,0);pose('head',Math.sin(t*.8)*.018,-look*.2,look*.035);
    pose('armL',.02,0,-.42);pose('armR',-.02,.02,.46);pose('elbowL',.02,0,.02);pose('wristL',0,0,0);pose('elbowR',.04,0,-.02);pose('wristR',0,0,Math.sin(t)*.015);pose('eyeL',0,-look*.07);pose('eyeR',0,-look*.07);
    const blink=Math.max(0,1-Math.abs(t%4.6-.15)/.12);for(const p of eyelids)p.b.position.lerpVectors(p.rest,p.target,blink);dragon.update(t);
  },dispose(){for(const p of Object.values(poses))p.bone.quaternion.copy(p.q);for(const p of eyelids)p.b.position.copy(p.rest);root.removeFromParent();}};
}
