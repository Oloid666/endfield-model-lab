"""Targeted stamp cancellation, replay, audio and reading-focus browser checks."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(__file__).resolve().parents[1]/'artifacts'
async def main():
 results=[]
 def check(name,ok):results.append({'name':name,'passed':bool(ok)});assert ok,name
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  ctx=await b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
  await ctx.add_init_script("localStorage.setItem('rainy711.bonus.v1',JSON.stringify({unlocked:true,warned:true}));window.toneCount=0;const makeTone=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(...args){toneCount++;return makeTone.apply(this,args)}")
  page=await ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_default_timeout(15000)
  async def js(code):return await page.evaluate(code)
  async def click(action,value=None):
   await page.wait_for_function('!__rainy711.bonus.busy')
   if await page.locator('.bonus-class-dock').is_visible():
    if action in ['reading','text-size','board','close'] and not await page.locator('.bonus-dialog').is_visible():await page.locator('[data-action=class-menu]').click()
    if action=='lesson':
     await page.locator('[data-action=class-menu]').click();await page.locator('.bonus-class-catalog summary').click();await page.locator('[data-action=lesson-id]').nth(int(value)).click();return
   s=f'[data-action="{action}"]'+(f'[data-value="{value}"]' if value else '');await page.locator('.bonus-ui '+s+':visible').first.click()
  async def case():
   await click('claims');await click('trial','B');
   for value in ['cause:human','responsibility:zhuang','loss:building']:await click('field',value)
  try:
   await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/'),wait_until='domcontentloaded');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000)
   await page.locator('#menu-toggle').click();await page.locator('#sound').check();await page.locator('#menu-close').click();await js('__rainy711.pauseForCapture()');await page.locator('.bonus-entry').click();await case()
   check('New case has blank paper',not await js('__rainy711.bonus.room.paperStamped'));await click('finish-b');await js('__rainy711.tick(__rainy711.time+.2,0,true)');check('No ink before impact',not await js('__rainy711.bonus.room.paperStamped'));await click('close');check('Cancel does not mark case complete',not await js('__rainy711.bonus.finished.includes("B")'));check('Cancel before impact has no sound',await js('toneCount')==0)
   await page.locator('.bonus-entry').click();await case();await click('finish-b');await js('__rainy711.tick(__rainy711.time+.41,0,true)');check('Ink appears on impact',await js('__rainy711.bonus.room.paperStamped'));check('Impact sound once',await js('toneCount')==1);await page.screenshot(path=str(OUT/'bonus-stamp.png'));await js('__rainy711.tick(__rainy711.time+.05,0,true)');check('No repeated sound',await js('toneCount')==1);await js('__rainy711.tick(__rainy711.time+.8,0,true)');check('Printing finishes',await js('__rainy711.bonus.route')=='result');await click('trial','B');check('Replay clears previous red stamp',not await js('__rainy711.bonus.room.paperStamped'))
   await click('claims');await click('rooms');await click('classroom');await click('lesson','0');await click('reading');check('Reading toggle keeps focus',await js('document.activeElement.dataset.action')=='reading');await click('text-size');check('Font control keeps focus',await js('document.activeElement.dataset.action')=='text-size');await click('board');check('Look at board restores performance layout',not await js('__rainy711.bonus.reading'));await js('__rainy711.tick(__rainy711.time+1,0,true)');await page.screenshot(path=str(OUT/'bonus-blackboard.png'));
   for _ in range(24):
    if await js('__rainy711.bonus.route')!='lesson':break
    await click('class-next')
   await js('__rainy711.tick(__rainy711.time+2,0,true)');await js('__rainy711.tick(__rainy711.time+1.2,0,true)');check('Short course produces death certificate',await js('__rainy711.bonus.route')=='class-result');await click('class-next');check('Same bottom button finishes all the way to street',not await js('__rainy711.bonus.active'));check('No page exception',not errors)
  finally:
   (OUT/'bonus-feedback-results.json').write_text(json.dumps({'checks':results,'errors':errors,'real_iphone_test':False},ensure_ascii=False,indent=2));await b.close()
 print(json.dumps(results,ensure_ascii=False,indent=2))
asyncio.run(main())
