"""Focused V6 final framing and fast-finisher regression checks. Desktop only."""
import asyncio,json,math,os
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4187/')
FINAL_ONLY=os.environ.get('FINAL_COMPLETION_ONLY')=='1'

async def main():
 result={'url':URL,'browser':'Desktop Chromium / SwiftShader','real_iphone_test':False,'checks':[]};errors=[]
 def check(name,ok,detail=None):
  result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});print(name,'PASS' if ok else 'FAIL',flush=True);assert ok,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='reduce');page.set_default_timeout(90000)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def advance(seconds,render=True):
   return await js('''({seconds,render})=>{const q=__rainy711,start=q.time,n=Math.max(1,Math.ceil(seconds*60));
    for(let i=1;i<=n;i++)q.tick(start+seconds*i/n,seconds/n,render&&i===n);return q.mission;}''',{'seconds':seconds,'render':render})
  async def until(phases):
   return await js('''phases=>{const q=__rainy711;let n=0;while(!phases.includes(q.mission.phase)&&n++<220)q.missionNext();
    if(!phases.includes(q.mission.phase))throw Error('Cannot reach '+phases+' from '+q.mission.phase);q.tick(q.time+.001,.001,false);return q.mission;}''',phases)
  async def center():
   return await js('''()=>{const q=__rainy711;let offset=(.675-q.mission.phaseElapsed%2.7+2.7)%2.7;if(offset<.04)offset+=2.7;q.tick(q.time+offset,offset,false);return q.mission;}''')
  async def capture(name):
   path=OUT/name;await page.screenshot(path=str(path),timeout=120000);im=Image.open(path).convert('RGB');w,h=im.size
   spread=max(ImageStat.Stat(im.crop((int(w*.1),int(h*.18),int(w*.9),int(h*.72)))).stddev);check('Actual rendered scene '+name,spread>12,round(spread,2))
  async def caption_clear(name):
   overlap=await js('''()=>{const caption=document.querySelector('.mission-caption'),a=caption.getBoundingClientRect();
    return ['.walk-toggle','.rain-response'].flatMap(selector=>{const e=document.querySelector(selector);if(!e||!e.getClientRects().length)return [];const b=e.getBoundingClientRect();
     return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top?[{selector,caption:{x:a.x,y:a.y,w:a.width,h:a.height},button:{x:b.x,y:b.y,w:b.width,h:b.height}}]:[];});}''')
   check(name+' peace caption clears walk and rain controls',not overlap,overlap)
  async def framing(name,check_hero=True,check_dragon=True):
   frame=await js('''()=>{const q=__rainy711,h=q.heroPosition,d=q.dragonPosition;
    const p={heroFoot:[...h],heroHead:[h[0],h[1]+1.94,h[2]],heroLeft:[h[0]-.55,h[1]+1,h[2]],heroRight:[h[0]+.55,h[1]+1,h[2]],
     dragonFoot:[...d],dragonHead:[d[0],d[1]+.82,d[2]],dragonLeft:[d[0]-.34,d[1]+.4,d[2]],dragonRight:[d[0]+.34,d[1]+.4,d[2]]};
    const points=Object.fromEntries(Object.entries(p).map(([key,value])=>[key,q.projectPoint(value)]));
    const panels=['.mission-status','.mission-pause','.mission-panel','.mission-combat'].flatMap(selector=>{
     const e=document.querySelector(selector);if(!e||e.hidden||!e.getClientRects().length)return [];const b=e.getBoundingClientRect();return [{selector,x:b.x,y:b.y,w:b.width,h:b.height}];});
    return {points,panels,hero:h,dragon:d,phase:q.mission.phase,phaseElapsed:q.mission.phaseElapsed,width:innerWidth,height:innerHeight};}''')
   selected={k:v for k,v in frame['points'].items() if (check_hero and k.startswith('hero')) or (check_dragon and k.startswith('dragon'))}
   check(name+' character proxy bounds within frame',all(abs(p[0])<.98 and abs(p[1])<.94 and -1<p[2]<1 for p in selected.values()),frame)
   heads=[frame['points'][key] for key in ['heroHead','dragonHead'] if (key.startswith('hero') and check_hero) or (key.startswith('dragon') and check_dragon)]
   blocked=[]
   for p in heads:
    x=(p[0]+1)/2*frame['width'];y=(1-p[1])/2*frame['height']
    for b in frame['panels']:
     if b['x']<=x<=b['x']+b['w'] and b['y']<=y<=b['y']+b['h']:blocked.append({'point':[x,y],'panel':b['selector']})
   check(name+' heads clear dialogue and HUD',not blocked,blocked)
   return frame
  try:
   await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded&&typeof window.__rainy711?.projectPoint==="function"',timeout=120000);await js('__rainy711.pauseForCapture()')
   check('Original model loads at preview path',await js('__rainy711.bonesSupported'))
   await page.reload(wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);await js('__rainy711.pauseForCapture()')
   check('Repository path survives reload',await js('__rainy711.actorsLoaded'))
   if FINAL_ONLY:
    await page.locator('.mission-launch').click();await until(['choice']);await page.locator('.mission-choice[data-choice=A]').click();await until(['charge'])
    await advance(30.02,False)
    for _ in range(15):
     if await js('__rainy711.mission.phase')!='combat':break
     await center();await js('__rainy711.missionAttack(__rainy711.time)');await advance(.04,False)
    await until(['aim-final']);await center();await js('__rainy711.missionAttack(__rainy711.time)');await advance(4.2)
    await framing('Final build dragon in flight');await capture('v6-finale-shot.png');await advance(7.9,False)
    s=await js('__rainy711.mission');check('Final build completes through the actual mission',s['phase']=='complete' and s['progress']==100,s)
    await advance(max(.01,2-s['phaseElapsed']))
    badge=await page.locator('.mission-complete-text').inner_text();check('Completion badge explicitly shows 100 percent and mission complete','100%' in badge and '任務完成' in badge,badge)
    check('Completion progress reaches visible 100 percent',await page.locator('.mission-status').is_visible() and await page.locator('.mission-progress-value').inner_text()=='100%')
    check('Peace caption waits until the completion status clears',not await page.locator('.mission-caption').evaluate('(e)=>e.classList.contains("visible")'))
    await framing('Final build close ending');await capture('v6-complete.png')
    await advance(1.5)
    check('Peace caption follows completion status',await page.locator('.mission-caption').evaluate('(e)=>e.classList.contains("visible")') and not await page.locator('.mission-status').is_visible())
    await caption_clear('Portrait');await capture('v6-complete-peace.png')
    await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500);await advance(1)
    await caption_clear('Landscape');await capture('v6-landscape-peace.png')
    await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(500)
    await advance(max(.01,18-await js('__rainy711.mission.phaseElapsed')))
    await framing('Final build wide ending');await capture('v6-complete-wide.png')
    await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500);await advance(2)
    check('Final build landscape fits viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'));await framing('Final build landscape');await capture('v6-landscape.png')
    await js('__rainy711.missionReplay()');await advance(.1)
    reset=await js('({m:__rainy711.mission,d:__rainy711.destruction})');check('Final build replay restores shop and target',reset['m']['target']=='glass' and reset['d']['progress']==0 and reset['d']['serverAlive'] and reset['d']['visibleDebris']==0,reset)
    check('Final build single canvas and clean runtime',await page.locator('#scene canvas').count()==1 and not errors,errors)
    check('Final build framebuffer clean',await js('document.querySelector("#scene canvas").getContext("webgl2").getError()')==0)
    result['passed']=True;print(json.dumps({'passed':True,'checks':len(result['checks']),'final_build_completion_only':True},ensure_ascii=False));return
   await page.locator('#menu-toggle').click();quality=[]
   for n,value in enumerate(['low','high','balanced']):
    await page.locator('#quality').select_option(value);await advance(.02)
    sample=await js('({aa:__rainy711.aa,garden:__rainy711.garden,effects:__rainy711.effects,error:document.querySelector("#scene canvas").getContext("webgl2").getError()})');quality.append(sample)
    check('Quality '+value+' renders cleanly',sample['error']==0 and sample['aa']['postSamples']==0,sample)
   check('Low quality reduces blossom and particle budgets',quality[0]['garden']['blossoms']<quality[1]['garden']['blossoms'] and quality[0]['effects']['particleLimit']<quality[1]['effects']['particleLimit'])
   await page.locator('#menu-close').click()
   await js('__rainy711.frameView("street");__rainy711.tick(__rainy711.time+.01,.01)');await capture('v6-street.png')
   await js('__rainy711.frameView("pear");__rainy711.tick(__rainy711.time+.01,.01)');await capture('v6-pear.png')
   await page.locator('.mission-launch').click();await until(['choice']);await page.locator('.mission-choice[data-choice=A]').click();await until(['charge']);await advance(14)
   cinematic=await js('({pose:__rainy711.idle.cinematic,dragon:__rainy711.dragonPosition})')
   check('Hero rises while companion stays grounded',cinematic['pose']['lift']>1 and cinematic['dragon'][1]<.5,cinematic)
   await framing('Charge');await capture('v6-charge.png')
   await advance(18.5);check('Thirty-second charge reaches combat',(await js('__rainy711.mission.phase'))=='combat');await framing('Combat');await capture('v6-combat.png')
   shots=0
   while await js('__rainy711.mission.phase')=='combat' and shots<15:
    await center();await js('__rainy711.missionAttack(__rainy711.time)');await advance(.04,False);shots+=1
   check('Interactive damage reaches last-shot scene',await js('__rainy711.mission.phase')=='last')
   # Skip the last-shot dialogue immediately: rack lowering is intentionally still in progress.
   rack=await js('__rainy711.destruction.server')
   await until(['aim-final']);await center();await js('__rainy711.missionAttack(__rainy711.time)');check('Final shot starts from player timing',await js('__rainy711.mission.phase')=='finisher')
   await advance(3);await framing('Finisher at three seconds');await capture('v6-finale.png')
   await advance(1.87,False)
   collision=await js('({dragon:__rainy711.dragonPosition,rack:__rainy711.destruction.serverPosition,phase:__rainy711.mission.phase,elapsed:__rainy711.mission.phaseElapsed})')
   distance=math.dist(collision['dragon'],collision['rack'])
   check('Fast-skipped finisher tracks the lowered live rack',collision['phase']=='finisher' and distance<.15,{'before':rack,'nearImpact':collision,'distance':distance})
   await advance(.15);check('Actual finisher impact stops server',not await js('__rainy711.destruction.serverAlive'))
   await capture('v6-impact.png');await advance(7.05,False)
   complete=await js('__rainy711.mission');check('Flight and landing finish at 100',complete['phase']=='complete' and complete['progress']==100,complete)
   await advance(max(.01,2-complete['phaseElapsed']));await framing('Close ending at two seconds');await capture('v6-complete.png')
   await advance(16);await framing('Wide ending at eighteen seconds');await capture('v6-complete-wide.png')
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500);await advance(2)
   check('Landscape fits viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'));await framing('Landscape ending');await capture('v6-landscape.png')
   await page.set_viewport_size({'width':1440,'height':1000});await page.wait_for_timeout(500);await advance(2);await capture('v6-desktop.png')
   await js('__rainy711.missionReplay()');await advance(.1)
   reset=await js('({mission:__rainy711.mission,store:__rainy711.destruction,hero:__rainy711.heroPosition,dragon:__rainy711.dragonPosition})')
   check('Replay restores geometry and first target',reset['store']['progress']==0 and reset['store']['serverAlive'] and reset['store']['visibleDebris']==0 and reset['mission']['target']=='glass',reset)
   check('Single renderer and no runtime or shader errors',await page.locator('#scene canvas').count()==1 and not errors,errors)
   check('Final framebuffer clean',await js('document.querySelector("#scene canvas").getContext("webgl2").getError()')==0)
   result['passed']=True
  except Exception as e:
   result['passed']=False;result['failure']=str(e)
   try:result['last_state']=await js('__rainy711.mission')
   except Exception:pass
   raise
  finally:
   result['errors']=errors;name='v6-final-build-results.json' if FINAL_ONLY else 'v6-visual-results.json';(OUT/name).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');await browser.close()
 print(json.dumps({'passed':result['passed'],'checks':len(result['checks']),'errors':errors},ensure_ascii=False))

asyncio.run(main())
