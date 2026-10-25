import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 results=[]
 def check(name,ok):results.append({'name':name,'passed':bool(ok)});print(name,ok,flush=True);assert ok,name
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']);page=await b.new_page(viewport={'width':844,'height':390});await page.goto('http://127.0.0.1:4214/endfield-model-lab/',wait_until='domcontentloaded');await page.wait_for_function('!!window.__rainy711',timeout=180000)
  await page.evaluate('__rainy711.pauseForCapture();__rainy711.toggleAutoCamera();__rainy711.frameView("street");__rainy711.tick(__rainy711.time,0,true)')
  async def clickpoint(point):
   xy=await page.evaluate('p=>{const a=__rainy711.projectPoint(p);return [(a[0]+1)*innerWidth/2,(1-a[1])*innerHeight/2]}',point);assert 0<xy[0]<844 and 0<xy[1]<390,xy;print('CLICK',xy,await page.evaluate('xy=>document.elementFromPoint(...xy)?.outerHTML.slice(0,160)',xy),flush=True);await page.mouse.click(*xy);await page.evaluate('__rainy711.tick(__rainy711.time+.1,.1,true)')
  await clickpoint([-6.5,3.57,4.5]);check('Actual click changes traffic signal',await page.evaluate('__rainy711.switches.signal')==1)
  await clickpoint([0,4.55,1.9]);check('Actual click switches room light off',await page.evaluate('__rainy711.switches.room')==False)
  await clickpoint([0,4.55,1.9]);check('Actual click switches room light on',await page.evaluate('__rainy711.switches.room')==True)
  await clickpoint([-3.5,1.5,1.9]);check('Actual click opens the door',await page.evaluate('__rainy711.switches.door')==True)
  await clickpoint([-3.5,1.5,1.9]);check('Actual click closes the door',await page.evaluate('__rainy711.switches.door')==False)
  before=await page.evaluate('__rainy711.switches.signal');xy=await page.evaluate('p=>{const a=__rainy711.projectPoint(p);return [(a[0]+1)*innerWidth/2,(1-a[1])*innerHeight/2]}',[-6.5,3.57,4.5]);await page.mouse.move(*xy);await page.mouse.down();await page.mouse.move(xy[0]+30,xy[1]+20,steps=5);await page.mouse.up();check('Drag does not trigger signal switch',await page.evaluate('__rainy711.switches.signal')==before)
  Path('artifacts/v11-interactions.json').write_text(json.dumps({'passed':True,'real_iphone_test':False,'checks':results},ensure_ascii=False,indent=2)+'\n');await b.close()
asyncio.run(main())
