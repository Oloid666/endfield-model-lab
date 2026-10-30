"""Record real control input and capture all passenger poses without writing gameplay state."""
import math,os,json
from playwright.sync_api import sync_playwright
frames=os.environ.get('CHAIR_FRAMES','/tmp/indoor-chair-frames');os.makedirs(frames,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':430,'height':880},has_touch=True);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.clock.install();page.goto(os.environ.get('INDOOR_URL','http://127.0.0.1:4182/endfield-model-lab/indoor.html'));page.wait_for_function('window.__indoor');page.clock.pause_at(page.evaluate('Date.now()+2000'))
 page.click('[data-course="2"]');page.click('#start');r=page.locator('#steer').bounding_box();br=page.locator('#brake').bounding_box();cdp=page.context.new_cdp_session(page)
 rescue=False;braking=False;seen=set();saved=set()
 def touches(steer,brake):
  points=[{'id':1,'x':r['x']+r['width']/2+steer*r['width']*.36,'y':r['y']+20}]
  if brake:points.append({'id':2,'x':br['x']+br['width']/2,'y':br['y']+20})
  return points
 active=[]
 for i in range(800):
  s=page.evaluate('__indoor.state');mode=s['passenger']['mode'];seen.add(mode)
  if s['finished']:break
  if mode=='fallen':rescue=True
  if mode=='seated' and s['passenger']['risk']<.12:rescue=False
  steer=max(-1,min(1,s['curvature']*s['speed']**2*.35/7-s['offset']*1.8-s['sideSpeed']*.8)) if rescue else math.sin(s['time']*3)
  if rescue!=braking:
   (page.keyboard.down if rescue else page.keyboard.up)('KeyS');braking=rescue
  pts=touches(steer,False)
  if len(pts)>len(active):cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':pts})
  elif len(pts)<len(active):cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':pts})
  else:cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':pts})
  active=pts;assert page.evaluate('__indoor.input.brake')==rescue;page.clock.run_for(75)
  page.screenshot(path=f'{frames}/{i:04d}.png')
  if mode not in saved and (mode!='fallen' or s['passenger']['age']>.45):
   page.screenshot(path='/tmp/passenger-'+mode+'.png');saved.add(mode)
 cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});page.keyboard.up('KeyS')
 s=page.evaluate('__indoor.state');assert s['finished'];assert {'seated','scrape','slipping','fallen','recovering'}<=seen,seen
 assert s['passenger']['falls']>0 and s['passenger']['saves']>0
 page.click('#again');assert page.evaluate('__indoor.state.passenger.falls===0 && __indoor.state.passenger.saves===0 && __indoor.state.passenger.mode==="seated"')
 page.click('#pause');t=page.evaluate('__indoor.state.passenger.age');page.clock.run_for(300);assert page.evaluate('__indoor.state.passenger.age')==t
 page.click('[data-course="3"]');assert page.evaluate('__indoor.state.passenger.mode')=='seated';assert not errors,errors
 print(json.dumps({'seen':list(seen),'time':s['time'],'falls':s['passenger']['falls'],'saves':s['passenger']['saves']},ensure_ascii=False),flush=True)
 print('PASS passenger real steering/brake replay, scrape/slip/fall/recovery, braking, pause, course switch and reset',flush=True);b.close()
