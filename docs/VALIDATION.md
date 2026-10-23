# 第一階段測試紀錄

日期：2026-10-23。

## 交付內容

已完成獨立 Vite／Three.js 場景、原始莊芳宜模型載入、程序龍泡泡、待機、店面與街角、冷暖燈光、低解析度濕地反射、雨絲、水花、屋簷滴水、低解析度 Bloom、人物接觸陰影、視角與設定。

沒有故事對話、選餐、多結局或走路實作。這些功能先記錄在 `DIRECTION.md`，等待使用者確認 711 場景。

## 素材核對

- GLB：7,520,868 bytes。
- SHA-256 與使用者提供值一致：`43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94`。
- 解析後確認：0 animation clips、0 Morph primitives、5 meshes、5 materials、5 textures、569 joints、80,576 triangles。
- 內嵌 metadata 確認作者 Abcxyz51、來源 Sketchfab 與 CC BY 4.0。
- 原始 GLB 未修改。模型使用外層 Group 置中、等比例放置；執行時姿勢參考使用者指定版本的明確節點設定。

## 建置

- `npm install --cache /tmp/zhuang-npm-cache`：成功。使用 `/tmp` 快取，避免受限的使用者家目錄寫入。
- `npm run build`：成功。
- `VITE_BASE_PATH=/zhuang-rainy-711/ npm run build`：成功。
- JS 約 822 kB，gzip 約 216 kB。Vite 提示單一 chunk 超過 500 kB。此提示尚未處理，沒有隱藏警告。
- GLB 另行載入，約 7.52 MB。尚未量測 iPhone 蜂窩網路載入時間。

## 桌面瀏覽器測試

使用本機 `/usr/bin/chromium`、Playwright 與 SwiftShader 軟體 WebGL。採 390×844 直式、844×390 橫式及 1440×1000 桌面尺寸。這些是桌面瀏覽器測試，不能等同 iPhone Safari 真機結果。

`scripts/browser-smoke.py` 的 20 項檢查全部通過。原始結果為 `artifacts/qa-results.json`：

- 模型與全部指定骨架節點載入。
- 單一 Canvas；程式僅建立一個 Renderer 與主渲染循環。
- 直橫式沒有頁面溢出。
- 設定可開關；人物可隱藏與恢復；畫質可切換。
- 雨與雨聲開關可操作。未以此宣稱已驗證實際揚聲器聽感。
- 三個視角與重設可用。
- Chromium 實際觸控輸入可拖曳鏡頭，並解除預設視角狀態。
- 模擬 `document.hidden` 與 visibilitychange 時，場景時鐘暫停。這項是合成事件檢查，不是手機切到背景的真機測試。
- 場景持續觀察 60.08 秒，增加 87 個渲染影格；沒有 JavaScript 例外。這是場景觀察，不是尚未實作的故事結尾觀察。
- 真正觸發 `WEBGL_lose_context` 後有提示；恢復後重新渲染，仍只有一個 Canvas。
- 模型請求失敗時保留店面，並顯示人物載入失敗提示。
- WebGL 2 不可用時，顯示說明與重新載入按鈕。

最後調整直式屋簷構圖與增加滴水後，再執行建置、畫面與子路徑檢查。`artifacts/pages-check.json` 確認：

- `/zhuang-rainy-711/` 回應 HTTP 200。
- 正式建置能載入模型。
- 重新整理後仍能載入模型。
- 以 Chromium 兩指觸控輸入實際縮放成功。
- touchCancel 後仍能重設視角。
- 沒有 JavaScript 例外。

## 效能限制

軟體 WebGL 的桌面 1440×1000 場景觀察約 1.45 FPS；390×844 視窗以標準畫質約 3.70 FPS、省電畫質約 5.30 FPS。此軟體渲染環境未達 30 FPS。

尚無 iPhone GPU 的實測結果，因此不能宣稱達成手機穩定 30 FPS。之後需記錄 iPhone 型號、iOS／Safari 版本、畫質、直橫式及溫度／持續時間。也需測試 Safe Area、Safari 工具列收合、背景恢復與真實雨聲。

目前保留三段手動畫質。DPR 上限分別為 1、1.15、1.5；反射貼圖分別為 192、384、512，更新間隔分別為每 3、2、1 個影格。省電模式停用 Bloom。場景靜態幾何按材質合併，商品使用 InstancedMesh。沒有每幀建立幾何、Canvas 或紋理。

## 截圖

以下全部由實際本機 WebGL 場景擷取，沒有使用生成圖代替網站：

- `artifacts/iphone-portrait.png`
- `artifacts/iphone-landscape.png`
- `artifacts/desktop.png`
- `artifacts/awning.png`

雨夜參考頁的 HTML 已透過正常 TLS 下載成功；瀏覽器直接開啟遇到憑證信任錯誤，本地渲染參考頁的截圖也未成功。未停用 TLS 驗證，未宣稱完成參考畫面的視覺比對。

## 發布狀態

已建立獨立本機 Git Repository，沒有修改舊網站。已準備 `.github/workflows/pages.yml`，包含安裝、建置、Pages artifact 與部署工作。

先前 GitHub 連線無法建立 Repository。使用者已建立並指定新專案：

https://github.com/Oloid666/endfield-model-lab

現有程式已成功推送至該專案的 main，Pages 建置路徑已改為 `/endfield-model-lab/`。本機建置及模型 hash 核對通過；GitHub Actions 也已完成 npm 安裝與 Vite 建置。

目前尚未發布。啟用 Pages 的 API 請求回覆 `Resource not accessible by integration (HTTP 403)`；Actions 因 Repository 尚未啟用 Pages，在 `actions/configure-pages@v5` 停止。這是 GitHub 連線權限限制，不是沙箱自動審查拒絕。

需要使用者開啟下列設定頁，在 Build and deployment → Source 選擇 GitHub Actions：

https://github.com/Oloid666/endfield-model-lab/settings/pages

設定完成後可重新執行部署工作，接著驗證實際網址。尚無已部署網址或 iPhone 真機驗收結果。
