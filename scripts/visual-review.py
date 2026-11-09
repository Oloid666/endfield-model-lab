#!/usr/bin/env python3
"""Local evidence capture and evidence-backed reports. No model/API calls or game edits."""
import argparse
import asyncio
import hashlib
import html
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / "scripts/visual-review-fridge.json"
DIMENSIONS = {"story": "敘事清楚度", "acting": "角色表演", "composition": "構圖與美感", "timing": "節奏與連續性"}
CATALOG = [
    ("loading", "開場載入與開始"), ("dinner", "進店買餐、托盤與出店"),
    ("photo", "拍照、看照片與傳送"), ("cargo", "簽收單、機房與洛西手辦"),
    ("book", "BOOK、登入與接通電網"), ("charge", "起飛、充能與前段砲擊"),
    ("rewind", "回放與塞西出場"), ("fridge-105-v1", "冰箱降溫、105°C反轉與唱歌"),
    ("nikke", "電網搜尋、天師樁電腦與妮姬"), ("heat", "微波節奏、便當變化與紫色生物"),
    ("rescue", "回現場、拋餐與紫色保管員"), ("final", "最後一發、爆炸與廢墟"),
    ("return", "歸還晚餐、復原與散步"), ("concert", "演唱、應援與Fin反轉"),
    ("claims", "二樓保險"), ("classroom", "笑點小學堂八題"),
    ("rating", "結尾評分、重開與隱藏解鎖")
]


def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def write(path, data):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def fingerprint(profile):
    raw = json.dumps(profile, sort_keys=True, ensure_ascii=False).encode()
    return hashlib.sha256(raw).hexdigest()


def source_info():
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    digest = hashlib.sha256()
    paths = [ROOT / "index.html", ROOT / "package.json", ROOT / "package-lock.json", ROOT / "vite.config.js"]
    for base in ["src", "public"]:
        paths.extend(p for p in (ROOT / base).rglob("*") if p.is_file())
    for path in sorted(paths):
        if path.is_file():
            digest.update(str(path.relative_to(ROOT)).encode())
            digest.update(hashlib.sha256(path.read_bytes()).digest())
    return {"commit": commit, "runtime_sha256": digest.hexdigest()}


def template(packet):
    return {"reviewer": None, "status": "pending", "scope": "static evidence only",
            "segments": [{"id": f["id"], "scores": {k: None for k in DIMENSIONS},
                          "summary": "待人工／本對話模型讀圖評估。"} for f in packet["frames"]],
            "findings": [], "top_priorities": [],
            "limitations": ["固定節點取證不能證明真機FPS、聲音同步或即時流暢度。", "尚未iPhone Safari實測。"]}


def validate(packet, review):
    if packet.get("status") != "complete":
        raise ValueError("擷取未完成，不得產生已完成的評分報告。")
    main_ids = {f["id"] for f in packet["frames"]}
    all_frames = packet["frames"] + packet.get("supplementary_frames", [])
    evidence = {f["id"] for f in all_frames}
    if len(evidence) != len(all_frames):
        raise ValueError("重複證據編號。")
    segments = review["segments"]
    if len(segments) != len(main_ids) or {s["id"] for s in segments} != main_ids:
        raise ValueError("每個已擷取節拍都必須列出，不能只挑好看的畫面。")
    for segment in segments:
        if set(segment["scores"]) != set(DIMENSIONS):
            raise ValueError("評分欄位不完整。")
        for key, score in segment["scores"].items():
            if score is not None and (type(score) is not int or not 1 <= score <= 5):
                raise ValueError("分數限1～5，未知用null，不能以0代替。")
            if score is not None and not segment.get("summary", "").strip():
                raise ValueError("分數必須附畫面證據說明。")
            if key == "timing" and score is not None and packet["capture"]["mode"] != "realtime":
                raise ValueError("離線抽幀不得替即時流暢度、同步與完整節奏打分。")
    findings = review["findings"]
    ids = {f["id"] for f in findings}
    if len(ids) != len(findings):
        raise ValueError("缺點編號必須唯一。")
    for finding in findings:
        if not finding.get("evidence") or not set(finding["evidence"]) <= evidence:
            raise ValueError("缺點必須引用本次實際存在的圖片編號。")
        for key in ["title", "observation", "impact", "fix", "acceptance", "confidence", "severity"]:
            if not finding.get(key):
                raise ValueError("修正單缺欄位：" + key)
    if len(review["top_priorities"]) > 3 or not set(review["top_priorities"]) <= ids:
        raise ValueError("優先項目最多3項，且必須存在於完整缺點清單。")
    if review["status"] == "reviewed" and not review.get("reviewer"):
        raise ValueError("必須註明實際評分者。")


def safe_markdown(text):
    return str(text).replace("|", "／").replace("\n", " ")


def catalog_status(folder, packet, review, key):
    if key == packet["profile"]["id"]:
        return "本段已取證／初評" if review["status"] == "reviewed" else "本段已取證／待評分"
    sibling = Path(folder).parent / key
    if (sibling / "packet.json").is_file() and (sibling / "review.json").is_file():
        other, score = read(sibling / "packet.json"), read(sibling / "review.json")
        if (other.get("status") == "complete" and score.get("status") == "reviewed"
                and other.get("source", {}).get("runtime_sha256") == packet["source"]["runtime_sha256"]):
            return "同批同版本已取證／初評"
    return "本包未收錄／未評分"


def render_report(folder):
    folder = Path(folder)
    packet, review = read(folder / "packet.json"), read(folder / "review.json")
    validate(packet, review)
    for frame in packet["frames"] + packet.get("supplementary_frames", []):
        if not (folder / frame["file"]).is_file():
            raise ValueError("缺少證據圖片：" + frame["file"])
    score = lambda value: "—" if value is None else f"{value}/5"
    rows = [f"# 《莊的晚餐》分段品質報告", "", f"本次：{packet['profile']['title']}",
            f"目標：{packet['profile']['goal']}", f"評分者：{review['reviewer'] or '尚未評分'}；狀態：{review['status']}",
            "", "1＝意圖難懂；3＝能懂但支援不足；5＝清楚、有個性且有吸引力。—＝不適用或證據不足，不計總分。",
            "", "## 全遊戲檢查目錄", "", "| 段落 | 狀態 |", "|---|---|"]
    for key, title in CATALOG:
        state = catalog_status(folder, packet, review, key)
        rows.append(f"| {title} | {state} |")
    rows += ["", "## 本段逐節拍評分", "", "| 編號／節拍 | 敘事 | 表演 | 構圖美感 | 節奏 | 畫面依據 |", "|---|---|---|---|---|---|"]
    by_id = {s["id"]: s for s in review["segments"]}
    for frame in packet["frames"]:
        segment = by_id[frame["id"]]
        cells = [frame["id"] + " " + frame["title"], *[score(segment["scores"][k]) for k in DIMENSIONS], segment["summary"]]
        rows.append("| " + " | ".join(safe_markdown(x) for x in cells) + " |")
    rows += ["", "## 已做好的部分", "", *review.get("strengths", ["尚未評估。"]),
             "", "## 操作與可見性檢查", "", *review.get("checks", ["尚未驗證。"]),
             "", "## 全部缺點與可執行改法", ""]
    if not review["findings"]:
        rows += ["本次可見證據未發現需優先修正的明確問題；其餘依範圍限制補驗。" if review["status"] == "reviewed" else "尚未讀圖評分；空清單不表示沒有缺點。", ""]
    for finding in review["findings"]:
        rows += [f"### {finding['id']}｜{finding['title']}", "",
                 f"優先程度：{finding['severity']}；信心：{finding['confidence']}；證據：{', '.join(finding['evidence'])}",
                 f"畫面問題：{finding['observation']}", f"觀眾影響：{finding['impact']}",
                 f"怎麼改：{finding['fix']}", f"改好怎麼確認：{finding['acceptance']}", ""]
    priority_note = ", ".join(review["top_priorities"]) or ("無已確認的優先修正項。" if review["status"] == "reviewed" else "尚未決定。")
    rows += ["## 建議先改三項", "", priority_note, "", "## 證據與限制", "",
             f"來源版本：{packet['source']['commit']}；實際程式／素材指紋：{packet['source']['runtime_sha256']}",
             "取證入口：" + packet['capture'].get('entry', '見本次擷取資料。'),
             "影片是固定場景時鐘的離線擷取，無聲，非即時效能測試；CSS動畫使用擷取時的實際時鐘。" if packet.get("video") else "本輪是固定故事節點截圖，沒有連續錄影，節奏與動作流暢度未評分。",
             *review.get("limitations", []), "", "影片：[preview.mp4](preview.mp4)" if packet.get("video") else "本輪未錄影。", ""]
    for frame in packet["frames"]:
        timing = f"影片{frame['video_seconds']:.2f}秒" if frame.get("video_seconds") is not None else f"節點{frame.get('phase', '')}：{frame.get('scene_seconds', 0):.2f}秒"
        rows.append(f"- [{frame['id']} {frame['title']}]({frame['file']})：{timing}。")
    for frame in packet.get("supplementary_frames", []):
        rows.append(f"- [補充{frame['id']} {frame['title']}]({frame['file']})：由本次影片{frame['video_seconds']:.2f}秒解碼，沒有重新擺姿。")
    (folder / "report.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    e = html.escape
    cards = []
    for frame in packet["frames"] + packet.get("supplementary_frames", []):
        segment = by_id.get(frame["id"], {"scores": {k: None for k in DIMENSIONS}, "summary": "補充證據，由相同影片解碼。"})
        marks = " · ".join(f"{label} {score(segment['scores'][key])}" for key, label in DIMENSIONS.items())
        cards.append(f"<article><h2>{e(frame['id']+' '+frame['title'])}</h2><p>{e(marks)}</p><img loading='lazy' src='{e(frame['file'])}'><p>{e(segment['summary'])}</p></article>")
    catalog_rows = "".join(f"<tr><td>{e(title)}</td><td>{e(catalog_status(folder, packet, review, key))}</td></tr>" for key, title in CATALOG)
    score_rows = ""
    for frame in packet["frames"]:
        segment = by_id[frame["id"]]
        values = [frame["id"] + " " + frame["title"], *[score(segment["scores"][k]) for k in DIMENSIONS], segment["summary"]]
        score_rows += "<tr>" + "".join(f"<td>{e(str(v))}</td>" for v in values) + "</tr>"
    details = ""
    for f in review["findings"]:
        detail = [("證據", ", ".join(f["evidence"])), ("優先程度／信心", f["severity"] + "／" + f["confidence"]),
                  ("畫面問題", f["observation"]), ("觀眾影響", f["impact"]), ("怎麼改", f["fix"]), ("改好怎麼確認", f["acceptance"])]
        details += f"<article><h3>{e(f['id']+' '+f['title'])}</h3>" + "".join(f"<p><strong>{e(label)}：</strong>{e(value)}</p>" for label, value in detail) + "</article>"
    document = "<!doctype html><html lang='zh-Hant'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>莊的晚餐｜分段品質報告</title><style>body{font:16px/1.7 system-ui;background:#102724;color:#ede5cb;margin:auto;padding:20px;max-width:1000px}a{color:#e4c578}.table{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #617367;padding:10px;text-align:left;min-width:65px}td:last-child{min-width:180px}section{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:20px}article{background:#1c3732;padding:16px;margin:16px 0;border:1px solid #617367;border-radius:12px;overflow-wrap:anywhere}img{width:100%;height:auto}video{width:100%;max-height:70vh}</style><h1>莊的晚餐｜分段品質報告</h1>"
    document += f"<p><strong>本次：</strong>{e(packet['profile']['title'])}</p><p><strong>追求目標：</strong>{e(packet['profile']['goal'])}</p><p>評分者：{e(review['reviewer'] or '尚未評分')}；狀態：{e(review['status'])}</p><p>1＝意圖難懂；3＝能懂但支援不足；5＝清楚、有個性且有吸引力。—＝不適用或證據不足，不計總分。</p><p><a href='report.md'>下載文字版</a> · <a href='review.json'>評分原始資料</a></p>"
    document += "<h2>全遊戲檢查目錄</h2><table><tr><th>段落</th><th>狀態</th></tr>" + catalog_rows + "</table><h2>本段逐節拍評分</h2><div class='table'><table><tr><th>節拍</th><th>敘事</th><th>表演</th><th>構圖美感</th><th>節奏</th><th>畫面依據</th></tr>" + score_rows + "</table></div>"
    document += "<h2>已做好的部分</h2>" + "".join("<p>" + e(v) + "</p>" for v in review.get("strengths", ["尚未評估。 "]))
    document += "<h2>操作與可見性檢查</h2>" + "".join("<p>" + e(v) + "</p>" for v in review.get("checks", ["尚未驗證。 "]))
    empty_note = "本次可見證據未發現需優先修正的明確問題；其餘依範圍限制補驗。" if review["status"] == "reviewed" else "尚未評分；空清單不代表沒有缺點。"
    document += "<h2>全部缺點與可執行改法</h2>" + (details or "<p>" + empty_note + "</p>")
    document += "<h2>建議先改三項</h2><p>" + e(priority_note) + "</p><h2>證據限制</h2><p>固定故事時鐘取證，非即時FPS；CSS動畫使用實際擷取時鐘。取證入口：" + e(packet['capture'].get('entry', '見擷取資料。')) + "</p>"
    document += "".join("<p>" + e(v) + "</p>" for v in review.get("limitations", []))
    document += "<h2>取證畫面</h2>" + ("<video controls preload='none' src='preview.mp4'></video>" if packet.get("video") else "<p>本輪僅有固定節點截圖。</p>") + "<section>" + "".join(cards) + "</section></html>"
    (folder / "report.html").write_text(document, encoding="utf-8")


def compare(before, after, output):
    before, after, output = Path(before), Path(after), Path(output)
    a, b = read(before / "packet.json"), read(after / "packet.json")
    if a["status"] != "complete" or b["status"] != "complete" or a["protocol"] != b["protocol"]:
        raise ValueError("擷取未完成或條件不同；不得直接比較分數。")
    if [f["id"] for f in a["frames"]] != [f["id"] for f in b["frames"]]:
        raise ValueError("節拍證據不一致。")
    if output.exists():
        raise ValueError("輸出已存在，請使用新檔名以保留歷史。")
    same = a["source"]["runtime_sha256"] == b["source"]["runtime_sha256"]
    e = html.escape
    cards = []
    for left, right in zip(a["frames"], b["frames"]):
        images = "".join(f"<figure><figcaption>{label}</figcaption><img src='{e(os.path.relpath(root / frame['file'], output.parent))}'></figure>" for root, frame, label in [(before, left, "修改前"), (after, right, "修改後")])
        cards.append(f"<h2>{e(left['id']+' '+left['title'])}</h2><section>{images}</section>")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("<!doctype html><html lang='zh-Hant'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><style>body{font:16px system-ui;max-width:1000px;margin:auto;padding:16px}section{display:grid;grid-template-columns:1fr 1fr;gap:12px}figure{margin:0}img{width:100%}</style><h1>相同節拍前後對照</h1><p>" + ("兩包程式／素材相同，僅為重複擷取，不能宣稱改善。" if same else "程式／素材指紋不同；需讀圖與影片判斷，檔案變更不代表品質改善。") + "</p>" + "".join(cards) + "</html>", encoding="utf-8")


def extract(folder, frame_index, image_id, title):
    folder = Path(folder)
    packet = read(folder / "packet.json")
    if not packet.get("video"):
        raise ValueError("本次沒有錄影，不能補抽影片影格。")
    extra = packet.setdefault("supplementary_frames", [])
    if packet["status"] != "complete" or len(extra) >= 2:
        raise ValueError("需完成擷取；每輪最多補抽2張。")
    if not image_id.isalnum() or image_id in {f["id"] for f in packet["frames"] + extra}:
        raise ValueError("補圖編號必須唯一且只含英數。")
    if not 0 <= frame_index < packet["video"]["frames"]:
        raise ValueError("影格超出影片範圍。")
    dest = f"frames/{image_id}.jpg"
    if (folder / dest).exists():
        raise ValueError("補圖檔案已存在。")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(folder / "preview.mp4"), "-vf", f"select=eq(n\\,{frame_index})", "-frames:v", "1", "-q:v", "2", str(folder / dest)], check=True)
    if not (folder / dest).is_file():
        raise ValueError("未成功解碼補充影格。")
    extra.append({"id": image_id, "title": title, "file": dest, "frame_index": frame_index,
                  "video_seconds": frame_index / packet["video"]["fps"], "source": "decoded from this capture's video"})
    write(folder / "packet.json", packet)
    render_report(folder)


async def capture(args):
    from playwright.async_api import async_playwright
    profile = read(args.profile)
    samples = [s for step in profile["timeline"] for s in step.get("samples", [])]
    if len(samples) > profile["max_review_images"] or len({s["id"] for s in samples}) != len(samples):
        raise ValueError("關鍵圖超過預算或編號重複。")
    if not 1 <= profile["fps"] <= 30:
        raise ValueError("離線幀率須為1～30。")
    for name in [args.browser, "ffmpeg"]:
        if not shutil.which(name):
            raise ValueError("缺少工具：" + name)
    folder = Path(args.out).resolve()
    folder.mkdir(parents=True, exist_ok=False)
    (folder / "frames").mkdir()
    packet = {"status": "capturing", "created_at": datetime.now(timezone.utc).isoformat(),
              "source": source_info(), "profile": profile, "protocol": fingerprint(profile),
              "capture": {"mode": "offline", "audio": False, "browser": "Chromium SwiftShader", "url": args.url,
                          "entry": "debug shortcut; debug UI visible; toast naturally expired", "iphone_tested": False},
              "frames": [], "errors": []}
    write(folder / "packet.json", packet)
    frame_count = 0
    try:
        with tempfile.TemporaryDirectory(prefix="rain-review-") as temp:
            raw = Path(temp)
            async with async_playwright() as p:
                browser = await p.chromium.launch(executable_path=shutil.which(args.browser), args=["--no-sandbox", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--disable-dev-shm-usage"])
                try:
                    page = await browser.new_page(viewport=profile["viewport"], device_scale_factor=profile["device_scale_factor"], reduced_motion="no-preference")
                    page.on("pageerror", lambda error: packet["errors"].append(str(error)))
                    async def js(code, value=None):
                        return await page.evaluate(code, value)
                    async def advance(seconds, recording=False, markers=()):
                        nonlocal frame_count
                        count = max(1, math.ceil(seconds * (profile["fps"] if recording else 20)))
                        emitted = set()
                        for i in range(count):
                            await js("s=>{const q=__rainy711,n=Math.ceil(s.dt/.05);for(let i=0;i<n;i++)q.tick(q.time+s.dt/n,s.dt/n,false);if(s.render)q.tick(q.time,0,true)}", {"dt": seconds / count, "render": recording})
                            if recording:
                                path = raw / f"{frame_count:05d}.jpg"
                                await page.screenshot(path=str(path), type="jpeg", quality=82, animations="allow")
                                for marker in markers:
                                    if marker["id"] not in emitted and (i+1)*seconds/count + 1e-8 >= marker["at"]:
                                        dest = f"frames/{marker['id']}.jpg"
                                        shutil.copyfile(path, folder / dest)
                                        state = await js("()=>{const q=__rainy711,t=q.mission.tablet;return {stage:t.stage,dialogue:t.dialogue,temperature:q.devices.temperature,stage_age:t.age,dialogue_age:t.dialogueAge,camera:q.cameraPose,xaihi:q.xaihi,dragon_expression:q.idle.companionExpression,quality:q.quality}}")
                                        packet["frames"].append({**marker, **state, "file": dest, "frame_index": frame_count, "video_seconds": frame_count/profile["fps"]})
                                        emitted.add(marker["id"])
                                        print("擷取", marker["id"], marker["title"], state["temperature"], flush=True)
                                frame_count += 1
                        if markers and emitted != {m["id"] for m in markers}:
                            raise ValueError("抽幀時間超出本步驟，證據不完整。")
                    async def action(value, recording=False):
                        await advance(.35, recording)
                        ok = await js("a=>__rainy711.tabletAction(a)", value)
                        if not ok:
                            raise ValueError("操作未接受：" + value)
                    async def steps(items, recording=False):
                        for step in items:
                            if "seconds" in step:
                                await advance(step["seconds"], recording, step.get("samples", []))
                            elif "input" in step:
                                await action(step["input"], recording)
                            elif "until_stage" in step:
                                elapsed = 0
                                while await js("__rainy711.mission.tablet.stage") != step["until_stage"]:
                                    if elapsed >= step["timeout"]:
                                        raise ValueError("未進入階段：" + step["until_stage"])
                                    await advance(1/profile["fps"] if recording else .05, recording)
                                    elapsed += 1/profile["fps"] if recording else .05
                            elif step.get("talk_through"):
                                for _ in range(20):
                                    if not await js("!!__rainy711.mission.tablet.dialogue"):
                                        break
                                    await advance(.6, recording)
                                    await action("talk-next", recording)
                                else:
                                    raise ValueError("對話無法結束。")
                                await advance(.4, recording)
                    print("啟動遊戲與現有角色載入", flush=True)
                    await page.goto(args.url, wait_until="domcontentloaded")
                    await page.locator(".loading-details summary").click()
                    await page.locator(".loading-skip").click()
                    await page.wait_for_function("window.__rainy711?.actorsLoaded && document.querySelector('#loading').hidden", timeout=240000)
                    await js("()=>{const q=document.querySelector('#quality');q.value='" + profile["quality"] + "';q.dispatchEvent(new Event('change'));__rainy711.pauseForCapture();__rainy711.frameView('street')}")
                    await advance(.1)
                    for _ in range(7):
                        point = await js("()=>{const p=__rainy711.projectPoint([0,3.1,2.23]),r=document.querySelector('#scene').getBoundingClientRect();return {x:r.x+(p[0]+1)*r.width/2,y:r.y+(1-p[1])*r.height/2}}")
                        await page.mouse.click(point["x"], point["y"])
                        await advance(.1)
                    print("已解鎖，等待通知自然退場", flush=True)
                    await page.wait_for_function("document.querySelector('.bonus-toast')?.hidden", timeout=10000)
                    if not await js("__rainy711.debug.unlocked && __rainy711.debugJump('fridge')"):
                        raise ValueError("無法透過現有解鎖捷徑進入冰箱。")
                    print("準備冰箱橋段；準備過程不重複渲染", flush=True)
                    await steps(profile["setup"])
                    print("開始固定時鐘離線擷取", flush=True)
                    await steps(profile["timeline"], True)
                finally:
                    await browser.close()
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(profile["fps"]), "-i", str(raw / "%05d.jpg"), "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2", "-c:v", "libx264", "-preset", "fast", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(folder / "preview.mp4")], check=True)
        if packet["errors"] or len(packet["frames"]) != len(samples):
            raise ValueError("有瀏覽器錯誤或擷取不完整。")
        packet.update(status="complete", video={"file": "preview.mp4", "frames": frame_count, "fps": profile["fps"], "seconds": frame_count/profile["fps"]})
        write(folder / "packet.json", packet)
        write(folder / "review.json", template(packet))
        render_report(folder)
        print("完成取證，尚未自動評分：", folder, flush=True)
    except Exception as error:
        packet.update(status="failed", failure=str(error))
        write(folder / "packet.json", packet)
        raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    c = commands.add_parser("capture")
    c.add_argument("--profile", default=str(PROFILE))
    c.add_argument("--url", default="http://127.0.0.1:4204/")
    c.add_argument("--browser", default="chromium")
    c.add_argument("--out", required=True)
    r = commands.add_parser("report")
    r.add_argument("folder")
    b = commands.add_parser("compare")
    b.add_argument("before")
    b.add_argument("after")
    b.add_argument("--out", required=True)
    x = commands.add_parser("extract")
    x.add_argument("folder")
    x.add_argument("--frame", type=int, required=True)
    x.add_argument("--id", required=True)
    x.add_argument("--title", required=True)
    args = parser.parse_args()
    if args.command == "capture":
        asyncio.run(capture(args))
    elif args.command == "report":
        render_report(args.folder)
    elif args.command == "extract":
        extract(args.folder, args.frame, args.id, args.title)
    else:
        compare(args.before, args.after, args.out)


if __name__ == "__main__":
    main()
