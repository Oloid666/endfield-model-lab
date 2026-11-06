# StageShow 與主線 UI

本輪保留 Three.js 0.180.0、原生 DOM、劇情狀態機與正式部署設定。保險／學堂場景未改。

## Skill

官方來源 https://github.com/benjitaylor/skills ，專案安裝位置 `.agents/skills/stageshow/`，來源驗證見 `skills-lock.json`。使用官方 skills CLI，只選 stageshow、Codex、專案層級 copy。環境預設 npm cache 不可建立，改用 `/tmp/stageshow-npm-cache` 完成安裝。未執行範例安裝腳本、未增加 React 或動畫執行依賴。

已研究 SKILL.md、craft、motion、framing、rehearse，以及 buttons、dark-hero、form-error、kit 與驗證腳本。採用其層級、間距、固定操作位置、真實狀態回饋及檢查方法；不將展示裁切、假游標或自動操作套用到遊戲。

## 修改

- `src/ui-refinement.css`：限定主線的視覺規則；緊湊通訊、可調字幕、平板結果、按鈕主次、設定及通關建議操作。保留原 CSS，採有範圍的最後覆寫，避免本輪大幅整理既有391處 important 規則。
- `src/ui-settings.js`：移動既有控制項分組，保留事件；設定期間遮擋底層點擊並記錄／還原 inert，焦點循環、Escape 關閉及焦點返回。
- `src/main.js`：接入樣式與設定生命週期，不替換暫停原因管理。
- `src/mission.js`：平板按原狀態顯示結果、溫度／功率及可展開技術資料，按鈕仍呼叫原 tabletAction。
- `scripts/ui-layout-browser.py`：真實 Chromium 確認橫直向、桌面、26px 字幕、焦點、設定、恢復與平板實際互動。
- `docs/RAIN-BACKLOG.md`：保存已確認的24項後續工作。

## 驗證方式

`npm run build`；既有 presentation、vcr-tablet、touch-detail 檢查；`python scripts/ui-layout-browser.py`。瀏覽器輸出在 `/tmp/rain-ui-check/`，不是正式部署。StageShow React 展示未建立，所以不以 film --gate 宣稱遊戲驗證；使用既有 Playwright 測真實操作。

iPhone Safari 真機與熱機／FPS 尚未驗證。Chromium 手機寬度模擬不代表真機效能。

## 結果與審查

Build 成功；既有 Presentation 41 項、VCR tablet 102 項及 touch-detail 檢查通過。UI 瀏覽器流程154項檢查通過，包含320×568、390×844、844×390、1366×768、1920×1080；平板含手機直向、橫向、桌面三種尺寸。截圖前在 resize 後重新 render，避免停住 RAF 的擷取產生空畫布。

獨立唯讀審核發現並修正：設定遮罩 z-index、非互動字幕透明度、頭像與行距舊 important 覆寫、bonus-active 範圍隔離。實際目視確認橫向短句與26px字幕、桌面主景、320設定面板、平板可展開資訊。快速測試入口移到上方，避開操作列。無正式部署。

本作修改的 diff whitespace 檢查通過；官方 StageShow 原始來源有 discover.svg 尾端空白及 teaching.md 檔尾空行，保留上游原樣，不為此改動第三方來源或來源雜湊。

快捷測試入口的最後移位另以產出 CSS 與實際控制結構，在320／390／844／1366寬確認與暫停、平板主按鈕矩形無交集；短橫式維持左下，直向與桌面改上方。這項是 DOM 幾何檢查，不冒充3D或Safari真機測試。
