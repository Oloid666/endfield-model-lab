"""Hold and fail a real GLB request; verify direct-entry resource/retry gates."""
import asyncio,json,os
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  c=await b.new_context(viewport={'width':390,'height':844});page=await c.new_page();gate=asyncio.Event();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  async def hold(route):await gate.wait();await route.continue_()
  await page.route('**/zhuang-fangyi.glb',hold)
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click()
  await page.wait_for_timeout(400);assert await page.locator('#loading').is_visible();assert await page.locator('.loading-skip').is_disabled();assert not await page.evaluate('!!window.__rainy711?.actorsLoaded')
  print('PASS early entry waits for actual GLB resource',flush=True);gate.set()
  await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000)
  assert await page.evaluate('__rainy711.loading.ready&&__rainy711.loading.done&&__rainy711.loading.percent===100');await page.evaluate('__rainy711.pauseForCapture()');assert not errors,errors
  print('PASS queued entry reaches ready scene and cleans loading presentation',flush=True);await c.close()
  c=await b.new_context();page=await c.new_page();first=True;fail_gate=asyncio.Event()
  async def fail_once(route):
   nonlocal first
   if first:first=False;await fail_gate.wait();await route.abort('failed')
   else:await route.continue_()
  await page.route('**/zhuang-fangyi.glb',fail_once)
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click()
  fail_gate.set()
  await page.locator('#asset-retry').wait_for(state='visible',timeout=90000);assert await page.locator('.loading-skip').is_hidden();await page.locator('#asset-retry').click()
  await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000);await page.evaluate('__rainy711.pauseForCapture()');print('PASS failed GLB retains retry and queued entry survives successful retry',flush=True)
  await b.close()
asyncio.run(main())
