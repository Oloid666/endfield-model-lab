# 13 項演出與介面改善交付

## 結果與版本

本輪已對 13 項落實修改，**沒有把 13 項全部標為驗收結案**。單手拇指、交接路徑、拒絕構圖、應援取景、資訊介面與照片切換有可驗證改善；BOOK 手勢同框、抓握的髮絲遮擋、塞西嘴部暗影及連續演出驗收仍保留。

- 比較版本：`c178f0e66f1712f2374bbbae93e84b6b5f09d47d`。
- 第一批：`bb41237`，托盤、表演與鏡頭；第二批：`fdea28d`，UI、資訊及美術；審核後補修：`682dec4455e76f82bde6c802d1cf0d87296c9bb0`，最後準備鏡頭露臉。
- 本資料夾由後續文件提交補交；受評遊戲程式以 `682dec4` 為準。
- 不修改 GLB、角色姓名、故事、玩法、Three.js 版本、依賴或部署設定。`debugJump`、`restoreChapter`、`tick` 及招牌七次解鎖均保留。

## 13 項實際修改與狀態

| 原項目／編號 | 改動與證據 | 狀態及限制 |
|---|---|---|
| 1 D-F01-R2 單手端盤 | 拇指有獨立盤底姿態，加入完整手部／A、B、C 餐盤及看照片姿態檢查；[新側面](01-single-hand-after.png)，[前版側面](../0974e9e/02-photo-talk-single-hand-after.png) | 真實 GLB 單手 A 拇指由最深 19.9 mm 改為 0；單雙手切換的自然度仍須連續影片，不宣稱所有中間幀零穿透 |
| 2 D-F01-R3 交盤／取回 | 改用掌面路徑，先從盤外靠近，再托住；轉盤先完成、手再接近，最後才轉掌。修正轉掌後未重算腕偏移的問題；[左手](02-reclaim-left-after.png)、[接穩](03-reclaim-player-after.png) | 取回最大手腕步長 35.7→24.4 mm／幀；放手 37.4→32.4。0.4／0.6／0.8 秒取樣無手穿盤；1.10 秒左手仍有 8 個頂點約 1.1 mm 淺交疊，不稱整段零穿透 |
| 3 D-F01-R4 端盤鏡頭 | 購餐特寫降低觀看高度；交盤／取回改由餐盤實際位置取側前鏡，避免龍泡泡背部擋接觸 | 接觸較容易看清；完整動態、所有任意視角仍未驗 |
| 4 F01／F06／F07 塞西持板與心理表演 | 平板與雙手使用同一板框推導握點及掌向；轉移話題時板面跟著身體轉，既有眼神／頭肩 cue 保留。過肩讀板減少斜視角 | 持板方向有改善；骨架沒有表情 Morph。原模型臉材質沒有 AO／normal 貼圖，檢查了原始膚色貼圖，嘴影來源尚未完整隔離，沒有漂白或改原貼圖。**嘴影、手指接觸及部分斜板取景留待改** |
| 5 H-F02 拒絕梗 | 獨立避視、單側嘴角、收緊臉與抬掌構圖；[原句與表情](04-refusal-after.png) | 獨立審核確認臉、眼、手及原句清楚；沒有把嘴影稱作已修復 |
| 6 R-F03 最後抓柄 | 先修手與紅柄取景，審核後再改側前準備鏡，讓臉可見；[最後版本](10-aim-face-after.png) | 三種版型臉部構圖改善；手指和實際握點仍被部分髮絲遮住，**抓握辨識維持 partial**。發射條與既有抖動保留 |
| 7 G-F01／G-F02 演唱應援 | 重用原六段循環，句段選閉眼／挑眉／正常表情；調整相機前景應援物件的位置，保留冰箱唱歌無手；[直屏](09-song-cheers-after.png)、[橫屏](11-song-landscape-after.png) | 靜態可見完整棒與手部輪廓；循環節奏、停頓、聲音待連續影片 |
| 8 F04 HUD | 標題局部暗底、CAM／REC／時間碼深底與 12px 功能文字，不提高場景曝光 | 三種版型已取證；iPhone 真機與 200% 文字未測 |
| 9 B-F01／W-F01 BOOK／平板 | 降低發光，分頁改奶油色，厚書脊、跟著封面動的頁緣及 BOOK 標示；[展開頁面](08-book-pages-after.png) | 書頁層次改善；**仍偏像控制桌，缺少手勢與書同框**，維持 partial |
| 10 N-F01 妮姬螢幕 | 直屏完整置中，術語放大；打碼請求／答應／黑條後共用鏡頭。[主畫面](05-nikke-portrait-after.png)、[答應前](06-eye-bar-before.png)、[答應後](07-eye-bar-after.png) | 三版型保留 NIKKE、TIANSHI03、外框與 Credential theft／CDN／C2，獨立審核確認早期裁切回歸已修 |
| 11 H-F01／R-F01 紫色生物 | 降低清漆亮斑，加非對稱輪廓與較慢局部形變、承重壓縮；[接盤場景](03-reclaim-player-after.png) | 程式與實際場景已驗；出生／形變的完整動態仍未作影片驗收。不新增 👀 |
| 12 D-F02 晚餐配菜 | 沿用現有網格，花椰菜小幅尺寸、色差及位置變化；胡蘿蔔尺寸／角度錯開，維持主菜、飯粒、金邊及唯一托盤 | 沒有新增外部資產；這是局部精修，不宣稱整份晚餐美術已定稿 |
| 13 P-F01 照片按鈕 | 全景「放大看有沒有眨眼」，近照「回到全景」，切換重設縮放 | 實際快門流程測過無臉禁用、全景↔近照、背景返回、傳送、重拍及重新開始 |

## 修改檔案

- 端盤／演技：`src/tray-grip.js`、`src/performance.js`、`src/xaihi.js`、`src/companion.js`。
- 鏡頭／資訊／UI：`src/story-shots.js`、`src/mission-director.js`、`src/photo-viewer.js`、`src/ui-refinement.css`、`src/vcr-effects.js`。
- 程序美術／應援：`src/connection-stage.js`、`src/concert-stage.js`、`src/dinner-art.js`、`src/meal-remnant.js`。
- 檢查／取證：`scripts/tray-grip-check.mjs`、`scripts/cinematic-track-check.mjs`、`scripts/dinner-grip-capture.py`、`scripts/photo-recovery-browser-check.py`、`scripts/review-synthesis-browser.py`、`scripts/polish-detail-browser.py`。
- 文件：本資料夾、評審索引與待改清單。

最後準備鏡的 envelope 檢查由遠方伺服器改成臉＋握點，符合該鏡新的目的；保留發射軸線同側與其餘飛行／命中檢查，沒有刪掉檢查來掩蓋跨軸。

## 驗證、取證條件及獨立審核

- 最終全部 45 支 `scripts/*check.mjs` 通過；其中真實 GLB 接觸／插值新增至 **54／54**，相機軌跡 **734 項**通過。完整列表見 [validation.json](validation.json)、[接觸數據](tray-contact.json)。
- `npm run build` 通過；既有大型 chunk 提醒保留，沒有增加套件。
- 瀏覽器完成：冰箱至還盤／返微波爐／重開 28 張節點；BOOK、妮姬及黑條 10 張節點；最後準備、演唱及重開；照片完整真實快門及背景恢復。這些流程的 `pageerror` 為空，沒有新增玩家回饋 POST。
- [最終交接數據](transfer-browser.json)、[BOOK／妮姬](info-browser.json)、[最後準備鏡](aim-browser.json)保存時間、相機與狀態；[evidence.json](evidence.json)保存圖檔來源、像素尺寸及 SHA-256。
- Chromium／SwiftShader，390×844、844×390、1440×900；原生 PNG，沒有裁切、修臉或合成。直屏／三版型腳本 DPR1.5，Three.js balanced；桌面 grip 早期取證 DPR1。診斷手部近景由腳本隱藏 UI、使用專用機位，不冒稱是玩家鏡頭。
- 01 單手圖取自較早工作樹，但該單手姿態程式與最終一致；交接終版只使用 `grip-final-05`。資訊終版只使用 `info-final-02`；最後準備終版只使用 `aim-final`。失敗、中間版不當作最終通過證據。
- 瀏覽器 aggregate 深度採距盤底高度，Node 採最近盤面距離，定義不同，不直接互相比大小。逐幀位移是固定 1/60 秒時鐘，不是實機 FPS。
- 初輪工具有提示框等待、漏過出生首句及 Chromium 截圖逾時；修正取證器或重跑聚焦流程後完成，重試歷程見 validation，不抹掉失敗紀錄。

**獨立審核：** 由另一個 Codex agent `polish_readonly_review` 唯讀審查 diff、截圖及數據，沒有改檔或部署。它抓到妮姬裁切、取回左手反折、最後準備鏡背臉，主控修正後再覆驗；最終判定「可增量整合，未見新 blocker」，並保留上表 partial。這不是 Claude 或真人評審。Node／Build 結果由實作者執行，與審核判斷分開記錄。

**未驗證：** iPhone Safari 真機、真實 App 切出返回、手機幀率／發熱、200%文字、完整連續有聲影片及所有故事分支。合成 visibility／BFCache 測試不替代真機。沒有影片外部連結。

## 重現

```bash
npm ci
npm run build
node scripts/tray-grip-check.mjs
node scripts/cinematic-track-check.mjs
npm run dev -- --host 127.0.0.1 --port 4215 --strictPort
```

另一終端（需 Python Playwright 與 Chromium）：

```bash
python scripts/polish-detail-browser.py --url http://127.0.0.1:4215/ --out /tmp/polish-detail
PREVIEW_URL=http://127.0.0.1:4215/ python scripts/photo-recovery-browser-check.py
GRIP_URL=http://127.0.0.1:4215/ GRIP_CHROME=/usr/bin/chromium GRIP_OUT=/tmp/polish-grip python scripts/dinner-grip-capture.py
```

入口仍為招牌七次解鎖後的 `chapter:terminal-deploy`、`fridge`、`nikke`、`birth`、`chapter:last`。`pauseForCapture` 停 RAF 後由 `tick` 推進；讀取第一句出生台詞時須在 tick 後先檢查節點，再按下一句。

## 發布與後續

發布沿用 `ui-preview`／Cloudflare Pages，保留三筆程式提交與後續證據提交，不更動 main 或 force push。受評程式的 Cloudflare Pages check 已確認部署成功：[固定版本](https://a5a02807.endfield-model-lab.pages.dev/)、[分支入口](https://ui-preview.endfield-model-lab.pages.dev/)、[對應 commit checks](https://github.com/Oloid666/endfield-model-lab/commit/682dec4455e76f82bde6c802d1cf0d87296c9bb0/checks)。此環境直接連 pages.dev 受代理限制，線上狀態依 GitHub Cloudflare check 核對，視覺是在本機相同程式驗證。

下一輪保留：BOOK 手勢同框、塞西嘴影及精準指腹接觸、抓柄髮絲遮擋、單雙手切換與完整演唱影片；保險／教室大型改裝及先前 12 項工程建議不混入本輪。
