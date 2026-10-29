# V8 · 天師樁登入、塞西回放與砲擊收尾

本文件記錄本輪實作及實際驗證。施工中的檢查不得當作完成結果；最終部署證據由主代理在發布成功後補入。

## 本輪範圍

- 移除首頁玩法試驗區與六種獨立原型，操作回到主線。
- 通訊採石白面板與使用者選定的弭弗 A 款二創肖像。
- 天師樁依公開原作參考製作立體柱體，保留分段、懸浮間隙及綠色息壤能量。
- 龍泡泡踩立體鍵帽輸入 `endfield_power`／`5201314`，完成戲內的「我不是機器人」驗證，再抱住拉桿往右拉。所有帳密及驗證均是本地劇情，不接外部驗證服務。
- 三十秒充能與三種砲擊出力沿用。711 招牌受擊脫離、翻轉下墜、落地留在廢墟中。
- 普通砲擊到 99% 後，插入能量異常台詞、七秒 VCR 倒帶、店內監控視角及使用者提供的塞西 GLB。
- VCR 裡演出兩次加熱失敗，第三次由玩家長按供電、放開斷電。0.125× 慢放提供操作時間，劇情目標為 0.3 秒。
- 回放解釋未關閉的「極速保溫」持續分走電力。回到原現場時保存晚餐、射擊次數、99% 破壞與仍在運作的伺服器。
- 終結技發射龍泡泡，鄰居房屋有更大範圍受損；龍泡泡卡牆後，結尾依序帶過它、711 招牌與廢墟，最後是莊的 C 款微笑方向。

## 角色素材與表演邊界

塞西使用使用者提供的原始 GLB：8,029,820 bytes，SHA-256 `f953e5890ed0b208d02e59581b3ddee60650cd2646cf94a4324f1e15e5404a68`。內嵌作者 Abcxyz51、CC BY 4.0 及原 Sketchfab 頁面已核對。模型有 57,953 三角形、7 個蒙皮 Mesh、960 joints，沒有現成動畫或 Morph。站立、視線、手臂及終端操作由執行時姿勢處理。

莊的原始 GLB 保留，SHA-256 `43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94`。結尾微笑使用臉部骨骼的細微變形；概念圖是方向參考，不當作即時表情結果。

登入報讀採可重播字幕與瀏覽器語音能力；這不等於官方角色配音，也不以沒有聲音裝置的測試宣稱音色或聽感驗證。

## 驗證狀態

`browser-v8.py` 已在 production build `index-B5qFnQxh.js`／`index-C7krTZd_.css` 完成 **121 項整合檢查**，JavaScript 與 shader 錯誤為零。主線三餐、鍵盤、驗證、拉桿、充能、砲擊、VCR、微波互動、返回原進度、終結技、結尾運鏡、重播與 context 恢復均通過。證據見 `artifacts/v8-browser-results.json`。

真實結尾觀察為 **60.01 秒、46 個渲染影格**；這是桌面 Chromium／SwiftShader 的軟體渲染結果，不能推論 iPhone FPS。390×844 與 844×390 的視窗及觸控測試也不等於 iPhone Safari 真機驗證。

最終 `index-BQqMN2aU.js`／`index-C7krTZd_.css` 的場景與鏡頭調整另由 `visual-v8.py` 完成 **9 項自動檢查與人工畫面驗收**。登入時龍泡泡的投影中心確實高於操作面板；直式與橫式都看得到實體鍵盤。橫式截圖必須先等 canvas 的 drawing buffer 尺寸對應新的 CSS 尺寸，再渲染；暫停渲染下直接旋轉視窗會使剛重設的 framebuffer 呈現平色，不能據此判定持續運行的產品鏡頭失效。

CCTV 的遮擋已修正。微波爐朝向店內，鏡頭位於店內：塞西的臉、上半身及手持終端可見；微波爐正面可見便當、焦痕、蒸氣及電弧。橫式畫面的爐中心位於 x=244.03，右側操作面板從 x=467 開始，兩者不互相遮住。登入時龍泡泡中心 y=319.79，操作面板從 y=423.81 開始，玩家能看見踩鍵。`artifacts/v8-visual-results.json` 記錄最終瀏覽器實際載入的 bundle、投影數據與人工驗收。

實測也找到並修正一次真實觸控錯誤：放開加熱按鈕後，新增的「再試一次」按鈕可能接到同次手勢的合成 click。重試現在需要自己的 pointerdown，冷／焦失敗會停住等待玩家，鍵盤與輔助操作仍可使用。

## 已驗證的操作

- 主線三種選餐、無倒數、重播與輸入重設。
- 鍵盤輸錯修正、報讀、踩鍵與龍泡泡實際位置變化。
- 驗證等待、拉桿拖曳取消、三十個有效秒蓄能及暫停。
- 不同出力、MISS、實際骨架後座、拖曳與雙指取消不誤開砲。
- 招牌在空中、落地及留在廢墟中的實際幾何。
- VCR 逆流、塞西載入與骨架表演、兩次失敗、玩家加熱冷／焦／成功、取消及暫停。
- 回放結束恢復原任務狀態；終結技、鄰居破壞、連續結尾運鏡與原始骨架微笑。
- 單一 Renderer／Canvas、WebGL context lost／restore、頁面尺寸、JavaScript 與 shader 錯誤。

## 最終實際截圖

以下是桌面 Chromium／SwiftShader 的實際渲染，不是概念圖。

- [開場店面與焦黑微波爐](../artifacts/v8-opening-microwave.png)
- [龍泡泡踩鍵與手機介面](../artifacts/v8-login-visible-dragon.png)
- [橫式 3D 舞台與鍵盤](../artifacts/v8-landscape-login-native.png)
- [弭弗 A 款通訊介面](../artifacts/v8-communication.png)
- [塞西在櫃檯使用終端](../artifacts/v8-cctv-terminal-reviewed.png)
- [微波爐加熱失敗](../artifacts/v8-cctv-microwave-reviewed.png)
- [玩家加熱操作](../artifacts/v8-cctv-player-reviewed.png)
- [橫式加熱介面](../artifacts/v8-cctv-heat-landscape-reviewed.png)
- [莊的結尾微笑](../artifacts/v8-tour-smile.png)

## 發布狀態

已於 2026-10-25 發布。

- [正式網站 · V8](https://oloid666.github.io/endfield-model-lab/?v=8)
- [程式版本 27b9243](https://github.com/Oloid666/endfield-model-lab/commit/27b9243a11bc14b42f49e38b05bcbca46ae9bbc3)
- [GitHub Actions：Build 與 Pages 部署成功](https://github.com/Oloid666/endfield-model-lab/actions/runs/40156122443)

已透過正常 TLS 下載公開 HTML、主程式、塞西延後載入模組、CSS、肖像及兩份 GLB；全部與本機受測 production build 的內容及 SHA-256 一致。莊與塞西的原始模型雜湊均保持不變。舊試驗區的程式字串已從公開 bundle 移除。證據見 [`production-check.json`](../artifacts/production-check.json)。

主程式為 `index-BQqMN2aU.js`，1,062,386 bytes；CSS 為 `index-C7krTZd_.css`，44,445 bytes；塞西模組為 `xaihi-B73Fy-1b.js`，6,023 bytes。Vite 仍提示主 chunk 超過 500 kB，沒有隱藏警告。

本環境 Chromium 直接開啟公開網址仍遇到代理憑證信任錯誤 `ERR_CERT_AUTHORITY_INVALID`，沒有停用 TLS 驗證。公開資源核對與本機同版 WebGL 測試已完成，但未宣稱取得公開網址的瀏覽器截圖。此限制記於 [`v8-public-browser-check.json`](../artifacts/v8-public-browser-check.json)。

iPhone Safari 真機效能、Safe Area 與工具列收合仍待實機確認，未宣稱達成手機 30 FPS。
