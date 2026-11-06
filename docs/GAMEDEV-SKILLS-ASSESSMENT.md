# 《莊的晚餐》GameDev Skills 導入與優化評估

檢查日期：2026-11-06。遊戲基準版本：`9e123ba`。本輪只新增開發指南、來源紀錄與本報告，沒有修改遊戲程式、模型、套件或部署設定。

## 1. 結論與優先順序

最有價值的方向是讓現有相機交接更可靠、建立 iPhone 效能依據，以及減少 UI 更新與操作衝突。安裝 Skill 本身不會提升畫面或 FPS；它是 Codex 工作時參考的指南，不是遊戲執行套件。

建議依序處理以下五項。下方的程式差異與重複邏輯是可確認的維護風險；本輪沒有在手機上重現新的穿牆、卡住或卡頓問題，不能把它們當成已證實的故障原因。

| 順序 | 值得先改善的項目 | 對應 Skill | 難度 | 玩家能得到的效果 |
| --- | --- | --- | --- | --- |
| 1 | 相機控制權交接與建物安全範圍 | `camera-systems` | 中 | 拖曳、拍照、劇情、重建、二樓往返後仍能看清演出 |
| 2 | iPhone 發射／重建的效能與記憶體基準 | `performance-optimization` | 量測低至中；修正依瓶頸而定 | 找出卡頓來源後再修，避免降低畫質卻沒有解決停頓 |
| 3 | 手機 UI 的事件更新、遮擋與輸入交接 | `game-ui-ux` | 低至中 | 字幕更穩定、操作不殘留，場景保留足夠觀看空間 |
| 4 | 用語意提示配置分鏡，降低台詞序號相依 | `camera-systems`；之後可加 `dialogue-systems` | 中 | 日後加一句吐槽，不容易把後面的鏡頭全部對錯 |
| 5 | 共用 NPC 與人物的通行資料 | `game-ai`；本輪僅評估未安裝 | 中 | 門、貨架與廢墟切換後，各角色對可走範圍的判斷一致 |

第 2 項應在任何新的材質、陰影、粒子或渲染調整之前完成；第 1 項可以先做不增加渲染負擔的交接與驗收。

## 2. 目前遊戲架構與功能狀態

### 技術與入口

- `package.json` 與 `package-lock.json` 一致：Three.js **0.180.0（r180）**、Vite **7.1.12**。本環境 Node.js **24.19.0**，原 CI 使用 Node.js 22。
- 原生 JavaScript、HTML、CSS，沒有 React、Unity 或 Godot。Vite 同時建立雨夜、賽車、店內原型與回饋管理頁。
- 遊戲主要在瀏覽器執行。選用的玩家意見後端是 Cloudflare Pages Functions 與 D1；Google Analytics 4 是另外的選用統計。此輪沒有讀取玩家意見資料或變更後台。
- 賽車與店內原型是其他入口，本次遊戲優化建議集中於雨夜主線。

| 系統 | 主要檔案 | 從程式與檢查可確認的現況 |
| --- | --- | --- |
| 啟動、章節與系統接線 | `src/main.js`、`src/world.js` | 已有場景生命週期、主更新迴圈、暫停與背景處理 |
| 模型載入與資源 | `src/actors.js`、`src/xaihi.js`、`src/model-download.js`、`src/resources.js` | 已有載入流程、延後載入與資源管理；不是尚待建立的功能 |
| 姿勢與龍泡泡 | `src/performance.js`、`src/companion.js` | 透過骨架姿勢與程序動畫控制動作、表情、飛行 |
| 劇情與平板 | `src/mission-state.js`、`src/mission-dialogue.js`、`src/vcr-tablet.js` | 已有劇情狀態、對話節點、玩家操作閘門及可暫停的演出時間 |
| 相機 | `src/mission-director.js`、`src/story-shots.js`、`src/camera-safety.js`、`src/walk-camera.js`、`src/photo-camera.js` | 已有 Director、六段修訂分鏡、自由觀看防碰撞、散步與拍照相機 |
| 通關演出與二樓 | `src/street-performance.js`、`src/street-stage-camera.js`、`src/bonus.js`、`src/bonus-room.js` | 已有特寫→升空→手勢→遠景→建物變化的階段，以及二樓往返 |
| 移動與 NPC | `src/locomotion.js`、`src/ground-path.js`、`src/postgame-roam.js`、`src/meal-remnant.js` | 已有碰撞、尋路、慢速跟隨及龍泡泡周邊巡遊；不需要先導入行為樹框架 |
| 手機 UI | `src/mission.js`、`src/exploration.js`、`src/hold-button.js`、`src/bonus.js`、`src/style.css` | 已有觸控、長按、搖桿、彈窗與背景恢復保護；仍值得補跨介面驗收 |
| 效能保護 | `src/static-batches.js`、`src/shader-warmup.js`、`src/performance-guard.js`、`src/world.js` | 已有靜態合批、暖機、畫質調整與部分演出期間的畫質鎖定，不能再當作全新功能推薦 |

模型直接讀取 GLB JSON 得到：

| 模型 | 檔案大小 | 網格數 | 骨架關節數合計 | 內建動畫片段 |
| --- | --- | --- | --- | --- |
| `public/models/zhuang-fangyi.glb` | 7,520,868 bytes | 5 | 569 | **0** |
| `public/models/xaihi.glb` | 8,029,820 bytes | 7 | 960 | **0** |

因此「改善動畫切換」應先檢查現有姿勢權重、移動相位與插值。直接引入 `AnimationMixer.crossFadeTo()` 不會憑空產生走路或拿平板的動畫。

**已實作不代表全部通過手機驗收。** 本輪驗證了現有 Node 檢查與 Build，沒有重新操作完整主線或測 iPhone。真機效能、長時間遊玩、Safari 記憶體與所有橫直向交接仍需實測。可重用的完整 Shot 配置與 3D 漫畫目前屬後續規劃。

README 有歷史描述，例如「三篇結業」與舊版接線流程；實際 `src/bonus-data.js` 已是 **8 題全部進度**。後續開發應以現行程式與最新修訂文件核對，不照歷史段落重建舊功能。

## 3. Skill 名稱、用途與相容性

來源：[awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills)。檢查並固定於 commit **`19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9`**，以下十個名稱都確實存在。

| Skill | 上游分類 | 對目前遊戲的用途與判斷 | 本輪 |
| --- | --- | --- | --- |
| `threejs-gltf-loading` | `web-engines` | Three.js 專用，適合檢查載入、解碼、資源釋放；須避開 r185／r186 專用範例，且目前模型無動畫 clips | 暫緩 |
| `threejs-materials-lighting` | `web-engines` | Three.js 專用，可檢查色彩空間、材質與燈光一致性；先量測手機預算，再加視覺效果 | 暫緩 |
| `camera-systems` | `disciplines` | 鏡頭防碰撞、切換清理、多人構圖與跟隨；沿用現有 Director | **已安裝** |
| `game-ai` | `disciplines` | 適合輕量 FSM、注視、停走與跟隨；現有巡遊已存在，優先統一資料 | 暫緩 |
| `game-feel` | `disciplines` | 可用於命中／失敗回饋強弱與節奏；現有特效已很多，應先整理回饋層級，避免一直加震動 | 暫緩 |
| `performance-optimization` | `disciplines` | 量測後區分 CPU／GPU／載入停頓，再挑單一修正驗證 | **已安裝** |
| `dialogue-systems` | `disciplines` | 有助對話條件、語意事件及節點驗證；不需要把既有 runner 換成 Ink／Yarn | 暫緩 |
| `game-ui-ux` | `disciplines` | 安全區、可讀性、介面事件更新、焦點與輸入控制權 | **已安裝** |
| `shader-programming` | `disciplines` | 未來漫畫線稿／網點的參考；須自行套用 Three.js r180 並計算額外 render pass 成本 | 未來 |
| `create-game-assets` | `disciplines` | 風格、比例、輪廓、資產規格與來源規劃；可用於未來漫畫，無須換現有角色 | 未來 |

另有實際存在的 `input-systems`，適合未來集中處理 `pointercancel`、觸控捕捉及輸入交接；這輪不額外安裝。

通用 Skills 的程式例子多為 Godot／Unity，**不是可直接貼上的 Three.js 模組**。採用其方法後，仍須轉成目前的 Three.js、DOM、Pointer Events 與單一劇情時鐘。不能因範例使用別的引擎，就引進 Cinemachine、行為樹套件或另一套時間迴圈。

上游 Three.js Skills 自述以 r186 為新專案基準；例如 DRACO 解碼器預設路徑及陰影行為包含 r182／r185 之後的差異。保留目前 r180，使用任何 API 前核對現行版本，不能把導入 Skill 變成引擎升級。

## 4. 本輪安裝方法與位置

上游 README 的預設 `npx skills add gamedev-skills/awesome-gamedev-agent-skills` 會導入 router 與全部 77 個 Skill；CLI 也支援 `--skill` 精選及 `-a codex`，要求 Node.js 22.20 以上，本環境符合。

本輪採用上游 [Codex 官方安裝說明中的手動複製方式](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/docs/INSTALLATION.md#gemini-cli--codex-cli-shared-location)：先讀取固定版本，再將精選 Skill 的完整目錄複製到專案 `.agents/skills/`。這能保留參考文件，且不用執行 npm 安裝器或第三方腳本。

| 已安裝 Skill | Codex 入口 | 隨附參考 |
| --- | --- | --- |
| 相機 | [camera-systems/SKILL.md](../.agents/skills/camera-systems/SKILL.md) | `references/follow-and-framing.md` |
| 效能 | [performance-optimization/SKILL.md](../.agents/skills/performance-optimization/SKILL.md) | `references/profiling-and-budgets.md` |
| 介面 | [game-ui-ux/SKILL.md](../.agents/skills/game-ui-ux/SKILL.md) | `references/layout-and-flow.md` |

- 三個 Skill 共六份 Markdown，已閱讀並檢查內容及參考連結，沒有附帶可執行腳本或符號連結。這是本輪固定版本的內容檢查，不代表所有第三方 Skills 的保證。
- 原始文件逐位元保留；來源 commit 與每檔 SHA-256 記錄在 [來源鎖定檔](../.agents/gamedev-skills.lock.json)。
- Apache-2.0 的 `LICENSE`、`NOTICE` 保留於 `.agents/licenses/awesome-gamedev-agent-skills/`，不改變遊戲模型本身的授權。
- 未安裝 router：目前只直接使用三個獨立指南，避免加入指向其餘未安裝 Skill 的路由層。這是本專案的精選策略。
- 沒有新增 npm 套件、修改全域 Codex 設定或更新 Three.js。這些文件也沒有加入遊戲入口或玩家下載內容。
- 已確認本輪 Codex 可直接讀取安裝後檔案。Codex CLI 可透過 `$camera-systems` 等名稱呼叫；新開 session 後可用 `/skills` 檢查自動發現。本輪沒有把當前介面尚未證實的動態重新掃描宣稱為已驗證。

## 5. 五項優化的實作範圍與風險

### 1）先補相機交接與安全範圍

**依據：**已有 `CameraSafety.sync()`，但主劇情、街角演出、拍照與二樓分別保存／重設相機狀態。`src/camera-safety.js` 的側牆代理中心使用 x=±4.65，而 `src/store.js` 的主要側牆為 x=±4.3；代理可以有保守留白，但應驗證其空隙及近裁切面覆蓋，不能假設與實際建物完全一致。

**建議：**先針對「手動觀看→劇情→街角／二樓」加交接測試，再集中一個小型交接函式，處理位置、target、FOV、轉場、拖曳慣性與安全檢查前一幀。讓安全代理與店面共用尺寸資料，不對所有已驗收鏡頭重新加防碰撞或額外平滑。

**預計檔案：**`src/camera-safety.js`、`src/world.js`、必要時 `src/street-performance.js`、`src/bonus.js`；驗收延伸 `scripts/entry-camera-check.mjs`、`scripts/vcr-browser-check.py`。

**風險／驗收：**代理過大會擋住合法的窗邊觀看；控制權錯誤會搶回玩家視角。確認曾放大、拖曳後進復原／邀請／二樓再返回，橫直向都不穿牆、不露剖面，既有電線跟拍也不因二次平滑而拖後。

### 2）建立手機效能基準，再決定修哪裡

**依據：**`FrameStats` 已記錄最近 240 筆 frame interval、p95、長幀與畫質切換；這些資料沒有單獨證明 CPU、GPU 或資產解碼是哪個瓶頸。現有暖機與畫質保護也不等於 Safari 真機已達標。

**建議：**以 release build 固定裝置、方向、畫質及腳本路徑，記錄冷啟動、首發砲擊、紫色生物誕生、連續拆／復原六次、通關散步。結合 Safari Web Inspector、`renderer.info` 與資源／render target 計數，觀察 CPU 工作、draw calls、幾何／貼圖數及長幀；若 GPU 計時不可用，明確標示，不能用 frame interval 冒充 GPU 時間。記憶體以可取得的 Safari 資料與重複流程後資源數比較，不假設所有瀏覽器都有相同 heap API。

每次只修已量出的最大瓶頸，再在相同裝置與情境比較。完整重複一次長時間流程，觀察發熱後是否退化。不先壓縮人物模型、不先增加動態陰影，也不以「物件看不到」直接停止它的碰撞或劇情更新。

**預計檔案：**`src/performance-guard.js`、`src/world.js`、`scripts/warmup-check.mjs`、`scripts/battle-warm-check.mjs`、既有 browser runner；先整理量測流程，再視需要加入開發用資料輸出。

**風險／驗收：**量測本身也有負擔，只在開發模式啟用。比較相同操作下的 p95、>100 ms 長幀數、資源是否持續增長與畫質切換次數；實際 FPS 目標需由指定 iPhone 真機決定。

### 3）減少介面無效更新，補手機輸入驗收

**依據：**`src/bonus.js` 的 `tick()` 每幀呼叫 `syncClass()`，課堂路線即使百分比不變仍重寫標籤、ARIA 值與進度條。`src/exploration.js` 已處理 `pointerup`、`pointercancel`、`lostpointercapture`，但重設流程只清除指標 ID，值得驗證暫停／失焦時捕捉是否確實釋放；本輪沒有重現新的 Safari 捕捉故障。

**建議：**只有顯示數字／已讀題數改變才寫 DOM，進度條仍保留原來的平滑動畫。沿用現有 native dialog、焦點與長按元件，補「平板／課堂／設定／搖桿」交接測試。量測直向字幕與人物投影的重疊，先調整必要一處，不把所有對話框統一縮到無法閱讀。

**預計檔案：**`src/bonus.js`、`src/exploration.js`、必要時 `src/style.css`；`scripts/touch-detail-check.mjs`、`scripts/vcr-browser-check.py`。

**風險／驗收：**不能省略 ARIA 最終值、破壞 8 題進度或造成按鈕跳位。按住搖桿切背景、暫停、打開彈窗再關閉後，人物不自行移動；平板字清晰、字幕不遮臉、文字輸入欄仍可正常編輯。

### 4）分鏡改用語意提示，從單一場景開始

**依據：**`src/story-shots.js` 雖已有具名 beat，仍從 `nodeId` 最後一段取數字，再以 `index===9` 等條件挑鏡頭。新增或調整前面一句台詞，可能讓後面分鏡對到別的內容。

**建議：**保留現有 mission runner 與時鐘，在劇情資料加入明確 cue，例如 `briefing.pear-evidence`。Camera Director 讀取 cue 對應的小表格，先只遷移一段 briefing；不重寫整份 Director，不重編全部 node ID，也不新增獨立 `setTimeout` 來控制演出。

**預計檔案：**`src/mission-dialogue.js`、`src/story-shots.js`、`src/mission-director.js`；`scripts/story-check.mjs`、`scripts/director-check.mjs`。

**風險／驗收：**保留既有事件與章節存取。插入一段可選台詞後，原來梨花、人物、物證鏡頭仍對準同一個語意節點；暫停與略過保持相同結果。這就是適合目前規模的 Shot System 第一步。

### 5）NPC 與人物共用通行定義

**依據：**`src/locomotion.js`、`src/ground-path.js`、`src/postgame-roam.js` 各有邊界／門口數值。不同角色體積可有不同半徑，但門口與房屋資料分開維護，改店面時容易漏改其中一套。

**建議：**從現有 `floorPlan` 與房子完整／崩塌狀態產生通行資料，保留各角色半徑與移動速度。沿用現有小型狀態及格點尋路，狀態改變時刷新快取，不引進行為樹或完整 NavMesh 套件。

**預計檔案：**`src/ground-path.js`、`src/postgame-roam.js`、`src/locomotion.js`、必要時 `src/meal-remnant.js`；`scripts/postgame-check.mjs`、`scripts/walking-environment-check.mjs`。

**風險／驗收：**不能擴張未完成地圖或令紫色生物擋住莊。確認完整房子、拆屋後、復原後與二樓返回後都能實際走到馬路；關門時等待開門，背景恢復後不突然跳點，慢速跟隨與自由巡遊保留。

## 6. 未來 3D 漫畫

現有 Three.js 場景與角色可重用，不需先換引擎。優先參考 `camera-systems` 配置格內構圖，搭配 `threejs-materials-lighting`、`shader-programming` 與 `create-game-assets` 研究灰階、線條、網點及視覺統一。

最小原型建議只選一格街角：保留真正 3D 深度，可旋轉並看背面，切換原材質／灰階風格，再測骨架角色的描邊與背面品質。先共用一個 renderer、只更新活動場景；不要每格都複製完整店面、骨架、陰影與後製管線。漫畫描邊的額外幾何或畫面 pass 需另做手機量測。本輪沒有開發這個功能。

## 7. 本輪驗證與限制

- 已執行全部 **36 個** `scripts/*-check.mjs`，**36/36 通過**，含雨夜、回饋、賽車與店內原型的現有檢查。這些包含邏輯／數學與原始碼檢查，不等同 36 次真機遊玩。
- `npm run build` **成功**，Vite 轉換 134 個模組。保留原有 >500 kB chunk 提示：雨夜 main 約 521.65 kB、共用 interior 約 748.14 kB（壓縮前）。檔案大小不能單獨判斷執行 FPS，沒有為消除提示而亂拆套件。
- 六份 Skill 文件的 YAML 名稱／描述、相對參考連結、來源一致性、SHA-256、非執行檔與授權檔均檢查通過。
- 本輪沒有執行 iPhone Safari、完整 Playwright 遊玩或線上後台驗證，因此**沒有宣稱手機 FPS／記憶體／卡頓已改善**。
- 既有檢查產生的版本化測試輸出還原後，本輪只保留 Skills 與文件變更。沒有 commit、push 或正式部署。

## 8. 修改檔案與下一階段

本輪檔案：

- `.agents/skills/camera-systems/SKILL.md` 與 `references/follow-and-framing.md`：相機指南。
- `.agents/skills/performance-optimization/SKILL.md` 與 `references/profiling-and-budgets.md`：量測及預算指南。
- `.agents/skills/game-ui-ux/SKILL.md` 與 `references/layout-and-flow.md`：介面指南。
- `.agents/licenses/awesome-gamedev-agent-skills/LICENSE`、`NOTICE`：上游授權與署名。
- `.agents/gamedev-skills.lock.json`：固定來源版本與檔案雜湊。
- `docs/GAMEDEV-SKILLS-ASSESSMENT.md`：本次分析、風險、驗收與規劃。
- `README.md`：加入本報告入口；不重寫歷史劇情紀錄。

下一階段先做第 1 項的一個可回退變更：補相機交接驗收，再決定是否校正代理與共用交接函式。接著收集第 2 項真機基準，再修第 3 項中確定的 DOM 重複更新。分鏡語意化與 NPC 通行資料各自獨立修改、測試，避免同時改動三個控制系統。README 的過時操作描述可另作一次小型文件校正。

**只選三個 Skill：`camera-systems`、`performance-optimization`、`game-ui-ux`。** 它們最直接對應反覆出現的鏡頭交接、發射卡頓、字幕遮擋與手機操作問題；角色外觀與現有劇情可以完整保留。GLB 與 NPC 的下一步應依實際量測及資料一致性需求決定，不靠增加框架改善品質。
