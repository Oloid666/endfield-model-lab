"""Chromium software-WebGL smoke check; does not replace iPhone Safari QA."""
import asyncio,os
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4197/'),wait_until='domcontentloaded')
  await page.wait_for_function('!!window.__rainy711',timeout=180000)
  await page.evaluate("__rainy711.restoreChapter('rewind')")
  await page.wait_for_function('__rainy711.xaihi.loaded && !__rainy711.mission.paused',timeout=180000)
  await page.evaluate('''()=>{let g=__rainy711;g.pauseForCapture();g.tick(g.time+7,.016,false);for(let i=0;i<15&&g.mission.phase!=='hack';i++){g.tick(g.time+3,.016,false);g.missionNext();g.missionNext();}g.tick(g.time+.5,.016,true);}''')
  print('ENTRY',await page.evaluate('({phase:__rainy711.mission.phase,tablet:__rainy711.mission.tablet,xaihi:__rainy711.xaihi})'),flush=True)
  box=await page.locator('.mission-pause').bounding_box();assert box['height']<=50 and box['y']>700,box
  await page.evaluate('__rainy711.resume()')
  await page.set_viewport_size({'width':844,'height':390})
  await page.wait_for_timeout(1500)
  await page.evaluate('()=>__rainy711.tick(__rainy711.time+.1,.1,true)')
  await page.screenshot(path='/tmp/vcr-tablet-landscape.png')
  assert await page.evaluate('document.documentElement.scrollWidth===innerWidth')
  await page.set_viewport_size({'width':390,'height':844})
  await page.wait_for_timeout(1500)
  await page.evaluate('()=>__rainy711.tick(__rainy711.time+.1,.1,true)')
  await page.screenshot(path='/tmp/vcr-tablet-portrait.png')
  await page.evaluate('__rainy711.pauseForCapture()')
  async def click(label):
   await page.evaluate('()=>__rainy711.tick(__rainy711.time+.5,.1,true)')
   await page.get_by_role('button',name=label,exact=True).click()
   await page.evaluate('()=>{for(let i=0;i<24;i++)__rainy711.tick(__rainy711.time+.1,.1,i===23)}')
  before_pause=await page.locator('.mission-pause').bounding_box()
  await page.locator('.mission-pause').click();assert await page.evaluate('__rainy711.mission.paused')
  paused_box=await page.locator('.mission-pause').bounding_box();assert paused_box==before_pause
  await page.locator('.mission-pause').click();assert not await page.evaluate('__rainy711.mission.paused')
  q=await page.evaluate("()=>__rainy711.projectPoint(__rainy711.xaihi.screenButtons.find(b=>b.id==='scan').world)")
  assert abs(q[0])<1 and abs(q[1])<1,q
  await page.mouse.click((q[0]+1)*195,(1-q[1])*422)
  assert await page.evaluate('__rainy711.mission.tablet.stage')=='scan-php','Physical screen tap failed'
  await page.evaluate('()=>__rainy711.tick(__rainy711.time+2,.1,true)')
  print('PHYSICAL TAP PASSED',q,flush=True)
  for label in ['使用 PHP2Shell 測試工具','偵測冰箱控制器','使用 FrostControl 維修工具','套用溫度設定']:
   await click(label)
  print('HOT',await page.evaluate('__rainy711.mission.tablet'),flush=True)
  await page.screenshot(path='/tmp/vcr-fridge-hot.png')
  await page.evaluate('()=>{for(let i=0;i<125;i++)__rainy711.tick(__rainy711.time+.1,.1,i===124)}')
  await click('飲料放旁邊，處理便當');await click('偵測電網漏洞')
  await page.screenshot(path='/tmp/vcr-nikke.png')
  await click('啟用後門')
  await page.evaluate('()=>{for(let i=0;i<61;i++)__rainy711.tick(__rainy711.time+.1,.1,i===60)}')
  await click('800 W｜額定功率｜三分鐘')
  assert await page.evaluate('__rainy711.mission.tablet.stage')=='power'
  await page.screenshot(path='/tmp/vcr-power-reject.png')
  await page.evaluate('()=>__rainy711.tick(__rainy711.time+2,.1,true)')
  for label in ['800 MW｜電網額定輸出','確認套用功率','開始極速加熱']:await click(label)
  print('EXIT',await page.evaluate('({phase:__rainy711.mission.phase,hot:__rainy711.mission.fridgeHot,powered:__rainy711.mission.cablePowered})'),flush=True)
  assert await page.evaluate('__rainy711.mission.phase')=='credentials'
  await page.evaluate("()=>{const g=__rainy711;g.restoreChapter('last');for(let i=0;i<30&&g.mission.phase==='last';i++){g.tick(g.time+3,.1,false);g.missionNext();g.missionNext();}}")
  await page.wait_for_function('__rainy711.mission.phase==="aim-final"&&!__rainy711.mission.paused',timeout=180000)
  assert await page.locator('.fx-preparing').is_hidden()
  assert await page.evaluate('__rainy711.warmup.completed.includes("battle-effects")')
  await page.evaluate('()=>{const g=__rainy711;g.tick(g.time+10,.1,false);const s=g.mission,dt=(s.meterPeriod/4-s.meterElapsed%s.meterPeriod+s.meterPeriod)%s.meterPeriod;g.tick(g.time+dt,.1,false);g.missionAttack(g.time);for(let i=0;i<44;i++)g.tick(g.time+.05,.05,i===43)}')
  assert await page.locator('.dragon-reaction-bubble').is_visible()
  assert 'Explosion' in await page.locator('.dragon-reaction-bubble').inner_text()
  print('WARMUP AND EXPLOSION PASSED',flush=True)
  assert not errors,errors
  print('ERRORS',errors,flush=True)
  await b.close()
asyncio.run(main())
