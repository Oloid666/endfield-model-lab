"""V9 production-build integration checks in desktop Chromium/SwiftShader.

The QA scene clock advances the real app between real DOM interactions. The
ending observation is additionally measured in real wall-clock time. Neither
mobile-sized viewports nor synthetic touch input are an iPhone benchmark.
"""
import asyncio,json,math,os,time,re
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4204/endfield-model-lab/')
OBSERVE=float(os.environ.get('END_OBSERVE_SECONDS','60'))
CAPTURE=os.environ.get('V9_CAPTURE','1')!='0'
RESULT_FILE=os.environ.get('V9_RESULT_FILE','v9-browser-results.json')

async def main():
 OUT.mkdir(exist_ok=True)
 result={'url':URL,'browser':'Desktop Chromium / SwiftShader','real_iphone_test':False,
         'viewport':[390,844],'deterministic_scene_clock':True,'checks':[]}
 errors=[]
 def check(name,ok,detail=None):
  result['checks'].append({'name':name,'passed':bool(ok),'detail':detail})
  print(name,'PASS' if ok else 'FAIL',flush=True)
  assert ok,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
   args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,
   is_mobile=True,has_touch=True,reduced_motion='no-preference')
  page=await context.new_page();page.set_default_timeout(90000)
  await page.add_init_script('''window.__qaLoadingStages=[];new MutationObserver(()=>{const el=document.querySelector('#loading-message');if(el){const text=el.textContent;if(text&&window.__qaLoadingStages.at(-1)!==text&&window.__qaLoadingStages.length<160)window.__qaLoadingStages.push(text);}}).observe(document,{subtree:true,childList:true,characterData:true});''')
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def state():return await js('__rainy711.mission')
  async def props():return await js('({oven:__rainy711.microwave,grid:__rainy711.tianshi,board:__rainy711.connectionStage,xaihi:__rainy711.xaihi})')
  async def advance(seconds,render=True):
   return await js('''({seconds,render})=>{const q=__rainy711,start=q.time,n=Math.max(1,Math.ceil(seconds*60));
    for(let i=1;i<=n;i++)q.tick(start+seconds*i/n,seconds/n,render&&i===n);return q.mission;}''',{'seconds':seconds,'render':render})
  async def until(phases):
   return await js('''phases=>{const q=__rainy711;let n=0;while(!phases.includes(q.mission.phase)&&n++<260){
    const before=q.mission.phase+':'+q.mission.nodeId+':'+q.mission.revealed;q.missionNext();
    const after=q.mission.phase+':'+q.mission.nodeId+':'+q.mission.revealed;
    if(before===after)throw Error('Manual scene cannot advance from '+q.mission.phase);}
    if(!phases.includes(q.mission.phase))throw Error('Cannot reach '+phases+' from '+q.mission.phase);
    q.tick(q.time+.001,.001,false);return q.mission;}''',phases)
  async def text_until(fragment):
   return await js('''fragment=>{const q=__rainy711;let n=0;while(!q.mission.text.includes(fragment)&&n++<130)q.missionNext();
    if(!q.mission.text.includes(fragment))throw Error('Missing dialogue '+fragment+' in '+q.mission.phase);
    q.tick(q.time+.001,.001,false);return q.mission;}''',fragment)
  async def to_meter(value=.5,render=False):
   return await js('''({value,render})=>{const q=__rainy711,s=q.mission,c=s.meterPeriod;
    let offset=(value*c/2-s.meterElapsed%c+c)%c;if(offset<.04)offset+=c;
    q.tick(q.time+offset,offset,render);return q.mission;}''',{'value':value,'render':render})
  async def attack_ready():
   for _ in range(150):
    s=await state()
    if s['phase'] not in ['combat','aim-final'] or s['canAttack']:return s
    await advance(.08,False)
   raise AssertionError('Attack stayed disabled '+str(await state()))
  async def shot(center=.5,touch=False):
   await attack_ready();await to_meter(center,touch)
   if touch:await page.locator('.mission-attack').tap()
   else:await js('__rainy711.missionAttack(__rainy711.time)')
   return await state()
  async def capture(name,allow_smoke=False):
   if not CAPTURE:return
   await page.screenshot(path=str(OUT/name),timeout=120000)
   im=Image.open(OUT/name).convert('RGB');w,h=im.size
   spread=max(ImageStat.Stat(im.crop((int(w*.1),int(h*.18),int(w*.9),int(h*.72)))).stddev)
   smoke=await js('__rainy711.effects?.smoke||0')
   check('Actual rendered image '+name,spread>12 or (allow_smoke and smoke>0 and spread>1),
         {'spread':round(spread,2),'pooledSmoke':smoke})
  async def framebuffer(label):
   check(label,await js('document.querySelector("#scene canvas").getContext("webgl2").getError()')==0)
  async def fits(label):
   check(label,await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'))
  async def visible_buttons(label,selector):
   bounds=await page.locator(selector).evaluate_all('''nodes=>nodes.filter(e=>e.getClientRects().length).map(e=>{const b=e.getBoundingClientRect();return {text:e.textContent,w:b.width,h:b.height,x:b.x,y:b.y};})''')
   check(label,bool(bounds) and all(b['h']>=43.5 and b['w']>=43.5 for b in bounds),bounds)
  cdp=await context.new_cdp_session(page)
  async def touch_start(x,y):await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
  async def touch_move(x,y):await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y}]})
  async def touch_end():await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
  async def touch_cancel():await cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
  async def hold_heat(seconds,cancel=False):
   b=await page.locator('.mission-heat-hold').bounding_box();assert b,'Missing heat button'
   await touch_start(b['x']+b['width']/2,b['y']+b['height']/2)
   await advance(seconds,False)
   if cancel:await touch_cancel()
   else:await touch_end()
   await advance(.001)
   return await state()
  try:
   await page.goto(URL,wait_until='networkidle')
   await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000)
   await js('__rainy711.pauseForCapture()')
   result['assets']=await js("[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(n=>n.src||n.href)")
   check('Original Zhuang model and bones load',await js('__rainy711.bonesSupported'))
   check('One WebGL canvas retained',await page.locator('canvas').count()==1)
   result['loading_stages']=await js('window.__qaLoadingStages')
   check('Shader preparation uses phase text instead of a fake percentage',not any('%' in value for value in result['loading_stages'] if '準備' in value),result['loading_stages'])
   check('Known model download percentages stay within 0 to 100',all(0<=int(percent)<=100 for value in result['loading_stages'] for percent in re.findall(r'(\d+)%',value)),result['loading_stages'])
   result['initial_warmup']=await js('__rainy711.warmup')
   check('Initial scene shader preparation completed on one renderer',result['initial_warmup']['pending']==0 and 'scene' in result['initial_warmup']['completed'] and result['initial_warmup']['programs']>0 and not result['initial_warmup']['error'],result['initial_warmup'])
   await fits('Portrait page fits viewport')
   check('Rejected experiment area removed',await page.locator('.playground-entry,.playground-modal,.lab-card').count()==0)
   check('Opening is unlimited model inspection',(await state())['phase']=='ready')
   await advance(45,False);check('Opening does not start itself',(await state())['phase']=='ready')
   initial=await js('__rainy711.destruction');oven=(await props())['oven'];arc_samples=[oven['arcs']]
   # The exposed arc intentionally flickers. Observe several real scene states
   # rather than requiring a random instant to be the lit half of the cycle.
   for _ in range(12):
    await advance(.1,False);arc_samples.append((await props())['oven']['arcs'])
   check('Opening oven is already charred and energized',oven['charred']>.8 and oven['warming'] and max(arc_samples)>0,{'oven':oven,'arc_samples':arc_samples})
   garden0=await js('__rainy711.garden');await advance(.7,False);garden1=await js('__rainy711.garden')
   check('Pear petal geometry drifts outside its planted corner',garden1['driftingPetals']>0 and garden1['fallingPetals']<=garden1['petalPool'] and garden0['petalBounds']!=garden1['petalBounds'] and garden1['escapedPetals']>0,{'before':garden0,'after':garden1})
   await js('__rainy711.frameView("pear")');await advance(.1);await capture('v9-pear-drift.png')
   await js('__rainy711.frameView("store")');await advance(.02)
   await capture('v9-opening-microwave.png');await framebuffer('Opening framebuffer clean')
   await page.locator('.mission-launch').click()
   for index,meal in enumerate(['A','B','C']):
    if index:await js('__rainy711.missionReplay()')
    await until(['choice'])
    check('Three dinner choices '+meal,await page.locator('.mission-choice[data-choice]').count()==3)
    if not index:
     await advance(35,False);check('Dinner choices never auto-select',(await state())['phase']=='choice')
    await page.locator('.mission-choice[data-choice="'+meal+'"]').click();await advance(.01,False)
    check('Meal model changes '+meal,await js('__rainy711.idle.dinner')==meal)
   await text_until('二樓那間房');await advance(1.8);await capture('v9-server-closeup.png')
   await text_until('IP 追到了');await advance(1.1)
   comm=page.locator('.mission-comm-portrait')
   background=await comm.evaluate('(e)=>getComputedStyle(e).backgroundImage')
   check('Approved illustrated Mifu portrait replaces SVG placeholder',await comm.is_visible() and 'mifu-portrait-a-source' in background and await comm.locator('svg').count()==0,background)
   await capture('v9-communication.png')
   await text_until('立案查辦');check('Approved patrol line is present','移交巡衛隊' in (await state())['text'])
   await text_until('少女可以');check('Quote keeps dramatic typography',await page.locator('.mission-panel.is-evidence').count()==1)
   await js('__rainy711.missionNext();__rainy711.missionNext()');check('Zhuang response keeps angry emphasis',await page.locator('.mission-panel.is-angry').count()==1)
   await text_until('ChatGPT');check('Dragon breaks fourth wall about production cost',(await state())['speaker']=='dragon')
   await until(['login']);await advance(.5)
   check('Login waits for account input',(await state())['connection']['field']=='account')
   check('Physical keyboard is visible',(await props())['board']['visible'])
   await visible_buttons('Keyboard keys are touch sized','.mission-key')
   await fits('Login remains inside portrait viewport')
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()');await advance(2)
   await visible_buttons('Landscape keyboard retains touch sized keys','.mission-key')
   await fits('Landscape login remains inside viewport')
   check('Landscape keyboard has a bounded local scroll panel',await page.locator('.mission-connect').evaluate('(e)=>{const b=e.getBoundingClientRect();return b.top>=75&&b.bottom<=innerHeight&&e.scrollHeight>=e.clientHeight;}'))
   await capture('v9-login-landscape.png')
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()');await advance(2)
   before=await state();await advance(45,False);check('Login has no countdown',(await state())['phase']=='login' and (await state())['connection']['value']==before['connection']['value'])
   await page.locator('.mission-key[data-key="z"]').tap();await page.locator('.mission-login-submit').tap()
   check('Incorrect account gets recoverable feedback',bool((await state())['connection']['error']) and (await state())['phase']=='login')
   await page.locator('.mission-key[data-key="backspace"]').tap()
   check('Backspace corrects input',(await state())['connection']['value']=='')
   await page.locator('.mission-prompt-replay').tap();check('Replay prompt does not submit account',(await state())['phase']=='login')
   dragon0=await js('__rainy711.dragonPosition')
   await page.locator('.mission-key[data-key="e"]').tap();await advance(.12)
   dragon1=await js('__rainy711.dragonPosition');board=(await props())['board']
   check('Key press drives a physical key and Dragon hop',board['lastKey']=='e' and board['keyNumber']>0 and math.dist(dragon0,dragon1)>.01,{'board':board,'before':dragon0,'after':dragon1})
   await capture('v9-login-keyboard.png')
   for key in 'ndfield_power':await page.locator('.mission-key[data-key="'+key+'"]').tap();await advance(.08,False)
   check('Full dictated account enters keyboard',(await state())['connection']['value']=='endfield_power')
   await page.locator('.mission-login-submit').tap()
   check('Account advances to password',(await state())['connection']['field']=='password' and (await state())['connection']['account']=='endfield_power')
   await advance(30,False);check('Password waits without auto-fill',(await state())['connection']['value']=='')
   for key in '5201314':await page.locator('.mission-key[data-key="'+key+'"]').tap();await advance(.08,False)
   await page.locator('.mission-login-submit').tap()
   check('Correct local credentials reach CAPTCHA',(await state())['phase']=='captcha')
   check('CAPTCHA joke gets reading time',not (await state())['connection']['captchaReady'])
   await advance(6.1);await capture('v9-captcha.png')
   check('CAPTCHA remains a local user decision',(await state())['phase']=='captcha' and (await state())['connection']['captchaReady'])
   await advance(20,False);check('CAPTCHA does not auto-complete',(await state())['phase']=='captcha')
   await page.locator('.mission-captcha-check').tap();await advance(.01)
   check('Checkbox advances to lever',(await state())['phase']=='lever' and (await state())['connection']['verified'])
   track=await page.locator('.mission-lever-track').bounding_box();assert track
   y=track['y']+track['height']/2;x0=track['x']+20;x1=track['x']+track['width']-5
   await touch_start(x0,y);await touch_move(x0+(x1-x0)*.3,y);await touch_cancel();await advance(.01)
   check('Canceled lever drag does not connect grid',(await state())['phase']=='lever' and (await state())['charge']==0)
   track=await page.locator('.mission-lever-track').bounding_box();y=track['y']+track['height']/2;x0=track['x']+20;x1=track['x']+track['width']-3
   await touch_start(x0,y);await touch_move(x0+(x1-x0)*.6,y);await advance(.1)
   await capture('v9-lever.png');await touch_move(x1,y);await touch_end();await advance(.01)
   check('Real right drag starts charging',(await state())['phase']=='charge')
   await advance(2.5);grid=(await props())['grid']
   check('Multiple real pylons activate',grid['activePylons']>=2 and len(grid['positions'])>=4,grid)
   check('Pylons have four visible green energy columns',grid['energyColumns']==4 and grid['greenHalos']==4 and grid['emission']>1,grid)
   await capture('v9-pylons.png')
   frozen=(await state())['phaseElapsed'];await js('__rainy711.missionPause(true)');await advance(6,False)
   check('Pause freezes charging clock',abs((await state())['phaseElapsed']-frozen)<.01)
   await js('__rainy711.missionPause(false)')
   beats=[]
   for mark,expected,image_name in [(6,'charge-pylon-one','v9-pylon-closeup.png'),(11,'charge-city-array','v9-pylon-array.png'),(17,'charge-caster-face','v9-charge-face.png'),(23,'charge-pylon-two','v9-second-pylon.png'),(28,'charge-battle-wide','v9-charge-wide.png')]:
    await advance(max(.01,mark-(await state())['phaseElapsed']))
    beat=await js('__rainy711.cinematic.cameraBeat');beats.append(beat)
    check('Charge camera beat '+expected,beat==expected,await js('__rainy711.cinematic'))
    await capture(image_name)
   result['charge_camera_beats']=beats
   check('Charge uses airborne actual model',await js('__rainy711.idle.cinematic.lift')>1)
   await advance(max(.01,29.99-(await state())['phaseElapsed']),False)
   check('Charge retains full thirty effective seconds',(await state())['phase']=='charge')
   await advance(.03);check('Charge reaches cannon gameplay',(await state())['phase']=='combat')
   check('Three cannon output modes retained',await page.locator('.mission-output[data-output]').count()==3)
   modes=[]
   for button in await page.locator('.mission-output[data-output]').all():await button.tap();modes.append((await state())['meterPeriod'])
   check('Output changes actual timing risk',len(set(modes))==3,modes)
   await page.locator('.mission-output[data-output="steady"]').tap()
   before=(await state())['progress'];miss=await shot(.01)
   check('Edge MISS causes no damage',miss['feedback']['result']=='miss' and miss['progress']==before)
   await advance(.8,False);result['programs_before_first_hit']=await js('__rainy711.warmup.programs');hit=await shot(.5,True);await advance(.08);result['programs_after_first_hit']=await js('__rainy711.warmup.programs')
   check('Real center touch damages and recoils',hit['progress']>before and await js('__rainy711.idle.cinematic.recoil')>0)
   await capture('v9-cannon-muzzle.png');await advance(.17)
   effect=await js('__rainy711.effects');camera=await js('__rainy711.cinematic')
   check('A cannon hit creates a broad pooled shockwave',effect.get('shock',0)>0 and effect.get('maxImpactRadius',0)>0,effect)
   check('A cannon hit creates visible camera impact',camera.get('shakeEnvelope',0)>0,camera)
   await capture('v9-cannon-impact.png',allow_smoke=True)
   await advance(.40);await capture('v9-cannon-cloud.png',allow_smoke=True)
   await advance(.62)
   grown=await js('__rainy711.effects');garden=await js('__rainy711.garden')
   check('Impact wave expands across six metres',grown.get('maxImpactRadius',0)>=6,grown)
   check('Cannon gust lifts only a budgeted portion of pear petals',garden['trees']==3 and garden['gustPetals']>0 and garden['fallingPetals']<=garden['petalPool'],garden)
   await capture('v9-cannon-wide-wave.png',allow_smoke=True)
   await advance(.33);check('First hit removes actual glass',await js('__rainy711.destruction.visibleIntact')<initial['visibleIntact'])
   # Camera gestures must not become cannon input.
   before_drag=(await state())['shots']
   await touch_start(150,330);await touch_move(235,355);await touch_end()
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':140,'y':310},{'x':240,'y':330}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':115,'y':300},{'x':265,'y':345}]})
   await touch_cancel();check('Orbit and canceled pinch do not shoot',(await state())['shots']==before_drag)
   reset_before=await state();await page.locator('.mission-camera-reset').tap();await advance(1)
   reset_after=await state();check('One tap restores camera without resetting mission',all(reset_before[k]==reset_after[k] for k in ['phase','progress','shots','branch']),{'before':reset_before,'after':reset_after})
   await visible_buttons('Camera reset remains touch sized','.mission-camera-reset')
   await advance(14,False)
   await shot(.5);await advance(.8,False);await shot(.5);await advance(.7)
   sign=await js('__rainy711.destruction.sign')
   check('Original sign is torn free and airborne',sign['started'] and sign['active'] and not sign['landed'] and sign['originalMesh'],sign)
   check('Sign camera moment holds further cannon input',not (await state())['canAttack'])
   await capture('v9-sign-airborne.png');await advance(2.2);await capture('v9-sign-fall.png');await advance(1.6)
   sign=await js('__rainy711.destruction.sign');check('Sign lands and remains in rubble',sign['landed'] and sign['visible'] and sign['impactRevision']>0,sign)
   await capture('v9-sign-landed.png')
   for _ in range(30):
    if (await state())['phase']!='combat':break
    await attack_ready();await shot(.5);await advance(.08,False)
   check('Cannon depletion enters new energy dialogue',(await state())['phase']=='energy' and (await state())['progress']==99)
   await advance(3.0)
   main_snapshot=await js('({mission:__rainy711.mission,damage:__rainy711.destruction})')
   check('Store demolished but server survives',main_snapshot['damage']['visibleIntact']==0 and main_snapshot['damage']['serverAlive'] and main_snapshot['damage']['products']['visible']>0)
   await text_until('VCR');await capture('v9-energy-vcr.png');await page.wait_for_function('__rainy711.xaihi?.loaded',timeout=120000);await until(['rewind'])
   await advance(2);rew=await js('({m:__rainy711.mission,d:__rainy711.destruction})')
   check('Rewind preserves logical mission damage',rew['m']['progress']==99 and rew['d']['progress']==99 and rew['d']['presentation']=='rewind',rew)
   check('Rewind has visible VCR controls',await page.locator('.mission-vcr').is_visible() and 'REW' in await page.locator('.mission-vcr').inner_text())
   check('Rewind shows two tape reels and a frame timeline',await page.locator('.mission-vcr-reel').count()==2 and await page.locator('.mission-vcr-timeline').is_visible())
   before_rewind=(await state())['rewindProgress'];rewind_style=await page.locator('.mission-vcr').evaluate('(e)=>[e.style.getPropertyValue("--rewind-progress"),e.querySelector(".mission-vcr-reel").style.transform,e.querySelector(".mission-vcr-timecode").textContent]')
   await js('__rainy711.missionPause(true)');await advance(2,False)
   check('Rewind pauses its scene and timeline',abs((await state())['rewindProgress']-before_rewind)<.001)
   rewind_after=await page.locator('.mission-vcr').evaluate('(e)=>[e.style.getPropertyValue("--rewind-progress"),e.querySelector(".mission-vcr-reel").style.transform,e.querySelector(".mission-vcr-timecode").textContent]')
   check('Paused tape art freezes with the story clock',rewind_style==rewind_after,{'before':rewind_style,'after':rewind_after})
   await capture('v9-rewind-paused.png');await js('__rainy711.missionPause(false)')
   await capture('v9-rewind.png');await advance(5.1)
   check('Seven-second rewind reaches flashback',(await state())['phase']=='flashback')
   await page.wait_for_function('__rainy711.xaihi?.loaded',timeout=120000);await advance(.1)
   scene=await props()
   result['xaihi_warmup']=await js('__rainy711.warmup')
   check('Lazy Xaihi shaders also prepare before VCR','xaihi' in result['xaihi_warmup']['completed'] and not result['xaihi_warmup']['error'],result['xaihi_warmup'])
   check('Uploaded Xaihi is loaded and rendered in VCR',scene['xaihi']['loaded'] and scene['xaihi']['visible'] and scene['xaihi']['bones']>500,scene['xaihi'])
   check('Flashback presents intact shop without resetting damage',await js('__rainy711.destruction.presentation')=='flashback' and (await state())['progress']==99)
   pose0=scene['xaihi']['pose'];await text_until('三分鐘');await advance(1.4);await capture('v9-xaihi-cctv.png')
   await text_until('PHP');await advance(1.2);pose1=(await props())['xaihi']['pose']
   check('Xaihi actual skeleton changes during performance',pose0!=pose1,{'before':pose0,'after':pose1})
   await until(['heat-demo']);await advance(1.7);demo_indices=[(await state())['heat']['demoIndex']];await capture('v9-heat-demo.png');await advance(2.0,False);demo_indices.append((await state())['heat']['demoIndex']);await advance(2.4)
   check('Two scripted failures lead to player heating',(await state())['phase']=='heat' and set(demo_indices)=={0,1},demo_indices)
   await visible_buttons('Heating control is touch sized','.mission-heat-hold')
   check('Heating shows a three-pulse progress guide',await page.locator('.mission-heat-step').count()==3)
   check('Heating has a visible release window',await page.locator('.mission-heat-meter').is_visible())
   check('Heating starts with three independent pulses',(await state())['heat']['completed']==0 and (await state())['heat']['round']==0)
   held=await hold_heat(.35)
   check('Too-short heating actually fails',held['phase']=='heat' and held['heat']['status']=='cold',held['heat'])
   await page.locator('.mission-heat-retry').tap();check('Cold failure retries locally',(await state())['heat']['status']=='ready' and (await state())['progress']==99)
   burned=await hold_heat(2.0)
   check('Excess heating burns the meal',burned['phase']=='heat' and burned['heat']['status']=='burnt',burned['heat'])
   await page.locator('.mission-heat-retry').tap();check('Burn retry resets calibration',(await state())['heat']['completed']==0 and (await state())['heat']['round']==0)
   canceled=await hold_heat(.35,True)
   check('Canceled heat gesture is safe',canceled['heat']['status']=='ready' and not canceled['heat']['holding'],canceled['heat'])
   b=await page.locator('.mission-heat-hold').bounding_box();await touch_start(b['x']+b['width']/2,b['y']+b['height']/2);await advance(.4,False)
   await js('__rainy711.missionPause(true)');paused_heat=(await state())['heat'];await advance(5,False)
   check('Pause safely cuts heating and freezes its clock',not (await state())['heat']['holding'] and abs((await state())['heat']['elapsed']-paused_heat['elapsed'])<.01)
   await js('__rainy711.missionPause(false)');await touch_end()
   if (await state())['heat']['status'] in ['cold','burnt']:await page.locator('.mission-heat-retry').tap()
   check('Resume offers a fresh heating attempt',(await state())['heat']['status']=='ready')
   first=await hold_heat(1.25)
   check('First pulse succeeds and waits for another press',first['phase']=='heat' and first['heat']['completed']==1 and first['heat']['status']=='ready',first['heat'])
   await advance(4,False);check('Successful pulse never auto-completes next one',(await state())['heat']['completed']==1 and not (await state())['heat']['holding'])
   failed_second=await hold_heat(.3)
   check('Short second pulse preserves prior success',failed_second['heat']['status']=='cold' and failed_second['heat']['completed']==1,failed_second['heat'])
   await page.locator('.mission-heat-retry').tap();check('Cold retry preserves pulse number',(await state())['heat']['round']==1)
   burned_second=await hold_heat(1.6)
   check('Overheat can fail after a successful pulse',burned_second['heat']['status']=='burnt' and burned_second['heat']['completed']==1,burned_second['heat'])
   await page.locator('.mission-heat-retry').tap();check('Overheat retry starts a new meal',(await state())['heat']['completed']==0)
   await hold_heat(1.25)
   second=await hold_heat(1.0)
   check('Second pulse has a narrower calibrated window',second['phase']=='heat' and second['heat']['completed']==2 and second['heat']['status']=='ready',second['heat'])
   b=await page.locator('.mission-heat-hold').bounding_box();await touch_start(b['x']+b['width']/2,b['y']+b['height']/2);await advance(.35,False);await js('__rainy711.missionPause(true)');await advance(2,False)
   check('Pause retains completed pulses',(await state())['heat']['completed']==2 and not (await state())['heat']['holding'])
   await js('__rainy711.missionPause(false)');await touch_end()
   b=await page.locator('.mission-heat-hold').bounding_box();await touch_start(b['x']+b['width']/2,b['y']+b['height']/2);await advance(.8)
   await capture('v9-player-heat.png');await touch_end();await advance(.01)
   check('Third pulse completes total 0.3 seconds and advances story',(await state())['phase']=='flashback-end' and (await state())['heat']['status']=='won' and (await state())['heat']['completed']==3,(await state())['heat'])
   await text_until('極速保溫');await advance(1);await capture('v9-warming-reveal.png')
   check('Forgotten warming mode remains visibly active',(await props())['oven']['warming'])
   await until(['return']);await advance(3.1)
   check('VCR returns to final dialogue',(await state())['phase']=='last')
   restored=await js('({m:__rainy711.mission,d:__rainy711.destruction})')
   check('VCR restores original progress meal energy and shot count',all(restored['m'][k]==main_snapshot['mission'][k] for k in ['progress','branch','energy','shots','hits','output']),{'before':main_snapshot['mission'],'after':restored['m']})
   check('VCR restores real rubble and surviving server',restored['d']['presentation']=='present' and restored['d']['serverAlive'] and restored['d']['visibleIntact']==0 and restored['d']['products']['visible']==main_snapshot['damage']['products']['visible'],restored['d'])
   check('Xaihi leaves present-day scene',not (await props())['xaihi']['visible'])
   await text_until('伺服器呢');await advance(.5);await capture('v9-returned-ruins.png');await until(['aim-final'])
   await shot(.01);check('Final MISS waits for player',(await state())['phase']=='aim-final')
   await advance(.8,False);await capture('v9-final-shot-ui.png');await shot(.5,True)
   check('Player triggers dragon finisher',(await state())['phase']=='finisher')
   await advance(3.6);await capture('v9-dragon-flight.png');await advance(1.4)
   await capture('v9-finisher-first-flash.png',allow_smoke=True);await advance(.6)
   await capture('v9-finisher-broad-impact.png',allow_smoke=True);await advance(1.2)
   check('Final shot destroys server and neighbor',not await js('__rainy711.destruction.serverAlive') and await js('__rainy711.destruction.neighbor.hit'))
   await capture('v9-neighbor-impact.png',allow_smoke=True);await advance(2.3)
   check('Nine-second flight reaches landing',(await state())['phase']=='landing')
   await advance((await state())['landingDuration']+.1)
   check('Landing enters continuous ending tour',(await state())['phase']=='tour')
   await advance(2);await capture('v9-tour-dragon.png');await advance(5);await capture('v9-tour-ruins.png');await advance(6)
   check('Ending uses actual facial smile pose',await js('__rainy711.idle.smile')>.5,await js('__rainy711.poseData.smileCorners'))
   await capture('v9-tour-smile.png')
   await advance(3.2)
   check('Tour completes mission at 100 percent',(await state())['phase']=='complete' and (await state())['progress']==100)
   check('Dragon remains stuck after mission',await js('__rainy711.cinematic.dragonStuck'))
   await framebuffer('Completed framebuffer clean')
   if OBSERVE>0:
    start=time.monotonic();frames=await js('__rainy711.renders');pose=await js('__rainy711.poseData.head');await js('__rainy711.resume()')
    while time.monotonic()-start<OBSERVE:await page.wait_for_timeout(min(5000,max(100,(OBSERVE-(time.monotonic()-start))*1000)))
    seconds=time.monotonic()-start;added=await js('__rainy711.renders')-frames;after=await js('__rainy711.poseData.head');await js('__rainy711.pauseForCapture()')
    result['ending_observation']={'seconds':round(seconds,2),'frames':added,'software_render_fps':added/seconds}
    check('Ending stays alive for real observation',seconds>=OBSERVE and added>0 and pose!=after,result['ending_observation'])
   else:result['ending_observation']={'skipped':True}
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()');await advance(2)
   await fits('Landscape page fits viewport');await capture('v9-landscape.png')
   for _ in range(3):await js('__rainy711.missionReplay()')
   await advance(.1);reset=await js('__rainy711.destruction')
   check('Replay repairs shop server sign neighbor',reset['progress']==0 and reset['serverAlive'] and reset['visibleIntact']==initial['visibleIntact'] and not reset['sign']['started'] and not reset['neighbor']['hit'] and reset['visibleDebris']==0,reset)
   check('Replay keeps one UI and renderer',await page.locator('.mission-shell').count()==1 and await page.locator('canvas').count()==1 and await page.locator('.playground-entry').count()==0)
   await until(['choice']);await page.locator('.mission-choice[data-choice=A]').click();await until(['login'])
   check('Replay resets credentials',not (await state())['connection']['value'] and not (await state())['connection']['account'])
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_function('(()=>{const c=document.querySelector("#scene canvas"),d=__rainy711.aa.dpr;return c.width===Math.round(c.clientWidth*d)&&c.height===Math.round(c.clientHeight*d);})()');await advance(.1)
   await js('window.qaLoss=document.querySelector("#scene canvas").getContext("webgl2").getExtension("WEBGL_lose_context");qaLoss.loseContext()')
   await page.locator('#error').wait_for(state='visible');check('Context loss presents recovery prompt',True)
   await js('qaLoss.restoreContext()');await page.locator('#error').wait_for(state='hidden');await js('__rainy711.pauseForCapture();__rainy711.tick(__rainy711.time+.1,.1)')
   await framebuffer('Restored context framebuffer clean')
   check('Context restore retains one prepared renderer',await page.locator('canvas').count()==1 and 'scene' in (await js('__rainy711.warmup'))['completed'])
   check('No JavaScript or shader errors',not errors,errors)
   result['passed']=True
  except Exception as exc:
   result['passed']=False;result['failure']=str(exc)
   try:result['last_state']=await state();result['last_props']=await props();result['last_damage']=await js('__rainy711.destruction')
   except Exception:pass
   raise
  finally:
   result['errors']=errors;(OUT/RESULT_FILE).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');await browser.close()
 print(json.dumps({'passed':result['passed'],'checks':len(result['checks']),'ending_observation':result.get('ending_observation'),'errors':errors},ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
