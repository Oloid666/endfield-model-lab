# 開場交餐與「謝謝龍董」鏡頭

## 版本、範圍與發布

- 受評程式：`7cdb7d5b8ebf012ae564fd960957bb2337259d22`；比較版本：`75bebd5a32c0860f929ecb3c5f62f562481d9171`。
- 分支：`ui-preview`。包含本資料夾的下一個提交只補文件／證據，遊戲程式與受評版本一致，沒有改寫歷史。
- 取證於提交前工作樹完成；當時遊戲程式及取證腳本與上述受評commit一致。修改前用獨立的75bebd5建置目錄及4221伺服器，不是把新程式倒回某個劇情節點充當舊版。
- Cloudflare Pages對受評commit回報`completed/success`；可玩固定版本：<https://f83bfa7e.endfield-model-lab.pages.dev>。沿用既有發布流程，沒有更新main或部署設定。
- 線上部署成功依GitHub的Cloudflare Pages check-run確認。本工作環境直接連pages.dev被網路代理拒絕（CONNECT403），故瀏覽器驗收使用相同建置的本機預覽，沒有宣稱線上iPhone已走過。
- 本輪只改開場「龍泡泡→莊」交餐、導播回話及必要銜接；不是先前D-F01「莊→龍泡泡」或紫色生物還盤整項結案。模型、晚餐分支、故事及發射機制保留。

## 問題對照與實際改動

| 編號 | 原問題／本輪處理 | 證據 |
|---|---|---|
| O-H01（本輪新增） | 開場手掌對齊會拉動整個龍泡泡，造成盤與人重疊；改由同一餐盤路徑驅動雙方手部，從店內直接端同一盤出來，移除紙袋換盤 | 01–04 |
| O-H02（本輪新增） | 建立3.2秒交接：0–0.5停穩；0.5–1.5送餐／伸手；1.5–2.1共同承托，1.9秒改持有人；2.1–2.8手先下降、後退、收回；2.8–3.2回穩。完成才出「買完了，來吃吧。」 | 02–04、連續時間表 |
| C-DR01（本輪新增） | 「謝謝龍董」原本拍背面；改0–0.6交代小攝影機，0.6–4.8拍龍泡泡正面，4.8–5.5拍攝影機紅燈，5.5–7.5拍滿意點頭。回話正確標為「導播」 | 05–07、10–11 |
| C-DR02（獨立複核發現） | 新停留鏡頭回舊飛行路徑曾跳6.42公尺；補1.5秒位置、朝向與持盤高度銜接，實際取證交界龍移動2.09cm、盤1.93cm | 12–14、delivery-timeline.json |

雙手仍端晚餐，這段以視線、表情與點頭演出，不為指攝影機而鬆開餐盤。攝影機是10個Mesh的程序道具，沒有下載模型、即時新光源、陰影燈、第二個renderer或相機權限請求；僅在導播段出現，重播／dispose會清除。減少動態偏好下關閉道具浮動與該交餐鏡頭推近。

## 修改檔案

- 共用節拍與接觸：`src/opening-handoff.js`（新增）、`src/shopping-journey.js`、`src/mission-state.js`、`src/performance.js`。
- 鏡頭與表演：`src/director-camera.js`（新增）、`src/mission-director.js`、`src/story-shots.js`、`src/companion.js`、`src/mission-dialogue.js`、`src/world.js`。
- 取證／檢查：新增`scripts/opening-handoff-check.mjs`、`scripts/opening-director-browser.py`；更新`scripts/director-check.mjs`、`scripts/mission-check.mjs`、`scripts/street-stage-check.mjs`。舊流程檢查的等待長度配合新交接及導播時長，沒有放寬原有完成條件。
- 沒有更動GLB、共享IK、Three.js版本、第三方依賴或正式部署設定。debug狀態新增`cinematic.filmCamera`，既有入口名稱／參數不變。

## 截圖索引

以下前後幀取自**連續實際遊戲更新**，不是單獨擺拍。01–07為390×844、DPR1、低畫質、Chromium SwiftShader；來源為quality82 JPEG原幀轉PNG，沒有修圖、裁切、補細節。08–14為原生PNG。`evidence.json`記錄來源、尺寸、版本與SHA256。

| 編號／節點 | 修改前 | 修改後 | 時間／條件 |
|---|---|---|---|
| 01 送餐開始 | [前](01-opening-before.png) | [後](01-opening-after.png) | 交接0.367s；原紙袋與重疊狀態對比 |
| 02 承托 | [前](02-support-before.png) | [後](02-support-after.png) | 前0.783s、後1.700s；對應接觸節拍，非同秒 |
| 03 放手 | [前](03-release-before.png) | [後](03-release-after.png) | 前1.117s、後2.617s；對應收手節拍 |
| 04 完成交餐 | [前](04-settled-before.png) | [後](04-settled-after.png) | photo-pose前0.611s、後0.667s |
| 05 導播提醒 | [前](05-director-before.png) | [後](05-director-after.png) | director-reminder均1.300s |
| 06 收到感謝 | [前](06-thanks-before.png) | [後](06-thanks-after.png) | 前3.133s、後6.883s；新版點頭後重新睜眼 |
| 07 紅燈鏡頭 | — | [後](07-camera-after.png) | 新增5.133s鏡頭；字幕仍打字中，完整文字見06 |
| 08 交餐橫屏 | — | [後](08-opening-landscape-after.png) | 844×390 |
| 09 交餐桌機 | — | [後](09-opening-desktop-after.png) | 1440×900；保留既有36%側欄 |
| 10 正面橫屏 | — | [後](10-director-landscape-after.png) | 844×390 |
| 11 正面桌機 | — | [後](11-director-desktop-after.png) | 1440×900 |
| 12 下一鞋鏡 | — | [後](12-shoe-portrait-after.png) | 390×844，鞋鏡進場0.04s |
| 13 下一鞋鏡 | — | [後](13-shoe-landscape-after.png) | 844×390，同節點 |
| 14 下一鞋鏡 | — | [後](14-shoe-desktop-after.png) | 1440×900，同節點 |

## 獨立重現

需要Node.js22+、Python3、Playwright、Chromium及ffmpeg；腳本目前使用`/usr/bin/chromium`。先`npm ci`、`npm run build`，再`npm run preview -- --port 4222`。

```sh
node scripts/opening-handoff-check.mjs
node scripts/director-check.mjs
python3 scripts/opening-director-browser.py --url http://127.0.0.1:4222/ --out artifacts/visual-review/opening-director/recheck --after --layouts
```

瀏覽器參數為`--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --disable-dev-shm-usage`，viewport390×844、DPR1。展開載入詳情並按直接進入，等待`window.__rainy711.actorsLoaded`與載入層隱藏；`pauseForCapture()`停止自動時鐘，選低畫質，`missionStart()`。腳本以30Hz更新實際角色／場景、12fps保存所有呈現幀。

- 開場從正常主線經purchase→walk-out到photo-pose；先擷取交接前超過1秒，再錄完整交接與完成後超過1秒。
- 導播重現：`restoreChapter('terminal-deploy')`，經BOOK與登入；`keyChunk`依序輸入`endfield`、`_`、`power`、`520`、`1314`，等captchaReady後`missionVerify()`，到lever後`missionLever(1)`，從ascent4.8s錄至shoe-view0.8s。三版型另驗證7.49s→7.54s邊界。
- `tick(time,delta,render)`、`debugJump`、`restoreChapter`與正面711招牌七次解鎖均保留。本輪沒有修改解鎖流程；取證採上述明確入口，沒有重新實測每個debugJump ID。
- 三版型各重跑交接、暫停20秒／恢復、持有人切換、導播正面、攝影機紅燈、點頭、鞋鏡邊界與重播清理；回放來源經實際terminal／驗證／拉桿流程。
- `*check.mjs`部分舊檢查會改寫追蹤中的artifacts報告，請另行查看差異；本輪自測後已恢復這些產物，沒有混入提交。

## 測試與驗收邊界

- `npm run build`：通過；仍有既有bundle體積提示，不因此宣稱載入／FPS改善。
- 全部48支`scripts/*check.mjs`通過；摘要見[checks.json](checks.json)。本輪新增真GLB交接1,087項通過，Director共485項通過，既有托盤握持54／54通過。
- A／B／C三種晚餐在30／60Hz實際骨架與蒙皮頂點檢查：共托接觸可達；最大餐盤步長30Hz為2.16cm以下；手與盤淺交疊最高2.7mm，未見大幅穿盤，**不是所有角度零穿透保證**。幾何檢查沒有材質貼圖；瀏覽器用完整材質另驗可見性。
- 修改前後連續取證各2段；新版開場66幀／5.5s、導播103幀／8.58s；舊版45／73幀。這是固定步進遊戲錄製，**不是即時硬體幀率影片，也沒有音軌**。前後時長不同，對照按故事節拍而非相同時間碼。
- 修改前後`result.json`均passed、pageerror為空；新版另跑390×844／844×390／1440×900。結果及精簡逐幀狀態在本資料夾，可對照持有人／托盤／角色位置。
- 依game-cinematic-camera Skill，由另一個唯讀agent獨立跑1,087／485／54項，目視連續抽幀、三版型鞋鏡入口、紅燈、閉眼點頭後睜眼，結論**PASS**。它先提出6.42m瞬移，修正後獨立量得2.09cm／1.93cm並複核通過。此為獨立agent審查，**不是Claude或玩家盲測通過**。
- iPhone已實測：無。iPhone Safari長按／切出返回／真實FPS、記憶體、發熱、聲音與觸控手感仍未實測，不能由本輪Chromium取代。
- 真機影片／外部影片連結：未提供。完整固定步進MP4與全部中間影格留在忽略目錄`artifacts/visual-review/opening-director/{before-complete,delivery}/`，不隨公開Git提供，也不放public增加遊戲下載。公開Git提供精選原幀、時間表與可重錄腳本，沒有捏造可下載影片連結。

## 保留限制與下一步

- Desktop沿用既有64%場景＋36%側欄，交接無對話時側欄空白；不是renderer故障，列為版面minor，沒有在本輪擴改UI。
- 導播段仍是雨夜既有照明，沒有新增臉部補光；想更明亮可另評估低成本材質／既有燈光，不能靠加光掩蓋接觸問題。
- 其他D-F01接觸、BOOK手與書同框、紅柄髮絲、塞西嘴影／持板、演唱連續動作、二樓大幅美術與SEO工程待辦仍保留，沒有以本輪通過一次結案。
- 下一步先請iPhone從開場看完送餐，再從七次招牌解鎖進導播節點，確認無過場卡住／背景返回問題；調整旋鈕集中於opening-handoff時長、送盤位移、story-shots鏡頭距離與FOV。
