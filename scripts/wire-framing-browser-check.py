"""Actual seven-tap/NIKKE sequence to shared grid cable; save true scene frames."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path(os.environ.get('WIRE_OUT','/tmp/rain-wire-framing'));OUT.mkdir(exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
  page=await b.new_page(viewport={'width':int(os.environ.get('WIRE_WIDTH','390')),'height':int(os.environ.get('WIRE_HEIGHT','844'))},reduced_motion='reduce' if os.environ.get('REDUCED') else 'no-preference');errors=[];rows=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:4200/'),wait_until='domcontentloaded')
  await page.locator('.loading-details summary').click();await page.get_by_role('button',name='直接進入',exact=True).click()
  await page.wait_for_function('window.__rainy711?.actorsLoaded && document.querySelector("#loading").hidden',timeout=240000)
  await page.evaluate('__rainy711.pauseForCapture();const q=document.querySelector("#quality");q.value="low";q.dispatchEvent(new Event("change"))')
  async def tick(s=.1):await page.evaluate('(s)=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.1));for(let i=0;i<n;i++)q.tick(q.time+s/n,Math.min(s/n,.06),false)}',s)
  async def shot(name):
   await page.evaluate('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await tick(0);await page.evaluate('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/(name+'.png')))
   row=await page.evaluate('({phase:__rainy711.mission.phase,node:__rainy711.mission.nodeId,beat:__rainy711.cinematic.cameraBeat,devices:__rainy711.devices})');row['name']=name;rows.append(row);print(name,row['beat'],flush=True)
  await page.evaluate('__rainy711.frameView("street")');await tick(.1)
  for _ in range(7):
   q=await page.evaluate('()=>{const q=__rainy711,p=q.projectPoint([0,3.1,2.23]),r=document.querySelector("#scene").getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}');await page.mouse.click(q['x'],q['y']);await tick(.1)
  assert await page.evaluate('__rainy711.debug.unlocked')
  await page.wait_for_timeout(3200)
  await page.evaluate('__rainy711.debugJump("nikke")');await tick(1.6);await shot('nikke-console')
  # A framed console must be visible, not merely a valid camera transform.
  from PIL import Image
  img=Image.open(OUT/'nikke-console.png').convert('RGB');cx,cy=img.width//2,img.height//2
  assert sum(sum(img.getpixel((x,y)))>420 for x in range(cx-90,cx+90) for y in range(cy-75,cy+75))>6000,'Launcher hidden by geometry'
  for _ in range(30):
   if await page.evaluate('__rainy711.mission.tablet?.stage')=='rapi-mask':break
   await page.evaluate('__rainy711.tabletAction("talk-next")');await tick(.4)
  await shot('nikke-eye-bar');await tick(.5);assert await page.evaluate('__rainy711.tabletAction("enable")');assert await page.evaluate('__rainy711.mission.tablet.stage')=='cable'
  old=0
  for age in [.2,.8,1.55,2.3,3.5,4.8,5.6]:
   await tick(age-old);old=age;await shot('wire-'+str(age));assert await page.evaluate('__rainy711.devices.sourceKind')=='tianshi-grid';assert await page.evaluate('__rainy711.devices.energyVisible')==(age>=.4)
  await page.evaluate('__rainy711.restoreChapter("last")');await tick(2);await shot('server-detail-v2')
  assert not errors,errors
  (OUT/'results.json').write_text(json.dumps({'rows':rows,'errors':errors},indent=2))
  await b.close()
asyncio.run(main())
