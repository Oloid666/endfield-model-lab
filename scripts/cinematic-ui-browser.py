"""Story, responsive input and reset regression against the built game."""
import asyncio,json,base64,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('CINEMATIC_TEST_OUT','/tmp/endfield-cinematic'));OUT.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
def check(name,ok):
 checks.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(120000);page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',e,flush=True)))
  async def js(s):return await page.evaluate(s)
  async def tick(n=.1,render=False):return await page.evaluate('([n,r])=>{const q=__rainy711;q.tick(q.time+n,.05,r);return q.mission}',[n,render])
  async def shot(name):
   await js('()=>{const q=__rainy711;for(let i=0;i<35;i++)q.tick(q.time,1/30,false);q.tick(q.time,.016,true)}')
   c=await page.context.new_cdp_session(page);r=await c.send('Page.captureScreenshot',{'format':'png'});(OUT/f'cinematic-ui-{name}.png').write_bytes(base64.b64decode(r['data']));await c.detach()
  async def finish():
   phase=await js('__rainy711.mission.phase')
   for _ in range(90):
    if await js('__rainy711.mission.phase')!=phase:return
    await tick(2);await js('__rainy711.missionNext()')
   raise AssertionError('blocked '+phase)
  async def ready():
   await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('__rainy711.pauseForCapture()');await tick();await js('()=>{const n=document.querySelector("#quality");n.value="low";n.dispatchEvent(new Event("change",{bubbles:true}))}')
  try:
   await page.add_init_script("localStorage.setItem('rainy711.epilogue.v3',JSON.stringify({version:3,stage:'done',rating:5}));localStorage.setItem('rainy711.chapters.v1',JSON.stringify({version:1,chapter:'last',unlocked:['last'],complete:true}))")
   print('Loading built game',flush=True);await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/'),wait_until='domcontentloaded');await ready();check('Old ending save ignored',await js('__rainy711.mission.phase')=='ready' and not await page.locator('.bonus-entry').is_visible());check('Building intact',await js('__rainy711.destruction.progress')==0)
   await js('__rainy711.toggleAutoCamera()')
   for view in ['heroFront','story']:
    await js(f'__rainy711.frameView("{view}")');await shot(view)
   await js('__rainy711.missionStart()');await tick(1,True);check('Opening continues phone conversation','總算' in await js('__rainy711.mission.text'));await shot('opening');await tick(2);await js('__rainy711.missionNext();__rainy711.missionNext()');await tick(1,True)
   distance=await js('()=>{const q=__rainy711,h=q.heroPosition,d=q.dragonPosition;return Math.hypot(h[0]-d[0],h[2]-d[2])}');check('Conversation has social distance',distance>1.1);await shot('conversation');await finish();await tick(6);await tick(7);await finish();check('Flight is manual gate',await js('__rainy711.mission.phase')=='photo-flight');await tick(.1,True);check('Zhuang guides position','再退一點' in await page.locator('.investigation-message').inner_text());await shot('flight')
   await js('__rainy711.fly(0,1)');await js('()=>{const q=__rainy711;for(let i=0;i<24;i++)q.tick(q.time+.1,.05,false);q.fly(0,0)}');await tick(.7,True);check('Correct position enables camera',await js('__rainy711.mission.flight.ready'));await js('__rainy711.finishFlight()');await tick(.1,True);await js('__rainy711.takePhoto()');check('Independent portrait exists',await js('__rainy711.photo.closeup.length>1000'));await tick(2.5);await finish();await tick(.2,True);check('Gallery opens automatically',await page.locator('.phone-gallery').is_visible());await shot('gallery')
   check('No previous or next photo buttons',await page.get_by_role('button',name='上一張',exact=True).count()==0 and await page.get_by_role('button',name='下一張',exact=True).count()==0);box=await page.locator('.gallery-stage').bounding_box();await page.mouse.move(box['x']+box['width']*.8,box['y']+box['height']*.5);await page.mouse.down();await page.mouse.move(box['x']+box['width']*.2,box['y']+box['height']*.5,steps=5);await page.mouse.up();check('Gallery switches to portrait',await js('__rainy711.photoViewer.index')==1);await page.get_by_role('button',name='放大',exact=True).click();check('Gallery zooms',await js('__rainy711.photoViewer.scale')>1);await shot('portrait');await page.get_by_role('button',name='返回一起看手機',exact=True).click();check('Closing retains accessible reopen',await page.locator('.photo-open').is_visible());await page.locator('.photo-open').click();check('Reopen retains image',await js('__rainy711.photoViewer.index')==1)
   await js("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'))");check('Background pause offers reachable continue',await page.locator('.background-resume').is_visible());await page.locator('.background-resume').click();check('Continue re-enables gallery send',not await page.locator('.gallery-footer button').last.is_disabled());await page.get_by_role('button',name='返回一起看手機',exact=True).click()
   for w,h in [(320,568),(390,844),(1366,768),(1920,1080),(844,390)]:
    await page.set_viewport_size({'width':w,'height':h});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(.1,True);await page.locator('.photo-open').click();check(f'Gallery reachable {w}x{h}',await page.locator('.phone-gallery').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.x>=-1&&r.right<=innerWidth+1&&r.top>=-1&&r.bottom<=innerHeight+1}'));await shot(f'gallery-{w}');await page.get_by_role('button',name='返回一起看手機',exact=True).click()
   await page.set_viewport_size({'width':390,'height':844});await js('__rainy711.sendPhoto()');await tick(1.3,True);check('Receipt stays in scene',not await page.locator('.album-receipt').is_visible());await shot('receipt');await finish();await finish();await js('__rainy711.acceptCall()');await finish();await tick(1.1,True);check('BOOK starts as a physical book',await js('__rainy711.connectionStage.bookVisible'));await shot('book');await tick(2.4,True);await shot('book-keyboard');await tick(2.6,True);check('Slow terminal reaches login',await js('__rainy711.mission.phase')=='login');await shot('terminal')
   await js("__rainy711.restoreChapter('last')");await finish();await tick(9);await js('()=>{const q=__rainy711;q.tick(q.time+q.mission.meterPeriod/4,.05,false);q.missionAttack(q.time)}');await tick(60);await tick(10,True);check('Fake Fin interrupted',await page.locator('.epilogue-prompt').is_visible());await shot('fake-fin')
   for _ in range(2):await page.locator('.epilogue-prompt button').click()
   check('Important-task button after speech','進入重要任務' in await page.locator('.epilogue-prompt button').inner_text());await page.locator('.epilogue-prompt button').click();await page.wait_for_function('__rainy711.bonus.active&&!__rainy711.bonus.busy');await tick(2,True);check('Rebuild restores actual structure',await js('__rainy711.destruction.progress')==0);check('Claims introduction','料事如神' in await page.locator('.bonus-content').inner_text());await page.locator('[data-action=claims-next]').click()
   for _ in range(75):
    if await js('__rainy711.bonus.route')=='settlement-result':break
    await tick(1.6,True)
    if await js('__rainy711.bonus.route')=='settlement-result':break
    phase=await js('__rainy711.bonus.negotiation.phase')
    if phase=='choice':
     await page.locator('[data-action=claims-select]').first.click();check('Selection holds a reaction beat',await page.locator('[data-action=claims-next]').is_disabled());await tick(.5,True);await shot('claims-reaction')
    elif phase=='stamp':await tick(1.3,True)
    else:
     await page.locator('[data-action=claims-next]').click()
     if await js('__rainy711.bonus.negotiation.cue?.event')=='policyholder':
      await tick(.75,True);check('Policyholder makes facial features fly',await js('__rainy711.bonus.room.faceDetached')>.9);await shot('claims-face-flight');await tick(.8,True);check('Facial features return',await js('__rainy711.bonus.room.faceDetached')==0)
   check('Claims completes',await js('__rainy711.bonus.route')=='settlement-result');await page.locator('[data-action=claims-next]').click();check('Class invitation connects rooms','當老師' in await page.locator('.bonus-content').inner_text());await page.locator('[data-action=class-start]').click();await page.wait_for_function('!__rainy711.bonus.busy');await page.locator('[data-action=class-next]').click()
   for _ in range(100):
    route=await js('__rainy711.bonus.route')
    if route=='class-result':break
    if route in ['class-wait','class-stamping']:await tick(1.3,True)
    else:await page.locator('[data-action=class-next]').click();await tick(.1)
   check('Eight lessons finish',len(await js('__rainy711.bonus.course.completed'))==8);await page.locator('[data-action=class-next]').click();check('Rating precedes true Fin',await js('__rainy711.bonus.route')=='rating');await page.locator('[data-action=rate][data-value="4"]').click();await page.locator('[data-action=rate-submit]').click();check('Secret comes first','七下' in await page.locator('.bonus-content').inner_text());await page.locator('[data-action=thanks-next]').click();check('Dry feedback line second','沒有人會看' in await page.locator('.bonus-content').inner_text());await page.locator('[data-action=thanks-next]').click();check('886 third','886' in await page.locator('.bonus-content').inner_text());await page.locator('[data-action=thanks-next]').click();check('True Fin has street return',await page.locator('[data-action=close]').is_visible());await shot('true-fin')
   await page.reload(wait_until='domcontentloaded');await ready();check('Reload after final returns to beginning',await js('__rainy711.mission.phase')=='ready' and not await page.locator('.bonus-entry').is_visible());check('No runtime exceptions',not errors)
  finally:
   (OUT/'cinematic-ui-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
