import assert from 'node:assert/strict';
import {MissionMachine,FINAL_READY,LANDING_DURATION} from '../src/mission-state.js';
import {chargeShot,strugglePosition} from '../src/shot-charge.js';
import {LANDING_SETTLE_DURATION,endingTitle} from '../src/ending-title.js';
import {World} from '../src/world.js';
import {CinematicTrack} from '../src/cinematic-track.js';
import {cinematicStoryShot} from '../src/story-shots.js';
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};
const fresh=()=>{const m=new MissionMachine();m.phaseTo('combat');return m;};
const step=(m,t)=>m.update(m.sourceTime+t);
for(const [age,status] of [[0,'charging'],[1.199,'charging'],[1.2,'gold'],[1.599,'gold'],[1.6,'warning'],[1.899,'warning'],[1.9,'overheated'],[1.901,'overheated']])check('Charge boundary '+age,chargeShot(age).status===status);
for(const hz of [30,60]){
 const m=fresh();check('Begin '+hz,m.beginCharge());for(let i=0;i<hz*1.3;i++)step(m,1/hz);
 const shot=m.releaseCharge();check('Real damage/recoil match at '+hz,shot.damage===22&&shot.power===1&&shot.recoil===1.4&&m.progress===22);
 check('Release and click cannot double fire',!m.releaseCharge()&&!m.attack());
}
let m=fresh();m.beginCharge();let weak=m.releaseCharge(m.sourceTime+.1);check('Quick release really fires a weaker shot',weak.damage<22&&weak.power<1&&m.shots===1);
m=fresh();m.beginCharge();step(m,1.9);check('Automatic vent consumes no shot',!m.shotChargeState.active&&m.shotChargeState.status==='cooling'&&m.shots===0&&m.progress===0);
check('Physical release after vent is harmless',!m.releaseCharge()&&!m.beginCharge());step(m,.599);check('Cooldown has no early unlock',!m.beginCharge());step(m,.002);check('Cooldown can retry',m.beginCharge());
m=fresh();m.beginCharge();step(m,4);check('Late frame vents once with elapsed cooldown',m.failures.combat===1&&m.shotChargeState.status==='idle'&&m.shots===0);check('Late input cannot resurrect stale charge',!m.releaseCharge());
for(const cancel of [m=>m.cancelCharge('pointercancel'),m=>m.setPaused(true),m=>m.phaseTo('energy'),m=>m.replay(),m=>m.restoreChapter('last')]){m=fresh();m.beginCharge();step(m,.5);cancel(m);check('Lifecycle cancellation never shoots',!m.shotChargeState.active&&!m.releaseCharge()&&m.shots===0);}
m=fresh();check('Removed modes cannot alter damage',!m.setOutput('overload')&&!m.setOutput('strong')&&m.setOutput('steady'));
for(let i=0;i<5;i++){m.beginCharge();step(m,1.9);step(m,.61);}check('Repeated vents retain assist escape hatch',m.state.canAssist&&m.assist()&&m.progress===99);
for(let i=0;i<=1000;i++){const x=strugglePosition(i*.013);assert.ok(x>=.05&&x<=.11);}checks++;
for(const t of [0,.11,.23,.35]){m=new MissionMachine();m.phaseTo('aim-final');check('Dinner rescue cannot be bypassed',!m.attack());step(m,FINAL_READY+t);const e=m.attack();check('Left-only final pointer fires at every position',e.finisher&&e.position>=.05&&e.position<=.11&&m.phase==='finisher'&&!m.attack());}
m=new MissionMachine();m.phaseTo('landing');step(m,LANDING_SETTLE_DURATION-.001);check('Landing has time to settle before dialogue',!m.node&&m.state.presentationLocked);step(m,.001);check('First line starts from a fresh reading clock',m.node?.event==='explosion-after'&&Math.abs(m.state.nodeElapsed)<1e-6);step(m,LANDING_DURATION-LANDING_SETTLE_DURATION+.001);check('Landing still advances into meal return',m.phase==='meal-reclaim');
const c={feet:[-1,.3,3],heroHead:[-1,1.9,3],tray:[-1,1.2,3.6],heading:2.9,portrait:true,width:390,height:844,aspect:390/844};
for(const age of [0,1,2.79,2.8,3.5]){const q=cinematicStoryShot({phase:'landing',clock:age,phaseElapsed:age,node:age>=2.8?{event:'explosion-after'}:null,nodeElapsed:Math.max(0,age-2.8)},c,new CinematicTrack());check('Landing camera stays beside head instead of over it',q.position[1]>=c.heroHead[1]&&q.position[1]-c.heroHead[1]<.2);}
const sample=(phase,e)=>({...cinematicStoryShot({phase,clock:e,phaseElapsed:e},c,new CinematicTrack())});
const last=sample('tour',33.99),fin=sample('complete',0);check('Dinner title holds the same lens across Fin',JSON.stringify(last.position)===JSON.stringify(fin.position)&&last.fov===fin.fov);
check('Existing punctuation stays sequential',JSON.stringify([0,1.2,1.65,2.1,2.55].map(endingTitle))===JSON.stringify(['Fin.','Fin..','Fin...','Fin....','Fin....?']));
const invitation=Object.getOwnPropertyDescriptor(World.prototype,'upstairsInvitation').get;
const world={missionState:{phase:'complete',postgame:false,phaseElapsed:0},streetShow:{state:{snapshotReady:true},active:false},bonus:{active:false}};
for(const age of [0,2.55,4.049,4.05]){world.missionState.phaseElapsed=age;check('Rebuilt snapshot cannot override Fin at '+age,invitation.call(world)===(age>=4.05));}
const stillA=cinematicStoryShot({phase:'landing',clock:3,phaseElapsed:3,node:{event:'explosion-after'},nodeElapsed:.2},{...c,reduced:true},new CinematicTrack());
const stillB=cinematicStoryShot({phase:'landing',clock:4,phaseElapsed:4,node:{event:'explosion-after'},nodeElapsed:1.2},{...c,reduced:true},new CinematicTrack());
check('Reduced motion disables the facial push',JSON.stringify(stillA.position)===JSON.stringify(stillB.position));
console.log(`Shot charge: ${checks} checks passed.`);
