"""Targeted negotiation cancellation, replay, audio and reading-focus checks."""
import asyncio,json,os
from pathlib import Path
from PIL import Image
from playwright.async_api import async_playwright
OUT=Path(__file__).resolve().parents[1]/'artifacts'
async def main():
 results=[]
 def check(name,ok):
  results.append({'name':name,'passed':bool(ok)});print(name,bool(ok),flush=True);assert ok,name
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  ctx=await b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  await ctx.add_init_script("localStorage.setItem('rainy711.bonus.v1',JSON.stringify({unlocked:true,warned:true}));window.toneCount=0;const makeTone=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(...args){toneCount++;return makeTone.apply(this,args)}")
  page=await ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(90000)
  async def js(code):return await page.evaluate(code)
  async def settle_resize():await js('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
  async def click(action,value=None):
   await page.wait_for_function('!__rainy711.bonus.busy')
   is_class=await page.locator('.bonus-class-dock:not(.bonus-claims-dock)').is_visible()
   is_claim=await page.locator('.bonus-claims-dock').is_visible()
   if action in ['reading','text-size','board','close','rooms','claims-reset','export'] and (is_class or is_claim):
    if not await page.locator('.bonus-dialog').is_visible():await page.locator('[data-action='+('class-menu' if is_class else 'claims-menu')+']').click()
    if action=='rooms':action='class-rooms'
   s=f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value else '');scope=page.locator('.bonus-dialog') if await page.locator('.bonus-dialog').is_visible() else page.locator('.bonus-ui');await scope.locator(s+':visible').first.click()
  captured_policy=False
  async def to_stamp():
   nonlocal captured_policy
   for _ in range(40):
    phase=await js('__rainy711.bonus.negotiation.phase')
    if phase=='reveal' and await js('__rainy711.bonus.negotiation.line')==1 and not captured_policy:
     await js('__rainy711.tick(__rainy711.time+.8,0,true)');await page.screenshot(path=str(OUT/'bonus-policyholder.png'));captured_policy=True
    if phase=='stamp':return
    if phase=='choice':await click('claims-select','B')
    else:await click('claims-next')
   raise AssertionError('Never reached settlement')
  async def new_case():
   await click('claims');await click('claims-next');await js('__rainy711.tick(__rainy711.time+.8,0,true)');await page.screenshot(path=str(OUT/'bonus-form.png'));await to_stamp()
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000)
   await page.locator('#menu-toggle').click();await page.locator('#sound').check();await page.locator('#menu-close').click();await js('__rainy711.pauseForCapture()');await page.locator('.bonus-entry').click();await new_case()
   check('Each objection sounds once',await js('toneCount')==2)
   check('New case has blank paper',not await js('__rainy711.bonus.room.paperStamped'));await js('__rainy711.tick(__rainy711.time+.2,0,true)');check('No ink before impact',not await js('__rainy711.bonus.room.paperStamped'));await click('close');check('Cancel does not mark case complete',not await js('__rainy711.bonus.claimsSettled'));await js('__rainy711.tick(__rainy711.time+5,0,false)');check('Cancel before impact has no stamp sound',await js('toneCount')==2)
   await page.locator('.bonus-entry').click();await click('claims');await click('claims-next');check('Replay clears reveal, choices and stamps',not await js('__rainy711.bonus.room.policyholderVisible') and await js('Object.keys(__rainy711.bonus.negotiation.choices).length')==0 and await js('__rainy711.bonus.room.completedStamps')==0);await to_stamp();await js('__rainy711.tick(__rainy711.time+.41,0,true)');check('Ink appears on impact',await js('__rainy711.bonus.room.paperStamped'));check('Impact sound once',await js('toneCount')==5);await js('__rainy711.tick(__rainy711.time+.05,0,true)');check('No repeated sound',await js('toneCount')==5)
   await click('claims-reset');check('Restart cancels stamp ceremony',await js('__rainy711.bonus.negotiation.phase')=='choice' and not await js('__rainy711.bonus.room.paperStamped'));await js('__rainy711.tick(__rainy711.time+5,0,true)');check('Cancelled ceremony cannot complete later',not await js('__rainy711.bonus.claimsSettled') and await js('toneCount')==5)
   await to_stamp()
   for _ in range(3):await js('__rainy711.tick(__rainy711.time+.42,0,true)');await js('__rainy711.tick(__rainy711.time+.8,0,true)')
   check('All three document stamps persist in room',await js('__rainy711.bonus.room.completedStamps')==3);check('Three stamps and two objections played once',await js('toneCount')==10);check('Result has happy ending',await js('__rainy711.bonus.route')=='settlement-result');await page.screenshot(path=str(OUT/'bonus-settlement.png'));await click('export');await page.wait_for_function('document.querySelector(".bonus-export")?.naturalWidth===1080');check('Export is reachable in the result menu',await page.locator('.bonus-download').is_visible());await click('dialog-close');await click('claims-reset');check('Replay hides old red ink and policyholder',not await js('__rainy711.bonus.room.paperStamped') and not await js('__rainy711.bonus.room.policyholderVisible') and await js('__rainy711.bonus.room.completedStamps')==0)
   await click('reading');check('Claims reading toggle keeps focus',await js('document.activeElement.dataset.action')=='reading');await click('text-size');await click('text-size');check('Claims font control keeps focus',await js('document.activeElement.dataset.action')=='text-size');await click('dialog-close');check('Large text has no horizontal overflow',await js('document.querySelector(".bonus-panel").scrollWidth===document.querySelector(".bonus-panel").clientWidth'));await page.screenshot(path=str(OUT/'bonus-claims-large.png'))
   await page.set_viewport_size({'width':844,'height':390});await settle_resize();await js('__rainy711.tick(__rainy711.time+.8,0,true)');await page.screenshot(path=str(OUT/'bonus-claims-landscape.png'));box=await page.locator('.bonus-claims-dock button').bounding_box();check('Landscape advance stays within screen',box['x']>=0 and box['x']+box['width']<=844 and box['y']+box['height']<=390);menu=await page.locator('.bonus-nav button').bounding_box();check('Landscape menu does not cover advance',menu['y']+menu['height']<=box['y'] or menu['x']+menu['width']<=box['x']);await page.set_viewport_size({'width':390,'height':844});await settle_resize()
   await click('text-size');await click('reading');await click('dialog-close');await click('rooms');await click('classroom');await click('class-next');check('Classroom begins with Yaoguang',await js('__rainy711.bonus.lesson')=='general');await click('reading');check('Class reading toggle keeps focus',await js('document.activeElement.dataset.action')=='reading');await click('text-size');check('Class font control keeps focus',await js('document.activeElement.dataset.action')=='text-size');await click('board');check('Look at board restores performance layout',not await js('__rainy711.bonus.reading'));await js('__rainy711.tick(__rainy711.time+1,0,true)');await page.screenshot(path=str(OUT/'bonus-blackboard.png'))
   await click('class-next');check('Analysis opens a board-first shot',await js('__rainy711.bonus.room.focus')=='board');check('Numeric death rate and reading progress are separate',await page.locator('.bonus-death-track').count()==0 and await page.locator('.bonus-lesson-track').get_attribute('aria-valuenow')=='20');check('No central overlay remains',await page.locator('.bonus-board-caption').count()==0)
   await js('__rainy711.tick(__rainy711.time+.8,0,true)');await page.screenshot(path=str(OUT/'bonus-board-portrait.png'))
   await click('class-next');check('Another explanation angle is available',await js('__rainy711.bonus.room.focus')=='board-side');check('Board has one short keyword rather than repeated filler',not await js('__rainy711.bonus.room.board.lines.length'))
   await page.set_viewport_size({'width':844,'height':390});await settle_resize();await js('__rainy711.tick(__rainy711.time+.8,0,true)');await page.screenshot(path=str(OUT/'bonus-board-landscape.png'));check('Landscape blackboard is visibly rendered',len(set(Image.open(OUT/'bonus-board-landscape.png').crop((10,80,350,310)).getdata()))>100);check('Interview layout fits landscape',await js('document.documentElement.scrollWidth===innerWidth'));await page.set_viewport_size({'width':390,'height':844});await settle_resize()
   for _ in range(4):await click('class-next')
   check('Second topic is Mikoto',await js('__rainy711.bonus.lesson')=='mikoto');check('Cross-show objection is absent from recap','妳剛才才說我錯棚' not in await page.locator('.bonus-content').inner_text())
   for _ in range(4):await click('class-next')
   check('Cross-show objection appears at the final reaction','妳剛才才說我錯棚' in await page.locator('.bonus-spoken').inner_text());check('First reaction is not confused with final reading progress',await page.locator('.bonus-lesson-track').get_attribute('aria-valuenow')=='80');await click('class-next');check('Final reply reaches 100 percent reading progress',await page.locator('.bonus-lesson-track').get_attribute('aria-valuenow')=='100');await click('class-next')
   for _ in range(30):
    if await js('__rainy711.bonus.route')!='lesson':break
    await click('class-next')
   await js('__rainy711.tick(__rainy711.time+2,0,true)');await js('__rainy711.tick(__rainy711.time+1.2,0,true)');check('Short course produces death certificate',await js('__rainy711.bonus.route')=='class-result');await click('class-next');check('Same bottom button finishes to street',not await js('__rainy711.bonus.active'));check('No page exception',not errors)
  finally:
   (OUT/'bonus-feedback-results.json').write_text(json.dumps({'checks':results,'errors':errors,'real_iphone_test':False},ensure_ascii=False,indent=2));await b.close()
 print(json.dumps(results,ensure_ascii=False,indent=2))
asyncio.run(main())
