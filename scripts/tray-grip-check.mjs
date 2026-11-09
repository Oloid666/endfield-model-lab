/**
 * D-F01 tray grip: measures the real Zhuang GLB skin (skinned vertices, not bones) against the
 * real tray slab built by meal-props/dinner-art. Node only, image materials removed in memory,
 * Canvas painting stubbed. This proves contact geometry, not how it looks on an iPhone.
 */
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'node:fs/promises';
import { Resources } from '../src/resources.js';
import { buildPerformance } from '../src/performance.js';
import { config } from '../src/config.js';
import { aimBone } from '../src/tray-grip.js';

const checks=[];const check=(name,passed,detail=null)=>checks.push({name,passed:!!passed,detail});
// A quarter-turn must also work at partial weights, including a rotated parent and a tip
// without a child. Static full-grip contact alone cannot catch a release-time rotation pop.
const blendSamples=[];
for(const parentAngle of [0,.6])for(const leaf of [false,true])for(const weight of [0,.25,.5,.75,1]){
 const parent=new T.Group(),bone=new T.Bone(),child=new T.Bone();parent.rotation.z=parentAngle;parent.add(bone);
 if(!leaf){bone.add(child);child.position.x=1;}parent.updateMatrixWorld(true);
 const target=new T.Vector3(0,1,0).applyMatrix4(parent.matrixWorld);
 const direction=leaf?new T.Vector3(1,0,0).transformDirection(parent.matrixWorld):null;
 aimBone(bone,leaf?null:child,target,weight,direction);
 const actual=bone.quaternion.angleTo(new T.Quaternion()),expected=Math.PI*.5*weight;
 blendSamples.push({parentAngle,leaf,weight,actual,expected});
}
check('Thumb aim blends a quarter-turn proportionally at 0/25/50/75/100%, including rotated parents and terminal joints',blendSamples.every(s=>Math.abs(s.actual-s.expected)<1e-6),blendSamples);
globalThis.ProgressEvent=class {constructor(type,props){this.type=type;Object.assign(this,props);}};
const context={createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),fillText(){},fillRect(){},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},stroke(){},roundRect(){},fill(){},ellipse(){}};
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})};
const bytes=await fs.readFile(new URL('../public/models/zhuang-fangyi.glb',import.meta.url));
const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength));
const binaryLength=bytes.readUInt32LE(20+jsonLength),binary=bytes.subarray(28+jsonLength,28+jsonLength+binaryLength);
json.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
json.materials=json.materials.map(()=>({}));delete json.images;delete json.textures;delete json.samplers;
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
const root=new T.Group(),pivot=new T.Group(),actor=new T.Group();root.position.set(-1.25,.32,2.48);root.add(pivot);pivot.add(actor);actor.add(gltf.scene);pivot.rotation.y=.08;
gltf.scene.updateMatrixWorld(true);
const bounds=new T.Box3().setFromObject(gltf.scene,true),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=1.94/size.y;
actor.scale.setScalar(scale);actor.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
const bones=[];gltf.scene.traverse(n=>{if(n.isBone)bones.push(n);});
const byId=id=>bones.find(n=>gltf.parser.associations.get(n)?.nodes===id);
root.updateMatrixWorld(true);const poses={};
for(const [name,id]of Object.entries(config.zhuangNodes)){const bone=byId(id);if(!bone)continue;const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();
 poses[name]={bone,rest:bone.position.clone(),q:bone.quaternion.clone(),x:new T.Vector3(1,0,0).applyQuaternion(inverse),y:new T.Vector3(0,1,0).applyQuaternion(inverse),z:new T.Vector3(0,0,1).applyQuaternion(inverse)};}
const a=buildPerformance({scene:new T.Scene(),r:new Resources(),root,pivot,poses,eyelids:[],bones,byId,gltf});
let food=null;root.traverse(n=>{if(n.name==='food'&&n.getObjectByName('meal-A'))food=n;});

// Hand regions from the GLB hierarchy (wrist node 342 / 389): palm, thumb chain, four fingers.
const regions=new Map();
for(const [side,wristId]of [['L',342],['R',389]]){
 const wrist=byId(wristId),kids=wrist.children.filter(n=>n.isBone);
 const chain=b=>{const c=[b];for(let n=b;(n=n.children.find(x=>x.isBone&&!/^sleeve/.test(x.name)));)c.push(n);return c;};
 regions.set(wrist,side+':palm');for(const b of chain(kids[1]))regions.set(b,side+':thumb');kids.slice(2,6).forEach((k,i)=>chain(k).forEach(b=>regions.set(b,side+':f'+i)));
}
const skinned=[];gltf.scene.traverse(n=>{if(n.isSkinnedMesh)skinned.push(n);});
const handVertices=skinned.map(mesh=>{const sw=mesh.geometry.attributes.skinWeight,si=mesh.geometry.attributes.skinIndex,list=[];
 for(let i=0;i<sw.count;i++){let best=-1,w=0;for(let k=0;k<4;k++){const x=sw.getComponent(i,k);if(x>w){w=x;best=si.getComponent(i,k);}}const region=regions.get(mesh.skeleton.bones[best]);if(region)list.push([i,region]);}
 return {mesh,list};});

// The tray slab = the visible branch mesh with the largest footprint, boxed in the branch frame (metres).
function slab(){const branch=food.children.find(n=>n.visible);branch.updateWorldMatrix(true,true);const inverse=branch.matrixWorld.clone().invert();let best=null,area=0;
 branch.traverse(n=>{if(!n.isMesh||!n.visible)return;n.geometry.computeBoundingBox();const box=n.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().multiplyMatrices(inverse,n.matrixWorld)),sz=box.getSize(new T.Vector3());
  if(sz.y<.06&&sz.x*sz.z>area){area=sz.x*sz.z;best=box;}});
 return {box:best,inverse};}
const p=new T.Vector3();
function measure(){
 root.updateMatrixWorld(true);const s=slab(),{min,max}=s.box,r={};
 for(const {mesh,list}of handVertices){mesh.updateMatrixWorld(true);mesh.skeleton.update();
  for(const [i,region]of list){mesh.getVertexPosition(i,p);p.applyMatrix4(mesh.matrixWorld).applyMatrix4(s.inverse);
   const q=r[region]??={n:0,under:0,pen:0,maxPenMm:0,touch:0,gapMm:Infinity,endFace:0};q.n++;
   const inX=p.x>min.x&&p.x<max.x,inZ=p.z>min.z&&p.z<max.z;
   if(inX&&inZ){q.under++;if(p.y>min.y&&p.y<max.y){/* depth = distance to the nearest slab face, so a vertex grazing the end face is not counted as 2 cm deep */const depth=Math.min(p.y-min.y,max.y-p.y,p.x-min.x,max.x-p.x,p.z-min.z,max.z-p.z)*1000;if(depth>1){q.pen++;q.maxPenMm=Math.max(q.maxPenMm,depth);}}
    else if(p.y<=min.y){const gap=(min.y-p.y)*1000;q.gapMm=Math.min(q.gapMm,gap);if(gap<=4)q.touch++;}}
   else if(inZ&&p.y>min.y-.002&&p.y<max.y+.004){const out=Math.min(Math.abs(p.x-min.x),Math.abs(p.x-max.x));if(out<=.012)q.endFace++;}
  }}
 for(const q of Object.values(r)){q.maxPenMm=+q.maxPenMm.toFixed(1);q.gapMm=q.gapMm===Infinity?null:+q.gapMm.toFixed(1);}
 return r;
}
const sum=(r,side,keys,field)=>keys.reduce((n,k)=>n+(r[side+':'+k]?.[field]||0),0);
const fingers=['f0','f1','f2','f3'];
function twoHandHold(r,label){
 for(const side of ['L','R']){
  const maxPen=Math.max(...['palm',...fingers].map(k=>r[side+':'+k]?.maxPenMm||0));
  const pads=sum(r,side,fingers,'touch'),palmGap=r[side+':palm']?.gapMm;
  check(`${label} ${side}: palm and fingers do not sink into the tray (<=4 mm)`,maxPen<=4,{maxPenetrationMm:maxPen});
  check(`${label} ${side}: finger pads touch the underside (>=40 skin vertices within 4 mm)`,pads>=40,{touchingVertices:pads});
  check(`${label} ${side}: palm heel is under the tray, not floating (gap <=8 mm)`,palmGap!=null&&palmGap<=8,{palmGapMm:palmGap});
  check(`${label} ${side}: thumb is not buried in the tray (<=12 vertices deeper than 1 mm, <=4 mm)`,(r[side+':thumb'].pen<=12&&r[side+':thumb'].maxPenMm<=4),r[side+':thumb']);
  check(`${label} ${side}: thumb braces the tray end face (>=15 vertices within 12 mm)`,r[side+':thumb'].endFace>=15,{endFaceVertices:r[side+':thumb'].endFace});
 }
}
const report={};const thumbIds=[344,345,346,391,392,393],thumbRest=thumbIds.map(id=>byId(id).quaternion.clone());
a.teleport(-1.25,2.48);a.setTray({owner:'hero',phase:'',age:0,rescueAge:null});
for(const dinner of ['A','B','C']){a.setDinner(dinner);a.update(80,0);a.update(80.05,.05);const r=measure();report['stand-'+dinner]=r;twoHandHold(r,`Standing, dinner ${dinner}`);}

// Walking and turning: contact must hold on every sampled frame, not only one pose.
a.setDinner('A');a.setMove(1,0,true);let worst={pen:0,pads:Infinity,thumb:0};
for(let i=0;i<90;i++){a.update(90+i/60,1/60);if(i%15)continue;if(i===45)a.setMove(.6,.8,true);const r=measure();
 for(const side of ['L','R']){worst.pen=Math.max(worst.pen,...['palm',...fingers].map(k=>r[side+':'+k]?.maxPenMm||0));worst.pads=Math.min(worst.pads,sum(r,side,fingers,'touch'));worst.thumb=Math.max(worst.thumb,r[side+':thumb'].pen);worst.thumbMm=Math.max(worst.thumbMm||0,r[side+':thumb'].maxPenMm);(worst.frames??=[]).push([i,side,r[side+':thumb'].pen,r[side+':thumb'].maxPenMm,a.status.walkBlend?.toFixed?.(2)]);}}
a.setMove(0,0,false);report.walking=worst;
check('Walking/turning: worst finger/palm penetration stays <=5 mm',worst.pen<=5,worst);
check('Walking/turning: finger pads keep touching on every sampled frame',worst.pads>=25,worst);
check('Walking/turning: thumbs never bury into the tray (<=12 vertices deeper than 1 mm)',worst.thumb<=12,worst);

// One-hand carry (phone / handover): left hand under the middle, no thumb wrap; tray still carried.
a.teleport(-1.25,2.48);a.setDinner('A');a.setSceneAction({handover:true});a.update(100,0);a.update(100.05,.05);
{const r=measure();report.oneHand=r;const pen=Math.max(...['palm',...fingers].map(k=>r['L:'+k]?.maxPenMm||0));
 check('One-hand carry: left palm and four fingers under the tray without sinking (<=4 mm; excludes thumb)',pen<=4,{maxPenetrationMm:pen});
 check('One-hand carry: left finger pads touch the underside',sum(r,'L',fingers,'touch')>=40,{touching:sum(r,'L',fingers,'touch')});}
check('One-hand carry: thumb stays outside the slab (<=4 mm penetration)',report.oneHand['L:thumb'].maxPenMm<=4,report.oneHand['L:thumb']);
for(const variant of ['B','C']){a.setDinner(variant);a.update(101,0);a.update(101.05,.05);const r=measure();report['oneHand-'+variant]=r;check(`One-hand ${variant}: all hand regions, including thumb, stay within 4 mm penetration`,Math.max(...['palm','thumb',...fingers].map(k=>r['L:'+k].maxPenMm))<=4,r['L:thumb']);}
a.setSceneAction({photoLook:true});a.setDinner('A');a.update(102,.05);twoHandHold(measure(),'Photo review both hands');
a.setSceneAction({handover:false});

// Handoff to the dragon: no single-frame jump of the hand or the tray while the IK weight blends out.
a.teleport(-1.25,2.48);a.setDinner('A');a.setTray({owner:'hero',phase:'meal-handoff',age:0,rescueAge:null});
let prevHand=null,prevTray=null,maxHand=0,maxTray=0,handAt=null,trayAt=null,maxHold=0,contactStep=0,releasePath=0,prevThumbs=null,maxThumbStep=0,thumbStepAt=null;const hand=new T.Vector3();
for(let i=0;i<=84;i++){const age=i/60;a.setTray({owner:age>=.70?'dragon':'hero',phase:'meal-handoff',age,rescueAge:null});
 const h=a.heroPosition;a.setDragonProjectile([h[0],h[1]+.68,h[2]+1.252],0);a.setDragonHeading(Math.PI);a.setCompanionAction({kind:'normal',amount:0});/* same staging as mission-director meal-handoff */a.update(110+age,1/60);
 poses.wristL.bone.getWorldPosition(hand);const tray=new T.Vector3().fromArray(a.status.mealSupport);
 const thumbs=thumbIds.map(id=>byId(id).quaternion.clone());
 if(prevThumbs&&age>=.70){const step=Math.max(...thumbs.map((q,j)=>q.angleTo(prevThumbs[j])));if(step>maxThumbStep){maxThumbStep=step;thumbStepAt=age;}}
 prevThumbs=thumbs;
 if(prevHand&&i>2){const dh=hand.distanceTo(prevHand),dt=tray.distanceTo(prevTray);if(age<.70&&dh>maxHold)maxHold=dh;if(age>=.70&&age<=.72)contactStep=Math.max(contactStep,dh,dt);if(age>.72)releasePath+=dh;if(dh>maxHand){maxHand=dh;handAt=age;}if(dt>maxTray){maxTray=dt;trayAt=age;}}prevHand=hand.clone();prevTray=tray;}
report.handoff={holdingMaxWristStepMm:+(maxHold*1000).toFixed(1),contactFrameStepMm:+(contactStep*1000).toFixed(1),releaseWristPathMm:+(releasePath*1000).toFixed(0),maxWristStepMm:+(maxHand*1000).toFixed(1),atAge:handAt&&+handAt.toFixed(3),maxTrayStepMm:+(maxTray*1000).toFixed(1),trayAtAge:trayAt&&+trayAt.toFixed(3)};
report.thumbRelease={maxJointStepDegrees:+T.MathUtils.radToDeg(maxThumbStep).toFixed(2),atAge:thumbStepAt&&+thumbStepAt.toFixed(3)};
check('Handoff: thumb joints relax without a rotation snap (<=20 degrees per 1/60 s frame)',maxThumbStep<=T.MathUtils.degToRad(20),report.thumbRelease);
check('Handoff: after two setup frames, tray steps stay <=10 mm per 1/60 s, including the ownership change at 0.70 s',maxTray<=.010,report.handoff);
check('Handoff: at contact (0.70 s) neither wrist nor tray jumps more than 10 mm in a frame',contactStep<=.010,report.handoff);
check('Handoff: while still holding (<0.70 s) the wrist follows the tray smoothly (<=10 mm/frame)',maxHold<=.010,report.handoff);
a.setTray({owner:'hero',phase:'',age:0,rescueAge:null});a.setDinner(null);a.update(130,1/60);
{const drift=Math.max(...thumbIds.map((id,i)=>byId(id).quaternion.angleTo(thumbRest[i])));report.thumbReleaseRadians=+drift.toFixed(6);
 check('Without the tray the thumbs return exactly to their GLB rest rotation (no leftover wrap; <0.3 deg)',drift<.005,{maxAngleRadians:drift});}

const passed=checks.every(c=>c.passed);
await fs.mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../artifacts/tray-grip-check.json',import.meta.url),JSON.stringify({kind:'Node actual-GLB skinned-vertex contact checks; not a render or iPhone test',passed,checks,report},null,1)+'\n');
console.log(`Tray grip: ${checks.filter(c=>c.passed).length}/${checks.length} checks passed.`);
for(const c of checks.filter(c=>!c.passed))console.log('FAIL',c.name,JSON.stringify(c.detail));
if(!passed)process.exitCode=1;
