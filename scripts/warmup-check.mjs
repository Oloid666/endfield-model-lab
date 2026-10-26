import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {ShaderWarmup} from '../src/shader-warmup.js';

const checks=[];
function check(name,value){assert.ok(value,name);checks.push({name,passed:true});}
const scene={name:'live-scene'},camera={name:'only-camera'},actor={name:'late-character'},calls=[];
let release,lost=false,active=0,maxActive=0;
const renderer={info:{programs:[]},getContext:()=>({getExtension:()=>({}),isContextLost:()=>lost}),
  async compileAsync(object,eye,environment){
    active++;maxActive=Math.max(maxActive,active);calls.push({object,eye,environment});
    if(calls.length===1)await new Promise(resolve=>{release=resolve;});
    renderer.info.programs.push({});active--;
  }};
const warmup=new ShaderWarmup(renderer,scene,camera);
const first=warmup.prepare(),second=warmup.prepare(actor,'xaihi');await Promise.resolve();await Promise.resolve();
check('Scene and late actor are queued on the existing renderer',warmup.state.pending===2&&calls.length===1);
release();check('Both preparations resolve',await first&&await second);
check('GPU preparation is serialized',maxActive===1&&calls.length===2);
check('Actor inherits exact live scene and camera',calls[1].object===actor&&calls[1].eye===camera&&calls[1].environment===scene);
check('Completed labels and programs are inspectable',warmup.state.completed.join(',')==='scene,xaihi'&&warmup.state.programs===2&&warmup.state.stage==='ready');
check('Parallel extension is recorded once',warmup.state.parallel&&warmup.state.pending===0);
lost=true;check('A lost context does not issue compilation',await warmup.prepare(actor,'lost')===false&&calls.length===2);
check('Context loss has an explicit stage',warmup.state.stage==='context-lost');lost=false;
warmup.invalidate();check('Restoration invalidates prior readiness',warmup.state.completed.length===0);
check('Restored context can prepare again',await warmup.prepare());
const skip=warmup.prepare(actor,'stale');warmup.invalidate();
check('Queued work from a previous context is skipped',await skip===false&&calls.length===3);
warmup.dispose();check('Disposed worlds do not submit GPU work',await warmup.prepare()===false&&calls.length===3);

let attempt=0;
const recovery=new ShaderWarmup({info:{programs:[]},getContext:renderer.getContext,async compileAsync(){if(++attempt===1)throw Error('test compile failure');}},scene,camera);
await assert.rejects(recovery.prepare(),/test compile failure/);
check('Compilation errors are visible to the loader',recovery.state.stage==='failed'&&recovery.state.error==='test compile failure');
check('A rejected preparation does not poison the next queue',await recovery.prepare(actor,'retry'));
recovery.dispose();

let fallbackCalls=0;
const fallback=new ShaderWarmup({info:{programs:[]},getContext:()=>({getExtension:()=>null,isContextLost:()=>false}),compile(object,eye,environment){fallbackCalls++;assert.equal(object,scene);assert.equal(eye,camera);assert.equal(environment,scene);}},scene,camera);
check('Synchronous fallback reuses the same renderer',await fallback.prepare()&&fallbackCalls===1&&!fallback.state.parallel);fallback.dispose();

await fs.writeFile(new URL('../artifacts/v13-warmup-check.json',import.meta.url),JSON.stringify({passed:true,checks},null,2)+'\n');
console.log(`Shader warmup: ${checks.length} checks passed.`);
