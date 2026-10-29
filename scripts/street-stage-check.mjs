import {combatHitLine} from '../src/mission-dialogue.js';
import assert from 'node:assert/strict';
import * as T from 'three';
import {ShoppingJourney} from '../src/shopping-journey.js';
import {STREET_SONGS,songFrame} from '../src/street-songs.js';
import {groundPath} from '../src/ground-path.js';
import {buildAutomaticDoors} from '../src/auto-doors.js';
import {Resources} from '../src/resources.js';
let checks=0;const check=(name,ok)=>{assert.ok(ok,name);checks++;};
const jokes=[0,0,0];check('Song joke retained once',combatHitLine(1,jokes).includes('撥開'));check('Song joke replaced on repeat',combatHitLine(1,jokes).includes('採光'));check('Maintenance retained once',combatHitLine(2,jokes).includes('設備維護'));check('Maintenance replaced on repeat',combatHitLine(2,jokes).includes('露天'));
const ctx=new Proxy({measureText:s=>({width:s.length*12})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const r=new Resources(),scene=new T.Scene(),doors=buildAutomaticDoors(scene,r,r.material('#def'),[]),shop=new ShoppingJourney();
shop.update(20,0);check('Closed door stops Dragon outside the entrance',shop.state.waiting&&shop.position[2]===2.75&&!shop.state.collected);
for(let i=0;i<60;i++)doors.update(i/60,1/60,null,shop.position);check('Presence opens both door leaves',doors.canPass());
shop.update(3.7,doors.open);check('Counter wait occurs before food is collected',shop.state.atCounter&&!shop.state.collected);shop.update(1.5,1);check('Only completed pickup exposes meal',shop.state.collected&&shop.state.done);
const out=new ShoppingJourney(true);out.update(20,0);check('Return also waits inside doorway',out.state.waiting&&out.position[2]===1.05);out.update(4,1);check('Exit ends at the original outdoor mark',out.done&&out.position[2]===3.5);
const amount=doors.open;doors.update(200,0,null,null);check('Paused door does not advance',doors.open===amount);doors.triggerDoor();doors.requestPassage(201);doors.update(201,.1,null,null);check('Safety hold defeats manual close',doors.open>=amount);
for(const mode of ['collapse','restore']){check('Four songs in '+mode,STREET_SONGS[mode].length===4);for(const song of STREET_SONGS[mode]){check('Lyrics contain inline musical symbols',song.some(s=>/[🎹🎸🥁🎺🎷]/u.test(s)));check('Long songs remain readable',!songFrame(song,2.81).done);check('Each song has a finite ending',songFrame(song,120).done);}}
const obstacles=[{x:.6,z:-.32,w:.8,d:1.4},{x:2.85,z:.2,w:.86,d:2.1}];const path=groundPath([3.06,.33,1.65],[-1,.33,3.3],obstacles);check('Follower has a route through the shop',path.length>0);check('Follower crosses facade only inside doorway',path.filter(p=>Math.abs(p[2]-1.895)<.3).every(p=>p[0]>=-.52&&p[0]<=.08));check('Follower avoids counter and shelves',path.every(p=>!obstacles.some(o=>Math.abs(p[0]-o.x)<o.w/2+.2&&Math.abs(p[2]-o.z)<o.d/2+.2)));const near=groundPath([0,.33,3],[.6,.33,-.32],obstacles);check('Blocked follow targets resolve to a nearby safe cell',near.length>0&&!obstacles.some(o=>Math.abs(near.at(-1)[0]-o.x)<o.w/2+.2&&Math.abs(near.at(-1)[2]-o.z)<o.d/2+.2));r.dispose();console.log(`Street stage: ${checks} checks passed.`);
