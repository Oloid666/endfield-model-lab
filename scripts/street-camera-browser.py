import asyncio,json
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':390,'height':844});page.set_default_timeout(20000);errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  await page.goto(__import__('os').environ.get('PREVIEW_URL','http://127.0.0.1:4181/endfield-model-lab/'))
  await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000)
  await page.evaluate('__rainy711.pauseForCapture()')
  async def tick(n=1): await page.evaluate('(n)=>{const q=__rainy711;for(let i=0;i<n;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}',n)
  await tick()
  for i in range(7):
   xy=await page.evaluate('()=>{const q=__rainy711,p=q.projectPoint([0,3.1,2.224]),r=document.querySelector("canvas").getBoundingClientRect();return [r.x+(p[0]+1)*r.width/2,r.y+(1-p[1])*r.height/2]}')
   await page.mouse.click(*xy);await tick()
  print('shortcut',await page.evaluate('({postgame:__rainy711.mission.postgame,show:__rainy711.staging.show,remnant:__rainy711.staging.remnant,taps:__rainy711.bonus.taps})'),flush=True)
  assert await page.evaluate('__rainy711.mission.postgame')
  assert not await page.evaluate('__rainy711.staging.remnant.visible')
  assert await page.locator('#app').get_attribute('data-free-guide')=='house'
  views=[]
  for number in range(6):
   await page.locator('.postgame-toggle').click()
   await tick(3);assert await page.evaluate('__rainy711.staging.show.phase')=='closeup';assert await page.evaluate('__rainy711.staging.show.buildingProgress')==0
   if number==0:await page.screenshot(path='/tmp/street-closeup.png')
   await tick(9);assert await page.evaluate('__rainy711.staging.show.phase')=='ascent'
   await tick(13);assert await page.evaluate('__rainy711.staging.show.phase')=='gesture';assert await page.evaluate('__rainy711.staging.show.buildingProgress')==0
   await tick(15);assert await page.evaluate('__rainy711.staging.show.phase')=='pullback';assert await page.evaluate('__rainy711.staging.show.buildingProgress')==0
   await tick(15);assert await page.evaluate('__rainy711.staging.show.phase')=='building'
   views.append(await page.evaluate('__rainy711.staging.show.wideIndex'));camera=await page.evaluate('__rainy711.camera')
   if number<3:await page.screenshot(path=f'/tmp/street-wide-{number}.png')
   await tick(20);assert max(abs(a-b) for a,b in zip(camera,await page.evaluate('__rainy711.camera')))<1e-5
   if number==0:
    await page.evaluate('__rainy711.missionPause(true)');age=await page.evaluate('__rainy711.staging.show.age');await tick(10);assert age==await page.evaluate('__rainy711.staging.show.age');await page.evaluate('__rainy711.missionPause(false)')
   if number==5:
    await page.locator('.street-performance button').click();await tick();assert max(abs(a-b) for a,b in zip(camera,await page.evaluate('__rainy711.camera')))<1e-5
   else:
    await page.evaluate('()=>{const q=__rainy711;for(let i=0;i<350&&q.staging.show.active;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}')
   assert not await page.evaluate('__rainy711.staging.show.active')
   print('finished',number,camera,await page.evaluate('__rainy711.camera'),flush=True)
   assert max(abs(a-b) for a,b in zip(camera,await page.evaluate('__rainy711.camera')))<1e-5
  assert views==[0,1,2,0,1,2],views
  assert not errors,errors
  await page.locator('.postgame-reset').click();await tick();assert not await page.locator('.postgame-actions').is_visible()
  print('PASS six ordered shows, three fixed wides, pause, skip and replay',flush=True)
  await b.close()
asyncio.run(main())
