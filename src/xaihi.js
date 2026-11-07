import {makeArmSupport} from './arm-support.js';
import {actorBounds} from './actor-bounds.js';
import {downloadModel} from './model-download.js';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

const visiblePhases=new Set(['flashback','hack','credentials','heat-demo','meal-spawn','heat','flashback-end']);
const clamp=v=>T.MathUtils.clamp(Number(v)||0,0,1);
const ids={spine:45,neck:46,head:47,eyeL:74,eyeR:55,armL:219,elbowL:221,wristL:223,armR:291,elbowR:293,wristR:295,thighL:15,kneeL:16,footL:17,thighR:24,kneeR:25,footR:26,thighDL:37,kneeDL:38,footDL:39,thighDR:33,kneeDR:34,footDR:35};

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
  remember('cuffL',byId(256));
  const smileIds=[158,162,168,172,157,161,167,171];for(const id of smileIds)remember('smile'+id,byId(id));
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
  r.box(phone,'#172b31',[0,0,0],[.35,.25,.014],{roughness:.35,metalness:.55});
  r.box(phone,'#b5d1c2',[0,.001,.013],[.332,.232,.004],{emissive:0x76b7a1,emissiveIntensity:.65,roughness:.4});
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=768;const ctx=canvas.getContext('2d'),texture=r.own(new T.CanvasTexture(canvas));texture.colorSpace=T.SRGBColorSpace;
  const screen=r.mesh(r.geometry('PlaneGeometry',.33,.23),r.own(new T.MeshBasicMaterial({map:texture})),phone,[0,0,.017]);let pageKey='',hitButtons=[];
  function paint(tablet){const key=JSON.stringify(tablet&&[tablet.stage,tablet.note,tablet.lines,tablet.buttons,tablet.notification]);if(key===pageKey)return;pageKey=key;ctx.fillStyle='#0b292b';ctx.fillRect(0,0,1024,768);ctx.fillStyle='#91d8bb';ctx.font='bold 54px sans-serif';ctx.fillText(tablet?.title||'武陵 · 管理終端',42,74);ctx.font='48px sans-serif';ctx.fillStyle='#eee5c8';(tablet?.lines||['遠端設備連線']).forEach((line,i)=>ctx.fillText(line,42,145+i*58));
   if(tablet?.note){ctx.fillStyle='#ffd58a';tablet.note.split('\n').forEach((line,i)=>ctx.fillText(line,42,370+i*42));}
   if(tablet?.notification){ctx.fillStyle='#203e38';ctx.fillRect(640,380,360,60);ctx.fillStyle='#e1d9bb';ctx.font='28px sans-serif';ctx.fillText(tablet.notification,652,420);}
   hitButtons=[];(tablet?.buttons||[]).forEach(([id,label],i)=>{const y=478+i*130;ctx.fillStyle=id==='800mw'?'#946232':'#41695b';ctx.fillRect(30,y,964,112);ctx.strokeStyle='#d7c58e';ctx.strokeRect(30,y,964,112);ctx.fillStyle='#fff0bf';ctx.font='bold 42px sans-serif';ctx.fillText(label,55,y+68);hitButtons.push({id,y});});texture.needsUpdate=true;
  }
  const meal=new T.Group();meal.name='xaihi-lunch';root.add(meal);
  r.box(meal,'#dedac1',[0,0,0],[.32,.075,.24],{roughness:.65});
  r.box(meal,'#b5ad8c',[0,.045,0],[.30,.02,.22],{roughness:.72});
  r.box(meal,'#3d7456',[0,.058,.015],[.06,.003,.18],{roughness:.66});
  root.traverse(n=>{if(n.isMesh)n.userData.dynamic=true;});
  let disposed=false,phase='',action='waiting',time=0;
  // Solve the real upper arm and elbow toward a held tablet; keep the source rig unchanged.
  const ikOrigin=new T.Vector3(),ikTarget=new T.Vector3(),ikWorld=new T.Quaternion(),ikParent=new T.Quaternion();
  function holdArm(side,target,pole,orientation){ikTarget.copy(target);root.localToWorld(ikTarget);armSupport.reach(side,ikTarget,orientation,pole);}
  const armSupport=makeArmSupport(poses,root),safeRight=new T.Vector3(-.24,.90,.32),refuseLeft=new T.Vector3(.14,1.24,.57);
  const refusalPole=new T.Vector3(.45,-1,.18),refusalTarget=new T.Vector3(),refusalStart=new T.Vector3(),refusalQ=new T.Quaternion(),refusalRestQ=new T.Quaternion();
  const tabletLeft=new T.Vector3(.04,.98,.40),tabletRight=new T.Vector3(-.40,.98,.40);
  const palmPoints=[229,233,237,241].map(id=>byId(id).getWorldPosition(new T.Vector3())),palmCenter=new T.Vector3();for(const p of palmPoints)palmCenter.add(p);palmCenter.multiplyScalar(.25);poses.wristL.bone.getWorldPosition(ikOrigin);const palmForward=palmCenter.clone().sub(ikOrigin).normalize(),palmAcross=palmPoints[3].clone().sub(palmPoints[0]).normalize(),palmNormal=palmForward.clone().cross(palmAcross).normalize().negate();palmAcross.crossVectors(palmNormal,palmForward).normalize();palmForward.crossVectors(palmAcross,palmNormal).normalize();const palmCalibration=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(palmAcross,palmNormal,palmForward)).invert().multiply(poses.wristL.bone.getWorldQuaternion(new T.Quaternion())),refusalBasis=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(-1,0,0),new T.Vector3(0,0,1),new T.Vector3(0,1,0)));
  const restPosition=root.position.clone();
  const aisle=new T.Vector3();
  function travel(progress,back=false){let p=clamp(progress);if(back)p=1-p;if(p<.66)aisle.set(1.95,restPosition.y,.85-2.20*p/.66);else aisle.set(1.95-.75*(p-.66)/.34,restPosition.y,-1.35);root.position.copy(aisle);root.rotation.y=back?(p<.66?0:Math.PI/2):(p<.66?Math.PI:-Math.PI/2);return p*2.95;}

  const status={loaded:true,phase:'',action:'waiting',visible:false,bones:bones.length,scale,headYaw:0,phoneVisible:false,mealVisible:false};
  const updateBounds=actorBounds(gltf.scene,root,{height:1,radius:1.75});
  const api={root,
    tabletTap(ray){if(!phone.visible)return null;const hit=ray.intersectObject(screen)[0];if(!hit?.uv)return null;const y=(1-hit.uv.y)*768;return hitButtons.find(b=>y>=b.y&&y<=b.y+112)?.id||null;},
    tabletFrame(aspect=.46){const center=screen.getWorldPosition(new T.Vector3()),normal=new T.Vector3(0,0,1).applyQuaternion(screen.getWorldQuaternion(new T.Quaternion())),eye=center.clone().addScaledVector(normal,.55).add(new T.Vector3(-.22,.06,.10).applyQuaternion(root.quaternion));if(aspect>=1){const side=new T.Vector3(1,0,0).applyQuaternion(screen.getWorldQuaternion(new T.Quaternion())).multiplyScalar(.1);center.add(side);eye.add(side);}const forward=center.clone().sub(eye).normalize(),right=forward.clone().cross(new T.Vector3(0,1,0)).normalize(),up=right.clone().cross(forward),wanted=new T.Vector3(0,1,0).applyQuaternion(screen.getWorldQuaternion(new T.Quaternion()));const roll=Math.atan2(-wanted.dot(right),wanted.dot(up));return {center:center.toArray(),position:eye.toArray(),fov:aspect<1?60:44,roll};},
    get headPosition(){return poses.head?.bone.getWorldPosition(v).toArray();},
    get loaded(){return !disposed;},get state(){return {...status,headPosition:api.headPosition,screenButtons:phone.visible?hitButtons.map(b=>({id:b.id,world:screen.localToWorld(new T.Vector3(0,.23*(.5-(b.y+56)/768),0)).toArray()})):[],handPositions:['L','R'].map(side=>poses['wrist'+side]?.bone.getWorldPosition(new T.Vector3()).toArray()),position:root.position.toArray(),pose:{head:poses.head?.bone.quaternion.toArray(),wrist:poses.wristR?.bone.quaternion.toArray(),arm:poses.armL?.bone.quaternion.toArray()}};},
    setPosition(x,y,z){root.position.set(x,y,z);restPosition.copy(root.position);},
    setHeading(yaw){root.rotation.y=Number(yaw)||0;},
    reset(){phase='';action='waiting';root.visible=false;root.position.copy(restPosition);root.rotation.y=2;phone.visible=meal.visible=false;for(const p of Object.values(poses)){p.bone.position.copy(p.rest);p.bone.quaternion.copy(p.q);}for(const lid of eyelids)lid.bone.position.copy(lid.rest);Object.assign(status,{phase,action,visible:false,headYaw:0,phoneVisible:false,mealVisible:false});},
    update(t,delta=0,state={}){
      if(disposed)return;time=Number.isFinite(t)?t:time;phase=state.phase||'';
      const visible=state.xaihiVisible??visiblePhases.has(phase);root.visible=visible;
      Object.assign(status,{phase,visible});if(!visible)return;
      const gesture=state.node?.gesture||state.gesture||'',text=state.node?.text||state.text||'';
      const operating=['heat-demo','heat'].includes(phase),leaving=phase==='flashback-end',stage=state.tablet?.stage||'',cue=state.tablet?.dialogue?.cue||'',readingLabel=stage==='meal-label'&&cue==='read-label';
      const hack=!readingLabel&&(!!state.tablet||operating||gesture==='phone'||/PHP|電網|漏洞|終端|駭|加速|三分鐘/.test(text));
      const refusing=state.node?.event==='meal-refusal',refuse=refusing?clamp((state.nodeElapsed||0)/.65):0;const receive=!state.mealBorn&&(leaving||gesture==='receive'||gesture==='hold');
      action=operating?'microwave':receive?'receive-lunch':hack?'terminal':'waiting';
      const walking=['walk-fridge','walk-counter'].includes(stage);let distance=0;
      if(walking)distance=travel((state.tablet.age||0)/3.2,stage==='walk-counter');
      else if(['temperature','cooling','success','defrost','hot'].includes(stage)){root.position.set(1.2,restPosition.y,-1.35);const reaction=stage==='success'||stage==='hot';root.rotation.y=Math.PI-(reaction?.69*clamp((state.tablet.age||0)/.6):0);}
      else {root.position.copy(restPosition);root.rotation.y=phase==='meal-spawn'?1.6:2;}
      if(refusing)root.rotation.y+=.52*refuse;
      const recoil=phase==='meal-spawn'?clamp(((state.phaseElapsed||0)-6.2)/.6):0;if(recoil){root.position.x-=.14*recoil;root.position.z-=.10*recoil;}if(refusing){root.position.x-=Math.sin(root.rotation.y)*.16*refuse;root.position.z-=Math.cos(root.rotation.y)*.16*refuse;}
      const beat=Math.sin(time*1.1),flinch=phase==='heat-demo'?Math.max(0,Math.sin((state.phaseElapsed||0)*3.1))*.08:0;
      for(const p of Object.values(poses))p.bone.position.copy(p.rest);
      pose('spine',Math.sin(time*.8)*.006+(hack?.035:0)-flinch*.13-recoil*.04-refuse*.08,0,beat*.004);
      pose('neck',hack?.045:0,0,0);
      const fridgeReaction=stage==='success'||stage==='hot',birth=phase==='meal-spawn',headYaw=refusing?.24*refuse:cue==='avert'?.38:cue==='side-eye'?-.65:readingLabel?-.10:birth?0:fridgeReaction?-.44:hack?-.22:-.65,nod=cue==='satisfied'?Math.sin(Math.min(1,state.tablet.age/1.2)*Math.PI)*.06:0;pose('head',readingLabel?.28:(refusing?-.02:birth?.16:fridgeReaction?-.03:hack?.14:.015)+nod,headYaw,Math.sin(time*.43)*.008+refuse*.06);
      // Relax the A-pose, then bring the real forearms toward the terminal.
      pose('armL',hack?-.13:receive?-.18:0,.02,-.56+(hack?.10:0));
      pose('elbowL',hack?-1.22:receive?-.88:-.12,0,-.02);pose('wristL',hack?-.5:receive?-.06:0,.06,0);
      pose('armR',operating?-.27:hack?-.12:0,-.025,.59-(operating?.10:0));
      pose('elbowR',operating?-1.07:hack?-.95:-.13,operating?-.12:0,.02);pose('wristR',hack?-.5:0,0,operating?-.08:.03);
      pose('eyeL',0,hack?-.035:0);pose('eyeR',0,hack?-.035:0);
      const blink=Math.max(0,1-Math.abs((time+.4)%4.7-.16)/.11);
      for(const lid of eyelids)lid.bone.position.lerpVectors(lid.rest,lid.target,Math.max(blink,refuse*.08));
      for(let i=0;i<secondary.length;i++)pose(secondary[i],Math.sin(time*.85-i*.4)*.009,0,Math.sin(time*.63-i*.6)*.005);
      for(const suffix of ['L','R','DL','DR']){const swing=walking?Math.sin(distance*10)*(suffix.endsWith('L')?1:-1):0;pose('thigh'+suffix,swing*.25);pose('knee'+suffix,Math.max(0,-swing)*.38);pose('foot'+suffix,-swing*.12);}
      if(walking)root.position.y+=Math.abs(Math.sin(distance*10))*.014;
      root.updateMatrixWorld(true);
      if(hack){holdArm('L',tabletLeft);holdArm('R',tabletRight);}
      else if(refusing){poses.wristL.bone.getWorldPosition(refusalStart);root.worldToLocal(refusalStart);refusalTarget.lerpVectors(refusalStart,refuseLeft,refuse);poses.wristL.bone.getWorldQuaternion(refusalRestQ);root.getWorldQuaternion(ikWorld).multiply(refusalBasis).multiply(palmCalibration);refusalQ.slerpQuaternions(refusalRestQ,ikWorld,refuse);holdArm('L',refusalTarget,refusalPole,refusalQ);holdArm('R',safeRight);}
      else {holdArm('R',safeRight);}

      if(poses.cuffL)poses.cuffL.bone.position.y-=.08*refuse;
      for(const id of smileIds){const p=poses['smile'+id];if(p)p.bone.position.y+=refuse*([158,162].includes(id)?.003:[168,172].includes(id)?.0012:.0008);}
      paint(state.tablet);phone.visible=hack&&!leaving;meal.visible=receive;
      const wrist=poses.wristL?.bone;
      if(wrist){wrist.getWorldPosition(v);root.worldToLocal(v);phone.position.copy(v).add(phoneOffset);phone.rotation.set(.95,Math.PI,0);if(hack)phone.position.set(-.18,1.13,.46);meal.position.copy(v).add(mealOffset);meal.rotation.set(-.06,0,0);}
      updateBounds();Object.assign(status,{action:refusing?'refuse-lunch':action,refuseAmount:refuse,headYaw,phoneVisible:phone.visible,mealVisible:meal.visible});
    },
    dispose(){if(disposed)return;disposed=true;api.reset();status.loaded=false;root.removeFromParent();},
  };
  api.reset();return api;
}
