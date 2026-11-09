#!/usr/bin/env python3
"""Combine reviewed scene packets into one readable, evidence-linked report."""
import argparse
import html
import importlib.util
import os
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("visual_review", Path(__file__).with_name("visual-review.py"))
TOOL = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(TOOL)


def scene_keys(batch, all_mode=False):
    keys = [key for key, _ in TOOL.CATALOG] if all_mode else ["dinner", "photo", "nikke", "heat", "rescue"]
    missing = [key for key in keys if not (Path(batch) / key / "packet.json").is_file() or not (Path(batch) / key / "review.json").is_file()]
    if missing:
        raise ValueError("報告缺少區段，不能宣稱完成：" + ", ".join(missing))
    return keys


def main(args):
    batch = Path(args.batch).resolve()
    scenes = []
    all_mode = getattr(args, "all", False)
    for key in scene_keys(batch, all_mode):
        folder = batch / key
        packet, review = TOOL.read(folder / "packet.json"), TOOL.read(folder / "review.json")
        TOOL.validate(packet, review)
        if review["status"] != "reviewed":
            raise ValueError("尚未評分：" + key)
        if set(review["chapter_scores"]) != set(TOOL.DIMENSIONS):
            raise ValueError("分段初評欄位不完整。")
        for dimension, score in review["chapter_scores"].items():
            if score is not None and (type(score) is not int or not 1 <= score <= 5):
                raise ValueError("分段初評限1～5，未知用null。")
            if dimension == "timing" and score is not None:
                raise ValueError("本輪未錄影，節奏不得打分。")
        TOOL.render_report(folder)
        scenes.append((folder, packet, review))
    sources = {p["source"]["runtime_sha256"] for _, p, _ in scenes}
    if len(sources) != 1:
        raise ValueError("區段不是同一程式／素材版本，需分開報告。")
    current = {p["profile"]["id"] for _, p, _ in scenes}
    previous = {}
    for path in Path(args.root).resolve().rglob("review.json"):
        packet_path = path.with_name("packet.json")
        if not packet_path.exists():
            continue
        packet, review = TOOL.read(packet_path), TOOL.read(path)
        if packet.get("status") == "complete" and review.get("status") == "reviewed" and packet["source"]["runtime_sha256"] in sources:
            previous[packet["profile"]["id"]] = path.parent
    e = html.escape
    score = lambda s: "—" if s is None else f"{s}/5"
    image_count = sum(len(p["frames"]) + len(p.get("supplementary_frames", [])) for _, p, _ in scenes)
    finding_count = sum(len(r["findings"]) for _, _, r in scenes)
    report_title = "全遊戲17段初評" if all_mode else "五處分段初評"
    overview = f"同版本{len(scenes)}個區段、{image_count}張實際畫面、{finding_count}項問題與候選改善。沿用前輪同版本證據並補拍缺口；所有節奏分數留空，不代表完整動態、全分支操作或iPhone測試通過。"
    rows = ["# 《莊的晚餐》" + report_title, "", overview, "",
            "1＝意圖難懂；3＝能懂但支援不足；5＝清楚、有個性、有吸引力。分段分數是本次目標判斷，不是各圖平均，也不是玩家留存率。", "",
            "| 本輪段落 | 敘事 | 表演 | 構圖美感 | 優先改法 |", "|---|---|---|---|---|"]
    summary_html = ""
    for _, packet, review in scenes:
        values = [packet["profile"]["title"], *[score(review["chapter_scores"][k]) for k in ["story", "acting", "composition"]], review["recommendation"]]
        rows.append("| " + " | ".join(TOOL.safe_markdown(v) for v in values) + " |")
        summary_html += "<tr>" + "".join("<td>" + e(v) + "</td>" for v in values) + "</tr>"
    rows += ["", "## 全遊戲覆蓋進度", "", "| 段落 | 取證狀態 |", "|---|---|"]
    catalog = ""
    for key, title in TOOL.CATALOG:
        status = "本輪已取證／初評（範圍見各段限制）" if key in current else "前輪已取證／初評" if key in previous else "待擷取／未評分"
        rows.append(f"| {title} | {status} |")
        catalog += f"<tr><td>{e(title)}</td><td>{e(status)}</td></tr>"
    sections = ""
    for folder, packet, review in scenes:
        title = packet["profile"]["title"]
        rows += ["", "## " + title, "", "目標：" + packet["profile"]["goal"], "本段初評：" + review["chapter_summary"], ""]
        sections += f"<section><h2>{e(title)}</h2><p><strong>目標：</strong>{e(packet['profile']['goal'])}</p><p>{e(review['chapter_summary'])}</p><p><a href='{e(os.path.relpath(folder/'report.html', batch))}'>本段逐圖完整報告</a></p>"
        rows += ["已做好：" + "；".join(review.get("strengths", [])), ""]
        sections += "<p><strong>已做好：</strong>" + e("；".join(review.get("strengths", []))) + "</p>"
        for finding in review["findings"]:
            rows += ["### " + finding["id"] + " " + finding["title"], "",
                     "證據：" + ", ".join(finding["evidence"]) + "；程度：" + finding["severity"] + "；信心：" + finding["confidence"],
                     "畫面問題：" + finding["observation"], "觀眾影響：" + finding["impact"],
                     "怎麼改：" + finding["fix"], "驗收：" + finding["acceptance"], ""]
            sections += f"<article><h3>{e(finding['id']+' '+finding['title'])}</h3><p>{e(finding['severity'])} · 信心{e(finding['confidence'])} · 證據{e(', '.join(finding['evidence']))}</p>"
            for label, key in [("畫面問題", "observation"), ("觀眾影響", "impact"), ("怎麼改", "fix"), ("驗收", "acceptance")]:
                sections += f"<p><strong>{label}：</strong>{e(finding[key])}</p>"
            sections += "</article>"
        sections += "<div class='gallery'>"
        for frame in packet["frames"] + packet.get("supplementary_frames", []):
            path = os.path.relpath(folder / frame["file"], batch)
            stamp = f"影片{frame['video_seconds']:.2f}秒" if frame.get("video_seconds") is not None else f"{frame.get('phase', '')}，{frame.get('scene_seconds', 0):.2f}秒"
            rows.append(f"- [{frame['id']} {frame['title']}]({path})；{stamp}。")
            if not all_mode:
                sections += f"<figure><figcaption>{e(frame['id']+' '+frame['title'])}</figcaption><img loading='lazy' src='{e(path)}'></figure>"
        if all_mode:
            contact = folder / "contact.jpg"
            if not contact.exists():
                raise ValueError("缺少本段證據總覽：" + str(contact))
            sections += f"<figure class='contact'><figcaption>本段關鍵畫面；原圖與逐圖分數見本段完整報告。</figcaption><img loading='lazy' src='{e(os.path.relpath(contact, batch))}'></figure>"
        if review.get("lesson_scores"):
            rows += ["", "### 八題逐題檢查", "", "| 題目 | 內容清楚度 | 構圖 | 結論 |", "|---|---|---|---|"]
            sections += "<div class='table'><table><tr><th>題目</th><th>內容清楚度</th><th>構圖</th><th>結論</th></tr>"
            for lesson in review["lesson_scores"]:
                values=[lesson["title"],score(lesson["story"]),score(lesson["composition"]),lesson["summary"]]
                rows.append("| " + " | ".join(TOOL.safe_markdown(v) for v in values) + " |")
                sections += "<tr>" + "".join("<td>"+e(v)+"</td>" for v in values) + "</tr>"
            sections += "</table></div>"
        sections += "</div><p><strong>範圍限制：</strong>" + e("；".join(review["limitations"])) + "</p></section>"
        rows += ["", "限制：" + "；".join(review["limitations"]), ""]
    priorities = ["D-F01 托盤承重可讀性", "H-F02 拒絕梗的臉與手", "R-F03 操作階段看清抓住龍泡泡的手；R-F02氣泡位置可順手修"]
    if all_mode:
        priorities = ["先修確定錯誤：T-F01還盤後托舉狀態復發；K-F01第7題正五十與主線105°C不一致。", "第一輪表演：冰箱F01/F02/F03、D-F01端盤承重、H-F02拒絕梗；先共用眼神與道具接觸的驗收標準。", "同時做小修：R-F02移開比讚氣泡、C-F01避開洛西臉前窗框；保留已漂亮的照片、街景與充能插入鏡。", "下一輪：B-F01 BOOK辨識、W-F01平板取景、G-F01/G-F02演唱姿態與應援取景。", "保險與學堂大型場景仍按先前安排暫緩；K-F02先規劃板書與講師取景的小範圍改善。"]
    rows += ["", "## 建議修正順序", "", *priorities, "", "本輪僅新增取證與評分工具／資料；遊戲角色、模型、劇情、玩法與部署未修改。"]
    lead = ""
    if all_mode:
        quick = ["已確認的錯誤：還盤後紫色生物又抬手；小學堂第7題仍寫正五十。", "最弱的表演：冰箱心理反差、端盤承重、拒絕梗的臉與手、歌唱姿態。", "值得保留：雨夜街屋與倒影、清晰人物照片、服飾／鞋的近景、充能綠光及現有保險室美術。"]
        rows[4:4] = ["## 先看結論", "", *["- " + p for p in quick], ""]
        lead = "<h2>先看結論</h2>" + "".join("<p>"+e(p)+"</p>" for p in quick)
    css = "body{font:16px/1.7 system-ui;background:#102724;color:#ede5cb;max-width:1100px;margin:auto;padding:20px}a{color:#e4c578}h2{margin-top:36px}.table{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}td,th{text-align:left;border-bottom:1px solid #617367;padding:10px;min-width:65px}td:first-child{min-width:150px}td:last-child{min-width:170px}article{border:1px solid #617367;border-radius:10px;padding:16px;margin:16px 0}.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:12px}figure{margin:0}img{width:100%;height:auto}p{overflow-wrap:anywhere}@media print{body{background:white;color:#172d28;font-size:10px;padding:0}a{color:#172d28}h2,h3{break-after:avoid}article{break-inside:avoid;padding:8px;margin:8px 0}.table{overflow:visible}table{font-size:9px}td,th{padding:4px;min-width:0}td:first-child,td:last-child{min-width:0}.gallery{grid-template-columns:repeat(3,1fr)}figure{break-inside:avoid}img{max-height:105mm;object-fit:contain}section{break-before:page}}"
    if all_mode:
        css += ".gallery{display:block}.contact{max-width:900px;margin:auto}@media print{.contact img{max-height:165mm;object-fit:contain}.contact{break-inside:avoid}}"
    doc = "<!doctype html><html lang='zh-Hant'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>莊的晚餐｜" + report_title + "</title><style>" + css + "</style><h1>莊的晚餐｜" + report_title + "</h1><p>" + e(overview) + "</p>" + lead + "<p>分數為本對話Codex判斷，不是獨立外部評審或玩家統計。1＝意圖難懂；3＝能懂但支援不足；5＝清楚、有個性、有吸引力。—＝不適用或證據不足。分段初評不是逐圖平均。</p><p>手機上的表格可左右滑動；PDF保留完整欄位。</p><div class='table'><table><tr><th>段落</th><th>敘事</th><th>表演</th><th>構圖</th><th>優先改法</th></tr>" + summary_html + "</table></div><h2>全遊戲覆蓋進度</h2><div class='table'><table><tr><th>段落</th><th>狀態</th></tr>" + catalog + "</table></div>" + sections + "<h2>建議先改</h2>" + "".join("<p>" + e(p) + "</p>" for p in priorities) + "<p>遊戲本體未修改；iPhone Safari、完整遊玩、聲音、連續動畫與實機FPS尚未驗證。</p></html>"
    (batch / "report.html").write_text(doc, encoding="utf-8")
    (batch / "report.md").write_text("\n".join(rows) + "\n", encoding="utf-8")
    TOOL.write(batch / "report-summary.json", {"reviewed_scene_count": len(scenes), "same_source_covered": sorted(previous), "source": scenes[0][1]["source"], "images": image_count, "findings": finding_count, "priorities": priorities})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--batch", required=True)
    parser.add_argument("--root", default="artifacts/visual-review")
    parser.add_argument("--all", action="store_true", help="Require and report all 17 catalog sections.")
    main(parser.parse_args())
