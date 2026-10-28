import asyncio,json,base64
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('artifacts');checks=[];errors=[]
def check(n,v):checks.append({'name':n,'passed':bool(v)});print(n,v,flush=True);assert v,n
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':320,'height':568});page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(s):return await page.evaluate(s)
  async def tick(n=.1):await page.evaluate('n=>__rainy711.tick(__rainy711.time+n,.05,true)',n)
  async def shot(name):
   c=await page.context.new_cdp_session(page);r=await c.send('Page.captureScreenshot',{'format':'png'});(OUT/f'large-text-{name}.png').write_bytes(base64.b64decode(r['data']));await c.detach()
  try:
   await page.goto('http://127.0.0.1:4173/',wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=240000);await js('__rainy711.pauseForCapture()');await tick();await js('()=>{const n=document.querySelector("#quality");n.value="low";n.dispatchEvent(new Event("change",{bubbles:true}))}');await js('__rainy711.missionStart()');await tick(2);await page.locator('#menu-toggle').click();await page.get_by_role('button',name='字幕字級：18',exact=True).click();await page.get_by_role('button',name='字幕字級：22',exact=True).click();await page.locator('#menu-close').click();await tick();check('Subtitle reaches 26px',await page.locator('.mission-text').evaluate('(e)=>getComputedStyle(e).fontSize')=='26px')
   for w,h in [(320,568),(844,390),(1920,1080)]:
    await page.set_viewport_size({'width':w,'height':h});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(.1);check(f'Large subtitle panel bounded {w}x{h}',await page.locator('.mission-panel').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.x>=-1&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}'));await shot(str(w))
   await page.set_viewport_size({'width':320,'height':568});await js("__rainy711.restoreChapter('terminal-deploy')");await tick(6.1);check('Login controls available',await js('__rainy711.mission.phase')=='login');await page.locator('.mission-key[data-key=backspace]').scroll_into_view_if_needed();check('Last keyboard key can be scrolled into view',await page.locator('.mission-key[data-key=backspace]').evaluate('(e)=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight}'));await shot('keyboard');await page.locator('.mission-key[data-key=boss]').click();await page.locator('.mission-key[data-key=backspace]').click();check('Incorrect word can be removed',await js('__rainy711.mission.connection.value')=='');
   for key in ['endfield','_','power']:await page.locator(f'.mission-key[data-key="{key}"]').click()
   check('Touch account advances automatically',await js('__rainy711.mission.connection.field')=='password')
   for key in ['520','1314']:await page.locator(f'.mission-key[data-key="{key}"]').click()
   check('Touch password finishes login',await js('__rainy711.mission.phase')=='verify-talk');check('No exceptions',not errors)
  finally:
   (OUT/'large-text-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
