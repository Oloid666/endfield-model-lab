"""New dinner / helper shots in three viewports; actual scene, no phone FPS claim."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('NEXT_OUT','/tmp/next-dinner-browser'));OUT.mkdir(exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844});rows=[];errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(s):return await page.evaluate(s)
  async def tick(seconds):await page.evaluate('(s)=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,Math.min(.05,s/n),false)}',seconds)
  async def shot(name):
   await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/(name+'.png')));r=await js('({phase:__rainy711.mission.phase,age:__rainy711.mission.phaseElapsed,node:__rainy711.mission.nodeId,staging:__rainy711.staging,actor:__rainy711.idle,hero:__rainy711.heroPosition,dragon:__rainy711.dragonPosition,camera:__rainy711.cameraPose,canAttack:__rainy711.mission.canAttack})');r['name']=name;r['room']=await js('__rainy711.bonus.room');r['communication']=await page.locator('.creature-communication').evaluate('(e)=>({visible:!e.hidden,text:e.textContent,rect:e.getBoundingClientRect().toJSON()})');rows.append(r);print(name,flush=True)
  try:
   await page.goto('http://127.0.0.1:4200/',wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click();await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000);await js('__rainy711.pauseForCapture()');await js('__rainy711.frameView("street")');await tick(.1)
   for _ in range(7):
    q=await js('()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector("#scene").getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}');await page.mouse.click(q['x'],q['y']);await tick(.1)
   assert await js('__rainy711.debug.unlocked')
   assert await js('__rainy711.debugJump("chapter:intro")')
   for _ in range(240):
    if await js('__rainy711.mission.phase')=='photo-pose':break
    assert not await js('__rainy711.mission.text.includes("買完了")')
    await js('__rainy711.missionNext()');await tick(.1)
   assert await js('__rainy711.mission.nodeId')=='shopping_complete';await tick(.8);await shot('shopping-complete');await js('__rainy711.toggleAutoCamera();__rainy711.frameView("dinner")');await shot('dinner')
   for width,height in [(390,844),(844,390),(1366,768)]:
    await page.set_viewport_size({'width':width,'height':height})
    await js('__rainy711.resetCamera()');assert await js('__rainy711.debugJump("chapter:last")');await tick(.1)
    for _ in range(30):
     if await js('__rainy711.mission.phase')=='aim-final':break
     await js('__rainy711.missionNext()');await tick(.5)
    await page.wait_for_function('!__rainy711.mission.paused',timeout=120000)
    for age in [1.9,2.4,3.4,4.9,5.5,6.2,6.95,7.2,8.5,9.3,10.6,12.2,12.55]:
     await tick(max(0,age-await js('__rainy711.mission.phaseElapsed')));await shot('rescue-'+str(width)+'-'+str(age))
     assert rows[-1]['communication']['text']!='👀' or not rows[-1]['communication']['visible']
     assert rows[-1]['hero'][1]>4
     if age>=2:assert rows[-1]['actor']['catchGripError']<1e-6
     if age<12:assert not rows[-1]['canAttack']
     if 5.5<age<7:assert rows[-1]['actor']['mealOwner']=='air'
     if 7<=age<10.1:assert .5<rows[-1]['staging']['rescue']['height']<.7
   await page.set_viewport_size({'width':390,'height':844});assert await js('__rainy711.debugJump("birth")');await page.wait_for_function('!__rainy711.mission.paused',timeout=120000)
   await tick(max(0,10.7-await js('__rainy711.mission.phaseElapsed')));await shot('birth-ground')
   await tick(2);await shot('refusal-hold')
   assert await page.locator('.mission-text').inner_text()=='那個我不要了'
   for width,height in [(390,844),(844,390),(1366,768)]:
    await page.set_viewport_size({'width':width,'height':height})
    for dest in ['claims','classroom']:
     assert await page.evaluate('(d)=>__rainy711.debugJump(d)',dest);await tick(2.5);await shot(dest+'-'+str(width))
     if dest=='claims':
      await page.locator('[data-action="claims-next"]').click();await tick(.2);await page.locator('[data-action="claims-select"]').first.click();await tick(3);await shot('claims-client-'+str(width))
     else:
      for _ in range(5):
       await page.locator('[data-action="class-next"]').click();await tick(1)
      await tick(1);await shot('class-reaction-'+str(width))
   (OUT/'results.json').write_text(json.dumps({'frames':rows,'errors':errors},ensure_ascii=False,indent=2));assert not errors,errors
  finally:await b.close()
asyncio.run(main())
