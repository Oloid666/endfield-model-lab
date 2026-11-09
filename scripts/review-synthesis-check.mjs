import assert from 'node:assert/strict';
import * as T from 'three';
import {VcrTablet} from '../src/vcr-tablet.js';
import {LESSONS,CLASS_REQUIRED} from '../src/bonus-data.js';
import {Resources} from '../src/resources.js';
import {buildMealRemnant} from '../src/meal-remnant.js';
import {buildDragon} from '../src/companion.js';
import {trayRescueFrame} from '../src/tray-rescue.js';
import {postgameFree} from '../src/postgame-roam.js';
import {MEAL_LANDING} from '../src/meal-birth.js';

let checks=0;const check=(label,result)=>{assert.ok(result,label);checks++;};
for(const hz of [30,60]){
 const tablet=new VcrTablet();tablet.enter('defrost',0);
 for(let i=0;i<=Math.ceil(4.2*hz);i++){
  const t=i/hz;tablet.tick(t);
  if(t>=3.6&&t<4.2)check('The settled 105 reading is held without exposing skip controls',tablet.stage==='defrost'&&tablet.state.temperature===105&&!tablet.input('talk-next',t));
 }
 tablet.tick(4.3);check('Reaction comes after the reading at either timestep',tablet.stage==='hot'&&tablet.state.dialogue.cue==='shock');
}
const lesson=LESSONS.find(l=>l.id==='microwave');
check('Recap and actual lesson agree on 105',lesson.recap.includes('+105°C')&&lesson.analysis[0].includes('正一百零五')&&!lesson.analysis[0].includes('正五十'));
check('The full eight lessons are retained',LESSONS.length===8&&CLASS_REQUIRED===8);

const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>ctx})};globalThis.matchMedia=()=>({matches:false});
const r=new Resources(),scene=new T.Scene(),pet=buildMealRemnant(scene,r),rescue=trayRescueFrame(19,[-1.6,5.3,15.7]);
pet.update(0,{phase:'meal-spawn',mealBorn:true,tabletMode:true});
pet.update(10,{phase:'meal-reclaim',phaseElapsed:1.4,mealBorn:true,helperPresent:true,trayOwner:'hero'},null,{rescue});
check('Hands still lower gradually during the transfer',pet.state.supportHeight>0);
pet.update(11.05,{phase:'meal-reclaim',phaseElapsed:2.45,mealBorn:true,helperPresent:true,trayOwner:'hero'},null,{rescue});
check('Transfer actually lowers the support',pet.state.supportHeight===0);
const origin=pet.state.position,environment={rescue,intact:false,doors:{isOpen:true,requestPassage(){}},floorPlan:{obstacles:[]}};
const tour={phase:'tour',phaseElapsed:0,mealBorn:true,helperPresent:true,trayOwner:'hero',progress:99};
pet.update(11.2,tour,null,environment);
check('Entering the next phase does not teleport the helper',pet.state.position.every((x,i)=>Math.abs(x-origin[i])<.0001));
for(let i=1;i<3600;i++){
 const time=11.2+i/60,before=pet.state.position;environment.intact=i>900;
 pet.update(time,{...tour,phase:i>2400?'complete':'tour',phaseElapsed:i/60},null,environment);
 const after=pet.state.position;
 check('Returned helper never raises empty hands or repeats the thumb',pet.state.supportHeight===0&&!pet.state.thumbVisible&&!pet.state.emoji);
 check('Return path has no jump and obeys its walking speed',Math.hypot(after[0]-before[0],after[2]-before[2])<=.35/60+.0001);
 check('Return route stays on safe ground',postgameFree(after,environment));
}
check('After rebuilding the helper reaches the microwave area',Math.hypot(pet.state.position[0]-MEAL_LANDING[0],pet.state.position[2]-MEAL_LANDING[2])<.45);
const held=JSON.stringify(pet.state.position);pet.update(11.2+3599/60,tour,null,environment);check('Paused story clock freezes the return path',held===JSON.stringify(pet.state.position));
pet.reset();check('Restart forgets the transfer and birth',!pet.state.visible&&!pet.state.born&&pet.state.mode==='unborn');

const dragon=buildDragon(r),items=r.items.size;
dragon.update(3,{action:{kind:'shock',source:'fridge',age:1,amount:1}});
check('The reaction uses an existing shock face',dragon.state.mood==='shock');
check('Palms do not sit in front of the painted mouth',dragon.hands.every(hand=>hand.position.z<0&&Math.abs(hand.position.x)>.6));
dragon.update(4,{singing:true,quietSong:true});check('Fridge singing still hides hands and microphone',!dragon.state.handsVisible&&!dragon.state.microphoneVisible);
dragon.update(5,{});check('Later scenes release the shock expression',dragon.state.mood!=='shock');
check('Changing reaction poses does not allocate textures or geometry',r.items.size===items);
r.dispose();console.log(`Review synthesis: ${checks} checks passed.`);
