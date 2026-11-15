import assert from 'node:assert/strict';
import * as T from 'three';
import {xaihiBeat,singingBeat,bookLayout} from '../src/acting-beats.js';
import {cheerPose} from '../src/concert-stage.js';
import {buildConnectionStage} from '../src/connection-stage.js';
import {buildXaihi} from '../src/xaihi.js';
import {softenLipNormals} from '../src/face-normals.js';
import {Resources} from '../src/resources.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import fs from 'node:fs/promises';
let checks=0;const check=(name,ok)=>{assert.ok(ok,name);checks++;};
for(const hz of [30,60]){
 let prev=null;
 for(let i=0;i<hz*60;i++){const s=singingBeat(i/hz);if(prev)for(const k of ['x','y','roll','pitch','armL','armR'])check('Singing has no discontinuity at phrase boundaries',Math.abs(s[k]-prev[k])<.05);prev={...s};}
 for(let i=0;i<8;i++){let prev=cheerPose(0,i);for(let k=1;k<hz*25;k++){let p=cheerPose(k/hz,i);check('Waving has continuous wrists',Math.abs(p.wrist-prev.wrist)<.04&&Math.abs(p.roll-prev.roll)<.06);prev=p;}}
}
for(const k of ['x','y','roll','pitch','armL','armR'])check('Reduced motion freezes '+k,singingBeat(0,true)[k]===singingBeat(14,true)[k]);
const poses=['satisfied','avert','side-eye'].map(c=>xaihiBeat(c,1.5));check('Three intentions have different eyes/head/board',new Set(poses.map(p=>[p.eyeYaw,p.headYaw,p.tabletLift].join())).size===3);
check('Eyes lead shoulders',xaihiBeat('avert',.12).eye>0&&xaihiBeat('avert',.12).body===0);
globalThis.ProgressEvent=class{constructor(t,p){Object.assign(this,p)}};
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:()=>({width:40})},{get:(o,k)=>o[k]??(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx,width:256,height:256})};
const resources=new Resources(),stage=buildConnectionStage(new T.Scene(),resources);
for(const age of [.0,.5,.85,1.4,2.7,4.9]){stage.update(age,1/60,{phase:'terminal-deploy',phaseElapsed:age,clock:age});stage.root.updateMatrixWorld(true);check('Shot/hand target matches the actual book world transform',new T.Vector3(...stage.bookPositionAt(age)).distanceTo(new T.Vector3(...stage.state.bookPosition))<1e-6);}
check('Book begins near the free palm',bookLayout(0).scale<.4);stage.reset();check('Reset hides the book stage',!stage.root.visible);
const bytes=await fs.readFile(new URL('../public/models/xaihi.glb',import.meta.url)),len=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+len)),binary=bytes.subarray(28+len,28+len+bytes.readUInt32LE(20+len));
json.buffers[0].uri='data:application/octet-stream;base64,'+binary.toString('base64');json.materials=json.materials.map(()=>({}));delete json.images;delete json.textures;delete json.samplers;
const raw=await new GLTFLoader().parseAsync(JSON.stringify(json),'');raw.scene.traverse(n=>{if(!n.isMesh||raw.parser.associations.get(n.material)?.materials!==0)return;const source=n.geometry,copy=softenLipNormals(source);check('Lip normal repair affects only the runtime clone',copy!==source&&copy.userData.lipNormalsSoftened>0);check('Lip repair preserves all model positions',copy.attributes.position.count===source.attributes.position.count&&copy.attributes.position.array.every((v,i)=>v===source.attributes.position.array[i]));for(let i=0;i<source.attributes.normal.count;i++)if(source.attributes.normal.getZ(i)<=.12)check('Mouth cavity normals remain unchanged',copy.attributes.normal.getX(i)===source.attributes.normal.getX(i)&&copy.attributes.normal.getY(i)===source.attributes.normal.getY(i)&&copy.attributes.normal.getZ(i)===source.attributes.normal.getZ(i));copy.dispose();});
const gltf=raw,actor=buildXaihi(new T.Scene(),resources,gltf),board=actor.root.getObjectByName('xaihi-terminal');let time=0,previous=null,maxStep=0,maxPalmError=0;
for(const cue of ['satisfied','avert','song','side-eye'])for(let i=0;i<70;i++){
 time+=1/60;actor.update(time,1/60,{phase:'hack',tablet:{age:4,stage:cue==='satisfied'?'success':'hot',dialogue:{cue},dialogueAge:i/60}});actor.root.updateMatrixWorld(true);let s=actor.state;
 const target=board.localToWorld(new T.Vector3(.145,-.070,-.022));maxPalmError=Math.max(maxPalmError,target.distanceTo(new T.Vector3(...s.palmPositions[0])));
 if(previous)maxStep=Math.max(maxStep,new T.Vector3(...s.handPositions[1]).distanceTo(previous));previous=new T.Vector3(...s.handPositions[1]);
}
check('Left palm stays attached to the moving tablet',maxPalmError<.004);check('Free-hand cue transitions do not jump',maxStep<.07);
const frozen=actor.state.pose.head;actor.update(time,0,{phase:'hack',tablet:{stage:'hot',dialogue:{cue:'side-eye'},dialogueAge:69/60}});check('Paused head does not snap',JSON.stringify(frozen)===JSON.stringify(actor.state.pose.head));
actor.reset();check('Reset hides the tablet',!actor.state.phoneVisible);actor.dispose();resources.dispose();console.log(JSON.stringify({checks,maxPalmError,maxStep}));
