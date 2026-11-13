import asyncio,json,base64,argparse,pathlib,time
from playwright.async_api import async_playwright
parser=argparse.ArgumentParser();parser.add_argument('--url',required=True);parser.add_argument('--out',required=True);parser.add_argument('--transport-mode',choices=['auto','legacy','missing'],default='auto');parser.add_argument('--skip-photo',action='store_true');parser.add_argument('--expect-budget',action='store_true');args=parser.parse_args();OUT=pathlib.Path(args.out);OUT.mkdir(parents=True,exist_ok=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']);page=await b.new_page(viewport={'width':390,'height':844},device_scale_factor=1);errors=[];requests={};frames=[];page.on('pageerror',lambda e:errors.append(str(e)))
  cdp=await page.context.new_cdp_session(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{'cacheDisabled':True})
  def request(e):requests[e['requestId']]={'url':e['request']['url'],'type':e.get('type'),'bytes':0,'finished':False}
  def response(e):
   d=requests.get(e['requestId']);r=e['response']
   if d is not None:d.update(status=r['status'],mime=r['mimeType'],disk=r.get('fromDiskCache',False),headers={k:v for k,v in r['headers'].items() if k.lower() in ['content-length','content-encoding']})
  def finish(e):
   d=requests.get(e['requestId'])
   if d is not None:d.update(bytes=e['encodedDataLength'],finished=True)
  cdp.on('Network.requestWillBeSent',request);cdp.on('Network.responseReceived',response);cdp.on('Network.loadingFinished',finish)
  async def js(s,arg=None):return await page.evaluate(s,arg)
  async def tick(s):await js('s=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,s/n,false)}',s)
  async def shot(n):
   await js('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await js('__rainy711.tick(__rainy711.time,0,true)');await page.screenshot(path=str(OUT/(n+'.png')),timeout=90000);frames.append({'file':n+'.png','phase':await js('__rainy711.mission.phase')})
  try:
   if args.transport_mode=='legacy':await page.add_init_script('window.DecompressionStream=undefined')
   if args.transport_mode=='missing':await page.route('**/models/zhuang-fangyi.glb.gz',lambda route:route.fulfill(status=404,body='missing compressed variant'))
   await page.goto(args.url,wait_until='domcontentloaded');await page.locator('.loading-details summary').click();await page.locator('.loading-skip').click();await page.wait_for_function('window.__rainy711?.actorsLoaded&&document.querySelector("#loading").hidden',timeout=240000);await js('__rainy711.pauseForCapture()');await page.wait_for_timeout(500)
   network=[r for r in requests.values() if r['url'].startswith(args.url)];(OUT/'startup-network.json').write_text(json.dumps({'bytes':sum(r['bytes'] for r in network),'requests':network,'milestone':'actorsLoaded && #loading.hidden; loading-details skip clicked; cache disabled; local HTTP server no content compression; viewport390x844 DPR1','iphone_tested':False},ensure_ascii=False,indent=2));print('startup bytes',sum(r['bytes'] for r in network),flush=True)
   if args.expect_budget:assert sum(r['bytes'] for r in network)<9_000_000,'Cold-load budget exceeded'
   await js('__rainy711.frameView("poster1")');await tick(.2);await shot('01-poster')
   if args.transport_mode!='auto':assert any(r['url'].endswith('zhuang-fangyi.glb') and r['finished'] for r in network),network
   if args.skip_photo:
    assert not errors,errors
    (OUT/'browser.json').write_text(json.dumps({'status':'passed','errors':errors,'frames':frames,'transport_mode':args.transport_mode,'iphone_tested':False},ensure_ascii=False,indent=2));return
   await js('const e=document.querySelector("#quality");e.value="low";e.dispatchEvent(new Event("change"));__rainy711.missionStart()')
   for i in range(240):
    if await js('__rainy711.mission.phase')=='photo-flight':break
    await tick(.4);await js('__rainy711.missionNext()')
   assert await js('__rainy711.mission.phase')=='photo-flight'
   await js('__rainy711.fly(0,1)')
   for _ in range(100):
    if await js('__rainy711.mission.flight.z>=10.1'):break
    await tick(.1)
   await js('__rainy711.fly(0,0)');await tick(.8);await page.locator('.flight-ready').click();await tick(.1);print('photo ready',flush=True)
   await page.locator('.photo-shutter').click();await page.wait_for_function('__rainy711.photo?.faceValid&&__rainy711.mission.phase!=="photo"',timeout=180000)
   data=await js('()=>{const p=__rainy711.photo;return {...p,src:p.src,closeup:p.closeup}}');src=data.pop('src');close=data.pop('closeup');data.update(src_length=len(src),closeup_length=len(close),total_length=len(src)+len(close));(OUT/'photo.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
   for name,raw in [('wide',src),('closeup',close)]:
    (OUT/(name+('.jpg' if raw.startswith('data:image/jpeg') else '.png'))).write_bytes(base64.b64decode(raw.split(',')[1]))
   if args.expect_budget:assert data['total_length']<1_000_000 and src.startswith('data:image/jpeg') and close.startswith('data:image/jpeg') and data['closeupWidth']==1024 and data['closeupHeight']==1280,data
   print('photo lengths',len(src),len(close),flush=True)
   for _ in range(40):
    if await page.locator('.phone-gallery').is_visible():break
    await tick(.5);await js('__rainy711.missionNext()')
   assert await page.locator('.gallery-image').evaluate('(e)=>e.src===__rainy711.photo.src');await shot('02-photo-wide');await page.get_by_role('button',name='放大看有沒有眨眼',exact=True).click();await shot('03-photo-closeup')
   if args.expect_budget:
    for w,h in [(844,390),(1440,900),(390,844)]:
     await page.set_viewport_size({'width':w,'height':h});await shot(f'04-gallery-{w}x{h}')
    await page.get_by_role('button',name='傳送給管理員',exact=True).click();await tick(1.3)
    await js('__rainy711.restoreChapter("terminal-deploy")')
    async def until(test):
     for _ in range(500):
      if await js(test):return
      if await js('__rainy711.mission.paused'):await page.wait_for_function('!__rainy711.mission.paused',timeout=120000)
      await tick(.4);await js('__rainy711.missionNext()')
     raise AssertionError(test)
    await until('__rainy711.mission.phase==="login"')
    for key in ['endfield','_','power','520','1314']:await js('k=>__rainy711.keyChunk(k)',key)
    await until('__rainy711.mission.phase==="captcha"&&__rainy711.mission.connection.captchaReady');await js('__rainy711.missionVerify()');await until('__rainy711.mission.phase==="lever"');await js('__rainy711.missionLever(1)');await until('__rainy711.mission.phase==="combat"')
    await js('__rainy711.missionAttack()');await tick(.7);await js('__rainy711.missionAttack()');await tick(.1)
    for w,h in [(390,844),(844,390),(1440,900)]:
     await page.set_viewport_size({'width':w,'height':h});await shot(f'05-combat-aside-{w}x{h}')
     r=await js("()=>{const a=document.querySelector('.combat-aside').getBoundingClientRect(),b=document.querySelector('.mission-combat').getBoundingClientRect();return {a:a.toJSON(),b:b.toJSON(),w:innerWidth,h:innerHeight,scene:document.querySelector('#scene').getBoundingClientRect().toJSON()}}")
     assert r['a']['top']>=0 and r['a']['left']>=0 and r['a']['right']<=w+.1 and r['a']['bottom']<=r['b']['top'],r
     if w>=1000:assert r['a']['left']>=r['scene']['right'],r
    await page.locator('#menu-toggle').click();await page.get_by_text('作品與回報',exact=True).click();await page.locator('.control-tip').first.scroll_into_view_if_needed();await shot('06-updated-instructions');assert '中央命中' not in await page.locator('.control-tip').inner_text();assert '按住蓄力' in await page.locator('.control-tip').inner_text()
   assert not errors,errors
   (OUT/'browser.json').write_text(json.dumps({'status':'passed','errors':errors,'frames':frames,'iphone_tested':False},ensure_ascii=False,indent=2))
  except Exception as e:
   (OUT/'browser.json').write_text(json.dumps({'status':'failed','error':str(e),'errors':errors},ensure_ascii=False,indent=2));await page.screenshot(path=str(OUT/'failure.png'),timeout=90000);raise
  finally:await b.close()
asyncio.run(main())
