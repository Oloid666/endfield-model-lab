# 全局按鈕材質與攝影引導

依使用者確認的產圖方向與 StageShow craft/motion 原則：香檳金主操作、霧面墨綠次操作、輕量返回、暖紅重開。包含二樓按鈕外觀；未改保險／學堂場景、版面、內容或流程。24項分鏡／表演待辦繼續保留。

## 實作

- `src/button-style.js` 是純外觀標記，按既有class、id與明確傳入tone設定 `data-ui`，不依標籤文字推斷、不掛互動事件或MutationObserver。
- `src/button-materials.css` 共用漸層、亮邊、短陰影、不可用配色與focus。僅普通點擊控制下沉1px；砲擊、節奏、長按微調排除位移，滑桿／驗證與可點字幕保留原幾何。主線、相簿、設定、二樓及回饋表單共用色彩，原型賽道與管理頁未套用。
- 攝影就位主要操作排在DOM第一位，一般直向獨占一列，下方兩顆微調；短螢幕以三欄保留可用空間。badge依原flight位置／穩定門檻顯示微調、等待穩定、位置剛好。正確區域內不催玩家繼續移動。
- 相簿仍只有三個按鈕，傳送主操作；平板仍呼叫原tabletAction；回饋以原pending狀態顯示aria-busy，不增假送出動畫。
- 二樓、回饋的星等維持星形選擇，模式／視角使用選中描邊，不全變成主操作。二樓重開及學堂進度歸零只統一danger外觀，不增加確認流程。

## 驗證

`npm run build`、既有 touch-detail / viewer / feedback / presentation / vcr-tablet 檢查，以及擴充的 `scripts/ui-layout-browser.py`。

瀏覽器測試輸出與截圖：`/tmp/button-ui-check/`，含攝影真實長按、正確位置等待、五種尺寸操作區、相簿實際切圖與傳送、設定焦點及大字、平板、二樓與星等。以真實遊戲DOM/狀態驗證，不將StageShow展示腳本當作遊戲操作測試。

iPhone Safari真機、VoiceOver及行動裝置熱機效能未驗證。不改 Three.js 版本、不引入React、貼圖或其他執行依賴。

## 本輪結果

- Build成功（既有大型chunk提示保留）。touch-detail、viewer 57項、feedback、presentation 41項、vcr-tablet 102項通過。
- 最終Chromium流程198項通過、失敗0、page errors為空。照片含320×568、390×844、844×390、1366×768、1920×1080；另核對按下內凹、長按不位移與正確位置等待不催促移動。
- 唯讀審核發現並修正：位置正確但未穩定時的錯誤方向提示、長按translate優先序、hover覆蓋active、舊flex及80px最小寬覆蓋新照片網格。主CTA跨欄／短屏同列與所有按鈕邊界均由實際版面驗證。
- 最終照片、相簿、設定與二樓截圖已目視；rating-enabled圖只選星等並捲到送出區，未對正式後端送出測試留言。
- 交付更新既有ui-preview分支，正式main保持不變。
