"""Focused V7 final-build framing / prototype display regression. Desktop only."""
import asyncio,json,os,math
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4190/endfield-model-lab/')

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
   return await js('''({seconds,render})=>{const q=__rainy711,start=q.time,n=Math.max(1,Math.ceil(seconds*60));for(let i=1;i<=n;i++)q.tick(start+seconds*i/n,seconds/n,render&&i===n);return q.mission;}''',{'seconds':seconds,'render':render})
  async def until(phases):return await js('''phases=>{const q=__rainy711;let n=0;while(!phases.includes(q.mission.phase)&&n++<240)q.missionNext();if(!phases.includes(q.mission.phase))throw Error('Cannot reach '+phases);q.tick(q.time+.001,.001,false);return q.mission;}''',phases)
  async def center():return await js('''()=>{const q=__rainy711,s=q.mission,c=s.meterPeriod;let offset=(c/4-s.meterElapsed%c+c)%c;if(offset<.04)offset+=c;q.tick(q.time+offset,offset,false);return q.mission;}''')
  async def capture(name,allow_smoke=False):
   await page.screenshot(path=str(OUT/name),timeout=120000);im=Image.open(OUT/name).convert('RGB');w,h=im.size
   spread=max(ImageStat.Stat(im.crop((int(w*.1),int(h*.18),int(w*.9),int(h*.72)))).stddev);smoke=await js('__rainy711.effects.smoke');check('Actual rendered image '+name,spread>12 or (allow_smoke and smoke>0 and spread>1),{'image_spread':round(spread,2),'pooled_smoke':smoke})
  async def entry_bounds(label):
   overlap=await js('''()=>{const a=document.querySelector('.playground-entry').getBoundingClientRect();return ['.mission-launch','.mission-inspection','.walk-toggle','.view-dock'].flatMap(s=>{const e=document.querySelector(s);if(!e||!e.getClientRects().length)return [];const b=e.getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top?[{selector:s,entry:{x:a.x,y:a.y,w:a.width,h:a.height},other:{x:b.x,y:b.y,w:b.width,h:b.height}}]:[];});}''')
   check(label+' entry clears controls',not overlap,overlap)
  async def framing(label,kind):
   points=await js('''kind=>{const q=__rainy711,p=kind==='hero'?q.heroPosition:q.dragonPosition,h=kind==='hero'?1.94:.78,w=kind==='hero'?.48:.34;return {origin:p,foot:q.projectPoint(p),head:q.projectPoint([p[0],p[1]+h,p[2]]),left:q.projectPoint([p[0]-w,p[1]+h/2,p[2]]),right:q.projectPoint([p[0]+w,p[1]+h/2,p[2]])};}''',kind)
   check(label+' '+kind+' fits frame',all(abs(v[0])<.98 and abs(v[1])<.94 and -1<v[2]<1 for k,v in points.items() if k!='origin'),points)
   return points
  try:
   await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);await js('__rainy711.pauseForCapture()')
   result['assets']=await js("[...document.querySelectorAll('script[src],link[rel=stylesheet]')].map(n=>n.src||n.href)")
   await entry_bounds('Portrait ready');await capture('v7-home-final.png')
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500);await advance(.01)
   await entry_bounds('Landscape ready');check('Landscape ready stays inside viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'));await capture('v7-home-landscape.png')
   await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(500);await advance(.01)
   await page.locator('.playground-entry').click();await page.locator('.lab-card[data-game=cannon]').click()
   label=await page.locator('[data-ui=meter-value]').inner_text();check('Prototype initial power label agrees with 25 percent state','25%' in label and abs(await js('__rainy711.playground.power')-.25)<.01,label)
   await js('''()=>{const q=__rainy711;for(let i=0;i<200&&q.playground.power<.9;i++)q.tick(q.time+.02,.02,false);}''');await page.locator('.lab-controls [data-act=lock]').click()
   await js('''()=>{const q=__rainy711;for(let i=0;i<200&&Math.abs(q.playground.meter-.5)>q.playground.sweetWidth*.25;i++)q.tick(q.time+.02,.02,false);}''');await page.locator('.lab-controls [data-act=lock]').click()
   check('Prototype hit shows visible shot feedback',float(await page.locator('[data-svg=beam]').get_attribute('opacity'))>0)
   await page.locator('.lab-game-nav [data-nav=retry]').click()
   check('Prototype retry clears old shot pulse',float(await page.locator('[data-svg=beam]').get_attribute('opacity'))==0 and await js('__rainy711.playground.time')==0)
   await page.locator('.lab-close').click()
   await page.locator('.mission-launch').click();await until(['choice']);await page.locator('.mission-choice[data-choice=A]').click();await until(['charge'])
   await advance(14);await framing('Charge at14 seconds','hero');await capture('v7-charge-final.png')
   await advance(14);await capture('v7-charge-wide.png');await advance(2.1)
   check('Final build reaches combat',await js('__rainy711.mission.phase')=='combat')
   for i in range(3):
    await center();await js('__rainy711.missionAttack(__rainy711.time)');await advance(.12)
    recoil=await js('__rainy711.idle.cinematic.recoil');check('Actual body recoils '+str(i+1),recoil>0,recoil)
    if i==0:await capture('v7-cannon-blast.png')
    await advance(1.3);await framing('Combat view '+str((i+1)%3),'hero');await capture('v7-combat-view-'+str((i+1)%3)+'.png')
   for _ in range(25):
    if await js('__rainy711.mission.phase')!='combat':break
    await advance(.7,False);await center();await js('__rainy711.missionAttack(__rainy711.time)');await advance(.03,False)
   check('Final build demolishes through timing input',await js('__rainy711.mission.phase')=='last')
   await until(['aim-final']);await advance(.8,False);await center();await js('__rainy711.missionAttack(__rainy711.time)');check('Final build accepts player-triggered finisher',await js('__rainy711.mission.phase')=='finisher');await advance(4.1);await capture('v7-dragon-flight-final.png')
   await advance(2.2);check('Final build opens real neighbor hole',await js('__rainy711.destruction.neighbor.holeVisible'))
   await capture('v7-smoke-final.png');await advance(4)
   check('Dragon remains stuck during ending dialogue',await js('__rainy711.cinematic.dragonStuck'));await framing('Landing closeup','dragon');await capture('v7-stuck-dialogue.png',allow_smoke=True)
   remain=await js('Math.max(.01,__rainy711.mission.landingDuration-__rainy711.mission.phaseElapsed+.1)');await advance(remain)
   check('Final build completes at100 percent',await js('__rainy711.mission.phase==="complete"&&__rainy711.mission.progress===100'))
   await advance(4);await framing('Complete closeup','dragon');await capture('v7-ending-final.png')
   check('Server dead and neighbor hole persists',await js('!__rainy711.destruction.serverAlive&&__rainy711.destruction.neighbor.holeVisible'))
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500);await advance(1);await capture('v7-ending-landscape.png')
   check('Final landscape stays inside viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'))
   await js('__rainy711.missionReplay()');await advance(.1)
   check('Final build replay clears damage and restores first target',await js('__rainy711.mission.target==="glass"&&__rainy711.destruction.serverAlive&&!__rainy711.destruction.neighbor.hit&&__rainy711.destruction.visibleDebris===0'))
   check('Final build one canvas and no runtime errors',await page.locator('canvas').count()==1 and not errors,errors)
   check('Final build framebuffer clean',await js('document.querySelector("#scene canvas").getContext("webgl2").getError()')==0)
   result['passed']=True
  except Exception as e:
   result['passed']=False;result['failure']=str(e)
   try:result['last_state']=await js('({m:__rainy711.mission,c:__rainy711.cinematic,hero:__rainy711.heroPosition,dragon:__rainy711.dragonPosition,camera:__rainy711.camera})')
   except Exception:pass
   raise
  finally:
   result['errors']=errors;(OUT/'v7-final-build-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');await browser.close()
 print(json.dumps({'passed':result['passed'],'checks':len(result['checks']),'assets':result.get('assets'),'errors':errors},ensure_ascii=False))

asyncio.run(main())
