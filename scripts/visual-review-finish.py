#!/usr/bin/env python3
"""Finish the same-build whole-game still review; reuse verified packets, never submit feedback."""
import argparse
import asyncio
from datetime import datetime, timezone
import importlib.util
from pathlib import Path
import shutil

SPEC = importlib.util.spec_from_file_location("visual_review", Path(__file__).with_name("visual-review.py"))
TOOL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(TOOL)
NEW = {
    "loading": "載入提示、直接進入與真正開場可理解。",
    "cargo": "簽收反轉、洛西彩蛋與拆樓動機有清楚視覺證據。",
    "book": "BOOK展開、帳密、驗證與拉桿有可辨識的操作次序。",
    "charge": "高空角色、服飾、鞋與全城儲能形成有主次的演出。",
    "rewind": "回放轉場、塞西出場動機與平板操作有脈絡且可讀。",
    "final": "最後發射、Explosion字幕、爆炸與卡牆有明確焦點。",
    "return": "戰損、歸還晚餐與彈指復原的狀態有可讀差異。",
    "concert": "演唱、應援、假Fin與中斷片尾具有可見演出。",
    "claims": "理賠選項、態度轉折、蓋章與結案有舞台表演及操作回饋。",
    "classroom": "八題逐題可讀、笑點解說與主線一致、整體進度與結業明確。",
    "rating": "星等、選填留言、略過、謝幕與重新開始有清楚出口。"
}


async def main(args):
    from playwright.async_api import async_playwright
    root, source = Path(args.out).resolve(), TOOL.source_info()
    if root.exists() and not args.resume:
        raise ValueError("輸出已存在；首次使用新目錄，中斷續跑用--resume。")
    root.mkdir(parents=True, exist_ok=True)
    old = {"fridge-105-v1": Path(args.fridge_source).resolve()}
    old.update({k: Path(args.five_source).resolve() / k for k in ["dinner", "photo", "nikke", "heat", "rescue"]})
    for key, folder in old.items():
        packet = TOOL.read(folder / "packet.json")
        if packet["status"] != "complete" or packet["source"] != source:
            raise ValueError("舊證據與本次版本不同，必須先重拍：" + key)
        if not (root / key).exists():
            shutil.copytree(folder, root / key)
    packets, errors, feedback_posts = {}, [], []
    for key, title in TOOL.CATALOG:
        folder = root / key
        if key in NEW:
            (folder / "frames").mkdir(parents=True, exist_ok=True)
            profile = {"id": key, "title": title, "goal": NEW[key], "viewport": {"width": 390, "height": 844}, "device_scale_factor": 1.5, "quality": "balanced after loading", "recipe": "finish-stills-v1"}
            packet = TOOL.read(folder / "packet.json") if (folder / "packet.json").exists() else {"status": "capturing", "source": source, "profile": profile, "protocol": TOOL.fingerprint(profile), "created_at": datetime.now(timezone.utc).isoformat(), "capture": {"mode": "stills", "browser": "Chromium SwiftShader", "url": args.url, "entry": "debug shortcuts plus actual UI; toast naturally expired", "iphone_tested": False}, "frames": [], "errors": []}
            if packet["source"] != source:
                raise ValueError("續跑資料版本不同。")
            packets[key] = packet
        else:
            packets[key] = TOOL.read(folder / "packet.json")
        TOOL.write(folder / "packet.json", packets[key])

    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"])
        page = await browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1.5, reduced_motion="no-preference")
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("request", lambda r: feedback_posts.append(r.url) if r.method == "POST" and "/api/feedback" in r.url else None)
        async def js(code, value=None):
            return await page.evaluate(code, value)
        async def tick(seconds=.1):
            await js("s=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,s/n,false)}", seconds)
        async def jump(name):
            if not await js("n=>__rainy711.debugJump(n)", name):
                raise ValueError("Jump failed: " + name)
            await tick(.2)
        async def shot(key, image_id, title, goal="檢查本節點敘事、角色、構圖與可讀性。"):
            if any(f["id"] == image_id for f in packets[key]["frames"]):
                return
            await js("window.__rainy711?.tick(__rainy711.time,0,true)")
            file = f"frames/{image_id}.jpg"
            await page.screenshot(path=str(root / key / file), type="jpeg", quality=85)
            state = await js("()=>{const q=window.__rainy711;if(!q)return {phase:'loading',scene_seconds:0};const s=q.mission,t=s.tablet,b=q.bonus,a=q.idle;return {phase:s.phase,scene_seconds:s.phaseElapsed,node:s.nodeId,text:s.text,camera:q.cameraPose,hero:q.heroPosition,dragon:q.dragonPosition,quality:q.quality,tablet:t&&{stage:t.stage,dialogue:t.dialogue,lines:t.lines,buttons:t.buttons,censored:t.censored},xaihi:q.xaihi,devices:q.devices,microwave:q.microwave,staging:q.staging,actor:{mealOwner:a.mealOwner,handSupportErrors:a.handSupportErrors,catchGripError:a.catchGripError,companionExpression:a.companionExpression},bonus:b&&{active:b.active,route:b.route,lesson:b.lesson,page:b.page,response:b.response,course:b.course,room:b.room,negotiation:b.negotiation},caption:document.querySelector('.mission-caption')?.textContent,bonus_text:document.querySelector('.bonus-content')?.innerText||'',speech:document.querySelector('.creature-communication')?.innerText||''}}")
            packets[key]["frames"].append({"id": image_id, "title": title, "goal": goal, "file": file, **state})
            TOOL.write(root / key / "packet.json", packets[key])
            print("擷取", key, image_id, title, flush=True)
        def finish(key):
            if errors:
                raise ValueError("Browser errors: " + str(errors))
            packet = packets[key]
            packet.update(status="complete", errors=[])
            packet.pop("failure", None)
            TOOL.write(root / key / "packet.json", packet)
            review_path = root / key / "review.json"
            if review_path.exists():
                review = TOOL.read(review_path)
                known = {s["id"] for s in review["segments"]}
                for frame in packet["frames"]:
                    if frame["id"] not in known:
                        review["segments"].append({"id": frame["id"], "scores": {k: None for k in TOOL.DIMENSIONS}, "summary": "新增證據，待本對話評估。"})
                        review.update(status="pending", reviewer=None)
            else:
                review = TOOL.template(packet)
            TOOL.write(review_path, review)
            TOOL.render_report(root / key)
        async def until(expression, limit=220, step=.4, next_input=True):
            for _ in range(limit):
                if await js(expression):
                    return
                await tick(step)
                if next_input:
                    phase = await js("__rainy711.mission.phase")
                    await js("__rainy711.acceptCall()" if phase == "comm-request" else "__rainy711.missionVerify()" if phase == "captcha" else "__rainy711.missionNext()")
            raise ValueError("Checkpoint not reached: " + expression)
        async def act(value):
            await tick(.5)
            if not await js("a=>__rainy711.tabletAction(a)", value):
                raise ValueError("Tablet input rejected: " + value)
            await tick(.1)
        async def talks():
            for _ in range(80):
                if not await js("!!__rainy711.mission.tablet?.dialogue"):
                    await tick(.4)
                    return
                if await js("__rainy711.mission.tablet.busy"):
                    await tick(.2)
                    continue
                await act("talk-next")
            raise ValueError("Dialogue did not finish.")
        try:
            print("載入與開場", flush=True)
            await page.goto(args.url, wait_until="domcontentloaded")
            await page.locator(".loading-details summary").click()
            await shot("loading", "L01", "載入詳情與直接進入")
            await page.locator(".loading-skip").click()
            await page.wait_for_function("window.__rainy711?.actorsLoaded&&document.querySelector('#loading').hidden", timeout=240000)
            await js("()=>{const e=document.querySelector('#quality');e.value='balanced';e.dispatchEvent(new Event('change'));__rainy711.pauseForCapture();__rainy711.frameView('street')}")
            await tick(.8)
            await shot("loading", "L02", "真正開場與開始按鈕")
            finish("loading")
            for _ in range(7):
                point = await js("()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector('#scene').getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}")
                await page.mouse.click(point["x"], point["y"])
                await tick()
            await page.wait_for_function("document.querySelector('.bonus-toast').hidden", timeout=10000)
            await jump("chapter:cargo")
            await until("__rainy711.mission.nodeId==='cargo_1'")
            await tick(1)
            await shot("cargo", "C01", "一萬噸簽收單揭露")
            await until("__rainy711.mission.nodeId==='briefing_8'")
            await tick(1.2)
            await shot("cargo", "C02", "洛西手辦與主嫌自介")
            await until("__rainy711.mission.nodeId==='briefing_16'")
            await tick(1.5)
            await shot("cargo", "C03", "建築本體長焦視角")
            finish("cargo")
            await jump("chapter:terminal-deploy")
            await tick(2.4)
            await shot("book", "B01", "BOOK展開")
            await until("__rainy711.mission.phase==='login'")
            await tick(.7)
            await shot("book", "B02", "帳密鍵帽操作")
            for chunk in ["endfield", "_", "power", "520", "1314"]:
                if not await js("s=>__rainy711.keyChunk(s)", chunk):
                    raise ValueError("Login chunk rejected.")
                await tick(.2)
            await until("__rainy711.mission.phase==='lever'")
            await tick(.8)
            await shot("book", "B03", "接通拉桿")
            finish("book")
            if not await js("__rainy711.missionLever(1)"):
                raise ValueError("Lever rejected.")
            await until("__rainy711.mission.phase==='ascent'", next_input=False)
            await tick(2)
            await shot("charge", "Q01", "起飛中的莊與龍泡泡")
            await until("__rainy711.mission.phase==='shoe-view'", next_input=False)
            await tick(1)
            await shot("charge", "Q02", "鞋與服飾插入鏡")
            await tick(8)
            await js("__rainy711.missionNext()")
            await tick(1.1)
            await shot("charge", "Q03", "天師樁接通")
            await until("__rainy711.mission.phase==='charge'", next_input=False)
            await page.wait_for_function("!__rainy711.mission.paused",timeout=120000)
            await tick(max(0,13-await js("__rainy711.mission.phaseElapsed")))
            await shot("charge", "Q04", "全城儲能充電與保險對白")
            await shot("charge", "Q07", "預載結束後的充能中段")
            await until("__rainy711.mission.phase==='fire-ready'", next_input=False)
            await js("__rainy711.missionNext()")
            await tick(.2)
            await shot("charge", "Q05", "前段砲擊的操作畫面")
            captured_combat=False
            for _ in range(36):
                if await js("__rainy711.mission.phase!=='combat'"):
                    break
                await page.wait_for_function("!__rainy711.mission.paused",timeout=120000)
                state=await js("__rainy711.mission")
                await tick(max(.7,state['combatHoldRemaining']+.1))
                state=await js("__rainy711.mission")
                await tick((state['meterPeriod']*.25-state['meterElapsed'])%state['meterPeriod'])
                await js("__rainy711.missionAttack(__rainy711.time)")
                await tick(.2)
                if not captured_combat and await js("__rainy711.mission.progress>=40"):
                    await shot("charge","Q06","前段砲擊與建築破壞");captured_combat=True
            if not captured_combat:
                raise ValueError("Combat did not reach a visible damage checkpoint.")
            finish("charge")
            await until("__rainy711.mission.phase==='rewind'")
            await page.wait_for_function("!__rainy711.mission.paused",timeout=120000)
            await tick(.9)
            await shot("rewind", "W01", "回放轉場")
            await until("__rainy711.mission.phase==='flashback'", next_input=False)
            await tick(.7)
            await shot("rewind", "W02", "塞西先由旁白介紹")
            await until("__rainy711.mission.phase==='hack'")
            await tick(2)
            await talks()
            await shot("rewind", "W03", "平板與尋找方法")
            await act("scan")
            await tick(1.7)
            await talks()
            await shot("rewind", "W04", "漏洞說明與通俗按鈕")
            finish("rewind")
            await act("tool");await act("detect");await tick(1.4);await act("control");await tick(3.3);await act("apply");await tick(2.1);await talks();await tick(3.8);await talks();await act("meal");await tick(3.3)
            await shot("heat", "H05", "便當包裝／設備的三分鐘說明")
            await talks();await act("scan-grid");await tick(4.3)
            await shot("nikke", "N04", "逐一檢查三座天師樁")
            await tick(.7);await talks();await act("inspect-console");await talks();await tick(.5);await talks();await tick(2);await act("enable");await tick(2.6)
            await shot("nikke", "N05", "電網沿線送電")
            await tick(3.6);await talks()
            await act("800w");await talks()
            await shot("nikke", "N06", "額定與借用電網兩個選項")
            finish("nikke")
            await act("800mw");await act("confirm");await act("start")
            await until("__rainy711.mission.phase==='heat'")
            await tick(6.1)
            for rnd in range(3):
                if not await js("__rainy711.missionHeatStart(__rainy711.time)"):
                    raise ValueError("Heat did not start.")
                notes = await js("__rainy711.mission.heat.notes")
                for note in notes:
                    elapsed = await js("__rainy711.mission.heat.elapsed")
                    await tick(max(0, note["at"] - elapsed))
                    if not await js("__rainy711.missionHeatStart(__rainy711.time)"):
                        raise ValueError("Rhythm tap rejected.")
                    await tick(.02)
                await tick(.7)
                await shot("heat", "H0" + str(6+rnd), ["第一輪冒煙", "第二輪加熱", "第三輪失敗與焦黑"][rnd])
            finish("heat")
            await until("__rainy711.mission.phase==='flashback-end'")
            await until("__rainy711.mission.phase==='last'")
            await until("__rainy711.mission.phase==='aim-final'")
            await page.wait_for_function("!__rainy711.mission.paused", timeout=120000)
            await tick(12.3)
            for _ in range(280):
                if await js("__rainy711.mission.canAttack&&Math.abs(__rainy711.mission.meter-.5)<.025"):
                    break
                await tick(.01)
            if not await js("__rainy711.missionAttack(__rainy711.time)"):
                raise ValueError("Final attack rejected.")
            previous = 0
            for age, image_id, title in [(2.25,"F01","離手與Explosion字幕"),(5.05,"F02","命中與爆炸"),(6.75,"F03","龍泡泡卡牆")]:
                await tick(age-previous);previous=age
                await shot("final", image_id, title)
            finish("final")
            await until("__rainy711.mission.phase==='landing'", next_input=False)
            await tick(3)
            await shot("return", "T01", "戰損與OK繃仍保留")
            await until("__rainy711.mission.phase==='meal-reclaim'", next_input=False)
            await tick(.8)
            await shot("return", "T02", "歸還晚餐")
            await tick(1.5)
            await shot("return", "T06", "正常流程交盤後放下手臂")
            await until("__rainy711.mission.phase==='tour'", next_input=False)
            await tick(15)
            await shot("concert", "G01", "第一個演唱姿態")
            await tick(11)
            await shot("concert", "G02", "後段演唱與應援")
            await until("__rainy711.mission.phase==='complete'", next_input=False)
            await tick(.4)
            await shot("concert", "G03", "Fin初始")
            await tick(2.1)
            await shot("concert", "G04", "Fin反轉中的字樣")
            finish("concert")
            await tick(10)
            for _ in range(3):
                await page.locator(".epilogue-prompt button").click()
            await tick(2.3)
            await shot("return", "T03", "彈指復原與清潔")
            await tick(1)
            await shot("return", "T05", "彈指星芒與戰損清除中")
            await tick(30)
            await shot("return", "T04", "復原後街角")
            await shot("return", "T07", "正常流程復原後街角")
            finish("return")
            await page.locator('.epilogue-prompt button').click()
            await page.wait_for_function("__rainy711.bonus.active&&!__rainy711.bonus.busy",timeout=30000)
            await tick(2.5)
            await shot("claims", "A01", "理賠舞台入口")
            await page.locator('[data-action="claims-next"]').click();await tick(1.7)
            seen_objection=False;seen_policy=False;seen_stamp=False
            for _ in range(100):
                state=await js("__rainy711.bonus");n=state["negotiation"]
                if state["route"]=="settlement-result":
                    break
                if n["phase"]=="objection" and not seen_objection:
                    await tick(.8);await shot("claims","A02","保險代表抗議");seen_objection=True
                if n["cue"] and n["cue"].get("event")=="policyholder" and not seen_policy:
                    await tick(.75);await shot("claims","A03","看見要保人的態度轉折");seen_policy=True
                if n["phase"]=="stamp":
                    if not seen_stamp:
                        await tick(.45);await shot("claims","A04","蓋章的紙與印章");seen_stamp=True
                    await tick(1.3)
                else:
                    await tick(1.7)
                    selector='[data-action="claims-select"]' if n["phase"]=="choice" else '[data-action="claims-next"]'
                    await page.locator(selector).first.click()
                    if await js("__rainy711.bonus.negotiation.phase")!="stamp":
                        await tick(1.7)
            if not await js("__rainy711.bonus.claimsSettled"):
                raise ValueError("Claims did not complete.")
            await shot("claims","A05","理賠與長期合作結案")
            finish("claims")
            await jump("classroom");await tick(2)
            await page.locator('[data-action="class-menu"]').click()
            await page.locator('[data-action="class-reset"]').click();await tick(1)
            captured=set();reaction=False
            for _ in range(180):
                state=await js("__rainy711.bonus")
                if state["route"]=="class-result":
                    break
                if state["route"]=="lesson" and state["page"]==1 and state["lesson"] not in captured:
                    captured.add(state["lesson"]);await tick(.8)
                    await shot("classroom",f"K{len(captured):02d}","課題："+state["lesson"])
                if state["route"]=="lesson" and state["room"]["focus"]=="reaction" and not reaction:
                    await tick(1);await shot("classroom","K09","課後吐槽與講師反應");reaction=True
                if state["route"] in ["class-wait","class-stamping"]:
                    await tick(1.3)
                else:
                    await page.locator('[data-action="class-next"]').click();await tick(.3)
            if len(captured)!=8 or not await js("__rainy711.bonus.course.percentage===100&&__rainy711.bonus.course.stamped"):
                raise ValueError("Eight-lesson course incomplete.")
            await shot("classroom","K10","八題100%與死亡證明")
            finish("classroom")
            await page.locator('[data-action="class-next"]').click();await tick(.3)
            await shot("rating","E01","星等與選填留言")
            skip=page.get_by_role("button",name="略過，繼續謝幕",exact=True)
            if await skip.count():
                await skip.click()
            else:
                await page.locator('[data-action="rate-skip"]').click()
            await tick(.5)
            await shot("rating","E02","七下解鎖的謝幕提示")
            for _ in range(5):
                if await js("__rainy711.bonus.route==='final'"):
                    break
                await page.locator('[data-action="thanks-next"]').click();await tick(.3)
            if not await js("__rainy711.bonus.route==='final'"):
                raise ValueError("Thanks flow did not reach true Fin.")
            await tick(1.5)
            await shot("rating","E03","真正Fin與返回街角")
            await page.get_by_role('button',name='回雨夜街角',exact=True).click();await tick(.3)
            await page.locator('.postgame-reset').click();await tick(.3)
            if not await js("__rainy711.mission.phase==='ready'&&!__rainy711.debug.unlocked"):
                raise ValueError("Restart did not reach actual beginning.")
            await shot("rating","E04","重新開始回到真正開場")
            finish("rating")
            if feedback_posts:
                raise ValueError("Unexpected feedback submission.")
            TOOL.write(root / "capture-summary.json", {"status":"complete","source":source,"scenes":[key for key,_ in TOOL.CATALOG],"new_scenes":list(NEW),"image_counts":{k:len(p['frames']) for k,p in packets.items()},"mode":"mixed existing offline video and new stills","errors":errors,"feedback_posts":feedback_posts})
            failure_path=root / "capture-failure.json"
            if failure_path.exists():
                failure=TOOL.read(failure_path);failure['resolved']=True
                TOOL.write(root / "capture-retry-history.json",failure)
                failure_path.unlink()
            print("17區段取證齊備；新增節點待讀圖評分",flush=True)
        except Exception as error:
            TOOL.write(root / "capture-failure.json", {"error":str(error),"errors":errors,"feedback_posts":feedback_posts})
            await page.screenshot(path=str(root / "failure.jpg"),type="jpeg")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out",required=True)
    parser.add_argument("--url",default="http://127.0.0.1:4204/")
    parser.add_argument("--resume",action="store_true")
    parser.add_argument("--fridge-source",default=str(TOOL.ROOT / "artifacts/visual-review/fridge-baseline-02"),help="Completed same-version fridge evidence folder.")
    parser.add_argument("--five-source",default=str(TOOL.ROOT / "artifacts/visual-review/five-baseline-01"),help="Completed same-version five-scene evidence root.")
    asyncio.run(main(parser.parse_args()))
