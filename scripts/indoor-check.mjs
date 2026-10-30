import assert from 'node:assert/strict';
import {createIndoorGame,route,LENGTH,ROOM_SCALE,AVATAR_SCALE,CRUISE_SPEED} from '../src/indoor/game.js';
function run(hz,control){const g=createIndoorGame();g.state.running=true;let ahead=false,wide=false,maxRope=0;
 for(let frame=0;frame<hz*35&&!g.state.finished;frame++){
  for(let j=0;j<120/hz;j++){g.step(1/120,control(g.state));const s=g.state;maxRope=Math.max(maxRope,s.ropeLength);ahead||=s.dragonS>s.s;wide||=Math.abs(s.dragonOffset)>.5;assert([s.s,s.offset,s.dragonX,s.dragonZ,s.dragonVX,s.dragonVZ,s.speed].every(Number.isFinite));assert(Math.abs(s.offset)<=.361);assert(s.ropeLength<1.4,'no explosive rope stretch');}
 }
 assert(g.state.finished,'short test segment can finish');assert(g.state.time>16&&g.state.time<28);return {g,ahead,wide,maxRope};}
const unattended=run(60,()=>({}));assert(!unattended.g.state.passed,'no input must not pass');assert(unattended.g.state.goals<2);assert.equal(unattended.g.state.liquid,.396,'flood pressure disabled for skill practice');
const square=run(60,s=>({steer:Math.floor(s.time/2)%2?-1:1}));assert(square.g.state.passed,'two-second left/right input can pass');assert(square.g.state.maxCombo>=3);
const outcomes=[];
for(const hz of [30,60,120]){
 const {g,wide}=run(hz,s=>({steer:Math.sin(s.time*2.5)}));assert(g.state.passed,'reproducible alternating input can pass');assert(wide,'follower can swing outside player lane');assert(g.state.maxCombo>=3);assert(g.state.goods.some(t=>t.by==='dragon'));outcomes.push([g.state.time,g.state.score]);
 const before=g.state.time;g.step(.1);assert.equal(g.state.time,before);g.reset();assert.equal(g.state.goals,0);assert.equal(g.state.combo,0);assert.equal(g.state.maxCombo,0);assert.equal(g.state.score,0);assert(g.state.goods.every(t=>!t.hit));
}
assert(outcomes.every(x=>JSON.stringify(x)===JSON.stringify(outcomes[0])),'same inputs give same outcome at 30/60/120Hz');
const coast=createIndoorGame();coast.state.running=true;coast.state.goods=[];for(let i=0;i<72;i++)coast.step(1/120,{steer:1});for(let i=0;i<40;i++)coast.step(1/120);assert(Math.abs(coast.state.offset)>.08,'release does not snap to center');
const loaded=createIndoorGame(),light=createIndoorGame();for(const g of [loaded,light]){g.state.running=true;g.state.goods=[];}loaded.state.dragonZ+=.35;loaded.step(1/120);light.step(1/120);assert(loaded.state.speed<light.state.speed,'rope transmits load back to player');
const contact=createIndoorGame();contact.state.running=true;const s=contact.state,p=route(s.s);s.goods=[{id:0,s:s.s,offset:0,x:p.x+p.fx*.15,z:p.z+p.fz*.15,group:0,kind:'drink',radius:.19,hit:false,age:0}];s.speed=1;contact.step(1/120);assert(s.goods[0].hit);assert.equal(s.goods[0].by,'player');assert.equal(s.goals,0,'player contact does not earn target group');assert(s.speed>=.75,'one direct hit cannot stall racer');const score=s.score;for(let i=0;i<20;i++)contact.step(1/120);assert.equal(s.score,score,'debris cannot repeat-score or re-block');
const braked=createIndoorGame();braked.state.running=true;braked.state.goods=[];for(let i=0;i<300;i++)braked.step(1/120);const before=braked.state.speed;for(let i=0;i<240;i++)braked.step(1/120,{brake:true});assert(braked.state.speed<before*.3);braked.recover();assert.equal(braked.state.recoveries,1);assert.equal(braked.state.dragonImpact,0);braked.state.running=false;const time=braked.state.time;braked.step(.1);assert.equal(braked.state.time,time);
assert.equal(LENGTH,22);assert.equal(ROOM_SCALE.horizontal,2);assert.equal(AVATAR_SCALE,.075);assert(CRUISE_SPEED>=1);
console.log('PASS indoor skill: unattended fails, reproducible two-group pass, combo, free lateral coast, wide swing, two-way load, nonblocking debris, capped direct impact, reset, brakes, recovery, pause and 30/60/120Hz',outcomes[0]);
