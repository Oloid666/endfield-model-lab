"""Reduced-motion layouts, actual reverse reconstruction and seven-tap access."""
import asyncio,json,base64
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('artifacts');checks=[];errors=[]
def check(name,ok):checks.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');page.set_default_timeout(120000);page.on('pageerror',lambda e:(errors.append(str(e)),print(e,flush=True)))
  async def js(code):return await page.evaluate(code)
  async def tick(n=.1,r=False):return await page.evaluate('([n,r])=>{const q=__rainy711;q.tick(q.time+n,.05,r);return q.mission}',[n,r])
  async def shot(name):
   await js('__rainy711.tick(__rainy711.time,.016,true)');c=await page.context.new_cdp_session(page);d=await c.send('Page.captureScreenshot',{'format':'png'});(OUT/f'responsive-{name}.png').write_bytes(base64.b64decode(d['data']));await c.detach()
  async def finish():
   phase=await js('__rainy711.mission.phase')
   for _ in range(80):
    if await js('__rainy711.mission.phase')!=phase:return
    await tick(2);await js('__rainy711.missionNext()')
   raise AssertionError(phase)
  try:
   await page.goto('http://127.0.0.1:4173/',wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('__rainy711.pauseForCapture()');await tick();await js('()=>{const n=document.querySelector("#quality");n.value="low";n.dispatchEvent(new Event("change",{bubbles:true}))}');await js('__rainy711.missionStart()');await tick(1);await js('__rainy711.missionNext();__rainy711.missionNext()');await shot('dialogue-phone')
   for w,h in [(320,568),(390,844),(1366,768),(1920,1080),(844,390)]:
    await page.set_viewport_size({'width':w,'height':h});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(.1,True);check(f'Dialogue fits {w}x{h}',await page.locator('.mission-panel').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.x>=-1&&r.right<=innerWidth+1&&r.y>=-1&&r.bottom<=innerHeight+1}'));await shot('dialogue-'+str(w))
   await page.set_viewport_size({'width':390,'height':844});await js("__rainy711.restoreChapter('last')");await finish();await tick(9);await js('()=>{const q=__rainy711;q.tick(q.time+q.mission.meterPeriod/4,.05,false);q.missionAttack(q.time)}');await tick(60);await tick(10,True);await page.locator('#menu-toggle').click();check('Ruined street offers rebuild',await page.get_by_role('button',name='好想回到那時候',exact=True).is_visible());await page.get_by_role('button',name='好想回到那時候',exact=True).click();await page.wait_for_function('!__rainy711.bonus.active');await tick(1,True);check('Reduced rebuild restores actual house',await js('__rainy711.destruction.progress')==0);check('Rebuilt street hides premature ending card',not await page.locator('.epilogue-prompt').is_visible());check('Rebuild still requires seven taps',not await page.locator('.bonus-entry').is_visible())
   await page.locator('[data-view=street]').click();await tick(.1,True)
   point=await js('()=>{const q=__rainy711;const p=q.projectPoint([0,3.1,2.23]),r=document.querySelector("#scene").getBoundingClientRect();return [r.x+(p[0]+1)*r.width/2,r.y+(1-p[1])*r.height/2]}')
   for _ in range(7):await page.mouse.click(*point)
   print('Sign tap state',await js('__rainy711.bonus.taps'),flush=True);check('Seven taps work after reconstruction',await page.locator('.bonus-entry').is_visible());await page.locator('.bonus-entry').click();await page.wait_for_function('!__rainy711.bonus.busy');await page.locator('[data-action=claims-next]').click()
   for _ in range(75):
    if await js('__rainy711.bonus.route')=='settlement-result':break
    phase=await js('__rainy711.bonus.negotiation.phase')
    if phase=='choice':await page.locator('[data-action=claims-select]').first.click()
    elif phase=='stamp':await tick(.2,True)
    else:await page.locator('[data-action=claims-next]').click()
   check('Reduced claims completes',await js('__rainy711.bonus.route')=='settlement-result');await page.locator('[data-action=claims-next]').click();await page.locator('[data-action=class-start]').click();await page.wait_for_function('!__rainy711.bonus.busy');await page.locator('[data-action=class-next]').click()
   await js("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))");await page.locator('.background-resume').click();check('Background continue works inside second floor',not await page.locator('.background-resume').is_visible())
   for w,h in [(320,568),(390,844),(1366,768),(1920,1080),(844,390)]:
    await page.set_viewport_size({'width':w,'height':h});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(.2,True);check(f'Class controls fit {w}x{h}',await page.locator('.bonus-class-dock:not([hidden])').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.x>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}'));check(f'Class reading stays above fixed control {w}x{h}',await page.locator('.bonus-panel').evaluate('(e)=>{const r=e.getBoundingClientRect(),d=[...document.querySelectorAll(".bonus-class-dock")].find(n=>!n.hidden).getBoundingClientRect();return r.bottom<=d.top+1&&r.height>70}'));await shot('class-'+str(w))
   for _ in range(100):
    route=await js('__rainy711.bonus.route')
    if route=='class-result':break
    if route in ['class-wait','class-stamping']:await tick(.3,True)
    else:await page.locator('[data-action=class-next]').click();await tick(.1)
   await page.locator('[data-action=class-next]').click();await page.locator('[data-action=rate][data-value="5"]').click();await page.locator('[data-action=rate-submit]').click();await tick(.5,True);await shot('whisper');await page.locator('[data-action=thanks-next]').click();await page.locator('[data-action=thanks-next]').click();await tick(.5,True);await shot('wave');await page.locator('[data-action=thanks-next]').click();await tick(.3,True);await shot('fin');check('Reduced ending returns to street',await page.locator('[data-action=close]').is_visible());check('No runtime exceptions',not errors)
  finally:
   (OUT/'responsive-rebuild-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
