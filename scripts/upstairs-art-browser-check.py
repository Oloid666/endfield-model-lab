"""Final upstairs framing, interpolated FOV, reading mode and background recovery."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('NEXT_OUT','/tmp/upstairs-art-browser'));OUT.mkdir(exist_ok=True)
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
   for width,height in [(390,844),(844,390),(1366,768)]:
    await page.set_viewport_size({'width':width,'height':height})
    assert await js('__rainy711.debugJump("claims")');await tick(3);await shot('claims-'+str(width))
    await page.locator('[data-action="claims-next"]').click();await tick(.2);await page.locator('[data-action="claims-select"]').first.click();await tick(2);await shot('claims-client-'+str(width))
    assert await js('__rainy711.debugJump("classroom")');await tick(2);await page.locator('[data-action="class-menu"]').click();await page.locator('[data-action="class-reset"]').click();await tick(2);await shot('classroom-'+str(width))
    for _ in range(8):
     if await js('__rainy711.bonus.room.focus')=='reaction':break
     await page.locator('[data-action="class-next"]').click();await tick(.05);await js('__rainy711.tick(__rainy711.time,0,true)')
    fov=await js('__rainy711.bonus.room.cameraFov');assert 36<fov<47,fov
    await tick(1.5);await shot('reaction-'+str(width));assert abs(await js('__rainy711.bonus.room.cameraFov')-36)<.001
    # Real menu reading toggle, leave-and-return recovery, then get back to the same reaction.
    await page.locator('[data-action="class-menu"]').click();await page.locator('.bonus-dialog[open] [data-action="reading"]').click();await page.locator('[data-action="dialog-close"]').first.click();await tick(.1);await shot('reading-'+str(width))
    await js('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');await tick(2);await js('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))');await page.locator('.bonus-recovery[open]').get_by_role('button',name='繼續這一幕',exact=True).click();await tick(.1)
    assert await js('__rainy711.bonus.route')=='lesson'
    await page.locator('[data-action="class-menu"]').click();await page.locator('.bonus-dialog[open] [data-action="reading"]').click();await page.locator('[data-action="dialog-close"]').first.click();await tick(.1)
   assert not errors,errors
   (OUT/'results.json').write_text(json.dumps({'frames':rows,'errors':errors},ensure_ascii=False,indent=2))
  finally:await b.close()
asyncio.run(main())
