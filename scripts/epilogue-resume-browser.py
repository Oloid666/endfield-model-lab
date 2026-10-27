"""Reduced-motion desktop resume, final stamp, star selection and repeat-view checks."""
import asyncio,json,subprocess,base64
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('artifacts');checks=[];errors=[]
course=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {LESSONS,lessonCardCount} from './src/bonus-data.js';console.log(JSON.stringify(Object.fromEntries(LESSONS.slice(0,7).map(l=>[l.id,lessonCardCount(l.id)]))))"],text=True))
seed={'version':3,'stage':'class','route':'lesson','lessonIndex':7,'course':{'steps':course,'stamped':False},'negotiation':{'phase':'complete','field':4,'line':0,'round':1,'stampIndex':3,'choices':dict.fromkeys(['cause','handling','loss','evidence','amount'],'B')}}
def check(name,ok):checks.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':1366,'height':768},reduced_motion='reduce');page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(code):return await page.evaluate(code)
  async def tick(n=.1,r=False):await page.evaluate('([n,r])=>__rainy711.tick(__rainy711.time+n,.05,r)',[n,r])
  try:
   await page.add_init_script('localStorage.setItem("rainy711.epilogue.v3",'+json.dumps(json.dumps(seed,ensure_ascii=False))+')');await page.goto('http://127.0.0.1:4173/',wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('__rainy711.pauseForCapture()');await tick();await page.locator('.bonus-entry').click();await page.wait_for_function('!__rainy711.bonus.busy');await tick(.2,True)
   check('Resume goes to last unread topic',await js('__rainy711.bonus.lesson')=='lyrics');check('Seven unique topics retained',len(await js('__rainy711.bonus.course.completed'))==7)
   for _ in range(12):
    state=await js('__rainy711.bonus')
    if state['route']=='class-result':break
    await page.locator('[data-action=class-next]').click();await tick(.2,True)
   check('Reduced-motion graduation works',await js('__rainy711.bonus.course.stamped'));check('Reduced-motion stamp touches paper',abs(await js('__rainy711.bonus.room.stampContactError'))<.001)
   await page.locator('[data-action=class-next]').click();await tick(3);await tick(.1,True);check('Reduced-motion true ending reaches rating',await js('__rainy711.bonus.route')=='rating')
   for stars in range(1,6):
    await page.locator(f'[data-action=rate][data-value="{stars}"]').click();check(f'{stars} star selection accessible',await page.locator(f'[data-action=rate][data-value="{stars}"]').get_attribute('aria-pressed')=='true')
   await page.locator('[data-action=rate-submit]').click();await page.locator('[data-action=final-menu]').click();await page.locator('[data-action=review-class]').click();await page.wait_for_function('!__rainy711.bonus.busy');await tick(.2,True);check('Review retains all eight completed topics',len(await js('__rainy711.bonus.course.completed'))==8)
   for _ in range(8):
    if await js('__rainy711.bonus.route')=='class-result':break
    await page.locator('[data-action=class-next]').click()
   await page.locator('[data-action=class-next]').click();check('Review does not replay true ending',await js('__rainy711.bonus.route')=='rating-result')
   await page.locator('[data-action=final-menu]').click();await page.locator('[data-action=review-class]').click();await page.wait_for_function('!__rainy711.bonus.busy');await tick(.2,True)
   c=await page.context.new_cdp_session(page);r=await c.send('Page.captureScreenshot',{'format':'png'});(OUT/'epilogue-desktop-reduced-class.png').write_bytes(base64.b64decode(r['data']));await c.detach();check('No reduced-motion exceptions',not errors)
  finally:
   (OUT/'epilogue-resume-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
