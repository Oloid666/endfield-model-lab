"""Story presentation gates and actual desktop/mobile rendering regression."""
import asyncio,json,os,base64
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(__file__).resolve().parents[1]/'artifacts'
async def main():
 checks=[];errors=[]
 def check(name,ok):
  checks.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':1366,'height':768},device_scale_factor=1);page.set_default_timeout(120000);page.on('pageerror',lambda e:(errors.append(str(e)),print('PAGE ERROR',str(e),flush=True)))
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def tick(n=.1):return await js('n=>{const q=__rainy711;q.tick(q.time+n,.05,true);return q.mission}',n)
  async def shot(name):
   # CDP capture does not wait on unrelated running web animations.
   c=await page.context.new_cdp_session(page);r=await c.send('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False});(OUT/f'presentation-{name}.png').write_bytes(base64.b64decode(r['data']));await c.detach()
  async def finish():
   phase=await js('__rainy711.mission.phase')
   for _ in range(80):
    if await js('__rainy711.mission.phase')!=phase:return
    if await js('__rainy711.mission.presentationLocked'):await tick(2)
    await js('__rainy711.missionNext()')
   raise AssertionError('blocked '+phase)
  try:
   await page.add_init_script("localStorage.setItem('rainy711.bonus.v1',JSON.stringify({unlocked:true,warned:true}));localStorage.removeItem('rainy711.chapters.v1')")
   print('Loading production build',flush=True);await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('__rainy711.pauseForCapture()');await tick()
   check('Old unlocked save does not show entry',not await page.locator('.bonus-entry').is_visible());check('Ready phase has intact store',await js('__rainy711.destruction.progress')==0);check('Desktop label is appropriate','iPhone' not in await page.locator('.device-note').inner_text());await shot('desktop-opening');await js('()=>{const n=document.querySelector("#quality");n.value="low";n.dispatchEvent(new Event("change",{bubbles:true}))}')
   await page.locator('.view-expand').first.click();check('Street picker has all eight views',await page.locator('.view-picker button').count()==8);await page.locator('.view-picker button').nth(6).click();await tick();check('Direct picker shows water tank','水塔' in await page.locator('[data-view=street]').inner_text());await page.locator('[data-view=reset]').click();await tick()
   point=await js('()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),c=document.querySelector("#scene").getBoundingClientRect();return [c.x+(p[0]+1)*c.width/2,c.y+(1-p[1])*c.height/2]}')
   for _ in range(7):await page.mouse.click(*point)
   check('Seven front-logo taps reveal entrance',await page.locator('.bonus-entry').is_visible());await page.locator('.bonus-entry').click();await page.locator('[data-action=classroom]').click();await page.wait_for_function('!__rainy711.bonus.busy');await tick(2);await shot('desktop-classroom');check('Desktop room panel stays in right column',await page.locator('.bonus-panel').evaluate('(e)=>e.getBoundingClientRect().x>innerWidth*.5'));await page.locator('[data-action=class-next]').click();await tick(1);await shot('desktop-lesson');await page.locator('[data-action=class-menu]').click();await page.locator('.bonus-dialog [data-action=close]').click();await tick()
   await js('__rainy711.missionStart()');await tick(.2);check('Opening uses Dragon close-up',await js('__rainy711.cinematic.cameraBeat')=='opening-dragon-close');await shot('opening-close')
   await finish();await tick(6);await tick(7);check('Photo dialogue reached',await js('__rainy711.mission.phase')=='photo-talk');await finish();check('Photo flight reached after handover',await js('__rainy711.mission.phase')=='photo-flight');await shot('desktop-flight')
   await js('__rainy711.fly(0,1)')
   await js('()=>{const q=__rainy711;for(let i=0;i<26;i++)q.tick(q.time+.1,.05,i===25)}')
   await js('__rainy711.fly(0,0)');check('Retreat reaches valid shooting distance',await js('__rainy711.finishFlight()'));await tick();await shot('camera-frame');await js('__rainy711.takePhoto()');check('Shutter stores an image',await js('__rainy711.photo.src.length')>1000);await tick(1);check('Return uses side shot',await js('__rainy711.cinematic.cameraBeat')=='photo-return-side');await shot('photo-return');await tick(1.6);await finish();check('Photo review reached',await js('__rainy711.mission.phase')=='photo-review');await shot('desktop-review');await page.set_viewport_size({'width':390,'height':844});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick();await shot('mobile-review');await page.set_viewport_size({'width':1366,'height':768});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick();check('Desktop preview fits viewport',await page.locator('.investigation-ui').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.x>=0&&r.y>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}'))
   await js('__rainy711.sendPhoto()');check('Send animation exists',await page.locator('.photo-sending').is_visible());await shot('sending');await tick(1.3);check('Album transition spoken by Zhuang',await js('__rainy711.mission.speaker')=='zhuang');await js('__rainy711.missionNext();__rainy711.missionNext()');await tick();await shot('desktop-receipt');await finish();await finish();await js('__rainy711.acceptCall()');await finish();await tick(5)
   check('Login panel fully fits desktop',await page.locator('.mission-connect').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight&&r.right<=innerWidth}'));await shot('desktop-login')
   for _ in range(5):await js('__rainy711.missionSubmit()')
   check('Fifth error reveals assistance button',await page.locator('.mission-assist').is_visible());await page.locator('.mission-assist').click();check('Login assist preserves verification dialogue',await js('__rainy711.mission.phase')=='verify-talk')
   await page.set_viewport_size({'width':390,'height':844});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await js("__rainy711.restoreChapter('last')");await tick();await finish();check('Final shot locked during preparation',not await js('__rainy711.mission.canAttack'));await shot('mobile-final-preparation');await tick(9);check('Final shot opens after performance',await js('__rainy711.mission.canAttack'));await js('()=>{const q=__rainy711,s=q.mission;q.tick(q.time+s.meterPeriod/4,.05,false);q.missionAttack(q.time)}');await tick(5);check('First explosion is presented',await js('__rainy711.cinematic.cameraBeat')=='finisher-city-impact');await shot('server-impact');await tick(1.3);check('Second explosion is presented',await js('__rainy711.cinematic.cameraBeat')=='finisher-neighbor-impact');await shot('neighbor-impact');await tick(1.6);check('Both impact sites get wide view',await js('__rainy711.cinematic.cameraBeat')=='finisher-two-sites');await shot('two-sites');await tick(60);check('Ending reached',await js('__rainy711.mission.phase')=='complete');check('Chapter review unlocked',len(await js('__rainy711.chapters.unlocked'))==5)
   await page.locator('.bonus-entry').click();await page.locator('[data-action=claims]').click();await page.wait_for_function('!__rainy711.bonus.busy');await tick(2);await shot('mobile-claims');await page.locator('[data-action=claims-next]').click()
   for _ in range(70):
    route=await js('__rainy711.bonus.route')
    if route=='settlement-result':break
    phase=await js('__rainy711.bonus.negotiation.phase')
    if phase=='choice':await page.locator('[data-action=claims-select][data-value=B]').click()
    elif phase=='stamp':await tick(1.3)
    else:await page.locator('[data-action=claims-next]').click()
   check('Claims reaches happy ending',await js('__rainy711.bonus.route')=='settlement-result');await tick();await shot('claims-result');check('Three settlement stamps persist',await js('__rainy711.bonus.room.completedStamps')==3)
   check('No runtime errors',not errors)
  finally:
   (OUT/'presentation-browser-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
