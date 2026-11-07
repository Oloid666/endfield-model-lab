import assert from 'node:assert/strict';
import * as T from 'three';
import {RhythmHeat} from '../src/rhythm-heat.js';
import {endingTitle,FAKE_END_DURATION} from '../src/ending-title.js';
import {cheerPose,buildConcertStage} from '../src/concert-stage.js';
import {buildMicrowave} from '../src/microwave.js';
import {Resources} from '../src/resources.js';

let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
for(const [age,text]of [[0,'Fin.'],[1.2,'Fin..'],[1.65,'Fin...'],[2.1,'Fin....'],[2.55,'Fin....?']])check('Ending punctuation at '+age,endingTitle(age)===text);
check('Question mark receives a full reading hold',Math.abs(FAKE_END_DURATION-2.55-1.5)<1e-9);
for(const hz of [30,60]){
 const r=new RhythmHeat();for(const start of [0,10]){r.start(start);for(const n of [...r.notes])r.down(start+n.at);r.update(start+5);}r.start(20);
 let previous=0,largest=0;
 for(let age=0;age<2.5;age+=1/hz){r.update(20+age);const v=r.state(20+age).charred;check('Food cannot become less charred',v>=previous);largest=Math.max(largest,v-previous);previous=v;}
 check('No half-black step on a beat at '+hz+' Hz',largest<.12);
}
for(let index=0;index<8;index++){
 let previous=cheerPose(0,index);
 for(let frame=1;frame<60*35;frame++){
  const current=cheerPose(frame/60,index);
  check('Cheering remains smooth across group sync boundaries',Math.abs(current.roll-previous.roll)<.13&&Math.abs(current.lift-previous.lift)<.04);previous=current;
 }
}
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>ctx})};globalThis.matchMedia=()=>({matches:false});
const scene=new T.Scene(),r=new Resources(),concert=buildConcertStage(scene,r),camera=new T.PerspectiveCamera();camera.position.set(0,5,20);
concert.update([0,4,6],1,true,camera);const orientation=concert.root.quaternion.clone();camera.rotation.y=1;concert.update([1,4,7],2,true,camera);
check('Foreground cheering follows the active lens',orientation.angleTo(concert.root.quaternion)>.9&&concert.root.quaternion.angleTo(camera.quaternion)<1e-9&&Math.abs(concert.root.position.distanceTo(camera.position)-.45)<1e-8);
let properDepth=true;concert.root.traverse(n=>{if(n.isMesh)properDepth&&=n.material.depthTest;});check('Audience props obey depth',properDepth);
const oven=buildMicrowave(scene,r),ingredients=oven.root.getObjectByName('microwave-original-ingredients');let prior=1;
for(let i=0;i<=48;i++){
 const age=i*.05;oven.update(age,.05,{phase:'meal-spawn',tabletMode:true,phaseElapsed:age,clock:age,mealBorn:true});
 const current=ingredients.scale.x;check('Ingredients shrink continuously into the creature',current<=prior+.0001&&prior-current<.06);prior=current;
 if(age<1.8)check('Ingredients remain until the creature fills their space',ingredients.visible);
}
check('Original ingredients disappear after fusion',!ingredients.visible);
r.dispose();console.log(`Second wave: ${count} continuity, title and audience checks passed.`);
