"""Actual V8 camera/layout captures; desktop SwiftShader, never iPhone evidence."""
import asyncio,json,os
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4194/endfield-model-lab/')
async def main():
 r={'url':URL,'browser':'Desktop Chromium / SwiftShader','real_iphone_test':False,'checks':[],'errors':[]}
 def check(name,ok,detail=None):r['checks'].append({'name':name,'passed':bool(ok),'detail':detail});print(name,'PASS' if ok else 'FAIL',flush=True)
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  c=await b.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='reduce');page=await c.new_page();page.set_default_timeout(120000)
  page.on('pageerror',lambda e:r['errors'].append(str(e)))
  async def js(s,a=None):return await page.evaluate(s,a)
  async def advance(sec,render=True):return await js('({sec,render})=>{const q=__rainy711,t=q.time,n=Math.max(1,Math.ceil(sec*60));for(let i=1;i<=n;i++)q.tick(t+sec*i/n,sec/n,render&&i===n);return q.mission;}',{'sec':sec,'render':render})
  async def until(phase):return await js('phase=>{const q=__rainy711;for(let i=0;i<250&&q.mission.phase!==phase;i++)q.missionNext();if(q.mission.phase!==phase)throw Error("Cannot reach "+phase);return q.mission;}',phase)
  async def text_until(text):return await js('text=>{const q=__rainy711;for(let i=0;i<150&&!q.mission.text.includes(text);i++)q.missionNext();if(!q.mission.text.includes(text))throw Error("Missing "+text);return q.mission;}',text)
  async def diagnostics():return await js('''()=>{const q=__rainy711,canvas=document.querySelector('#scene canvas'),gl=canvas.getContext('webgl2'),bounds=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,top:b.top,bottom:b.bottom};},rect=bounds(canvas),project=p=>{const v=q.projectPoint(p);return {ndc:v,x:rect.x+(v[0]+1)*rect.width/2,y:rect.y+(1-v[1])*rect.height/2};};return {camera:q.camera,hero:q.heroPosition,dragon:q.dragonPosition,dragonScreen:project(q.dragonPosition),heroScreen:project(q.heroPosition),canvas:{buffer:[canvas.width,canvas.height],drawing:[gl.drawingBufferWidth,gl.drawingBufferHeight],rect},scene:bounds(document.querySelector('#scene')),panel:bounds(document.querySelector('.mission-connect')),drawCalls:q.drawCalls,triangles:q.triangles,error:gl.getError(),contextLost:gl.isContextLost(),inner:[innerWidth,innerHeight],phase:q.mission.phase};}''')
  async def capture(name):await page.screenshot(path=str(OUT/name),timeout=120000)
  try:
   await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded');r['assets']=await js("[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(e=>e.src||e.href)");await js('__rainy711.pauseForCapture();__rainy711.frameView("store")');await advance(.1);r['opening_oven']=await js('__rainy711.microwave');await capture('v8-opening-microwave.png');check('Opening keeps charred warming microwave',r['opening_oven']['charred']>.8 and r['opening_oven']['warming']);await js('__rainy711.missionStart()');await until('choice');await js('__rainy711.missionChoose("A")');await until('login');await advance(2)
   await js('__rainy711.missionKey("e")');await advance(.2);d=await diagnostics();r['portrait_login']=d
   check('Portrait Dragon hop stays above keyboard panel',d['dragonScreen']['y']<d['panel']['top'] and abs(d['dragonScreen']['ndc'][0])<1 and abs(d['dragonScreen']['ndc'][1])<1,d)
   await capture('v8-login-visible-dragon.png')
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()');await page.wait_for_timeout(100);await advance(2);r['landscape_first']=await diagnostics();await capture('v8-landscape-login-first.png')
   await advance(.1);await advance(.1);r['landscape_second']=await diagnostics();await capture('v8-landscape-login-second.png')
   await js('__rainy711.resume()');await page.wait_for_timeout(3000);await js('__rainy711.pauseForCapture()');r['landscape_native']=await diagnostics();await capture('v8-landscape-login-native.png')
   for label in ['first','second','native']:
    im=Image.open(OUT/f'v8-landscape-login-{label}.png').convert('RGB');spread=max(ImageStat.Stat(im.crop((80,190,390,360))).stddev);r['landscape_'+label]['scene_spread']=spread
    check('Landscape scene renders '+label,spread>5 and not r['landscape_'+label]['contextLost'],r['landscape_'+label])
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()');await advance(2)
   await js('''()=>{const q=__rainy711;q.missionKey('clear');for(const ch of 'endfield_power')q.missionKey(ch);q.missionSubmit();for(const ch of '5201314')q.missionKey(ch);q.missionSubmit();}''');await advance(6.1);await js('__rainy711.missionVerify();__rainy711.missionLever(1)');await advance(30.1,False)
   for _ in range(20):
    s=await js('__rainy711.mission')
    if s['phase']!='combat':break
    if not s['canAttack']:await advance(max(.8,s.get('combatHoldRemaining',0)+.05),False)
    await js('''()=>{const q=__rainy711,s=q.mission,p=s.meterPeriod;let dt=(p/4-s.meterElapsed%p+p)%p;if(dt<.04)dt+=p;q.tick(q.time+dt,dt,false);q.missionAttack(q.time);}''');await advance(.8,False)
   await page.wait_for_function('__rainy711.xaihi?.loaded');await until('rewind');await advance(7.1);await text_until('三分鐘');await advance(2)
   r['cctv_wide']=await js('({xaihi:__rainy711.xaihi,camera:__rainy711.camera,oven:__rainy711.microwave})');await capture('v8-cctv-xaihi-reviewed.png')
   check('CCTV uses uploaded Xaihi',r['cctv_wide']['xaihi']['loaded'] and r['cctv_wide']['xaihi']['visible'])
   await text_until('PHP');await advance(2);await capture('v8-cctv-terminal-reviewed.png')
   await until('heat-demo');await advance(1.7);await capture('v8-cctv-microwave-reviewed.png');await advance(4.4);r['cctv_close']=await js('({xaihi:__rainy711.xaihi,camera:__rainy711.camera,oven:__rainy711.microwave})')
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()');await advance(2)
   r['landscape_heat']=await js('''()=>{const q=__rainy711,p=q.projectPoint(q.microwave.position),b=document.querySelector('.mission-heat').getBoundingClientRect();return {camera:q.camera,ovenScreen:{x:(p[0]+1)*innerWidth/2,y:(1-p[1])*innerHeight/2,z:p[2]},panel:{left:b.left,top:b.top,width:b.width,height:b.height}};}''')
   d=r['landscape_heat'];check('Landscape microwave stays left of interaction panel',d['ovenScreen']['x']<d['panel']['left'] and 0<d['ovenScreen']['x']<844 and 0<d['ovenScreen']['y']<390,d)
   await capture('v8-cctv-heat-landscape-reviewed.png')
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()');await advance(2)
   await js('__rainy711.missionHeatStart()');await advance(2.4);await capture('v8-cctv-player-reviewed.png');await js('__rainy711.missionHeatStop()')
   check('Reviewed microwave interaction reaches success',await js('__rainy711.mission.phase')=='flashback-end')
   check('No page errors',not r['errors'],r['errors'])
  except Exception as e:r['failure']=str(e);raise
  finally:r['passed']=not r.get('failure') and all(x['passed'] for x in r['checks']);(OUT/'v8-visual-results.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');await b.close()
 print(json.dumps({'passed':r['passed'],'checks':len(r['checks'])}))
if __name__=='__main__':asyncio.run(main())
