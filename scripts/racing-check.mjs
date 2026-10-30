import assert from 'node:assert/strict';
import {createRace,ROPES} from '../src/racing/physics.js';
import {road,WIDTH,LENGTH,BENDS} from '../src/racing/track.js';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function guidance(state){
  const p=state.player,t=road(p.s+10),error=wrap(Math.atan2(t.x-p.x,-(t.z-p.z))-p.heading);
  return {steer:Math.max(-1,Math.min(1,error*2.8)),brake:Math.abs(error)>.32};
}
for(const mode of ['medium','long']){
  const finishes=[];
  for(const hz of [30,60,120]){
    const race=createRace();race.reset(mode);race.state.running=true;
    for(let frame=0;frame<hz*60&&!race.state.finished;frame++){
      for(let i=0;i<120/hz;i++)race.step(1/120,guidance(race.state));
      const s=race.state;assert([s.player,s.dragon,...s.boxes].every(b=>[b.x,b.z,b.vx,b.vz].every(Number.isFinite)));
      assert(s.ropeLength<=ROPES[mode].max+.08,'rope bounded after collisions');
      assert(Math.abs(s.player.offset)<=WIDTH-s.player.radius+.08,'player retained by barriers');
      assert(Math.abs(s.dragon.offset)<=WIDTH-s.dragon.radius+.08,'dragon retained by barriers');
    }
    assert(race.state.finished,'steering and braking can complete real bends');assert(race.state.hits>0);
    finishes.push(race.state.time);race.reset();assert.equal(race.state.ropeMode,mode);assert.equal(race.state.score,0);assert.equal(race.state.events.length,0);assert(race.state.boxes.every(b=>!b.hit));
  }
  assert(Math.max(...finishes)-Math.min(...finishes)<.02,'consistent fixed-step behavior at 30/60/120Hz');
}
const idle=createRace();idle.state.running=true;for(let i=0;i<120*9;i++)idle.step(1/120);
assert.equal(idle.state.player.heading,0,'no road steering injected');assert(idle.state.wallHits>0,'no-input driving misses the first bend');assert(idle.state.player.s<130);
assert(Math.abs(road(BENDS[0].end).heading)>1.1,'first bend really turns about 70 degrees');
const brake=createRace();brake.state.boxes=[];brake.state.running=true;for(let i=0;i<240;i++)brake.step(1/120);const before=brake.state.speed;for(let i=0;i<180;i++)brake.step(1/120,{brake:true});assert(brake.state.speed<before*.5);
const paused=structuredClone(brake.state);brake.state.running=false;brake.step(.1);assert.equal(brake.state.time,paused.time);
const light=createRace(),loaded=createRace();for(const race of [light,loaded]){race.state.boxes=[];race.state.running=true;}
loaded.state.dragon.z+=1.5;light.step(1/120);loaded.step(1/120);
assert(loaded.state.player.vz>light.state.player.vz,'rope load slows/pulls player');assert(loaded.state.dragon.vz<light.state.dragon.vz,'equal/opposite force pulls follower');
function hitBox(side){
 const race=createRace();race.state.running=true;const p=race.state.player,b=race.state.boxes[0];race.state.boxes=[b];
 Object.assign(b,{x:p.x+side,z:p.z-1.05,vx:0,vz:0});p.vz=-20;race.step(1/120);return {race,p,b};
}
const head=hitBox(0),glance=hitBox(1.1);
assert(Math.abs(head.p.vz)<Math.abs(glance.p.vz),'head-on hit loses more forward speed than a glancing hit');assert(head.b.hit);assert(head.b.vz<0,'box receives momentum');
const score=head.race.state.score;Object.assign(head.b,{x:head.p.x,z:head.p.z-1.05,vx:0,vz:0});head.p.vz=-20;head.race.step(1/120);
assert(head.b.vz<0,'previously hit boxes remain physical');assert.equal(head.race.state.score,score,'same box cannot farm repeated points');
const recover=createRace();recover.state.running=true;for(let i=0;i<100;i++)recover.step(1/120,{steer:1,drift:true});recover.recover();assert.equal(recover.state.speed,0);assert.equal(recover.state.player.offset,0);assert.equal(recover.state.tension,0);
console.log('PASS racing: real bends, no auto-steering, both rope presets, two-way tension, collision angles, persistent boxes, recovery, brakes, reset, pause, 30/60/120Hz');
