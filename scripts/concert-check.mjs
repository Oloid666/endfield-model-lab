import assert from 'node:assert/strict';
import {songCamera} from '../src/concert-stage.js';
import {MissionMachine,CONNECTION_ACCOUNT,CONNECTION_PASSWORD} from '../src/mission-state.js';
const d=[-8,2.8,-2];for(let t=0;t<25;t+=.1){const s=songCamera(d,t,{trapped:true});assert(s.position[2]>d[2]+1.5);assert(s.position.every(Number.isFinite));}
const start=songCamera([0,4,6],0),end=songCamera([0,4,6],20);assert.notDeepEqual(start.position,end.position);for(let t=0;t<30;t+=.1)assert(songCamera([-2.25,4.3,6.2],t).position[2]>2.5);
assert.deepEqual(songCamera(d,0,{reduced:true}),songCamera(d,20,{reduced:true}));
const m=new MissionMachine();m.phaseTo('login');m.connection.account=CONNECTION_ACCOUNT;m.submitLogin();assert(m.loginAside.includes('帳號對了'));m.connection.password=CONNECTION_PASSWORD;m.submitLogin();assert.equal(m.phase,'verify-talk');assert.equal(m.node.event,'password-correct');assert(m.node.text.includes('偷偷愛管理員'));assert.equal(m.loginAside,'');m.next();m.next();assert(m.node.text.includes('我不是機器人'));
console.log('Concert wall clearance, reduced motion and password dialogue checks passed.');
