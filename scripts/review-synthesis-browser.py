"""Targeted after-change evidence, using existing debug entry and actual story controls.
No external API, feedback submission, timing score or iPhone performance claim.
"""
import argparse
import asyncio
import importlib.util
import json
import shutil
from pathlib import Path

SPEC=importlib.util.spec_from_file_location('visual_review',Path(__file__).with_name('visual-review.py'))
TOOL=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(TOOL)

async def main(args):
 from playwright.async_api import async_playwright
 root=Path(args.out).resolve();root.mkdir(parents=True,exist_ok=False)
 data={'status':'capturing','source':TOOL.source_info(),'entry':'seven-tap unlock; figurine and birth debug shortcuts; birth followed by actual story controls','iphone_tested':False,'frames':[],'errors':[],'feedback_posts':[],'checks':[]}
 async with async_playwright() as p:
  launch={'args':['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']}
  if args.browser:launch['executable_path']=args.browser
  browser=await p.chromium.launch(**launch)
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1.5)
  page.on('pageerror',lambda e:data['errors'].append(str(e)))
  page.on('request',lambda r:data['feedback_posts'].append(r.url) if r.method=='POST' and '/api/feedback' in r.url else None)
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def tick(seconds=.1):
   await js('s=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,s/n,false)}',seconds)
  async def wait_running():
   await page.wait_for_function('!__rainy711.mission.paused',timeout=120000)
  async def jump(name):
   assert await js('n=>__rainy711.debugJump(n)',name),name
   await tick(.2)
  async def act(name):
   await tick(.35)
   assert await js('n=>__rainy711.tabletAction(n)',name),name
  async def talks():
   for _ in range(20):
    if not await js('!!__rainy711.mission.tablet?.dialogue'):return
    await tick(1);await act('talk-next')
   raise AssertionError('Dialogue did not finish')
  async def until(test,limit=320,next_input=True):
   for _ in range(limit):
    if await js(test):return
    if await js('__rainy711.mission.paused'):await wait_running()
    await tick(.4)
    if next_input:await js('__rainy711.missionNext()')
   raise AssertionError('Checkpoint not reached: '+test)
  async def shot(id):
   await js('__rainy711.tick(__rainy711.time,0,true)')
   await page.screenshot(path=str(root/(id+'.jpg')),type='jpeg',quality=85)
   state=await js("""()=>{const q=__rainy711,s=q.mission;return {phase:s.phase,age:s.phaseElapsed,mealBorn:s.mealBorn,owner:s.trayOwner,camera:q.cameraPose,staging:q.staging,xaihi:q.xaihi,tablet:s.tablet,expression:q.idle.companionExpression,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth,emoji:document.querySelector('.creature-communication')?.getBoundingClientRect().toJSON()}}""")
   state['last_line_characters']=await js("""()=>{const node=document.querySelector('.mission-text')?.firstChild;if(!node||node.nodeType!==3)return null;const rows=new Map(),r=document.createRange();for(let i=0;i<node.length;i++){r.setStart(node,i);r.setEnd(node,i+1);const top=Math.round(r.getBoundingClientRect().top);rows.set(top,(rows.get(top)||0)+1);}return [...rows.values()].at(-1)??0;}""")
   assert not state['overflow'],(id,'page overflow')
   if id.startswith('06-'):assert state['last_line_characters']>3,(id,'orphan character line')
   data['frames'].append({'id':id,'file':id+'.jpg',**state});TOOL.write(root/'verification.json',data)
   print('Captured',id,state['phase'],flush=True)
  async def viewports(id):
   for w,h in [(390,844),(844,390),(1440,900)]:
    await page.set_viewport_size({'width':w,'height':h})
    await js('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
    await js('__rainy711.resetCamera()')
    await shot(f'{id}-{w}x{h}')
   await page.set_viewport_size({'width':390,'height':844})
   await js('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
  try:
   await page.goto(args.url,wait_until='domcontentloaded')
   await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click()
   await page.wait_for_function("window.__rainy711?.actorsLoaded&&document.querySelector('#loading').hidden",timeout=240000)
   await js("()=>{const q=document.querySelector('#quality');q.value='balanced';q.dispatchEvent(new Event('change'));__rainy711.pauseForCapture();__rainy711.frameView('street')}")
   await tick(.2)
   for _ in range(7):
    point=await js("()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector('#scene').getBoundingClientRect();return [r.x+(p[0]+1)*r.width/2,r.y+(1-p[1])*r.height/2]}")
    await page.mouse.click(*point);await tick()
   # Finish the presentation-only unlock animation before taking story evidence.
   await page.locator('.bonus-toast').evaluate('(e)=>e.getAnimations().forEach(a=>a.finish())')
   await page.wait_for_function("document.querySelector('.bonus-toast').hidden",timeout=10000)
   await jump('fridge');await tick(2.2);await talks();await act('scan');await tick(1.7);await talks()
   await act('tool');await act('detect');await tick(1.4);await act('control');await tick(3.3);await act('apply');await tick(3)
   await viewports('01')
   await act('talk-next');await tick(1);await shot('02')
   await act('talk-next');await tick(.4);await tick(3.9)
   assert await js("__rainy711.mission.tablet.stage==='defrost'&&__rainy711.mission.tablet.temperature===105")
   await shot('04a')
   age=await js('__rainy711.mission.tablet.age');await js('__rainy711.missionPause(true)');await tick(20)
   assert age==await js('__rainy711.mission.tablet.age');await js('__rainy711.missionPause(false)')
   await tick(.6);await tick(1);await viewports('05')
   assert await js("__rainy711.idle.companionExpression==='shock'")
   await act('talk-next');await tick(1);await viewports('06')
   await act('talk-next');await tick(3);await shot('07')
   assert not await js('__rainy711.idle.companionHandsVisible')
   await act('talk-next');await tick(1);await viewports('08')
   data['checks'].append('105 reading hold, shock, manual dialogue, quiet song and paused clock')
   await jump('figurine');await until("__rainy711.mission.node?.cue==='rossi-closeup'");await tick(1)
   await viewports('C02')
   await jump('birth');await until("__rainy711.mission.phase==='flashback-end'")
   assert await js('__rainy711.mission.mealBorn')
   await until("__rainy711.mission.phase==='aim-final'");await wait_running()
   await tick(max(0,9.3-await js('__rainy711.mission.phaseElapsed')))
   await viewports('R04')
   await tick(max(0,12.3-await js('__rainy711.mission.phaseElapsed')))
   for _ in range(280):
    if await js('__rainy711.mission.canAttack&&Math.abs(__rainy711.mission.meter-.5)<.025'):break
    await tick(.01)
   assert await js('__rainy711.missionAttack(__rainy711.time)')
   await until("__rainy711.mission.phase==='meal-reclaim'",next_input=False)
   await tick(max(0,2.45-await js('__rainy711.mission.phaseElapsed')));await shot('T06')
   await until("__rainy711.mission.phase==='tour'",next_input=False);await tick(12)
   await shot('T-returning')
   remnant=await js('__rainy711.staging.remnant')
   assert remnant['born'] and remnant['supportHeight']==0 and not remnant['thumbVisible'],remnant
   before=await js('__rainy711.staging.remnant.position');await js('__rainy711.missionPause(true)');await tick(45)
   assert before==await js('__rainy711.staging.remnant.position')
   await js('__rainy711.missionPause(false)');data['checks'].append('pause holds returned-creature path')
   await until("__rainy711.mission.phase==='complete'",next_input=False);await tick(12)
   for _ in range(3):await page.locator('.epilogue-prompt button').click()
   await tick(34);await viewports('T07')
   remnant=await js('__rainy711.staging.remnant')
   assert remnant['born'] and remnant['supportHeight']==0 and not remnant['thumbVisible'],remnant
   data['checks'].append('no support-pose recurrence after transfer, tour and first rebuild')
   await tick(40);await shot('T08-microwave')
   remnant=await js('__rainy711.staging.remnant')
   assert remnant['supportHeight']==0 and ((remnant['position'][0]-3.70)**2+(remnant['position'][2]-.45)**2)**.5<.5,remnant
   data['checks'].append('returned creature reaches the real microwave area with actual shop obstacles')
   await js('__rainy711.missionReplay()');await tick(.2)
   assert await js("__rainy711.mission.phase==='ready'&&!__rainy711.staging.remnant.born&&!__rainy711.debug.unlocked")
   await shot('restart');data['checks'].append('restart returns to ready and clears creature and unlock')
   assert not data['errors'] and not data['feedback_posts'],data
   data['status']='complete';TOOL.write(root/'verification.json',data)
  except Exception as error:
   data.update(status='failed',failure=str(error));TOOL.write(root/'verification.json',data)
   await page.screenshot(path=str(root/'failure.jpg'));raise
  finally:await browser.close()

if __name__=='__main__':
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--url',default='http://127.0.0.1:4213/');parser.add_argument('--out',required=True)
 parser.add_argument('--browser',default=shutil.which('chromium') or shutil.which('chromium-browser'),help='Chromium executable; otherwise use the Playwright-managed browser.')
 asyncio.run(main(parser.parse_args()))
