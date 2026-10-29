import asyncio
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844});page.set_default_timeout(60000);errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  await page.goto(__import__('os').environ.get('PREVIEW_URL','http://127.0.0.1:4181/endfield-model-lab/'));await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await page.evaluate('__rainy711.pauseForCapture()');await page.evaluate('()=>{const e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change"))}')
  async def tick(n=.1):await page.evaluate('(n)=>{const q=__rainy711;q.tick(q.time+n,.05,false);q.tick(q.time,.016,true)}',n)
  async def finish():
   phase=await page.evaluate('__rainy711.mission.phase')
   for _ in range(80):
    if await page.evaluate('__rainy711.mission.phase')!=phase:return
    await tick(2);await page.evaluate('__rainy711.missionNext()')
   raise AssertionError(phase)
  await page.evaluate('__rainy711.missionStart()');await finish();await page.evaluate('()=>{const q=__rainy711;for(let i=0;i<350&&q.mission.phase!=="photo-talk";i++)q.tick(q.time+.1,.05,false)}');await finish();await page.evaluate('__rainy711.fly(0,1)');await page.evaluate('()=>{const q=__rainy711;for(let i=0;i<24;i++)q.tick(q.time+.1,.05,false);q.fly(0,0)}');await tick(.7);await page.evaluate('__rainy711.finishFlight()');await tick(.1)
  await page.evaluate('__rainy711.takePhoto()');print('photo',await page.evaluate('({valid:__rainy711.photo.faceValid,size:[__rainy711.photo.closeupWidth,__rainy711.photo.closeupHeight]})'),flush=True);assert await page.evaluate('__rainy711.photo.faceValid');await tick(2.5);await finish();await tick(.2)
  await page.locator('.phone-gallery').wait_for(state='visible');assert await page.locator('.phone-gallery button').all_text_contents()==['放大看有沒有眨眼','重新拍','傳送給管理員']
  await page.get_by_role('button',name='放大看有沒有眨眼',exact=True).click();await page.locator('.gallery-image').evaluate('e=>e.decode()');await page.screenshot(path='/tmp/three-photo.png');assert await page.evaluate('__rainy711.photoViewer.index')==1
  await page.evaluate('()=>{const q=__rainy711;q.photo.faceValid=false;q.tick(q.time+.1,.05,false)}');assert await page.get_by_role('button',name='傳送給管理員',exact=True).is_disabled()
  await page.evaluate('()=>{const q=__rainy711;q.photo.faceValid=true;q.tick(q.time+.1,.05,false)}')
  await page.get_by_role('button',name='傳送給管理員',exact=True).click();await tick(3)
  for _ in range(8):
   if await page.evaluate('__rainy711.mission.nodeId')=='cargo_2':break
   await tick(2);await page.evaluate('__rainy711.missionNext()')
  assert await page.evaluate('__rainy711.mission.nodeId')=='cargo_2';await tick(2);assert await page.locator('.album-receipt').is_visible();await page.screenshot(path='/tmp/three-receipt.png')
  assert not errs,errs;print('PASS real photo capture, exact three actions, HQ face and receipt hold',flush=True);await b.close()
asyncio.run(main())
