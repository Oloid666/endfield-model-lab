"""Actual GLB/scene frames, including continuous birth and refusal, no mocked models."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright

OUT=Path(os.environ.get('SECOND_OUT','/tmp/second-visual'));OUT.mkdir(exist_ok=True);QUICK=bool(os.environ.get('SECOND_QUICK'))
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':390,'height':844});errors=[];rows=[];page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(code):return await page.evaluate(code)
  async def tick(s=0):await page.evaluate('(s)=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,Math.min(.05,s/n),false)}',s)
  async def shot(name):
   await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/(name+'.png')))
   r=await js('({phase:__rainy711.mission.phase,age:__rainy711.mission.phaseElapsed,camera:__rainy711.cameraPose,actor:__rainy711.idle,hand:__rainy711.xaihi.handPositions,head:__rainy711.xaihi.headPosition,ingredients:__rainy711.microwave.ingredientsVisible})');r['name']=name;rows.append(r);print(name,flush=True)
  try:
   await page.goto('http://127.0.0.1:4200/',wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click();await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000);await js('__rainy711.pauseForCapture();const e=document.querySelector("#quality");e.value="balanced";e.dispatchEvent(new Event("change"))')
   await js('__rainy711.frameView("street")');await tick(.1)
   for _ in range(7):
    q=await js('()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector("#scene").getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}');await page.mouse.click(q['x'],q['y']);await tick(.1)
   assert await js('__rainy711.debug.unlocked')
   if os.environ.get('SECOND_REFUSAL_ONLY'):
    assert await js('__rainy711.debugJump("birth")');await tick(6.81)
    await shot('refusal-start');await tick(.3);await shot('refusal-middle');await tick(.35);await shot('refusal-final-390')
    for width,height in [(844,390),(1366,768)]:
     await page.set_viewport_size({'width':width,'height':height});await shot('refusal-final-'+str(width))
    (OUT/'results.json').write_text(json.dumps({'frames':rows,'errors':errors},ensure_ascii=False,indent=2));assert not errors,errors;return
   if os.environ.get('SECOND_SHOTS'):
    assert await js('__rainy711.debugJump("chapter:cargo")')
    for _ in range(120):
     if await js('__rainy711.mission.nodeId')=='briefing_16':break
     await tick(.8);await js('__rainy711.mission.phase==="comm-request"?__rainy711.acceptCall():__rainy711.missionNext()')
    assert await js('__rainy711.mission.nodeId')=='briefing_16';await tick(1.5);await shot('house-long-390')
    await page.set_viewport_size({'width':1366,'height':768});await tick(.05);await shot('house-long-1366')
    await page.set_viewport_size({'width':390,'height':844});assert await js('__rainy711.debugJump("chapter:rewind")');await tick(2);await shot('rewind-exterior')
    (OUT/'results.json').write_text(json.dumps({'frames':rows,'errors':errors},ensure_ascii=False,indent=2));assert not errors,errors;return
   assert await js('__rainy711.debugJump("chapter:cargo")');await tick(.1)
   for _ in range(60):
    if await js('__rainy711.mission.phase')=='briefing':break
    await tick(.5);await js('__rainy711.mission.phase==="comm-request"?__rainy711.acceptCall():__rainy711.missionNext()')
   assert await js('__rainy711.mission.phase')=='briefing'
   await js('__rainy711.toggleAutoCamera();__rainy711.frameView("half")');await tick(.1);await shot('tray-front')
   for label,dx,dy in [('left',-70,0),('low',0,-90),('high',0,170),('right',150,-80)]:
    await page.mouse.move(200,420);await page.mouse.down();await page.mouse.move(200+dx,420+dy,steps=20);await page.mouse.up();await tick(.05);await shot('tray-'+label)
   await js('__rainy711.resetCamera()');assert await js('__rainy711.debugJump("birth")');await tick(.01)
   previous=0
   for frame in ([0,10,20,30,40,50] if QUICK else range(51)):
    age=frame*.06;await tick(age-previous);previous=age;await shot('birth-frame-'+str(frame).zfill(3))
   await tick(6.8-previous+.01)
   last=0
   for frame in ([0,6,13,15] if QUICK else range(16)):
    await tick((frame-last)*.05);last=frame
    await shot('refusal-frame-'+str(frame).zfill(3))
   assert await page.locator('.mission-text').inner_text()=='那個我不要了'
   for width,height in [(390,844),(844,390),(1366,768)]:
    await page.set_viewport_size({'width':width,'height':height});await tick(0);await shot('refusal-final-'+str(width))
   assert not errors,errors
   (OUT/'results.json').write_text(json.dumps({'frames':rows,'errors':errors},ensure_ascii=False,indent=2))
  finally:await browser.close()
asyncio.run(main())
