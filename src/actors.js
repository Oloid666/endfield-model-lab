import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { config } from './config.js';
import { buildPerformance } from './performance.js';

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
  const pivot=new T.Group();pivot.name='zhuang';pivot.userData.hotspot='zhuang';root.add(pivot);
  const actor=new T.Group();actor.add(gltf.scene);pivot.add(actor);
  gltf.scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(gltf.scene,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  if(bounds.isEmpty()||!Number.isFinite(size.y)||size.y<=0)throw new Error('人物模型沒有可用的外形資料。');
  // Only the outer placement group scales. Imported nodes, materials and GLB stay intact.
  const scale=1.94/size.y;actor.scale.setScalar(scale);actor.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);pivot.rotation.y=.08;
  root.position.set(-1.25,.32,2.48);
  gltf.scene.traverse(n=>{if(n.isMesh){n.userData.hotspot='zhuang';r.own(n.geometry);if(n.isSkinnedMesh)r.own(n.skeleton);for(const m of Array.isArray(n.material)?n.material:[n.material]){r.own(m);for(const value of Object.values(m))if(value?.isTexture){value.anisotropy=8;r.own(value);}}}});
  const bones=[];gltf.scene.traverse(n=>{if(n.isBone)bones.push(n);});const byId=id=>bones.find(n=>gltf.parser.associations.get(n)?.nodes===id);
  root.updateMatrixWorld(true);
  const poses={};for(const [name,id] of Object.entries(config.zhuangNodes)){
    const bone=byId(id);if(!bone)continue;const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();
    poses[name]={bone,rest:bone.position.clone(),q:bone.quaternion.clone(),x:new T.Vector3(1,0,0).applyQuaternion(inverse),y:new T.Vector3(0,1,0).applyQuaternion(inverse),z:new T.Vector3(0,0,1).applyQuaternion(inverse)};
  }
  const eyelids=[];for(const [uid,lid] of config.eyelids){const u=byId(uid),l=byId(lid);if(!u||!l||u.parent!==l.parent)continue;const meet=u.position.clone().lerp(l.position,.75);for(const b of [u,l])eyelids.push({b,rest:b.position.clone(),target:new T.Vector3(b.position.x,meet.y,meet.z)});}
  return buildPerformance({scene,r,root,pivot,poses,eyelids,bones,byId,gltf});
}
