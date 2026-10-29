import asyncio
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844});page.set_default_timeout(60000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(__import__('os').environ.get('PREVIEW_URL','http://127.0.0.1:4181/endfield-model-lab/'));await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await page.evaluate('__rainy711.pauseForCapture()');await page.evaluate('()=>{const e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change",{bubbles:true}))}')
  async def tick(n):await page.evaluate('(n)=>{const q=__rainy711;q.tick(q.time+n,.05,false);q.tick(q.time,.016,true)}',n)
  await page.evaluate("__rainy711.restoreChapter('last')")
  for _ in range(40):
   if await page.evaluate('__rainy711.mission.phase')!='last':break
   await tick(2);await page.evaluate('__rainy711.missionNext()')
  await tick(9);await page.evaluate('()=>{const q=__rainy711;q.tick(q.time+q.mission.meterPeriod/4,.05,false);q.missionAttack(q.time)}')
  await tick(9.1);print('landing',await page.evaluate('__rainy711.mission.phase'),flush=True)
  await tick(6.2);assert await page.evaluate('__rainy711.cinematic.cameraBeat')=='pear-garden-survives';await page.screenshot(path='/tmp/concert-pear.png')
  await tick(24);assert await page.evaluate('__rainy711.cinematic.cameraBeat')=='tour-dragon-orbit';print('song',await page.evaluate('({phase:__rainy711.mission.phase,elapsed:__rainy711.mission.phaseElapsed,beat:__rainy711.cinematic.cameraBeat})'),flush=True)
  await page.screenshot(path='/tmp/concert-trapped.png');a=await page.evaluate('__rainy711.camera');await tick(4);c=await page.evaluate('__rainy711.camera');assert a!=c
  await tick(35)
  await page.locator('.epilogue-prompt button').click();await page.locator('.epilogue-prompt button').click()
  assert '啊，對吼' in await page.locator('.epilogue-prompt').inner_text()
  assert '還沒演完' in await page.locator('.epilogue-prompt button').inner_text()
  await page.locator('.epilogue-prompt button').click()
  await page.evaluate('()=>{const q=__rainy711;for(let i=0;i<60;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}')
  await page.screenshot(path='/tmp/concert-free.png');assert await page.evaluate('__rainy711.staging.show.active')
  assert not errors,errors
  print('PASS pear reveal, trapped orbit, epilogue and free concert',flush=True);await b.close()
asyncio.run(main())
