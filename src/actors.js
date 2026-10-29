import {downloadModel} from './model-download.js';
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { config } from './config.js';
import { buildPerformance } from './performance.js';

export async function loadActors(scene,r,onStage,signal,dragon,onProgress) {
  onStage('正在請莊方宜下班');
  const buffer=await downloadModel(`${import.meta.env.BASE_URL}models/zhuang-fangyi.glb`,onStage,signal,'莊方宜',onProgress);
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
  gltf.scene.traverse(n=>{if(n.isMesh){n.frustumCulled=false;n.userData.hotspot='zhuang';r.own(n.geometry);if(n.isSkinnedMesh)r.own(n.skeleton);for(const m of Array.isArray(n.material)?n.material:[n.material]){r.own(m);for(const value of Object.values(m))if(value?.isTexture){value.anisotropy=8;r.own(value);}}}});
  const bones=[];gltf.scene.traverse(n=>{if(n.isBone)bones.push(n);});const byId=id=>bones.find(n=>gltf.parser.associations.get(n)?.nodes===id);
  root.updateMatrixWorld(true);
  const footBones=new Set();for(const key of ['footL','footR'])byId(config.zhuangNodes[key])?.traverse(n=>{if(n.isBone)footBones.add(n);});
  let sole=Infinity;const v=new T.Vector3();gltf.scene.traverse(mesh=>{if(!mesh.isSkinnedMesh)return;const weights=mesh.geometry.attributes.skinWeight,indices=mesh.geometry.attributes.skinIndex,positions=mesh.geometry.attributes.position;if(!weights||!indices)return;for(let i=0;i<positions.count;i++){let influence=0;for(let k=0;k<4;k++)if(footBones.has(mesh.skeleton.bones[indices.getComponent(i,k)]))influence+=weights.getComponent(i,k);if(influence<.5)continue;v.fromBufferAttribute(positions,i);mesh.applyBoneTransform(i,v);mesh.localToWorld(v);sole=Math.min(sole,v.y);}});
  if(Number.isFinite(sole)){actor.position.y+=root.position.y-sole;root.updateMatrixWorld(true);}
  const poses={};for(const [name,id] of Object.entries(config.zhuangNodes)){
    const bone=byId(id);if(!bone)continue;const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();
    poses[name]={bone,rest:bone.position.clone(),q:bone.quaternion.clone(),x:new T.Vector3(1,0,0).applyQuaternion(inverse),y:new T.Vector3(0,1,0).applyQuaternion(inverse),z:new T.Vector3(0,0,1).applyQuaternion(inverse)};
  }
  const eyelids=[];for(const [uid,lid] of config.eyelids){const u=byId(uid),l=byId(lid);if(!u||!l||u.parent!==l.parent)continue;const meet=u.position.clone().lerp(l.position,.75);for(const b of [u,l])eyelids.push({b,rest:b.position.clone(),target:new T.Vector3(b.position.x,meet.y,meet.z)});}
  return buildPerformance({scene,r,root,pivot,poses,eyelids,bones,byId,gltf,dragon});
}
