from playwright.sync_api import sync_playwright
import json,os
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':430,'height':880},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.clock.install();page.goto(os.environ.get('INDOOR_URL','http://127.0.0.1:4182/endfield-model-lab/indoor.html'));page.wait_for_function('window.__indoor');page.clock.pause_at(page.evaluate('Date.now()+2000'))
 page.screenshot(path='/tmp/indoor-intro.png');page.click('#start');page.clock.run_for(1500);page.screenshot(path='/tmp/indoor-play.png')
 assert page.evaluate('__indoor.state.s')>.8
 page.click('#pause');t=page.evaluate('__indoor.state.time');page.clock.run_for(300);assert page.evaluate('__indoor.state.time')==t;assert not page.evaluate('__indoor.audio.active');page.click('#pause')
 cdp=page.context.new_cdp_session(page)
 def point(id,n,rx=.5):
  r=page.locator(id).bounding_box();return {'id':n,'x':r['x']+r['width']*rx,'y':r['y']+r['height']*.4}
 cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[point('#steer',1,.85),point('#brake',2)]});assert page.evaluate('__indoor.input.steer>.5 && __indoor.input.brake')
 cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]});assert page.evaluate('__indoor.input.steer===0 && !__indoor.input.brake')
 page.click('#recover');assert page.evaluate('__indoor.state.recoveries')==1
 page.click('#sound');assert page.evaluate('__indoor.audio.muted');page.click('#reset');assert page.evaluate('__indoor.state.recoveries')==0
 page.set_viewport_size({'width':844,'height':390});page.clock.run_for(100);page.screenshot(path='/tmp/indoor-landscape.png')
 assert not errors,errors
 print('PASS indoor browser controls, cancel, pause/audio, recovery, replay and landscape',flush=True);b.close()
