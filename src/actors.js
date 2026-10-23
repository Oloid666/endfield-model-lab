import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { config } from './config.js';
import { sampleIdle } from './idle.js';
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
  const scale=1.94/size.y;actor.scale.setScalar(scale);actor.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);actor.rotation.y=.08;
  root.position.set(-1.25,.32,2.48);
  gltf.scene.traverse(n=>{if(n.isMesh){r.own(n.geometry);for(const m of Array.isArray(n.material)?n.material:[n.material]){r.own(m);for(const value of Object.values(m))if(value?.isTexture)r.own(value);}}});
  const bones=[];gltf.scene.traverse(n=>{if(n.isBone)bones.push(n);});const byId=id=>bones.find(n=>gltf.parser.associations.get(n)?.nodes===id);
  root.updateMatrixWorld(true);
  const poses={};for(const [name,id] of Object.entries(config.zhuangNodes)){
    const bone=byId(id);if(!bone)continue;const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();
    poses[name]={bone,rest:bone.position.clone(),q:bone.quaternion.clone(),x:new T.Vector3(1,0,0).applyQuaternion(inverse),y:new T.Vector3(0,1,0).applyQuaternion(inverse),z:new T.Vector3(0,0,1).applyQuaternion(inverse)};
  }
  const eyelids=[];for(const [uid,lid] of config.eyelids){const u=byId(uid),l=byId(lid);if(!u||!l||u.parent!==l.parent)continue;const meet=u.position.clone().lerp(l.position,.75);for(const b of [u,l])eyelids.push({b,rest:b.position.clone(),target:new T.Vector3(b.position.x,meet.y,meet.z)});}
  const q=new T.Quaternion(),axis=new T.Quaternion();
  const pose=(name,pitch=0,yaw=0,roll=0)=>{const p=poses[name];if(p){q.setFromAxisAngle(p.x,pitch).multiply(axis.setFromAxisAngle(p.y,yaw)).multiply(axis.setFromAxisAngle(p.z,roll));p.bone.quaternion.copy(p.q).multiply(q);}};
  const dragon=buildDragon(r);dragon.root.scale.setScalar(.59);dragon.root.position.set(-.82,.005,.09);dragon.root.rotation.y=.15;root.add(dragon.root);
  // Soft contact shadows, created once. They remain attached to the placement group.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const c=canvas.getContext('2d');const grad=c.createRadialGradient(64,64,5,64,64,63);grad.addColorStop(0,'rgba(5,15,19,.65)');grad.addColorStop(1,'rgba(5,15,19,0)');c.fillStyle=grad;c.fillRect(0,0,128,128);const texture=r.own(new T.CanvasTexture(canvas));const mat=r.own(new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));
  for(const [x,s] of [[0,.7],[-.82,.53]]){const shadow=r.mesh(r.geometry('PlaneGeometry',1,1),mat,root,[x,.006,.04],[s,.48,1]);shadow.rotation.x=-Math.PI/2;}
  scene.add(root);root.updateMatrixWorld(true);
  const idle={};let raining=true;
  const feet=['L','R'].map(side=>({hip:poses['hip'+side]?.bone,knee:poses['knee'+side]?.bone,foot:poses['foot'+side]?.bone,target:new T.Vector3(),orientation:new T.Quaternion()}));
  for(const leg of feet)if(leg.foot){leg.foot.getWorldPosition(leg.target);leg.foot.getWorldQuaternion(leg.orientation);}
  const jointPosition=new T.Vector3(),footPosition=new T.Vector3(),toFoot=new T.Vector3(),toTarget=new T.Vector3();
  const deltaQ=new T.Quaternion(),worldQ=new T.Quaternion(),parentQ=new T.Quaternion();
  const pelvis=poses.pelvis,parentScale=pelvis.bone.parent.getWorldScale(new T.Vector3());
  const shiftAxis=new T.Vector3(1,0,0).applyQuaternion(pelvis.bone.parent.getWorldQuaternion(new T.Quaternion()).invert()).divide(parentScale);
  const downAxis=new T.Vector3(0,-1,0).applyQuaternion(pelvis.bone.parent.getWorldQuaternion(new T.Quaternion()).invert()).divide(parentScale);
  function pinFeet(){
    for(const leg of feet){
      if(!leg.hip||!leg.knee||!leg.foot)continue;
      for(let iteration=0;iteration<3;iteration++)for(const joint of [leg.knee,leg.hip]){
        joint.getWorldPosition(jointPosition);leg.foot.getWorldPosition(footPosition);
        toFoot.copy(footPosition).sub(jointPosition).normalize();toTarget.copy(leg.target).sub(jointPosition).normalize();
        deltaQ.setFromUnitVectors(toFoot,toTarget);joint.getWorldQuaternion(worldQ);worldQ.premultiply(deltaQ);
        joint.parent.getWorldQuaternion(parentQ).invert();joint.quaternion.copy(parentQ.multiply(worldQ));joint.updateWorldMatrix(false,true);
      }
      leg.foot.parent.getWorldQuaternion(parentQ).invert();leg.foot.quaternion.copy(parentQ.multiply(leg.orientation));leg.foot.updateWorldMatrix(false,true);
    }
  }
  const status={phase:0,action:'settle',footDrift:0};
  return {root,status,get poseData(){return {head:poses.head.bone.quaternion.toArray(),wrist:poses.wristL.bone.quaternion.toArray()};},setRain(value){raining=value;},supported:Object.keys(poses).length===Object.keys(config.zhuangNodes).length,update(t){
    sampleIdle(t,idle);if(!raining){idle.rain=0;idle.startle=0;}status.phase=idle.phase;status.action=idle.startle>.1?'rain-response':idle.sleeve>.1?'adjust-sleeve':idle.dragon>.1?'look-at-dragon':idle.goods>.1?'look-at-display':'rest';
    for(const name of ['hipL','kneeL','footL','hipR','kneeR','footR'])poses[name]?.bone.quaternion.copy(poses[name].q);
    pelvis.bone.position.copy(pelvis.rest).addScaledVector(shiftAxis,idle.shift*.009).addScaledVector(downAxis,idle.shift*.002);
    pose('pelvis',0,0,idle.shift*.009);
    const breath=Math.sin(t*1.17)*.005+Math.sin(t*.53)*.002;
    pose('spine',breath-idle.exhale*.008,-idle.goods*.035,-idle.shift*.004);
    pose('head',.015+idle.dragon*.13+idle.nod*.045-idle.rain*.045,-idle.dragon*.28-idle.goods*.2+idle.rain*.12,-idle.shift*.006);
    pose('armL',.025+idle.sleeve*.08,.04,-.67+idle.sleeve*.08);pose('armR',-.015+idle.sleeve*.12,-.035,.68-idle.sleeve*.07);
    pose('elbowL',.06+idle.sleeve*.2,.015,.025+idle.sleeve*.1);pose('wristL',idle.sleeve*.08,0,idle.sleeve*.1);
    pose('elbowR',.06+idle.sleeve*.16,0,-.035-idle.sleeve*.08);pose('wristR',.015+idle.sleeve*.06,0,-idle.sleeve*.08);
    const eye=-idle.goodsEyes*.12-idle.dragonEyes*.11+idle.rain*.06;pose('eyeL',0,eye);pose('eyeR',0,eye);
    for(const p of eyelids)p.b.position.lerpVectors(p.rest,p.target,idle.blink);
    root.updateMatrixWorld(true);pinFeet();status.footDrift=0;
    for(const leg of feet)if(leg.foot)status.footDrift=Math.max(status.footDrift,leg.foot.getWorldPosition(footPosition).distanceTo(leg.target));
    dragon.update(t,idle);
  },dispose(){for(const p of Object.values(poses)){p.bone.quaternion.copy(p.q);p.bone.position.copy(p.rest);};for(const p of eyelids)p.b.position.copy(p.rest);root.removeFromParent();}};
}
