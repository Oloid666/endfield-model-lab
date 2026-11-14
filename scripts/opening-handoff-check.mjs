import assert from 'node:assert/strict';
import {openingHandoff,OPENING_HANDOFF,DIRECTOR_BEAT} from '../src/opening-handoff.js';
import {MissionMachine} from '../src/mission-state.js';
import {ShoppingJourney} from '../src/shopping-journey.js';
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

// This fixture keeps original skin weights and meshes; material images alone are omitted in memory.
a.teleport(-1.25,3.25);a.setCinematic(null);a.setGesture('look',{speaker:'zhuang'});
const donor=root.getObjectByName('dragon'),body=donor.children[0],base=[-2.55,1.5,3.5],heroYaw=-.65;
const target=[-1.25+Math.sin(heroYaw)*.65,.32,3.25+Math.cos(heroYaw)*.65],yaw=Math.atan2(target[0]-base[0],target[2]-base[2]);
const raw=new T.Vector3(),inverseBranch=new T.Matrix4(),toBody=new T.Matrix4();
const traces=[];
for(const branch of ['A','B','C'])for(const hz of [30,60]){
 a.setSceneAction({});a.update(0,0);a.setDinner(branch);let previous=null,maxTrayStep=0,maxWristStep=0,minBodyNorm=Infinity,maxPen=0,maxContactError=0,previousWrist=null;
 for(let i=0;i<=Math.ceil(OPENING_HANDOFF.duration*hz);i++){
  const age=Math.min(OPENING_HANDOFF.duration,i/hz),f=openingHandoff(age);
  a.setTray({owner:f.owner,phase:'walk-out',age:5.2+age,rescueAge:null});a.setSceneAction({opening:{position:base,handoff:true,handoffElapsed:age},heading:heroYaw,mealVisible:true});
  a.setDragonProjectile([base[0]+Math.sin(yaw)*.35*f.returnBody,base[1]-.18*f.returnBody,base[2]+Math.cos(yaw)*.35*f.returnBody],0);a.setDragonHeading(yaw);a.update(50+age,1/hz);root.updateMatrixWorld(true);
  const tray=[...a.status.mealSupport],wrist=poses.wristL.bone.getWorldPosition(new T.Vector3());
  if(previous)maxTrayStep=Math.max(maxTrayStep,new T.Vector3(...tray).distanceTo(new T.Vector3(...previous)));
  if(previousWrist)maxWristStep=Math.max(maxWristStep,wrist.distanceTo(previousWrist));previous=tray;previousWrist=wrist;
  if(age>=1.5&&age<=2.1)maxContactError=Math.max(maxContactError,...a.status.handSupportErrors);
  // Exact tray slab in the dragon body's ellipsoid frame. Sample its interior, not only corners.
  const slabInfo=slab();inverseBranch.copy(slabInfo.inverse).invert();toBody.copy(body.matrixWorld).invert().multiply(inverseBranch);
  for(let x=0;x<=8;x++)for(let z=0;z<=4;z++){
   raw.set(T.MathUtils.lerp(slabInfo.box.min.x,slabInfo.box.max.x,x/8),slabInfo.box.min.y,T.MathUtils.lerp(slabInfo.box.min.z,slabInfo.box.max.z,z/4)).applyMatrix4(toBody);
   minBodyNorm=Math.min(minBodyNorm,(raw.x/.56)**2+((raw.y-.63)/.59)**2+(raw.z/.49)**2);
  }
  if(hz===30||age>=1.3&&age<=2.2){const result=measure();maxPen=Math.max(maxPen,...Object.values(result).map(q=>q.maxPenMm));}
 }
 check(branch+' '+hz+'Hz: no tray step exceeds3cm',maxTrayStep<.03,{maxTrayStep});
 check(branch+' '+hz+'Hz: continuous left hand (under5cm per frame)',maxWristStep<.05,{maxWristStep});
 check(branch+' '+hz+'Hz: both palms actually reach during shared support',maxContactError<.004,{maxContactError});
 check(branch+' '+hz+'Hz: slab does not enter the donor body',minBodyNorm>=1,{minBodyNorm});
 check(branch+' '+hz+'Hz: real hand skin does not deeply penetrate tray',maxPen<=4,{maxPen});
 traces.push({branch,hz,maxTrayStep,maxWristStep,maxContactError,minBodyNorm,maxPen});
}
for(const hz of [30,60]){
 const m=new MissionMachine();m.branch='A';m.phaseTo('walk-out');
 for(let i=0;i<10*hz&&m.phase==='walk-out';i++){
  m.update(m.sourceTime+1/hz);if(m.phase==='walk-out'){check('No completed-meal quote before handoff ends',!m.state.text.includes('買完了'));if(m.state.shopping.handoff)check('Owner follows shared contact timeline',m.trayOwner===openingHandoff(m.state.shopping.handoffElapsed).owner);}
 }
 check('Shopping ends with hero and original quote',m.phase==='photo-pose'&&m.trayOwner==='hero'&&m.state.text==='買完了，來吃吧。');
 m.phaseTo('director-reminder');m.update(m.sourceTime+4.79);check('Director reply does not cut the reminder short',m.node?.id!=='director_reminder_1');m.update(m.sourceTime+.02);check('Director voice is identified correctly',m.node?.speaker==='director');m.setPaused(true);const age=m.state.phaseElapsed;m.update(m.sourceTime+50);check('Background holds director timing',m.state.phaseElapsed===age);m.setPaused(false);m.update(m.sourceTime+DIRECTOR_BEAT.duration-age+.001);check('Director ends at the shoe gate',m.phase==='shoe-view');m.replay();check('Replay clears donor ownership',m.phase==='ready'&&m.trayOwner==='hero');
}
console.log(JSON.stringify({traces,failed:checks.filter(q=>!q.passed)},null,2));assert.ok(checks.every(q=>q.passed),'Opening continuous geometry/state checks failed');console.log('Opening handoff: '+checks.length+' checks passed.');
