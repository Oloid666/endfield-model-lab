import assert from 'node:assert/strict';
import {createLoading} from '../src/loading.js';
let now=0,id=0;const jobs=new Map(),nodes=new Map();const node=()=>({hidden:false,textContent:'',className:'',classList:{contains:()=>false,add(){},remove(){},toggle(){}},setAttribute(){},addEventListener(){},append(){},querySelector:()=>node()});
globalThis.performance={now:()=>now};globalThis.innerWidth=390;globalThis.document={hidden:false,querySelector:key=>{if(!nodes.has(key))nodes.set(key,node());return nodes.get(key);},createElement:()=>node()};
globalThis.setInterval=(fn,delay)=>{jobs.set(++id,{fn,delay,at:now+delay,repeat:true});return id;};globalThis.setTimeout=(fn,delay)=>{jobs.set(++id,{fn,delay,at:now+delay});return id;};globalThis.clearInterval=i=>jobs.delete(i);
async function advance(ms){const end=now+ms;while(true){let next;for(const [i,j]of jobs)if(j.at<=end&&(!next||j.at<next[1].at))next=[i,j];if(!next)break;now=next[1].at;if(next[1].repeat)next[1].at+=next[1].delay;else jobs.delete(next[0]);next[1].fn();await Promise.resolve();}now=end;await Promise.resolve();}
let checks=0;function check(value){assert.ok(value);checks++;}
const loading=createLoading();loading.show('init');let done=false;const finish=loading.finish().then(()=>{done=true;});check(nodes.get('#loading-joke').textContent.includes('先叫她下班'));
await advance(2000);check(nodes.get('#loading-joke').textContent.includes('第二次'));
document.hidden=true;await advance(10000);check(!done&&nodes.get('#loading-joke').textContent.includes('第二次'));document.hidden=false;
await advance(2000);check(nodes.get('#loading-joke').textContent.includes('第三次'));await advance(2000);check(nodes.get('#loading-joke').textContent.includes('終於'));check(!done);
await advance(1450);check(!done);await advance(50);await finish;check(done);loading.dispose();
const slow=createLoading();slow.show('init');await advance(9000);check(nodes.get('#loading-joke').textContent.includes('第三次'));let slowDone=false;const sf=slow.finish().then(()=>{slowDone=true;});await advance(50);check(nodes.get('#loading-message').textContent.includes('開場演出'));await advance(1450);check(!slowDone);await advance(50);await sf;check(slowDone);slow.dispose();
console.log(`Loading: ${checks} fast-cache, background and slow-resource checks passed.`);
