"""Final visual checks for camera handoff, CCTV silhouette, and impact readability."""
import asyncio,base64,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(__file__).resolve().parents[1]/'artifacts'
async def main():
 checks=[];errors=[]
 def check(n,v):checks.append({'name':n,'passed':bool(v)});print(n,v,flush=True);assert v,n
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1);page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def tick(n):return await js('n=>{const q=__rainy711;const count=Math.ceil(n*10);for(let i=0;i<count;i++)q.tick(q.time+n/count,.05,i===count-1);return q.mission}',n)
  async def finish():
   phase=await js('__rainy711.mission.phase')
   for _ in range(80):
    if await js('__rainy711.mission.phase')!=phase:return
    if await js('__rainy711.mission.presentationLocked'):await tick(1.6)
    await js('__rainy711.missionNext()')
   raise AssertionError(phase)
  async def shot(name):
   c=await page.context.new_cdp_session(page);r=await c.send('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False});(OUT/f'presentation-{name}.png').write_bytes(base64.b64decode(r['data']));await c.detach()
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('()=>{__rainy711.pauseForCapture();const n=document.querySelector("#quality");n.value="low";n.dispatchEvent(new Event("change",{bubbles:true}));__rainy711.restoreChapter("cargo")}')
   for _ in range(5):await js('__rainy711.missionNext();__rainy711.missionNext()')
   await tick(.4);check('CCTV appears on its dialogue cue',await js('__rainy711.cinematic.cameraBeat')=='cctv-evidence');await shot('cctv-side')
   await js('__rainy711.missionStart()');await finish();await tick(6);await tick(7.2);await finish();await js('()=>{const q=__rainy711;q.fly(0,1);for(let i=0;i<26;i++)q.tick(q.time+.1,.05,false);q.fly(0,0);q.finishFlight();q.tick(q.time+.1,.05,true)}');await js('__rainy711.takePhoto()');await tick(2.6);check('Return ends with the pair looking at the picture',await js('__rainy711.mission.phase')=='photo-check' and await js('__rainy711.cinematic.cameraBeat')=='photo-together');await shot('photo-together')
   await js('__rainy711.restoreChapter("last")');await finish();await tick(9);await js('()=>{const q=__rainy711;q.tick(q.time+q.mission.meterPeriod/4,.05,false);q.missionAttack(q.time)}');await tick(5.2);check('Server impact cue',await js('__rainy711.cinematic.cameraBeat')=='finisher-city-impact');await shot('server-impact');await tick(1.2);check('Neighbor impact cue',await js('__rainy711.cinematic.cameraBeat')=='finisher-neighbor-impact');await shot('neighbor-impact');await tick(1.6);check('Wide aftermath has no obscuring power links',await js('__rainy711.tianshi.drawnLinks')==0);await shot('two-sites');check('No runtime errors',not errors)
  finally:
   (OUT/'presentation-detail-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
