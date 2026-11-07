"""Actual shutter/invalid exposure, modal recovery, restart and input checks."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('/tmp/photo-recovery');OUT.mkdir(exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(code):return await page.evaluate(code)
  async def tick(s=.1):await page.evaluate('(s)=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,Math.min(.05,s/n),false)}',s)
  async def bg():
   await js('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');await tick(3);await js('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))')
  async def resume():await page.locator('.mission-resume-panel').click();assert not await js('__rainy711.pauseReasons.includes("background")')
  async def shot(name):await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/(name+'.png')))
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click();await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000);await js('__rainy711.pauseForCapture()');await js('const e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change"));__rainy711.missionStart()')
   for _ in range(220):
    if await js('__rainy711.mission.phase')=='photo-flight':break
    await tick(.4);await js('__rainy711.missionNext()')
   await js('__rainy711.fly(0,1)')
   for _ in range(100):
    if await js('__rainy711.mission.flight.z>=10.1'):break
    await tick(.1)
   await js('__rainy711.fly(0,0)');await tick(.8);await page.locator('.flight-ready').click();await tick(.1)
   await page.mouse.move(100,400);await page.mouse.down();await page.mouse.move(350,400,steps=15);await page.mouse.up();await tick(.1);await page.locator('.photo-shutter').click();await page.wait_for_function('__rainy711.photo&&__rainy711.mission.phase!=="photo"',timeout=30000)
   for _ in range(35):
    if await page.locator('.phone-gallery').is_visible():break
    await tick(.5);await js('__rainy711.missionNext()')
   assert await js('__rainy711.photo.faceValid===false&&__rainy711.photo.closeup===null');assert await page.get_by_role('button',name='放大看有沒有眨眼',exact=True).is_disabled();assert await page.get_by_role('button',name='傳送給管理員',exact=True).is_disabled()
   await page.locator('.gallery-stage').dblclick();await page.locator('.gallery-stage').hover();await page.mouse.wheel(0,-500);await page.keyboard.press('ArrowRight');assert await js('__rainy711.photoViewer.index===0&&__rainy711.photoViewer.scale===1')
   await bg();assert not await page.locator('.mission-resume-panel').evaluate('(e)=>e.inert');await shot('invalid-paused');await resume();assert await page.get_by_role('button',name='重新拍',exact=True).is_enabled();await page.get_by_role('button',name='重新拍',exact=True).click();await tick(.1)
   await page.locator('.photo-shutter').click();await page.wait_for_function('__rainy711.photo?.faceValid&&__rainy711.mission.phase!=="photo"',timeout=30000)
   for _ in range(35):
    if await page.locator('.phone-gallery').is_visible():break
    await tick(.5);await js('__rainy711.missionNext()')
   assert await page.get_by_role('button',name='放大看有沒有眨眼',exact=True).is_enabled();assert await page.locator('.gallery-image').evaluate('(e)=>e.src===__rainy711.photo.src')
   assert await js('__rainy711.photo.closeupWidth===1536&&__rainy711.photo.closeupHeight===1920&&__rainy711.photo.portraitSource==="optical"');assert await js('__rainy711.photo.src!==__rainy711.photo.closeup')
   await page.get_by_role('button',name='放大看有沒有眨眼',exact=True).click();assert await js('__rainy711.photoViewer.index===1');await bg();await resume();await shot('valid-crop');await page.get_by_role('button',name='傳送給管理員',exact=True).click();await tick(1.3)
   await page.locator('#menu-toggle').click();await bg();await page.locator('#menu-close').click();await resume();assert not await page.locator('#scene').evaluate('(e)=>e.inert')
   await page.locator('#menu-toggle').click();await page.get_by_text('作品與回報',exact=True).click();await page.get_by_role('button',name='意見與問題回報',exact=True).click();await page.locator('.feedback-dialog textarea').fill('保留這份草稿');await bg();assert await page.locator('.feedback-dialog textarea').input_value()=='保留這份草稿';await page.get_by_role('button',name='取消',exact=True).click();await resume()
   await page.locator('#menu-toggle').click();await page.get_by_role('button',name='重新開始雨夜',exact=True).click();await tick(.2);assert await js('__rainy711.mission.phase')=='ready'
   await js('window.dispatchEvent(new PageTransitionEvent("pagehide",{persisted:true}));window.dispatchEvent(new PageTransitionEvent("pageshow",{persisted:true}));__rainy711.pauseForCapture()');await resume();assert await page.locator('.mission-launch').is_enabled()
   # Actual text-bearing controls suppress selectstart; editable feedback fields stay selectable.
   assert await page.locator('.mission-launch span').first.evaluate('(e)=>!e.dispatchEvent(new Event("selectstart",{bubbles:true,cancelable:true}))');assert await page.locator('.mission-launch').evaluate('(e)=>getComputedStyle(e).webkitUserSelect')=='none'
   assert not errors,errors;print('PASS actual invalid/valid exposures, independent optical portrait at 1536x1920, gallery/settings/feedback/background/BFCache recovery and true-entry restart',flush=True)
  except Exception:await shot('FAILURE');raise
  finally:await b.close()
asyncio.run(main())
