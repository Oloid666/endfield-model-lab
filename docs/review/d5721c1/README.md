# 本輪評審交付：d5721c1（D-F01 莊端托盤的手與盤接觸）

本文是實作者（Claude）的證據索引與自測記錄，不是外部評審通過聲明。Codex 請依指定 commit、原圖與自己的重現決定是否整合。

## 版本與範圍

- 受評程式commit：`d5721c1c8694e96ad128dfb1c85f7c2e96823bd4`，分支`claude/dinner-grip-01`。
- 比較程式commit：`ae25ab2e70b0268204de7537a4579103fc2e584c`（本輪起始點）。
- 交付commit：受評commit之後只新增本資料夾，並在`docs/review/README.md`加一行索引；遊戲`src/`、`public/`、頁面、依賴與部署設定與受評commit相同。
- **尚未推送**：本環境沒有GitHub寫入權限（GitHub帳號未連結，`add_repo access:push`被拒）。兩個commit以`git format-patch`交付，由Codex套用到`claude/dinner-grip-01`後推送。沒有分支預覽網址。
- 本輪只做D-F01。沒有改GLB、角色比例、晚餐美術、鏡頭、故事或玩法，也沒有加震動、粒子或Bob。共享IK`src/arm-support.js`與塞西`src/xaihi.js`未改。

## 觀眾實際看到的問題（修改前）

在托盤座標中量真實莊方宜GLB的蒙皮頂點（不是骨頭）：

- 兩手托在盤中段正下方（左右各18 cm），從玩家鏡頭看，盤子把手完全蓋住，像浮在身前（01-before）。
- 側面近景：盤底下只看到一片壓扁的黑手套；掌根陷進4 cm厚的盤體16 mm，手指4–7 mm（02-before）。
- **兩根拇指整根埋在盤體裡**（晚餐A左手298個拇指頂點在盤內，最深20 mm），所以任何角度都看不到拇指。
- 交給龍泡泡的0.70秒（所有權切換）：盤在一幀內位移13.7 mm、手腕13.1 mm（瀏覽器，實際導演站位）。

## 修改與原問題對照

| 原問題編號 | 實際修改／待驗證內容 | 修改檔案 | 證據編號 |
|---|---|---|---|
| D-F01 掌面與盤底 | 支點從盤中段移到兩短邊內3.2 cm。指骨放在盤底下15 mm，讓約11 mm厚的指腹（而不是骨頭）貼住盤底。指尖抬約11°，較厚的掌根不再頂進盤；食指側壓低約4°，讓手掌平貼 | `src/tray-grip.js`（新）、`src/performance.js` | 01–06、09、10 |
| D-F01 手指剪影／拇指 | 拇指不再埋在盤裡，三節指向改為扣住盤的短邊外側面。盤厚4 cm、GLB拇指約6.6 cm，從盤下無法越過盤面，所以採夾住端面。拇指每幀先還原GLB原始旋轉，放下托盤後即歸位 | `src/tray-grip.js`、`src/performance.js` | 02–04、06 |
| D-F01 握持一致性 | 手和盤用同一個托盤座標（`trayWorld`／`trayQ`），在同一次更新內計算。A／B／C三種盤依各自網格取兩端與盤底。單手（handover／手機）仍在盤中央，只套用高度與角度修正 | `src/tray-grip.js`、`src/performance.js` | node量測 |
| 交接跳位 | 交給龍泡泡時，0.30→0.70秒由莊的雙手把盤送到龍泡泡接住後的雙掌位置與朝向，所以0.70秒換手時盤不再瞬移 | `src/performance.js` | 07、08、量測 |
| 測試 | 新增`scripts/tray-grip-check.mjs`：真實GLB蒙皮頂點對真實盤體網格。`actor-check`／`cinematic-check`的舊代理條件改成「指骨在盤底下4–18 mm」；原本「骨頭距盤底<12 mm」會獎勵皮膚穿進盤 | `scripts/tray-grip-check.mjs`、`scripts/actor-check.mjs`、`scripts/cinematic-check.mjs` | 下表 |
| 取證 | `scripts/dinner-grip-capture.py`：四個故事節點，玩家鏡頭＋左右手各三個近景；交接與歸還逐1/60秒量位移 | `scripts/dinner-grip-capture.py` | 全部PNG |

所有權順序（莊→龍泡泡→空中→紫色生物→莊）與`tray-rescue.js`時序未動。

## 截圖索引

全部是原生PNG（Chromium截圖），只做無損壓縮（像素逐一比對相同），沒有裁切、修圖或合成。前後是同一程式流程、同一故事節點與時間；近景機位由腳本依手掌位置計算，前後同一公式，但手的位置不同，所以構圖不會完全一樣。

| 編號／故事節點 | 修改前 | 修改後 | 視窗／DPR／畫質／取證條件 |
|---|---|---|---|
| 01 買完晚餐（shopping_complete，photo-pose 0.85 s）玩家鏡頭 | [before](01-bought-player-view-before.png) | [after](01-bought-player-view-after.png) | 390×844、DPR 2、自動畫質（實際`balanced`，渲染DPR 1.25） |
| 02 買完晚餐：左手側面近景 | [before](02-bought-left-side-before.png) | [after](02-bought-left-side-after.png) | 1440×900、DPR 1；近景時隱藏UI；固定機位，FOV 35 |
| 03 買完晚餐：右手正前斜近景 | [before](03-bought-right-front-oblique-before.png) | [after](03-bought-right-front-oblique-after.png) | 同上 |
| 04 買完晚餐：左手側後斜近景 | [before](04-bought-left-rear-oblique-before.png) | [after](04-bought-left-rear-oblique-after.png) | 同上 |
| 05 出店拍照對話（photo-talk 1.2 s）玩家鏡頭 | [before](05-photo-talk-player-view-before.png) | [after](05-photo-talk-player-view-after.png) | 1440×900、DPR 1 |
| 06 起飛前（lever 0.85 s）左手側面近景 | [before](06-before-handoff-left-side-before.png) | [after](06-before-handoff-left-side-after.png) | 390×844、DPR 2 |
| 07 交給龍泡泡 0.35 s 玩家鏡頭 | [before](07-handoff-0.35s-player-view-before.png) | [after](07-handoff-0.35s-player-view-after.png) | 390×844、DPR 2 |
| 08 交給龍泡泡 0.75 s（換手後）玩家鏡頭 | [before](08-handoff-0.75s-player-view-before.png) | [after](08-handoff-0.75s-player-view-after.png) | 390×844、DPR 2 |
| 09 紫色生物歸還後（meal-reclaim 2.2 s）左手側面近景 | [before](09-reclaim-left-side-before.png) | [after](09-reclaim-left-side-after.png) | 1440×900、DPR 1 |
| 10 歸還後巡場（tour 1.5 s）玩家鏡頭 | [before](10-after-return-player-view-before.png) | [after](10-after-return-player-view-after.png) | 390×844、DPR 2 |

取證時的其他圖（每節點左右手×三角度、兩種視窗，共約200張）留在本機，沒有提交。

## 量測（實作者自測，不是評審結論）

`node scripts/tray-grip-check.mjs`：真實GLB，記憶體內移除貼圖；量蒙皮頂點與該份晚餐「最大底面積」網格（盤體）的關係，穿透深度取到最近盤面的距離。原始輸出見[tray-grip-before.json](tray-grip-before.json)、[tray-grip-after.json](tray-grip-after.json)。

| 項目 | 修改前 | 修改後 |
|---|---|---|
| 站立、晚餐A：掌／指最深穿盤（左／右） | 16.1／16.1 mm | 2.1／1.7 mm |
| 站立、晚餐A：拇指在盤內頂點數／最深 | 298／20 mm、146／19.7 mm | 3／2.1 mm、3／2.1 mm |
| 拇指貼盤端面（12 mm內頂點數） | 0／83 | 120／120 |
| 掌根到盤底的間隙 | 0.3 mm（因為手陷在盤裡） | 1.6 mm（貼住、不穿） |
| 晚餐B、C最深穿盤 | 6.4–12.5 mm | ≤2.2 mm |
| 走路＋轉身：每15幀取樣的最差值 | 穿16.1 mm、拇指埋298頂點 | 穿2.0 mm、拇指3頂點，每幀指腹貼盤≥83頂點 |
| 單手（handover）：左手最深穿盤 | 16.1 mm | 2.3 mm |
| 檢查結果 | 21／39 | 39／39 |

瀏覽器內實際劇情（`scripts/dinner-grip-capture.py`，390×844，逐1/60秒；位移相對莊的根節點）：

| 交接段落 | 修改前 | 修改後 |
|---|---|---|
| 給龍泡泡0.70 s換手那一幀：盤／手腕位移 | 13.7／13.1 mm | 0／0.2 mm |
| 給龍泡泡0–0.69 s：盤最大單幀位移 | 26.3 mm | 26.3 mm（原本彎腰遞出的動作，未改） |
| 給龍泡泡：手腕最大單幀位移（約0.93 s放手收回） | 39.6 mm | 37.6 mm |
| 紫色生物歸還：手腕最大單幀位移（0.43 s伸手） | 34.5 mm | 35.7 mm |
| 紫色生物歸還：盤最大單幀位移（2.03 s） | 10.5 mm | 10.5 mm |

node重現的換手跳位比瀏覽器大（52 mm→0.2 mm），因為node測試裡龍泡泡站位是固定值，不是實際跟隨位置；請以瀏覽器數字為準。

**數值的限制**：指腹與盤底0–4 mm的間隙在近景仍可能看到一條細縫（見02-after）。接觸是以皮膚頂點判斷，沒有材質壓縮或手套皺褶。IK誤差接近0只代表骨頭到位，手型是否自然請看圖。

## 在獨立環境重現

1. checkout交付commit，Node 22+，`npm install`，`npm run dev`（預設`http://127.0.0.1:5173/`）。
2. Node：`node scripts/tray-grip-check.mjs`（會寫`artifacts/tray-grip-check.json`，未提交）。
3. 截圖：`GRIP_URL=http://127.0.0.1:5173/ GRIP_OUT=/tmp/grip GRIP_TAG=after python3 scripts/dinner-grip-capture.py`。需要Python 3、Playwright、Chromium；`GRIP_CHROME`指定瀏覽器路徑，`GRIP_VIEWPORTS`預設`390x844@2,1440x900@1`。瀏覽器啟動參數：`--use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`。腳本只在自己的瀏覽器中改寫`/src/main.js`的回應，多暴露`window.__world`來定近景機位；遊戲程式與既有除錯入口不變。
4. 腳本流程：等`__rainy711.actorsLoaded` → `pauseForCapture()` → 點正面711招牌七次解鎖 → `debugJump("chapter:intro")`，用`missionNext()`推到`shopping_complete`（01）與`photo-talk`（02）→ `debugJump("chapter:terminal-deploy")`，用`keyChunk`／`missionVerify()`推到`lever`（03），`missionLever(1)`進`meal-handoff`並逐1/60秒`tick` → `debugJump("chapter:last")`，失誤五次後`assist()`命中，推到`meal-reclaim`逐1/60秒，再到`tour`（04）。時鐘全程用`tick(time, delta, render)`推進，畫面只在截圖時渲染。
5. 入口：`debugJump`、`restoreChapter`、`tick`與七下招牌**沒有改名或改流程**。

## 驗證範圍

- 執行的Build／測試及結果：
  - 全部45支`scripts/*check.mjs`在受評程式上通過（含新增的`tray-grip-check`，以及`vcr-tablet-check`塞西平板、`next-dinner-check`、`dinner-revision-check`、`review-synthesis-check`、`air-upstairs-check`、`second-wave-check`）。這些檢查會改寫追蹤中的`artifacts/*.json`，已還原，沒有提交。
  - `git diff --check`通過。
  - **`npm run build`沒有執行**：本環境無法從npm registry安裝vite（網路受限）。改用esbuild 0.28.2對四個Vite入口（`src/main.js`、`src/racing/main.js`、`src/indoor/main.js`、`src/feedback-admin.js`）各做一次完整bundle，全部成功。這只證明模組可解析、語法正確，**不等於Vite build通過**，請Codex執行`npm run build`。
- 無頭Chromium：Google Chrome headless、SwiftShader軟體渲染。本機直接服務起始commit與受評commit的原始碼（three 0.180.0取自three.js r180原始碼）。走過的路徑如上；沒走二樓、學堂、散步模式。兩個版本的瀏覽器pageerror皆為空。
- iPhone已實測：無。
- iPhone尚未實測：所有畫面、幀率、觸控與手感。不宣稱手機FPS或手感有改善。
- 真機影片：未提供。

## 已知缺口與需要Codex核對的疑點

1. **玩家預設鏡頭下手仍不明顯**（01、05、10）。接觸已修正，但這些鏡頭從前上方拍，盤的前緣仍擋住大部分的手，只看得到兩端的手與拇指。本輪規定不改鏡頭；要不要安排一個讓手入鏡的鏡頭，請使用者決定。
2. 拇指是**夾住端面**，不是越過盤面壓在上方。要讓拇指出現在盤面上，需要讓盤變薄或手位上移，屬於美術取捨。
3. 手指維持GLB原始的張開角度，沒有另外收攏，近景看得出四指張開。
4. 交接放手段（約0.93 s）手腕單幀仍有約38 mm的位移，是原本「放手回到姿勢」的動作，本輪沒有放慢。
5. 紫色生物歸還沿用原時序；只量了逐幀位移，沒有其他改動。
6. 桌面1440×900的遊戲畫面只佔左側約64%，右側是對話欄，屬於既有版面。

本文是提交者的證據索引與自測記錄，不是外部評審通過聲明。
