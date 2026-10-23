/**
 * Actual GLB geometry/skeleton and character-controller checks, without WebGL.
 * Image materials are removed from an IN-MEMORY test copy. Source GLB stays intact.
 * Canvas painting is stubbed; this script does not verify appearance or GPU speed.
 */
import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Resources } from '../src/resources.js';
import { buildPerformance } from '../src/performance.js';
import { makeLocomotion } from '../src/locomotion.js';
import { config } from '../src/config.js';

const checks=[];
function check(name,passed,detail=null){checks.push({name,passed,detail});}
const vector=()=>new T.Vector3();
const expectedHash='43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94';
const file=new URL('../public/models/zhuang-fangyi.glb',import.meta.url);
const bytes=await fs.readFile(file),hash=createHash('sha256').update(bytes).digest('hex');
check('Original GLB hash and byte count',hash===expectedHash&&bytes.length===7520868,{sha256:hash,bytes:bytes.length});

// Canvas pixels are irrelevant to these geometry and motion checks.
globalThis.ProgressEvent=class {constructor(type,props){this.type=type;Object.assign(this,props);}};
const context={createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),fillRect(){},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},stroke(){},roundRect(){},fill(){},ellipse(){}};
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})};

const jsonLength=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+jsonLength));
const binaryLength=bytes.readUInt32LE(20+jsonLength),binary=bytes.subarray(28+jsonLength,28+jsonLength+binaryLength);
json.buffers[0].uri=`data:application/octet-stream;base64,${binary.toString('base64')}`;
json.materials=json.materials.map(()=>({}));delete json.images;delete json.textures;delete json.samplers;
const gltf=await new GLTFLoader().parseAsync(JSON.stringify(json),'');
const root=new T.Group(),pivot=new T.Group(),actor=new T.Group();root.position.set(-1.25,.32,2.48);root.add(pivot);pivot.add(actor);actor.add(gltf.scene);pivot.rotation.y=.08;
gltf.scene.updateMatrixWorld(true);
const bounds=new T.Box3().setFromObject(gltf.scene,true),size=bounds.getSize(vector()),center=bounds.getCenter(vector()),scale=1.94/size.y;
actor.scale.setScalar(scale);actor.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
const bones=[];gltf.scene.traverse(n=>{if(n.isBone)bones.push(n);});
const byId=id=>bones.find(n=>gltf.parser.associations.get(n)?.nodes===id);
root.updateMatrixWorld(true);const poses={};
for(const [name,id]of Object.entries(config.zhuangNodes)){
  const bone=byId(id);if(!bone)continue;
  const inverse=bone.getWorldQuaternion(new T.Quaternion()).invert();
  poses[name]={bone,rest:bone.position.clone(),q:bone.quaternion.clone(),x:new T.Vector3(1,0,0).applyQuaternion(inverse),y:new T.Vector3(0,1,0).applyQuaternion(inverse),z:new T.Vector3(0,0,1).applyQuaternion(inverse)};
}
const scene=new T.Scene(),resources=new Resources(),a=buildPerformance({scene,r:resources,root,pivot,poses,eyelids:[],bones,byId,gltf});
check('All configured bone IDs exist',a.supported,{skinJoints:bones.length,configuredBones:Object.keys(config.zhuangNodes).length});
check('Existing cloth/hair/sleeve joints selected',a.status.clothJoints>=30,{secondaryJoints:a.status.clothJoints});

let maxIdle=0;const trace=[];
for(const t of [0,8,19,28,37.6,46,55]){
  a.update(t,0);maxIdle=Math.max(maxIdle,a.status.footDrift);
  trace.push({time:t,action:a.status.action,footTargetError:a.status.footDrift,pose:a.poseData});
}
check('Idle foot targets remain within 6 mm',maxIdle<.006,{maxFootTargetErrorMetres:maxIdle});
check('Head and wrist react to different beats',JSON.stringify(trace[0].pose.head)!==JSON.stringify(trace[2].pose.head)&&JSON.stringify(trace[0].pose.wrist)!==JSON.stringify(trace[3].pose.wrist));
check('Cloth joint actually changes its pose',JSON.stringify(trace[1].pose.cloth)!==JSON.stringify(trace[2].pose.cloth));

const start=a.position.clone(),restAnkleHeight=poses.footR.bone.getWorldPosition(vector()).y;
let maxWalk=0,actualLift=0,liftSample=null;
a.setMove(1,0,true);
for(let i=0;i<120;i++){
  const time=60+i/60;a.update(time,1/60);maxWalk=Math.max(maxWalk,a.status.footDrift);
  const left=poses.footL.bone.getWorldPosition(vector()).y,right=poses.footR.bone.getWorldPosition(vector()).y;
  actualLift=Math.max(actualLift,left-restAnkleHeight,right-restAnkleHeight);
  if(i===23)liftSample={time,phase:a.status.walkPhase,leftAnkleY:left,rightAnkleY:right,baselineAnkleY:restAnkleHeight,pose:a.poseData};
}
check('Walking changes position and hips/knees',a.position.distanceTo(start)>.8&&JSON.stringify(trace[0].pose.hip)!==JSON.stringify(a.poseData.hip)&&JSON.stringify(trace[0].pose.knee)!==JSON.stringify(a.poseData.knee),{distance:a.position.distanceTo(start)});
check('Walking swing foot lifts at about 60.38 seconds',Math.max(liftSample.leftAnkleY,liftSample.rightAnkleY)-restAnkleHeight>.045,liftSample);
check('Walking ankle target error remains within 2 cm',maxWalk<.02,{maxFootTargetErrorMetres:maxWalk,maxActualFootLiftMetres:actualLift});
a.setMove(0,0,false);for(let i=0;i<90;i++)a.update(62+i/60,1/60);
const stopped=a.position.clone();let stoppedDrift=0;
for(let i=0;i<120;i++){a.update(64+i/60,1/60);stoppedDrift=Math.max(stoppedDrift,a.status.footDrift);}
check('Walking stops and repins at new location',a.position.distanceTo(stopped)<.00001&&stoppedDrift<.006,{position:stopped.toArray(),maxFootTargetErrorMetres:stoppedDrift});

const food=root.children.find(n=>n.name==='food'),mealMeshCounts={};
for(const meal of ['A','B','C']){
  a.setDinner(meal);let count=0;const visible=food.children.filter(n=>n.visible);
  for(const n of visible)n.traverse(child=>{if(child.isMesh)count++;});mealMeshCounts[meal]=count;
  check(`Only meal ${meal} visible`,food.visible&&visible.length===1&&visible[0].name===`meal-${meal}`);
}
check('Three meal branches contain different props',new Set(Object.values(mealMeshCounts)).size===3,mealMeshCounts);
a.setDinner(null);check('Replay clears meal props',!food.visible&&a.status.dinner===null);
a.setGesture('phone',{speaker:'zhuang'});a.update(66.2,0);a.update(66.8,0);
check('Phone follows a real wrist during gesture',root.getObjectByName('phone').visible,{phonePosition:root.getObjectByName('phone').position.toArray()});
a.teleport(-1.25,2.48);check('Teleport resets heading and walking input',Math.abs(pivot.rotation.y-.08)<.000001&&!a.moving,{heading:pivot.rotation.y,position:a.position.toArray()});

const testRoot=new T.Group(),testPivot=new T.Group();testRoot.add(testPivot);const move=makeLocomotion(testRoot,testPivot);
move.setObstacles({obstacles:[],entrance:{minX:-1,maxX:.6,z:1.8}});
move.teleport(-.2,2.48);move.setMove(0,-1);for(let i=0;i<240;i++)move.update(1/60);
check('Doorway permits entry',testRoot.position.z<1.8);
move.teleport(-2,2.48);move.setMove(0,-1);for(let i=0;i<240;i++)move.update(1/60);
check('Closed frontage blocks walking through glass',testRoot.position.z>=2.065,{z:testRoot.position.z});
move.teleport(-.2,2.48);move.setMove(0,1);for(let i=0;i<240;i++)move.update(1/60);
check('Walking stays on raised awning surface',testRoot.position.z<=3.4,{maxZ:testRoot.position.z});
move.setObstacles([{x:0,z:2.6,w:1,d:.4}]);move.teleport(-1,2.6);move.setMove(1,0);for(let i=0;i<240;i++)move.update(1/60);
check('A counter/rack rectangle blocks movement',testRoot.position.x<=-.7,{x:testRoot.position.x});

a.dispose();resources.dispose();
const finalHash=createHash('sha256').update(await fs.readFile(file)).digest('hex');check('Original GLB unchanged after tests',finalHash===expectedHash);
const result={kind:'Node actual-GLB geometry, skeleton and controller checks; in-memory image materials removed and Canvas painting stubbed; not a render, GPU benchmark or iPhone test',passed:checks.every(c=>c.passed),checks,trace};
await fs.writeFile(new URL('../artifacts/actor-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,checks:checks.length,failed:checks.filter(c=>!c.passed),maxIdleFootError:maxIdle,maxWalkingFootError:maxWalk,secondaryJoints:a.status.clothJoints},null,2));
if(!result.passed)process.exitCode=1;
