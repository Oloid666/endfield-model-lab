"""A/B the same paused pose; replay to verify contextual shots without changing physics."""
import os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':430,'height':880},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.clock.install();page.goto(os.environ.get('INDOOR_URL','http://127.0.0.1:4182/endfield-model-lab/indoor.html'));page.wait_for_function('window.__indoor');page.clock.pause_at(page.evaluate('Date.now()+2000'))
 assert page.evaluate('__indoor.camera.mode')=='auto'
 page.click('#start');page.clock.run_for(1100);page.click('#pause');t=page.evaluate('__indoor.state.time')
 page.click('#camera');assert page.evaluate('__indoor.camera.mode')=='close'
 near=page.evaluate('__indoor.camera');page.clock.run_for(20);page.screenshot(path='/tmp/indoor-camera-close.png')
 page.click('#camera');assert page.evaluate('__indoor.camera.mode')=='wide'
 far=page.evaluate('__indoor.camera');page.clock.run_for(20);page.screenshot(path='/tmp/indoor-camera-wide.png')
 assert page.evaluate('__indoor.state.time')==t
 def height(c):return abs(c['actors'][1][1][1]-c['actors'][1][0][1])*440
 print('same-pose dragon height px',height(near),height(far),flush=True)
 assert height(near)>height(far)*1.3,'near chase must visibly enlarge the actor'
 page.click('#camera');assert page.evaluate('__indoor.camera.mode')=='auto'
 page.click('#reset')
 # Preserve input/render updates, only omit GPU draw calls during fast replay.
 page.evaluate("()=>{window._draws={};for(const k of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){_draws[k]=WebGL2RenderingContext.prototype[k];WebGL2RenderingContext.prototype[k]=function(){}}}")
 shots=set();held=None;outside=0;samples=0
 for i in range(240):
  s=page.evaluate('__indoor.state')
  if s['finished']:break
  key='KeyD' if int(s['time']/2)%2==0 else 'KeyA'
  if key!=held:
   if held:page.keyboard.up(held)
   page.keyboard.down(key);held=key
  page.clock.run_for(100)
  c=page.evaluate('__indoor.camera');shots.add(c['shot']);samples+=1
  outside+=any(abs(v[0])>1.03 or abs(v[1])>1.03 or v[2]>1 for a in c['actors'] for v in a)
 if held:page.keyboard.up(held)
 s=page.evaluate('__indoor.state');print('auto shots',shots,'out-of-frame samples',outside,'/',samples,'result',s['course'],s['score'],flush=True)
 assert shots=={'close','wide'}
 assert outside/samples<.03,'actors remain framed during transitions'
 assert s['passed'],'camera must not change skill outcome'
 page.set_viewport_size({'width':844,'height':390});page.clock.run_for(50)
 assert all(abs(v[0])<1.05 for a in page.evaluate('__indoor.camera.actors') for v in a)
 assert not errors,errors
 print('PASS camera A/B without restart, larger close chase, auto close/wide, framed replay and landscape',flush=True);b.close()
