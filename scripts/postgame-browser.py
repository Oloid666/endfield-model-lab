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
  await page.locator('.walk-toggle').click();await tick()
  await tick(35);await page.keyboard.down('s');await tick(150);await page.keyboard.up('s');await tick(10)
  assert (await page.evaluate('__rainy711.position'))[2]>7
  await page.screenshot(path='/tmp/postgame-road.png')
  await page.locator('.postgame-toggle').click();await tick(30)
  await page.locator('.street-performance button').click();await tick()
  assert await page.evaluate('__rainy711.staging.show.mode')=='collapsed'
  assert await page.evaluate('__rainy711.walking')
  for i in range(7):
   await page.locator('.postgame-toggle').click();await tick(15);await page.locator('.street-performance button').click();await tick()
  assert await page.evaluate('__rainy711.staging.show.mode')=='intact'
  await page.locator('.postgame-toggle').click();await tick(15);await page.locator('.street-performance button').click();await tick()
  await page.locator('.bonus-entry').click();await tick(30)
  assert await page.evaluate('__rainy711.staging.show.active')
  await page.locator('.street-performance button').click();await page.wait_for_function('__rainy711.bonus.active&&!__rainy711.bonus.busy')
  assert await page.evaluate('__rainy711.staging.show.mode')=='intact'
  print('upstairs',await page.evaluate('__rainy711.bonus.route'),flush=True)
  await page.keyboard.press('Escape');await tick()
  assert not await page.evaluate('__rainy711.bonus.active')
  await page.evaluate('__rainy711.missionReplay()');await tick()
  for sel in ['.walk-toggle','.walk-pad','.bonus-entry','.postgame-toggle']: assert not await page.locator(sel).is_visible(),sel
  assert not await page.evaluate('__rainy711.staging.remnant.visible')
  assert not await page.locator('.postgame-views').is_visible()
  assert not errors,errors
  print('PASS shortcut, keyboard road walk, eight toggles, restore-before-upstairs, replay; no browser errors',flush=True)
  await b.close()
asyncio.run(main())
