import assert from 'node:assert/strict';
import * as T from 'three';
import fs from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Resources} from '../src/resources.js';
import {buildPerformance} from '../src/performance.js';
import {config} from '../src/config.js';
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
a.setCinematic({phase:'aim-final',elapsed:12.6,charge:1,height:4,distance:12});a.setDinner('A');a.setTray({owner:'helper',phase:'aim-final',age:12.6,rescueAge:12.6});a.update(300,1/60);root.updateMatrixWorld(true);

const bar=root.getObjectByName('dragon-grab-handle'),skinned=[];gltf.scene.traverse(n=>{if(n.isSkinnedMesh)skinned.push(n);});
let wholeMotionMax=0;
function measure(){
 root.updateMatrixWorld(true);
const barInverse=bar.matrixWorld.clone().invert(),radii=new T.Vector3(.14,.03,.04),v=new T.Vector3(),metrics={};
for(const m of skinned){m.skeleton.update();const sw=m.geometry.attributes.skinWeight,si=m.geometry.attributes.skinIndex;
 for(let i=0;i<sw.count;i++){
  let best=0,bw=0;for(let k=0;k<4;k++){const w=sw.getComponent(i,k);if(w>bw){bw=w;best=si.getComponent(i,k);}}
  const bone=m.skeleton.bones[best],id=gltf.parser.associations.get(bone)?.nodes;
  if(!(id>=344&&id<=364)||id===348)continue;
  const region=id<349?'thumb':Math.floor((id-349)/4),q=metrics[region]??={vertices:0,penetration:0,depth:0,gap:Infinity,front:0,back:0,below:0};
  m.getVertexPosition(i,v);v.applyMatrix4(m.matrixWorld).applyMatrix4(barInverse);q.vertices++;
  const dx=Math.max(Math.abs(v.x)-radii.x,0),dy=Math.max(Math.abs(v.y)-radii.y,0),dz=Math.max(Math.abs(v.z)-radii.z,0);
  const pillar=new T.Vector3(.12,-.16,-.02),half=new T.Vector3(.03,.15,.025);
  const ex=Math.max(Math.abs(v.x-pillar.x)-half.x,0),ey=Math.max(Math.abs(v.y-pillar.y)-half.y,0),ez=Math.max(Math.abs(v.z-pillar.z)-half.z,0);
  q.gap=Math.min(q.gap,Math.hypot(dx,dy,dz)*.59,Math.hypot(ex,ey,ez)*.59);
  const depth=Math.max(Math.min(radii.x-Math.abs(v.x),radii.y-Math.abs(v.y),radii.z-Math.abs(v.z)),Math.min(half.x-Math.abs(v.x-pillar.x),half.y-Math.abs(v.y-pillar.y),half.z-Math.abs(v.z-pillar.z)))*.59;
  if(depth>.002)q.penetration++;q.depth=Math.max(q.depth,depth);q.front+=Number(v.z>.04);q.back+=Number(v.z<-.04);q.below+=Number(v.y<-.03);
 }
}
wholeMotionMax=Math.max(wholeMotionMax,...Object.values(metrics).map(q=>q.depth));return metrics;
}
const metrics=measure();
console.log(JSON.stringify({metrics,contactError:a.status.catchGripError},null,2));


assert.ok(a.status.catchGripError<1e-6,'Red crossbar meets the palm-derived anchor, not the wrist');
for(const [region,m]of Object.entries(metrics)){assert.ok(m.depth<.003,region+': no deep skin penetration');assert.ok(m.gap<.004,region+': finger skin contacts crossbar within 4 mm');assert.ok(region==='thumb'?m.front>100:m.back>100,'Thumb and four fingers oppose each other across bar');}
const middleRest=byId(350).quaternion.clone();a.setCinematic(null);a.setTray({owner:'hero',phase:'ready',age:0,rescueAge:null});a.setDragonProjectile(null);a.update(301,1/60);assert.ok(byId(350).quaternion.angleTo(middleRest)>.1,'Release/reset restores finger joints for carrying');
console.log('Handle grip: real GLB skin contact and reset checks passed; not an iPhone render.');

// The public alignment helper must remain callable outside the update() scope.
assert.doesNotThrow(()=>a.alignDragonHand(a.dragonGripPosition, .5));
for(const hz of [30,60]){
 a.setCinematic(null);a.setTray({owner:'hero',phase:'ready',age:0,rescueAge:null});a.update(310,1/hz);
 let previous=null,maxStep=0,maxBoundary=0;
 for(let i=0;i<hz*3;i++){
  const age=i/hz;a.setCinematic({phase:'aim-final',elapsed:age,charge:1,height:4,distance:12});a.setDragonProjectile([-1,5.5,15],.65);a.setTray({owner:'dragon',phase:'aim-final',age,rescueAge:age});a.update(311+age,1/hz);
  if(age>=1.4&&age<=2.85){const m=measure();for(const [region,q]of Object.entries(m))assert.ok(q.depth<.003,'Attach '+hz+'Hz age='+age+' region='+region+' depth='+q.depth);}
  const p=new T.Vector3(...a.dragonPosition);if(previous&&age>1.4&&age<2.9){const step=p.distanceTo(previous);maxStep=Math.max(maxStep,step);if(age<1.4+1.1/hz||age>=2.8&&age<2.8+1.1/hz)maxBoundary=Math.max(maxBoundary,step);}previous=p;
 }
 assert.ok(maxBoundary<.035,'Attachment endpoints are continuous at 30/60 Hz: '+maxBoundary);assert.ok(maxStep*hz<4,'Capture moves at bounded speed, not a teleport: '+maxStep*hz);
 a.setCinematic({phase:'aim-final',elapsed:12.6,charge:1,height:4,distance:12});a.setTray({owner:'helper',phase:'aim-final',age:12.6,rescueAge:12.6});a.update(314,1/hz);
 const before=new T.Vector3(...a.dragonPosition);a.setCinematic({phase:'finisher',elapsed:0,charge:1,height:4,distance:12});a.setDragonProjectile(a.dragonPosition,.65);a.setTray({owner:'helper',phase:'finisher',age:0,rescueAge:3});a.update(314,0);
 assert.ok(before.distanceTo(new T.Vector3(...a.dragonPosition))<.06,'Release sequence starts at the held actor, not the old wrist origin: '+before.distanceTo(new T.Vector3(...a.dragonPosition)));
}
console.log('Alignment API, 30/60 Hz attach and finisher entry passed.');

for(const hz of [30,60])for(let i=0;i<hz*2;i++){
 const age=i/hz;a.setCinematic({phase:'finisher',elapsed:age,charge:1,height:4,distance:12});a.setDragonProjectile(a.dragonPosition,.65);a.setTray({owner:'helper',phase:'finisher',age,rescueAge:12.6+age});a.update(315+age,1/hz);
 const m=measure();for(const [region,q]of Object.entries(m))assert.ok(q.depth<.003,'Release '+hz+'Hz age='+age+' region='+region+' depth='+q.depth);
}
assert.ok(wholeMotionMax<.002,'Entire L-handle contact stays below 2mm: '+wholeMotionMax);console.log(JSON.stringify({wholeMotionMaxMm:wholeMotionMax*1000}));console.log('Complete 30/60 Hz attachment and release skin checks passed.');
