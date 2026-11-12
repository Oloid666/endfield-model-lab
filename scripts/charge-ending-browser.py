"""Real-input regression and story-frame evidence. Chromium software rendering, not iPhone performance QA."""
import asyncio,json,pathlib,argparse,shutil
from playwright.async_api import async_playwright
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--url',default='http://127.0.0.1:4215/');parser.add_argument('--out',required=True);parser.add_argument('--browser',default=shutil.which('chromium'));args=parser.parse_args()
OUT=pathlib.Path(args.out).resolve();OUT.mkdir(exist_ok=True,parents=True)
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=args.browser,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
  frames=[];checks=[];errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  async def js(s,arg=None):return await page.evaluate(s,arg)
  async def tick(t):await js('s=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,s/n,false)}',t)
  async def until(test,limit=400,advance=True):
   for i in range(limit):
    if i%40==0:print('waiting',test,await js('({phase:__rainy711.mission.phase,age:__rainy711.mission.phaseElapsed,paused:__rainy711.mission.paused})'),flush=True)
    if await js(test):return
    if await js('__rainy711.mission.paused'):await page.wait_for_function('!__rainy711.mission.paused',timeout=120000)
    await tick(.35)
    if advance:await js('__rainy711.missionNext()')
   raise AssertionError(test)
  async def shot(name):
   await js('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
   await js('__rainy711.tick(__rainy711.time,0,true)')
   await page.screenshot(path=str(OUT/(name+'.png')),timeout=90000)
   frame=await js('({phase:__rainy711.mission.phase,age:__rainy711.mission.phaseElapsed,camera:__rainy711.cameraPose,charge:__rainy711.mission.shotCharge,staging:__rainy711.staging})');frames.append({'file':name+'.png',**frame})
   rectangles=await js("[...document.querySelectorAll('.mission-combat:not([hidden]),.mission-combat:not([hidden]) .mission-attack,.dinner-ending-card:not([hidden])')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,w:innerWidth,h:innerHeight}})");assert all(r['left']>=0 and r['top']>=0 and r['right']<=r['w']+.1 and r['bottom']<=r['h']+.1 for r in rectangles),rectangles
   print('shot',name,await js('({phase:__rainy711.mission.phase,age:__rainy711.mission.phaseElapsed,beat:__rainy711.cameraPose.beat})'),flush=True)
  try:
   await page.goto(args.url,wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click()
   await page.wait_for_function("window.__rainy711?.actorsLoaded&&document.querySelector('#loading').hidden",timeout=240000)
   await js("()=>{const q=document.querySelector('#quality');q.value='balanced';q.dispatchEvent(new Event('change'));__rainy711.pauseForCapture();__rainy711.frameView('street')}")
   await tick(.2)
   for _ in range(7):
    x,y=await js("()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector('#scene').getBoundingClientRect();return [r.x+(p[0]+1)*r.width/2,r.y+(1-p[1])*r.height/2]}");await page.mouse.click(x,y);await tick(.1)
   await page.locator('.bonus-toast').evaluate('(e)=>e.getAnimations().forEach(a=>a.finish())');await page.wait_for_function("document.querySelector('.bonus-toast').hidden")
   print('loaded and unlocked',flush=True)
   assert await js("__rainy711.debugJump('chapter:terminal-deploy')")
   await until("__rainy711.mission.phase==='login'")
   for key in ['endfield','_','power']:await page.locator('[data-key="'+key+'"]').click()
   for key in ['520','1314']:await page.locator('[data-key="'+key+'"]').click()
   await until("__rainy711.mission.phase==='captcha'&&__rainy711.mission.connection.captchaReady")
   await page.locator('.mission-captcha-check').click();await until("__rainy711.mission.phase==='lever'")
   await page.locator('.mission-lever-thumb').focus();await page.keyboard.press('End')
   await until("__rainy711.mission.phase==='combat'",limit=500)
   await shot('01-charge-idle')
   attack=page.locator('.mission-attack');r=await attack.bounding_box();x,y=r['x']+r['width']/2,r['y']+r['height']/2
   await page.mouse.move(x,y);await page.mouse.down();await tick(1.3);assert await attack.is_enabled();assert await js('__rainy711.mission.shotCharge.status')=='gold';await shot('02-charge-gold');await page.mouse.up()
   assert await js('__rainy711.mission.feedback.damage')==22
   await tick(3);await page.mouse.move(x,y);await page.mouse.down();await tick(1.7);await shot('03-charge-warning');await tick(.21);assert await js('__rainy711.mission.shotCharge.status')=='cooling';await shot('04-charge-cooling');shots=await js('__rainy711.mission.shots');await page.mouse.up();assert await js('__rainy711.mission.shots')==shots
   await tick(.7)
   # Move away to cancel, then release: never fires.
   await page.mouse.move(x,y);await page.mouse.down();await tick(.6);await page.mouse.move(5,400);await page.mouse.up();assert await js('__rainy711.mission.shots')==shots
   # Pause/blur: release cannot resurrect cancelled charge.
   await page.mouse.move(x,y);await page.mouse.down();await tick(.4);await js('window.dispatchEvent(new Event("blur"))');await page.mouse.up();assert await js('__rainy711.mission.shots')==shots
   # Keyboard is real hold/release; synthetic click from key activation must not double-fire.
   await attack.focus();await page.keyboard.down('Space');await tick(.8);await page.keyboard.up('Space');assert await js('__rainy711.mission.shots')==shots+1
   await tick(.7)
   shots=await js('__rainy711.mission.shots')
   for kind in ['pointercancel','lostpointercapture','pause']:
    await page.mouse.move(x,y);await page.mouse.down();await tick(.5)
    if kind=='pointercancel':await attack.dispatch_event('pointercancel',{'pointerId':1,'isPrimary':True})
    elif kind=='lostpointercapture':await attack.evaluate('(e)=>{if(e.hasPointerCapture(1))e.releasePointerCapture(1)}')
    else:await js('__rainy711.missionPause(true)')
    await page.mouse.up()
    if kind=='pause':await js('__rainy711.missionPause(false)')
    assert await js('__rainy711.mission.shots')==shots,kind
   await attack.focus();await page.keyboard.down('Enter');await tick(.6);await page.keyboard.up('Enter');assert await js('__rainy711.mission.shots')==shots+1
   await tick(.7);checks.extend(['real pointer full charge causes22 damage','overheat then release never fires','drag-out and blur cancel','pointercancel/lostcapture/pause cancel','Space and Enter release fire exactly once'])
   # Check all panel rectangles and repeat layouts with real world camera.
   for w,h in [(844,390),(1440,900),(390,844)]:
    await page.set_viewport_size({'width':w,'height':h});await tick(.1);await shot(f'05-charge-{w}x{h}')
   assert await js("__rainy711.debugJump('chapter:last')")
   await until("__rainy711.mission.phase==='aim-final'&&__rainy711.mission.canAttack")
   samples=[]
   for _ in range(20):
    await tick(.019);samples.append(await page.locator('.mission-pointer').evaluate('(e)=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return (a.left-b.left)/b.width}'))
   assert min(samples)>=.04 and max(samples)<=.12,samples;checks.append('actual final pointer stays in left5–11%; click bypasses timing')
   await shot('06-final-left')
   await page.locator('.mission-attack').click();assert await js("__rainy711.mission.phase==='finisher'")
   await until("__rainy711.mission.phase==='landing'",advance=False)
   await shot('07-landing-settle');await tick(max(0,2.81-await js('__rainy711.mission.phaseElapsed')));await shot('08-landing-face')
   await until("__rainy711.mission.phase==='tour'",advance=False)
   await tick(max(0,30.05-await js('__rainy711.mission.phaseElapsed')));await shot('09-dinner-thanks');await tick(2.7);await shot('10-dinner-title');await tick(1.24);before=await js('__rainy711.cameraPose');await tick(.08);after=await js('__rainy711.cameraPose');assert sum((a-b)**2 for a,b in zip(before['position'],after['position']))**.5<.05;checks.append('real tour→Fin camera remains continuous');await shot('11-fin');await tick(2.6);await shot('12-fin-question')
   await tick(1.5);await shot('13-after-ending')
   assert await page.locator('.epilogue-prompt').count()==0 or await js("__rainy711.mission.phaseElapsed>=4.05")
   for w,h in [(844,390),(1440,900)]:
    await page.set_viewport_size({'width':w,'height':h});assert await js("__rainy711.debugJump('chapter:last')")
    await until("__rainy711.mission.phase==='aim-final'&&__rainy711.mission.canAttack")
    await shot(f'14-final-{w}x{h}');await page.locator('.mission-attack').click()
    await until("__rainy711.mission.phase==='landing'",advance=False);await tick(max(0,3.3-await js('__rainy711.mission.phaseElapsed')));await shot(f'15-face-{w}x{h}')
    await until("__rainy711.mission.phase==='tour'",advance=False);await tick(max(0,32.8-await js('__rainy711.mission.phaseElapsed')));await shot(f'16-title-{w}x{h}');await tick(1.3);await shot(f'17-fin-{w}x{h}')
   checks.append('portrait, landscape and desktop combat/final/landing/title rectangles fit viewport')
   await js('__rainy711.missionReplay()');await tick(.1);assert await js("__rainy711.mission.phase==='ready'&&!__rainy711.debug.unlocked&&!__rainy711.mission.shotCharge.active")
   checks.append('restart resets ready, unlock and held input');assert not errors,errors
   (OUT/'browser.json').write_text(json.dumps({'status':'passed','errors':errors,'iphone_tested':False,'frames':frames,'checks':checks},ensure_ascii=False,indent=2))
  except Exception as e:
   (OUT/'browser.json').write_text(json.dumps({'status':'failed','error':str(e),'pageerrors':errors,'frames':frames},ensure_ascii=False,indent=2));await page.screenshot(path=str(OUT/'failure.png'),timeout=90000);raise
  finally:await browser.close()
asyncio.run(main())
