import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 results=[]
 def check(name,ok):results.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);page=await b.new_page(viewport={'width':390,'height':844},has_touch=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)));await page.goto(os.environ.get('UI_TEST_URL','http://127.0.0.1:4211/scripts/fixtures/rhythm-ui.html'));await page.wait_for_function('!!window.h')
  await page.locator('.rhythm-pad').click();await page.wait_for_function("h.m.state.heat.status==='burnt'",timeout=10000);check('Real pointer first attempt fails as story',await page.evaluate('h.m.state.heat.failures')==1)
  await page.locator('.rhythm-retry').click()
  for round in range(3):
   await page.locator('.rhythm-pad').click();state=await page.evaluate('h.m.state.heat');origin=await page.evaluate('h.m.rhythm.origin');box=await page.locator('.rhythm-pad').bounding_box();x=box['x']+box['width']/2;y=box['y']+box['height']/2
   for note in state['notes']:
    await page.wait_for_function('t=>h.m.time>=t',arg=origin+note['at']-.025,timeout=10000)
    await page.mouse.move(x,y);await page.mouse.down()
    if note['type']=='hold':await page.wait_for_function('t=>h.m.time>=t',arg=origin+note['end']-.025,timeout=10000)
    await page.mouse.up()
   await page.wait_for_function("h.m.phase!=='heat'||h.m.state.heat.status!=='playing'",timeout=10000)
   check(f'Real pointer round {round+1} succeeds',await page.evaluate('h.m.rhythm.round')==round+1)
  check('Real pointer game reaches aftermath',await page.evaluate('h.m.phase')=='flashback-end');check('No UI errors',not errors)
  Path('/workspace/zhuang-rainy-711/artifacts/v10-rhythm-ui.json').write_text(json.dumps({'passed':True,'real_iphone_test':False,'checks':results},ensure_ascii=False,indent=2)+'\n');await b.close()
asyncio.run(main())
