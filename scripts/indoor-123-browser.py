"""Three courses, high starts, no quota, real slider input and continuous gameplay capture."""
from playwright.sync_api import sync_playwright
import os,math,json
os.makedirs('/tmp/indoor-123-frames',exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':430,'height':880},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.clock.install();page.goto(os.environ.get('INDOOR_URL','http://127.0.0.1:4182/endfield-model-lab/indoor.html'));page.wait_for_function('window.__indoor');page.clock.pause_at(page.evaluate('Date.now()+2000'))
 results=[]
 for course in ['1','2','3']:
  page.click('[data-course="'+course+'"]')
  assert page.evaluate('__indoor.state.course')==course
  if course=='1':page.click('#start')
  page.clock.run_for(20)
  page.screenshot(path='/tmp/indoor-start-'+course+'.png')
  r=page.locator('#steer').bounding_box();page.mouse.move(r['x']+r['width']/2,r['y']+20);page.mouse.down()
  shot=False
  for frame in range(400):
   s=page.evaluate('__indoor.state')
   if s['finished']:break
   steer=max(-1,min(1,s['curvature']*s['speed']**2*.35/7-s['offset']*1.8-s['sideSpeed']*.8))
   page.mouse.move(r['x']+r['width']/2+steer*r['width']*.36,r['y']+20)
   page.clock.run_for(75)
   if course=='1':page.screenshot(path='/tmp/indoor-123-frames/%04d.png'%frame)
   elif not shot and s['time']>8:page.screenshot(path='/tmp/indoor-middle-'+course+'.png');shot=True
  page.mouse.up();s=page.evaluate('__indoor.state');assert s['finished'];assert '完成時間' in page.locator('#summary').inner_text();page.screenshot(path='/tmp/indoor-finish-'+course+'.png');results.append({'course':course,'time':s['time'],'walls':s['wallHits'],'score':s['score']})
 page.set_viewport_size({'width':844,'height':390});page.clock.run_for(20);page.click('[data-course="1"]');page.clock.run_for(100)
 assert page.evaluate('__indoor.state.course')=='1';assert not errors,errors
 print(json.dumps(results,ensure_ascii=False),flush=True);print('PASS 123 high-start course switching, real pointer driving, complete runs and landscape',flush=True)
 b.close()
