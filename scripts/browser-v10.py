"""Real production UI + deterministic story clock. Desktop software WebGL, not iPhone."""
import asyncio,json,time,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4210/endfield-model-lab/')
async def main():
 r={'url':URL,'real_iphone_test':False,'renderer':'Chromium / SwiftShader','checks':[]};errors=[]
 def check(name,value):
  r['checks'].append({'name':name,'passed':bool(value)});print(name,value,flush=True);assert value,name
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,is_mobile=True)
  page.set_default_timeout(120000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def advance(seconds,render=False):return await js('''([s,render])=>{const q=__rainy711;const start=q.time,n=Math.max(1,Math.ceil(s*30));for(let i=1;i<=n;i++)q.tick(start+s*i/n,s/n,render&&i===n);return q.mission;}''',[seconds,render])
  async def shot(name):
   await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/name))
  async def finish():return await js('''()=>{const q=__rainy711;const p=q.mission.phase;for(let i=0;i<100&&q.mission.phase===p;i++)q.missionNext();return q.mission.phase;}''')
  try:
   started=time.monotonic();await page.goto(URL,wait_until='domcontentloaded');await page.wait_for_function('!!window.__rainy711',timeout=180000);r['local_ready_seconds']=round(time.monotonic()-started,2)
   await js('__rainy711.pauseForCapture()');await advance(3,True)
   check('Both actors visible at entry',await js('__rainy711.actorsLoaded&&__rainy711.actorsVisible&&!!__rainy711.dragonPosition'))
   check('One renderer',await page.locator('canvas').count()==1);await shot('v10-entry.png')
   await js('__rainy711.toggleAutoCamera()');await advance(30);check('Manual mode remains after 30 seconds',await page.locator('.cinematic-toggle').get_attribute('aria-pressed')=='false')
   await page.locator('.cinematic-toggle').click(force=True);await advance(1);check('Explicit camera resume',await page.locator('.cinematic-toggle').get_attribute('aria-pressed')=='true')
   await page.locator('.mission-launch').click(force=True);check('Dialogue can reveal text',await page.locator('.mission-next').inner_text()=='⋯ 點一下顯示全文');await page.locator('.mission-line').click(force=True);check('Dialogue now shows advance symbol',await page.locator('.mission-next').inner_text()=='▼ 點一下繼續')
   await finish();check('Opening goes to photo',await js('__rainy711.mission.phase')=='photo');await advance(6,True);await shot('v10-photo-camera.png')
   await page.locator('.photo-shutter').click(force=True);check('Real canvas photo captured',await js("__rainy711.mission.phase==='investigate'&&__rainy711.photo.src.startsWith('data:image/jpeg')"));await shot('v10-photo-review.png')
   await page.get_by_role('button',name='＋ 放大',exact=True).click(force=True);await page.locator('[data-clue=floor]').click(force=True);check('Floor clue starts cargo investigation',await js('__rainy711.mission.phase')=='cargo');await advance(4,True);await shot('v10-cargo.png')
   await finish();await finish();check('Communication waits for accept',await js('__rainy711.mission.phase')=='comm-request');await advance(100);check('Communication still waiting',await js('__rainy711.mission.phase')=='comm-request');await shot('v10-call.png');await page.locator('.call-accept').click(force=True);await finish();check('Five chunk login ready',await js('__rainy711.mission.phase')=='login');await advance(4,True);await shot('v10-login.png')
   for text in ['endfield','_','power','520','1314']:await page.locator(f'.mission-key[data-key="{text}"]').click(force=True)
   check('Five taps reach captcha',await js('__rainy711.mission.phase')=='captcha');await advance(6);await page.locator('.mission-captcha-check').click(force=True);await js('__rainy711.missionLever(1)');await advance(9,True);await shot('v10-pylons.png');await advance(21)
   check('Charge still thirty seconds',await js('__rainy711.mission.phase')=='combat')
   for i in range(25):
    if await js('__rainy711.mission.phase')!='combat':break
    s=await js('__rainy711.mission');await advance(max(1,s['combatHoldRemaining']+.01));s=await js('__rainy711.mission');period=s['meterPeriod'];delta=(period*.25-s['meterElapsed'])%period;await advance(delta);await js('__rainy711.missionAttack(__rainy711.time)')
   check('Normal combat reaches 99 percent',await js("__rainy711.mission.phase==='energy'&&__rainy711.mission.progress===99"));await shot('v10-damage.png');await finish()
   await page.wait_for_function('__rainy711.xaihi.loaded',timeout=180000)
   # Resume if the real lazy asset wait paused the story.
   await js('__rainy711.missionPause(false)');await advance(.8,True);check('VCR camera approaches physical CCTV',await js('__rainy711.cinematic.cameraBeat')=='rewind-cctv-source');await shot('v10-cctv-source.png');await advance(6.3);await finish();check('Hacker puzzle precedes password reveal',await js('__rainy711.mission.phase')=='hack');await advance(3,True);await shot('v10-hack.png')
   for i in range(3):await page.locator(f'[data-tile="{i}"]').click(force=True)
   check('Puzzle reveals credentials',await js('__rainy711.mission.phase')=='credentials');await finish();check('New heating phase',await js('__rainy711.mission.phase')=='heat')
   await js('__rainy711.missionHeatStart()');await advance(3,True);check('First attempt explicitly fails',await js("__rainy711.mission.heat.status==='burnt'&&__rainy711.mission.heat.result.includes('非操作失誤')"));check('Food pixels actually spawn',await js('__rainy711.investigationProps.bursts')==1);await shot('v10-purple-failure.png')
   await page.locator('.rhythm-retry').click(force=True);await js('__rainy711.missionHeatStart()');await advance(9);check('Real failure increases assistance',await js('__rainy711.mission.heat.failures')==2);await page.locator('.rhythm-retry').click(force=True)
   for k in range(3):
    await js('__rainy711.missionHeatStart()');s=await js('__rainy711.mission');origin=await js('__rainy711.time');notes=s['heat']['notes'];await shot(f'v10-rhythm-{k}.png')
    for note in notes:
     await js('(at)=>__rainy711.missionHeatStart(at)',origin+note['at'])
     if note['type']=='hold':await js('(at)=>__rainy711.missionHeatStop(at)',origin+note['end'])
    await advance(notes[-1]['end']+1)
   check('All rhythm stages completed',await js('__rainy711.mission.phase')=='flashback-end');await finish();await advance(3);check('VCR returns to exact destruction',await js("__rainy711.mission.phase==='last'&&__rainy711.mission.progress===99&&__rainy711.actorsVisible"));await finish();s=await js('__rainy711.mission');await advance(s['meterPeriod']/4);await js('__rainy711.missionAttack(__rainy711.time)');await advance(5.15,True);await shot('v10-finisher.png');await advance(4+12+16);check('Final completion',await js('__rainy711.mission.phase')=='complete');await advance(12,True);await shot('v10-ending.png')
   # Real wall-clock idle: do not turn deterministic stepping into an FPS claim.
   await js('__rainy711.resume()');obs=time.monotonic();await asyncio.sleep(60);r['ending_observation_seconds']=round(time.monotonic()-obs,2);check('Ending survives sixty real seconds',await js('__rainy711.mission.phase')=='complete');await js('__rainy711.pauseForCapture()')
   await js('__rainy711.missionReplay()');await finish();await advance(6,True);await page.locator('.photo-shutter').click(force=True);await page.get_by_role('button',name='＋ 放大',exact=True).click(force=True);await page.locator('[data-clue=server]').click(force=True);check('Replay chooses different investigation',await js("__rainy711.mission.phase==='observation'&&__rainy711.mission.investigation==='server'"));check('Replay has one UI and renderer',await page.locator('canvas').count()==1 and await page.locator('.investigation-ui').count()==1)
   await page.set_viewport_size({'width':844,'height':390});await advance(2,True);await shot('v10-landscape.png');check('Landscape UI stays in viewport',await js("[...document.querySelectorAll('.cinematic-toggle,.mission-line')].filter(n=>n.getClientRects().length).every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})"))
   check('No JavaScript errors',not errors);r['passed']=True
  except Exception as e:r['passed']=False;r['failure']=str(e);raise
  finally:
   r['errors']=errors;r['assets']=await page.locator('script[src]').evaluate_all('(els)=>els.map(e=>e.src)');(OUT/'v10-browser-results.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');await browser.close()
asyncio.run(main())
