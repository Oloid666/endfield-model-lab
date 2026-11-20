# 自然持板與手部修正（2026-11-20）

受評程式：`73ab9ee0e61c47df43d497feda58ef1019823f74`。比較基準：`18e1671fb839073a4ed467c96de2518426bd3d10`。交付的下一個文件 commit 包含本資料夾，不追逐自指 SHA。

沿用 `ui-preview` 預覽發布：https://ui-preview.endfield-model-lab.pages.dev 。部署結果以交付 commit 的 Cloudflare Pages check 為準。本地瀏覽器不能直接存取 pages.dev；本地取證不冒充遠端或 iPhone 實測。

## 本輪問題與結果

使用者指出兩張截圖中的手不像自然人手。上輪只驗證板面可見／手掌靠近，漏掉了真實腕角與手形；本輪將其列為實際缺陷，沒有因舊檢查通過而忽略。

- **腕與肘**：舊普通持板約91–95°反折，反應段最高約106°，轉題時肘幾乎打直。現在先解肘位置，再以前臂投影建立持板掌向，退手同步放鬆掌向；30／60 Hz所有受測cue最大腕角約14.01°、肘65.69–108.33°。數值是本專案動作守門，非醫學極限。
- **真正托握**：兩手各用原四指三節骨架，指間彎曲略有差別，拇指包側框；保留原手套、手部外觀和模型比例。實際蒙皮的持板指腹／拇指最近距離0–約2.33mm，受測全段最深淺交疊約1.304mm。
- **連續動作**：修正退手目的地切換造成的突跳；freeHand使用較柔和的時間平滑，轉題與重新握板不再瞬間換目標。零delta暫停、離開持板和重開始都會恢復原指節，不累加扭轉。
- **同時調板與取景**：平板改為較自然的斜托，反應時僅微抬，不遮住眼睛與嘴部；保留肩外過肩鏡，普通7姿態315條中央視線全清楚，中央板內蒙皮採樣點為0。三種aspect四角通過安全範圍。
- **衣袖及胸前飾帶**：使用既有鬆垂關節輕微下垂，保留原服裝；不再擠入板面，也沒有新增布料模擬。避免每次小幅手部求解都重新遍歷整個角色。
- **莊握紅柄一併精修**：食指到小指的既有目標微調，完整L柄橫柱＋直柱、30／60 Hz逐幀附著與釋放的最大淺交疊由約2.43mm降至**1.7966mm**；新增更嚴格的全段<2mm守門。仍非絕對零穿模。

沒有替換GLB、改角色、劇情、機制、Three.js版本或正式部署設定；沒有新增套件、資產、燈光、陰影或後處理。共享 `arm-support.js` 未改，原莊端盤／BOOK／發射邏輯保留。

## 檔案

| 檔案 | 用途 |
| --- | --- |
| `src/xaihi.js` | 持板位置、前臂與掌向求解、肩外取景、平滑退手、reset整合。 |
| `src/tablet-hand-pose.js`（新增） | 左右手獨立指節彎曲、拇指包邊、既有衣袖／飾帶垂落；重用暫存向量。 |
| `src/handle-grip.js` | 莊四指的微量接觸校準。 |
| `scripts/natural-hands-check.mjs`（新增） | 真GLB解剖角度、真蒙皮接觸、骨長、暫停、退出及reset。 |
| `scripts/natural-hands-browser.py`（新增） | 真故事操作、反應、三版型、退手與反打切鏡取證。 |
| `scripts/acting-check.mjs` | 掌點改為本輪實際接觸位置。 |
| `scripts/tablet-geometry-check.mjs` | 仍保留315視線與板面／四角檢查，深交疊門檻由4收緊為3mm。 |
| `scripts/handle-grip-check.mjs` | 新增完整抓握／發射全段最大深度累計與嚴格<2mm斷言。 |
| `docs/RAIN-BACKLOG.md`、本資料夾 | 狀態、15張精選證據與獨立複核。 |

## 真實畫面索引

全部為遊戲實際 Chromium／SwiftShader 畫面，DPR1、low。沒有重繪或以AI圖片當驗收。

| 編號 | 圖片與重點 |
| --- | --- |
| 01 | [持板前](01-hold-before.png)／[持板後](01-hold-after.png)：手形與前臂，不再靠攤平手掌定位。 |
| 02 | [過肩搜尋前](02-search-before.png)／[修改後](02-search-after.png)：保留過肩與可讀板面。 |
| 03 | [冰箱設定前](03-temperature-before.png)／[修改後](03-temperature-after.png)。 |
| 04 | [退手前](04-release-before.png)／[修改後](04-release-after.png)。 |
| 05 | [轉題前](05-redirect-before.png)／[修改後](05-redirect-after.png)。 |
| 06–07 | [844×390過肩](06-tablet-landscape-after.png)／[1440×900持板](07-hold-desktop-after.png)。 |
| 08 | [退手0.75秒](08-release-middle-after.png)，來自實際連續JPEG轉PNG，未增強。 |
| 09 | [回握期間的反打切鏡](09-reverse-cut-context.png)：此時遊戲拍龍泡泡，沒有拍到塞西的手；不能當手部回握視覺證據。 |
| 10 | [莊實際握紅柄](10-handle-after.png)：微調後仍是原握柄姿態。 |

來源對應見 [capture-sources.json](capture-sources.json)。原始MP4／JPEG／中間報告留在忽略的 `artifacts/tablet-grip/`，精選PNG已進Git，不進public或網站包。沒有可公開的真機影片連結。

## 重現與檢查

保留 `window.__rainy711.debugJump`、`restoreChapter`、`tick` 和正面711招牌七次入口，名稱／參數未改。

1. 載入詳情→直接進入，等角色完成；點711招牌七次。
2. `debugJump('fridge')`，走完搜尋／工具／後台／控制器／冰箱設定，觀察普通持板。
3. 調低溫度後，依原劇情看「有降」→失誤→心虛退手→龍泡泡唱歌→轉題。
4. `debugJump('chapter:last')`，原流程到最後一發，查看莊握紅柄、放手發射和還盤。

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
node scripts/natural-hands-check.mjs
node scripts/tablet-geometry-check.mjs
node scripts/handle-grip-check.mjs
python3 scripts/natural-hands-browser.py --url http://127.0.0.1:4173 --out artifacts/tablet-grip/recheck --layouts --film
```

瀏覽器腳本需既有Python Playwright、`/usr/bin/chromium`；`--film`需ffmpeg。固定30Hz更新／8fps取證是重現設定，不是量到的手機FPS。

## 實際驗證與限制

- Vite build及 `git diff --check` 通過；53支 `scripts/*check.mjs` 全過，[逐支結果](test-summary.json)。本專案是JS，沒有另定義TS typecheck。
- 手部正式檢查**3,526項**：30／60 Hz全cue及其過渡、逐幀手部蒙皮、拇指與四指接觸、骨長不變、暫停、離開持板、reset通過；[完整數據](hand-anatomy.json)。
- 七姿態315中央視線清楚，普通板面中央採樣skin點0，三aspect四角通過，[板面數據](tablet-geometry.txt)。這不能取代手部形態判斷，所以另做真渲染與獨立複核。
- 完整L柄抓握／鬆手／發射30／60 Hz、reset及對位API通過，最深1.7966mm，[握柄數據](zhuang-grip.txt)。既有開場交餐／端盤等回歸也包含於53支檢查。
- 真瀏覽器本輪手部流程22張、莊補驗5張、pageerror為空；三版型無橫向溢出。退手12幀可見手部；另7幀回握期間鏡頭拍龍泡泡，**回握只有幾何驗證，沒有手部連續視覺驗收**。
- 獨立唯讀reviewer親跑兩支手部檢查，並看前後／三版型與退手連續圖、握柄／釋放，[結論PASS](independent-review.md)。不是Claude外部審核，也不是實作者自測冒充獨立通過。
- 仍保留少量淺交疊；原寬袖及橫屏HTML面板會遮到局部手，操作與板面仍可用。板面斜視文字、嘴周深色、Explosion標籤偶爾碰髮際仍是後續美術微調，本輪沒有稱它們已根治。
- **iPhone/Safari真機、觸控、背景切出返回、音效、硬體FPS與發熱尚未在本輪實測。** 沒有宣稱手機效能改善。保險／學堂與Mac mini Dream Loop仍按原待改計畫。
