import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {MissionMachine,CHARGE_DURATION,REWIND_DURATION,RETURN_DURATION,LANDING_DURATION,TOUR_DURATION,judgeMeter} from '../src/mission-state.js';
import {RhythmHeat} from '../src/rhythm-heat.js';
import {sequences,chargeLines,chatterGroups,hotspots,reactionPools} from '../src/mission-dialogue.js';
const checks=[];function check(name,condition){assert.ok(condition,name);checks.push(name);}
const step=(m,t)=>m.update(m.sourceTime+t);
function finish(m){for(let n=0;m.node&&n<100;n++){const phase=m.phase;if(m.state.presentationLocked)step(m,2);m.next();if(m.phase!==phase)return;} }
function rhythmWin(r,origin){
 r.start(origin);const notes=r.notes.map(n=>({...n}));
 for(const note of notes){check('Beat down accepted',r.down(origin+note.at));if(note.type==='hold')check('Hold release accepted',r.up(origin+note.end));}
 r.update(origin+notes.at(-1).end+1);
}
const lineClock=new MissionMachine();lineClock.start();step(lineClock,1);const ageBeforePause=lineClock.state.nodeElapsed;lineClock.setPaused(true);step(lineClock,50);check('Paused dialogue holds the shot clock',lineClock.state.nodeElapsed===ageBeforePause);lineClock.setPaused(false);step(lineClock,1);check('Dialogue shot clock resumes with the story',Math.abs(lineClock.state.nodeElapsed-ageBeforePause-1)<1e-9);lineClock.next();lineClock.next();check('A new line resets the shot clock',lineClock.state.nodeElapsed===0);
for(const route of ['floor']){
 const events=[],m=new MissionMachine({onAction:e=>events.push(e)});m.setTargets([{id:'structure',label:'店體',position:[0,3,1]}]);
 step(m,900);check('Opening waits',m.phase==='ready');m.start();finish(m);check('Purchase holds at counter',m.phase==='purchase');step(m,6);step(m,7);finish(m);check('Flight gate waits',m.phase==='photo-flight');m.fly(1,1);for(let j=0;j<7;j++)step(m,.1);m.fly(0,1);for(let j=0;j<18;j++)step(m,.1);m.fly(0,0);step(m,.6);check('Flight positioning opens camera',m.finishFlight());check('Dinner no longer blocks story',m.phase==='photo'&&m.branch==='A');
 m.setAuto(true);step(m,500);check('Photo never auto submits',m.phase==='photo');m.setPaused(true);check('Paused shutter rejected',!m.takePhoto());m.setPaused(false);m.takePhoto();check('Photo return is a timed gate',m.phase==='photo-return');step(m,2.5);finish(m);
 check('Review waits for send',m.phase==='photo-review');step(m,50);check('Review never auto sends',m.phase==='photo-review');
 m.setAuto(false);m.sendPhoto();step(m,1.2);check('Route produces distinct scene',m.phase===(route==='floor'?'cargo':'observation'));
 if(route==='floor')finish(m);finish(m);check('Incoming call waits',m.phase==='comm-request');step(m,50);check('Call never self accepts',m.phase==='comm-request');m.acceptCall();finish(m);check('Terminal deployment precedes input',m.phase==='terminal-deploy');step(m,6);check('Briefing reaches login',m.phase==='login');check('Kiss chunk reacts',m.keyChunk('kiss')&&m.loginAside.includes('誰親誰'));m.key('backspace');
 for(const chunk of ['endfield','_','power'])check('Account chunk accepted',m.keyChunk(chunk));check('Account auto confirms only after full value',m.connection.field==='password');
 for(const chunk of ['520','1314'])check('Password chunk accepted',m.keyChunk(chunk));check('Verification dialogue precedes input',m.phase==='verify-talk');check('No premature verification',!m.verify());finish(m);m.verify();finish(m);check('Lever waits',m.phase==='lever');
 check('Partial lever does not start charge',m.setLever(.5)&&m.phase==='lever');m.setLever(1);check('Authorization precedes ascent',m.phase==='ascent'&&m.state.text.includes('允許起飛'));step(m,5);check('Director reminder at half charge',m.phase==='director-reminder'&&m.state.charge===30);step(m,5);check('Shoe gate waits',m.phase==='shoe-view'&&!m.state.shoeReady&&!m.next());step(m,8);check('First full shoe orbit reveals choices',m.state.shoeReady);check('Another bowl restarts orbit',m.anotherBowl()&&!m.state.shoeReady&&m.state.shoeRounds===1);step(m,8);check('Shoe orbit holds partial charge',m.state.charge===30&&m.phase==='shoe-view');m.next();check('Pylon after shoes',m.phase==='pylon-link');step(m,4);check('Charge resumes from thirty percent',m.phase==='charge'&&m.state.charge===30);step(m,CHARGE_DURATION);check('Fire instruction gates combat',m.phase==='fire-ready'&&m.state.text.includes('充能完畢'));m.next();check('Combat starts',m.phase==='combat');
 for(let i=0;i<30&&m.phase==='combat';i++){step(m,1);const period=m.state.meterPeriod;const wanted=m.meterEntered+period/4;const next=wanted>m.time?wanted:wanted+Math.ceil((m.time-wanted)/period)*period;step(m,next-m.time);m.attack(m.sourceTime);}
 check('Combat reaches exhaustion',m.phase==='energy'&&m.progress===99);finish(m);check('VCR snapshot saved',m.phase==='rewind'&&m.vcrSnapshot.progress===99);const frozen=m.time;m.setPaused(true);step(m,100);check('Pause freezes VCR',m.time===frozen);m.setPaused(false);step(m,REWIND_DURATION);check('Flashback starts',m.phase==='flashback');finish(m);check('Hack gates progression',m.phase==='hack');
 m.setAuto(true);step(m,100);check('Hack not auto solved',m.phase==='hack');check('Hack invalid tile rejected',!m.hackRotate(9));m.hackSubmit();check('Incorrect route fails without leaving puzzle',m.phase==='hack'&&m.hackFailures===1);for(let i=0;i<4;i++)while(m.hackTurns[i]!==[1,0,2,3][i])m.hackRotate(i);m.hackSubmit();check('Administrator credentials revealed after puzzle',m.phase==='credentials'&&sequences.credentials.some(l=>l.text.includes('PHP 2 Shell')));m.setAuto(false);finish(m);check('Mandatory overload precedes input',m.phase==='heat-demo');step(m,6);check('Overload explains living meal',m.node.event==='meal-born'&&m.node.text.includes('電活'));check('Heat input locked during explanation',!m.heatStart());step(m,12);check('Player heat follows explanation',m.phase==='heat');
 m.heatStart(m.sourceTime);step(m,4);check('Missed notes fail normally after the scripted overload',m.rhythm.status==='burnt'&&m.rhythm.failures===1&&!m.rhythm.forced);m.heatRetry();
 for(let round=0;round<3;round++){
   const start=m.time;m.heatStart(m.sourceTime);const notes=m.rhythm.notes.map(n=>({...n}));
   for(const note of notes){const at=start+note.at;m.heatStart(m.sourceTime+at-m.time);if(note.type==='hold')m.heatStop(m.sourceTime+start+note.end-m.time);}
   step(m,notes.at(-1).end+1);
 }
 check('Rhythm wins and returns to dialogue',m.phase==='flashback-end');finish(m);check('Return phase',m.phase==='return');step(m,RETURN_DURATION);check('Return preserves damage and route',m.phase==='last'&&m.progress===99&&m.investigation===route);finish(m);check('Last ammo waits',m.phase==='aim-final');
 const period=m.state.meterPeriod;step(m,9+period/4);m.attack(m.sourceTime);check('Final shot starts animation',m.phase==='finisher');step(m,9+LANDING_DURATION+TOUR_DURATION);check('Completed',m.phase==='complete'&&m.progress===100);
 step(m,15);check('Aftermath stays alive',m.phase==='complete'&&!!m.node);check('Busy chatter blocks hotspot',!m.hotspot('phone'));m.replay();check('Replay resets all new state',m.phase==='intro'&&!m.photoTaken&&m.investigation===null&&m.rhythm.first&&m.hackMoves===0);
}
const r=new RhythmHeat();r.start(0);r.cancel();r.start(4);r.update(7);check('Cancel does not bypass forced surge',r.status==='burnt'&&r.failures===1);r.retry();const initialWindow=r.window;r.start(10);r.update(20);check('Real missed notes fail',r.status==='burnt'&&r.failures===2);r.retry();check('Failure widens timing and slows BPM',r.window>initialWindow);rhythmWin(r,30);check('Completed round retained',r.round===1);r.start(40);r.cancel();check('Cancel retains successful round',r.round===1&&r.status==='ready');
check('Meter still differentiates edge and centre',judgeMeter(0).result==='miss'&&judgeMeter(.5).result==='perfect');
check('Insurance pays off smuggling premise',chargeLines.some(v=>v.text.includes('都保了'))&&chargeLines.some(v=>v.text.includes('事故時間空白')));
check('Third-floor report waits for the energy scene',!reactionPools.hit.some(v=>v.includes('三樓'))&&sequences.energy.some(v=>v.text.includes('三樓已坍塌')));
check('CCTV hacker voice before explanation',sequences.flashback.findIndex(l=>l.mood==='thought')<sequences.flashback.findIndex(l=>l.speaker==='dragon'));
check('Every line has stable data fields',[...Object.values(sequences).flat(),...chatterGroups.flat(),...Object.values(hotspots).flat(2)].every(l=>['id','speaker','text','mood','gesture','next'].every(k=>k in l)));
check('At least fourteen aftermath groups',chatterGroups.length>=14);
await fs.writeFile(new URL('../artifacts/v14-mission-check.json',import.meta.url),JSON.stringify({passed:true,count:checks.length,checks},null,2)+'\n');console.log(`V14 mission: ${checks.length} checks passed.`);
