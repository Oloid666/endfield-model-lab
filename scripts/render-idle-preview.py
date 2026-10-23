"""Render a 30s animation review offline. This is NOT an FPS benchmark."""
import asyncio,json,os,subprocess,time
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
FRAMES=Path('/tmp/endfield-idle-frames')
URL=os.environ.get('PREVIEW_URL','http://127.0.0.1:5173/')
async def main():
 FRAMES.mkdir(exist_ok=True);max_drift=0;started=time.monotonic()
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':480,'height':720},device_scale_factor=1,reduced_motion='reduce')
  await page.goto(URL,wait_until='networkidle');await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=60000)
  await page.locator('[data-view=awning]').click();await page.wait_for_function('document.querySelector("#app").classList.contains("close-view")')
  await page.evaluate('window.__rainy711.pauseForCapture()')
  await page.add_style_tag(content='.masthead,.scene-footer{display:none!important}')
  await page.evaluate("""()=>{const label=document.createElement('div');label.textContent='動作預覽 · 離線逐幀輸出，非即時 FPS';label.style.cssText='position:fixed;z-index:20;top:14px;left:0;width:100%;text-align:center;color:#e5e6dc;font:11px sans-serif;letter-spacing:.08em;text-shadow:0 1px 8px #000';document.body.append(label)}""")
  for i in range(300):
   drift=await page.evaluate('(t)=>{window.__rainy711.samplePose(t);return window.__rainy711.idle.footDrift}',i/10)
   max_drift=max(max_drift,drift)
   await page.screenshot(path=str(FRAMES/f'frame-{i:04d}.png'))
   if i%60==0:print(f'Offline preview: {i}/300 frames',flush=True)
  await browser.close()
 assert max_drift<.01,max_drift
 video=ROOT/'artifacts/idle-preview-offline.mp4'
 subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','10','-i',str(FRAMES/'frame-%04d.png'),'-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',str(video)],check=True)
 result={'kind':'offline animation preview, NOT real-time performance','duration_seconds':30,'frames':300,'video_fps':10,'resolution':'480x720','max_foot_drift_m':max_drift,'render_wall_seconds':round(time.monotonic()-started,2)}
 (ROOT/'artifacts/idle-preview-metadata.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2))
asyncio.run(main())
