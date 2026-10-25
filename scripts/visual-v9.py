"""Final V9 visual checks on the production build; desktop SwiftShader, not iPhone."""
import asyncio,json,os
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4204/endfield-model-lab/')
async def main():
 r={'url':URL,'browser':'Desktop Chromium / SwiftShader','real_iphone_test':False,'checks':[],'errors':[]}
 def check(name,ok,detail=None):
  r['checks'].append({'name':name,'passed':bool(ok),'detail':detail});print(name,'PASS' if ok else 'FAIL',flush=True)
  assert ok,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='no-preference')
  page=await context.new_page();page.set_default_timeout(180000)
  def observe_page(pg):
   pg.on('pageerror',lambda e:r['errors'].append(str(e)))
   pg.on('console',lambda m:r['errors'].append(m.text) if m.type=='error' else None)
  observe_page(page)
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def state():return await js('__rainy711.mission')
  async def advance(seconds,render=True):return await js('({seconds,render})=>{const q=__rainy711,t=q.time,n=Math.max(1,Math.ceil(seconds*60));for(let i=1;i<=n;i++)q.tick(t+seconds*i/n,seconds/n,render&&i===n);return q.mission;}',{'seconds':seconds,'render':render})
  async def until(phase):return await js('phase=>{const q=__rainy711;for(let i=0;i<250&&q.mission.phase!==phase;i++)q.missionNext();if(q.mission.phase!==phase)throw Error("Cannot reach "+phase);return q.mission;}',phase)
  async def text_until(text):return await js('text=>{const q=__rainy711;for(let i=0;i<150&&!q.mission.text.includes(text);i++)q.missionNext();if(!q.mission.text.includes(text))throw Error("Missing "+text);return q.mission;}',text)
  async def capture(name):
   # Let the 450ms communication-entry CSS animation settle. This wait never
   # advances the paused deterministic scene clock or changes its camera sample.
   await page.wait_for_timeout(500);await page.screenshot(path=str(OUT/name),timeout=180000)
  async def resize(width,height):
   await page.set_viewport_size({'width':width,'height':height})
   await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()')
   await advance(2)
  async def credentials():
   await js('''()=>{const q=__rainy711;q.missionKey('clear');for(const ch of 'endfield_power')q.missionKey(ch);q.missionSubmit();for(const ch of '5201314')q.missionKey(ch);q.missionSubmit();}''')
   await advance(6.1,False);await js('__rainy711.missionVerify();__rainy711.missionLever(1)')
  async def perfect_shot():
   s=await state()
   if not s['canAttack']:await advance(max(.8,s.get('combatHoldRemaining',0)+.05),False)
   return await js('''()=>{const q=__rainy711,s=q.mission,p=s.meterPeriod;let dt=(p/4-s.meterElapsed%p+p)%p;if(dt<.04)dt+=p;q.tick(q.time+dt,dt,false);return q.missionAttack(q.time);}''')
  async def diagnostics():return await js('''()=>{const q=__rainy711,c=document.querySelector('#scene canvas'),gl=c.getContext('webgl2'),rect=c.getBoundingClientRect(),bounds=e=>{const b=e.getBoundingClientRect();return {left:b.left,top:b.top,width:b.width,height:b.height,bottom:b.bottom};},project=p=>{const v=q.projectPoint(p);return {ndc:v,x:rect.x+(v[0]+1)*rect.width/2,y:rect.y+(1-v[1])*rect.height/2};};return {camera:q.camera,cinematic:q.cinematic,hero:q.heroPosition,dragon:q.dragonPosition,dragonScreen:project(q.dragonPosition),heroScreen:project(q.heroPosition),canvas:{buffer:[c.width,c.height],rect:[rect.width,rect.height]},connect:bounds(document.querySelector('.mission-connect')),heat:bounds(document.querySelector('.mission-heat')),drawCalls:q.drawCalls,triangles:q.triangles,error:gl.getError(),contextLost:gl.isContextLost(),inner:[innerWidth,innerHeight],phase:q.mission.phase};}''')
  try:
   await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded');await js('__rainy711.pauseForCapture()')
   r['assets']=await js("[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(e=>e.src||e.href)");r['warmup']=await js('__rainy711.warmup')
   await js('__rainy711.frameView("store")');await advance(.1);await capture('v9-opening-microwave.png')
   check('Opening has charred energized microwave',await js('__rainy711.microwave.charred')>.8)
   await js('__rainy711.missionStart()');await until('choice');await js('__rainy711.missionChoose("A")');await until('login');await advance(2)
   await js('__rainy711.missionKey("e")');await advance(.2);d=await diagnostics();r['portrait_login']=d
   check('Portrait Dragon stays above keyboard',d['dragonScreen']['y']<d['connect']['top'] and abs(d['dragonScreen']['ndc'][0])<1,d)
   await capture('v9-login-visible-dragon.png');await resize(844,390);await capture('v9-landscape-login-reviewed.png')
   image=Image.open(OUT/'v9-landscape-login-reviewed.png').convert('RGB');spread=max(ImageStat.Stat(image.crop((80,190,390,360))).stddev)
   check('Landscape login has a real rendered scene',spread>5,{'spread':spread,'diagnostics':await diagnostics()});await resize(390,844)
   await credentials()
   r['charge_shots']=[]
   for elapsed,expected,name in [(6,'charge-pylon-one','v9-pylon-closeup-reviewed.png'),(11,'charge-city-array','v9-pylon-array-reviewed.png'),(17,'charge-caster-face','v9-charge-face-reviewed.png'),(23,'charge-pylon-two','v9-second-pylon-reviewed.png'),(28,'charge-battle-wide','v9-charge-wide-reviewed.png')]:
    await advance(max(.001,elapsed-(await state())['phaseElapsed']))
    if elapsed==6:
     cdp=await context.new_cdp_session(page)
     await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':220,'y':350}]});await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':275,'y':365}]});await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});await advance(.1)
     check('Manual touch temporarily owns the camera',await js('__rainy711.cinematic.cameraBeat')=='manual')
     before=await state();await page.locator('.mission-camera-reset').tap();await advance(1.6);after=await state()
     check('Camera reset restores this scene without changing story',all(before[k]==after[k] for k in ['phase','branch','progress','shots']),{'before':before,'after':after})
    beat=await js('__rainy711.cinematic.cameraBeat');check('Reviewed shot '+expected,beat==expected,await js('__rainy711.cinematic'))
    r['charge_shots'].append(await diagnostics());await capture(name)
   await advance(max(.001,30.1-(await state())['phaseElapsed']),False)
   r['programs_before_first_hit']=await js('__rainy711.warmup.programs');await perfect_shot();await advance(.08);r['programs_after_first_hit']=await js('__rainy711.warmup.programs');await capture('v9-muzzle-reviewed.png')
   await advance(.17);r['normal_impact']=await js('({fx:__rainy711.effects,camera:__rainy711.cinematic})');await capture('v9-impact-reviewed.png');await advance(.4);await capture('v9-blast-cloud-reviewed.png')
   check('Normal impact has strong camera motion',r['normal_impact']['camera']['shakeEnvelope']>.22 and abs(r['normal_impact']['camera']['cameraRoll'])>0,r['normal_impact'])
   for _ in range(20):
    if (await state())['phase']!='combat':break
    await perfect_shot();await advance(.8,False)
   await page.wait_for_function('__rainy711.xaihi?.loaded');await until('rewind');await advance(2);await capture('v9-rewind-reviewed.png');await advance(5.1);await text_until('PHP');await advance(2);await capture('v9-cctv-terminal-reviewed.png')
   await until('heat-demo');await advance(1.7);await capture('v9-cctv-microwave-reviewed.png');await advance(4.4)
   await resize(844,390);r['landscape_heat']=await js('''()=>{const q=__rainy711,p=q.projectPoint(q.microwave.position),b=document.querySelector('.mission-heat').getBoundingClientRect();return {camera:q.camera,oven:{x:(p[0]+1)*innerWidth/2,y:(1-p[1])*innerHeight/2},panel:{left:b.left,top:b.top,width:b.width,height:b.height}};}''')
   d=r['landscape_heat'];check('Landscape oven stays left of its controls',0<d['oven']['x']<d['panel']['left'] and 0<d['oven']['y']<390,d);await capture('v9-cctv-heat-landscape-reviewed.png');await resize(390,844)
   for index,duration in enumerate([1.25,1,.8]):
    await js('__rainy711.missionHeatStart()');await advance(duration)
    if index==2:
     r['heating_oven']=await js('__rainy711.microwave');await capture('v9-cctv-player-reviewed.png')
    await js('__rainy711.missionHeatStop()')
   check('Three reviewed pulses complete the meal',(await state())['phase']=='flashback-end' and (await state())['heat']['completed']==3)
   check('Microwave fault has a broad core and halo',r['heating_oven']['arcCoreRadius']>=.015 and r['heating_oven']['arcHaloRadius']>r['heating_oven']['arcCoreRadius']*3,r['heating_oven'])
   await until('return');await advance(3.1,False);await until('aim-final');await advance(6.1,False);await perfect_shot();await advance(5.0);r['final_impact_01']=await diagnostics();await capture('v9-finisher-first-flash-reviewed.png');await advance(.6);r['final_impact_07']=await diagnostics();await capture('v9-finisher-broad-impact-reviewed.png')
   check('Finisher impact camera focuses the struck server',r['final_impact_07']['cinematic']['cameraBeat']=='finisher-city-impact',r['final_impact_07'])
   await advance(1.2);await capture('v9-neighbor-impact-reviewed.png');await advance(2.3,False);await advance((await state())['landingDuration']+.1,False);await advance(13);await capture('v9-tour-smile-reviewed.png')
   # A second ordinary browser context checks the native reduced-motion preference.
   reduced=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='reduce');page=await reduced.new_page();page.set_default_timeout(180000);observe_page(page)
   await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded');await js('__rainy711.pauseForCapture();__rainy711.missionStart()');await until('choice');await js('__rainy711.missionChoose("A")');await until('login');await credentials();await advance(30.1,False);await perfect_shot();await advance(.25)
   r['reduced_impact']=await js('({fx:__rainy711.effects,camera:__rainy711.cinematic})');d=r['reduced_impact'];check('Reduced motion suppresses roll and limits camera impact',d['camera']['reducedMotion'] and d['camera']['cameraRoll']==0 and d['camera']['shakeEnvelope']<=.22 and d['fx']['reducedMotion'],d);await capture('v9-reduced-impact-reviewed.png')
   await page.locator('#menu-toggle').click();await page.select_option('#quality','low');await page.locator('#menu-close').click();await advance(.1);r['low_quality']=await js('({fx:__rainy711.effects,garden:__rainy711.garden,oven:__rainy711.microwave,grid:__rainy711.tianshi})');d=r['low_quality']
   check('Low quality applies explicit FX and petal caps',d['fx']['particleLimit']==36 and d['fx']['qualityCaps']['smoke']==4 and d['garden']['driftingPetals']<=20 and d['oven']['arcSegments']==5,d)
   check('Both motion modes retain a single canvas',await page.locator('canvas').count()==1)
   check('No JavaScript or shader errors',not r['errors'],r['errors'])
  except Exception as exc:r['failure']=str(exc);raise
  finally:
   r['passed']=not r.get('failure') and all(x['passed'] for x in r['checks']);(OUT/'v9-visual-results.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');await browser.close()
 print(json.dumps({'passed':r['passed'],'checks':len(r['checks'])}))
if __name__=='__main__':asyncio.run(main())
