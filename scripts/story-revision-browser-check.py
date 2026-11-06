"""Real Chromium/SwiftShader scene QA; resource counts are not iPhone FPS measurements."""
import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='no-preference')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded')
  await page.wait_for_function('!!window.__rainy711',timeout=180000)
  await page.evaluate("__rainy711.pauseForCapture();__rainy711.frameView('street')")
  async def advance(seconds,render=True):
   await page.evaluate('(o)=>{const g=__rainy711,n=Math.ceil(o.seconds/.1);for(let i=0;i<n;i++)g.tick(g.time+o.seconds/n,.1,o.render&&i===n-1)}',{'seconds':seconds,'render':render})
  async def jump(destination):
   assert await page.evaluate('(id)=>__rainy711.debugJump(id)',destination),destination
   await advance(.1)
  async def shot(name):
   await page.screenshot(path='/tmp/story-revision-'+name+'.png')
  async def sign_point():
   return await page.evaluate("()=>{const g=__rainy711,p=g.projectPoint([0,3.1,2.23]),r=document.querySelector('#scene').getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}")
  assert not await page.evaluate('__rainy711.debug.unlocked')
  await advance(.1);await shot('opening')
  for _ in range(7):
   q=await sign_point();await page.mouse.click(q['x'],q['y']);await advance(.1,False)
  await advance(.1)
  assert await page.evaluate('__rainy711.debug.unlocked&&__rainy711.mission.postgame&&__rainy711.staging.show.mode==="intact"')
  if os.environ.get('CANCEL_ONLY'):
   await page.evaluate("()=>{window.pendingJump=__rainy711.debugJump('birth');__rainy711.missionReplay();}")
   assert not await page.evaluate('__rainy711.debug.unlocked||__rainy711.mission.paused')
   await page.evaluate('__rainy711.missionPause(true);__rainy711.missionPause(false)')
   assert not await page.evaluate('__rainy711.mission.paused'),'Cancelled load kept an invisible pause reason'
   assert not await page.evaluate('window.pendingJump')
   assert await page.evaluate('__rainy711.mission.phase')=='intro'
   assert not errors,errors
   print('PASS restarting during model preload cancels jump and releases input',flush=True)
   await browser.close();return
  await page.get_by_role('button',name='快速測試',exact=True).click()
  await page.locator('[data-debug-destination="figurine"]').click();await advance(.2)
  assert await page.evaluate('__rainy711.mission.node.cue')=='rossi-collection'
  await advance(2);await page.locator('.mission-line').click();await page.locator('.mission-line').click();await advance(.2)
  assert await page.evaluate('__rainy711.cinematic.cameraBeat')=='briefing-rossi-closeup'
  await shot('rossi-portrait')
  assert not await page.evaluate('__rainy711.cameraOcclusion([.28,4.69,1.43])')
  await page.set_viewport_size({'width':844,'height':390});await advance(.2);await shot('rossi-landscape');await page.set_viewport_size({'width':390,'height':844})
  print('PASS actual seven sign taps and semantic Rossi closeup',flush=True)
  await jump('birth');await shot('birth-start')
  assert not await page.evaluate('__rainy711.staging.remnant.visible')
  for seconds,name in [(1.8,'charred'),(1.7,'swelling'),(2,'escape'),(1.8,'landed'),(1,'witness')]:
   await advance(seconds);await shot('birth-'+name)
   if name=='swelling':assert await page.evaluate('__rainy711.staging.remnant.visible')
   if name=='escape':assert await page.evaluate('__rainy711.microwave.doorAngle')<-.2
  assert await page.evaluate('__rainy711.mission.nodeId')=='meal_origin'
  await advance(30);assert await page.evaluate('__rainy711.mission.nodeId')=='meal_origin'
  for expected in ['meal_reaction','meal_joke']:
   await page.locator('.mission-line').click();assert await page.evaluate('__rainy711.mission.nodeId')==expected
  await page.locator('.mission-line').click();assert await page.evaluate('__rainy711.mission.phase')=='heat'
  print('PASS continuous birth and manual reading gate',flush=True)
  await jump('nikke');await advance(1.6);await shot('nikke-explanation')
  assert '帳號密碼' in await page.locator('.mission-text').inner_text()
  assert await page.evaluate('__rainy711.devices.forensics')
  for _ in range(5):
   await page.locator('.mission-line').click();await advance(.4)
  await advance(.5);assert await page.evaluate('__rainy711.mission.tablet.stage')=='rapi-request'
  await page.locator('.mission-line').click();await advance(.4)
  age=await page.evaluate('__rainy711.mission.tablet.age');await advance(max(.01,.68-age));assert not await page.evaluate('__rainy711.devices.censored')
  await advance(.04);assert await page.evaluate('__rainy711.devices.censored')
  await shot('nikke-censored')
  print('PASS plain-language credential warning, technical overlay and late eye bar',flush=True)
  for destination in ['claims','classroom','rating']:
   await jump(destination);assert await page.evaluate('__rainy711.bonus.route')==destination
   assert await page.get_by_role('button',name='快速測試',exact=True).is_visible()
   await page.get_by_role('button',name='快速測試',exact=True).click()
   await page.locator('[data-debug-destination="street"]').click();await advance(.2)
   assert await page.evaluate('__rainy711.mission.postgame&&!__rainy711.bonus.active')
  await page.get_by_role('button',name='進入二樓劇情',exact=True).click()
  await jump('street');await page.wait_for_timeout(1000)
  assert await page.evaluate('__rainy711.mission.postgame&&!__rainy711.bonus.active'),'Cancelled upstairs transition returned late'
  await jump('first-restore');await shot('first-restore-prompt')
  assert await page.get_by_role('button',name='還沒演完？',exact=True).is_visible()
  await page.get_by_role('button',name='還沒演完？',exact=True).click();await advance(4.8)
  assert await page.evaluate('__rainy711.staging.show.buildingProgress')==0
  await advance(60);assert await page.get_by_role('button',name='跟上龍泡泡',exact=True).is_visible()
  await jump('street')
  resources=[]
  for i in range(6):
   await page.get_by_role('button',name='拆掉房子' if i%2==0 else '復原房子',exact=True).click()
   await advance(4.8);assert await page.evaluate('__rainy711.staging.show.buildingProgress')==0
   await advance(60);resources.append(await page.evaluate('__rainy711.performance'))
  assert len(set(r['geometries'] for r in resources[1:]))==1,resources
  assert len(set(r['textures'] for r in resources[1:]))==1,resources
  await shot('street')
  await page.evaluate('__rainy711.missionReplay()');await advance(.1)
  assert not await page.evaluate('__rainy711.debug.unlocked||__rainy711.staging.remnant.visible')
  assert await page.get_by_role('button',name='快速測試',exact=True).is_hidden()
  await page.reload(wait_until='domcontentloaded');await page.wait_for_function('!!window.__rainy711',timeout=180000)
  assert not await page.evaluate('__rainy711.debug.unlocked')
  assert not errors,errors
  Path('/tmp/story-revision-browser-results.json').write_text(json.dumps({'errors':errors,'resource_samples':resources,'device':'Chromium SwiftShader; not iPhone'},indent=2))
  print('PASS upstairs jumps, first restoration, six house switches, stable resources and restart/reload cleanup',flush=True)
  await browser.close()

asyncio.run(main())
