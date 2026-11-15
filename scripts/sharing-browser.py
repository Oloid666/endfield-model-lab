"""Check the built sharing HTML with JavaScript disabled, at root and subpath URLs."""
import asyncio,io,json,pathlib
from urllib.parse import urljoin,urlparse
from PIL import Image
from playwright.async_api import async_playwright
async def main():
 result=[]
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);
  for base in ['http://127.0.0.1:4232/','http://127.0.0.1:4233/endfield-model-lab/']:
   page=await b.new_page(java_script_enabled=False);requests=[];page.on('request',lambda r:requests.append(r.url));await page.goto(base)
   assert await page.title()=='莊的晚餐｜雨夜711';assert await page.locator('html').get_attribute('lang')=='zh-Hant'
   image=await page.locator('meta[property="og:image"]').get_attribute('content');assert image.startswith('https://') and 'localhost' not in image
   assert await page.locator('meta[name="twitter:image"]').get_attribute('content')==image
   canonical=await page.locator('link[rel="canonical"]').get_attribute('href');assert canonical=='https://endfield10000t.aura87.online/'
   asset=urljoin(base,'images/og-rainy711-v1.jpg');r=await page.request.get(asset);assert r.status==200 and 'image/jpeg' in r.headers['content-type'];data=await r.body();assert Image.open(io.BytesIO(data)).size==(1200,630) and len(data)<400000
   icon=await page.locator('link[rel="apple-touch-icon"]').get_attribute('href');r=await page.request.get(urljoin(base,icon));assert r.status==200 and Image.open(io.BytesIO(await r.body())).size==(180,180)
   assert not any('.glb' in u for u in requests);result.append({'base':base,'ogImage':image,'canonical':canonical,'imageBytes':len(data),'javascript':False,'modelRequests':0,'status':'passed'});await page.close()
  await b.close()
 out=pathlib.Path('artifacts/visual-review/acting-seven/sharing-browser.json');out.write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
asyncio.run(main())
