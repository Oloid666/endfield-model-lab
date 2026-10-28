"""Actual scene checks for the microwave, tractor, pause and singing prop."""
import asyncio,base64,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('EFFECTS_TEST_OUT','/tmp/endfield-effects'));OUT.mkdir(parents=True,exist_ok=True)
async def main():
 checks=[];errors=[]
 def check(name,ok):
  checks.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(45000);page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(s):return await page.evaluate(s)
  async def tick(n=.1,render=False):return await page.evaluate('([n,r])=>{const q=__rainy711;q.tick(q.time+n,.05,r);return q.mission}',[n,render])
  async def shot(name):
   await tick(0,True);c=await page.context.new_cdp_session(page);data=await c.send('Page.captureScreenshot',{'format':'png'});(OUT/(name+'.png')).write_bytes(base64.b64decode(data['data']));await c.detach()
  async def finish():
   phase=await js('__rainy711.mission.phase')
   for _ in range(80):
    if await js('__rainy711.mission.phase')!=phase:return
    await tick(2);await js('__rainy711.missionNext()')
   raise AssertionError(phase)
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4180/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('__rainy711.pauseForCapture()');await js('()=>{let n=document.querySelector("#quality");n.value="low";n.dispatchEvent(new Event("change"))}')
   await js('__rainy711.toggleAutoCamera()')
   for view in ['heroFront','story']:
    await js(f'__rainy711.frameView("{view}")');await shot(view)
   check('No premature purple creature',not await js('__rainy711.staging.remnant.born'))
   await js("__rainy711.restoreChapter('rewind')");await page.wait_for_function('!__rainy711.mission.paused',timeout=180000);await tick(10.1);await finish();check('Recall reaches circuit puzzle',await js('__rainy711.mission.phase')=='hack')
   await js('()=>{const q=__rainy711,want=[1,0,2,3];for(let i=0;i<4;i++){while(q.mission.hack.turns[i]!==want[i])q.hackRotate(i)}}');await page.get_by_role('button',name='開始駭入',exact=True).click();await finish();check('Mandatory microwave explanation',await js('__rainy711.mission.phase')=='heat-demo');await tick(7,True);await shot('meal-origin');await tick(11);check('Microwave ready',await js('__rainy711.mission.phase')=='heat')
   await js('__rainy711.missionHeatStart()');await tick(2,True);check('First overload creates crawling lump',await js('__rainy711.staging.remnant.born&&__rainy711.staging.remnant.visible&&__rainy711.staging.remnant.shape==="crawling-lump"'));await shot('purple-lump')
   for w,h in [(320,568),(844,390)]:
    await page.set_viewport_size({'width':w,'height':h});await tick(.1,True);check(f'Heat controls fit {w}x{h}',await page.locator('.investigation-ui').evaluate('e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}'))
   await page.set_viewport_size({'width':390,'height':844});await js("__rainy711.restoreChapter('last')")
   for _ in range(30):
    if await js('__rainy711.mission.node?.event')=='dragon-capture':break
    await tick(1);await js('__rainy711.missionNext()')
   await tick(.8,True);check('Capture line triggers tractor beam',await js('__rainy711.staging.tractor'));check('Tractor shot includes both faces',await js('()=>{const q=__rainy711,h=q.heroPosition,d=q.dragonPosition;return [[h[0],h[1]+1.42,h[2]],[d[0],d[1]+.32,d[2]]].every(p=>{const v=q.projectPoint(p);return Math.abs(v[0])<.9&&v[1]>-.5&&v[1]<.8})}'));await shot('tractor')
   await js('__rainy711.missionPause(true)');before=await js('[__rainy711.dragonPosition,__rainy711.cameraPose,__rainy711.mission.clock]');await tick(30,True);after=await js('[__rainy711.dragonPosition,__rainy711.cameraPose,__rainy711.mission.clock]');check('Pause freezes character, camera and story clock',before==after);await js('__rainy711.missionPause(false)');await finish();await tick(9);await shot('prelaunch')
   await js('()=>{const q=__rainy711;q.tick(q.time+q.mission.meterPeriod/4,.05,false);q.missionAttack(q.time)}');await tick(9.1);await tick(15);await tick(14.2,True);check('Song reached',await js('__rainy711.mission.phase')=='tour');check('Floating microphone is visible during singing',await js('__rainy711.staging.microphone'));await shot('singing');await tick(16,True);check('Microphone exits after singing',not await js('__rainy711.staging.microphone'));await tick(3.9,True);check('Fake Fin appears',await js('__rainy711.mission.phase')=='complete');await tick(1.21,True);check('Fake Fin promptly continues',await page.locator('.epilogue-prompt').is_visible())
   check('No runtime exceptions',not errors)
  finally:
   (OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
