"""Exercise the real entrance UI with mission transitions, without a WebGL story run."""
import asyncio,json,subprocess,tempfile
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 checks=[]
 def check(name,ok):checks.append({'name':name,'passed':bool(ok)});assert ok,name
 with tempfile.TemporaryDirectory(prefix='bonus-entry-') as tmp:
  output=Path(tmp)/'entry.js'
  subprocess.run(['node','--input-type=module','-e',"import {build} from 'esbuild';await build({entryPoints:['src/bonus.js'],bundle:true,format:'esm',outfile:process.argv[1]});",str(output)],cwd=ROOT,check=True)
  async with async_playwright() as p:
   browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   page=await browser.new_page(viewport={'width':390,'height':844},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   # A real origin gives the fixture normal localStorage semantics.
   await page.route('http://bonus.test/',lambda route:route.fulfill(body='<div id="app" style="position:relative;height:844px"></div>'))
   await page.goto('http://bonus.test/');await page.add_style_tag(content='[hidden]{display:none!important}'+output.with_suffix('.css').read_text())
   await page.evaluate("localStorage.setItem('rainy711.bonus.v1',JSON.stringify({read:['cargo'],course:{steps:{general:99,mikoto:99,cargo:99,taste:99},stamped:true,legacyCompleted:true}}))")
   await page.add_script_tag(type='module',content=output.read_text()+"\nwindow.missionFixture={state:{phase:'ready'}};window.bonusFixture=createBonus({mount:document.querySelector('#app'),world:{time:0},mission:missionFixture,exploration:{}});")
   await page.wait_for_function('window.bonusFixture')
   check('Entrance hidden before either unlock condition',not await page.locator('.bonus-entry').is_visible())
   check('Legacy progress cannot pre-complete new classroom',await page.evaluate('bonusFixture.state.course.percentage===0&&!bonusFixture.state.course.stamped'))
   await page.evaluate("missionFixture.state.phase='tour';bonusFixture.update()")
   check('Final tour alone does not unlock early',not await page.locator('.bonus-entry').is_visible())
   await page.evaluate("missionFixture.state.phase='complete';bonusFixture.update()")
   check('Completing first run reveals entrance without sign taps',await page.locator('.bonus-entry').is_visible() and await page.evaluate('bonusFixture.state.taps===0'))
   check('Unlock is persisted',await page.evaluate("JSON.parse(localStorage.getItem('rainy711.bonus.v1')).unlocked===true"))
   check('Read history remains intact',await page.evaluate("bonusFixture.state.read.join(',')==='cargo'"))
   check('Reduced motion uses static highlight',await page.locator('.bonus-entry').evaluate("e=>getComputedStyle(e).animationName==='none'"))
   await page.emulate_media(reduced_motion='no-preference')
   check('Normal mode has slow entrance glow',await page.locator('.bonus-entry').evaluate("e=>getComputedStyle(e).animationName==='bonus-entry-glow'"))
   box=await page.locator('.bonus-entry').bounding_box();check('Prominent touch target fits portrait',box['height']>=52 and box['x']>=0 and box['x']+box['width']<=390)
   await page.screenshot(path=str(ROOT/'artifacts/bonus-entry.png'))
   check('No runtime exception',not errors);await browser.close()
 (ROOT/'artifacts/bonus-entry-results.json').write_text(json.dumps({'checks':checks,'errors':errors},ensure_ascii=False,indent=2));print(json.dumps(checks))
asyncio.run(main())
