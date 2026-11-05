import assert from 'node:assert/strict';
import * as T from 'three';
import {bindHoldButton} from '../src/hold-button.js';
import {buildDragonBandages} from '../src/dragon-bandages.js';
import {Resources} from '../src/resources.js';
let now=0,starts=0,stops=0,taps=0,enabled=true;
Object.defineProperty(globalThis,'performance',{value:{now:()=>now},configurable:true});
class Button extends EventTarget{disabled=false;captures=new Set();setPointerCapture(id){this.captures.add(id);}hasPointerCapture(id){return this.captures.has(id);}releasePointerCapture(id){this.captures.delete(id);this.dispatchEvent(event('lostpointercapture',{pointerId:id}));}}
function event(type,values={}){const e=new Event(type,{cancelable:true});Object.assign(e,values);return e;}
const button=new Button(),abort=new AbortController(),cancel=bindHoldButton(button,{start:()=>starts++,stop:()=>stops++,tap:()=>taps++,enabled:()=>enabled},abort.signal);
function fire(type,v={}){const e=event(type,{pointerId:1,button:0,isPrimary:true,...v});button.dispatchEvent(e);return e;}
assert.ok(fire('pointerdown').defaultPrevented);now+=100;fire('pointercancel');assert.equal(taps,0);assert.equal(stops,1);assert.equal(button.captures.size,0);
fire('pointerdown');now+=100;fire('pointerup');assert.equal(taps,1);assert.equal(stops,2);fire('lostpointercapture');assert.equal(taps,1);
fire('pointerdown');now+=2100;fire('pointerup');assert.equal(taps,1);assert.equal(stops,3);
fire('pointerdown');now+=50;cancel();fire('pointerup');assert.equal(taps,1);assert.equal(stops,4);
fire('pointerdown',{isPrimary:false});fire('pointerdown',{button:2});assert.equal(starts,4);
enabled=false;fire('pointerdown');assert.equal(starts,4);enabled=true;
fire('keydown',{key:'Enter'});fire('keydown',{key:'Enter',repeat:true});now+=100;fire('keyup',{key:'Enter'});assert.equal(taps,2);fire('click',{detail:0});assert.equal(taps,2);now+=300;fire('click',{detail:0});assert.equal(taps,3);
abort.abort();fire('pointerdown');assert.equal(starts,5);
const r=new Resources(),body=new T.Group(),tape=buildDragonBandages(r,body);let count=0;
tape.traverse(mesh=>{if(!mesh.isMesh)return;const p=mesh.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i)-.63,z=p.getZ(i),surface=(x/.56)**2+(y/.59)**2+(z/.49)**2;assert.ok(surface>1.015&&surface<1.15,`Patch penetrates body: ${surface}`);count++;}});
assert.equal(tape.parent,body);assert.ok(count>500);r.dispose();console.log('Touch cancellation, keyboard activation and curved bandage surface checks passed.');
