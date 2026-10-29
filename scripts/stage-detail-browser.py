import asyncio
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844});page.set_default_timeout(45000);errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  await page.goto(__import__('os').environ.get('PREVIEW_URL','http://127.0.0.1:4181/endfield-model-lab/'));await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await page.evaluate('__rainy711.pauseForCapture()');await page.evaluate('()=>{const e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change",{bubbles:true}))}')
  async def tick(n=1): await page.evaluate('(n)=>{const q=__rainy711;for(let i=0;i<n;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}',n)
  for _ in range(7):
   xy=await page.evaluate('()=>{const p=__rainy711.projectPoint([0,3.1,2.224]),r=document.querySelector("canvas").getBoundingClientRect();return [r.x+(p[0]+1)*r.width/2,r.y+(1-p[1])*r.height/2]}');await page.mouse.click(*xy);await tick()
  await page.locator('.bonus-entry').click();await page.wait_for_function('__rainy711.bonus.active&&!__rainy711.bonus.busy');await tick(20);await page.locator('[data-action=claims-next]').click()
  for _ in range(85):
   if await page.evaluate('__rainy711.bonus.route')=='settlement-result':break
   await tick(17)
   if await page.evaluate('__rainy711.bonus.route')=='settlement-result':break
   phase=await page.evaluate('__rainy711.bonus.negotiation.phase')
   if phase=='choice':await page.locator('[data-action=claims-select]').first.click()
   elif phase!='stamp' and await page.locator('[data-action=claims-next]').is_enabled():await page.locator('[data-action=claims-next]').click()
  print('claims result',await page.evaluate('__rainy711.bonus.route'),flush=True)
  assert await page.evaluate('__rainy711.bonus.route')=='settlement-result'
  await page.locator('.bonus-panel').evaluate('e=>e.scrollTop=e.scrollHeight');await page.locator('[data-action=claims-next]').click();await tick(20)
  assert await page.evaluate('__rainy711.bonus.route')=='class-invite'
  assert await page.locator('.bonus-panel').evaluate('e=>e.scrollTop')==0
  assert '我當老師' in await page.locator('.bonus-content').inner_text()
  assert not await page.locator('.postgame-toggle').is_visible()
  assert await page.locator('[data-action=class-next]').is_visible()
  await page.screenshot(path='/tmp/class-invite-stage.png')
  await page.locator('[data-action=class-next]').click();await page.wait_for_function('!__rainy711.bonus.busy');await tick(20)
  assert await page.evaluate('__rainy711.bonus.route')=='classroom'
  assert not errors,errors
  print('PASS settlement -> invitation -> class after scrolling; zero browser errors',flush=True);await b.close()
asyncio.run(main())
