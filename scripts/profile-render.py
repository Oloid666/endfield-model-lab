"""Comparable desktop/software renderer samples. Not an iPhone benchmark."""
import asyncio,json,os,statistics
from pathlib import Path
from playwright.async_api import async_playwright
URL=os.environ.get('PROFILE_URL','http://127.0.0.1:4173/');OUT=Path(os.environ.get('PROFILE_OUT','artifacts/v5-render-profile.json'))
async def main():
 errors=[];result={'url':URL,'kind':'Desktop Chromium SwiftShader; paused render; synchronous 1px readback; not iPhone','viewport':[390,844],'dpr':1,'samples':[]}
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);await page.evaluate('__rainy711.pauseForCapture()')
  for view in ['street','awning']:
   await page.evaluate('(v)=>{__rainy711.frameView(v);__rainy711.samplePose(8);const gl=document.querySelector("canvas").getContext("webgl2");gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4))}',view)
   samples=[]
   for n in range(6):
    row=await page.evaluate('(t)=>{const q=__rainy711,gl=document.querySelector("canvas").getContext("webgl2"),calls=q.drawCalls,triangles=q.triangles,start=performance.now();q.samplePose(t);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));return {ms:performance.now()-start,calls:q.drawCalls-calls,triangles:q.triangles-triangles,glError:gl.getError()}}',8+(n+1)/30)
    samples.append(row)
   result['samples'].append({'view':view,'mean_ms':statistics.mean(x['ms'] for x in samples),'median_ms':statistics.median(x['ms'] for x in samples),'mean_calls':statistics.mean(x['calls'] for x in samples),'mean_triangles':statistics.mean(x['triangles'] for x in samples),'frames':samples});print(view,result['samples'][-1]['mean_ms'],flush=True)
  result['aa']=await page.evaluate('__rainy711.aa');result['metrics']=await page.evaluate('__rainy711.metrics||null');result['errors']=errors
  await browser.close()
 OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(result,ensure_ascii=False,indent=2));assert not errors,errors;assert all(not f['glError'] for v in result['samples'] for f in v['frames']);print(json.dumps(result,ensure_ascii=False))
asyncio.run(main())
