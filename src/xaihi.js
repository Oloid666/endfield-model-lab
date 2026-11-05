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
  const phoneOffset=new T.Vector3(.025,.08,.13),mealOffset=new T.Vector3(0,.02,.075);
  const phone=new T.Group();phone.name='xaihi-terminal';root.add(phone);
  r.box(phone,'#172b31',[0,0,0],[.27,.19,.014],{roughness:.35,metalness:.55});
  r.box(phone,'#b5d1c2',[0,.001,.013],[.252,.172,.004],{emissive:0x76b7a1,emissiveIntensity:.65,roughness:.4});
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=768;const ctx=canvas.getContext('2d'),texture=r.own(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;
  const screen=r.mesh(r.geometry('PlaneGeometry',.25,.17),r.own(new T.MeshBasicMaterial({map:texture})),phone,[0,0,.017]);let pageKey='',hitButtons=[];
  function paint(tablet){const key=JSON.stringify(tablet&&[tablet.stage,tablet.note,tablet.lines]);if(key===pageKey)return;pageKey=key;ctx.fillStyle='#0b292b';ctx.fillRect(0,0,1024,768);ctx.fillStyle='#91d8bb';ctx.font='bold 45px sans-serif';ctx.fillText(tablet?.title||'武陵 · 管理終端',42,74);ctx.font='31px sans-serif';ctx.fillStyle='#eee5c8';(tablet?.lines||['遠端設備連線']).forEach((line,i)=>ctx.fillText(line,42,145+i*58));
   if(tablet?.note){ctx.fillStyle='#ffd58a';tablet.note.split('\n').forEach((line,i)=>ctx.fillText(line,42,370+i*42));}
   hitButtons=[];(tablet?.buttons||[]).forEach(([id,label],i)=>{const y=478+i*130;ctx.fillStyle=id==='800mw'?'#946232':'#41695b';ctx.fillRect(30,y,964,112);ctx.strokeStyle='#d7c58e';ctx.strokeRect(30,y,964,112);ctx.fillStyle='#fff0bf';ctx.font='bold 36px sans-serif';ctx.fillText(label,55,y+68);hitButtons.push({id,y});});texture.needsUpdate=true;
  }
  const bottle=new T.Group();bottle.name='xaihi-pear-drink';root.add(bottle);r.mesh(r.geometry('CylinderGeometry',.035,.035,.17,12),r.material('#bbcfb0',{roughness:.25}),bottle,[0,0,0]);r.box(bottle,'#f1e5bf',[0,0,.035],[.05,.07,.004]);r.cylinder(bottle,'#d6b36f',[0,.095,0],.027,.025);bottle.visible=false;

  const meal=new T.Group();meal.name='xaihi-lunch';root.add(meal);
  r.box(meal,'#dedac1',[0,0,0],[.32,.075,.24],{roughness:.65});
  r.box(meal,'#b5ad8c',[0,.045,0],[.30,.02,.22],{roughness:.72});
  r.box(meal,'#3d7456',[0,.058,.015],[.06,.003,.18],{roughness:.66});
  root.traverse(n=>{if(n.isMesh)n.userData.dynamic=true;});
  let disposed=false,phase='',action='waiting',time=0;
  // Solve the real upper arm and elbow toward a held tablet; keep the source rig unchanged.
  const ikOrigin=new T.Vector3(),ikEnd=new T.Vector3(),ikTarget=new T.Vector3(),ikFrom=new T.Vector3(),ikTo=new T.Vector3(),ikWorld=new T.Quaternion(),ikParent=new T.Quaternion(),ikTurn=new T.Quaternion();
  function holdArm(side,target){const end=poses['wrist'+side]?.bone;if(!end)return;ikTarget.copy(target);root.localToWorld(ikTarget);
   for(let i=0;i<5;i++)for(const name of ['elbow','arm']){const bone=poses[name+side]?.bone;if(!bone)continue;bone.getWorldPosition(ikOrigin);end.getWorldPosition(ikEnd);ikFrom.copy(ikEnd).sub(ikOrigin);ikTo.copy(ikTarget).sub(ikOrigin);if(ikFrom.lengthSq()<1e-8||ikTo.lengthSq()<1e-8)continue;
    ikTurn.setFromUnitVectors(ikFrom.normalize(),ikTo.normalize());bone.getWorldQuaternion(ikWorld);bone.parent.getWorldQuaternion(ikParent).invert();bone.quaternion.copy(ikParent.multiply(ikTurn.multiply(ikWorld)));bone.updateWorldMatrix(false,true);
   }
  }
  const tabletLeft=new T.Vector3(-.32,1.16,.58),tabletRight=new T.Vector3(.15,1.16,.58);
  const restPosition=root.position.clone();
  const status={loaded:true,phase:'',action:'waiting',visible:false,bones:bones.length,scale,headYaw:0,phoneVisible:false,mealVisible:false};
  const api={root,
    tabletTap(ray){if(!phone.visible)return null;const hit=ray.intersectObject(screen)[0];if(!hit?.uv)return null;const y=(1-hit.uv.y)*768;return hitButtons.find(b=>y>=b.y&&y<=b.y+112)?.id||null;},
    tabletFrame(){const center=screen.getWorldPosition(new T.Vector3()),eye=root.localToWorld(new T.Vector3(-.48,1.70,.20));return {center:center.toArray(),position:eye.toArray()};},
    get loaded(){return !disposed;},get state(){return {...status,screenButtons:phone.visible?hitButtons.map(b=>({id:b.id,world:screen.localToWorld(new T.Vector3(0,.17*(.5-(b.y+56)/768),0)).toArray()})):[],position:root.position.toArray(),pose:{head:poses.head?.bone.quaternion.toArray(),wrist:poses.wristR?.bone.quaternion.toArray(),arm:poses.armL?.bone.quaternion.toArray()}};},
    setPosition(x,y,z){root.position.set(x,y,z);restPosition.copy(root.position);},
    setHeading(yaw){root.rotation.y=Number(yaw)||0;},
    reset(){phase='';action='waiting';root.visible=false;root.position.copy(restPosition);phone.visible=meal.visible=false;for(const p of Object.values(poses)){p.bone.position.copy(p.rest);p.bone.quaternion.copy(p.q);}for(const lid of eyelids)lid.bone.position.copy(lid.rest);Object.assign(status,{phase,action,visible:false,headYaw:0,phoneVisible:false,mealVisible:false});},
    update(t,delta=0,state={}){
      if(disposed)return;time=Number.isFinite(t)?t:time;phase=state.phase||'';
      const visible=state.xaihiVisible??visiblePhases.has(phase);root.visible=visible;
      Object.assign(status,{phase,visible});if(!visible)return;
      const gesture=state.node?.gesture||state.gesture||'',text=state.node?.text||state.text||'';
      const operating=['heat-demo','heat'].includes(phase),leaving=phase==='flashback-end';
      const hack=!!state.tablet||operating||gesture==='phone'||/PHP|電網|漏洞|終端|駭|加速|三分鐘/.test(text);
      const receive=leaving||gesture==='receive'||gesture==='hold';
      action=operating?'microwave':receive?'receive-lunch':hack?'terminal':'waiting';
      if(state.tablet){const near=['hot','drink'].includes(state.tablet.stage);root.position.lerp(new T.Vector3(near?1.95:restPosition.x,restPosition.y,near?-1.25:restPosition.z),1-Math.exp(-Math.max(0,delta)*4));}
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
      if(hack){const pressing=!!state.tablet&&state.tablet.age<.28;tabletRight.x=pressing?.015:.15;tabletRight.y=pressing?1.26:1.16;holdArm('L',tabletLeft);holdArm('R',tabletRight);}
      paint(state.tablet);phone.visible=hack&&!leaving;bottle.visible=!!state.fridgeHot&&state.tablet?.stage!=='hot';meal.visible=receive;
      const wrist=poses.wristL?.bone;
      if(wrist){wrist.getWorldPosition(v);root.worldToLocal(v);phone.position.copy(v).add(phoneOffset);phone.rotation.set(.95,Math.PI,0);if(hack)phone.position.set(-.095,1.23,.58);meal.position.copy(v).add(mealOffset);meal.rotation.set(-.06,0,0);}
      if(bottle.visible&&state.tablet?.stage==='drink'&&poses.wristR){poses.wristR.bone.getWorldPosition(v);root.worldToLocal(v);bottle.position.copy(v).add(new T.Vector3(0,.04,.02));}else if(bottle.visible){v.set(3.96,1.355,1.43);root.worldToLocal(v);bottle.position.copy(v);}
      Object.assign(status,{action,headYaw,phoneVisible:phone.visible,mealVisible:meal.visible});
    },
    dispose(){if(disposed)return;disposed=true;api.reset();status.loaded=false;root.removeFromParent();},
  };
  api.reset();return api;
}
