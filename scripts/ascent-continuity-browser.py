"""Actual handoff -> ascent runtime continuity; fixed-step frames, not real-device FPS."""
import asyncio,pathlib,json,math,subprocess
from playwright.async_api import async_playwright
out=pathlib.Path('artifacts/visual-review/acting-seven/ascent-verified-final');out.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(s,arg=None):return await page.evaluate(s,arg)
  async def tick(s):await js('s=>{const q=__rainy711,n=Math.ceil(s*30);for(let i=0;i<n;i++)q.tick(q.time+s/n,s/n,false)}',s)
  async def until(test):
   for _ in range(500):
    if await js(test):return
    await tick(.1);await js('__rainy711.missionNext()')
   raise AssertionError(test)
  try:
   await page.goto('http://127.0.0.1:4232/');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click();await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000);await js('__rainy711.pauseForCapture();let e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change"));__rainy711.restoreChapter("terminal-deploy")');await until('__rainy711.mission.phase==="login"')
   for k in ['endfield','_','power','520','1314']:await js('k=>__rainy711.keyChunk(k)',k)
   await until('__rainy711.mission.phase==="captcha"&&__rainy711.mission.connection.captchaReady');await js('__rainy711.missionVerify()');await until('__rainy711.mission.phase==="lever"');await js('__rainy711.missionLever(1)');await until('__rainy711.mission.phase==="meal-handoff"');samples=[]
   for i in range(42):
    await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(out/f'{i:04d}.jpg'),type='jpeg',quality=82,timeout=90000)
    samples.extend(await js('()=>{let q=__rainy711,a=[];for(let i=0;i<4;i++){q.tick(q.time+.03125,.03125,false);a.push({phase:q.mission.phase,age:q.mission.phaseElapsed,dragon:q.dragonPosition,tray:[...q.idle.mealSupport],heading:q.idle.dragonHeading});}return a}'))
   steps=[(math.dist(a['dragon'],b['dragon']),math.dist(a['tray'],b['tray']),a['phase'],b['phase']) for a,b in zip(samples,samples[1:])];boundary=[s for s in steps if s[2]!=s[3]][0];largest=max(max(s[0],s[1]) for s in steps)
   (out/'samples.json').write_text(json.dumps({'samples':samples,'steps':steps,'boundary':boundary,'max':largest},indent=2))
   assert largest<.22,(largest,boundary);assert not errors;subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','8','-i',str(out/'%04d.jpg'),'-c:v','libx264','-pix_fmt','yuv420p',str(out/'handoff-ascent.mp4')],check=True)
   (out/'result.json').write_text(json.dumps({'status':'passed','errors':errors,'boundary':boundary,'maxStepMetres':largest,'samples':samples,'iphone_tested':False},ensure_ascii=False,indent=2));print('PASS',largest,boundary)
  finally:await b.close()
asyncio.run(main())
