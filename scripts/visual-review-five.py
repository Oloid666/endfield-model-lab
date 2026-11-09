#!/usr/bin/env python3
"""Five current-game checkpoints, stills only; no model API and no gameplay edits."""
import argparse
import asyncio
from datetime import datetime, timezone
import importlib.util
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("visual_review", Path(__file__).with_name("visual-review.py"))
TOOL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(TOOL)
SCENES = {
    "dinner": ("莊拿晚餐與晚餐美術", "晚餐值得拯救；托盤有承重感，角色、手、盤底與食物關係清楚。"),
    "photo": ("拍照、全景與人物近照", "玩家看懂拍照與檢查照片；人物臉清楚，既有模型優點被看見。"),
    "nikke": ("天師樁電腦與妮姬啟動器", "一般人理解偷密碼與借控制通道，術語增添趣味，遮眼梗有可見結果。"),
    "heat": ("紫色生物出場與塞西拒絕", "食物與生物的因果清楚；外形有生命感，拒絕梗的臉與手可讀。"),
    "rescue": ("拋餐、紫色保管員與最後發射", "高空不下降，食物被穩妥接住，紫色生物有戲；發射前後人物可讀。")
}


async def main(args):
    from playwright.async_api import async_playwright
    root = Path(args.out).resolve()
    root.mkdir(parents=True, exist_ok=False)
    source, packets, errors = TOOL.source_info(), {}, []
    for key, (title, goal) in SCENES.items():
        folder = root / key
        (folder / "frames").mkdir(parents=True)
        profile = {"id": key, "title": title, "goal": goal, "viewport": {"width": 390, "height": 844},
                   "device_scale_factor": 1.5, "quality": "balanced", "recipe": "five-scenes-stills-v1"}
        packets[key] = {"status": "capturing", "source": source, "profile": profile,
                        "protocol": TOOL.fingerprint(profile), "created_at": datetime.now(timezone.utc).isoformat(),
                        "capture": {"mode": "stills", "browser": "Chromium SwiftShader", "url": args.url,
                                    "entry": "debug shortcuts; toast naturally expired; debug UI visible", "iphone_tested": False},
                        "frames": [], "errors": []}
        TOOL.write(folder / "packet.json", packets[key])
    async with async_playwright() as p:
        browser = await p.chromium.launch(executable_path="/usr/bin/chromium", args=["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"])
        page = await browser.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1.5, reduced_motion="no-preference")
        page.on("pageerror", lambda e: errors.append(str(e)))
        async def js(code, arg=None):
            return await page.evaluate(code, arg)
        async def tick(seconds=.1):
            await js("s=>{const q=__rainy711,n=Math.max(1,Math.ceil(s/.05));for(let i=0;i<n;i++)q.tick(q.time+s/n,s/n,false)}", seconds)
        async def jump(name):
            if not await js("n=>__rainy711.debugJump(n)", name):
                raise ValueError("Jump failed: " + name)
            await tick(.1)
        async def shot(key, image_id, title, goal, kind="story-camera"):
            await js("__rainy711.tick(__rainy711.time,0,true)")
            file = f"frames/{image_id}.jpg"
            await page.screenshot(path=str(root / key / file), type="jpeg", quality=85)
            state = await js("()=>{const q=__rainy711,s=q.mission,t=s.tablet,p=q.photo,a=q.idle;return {phase:s.phase,scene_seconds:s.phaseElapsed,node:s.nodeId,text:s.text,tablet:t&&{stage:t.stage,dialogue:t.dialogue,censored:t.censored},camera:q.cameraPose,xaihi:q.xaihi,dragon:q.dragonPosition,hero:q.heroPosition,actor:{mealOwner:a.mealOwner,mealSupport:a.mealSupport,catchGripError:a.catchGripError,companionExpression:a.companionExpression,companionHandsVisible:a.companionHandsVisible},staging:q.staging,microwave:{ingredientsVisible:q.microwave.ingredientsVisible},photo:p&&{faceValid:p.faceValid,portraitSource:p.portraitSource,closeupWidth:p.closeupWidth,closeupHeight:p.closeupHeight},gallery:q.photoViewer,quality:q.quality,canAttack:s.canAttack}}")
            packets[key]["frames"].append({"id": image_id, "title": title, "goal": goal, "file": file, "kind": kind, **state})
            TOOL.write(root / key / "packet.json", packets[key])
            print("擷取", key, image_id, title, state["phase"], flush=True)
        def finish(key):
            packets[key]["status"] = "complete"
            packets[key]["errors"] = list(errors)
            if errors:
                raise ValueError("Browser errors: " + str(errors))
            TOOL.write(root / key / "packet.json", packets[key])
            TOOL.write(root / key / "review.json", TOOL.template(packets[key]))
            TOOL.render_report(root / key)
        async def advance_until(expression, limit=240, step=.3):
            for _ in range(limit):
                if await js(expression):
                    return
                await tick(step)
                await js("__rainy711.missionNext()")
            raise ValueError("Checkpoint not reached: " + expression)
        try:
            print("載入遊戲與既有角色", flush=True)
            await page.goto(args.url, wait_until="domcontentloaded")
            await page.locator(".loading-details summary").click()
            await page.locator(".loading-skip").click()
            await page.wait_for_function("window.__rainy711?.actorsLoaded&&document.querySelector('#loading').hidden", timeout=240000)
            await js("()=>{const q=document.querySelector('#quality');q.value='balanced';q.dispatchEvent(new Event('change'));__rainy711.pauseForCapture();__rainy711.frameView('street')}")
            await tick()
            for _ in range(7):
                point = await js("()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector('#scene').getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}")
                await page.mouse.click(point["x"], point["y"])
                await tick()
            await page.wait_for_function("document.querySelector('.bonus-toast').hidden", timeout=10000)
            await jump("chapter:intro")
            await advance_until("__rainy711.mission.phase==='photo-pose'")
            await tick(.9)
            await shot("dinner", "D01", "買完晚餐", "檢查買完後的托盤、身體與對白。")
            await tick(2)
            await shot("dinner", "D02", "莊請龍泡泡拍照", "檢查故事鏡頭中拿餐姿態與角色臉。")
            await js("__rainy711.toggleAutoCamera();__rainy711.frameView('dinner')")
            await tick(.1)
            await shot("dinner", "D03", "晚餐美術檢視", "只評道具外形與材質，不把手動檢視鏡頭當成劇情分鏡。", "asset-inspection")
            finish("dinner")
            await js("__rainy711.resetCamera()")
            await advance_until("__rainy711.mission.phase==='photo-flight'")
            await js("__rainy711.fly(0,1)")
            for _ in range(110):
                if await js("__rainy711.mission.flight.z>=10.1"):
                    break
                await tick(.1)
            await js("__rainy711.fly(0,0)")
            await tick(.8)
            await page.locator(".flight-ready").click()
            await tick(.3)
            await shot("photo", "P01", "玩家取景", "快門可辨識，人物與招牌的拍攝目標清楚。")
            await page.locator(".photo-shutter").click()
            await page.wait_for_function("__rainy711.photo&&__rainy711.mission.phase!=='photo'", timeout=60000)
            for _ in range(40):
                if await page.locator(".phone-gallery").is_visible():
                    break
                await tick(.5)
                await js("__rainy711.missionNext()")
            await shot("photo", "P02", "照片全景", "初始照片與玩家實際拍攝一致，操作可辨識。")
            if not await js("__rainy711.photo.faceValid"):
                raise ValueError("Baseline framing failed to include Zhuang's face; keep evidence and inspect before grading.")
            await page.get_by_role("button", name="放大看有沒有眨眼", exact=True).click()
            await shot("photo", "P03", "獨立光學人物近照", "清楚呈現臉與服飾；此照片不是全景的同一張裁切。")
            finish("photo")
            await jump("nikke")
            await tick(1.6)
            for _ in range(8):
                if await js("__rainy711.mission.tablet.dialogue?.text.includes('帳號密碼')"):
                    break
                await js("__rainy711.tabletAction('talk-next')")
                await tick(.5)
            await shot("nikke", "N01", "小白說明：偷帳號密碼", "畫面表達這是天師樁管理電腦，台詞說明木馬後果。")
            for _ in range(8):
                if await js("__rainy711.mission.tablet.dialogue?.text.includes('供應鏈攻擊')"):
                    break
                await js("__rainy711.tabletAction('talk-next')")
                await tick(.5)
            await shot("nikke", "N02", "術語與遠端通道", "專業字詞與通俗後果有關聯，沒有擋住主畫面。")
            for _ in range(30):
                if await js("__rainy711.mission.tablet.stage==='rapi-mask'"):
                    break
                await js("__rainy711.tabletAction('talk-next')")
                await tick(.5)
            await shot("nikke", "N03", "答應後才遮眼", "比對遮眼是否確實落在眼睛，接通按鈕是否易懂。")
            finish("nikke")
            await jump("birth")
            for age, image_id, title in [(1, "H01", "焦黑食材"), (6.5, "H02", "紫色生物探出"), (10.4, "H03", "生物落地"), (12.2, "H04", "那個我不要了")]:
                await tick(max(0, age - await js("__rainy711.mission.phaseElapsed")))
                await shot("heat", image_id, title, "檢查該節點食物、生物與角色關係；僅憑截圖不評連續變形速度。")
            finish("heat")
            await jump("chapter:last")
            await advance_until("__rainy711.mission.phase==='aim-final'", limit=50, step=.5)
            await page.wait_for_function("!__rainy711.mission.paused", timeout=120000)
            for age, image_id, title in [(5, "R01", "高空準備拋餐"), (6.2, "R02", "晚餐下落與伸高"), (7.3, "R03", "接住承重"), (9.3, "R04", "保管員比讚"), (12.2, "R05", "回到發射條")]:
                await tick(max(0, age - await js("__rainy711.mission.phaseElapsed")))
                await shot("rescue", image_id, title, "高空不下降、盤底支撐、表情符號與玩家操作主次清楚。")
            for _ in range(250):
                if await js("__rainy711.mission.canAttack&&Math.abs(__rainy711.mission.meter-.5)<.025"):
                    break
                await tick(.01)
            if not await js("__rainy711.missionAttack(__rainy711.time)"):
                raise ValueError("Actual final meter input was rejected.")
            await tick(2)
            await shot("rescue", "R06", "發射前半：人物近景（約2秒）", "只評前半人物近景；離手、爆炸與字幕需另補取證，不從靜態圖評效能。")
            finish("rescue")
            TOOL.write(root / "capture-summary.json", {"status": "complete", "source": source, "scenes": list(SCENES), "images": sum(len(x['frames']) for x in packets.values()), "mode": "stills", "errors": errors})
            print("五處取證完成", flush=True)
        except Exception as error:
            for key, packet in packets.items():
                if packet["status"] != "complete":
                    packet.update(status="failed", failure=str(error), errors=errors)
                    TOOL.write(root / key / "packet.json", packet)
            await page.screenshot(path=str(root / "failure.jpg"), type="jpeg")
            raise
        finally:
            await browser.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", required=True)
    parser.add_argument("--url", default="http://127.0.0.1:4204/")
    asyncio.run(main(parser.parse_args()))
