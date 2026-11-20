import assert from 'node:assert/strict';
import * as T from 'three';
import fs from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Resources} from '../src/resources.js';
import {buildXaihi} from '../src/xaihi.js';
globalThis.ProgressEvent=class{constructor(t,p){Object.assign(this,p)}};
const ctx=new Proxy({measureText:()=>({width:40})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx,width:256,height:256})};
const bytes=await fs.readFile(new URL('../public/models/xaihi.glb',import.meta.url)),len=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+len)),binary=bytes.subarray(28+len,28+len+bytes.readUInt32LE(20+len));
json.buffers[0].uri='data:application/octet-stream;base64,'+binary.toString('base64');json.materials=json.materials.map(()=>({}));delete json.images;delete json.textures;delete json.samplers;

const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
const r=new Resources(),actor=buildXaihi(new T.Scene(),r,gltf),board=actor.root.getObjectByName('xaihi-terminal');
const byId=id=>{let b;gltf.scene.traverse(n=>{if(n.isBone&&gltf.parser.associations.get(n)?.nodes===id)b=n;});return b;};

const ids=[...Array.from({length:20},(_,i)=>225+i),...Array.from({length:20},(_,i)=>297+i)];
const boneLengths=ids.map(id=>byId(id).position.length()),rest=ids.map(id=>byId(id).quaternion.clone()),world=new T.Vector3(),contactFrames=[];let checks=0,time=0,maxWrist=0,minElbow=180,maxElbow=0,maxThumb=0;
const check=(ok,label)=>{assert.ok(ok,label);checks++;};

const skins=[];gltf.scene.traverse(m=>{if(!m.isSkinnedMesh)return;const sw=m.geometry.attributes.skinWeight,si=m.geometry.attributes.skinIndex,list=[];
 for(let i=0;i<sw.count;i++){let k=0;for(let j=1;j<4;j++)if(sw.getComponent(i,j)>sw.getComponent(i,k))k=j;const id=gltf.parser.associations.get(m.skeleton.bones[si.getComponent(i,k)])?.nodes;if(id>=225&&id<=244||id>=297&&id<=316)list.push([i,(id>=297?'R':'L')+((id>=225&&id<=228||id>=297&&id<=300)?'thumb':'finger')]);}
 if(list.length)skins.push({m,list});});
let maxSkin=0,maxSkinAt=null;const inverse=new T.Matrix4(),skin=new T.Vector3();
function contact(){inverse.copy(board.matrixWorld).invert();const result={};
 for(const {m,list}of skins){m.skeleton.update();for(const [i,region]of list){m.getVertexPosition(i,skin);skin.applyMatrix4(m.matrixWorld).applyMatrix4(inverse);const q=result[region]??={gap:Infinity,depth:0};const distance=Math.hypot(Math.max(0,Math.abs(skin.x)-.175),Math.max(0,Math.abs(skin.y)-.125),Math.max(0,-.007-skin.z,skin.z-.017));if(distance<q.gap){q.gap=distance;q.point=skin.toArray();}q.depth=Math.max(q.depth,Math.min(.175-Math.abs(skin.x),.125-Math.abs(skin.y),skin.z+.007,.017-skin.z));}}
 return result;
}
for(const hz of [30,60]){
 actor.reset();let previous=null,maxStep=0,maxAt=null;
 for(const cue of ['', 'satisfied','avert','song','side-eye','']){
  for(let i=0;i<hz*1.5;i++){
   time+=1/hz;actor.update(time,1/hz,{phase:'hack',tablet:{stage:cue?'hot':'search',age:4,dialogue:{cue},dialogueAge:i/hz}});actor.root.updateMatrixWorld(true);
   for(const [side,shoulder,elbow,wrist,knuckles,thumb]of [['L',219,221,223,[229,233,237,241],[225,226,227]],['R',291,293,295,[301,305,309,313],[297,298,299]]]){
    const u=byId(shoulder).getWorldPosition(new T.Vector3()),e=byId(elbow).getWorldPosition(new T.Vector3()),w=byId(wrist).getWorldPosition(new T.Vector3()),p=new T.Vector3();knuckles.forEach(id=>p.add(byId(id).getWorldPosition(new T.Vector3())));p.multiplyScalar(.25);
    const wristAngle=new T.Vector3().subVectors(w,e).angleTo(p.sub(w))*180/Math.PI,elbowAngle=new T.Vector3().subVectors(e,u).angleTo(new T.Vector3().subVectors(w,e))*180/Math.PI;
    maxWrist=Math.max(maxWrist,wristAngle);minElbow=Math.min(minElbow,elbowAngle);maxElbow=Math.max(maxElbow,elbowAngle);
    check(wristAngle<35,`${hz}Hz ${cue} ${side}: wrist is aligned, never folded back (${wristAngle})`);check(elbowAngle>30&&elbowAngle<125,`${side}: elbow stays bent rather than locked (${elbowAngle})`);
    const t=thumb.map(id=>byId(id).getWorldPosition(new T.Vector3())),thumbBend=t[1].clone().sub(t[0]).angleTo(t[2].clone().sub(t[1]))*180/Math.PI;maxThumb=Math.max(maxThumb,thumbBend);
   }
   {const c=contact();for(const [region,q]of Object.entries(c))if(q.depth>maxSkin){maxSkin=q.depth;maxSkinAt={hz,cue,age:i/hz,region};}if(i===hz*1.5-1){contactFrames.push({hz,cue,...Object.fromEntries(Object.entries(c).map(([region,q])=>[region,{gapMm:q.gap*1000,depthMm:q.depth*1000}]))});for(const [region,q]of Object.entries(c))if(region.startsWith('L')||!['avert','side-eye'].includes(cue))check(q.gap<.004,'Held thumb and finger skin meet the real bezel/cover within 4mm: '+region+' '+q.gap);}}
   const right=actor.root.worldToLocal(byId(295).getWorldPosition(new T.Vector3()));if(previous&&right.distanceTo(previous)>maxStep){maxStep=right.distanceTo(previous);maxAt={hz,cue,age:i/hz,before:previous.toArray(),after:right.toArray()};}previous=right;
  }
 }
 ids.forEach((id,i)=>check(Math.abs(byId(id).position.length()-boneLengths[i])<1e-12,'Source finger bone length is unchanged '+id));check(maxStep<.045,'Retreat and regrip have no wrist teleport: '+maxStep);
 const frozen=byId(295).getWorldPosition(new T.Vector3()),fingers=ids.map(id=>byId(id).quaternion.toArray());actor.update(time,0,{phase:'hack',tablet:{stage:'search',age:4,dialogue:{cue:''},dialogueAge:1.5-1/hz}});actor.root.updateMatrixWorld(true);
 check(frozen.distanceTo(byId(295).getWorldPosition(world))<1e-7,'Paused pose is stable');
 actor.update(time,1/hz,{phase:'flashback',gesture:'waiting'});ids.forEach((id,i)=>check(byId(id).quaternion.toArray().every((v,k)=>Math.abs(v-rest[i].toArray()[k])<1e-12),'Leaving tablet mode restores finger '+id));
 actor.reset();ids.forEach((id,i)=>check(byId(id).quaternion.toArray().every((v,k)=>Math.abs(v-rest[i].toArray()[k])<1e-12),'Reset restores finger '+id));
}
check(maxSkin<.003,'No deep hand penetration across all 30/60Hz cue transitions: '+maxSkin);check(maxThumb<100,'Thumb remains a curved grasp without reversing through the palm');
console.log(JSON.stringify({contactFrames,checks,maxWrist,minElbow,maxElbow,maxThumb,maxSkin,maxSkinAt,note:'Actual GLB anatomy guard, not medical limits or an iPhone performance test'},null,2));
