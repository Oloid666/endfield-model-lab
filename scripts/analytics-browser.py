"""Production bundle smoke test, with all network requests fulfilled from local files.
No Google requests leave this test and the hostname does not need to be configured.
Usage: python scripts/analytics-browser.py /tmp/rain-ga4-test dist
"""
import sys,mimetypes
from pathlib import Path
from urllib.parse import urlparse,unquote
from playwright.sync_api import sync_playwright
HOST='endfield10000t.aura87.online'
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
 for directory,configured in [(sys.argv[1],True),(sys.argv[2],False)]:
  root=Path(directory).resolve();ctx=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);page=ctx.new_page();errors=[];google=[];page.on('pageerror',lambda e:errors.append(str(e)))
  def route(req):
   u=urlparse(req.request.url)
   if u.hostname==HOST:
    name=unquote(u.path).removeprefix('/endfield-model-lab/').lstrip('/') or 'index.html';path=(root/name).resolve()
    if not path.is_relative_to(root) or not path.is_file():req.fulfill(status=404,body='not found');return
    req.fulfill(body=path.read_bytes(),content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream');return
   google.append(req.request.url);req.abort()
  page.route('**/*',route)
  prefix='' if configured else '/endfield-model-lab'
  page.goto('https://'+HOST+prefix+'/?utm_source=threads&password=private#private',wait_until='domcontentloaded')
  page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000)
  page.evaluate('__rainy711.missionStart()');page.wait_for_timeout(1100)
  page.evaluate('__rainy711.missionReplay()');page.evaluate('__rainy711.restoreChapter("cargo")')
  if configured:
   calls=page.evaluate('dataLayer.map(x=>Array.from(x))');events=[x for x in calls if x[0]=='event'];names=[x[1] for x in events]
   assert names.count('page_view')==1 and names.count('game_loaded')==1,names
   starts=[x[2] for x in events if x[1]=='game_start'];assert len(starts)==3,starts
   assert [x['play_mode'] for x in starts]==['normal','normal','chapter_replay']
   assert starts[1]['is_replay']==1
   assert 'private' not in str(calls)
   assert len(google)==1 and 'googletagmanager.com/gtag/js' in google[0],google
   # Existing pagehide disposes listeners; telemetry must flush before disposal.
   # Drive non-rendering ticks so slow software WebGL cannot starve the timer assertion.
   page.wait_for_function('__rainy711.mission.paused===false');page.evaluate('__rainy711.tick(__rainy711.time+.01,0,false)');page.wait_for_timeout(200);page.evaluate('__rainy711.tick(__rainy711.time+.01,0,false)');page.evaluate('window.dispatchEvent(new PageTransitionEvent("pagehide",{persisted:false}))')
   names=page.evaluate('dataLayer.filter(x=>x[0]==="event").map(x=>x[1])');assert 'play_time' in names,names
  else:
   assert not google,google
   assert not page.evaluate('Boolean(window.dataLayer)')
  assert not errors,errors
  print('PASS production rain UI: '+('configured tracking, blocked Google, start/replay/chapter mode, URL privacy, pagehide flush' if configured else 'unconfigured build has no tracking requests; scene and controls load'),flush=True)
  ctx.close()
 b.close()
