import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {downloadModel} from '../src/model-download.js';
const original=await readFile(new URL('../public/models/zhuang-fangyi.glb',import.meta.url));
const packed=await readFile(new URL('../public/models/zhuang-fangyi.glb.gz',import.meta.url));
assert.deepEqual(gunzipSync(packed),original,'Transport compression must preserve every model byte');
assert.equal(packed.length,4661344,'Progress metadata must match the deployed compressed asset');
const fetchBefore=globalThis.fetch,decompressBefore=globalThis.DecompressionStream;
const url='https://model.test/models/zhuang-fangyi.glb',gzip={url:url+'.gz',bytes:packed.length};
let count=2;
async function run(mode){
 const calls=[],progress=[],stages=[];
 globalThis.fetch=async (path,{signal})=>{
  calls.push(path);if(signal.aborted)throw signal.reason;
  if(path===gzip.url){
   if(mode==='404')return new Response('',{status:404});
   if(mode==='corrupt')return new Response('bad gzip');
   if(mode==='encoded')return new Response(original,{headers:{'Content-Encoding':'gzip'}});
   return new Response(packed,{headers:{'Content-Length':String(packed.length)}});
  }
  return new Response(original);
 };
 const result=await downloadModel(url,s=>stages.push(s),undefined,'莊方宜',p=>progress.push(p),gzip);
 assert.deepEqual(Buffer.from(result),original,mode+' must yield the original GLB');count++;
 assert.ok(progress.length&&progress.every(p=>p.ratio>=0&&p.ratio<=1),mode+' progress bounds');count++;
 assert.deepEqual(calls,mode==='404'||mode==='corrupt'?[gzip.url,url]:mode==='unsupported'?[url]:[gzip.url]);count++;
 return {progress,stages};
}
try{
 for(const mode of ['packed','encoded','404','corrupt'])await run(mode);
 globalThis.DecompressionStream=undefined;await run('unsupported');globalThis.DecompressionStream=decompressBefore;
 const controller=new AbortController();let calls=0;
 globalThis.fetch=async (path,{signal})=>{calls++;controller.abort(new DOMException('Cancelled','AbortError'));throw signal.reason;};
 await assert.rejects(downloadModel(url,()=>{},controller.signal,'莊',()=>{},gzip),{name:'AbortError'});assert.equal(calls,1,'Cancellation must not start a fallback download');count++;
 globalThis.fetch=async()=>new Response('bad model');await assert.rejects(downloadModel(url,()=>{},undefined),/檔案不完整/);count++;
 console.log(`Model transport: ${count} checks passed; ${original.length} → ${packed.length} bytes, decoded model unchanged.`);
}finally{globalThis.fetch=fetchBefore;globalThis.DecompressionStream=decompressBefore;}
