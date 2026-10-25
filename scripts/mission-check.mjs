import assert from 'node:assert/strict';
import fs from 'node:fs';
import {MissionMachine,meterPosition,judgeMeter,METER_PERIOD,outputModes,LANDING_DURATION,CHARGE_DURATION,REWIND_DURATION,HEAT_DEMO_DURATION,RETURN_DURATION,TOUR_DURATION,HEAT_TARGET,HEAT_PULSES,HEAT_PULSE_TARGET,HEAT_BURN,CONNECTION_ACCOUNT,CONNECTION_PASSWORD} from '../src/mission-state.js';
import {sequences,chargeLines,chatterGroups,hotspots,dinnerChoices,connectionPrompts,captchaLines,heatDemoLines,finalAmmoLines} from '../src/mission-dialogue.js';

const checks=[];
const check=(name,value,detail=null)=>{assert.ok(value,name);checks.push({name,passed:true,detail});};
const near=(a,b,tolerance=1e-8)=>Math.abs(a-b)<tolerance;
const step=(m,seconds)=>m.update(m.sourceTime+seconds);
const advance=m=>{m.revealed=m.node?.text.length||0;return m.next();};
const toPhase=(m,phase)=>{let limit=250;while(m.phase!==phase&&limit-->0){if(!advance(m))break;}assert.equal(m.phase,phase);};
const type=(m,text)=>{for(const letter of text)assert.ok(m.key(letter),'Key '+letter);};
const connect=m=>{type(m,CONNECTION_ACCOUNT);assert.ok(m.submitLogin());type(m,CONNECTION_PASSWORD);assert.ok(m.submitLogin());step(m,6);assert.ok(m.verify());assert.ok(m.setLever(1));assert.equal(m.phase,'charge');};
const intoCombat=(m,branch='A')=>{m.start();toPhase(m,'choice');m.choose(branch);toPhase(m,'login');connect(m);step(m,CHARGE_DURATION);assert.equal(m.phase,'combat');};
function attackAt(m,position=.5){
 if(m.state.combatHoldRemaining>0)step(m,m.state.combatHoldRemaining+.01);
 const {meterElapsed,meterPeriod}=m.state;
 const targetElapsed=(Math.floor(meterElapsed/meterPeriod)+1)*meterPeriod+position*meterPeriod/2;
 step(m,targetElapsed-meterElapsed);return m.attack();
}
const toHeat=m=>{while(m.phase==='combat')attackAt(m);toPhase(m,'rewind');step(m,REWIND_DURATION);toPhase(m,'heat-demo');step(m,HEAT_DEMO_DURATION);assert.equal(m.phase,'heat');};
const heatPulse=(m,electrical=HEAT_PULSE_TARGET)=>{assert.ok(m.heatStart());const rate=m.state.heat.rate;step(m,electrical/rate);return m.heatStop();};
const finishHeat=m=>{let limit=3;while(m.phase==='heat'&&limit-->0){const e=heatPulse(m);assert.ok(['charged','won'].includes(e.result));}assert.equal(m.phase,'flashback-end');};

for(const [key,items]of Object.entries(sequences))check('Data schema '+key,items.length>0&&items.every(v=>['id','speaker','text','mood','gesture','event','next'].every(k=>k in v)));
for(const [key,items]of Object.entries({chargeLines,captchaLines,heatDemoLines,finalAmmoLines}))check('Timed schema '+key,items.every(v=>Number.isFinite(v.at)&&v.at>=0));
check('Three food choices only',dinnerChoices.length===3&&dinnerChoices.map(v=>v.id).join('')==='ABC');
check('Ten charge lines cover thirty seconds',chargeLines.length===10&&chargeLines[0].at===0&&chargeLines.at(-1).at===27&&CHARGE_DURATION===30);
check('At least fourteen complete chatter groups',chatterGroups.length>=14&&chatterGroups.every(v=>v.length>=2&&v.length<=4));
check('Five hotspot types with three groups each',Object.keys(hotspots).length===5&&Object.values(hotspots).every(v=>v.length>=3));
check('Clear event requests machine room closeup',sequences.briefing.some(v=>v.event==='server-closeup'&&v.text.includes('眨眼')));
check('Approved patrol line is present',sequences.briefing.some(v=>v.text.replace('\n','').includes('真沒品味。移交巡衛隊，立案查辦。')));
check('Fourth wall construction joke retained',sequences.briefing.some(v=>v.text.includes('ChatGPT 6.0 Astra'))&&sequences.briefing.some(v=>v.text.includes('十張重置券')&&v.text.includes('當靶')));
check('Concrete light pollution is lux',sequences.briefing.some(v=>v.text.includes('10.5 lux')&&v.text.includes('0.5 lux')));
check('Charge includes insurance joke',chargeLines.some(v=>v.text.includes('天災打雷險'))&&chargeLines.some(v=>v.text.includes('局部雷雨')));
check('Energy VCR cue replaces heat-loss joke',sequences.energy.some(v=>v.text.includes('VCR'))&&!sequences.energy.some(v=>v.text.includes('散熱')));
check('Flashback contains short fictional PHP and game outage jokes',sequences.flashback.some(v=>v.text.includes('PHP'))&&sequences.flashback.some(v=>v.text.includes('賽馬娘')));
check('Persistent keep-warm explains present loss',sequences['flashback-end'].some(v=>v.text.includes('持續運轉'))&&sequences['flashback-end'].some(v=>v.text.includes('保溫'))&&sequences['flashback-end'].some(v=>v.text.includes('這麼黑')));
check('Live server dialogue follows VCR',sequences.last[0].text.includes('伺服器')&&sequences.last[1].text.includes('還在上傳')&&sequences.last[2].text.includes('最該壞'));
check('Dragon startled instead of dessert bargain',sequences.last.some(v=>v.text.includes('三小'))&&!sequences.last.some(v=>v.text.includes('甜點')));
check('Pear survival is no-loss criterion',sequences.landing.some(v=>v.text.includes('梨花呢'))&&sequences.landing.some(v=>v.text.includes('無損失')));
check('Every ending line has three seconds',LANDING_DURATION===12&&LANDING_DURATION/sequences.landing.length===3&&TOUR_DURATION===16);
check('Demo credentials and three increasing pulse speeds',CONNECTION_ACCOUNT==='endfield_power'&&CONNECTION_PASSWORD==='5201314'&&HEAT_PULSES.length===3&&near(HEAT_TARGET,.3)&&HEAT_PULSES.every((v,i)=>near(HEAT_PULSE_TARGET/v.rate,[1.25,1,.8][i])));
check('Pulse windows get narrower while the visual target stays centred',HEAT_PULSES.every((v,i)=>v.successMin<.1&&v.successMax>.1&&(i===0||v.successMax-v.successMin<HEAT_PULSES[i-1].successMax-HEAT_PULSES[i-1].successMin))&&HEAT_BURN>.125);
check('Meter linear triangle reaches both ends',meterPosition(0)===0&&near(meterPosition(.675),.5)&&near(meterPosition(1.35),1)&&near(meterPosition(2.025),.5)&&meterPosition(2.7)===0);
check('Original meter boundaries preserved',judgeMeter(.12).result==='miss'&&judgeMeter(.88).result==='miss'&&judgeMeter(.5).result==='perfect'&&judgeMeter(.35).result==='strong'&&judgeMeter(.2).result==='hit');

const ready=new MissionMachine();ready.setAuto(true);step(ready,3600);
check('Opening waits indefinitely despite auto',ready.phase==='ready'&&!ready.node&&!ready.branch&&!ready.ended&&ready.castingElapsed===0);
check('Opening rejects every interactive game action',!ready.key('a')&&!ready.submitLogin()&&!ready.verify()&&!ready.setLever(1)&&!ready.heatStart()&&!ready.heatStop()&&!ready.heatRetry()&&!ready.heatCancel());

for(const branch of ['A','B','C']){
 const dinners=[],stages=[],attacks=[],actions=[];
 const m=new MissionMachine({onDinner:v=>dinners.push(v),onStage:(phase,s)=>{assert.equal(phase,s.phase);stages.push(phase);},onAttack:e=>attacks.push(e),onAction:e=>actions.push(e)});
 m.setTargets([{id:'front',label:'店面外牆'},{id:'roof',label:'屋頂'}]);m.start();toPhase(m,'choice');m.setAuto(true);step(m,600);
 check('Food choice never times out '+branch,m.phase==='choice'&&!m.branch&&m.state.choices.length===3);
 check('Unknown dinner rejected '+branch,!m.choose('D'));
 m.choose(branch);check('Correct dinner prop '+branch,m.branch===branch&&dinners.at(-1)===branch);
 m.setAuto(false);toPhase(m,'login');const castStart=m.time;
 check('Briefing reaches fresh account keyboard '+branch,m.state.connection.field==='account'&&m.state.connection.value===''&&m.castingElapsed===0&&!m.next()&&!m.skip());
 check('Keyboard rejects invalid key shapes '+branch,!m.key('!')&&!m.key('E')&&!m.key('endfield')&&!m.key('1'));
 m.key('x');check('Wrong account stays editable '+branch,!m.submitLogin()&&m.state.connection.error.length>0&&m.state.connection.value==='x');
 m.key('backspace');check('Backspace removes exactly one character '+branch,m.state.connection.value==='');
 type(m,'endfield_');m.key('clear');check('Clear removes only current field '+branch,m.state.connection.value===''&&m.state.connection.field==='account');
 type(m,CONNECTION_ACCOUNT);m.setAuto(true);step(m,90);
 check('Typed account never auto-submits '+branch,m.phase==='login'&&m.state.connection.field==='account');
 m.setAuto(false);const loginBeforePause=m.state;m.setPaused(true);step(m,50);
 check('Pause freezes keyboard clock and inputs '+branch,m.time===loginBeforePause.time&&!m.key('a')&&!m.submitLogin()&&!m.replayPrompt()&&m.state.connection.value===CONNECTION_ACCOUNT);
 m.setPaused(false);m.submitLogin();
 check('Valid account advances only to password '+branch,m.phase==='login'&&m.state.connection.field==='password'&&m.state.connection.account===CONNECTION_ACCOUNT&&m.node===connectionPrompts.password);
 check('Password rejects letters '+branch,!m.key('a'));
 m.key('0');check('Wrong password remains correctable '+branch,!m.submitLogin()&&m.phase==='login'&&m.state.connection.error.length>0);m.key('clear');type(m,CONNECTION_PASSWORD);
 check('Password dictation can be replayed '+branch,m.replayPrompt()&&m.node===connectionPrompts.password&&m.state.connection.password===CONNECTION_PASSWORD);
 m.submitLogin();check('Password opens mock captcha and clears error '+branch,m.phase==='captcha'&&!m.state.connection.error&&!m.state.connection.verified&&!m.verify());
 step(m,3);check('Captcha gives creature joke time '+branch,m.node.text.includes('連人都不是')&&!m.state.connection.captchaReady);
 step(m,3);check('Captcha final prompt waits for player '+branch,m.node.text.includes('機器人')&&m.state.connection.captchaReady);
 m.setAuto(true);step(m,60);check('Captcha never verifies itself '+branch,m.phase==='captcha'&&!m.state.connection.verified);m.setAuto(false);
 m.verify();check('Checkbox succeeds and exposes lever '+branch,m.phase==='lever'&&m.state.connection.verified&&m.node.text.includes('國文題'));
 check('Lever rejects non-finite input '+branch,!m.setLever(NaN)&&!m.setLever(Infinity)&&!m.setLever('1'));
 m.setLever(-2);check('Lever clamps negative input '+branch,m.state.connection.lever===0);
 m.setLever(.6);step(m,50);check('Partial lever waits indefinitely '+branch,m.phase==='lever'&&near(m.state.connection.lever,.6)&&m.node===connectionPrompts.lever);
 m.setPaused(true);check('Pause blocks lever and verify '+branch,!m.setLever(1)&&!m.verify());m.setPaused(false);
 m.setLever(.98);check('Full lever explicitly starts charge '+branch,m.phase==='charge'&&m.state.connection.lever===1&&m.state.charge===0);
 check('Action stream describes key, verification and grid '+branch,actions.some(v=>v.type==='key'&&v.value==='e')&&actions.some(v=>v.type==='verify')&&actions.some(v=>v.type==='grid-connect')&&actions.every(v=>Number.isFinite(v.time)));
 const start=m.time,entered=m.entered,heard=new Set([m.node.id]);
 check('Charge cannot be skipped or fired '+branch,!m.skip()&&!m.next()&&!m.attack());
 for(let second=1;second<=29;second++){step(m,1);heard.add(m.node.id);}
 check('Charge still waits before thirty seconds '+branch,m.phase==='charge'&&near(m.time-start,29)&&m.state.charge<100&&heard.size===10);
 const chargeBefore=m.state;m.setPaused(true);step(m,77);check('Pause freezes charge and casting '+branch,m.time===chargeBefore.time&&m.entered===entered&&m.castingElapsed===chargeBefore.castingElapsed);m.setPaused(false);
 step(m,1);check('Charge completes at thirty active seconds '+branch,m.phase==='combat'&&near(m.entered,start+30)&&m.state.charge===100&&m.castingElapsed>m.time-castStart-1e-8);
 check('Target selection validates ids '+branch,m.selectTarget('roof')&&m.target==='roof'&&!m.selectTarget('missing'));
 check('Non-combat inputs cannot escape combat '+branch,!m.key('e')&&!m.verify()&&!m.setLever(1)&&!m.heatStart());
 const beforeMiss=m.state,miss=attackAt(m,0);check('Edge MISS consumes no energy '+branch,miss.result==='miss'&&m.progress===beforeMiss.progress&&m.state.energy===beforeMiss.energy&&miss.damage===0);
 const hit=attackAt(m,.2),strong=attackAt(m,.35),perfect=attackAt(m,.5);check('Accuracy changes damage '+branch,hit.damage>0&&strong.damage>hit.damage&&perfect.damage>strong.damage&&perfect.result==='perfect');
 check('Single input cannot fire twice '+branch,!m.attack());
 m.holdAttack(4.4);const hold=m.attackHoldUntil;m.holdAttack(1);check('Sign cinematic hold cannot be shortened '+branch,m.attackHoldUntil===hold&&!m.state.canAttack&&!m.attack()&&!m.holdAttack(-1));
 step(m,4.39);check('Hold waits until exact ending '+branch,m.state.attackHeld&&!m.state.canAttack);step(m,.02);check('Hold unlocks without stopping clock '+branch,!m.state.attackHeld&&m.state.canAttack);
 while(m.phase==='combat')attackAt(m,.5);
 check('Damage stops at99 for energy mystery '+branch,m.phase==='energy'&&m.progress===99&&m.state.energy===0&&!m.ended);
 const preserved={progress:m.progress,branch:m.branch,shots:m.shots,hits:m.hits,output:m.output,target:m.target};
 step(m,300);check('Energy dialogue cannot auto-skip into VCR '+branch,m.phase==='energy'&&m.progress===99&&!m.attack());
 toPhase(m,'rewind');const castingFrozen=m.castingElapsed;
 check('VCR snapshot preserves progress, branch and attacks '+branch,m.state.vcr&&m.state.rewindProgress===0&&JSON.stringify(m.vcrSnapshot)===JSON.stringify(preserved));
 step(m,.39);check('Rewind freezes its opening frame '+branch,m.state.rewindProgress===0&&m.state.rewindStage==='freeze');
 step(m,3.01);check('Rewind reports meaningful reverse progress '+branch,near(m.state.rewindProgress,.5)&&m.state.rewindStage==='reverse'&&m.castingElapsed===castingFrozen&&!m.next()&&!m.skip());
 const reverseBefore=m.state;m.setPaused(true);step(m,100);check('Pause freezes rewind and its duration '+branch,m.state.rewindProgress===reverseBefore.rewindProgress&&m.state.vcrElapsed===reverseBefore.vcrElapsed);m.setPaused(false);
 step(m,3);check('Rewind reaches assembled doorway before CCTV '+branch,m.phase==='rewind'&&near(m.state.rewindProgress,1)&&m.state.rewindStage==='settle');
 step(m,.6);check('Rewind opens CCTV dialogue '+branch,m.phase==='flashback'&&m.state.vcr&&m.node.speaker==='clerk'&&m.progress===99);
 check('VCR prevents main combat and food input '+branch,!m.attack()&&!m.choose('A')&&!m.selectTarget('roof'));
 toPhase(m,'heat-demo');step(m,2.9);check('First scripted failed heating stays in first cycle '+branch,m.phase==='heat-demo'&&m.state.heat.demoIndex===0&&m.state.heat.demoProgress>.9);
 step(m,.2);check('Second scripted failure is distinct '+branch,m.state.heat.demoIndex===1&&m.node.event==='heat-attempt-two');
 check('Failed demonstrations cannot be skipped '+branch,!m.skip()&&!m.heatStart());
 step(m,2.9);check('Six-second demonstrations open player heating '+branch,m.phase==='heat'&&m.state.heat.status==='ready'&&m.state.heat.attempts===0);
 m.setAuto(true);step(m,50);check('Heating waits for a real press '+branch,m.phase==='heat'&&m.state.heat.status==='ready'&&m.state.heat.electricalTime===0);m.setAuto(false);
 m.heatStart();step(m,.4);const cold=m.heatStop();check('Early release is cold and retryable '+branch,cold.result==='cold'&&m.phase==='heat'&&!m.heatStart()&&m.state.heat.attempts===1);
 check('Retry keeps main history and demo damage '+branch,m.heatRetry()&&m.state.heat.status==='ready'&&m.progress===99&&m.shots===preserved.shots&&m.branch===branch);
 m.heatStart();step(m,2);check('Unreleased pulse burns automatically '+branch,m.phase==='heat'&&m.state.heat.status==='burnt'&&!m.state.heat.holding&&near(m.state.heat.pulseTime,HEAT_BURN));
 m.heatRetry();const first=heatPulse(m);
 check('First good pulse waits for the player to start the second '+branch,first.result==='charged'&&m.phase==='heat'&&m.state.heat.status==='ready'&&m.state.heat.completed===1&&m.state.heat.round===1&&near(m.state.heat.electricalTime,.1)&&m.state.heat.lastResult==='charged');
 const nextRate=m.state.heat.rate;step(m,40);check('Success never starts another pulse automatically '+branch,m.state.heat.completed===1&&!m.state.heat.holding&&m.state.heat.status==='ready');
 m.heatStart();step(m,.3);m.setPaused(true);const pausedHeat=m.state;step(m,70);
 check('Pause cuts the current pulse but preserves completed energy '+branch,m.state.heat.completed===1&&near(m.state.heat.electricalTime,.1)&&!m.state.heat.holding&&m.state.heat.status==='ready'&&m.time===pausedHeat.time);
 check('Pause rejects heat release or new press '+branch,!m.heatStop()&&!m.heatStart());m.setPaused(false);
 m.heatStart();step(m,.3);check('Cancelled pointer keeps the earlier successful pulse '+branch,m.heatCancel()&&m.state.heat.completed===1&&near(m.state.heat.electricalTime,.1)&&m.state.heat.status==='ready'&&!m.heatCancel());
 m.heatStart();step(m,.2);m.heatStop();check('Cold retry preserves the previous pulse '+branch,m.state.heat.status==='cold'&&m.heatRetry()&&m.state.heat.completed===1&&m.state.heat.rate===nextRate);
 const second=heatPulse(m);check('Second pulse advances to the faster narrower third '+branch,second.result==='charged'&&m.state.heat.completed===2&&m.state.heat.round===2&&near(m.state.heat.electricalTime,.2)&&m.state.heat.rate>nextRate);
 m.heatStart();step(m,2);check('Third pulse can still burn '+branch,m.state.heat.status==='burnt'&&m.state.heat.completed===2);
 check('Burn retry replaces the meal and restarts the three pulses '+branch,m.heatRetry()&&m.state.heat.completed===0&&m.state.heat.round===0&&m.state.heat.electricalTime===0&&m.state.heat.rate===HEAT_PULSES[0].rate);
 heatPulse(m);heatPulse(m);const won=heatPulse(m);check('Three controlled pulses produce exactly0.3seconds '+branch,won.result==='won'&&near(won.electricalTime,.3)&&m.state.heat.completed===3&&near(m.state.heat.progress,1)&&m.phase==='flashback-end'&&m.progress===99);
 check('Success cannot cook twice or retry '+branch,!m.heatStart()&&!m.heatRetry()&&!m.heatStop());
 toPhase(m,'return');const vcrEnding=m.state;step(m,2.99);check('Return transition lasts three seconds '+branch,m.phase==='return'&&m.state.returnProgress>.99&&m.state.vcr&&m.progress===99);
 step(m,.01);check('Return restores99and exact dinner/attack history '+branch,m.phase==='last'&&!m.state.vcr&&m.progress===preserved.progress&&m.branch===preserved.branch&&m.shots===preserved.shots&&m.hits===preserved.hits&&m.output===preserved.output&&m.target===preserved.target&&m.state.energy===0);
 check('Casting clock excludes all VCR time '+branch,near(m.castingElapsed,castingFrozen)&&vcrEnding.vcrElapsed>REWIND_DURATION+HEAT_DEMO_DURATION);
 check('VCR action hooks each occur once '+branch,actions.filter(v=>v.type==='vcr-freeze').length===1&&actions.filter(v=>v.type==='vcr-return').length===1&&dinners.length===2);
 toPhase(m,'aim-final');check('Aim phase retains shocked Dragon dialogue '+branch,m.node.speaker==='dragon'&&m.node.mood==='shock');
 const finalMiss=attackAt(m,.2);check('Finisher requires center timing '+branch,finalMiss.result==='miss'&&!finalMiss.finisher&&m.phase==='aim-final'&&m.progress===99);
 const final=attackAt(m,.5);check('Finisher starts exactly once '+branch,final.finisher&&m.phase==='finisher'&&!m.attack()&&attacks.filter(e=>e.finisher).length===1);
 const flight=m.time;step(m,8.99);check('Finisher retains all nine seconds '+branch,m.phase==='finisher'&&m.progress===99&&!m.ended);step(m,.01);
 check('Finisher reaches landing at nine seconds '+branch,m.phase==='landing'&&near(m.entered,flight+9)&&m.progress===99);
 for(let i=1;i<sequences.landing.length;i++){step(m,3);check('Readable landing line '+i+' '+branch,m.node===sequences.landing[i]&&m.phase==='landing');}
 step(m,2.99);check('100waits for full dialogue '+branch,m.phase==='landing'&&m.progress===99);step(m,.01);
 check('Ending tour begins after landing at100 '+branch,m.phase==='tour'&&m.progress===100&&!m.ended&&!m.node&&!m.hotspot('dragon'));
 const tourStart=m.time;step(m,TOUR_DURATION-.01);check('Ending montage cannot be cut by auto '+branch,m.phase==='tour'&&m.progress===100&&!m.ended);step(m,.01);
 check('Tour reaches live ending after16seconds '+branch,m.phase==='complete'&&m.progress===100&&m.ended&&near(m.entered,tourStart+TOUR_DURATION));
 check('Ending quiet interval is eight to fourteen seconds '+branch,m.quietUntil-m.time>=8&&m.quietUntil-m.time<=14);
 check('End hotspot starts one group '+branch,m.hotspot('dragon')&&m.state.sequenceKind==='hotspot'&&!m.hotspot('zhuang'));
 while(m.node)advance(m);check('Hotspot cooldown prevents flood '+branch,!m.hotspot('dragon'));
 step(m,m.quietUntil-m.time+.1);check('Chatter begins after quiet '+branch,m.phase==='complete'&&m.state.sequenceKind==='chat'&&!!m.node);
 m.replay();check('Replay resets credentials, heat, hold and VCR '+branch,m.phase==='choice'&&m.progress===0&&!m.branch&&!m.ended&&m.shots===0&&m.state.connection.account===''&&m.state.connection.password===''&&!m.state.connection.verified&&m.state.heat.status==='ready'&&m.heatAttempts===0&&m.state.heat.completed===0&&m.state.heat.failures===0&&!m.vcrSnapshot&&m.castingElapsed===0&&m.attackHoldUntil===0&&dinners.at(-1)===null);
 check('Every important phase delivered '+branch,['intro','choice','meal','briefing','login','captcha','lever','charge','combat','energy','rewind','flashback','heat-demo','heat','flashback-end','return','last','aim-final','finisher','landing','tour','complete'].every(v=>stages.includes(v)));
}

const modes=new MissionMachine();intoCombat(modes);const p0=modes.state.meterPeriod;
check('Invalid output rejected',!modes.setOutput('missing')&&modes.state.output==='steady');
check('Overload narrows and accelerates visible meter',modes.setOutput('overload')&&modes.state.meterPeriod<p0&&modes.state.meterSettings.width<outputModes[0].width);
const over=attackAt(modes);check('Overload damage and recoil are real metadata',over.damage===27&&over.mode==='overload'&&over.recoil>1.5);
check('Shot resets input sweep',modes.state.meterElapsed===0&&modes.state.meter===0);
check('Overload can miss where steady hits',judgeMeter(.2,false,outputModes[0]).result==='hit'&&judgeMeter(.2,false,outputModes[2]).result==='miss');
modes.setPaused(true);check('Pause locks output mode',!modes.setOutput('steady'));modes.setPaused(false);modes.setOutput('steady');check('Destruction increases tempo',modes.state.meterPeriod<METER_PERIOD&&modes.state.meterSettings.stage===1);

const late=new MissionMachine();intoCombat(late);const origin=late.sourceTime;step(late,1);const delayed=late.attack(origin+.675);
check('Delayed shot uses original event timestamp',delayed.result==='perfect'&&near(delayed.position,.5));
const pauseMeter=new MissionMachine();intoCombat(pauseMeter);step(pauseMeter,.45);const frozen=pauseMeter.state.meter;pauseMeter.setPaused(true);step(pauseMeter,50);
check('Paused meter does not move',pauseMeter.state.meter===frozen&&!pauseMeter.attack());pauseMeter.setPaused(false);step(pauseMeter,.225);check('Meter resumes without a jump',near(pauseMeter.state.meter,.5));

const delayedHeat=new MissionMachine();intoCombat(delayedHeat);toHeat(delayedHeat);delayedHeat.heatStart();const heatSource=delayedHeat.sourceTime;step(delayedHeat,2);
check('Late rendered frame can show safety cut',delayedHeat.state.heat.status==='burnt');const correction=delayedHeat.heatStop(heatSource+1.25);
check('Original release timestamp wins despite late render',correction.result==='charged'&&delayedHeat.phase==='heat'&&delayedHeat.state.heat.completed===1&&near(correction.pulseTime,.1)&&delayedHeat.state.heat.failures===0);
const delayedCold=new MissionMachine();intoCombat(delayedCold);toHeat(delayedCold);delayedCold.heatStart();const coldSource=delayedCold.sourceTime;step(delayedCold,2);const correctedCold=delayedCold.heatStop(coldSource+.5);
check('A corrected early release keeps exactly one failure',correctedCold.result==='cold'&&delayedCold.state.heat.failures===1&&delayedCold.state.heat.completed===0);
for(let round=0;round<3;round++)for(const edgeName of ['successMin','successMax']){
 const edge=new MissionMachine();intoCombat(edge);toHeat(edge);for(let n=0;n<round;n++)heatPulse(edge);
 const value=HEAT_PULSES[round][edgeName],result=heatPulse(edge,value);
 check('Inclusive pulse success boundary '+round+' '+edgeName,result.result===(round===2?'won':'charged'));
}
for(let round=0;round<3;round++)for(const [side,offset]of [['cold',-1],['burnt',1]]){
 const edge=new MissionMachine();intoCombat(edge);toHeat(edge);for(let n=0;n<round;n++)heatPulse(edge);
 const setting=HEAT_PULSES[round],value=setting[side==='cold'?'successMin':'successMax']+offset*.00001,result=heatPulse(edge,value);
 check('Outside pulse window fails '+round+' '+side,result.result===side&&edge.phase==='heat'&&edge.state.heat.completed===round);
}
const delayedThird=new MissionMachine();intoCombat(delayedThird);toHeat(delayedThird);heatPulse(delayedThird);heatPulse(delayedThird);delayedThird.heatStart();const thirdSource=delayedThird.sourceTime;step(delayedThird,2);
const correctedFinal=delayedThird.heatStop(thirdSource+.8);check('Original third release can correct a rendered burn to final success',correctedFinal.result==='won'&&delayedThird.phase==='flashback-end'&&near(correctedFinal.electricalTime,.3));

const backward=new MissionMachine();backward.update(100);const bt=backward.time;backward.update(50);check('Source clock never reverses',backward.time===bt&&backward.sourceTime===100);
const jumped=new MissionMachine();intoCombat(jumped);toHeat(jumped);finishHeat(jumped);toPhase(jumped,'return');step(jumped,3);toPhase(jumped,'aim-final');attackAt(jumped);step(jumped,60);
check('Late frame catches up final cinematics once',jumped.phase==='complete'&&jumped.progress===100&&jumped.ended);

const result={passed:true,checks:checks.length,kind:'V9 deterministic story/input/clock checks; not browser or iPhone performance',results:checks};
fs.writeFileSync('artifacts/v9-mission-check.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({passed:true,checks:checks.length}));
