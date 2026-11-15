"""Real story controls and fixed-step evidence for the seven-item acting/UI pass."""
import argparse,asyncio,json,pathlib,subprocess
from playwright.async_api import async_playwright
p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--out',required=True);p.add_argument('--film',action='store_true');p.add_argument('--layouts',action='store_true');a=p.parse_args();out=pathlib.Path(a.out);out.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1);data={'errors':[],'frames':[],'iphone_tested':False,'share_image_requests':[]};page.on('request',lambda r:data['share_image_requests'].append(r.url) if 'og-rainy711' in r.url else None);page.on('pageerror',lambda e:data['errors'].append(str(e)))
  async def js(c,arg=None):return await page.evaluate(c,arg)
  async def tick(s):await js('s=>{let q=__rainy711,n=Math.max(1,Math.ceil(s*30));for(let i=0;i<n;i++)q.tick(q.time+s/n,s/n,false)}',s)
  async def shot(name):
   await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(out/(name+'.png')),timeout=90000);s=await js('({phase:__rainy711.mission.phase,age:__rainy711.mission.phaseElapsed,owner:__rainy711.mission.trayOwner,xaihi:__rainy711.xaihi,tablet:__rainy711.mission.tablet,actor:__rainy711.idle,staging:__rainy711.staging,camera:__rainy711.cameraPose,viewport:[innerWidth,innerHeight],sceneWidth:document.querySelector("#scene").clientWidth,overflow:document.documentElement.scrollWidth>innerWidth})');assert not s['overflow'];data['frames'].append({'name':name,**s});(out/'result.json').write_text(json.dumps(data,ensure_ascii=False,indent=2));print(name,flush=True)
  async def views(name):
   if not a.layouts:return
   for w,h in [(390,844),(844,390),(1440,900)]:
    await page.set_viewport_size({'width':w,'height':h});await js('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await js('__rainy711.resetCamera()');await shot(f'{name}-{w}x{h}')
   await page.set_viewport_size({'width':390,'height':844});await js('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  async def until(test,next=False):
   for _ in range(800):
    if await js(test):return
    await tick(.2)
    if next or await js('__rainy711.mission.phase==="intro"'):await js('__rainy711.missionNext()')
   raise AssertionError(test)
  async def jump(n):assert await js('n=>__rainy711.debugJump(n)',n);await tick(.05)
  async def talks():
   for _ in range(15):
    if not await js('!!__rainy711.mission.tablet?.dialogue'):return
    await tick(1.4);await js('__rainy711.tabletAction("talk-next")')
   raise AssertionError('talks')
  async def action(n):await tick(.5);assert await js('n=>__rainy711.tabletAction(n)',n),n
  async def clip(name,seconds):
   if not a.film:await tick(seconds);return
   d=out/name;d.mkdir(exist_ok=True)
   for i in range(round(seconds*8)):
    await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(d/f'{i:04d}.jpg'),type='jpeg',quality=82,timeout=90000);data.setdefault('clip_frames',[]).append(await js('({phase:__rainy711.mission.phase,age:__rainy711.mission.phaseElapsed,owner:__rainy711.mission.trayOwner,tray:__rainy711.idle.mealSupport,single:__rainy711.idle.singleCarry})'));await tick(.125)
   subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','8','-i',str(d/'%04d.jpg'),'-c:v','libx264','-pix_fmt','yuv420p',str(out/(name+'.mp4'))],check=True)
  try:
   await page.goto(a.url,wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click();await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000);await js('__rainy711.pauseForCapture();let e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change"));__rainy711.frameView("street")')
   await tick(.3);await js('__rainy711.tick(__rainy711.time,0,true)')
   for _ in range(7):
    xy=await js('()=>{let p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector("#scene").getBoundingClientRect();return [r.x+(p[0]+1)*r.width/2,r.y+(1-p[1])*r.height/2]}');await page.mouse.click(*xy);await tick(.1)
   assert await js('__rainy711.debug.unlocked'), await js('__rainy711.debug')
   await page.locator('.bonus-toast').evaluate('e=>e.getAnimations().forEach(a=>a.finish())');await page.wait_for_function('document.querySelector(".bonus-toast").hidden')
   await jump('fridge');await talks()
   for n,target,delay in [('scan','php',1.8),('tool','fridge',.4),('detect','controller',1.5),('control','temperature',3.4)]:await action(n);await tick(delay);await talks()
   await action('apply');await tick(2.65);await shot('01-satisfied');await tick(.23);await shot('01b-satisfied-eyes');await views('01b-satisfied-eyes');await talks();await until('__rainy711.mission.tablet.stage==="hot"');await tick(1);await action('talk-next');await clip('avert',1.5);await shot('02-avert');await views('02-avert');frozen=await js('__rainy711.xaihi.pose.head');await js('__rainy711.missionPause(true)');await tick(10);assert frozen==await js('__rainy711.xaihi.pose.head');await js('__rainy711.missionPause(false)');await action('talk-next');await tick(.7);await shot('03-quiet-song');await action('talk-next');await tick(1);await shot('04-redirect');await views('04-redirect')
   await jump('chapter:terminal-deploy');await tick(.85);await shot('05-book-hand');await views('05-book-hand');await tick(1.5);await shot('06-book-open');await tick(2.1);await shot('07-book-grid')
   if a.film:await jump('chapter:terminal-deploy');await clip('book',6)
   await until('__rainy711.mission.phase==="login"',True)
   for k in ['endfield','_','power','520','1314']:await js('k=>__rainy711.keyChunk(k)',k)
   await until('__rainy711.mission.phase==="captcha"&&__rainy711.mission.connection.captchaReady',True);await js('__rainy711.missionVerify()');await until('__rainy711.mission.phase==="lever"',True);await js('__rainy711.missionLever(1)');await until('__rainy711.mission.phase==="meal-handoff"');await clip('handoff',2.6)
   await jump('chapter:last')
   for _ in range(1500):
    if await js('__rainy711.mission.phase==="aim-final"&&__rainy711.mission.canAttack'):break
    if await js('__rainy711.mission.canAssist'):await js('__rainy711.assist()')
    elif await js('__rainy711.mission.canAttack'):await js('__rainy711.missionAttack()')
    else:await js('__rainy711.missionNext()')
    await tick(.25)
   await shot('08-grip');await views('08-grip');await js('__rainy711.missionAttack()');await until('__rainy711.mission.phase==="meal-reclaim"',True);await clip('reclaim',2.7);await until('__rainy711.mission.phase==="tour"',True);await tick(max(0,14.4-await js('__rainy711.mission.phaseElapsed')));await shot('09-song');await views('09-song');await clip('song',7)
   if a.layouts:
    await page.set_viewport_size({'width':1440,'height':900});await js('__rainy711.missionReplay();__rainy711.missionStart()');await until('__rainy711.mission.phase==="walk-out"&&__rainy711.mission.shopping.handoff');await tick(1.6);await shot('12-desktop-handoff');assert await js('document.querySelector("#scene").clientWidth===innerWidth')
    await tick(5);await shot('13-desktop-panel');assert await js('document.querySelector("#scene").clientWidth<innerWidth*.7')
   await js('__rainy711.missionReplay()');await tick(.1);assert await js('__rainy711.mission.phase==="ready"');assert not data['errors'] and not data['share_image_requests'];data['status']='passed'
  except Exception as e:data['status']='failed';data['failure']=str(e);raise
  finally:(out/'result.json').write_text(json.dumps(data,ensure_ascii=False,indent=2));await b.close()
asyncio.run(main())
