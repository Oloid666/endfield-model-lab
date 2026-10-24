import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {PlaygroundMachine,prototypes} from '../src/playground-state.js';

let checks=0;const check=(condition,message)=>{assert.ok(condition,message);checks++;};
const step=(m,count=1,dt=.02)=>{for(let i=0;i<count;i++)m.update(i*dt,dt);};
const until=(m,predicate,max=2000)=>{for(let i=0;i<max&&!predicate(m.state)&&m.state.status==='running';i++)step(m);check(predicate(m.state),'condition reached within budget');};
const m=new PlaygroundMachine();
check(prototypes.length===6&&new Set(prototypes.map(v=>v.id)).size===6,'six different prototypes');
check(m.state.status==='ready'&&!m.act('lock'),'nothing runs before selection');
check(!m.select('unknown'),'unknown prototype rejected');

m.select('cannon');
for(let i=0;i<3;i++){
  until(m,s=>s.power>=.9);check(m.act('lock'),'power locked');
  const power=m.state.power;until(m,s=>Math.abs(s.meter-.5)<s.sweetWidth*.3);check(m.state.power===power,'power frozen during aim');
  m.act('lock');
}
check(m.state.status==='won'&&m.state.progress===100&&m.state.hits===3,'cannon three real calibrated hits win');
check(!m.act('lock'),'completed game does not accept attack');
m.reset();for(let i=0;i<6;i++){m.act('lock');m.act('lock');}
check(m.state.status==='lost'&&m.state.hits===0,'cannon six edge misses lose');

m.select('compress');
for(let i=0;i<4;i++){if(m.state.pressure>60)m.act('vent');m.act('feed');if(m.state.pressure>80)m.act('vent');m.act('press');}
check(m.state.status==='won'&&m.state.compacted===100&&m.state.vents>0,'compression requires vent and gives coupon');
m.reset();for(let i=0;i<4;i++){m.act('feed');m.act('press');}
check(m.state.status==='lost'&&m.state.pressure>=100,'unmanaged pressure ruptures machine');

m.select('washer');m.act('rpm',2);
for(let i=0;i<2000&&m.state.status==='running';i++){
  const s=m.state;if(s.balance>.12)m.act('left');if(s.balance<-.12)m.act('right');
  if(s.foam>65){m.act('drain');m.act('rpm',2);}step(m);
}
check(m.state.status==='won'&&m.state.drains>0,'washer balance and drain produces clean result');
m.reset();m.act('rpm',2);step(m,1000);
check(m.state.status==='lost','washer unmanaged drum fails');

m.select('microwave');m.act('power');
for(let i=0;i<2000&&m.state.status==='running';i++){
  const s=m.state;const low=s.zones.indexOf(Math.min(...s.zones));m.act('zone',low);step(m);
}
check(m.state.status==='won'&&m.state.zones.every(t=>t>=80),'all three zones must really reach heat goal');
m.reset();m.act('power');step(m,500);
check(m.state.status==='lost'&&m.state.zones[0]>112,'one overheated zone fails whole meal');
m.reset();m.act('power');step(m,40);m.act('vent');check(!m.state.power&&m.state.heat<1,'vent lowers machine heat and cuts power');

m.select('scan');
for(let i=0;i<3;i++){until(m,s=>Math.abs(s.cursor-s.target)<s.width*.3);m.act('scan');step(m);}
check(m.state.status==='won'&&m.state.scanned===3&&m.state.attempts===3,'three timed item scans win');
m.reset();for(let i=0;i<7;i++)m.act('scan');
check(m.state.status==='lost'&&m.state.attempts===7,'seven missed scan opportunities lose');

m.select('pack');m.act('right');m.act('right');m.act('lock');
for(let i=0;i<4;i++)m.act('right');m.act('lock');
for(let i=0;i<7;i++)m.act('left');m.act('lock');
check(m.state.status==='won'&&m.state.integrity===100&&m.state.seals===3,'all three angles align before sealing');
m.reset();for(let i=0;i<3;i++)m.act('lock');
check(m.state.status==='lost','three crooked seals break packaging');
m.reset();step(m,2300);
check(m.state.status==='lost'&&m.state.time>=45,'packaging deadline stops forgotten round');

for(const p of prototypes){
  m.select(p.id);const before=m.state.time;m.update(100000,100000);
  check(m.state.time-before<=.101,`${p.id} clamps resumed frame delta`);
  check(m.state.metrics.length>=2,`${p.id} exposes UI metrics`);
  check(Number.isFinite(m.state.progress)&&m.state.progress>=0&&m.state.progress<=100,`${p.id} has bounded progress`);
  check(m.reset()&&m.state.time===0&&m.state.status==='running',`${p.id} resets state`);
}
mkdirSync('artifacts',{recursive:true});
writeFileSync('artifacts/playground-check.json',JSON.stringify({passed:checks,prototypes:prototypes.map(v=>v.id),notes:'Deterministic gameplay state checks. No GPU or iPhone performance claim.'},null,2)+'\n');
console.log(`Playground: ${checks} checks passed across all six playable prototypes.`);
