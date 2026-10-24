import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MissionMachine,meterPosition,judgeMeter,METER_PERIOD,outputModes,LANDING_DURATION} from '../src/mission-state.js';
import {sequences,chargeLines,chatterGroups,hotspots,dinnerChoices} from '../src/mission-dialogue.js';

const checks=[];const check=(name,value,detail=null)=>{assert.ok(value,name);checks.push({name,passed:true,detail});};
const advance=m=>{m.revealed=m.node?.text.length||0;m.next();};
const toPhase=(m,phase)=>{let limit=120;while(m.phase!==phase&&limit-->0)advance(m);assert.equal(m.phase,phase);};
const intoCombat=(m,branch='A')=>{m.start();toPhase(m,'choice');m.choose(branch);toPhase(m,'charge');m.update(m.sourceTime+30);assert.equal(m.phase,'combat');};
function attackAt(m,position=.5){
  const {meterElapsed,meterPeriod}=m.state;
  const targetElapsed=(Math.floor(meterElapsed/meterPeriod)+1)*meterPeriod+position*meterPeriod/2;
  m.update(m.sourceTime+targetElapsed-meterElapsed);return m.attack();
}

for(const [key,items] of Object.entries(sequences))check('Data schema '+key,items.every(v=>['id','speaker','text','mood','gesture','next'].every(k=>k in v)));
check('Three food choices only',dinnerChoices.length===3&&dinnerChoices.map(v=>v.id).join('')==='ABC');
check('Ten timed charge lines cover full charge',chargeLines.length===10&&chargeLines[0].at===0&&chargeLines.at(-1).at===27);
check('Sixteen complete chatter groups',chatterGroups.length>=14&&chatterGroups.every(v=>v.length>=2&&v.length<=4));
check('Five hotspot types with three groups each',Object.keys(hotspots).length===5&&Object.values(hotspots).every(v=>v.length>=3));
check('Meter linear triangle travels full width',meterPosition(0)===0&&Math.abs(meterPosition(.675)-.5)<1e-10&&Math.abs(meterPosition(1.35)-1)<1e-10&&meterPosition(2.025)>.499&&meterPosition(2.7)===0);
check('Meter zone boundaries',judgeMeter(.12).result==='miss'&&judgeMeter(.88).result==='miss'&&judgeMeter(.5).result==='perfect'&&judgeMeter(.35).result==='strong'&&judgeMeter(.2).result==='hit');

const ready=new MissionMachine();ready.setAuto(true);ready.update(3600);
check('Opening waits indefinitely for player inspection',ready.phase==='ready'&&ready.node===null&&!ready.branch);
check('Evidence and anger are explicit dialogue moods',sequences.briefing.some(v=>v.mood==='evidence')&&sequences.briefing.some(v=>v.mood==='anger'));
check('Concrete illuminance uses lux',sequences.briefing.some(v=>v.text.includes('10.5 lux')&&v.text.includes('0.5 lux')));
check('Charge contains insurance joke without interrupted sequence',chargeLines.some(v=>v.text.includes('天災打雷險'))&&chargeLines.some(v=>v.text.includes('局部雷雨')));
check('Dragon shocked instead of bargaining desserts',sequences.last.some(v=>v.text.includes('三小'))&&!sequences.last.some(v=>v.text.includes('甜點')));
check('Pear survival is the damage criterion',sequences.landing.some(v=>v.text.includes('梨花呢'))&&sequences.landing.some(v=>v.text.includes('沒事'))&&sequences.landing.some(v=>v.text.includes('無損失')));
check('Ending gives every line three readable seconds',LANDING_DURATION===12&&LANDING_DURATION/sequences.landing.length===3);
const modes=new MissionMachine();intoCombat(modes);
const period0=modes.state.meterPeriod;
check('Invalid output cannot alter mode',!modes.setOutput('missing')&&modes.state.output==='steady');
check('Overload changes visible speed and width',modes.setOutput('overload')&&modes.state.meterPeriod<period0&&modes.state.meterSettings.width<outputModes[0].width);
const overloaded=attackAt(modes,.5);
check('Overload has stronger damage and physical recoil metadata',overloaded.damage===27&&overloaded.recoil>1.5&&overloaded.mode==='overload');
check('Shot starts a fresh timing sweep',modes.state.meterElapsed===0&&modes.state.meter===0);
check('Overload has a real miss penalty at formerly safe edge',judgeMeter(.2,false,outputModes[0]).result==='hit'&&judgeMeter(.2,false,outputModes[2]).result==='miss');
modes.setPaused(true);check('Pause locks output selection',!modes.setOutput('steady')&&modes.state.output==='overload');modes.setPaused(false);
modes.setOutput('steady');const stage0=METER_PERIOD;check('Destruction escalates meter tempo',modes.state.meterPeriod<stage0&&modes.state.meterSettings.stage===1);
modes.replay();check('Replay clears output risk and stage',modes.state.output==='steady'&&modes.state.meterSettings.stage===0);

for(const branch of ['A','B','C']){
 const dinners=[],stages=[],attacks=[];const m=new MissionMachine({onDinner:v=>dinners.push(v),onStage:p=>stages.push(p),onAttack:e=>attacks.push(e)});
 m.setTargets([{id:'front',label:'店面外牆'},{id:'roof',label:'屋頂'}]);m.start();toPhase(m,'choice');m.setAuto(true);m.update(600);
 check('Food choice never times out '+branch,m.phase==='choice'&&m.branch===null);
 check('Unknown dinner rejected '+branch,!m.choose('D'));
 m.choose(branch);check('Correct food prop and branch '+branch,m.branch===branch&&dinners.at(-1)===branch);
 m.setAuto(false);toPhase(m,'charge');const start=m.time,entered=m.entered;
 check('Charge cannot be skipped '+branch,!m.skip()&&!m.next()&&!m.attack()&&m.phase==='charge');
 const heard=new Set([m.node.id]);for(let second=1;second<=29;second++){m.update(m.sourceTime+1);heard.add(m.node.id);}
 check('Charge is still charging before thirty seconds '+branch,m.phase==='charge'&&m.time-start===29&&m.state.charge<100);
 check('All charge dialogue is scheduled '+branch,heard.size===10);
 m.setPaused(true);const frozen=m.state; m.update(m.sourceTime+77);
 check('Pause freezes charge and local clock '+branch,m.time===frozen.time&&m.entered===entered&&m.state.charge===frozen.charge);
 m.setPaused(false);m.update(m.sourceTime+1);check('Charge completes at exactly thirty active seconds '+branch,m.phase==='combat'&&m.entered===start+30&&m.state.charge===100);
 check('Target selection validates ids '+branch,m.selectTarget('roof')&&m.target==='roof'&&!m.selectTarget('missing'));
 const beforeMiss=m.state,miss=attackAt(m,0);
 check('Edge MISS consumes no energy or progress '+branch,miss.result==='miss'&&m.progress===beforeMiss.progress&&m.state.energy===beforeMiss.energy&&miss.damage===0);
 const hit=attackAt(m,.2);check('Ordinary hit causes real positive damage '+branch,hit.result==='hit'&&hit.damage>0&&m.progress>0&&m.state.energy<100);
 const strong=attackAt(m,.35),perfect=attackAt(m,.5);
 check('Timing accuracy changes damage '+branch,strong.damage>hit.damage&&perfect.damage>strong.damage&&perfect.result==='perfect');
 check('One input cannot fire twice '+branch,m.attack()===false);
 while(m.phase==='combat')attackAt(m,.5);
 check('Building destruction stops at ninety-nine '+branch,m.phase==='last'&&m.progress===99&&m.state.energy===0&&!m.ended);
 m.update(m.sourceTime+300);check('Final dialogue cannot auto-complete mission '+branch,m.progress===99&&!m.ended&&!['finisher','landing','complete'].includes(m.phase));
 toPhase(m,'aim-final');const finalMiss=attackAt(m,.2);
 check('Final shot requires central timing '+branch,finalMiss.result==='miss'&&!finalMiss.finisher&&m.phase==='aim-final'&&m.progress===99);
 const final=attackAt(m,.5);check('Final central hit fires dragon exactly once '+branch,final.finisher&&m.phase==='finisher'&&m.progress===99&&attacks.filter(e=>e.finisher).length===1&&!m.attack());
 const flight=m.time;m.update(m.sourceTime+8.99);check('Flight has full nine seconds '+branch,m.phase==='finisher'&&m.progress===99&&!m.ended);
 m.update(m.sourceTime+.01);check('Flight transitions to landing '+branch,m.phase==='landing'&&m.progress===99&&m.entered===flight+9);
 m.setPaused(true);const landingClock=m.time;m.update(m.sourceTime+40);check('Pause freezes landing '+branch,m.time===landingClock&&m.phase==='landing');m.setPaused(false);
 m.update(m.sourceTime+LANDING_DURATION-.01);check('Completion waits for smoke-clear ending '+branch,m.phase==='landing'&&m.progress===99);
 m.update(m.sourceTime+.01);check('Mission completes only after landing '+branch,m.phase==='complete'&&m.progress===100&&m.ended);
 check('Ending hotspot accepted '+branch,m.hotspot('dragon')&&m.phase==='complete'&&m.state.sequenceKind==='hotspot');
 check('Hotspots do not overlap '+branch,!m.hotspot('zhuang'));
 while(m.node)advance(m);const lastHotspot=m.lastHotspot;
 check('Hotspot cooldown enforced '+branch,!m.hotspot('dragon')&&m.lastHotspot===lastHotspot);
 m.update(m.sourceTime+(m.quietUntil-m.time)+.1);check('Postending chatter starts after quiet '+branch,m.phase==='complete'&&m.state.sequenceKind==='chat'&&!!m.node);
 m.replay();check('Replay restores all mission state '+branch,m.phase==='choice'&&m.progress===0&&!m.ended&&m.branch===null&&dinners.at(-1)===null&&m.shots===0&&m.state.energy===100&&m.chatDeck.length===0&&Object.keys(m.cooldowns).length===0);
 check('Every important phase is delivered '+branch,['intro','choice','meal','briefing','charge','combat','last','aim-final','finisher','landing','complete'].every(v=>stages.includes(v)));
}

// Judge the input event's timestamp even if a later 3D frame was already processed.
const late=new MissionMachine();intoCombat(late);const origin=late.sourceTime;late.update(origin+1.0);const delayed=late.attack(origin+.675);
check('Delayed input uses original touch timestamp',delayed.result==='perfect'&&Math.abs(delayed.position-.5)<1e-10,{position:delayed.position});
const pauseMeter=new MissionMachine();intoCombat(pauseMeter);pauseMeter.update(pauseMeter.sourceTime+.45);const pausedPosition=pauseMeter.state.meter;pauseMeter.setPaused(true);pauseMeter.update(pauseMeter.sourceTime+50);
check('Paused meter does not move and rejects attacks',pauseMeter.state.meter===pausedPosition&&!pauseMeter.attack());pauseMeter.setPaused(false);pauseMeter.update(pauseMeter.sourceTime+.225);check('Meter resumes without jumping',Math.abs(pauseMeter.state.meter-.5)<1e-9);
const jump=new MissionMachine();intoCombat(jump);while(jump.phase==='combat')attackAt(jump);toPhase(jump,'aim-final');attackAt(jump);jump.update(jump.sourceTime+60);check('Large clock step still runs final phases once',jump.phase==='complete'&&jump.progress===100);

const result={passed:true,checks:checks.length,kind:'Deterministic actual mission state/data/input-clock tests; not a browser or iPhone test',results:checks};fs.writeFileSync('artifacts/mission-check.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length}));
