import assert from 'node:assert/strict';
import * as T from 'three';
import {Resources} from '../src/resources.js';
import {buildDinnerTray,buildBento} from '../src/dinner-art.js';
import {trayRescueFrame,rescueTiming} from '../src/tray-rescue.js';
import {MissionMachine} from '../src/mission-state.js';
import {buildDragon} from '../src/companion.js';
let checks=0;const check=(s,b)=>{assert.ok(b,s);checks++;};
const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>ctx})};globalThis.matchMedia=()=>({matches:false});
const r=new Resources(),scene=new T.Scene(),dinner=buildDinnerTray(r,scene),other=buildBento(r,scene,{variant:'xaihi'});
const before=dinner.bento.materials.map(m=>m.color.getHex());other.cook(1,1,1);
check('Burning the past bento does not recolor the rescued dinner',dinner.bento.materials.every((m,i)=>m.color.getHex()===before[i]));
check('All cooking ingredients change independently',other.materials.every(m=>!dinner.bento.materials.includes(m)));
scene.updateMatrixWorld(true);check('Heating instructions belong to the physical food package',other.label.parent===other.root&&other.label.position.z>.09);
const solids=new T.Box3().setFromObject(dinner.bento.solids);check('Food is volumetric and sits above the moulded box',solids.max.y-solids.min.y>.04&&solids.min.y>.025);
let count=0,tri=0;dinner.root.traverse(n=>{if(n.isMesh){count++;tri+=(n.geometry.index?.count||n.geometry.attributes.position.count)/3*(n.isInstancedMesh?n.count:1);}});
check('Procedural hero meal stays within its authored geometry budget',count<=26&&tri<45000);console.log({mealMeshes:count,mealTriangles:tri});
for(const hz of [30,60]){
 let last=null;for(let i=0;i<=21*hz;i++){const f=trayRescueFrame(i/hz,[-1.4,5.8,15.7]);if(last&&f.age>9)check('Ground transport is continuous',Math.hypot(f.base[0]-last.base[0],f.base[2]-last.base[2])<.18);if(f.carrying)check('Helper cap supports level tray',Math.abs(f.tray[1]-f.base[1]-f.height)<.001);last=f;}
 const m=new MissionMachine();m.phaseTo('meal-handoff');m.update(.69);check('Before first contact no helper exists',m.trayOwner==='hero'&&!m.helperPresent);m.update(.71);check('First receiver is Dragon',m.trayOwner==='dragon'&&!m.helperPresent);m.update(1.21);check('Handoff finishes before takeoff',m.phase==='ascent');
 m.phaseTo('rewind');const saved=m.vcrSnapshot.trayOwner;m.restorePresent();check('VCR restores the actual donor',m.trayOwner===saved);m.phaseTo('aim-final');m.update(m.sourceTime+8.79);check('No premature release during stretch',m.trayOwner==='dragon');m.setPaused(true);const age=m.state.rescueAge;m.update(m.sourceTime+80);check('Background does not advance rescue',m.state.rescueAge===age);m.setPaused(false);m.update(m.sourceTime+.02);check('One owner changes at helper contact',m.trayOwner==='helper');m.replay();check('Replay clears rescue identity',m.rescueStarted===null&&!m.helperPresent&&m.trayOwner==='hero');
}
check('Thumb reads for almost one second',rescueTiming(10.9).thumb===1&&rescueTiming(11.7).thumb===1&&rescueTiming(12.01).thumb===0);
const dragon=buildDragon(r),clips=new Set();let last=null;for(let i=0;i<16*60;i++){const t=i/60;dragon.update(t,{singing:true,singingTrapped:true,singingAge:t});clips.add(dragon.state.songClip);check('Trapped singing never travels',dragon.body.position.x===0&&dragon.body.position.y===0);if(last)check('Phrase changes blend without a body-roll snap',Math.abs(dragon.body.rotation.z-last)<.08);last=dragon.body.rotation.z;}
check('All six singing clips run during the scene',clips.size===6);r.dispose();console.log(`Feast: ${checks} checks passed.`);
