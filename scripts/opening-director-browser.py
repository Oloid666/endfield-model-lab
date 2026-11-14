"""Continuous fixed-step runtime capture plus layout, facing and reset checks; not an iPhone FPS recording."""
import asyncio,argparse,pathlib,json,subprocess,time
from playwright.async_api import async_playwright
pa=argparse.ArgumentParser();pa.add_argument('--url',required=True);pa.add_argument('--out',required=True);pa.add_argument('--after',action='store_true');pa.add_argument('--fps',type=int,default=12);pa.add_argument('--layouts',action='store_true');pa.add_argument('--skip-films',action='store_true');a=pa.parse_args();out=pathlib.Path(a.out).resolve();out.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));frames=[]
  async def js(s,arg=None):return await page.evaluate(s,arg)
  async def tick(s):await js('s=>{const q=__rainy711,n=Math.max(1,Math.ceil(s*30));for(let i=0;i<n;i++)q.tick(q.time+s/n,s/n,false)}',s)
  async def until(test,n=700,next=True):
   for i in range(n):
    if await js(test):return
    if await js('__rainy711.mission.paused'):await page.wait_for_function('!__rainy711.mission.paused',timeout=180000)
    await tick(.1 if 'shopping' in test or 'ascent' in test else .3)
    if next or await js('__rainy711.mission.phase==="intro"'):await js('__rainy711.missionNext()')
   raise AssertionError(test)
  async def capture_clip(name,done,maximum):
   folder=out/name;folder.mkdir(exist_ok=True);print('record',name,flush=True)
   for i in range(round(maximum*a.fps)):
    await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(folder/f'{i:04d}.jpg'),type='jpeg',quality=82,timeout=90000)
    s=await js('({phase:__rainy711.mission.phase,age:__rainy711.mission.phaseElapsed,shopping:__rainy711.mission.shopping,owner:__rainy711.mission.trayOwner,hero:__rainy711.heroPosition,dragon:__rainy711.dragonPosition,head:__rainy711.headPosition,camera:__rainy711.cameraPose,cinematic:__rainy711.cinematic,action:__rainy711.idle,viewport:[innerWidth,innerHeight]})');frames.append({'clip':name,'frame':i,**s})
    if i>a.fps and await js(done):break
    await tick(1/a.fps)
   subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate',str(a.fps),'-i',str(folder/'%04d.jpg'),'-c:v','libx264','-pix_fmt','yuv420p',str(out/(name+'.mp4'))],check=True)
   (out/'frames.json').write_text(json.dumps(frames,ensure_ascii=False,indent=2));print('finished',name,i+1,flush=True)
  try:
   await page.goto(a.url,wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click();await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000);await js('__rainy711.pauseForCapture();const e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change"));__rainy711.missionStart()')
   if not a.skip_films:
    await until('__rainy711.mission.phase==="walk-out"&&__rainy711.mission.shopping.segment===2&&__rainy711.mission.shopping.handoffElapsed===0&&__rainy711.mission.shopping.position[0]<-.6',next=False)
    await capture_clip('opening','__rainy711.mission.phase==="photo-pose"&&__rainy711.mission.phaseElapsed>1.05',8)
    await js('__rainy711.restoreChapter("terminal-deploy")');await until('__rainy711.mission.phase==="login"')
    for k in ['endfield','_','power','520','1314']:await js('k=>__rainy711.keyChunk(k)',k)
    await until('__rainy711.mission.phase==="captcha"&&__rainy711.mission.connection.captchaReady');await js('__rainy711.missionVerify()');await until('__rainy711.mission.phase==="lever"');await js('__rainy711.missionLever(1)');await until('__rainy711.mission.phase==="ascent"&&__rainy711.mission.phaseElapsed>=4.8',next=False)
    await capture_clip('director','__rainy711.mission.phase==="shoe-view"&&__rainy711.mission.phaseElapsed>.8',11)
   if a.layouts:
    async def snap(name):
     await js('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(out/(name+'.png')),timeout=90000)
    for w,h in [(390,844),(844,390),(1440,900)]:
     await page.set_viewport_size({'width':w,'height':h});await js('__rainy711.missionReplay();__rainy711.missionStart()')
     await until('__rainy711.mission.phase==="walk-out"&&__rainy711.mission.shopping.handoff&&__rainy711.mission.shopping.handoffElapsed>=1.6',next=False)
     assert await js('__rainy711.mission.trayOwner')=='dragon';await snap(f'layout-opening-{w}x{h}')
     held=await js('({tray:[...__rainy711.idle.mealSupport],age:__rainy711.mission.shopping.handoffElapsed})');await js('__rainy711.missionPause(true)');await tick(20);frozen=await js('({tray:[...__rainy711.idle.mealSupport],age:__rainy711.mission.shopping.handoffElapsed})');assert frozen['age']==held['age'] and sum((x-y)**2 for x,y in zip(held['tray'],frozen['tray']))<1e-10
     await js('__rainy711.missionPause(false)');await tick(.4);assert await js('__rainy711.mission.trayOwner')=='hero';await snap(f'layout-owned-{w}x{h}')
     await js('__rainy711.restoreChapter("terminal-deploy")');await until('__rainy711.mission.phase==="login"')
     for k in ['endfield','_','power','520','1314']:await js('k=>__rainy711.keyChunk(k)',k)
     await until('__rainy711.mission.phase==="captcha"&&__rainy711.mission.connection.captchaReady');await js('__rainy711.missionVerify()');await until('__rainy711.mission.phase==="lever"');await js('__rainy711.missionLever(1)')
     await until('__rainy711.mission.phase==="director-reminder"&&__rainy711.mission.phaseElapsed>=1.2',next=False);await snap(f'layout-director-face-{w}x{h}')
     facing=await js('()=>{const q=__rainy711,d=q.dragonPosition,c=q.cameraPose.position,y=q.idle.dragonHeading,x=c[0]-d[0],z=c[2]-d[2];return (Math.sin(y)*x+Math.cos(y)*z)/Math.hypot(x,z)}');assert facing>.6,facing
     await tick(4.95-await js('__rainy711.mission.phaseElapsed'));await snap(f'layout-camera-{w}x{h}');assert await js('__rainy711.cinematic.filmCamera.visible&&__rainy711.cinematic.filmCamera.recording')
     await tick(.75);await snap(f'layout-director-thanks-{w}x{h}');assert await js('__rainy711.idle.companionExpression')=='happy'
     await tick(7.49-await js('__rainy711.mission.phaseElapsed'));before=await js('({dragon:__rainy711.dragonPosition,tray:[...__rainy711.idle.mealSupport]})');await tick(.05);after=await js('({dragon:__rainy711.dragonPosition,tray:[...__rainy711.idle.mealSupport]})');assert sum((x-y)**2 for x,y in zip(before['dragon'],after['dragon']))<.01 and sum((x-y)**2 for x,y in zip(before['tray'],after['tray']))<.01;await snap(f'layout-shoe-entry-{w}x{h}')
     await js('__rainy711.missionReplay()');await tick(.1);assert await js('!__rainy711.cinematic.filmCamera.visible&&__rainy711.mission.phase==="ready"&&__rainy711.mission.trayOwner==="hero"')
   assert not errors,errors;(out/'result.json').write_text(json.dumps({'status':'passed','errors':errors,'capture':'fixed-step actual runtime, all presented frames at12fps; no audio, not a hardware FPS measurement','iphone_tested':False,'layouts_tested':a.layouts},ensure_ascii=False,indent=2))
  except Exception as e:
   (out/'result.json').write_text(json.dumps({'status':'failed','error':str(e),'errors':errors},ensure_ascii=False,indent=2));await page.screenshot(path=str(out/'failure.png'),timeout=90000);raise
  finally:await b.close()
asyncio.run(main())
