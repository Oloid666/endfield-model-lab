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
   await page.evaluate('(s)=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.1));for(let i=0;i<n;i++)q.tick(q.time+s/n,Math.min(.1,s/n),false)}',seconds)
  async def shot(name):
   await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(0);await page.evaluate('__rainy711.tick(__rainy711.time,0,true)')
   await page.screenshot(path=str(OUT/(name+'.png')))
  async def bounds(selector):
   return await page.locator(selector).evaluate('(e)=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1}')
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded')
   await page.wait_for_function('window.__rainy711?.actorsLoaded && document.querySelector("#loading").hidden',timeout=240000)
   await page.evaluate('__rainy711.pauseForCapture()')
   await page.locator('#quality').evaluate('(e)=>{e.value="low";e.dispatchEvent(new Event("change"))}')
   await page.evaluate('__rainy711.missionStart()')
   for _ in range(220):
    if await page.evaluate('__rainy711.mission.phase')=='photo-flight':break
    await tick(.3);await page.evaluate('__rainy711.missionNext()')
   await check('Photo positioning reached',await page.evaluate('__rainy711.mission.phase')=='photo-flight')
   await check('Photo primary is first focus control',await page.locator('.investigation-actions button').first.get_attribute('class')=='flight-ready')
   await check('Photo unavailable before positioning',await page.locator('.flight-ready').is_disabled());await shot('photo-disabled')
   z=await page.evaluate('__rainy711.mission.flight.z')
   back=page.get_by_role('button',name='後退',exact=True);r=await back.bounding_box();await page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);await page.mouse.down();await tick(.5);await page.mouse.up()
   await check('Held fine control stays still',await back.evaluate('(e)=>getComputedStyle(e).translate')=='none')
   await check('Actual hold moves dragon',await page.evaluate('__rainy711.mission.flight.z')>z)
   await page.evaluate('__rainy711.fly(0,1)')
   for _ in range(90):
    if await page.evaluate('__rainy711.mission.flight.z>=10.1'):break
    await tick(.1)
   await page.evaluate('__rainy711.fly(0,0)');await tick(0)
   await check('Waiting in correct zone does not suggest moving',await page.locator('.flight-step.suggested').count()==0)
   await tick(.7)
   await check('Ready state enables primary',not await page.locator('.flight-ready').is_disabled())
   await check('Ready badge follows state',await page.locator('.flight-position-status').inner_text()=='位置剛好')
   for w,h in [(320,568),(390,844),(844,390),(1366,768),(1920,1080)]:
    await page.set_viewport_size({'width':w,'height':h});await tick(.1);await shot('photo-ready-'+str(w))
    await check(f'Photo panel contained {w}',await bounds('.investigation-ui'))
    await check(f'Photo primary layout matches format {w}',await page.locator('.investigation-actions').evaluate('(e)=>{const [p,a,b]=[...e.children].map(n=>n.getBoundingClientRect());return innerHeight>600?p.bottom<=a.top&&Math.abs(a.top-b.top)<2:Math.abs(p.top-a.top)<2&&Math.abs(a.top-b.top)<2}'))
    for b in await page.locator('.investigation-actions button').all():
     await check(f'Photo control reachable {w}',await b.evaluate('(e)=>{const r=e.getBoundingClientRect(),p=e.closest(".investigation-ui").getBoundingClientRect();return r.left>=p.left&&r.right<=p.right+1&&r.top>=p.top&&r.bottom<=p.bottom+1}'))
   await page.set_viewport_size({'width':390,'height':844});await tick(.1)
   ready=page.locator('.flight-ready');await ready.hover();before=await ready.evaluate('(e)=>getComputedStyle(e).boxShadow');r=await ready.bounding_box();await page.mouse.move(r['x']+r['width']/2,r['y']+r['height']/2);await page.mouse.down()
   await page.wait_for_timeout(140)
   await check('Pressed primary gets inset feedback',await ready.evaluate('(e)=>getComputedStyle(e).boxShadow')!=before);await shot('photo-pressed');await page.mouse.up();await tick(.1)
   await page.locator('.photo-shutter').click();await tick(2.5)
   for _ in range(35):
    if await page.locator('.phone-gallery').is_visible():break
    await tick(.3);await page.evaluate('__rainy711.missionNext()')
   await check('Photo viewer retains three controls',await page.locator('.phone-gallery button').count()==3)
   await check('Send has primary role',await page.get_by_role('button',name='傳送給管理員',exact=True).get_attribute('data-ui')=='primary')
   await shot('photo-viewer')
   await page.get_by_role('button',name='放大看有沒有眨眼',exact=True).click();await check('Photo inspection changes actual image',await page.evaluate('__rainy711.photoViewer.index')==1)
   await page.get_by_role('button',name='傳送給管理員',exact=True).click();await tick(1.3)
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
   for destination in ['claims','classroom','rating']:
    await page.evaluate('(d)=>__rainy711.debugJump(d)',destination);await tick(1)
    await check('Bonus presentation roles '+destination,await page.locator('.bonus-ui button[data-ui]').count()>0)
    await shot('bonus-'+destination)
   await check('Rating stars keep rating role',await page.locator('.rating-stars button[data-ui=rating]').count()==5)
   await page.get_by_role('button',name='5 星',exact=True).click()
   await check('Actual rating is selected',await page.get_by_role('button',name='5 星',exact=True).get_attribute('aria-pressed')=='true')
   await check('Feedback action is primary',await page.locator('.feedback-actions button[data-ui=primary]').count()==1)
   await page.locator('.feedback-actions').scroll_into_view_if_needed();await shot('rating-enabled')
   await page.emulate_media(reduced_motion='reduce');await check('Reduced motion removes button transition',await page.locator('.feedback-actions [data-ui=primary]').evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s')
   await check('No page exceptions',not errors)
  finally:
   (OUT/'results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
