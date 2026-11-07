// Regression boundaries: missed notes, cancellation, pausing and tray ownership.
import assert from 'node:assert/strict';
import {RhythmHeat} from '../src/rhythm-heat.js';
import {MissionMachine} from '../src/mission-state.js';

let count=0;
const check=(name,test)=>{assert.ok(test,name);count++;};
const step=(m,seconds)=>m.update(m.sourceTime+seconds);
function passRound(r,now){
  check('Round starts',r.start(now));
  for(const note of [...r.notes])check('Valid tap accepted',r.down(now+note.at));
  r.update(now+5);
}
for(const hz of [30,60]){
  const r=new RhythmHeat();passRound(r,0);passRound(r,10);
  check('First two rounds remain player-controlled',r.round===2&&!r.surged);
  r.start(20);
  // No taps: story must swell before its forced overload, rather than skip a beat.
  const swellAt=20+r.notes[2].at+.01;
  for(let t=20;t<swellAt;t+=1/hz)r.update(t);
  r.update(swellAt);
  check('Missed third beat still swells before overload',r.state(swellAt).swelling&&!r.surged);
  r.cancel();r.start(30);
  check('Cancellation never restores white ingredients',r.state(30).charred===1&&r.state(30).swelling);
  r.update(35);
  check('Missing the final beat still reaches the scripted overload',r.surged&&!r.retry());
}
const r=new RhythmHeat();passRound(r,0);passRound(r,10);r.start(20);
for(const note of [...r.notes])r.down(20+note.at);
check('Perfect taps cannot avert the scripted final overload',r.surged&&r.result.includes('不是你的失誤'));

const m=new MissionMachine();
m.phaseTo('meal-handoff');step(m,.69);
check('Tray stays with hero before dragon contact',m.state.trayOwner==='hero'&&!m.state.helperPresent);
m.setPaused(true);step(m,100);
check('Background pause cannot transfer a tray',m.state.trayOwner==='hero'&&m.state.phaseElapsed<.70);
m.setPaused(false);step(m,.02);
check('Exactly one owner changes at contact',m.state.trayOwner==='dragon'&&!m.state.helperPresent);
step(m,.5);check('Takeoff follows completed handoff',m.phase==='ascent');
m.phaseTo('aim-final');step(m,4.89);check('Dragon protects dinner until helper contact',m.state.trayOwner==='dragon');step(m,.02);check('Helper takes tray after stretch',m.state.trayOwner==='helper');
m.phaseTo('meal-reclaim');step(m,1.34);
check('Helper retains tray before reclaim contact',m.state.trayOwner==='helper');
step(m,.02);check('Hero takes tray back at contact',m.state.trayOwner==='hero');
step(m,1.24);check('Tour follows completed reclaim',m.phase==='tour');
m.replay();check('Restart returns to clean street entry',m.phase==='ready'&&!m.state.helperPresent&&m.state.trayOwner==='hero');
console.log(`Dinner revision: ${count} regression checks passed.`);
