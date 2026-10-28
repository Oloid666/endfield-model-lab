"""Actual scene/photo regression. Desktop Chromium software WebGL, not an iPhone test."""
import asyncio,base64,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('PHOTO_TEST_OUT','/tmp/endfield-photo-scenes'));OUT.mkdir(parents=True,exist_ok=True)
async def main():
 errors=[];checks=[]
 def check(name,value):
  checks.append({'name':name,'passed':bool(value)});print(name,value,flush=True);assert value,name
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',e,flush=True)))
  page.set_default_timeout(45000)
  async def js(s,arg=None):return await page.evaluate(s,arg)
  async def tick(n=.1,render=False):return await js('([n,r])=>{const q=__rainy711;q.tick(q.time+n,.05,r);return q.mission}',[n,render])
  async def shot(name):
   await js('()=>{let q=__rainy711;for(let i=0;i<40;i++)q.tick(q.time,1/30,false);q.tick(q.time,.016,true)}')
   c=await page.context.new_cdp_session(page);data=await c.send('Page.captureScreenshot',{'format':'png'});(OUT/(name+'.png')).write_bytes(base64.b64decode(data['data']));await c.detach()
  async def finish():
   phase=await js('__rainy711.mission.phase')
   for i in range(70):
    if await js('__rainy711.mission.phase')!=phase:return
    await tick(2);await js('__rainy711.missionNext()')
   raise AssertionError('Blocked '+phase)
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000)
   print('Scene ready',flush=True);await js('__rainy711.pauseForCapture()');await js('()=>{const n=document.querySelector("#quality");n.value="low";n.dispatchEvent(new Event("change"))}')
   await js('__rainy711.toggleAutoCamera()')
   for name in ['poster1','poster3','oven','insideOut','interior','dragon']:
    await js('name=>__rainy711.frameView(name)',name);await shot(name)
   check('View presets render without exceptions',not errors)
   await js('__rainy711.missionStart()');await finish();await tick(6);await tick(7);await finish();check('Flight gate reached',await js('__rainy711.mission.phase')=='photo-flight')
   await js('__rainy711.fly(0,1)');await js('()=>{let q=__rainy711;for(let i=0;i<24;i++)q.tick(q.time+.1,.05,false);q.fly(0,0)}');await tick(.7);check('Stable photography position',await js('__rainy711.finishFlight()'));await tick(.1,True)
   before=await js('__rainy711.cameraPose');await page.mouse.move(180,300);await page.mouse.down();await page.mouse.move(220,320,steps=4);await page.mouse.up();await tick(.1)
   after=await js('__rainy711.cameraPose');check('Drag turns at fixed photographer position',sum((a-b)**2 for a,b in zip(before['position'],after['position']))<1e-8 and before['target']!=after['target'])
   await page.mouse.move(200,300);await page.mouse.wheel(0,-100);await tick(.1);zoom=await js('__rainy711.cameraPose');check('Zoom keeps optical centre fixed',zoom['position']==after['position'] and zoom['fov']<after['fov'])
   # Return the view toward Zhuang before capture; no orbital movement.
   await page.mouse.move(220,320);await page.mouse.down();await page.mouse.move(180,300,steps=4);await page.mouse.up();await tick(.1,True);await shot('photographer-view')
   eye=await js('__rainy711.cameraPose.position');await js('__rainy711.takePhoto()');check('Capture uses the same physical lens as the preview',await js('eye=>__rainy711.photo.captureOrigin.every((v,i)=>Math.abs(v-eye[i])<1e-6)',eye));check('Independent high-resolution photos exist',await js('__rainy711.photo.height>=2048&&__rainy711.photo.closeup.length>1000'))
   await tick(2.5);await tick(1,True);await shot('two-faces-phone');await finish();await tick(.1,True)
   await page.get_by_role('button',name='返回一起看手機',exact=True).click();await page.locator('.photo-open').click();check('Blink check opens sharp portrait',await js('__rainy711.photoViewer.index')==1)
   await page.locator('.gallery-footer button').last.click();check('Gallery send releases input overlay',not await page.locator('.phone-gallery').is_visible() and not await page.locator('#app').evaluate('e=>e.classList.contains("gallery-open")'))
   await tick(1.3,True);check('Send reaches receipt dialogue',await js('__rainy711.mission.phase')=='cargo');await shot('after-send')
   await page.locator('.mission-line').click(force=True);await page.locator('.mission-line').click(force=True);check('Receipt dialogue remains clickable',await js('__rainy711.mission.nodeId')=='cargo_1')
   check('No JavaScript errors',not errors)
  finally:
   (OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
