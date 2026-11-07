"""Actual-scene first-wave framing/shutter captures. Chromium is not iPhone Safari."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('FIRST_WAVE_OUT','/tmp/rain-first-wave'));OUT.mkdir(exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':390,'height':844});errors=[];rows=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded')
  await page.locator('.loading-details summary').click();await page.get_by_role('button',name='直接進入',exact=True).click()
  await page.wait_for_function('window.__rainy711?.actorsLoaded && document.querySelector("#loading").hidden',timeout=240000)
  await page.evaluate('__rainy711.pauseForCapture();const q=document.querySelector("#quality");q.value="low";q.dispatchEvent(new Event("change"))')
  async def tick(s=.1):await page.evaluate('(s)=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.1));for(let i=0;i<n;i++)q.tick(q.time+s/n,Math.min(s/n,.06),false)}',s)
  async def shot(name):
   await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(0);await page.evaluate('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/(name+'.png')))
   row=await page.evaluate('({phase:__rainy711.mission.phase,node:__rainy711.mission.nodeId,beat:__rainy711.cinematic.cameraBeat,devices:__rainy711.devices})');row['name']=name;rows.append(row);print(name,row['beat'],flush=True)
  await page.evaluate('__rainy711.missionStart()')
  seen_handoff=False
  for _ in range(200):
   if await page.evaluate('__rainy711.mission.phase')=='photo-flight':break
   await tick(.3)
   if not seen_handoff and await page.evaluate('__rainy711.mission.shopping?.handoff&&__rainy711.mission.shopping.handoffElapsed>.4'):
    seen_handoff=True;await shot('meal-handoff')
   await page.evaluate('__rainy711.missionNext()')
  await page.evaluate('__rainy711.fly(0,1)')
  for _ in range(100):
   if await page.evaluate('__rainy711.mission.flight.z>=10.1'):break
   await tick(.1)
  await page.evaluate('__rainy711.fly(0,0)');await tick(.8);await page.locator('.flight-ready').click();await tick(.1)
  for w,h in [(320,568),(390,844),(844,390),(1366,768)]:
   await page.set_viewport_size({'width':w,'height':h});await tick(.1);await shot('shutter-'+str(w));s=await page.locator('.photo-shutter').evaluate('(e)=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,text:e.textContent,aria:e.getAttribute("aria-label")}}');assert s['w']==s['h'] and s['text']=='' and s['aria']=='拍照',s
  await page.set_viewport_size({'width':390,'height':844});await page.locator('.photo-shutter').click();await tick(3)
  for _ in range(30):
   if await page.evaluate('__rainy711.mission.phase')=='photo-check':break
   await page.evaluate('__rainy711.missionNext()');await tick(.2)
  await shot('review-pair');await tick(3);await shot('review-shoulder')
  await page.set_viewport_size({'width':1366,'height':768});await tick(.1);await shot('review-shoulder-desktop')
  await page.set_viewport_size({'width':390,'height':844});await page.evaluate('__rainy711.restoreChapter("cargo")')
  for _ in range(70):
   if await page.evaluate('__rainy711.mission.phase')=='briefing':break
   await tick(.5);await page.evaluate('()=>{const q=__rainy711;if(q.mission.phase==="comm-request")q.acceptCall();else q.missionNext()}')
  for i in [0,3,5,6]:
   for _ in range(30):
    if await page.evaluate('__rainy711.mission.nodeId')=='briefing_'+str(i):break
    await page.evaluate('__rainy711.missionNext()');await tick(1.3)
   assert await page.evaluate('__rainy711.mission.nodeId')=='briefing_'+str(i)
   await tick(1.6);await shot('briefing-'+str(i))
  await page.evaluate('__rainy711.restoreChapter("last")');await tick(.1);await shot('server-reveal');await tick(1.8);await shot('server-detail')
  assert not errors,errors
  (OUT/'photo-results.json').write_text(json.dumps({'rows':rows,'errors':errors},indent=2))
  await b.close()
asyncio.run(main())
