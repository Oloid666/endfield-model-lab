# 三段電影運鏡實作

2026-11-06；基於 `1fd3607`。使用者已確認實作並發布；沿用 [第一階段方案](CINEMATIC-CAMERA-PHASE1.md) 與原始 `game-cinematic-camera` Skill。這是既有遊戲的局部修改。

## 實際改動

| 段落 | 現在的演出 | 主要檔案 |
| --- | --- | --- |
| 雨夜相遇與取餐 | 外部遠景→雙人中景輕推；提醒拿湯用龍泡泡側後過肩看莊。依實際到櫃檯／出門事件切鏡，店內外不以插值穿牆；返回路徑只在店外移動 | `src/story-shots.js`、`src/mission-dialogue.js` |
| 終端操作與升空 | 用完整鍵盤、拉桿與角色動作包絡，在進入或轉向時求解構圖；帳號、密碼、驗證與拉桿保持相同機位。升空使用起飛前頭部錨點，五秒內跟升並拉遠 | `src/cinematic-track.js`、`src/story-shots.js` |
| 最後一擊 | 原裝填第六秒進入同軸側過肩瞄準；發射近景拍清臉、手與龍泡泡，保留到第2.75秒。接飛行遠景，第4.35秒定位，4.9秒命中前停穩；後續鄰棟、梨花與復原延用原劇情 | `src/story-shots.js`、`src/mission-director.js` |

新時間軌不擁有輸入、計時器或另一個 renderer。沿用 mission clock、現有動畫後的頭／人物位置、單一 Camera 和現有退出流程；已移除被取代的三段舊機位分支。`src/world.js` 僅接開發輔助顯示及 dispose 清理。

- 同一 shot 跨台詞不重新推鏡；按下一句、恢復自動鏡頭不會清除輸入構圖或升空起點。
- 手動觀看依原規則接管；最後發射維持既有鎖鏡。章節／重新開始會清除時間軌；拍照仍由 PhotoCamera 控制。
- 運鏡以時間取樣，減少動態模式停用推移／改固定剪接。沒有新 GLB、貼圖、陰影燈、後製特效或第三方套件；Three.js 仍是 0.180.0。
- 直向按可用 HUD／字幕矩形留空。候選機位先依包絡解算；不在每幀掃描 DOM 或 raycast 全場景。
- 開發時以 `npm run dev` 並加 `?cameraDebug=1` 顯示路徑、焦點與進度；正式 build 不啟用該 overlay。

## 審核修正

獨立只讀審核指出「點下一句」也會呼叫 `resumeCamera()`，若重設時間軌就會每句重播推鏡並重新計算輸入機位；以及手動觀看期間清除升空錨點，恢復後會平移路徑。兩處均已修正，新增 Director 接線回歸。實際截圖另抓到過肩前景遮臉、發射臉太小，以及橫向右側操作面板遮住實體終端；已調整側距、上半身包絡及側邊 HUD 安全區。終端吐槽預覽與真正登入分開快取，避免拿較矮對話框的矩形去構圖高鍵盤。射擊軸側號仍取自原有機位；瞄準構圖保留同側 eye，只偏轉觀看目標來避開側欄，並對最終位置聯合驗證軸線與八角投影。直向返回再拉遠3.6m，首中尾均檢查雙人與袋子。

最終 [獨立實作審核通過](CINEMATIC-CAMERA-IMPLEMENTATION-REVIEW.md)，沒有未解決的 blocker／major。

## 驗證與限制

- `npm run build`：通過；保留原有大 chunk 提示，沒有升級引擎或改部署設定。
- `node scripts/cinematic-track-check.mjs`：734 項，含 30/60Hz 同時間姿態、暫停、完整裝置包絡、轉向重算、輸入穩定、射擊同側、命中前停穩與減少動態。
- `node scripts/director-check.mjs`：303 項，包含實際 Director 的跨閱讀／手動接管錨點回歸。
- 全部 38 套 `scripts/*-check.mjs`：通過。
- 四尺寸 390×844／320×740／844×390／1366×768 的 B/C 最終56筆姿態、320px／26字／減少動態14筆，以及A5直向首中尾均通過。真實 DOM 下一句／鍵盤按鈕、拖曳升空後恢復、暫停與章節重開已驗證。
- `vcr-browser-check.py` 完整通過：冷熱反轉、延遲馬賽克、10次背景節奏恢復、鎖鏡發射、二樓理賠、8題課堂、評分草稿、6次房屋切換、實際鍵盤馬路來回與重開，沒有執行錯誤。`story-revision-browser-check.py` 亦通過七下解鎖、洛西、紫色生物、快速跳轉與資源穩定檢查。
- [四尺寸比對圖](../artifacts/cinematic-camera-review.jpg) 與 [88筆實際相機紀錄](../artifacts/cinematic-camera-check.json) 隨專案保存。
- 瀏覽器腳本：`scripts/cinematic-browser-check.py`、`scripts/vcr-browser-check.py`、`scripts/story-revision-browser-check.py`；使用本機 preview 與 Chromium SwiftShader。

Chromium 裝置尺寸模擬不代表 iPhone Safari 真機。沒有宣稱手機 FPS、發熱或耗電已改善。既有能量光可能在瞬間使發射人物偏亮；本次沒有修改效果、材質或劇情。可調旋鈕保留在 `story-shots.js` 的側距、FOV、推移距離與時間；終端以完整包絡為準，避免只調座標又裁到按鍵。
