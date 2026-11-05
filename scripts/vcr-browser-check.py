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
  assert await page.locator('.tablet-access button').count()==1
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
  q=await page.evaluate("()=>__rainy711.projectPoint(__rainy711.xaihi.screenButtons.find(b=>b.id==='scan').world)")
  await page.mouse.click((q[0]+1)*195,(1-q[1])*422);assert await page.evaluate('__rainy711.mission.tablet.stage')=='scan-php'
  await advance(2);print('PASS physical tablet and resume',flush=True)
  await click('使用 PHP2Shell 工具');await click('偵測冰箱控制器',2);await click('使用 FrostControl 維修工具',1.3)
  mid=await page.evaluate('__rainy711.xaihi.position');assert -.8<mid[2]<.5,mid
  await page.screenshot(path='/tmp/repair-walking.png');await advance(2)
  assert await page.evaluate('__rainy711.mission.tablet.stage')=='temperature'
  await click('套用溫度設定',2);assert 4<await page.evaluate('__rainy711.devices.temperature')<50
  await advance(2.1);assert await page.evaluate('__rainy711.mission.tablet.dialogue.speaker')=='dragon'
  await page.screenshot(path='/tmp/repair-fridge-hot.png');await talk();await click('打開冰箱，確認飲料',3.3);await page.screenshot(path='/tmp/repair-drink.png');await talk()
  await click('飲料放旁邊，處理便當',3.3);await talk();await click('偵測電網漏洞',2);await advance(1.6);await talk()
  assert await page.evaluate('__rainy711.devices.artLoaded')
  await page.screenshot(path='/tmp/repair-nikke.png');await click('啟用後門',.8);await page.screenshot(path='/tmp/repair-wire-source.png');await advance(1.6);await page.screenshot(path='/tmp/repair-wire-route.png');await advance(2.1);await page.screenshot(path='/tmp/repair-wire-sink.png');await advance(2);await talk()
  await click('800 W｜設備額定｜三分鐘');assert await page.evaluate('__rainy711.mission.tablet.dialogue.speaker')=='xaihi';await talk()
  await click('800 MW｜電網輸出');await click('確認套用功率');await click('開始極速加熱');assert await page.evaluate('__rainy711.mission.phase')=='credentials'
  await advance(3);await page.evaluate('__rainy711.missionNext()');await page.evaluate('__rainy711.missionNext()');await advance(6.1)
  assert await page.evaluate('__rainy711.mission.phase')=='heat'
  await page.locator('.rhythm-pad').click();await advance(4);await advance(12.1)
  assert await page.evaluate('__rainy711.mission.phase')=='heat'
  for i in range(10):
   await page.locator('.rhythm-pad').click();await advance(.2,False)
   await page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));}")
   assert await page.evaluate('__rainy711.mission.paused&&__rainy711.mission.heat.status==="ready"')
   await page.evaluate("()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));}")
   await page.get_by_role('button',name='已暫停・點此繼續',exact=True).click()
   assert await page.locator('.rhythm-pad').is_enabled()
  await page.screenshot(path='/tmp/repair-heat-resume.png');print('PASS ten rhythm background recoveries',flush=True)
  await page.evaluate("()=>{const g=__rainy711;g.restoreChapter('last');for(let i=0;i<30&&g.mission.phase==='last';i++){g.tick(g.time+3,.1,false);g.missionNext();g.missionNext();}}")
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
  print('PASS final shot',await page.evaluate('__rainy711.performance'),flush=True)
  assert not errors,errors;print('PASS no runtime errors',flush=True);await b.close()
asyncio.run(main())
