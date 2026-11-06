"""Software-WebGL functional QA. Visibility interruption is simulated; no iPhone FPS claim."""
import asyncio,os,json
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='reduce');errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4199/'),wait_until='domcontentloaded')
  await page.wait_for_function('!!window.__rainy711',timeout=180000)
  assert await page.evaluate('__rainy711.devices.temperature')==50,'Present-day fridge must already be hot'
  await page.evaluate("__rainy711.restoreChapter('rewind')")
  await page.wait_for_function('__rainy711.xaihi.loaded&&!__rainy711.mission.paused',timeout=180000)
  await page.evaluate("()=>{const g=__rainy711;g.pauseForCapture();for(let i=0;i<15&&g.mission.phase!=='hack';i++){g.tick(g.time+3,.1,false);g.missionNext();g.missionNext();}g.tick(g.time+1.4,.1,true)}")
  assert await page.evaluate('__rainy711.devices.temperature')==4
  assert await page.locator('.tablet-access button').count()==0
  assert await page.evaluate('!!__rainy711.mission.tablet.dialogue')
  box=await page.locator('.mission-pause').bounding_box();assert box['y']<200 and box['height']<55,box
  async def advance(seconds,render=True):
   await page.evaluate('(o)=>{const g=__rainy711;const count=Math.ceil(o.seconds/.1);for(let i=0;i<count;i++)g.tick(g.time+o.seconds/count,.1,o.render&&i===count-1)}',{'seconds':seconds,'render':render})
  async def talk():
   for _ in range(8):
    if not await page.evaluate('!!__rainy711.mission.tablet?.dialogue'):return
    await advance(1.6,False);await page.locator('.mission-line').click()
   raise AssertionError('Dialogue loop')
  async def click(label,seconds=.5):
   await advance(.4,False);await page.get_by_role('button',name=label,exact=True).click();await advance(seconds)
  await page.locator('.mission-pause').click();assert await page.evaluate('__rainy711.mission.paused')
  await page.get_by_role('button',name='已暫停・點此繼續',exact=True).click();assert not await page.evaluate('__rainy711.mission.paused')
  assert await page.evaluate('__rainy711.mission.tablet.stage')=='search'
  await page.screenshot(path='/tmp/repair-tablet-portrait.png')
  await page.evaluate('__rainy711.resume()');await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(1200);await page.screenshot(path='/tmp/repair-tablet-landscape.png')
  await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(1200);await page.evaluate('__rainy711.pauseForCapture()');await advance(.2)
  await talk();await advance(.4)
  q=await page.evaluate("()=>__rainy711.projectPoint(__rainy711.xaihi.screenButtons.find(b=>b.id==='scan').world)")
  await page.mouse.click((q[0]+1)*195,(1-q[1])*422);assert await page.evaluate('__rainy711.mission.tablet.stage')=='scan-php'
  await advance(2);print('PASS physical tablet and resume',flush=True)
  await talk()
  await click('用工具打開後台');await click('查看冰箱設定',2);await click('連上冰箱',1.3)
  mid=await page.evaluate('__rainy711.xaihi.position');assert -.8<mid[2]<.5,mid
  await page.screenshot(path='/tmp/repair-walking.png');await advance(2)
  assert await page.evaluate('__rainy711.mission.tablet.stage')=='temperature'
  await click('把溫度調低',1);assert await page.evaluate('__rainy711.devices.temperature')<4
  await advance(1.1);assert await page.evaluate('__rainy711.mission.tablet.stage')=='success'
  await page.screenshot(path='/tmp/repair-fridge-cold.png');await talk();await advance(.4);await advance(2)
  assert -8<await page.evaluate('__rainy711.devices.temperature')<50
  await advance(1.7);assert await page.evaluate('__rainy711.mission.tablet.stage')=='hot'
  await page.screenshot(path='/tmp/repair-fridge-hot.png')
  await advance(1.6,False);await page.locator('.mission-line').click();assert '法國🇫🇷' in await page.locator('.mission-text').inner_text()
  await advance(1.6,False);await page.locator('.mission-line').click();await advance(.2)
  assert await page.locator('.mission-text').inner_text()=='熱愛105°C的你～🎶\n滴滴清純的蒸餾水～'
  await page.screenshot(path='/tmp/repair-fridge-song.png')
  assert await page.locator('.mission-line').evaluate("e=>getComputedStyle(e).webkitUserSelect")=='none'
  song=await page.locator('.mission-text').inner_text();rect=await page.locator('.mission-line').bounding_box()
  await page.mouse.move(rect['x']+20,rect['y']+20);await page.mouse.down();await page.mouse.move(rect['x']+200,rect['y']+30,steps=8);await page.mouse.up()
  assert await page.locator('.mission-text').inner_text()==song,'Dragging dialogue advanced it'
  for width,height in [(320,568),(390,844),(430,932)]:
   await page.set_viewport_size({'width':width,'height':height})
   for size in [18,22,26]:
    await page.evaluate("n=>document.querySelector('#app').style.setProperty('--dialogue-size',n+'px')",size);await advance(.1)
    bounds=await page.locator('.mission-panel').bounding_box();assert bounds['height']<=height*.32+2 and bounds['y']>=0 and bounds['x']>=0,bounds
    assert await page.locator('.mission-text').evaluate('(e)=>getComputedStyle(e).fontSize')==str(size)+'px'
  await page.set_viewport_size({'width':390,'height':844});await page.evaluate("document.querySelector('#app').style.setProperty('--dialogue-size','18px')");await advance(.1)
  await talk()
  await click('先去熱便當',3.3);await page.screenshot(path='/tmp/repair-meal-label.png');await talk();await advance(.4)
  await click('找個加熱快一點的方法',2);await advance(1.6);await page.screenshot(path='/tmp/repair-pylon-computer.png');await talk();await advance(.4)
  assert await page.evaluate('__rainy711.devices.artLoaded')
  assert await page.evaluate('__rainy711.mission.tablet.dialogue.speaker')=='rapi'
  await advance(.2);assert not await page.evaluate('__rainy711.devices.censored')
  await page.screenshot(path='/tmp/repair-rapi-before.png');await talk();await advance(.4)
  assert await page.evaluate('__rainy711.mission.tablet.stage')=='rapi-answer'
  age=await page.evaluate('__rainy711.mission.tablet.age');await advance(max(.01,.65-age));assert not await page.evaluate('__rainy711.devices.censored')
  await advance(.06);assert await page.evaluate('__rainy711.devices.censored')
  await page.screenshot(path='/tmp/repair-rapi-after.png');await advance(1.1)
  assert await page.evaluate('__rainy711.mission.tablet.stage')=='rapi-mask'
  print('PASS cold-to-hot reversal, full song and late eye bar',flush=True)
  await page.screenshot(path='/tmp/repair-nikke.png');await click('接通天師樁電源',.8);await page.screenshot(path='/tmp/repair-wire-source.png');await advance(1.6);await page.screenshot(path='/tmp/repair-wire-route.png');await advance(2.1);await page.screenshot(path='/tmp/repair-wire-sink.png');await advance(2);await talk()
  await click('正常加熱（800 W）');assert await page.evaluate('__rainy711.mission.tablet.dialogue.speaker')=='xaihi';await talk()
  await click('借用電網（800 MW）');await click('確認借電');await click('開始熱便當');assert await page.evaluate('__rainy711.mission.phase')=='credentials'
  await advance(3);await page.evaluate('__rainy711.missionNext()');await page.evaluate('__rainy711.missionNext()');await advance(6.1)
  assert await page.evaluate('__rainy711.mission.phase')=='heat'
  await page.locator('.rhythm-pad').click();await advance(4);await advance(12.1)
  assert await page.evaluate('__rainy711.mission.phase')=='meal-spawn'
  for _ in range(3):await page.locator('.mission-line').click()
  assert await page.evaluate('__rainy711.mission.phase')=='heat'
  for i in range(10):
   await page.locator('.rhythm-pad').click();await advance(.2,False)
   await page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));}")
   assert await page.evaluate('__rainy711.mission.paused&&__rainy711.mission.heat.status==="ready"')
   await page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));}")
   await page.get_by_role('button',name='已暫停・點此繼續',exact=True).click()
   assert await page.locator('.rhythm-pad').is_enabled()
  await page.screenshot(path='/tmp/repair-heat-resume.png');print('PASS ten rhythm background recoveries',flush=True)
  await page.evaluate("""()=>{const g=__rainy711;for(let round=0;round<3&&g.mission.phase==='heat';round++){g.missionHeatRetry();g.missionHeatStart(g.time);const notes=g.mission.heat.notes;for(const n of notes){g.tick(g.time+Math.max(0,n.at-g.mission.heat.elapsed),.05,false);g.missionHeatStart(g.time);if(n.type==='hold'){g.tick(g.time+Math.max(0,n.end-g.mission.heat.elapsed),.05,false);g.missionHeatStop(g.time);}}g.tick(g.time+2,.05,false);}for(let i=0;i<35&&g.mission.phase!=='aim-final';i++){g.tick(g.time+3,.1,false);g.missionNext();g.missionNext();}}""")
  await page.wait_for_function('__rainy711.mission.phase==="aim-final"&&!__rainy711.mission.paused',timeout=180000)
  assert await page.evaluate('__rainy711.performance.battlePrepared'), 'Actual draw preparation did not finish'
  await advance(.2)
  assert await page.locator('.view-dock').is_hidden(), 'Shooting view selector is still available'
  before=await page.evaluate('__rainy711.cameraPose')
  await page.mouse.move(180,250);await page.mouse.down();await page.mouse.move(290,400,steps=5);await page.mouse.up()
  await advance(.1)
  assert await page.evaluate('__rainy711.cinematic.cameraBeat')!='manual'
  await advance(10,False);await advance(.1)
  assert await page.evaluate('__rainy711.cinematic.cameraBeat')=='battle-report', 'Final aim did not return to the target view'
  pose=await page.evaluate('__rainy711.cameraPose');assert pose['position'][2]>20,pose
  await page.screenshot(path='/tmp/repair-aim-final.png')
  await page.evaluate('()=>{const g=__rainy711,s=g.mission,dt=(s.meterPeriod/4-s.meterElapsed%s.meterPeriod+s.meterPeriod)%s.meterPeriod;g.tick(g.time+dt,.1,false);g.missionAttack(g.time)}')
  await advance(2.2);assert await page.locator('.dragon-reaction-bubble').is_visible()
  assert 'Explosion' in await page.locator('.dragon-reaction-bubble').inner_text()
  await page.screenshot(path='/tmp/repair-explosion-caption.png')
  print('PASS final shot and camera lock',flush=True)
  await advance(7.5);assert '我早想喊看看了' in await page.locator('.mission-text').inner_text()
  await advance(3.1);assert '爆裂魔法個頭啦' in await page.locator('.mission-text').inner_text()
  await page.screenshot(path='/tmp/repair-explosion-retort.png')
  await advance(60);assert await page.evaluate('__rainy711.mission.phase')=='complete'
  assert await page.evaluate('__rainy711.staging.remnant.visible'), 'Born creature vanished in wreck'
  assert not await page.evaluate('__rainy711.devices.fridgeVisible'), 'Fridge warning is floating in wreck'
  await page.screenshot(path='/tmp/repair-wreck-creature.png')
  for _ in range(3):
   await advance(1.6,False);await page.locator('.epilogue-prompt button').click()
  await advance(65);assert not await page.evaluate('__rainy711.staging.show.active')
  pose=await page.evaluate('__rainy711.cameraPose');assert pose['position'][2]>20,pose
  assert await page.evaluate('__rainy711.devices.fridgeVisible'),'Rebuilt invitation lost appliance state'
  await page.locator('.epilogue-prompt button').click();await page.wait_for_function('__rainy711.bonus.active&&!__rainy711.bonus.busy');await advance(.2)
  async def background(replay=False):
   state=await page.evaluate('({route:__rainy711.bonus.route,page:__rainy711.bonus.page,lesson:__rainy711.bonus.lesson})')
   await page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));}")
   await page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));}")
   assert await page.locator('.bonus-recovery').is_visible()
   assert not await page.locator('.mission-resume-panel').is_visible()
   await page.get_by_role('button',name='重播這一幕' if replay else '繼續這一幕',exact=True).click()
   assert not await page.locator('.bonus-recovery').is_visible()
   assert state==await page.evaluate('({route:__rainy711.bonus.route,page:__rainy711.bonus.page,lesson:__rainy711.bonus.lesson})')
   await advance(.2)
  await background();await background(True);print('PASS upstairs resume and replay controls',flush=True)
  for _ in range(90):
   route=await page.evaluate('__rainy711.bonus.route')
   if route=='settlement-result':break
   phase=await page.evaluate('__rainy711.bonus.negotiation.phase')
   if route=='claims':await page.locator('.bonus-claims-dock button').click()
   elif phase=='choice':await page.locator('[data-action=claims-select][data-value=B]').click()
   elif phase=='stamp':await advance(4,False)
   else:await page.locator('.bonus-claims-dock button').click()
   await advance(2,False)
  assert await page.evaluate('__rainy711.bonus.route')=='settlement-result';print('PASS claim sequence',flush=True)
  await page.locator('.bonus-claims-dock button').click();await page.wait_for_function('!__rainy711.bonus.busy');await advance(.2)
  await page.locator('.bonus-class-dock:not(.bonus-claims-dock) .bonus-primary').click();await advance(.2)
  await background()
  for i in range(160):
   route=await page.evaluate('__rainy711.bonus.route')
   if route=='class-result':break
   primary=page.locator('.bonus-class-dock:not(.bonus-claims-dock) .bonus-primary')
   if await primary.is_enabled():await primary.click()
   await advance(2.1,False)
   if i in [8,18]:await background(i==18)
  assert await page.evaluate('__rainy711.bonus.route')=='class-result'
  assert len(await page.evaluate('__rainy711.bonus.course.completed'))==8;print('PASS eight lessons and classroom background recovery',flush=True)
  await page.locator('.bonus-class-dock:not(.bonus-claims-dock) .bonus-primary').click();await advance(.2)
  assert await page.evaluate('__rainy711.bonus.route')=='rating'
  await page.get_by_role('button',name='3 星',exact=True).click();await page.locator('.feedback-form textarea').fill('背景測試草稿')
  for _ in range(3):await background()
  await background(True)
  assert await page.locator('.feedback-form textarea').input_value()=='背景測試草稿'
  assert await page.get_by_role('button',name='3 星',exact=True).get_attribute('aria-pressed')=='true';print('PASS rating and draft retained through four background recoveries',flush=True)
  await page.screenshot(path='/tmp/repair-rating-recovery.png')
  await page.route('**/api/feedback',lambda route:route.fulfill(status=200,content_type='application/json',body='{"ok":true}'))
  await page.get_by_role('button',name='送出評分與意見',exact=True).click();await page.wait_for_function('__rainy711.bonus.route==="rating-result"')
  for _ in range(3):
   await background();await page.screenshot(path='/tmp/repair-thanks-recovery.png');await page.locator('[data-action=thanks-next]').click()
  assert await page.evaluate('__rainy711.bonus.route')=='final'
  await page.locator('[data-action=close]:visible').click();await advance(.2)
  assert await page.evaluate('__rainy711.mission.postgame&&__rainy711.staging.remnant.visible')
  for i in range(6):
   await page.locator('.postgame-toggle').click();await advance(7);await page.locator('.street-performance button').click();await advance(.2)
   intact=await page.evaluate('__rainy711.staging.show.mode')=='intact'
   assert await page.evaluate('__rainy711.devices.fridgeVisible')==intact
   assert await page.evaluate('__rainy711.staging.remnant.visible')
  await page.locator('.walk-toggle').click();await page.keyboard.down('s')
  await page.evaluate('()=>{const g=__rainy711;for(let i=0;i<360;i++)g.tick(g.time+1/60,1/60,false);g.tick(g.time+1/60,1/60,true)}')
  await page.keyboard.up('s');await advance(.1)
  road=await page.evaluate('__rainy711.position');assert road[2]>6,road
  await page.screenshot(path='/tmp/repair-road-follow.png')
  await page.evaluate('()=>{const g=__rainy711;for(let i=0;i<300;i++)g.tick(g.time+1/60,1/60,false)}')
  await page.keyboard.down('w');await page.evaluate('()=>{const g=__rainy711;for(let i=0;i<360;i++)g.tick(g.time+1/60,1/60,false)}');await page.keyboard.up('w');await advance(.1)
  assert await page.evaluate('__rainy711.position[2]')<4.5,'Could not return from road'
  samples=await page.evaluate('()=>{const g=__rainy711,a=[];for(let i=0;i<1800;i++){g.tick(g.time+1/60,1/60,false);if(i%120===0)a.push({dragon:g.dragonPosition,meal:g.staging.remnant.position,mode:g.staging.remnant.mode})}g.tick(g.time+1/60,1/60,true);return a}')
  assert any(sum((s['dragon'][j]-samples[0]['dragon'][j])**2 for j in [0,2])>.4 for s in samples),'Dragon stayed fixed beside idle Zhuang'
  assert any(sum((s['meal'][j]-samples[-1]['meal'][j])**2 for j in [0,2])>.025 for s in samples),'Creature never moved during idle'
  assert await page.evaluate('__rainy711.investigationProps.figurine.draws')==1
  assert await page.evaluate('__rainy711.investigationProps.collectionPosition[1]')>3,'Restored collection did not return upstairs'
  print('PASS road return, independent flight, slow creature and single-draw collectible',flush=True)
  await page.locator('.postgame-reset').click();await advance(.2)
  assert not await page.evaluate('__rainy711.mission.postgame||__rainy711.staging.remnant.visible')
  for selector in ['.walk-pad','.postgame-actions','.bonus-entry']:
   assert not await page.locator(selector).is_visible(),selector
  print('PASS complete course, ending recovery, six house switches, road walk and restart',flush=True)
  assert not errors,errors;print('PASS no runtime errors',flush=True);await b.close()
asyncio.run(main())
