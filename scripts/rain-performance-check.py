import asyncio,json,os
from playwright.async_api import async_playwright
async def main():
 out={'kind':'Chromium SwiftShader, one draw per two RAFs (30 FPS pacing); synchronous call durations only, not hardware GPU FPS. Same low preset and viewport; charge rendered before combat.','versions':{}}
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
  for name,url in [('baseline',os.environ.get('BASELINE_URL','http://127.0.0.1:4200/')),('candidate',os.environ.get('CANDIDATE_URL','http://127.0.0.1:4199/'))]:
   if os.environ.get('CANDIDATE_ONLY') and name!='candidate':continue
   page=await b.new_page(viewport={'width':390,'height':844},reduced_motion='reduce')
   page.on('console',lambda m:print(m.text,flush=True) if m.text.startswith('SPIKE') else None)
   await page.goto(url);await page.wait_for_function('!!window.__rainy711',timeout=180000)
   await page.click('#menu-toggle');await page.select_option('#quality','low');await page.click('#menu-close')
   await page.evaluate("""()=>{const g=__rainy711;g.pauseForCapture();g.restoreChapter('terminal-deploy');const step=d=>g.tick(g.time+d,.1,false),finish=()=>{const phase=g.mission.phase;for(let i=0;i<20&&g.mission.phase===phase;i++){step(4);g.missionNext();g.missionNext();}};step(6);finish();for(const k of ['endfield','_','power','520','1314'])g.keyChunk(k);finish();g.missionVerify();finish();g.missionLever(1);step(10);step(8);g.missionNext();step(4);} """)
   await page.wait_for_function('!__rainy711.mission.paused',timeout=180000)
   await page.evaluate('()=>{const g=__rainy711;g.tick(g.time+.1,.1,true);g.tick(g.time+31,.1,true);g.missionNext();}')
   assert await page.evaluate('__rainy711.mission.phase')=='combat'
   ordinary=[]
   for shot in range(3):
    samples=await page.evaluate('''async()=>{const g=__rainy711,s=g.mission,dt=(s.meterPeriod/4-s.meterElapsed%s.meterPeriod+s.meterPeriod)%s.meterPeriod;g.tick(g.time+dt,.1,false);g.missionAttack(g.time);const a=[];for(let i=0;i<35;i++){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const before=g.warmup.programs,shaders=g.shaders||[],t=performance.now();g.tick(g.time+1/30,1/30,true);const ms=performance.now()-t;a.push(ms);if(ms>100)console.log('SPIKE '+JSON.stringify({i,ms,phase:g.mission.phase,elapsed:g.mission.phaseElapsed,damage:g.destruction.progress,before,after:g.warmup.programs,newShaders:(g.shaders||[]).filter(s=>!shaders.some(p=>p.id===s.id)),prepared:g.performance?.battlePrepared}));}return a;}''');ordinary+=samples
   await page.evaluate("()=>{const g=__rainy711;g.restoreChapter('last');for(let i=0;i<30&&g.mission.phase==='last';i++){g.tick(g.time+3,.1,false);g.missionNext();g.missionNext();}}")
   await page.wait_for_function('!__rainy711.mission.paused',timeout=180000)
   await page.evaluate('()=>{const g=__rainy711;g.tick(g.time+10,.1,false);const s=g.mission,dt=(s.meterPeriod/4-s.meterElapsed%s.meterPeriod+s.meterPeriod)%s.meterPeriod;g.tick(g.time+dt,.1,false);g.missionAttack(g.time)}')
   final=await page.evaluate('''async()=>{const g=__rainy711,a=[];for(let i=0;i<210;i++){await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const before=g.warmup.programs,shaders=g.shaders||[],t=performance.now();g.tick(g.time+1/30,1/30,true);const ms=performance.now()-t;a.push(ms);if(ms>100)console.log('SPIKE '+JSON.stringify({i,ms,phase:g.mission.phase,elapsed:g.mission.phaseElapsed,damage:g.destruction.progress,before,after:g.warmup.programs,newShaders:(g.shaders||[]).filter(s=>!shaders.some(p=>p.id===s.id)),prepared:g.performance?.battlePrepared}));}return a;}''')
   def stats(samples):
    a=sorted(samples);return {'firstMs':round(samples[0],2),'medianMs':round(a[len(a)//2],2),'p95Ms':round(a[int(len(a)*.95)],2),'maxMs':round(a[-1],2),'over100ms':sum(t>100 for t in a)}
   out['versions'][name]={'ordinary':stats(ordinary),'final':stats(final),'drawCalls':await page.evaluate('__rainy711.drawCalls'),'triangles':await page.evaluate('__rainy711.triangles')}
   print(name,out['versions'][name],flush=True);await page.close()
  await b.close()
 open('/tmp/rain-frame-compare.json','w').write(json.dumps(out,indent=2))
asyncio.run(main())
