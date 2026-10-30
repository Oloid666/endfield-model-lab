"""Real keyboard replay and readable hit feedback in Chromium mobile emulation."""
import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':430,'height':880},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.clock.install();page.goto(os.environ.get('INDOOR_URL','http://127.0.0.1:4182/endfield-model-lab/indoor.html'));page.wait_for_function('window.__indoor');page.clock.pause_at(page.evaluate('Date.now()+2000'))
 # Skip GPU draws during replay, restore for screenshots. Simulation, DOM and input run normally.
 page.evaluate("()=>{window._draws={};for(const k of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){_draws[k]=WebGL2RenderingContext.prototype[k];WebGL2RenderingContext.prototype[k]=function(){}}}")
 def shot(name):
  page.evaluate("()=>{for(const k in _draws)WebGL2RenderingContext.prototype[k]=_draws[k]}");page.clock.run_for(20);page.screenshot(path='/tmp/indoor-skill-'+name+'.png');page.evaluate("()=>{for(const k in _draws)WebGL2RenderingContext.prototype[k]=function(){}}")
 page.click('#start');held=None;wide=False;hit=False
 for _ in range(280):
  s=page.evaluate('__indoor.state')
  if s['finished']:break
  key='KeyD' if int(s['time']/2)%2==0 else 'KeyA'
  if key!=held:
   if held:page.keyboard.up(held)
   page.keyboard.down(key);held=key
  page.clock.run_for(100)
  if not wide and abs(s['dragonOffset'])>.6:shot('swing');wide=True
  if not hit and any(e['kind']=='goods' and e['who']=='dragon' and s['time']-e['at']<.3 for e in s['events']):shot('hit');hit=True
 if held:page.keyboard.up(held)
 s=page.evaluate('__indoor.state');shot('result')
 print('keyboard outcome',s['course'],s['score'],s['maxCombo'],s['time'],flush=True)
 assert s['finished'] and s['passed'],s
 assert wide and hit
 assert '完成時間' in page.locator('#summary').inner_text()
 page.click('#again');assert page.evaluate('__indoor.state.combo===0 && __indoor.state.score===0')
 for _ in range(125):
  page.clock.run_for(200)
  if page.evaluate('__indoor.state.finished'):break
 assert page.evaluate('__indoor.state.finished && __indoor.state.passed'),'finishing needs no target quota'
 assert not errors,errors
 print('PASS keyboard run, visible swing/hit, result, immediate retry and no target quota',flush=True);b.close()
