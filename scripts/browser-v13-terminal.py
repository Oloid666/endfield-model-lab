"""Real production UI + deterministic story clock. Desktop software WebGL, not iPhone."""
import asyncio,json,time,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4214/endfield-model-lab/')
async def main():
 r={'url':URL,'real_iphone_test':False,'renderer':'Chromium / SwiftShader','checks':[]};errors=[]
 def check(name,value):
  r['checks'].append({'name':name,'passed':bool(value)});print(name,value,flush=True);assert value,name
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,has_touch=True,is_mobile=True)
  page.set_default_timeout(45000);page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def advance(seconds,render=False):return await js('''([s,render])=>{const q=__rainy711;const start=q.time,n=Math.max(1,Math.ceil(s*30));for(let i=1;i<=n;i++)q.tick(start+s*i/n,s/n,render&&i===n);return q.mission;}''',[seconds,render])
  async def shot(name):
   await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/name))
  async def fly():
   check('Flight gate waits for player',await js('__rainy711.mission.phase')=='photo-flight')
   pad=page.locator('.flight-pad');box=await pad.bounding_box();cx=box['x']+box['width']/2;cy=box['y']+box['height']/2
   await page.mouse.move(cx+45,cy);await page.mouse.down();await advance(.67);await page.mouse.up()
   await page.mouse.move(cx,cy-45);await page.mouse.down();await advance(1.85);await page.mouse.up()
   check('Flight reaches target',await js('__rainy711.mission.flight.ready'));await page.locator('.flight-ready').click();
  async def finish():return await js('''()=>{const q=__rainy711;const p=q.mission.phase;for(let i=0;i<100&&q.mission.phase===p;i++)q.missionNext();return q.mission.phase;}''')
  try:
   started=time.monotonic();await page.goto(URL,wait_until='domcontentloaded');await page.wait_for_function('!!window.__rainy711',timeout=180000);r['local_ready_seconds']=round(time.monotonic()-started,2)
   await js('__rainy711.pauseForCapture()');await advance(3,True)
   check('Both actors visible at entry',await js('__rainy711.actorsLoaded&&__rainy711.actorsVisible&&!!__rainy711.dragonPosition'))
   check('One renderer',await page.locator('canvas').count()==1);await shot('v13-entry.png')
   await js('__rainy711.toggleAutoCamera()');await advance(30);check('Manual mode remains after 30 seconds',await page.locator('.cinematic-toggle').get_attribute('aria-pressed')=='false')
   await page.locator('.cinematic-toggle').click(force=True);await advance(1);check('Explicit camera resume',await page.locator('.cinematic-toggle').get_attribute('aria-pressed')=='true')
   check('No automatic dialogue or skip controls',await page.locator('.mission-auto').count()==0 and await page.locator('.mission-skip').count()==0);
   check('Dialogue can reveal text',await js("()=>{document.querySelector('.mission-launch').click();return document.querySelector('.mission-next').textContent;}")=='⋯ 點一下顯示全文');check('Dialogue now shows advance symbol',await js("()=>{document.querySelector('.mission-line').click();return document.querySelector('.mission-next').textContent;}")=='▼ 點一下繼續')
   await js('__rainy711.toggleAutoCamera()');await page.locator('.mission-line').click(force=True);check('Next line restores cinematic ownership',await page.locator('.cinematic-toggle').get_attribute('aria-pressed')=='true');await finish();await advance(7);check('Zhuang stays at waiting position',await js('Math.hypot(__rainy711.position[0]+1.25,__rainy711.position[2]-3.25)<.02'));await finish();await fly();check('Opening goes to photo',await js('__rainy711.mission.phase')=='photo');await advance(6,True);await shot('v13-photo-camera.png')
   await page.locator('.photo-shutter').click(force=True);await advance(2.5);await finish();check('Real canvas photo captured',await js("__rainy711.mission.phase==='photo-review'&&__rainy711.photo.src.startsWith('data:image/png')"));check('Photo has more than 1600 pixels on long edge',await js('Math.max(__rainy711.photo.width,__rainy711.photo.height)>=1600'));await shot('v13-photo-review.png');await page.locator('.photo-face').click();check('Clear face photo available',await js('__rainy711.photo.closeup?.startsWith("data:image/png")'));await shot('v13-photo-face.png')
   await page.get_by_role('button',name='＋',exact=True).click(force=True);await page.locator('.photo-send').click(force=True);await page.wait_for_function("__rainy711.mission.phase==='cargo'");check('Floor clue starts cargo investigation',await js('__rainy711.mission.phase')=='cargo');await advance(4,True);await shot('v13-cargo.png')
   await finish();await finish();check('Communication waits for accept',await js('__rainy711.mission.phase')=='comm-request');await advance(100);check('Communication still waiting',await js('__rainy711.mission.phase')=='comm-request');await shot('v13-call.png');await page.locator('.call-accept').click(force=True);await js('__rainy711.missionNext();__rainy711.missionNext();__rainy711.missionNext();__rainy711.missionNext();');check('Zhuang reply uses Zhuang portrait',await page.locator('.mission-comm-portrait').get_attribute('data-speaker')=='zhuang');await shot('v13-zhuang-call.png');await finish();check('Terminal deploy precedes login',await js('__rainy711.mission.phase')=='terminal-deploy');await advance(3);check('Login stays on ground',await js('__rainy711.idle.cinematic.lift')==0);check('Five chunk login ready',await js('__rainy711.mission.phase')=='login');await advance(4,True);await shot('v13-login.png')
   await page.locator('.mission-key[data-key="boss"]').click();check('Decoy word enters input',await js('__rainy711.mission.connection.value')=='boss');await page.locator('.mission-key[data-key="backspace"]').click();check('Delete removes whole word',await js('__rainy711.mission.connection.value')=='')
   for text in ['endfield','_','power','520','1314']:await page.locator(f'.mission-key[data-key="{text}"]').click(force=True)
   await finish();await advance(2,True);await shot('v13-captcha.png')
   check('Captcha awaits player',await js('__rainy711.mission.phase')=='captcha')
   check('No JavaScript errors',not errors);r['passed']=True
  except Exception as e:r['passed']=False;r['failure']=str(e);raise
  finally:
   r['errors']=errors;r['assets']=await page.locator('script[src]').evaluate_all('(els)=>els.map(e=>e.src)');(OUT/'v13-terminal-review.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');await browser.close()
asyncio.run(main())
