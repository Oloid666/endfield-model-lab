import assert from 'node:assert/strict';
import * as T from 'three';
import {AdaptiveQuality} from '../src/adaptive-quality.js';
import {MissionMachine,HEAT_DEMO_DURATION} from '../src/mission-state.js';
import {sequences} from '../src/mission-dialogue.js';
import {Resources} from '../src/resources.js';
import {buildDragon} from '../src/companion.js';
import {buildMealRemnant} from '../src/meal-remnant.js';
let count=0;function check(n,v){assert.ok(v,n);count++;}
globalThis.matchMedia=()=>({matches:false});
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const r=new Resources(),d=buildDragon(r),meal=buildMealRemnant(new T.Scene(),r);
for(let t=0;t<16;t+=.1){d.update(t,{singing:true,projectile:true});const h=d.state.hand,m=d.state.microphone;check('Singing hand remains outside body',h[0]>.6&&h[1]>.65);check('Floating microphone clears face',m[2]>.7&&Math.hypot(h[0]-m[0],h[1]-m[1],h[2]-m[2])>.3);}
d.update(17,{projectile:true});check('Song ends without leftover mic',!d.root.getObjectByName('floating-singing-microphone').visible);
const machine=new MissionMachine();machine.sequence('credentials',sequences.credentials);for(let i=0;i<30&&machine.phase==='credentials';i++){machine.revealed=1000;machine.next();}check('Every route reaches demonstration',machine.phase==='heat-demo');machine.update(6);check('Cause is spoken before gameplay',machine.node.event==='meal-born'&&!machine.heatStart());machine.update(HEAT_DEMO_DURATION);check('Gameplay resumes at fresh rhythm state',machine.phase==='heat'&&machine.rhythm.status==='ready');
for(let round=0;round<3;round++){
 const start=machine.time;machine.heatStart(machine.sourceTime);const notes=machine.rhythm.notes.map(n=>({...n}));
 for(const note of notes){machine.heatStart(machine.sourceTime+start+note.at-machine.time);if(note.type==='hold')machine.heatStop(machine.sourceTime+start+note.end-machine.time);}
 machine.update(machine.sourceTime+notes.at(-1).end+1);
}
check('Perfect inputs can finish without any forced gameplay failure',machine.phase==='flashback-end'&&machine.rhythm.failures===0);
machine.phaseTo('complete');machine.returnToStreet();const at=machine.state.homecomingAt;
meal.update(machine.time,machine.state);check('Postgame creature starts behind counter edge',meal.state.mode==='crawling');const start=meal.state.position;machine.update(machine.sourceTime+9);meal.update(machine.time,machine.state);check('Creature travels along the aisle',meal.state.position[0]<start[0]);const frozen=meal.state.position;machine.setPaused(true);machine.update(machine.sourceTime+100);meal.update(machine.time,machine.state);check('Pause freezes path',JSON.stringify(frozen)===JSON.stringify(meal.state.position));machine.setPaused(false);machine.update(machine.sourceTime+8);meal.update(machine.time,machine.state);check('Arrival has matching line and pose',meal.state.mode==='idle'&&machine.node.event==='meal-arrival');check('Returning again does not restart arrival',!machine.returnToStreet()&&machine.homecomingAt===at);machine.replay();meal.reset();check('Replay clears completion and creature',!machine.state.postgame&&!meal.state.born);
const q=new AdaptiveQuality();let result;for(let i=0;i<1000;i++){const next=q.sample(.05,true,'balanced');if(next)result=next;}check('Sustained slow frames lower quality',result==='low');q.reset();result=null;for(let i=0;i<1000;i++)result=q.sample(.1,false,'balanced')||result;check('Excluded frames never lower quality',result===null);q.reset();result=null;for(let i=0;i<2000;i++)result=q.sample(1/60,true,'low')||result;check('Sustained recovery returns to balanced',result==='balanced');
r.dispose();console.log(`Living world: ${count} checks passed.`);
