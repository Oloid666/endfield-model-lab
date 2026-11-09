"""D-F01 dinner-grip evidence: real scene, real Zhuang GLB, Chromium/SwiftShader.

Captures the player's own camera plus three fixed close-up angles (front-oblique, side, rear-oblique)
around the tray at four story checkpoints, and measures skinned hand vertices against the tray underside.
Not an iPhone measurement. Run against `npm run dev` (Vite) or any server that serves /src/main.js unbundled; the script itself
exposes `window.__world` in its own browser by rewriting that one response (capture-only).

Env: GRIP_URL (default http://127.0.0.1:5173/), GRIP_OUT (output dir), GRIP_TAG (before/after),
     GRIP_VIEWPORTS ("390x844@2,1440x900@1").
"""
import asyncio, json, math, os
from pathlib import Path
from playwright.async_api import async_playwright

URL = os.environ.get('GRIP_URL', 'http://127.0.0.1:5173/')
OUT = Path(os.environ.get('GRIP_OUT', '/tmp/dinner-grip')); OUT.mkdir(parents=True, exist_ok=True)
TAG = os.environ.get('GRIP_TAG', 'run')
VIEWPORTS = [(int(w), int(h), float(d)) for w, h, d in
             (v.replace('@', 'x').split('x') for v in os.environ.get('GRIP_VIEWPORTS', '390x844@2,1440x900@1').split(','))]
CHROME = os.environ.get('GRIP_CHROME', '/usr/bin/google-chrome')

MEASURE_JS = r"""() => {
  const W = window.__world, a = W.actors, T = a.root.constructor; // THREE classes via instances
  const tray = []; a.root.traverse(n => { if (n.name === 'crafted-dinner-tray') tray.push(n); });
  const t = tray.find(n => { let v = true; n.traverseAncestors(p => { if (!p.visible) v = false; }); return v && n.visible; });
  if (!t) return {tray: false};
  t.updateWorldMatrix(true, false);
  const inv = t.matrixWorld.clone().invert();
  const out = {tray: true, hands: {}};
  const skinned = []; a.root.traverse(n => { if (n.isSkinnedMesh && n.visible) skinned.push(n); });
  const isHand = (bone, side) => { let b = bone; while (b) { if (b.name && b.name.endsWith(side === 'L' ? 'L_0343' : 'R_0390')) return true; b = b.parent; } return false; };
  for (const side of ['L', 'R']) {
    let inside = 0, pen = 0, maxPen = 0, minGap = Infinity, contact = 0, total = 0, palmTop = -Infinity;
    for (const m of skinned) {
      const bones = m.skeleton.bones, sw = m.geometry.attributes.skinWeight, si = m.geometry.attributes.skinIndex, pos = m.geometry.attributes.position;
      const handBone = bones.map(b => isHand(b, side) && !/^sleeve/.test(b.name));
      const v = pos.array.length ? new (pos.array.constructor === Float32Array ? Object : Object)() : null;
      const p = new (W.camera.position.constructor)();
      for (let i = 0; i < pos.count; i++) {
        let best = -1, bw = 0; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
        if (best < 0 || !handBone[best]) continue;
        total++;
        m.getVertexPosition(i, p); p.applyMatrix4(m.matrixWorld).applyMatrix4(inv);
        if (p.x < -.235 || p.x > .285 || p.z < -.125 || p.z > .125) continue;
        inside++;
        if (p.y > -.020 && p.y < .020) { pen++; maxPen = Math.max(maxPen, p.y + .020); }
        else if (p.y <= -.020) { const g = -.020 - p.y; if (g < minGap) minGap = g; if (g < .006) contact++; palmTop = Math.max(palmTop, p.y); }
      }
    }
    out.hands[side] = {handVertices: total, underTray: inside, penetrating: pen, maxPenetrationMm: +(maxPen * 1000).toFixed(1),
      nearestGapMm: minGap === Infinity ? null : +(minGap * 1000).toFixed(1), contactVertices: contact};
  }
  out.status = {owner: a.status.mealOwner, errors: a.status.handSupportErrors, dinner: a.status.dinner};
  return out;
}"""


CAMERA_JS = r"""(o)=>{const W=__world,a=W.actors,c=W.camera,V=c.position.constructor;let wrist=null;
  a.root.traverse(n=>{if(n.isBone&&n.name.endsWith(o.side==='L'?'L_0343':'R_0390'))wrist=n;});if(!wrist)return false;
  const kn=[];wrist.children.forEach(ch=>{if(ch.isBone&&ch.children.length&&!/^sleeve/.test(ch.name))kn.push(ch.getWorldPosition(new V()));});
  const w=wrist.getWorldPosition(new V()),palm=w.clone();kn.forEach(k=>palm.add(k));palm.multiplyScalar(1/(kn.length+1));
  const s=new V().fromArray(a.status.mealSupport),yaw=a.status.trayYaw,fwd=new V(Math.sin(yaw),0,Math.cos(yaw));
  const out=palm.clone().sub(s);out.y=0;out.addScaledVector(fwd,-out.dot(fwd));if(out.lengthSq()<1e-6)out.set(Math.cos(yaw),0,-Math.sin(yaw)).multiplyScalar(o.side==='L'?1:-1);out.normalize();
  const r=o.deg*Math.PI/180,dir=fwd.clone().multiplyScalar(Math.cos(r)).addScaledVector(out,Math.sin(r)).normalize();
  W.controls.target.copy(palm);c.position.copy(palm).addScaledVector(dir,o.dist);c.position.y+=o.dy;c.fov=35;c.near=.02;c.updateProjectionMatrix();c.lookAt(palm);c.updateMatrixWorld(true);W.composer.render();return true;}"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, headless=True,
                                    args=['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'])
        report = {'url': URL, 'tag': TAG, 'viewports': [], 'errors': []}
        for (vw, vh, dpr) in VIEWPORTS:
            ctx = await b.new_context(viewport={'width': vw, 'height': vh}, device_scale_factor=dpr, has_touch=vw < 600, is_mobile=vw < 600)
            page = await ctx.new_page()
            page.on('pageerror', lambda e: report['errors'].append(str(e)[:300]))
            page.set_default_timeout(90000)
            js = page.evaluate

            async def tick(sec, render=False):
                await js('(o)=>{const q=__rainy711,n=Math.max(1,Math.ceil(o.s/.05));for(let i=0;i<n;i++)q.tick(q.time+o.s/n,Math.min(.05,o.s/n),o.r&&i===n-1)}', {'s': sec, 'r': render})

            async def expose_world(route):
                # Capture-only: read access to the live World (camera + actors) for fixed close-up angles.
                # Rewrites the served /src/main.js in this browser only; game code and debug entries are unchanged.
                resp = await route.fetch(); body = await resp.text()
                if '__world' not in body: body = body.replace('window.__rainy711={', 'window.__world=world;window.__rainy711={', 1)
                await route.fulfill(response=resp, body=body)
            await page.route(lambda u: u.split('?')[0].endswith('/src/main.js'), expose_world)
            await page.goto(URL)
            await page.wait_for_function('window.__rainy711?.actorsLoaded && window.__world', timeout=300000)
            await js('__rainy711.pauseForCapture()')
            await tick(.2)
            for _ in range(7):
                q = await js('()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector("#scene").getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}')
                await page.mouse.click(q['x'], q['y']); await tick(.1)
            assert await js('__rainy711.debug.unlocked'), 'seven taps did not unlock'
            vp = {'viewport': f'{vw}x{vh}', 'deviceScaleFactor': dpr, 'checkpoints': []}
            vp['rendererDpr'] = await js('__rainy711.aa.dpr'); vp['quality'] = await js('__rainy711.quality')

            async def advance_to(target, max_steps=400, attack=False):
                for _ in range(max_steps):
                    ph = await js('__rainy711.mission.phase')
                    if ph == target: return True
                    if ph == 'login':
                        for c in ['endfield', '_', 'power', '520', '1314']: await js('(c)=>__rainy711.keyChunk(c)', c); await tick(.05)
                    elif ph == 'captcha': await js('__rainy711.missionVerify()')
                    elif ph == 'lever' and target != 'lever': await js('__rainy711.missionLever(1)')
                    elif ph in ('aim-final', 'combat') and attack:
                        st = await js('({a:__rainy711.mission.canAttack,s:__rainy711.mission.canAssist,p:__rainy711.mission.paused})')
                        if st['s']: await js('__rainy711.assist()')
                        elif st['a']: await js('__rainy711.missionAttack()')
                    else: await js('__rainy711.missionNext()')
                    await tick(.25)
                print('advance_to failed', target, await js('({phase:__rainy711.mission.phase,paused:__rainy711.mission.paused,e:__rainy711.mission.phaseElapsed,a:__rainy711.mission.canAttack,s:__rainy711.mission.canAssist,f:__rainy711.mission.failures})'), flush=True)
                return False

            async def capture(name, closeups=True):
                await tick(0.0001)
                row = {'name': name, 'phase': await js('__rainy711.mission.phase'), 'phaseElapsed': round(await js('__rainy711.mission.phaseElapsed'), 3),
                       'node': await js('__rainy711.mission.nodeId')}
                # 1) what the player sees
                await tick(0.0001, True)
                await page.screenshot(path=str(OUT / f'{TAG}-{vw}-{name}-game.png'))
                row['measure'] = await js(MEASURE_JS)
                if closeups and row['measure'].get('tray'):
                    await js("()=>{for(const e of document.querySelectorAll('#app > *:not(#scene)'))e.style.visibility='hidden'}")
                    for side in ('L', 'R'):
                        for label, deg, dist, dy in [('front', 40, .62, .02), ('side', 90, .58, -.05), ('rear', 140, .62, -.03)]:
                            ok = await js(CAMERA_JS, {'side': side, 'deg': deg, 'dist': dist, 'dy': dy})
                            if ok: await page.screenshot(path=str(OUT / f'{TAG}-{vw}-{name}-{side}-{label}.png'))
                await js("()=>{for(const e of document.querySelectorAll('#app > *:not(#scene)'))e.style.visibility=''}")
                vp['checkpoints'].append(row)
                print(TAG, vw, name, json.dumps(row, ensure_ascii=False)[:400], flush=True)

            STEP_JS = """()=>{const a=__world.actors;let w=null;a.root.traverse(n=>{if(n.isBone&&n.name.endsWith('L_0343'))w=n;});const p=w.getWorldPosition(new (__world.camera.position.constructor)());
              const h=a.heroPosition;return {age:__rainy711.mission.phaseElapsed,phase:__rainy711.mission.phase,wrist:p.toArray(),tray:a.status.mealSupport.slice(),hero:h.slice(),owner:a.status.mealOwner}}"""

            async def steps(phase, duration, shot_ages, prefix, close_ages):
                # 1/60 s steps through the whole transfer: largest per-frame jump of wrist and tray.
                prev = None; worst = {'wristMm': 0, 'wristAge': None, 'trayMm': 0, 'trayAge': None}; pending = list(shot_ages)
                while True:
                    cur = await js(STEP_JS)
                    if cur['phase'] != phase: break
                    if prev and cur['age'] > prev['age'] and prev['age'] > 0:
                        # relative to the hero root, so a staging move of the whole character on the phase's first frame is not counted as a hand pop
                        rel = lambda q, k: [q[k][i] - q['hero'][i] for i in range(3)]
                        dw = math.dist(rel(cur, 'wrist'), rel(prev, 'wrist')) * 1000; dt = math.dist(rel(cur, 'tray'), rel(prev, 'tray')) * 1000
                        da = math.dist(cur['tray'], prev['tray']) * 1000
                        if da > worst.get('trayAbsMm', 0): worst.update(trayAbsMm=round(da, 1), trayAbsAge=round(cur['age'], 3))
                        if dw > worst['wristMm']: worst.update(wristMm=round(dw, 1), wristAge=round(cur['age'], 3))
                        if dt > worst['trayMm']: worst.update(trayMm=round(dt, 1), trayAge=round(cur['age'], 3), owner=cur['owner'])
                    if pending and cur['age'] >= pending[0] - 1e-6:
                        age = pending.pop(0); await capture(f'{prefix}-{age:.2f}', closeups=age in close_ages)
                    prev = cur
                    if cur['age'] > duration + .2: break
                    await tick(1 / 60)
                print(prefix, 'per-frame worst', worst, flush=True)
                return worst

            # A. dinner bought (shopping_complete) and B. photo talk outside
            assert await js('__rainy711.debugJump("chapter:intro")'); await tick(.2)
            for _ in range(300):
                if await js('__rainy711.mission.nodeId') == 'shopping_complete': break
                await js('__rainy711.missionNext()'); await tick(.1)
            await tick(.8); await capture('01-bought')
            if os.environ.get('GRIP_QUICK'):
                report['viewports'].append(vp); await ctx.close(); continue
            assert await advance_to('photo-talk'); await tick(1.2); await capture('02-photo-talk')
            # C. before takeoff: holding at the lever, then the handoff sequence to the dragon
            assert await js('__rainy711.debugJump("chapter:terminal-deploy")'); await tick(.2)
            assert await advance_to('lever'); await tick(.6); await capture('03-before-handoff')
            await js('__rainy711.missionLever(1)')
            vp['handoffSteps'] = await steps('meal-handoff', 1.2, [.35, .75, 1.0], '03-handoff', (.35, 1.0))
            # D. after the purple creature returns the tray
            assert await js('__rainy711.debugJump("chapter:last")'); await tick(.2)
            assert await advance_to('meal-reclaim', 900, attack=True)
            vp['reclaimSteps'] = await steps('meal-reclaim', 2.6, [.6, 1.4, 2.2], '04-reclaim', (2.2,))
            assert await advance_to('tour', 40); await tick(1.5); await capture('04-after-return')
            report['viewports'].append(vp)
            await ctx.close()
        (OUT / f'{TAG}-metrics.json').write_text(json.dumps(report, ensure_ascii=False, indent=1))
        print('ERRORS', report['errors'])
        await b.close()

asyncio.run(main())
