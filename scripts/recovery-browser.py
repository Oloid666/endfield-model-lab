"""Recover from a failed model request and an actual lost WebGL context."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 checks=[];errors=[];attempts=0
 def check(name,ok):
  checks.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');page.on('pageerror',lambda e:errors.append(str(e)))
  async def model(route):
   nonlocal attempts
   attempts+=1
   if attempts==1:await route.fulfill(status=503,body='Simulated asset outage')
   else:await route.continue_()
  await page.route('**/zhuang-fangyi.glb',model)
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4181/endfield-model-lab/'),wait_until='domcontentloaded')
   await page.wait_for_function('!document.querySelector("#asset-retry").hidden',timeout=120000)
   check('Asset failure exposes retry',await page.locator('#asset-retry').is_visible());await page.locator('#asset-retry').click()
   await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000)
   check('Retry actually reloads model',attempts>=2);check('Retry keeps one renderer',await page.locator('#scene canvas').count()==1)
   await page.evaluate('()=>{const gl=document.querySelector("#scene canvas").getContext("webgl2");window.lossExtension=gl.getExtension("WEBGL_lose_context");lossExtension.loseContext()}')
   await page.wait_for_function('!document.querySelector("#error").hidden');check('Context loss pauses story',await page.evaluate('__rainy711.mission.paused'))
   await page.evaluate('lossExtension.restoreContext()');await page.wait_for_function('document.querySelector("#error").hidden&&!__rainy711.mission.paused',timeout=120000)
   n=await page.evaluate('__rainy711.renders');await page.wait_for_function('n=>__rainy711.renders>n',arg=n,timeout=60000);check('Context recovery renders again',True);check('No JavaScript exceptions',not errors)
  finally:
   Path(os.environ.get('RECOVERY_TEST_OUT','/tmp/life-recovery.json')).write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
