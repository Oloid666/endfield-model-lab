"""Verify the actual portrait anchor and prevent game UI leaking into the opening."""
import asyncio,base64,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('FRAMING_TEST_OUT','/tmp/endfield-framing'));OUT.mkdir(parents=True,exist_ok=True)
async def main():
 checks=[];errors=[]
 def check(name,ok):
  checks.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':390,'height':844});page.set_default_timeout(60000);page.on('pageerror',lambda e:errors.append(str(e)))
  async def shot(name):
   c=await page.context.new_cdp_session(page);d=await c.send('Page.captureScreenshot',{'format':'png'});(OUT/(name+'.png')).write_bytes(base64.b64decode(d['data']));await c.detach()
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4180/'),wait_until='domcontentloaded')
   await page.wait_for_function('document.querySelector("#loading-message").textContent.includes("場景已就緒")',timeout=180000)
   check('Game controls hidden during ready-to-enter opening',await page.locator('.mission-shell').evaluate('e=>getComputedStyle(e).visibility==="hidden"'))
   await shot('opening-no-overlap');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000)
   await page.evaluate('__rainy711.pauseForCapture();__rainy711.toggleAutoCamera()')
   for view in ['heroFront','story']:
    await page.evaluate('v=>{const q=__rainy711;q.frameView(v);q.tick(q.time,.016,true)}',view);await shot(view)
    if view=='heroFront':check('Head centred in portrait',await page.evaluate('()=>{const q=__rainy711,p=q.projectPoint(q.headPosition);return Math.abs(p[0])<.15&&p[1]>0&&p[1]<.7}'))
    else:check('Both subjects inside the pair shot',await page.evaluate('()=>{const q=__rainy711,d=q.dragonPosition;return [q.headPosition,[d[0],d[1]+.32,d[2]]].every(p=>Math.abs(q.projectPoint(p)[0])<.85)}'))
   check('No runtime exceptions',not errors)
  finally:
   (OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
