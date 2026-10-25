"""Final build visual check after colour and tour-framing polish; desktop only."""
import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 out=Path('artifacts');errors=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await b.new_page(viewport={'width':390,'height':844});page.on('pageerror',lambda e:errors.append(str(e)))
  await page.goto('http://127.0.0.1:4215/endfield-model-lab/');await page.wait_for_function('!!window.__rainy711',timeout=180000)
  async def js(c):return await page.evaluate(c)
  async def advance(s):await page.evaluate('s=>{const q=__rainy711,a=q.time;for(let i=1;i<=Math.ceil(s*30);i++)q.tick(a+i/30,1/30,false);q.tick(q.time,0,true)}',s)
  async def finish():await js('()=>{const q=__rainy711,p=q.mission.phase;for(let i=0;i<100&&q.mission.phase===p;i++)q.missionNext()}')
  await js('__rainy711.pauseForCapture();__rainy711.missionStart()');await finish();await advance(7);await finish();await advance(2)
  await page.locator('.photo-shutter').click();await advance(2.5);await finish();await advance(1);await page.screenshot(path=str(out/'v12-photo-review.png'))
  await page.locator('.photo-send').click();await finish();await finish();await page.locator('.call-accept').click();await js('__rainy711.missionNext();__rainy711.missionNext();__rainy711.missionNext();__rainy711.missionNext();');await advance(2)
  await page.screenshot(path=str(out/'v12-zhuang-call.png'))
  result=await js("()=>{const p=document.querySelector('.mission-comm-portrait'),i=p.querySelector('img');return {speaker:p.dataset.speaker,portraitLoaded:i.complete&&i.naturalWidth>0,nameColor:getComputedStyle(document.querySelector('.mission-comm-info strong')).color,assets:[...document.scripts].filter(s=>s.src).map(s=>s.src)}}")
  assert result['speaker']=='zhuang' and result['portraitLoaded'] and result['nameColor']=='rgb(231, 223, 191)' and not errors,result
  result.update({'passed':True,'real_iphone_test':False,'errors':errors});(out/'v12-final-visual.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(result);await b.close()
asyncio.run(main())
