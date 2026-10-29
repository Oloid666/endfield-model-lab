"""Real Chromium interaction QA; portrait viewport is not iPhone Safari validation."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';OUT.mkdir(exist_ok=True)
async def main():
 result={'browser':'Chromium / SwiftShader','real_iphone_test':False,'checks':[]}
 def check(name,ok,detail=None):
  result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});print(name,bool(ok),flush=True);assert ok,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  context=await browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',is_mobile=True,has_touch=True)
  page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_default_timeout(90000)
  async def js(s,arg=None):return await page.evaluate(s,arg)
  async def click(action,value=None):
   await page.wait_for_function('!__rainy711.bonus.busy')
   is_class=await page.locator('.bonus-class-dock:not(.bonus-claims-dock)').is_visible()
   if is_class and action=='rooms':
    if not await page.locator('.bonus-dialog').is_visible():await page.locator('[data-action=class-menu]').click()
    action='class-rooms'
   if is_class and action in ['reading','text-size','board','sources','close','prev']:
    selector=f'.bonus-ui [data-action="{action}"]'
    if not await page.locator('.bonus-dialog').is_visible():await page.locator('[data-action=class-menu]').click()
   if await page.locator('.bonus-claims-dock').is_visible() and action in ['rooms','close','reading','text-size','claims-reset','export']:
    if not await page.locator('.bonus-dialog').is_visible():await page.locator('[data-action=claims-menu]').click()
    if action=='rooms':action='class-rooms'
   selector=f'.bonus-ui [data-action="{action}"]'+(f'[data-value="{value}"]' if value is not None else '')
   scope=page.locator('.bonus-dialog') if await page.locator('.bonus-dialog').is_visible() else page.locator('.bonus-ui')
   await scope.locator(selector.replace('.bonus-ui ', '')+':visible').first.click()
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
   check('Central board overlay is removed',await page.locator('.bonus-board-caption').count()==0)
   check('Death rate is numeric without a bar',await page.locator('.bonus-death-track').count()==0)
   check('Reading starts at zero',await page.locator('.bonus-lesson-track').get_attribute('aria-valuenow')=='0')
   for topic in range(4):
    for step in range(6):
     check('Reading progress is separate from death rate',await page.locator('.bonus-lesson-track').get_attribute('aria-valuenow')==str(step*20))
     check('Only short stage labels appear',not __import__('re').search(r'\d+ / \d+',await page.locator('.bonus-content').inner_text()))
     box=await page.locator('.bonus-class-dock [data-action=class-next]').bounding_box();check('Primary stays at the same position',box==fixed);await click('class-next')
    check('Each distinct complete topic adds 25 percent',await js('__rainy711.bonus.course.percentage')==(topic+1)*25)
    if topic==0:
     await click('class-menu');await page.locator('.bonus-class-catalog summary').click();check('All nine topics remain in catalog',await page.locator('[data-action=lesson-id]').count()==9);await click('lesson-id','general')
     for _ in range(6):await click('class-next')
     check('Repeating a topic does not add credit',await js('__rainy711.bonus.course.percentage')==25)
   check('Four topics are sufficient',len(await js('__rainy711.bonus.course.completed'))==4)
   check('Remaining topics are optional',len(await js('__rainy711.bonus.read'))==4)
   check('Death meter reaches target before ceremony',await js('__rainy711.bonus.course.percentage')==100 and await js('__rainy711.bonus.route')=='class-wait')
   check('Meter animates instead of jumping to 100',await js('__rainy711.bonus.course.display')<100)
   await js('__rainy711.tick(__rainy711.time+.6,0,true)');check('Meter advances gradually',0<await js('__rainy711.bonus.course.display')<100);await shot('class-meter');check('Meter completion starts the stamp ceremony',await js('__rainy711.bonus.route')=='class-stamping');await js('__rainy711.tick(__rainy711.time+1.2,0,true)');check('Death certificate is stamped',await js('__rainy711.bonus.course.stamped'));await shot('class-certificate')
   cert_box=await page.locator('.bonus-class-dock [data-action=class-next]').bounding_box();check('Finish stays at same thumb target',cert_box==fixed)
   await click('class-continue');check('Continue opens remaining topics',await js('__rainy711.bonus.lesson')=='login')
   for _ in range(6):await click('class-next')
   check('Extra topic does not force another ceremony',await js('__rainy711.bonus.route')=='lesson' and len(await js('__rainy711.bonus.course.completed'))==5)
   for _ in range(24):await click('class-next')
   check('All nine topics can be completed and loop back',len(await js('__rainy711.bonus.course.completed'))==9 and await js('__rainy711.bonus.lesson')=='general')
   for _ in range(6):await click('class-next')
   check('Replay after all topics stays available',await js('__rainy711.bonus.route')=='lesson' and await js('__rainy711.bonus.lesson')=='mikoto')
   await click('sources');check('Sources are available in overflow menu',await page.locator('.bonus-dialog').is_visible());await click('dialog-close');await click('board');await shot('blackboard');await click('reading');await click('text-size');await click('text-size');await click('dialog-close');check('Reading mode expands text area',await js('document.querySelector(".bonus-panel").getBoundingClientRect().top<innerHeight*.3'));check('Largest text is 26px',await js('__rainy711.bonus.textSize')==26);await shot('reading');check('Large text does not overflow page',await js('document.documentElement.scrollWidth===innerWidth&&document.querySelector(".bonus-panel").scrollWidth===document.querySelector(".bonus-panel").clientWidth'));await click('text-size');await click('reading');await click('dialog-close');await page.emulate_media(reduced_motion='reduce')
   await click('rooms');await click('claims');await click('claims-next')
   check('Application starts with two complete options',await page.locator('.bonus-claim-choices button').count()==2)
   claims_fixed=await page.locator('.bonus-claims-dock button').bounding_box()
   expected_fields=['事故原因','處理方式','損失情形','佐證附件','理賠金額'];objections=0
   for field,label in enumerate(expected_fields):
    check('Five fields retain the requested order',await page.locator('.bonus-content h2').inner_text()==label)
    texts=await page.locator('.bonus-claim-choices button').all_inner_texts();check('Both joke options are readable',len(texts)==2 and all(len(t)>20 for t in texts))
    check('No policyholder name before reveal','莊方宜' not in await page.locator('.bonus-ui').inner_text() and not await js('__rainy711.bonus.room.policyholderVisible'))
    if field==0:await shot('form')
    choice='A' if field%2==0 else 'B';selected=texts[0 if choice=='A' else 1][1:]
    await click('claims-select',choice);check('Dragon reads chosen sentence',(await page.locator('.bonus-spoken').inner_text()).strip()==selected.strip());check('Advance button stays fixed',await page.locator('.bonus-claims-dock button').bounding_box()==claims_fixed);await click('claims-next')
    if field in [1,4]:
     objections+=1;check('Objection occurs after handling and amount',await js('__rainy711.bonus.negotiation.phase')=='objection');await shot('objection' if field==1 else 'objection-final');await click('claims-next');await click('claims-next')
   check('Exactly two insurance objections',objections==2)
   check('Dragon asks to check policyholder',await page.locator('.bonus-spoken').inner_text()=='你看看要保人。')
   check('Name is still hidden on Dragon cue',not await js('__rainy711.bonus.room.policyholderVisible'))
   await click('claims-next');check('Policyholder is revealed on next beat','莊方宜' in await page.locator('.bonus-policyholder').inner_text() and await js('__rainy711.bonus.room.policyholderVisible'));await shot('policyholder')
   await click('claims-next');check('Representative changes tone',await js('__rainy711.bonus.room.representative')=='polite');await click('claims-next');check('Dragon changes the subject','我今天不是來談這個的' in await page.locator('.bonus-spoken').inner_text());await click('claims-next');check('New business is monthly Xirang and property insurance','每個月幾噸息壤' in await page.locator('.bonus-spoken').inner_text());await click('claims-next');await click('claims-next');check('Three stamps begin after agreement',await js('__rainy711.bonus.negotiation.phase')=='stamp')
   for _ in range(3):await js('__rainy711.tick(__rainy711.time+.2,0,true)')
   check('All three stamps complete the happy ending',await js('__rainy711.bonus.route')=='settlement-result' and await js('__rainy711.bonus.negotiation.stampIndex')==3);check('Settlement is saved',await js('__rainy711.bonus.claimsSettled'));check('Result preserves five selected lines',len(await js('__rainy711.bonus.negotiation.choices && Object.keys(__rainy711.bonus.negotiation.choices)'))==5);await shot('settlement')
   await click('export');await page.locator('.bonus-download').wait_for();check('PNG export is downloadable',(await page.locator('.bonus-download').get_attribute('href')).startswith('blob:'));await page.wait_for_function('document.querySelector(".bonus-export")?.naturalWidth===1080');check('PNG preview loads',await page.locator('.bonus-export').evaluate('(i)=>i.complete&&i.naturalWidth===1080'));await click('dialog-close')
   for _ in range(10):await click('rooms');await click('classroom');check('Every classroom visit starts at zero',await js('__rainy711.bonus.course.percentage')==0)
   await click('text-size');await click('reading');await click('close');check('Return restores mission phase',await js('__rainy711.mission.phase')==before['phase']);check('Return consumes paused source-clock gap',await js('__rainy711.mission.time')==before['time']);check('Return preserves camera',await js('__rainy711.camera')==before['camera']);check('One renderer after repeated visits',await js('__rainy711.rendererCount')==1);check('No background is left inert',await js('!document.querySelector(".mission-shell").inert'))
   await page.reload();await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);check('New visit does not inherit graduation',not await js('__rainy711.bonus.course.stamped') and await js('__rainy711.bonus.course.percentage')==0);check('Reading preference survives reload',await js('__rainy711.bonus.reading'));check('Text size survives reload',await js('__rainy711.bonus.textSize')==22);check('New settlement survives reload',await js('__rainy711.bonus.claimsSettled'));check('Unlock survives reload',await js('__rainy711.bonus.unlocked'));check('Read chapters survive reload',len(await js('__rainy711.bonus.read'))==9);await page.locator('.bonus-entry').click();check('Spoiler warning not repeated',await js('__rainy711.bonus.route')=='rooms')
   await click('claims');await page.set_viewport_size({'width':844,'height':390});await js('__rainy711.tick(__rainy711.time,0,true)');await shot('landscape');check('Landscape has no horizontal overflow',await js('document.documentElement.scrollWidth===innerWidth'));await page.set_viewport_size({'width':390,'height':844});check('Portrait has no horizontal overflow',await js('document.documentElement.scrollWidth===innerWidth'))
   await click('close');await page.emulate_media(reduced_motion='no-preference');await js("()=>{window.__bonusToneCount=0;const original=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(...args){window.__bonusToneCount++;return original.apply(this,args)}}");await page.locator('#menu-toggle').click();await page.locator('#sound').check();await page.locator('#menu-close').click();await js('__rainy711.pauseForCapture()');await page.locator('.bonus-entry').click()
   async def to_stamp():
    await click('claims');await click('claims-next')
    for _ in range(40):
     phase=await js('__rainy711.bonus.negotiation.phase')
     if phase=='stamp':return
     await click('claims-select','B') if phase=='choice' else await click('claims-next')
    raise AssertionError('Did not reach stamp')
   await to_stamp();check('Two objections each play once',await js('window.__bonusToneCount')==2);await js('window.__bonusToneCount=0');check('New case starts with unstamped paper',not await js('__rainy711.bonus.room.paperStamped'));await js('__rainy711.tick(__rainy711.time+.2,0,true)');check('Normal stamp holds before impact',await js('__rainy711.bonus.stampPhase')=='lifting');await js('__rainy711.tick(__rainy711.time+.22,0,true)');check('Ink appears at stamp impact',await js('__rainy711.bonus.room.paperStamped'));check('Stamp impact has one sound',await js('window.__bonusToneCount')==1);await js('__rainy711.tick(__rainy711.time+.1,0,true)');check('Repeated frame does not repeat impact sound',await js('window.__bonusToneCount')==1);await page.screenshot(path=str(OUT/'bonus-stamp.png'));await js('__rainy711.tick(__rainy711.time+.8,0,true)')
   for _ in range(2):await js('__rainy711.tick(__rainy711.time+.42,0,true)');await js('__rainy711.tick(__rainy711.time+.8,0,true)')
   check('Three stamp sequence reaches result',await js('__rainy711.bonus.route')=='settlement-result');check('Three impacts produce exactly three sounds',await js('window.__bonusToneCount')==3)
   await click('close');await page.locator('#menu-toggle').click();await page.locator('#sound').uncheck();await page.locator('#menu-close').click();await page.locator('.bonus-entry').click();await to_stamp()
   for _ in range(3):await js('__rainy711.tick(__rainy711.time+1.2,0,true)')
   check('Sound off suppresses objections and stamps',await js('window.__bonusToneCount')==3)
   check('No JS exceptions',not errors,errors)
  finally:
   result['errors']=errors;(OUT/'bonus-browser-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));await browser.close()
 print(json.dumps(result,ensure_ascii=False,indent=2))
asyncio.run(main())
