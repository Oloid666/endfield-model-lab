import assert from 'node:assert/strict';
import {createGA4,createRainAnalytics,analyticsURL} from '../src/analytics.js';
import {MissionMachine} from '../src/mission-state.js';
const sent=[],sink=(name,params)=>sent.push({name,...params}),a=createRainAnalytics(sink);
const count=name=>sent.filter(e=>e.name===name).length;
let restoring=false;
const m=new MissionMachine({onDinner:branch=>{if(!branch)a.start(restoring?'chapter_replay':'normal');},onStage:phase=>a.stage(phase)});
a.ready();a.ready();assert.equal(count('game_loaded'),1);
m.start();a.tick(0);a.tick(1000);a.tick(2000);a.tick(3000,{paused:true});a.tick(4000,{paused:true});a.tick(5000);a.tick(6000);assert.equal(a.state.activeSeconds,3);
a.tick(7000,{visible:false});a.flush();a.tick(100000);a.tick(101000);assert.equal(a.state.activeSeconds,4,'background and resume gap excluded');
m.phaseTo('cargo');m.phaseTo('cargo');assert.equal(sent.filter(e=>e.chapter_id==='cargo').length,1);
m.phaseTo('complete');m.returnToStreet();assert.equal(count('main_story_complete'),1,'street return cannot duplicate main ending');
a.bonus('rating',5);a.bonus('rating',8);a.bonus('complete');a.bonus('complete');assert.equal(count('rating_submit'),1);assert.equal(count('game_complete'),1);
m.replay();a.shortcut();m.returnToStreet();a.bonus('complete');assert.equal(count('main_story_complete'),1);assert.equal(count('game_complete'),1,'shortcut cannot count as normal completion');
restoring=true;m.restoreChapter('last');restoring=false;m.phaseTo('complete');a.bonus('rating_skip');a.bonus('complete');assert.equal(count('story_replay_complete'),1);assert.equal(count('game_complete'),1,'chapter replay cannot count as normal completion');
m.replay();a.tick(0);a.tick(1000);a.flush();a.flush();assert.equal(sent.at(-1).active_seconds_delta,1);assert.equal(a.state.activeSeconds,1);
assert.equal(count('game_start'),4);assert.equal(sent.filter(e=>e.name==='game_start').at(-1).is_replay,1);
assert.equal(analyticsURL('https://endfield10000t.aura87.online/?password=secret&utm_source=threads&utm_content=ai_creators#private'),'https://endfield10000t.aura87.online/?utm_source=threads&utm_content=ai_creators');
assert.equal(analyticsURL('javascript:alert(1)'),'');
function fixture(){const scripts=[],win={location:{href:'https://endfield10000t.aura87.online/?account=private&utm_source=threads'},navigator:{}},doc={referrer:'https://threads.com/?secret=private',head:{append:s=>scripts.push(s)},createElement:()=>({dataset:{}})};return {win,doc,scripts};}
for(const options of [{measurementId:''},{measurementId:'broken',production:true},{measurementId:'G-TEST123456',production:false}]){const f=fixture(),g=createGA4({...f,...options});g.pageView();assert(!g.enabled);assert.equal(f.scripts.length,0);assert(!f.win.dataLayer);}
const f=fixture(),g=createGA4({...f,production:true,measurementId:'G-TEST123456',version:'test'});g.pageView();g.send('rating_submit',{rating:5,password:'secret',photo:'private'});g.send('key',{password:'secret'});assert.equal(f.scripts.length,1);const commands=f.win.dataLayer.map(args=>Array.from(args));assert.equal(commands.filter(c=>c[0]==='event').length,2);assert(!JSON.stringify(commands).includes('private'));assert(!JSON.stringify(commands).includes('secret'));assert.equal(commands[1][2].send_page_view,false);assert.equal(commands[1][2].allow_google_signals,false);
const preview=fixture();preview.win.location.href='https://test.pages.dev/';const pg=createGA4({...preview,production:true,measurementId:'G-TEST123456'});pg.pageView();assert(!pg.enabled);assert.equal(preview.scripts.length,0);
const blocked=fixture();blocked.doc.head.append=()=>{throw Error('blocked');};assert.doesNotThrow(()=>createGA4({...blocked,production:true,measurementId:'G-TEST123456'}).pageView());
const dnt=fixture();dnt.win.navigator.doNotTrack='1';const d=createGA4({...dnt,production:true,measurementId:'G-TEST123456'});d.pageView();assert(!d.enabled);assert.equal(dnt.scripts.length,0);
assert.doesNotThrow(()=>createRainAnalytics(()=>{throw Error('offline');}).start());
console.log('PASS analytics: real mission hooks, normal/replay/shortcut separation, deduplication, active time, reset, disabled config, privacy, blocked transport and DNT');
