"""V6 real desktop Chromium / SwiftShader QA. Not an iPhone device benchmark."""
import asyncio,json,os,time
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4187/')
OBSERVE=float(os.environ.get('END_OBSERVE_SECONDS','60'))

async def main():
 result={'url':URL,'browser':'Desktop Chromium / SwiftShader','viewport':[390,844],
         'real_iphone_test':False,'checks':[]};errors=[]
 def check(name,ok,detail=None):
  result['checks'].append({'name':name,'passed':bool(ok),'detail':detail})
  print(name,'PASS' if ok else 'FAIL',flush=True);assert ok,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,
   args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,
   is_mobile=True,has_touch=True,reduced_motion='reduce')
  page=await context.new_page();page.set_default_timeout(90000)
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def state():return await js('__rainy711.mission')
  async def advance(seconds,render=True):
   return await js('''({seconds,render})=>{const q=__rainy711,start=q.time,steps=Math.max(1,Math.ceil(seconds*60));
    for(let i=1;i<=steps;i++)q.tick(start+seconds*i/steps,seconds/steps,render&&i===steps);
    return q.mission;}''',{'seconds':seconds,'render':render})
  async def until(phases):
   return await js('''phases=>{const q=__rainy711;let steps=0;
    while(!phases.includes(q.mission.phase)&&steps++<220)q.missionNext();
    if(!phases.includes(q.mission.phase))throw Error('Cannot reach '+phases+' from '+q.mission.phase);
    q.tick(q.time+.001,.001,false);return q.mission;}''',phases)
  async def to_meter(value=.5,render=False):
   # Triangle position is derived from mission phase elapsed, not an old rendered frame.
   return await js('''({value,render})=>{const q=__rainy711,s=q.mission,cycle=2.7;
    let offset=(value*1.35-(s.phaseElapsed%cycle)+cycle)%cycle;
    if(offset<.04)offset+=cycle;
    q.tick(q.time+offset,offset,render);return q.mission;}''',{'value':value,'render':render})
  async def capture(name):
   path=OUT/name;await page.screenshot(path=str(path),timeout=120000)
   im=Image.open(path).convert('RGB');w,h=im.size
   spread=max(ImageStat.Stat(im.crop((int(w*.1),int(h*.18),int(w*.9),int(h*.72)))).stddev)
   check('Rendered content '+name,spread>12,round(spread,2))
  async def framebuffer(name):
   code=await js('document.querySelector("#scene canvas").getContext("webgl2").getError()')
   check(name,code==0,code)
  try:
   await page.goto(URL,wait_until='networkidle')
   await page.wait_for_function('window.__rainy711?.actorsLoaded&&window.__rainy711?.mission',timeout=120000)
   await js('__rainy711.pauseForCapture()')
   check('Original actor and skeleton load',await js('__rainy711.bonesSupported'))
   check('Exactly one WebGL canvas',await page.locator('#scene canvas').count()==1)
   aa=await js('__rainy711.aa')
   check('Scene MSAA plus single-sample postprocessing',aa['msaa']>=2 and aa['postSamples']==0 and not aa['postDepth'] and aa['fxaa'],aa)
   check('Glass color and depth source ready',await js('__rainy711.glassReady'))
   check('Portrait fits viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'))
   stock=await js('__rainy711.floorPlan.fridgeStock')
   check('V5 inventory retained',stock['skuCount']==40 and len(stock['bays'])==5)
   garden=await js('__rainy711.garden');check('Pear garden exists',bool(garden),garden)
   await js('__rainy711.frameView("street");__rainy711.tick(__rainy711.time+.01,.01)');await capture('v6-street.png')
   await js('__rainy711.frameView("pear");__rainy711.tick(__rainy711.time+.01,.01)');await capture('v6-pear.png')
   await framebuffer('Initial shaders and framebuffers clean')
   # All meal choices use the actual DOM and create distinct meal props.
   await page.locator('.mission-launch').click();check('Primary mission starts', (await state())['phase']=='intro')
   for index,meal in enumerate(['A','B','C']):
    if index:await js('__rainy711.missionReplay()')
    await until(['choice']);check('Three dinner choices '+meal,await page.locator('.mission-choice[data-choice]').count()==3)
    if not index:
     await advance(90,False);check('Dinner waits indefinitely', (await state())['phase']=='choice')
     await js('__rainy711.tick(__rainy711.time+.01,.01)');await capture('v6-dinner-choice.png')
    await page.locator('.mission-choice[data-choice="'+meal+'"]').click();await advance(.01)
    check('Actual meal prop '+meal,await js('__rainy711.idle.dinner')==meal)
    meal_state=await state();check('Meal reaction '+meal,meal_state['phase']=='meal' and meal_state['branch']==meal)
   # The shared linear briefing leads directly into the full thirty-second charge.
   await until(['charge']);begin=await state();check('Charge starts empty',begin['phaseElapsed']<.1 and begin['charge']<.01,begin)
   charge_lines=[]
   for n in range(4):
    charge_lines.append((await state()).get('node',{}));await advance(3.5,False)
   await js('__rainy711.tick(__rainy711.time+.001,.001)');await capture('v6-charge.png')
   s=await state();elapsed=s['phaseElapsed'];await js('__rainy711.missionPause(true)');await advance(6,False)
   paused=await state();check('Pause freezes charge time',paused['paused'] and abs(paused['phaseElapsed']-elapsed)<.02,paused)
   await js('__rainy711.missionPause(false)')
   for n in range(4):charge_lines.append((await state()).get('node',{}));await advance(3.5,False)
   s=await state();remaining=29.99-s['phaseElapsed']
   if remaining>0:await advance(remaining,False)
   check('Charge does not finish before thirty seconds',(await state())['phase']=='charge',await state())
   await advance(.03);check('Charge enters playable combat at thirty seconds',(await state())['phase']=='combat',await state())
   texts={line.get('text','') for line in charge_lines if isinstance(line,dict)}
   check('Charge dialogue continues throughout',len(texts)>=5,sorted(texts))
   check('Combat exposes meter and attack button',await page.locator('.mission-meter').is_visible() and await page.locator('.mission-attack').is_visible())
   button=await page.locator('.mission-attack').bounding_box();check('Attack touch target at least 44px',button['width']>=44 and button['height']>=44,button)
   intact=await js('__rainy711.destruction');check('Building starts intact',intact['serverAlive'] and intact['visibleIntact']>0 and intact['progress']==0,intact)
   await to_meter(.01);before=await state();await js('__rainy711.missionAttack(__rainy711.time)');after=await state()
   check('Edge MISS preserves progress and energy',after['progress']==before['progress'] and after['energy']==before['energy'],after)
   await advance(.8,False);await to_meter(.5,True)
   await page.locator('.mission-attack').tap();await advance(.05)
   hit=await state();check('Real touch on center causes damage',hit['progress']>0,hit)
   await advance(1.6)
   partial=await js('__rainy711.destruction');check('Hit removes real meshes and leaves debris',partial['progress']>0 and partial['visibleDebris']>0 and partial['visibleIntact']<intact['visibleIntact'],partial)
   await capture('v6-combat.png')
   # Orbit gestures must not count as attack or hotspot input.
   cdp=await context.new_cdp_session(page);progress=hit['progress']
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':150,'y':330}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':235,'y':355}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   check('Drag does not fire',(await state())['progress']==progress)
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':140,'y':310},{'x':240,'y':330}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':115,'y':300},{'x':265,'y':345}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
   check('Pinch and cancellation do not fire',(await state())['progress']==progress)
   # Complete demolition through the same timing judgement used by the button.
   shots=0
   while (await state())['phase']=='combat' and shots<25:
    await advance(.8,False);await to_meter(.5);await js('__rainy711.missionAttack(__rainy711.time)');await advance(.05,False);shots+=1
   check('Combat reaches last-shot scene', (await state())['phase']=='last',{'shots':shots,'state':await state()})
   await advance(3.2)
   rubble=await js('__rainy711.destruction')
   check('Demolition leaves real rubble and the live server',rubble['progress']==99 and rubble['serverAlive'] and rubble['visibleDebris']>0 and rubble['visibleIntact']==0,rubble)
   check('Mission stops at 99 with empty main energy',(await state())['progress']==99 and (await state())['energy']==0)
   await capture('v6-rubble.png');await until(['aim-final'])
   await to_meter(.01);await js('__rainy711.missionAttack(__rainy711.time)')
   check('Final MISS does not launch dragon',(await state())['phase']=='aim-final' and (await state())['progress']==99)
   await advance(.8,False);await to_meter(.5,True);await page.locator('.mission-attack').tap()
   check('Player launches dragon finisher',(await state())['phase']=='finisher',await state())
   await advance(3);check('Finisher does not finish early',(await state())['phase']=='finisher' and (await state())['progress']==99)
   await capture('v6-finale.png');await advance(5.8,False)
   check('Nine-second flight not skipped',(await state())['phase']=='finisher',await state())
   await advance(.25);check('Landing follows dragon flight',(await state())['phase']=='landing',await state())
   await advance(2.8,False);check('Completion waits for landing',(await state())['phase']=='landing' and (await state())['progress']==99)
   await advance(.25);complete=await state();check('Final mission completes at 100',complete['phase']=='complete' and complete['progress']==100,complete)
   dead=await js('__rainy711.destruction');check('Server really stops and stays destroyed',not dead['serverAlive'],dead)
   await capture('v6-complete.png');await framebuffer('Destruction and finisher shaders clean')
   # A real minute in the live ending; no simulated clock or iPhone/FPS claim.
   if OBSERVE>0:
    start=time.monotonic();frames=await js('__rainy711.renders');pose=await js('__rainy711.poseData.head');await js('__rainy711.resume()')
    while time.monotonic()-start<OBSERVE:await page.wait_for_timeout(min(5000,max(100,(OBSERVE-(time.monotonic()-start))*1000)))
    duration=time.monotonic()-start;added=await js('__rainy711.renders')-frames;end_pose=await js('__rainy711.poseData.head')
    await js('__rainy711.pauseForCapture()');result['ending_observation']={'seconds':round(duration,2),'frames':added,'software_render_fps':added/duration}
    check('Ending stays alive for requested real duration',duration>=OBSERVE and added>0 and pose!=end_pose,result['ending_observation'])
   else:result['ending_observation']={'skipped':True}
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500)
   await js('__rainy711.tick(__rainy711.time+.01,.01)');check('Landscape fits viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'));await capture('v6-landscape.png')
   # Repeated replay resets scene state and does not append more event owners/UI.
   for _ in range(3):await js('__rainy711.missionReplay()')
   await advance(.1);reset=await js('__rainy711.destruction')
   check('Replay restores intact shop and server',reset['progress']==0 and reset['serverAlive'] and reset['visibleIntact']==intact['visibleIntact'] and reset['visibleDebris']==0,reset)
   check('Replay resets progress and preserves single UI',(await state())['progress']==0 and await page.locator('.mission-shell').count()==1 and await page.locator('.mission-attack').count()==1)
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(500);await advance(.01)
   await js('window.qaLoss=document.querySelector("#scene canvas").getContext("webgl2").getExtension("WEBGL_lose_context");qaLoss.loseContext()')
   await page.locator('#error').wait_for(state='visible');check('Context loss has recovery prompt',True)
   await js('qaLoss.restoreContext()');await page.locator('#error').wait_for(state='hidden');await js('__rainy711.pauseForCapture();__rainy711.tick(__rainy711.time+.1,.1)')
   check('Context restore retains one canvas and glass',await js('__rainy711.rendererCount===1&&__rainy711.glassReady'))
   await framebuffer('Restored framebuffer clean');check('No JavaScript or shader errors',not errors,errors)
   result['passed']=True
  except Exception as e:
   result['passed']=False;result['failure']=str(e)
   try:result['last_state']=await state();result['last_destruction']=await js('__rainy711.destruction')
   except Exception:pass
   raise
  finally:
   result['errors']=errors;OUT.mkdir(exist_ok=True);(OUT/'v6-browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');await browser.close()
 print(json.dumps({'passed':result['passed'],'checks':len(result['checks']),'ending_observation':result.get('ending_observation'),'errors':errors},ensure_ascii=False))

asyncio.run(main())
