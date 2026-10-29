import {downloadModel} from './model-download.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const visiblePhases=new Set(['flashback','hack','credentials','heat-demo','heat','flashback-end']);
const clamp=v=>T.MathUtils.clamp(Number(v)||0,0,1);
const ids={spine:45,neck:46,head:47,eyeL:74,eyeR:55,armL:219,elbowL:221,wristL:223,armR:291,elbowR:293,wristR:295};

// The original GLB remains untouched. Only the placement group and runtime rig move.
export async function loadXaihi(scene,r,onStage=()=>{},signal,onProgress){
  onStage('正在讀取較早的店內影像');
  const buffer=await downloadModel(`${import.meta.env.BASE_URL}models/xaihi.glb`,onStage,signal,'塞西',onProgress);
  onStage('正在解析塞西與回放素材');
  if(signal?.aborted)throw new DOMException('已取消載入','AbortError');
  const gltf=await new GLTFLoader().parseAsync(buffer,`${import.meta.env.BASE_URL}models/`);
  if(signal?.aborted){disposeImported(gltf.scene);throw new DOMException('已取消載入','AbortError');}
  return buildXaihi(scene,r,gltf);
}

function disposeImported(scene){
  const items=new Set();scene.traverse(n=>{if(n.isMesh){items.add(n.geometry);if(n.isSkinnedMesh)items.add(n.skeleton);for(const m of Array.isArray(n.material)?n.material:[n.material]){items.add(m);for(const value of Object.values(m))if(value?.isTexture)items.add(value);}}});
  for(const item of items)item.dispose?.();
}

export function buildXaihi(scene,r,gltf){
  const root=new T.Group();root.name='xaihi-vcr-actor';root.position.set(1.95,.31,.85);root.visible=false;
  const visual=new T.Group();visual.name='xaihi-placement';visual.add(gltf.scene);root.add(visual);scene.add(root);
  gltf.scene.updateMatrixWorld(true);
  const bounds=new T.Box3().setFromObject(gltf.scene,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
  if(bounds.isEmpty()||!Number.isFinite(size.y)||size.y<=0){root.removeFromParent();disposeImported(gltf.scene);throw Error('塞西模型沒有可用的外形資料。');}
  const scale=1.8/size.y;visual.scale.setScalar(scale);visual.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  const imported=new Set();gltf.scene.traverse(n=>{if(n.isMesh){n.frustumCulled=false;imported.add(n.geometry);if(n.isSkinnedMesh)imported.add(n.skeleton);for(const m of Array.isArray(n.material)?n.material:[n.material]){imported.add(m);for(const value of Object.values(m))if(value?.isTexture){value.anisotropy=4;imported.add(value);}}}});
  for(const item of imported)r.own(item);
  root.updateMatrixWorld(true);
  const bones=[];gltf.scene.traverse(n=>{if(n.isBone)bones.push(n);});
  const byId=id=>bones.find(b=>gltf.parser.associations.get(b)?.nodes===id),poses={};
  const v=new T.Vector3(),q=new T.Quaternion(),axis=new T.Quaternion();
  function remember(name,bone){if(!bone)return;const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();poses[name]={bone,rest:bone.position.clone(),q:bone.quaternion.clone(),x:new T.Vector3(1,0,0).applyQuaternion(inverse),y:new T.Vector3(0,1,0).applyQuaternion(inverse),z:new T.Vector3(0,0,1).applyQuaternion(inverse)};}
  for(const [name,id]of Object.entries(ids))remember(name,byId(id));
  const eyelids=[];
  for(const [upperId,lowerId]of [[70,60],[67,61],[65,62],[89,79],[86,80],[84,81]]){
    const upper=byId(upperId),lower=byId(lowerId);if(!upper||!lower||upper.parent!==lower.parent)continue;
    const meet=upper.position.clone().lerp(lower.position,.72);
    for(const bone of [upper,lower])eyelids.push({bone,rest:bone.position.clone(),target:meet.clone()});
  }
  const secondary=[];
  for(const bone of bones){
    if(/^(hair_base_|hairscarf_base_|dress_base_)/.test(bone.name)&&/_(?:0?2|0?3)(?:_|$)/.test(bone.name)&&secondary.length<15){const name=`secondary${secondary.length}`;remember(name,bone);secondary.push(name);}
  }
  function pose(name,pitch=0,yaw=0,roll=0){const p=poses[name];if(!p)return;q.setFromAxisAngle(p.x,pitch).multiply(axis.setFromAxisAngle(p.y,yaw)).multiply(axis.setFromAxisAngle(p.z,roll));p.bone.quaternion.copy(p.q).multiply(q);}
  root.rotation.y=2;
  const phoneOffset=new T.Vector3(0,.05,.025),mealOffset=new T.Vector3(0,.02,.075);
  const phone=new T.Group();phone.name='xaihi-terminal';root.add(phone);
  r.box(phone,'#172b31',[0,0,0],[.105,.175,.018],{roughness:.35,metalness:.55});
  r.box(phone,'#b5d1c2',[0,.001,.013],[.089,.149,.004],{emissive:0x76b7a1,emissiveIntensity:.65,roughness:.4});
  for(let i=0;i<4;i++)r.box(phone,'#315c58',[0,.045-i*.028,.017],[.061,.007,.002],{roughness:.6});
  const meal=new T.Group();meal.name='xaihi-lunch';root.add(meal);
  r.box(meal,'#dedac1',[0,0,0],[.32,.075,.24],{roughness:.65});
  r.box(meal,'#b5ad8c',[0,.045,0],[.30,.02,.22],{roughness:.72});
  r.box(meal,'#3d7456',[0,.058,.015],[.06,.003,.18],{roughness:.66});
  root.traverse(n=>{if(n.isMesh)n.userData.dynamic=true;});
  let disposed=false,phase='',action='waiting',time=0;
  const restPosition=root.position.clone();
  const status={loaded:true,phase:'',action:'waiting',visible:false,bones:bones.length,scale,headYaw:0,phoneVisible:false,mealVisible:false};
  const api={root,
    get loaded(){return !disposed;},get state(){return {...status,position:root.position.toArray(),pose:{head:poses.head?.bone.quaternion.toArray(),wrist:poses.wristR?.bone.quaternion.toArray(),arm:poses.armL?.bone.quaternion.toArray()}};},
    setPosition(x,y,z){root.position.set(x,y,z);restPosition.copy(root.position);},
    setHeading(yaw){root.rotation.y=Number(yaw)||0;},
    reset(){phase='';action='waiting';root.visible=false;root.position.copy(restPosition);phone.visible=meal.visible=false;for(const p of Object.values(poses)){p.bone.position.copy(p.rest);p.bone.quaternion.copy(p.q);}for(const lid of eyelids)lid.bone.position.copy(lid.rest);Object.assign(status,{phase,action,visible:false,headYaw:0,phoneVisible:false,mealVisible:false});},
    update(t,delta=0,state={}){
      if(disposed)return;time=Number.isFinite(t)?t:time;phase=state.phase||'';
      const visible=state.xaihiVisible??visiblePhases.has(phase);root.visible=visible;
      Object.assign(status,{phase,visible});if(!visible)return;
      const gesture=state.node?.gesture||state.gesture||'',text=state.node?.text||state.text||'';
      const operating=['heat-demo','heat'].includes(phase),leaving=phase==='flashback-end';
      const hack=operating||gesture==='phone'||/PHP|電網|漏洞|終端|駭|加速|三分鐘/.test(text);
      const receive=leaving||gesture==='receive'||gesture==='hold';
      action=operating?'microwave':receive?'receive-lunch':hack?'terminal':'waiting';
      const beat=Math.sin(time*1.1),tap=hack?Math.max(0,Math.sin(time*4.2))*.09:0,flinch=phase==='heat-demo'?Math.max(0,Math.sin((state.phaseElapsed||0)*3.1))*.08:0;
      for(const p of Object.values(poses))p.bone.position.copy(p.rest);
      pose('spine',Math.sin(time*.8)*.006+(hack?.035:0)-flinch*.13,0,beat*.004);
      pose('neck',hack?.045:0,0,0);
      const headYaw=hack?-.22:-.65;pose('head',hack?.14:.015,headYaw,Math.sin(time*.43)*.008);
      // Relax the A-pose, then bring the real forearms toward the terminal.
      pose('armL',hack?-.13:receive?-.18:0,.02,-.56+(hack?.10:0));
      pose('elbowL',hack?-1.22:receive?-.88:-.12,0,-.02);pose('wristL',hack?-.10:receive?-.06:0,.06,0);
      pose('armR',operating?-.27:hack?-.12:0,-.025,.59-(operating?.10:0));
      pose('elbowR',operating?-1.07:hack?-.95:-.13,operating?-.12:0,.02);pose('wristR',-tap,0,operating?-.08:.03);
      pose('eyeL',0,hack?-.035:0);pose('eyeR',0,hack?-.035:0);
      const blink=Math.max(0,1-Math.abs((time+.4)%4.7-.16)/.11);
      for(const lid of eyelids)lid.bone.position.lerpVectors(lid.rest,lid.target,blink);
      for(let i=0;i<secondary.length;i++)pose(secondary[i],Math.sin(time*.85-i*.4)*.009,0,Math.sin(time*.63-i*.6)*.005);
      root.updateMatrixWorld(true);
      phone.visible=hack&&!leaving;meal.visible=receive;
      const wrist=poses.wristL?.bone;
      if(wrist){wrist.getWorldPosition(v);root.worldToLocal(v);phone.position.copy(v).add(phoneOffset);phone.rotation.set(-.3,Math.PI-.15,-.05);meal.position.copy(v).add(mealOffset);meal.rotation.set(-.06,0,0);}
      Object.assign(status,{action,headYaw,phoneVisible:phone.visible,mealVisible:meal.visible});
    },
    dispose(){if(disposed)return;disposed=true;api.reset();status.loaded=false;root.removeFromParent();},
  };
  api.reset();return api;
}
