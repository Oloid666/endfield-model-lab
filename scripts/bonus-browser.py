"""Real Chromium interaction QA; portrait viewport is not iPhone Safari validation."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
async def main():
 result={'browser':'Chromium / SwiftShader','real_iphone_test':False,'checks':[]}
 def check(name,ok,detail=None):
  result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});assert ok,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',is_mobile=True,has_touch=True)
  page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_default_timeout(15000)
  async def js(s,arg=None):return await page.evaluate(s,arg)
  async def click(action,value=None):
   await page.wait_for_function('!__rainy711.bonus.busy')
   is_class=await page.locator('.bonus-class-dock').is_visible()
   if is_class and action=='rooms':
    if not await page.locator('.bonus-dialog').is_visible():await page.locator('[data-action=class-menu]').click()
    action='class-rooms'
   if is_class and action in ['reading','text-size','board','sources','close','prev']:
    selector=f'.bonus-ui [data-action="{action}"]'
    if not await page.locator('.bonus-dialog').is_visible():await page.locator('[data-action=class-menu]').click()
   selector=f'.bonus-ui [data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')
   await page.locator(selector+':visible').first.click()
  async def shot(name):
   await js('__rainy711.tick(__rainy711.time+.8,0,true)');await page.screenshot(path=str(OUT/f'bonus-{name}.png'))
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000)
   await js('__rainy711.pauseForCapture();__rainy711.toggleAutoCamera();__rainy711.frameView("store");__rainy711.tick(__rainy711.time,0,true)')
   async def tap_sign(n):
    pt=await js('''()=>{const q=__rainy711,p=q.projectPoint([0,3.1,2.224]),b=document.querySelector('#scene canvas').getBoundingClientRect();return {x:b.x+(p[0]+1)*b.width/2,y:b.y+(1-p[1])*b.height/2};}''')
    for _ in range(n):await page.mouse.click(pt['x'],pt['y'])
   await tap_sign(6);check('Six real sign taps do not unlock',not await js('__rainy711.bonus.unlocked'),await js('__rainy711.bonus'))
   await tap_sign(1);check('Seventh real sign tap unlocks',await js('__rainy711.bonus.unlocked'))
   before=await js('({phase:__rainy711.mission.phase,time:__rainy711.mission.time,progress:__rainy711.mission.progress,camera:__rainy711.camera})')
   await page.locator('.bonus-entry').click();check('First visit warns about spoilers',await js('__rainy711.bonus.route')=='warning');await click('confirm');await js('__rainy711.tick(__rainy711.time+300,0,true)');check('Room freezes main story clock',await js('__rainy711.mission.time')==before['time']);await shot('rooms')
   await click('classroom');await page.wait_for_function('__rainy711.bonus.route==="classroom"');await js('__rainy711.tick(__rainy711.time,0,true)');await shot('classroom')
   check('Only menu and one primary control are visible',await page.locator('.bonus-ui button:visible').count()==2)
   await page.emulate_media(reduced_motion='no-preference');await click('class-next');fixed=await page.locator('.bonus-class-dock [data-action=class-next]').bounding_box()
   for _ in range(24):
    if await js('__rainy711.bonus.route')!='lesson':break
    box=await page.locator('.bonus-class-dock [data-action=class-next]').bounding_box();check('Primary stays at the same position',box==fixed)
    await click('class-next')
   check('Three topics are sufficient',len(await js('__rainy711.bonus.course.completed'))==3)
   check('Remaining topics are optional',len(await js('__rainy711.bonus.read'))==3)
   check('Death meter reaches target before ceremony',await js('__rainy711.bonus.course.percentage')==100 and await js('__rainy711.bonus.route')=='class-wait')
   check('Meter animates instead of jumping to 100',await js('__rainy711.bonus.course.display')<100)
   await js('__rainy711.tick(__rainy711.time+.6,0,true)');check('Meter advances gradually',0<await js('__rainy711.bonus.course.display')<100);await shot('class-meter');check('Meter completion starts the stamp ceremony',await js('__rainy711.bonus.route')=='class-stamping');await js('__rainy711.tick(__rainy711.time+1.2,0,true)');check('Death certificate is stamped',await js('__rainy711.bonus.course.stamped'));await shot('class-certificate')
   cert_box=await page.locator('.bonus-class-dock [data-action=class-next]').bounding_box();check('Finish stays at same thumb target',cert_box==fixed)
   await click('class-continue');check('Continue opens remaining topics',await js('__rainy711.bonus.lesson')=='login')
   for _ in range(6):await click('class-next')
   check('Extra topic does not force another ceremony',await js('__rainy711.bonus.route')=='lesson' and len(await js('__rainy711.bonus.course.completed'))==4)
   await click('sources');check('Sources are available in overflow menu',await page.locator('.bonus-dialog').is_visible());await click('dialog-close');await click('board');await shot('blackboard');await click('reading');await click('text-size');await click('text-size');await click('dialog-close');check('Reading mode expands text area',await js('document.querySelector(".bonus-panel").getBoundingClientRect().top<innerHeight*.3'));check('Largest text is 26px',await js('__rainy711.bonus.textSize')==26);await shot('reading');check('Large text does not overflow page',await js('document.documentElement.scrollWidth===innerWidth&&document.querySelector(".bonus-panel").scrollWidth===document.querySelector(".bonus-panel").clientWidth'));await click('text-size');await click('reading');await click('dialog-close');await page.emulate_media(reduced_motion='reduce')
   await click('rooms');await click('claims');await click('trial','A');await click('evidence','photos');await page.wait_for_function('[...document.querySelectorAll(".bonus-photo-pair img")].every(i=>i.complete&&i.naturalWidth>0)');check('Both fixed evidence images load',await page.locator('.bonus-photo-pair img').count()==2);await shot('evidence');scroll_before=await js('document.querySelector(".bonus-panel").scrollTop');await click('dialog-close');check('Evidence close preserves case scroll',await js('document.querySelector(".bonus-panel").scrollTop')==scroll_before)
   await click('compare-field','cause');await click('evidence','application');await click('clue','time');await click('compare');await click('evidence','record');await click('clue','ammo');await click('compare');check('Two mistakes show concrete hint','提示' in await page.locator('.bonus-response').inner_text());await click('evidence','record');await click('clue','thunder');check('Claim and selected quote are shown together',await page.locator('.bonus-comparison blockquote').count()==2);await click('compare');await click('compare-field','loss');await click('evidence','photos');await shot('evidence-comparison');await click('clue','damage');await click('compare');check('Both exact clues recorded',len(await js('__rainy711.bonus.trial.proofs'))==2);await click('finish-a','accept');check('Stamping starts before result appears',await js('__rainy711.bonus.route')=='stamping');await js('__rainy711.tick(__rainy711.time+.2,0,true)');check('Evidence path accepts correction',await js('__rainy711.bonus.trial.result.status')=='更正受理');await shot('result-a')
   await click('export');await page.locator('.bonus-download').wait_for();check('PNG export is downloadable',(await page.locator('.bonus-download').get_attribute('href')).startswith('blob:'));await click('dialog-close')
   await click('trial','B');await click('field','cause:dinner');await click('field','responsibility:dragon');await click('field','loss:pear');await click('finish-b');await js('__rainy711.tick(__rainy711.time+.2,0,true)');check('False form rejected',await js('__rainy711.bonus.trial.result.status')=='退回補件');check('Loss is first reason',(await js('__rainy711.bonus.trial.result.reasons[0]')).startswith('損失漏報'));await shot('result-b')
   await click('trial','B');await click('field','cause:human');await click('field','responsibility:zhuang');await click('field','loss:building');await shot('form');await click('finish-b');await js('__rainy711.tick(__rainy711.time+.2,0,true)');check('Accurate form accepted',await js('__rainy711.bonus.trial.result.status')=='更正受理');await click('claims');await click('preference','both');check('Preference saved',await js('__rainy711.bonus.preference')=='both')
   for _ in range(10):await click('rooms');await click('classroom')
   await click('text-size');await click('reading');await click('close');check('Return restores mission phase',await js('__rainy711.mission.phase')==before['phase']);check('Return consumes paused source-clock gap',await js('__rainy711.mission.time')==before['time']);check('Return preserves camera',await js('__rainy711.camera')==before['camera']);check('One renderer after repeated visits',await js('__rainy711.rendererCount')==1);check('No background is left inert',await js('!document.querySelector(".mission-shell").inert'))
   await page.reload();await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);check('Short-course graduation survives reload',await js('__rainy711.bonus.course.stamped') and len(await js('__rainy711.bonus.course.completed'))==4);check('Reading preference survives reload',await js('__rainy711.bonus.reading'));check('Text size survives reload',await js('__rainy711.bonus.textSize')==22);check('Unlock survives reload',await js('__rainy711.bonus.unlocked'));check('Read chapters survive reload',len(await js('__rainy711.bonus.read'))==4);await page.locator('.bonus-entry').click();check('Spoiler warning not repeated',await js('__rainy711.bonus.route')=='rooms')
   await click('claims');await page.set_viewport_size({'width':844,'height':390});await js('__rainy711.tick(__rainy711.time,0,true)');await shot('landscape');check('Landscape has no horizontal overflow',await js('document.documentElement.scrollWidth===innerWidth'));await page.set_viewport_size({'width':390,'height':844});check('Portrait has no horizontal overflow',await js('document.documentElement.scrollWidth===innerWidth'))
   await click('close');await page.emulate_media(reduced_motion='no-preference');await js("()=>{window.__bonusToneCount=0;const original=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(...args){window.__bonusToneCount++;return original.apply(this,args)}}");await page.locator('#menu-toggle').click();await page.locator('#sound').check();await page.locator('#menu-close').click();await page.locator('.bonus-entry').click();await click('claims');await click('trial','B');await click('field','cause:human');await click('field','responsibility:zhuang');await click('field','loss:building');await js('__rainy711.pauseForCapture()');check('New case starts with unstamped paper',not await js('__rainy711.bonus.room.paperStamped'));await click('finish-b');await js('__rainy711.tick(__rainy711.time+.2,0,true)');check('Normal stamp holds before impact',await js('__rainy711.bonus.stampPhase')=='lifting');await js('__rainy711.tick(__rainy711.time+.22,0,true)');check('Ink appears at stamp impact',await js('__rainy711.bonus.room.paperStamped'));check('Stamp impact has one sound',await js('window.__bonusToneCount')==1);await js('__rainy711.tick(__rainy711.time+.1,0,true)');check('Repeated frame does not repeat impact sound',await js('window.__bonusToneCount')==1);await page.screenshot(path=str(OUT/'bonus-stamp.png'));await js('__rainy711.tick(__rainy711.time+.8,0,true)');check('Stamp sequence reaches result',await js('__rainy711.bonus.route')=='result');await click('close');await page.locator('#menu-toggle').click();await page.locator('#sound').uncheck();await page.locator('#menu-close').click();await page.locator('.bonus-entry').click();await click('claims');await click('trial','B');await click('field','cause:human');await click('field','responsibility:zhuang');await click('field','loss:building');await click('finish-b');await js('__rainy711.tick(__rainy711.time+1.2,0,true)');check('Sound off suppresses stamp sound',await js('window.__bonusToneCount')==1)
   check('No JS exceptions',not errors,errors)
  finally:
   result['errors']=errors;(OUT/'bonus-browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));await browser.close()
 print(json.dumps(result,ensure_ascii=False,indent=2))
asyncio.run(main())
