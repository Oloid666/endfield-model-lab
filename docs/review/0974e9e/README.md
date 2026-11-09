# D-F01 Codex 整合審查：採用改善，整項尚未結案

## 決定與版本

**整合 Claude 的雙手承托與交盤改善，並先修正 Codex 抓到的拇指插值錯誤。D-F01 保留未完成狀態。** 單手端盤的拇指、放手／取回路徑及玩家鏡頭遮手，仍須後續處理。不能把 45 支檢查通過解讀為所有角度都沒有穿模。

- 起始／比較版本：`ae25ab2e70b0268204de7537a4579103fc2e584c`。
- Claude 受評程式：`d5721c1c8694e96ad128dfb1c85f7c2e96823bd4`；交付：`8612f88c4913bdf1dd2aa053095834e8651a66ff`。
- 本輪受評程式：`0974e9e50eaebbb9a0dc6ebc463a488747558375`。保留 Claude 三個原提交，再追加 Codex 修正，沒有改寫歷史。
- 本資料夾及待改清單由後續文件提交補交；遊戲程式與上述受評版本一致。
- [Claude 原始交付、10 組前後圖及量測](../d5721c1/README.md)完整保留，沒有把原自測敘述改成「外部評審通過」。Codex 本輪另讀差異、看圖、重跑測試和瀏覽器流程；修正部分仍是 Codex 自驗，未經另一位評審複核。

## 核對與修正

| 編號 | 核對結果／處理 | 狀態 |
|---|---|---|
| D-F01 雙手接觸 | 看完 01–10 全部前後圖，重點核對 02／04／06／09／10。兩短邊的指腹承托、拇指端面支撐比原版清楚。真實 GLB 三種晚餐站姿的掌／四指最深穿盤約左 2.1 mm、右 1.7 mm，仍非零穿透 | 採用 |
| D-F01-R1 拇指插值 | `turn.copy(identity).slerp(turn, weight)` 把目標旋轉先清掉；權重小於 1 時完全不彎。獨立 90° 轉向測試原本在 25／50／75% 都得到 0°。改成朝 identity 反向插值，得到 22.5／45／67.5° | 已修正 |
| D-F01-R1 真實骨架回歸 | 用隔離 Node loader 載入原提交的 `tray-grip.js`，新增兩條回歸皆失敗；修正後皆通過。交盤放手期間，六個拇指關節最大單幀旋轉由 **48.27°（0.717 秒）降至 7.37°（0.783 秒）**，每步 1/60 秒 | 已量測；不等同演出節奏通過 |
| 交盤 0.70 秒所有權切換 | Node 固定站位測試的接觸幀最大位移 0.2 mm；瀏覽器的購餐、拍照、交盤、取回流程皆走通，所有權順序未改 | 採用 |
| 舊代理條件修改 | 指骨位於盤底下 4–18 mm，有蒙皮厚度依據；另有真實蒙皮頂點檢查，故不只靠放寬骨頭距離過關。但單手拇指、交接全程並未被原條件完整涵蓋 | 可接受，限制列明 |

### 仍開放的問題與下一步

1. **D-F01-R2 單手端盤拇指仍埋盤。** `photo-talk` 遞手機時只用左手托中間，`wrapThumb` 明確略過單手模式。真實 GLB 的單手 handover 姿勢量到左拇指 239 個頂點在盤內、最近盤面深度最大 19.9 mm；基準版為 297 個／20.0 mm。這是仍未解決的舊問題，不是本輪已修好。原 README「單手最深 2.3 mm」只涵蓋掌與四指，不能套用到拇指。下一輪將單手拇指收在盤底外，保留中央承托；補 handover／photoLook 的完整手部測試，不排除拇指來宣稱整隻手通過。見圖 02 與 `validation.json`。
2. **D-F01-R3 放手／取回路徑仍需修。** 瀏覽器固定時鐘量到放手收回手腕約 37.4 mm／幀、取回約 35.7 mm／幀；取回早期的手仍會穿過盤體。下一輪先在 0.4–0.8 秒量掌／指／拇指與盤體，再設計「從盤側靠近→掌面頂住→接重→收回」路徑。不能用已接穩的 2.2 秒圖代替整段驗收。
3. **D-F01-R4 預設鏡頭仍遮手。** 01 玩家上方機位多半看不到盤底；07／08 龍泡泡背部遮住交接。這輪依範圍保留鏡頭，不能宣稱觀眾已清楚讀懂交接。待手部穩定後再排側前中近景，不靠鏡頭藏穿模。
4. **細縫與姿態殘留。** 端面支撐的拇指沒有搭上盤面，部分近景仍有約 0–4 mm 指腹間隙；它是目前模型與厚盤的取捨。完整連續影片、iPhone 手感與演出節奏仍待驗證。

目前整合理由：這些保留項目在基準中已存在；雙手接觸有可見及量測改善，新的插值回歸已排除，且沒有擴大至共享 IK、其他角色或劇情。這是增量採用，並未把 D-F01 全項關閉。

## 修改檔案與範圍

- Claude：`src/tray-grip.js`、`src/performance.js`；`scripts/tray-grip-check.mjs`、`scripts/dinner-grip-capture.py`；兩個代理條件腳本 `actor-check.mjs`／`cinematic-check.mjs`，以及原交付證據。
- Codex 程式：`src/tray-grip.js` 修正四元數插值；`scripts/tray-grip-check.mjs` 加入部分權重／旋轉父節點／末端關節的測試、真實 GLB 放手拇指連續性測試，澄清單手不含拇指、盤位移略過兩個設置幀的檢查名稱。
- Codex 文件：本資料夾、`docs/review/README.md`、`docs/RAIN-BACKLOG.md`，及 `AGENTS.md` 的受指派 Claude 工作分支協作說明。
- 沒有修改共享 `arm-support.js`、塞西 `xaihi.js`、GLB、鏡頭、故事、餐點美術、Three.js 版本、相依套件或部署設定。托盤順序仍為莊→龍泡泡→空中→紫色生物→莊。

## Codex 自行取得的截圖

以下是本輪重跑的**修改後**原生 PNG，直接複製原始截圖，沒有裁切、合成或修圖；不是額外一套前後對照。Claude 修改前後請看原資料夾的 10 組圖。檔案尺寸及 SHA-256 見 [evidence.json](evidence.json)。

| 編號 | 畫面 | 故事節點／時間 | 條件 |
|---|---|---|---|
| 01 | [購餐後左手側後近景](01-bought-left-rear-after.png) | `photo-pose`／`shopping_complete`，0.85 秒 | 390×844，DPR 2，原圖 780×1688；診斷近景隱藏 UI，FOV 35 |
| 02 | [單手端盤仍有拇指缺口](02-photo-talk-single-hand-after.png) | `photo-talk`／`photo_talk_0`，1.2 秒 | 同上，左手側面診斷機位；不是「全部手部已修好」證據 |
| 03 | [換手後玩家畫面](03-handoff-player-after.png) | `meal-handoff`，0.75 秒 | 390×844，DPR 2；原玩家鏡頭及 UI，龍泡泡仍遮住接觸區 |
| 04 | [取回後右手斜前近景](04-after-return-right-front-after.png) | `tour`，1.501 秒 | 390×844，DPR 2；診斷近景，不代表取回全程無穿模 |
| 05 | [桌面拍照對話](05-photo-talk-desktop-after.png) | `photo-talk`，1.2 秒 | 1440×900，DPR 1；原玩家鏡頭及 UI |

Chromium 154／SwiftShader。直屏實際 Three.js 渲染 DPR 1.25、桌面 1，畫質 `balanced`。取證時 `src/tray-grip.js` 有尚未提交的插值修正，其遊戲程式與 `0974e9e` 完全一致；其後只修改測試標籤與文件，沒有更換運鏡。共各走 10 個節點，只有上述 5 張加入 Git，其他原圖留在忽略目錄。

## 實際驗證與界線

| 驗證 | 結果 |
|---|---|
| Claude 原交付 `npm run build` | Codex 環境通過 Vite build |
| Claude 原交付全部 `scripts/*check.mjs` | 45／45 通過；新回歸另外抓到未涵蓋的 R1 |
| 最終程式 Vite build | 通過（2.70 秒）；既有超過 500 kB chunk 提醒仍在，沒有升級依賴 |
| 最終全部 `scripts/*check.mjs` | 45／45 通過，逐支結果列於 [validation.json](validation.json)；兩個檢查名稱澄清後另重跑 tray-grip，邏輯沒變 |
| 最終真實模型接觸／插值檢查 | 41／41 通過，完整範圍見 [tray-grip-after.json](tray-grip-after.json)；單手拇指仍不在「通過」條件內 |
| 瀏覽器重現 | 390×844 與 1440×900，各完成購餐、拍照對話、登入／驗證、交盤、最後砲擊流程至取回／巡場；`pageerror` 為空 |
| iPhone 真機已測項目 | 無 |
| iPhone 真機未測項目 | Safari 真實渲染、觸控、切出返回、發熱、幀率及聲音 |
| 連續影片 | 未提供影片連結；本輪用 1/60 秒固定時鐘位移／關節角度取樣及節點截圖，不以此宣稱電影節奏、聲音同步或手機 FPS 已通過 |

位移數據注意：Node 固定站位的盤位移檢查略過兩個初始設置幀；瀏覽器在開頭 0.033 秒仍量到約 31.1 mm 的盤位移，不能把 Node 的 ≤10 mm 條件說成整段實際劇情上限。瀏覽器 aggregate 穿盤欄位量的是距盤底高度，Node 取最近盤面深度，兩者定義不同，不互相比數字。

測試產生的追蹤中 `artifacts/*.json` 已還原，沒有把整套歷史測試輸出混進本輪。新的 tray-grip 輸出精選到本資料夾。

## 重現步驟

```bash
npm ci
npm run build
node scripts/tray-grip-check.mjs
npm run dev -- --host 127.0.0.1 --port 4215 --strictPort
```

另個終端執行（需 Python Playwright、Chromium）：

```bash
GRIP_URL=http://127.0.0.1:4215/ GRIP_CHROME=/usr/bin/chromium GRIP_VIEWPORTS=390x844@2,1440x900@1 GRIP_OUT=/tmp/dinner-grip-review GRIP_TAG=controller python scripts/dinner-grip-capture.py
```

腳本只在自己的瀏覽器回應中暴露 `window.__world` 以取診斷近景，不修改遊戲來源或正式鏡頭。它等待 `actorsLoaded`，點正面招牌七次，使用既有 `pauseForCapture`／`tick` 固定時鐘：

1. `debugJump('chapter:intro')` 到 `shopping_complete`，再到 `photo-talk`。
2. `debugJump('chapter:terminal-deploy')`，登入 chunks 為 `endfield`、`_`、`power`、`520`、`1314`；驗證後進 `lever`，執行 `missionLever(1)`，逐 1/60 秒量交盤。
3. `debugJump('chapter:last')`，沿既有攻擊／assist 入口至 `meal-reclaim`，再到 `tour`。

`window.__rainy711.debugJump`、`restoreChapter`、`tick` 與招牌七次解鎖均保留，沒有遷移。

## 發布與下輪交接

- 已將受評程式 `0974e9e` 以正常 fast-forward 推到 `ui-preview`，沒有改動 `main` 或 force push。
- GitHub 的 Cloudflare Pages check 已確認此程式 commit 部署成功：[部署紀錄](https://github.com/Oloid666/endfield-model-lab/commit/0974e9e50eaebbb9a0dc6ebc463a488747558375/checks)。
- 固定程式預覽：[開啟 0974e9e 可玩版本](https://b86191db.endfield-model-lab.pages.dev/)；分支入口：[ui-preview](https://ui-preview.endfield-model-lab.pages.dev/)。
- 此環境直接連 `pages.dev` 受網路代理限制；線上狀態依 GitHub Cloudflare check 核對，瀏覽器視覺驗證是在本機架設相同程式進行。
- 下一輪優先 D-F01-R2，接著 R3；R4 另列鏡頭任務。Claude 若受指派實作，從最新 `ui-preview` 建立工作分支，交代以上編號、完整手部量測與側面前後圖；整合與發布仍由 Codex 核對後決定。
