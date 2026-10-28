"""Slow-resource opening, single caption, interaction and renderer reuse."""
import asyncio,base64,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('OPENING_TEST_OUT','/tmp/endfield-opening'));OUT.mkdir(parents=True,exist_ok=True)
async def main():
 checks=[];errors=[]
 def check(name,ok):
  checks.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
  gate=asyncio.Event()
  async def model(route):
   await gate.wait();await route.continue_()
  await page.route('**/*.glb',model)
  async def shot(name):
   c=await page.context.new_cdp_session(page);data=await c.send('Page.captureScreenshot',{'format':'png'});(OUT/(name+'.png')).write_bytes(base64.b64decode(data['data']));await c.detach()
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4180/'),wait_until='domcontentloaded')
   await page.wait_for_function('document.querySelector("#loading-joke").textContent.includes("溫馨雨夜")')
   check('Single story caption on welcome',await page.locator('.scene-caption').evaluate('e=>getComputedStyle(e).visibility==="hidden"'))
   await shot('welcome')
   await page.wait_for_function('document.querySelector("#loading-joke").textContent.includes("阿莊")');await shot('phone')
   check('Progress below completion while model is delayed',await page.locator('#loading progress').evaluate('e=>e.value<100'))
   await page.wait_for_function('!document.querySelector(".loading-interact").hidden')
   check('Waiting has a quiet gap',await page.locator('#loading-joke').inner_text()=='')
   await page.locator('.loading-interact').click();check('Click gives one response','龍泡泡' in await page.locator('#loading-joke').inner_text());await shot('idle-response')
   gate.set();await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000)
   check('Opening reaches 100 only after resources and dialogue',await page.evaluate('__rainy711.loading.done&&__rainy711.loading.percent===100'))
   check('Only one scene canvas and renderer',await page.locator('#scene canvas').count()==1)
   check('Refresh starts at ready',await page.evaluate('__rainy711.mission.phase')=='ready')
   check('No runtime errors',not errors)
  finally:
   gate.set();(OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
