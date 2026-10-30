import assert from 'node:assert/strict';
import {createPassenger,strikePassenger,stepPassenger} from '../src/indoor/passenger.js';
import {createIndoorGame} from '../src/indoor/game.js';
const p=createPassenger();strikePassenger(p,.5,-1);assert.equal(p.mode,'scrape');assert.equal(p.falls,0,'single light scrape does not eject');strikePassenger(p,1,-1);stepPassenger(p,.01);assert.equal(p.mode,'slipping');
for(let i=0;i<300;i++)stepPassenger(p,1/120,{brake:true});assert.equal(p.mode,'seated');assert.equal(p.falls,0);assert.equal(p.saves,1,'controlled braking rescues a slipping passenger');
strikePassenger(p,1,1);strikePassenger(p,1,1);stepPassenger(p,.01);strikePassenger(p,1,1);strikePassenger(p,1,1);
for(let i=0;i<100;i++)stepPassenger(p,1/120,{speed:3,offset:.98,sideSpeed:2});assert.equal(p.mode,'fallen');assert.equal(p.falls,1);assert(Math.abs(p.x)>0,'rider separates from seat with independent displacement');
for(let i=0;i<420;i++)stepPassenger(p,1/120,{brake:true});assert.equal(p.mode,'seated');assert.equal(p.saves,2);assert(Math.abs(p.x)<.000001);
function run(hz,care){const g=createIndoorGame();g.reset('2');g.state.running=true;let brake=false;const seen=new Set();
 for(let frame=0;frame<hz*60&&!g.state.finished;frame++)for(let j=0;j<120/hz;j++){const s=g.state;if(s.passenger.risk>.38||s.passenger.mode==='fallen')brake=true;if(s.passenger.risk<.12&&s.passenger.mode==='seated')brake=false;
 g.step(1/120,{steer:care&&brake?Math.max(-1,Math.min(1,s.curvature*s.speed*s.speed*.35/7-s.offset*1.8-s.sideSpeed*.8)):Math.sin(s.time*3),brake:care&&brake});seen.add(s.passenger.mode);assert(Number.isFinite(s.passenger.x));}
 assert(g.state.finished);return {s:g.state,seen};}
const fast=run(60,false),care=run(60,true);assert(fast.s.passenger.falls>care.s.passenger.falls,'braking protects the actual passenger');assert.equal(care.s.passenger.falls,0);assert(care.s.passenger.saves>0);assert(fast.seen.has('fallen'));assert(care.seen.has('slipping'));assert(care.seen.has('recovering'));
for(const hz of [30,120]){const r=run(hz,true);assert.equal(r.s.passenger.falls,care.s.passenger.falls);assert.equal(r.s.passenger.saves,care.s.passenger.saves);assert(Math.abs(r.s.time-care.s.time)<.001);}
const reset=createIndoorGame();reset.state.running=true;reset.state.passenger.falls=4;reset.recover();assert.equal(reset.state.passenger.falls,4,'manual assistance does not erase crashes');reset.reset('3');assert.equal(reset.state.passenger.mode,'seated');assert.equal(reset.state.passenger.falls,0);assert.equal(reset.state.passenger.saves,0);
console.log('PASS passenger: light scrape, warning, independent fall, brake rescue, repeated hits, real-course protection, reset and 30/60/120Hz');
