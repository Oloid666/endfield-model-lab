"""Story, responsive input and reset regression against the built game."""
import asyncio,json,base64,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('CINEMATIC_TEST_OUT','/tmp/endfield-homecoming'));OUT.mkdir(parents=True,exist_ok=True);checks=[];errors=[]
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
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4181/endfield-model-lab/'),wait_until='domcontentloaded');await ready()
   await js("__rainy711.restoreChapter('last')");await finish();await tick(9);await js('()=>{const q=__rainy711;q.tick(q.time+q.mission.meterPeriod/4,.05,false);q.missionAttack(q.time)}');await tick(60);await tick(10,True);check('Fake Fin interrupted',await page.locator('.epilogue-prompt').is_visible());await shot('fake-fin')
   for _ in range(2):await page.locator('.epilogue-prompt button').click()
   check('Snap action after speech','看龍泡泡怎麼辦' in await page.locator('.epilogue-prompt button').inner_text());await page.locator('.epilogue-prompt button').click();check('First rebuild starts',await js('__rainy711.staging.show.active'))
   await js('()=>{const q=__rainy711;for(let i=0;i<23;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}');await shot('snap-star')
   await js('()=>{const q=__rainy711;for(let i=0;i<35;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}');check('Rebuilding keeps floating microphone',await js('__rainy711.staging.microphone'));await shot('rebuild-song')
   await js('()=>{const q=__rainy711;for(let i=0;i<220&&q.staging.show.active;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}');check('Rebuild completes before invitation',await js('__rainy711.staging.show.mode')=='intact' and not await js('__rainy711.staging.show.active'));check('Upstairs invitation follows song','跟上龍泡泡' in await page.locator('.epilogue-prompt button').inner_text());await page.locator('.epilogue-prompt button').click();await page.wait_for_function('__rainy711.bonus.active&&!__rainy711.bonus.busy');await tick(2,True);check('Claims introduction','料事如神' in await page.locator('.bonus-content').inner_text());await page.locator('[data-action=claims-next]').click()
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
   await page.locator('[data-action=close]').click();await tick(.1,True);check('Final returns to intact completed street',await js("__rainy711.mission.postgame&&__rainy711.staging.show.mode==='intact'"));await shot('home-start')
   await js('()=>{const q=__rainy711;for(let i=0;i<90;i++)q.tick(q.time+.1,.05,false)}');await tick(0,True);check('Creature crawls back',await js('__rainy711.staging.remnant.mode')=='crawling');await shot('home-crawling')
   await js('__rainy711.missionPause(true)');before=await js('__rainy711.staging.remnant.position');await tick(20,True);check('Pause freezes homecoming',before==await js('__rainy711.staging.remnant.position'));await js('__rainy711.missionPause(false)');await js('()=>{const q=__rainy711;for(let i=0;i<100;i++)q.tick(q.time+.1,.05,false)}');await tick(0,True);check('Creature arrives beside Zhuang',await js('__rainy711.staging.remnant.mode')=='idle');check('Arrival dialogue once',await js('__rainy711.mission.node?.event')=='meal-arrival');await tick(1.2,True);await shot('home-arrived');check('Walking unlocks after true ending',await page.locator('.walk-toggle').is_visible());
   for cycle in range(8):
    button=page.locator('.postgame-toggle');await button.click();check('Switch locks while singing',await button.is_disabled());await js('()=>{const q=__rainy711;for(let i=0;i<40;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}');lyrics=await js('__rainy711.staging.show.line');check('Switch song has music symbols',any(c in lyrics for c in '🎹🎸🥁🎺🎷'));await shot('switch-'+str(cycle));await js('()=>{const q=__rainy711;for(let i=0;i<500&&q.staging.show.active;i++)q.tick(q.time+.1,.05,false);q.tick(q.time,.016,true)}');check('Switch preserves postgame and releases Dragon',await js('__rainy711.mission.postgame&&!__rainy711.cinematic.dragonStuck'));check('Switch finishes desired structure',await js('__rainy711.staging.show.mode')==('collapsed' if cycle%2==0 else 'intact'))
   await tick(10);await js('__rainy711.missionReplay()');await tick(.1);check('Replay clears homecoming',not await js('__rainy711.mission.postgame||__rainy711.staging.remnant.born'))
   await page.reload(wait_until='domcontentloaded');await ready();check('Reload after final returns to beginning',await js('__rainy711.mission.phase')=='ready' and not await page.locator('.bonus-entry').is_visible());check('No runtime exceptions',not errors)
  finally:
   (OUT/'cinematic-ui-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
