"""Real scene + actual UI checks. Chromium/SwiftShader is not iPhone Safari QA."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('DINNER_OUT','/tmp/dinner-revision'));OUT.mkdir(exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':390,'height':844});errors=[];records=[];page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(code):return await page.evaluate(code)
  async def tick(s=.1):await page.evaluate('(s)=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,Math.min(.05,s/n),false)}',s)
  async def shot(name):
   await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(0);await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/(name+'.png')))
   r=await js('({phase:__rainy711.mission.phase,node:__rainy711.mission.nodeId,beat:__rainy711.cinematic.cameraBeat,tray:__rainy711.mission.trayOwner,helper:__rainy711.staging.remnant,appliance:__rainy711.microwave})');r['name']=name;records.append(r);print(name,r['phase'],r['node'],flush=True)
  async def background(name):
   await js('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))');await tick(2)
   assert await js('__rainy711.mission.paused'),name
   await js('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))')
   recovery=page.locator('.bonus-recovery[open]')
   if await recovery.count():await recovery.get_by_role('button',name='繼續這一幕',exact=True).click()
   else:await page.locator('.mission-resume-panel').click()
   assert await js('!__rainy711.pauseReasons.some(r=>["background","manual"].includes(r))'),name
   print('background recovered',name,flush=True)
  async def unlock():
   await js('__rainy711.frameView("street")');await tick(.1)
   for _ in range(7):
    q=await js('()=>{const q=__rainy711,p=q.projectPoint([0,3.1,2.23]),r=document.querySelector("#scene").getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}');await page.mouse.click(q['x'],q['y']);await tick(.1)
   assert await js('__rainy711.debug.unlocked')
  async def jump(name):assert await page.evaluate('(id)=>__rainy711.debugJump(id)',name);await tick(.2)
  async def talks():
   for _ in range(15):
    if not await js('__rainy711.mission.tablet?.dialogue'):break
    await js('__rainy711.tabletAction("talk-next")');await tick(.5)
  async def act(name):await tick(.5);assert await page.evaluate('(id)=>__rainy711.tabletAction(id)',name),name;await tick(.1)
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click();await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000)
   await js('__rainy711.pauseForCapture();const e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change"))')
   await shot('entry-art');await unlock();await jump('chapter:cargo');await js('__rainy711.toggleAutoCamera()')
   for view in ['left','right','heroFront']:
    await page.evaluate('(v)=>__rainy711.frameView(v)',view);await tick(.05);await shot('tray-'+view)
   await page.mouse.move(200,400);await page.mouse.down();await page.mouse.move(200,650,steps=20);await page.mouse.up();await tick(.1);await shot('tray-overhead');await js('__rainy711.resetCamera()');await jump('chapter:terminal-deploy')
   await shot('book-hand');await tick(2.6);await shot('book-open');await tick(2.4);await shot('book-login');await background('book')
   for _ in range(25):
    phase=await js('__rainy711.mission.phase')
    if phase=='login':break
    await js('__rainy711.missionNext()');await tick(.5)
   for chunk in ['endfield','_','power','520','1314']:assert await page.evaluate('(s)=>__rainy711.keyChunk(s)',chunk)
   for _ in range(20):
    phase=await js('__rainy711.mission.phase')
    if phase=='lever':break
    if phase=='captcha':await js('__rainy711.missionVerify()')
    else:await js('__rainy711.missionNext()')
    await tick(.5)
   assert await js('__rainy711.missionLever(1)');await tick(.8);await shot('tray-pass-touch');await background('tray-pass');await tick(1);await shot('tray-pass-helper');assert await js('__rainy711.mission.trayOwner')=='helper'
   await tick(6);assert await js('__rainy711.mission.helperPresent&&__rainy711.staging.remnant.visible');await tick(15);await js('__rainy711.missionNext()');await tick(4.5);await shot('charge-city');await tick(5);await shot('charge-hero');await tick(5);await shot('charge-pylon')
   await jump('fridge');await talks();await act('scan');await tick(1.7);await talks();await act('tool');await act('detect');await tick(1.4);await act('control');await tick(3.3);await act('apply');await tick(2.1);await shot('fridge-cold');await talks();await tick(3.7);await shot('fridge-hot');await background('fridge');await talks();await act('meal');await tick(3.3);await talks();await tick(.5);await act('scan-grid');await tick(1.4);await shot('grid-one');await tick(1.4);await shot('grid-two');await tick(1.4);await shot('grid-three');await tick(.8);await talks();await act('inspect-console');await shot('nikke-console');await background('nikke');await talks();await tick(.5);await talks();await tick(2);await act('enable');await tick(6.1);await talks();await act('800mw');await act('confirm');await act('start')
   for _ in range(20):
    if await js('__rainy711.mission.phase')=='heat':break
    await js('__rainy711.missionNext()');await tick(.5)
   await tick(6.1);assert await js('__rainy711.mission.phase')=='heat';await background('rhythm-ready')
   for rnd in range(3):
    assert await js('__rainy711.missionHeatStart(__rainy711.time)');notes=await js('__rainy711.mission.heat.notes')
    for i,n in enumerate(notes):
     elapsed=await js('__rainy711.mission.heat.elapsed');await tick(max(0,n['at']-elapsed));assert await js('__rainy711.missionHeatStart(__rainy711.time)')
     await tick(.02)
     if rnd==2 and i in [0,1,2]:await shot('round3-beat'+str(i+1))
    await tick(.7)
    if rnd<2:assert await js('__rainy711.mission.heat.completed')==rnd+1;await shot('round'+str(rnd+1))
   assert await js('__rainy711.mission.phase')=='meal-spawn';await shot('birth-start');await tick(1);await shot('birth-purple');assert await js('__rainy711.microwave.ingredientsVisible');await tick(2);await shot('birth-escape');assert not await js('__rainy711.microwave.ingredientsVisible');await tick(4.2);await shot('refusal-meme');assert await page.locator('.mission-text').inner_text()=='那個我不要了';await background('birth-refusal');await page.set_viewport_size({'width':844,'height':390});await tick(.1);await shot('refusal-landscape');await page.set_viewport_size({'width':1366,'height':768});await tick(.1);await shot('refusal-desktop');await page.set_viewport_size({'width':390,'height':844});await tick(.1)
   for _ in range(12):
    if await js('__rainy711.mission.phase')=='flashback-end':break
    await js('__rainy711.missionNext()');await tick(.5)
   assert await js('__rainy711.mission.phase')=='flashback-end';assert not await js('__rainy711.microwave.ingredientsVisible')
   await jump('chapter:last')
   for _ in range(20):
    if await js('__rainy711.mission.phase')=='aim-final':break
    await js('__rainy711.missionNext()');await tick(.5)
   assert await js('__rainy711.mission.trayOwner')=='helper'
   await page.wait_for_function('!__rainy711.mission.paused',timeout=120000);await tick(await js('Math.max(0,9+__rainy711.mission.meterPeriod/4-__rainy711.mission.phaseElapsed)'));assert await js('__rainy711.missionAttack(__rainy711.time)')
   assert await js('__rainy711.mission.phase')=='finisher'
   await tick(2.1);await shot('explosion-readable');assert await page.locator('.dragon-reaction-bubble').is_visible();assert await page.evaluate('()=>{const q=__rainy711,p=q.projectPoint(q.headPosition),r=document.querySelector("#scene").getBoundingClientRect(),b=document.querySelector(".dragon-reaction-bubble").getBoundingClientRect(),x=r.x+(p[0]+1)*r.width/2,y=r.y+(1-p[1])*r.height/2;return !(x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom)}');await tick(2.5);assert await page.locator('.dragon-reaction-bubble').is_visible();await shot('explosion-flight-caption');await tick(4.4+await js('__rainy711.mission.landingDuration')+.8);await shot('tray-reclaim-touch');assert await js('__rainy711.mission.phase')=='meal-reclaim';assert await js('__rainy711.mission.trayOwner')=='helper';await background('tray-reclaim')
   await tick(1);await shot('tray-reclaim-hero');assert await js('__rainy711.mission.trayOwner')=='hero'
   await tick(1);assert await js('__rainy711.mission.phase')=='tour'
   await tick(await js('__rainy711.mission.tourDuration-__rainy711.mission.phaseElapsed')+.001)
   assert await js('__rainy711.mission.phase')=='complete'
   previous=0
   for age,title in [(0,'Fin.'),(1.25,'Fin..'),(1.7,'Fin...'),(2.15,'Fin....'),(2.6,'Fin....?')]:
    await tick(age-previous);previous=age;assert await page.locator('.mission-caption').inner_text()==title;assert not await page.locator('.epilogue-prompt').is_visible();await shot('fin-'+str(age))
   await tick(1.5);assert await page.locator('.epilogue-prompt').is_visible()
   for _ in range(3):
    await tick(.5);await page.locator('.epilogue-prompt button').click()
   await tick(6);await shot('concert-wide');await tick(.35);await shot('concert-followthrough')
   # Finish the existing performance before debug travel.
   await tick(70)
   for where in ['claims','classroom','rating']:
    await jump(where);await background(where)
   # The bonus has its own recovery dialog; settings are tested after leaving it.
   # Global restart is exercised from the settings after leaving upstairs.
   await jump('street');await page.locator('#menu-toggle').click();await page.get_by_role('button',name='重新開始雨夜',exact=True).click();await tick(.2);assert await js('__rainy711.mission.phase')=='ready';assert not await js('__rainy711.debug.unlocked||__rainy711.staging.remnant.visible');await unlock();print('restart + physical seven taps passed',flush=True)
   assert not errors,errors
   (OUT/'results.json').write_text(json.dumps({'records':records,'errors':errors},ensure_ascii=False,indent=2))
  except Exception:
   await shot('FAILURE');raise
  finally:await b.close()
asyncio.run(main())
