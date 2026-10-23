"""Desktop Chromium QA. This does not replace an iPhone Safari device test."""
import asyncio, json, os, time
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:5173/')

async def ready(page):
 await page.goto(URL,wait_until='networkidle')
 await page.wait_for_function('window.__rainy711 || !document.querySelector("#error").hidden',timeout=60000)
 assert await page.evaluate('!!window.__rainy711'),await page.locator('#error-message').inner_text()
 await page.wait_for_timeout(800)

async def main():
 OUT.mkdir(exist_ok=True)
 results={'url':URL,'browser':'Desktop Chromium, SwiftShader software WebGL','real_iphone_test':False,'checks':[]}
 def check(name,passed=True,detail=None):
  results['checks'].append({'name':name,'passed':passed,'detail':detail})
  assert passed,f'{name}: {detail}'
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='reduce')
  page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  await ready(page)
  state=await page.evaluate('JSON.parse(JSON.stringify(window.__rainy711))')
  check('原模型與骨架節點載入',state['actorsLoaded'] and state['bonesSupported'],state)
  check('單一 Canvas',state['rendererCount']==1)
  check('直式無頁面溢出',await page.evaluate('document.documentElement.scrollWidth===innerWidth && document.documentElement.scrollHeight===innerHeight'))
  await page.screenshot(path=str(OUT/'iphone-portrait.png'))
  await page.locator('#menu-toggle').click();check('設定可開啟',await page.locator('#settings').is_visible())
  await page.locator('#characters').uncheck();check('人物可隱藏',not await page.evaluate('window.__rainy711.actorsVisible'))
  await page.locator('#characters').check();check('人物可還原',await page.evaluate('window.__rainy711.actorsVisible'))
  await page.locator('#rain').uncheck();await page.locator('#rain').check()
  await page.locator('#quality').select_option('low');check('畫質可切換',await page.evaluate('window.__rainy711.quality')=='low')
  await page.locator('#quality').select_option('balanced')
  await page.locator('#sound').check();await page.locator('#sound').uncheck()
  await page.locator('#menu-close').click()
  for view in ['store','awning','reset']:
   await page.locator(f'[data-view={view}]').click()
   check(f'視角 {view}',await page.locator('[data-view=street]' if view=='reset' else f'[data-view={view}]').get_attribute('aria-pressed')=='true')
   if view=='awning':await page.screenshot(path=str(OUT/'awning.png'))
  # Real touch move through Chromium's input channel. No hotspot handlers exist in phase one.
  cdp=await context.new_cdp_session(page)
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':180,'y':390}]})
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':245,'y':405}]})
  await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  await page.wait_for_timeout(500)
  check('單指拖曳解除自動鏡頭',await page.locator('.view-dock .active').count()==0)
  await page.locator('[data-view=reset]').click()
  # A synthetic hidden-page event checks our pause logic; it is not a real mobile background test.
  t=await page.evaluate('window.__rainy711.time')
  await page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))")
  await page.wait_for_timeout(500)
  t2=await page.evaluate('window.__rainy711.time')
  check('模擬隱藏分頁時鐘暫停',abs(t2-t)<.1)
  await page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))")
  await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500)
  check('橫式無頁面溢出',await page.evaluate('document.documentElement.scrollWidth===innerWidth'))
  await page.screenshot(path=str(OUT/'iphone-landscape.png'))
  await page.set_viewport_size({'width':1440,'height':1000});await page.locator('[data-view=reset]').click();await page.wait_for_timeout(500)
  await page.screenshot(path=str(OUT/'desktop.png'))
  # Observe the actual scene for 60 seconds. Poll in short intervals for useful diagnostics.
  started=time.monotonic();before=await page.evaluate('window.__rainy711.renders')
  for _ in range(12):await page.wait_for_timeout(5000)
  duration=time.monotonic()-started;after=await page.evaluate('window.__rainy711.renders')
  results['software_render_fps']=(after-before)/duration
  check('場景持續觀察 60 秒',after>before,{'seconds':round(duration,2),'frames':after-before})
  check('沒有 JavaScript 例外',not errors,errors)
  # Test actual WebGL context loss and restore on this page.
  await page.evaluate("window.qaLoss=document.querySelector('#scene canvas').getContext('webgl2').getExtension('WEBGL_lose_context');window.qaLoss.loseContext()")
  await page.wait_for_timeout(300);check('Context Lost 提示',await page.locator('#error').is_visible())
  await page.evaluate('window.qaLoss.restoreContext()');await page.wait_for_timeout(1800)
  check('Context Restored 恢復',not await page.locator('#error').is_visible())
  check('恢復後仍只有一個 Canvas',await page.locator('#scene canvas').count()==1)
  await context.close()
  fallback=await browser.new_page(viewport={'width':390,'height':844})
  await fallback.route('**/models/zhuang-fangyi.glb',lambda route:route.abort())
  await ready(fallback)
  await fallback.locator('#menu-toggle').click()
  check('模型失敗時保留場景與提示',await fallback.locator('#characters').is_disabled() and await fallback.get_by_text('人物暫時沒有載入。請重新整理後再試。').is_visible())
  await fallback.close()
  no_webgl=await browser.new_page()
  await no_webgl.add_init_script("const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type==='webgl2'?null:native.call(this,type,...args)}")
  await no_webgl.goto(URL);await no_webgl.locator('#error').wait_for(state='visible')
  check('WebGL 不可用時提示重試',await no_webgl.locator('#retry').is_visible())
  await no_webgl.close();await browser.close()
 (OUT/'qa-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 print(json.dumps(results,ensure_ascii=False,indent=2))

asyncio.run(main())
