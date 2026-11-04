"""Feedback form and protected admin UI with intercepted API traffic; no real messages sent."""
import json,subprocess,tempfile,os
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='feedback-browser-') as tmp:
 bundle=Path(tmp)/'form.js'
 subprocess.run(['node','--input-type=module','-e',"import {build} from 'esbuild';await build({entryPoints:['src/feedback.js'],bundle:true,format:'esm',outfile:process.argv[1]});",str(bundle)],cwd=ROOT,check=True,capture_output=True)
 harness='''
 window.requests=[];window.finishes=[];window.reply=503;window.delay=0;window.skips=0;window.sent=0;
 window.service=createFeedbackService({endpoint:'https://feedback.test/api/feedback',version:'test',timeout:1000,context:()=>({phase:'complete',play_mode:'normal'}),onSent:()=>window.sent++,fetcher:async(url,options)=>{requests.push(JSON.parse(options.body));if(window.delay)await new Promise(r=>setTimeout(r,window.delay));return new Response(JSON.stringify(window.reply===200?{ok:true}:{error:'not_configured'}),{status:window.reply});}});
 window.mountForm=()=>{window.form?.dispose();document.querySelector('#root').replaceChildren();window.form=createFeedbackForm({service,requireRating:true,onFinish:value=>{finishes.push(value);document.querySelector('#root').textContent='已繼續謝幕';},onSkip:()=>window.skips++});document.querySelector('#root').append(form.root);};mountForm();
 window.dialog=createFeedbackDialog({service});document.querySelector('#open').onclick=()=>dialog.open();
 '''
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  page=b.new_page(viewport={'width':390,'height':844},has_touch=True);errors=[];page.on('pageerror',lambda e:(errors.append(str(e)),print('UI error:',str(e),flush=True)))
  page.route('https://feedback.test/',lambda r:r.fulfill(content_type='text/html',body='<meta charset="UTF-8"><style>body{background:#142d27;color:#eee9d9;font-family:system-ui;margin:16px}</style><meta name="viewport" content="width=device-width"><button id="open">回報問題</button><div id="root"></div>'))
  def boot():
   page.goto('https://feedback.test/');page.add_style_tag(content=bundle.with_suffix('.css').read_text());page.add_script_tag(type='module',content=bundle.read_text()+harness);page.wait_for_function('window.form')
  boot();assert page.get_by_role('button',name='先選一顆到五顆星').is_disabled();page.get_by_role('button',name='4 星',exact=True).click();page.locator('textarea').fill('拍照卡住了，但龍泡泡好可愛。');page.locator('select').select_option('bug');page.get_by_role('button',name='送出評分與意見',exact=True).click();page.get_by_role('status').filter(has_text='尚未就緒').wait_for();assert page.locator('textarea').input_value().startswith('拍照卡住');first=page.evaluate('requests[0].id')
  page.screenshot(path='/tmp/feedback-form-error.png');boot();assert page.locator('textarea').input_value().startswith('拍照卡住');assert page.locator('select').input_value()=='bug';page.get_by_role('button',name='4 星',exact=True).click();page.evaluate('reply=200;delay=200');page.get_by_role('button',name='送出評分與意見',exact=True).click();page.wait_for_function('finishes.length===1');assert page.evaluate('requests[0].id')==first;assert page.evaluate('finishes[0].stored');assert page.evaluate('service.draft.message')==''
  page.evaluate('service.saveDraft({message:"保留這句",category:"idea"});reply=503;delay=0;mountForm()');page.get_by_role('button',name='3 星',exact=True).click();page.get_by_role('button',name='送出評分與意見',exact=True).click();page.get_by_role('button',name='只送星等，繼續（留言未送出）',exact=True).wait_for();page.get_by_role('button',name='只送星等，繼續（留言未送出）',exact=True).click();assert page.evaluate('service.draft.message')=='保留這句';assert not page.evaluate('finishes.at(-1).stored')
  page.click('#open');page.locator('dialog textarea').fill('只留言，不選星星。');page.evaluate('reply=200');page.get_by_role('button',name='送出意見',exact=True).click();page.get_by_role('heading',name='已收到你的意見！').wait_for();assert page.evaluate('requests.at(-1).rating') is None;page.get_by_role('button',name='返回遊戲',exact=True).click();assert not page.locator('dialog').is_visible()
  page.evaluate('mountForm()');page.get_by_role('button',name='5 星',exact=True).click();page.get_by_role('button',name='送出評分',exact=True).click();assert page.evaluate('finishes.at(-1).rating')==5
  page.evaluate('mountForm()');page.set_viewport_size({'width':844,'height':390});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/feedback-form-landscape.png');assert not errors,errors
  print('PASS feedback form: failed-send draft, reload, idempotent retry, real receipt, star-only fallback, optional stars, dialog, landscape and no runtime errors',flush=True);page.close()
  # Exercise the actual compiled admin entry point, with its API response intercepted.
  admin=b.new_page(viewport={'width':390,'height':844});admin_errors=[];admin.on('pageerror',lambda e:admin_errors.append(str(e)))
  token='test-only-admin-token-1234567890123456789';seen=[]
  def api(route):
   req=route.request;seen.append(req.url)
   if req.headers.get('authorization')!='Bearer '+token:route.fulfill(status=401,json={'error':'unauthorized'});return
   items=[{'id':'test','created_at':1793750000000,'rating':3,'message':'<img src=x onerror=alert(1)> =not-a-formula','category':'bug','build_version':'test','phase':'complete','play_mode':'normal'}]
   route.fulfill(json={'items':items,'summary':{'total':1,'rated':1,'average_rating':3,'with_message':1},'next':None})
  admin.route('**/api/feedback*',api);admin.goto(os.environ.get('FEEDBACK_PREVIEW_URL','http://127.0.0.1:4195/')+'feedback-admin.html');admin.fill('#token','wrong-token-that-is-at-least-32-characters');admin.get_by_role('button',name='查看回饋').click();admin.get_by_role('status').filter(has_text='不正確').wait_for();assert not admin.locator('#dashboard').is_visible();admin.fill('#token',token);admin.get_by_role('button',name='查看回饋').click();admin.locator('article').wait_for();assert admin.locator('article img').count()==0;assert '<img' in admin.locator('article p').inner_text();assert admin.input_value('#token')=='';assert all(token not in x for x in seen);admin.select_option('#rating','3');admin.get_by_role('status').filter(has_text='本頁').wait_for()
  with admin.expect_download() as d:admin.click('#export')
  assert d.value.suggested_filename.endswith('.csv');admin.screenshot(path='/tmp/feedback-admin.png');admin.click('#logout');assert not admin.locator('#dashboard').is_visible();assert admin.locator('article').count()==0;assert not admin_errors,admin_errors
  print('PASS feedback admin: authenticated read, wrong token denied, XSS-safe text, token absent from URL/input, filter, CSV and logout clears data',flush=True);b.close()
