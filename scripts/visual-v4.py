"""Final rendered captures and focused UI regression checks. Desktop only."""
import asyncio,json,os
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4173/')
async def main():
 result={'url':URL,'real_iphone_test':False,'checks':[]};errors=[]
 def check(name,ok,detail=None):
  result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});print(name,'PASS' if ok else 'FAIL',flush=True);assert ok,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='reduce');page.set_default_timeout(90000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  async def js(code):return await page.evaluate(code)
  async def capture(name):
   path=OUT/name;await page.screenshot(path=str(path),timeout=120000);im=Image.open(path).convert('RGB');w,h=im.size;variation=max(ImageStat.Stat(im.crop((int(w*.15),int(h*.22),int(w*.85),int(h*.7)))).stddev);check('Rendered scene visible '+name,variation>15,round(variation,2))
  try:
   await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);await js('__rainy711.pauseForCapture()')
   await page.locator('#menu-toggle').click()
   for n,quality in enumerate(['low','high','balanced']):
    await page.locator('#quality').select_option(quality);await js('__rainy711.tick('+str(2+n*.1)+')');code=await js('document.querySelector("canvas").getContext("webgl2").getError()');check('MSAA framebuffer clean '+quality,code==0,code)
   await page.locator('#menu-close').click()
   await js('__rainy711.frameView("street");__rainy711.tick(3)');await capture('v4-portrait.png')
   await js('__rainy711.frameView("detail");__rainy711.tick(3.1)');await capture('v4-detail.png')
   await js('__rainy711.storyStart()');await page.locator('.walk-toggle').click();check('Walking can be enabled during story',await js('__rainy711.walking'))
   await js('()=>{for(let n=0;!__rainy711.story.waitingChoice&&n<180;n++)__rainy711.storyNext();__rainy711.tick(4)}')
   check('Choice stops walking controls',not await js('__rainy711.walking'));await capture('v4-dinner-choice.png')
   for i,branch in enumerate(['A','B','C']):
    if i:
     await js('()=>{__rainy711.storyReplay();for(let n=0;!__rainy711.story.waitingChoice&&n<180;n++)__rainy711.storyNext()}')
    await js('__rainy711.storyChoose("'+branch+'");__rainy711.tick('+str(5+i)+')');await capture('v4-meal-'+branch+'.png')
   await js('()=>{for(let n=0;!__rainy711.story.waitingChoice&&n<180;n++)__rainy711.storyNext();__rainy711.tick(9)}')
   check('Ending panel does not overlap replay badge',await page.locator('.story-panel').is_visible() and not await page.locator('.story-idle').is_visible())
   await page.locator('[data-choice=listen]').click();await js('__rainy711.tick(10)');await capture('v4-coda.png')
   await page.locator('.story-minor').filter(has_text='收起').click();check('Collapse shows resume and freezes story',await page.locator('.story-idle').is_visible() and await js('__rainy711.story.paused'))
   await page.get_by_role('button',name='繼續故事',exact=True).click();check('Resume hides replay badge',not await page.locator('.story-idle').is_visible() and not await js('__rainy711.story.paused'))
   await js('()=>{let n=0;while(!__rainy711.story.waitingChoice&&n++<100)__rainy711.storyNext();__rainy711.storyChoose("keep");for(let n=0;__rainy711.story.busy&&n<30;n++)__rainy711.storyNext()}')
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500);await js('__rainy711.frameView("story");__rainy711.tick(12)');await capture('v4-landscape.png')
   await page.set_viewport_size({'width':1440,'height':1000});await page.wait_for_timeout(500);await js('__rainy711.frameView("street");__rainy711.tick(13)');await capture('v4-desktop.png')
   check('Final framebuffer clean',await js('document.querySelector("canvas").getContext("webgl2").getError()')==0)
   check('No runtime or shader errors',not errors,errors);result['passed']=True
  except Exception as e:result['passed']=False;result['failure']=str(e);raise
  finally:
   result['errors']=errors;(OUT/'v4-visual-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
