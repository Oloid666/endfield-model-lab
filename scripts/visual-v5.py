"""Final V5 Pages-path render, entry framing and UI regression checks. Desktop only."""
import asyncio,json,os
from pathlib import Path
from PIL import Image,ImageStat
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts';URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:4186/endfield-model-lab/')
async def main():
 result={'url':URL,'real_iphone_test':False,'checks':[]};errors=[]
 def check(name,ok,detail=None):
  result['checks'].append({'name':name,'passed':bool(ok),'detail':detail});print(name,'PASS' if ok else 'FAIL',flush=True);assert ok,(name,detail)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1,reduced_motion='reduce');page.set_default_timeout(90000)
  page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
  async def js(code):return await page.evaluate(code)
  async def capture(name):
   path=OUT/name;await page.screenshot(path=str(path),timeout=120000);im=Image.open(path).convert('RGB');w,h=im.size
   variation=max(ImageStat.Stat(im.crop((int(w*.15),int(h*.22),int(w*.85),int(h*.7)))).stddev)
   check('Scene visible '+name,variation>15,round(variation,2))
  async def settle(t,frames=220):await js('()=>{for(let n=0;n<'+str(frames)+';n++)__rainy711.tick('+str(t)+'+n/60,1/60,false);__rainy711.tick('+str(t+frames/60)+',1/60)}')
  try:
   await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);await js('__rainy711.pauseForCapture()')
   check('Pages base path loads original model',await js('__rainy711.actorsLoaded&&__rainy711.bonesSupported'))
   await page.reload(wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000);await js('__rainy711.pauseForCapture()')
   check('Reload at repository path works',await js('__rainy711.actorsLoaded'))
   await js('__rainy711.teleport(-.22,1.4);__rainy711.frameView("awning")');await page.locator('.walk-toggle').click();await settle(3)
   near=await js('({camera:__rainy711.camera,owner:__rainy711.position,state:__rainy711.walkCamera})')
   check('Shallow entry keeps camera behind performer',near['camera'][2]-near['owner'][2]>1,near);await capture('v5-entry-threshold.png')
   await page.keyboard.down('ArrowUp');await js('()=>{for(let n=0;n<200&&__rainy711.position[2]>-.8;n++)__rainy711.tick(8+n/60,1/60,false)}');await page.keyboard.up('ArrowUp');await settle(12)
   inside=await js('({camera:__rainy711.camera,owner:__rainy711.position,state:__rainy711.walkCamera,dragon:__rainy711.idle.companion})')
   check('Deep entry camera passes below lintel',inside['camera'][2]<1.8 and inside['camera'][1]<3.1 and not inside['state']['stage'],inside)
   check('Dragon follows actual keyboard route inside',inside['dragon']['position'][2]<1.8 and inside['dragon']['distance']<1.6,inside['dragon']);await capture('v5-entry.png')
   await page.locator('.walk-toggle').click();await page.locator('[data-view="street"]').click();await js('__rainy711.tick(17)')
   check('Stopping and street preset clear indoor UI',not await js('document.querySelector("#app").classList.contains("interior-view")'))
   await js('__rainy711.teleport(-1.25,2.48);__rainy711.frameView("store");__rainy711.tick(18)');await capture('v5-storefront.png')
   await js('__rainy711.storyStart();for(let n=0;!__rainy711.story.waitingChoice&&n<180;n++)__rainy711.storyNext();__rainy711.storyChoose("C");for(let n=0;!__rainy711.story.waitingChoice&&n<180;n++)__rainy711.storyNext();__rainy711.tick(19)')
   check('Active dialogue leaves replay badge hidden',await page.locator('.story-panel').is_visible() and not await page.locator('.story-idle').is_visible())
   await page.locator('[data-choice=listen]').click();await js('__rainy711.tick(20)');await capture('v5-coda.png')
   await page.locator('.story-minor').filter(has_text='收起').click();check('Collapse pauses story and reveals resume',await page.locator('.story-idle').is_visible() and await js('__rainy711.story.paused'))
   await page.get_by_role('button',name='繼續故事',exact=True).click();check('Resume hides badge',not await page.locator('.story-idle').is_visible() and not await js('__rainy711.story.paused'))
   await page.set_viewport_size({'width':844,'height':390});await page.wait_for_timeout(500);await js('__rainy711.frameView("story");__rainy711.tick(21)');await capture('v5-landscape.png')
   check('Landscape fits viewport',await js('document.documentElement.scrollWidth===innerWidth&&document.documentElement.scrollHeight===innerHeight'))
   await page.set_viewport_size({'width':1440,'height':1000});await page.wait_for_timeout(500);await js('__rainy711.frameView("street");__rainy711.tick(22)');await capture('v5-desktop.png')
   await js('__rainy711.inspectLayout()');await capture('v5-layout.png')
   check('Final framebuffer clean',await js('document.querySelector("canvas").getContext("webgl2").getError()')==0)
   check('One canvas and no runtime/shader errors',await page.locator('#scene canvas').count()==1 and not errors,errors);result['passed']=True
  except Exception as e:result['passed']=False;result['failure']=str(e);raise
  finally:
   result['errors']=errors;(OUT/'v5-visual-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));await browser.close()
asyncio.run(main())
