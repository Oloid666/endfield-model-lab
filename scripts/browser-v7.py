"""V7 integration evidence from desktop Chromium/SwiftShader, never an iPhone benchmark.

PREVIEW_URL points to the exact production build, including its repository base.
The scene's QA clock advances deterministic interactions. END_OBSERVE_SECONDS is
an additional real-time ending observation and is recorded separately.
"""
import asyncio,json,math,os,time
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4190/endfield-model-lab/')
OBSERVE=float(os.environ.get('END_OBSERVE_SECONDS','60'))

async def main():
 OUT.mkdir(exist_ok=True)
 result={'url':URL,'browser':'Desktop Chromium / SwiftShader','viewport':[390,844],
         'real_iphone_test':False,'checks':[],'deterministic_scene_clock':True};errors=[]
 def check(name,ok,detail=None):
  result['checks'].append({'name':name,'passed':bool(ok),'detail':detail})
  print(name,'PASS' if ok else 'FAIL',flush=True)
  assert ok,(name,detail)
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
   return await js('''({seconds,render})=>{const q=__rainy711,start=q.time,n=Math.max(1,Math.ceil(seconds*60));
    for(let i=1;i<=n;i++)q.tick(start+seconds*i/n,seconds/n,render&&i===n);return q.mission;}''',{'seconds':seconds,'render':render})
  async def until(phases):
   return await js('''phases=>{const q=__rainy711;let n=0;
    while(!phases.includes(q.mission.phase)&&n++<240)q.missionNext();
    if(!phases.includes(q.mission.phase))throw Error('Cannot reach '+phases+' from '+q.mission.phase);
    q.tick(q.time+.001,.001,false);return q.mission;}''',phases)
  async def to_meter(value=.5,render=False):
   return await js('''({value,render})=>{const q=__rainy711,s=q.mission,cycle=s.meterPeriod;
    let offset=(value*cycle/2-(s.meterElapsed%cycle)+cycle)%cycle;
    if(offset<.04)offset+=cycle;
    q.tick(q.time+offset,offset,render);return q.mission;}''',{'value':value,'render':render})
  async def capture(name):
   await page.screenshot(path=str(OUT/name),timeout=120000)
   im=Image.open(OUT/name).convert('RGB');w,h=im.size
   spread=max(ImageStat.Stat(im.crop((int(w*.1),int(h*.18),int(w*.9),int(h*.72)))).stddev)
   check('Rendered image '+name,spread>12,round(spread,2))
  async def framebuffer(label):
   code=await js('document.querySelector("#scene canvas").getContext("webgl2").getError()')
   check(label,code==0,code)
  try:
   await page.goto(URL,wait_until='networkidle')
   await page.wait_for_function('window.__rainy711?.actorsLoaded&&window.__rainy711?.mission',timeout=120000)
   await js('__rainy711.pauseForCapture()')
   check('Original model and skeleton load',await js('__rainy711.bonesSupported'))
   check('One WebGL canvas retained',await page.locator('canvas').count()==1)
   check('Portrait fits the viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'))
   check('Opening waits for player',(await state())['phase']=='ready')
   opening_text=await page.locator('.mission-shell').inner_text()
   check('Opening tells player to inspect model','雙指' in opening_text and '準備' in opening_text,opening_text)
   await advance(45,False)
   check('Model inspection has no countdown',(await state())['phase']=='ready')
   await js('__rainy711.frameView("detail")');await advance(.01)
   overlap=await js('''()=>{const a=document.querySelector('.playground-entry').getBoundingClientRect();return ['.mission-launch','.mission-inspection','.walk-toggle','.view-dock'].flatMap(s=>{const e=document.querySelector(s);if(!e||!e.getClientRects().length)return [];const b=e.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top?[s]:[];});}''')
   check('Homepage experiment entry clears model and navigation controls',not overlap,overlap)
   await capture('v7-opening.png');await framebuffer('Opening framebuffer clean')
   # Playground is tested on the actual opening before a mission begins.
   await test_playground(page,js,advance,capture,check,result)
   await page.locator('.mission-launch').click()
   check('Player starts dinner scene',(await state())['phase']=='intro')
   for index,meal in enumerate(['A','B','C']):
    if index:await js('__rainy711.missionReplay()')
    await until(['choice'])
    check('Three dinner options retained '+meal,await page.locator('.mission-choice[data-choice]').count()==3)
    if not index:
     await advance(45,False);check('Dinner choice has no countdown',(await state())['phase']=='choice')
    await page.locator('.mission-choice[data-choice="'+meal+'"]').click();await advance(.01)
    check('Distinct model food prop '+meal,await js('__rainy711.idle.dinner')==meal)
   # Stop inside the communication episode to verify its real DOM treatment.
   await js('''()=>{const q=__rainy711;let n=0;while(q.mission.speaker!=='mifoe'&&n++<100)q.missionNext();q.tick(q.time+.001,.001,false);}''')
   check('Mifoe communication reached',(await state())['speaker']=='mifoe')
   comm=page.locator('.mission-comm')
   check('Communication has visible portrait card',await comm.is_visible() and await comm.locator('svg,img').count()>0)
   await advance(.8);await capture('v7-communication.png')
   await js('''()=>{const q=__rainy711;let n=0;while(!q.mission.text.includes('少女可以')&&n++<100)q.missionNext();q.tick(q.time+.001,.001,false);}''')
   check('Quoted profile has special typography',await page.locator('.mission-panel.is-evidence').count()==1)
   await js('__rainy711.missionNext();__rainy711.missionNext()')
   check('Zhuang reply has angry emphasis',await page.locator('.mission-panel.is-angry').count()==1)
   # Thirty effective charge seconds; pause time must not contribute.
   await until(['charge']);initial=await state()
   check('Charge begins at zero',initial['phaseElapsed']<.1 and initial['charge']<.1,initial)
   charge_lines=[]
   for _ in range(4):charge_lines.append((await state()).get('text'));await advance(3.5,False)
   await advance(.001);await capture('v7-charge.png')
   frozen=(await state())['phaseElapsed'];await js('__rainy711.missionPause(true)');await advance(6,False)
   check('Pause freezes charge',abs((await state())['phaseElapsed']-frozen)<.01)
   await js('__rainy711.missionPause(false)')
   for _ in range(4):charge_lines.append((await state()).get('text'));await advance(3.5,False)
   remain=29.99-(await state())['phaseElapsed']
   if remain>0:await advance(remain,False)
   check('Charge waits full thirty seconds',(await state())['phase']=='charge')
   await advance(.03)
   check('Charge enters playable combat',(await state())['phase']=='combat')
   check('Charge dialogue continues',len(set(charge_lines))>=5,charge_lines)
   check('Attack is touch friendly',(await page.locator('.mission-attack').bounding_box())['height']>=44)
   mode_buttons=page.locator('.mission-output[data-output]')
   check('Three output choices exposed',await mode_buttons.count()==3)
   mode_states=[]
   for button in await mode_buttons.all():
    await button.click();mode_states.append(await state())
   check('Output modes change risk or timing',len({(s.get('output'),s.get('meterPeriod'),str(s.get('meterProfile'))) for s in mode_states})==3,mode_states)
   # Use the safest first mode for a clean center/edge comparison.
   await mode_buttons.first.click();intact=await js('__rainy711.destruction')
   await to_meter(.01);before=await state();await js('__rainy711.missionAttack(__rainy711.time)');miss=await state()
   check('Edge is MISS and causes no damage',miss['progress']==before['progress'] and miss['feedback']['result']=='miss',miss)
   await advance(.8,False);await to_meter(.5,True);await page.locator('.mission-attack').tap();await advance(.05)
   recoil=await js('({director:__rainy711.cinematic,actor:__rainy711.idle.cinematic})')
   check('Shot moves actual casting body',recoil['actor'].get('recoil',0)>0,recoil)
   hit=await state();check('Real touch at center damages building',hit['progress']>0 and hit['feedback']['result']!='miss',hit)
   await advance(1.9)
   partial=await js('__rainy711.destruction')
   check('Hit removes real building meshes and sprays debris',partial['visibleDebris']>0 and partial['visibleIntact']<intact['visibleIntact'],partial)
   await capture('v7-combat.png')
   cdp=await context.new_cdp_session(page);before_drag=(await state())['shots']
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':150,'y':330}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':235,'y':355}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':140,'y':310},{'x':240,'y':330}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':115,'y':300},{'x':265,'y':345}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchCancel','touchPoints':[]})
   check('Orbit, pinch and cancel do not fire',(await state())['shots']==before_drag)
   periods=[];shots=0
   while (await state())['phase']=='combat' and shots<35:
    await advance(.8,False);periods.append((await state())['meterPeriod']);await to_meter(.5)
    await js('__rainy711.missionAttack(__rainy711.time)');await advance(.03,False);shots+=1
   check('Player damage reaches last-shot dialogue',(await state())['phase']=='last',{'shots':shots,'state':await state()})
   check('Combat timing varies with progress',len(set(round(p,3) for p in periods))>1,periods)
   await advance(3.1)
   rubble=await js('__rainy711.destruction')
   check('Recognizable store products remain scattered',rubble.get('products',{}).get('visible',0)>0,rubble.get('products'))
   check('Building is destroyed while server survives',rubble['progress']==99 and rubble['serverAlive'] and rubble['visibleIntact']==0 and rubble['visibleDebris']>0,rubble)
   await capture('v7-rubble.png');await until(['aim-final'])
   await to_meter(.01);await js('__rainy711.missionAttack(__rainy711.time)')
   check('Final MISS does not launch dragon',(await state())['phase']=='aim-final')
   await advance(.8,False);await to_meter(.5,True);await capture('v7-final-ui.png');await page.locator('.mission-attack').tap()
   check('Player launches original dragon model',(await state())['phase']=='finisher')
   await advance(3.7);await capture('v7-dragon-flight.png')
   await advance(3.1);mid=await js('({d:__rainy711.destruction,p:__rainy711.dragonPosition})')
   check('Server is physically destroyed by final attack',not mid['d']['serverAlive'],mid)
   await capture('v7-impact.png');await advance(2.25)
   check('Finisher waits nine seconds',(await state())['phase']=='landing')
   await advance((await state()).get('landingDuration',12)+.1);end=await state()
   check('Landing resolves mission at 100 percent',end['phase']=='complete' and end['progress']==100,end)
   neighbor=await js('__rainy711.destruction.neighbor');dragon=await js('__rainy711.dragonPosition')
   check('Neighbor wall is actually hit',bool(neighbor) and bool(neighbor.get('hit') or neighbor.get('damaged') or neighbor.get('impacted')),neighbor)
   check('Dragon remains at neighbor wall',math.dist(dragon,neighbor['position'])<1.1,{'dragon':dragon,'neighbor':neighbor})
   await advance(4.5);await capture('v7-ending.png');await framebuffer('Finale framebuffer clean')
   # Real elapsed observation, recorded independently from deterministic story tests.
   if OBSERVE>0:
    start=time.monotonic();frames=await js('__rainy711.renders');pose=await js('__rainy711.poseData.head');await js('__rainy711.resume()')
    while time.monotonic()-start<OBSERVE:
     await page.wait_for_timeout(min(5000,max(100,(OBSERVE-(time.monotonic()-start))*1000)))
    duration=time.monotonic()-start;added=await js('__rainy711.renders')-frames;end_pose=await js('__rainy711.poseData.head');await js('__rainy711.pauseForCapture()')
    result['ending_observation']={'seconds':round(duration,2),'frames':added,'software_render_fps':added/duration}
    check('Ending remains alive for real observation',duration>=OBSERVE and added>0 and pose!=end_pose,result['ending_observation'])
   else:result['ending_observation']={'skipped':True}
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500);await advance(.01)
   check('Landscape fits viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'));await capture('v7-landscape.png')
   for _ in range(3):await js('__rainy711.missionReplay()')
   await advance(.1);reset=await js('__rainy711.destruction')
   check('Replay restores shop, server and neighbor',reset['progress']==0 and reset['serverAlive'] and reset['visibleIntact']==intact['visibleIntact'] and reset['visibleDebris']==0 and not (reset['neighbor'].get('hit') or reset['neighbor'].get('damaged') or reset['neighbor'].get('impacted')),reset)
   check('Replay preserves one mission and playground owner',await page.locator('.mission-shell').count()==1 and await page.locator('canvas').count()==1)
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(500);await advance(.01)
   await js('window.qaLoss=document.querySelector("#scene canvas").getContext("webgl2").getExtension("WEBGL_lose_context");qaLoss.loseContext()')
   await page.locator('#error').wait_for(state='visible');check('Context loss offers recovery prompt',True)
   await js('qaLoss.restoreContext()');await page.locator('#error').wait_for(state='hidden');await js('__rainy711.pauseForCapture();__rainy711.tick(__rainy711.time+.1,.1)')
   await framebuffer('Context-restored framebuffer clean');check('No JavaScript or shader errors',not errors,errors)
   result['passed']=True
  except Exception as e:
   result['passed']=False;result['failure']=str(e)
   try:result['last_state']=await state();result['last_destruction']=await js('__rainy711.destruction');result['last_playground']=await js('__rainy711.playground')
   except Exception:pass
   raise
  finally:
   result['errors']=errors;(OUT/'v7-browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');await browser.close()
 print(json.dumps({'passed':result['passed'],'checks':len(result['checks']),'ending_observation':result.get('ending_observation'),'errors':errors},ensure_ascii=False))

async def test_playground(page,js,advance,capture,check,result):
 """Each prototype is won through its actual buttons and scene-clock updates."""
 await page.locator('.playground-entry').click();await advance(.01,False)
 check('Experiment area opens',bool((await js('__rainy711.playground')).get('open')))
 check('Six playable prototypes listed',await page.locator('.lab-card[data-game]').count()==6)
 check('Experiments pause the main story',(await js('__rainy711.mission')).get('paused'))
 check('Prototype status is clearly labelled','支線故事尚未接入' in await page.locator('.lab-intro').inner_text())
 await capture('v7-playground.png')
 async def game():return await js('__rainy711.playground')
 async def act(action,value=None):
  selector='.lab-controls [data-act="'+action+'"]'
  if value is not None:selector+='[data-value="'+str(value)+'"]'
  await page.locator(selector).click()
 async def wait_game(predicate):
  return await js('''predicate=>{const q=__rainy711,condition=Function('s','return ('+predicate+')');let n=0;
   while(!condition(q.playground)&&q.playground.status==='running'&&n++<3000)q.tick(q.time+.02,.02,false);
   if(!condition(q.playground))throw Error('Playground condition not reached: '+predicate);return q.playground;}''',predicate)
 outcomes=[]
 for ident in ['cannon','compress','washer','microwave','scan','pack']:
  await page.locator('.lab-card[data-game="'+ident+'"]').click()
  initial=await game();check('Prototype starts '+ident,initial['id']==ident and initial['status']=='running' and initial['progress']==0,initial)
  if ident=='cannon':
   for _ in range(3):
    await wait_game('s.power>=.9');await act('lock');await wait_game('Math.abs(s.meter-.5)<s.sweetWidth*.25');await act('lock')
  elif ident=='compress':
   for _ in range(4):
    await act('feed');await act('press')
    if (await game())['status']=='running':await act('vent')
  elif ident=='washer':
   await act('rpm',2)
   for _ in range(150):
    current=await game()
    if current['status']!='running':break
    if current['balance']>.12:await act('left')
    elif current['balance']<-.12:await act('right')
    if current['foam']>65:await act('drain');await act('rpm',2)
    await advance(.25,False)
  elif ident=='microwave':
   await act('power')
   for zone in range(3):await act('zone',zone);await advance(3.95,False)
  elif ident=='scan':
   for _ in range(3):await wait_game('Math.abs(s.cursor-s.target)<s.width*.25');await act('scan')
  elif ident=='pack':
   for direction,count in [('right',2),('right',4),('left',7)]:
    for _ in range(count):await act(direction)
    await act('lock')
  end=await game();outcomes.append(end)
  check('Actual DOM gameplay wins '+ident,end['status']=='won' and end['progress']==100 and await page.locator('.lab-result').is_visible(),end)
  if ident in ['cannon','compress','washer']:await capture('v7-playground-'+ident+'.png')
  await page.locator('.lab-game-nav [data-nav="retry"]').click()
  check('Retry resets '+ident,(await game())['status']=='running' and (await game())['progress']==0 and (await game())['time']==0)
  await page.locator('.lab-game-nav [data-nav="list"]').click()
 check('Prototype switching keeps one UI owner',await page.locator('.playground-modal').count()==1 and await page.locator('canvas').count()==1)
 await page.locator('.lab-card[data-game="pack"]').click()
 for _ in range(3):await act('lock')
 check('Poor gameplay can fail',(await game())['status']=='lost')
 await page.locator('.lab-close').click();await advance(.01,False)
 closed=await game();await advance(10,False)
 check('Closed experiment stops its game clock',(await game())['time']==closed['time'])
 check('Closing experiments restores inspection',(await js('__rainy711.mission')).get('phase')=='ready' and not (await js('__rainy711.mission')).get('paused'))
 result['playground_outcomes']=outcomes

asyncio.run(main())
