"""Capture fixed same-version evidence. Run against npm run dev; no player state is saved."""
import asyncio, base64, os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  page=await browser.new_page(viewport={'width':1000,'height':720})
  await page.goto(os.environ.get('PREVIEW_URL','http://127.0.0.1:5173/'),wait_until='domcontentloaded')
  await page.wait_for_function('window.__rainy711?.actorsLoaded',timeout=120000)
  photos=await page.evaluate('''async()=>{
    __rainy711.pauseForCapture();
    const {World}=await import('/src/world.js');
    const container=document.createElement('div');container.style.cssText='position:fixed;inset:0;width:1000px;height:720px;z-index:100';document.body.append(container);
    const w=new World(container,{onContextLost(){},onContextRestored(){},onManual(){}});
    try{
      w.autoCamera=false;w.camera.position.set(9.5,7,16);w.camera.fov=40;w.camera.lookAt(1,2.6,0);w.camera.updateProjectionMatrix();
      w.store.glass.uniforms.uTime.value=1;w.weather.update(1);w.renderer.setPixelRatio(1);w.composer.setPixelRatio(1);w.resize();
      w.composer.render();const before=w.renderer.domElement.toDataURL('image/png');
      w.store.destruction.setProgress(99);
      for(let i=0;i<=150;i++)w.store.destruction.update(i/30,1/30);
      w.weather.invalidateReflection();w.weather.update(6);w.composer.render();
      const after=w.renderer.domElement.toDataURL('image/png');return {before,after};
    }finally{w.dispose();container.remove();}
  }''')
  for name,data in photos.items():
   path=ROOT/'public/images/bonus'/f'{name}.png';path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(base64.b64decode(data.split(',')[1]));print(path.name,path.stat().st_size)
  await browser.close()
asyncio.run(main())
