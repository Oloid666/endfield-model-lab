import asyncio,json,os
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
OUT=Path(__file__).resolve().parents[1]/'artifacts'
async def main():
 checks=[];errors=[]
 def check(n,v):checks.append({'name':n,'passed':bool(v)});print(n,v,flush=True);assert v,n
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def tick(secs):return await js('''n=>{let q=__rainy711,t=q.time;for(let i=1;i<=Math.ceil(n*30);i++)q.tick(t+i*n/Math.ceil(n*30),n/Math.ceil(n*30),i===Math.ceil(n*30));return q.mission}''',secs)
  async def nextline():await js('__rainy711.missionNext();__rainy711.missionNext()')
  async def finish_phase():
   start=await js('__rainy711.mission.phase')
   for _ in range(100):
    if await js('__rainy711.mission.phase')!=start:return
    await js('__rainy711.missionNext()')
   raise AssertionError('Unable to leave '+start)
  async def fast(seconds):return await js('n=>{const q=__rainy711;q.tick(q.time+n,0,false);return q.mission;}',seconds)

  async def goto(id):
   for _ in range(25):
    if await js('__rainy711.mission.nodeId')==id:return
    await nextline()
   raise AssertionError('line not reached '+id)
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=180000);await js('__rainy711.pauseForCapture();__rainy711.missionStart()');await tick(5)
   await goto('intro_3');await tick(.4);check('Opening establishes the two people',await js('__rainy711.cinematic.cameraBeat')=='dialogue-pair');await page.screenshot(path=str(OUT/'dialogue-establish.png'))
   await tick(.8);check('Zhuang gets a speaker shot',await js('__rainy711.cinematic.cameraBeat')=='dialogue-zhuang');await page.screenshot(path=str(OUT/'dialogue-zhuang.png'))
   await goto('intro_4');await tick(1.5);check('Dragon gets a speaker shot',await js('__rainy711.cinematic.cameraBeat')=='dialogue-dragon');await page.screenshot(path=str(OUT/'dialogue-dragon.png'))
   before=await js('__rainy711.cinematic.cameraFocus');await js('__rainy711.missionPause(true)');await tick(2);check('Pause freezes dialogue clock',await js('__rainy711.mission.nodeElapsed')<1.6);check('Pause preserves focal point',await js('__rainy711.cinematic.cameraFocus')==before);await js('__rainy711.missionPause(false)')
   await goto('intro_9');await tick(2.25);check('Store shelf insert appears early',await js('__rainy711.cinematic.cameraBeat')=='store-shelf-insert');await tick(.65);check('Store shelf insert appears',await js('__rainy711.cinematic.cameraBeat')=='store-shelf-insert');await page.screenshot(path=str(OUT/'dialogue-shelf.png'))
   await page.set_viewport_size({'width':844,'height':390});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(.5);await page.screenshot(path=str(OUT/'dialogue-landscape.png'));check('Landscape layout fits screen',await js('document.documentElement.scrollWidth===innerWidth'));await tick(1.8);check('Counter waits until Dragon has cleared the camera',await js('__rainy711.cinematic.cameraBeat')=='dragon-at-counter');check('Counter camera keeps a comfortable distance from Dragon',await js('Math.hypot(...__rainy711.camera.map((v,i)=>v-__rainy711.dragonPosition[i]))>2'));check('Counter has a clear physical sightline to Dragon',await js('()=>{const q=__rainy711,d=q.dragonPosition;return q.cameraOcclusion([d[0]+.25,d[1]+.35,d[2]-.05])===null}'));await page.screenshot(path=str(OUT/'dialogue-counter-landscape.png'));pixels=list(Image.open(OUT/'dialogue-counter-landscape.png').convert('RGB').crop((0,90,500,300)).getdata());check('Counter shot is not inside a character',sum(all(c>247 for c in pixel) for pixel in pixels)/len(pixels)<.45)
   await page.set_viewport_size({'width':390,'height':844});await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(.3);check('Dragon stays in the portrait counter frame',await js('()=>{const q=__rainy711,d=q.dragonPosition,p=q.projectPoint([d[0],d[1]+.35,d[2]]);return Math.abs(p[0])<.85&&Math.abs(p[1])<.85}'));await page.screenshot(path=str(OUT/'dialogue-counter-portrait.png'))
   await finish_phase();await fast(6);await fast(5.1);await fast(2.1);check('Purchase and exit lead to photo conversation',await js('__rainy711.mission.phase')=='photo-talk');await finish_phase();check('Photo flight waits for player',await js('__rainy711.mission.phase')=='photo-flight')
   await js('__rainy711.fly(0,1)');await tick(2.4);await js('__rainy711.fly(0,0)');check('Flight gate can be reached',await js('__rainy711.mission.flight.ready'));await js('__rainy711.finishFlight()');await tick(.2);await js('__rainy711.takePhoto()');await fast(2.6);await finish_phase();check('Photo review is reached',await js('__rainy711.mission.phase')=='photo-review');await js('__rainy711.sendPhoto()')
   await goto('cargo_1');await tick(1.5);check('Receipt line uses the two-person view',await js('__rainy711.cinematic.cameraBeat')=='dialogue-receipt');check('Receipt is visible for its reveal',await page.locator('.album-receipt').is_visible());await page.screenshot(path=str(OUT/'dialogue-cargo-receipt.png'))
   await goto('cargo_3');check('Receipt is visible for itemization',await page.locator('.album-receipt').is_visible());await goto('cargo_8');await tick(.8);check('Receipt clears for the character exchange',not await page.locator('.album-receipt').is_visible());check('Supplement punchline starts on Zhuang',await js('__rainy711.cinematic.cameraBeat')=='dialogue-zhuang');await tick(1);check('Supplement punchline reveals Dragon reaction',await js('__rainy711.cinematic.cameraBeat')=='dialogue-reaction');await page.screenshot(path=str(OUT/'dialogue-cargo-reaction.png'))
   if os.environ.get('CAMERA_SMOKE_ONLY')=='1':check('No page errors',not errors);return
   await finish_phase();await finish_phase();check('Call waits for player',await js('__rainy711.mission.phase')=='comm-request');await js('__rainy711.acceptCall()');await goto('briefing_2');await tick(.5);check('Briefing first shows the books',await js('__rainy711.cinematic.cameraBeat')=='server-fanbooks');await tick(1);check('Briefing then shows Zhuang',await js('__rainy711.cinematic.cameraBeat')=='briefing-zhuang');await page.screenshot(path=str(OUT/'dialogue-briefing.png'))
   await finish_phase();await fast(5);check('Terminal reaches login',await js('__rainy711.mission.phase')=='login');await js("()=>{const q=__rainy711;for(const c of 'endfield_power')q.missionKey(c);q.missionSubmit();for(const c of '5201314')q.missionKey(c);q.missionSubmit()}");check('Login reaches verification',await js('__rainy711.mission.phase')=='verify-talk');await finish_phase();await js('__rainy711.missionVerify()');await finish_phase();await js('__rainy711.missionLever(1)');await fast(60);check('Charge pauses at shoes',await js('__rainy711.mission.phase')=='shoe-view');await js('__rainy711.missionNext()');await fast(40);check('Charge waits for firing confirmation',await js('__rainy711.mission.phase')=='fire-ready');await js('__rainy711.missionNext()')
   for _ in range(20):
    state=await js('__rainy711.mission')
    if state['phase']!='combat':break
    await fast(max(1,state['combatHoldRemaining']+.05));state=await js('__rainy711.mission');period=state['meterPeriod'];await fast((period*.25-state['meterElapsed'])%period);await js('__rainy711.missionAttack(__rainy711.time)')
   check('Combat reaches the energy dialogue',await js('__rainy711.mission.phase')=='energy');await finish_phase();await page.wait_for_function('__rainy711.xaihi.loaded || __rainy711.xaihi.error',timeout=180000);check('Earlier scene assets load',await js('__rainy711.xaihi.loaded'));await js('__rainy711.missionPause(false)');await fast(10.2);check('Rewind reaches flashback',await js('__rainy711.mission.phase')=='flashback');await finish_phase();check('Flashback reaches wiring puzzle',await js('__rainy711.mission.phase')=='hack')
   await js("()=>{const q=__rainy711;[1,0,2,3].forEach((v,i)=>{while(q.mission.hack.turns[i]!==v)q.hackRotate(i)})}");await page.get_by_role('button',name='測試連線',exact=True).click();check('Wiring puzzle reaches credentials',await js('__rainy711.mission.phase')=='credentials');await finish_phase();check('Credentials lead to heat game',await js('__rainy711.mission.phase')=='heat');await js('__rainy711.missionHeatStart()');await fast(3);check('First surge can be retried',await js('__rainy711.mission.heat.status')=='burnt');await js('__rainy711.missionHeatRetry()')
   for _ in range(3):
    await js('__rainy711.missionHeatStart()');state=await js('__rainy711.mission');origin=await js('__rainy711.time')
    for note in state['heat']['notes']:
     await js('(t)=>__rainy711.missionHeatStart(t)',origin+note['at'])
     if note['type']=='hold':await js('(t)=>__rainy711.missionHeatStop(t)',origin+note['end'])
    await fast(state['heat']['notes'][-1]['end']+1)
   check('Heat game reaches the return',await js('__rainy711.mission.phase')=='flashback-end');await finish_phase();await fast(3.1);check('Return reaches final bullet dialogue',await js('__rainy711.mission.phase')=='last')
   await goto('last_4');await tick(1.5);check('Level 6 looks at Zhuang',await js('__rainy711.cinematic.cameraBeat')=='caster-dialogue-face');await page.screenshot(path=str(OUT/'dialogue-last-zhuang.png'));await goto('last_5');await tick(.8);check('Cross-show objection looks at Dragon',await js('__rainy711.cinematic.cameraBeat')=='dragon-ammo-reaction');await goto('last_7');await tick(.8);check('Last bullet answer starts on Zhuang',await js('__rainy711.cinematic.cameraBeat')=='caster-dialogue-face');await tick(1);check('Last bullet answer reveals Dragon reaction',await js('__rainy711.cinematic.cameraBeat')=='dragon-ammo-reaction');await page.screenshot(path=str(OUT/'dialogue-last-reaction.png'));check('No page errors',not errors)
  finally:
   (OUT/('dialogue-smoke-results.json' if os.environ.get('CAMERA_SMOKE_ONLY')=='1' else 'dialogue-camera-results.json')).write_text(json.dumps({'checks':checks,'errors':errors,'real_iphone_test':False},ensure_ascii=False,indent=2));await browser.close()
 print(json.dumps(checks,ensure_ascii=False))
asyncio.run(main())
