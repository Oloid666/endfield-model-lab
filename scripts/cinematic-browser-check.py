"""Three scoped cinematic sequences in the real scene; Chromium is not an iPhone FPS test."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion=os.environ.get('MOTION','no-preference'))
  result_path=Path('/tmp/cinematic-browser-results'+('-'+os.environ['QA_LABEL'] if os.environ.get('QA_LABEL') else '')+('-font'+os.environ['FONT_SIZE'] if os.environ.get('FONT_SIZE') else '')+'.json')
  errors=[];samples=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded')
  await page.wait_for_function('!!window.__rainy711',timeout=180000)
  await page.evaluate('__rainy711.pauseForCapture()')
  if os.environ.get('FONT_SIZE'):await page.evaluate('(v)=>document.querySelector("#app").style.setProperty("--dialogue-size",v+"px")',int(os.environ['FONT_SIZE']))
  async def advance(seconds,render=True):
   await page.evaluate('(o)=>{const g=__rainy711,n=Math.ceil(o.seconds/.05);for(let i=0;i<n;i++)g.tick(g.time+o.seconds/n,o.seconds/n,o.render&&i===n-1)}',{'seconds':seconds,'render':render})
  async def nextline():
   line=page.locator('.mission-line')
   if await line.is_visible() and await line.is_enabled():await line.click()
  async def capture(name):
   samples.append(await page.evaluate('name=>{const g=__rainy711;return {name,phase:g.mission.phase,node:g.mission.nodeId,elapsed:g.mission.phaseElapsed,camera:g.cameraPose,track:g.cinematic.track,hero:g.heroPosition,head:g.headPosition,dragon:g.dragonPosition,subject:g.projectPoint(g.headPosition),occlusion:g.cameraOcclusion(g.headPosition),performance:g.performance}}',name))
   await page.screenshot(path='/tmp/cinematic-'+name+'.png')
   result_path.write_text(json.dumps({'samples':samples,'errors':errors,'device':'Chromium SwiftShader; not iPhone'},ensure_ascii=False,indent=2))
  for width,height,label in [(390,844,'portrait'),(320,740,'narrow'),(844,390,'landscape'),(1366,768,'desktop')]:
   if os.environ.get('VIEW') and label not in os.environ['VIEW'].split(','):continue
   if os.environ.get('FONT_SIZE'):label+='-font'+os.environ['FONT_SIZE']+'-'+os.environ.get('MOTION','normal')
   await page.set_viewport_size({'width':width,'height':height});await page.wait_for_timeout(120)
   if not os.environ.get('CONNECTION_ONLY'):
    await page.evaluate("__rainy711.restoreChapter('intro')");await advance(.15);await capture(label+'-opening-wide')
    await advance(2.4);await capture(label+'-opening-pair')
    pair=await page.evaluate('__rainy711.cinematic.track')
    for i in range(3):
     await nextline();await advance(2.3)
     if i<2:
      current=await page.evaluate('__rainy711.cinematic.track');assert current['started']==pair['started'] and current['fitCount']==pair['fitCount'],'Clicking the next line restarted the push'
    assert await page.evaluate('__rainy711.mission.node.cue')=='opening-soup'
    await capture(label+'-opening-shoulder')
    for _ in range(12):
     if await page.evaluate('__rainy711.mission.shopping?.atCounter'):break
     await nextline();await advance(2)
    await capture(label+'-counter')
    for _ in range(12):
     if await page.evaluate('__rainy711.mission.phase')=='walk-out':break
     await nextline();await advance(.5)
    await advance(2);await capture(label+'-return-door');await advance(1.45);await capture(label+'-return-curve-start');await advance(.65);await capture(label+'-return-curve-middle');await advance(.7);await capture(label+'-return-curve-end');await advance(.2);await capture(label+'-return-pair')
    if os.environ.get('RETURN_ONLY'):continue
   await page.evaluate("__rainy711.restoreChapter('terminal-deploy')");await advance(3);await capture(label+'-unfold')
   await advance(4.6);await nextline();await nextline();await advance(.2)
   assert await page.evaluate('__rainy711.mission.phase')=='login'
   await capture(label+'-input')
   if width>height:
    points=await page.evaluate('()=>{const g=__rainy711,r=document.querySelector("#scene").getBoundingClientRect(),panel=document.querySelector(".mission-connect").getBoundingClientRect();return {edge:panel.left,points:[[-3.75,.3,4.05],[.45,2.55,6.85]].map(v=>{const p=g.projectPoint(v);return r.left+(p[0]+1)*r.width/2})}}')
    assert max(points['points'])<points['edge']-4,('Terminal is behind keyboard HUD',points)
   original=await page.evaluate('__rainy711.cameraPose')
   for value in ['endfield','_','power','520','1314']:
    await page.locator('[data-key="'+value+'"]').click();await advance(.4,False)
    assert await page.evaluate('__rainy711.cameraPose')==original,('Typing moved input camera',value,original,await page.evaluate('({pose:__rainy711.cameraPose,phase:__rainy711.mission.phase,track:__rainy711.cinematic.track})'))
   for _ in range(10):
    if await page.evaluate('__rainy711.mission.phase')=='captcha':break
    await advance(2);await nextline();await advance(.1)
   assert await page.evaluate('__rainy711.mission.phase')=='captcha'
   await page.evaluate('__rainy711.missionVerify()');await advance(2);await nextline();await nextline();await advance(.3)
   assert await page.evaluate('__rainy711.mission.phase')=='lever'
   await page.evaluate('__rainy711.missionLever(.7)');await advance(.3);await capture(label+'-lever')
   assert await page.evaluate('__rainy711.cameraPose')==original,('Lever moved input camera',original,await page.evaluate('__rainy711.cameraPose'))
   await page.evaluate('__rainy711.missionLever(1)');await advance(.05);assert not await page.evaluate('__rainy711.connectionStage.visible')
   await capture(label+'-ascent-start');await advance(2.4);await capture(label+'-ascent-middle')
   origin=await page.evaluate('__rainy711.cinematic.track.riseOrigin')
   box=await page.locator('#scene').bounding_box();await page.mouse.move(box['x']+box['width']*.22,box['y']+box['height']*.38);await page.mouse.down();await page.mouse.move(box['x']+box['width']*.37,box['y']+box['height']*.43,steps=4);await page.mouse.up();await advance(.01)
   assert await page.evaluate('__rainy711.cinematic.cameraBeat')=='manual'
   await page.evaluate('__rainy711.resetCamera()');await advance(.01)
   assert await page.evaluate('__rainy711.cinematic.track.riseOrigin')==origin,'Manual camera lost takeoff origin'
   expected=await page.evaluate('()=>{const g=__rainy711,a=g.cinematic.track.riseOrigin,t=g.mission.phaseElapsed,p=Math.max(0,Math.min(1,t/5)),u=g.cinematic.reducedMotion?1:p*p*(3-2*p);return [a[0]+2.6+1.4*u,a[1]+.5+2.7*u,a[2]+5.5+3.5*u]}')
   actual=await page.evaluate('__rainy711.cameraPose.position');assert max(abs(a-b) for a,b in zip(expected,actual))<1e-7
   await advance(2.2);await capture(label+'-ascent-end')
   # Existing last-chapter route, real attack button timing, same release and impact clocks.
   await page.evaluate("__rainy711.restoreChapter('last')")
   for _ in range(30):
    if await page.evaluate('__rainy711.mission.phase')=='aim-final':break
    await advance(3,False);await nextline();await nextline()
   await page.wait_for_function('__rainy711.mission.phase==="aim-final"&&!__rainy711.mission.paused',timeout=180000)
   await advance(9.1);await capture(label+'-aim-shoulder')
   await page.evaluate('()=>{const g=__rainy711,s=g.mission,dt=(s.meterPeriod/4-s.meterElapsed%s.meterPeriod+s.meterPeriod)%s.meterPeriod;g.tick(g.time+dt,.1,false);g.missionAttack(g.time)}')
   assert await page.evaluate('__rainy711.mission.phase')=='finisher'
   for target,name in [(.05,'load'),(2.15,'explosion'),(2.74,'face-end'),(2.8,'flight'),(4.4,'impact-ready'),(4.88,'before-impact'),(5.2,'impact')]:
    elapsed=await page.evaluate('__rainy711.mission.phaseElapsed');await advance(target-elapsed);await capture(label+'-'+name)
    beat=await page.evaluate('__rainy711.cinematic.cameraBeat')
    if target<2.75:assert beat=='cinematic-finisher-face'
    elif target<4.35:assert beat=='cinematic-finisher-flight'
    else:assert beat=='cinematic-finisher-impact'
    if target<4.9:assert not await page.evaluate('__rainy711.cinematic.serverImpacted')
   # Pause and a synthetic background cycle preserve the current mission pose.
   await page.evaluate('__rainy711.missionPause(true)');await advance(.01);held=await page.evaluate('__rainy711.cameraPose');await advance(10);assert await page.evaluate('__rainy711.cameraPose')==held
   await page.evaluate('__rainy711.missionPause(false)');await advance(.1)
   await page.evaluate("__rainy711.restoreChapter('intro')");await advance(.2)
   assert (await page.evaluate('__rainy711.cinematic.track.id')).startswith('cinematic-opening')
   print('PASS cinematic '+label,flush=True)
  assert not errors,errors
  result_path.write_text(json.dumps({'samples':samples,'errors':errors,'device':'Chromium SwiftShader; not iPhone'},ensure_ascii=False,indent=2))
  await browser.close()

asyncio.run(main())
