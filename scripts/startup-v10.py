"""Exercise failed model download and retry in the actual app. No iPhone claim."""
import asyncio,json,time
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 result={'real_iphone_test':False,'checks':[]}
 def check(name,value):
  result['checks'].append({'name':name,'passed':bool(value)});print(name,value,flush=True);assert value,name
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');count=0
  async def model(route):
   nonlocal count
   count+=1
   if count==1:await route.fulfill(status=503,body='temporary unavailable')
   else:await route.continue_()
  await page.route('**/models/zhuang-fangyi.glb',model)
  await page.add_init_script("document.addEventListener('DOMContentLoaded',()=>{const n=document.querySelector('#characters');if(n)n.checked=false;});")
  await page.goto('http://127.0.0.1:4210/endfield-model-lab/',wait_until='domcontentloaded',timeout=90000)
  await page.wait_for_selector('#asset-retry:not([hidden])',timeout=150000)
  check('Failed actor does not silently start story',await page.locator('.mission-launch').count()==0)
  check('Visible error identifies model failure','503' in await page.locator('#loading-message').inner_text())
  check('Loaded street retains one canvas',await page.locator('canvas').count()==1)
  await page.screenshot(path='/workspace/zhuang-rainy-711/artifacts/v10-model-retry.png')
  await page.locator('#asset-retry').click();await page.wait_for_function('!!window.__rainy711',timeout=180000)
  check('Retry actually fetches model again',count==2)
  check('Successful retry restores both performers',await page.evaluate('__rainy711.actorsLoaded&&__rainy711.actorsVisible&&!!__rainy711.dragonPosition'))
  check('Remembered unchecked checkbox does not hide opening cast',await page.locator('#characters').is_checked())
  check('Retry preserves one renderer and one mission',await page.locator('canvas').count()==1 and await page.locator('.mission-shell').count()==1)
  await page.evaluate('__rainy711.pauseForCapture()');result['passed']=True
  Path('/workspace/zhuang-rainy-711/artifacts/v10-startup-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');await b.close()
asyncio.run(main())
