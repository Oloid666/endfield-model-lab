import assert from 'node:assert/strict';
import {createIndoorGame,route,LENGTH,CHECKPOINTS} from '../src/indoor/game.js';
for(const hz of [30,60,120]){
 const g=createIndoorGame();g.state.running=true;let minSpeed=1;
 for(let i=0;i<hz*110&&!g.state.finished;i++){for(let j=0;j<120/hz;j++)g.step(1/120);if(g.state.time>2&&g.state.s<LENGTH-.1)minSpeed=Math.min(minSpeed,g.state.speed);}
 assert(g.state.finished,'no-input driving can escape');assert(g.state.time>60&&g.state.time<100);assert.equal(g.state.checkpoint,2);assert.equal(g.state.recoveries,0);assert(minSpeed>.2,'goods never block or slow the path');assert(g.state.goods.some(b=>b.hit));
 const before=g.state.time;g.step(.1);assert.equal(g.state.time,before);
 console.log('PASS auto escape',hz,g.state.time.toFixed(2),g.state.score);
}
for(const checkpoint of [0,1,2]){
 const g=createIndoorGame();g.state.running=true;
 while(g.state.checkpoint<checkpoint)g.step(1/120);
 const savedS=g.state.s,score=g.state.score;g.state.liquid=3;
 for(let i=0;i<125;i++)g.step(1/120,{brake:true});
 assert.equal(g.state.recoveries,1);assert(g.state.liquid<route(g.state.dragonS).y);assert(g.state.riseHold>2);assert(g.state.s>=savedS-.01);assert(g.state.score===score);
 for(let i=0;i<120*110&&!g.state.finished;i++)g.step(1/120,{steer:Math.sin(i/100)});
 assert(g.state.finished,'rescue never creates a doomed checkpoint');
 g.reset();assert.equal(g.state.checkpoint,0);assert.equal(g.state.recoveries,0);assert(g.state.goods.every(b=>!b.hit));assert.equal(g.state.time,0);
}
const paused=createIndoorGame();paused.step(1);assert.equal(paused.state.time,0);
for(const s of CHECKPOINTS)assert(route(s).y>.5);
console.log('PASS checkpoint water rollback, grace period, score rollback, reset and pause');
