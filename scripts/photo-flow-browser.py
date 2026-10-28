"""Real photo UI and story state, without GPU; verifies overlay cleanup and progression."""
import asyncio,subprocess,tempfile
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 with tempfile.TemporaryDirectory(prefix='photo-flow-') as tmp:
  output=Path(tmp)/'flow.js'
  source="""import {createInvestigationUI} from './src/investigation-ui.js';import {MissionMachine} from './src/mission-state.js';
let ui;const machine=new MissionMachine({onState:s=>ui?.update(s)});window.machine=machine;
const c=document.createElement('canvas');c.width=1024;c.height=1280;const src=c.toDataURL();
ui=createInvestigationUI({mount:document.querySelector('#app'),machine,capture:async()=>({src,closeup:src}),getAuto:()=>true});window.ui=ui;
machine.phaseTo('photo');"""
  subprocess.run(['node','--input-type=module','-e',"import {build} from 'esbuild';await build({stdin:{contents:process.argv[2],resolveDir:process.cwd()},define:{'import.meta.env.BASE_URL':JSON.stringify('/')},bundle:true,format:'esm',outfile:process.argv[1]});",str(output),source],cwd=ROOT,check=True)
  async with async_playwright() as p:
   browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
   page=await browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda e:(errors.append(str(e)),print('ERROR',str(e),flush=True)))
   await page.route('http://photo.test/',lambda route:route.fulfill(body='<div id="app"></div>'))
   await page.goto('http://photo.test/');await page.add_style_tag(content='[hidden]{display:none!important}'+output.with_suffix('.css').read_text()+(ROOT/'src/responsive.css').read_text())
   await page.add_script_tag(type='module',content=output.read_text());await page.wait_for_function('window.ui',timeout=5000)
   await page.evaluate('ui.snapshot()');await page.wait_for_function('machine.phase==="photo-return"')
   await page.evaluate('machine.update(3);machine.update(9);for(let i=0;i<10&&machine.phase==="photo-check";i++)machine.next()')
   assert await page.locator('.phone-gallery').is_visible()
   await page.get_by_role('button',name='返回一起看手機',exact=True).click()
   await page.locator('.photo-open').click();assert await page.evaluate('ui.viewer.index')==1
   await page.locator('.gallery-footer button').last.click()
   assert await page.evaluate('machine.phase')=='photo-sending'
   assert not await page.locator('.investigation-ui').is_visible(), 'Old photo controls cover the next dialogue'
   assert not await page.locator('.phone-gallery').is_visible()
   assert not await page.locator('#app').evaluate('e=>e.classList.contains("gallery-open")')
   await page.evaluate('machine.update(11)');assert await page.evaluate('machine.phase')=='cargo'
   before=await page.evaluate('machine.node.id');await page.evaluate('machine.next();machine.next()');assert await page.evaluate('machine.node.id')!=before
   # External/state transitions must also release the gallery, not only its own send button.
   await page.evaluate('machine.phaseTo("photo-review")');assert await page.locator('.phone-gallery').is_visible()
   await page.evaluate('machine.sendPhoto()');assert not await page.locator('.phone-gallery').is_visible()
   assert not await page.locator('#app').evaluate('e=>e.classList.contains("gallery-open")')
   assert not errors,errors
   print('Photo flow: portrait button, send, overlay cleanup, cargo continuation and external send passed.')
   await browser.close()
asyncio.run(main())
