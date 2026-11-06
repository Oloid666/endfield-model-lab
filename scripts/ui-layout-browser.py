"""Real mainline UI layout/input checks. Chromium emulation is not Safari QA."""
import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('UI_TEST_OUT','/tmp/rain-ui-check'));OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':390,'height':844});errors=[];checks=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  async def check(name,value):
   checks.append({'name':name,'passed':bool(value)});print(name,value,flush=True);assert value,name
  async def tick(seconds=.1):
   await page.evaluate('(s)=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.1));for(let i=0;i<n;i++)q.tick(q.time+s/n,Math.min(.1,s/n),i===n-1)}',seconds)
  async def shot(name):
   await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(0)
   await page.screenshot(path=str(OUT/(name+'.png')))
  async def bounds(selector):
   return await page.locator(selector).evaluate('(e)=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}')
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded')
   await page.wait_for_function('window.__rainy711?.actorsLoaded && document.querySelector("#loading").hidden',timeout=240000)
   await page.evaluate('__rainy711.pauseForCapture()')
   await page.locator('#quality').evaluate('(e)=>{e.value="low";e.dispatchEvent(new Event("change"))}')
   await page.evaluate('__rainy711.restoreChapter("cargo")')
   for _ in range(70):
    if await page.evaluate('__rainy711.mission.phase')=='briefing':break
    await tick(.5)
    await page.evaluate('()=>{const q=__rainy711;if(q.mission.phase==="comm-request")q.acceptCall();else q.missionNext()}')
   await check('Reached real communication',await page.evaluate('__rainy711.mission.phase')=='briefing')
   print('PORTRAIT_STYLE',await page.locator('.mission-comm-portrait').evaluate('(e)=>({w:getComputedStyle(e).width,h:getComputedStyle(e).height,style:e.getAttribute("style"),app:document.querySelector("#app").className})'),flush=True)
   for w,h in [(320,568),(390,844),(844,390),(1366,768),(1920,1080)]:
    await page.set_viewport_size({'width':w,'height':h});await tick(.1)
    await check(f'Dialogue inside {w}',await bounds('.mission-panel'))
    await check(f'No horizontal overflow {w}',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
    if w==844:await check('Landscape communication <= 36vh',await page.locator('.mission-panel').evaluate('(e)=>e.getBoundingClientRect().height<=innerHeight*.36+1'))
    await shot('communication-'+str(w))
    await page.locator('#menu-toggle').click()
    await check(f'Settings inside {w}',await bounds('#settings'))
    await check(f'Scene inert {w}',await page.locator('#scene').evaluate('(e)=>e.inert'))
    await page.locator('#menu-close').focus()
    for _ in range(20):
     await page.keyboard.press('Tab')
     await check(f'Settings focus stays inside {w}',await page.evaluate('!!document.activeElement.closest("#settings")'))
    rain=await page.locator('#rain').is_checked();await page.locator('label[for=rain]').click()
    await check(f'Real setting changes {w}',await page.locator('#rain').is_checked()!=rain)
    await shot('settings-'+str(w));await page.keyboard.press('Escape')
    await check(f'Settings restore control {w}',not await page.locator('#scene').evaluate('(e)=>e.inert') and not await page.evaluate('__rainy711.mission.paused'))
    await page.locator('#menu-toggle').click();await page.get_by_role('button',name='字幕字級：18',exact=True).click();await page.get_by_role('button',name='字幕字級：22',exact=True).click();await page.keyboard.press('Escape');await tick(0)
    await check(f'26px subtitles honored {w}',await page.locator('.mission-text').evaluate('(e)=>getComputedStyle(e).fontSize')=='26px')
    await check(f'Large subtitles contained {w}',await bounds('.mission-panel'));await shot('large-text-'+str(w))
    await page.locator('#menu-toggle').click();await page.get_by_role('button',name='字幕字級：26',exact=True).click();await page.keyboard.press('Escape')
   await page.set_viewport_size({'width':390,'height':844});await page.evaluate('__rainy711.missionPause(true)');await tick(0)
   await page.locator('.mission-resume-panel').click();await check('Resume in dialogue location works',not await page.evaluate('__rainy711.mission.paused'))
   await page.evaluate('__rainy711.missionReplay();__rainy711.frameView("street")');await tick(.1)
   # Restart opens intro; return to idle before the physical sign shortcut.
   await page.reload();await page.wait_for_function('window.__rainy711?.actorsLoaded && document.querySelector("#loading").hidden',timeout=240000);await page.evaluate('__rainy711.pauseForCapture();__rainy711.frameView("street")');await tick(.1)
   for _ in range(7):
    q=await page.evaluate('()=>{const q=__rainy711,p=q.projectPoint([0,3.1,2.23]);return {x:(p[0]+1)*innerWidth/2,y:(1-p[1])*innerHeight/2}}');await page.mouse.click(q['x'],q['y']);await tick(.1)
   await check('Sign unlock preserved',await page.evaluate('__rainy711.debug.unlocked'))
   await page.evaluate('__rainy711.debugJump("fridge")');await tick(2)
   for _ in range(12):
    if await page.evaluate('!!__rainy711.mission.tablet'):break
    await page.evaluate('__rainy711.missionNext()');await tick(1)
   await check('Reached real tablet',await page.evaluate('!!__rainy711.mission.tablet'))
   for _ in range(8):
    if not await page.evaluate('__rainy711.mission.tablet.dialogue'):break
    await page.evaluate('__rainy711.tabletAction("talk-next")');await tick(1)
   await page.locator('[data-tablet-action=scan]').click();await tick(2)
   for _ in range(5):
    if not await page.evaluate('__rainy711.mission.tablet.dialogue'):break
    await page.evaluate('__rainy711.tabletAction("talk-next")');await tick(1)
   for w,h in [(390,844),(844,390),(1366,768)]:
    await page.set_viewport_size({'width':w,'height':h});await tick(.1)
    await check(f'Tablet controls inside {w}',await bounds('.tablet-access'))
    await page.locator('.tablet-details summary').click();await check(f'Real technical details visible {w}',await page.locator('.tablet-details p').is_visible());await shot('tablet-'+str(w));await page.locator('.tablet-details summary').click()
   await page.locator('[data-tablet-action=tool]').click();await tick(1);await check('Tablet button advances actual story',await page.evaluate('__rainy711.mission.tablet.stage')=='fridge')
   await page.evaluate('__rainy711.restoreChapter("last")');await tick(.1)
   await check('Timed story subtitles retain full opacity',await page.locator('.mission-line').evaluate('(e)=>{const d=e.disabled;e.disabled=true;const o=getComputedStyle(e).opacity;e.disabled=d;return o}')=='1')
   await check('No page exceptions',not errors)
  finally:
   (OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
