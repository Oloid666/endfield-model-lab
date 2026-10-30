import assert from 'node:assert/strict';
import {createReactions,strikeReaction,stepReactions} from '../src/indoor/reactions.js';
import {createIndoorGame} from '../src/indoor/game.js';
const r=createReactions(),seen=new Set();
for(let i=0;i<10;i++){assert(strikeReaction(r,'player',.8,'snack',-1));seen.add(r.player.mode);assert(!strikeReaction(r,'player',.8));stepReactions(r,.5);}
assert.equal(seen.size,5);assert.equal(r.player.damage,4);assert.equal(r.dragon.hits,0);
const g=createIndoorGame();g.reset('2');assert.equal(g.state.goods.length,48);g.state.running=true;
for(let i=0;i<4800&&!g.state.finished;i++){const s=g.state;g.step(1/120,{steer:Math.sin(s.time*3)});}
assert(g.state.finished);assert(g.state.goods.filter(g=>g.hit).length>=8);assert(g.state.reactions.player.hits>0);assert(g.state.reactions.dragon.hits>0);
const t=g.state.reactions.player.age;g.step(1);assert.equal(g.state.reactions.player.age,t);g.reset();assert.equal(g.state.reactions.player.damage,0);assert.equal(g.state.reactions.dragon.hits,0);
console.log('PASS impact variants, cooldown, nonblocking dense goods, finish, pause, injuries and restart');
