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
import { makeFollower } from '../src/follower.js';
import { config } from '../src/config.js';
import {buildSiegeEffects} from '../src/siege-effects.js';
import {buildXaihi} from '../src/xaihi.js';

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
let maxWalk=0,actualLift=0,liftSample=null,maxArmL=0,maxArmR=0;
const neutralArmL=poses.armL.bone.quaternion.clone(),neutralArmR=poses.armR.bone.quaternion.clone();
a.setMove(1,0,true);
for(let i=0;i<120;i++){
  const time=60+i/60;a.update(time,1/60);maxWalk=Math.max(maxWalk,a.status.footDrift);
  const left=poses.footL.bone.getWorldPosition(vector()).y,right=poses.footR.bone.getWorldPosition(vector()).y;
  actualLift=Math.max(actualLift,left-restAnkleHeight,right-restAnkleHeight);
  maxArmL=Math.max(maxArmL,neutralArmL.angleTo(poses.armL.bone.quaternion));maxArmR=Math.max(maxArmR,neutralArmR.angleTo(poses.armR.bone.quaternion));
  if(i===23)liftSample={time,phase:a.status.walkPhase,leftAnkleY:left,rightAnkleY:right,baselineAnkleY:restAnkleHeight,pose:a.poseData};
}
check('Walking changes position and hips/knees',a.position.distanceTo(start)>.8&&JSON.stringify(trace[0].pose.hip)!==JSON.stringify(a.poseData.hip)&&JSON.stringify(trace[0].pose.knee)!==JSON.stringify(a.poseData.knee),{distance:a.position.distanceTo(start)});
check('Walking swing foot lifts at about 60.38 seconds',Math.max(liftSample.leftAnkleY,liftSample.rightAnkleY)-restAnkleHeight>.045,liftSample);
check('Walking ankle target error remains within 2 cm',maxWalk<.02,{maxFootTargetErrorMetres:maxWalk,maxActualFootLiftMetres:actualLift});
check('Real shoulder bones have a small, asymmetric walking excursion',maxArmL>.025&&maxArmR>.025&&maxArmL<.15&&maxArmR<.15&&Math.abs(maxArmL-maxArmR)>.005,{leftPeakRadians:maxArmL,rightPeakRadians:maxArmR});
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
const mealSignatures=food.children.map(group=>{const parts=[];group.traverse(n=>{if(n.isMesh)parts.push([n.geometry.type,n.material.color?.getHex(),n.scale.toArray()]);});return JSON.stringify(parts);});check('Three meal branches contain different props',new Set(mealSignatures).size===3,mealMeshCounts);
a.setDinner(null);check('Replay clears meal props',!food.visible&&a.status.dinner===null);
a.setGesture('phone',{speaker:'zhuang'});a.update(66.2,0);a.update(66.8,0);
check('Phone follows a real wrist during gesture',root.getObjectByName('phone').visible,{phonePosition:root.getObjectByName('phone').position.toArray()});
a.teleport(-1.25,2.48);check('Teleport resets heading and walking input',Math.abs(pivot.rotation.y-.08)<.000001&&!a.moving,{heading:pivot.rotation.y,position:a.position.toArray()});
a.setDinner('A');a.update(70,0);const heldArm=poses.armL.bone.quaternion.clone();let heldExcursion=0;a.setMove(1,0,true);
for(let i=0;i<120;i++){a.update(70+i/60,1/60);heldExcursion=Math.max(heldExcursion,heldArm.angleTo(poses.armL.bone.quaternion));}
check('The food-holding shoulder stays protected while walking',heldExcursion<maxArmL*.3,{heldPeakRadians:heldExcursion,freePeakRadians:maxArmL});
a.setMove(0,0,false);a.teleport(-1.25,2.48);a.setDinner(null);

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

function followScenario(start,waypoints,layout=null){
  const owner=new T.Group(),facing=new T.Group();owner.add(facing);owner.position.set(start[0],.32,start[1]);
  const controller=makeLocomotion(owner,facing);if(layout)controller.setObstacles(layout);
  const follower=makeFollower(owner.position,controller),modes={},snapshots=[];let time=0,minimumGap=Infinity,maximumGap=0,collisions=0,largestStep=0,doorX=null,settleTravel=0;
  let lastX=follower.state.position[0],lastZ=follower.state.position[2];
  function tick(x,z,settling=false){
    controller.setMove(x,z,true);controller.update(1/60);follower.update(1/60,time+=1/60);
    const s=follower.state,px=s.position[0],pz=s.position[2],step=Math.hypot(px-lastX,pz-lastZ);
    modes[s.mode]=(modes[s.mode]||0)+1;minimumGap=Math.min(minimumGap,s.distance);maximumGap=Math.max(maximumGap,s.distance);largestStep=Math.max(largestStep,step);
    if(!controller.free(px,pz,.27))collisions++;if(lastZ>=1.8&&pz<1.8)doorX=px;if(settling)settleTravel+=step;lastX=px;lastZ=pz;
  }
  let reached=true;for(const [x,z]of waypoints){let arrived=false;for(let i=0;i<900;i++){const dx=x-owner.position.x,dz=z-owner.position.z,d=Math.hypot(dx,dz);if(d<.05){arrived=true;break;}tick(dx/d,dz/d);}reached&&=arrived;snapshots.push({owner:owner.position.toArray(),companion:structuredClone(follower.state)});}
  for(let i=0;i<420;i++)tick(0,0,true);
  const result={reached,minimumGap,maximumGap,collisions,largestStep,doorX,settleTravel,modes,final:structuredClone(follower.state),owner:owner.position.toArray(),snapshots};
  const beforePause=[...follower.state.position],phaseBefore=follower.state.phase;follower.update(0,time+100);result.paused=beforePause.every((v,i)=>v===follower.state.position[i])&&phaseBefore===follower.state.phase;
  controller.teleport(start[0],start[1]);follower.reset();result.resetHeading=follower.state.heading;result.resetDistance=follower.state.distance;return result;
}
const doorFollow=followScenario([-1.25,2.48],[[-.2,2.48],[-.2,.75],[-1.2,.75]]);
check('Companion follows turns through the actual doorway without collisions',doorFollow.reached&&doorFollow.collisions===0&&doorFollow.doorX!==null&&doorFollow.doorX>-.73&&doorFollow.doorX<.33,doorFollow);
check('Companion hesitates, catches up, uses single file, then settles',doorFollow.modes.hesitate>0&&doorFollow.modes['catch-up']>0&&doorFollow.modes['single-file']>0&&doorFollow.modes.settle>0&&doorFollow.final.mode==='idle');
check('Companion maintains space and moves continuously in world space',doorFollow.minimumGap>=.55&&doorFollow.maximumGap<1.6&&doorFollow.largestStep<.025,{minimumGap:doorFollow.minimumGap,maximumGap:doorFollow.maximumGap,largestStep:doorFollow.largestStep});
check('Companion keeps walking after owner stops, then stops its gait',doorFollow.settleTravel>.3&&doorFollow.final.speed===0&&doorFollow.final.walk<.001,{settleTravel:doorFollow.settleTravel,finalPhase:doorFollow.final.phase});
check('Companion freezes with a paused clock and resets on teleport',doorFollow.paused&&Math.abs(doorFollow.resetHeading-.08)<.00001&&doorFollow.resetDistance>.6&&doorFollow.resetDistance<.9);
const yieldingFollow=followScenario([-1.25,2.48],[[-3,2.48]]);
check('Companion yields when the owner walks toward it',yieldingFollow.reached&&yieldingFollow.minimumGap>=.55&&yieldingFollow.collisions===0&&yieldingFollow.modes.yield>0,yieldingFollow);
const rackFollow=followScenario([-1.15,-.5],[[-1.15,.9],[1.15,.9],[1.15,-.5]],{obstacles:[{x:0,z:0,w:.8,d:.9}],entrance:{minX:-1,maxX:.6,z:10}});
check('Companion routes around a shelf instead of cutting the corner',rackFollow.reached&&rackFollow.collisions===0&&rackFollow.largestStep<.025&&rackFollow.minimumGap>=.55&&rackFollow.final.mode==='idle',rackFollow);


// V6 cinematic uses the real rig and companion. No browser or image assertions.
a.teleport(-1.25,3.25);a.setDinner('A');const grounded=a.position.clone();
a.setCinematic({phase:'charge',elapsed:0,charge:0});a.update(100,1/60);
check('Cinematic charge begins on the ground',Math.abs(a.heroPosition[1]-.32)<.001&&a.position.distanceTo(grounded)<.001);
a.setCinematic({phase:'charge',elapsed:30,charge:1});a.update(130,1/60);
check('Only the hero lifts and clears the canopy',a.heroPosition[1]>2.99&&a.heroPosition[2]>4.4&&a.position.distanceTo(grounded)<.001,{hero:a.heroPosition,root:a.position.toArray()});
check('Companion remains on the ground during charging',Math.abs(a.dragonPosition[1]-.325)<.001,{dragon:a.dragonPosition});
a.setCinematic({phase:'combat',charge:1,distance:12,height:4,recoil:0});a.update(130.1,1/60);
const farHero=[...a.heroPosition],unrecoiledArm=poses.elbowR.bone.quaternion.clone();
check('V7 casting clears the road by twelve metres without moving the walking root',Math.abs(farHero[2]-(grounded.z+12))<.001&&farHero[1]>4.29&&a.position.distanceTo(grounded)<.001,{hero:farHero,walkingRoot:a.position.toArray()});
a.setCinematic({phase:'combat',charge:1,distance:12,height:4,recoil:1});a.update(130.2,1/60);
check('Shot recoil displaces the original body and bends its real elbow',a.heroPosition[2]-farHero[2]>.6&&unrecoiledArm.angleTo(poses.elbowR.bone.quaternion)>.3,{bodyRetreat:a.heroPosition[2]-farHero[2],elbowRadians:unrecoiledArm.angleTo(poses.elbowR.bone.quaternion)});

check('Food moves off the casting hero',!food.visible&&root.getObjectByName('dragon').getObjectByName('food').visible);
a.setCinematic({phase:'finisher',elapsed:2,charge:1});a.setDragonProjectile([2,5,1],.4);a.update(132,1/60);
check('Actual companion follows explicit projectile world coordinates',a.dragonPosition.every((v,i)=>Math.abs(v-[2,5,1][i])<.00001),{dragon:a.dragonPosition});
check('Projectile companion releases its food',!root.getObjectByName('dragon').getObjectByName('food').visible&&food.visible);
a.setDragonProjectile(null);a.setCinematic({phase:'landing',elapsed:3,charge:1});a.update(135,1/60);a.setCinematic(null);a.update(136,1/60);
check('Landing restores the original visual placement and foot pinning',pivot.position.length()<.00001&&a.status.footDrift<.006&&food.visible,{pivot:pivot.position.toArray(),drift:a.status.footDrift});
check('Landing restores companion to ground follower',Math.abs(a.dragonPosition[1]-.325)<.001&&!a.status.cinematic.dragonProjectile);
const fx=buildSiegeEffects(scene,resources),fxInput={phase:'charge',elapsed:18,charge:.6,hero:a.heroPosition,dragon:a.dragonPosition,target:[0,4.2,1.3]};
fx.update(1,1/60,fxInput);check('Charge FX uses one reusable burst light',fx.state.active&&scene.children.filter(n=>n.isLight).length===1&&scene.getObjectByName('cannon-shared-burst-light')?.isPointLight);
const allocationCount=resources.items.size;fx.fire({from:[-1,4,4],to:[0,4,1],power:1});
for(let n=0;n<100;n++)fx.update(1+n/60,1/60,fxInput);
check('FX pool allocates no new resources while animating',resources.items.size===allocationCount,{before:allocationCount,after:resources.items.size});
check('FX active particles stay within the selected quality cap',fx.state.particles<=fx.state.particleLimit,fx.state);
fx.reset();fx.update(4,1/60,{phase:'combat',hero:a.heroPosition,target:[0,1.2,0]});fx.fire({from:[-1,4,4],to:[0,1,0],finisher:true});fx.update(5.4,1/60,{phase:'finisher',elapsed:3.4,hero:a.heroPosition,dragon:a.dragonPosition,target:[0,1,0]});
check('Finisher beam awaits the explicit collision impact',fx.state.beams===1&&fx.state.pulses===0,fx.state);
fx.impact([0,1,0],1.5);fx.update(5.5,1/60,{phase:'finisher',elapsed:4.9,hero:a.heroPosition,dragon:a.dragonPosition,target:[0,1,0]});check('Explicit finisher impact creates a pooled pulse',fx.state.pulses===1,fx.state);
check('A final impact respects its smoke budget and reuses the single burst light',fx.state.smoke>=4&&fx.state.smoke<=fx.state.qualityCaps.smoke&&resources.items.size===allocationCount&&scene.children.filter(n=>n.isLight).length===1&&scene.getObjectByName('cannon-shared-burst-light')?.isPointLight,fx.state);

fx.quality('low');fx.update(5.6,1/60,{});check('Low FX quality caps the particle pool at thirty-six',fx.state.particleLimit===36&&fx.state.particles<=36,fx.state);
fx.reset();check('FX reset clears every active effect',!fx.root.visible&&fx.state.beams===0&&fx.state.particles===0&&fx.state.pulses===0&&fx.state.smoke===0,fx.state);fx.dispose();

// V8 connection float starts quickly, pauses and can be sampled backward.
a.setCinematic(null);a.teleport(-1.25,3.25);a.setDinner(null);
a.setCinematic({phase:'login',elapsed:0,castingElapsed:0,distance:0,height:1.2});a.update(200,0);const floatStart=[...a.heroPosition];
a.setCinematic({phase:'login',elapsed:.8,castingElapsed:.8,distance:0,height:1.2});a.update(200.8,0);const quickFloat=[...a.heroPosition];
check('Login rapidly lifts the real hero 1.2 metres without lateral travel',Math.abs(quickFloat[1]-floatStart[1]-1.2)<.03&&Math.abs(quickFloat[2]-floatStart[2])<.001,{start:floatStart,quick:quickFloat});
a.setCinematic({phase:'captcha',elapsed:0,castingElapsed:5,distance:0,height:1.2});a.update(201,0);
check('Captcha preserves the connection hover instead of dropping the hero',Math.abs(a.heroPosition[1]-quickFloat[1])<.06&&Math.abs(a.heroPosition[2]-quickFloat[2])<.001,{hero:a.heroPosition});
a.setCinematic({phase:'charge',elapsed:0,castingElapsed:30,launchOverride:.4,distance:12,height:4});a.update(202,0);
check('Director override samples exact rewind lift and travel',Math.abs(a.heroPosition[1]-(.32+1.6))<.03&&Math.abs(a.heroPosition[2]-(3.25+4.8))<.001,{hero:a.heroPosition});
a.setCinematic(null);a.setSmile(0);a.update(203,0);
const skinMeshes=[];root.traverse(n=>{if(n.isSkinnedMesh)skinMeshes.push(n);});
function skinSnapshot(){root.updateMatrixWorld(true);for(const mesh of skinMeshes)mesh.skeleton.update();const list=[];for(const mesh of skinMeshes){const points=new Float32Array(mesh.geometry.attributes.position.count*3);for(let i=0;i<mesh.geometry.attributes.position.count;i++){mesh.getVertexPosition(i,footPoint);mesh.localToWorld(footPoint);points.set(footPoint.toArray(),i*3);}list.push(points);}return list;}
const footPoint=vector(),neutralFace=skinSnapshot(),neutralCorners=a.poseData.smileCorners;
a.setSmile(1);a.update(203,0);const smilingFace=skinSnapshot(),smilingCorners=a.poseData.smileCorners;
let maxFaceShift=0,maxBodyShift=0,movedFaceVertices=0;
for(let mesh=0;mesh<neutralFace.length;mesh++)for(let i=0;i<neutralFace[mesh].length;i+=3){const before=neutralFace[mesh],after=smilingFace[mesh],distance=Math.hypot(after[i]-before[i],after[i+1]-before[i+1],after[i+2]-before[i+2]);if(before[i+1]>1.7){maxFaceShift=Math.max(maxFaceShift,distance);if(distance>.00005)movedFaceVertices++;}else if(before[i+1]<1.55)maxBodyShift=Math.max(maxBodyShift,distance);}
check('C smile moves weighted original face vertices by a restrained amount',a.status.smile===1&&movedFaceVertices>10&&maxFaceShift>.0002&&maxFaceShift<.006&&maxBodyShift<.00001,{movedFaceVertices,maxFaceShift,maxBodyShift});
check('C smile has a slightly stronger left mouth corner',smilingCorners[0][1]-neutralCorners[0][1]>smilingCorners[1][1]-neutralCorners[1][1]&&smilingCorners[1][1]>neutralCorners[1][1],{neutralCorners,smilingCorners});
a.setDinner(null);a.update(203,0);const resetFace=skinSnapshot();let restoredError=0;for(let m=0;m<neutralFace.length;m++)for(let i=0;i<neutralFace[m].length;i++)restoredError=Math.max(restoredError,Math.abs(neutralFace[m][i]-resetFace[m][i]));
check('Replay clears smile and restores original face coordinates',a.status.smile===0&&restoredError<.000001,{restoredError});
a.setCompanionAction({kind:'key',amount:.7});a.setDragonProjectile([1,.7,2],0);a.update(204,0);
check('Keyboard override preserves an alert non-ammunition companion',a.status.companionAction==='key'&&a.status.companionExpression!=='shock'&&a.dragonPosition.every((v,i)=>Math.abs(v-[1,.7,2][i])<.00001),{action:a.status.companionAction,expression:a.status.companionExpression,dragon:a.dragonPosition});
a.setCompanionAction({kind:'lever',amount:.7});a.update(204.2,0);check('Lever action gives the original dragon an exertion expression',a.status.companionExpression==='doubt');
a.setCompanionAction({kind:'shock',amount:1});a.update(204.3,0);check('Ammunition shock uses the curved dragon face',a.status.companionExpression==='shock');a.setCompanionAction(null);a.setDragonProjectile(null);

// The uploaded Xaihi is parsed as a real rig, with materials removed only in memory.
const xaihiFile=new URL('../source-assets/xaihi-original.glb',import.meta.url),xaihiBytes=await fs.readFile(xaihiFile),xaihiHash=createHash('sha256').update(xaihiBytes).digest('hex');
check('Uploaded Xaihi original hash and byte count',xaihiBytes.length===8029820&&xaihiHash==='f953e5890ed0b208d02e59581b3ddee60650cd2646cf94a4324f1e15e5404a68');
const xjsonLength=xaihiBytes.readUInt32LE(12),xjson=JSON.parse(xaihiBytes.subarray(20,20+xjsonLength)),xbinLength=xaihiBytes.readUInt32LE(20+xjsonLength),xbin=xaihiBytes.subarray(28+xjsonLength,28+xjsonLength+xbinLength);
xjson.buffers[0].uri=`data:application/octet-stream;base64,${xbin.toString('base64')}`;xjson.materials=xjson.materials.map(()=>({}));delete xjson.images;delete xjson.textures;delete xjson.samplers;
const xgltf=await new GLTFLoader().parseAsync(JSON.stringify(xjson),''),xaihi=buildXaihi(scene,resources,xgltf);
const xSkeletons=new Set();xgltf.scene.traverse(n=>{if(n.isSkinnedMesh)xSkeletons.add(n.skeleton);});
let disposedBoneTextures=0;for(const skeleton of xSkeletons){skeleton.computeBoneTexture();skeleton.boneTexture.addEventListener('dispose',()=>disposedBoneTextures++);}
check('Xaihi GPU skinning textures share the world resource lifecycle',[...xSkeletons].every(skeleton=>resources.items.has(skeleton)),{skeletons:xSkeletons.size});
check('Xaihi is lazy-hidden outside the VCR',xaihi.loaded&&!xaihi.root.visible&&xaihi.state.bones===960,xaihi.state);
xaihi.update(1,0,{phase:'flashback',node:{gesture:'phone'}});const xPose1=xaihi.state.pose;
check('The original Xaihi appears with a wrist-mounted terminal',xaihi.root.visible&&xaihi.state.action==='terminal'&&xaihi.state.phoneVisible&&!xaihi.state.mealVisible,xaihi.state);
xaihi.update(1.31,0,{phase:'heat',node:{gesture:'phone'}});
check('CCTV operation animates actual Xaihi wrist and head bones',xaihi.state.action==='microwave'&&JSON.stringify(xPose1.wrist)!==JSON.stringify(xaihi.state.pose.wrist)&&JSON.stringify(xPose1.head)!==JSON.stringify(xaihi.state.pose.head),xaihi.state.pose);
xaihi.update(2,0,{phase:'flashback-end'});check('Xaihi can hold her lunch after the successful heat',xaihi.state.mealVisible&&!xaihi.state.phoneVisible&&xaihi.state.action==='receive-lunch');
xaihi.update(3,0,{phase:'combat'});check('Returning to main story hides Xaihi without a second renderer',!xaihi.root.visible);
xaihi.reset();check('Xaihi reset clears VCR props and pose',!xaihi.state.visible&&!xaihi.state.phoneVisible&&!xaihi.state.mealVisible&&xaihi.state.action==='waiting');
xaihi.dispose();check('Xaihi dispose detaches its scene root and reports unloaded',!xaihi.root.parent&&!xaihi.loaded&&!xaihi.state.loaded);
check('The uploaded Xaihi GLB remains unchanged after runtime posing',createHash('sha256').update(await fs.readFile(xaihiFile)).digest('hex')===xaihiHash);

a.dispose();resources.dispose();
check('World disposal releases every Xaihi skinning texture',disposedBoneTextures===xSkeletons.size&&[...xSkeletons].every(skeleton=>skeleton.boneTexture===null),{disposedBoneTextures,skeletons:xSkeletons.size});
const finalHash=createHash('sha256').update(await fs.readFile(file)).digest('hex');check('Original GLB unchanged after tests',finalHash===expectedHash);
const result={kind:'Node actual-GLB geometry, skeleton, controller, cinematic and pooled FX checks; in-memory image materials removed and Canvas painting stubbed; not a render, GPU benchmark or iPhone test',passed:checks.every(c=>c.passed),checks,trace};
await fs.writeFile(new URL('../artifacts/v13-actor-check.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({passed:result.passed,checks:checks.length,failed:checks.filter(c=>!c.passed),maxIdleFootError:maxIdle,maxWalkingFootError:maxWalk,secondaryJoints:a.status.clothJoints},null,2));
if(!result.passed)process.exitCode=1;
