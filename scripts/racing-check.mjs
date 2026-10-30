import assert from 'node:assert/strict';
import {createRace,center,WIDTH} from '../src/racing/physics.js';
const finishes=[];
for(const hz of [30,60,120]){
 const race=createRace();race.state.running=true;
 for(let frame=0;frame<hz*55&&!race.state.finished;frame++){
  for(let j=0;j<120/hz;j++)race.step(1/120,{steer:Math.sin(race.state.time*.8)*.6,drift:frame%hz<hz/3});
  const {player:p,dragon:d}=race.state;
  assert([p.x,p.s,d.x,d.s,d.vx,d.vs].every(Number.isFinite));
  assert(Math.hypot(p.x-d.x,p.s-d.s)<=5.001,'rope length bounded');
  assert(Math.abs(p.x-center(p.s))<=WIDTH,'player within track');
 }
 assert(race.state.finished,'finish reachable with repeated steering');
 assert(race.state.hits>0,'collision targets hit');finishes.push(race.state.time);
 race.reset();assert.equal(race.state.score,0);assert.equal(race.state.dragon.s,-3.1);assert(race.state.boxes.every(b=>!b.hit));
}
assert(Math.max(...finishes)-Math.min(...finishes)<.05,'same fixed physics across display rates');
const r=createRace();r.state.running=true;for(let i=0;i<600;i++)r.step(1/120);const before=r.state.player.vs;
for(let i=0;i<120;i++)r.step(1/120,{brake:true});assert(r.state.player.vs<before*.5,'brakes reduce speed');
r.state.running=false;const time=r.state.time;r.step(.1);assert.equal(r.state.time,time,'pause freezes simulation');
console.log('PASS racing: rope, collisions, finish, reset, brakes, pause, 30/60/120 Hz');
