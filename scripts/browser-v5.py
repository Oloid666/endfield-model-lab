"""Real desktop Chromium render/UI QA, never an iPhone device or FPS claim."""
import asyncio,json,os,time
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts'
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/')
async def main():
 result={'url':URL,'browser':'Desktop Chromium / SwiftShader','real_iphone_test':False,'checks':[]};errors=[]
 def check(name,passed,detail=None):
  result['checks'].append({'name':name,'passed':bool(passed),'detail':detail});print(name, 'PASS' if passed else 'FAIL',flush=True);assert passed,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True,reduced_motion='reduce')
  page=await context.new_page();page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  async def js(code,arg=None):return await page.evaluate(code,arg)
  async def shot(name):await page.screenshot(path=str(OUT/name),timeout=120000)
  try:
   await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);await js('window.__rainy711.pauseForCapture()')
   state=await js('({aa:__rainy711.aa,glass:__rainy711.glassReady,cloth:__rainy711.idle.clothJoints,minZoom:__rainy711.minimumZoom})')
   check('HDR multisample and FXAA active',state['aa']['msaa']>=2 and state['aa']['fxaa'],state)
   check('Single sample postprocessing',state['aa']['postSamples']==0 and not state['aa']['postDepth'],state['aa']);check('Shared glass depth ready',state['glass']);check('58 secondary cloth joints',state['cloth']==58);check('Closer zoom available',state['minZoom']<=.75)
   check('Portrait no overflow',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'))
   await js('__rainy711.frameView("street");__rainy711.tick(3)');await shot('v5-portrait.png')
   await js('__rainy711.frameView("detail");__rainy711.tick(3.1)');await shot('v5-detail.png')
   check('Detail hides large caption',not await page.locator('.scene-caption').is_visible())
   gl_error=await js('document.querySelector("canvas").getContext("webgl2").getError()');check('No WebGL framebuffer error',gl_error==0,gl_error)
   # Actual controls; switching quality rebuilds MSAA targets and depth attachments.
   await page.locator('#menu-toggle').click();await page.locator('#quality').select_option('low');await js('__rainy711.tick(3.2)');check('Low quality keeps AA',await js('__rainy711.aa.msaa')<=2)
   await page.locator('#quality').select_option('high');await js('__rainy711.tick(3.3)');check('High quality and glass remain valid',await js('__rainy711.glassReady&&__rainy711.aa.msaa>=2'))
   await page.locator('#quality').select_option('balanced');await page.locator('#rain').uncheck();await page.locator('#rain').check();await page.locator('#menu-close').click();await js('__rainy711.tick(3.4)')
   # V5 inventory and independent companion / portal camera, using actual keyboard input.
   stock=await js('__rainy711.floorPlan.fridgeStock');promos=await js('__rainy711.floorPlan.promotions')
   check('Five fridge categories and forty SKUs',stock['skuCount']==40 and len(stock['bays'])==5,stock)
   check('Instanced clear shells avoid PBR light loop',stock['shellPBRLights']==0 and stock['shellLighting']=='unlit-fresnel')
   check('Four illustrated posters leave glass visible',promos['count']==4 and promos['frontGlassCoverage']<.22,promos)
   metrics=await js('__rainy711.metrics');check('Static batches and GPU rain active',metrics['batches']['meshesAfter']<metrics['batches']['meshesBefore'] and metrics['weather']['rainOnGPU'],metrics)
   await js('__rainy711.teleport(-.22,2.8);__rainy711.frameView("awning")')
   await page.locator('.walk-toggle').click();await page.keyboard.down('ArrowUp')
   route=await js('()=>{let i=0;for(;i<260&&__rainy711.position[2]>-.45;i++)__rainy711.tick(5+i/60,1/60,false);return {steps:i,owner:__rainy711.position,dragon:__rainy711.idle.companion}}')
   await page.keyboard.up('ArrowUp')
   await js('()=>{for(let n=0;n<220;n++)__rainy711.tick(10+n/60,1/60,false);__rainy711.tick(14,1/60)}')
   check('Keyboard enters shop through doorway',route['owner'][2]<1.55,route)
   entry=await js('({camera:__rainy711.camera,state:__rainy711.walkCamera,owner:__rainy711.position,dragon:__rainy711.idle.companion})')
   check('Entry camera stays under shop ceiling',entry['state']['inside'] and not entry['state']['stage'] and entry['camera'][1]<3.1 and entry['camera'][2]<1.8,entry)
   check('Dragon independently follows into shop',entry['dragon']['position'][2]<1.8 and entry['dragon']['distance']<1.6,entry['dragon'])
   await shot('v5-entry.png')
   await page.locator('.walk-toggle').click()
   # Door sensors and closure follow the same clock; loops render only their last frame.
   await js('()=>{__rainy711.teleport(-.22,2.6);for(let n=0;n<70;n++)__rainy711.tick(4+n*.05,.05,false)}')
   check('Door opens for nearby actor',await js('__rainy711.doors.open')>.9)
   await js('()=>{__rainy711.teleport(-3,3.2);for(let n=0;n<100;n++)__rainy711.tick(20+n*.05,.05,false)}')
   check('Door closes after both leave',await js('__rainy711.doors.open')<.08,await js('({door:__rainy711.doors,owner:__rainy711.position,dragon:__rainy711.idle.companion})'))
   # Movement model steps without rendering each intermediate frame.
   moved=await js('()=>{__rainy711.teleport(-1.25,2.48);let p=__rainy711.position;for(let n=0;n<70;n++)__rainy711.move(1,0,.025);return {before:p,after:__rainy711.position,pose:__rainy711.poseData}}')
   check('Walking moves the actual model',moved['after'][0]-moved['before'][0]>.9,moved)
   await page.locator('.walk-toggle').click();await page.keyboard.down('ArrowLeft');await js('__rainy711.tick(26,.05)');await page.keyboard.up('ArrowLeft');check('Walk toggle and keyboard usable',await js('__rainy711.walking'))
   await page.locator('.walk-toggle').click();check('Walking can stop',not await js('__rainy711.walking'))
   # Each dinner path is completed through the real integrated story API and DOM.
   await page.locator('.story-launch').click();check('Story starts with Dragon',await page.locator('.story-name').inner_text()=='龍泡泡')
   await page.locator('.story-line').click();check('Tap reveals full current line',await js('__rainy711.story.revealed===__rainy711.story.node.text.length'))
   meals=[]
   for index,branch in enumerate(['A','B','C']):
    if index:await js('__rainy711.storyReplay()')
    await js('()=>{let n=0;while(!__rainy711.story.waitingChoice&&n++<160)__rainy711.storyNext();if(n>=160)throw Error("dinner choice not reached")}')
    check('Three dinner choices '+branch,await page.locator('[data-choice]').count()==3)
    if branch=='A':
     await js('__rainy711.tick(20)');await shot('v5-dinner-choice.png');await js('__rainy711.tick(200)');check('Dinner choice waits without timeout',await js('__rainy711.story.nodeId')=='choose_dinner')
    await page.locator('[data-choice="'+branch+'"]').click();await js('__rainy711.tick('+str(201+index*5)+')')
    check('Dinner prop '+branch,await js('__rainy711.idle.dinner')==branch);meals.append(await js('__rainy711.idle.dinner'))
    await shot('v5-meal-'+branch+'.png')
    ending=await js('()=>{let n=0,seen=[];while(!__rainy711.story.waitingChoice&&n++<160){seen.push(__rainy711.story.nodeId);__rainy711.storyNext();}return {state:__rainy711.story,seen}}')
    check('Distinct ending '+branch,any(x and x.startswith('ending_'+branch) for x in ending['seen']) and ending['state']['nodeId']=='coda_offer')
    await page.locator('[data-choice="quiet"]').click();await js('()=>{for(let n=0;__rainy711.story.busy&&n<40;n++)__rainy711.storyNext()}');check('Ending remains alive '+branch,await js('__rainy711.story.phase')=='idle')
   check('Three distinct prop choices',len(set(meals))==3)
   # Hotspot dispatch guard and no overlap. Chatter clock advances are tested separately.
   check('Hotspot response accepted after ending',await js('__rainy711.hotspot("zhuang")'))
   check('No overlapping hotspot response',not await js('__rainy711.hotspot("dragon")'))
   await js('()=>{for(let n=0;__rainy711.story.busy&&n<20;n++)__rainy711.storyNext()}')
   rev=await js('__rainy711.story.revision')
   cdp=await context.new_cdp_session(page)
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':180,'y':400}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':250,'y':420}]})
   await cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
   check('Drag does not trigger a response',await js('__rainy711.story.revision')==rev)
   for _ in range(3):await js('__rainy711.storyReplay();__rainy711.storyStart()')
   check('Replay does not duplicate story UI',await page.locator('.story-shell').count()==1 and await page.locator('.walk-toggle').count()==1)
   # End again and observe the actual live page for a full minute.
   await js('()=>{let n=0;while(!__rainy711.story.waitingChoice&&n++<180)__rainy711.storyNext();__rainy711.storyChoose("A");n=0;while(!__rainy711.story.waitingChoice&&n++<180)__rainy711.storyNext();__rainy711.storyChoose("quiet");for(let n=0;__rainy711.story.busy&&n<40;n++)__rainy711.storyNext();__rainy711.frameView("story");__rainy711.resume()}')
   t0=time.monotonic();frames=await js('__rainy711.renders');phases=[]
   for _ in range(12):await page.wait_for_timeout(5000);phases.append(await js('__rainy711.story.phase'))
   duration=time.monotonic()-t0;added=await js('__rainy711.renders')-frames
   check('Ending real 60s observation',duration>=60 and added>0,{'seconds':round(duration,2),'frames':added,'phases':phases});result['software_render_fps']=added/duration
   check('Postending chatter runs',any(p=='chat' for p in phases))
   await js('__rainy711.pauseForCapture()');await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(400);await js('__rainy711.frameView("story");__rainy711.tick(__rainy711.time+.01)');check('Landscape no overflow',await js('document.documentElement.scrollWidth===innerWidth'));await shot('v5-landscape.png')
   await page.set_viewport_size({'width':1440,'height':1000});await page.wait_for_timeout(400);await js('__rainy711.frameView("street");__rainy711.tick(__rainy711.time+.01)');await shot('v5-desktop.png')
   check('Only one canvas',await page.locator('#scene canvas').count()==1)
   await js('window.qaLoss=document.querySelector("canvas").getContext("webgl2").getExtension("WEBGL_lose_context");qaLoss.loseContext()');await page.locator('#error').wait_for(state='visible');check('Context lost has recovery prompt',True)
   await js('qaLoss.restoreContext()');await page.locator('#error').wait_for(state='hidden');await js('__rainy711.pauseForCapture();__rainy711.tick(__rainy711.time+.1)');check('Context restores glass and single canvas',await js('__rainy711.glassReady&&__rainy711.rendererCount===1'))
   check('No JavaScript or shader errors',not errors,errors)
   result['passed']=True
  except Exception as e:result['passed']=False;result['failure']=str(e);raise
  finally:
   result['errors']=errors;(OUT/'v5-browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));await browser.close()
 print(json.dumps(result,ensure_ascii=False,indent=2))
asyncio.run(main())
