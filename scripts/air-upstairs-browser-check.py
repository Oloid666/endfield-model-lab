"""New dinner / helper shots in three viewports; actual scene, no phone FPS claim."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('NEXT_OUT','/tmp/air-upstairs-browser'));OUT.mkdir(exist_ok=True)
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
    await page.set_viewport_size({'width':width,'height':height});assert await js('__rainy711.debugJump("claims")');await tick(3);await shot('claims-'+str(width))
    await page.locator('[data-action="claims-next"]').click();await tick(1.7)
    stamps=set();seen=set()
    for _ in range(70):
     state=await js('__rainy711.bonus');phase=state['negotiation']['phase']
     if state['route']=='settlement-result':break
     focus=state['room']['focus']
     if focus in ['representative','client'] and focus not in seen:
      await tick(2);await shot('claims-'+focus+'-'+str(width));seen.add(focus)
     if phase=='stamp':
      idx=state['negotiation']['stampIndex']
      for _ in range(45):
       await tick(.02);await js('__rainy711.tick(__rainy711.time,0,true)')
       if await js('__rainy711.bonus.room.paperStamped&&Math.abs(__rainy711.bonus.room.stampContactError)<.001'):break
      assert await js('Math.abs(__rainy711.bonus.room.stampContactError)<.001')
      await shot('stamp-'+str(width)+'-'+str(idx));stamps.add(idx);await tick(.9)
     else:
      button=page.locator('[data-action="claims-select"]').first if phase=='choice' else page.locator('[data-action="claims-next"]')
      await tick(1.7);await button.click()
      if await js('__rainy711.bonus.negotiation.phase')!='stamp':await tick(1.7)
    assert stamps=={0,1,2},stamps
    assert await js('__rainy711.bonus.claimsSettled');await shot('settled-'+str(width))
    assert await js('__rainy711.debugJump("classroom")');await tick(3)
    await page.locator('[data-action="class-menu"]').click();await page.locator('[data-action="class-reset"]').click();await tick(2);await shot('classroom-'+str(width))
    assert await js('__rainy711.bonus.course.percentage')==0
    photographed=False
    for _ in range(100):
     state=await js('__rainy711.bonus')
     if state['route']=='class-result':break
     if state['room']['focus']=='reaction' and not photographed:
      await tick(1.5);await shot('class-reaction-'+str(width));photographed=True
     if state['route'] in ['class-wait','class-stamping']:await tick(.3)
     else:
      primary=page.locator('[data-action="class-next"]');r=await primary.bounding_box();assert r and 0<=r['y'] and r['y']+r['height']<=height+1
      await primary.click();await tick(.25)
    assert await js('__rainy711.bonus.course.percentage')==100
    assert len(await js('__rainy711.bonus.course.completed'))==8
    assert await js('__rainy711.bonus.course.stamped');await shot('class-completed-'+str(width));await page.locator('[data-action="class-next"]').click();await tick(.2);assert await js('__rainy711.bonus.route')=='rating';await shot('rating-'+str(width))
   assert not errors,errors
   (OUT/'results.json').write_text(json.dumps({'frames':rows,'errors':errors},ensure_ascii=False,indent=2))
  finally:await b.close()
asyncio.run(main())
