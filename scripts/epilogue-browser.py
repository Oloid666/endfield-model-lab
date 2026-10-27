"""Production browser regression for the fixed epilogue, course and photo optics."""
import asyncio,json,base64,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('artifacts');checks=[];errors=[]
def check(name,ok):
 print(name,ok,flush=True);checks.append({'name':name,'passed':bool(ok)});assert ok,name
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':390,'height':844});page.set_default_timeout(120000);page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',e,flush=True)))
  async def js(code):return await page.evaluate(code)
  async def tick(n=.1,render=False):return await page.evaluate('([n,r])=>{const q=__rainy711;q.tick(q.time+n,.05,r);return q.mission}',[n,render])
  async def shot(name):
   c=await page.context.new_cdp_session(page);r=await c.send('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False});(OUT/f'epilogue-{name}.png').write_bytes(base64.b64decode(r['data']));await c.detach()
  async def finish():
   phase=await js('__rainy711.mission.phase')
   for _ in range(60):
    if await js('__rainy711.mission.phase')!=phase:return
    await tick(2);await js('__rainy711.missionNext()')
   raise AssertionError('blocked '+phase)
  try:
   await page.add_init_script("if(!sessionStorage.epilogueTestStarted){sessionStorage.epilogueTestStarted='yes';localStorage.removeItem('rainy711.epilogue.v3');localStorage.setItem('rainy711.bonus.v1',JSON.stringify({unlocked:true,read:['general','mikoto','cargo','taste'],course:{stamped:true}}))}")
   print('Loading production',flush=True);await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('__rainy711.pauseForCapture()');await tick()
   await js('()=>{const n=document.querySelector("#quality");n.value="low";n.dispatchEvent(new Event("change",{bubbles:true}))}')
   check('House exists at opening',await js('__rainy711.destruction.progress===0&&__rainy711.actorsVisible'))
   check('Old unlock does not expose second floor',not await page.locator('.bonus-entry').is_visible())
   check('Arrow picker removed',await page.locator('.view-expand,.view-picker').count()==0)
   for _ in range(2):await page.locator('[data-view=interior]').click()
   check('Repeated button reaches onion poster','小蔥海報' in await page.locator('[data-view=interior]').inner_text())
   await page.locator('[data-view=reset]').click();await tick(10,True);check('Secret hint appears','七下' in await page.locator('.bonus-toast').inner_text());await shot('opening')
   await js('__rainy711.missionStart()');await finish();await tick(6);await tick(7);await finish();await js('__rainy711.fly(0,1)');await js('()=>{const q=__rainy711;for(let i=0;i<26;i++)q.tick(q.time+.1,.05,false);q.fly(0,0);q.finishFlight()}');await tick(.1,True);check('Photo ready',await js('__rainy711.mission.phase')=='photo');await js('__rainy711.takePhoto()');check('Wide image >=2048',await js('Math.max(__rainy711.photo.width,__rainy711.photo.height)>=2048'))
   size=await js('async()=>{const i=new Image();i.src=__rainy711.photo.closeup;await i.decode();return [i.naturalWidth,i.naturalHeight]}');check('Independent sharp portrait',size==[1024,1280]);await tick(3);await finish();await tick(.1,True);await page.locator('.photo-face').click();await shot('sharp-face')
   await js("__rainy711.restoreChapter('last')");await finish();await tick(9);await js('()=>{const q=__rainy711;q.tick(q.time+q.mission.meterPeriod/4,.05,false);q.missionAttack(q.time)}');await tick(60);await tick(10,True)
   check('Fake ending reaches interrupted epilogue',await page.locator('.epilogue-prompt').is_visible());check('Zhuang remembers remaining task','還有任務' in await page.locator('.epilogue-prompt').inner_text());await shot('fake-fin')
   await page.locator('.epilogue-prompt button').click();check('Dragon remembers second floor','二樓還不能拆' in await page.locator('.epilogue-prompt').inner_text());await tick(2);await page.wait_for_function('window.__rainy711.bonus.active&&!__rainy711.bonus.busy');await tick(2,True)
   check('Claims entered first without room selection',await js('__rainy711.bonus.route')=='claims');check('No room chooser',await page.locator('[data-action=classroom],[data-action=class-rooms]').count()==0);await shot('claims')
   await page.locator('[data-action=claims-next]').click();rounds=0
   for _ in range(80):
    route=await js('__rainy711.bonus.route')
    if route=='settlement-result':break
    phase=await js('__rainy711.bonus.negotiation.phase')
    if phase=='choice':
     await page.locator('[data-action=claims-select][data-value=B]').click();rounds+=1
     if rounds==1:
      await page.reload(wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('__rainy711.pauseForCapture()');await tick();check('Reload offers unfinished task',await page.locator('.bonus-entry').is_visible());await page.locator('.bonus-entry').click();await page.wait_for_function('!__rainy711.bonus.busy');check('Reload preserves selected claim',await js('__rainy711.bonus.negotiation.choices.cause')=='B');check('Reload resumes read step',await js('__rainy711.bonus.negotiation.phase')=='read')
    elif phase=='stamp':
     await tick(.41,True);check('Stamp contacts actual paper',abs(await js('__rainy711.bonus.room.stampContactError'))<.001);await tick(.9,True)
    else:await page.locator('[data-action=claims-next]').click()
   check('Five fields and happy settlement',rounds==5 and await js('__rainy711.bonus.route')=='settlement-result');check('Three stamps',await js('__rainy711.bonus.room.completedStamps')==3);await shot('settlement');await page.locator('[data-action=claims-next]').click();await page.wait_for_function('!__rainy711.bonus.busy');await tick(2,True)
   check('Classroom follows claims',await js('__rainy711.bonus.route')=='classroom');check('Eight topics advertised','八題' in await page.locator('.bonus-content').inner_text());await page.locator('[data-action=class-next]').click();await tick(1,True);await shot('classroom')
   completed=0
   for _ in range(100):
    state=await js('__rainy711.bonus')
    if state['route']=='class-result':break
    if state['route'] in ['class-wait','class-stamping']:await tick(1.3,True);continue
    if state['course']['completed'] and len(state['course']['completed'])>completed:
     completed=len(state['course']['completed']);check(f'Topic {completed} counts once',state['course']['percentage']==completed*12.5)
     if completed==4:check('Four topics do not graduate',state['route']=='lesson' and not state['course']['stamped'])
    await page.locator('[data-action=class-next]').click();await tick(.1)
   check('All eight required',len(await js('__rainy711.bonus.course.completed'))==8);check('Class stamped only after eight',await js('__rainy711.bonus.course.stamped'));await tick(1,True);await shot('certificate')
   await page.locator('[data-action=class-next]').click();await tick(3);await tick(3,True);check('True ending reaches rating',await js('__rainy711.bonus.route')=='rating');check('Submit waits for a star',await page.locator('[data-action=rate-submit]').is_disabled());await page.locator('[data-action=rate][data-value="4"]').click();await page.locator('[data-action=rate-submit]').click();check('Dry thank-you punchline','沒人會看' in await page.locator('.bonus-content').inner_text());await shot('rating');check('Local rating saved',await js("JSON.parse(localStorage.getItem('rainy711.epilogue.v3')).rating") ==4)
   await page.set_viewport_size({'width':1366,'height':768});await page.emulate_media(reduced_motion='reduce');await tick(1,True);check('Desktop panel fits',await page.locator('.bonus-panel').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.right<=innerWidth+1&&r.bottom<=innerHeight+1}'));await shot('desktop-ending');check('No browser exceptions',not errors)
  finally:
   (OUT/'epilogue-browser-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
