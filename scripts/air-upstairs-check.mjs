import assert from 'node:assert/strict';
import * as T from 'three';
import {MissionMachine} from '../src/mission-state.js';
import {trayRescueFrame,rescueTiming} from '../src/tray-rescue.js';
import {createBonusRoom} from '../src/bonus-room.js';
let checks=0;const check=(name,ok)=>{assert.ok(ok,name);checks++;};
const m=new MissionMachine();m.trayOwner='dragon';m.phaseTo('aim-final');let clock=0;
for(const [age,owner] of [[5.49,'dragon'],[5.51,'air'],[6.99,'air'],[7,'helper'],[11.99,'helper'],[12,'helper']]){m.update(age);clock=age;check('Only the correct owner controls a single tray',m.trayOwner===owner);check('No firing before the meal is safely guarded',m.state.canAttack===(age>=12));}
const donor=[-2,5.7,15.6],frame={handoffPoint:[...donor]};let prior=null;
for(let i=0;i<=18*60;i++){const age=i/60,f=trayRescueFrame(age,donor,undefined,frame);check('No eye emoji is used',f.emoji!=='👀');check('Creature uses short reachable arms',f.height<=.65);if(prior)check('No teleport during toss/contact/transport',Math.hypot(...f.tray.map((v,k)=>v-prior[k]))<.15);if(age>=7)check('Same-frame palms support the real tray',Math.abs(f.tray[1]-f.base[1]-f.height)<1e-9);prior=[...f.tray];}
const start=[...trayRescueFrame(5.5,donor).tray],end=[...trayRescueFrame(7,donor).tray];check('Tray leaves from the real held position',start.every((x,i)=>x===donor[i]));check('Tray falls from high to a reachable catch',start[1]-end[1]>4&&end[1]<.8);check('Holding height is never lowered by the cue',Array.from({length:120},(_,i)=>rescueTiming(i/10).lowered).every(x=>x===0));
const ctx=new Proxy({measureText:s=>({width:s.length*60}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(()=>{})});globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})};globalThis.matchMedia=()=>({matches:false});
const room=createBonusRoom(),renderer={setRenderTarget(){},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}};
let t=0;for(const mode of ['claims','classroom'])for(const [width,height] of [[390,330],[380,390],[780,768]]){
 room.setMode(mode);room.enter(t);room.board('題目',['第一個重點','第二個重點'],1,t);for(let i=0;i<150;i++)room.render(renderer,t+=1/60,width,height);
 check('Wide room camera stays finite at every viewport',room.camera.position.toArray().every(Number.isFinite));
 check('Rain window exists in both rooms',room.scene.getObjectsByProperty('name','rain-window').length===2);
 room.stamp(t,'已受理');room.render(renderer,t+=.4,width,height);check('Stamp makes contact with the actual paper',Math.abs(room.state.stampContactError)<.001);
 if(mode==='classroom'){room.setFocus('reaction');for(let i=0;i<90;i++)room.render(renderer,t+=1/60,width,height);check('Reaction is a deliberate close-up',Math.abs(room.camera.fov-36)<.001);}
}
let shadows=0,external=0;room.scene.traverse(n=>{if(n.isLight&&n.castShadow)shadows++;if(n.isMesh&&n.material.map?.image?.src)external++;});check('No extra shadow maps or downloaded art',shadows===0&&external===0);room.dispose();console.log(`Air / upstairs: ${checks} checks passed.`);
