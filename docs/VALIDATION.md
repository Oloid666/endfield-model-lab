# 驗證紀錄

最新修訂：2026-10-24。

第六輪已接入梨花、二樓機房、三十秒持續對話充能、力度條砲擊、六階段建築破壞與龍泡泡終結技。純狀態 101 項、場景幾何 10 項、原始 GLB／演出 46 項及桌面瀏覽器 61 項功能檢查通過。結尾實際觀察 60.00 秒，人物與場景持續更新。最終畫面及發布結果見 [第六輪紀錄](LOOKDEV-V6.md)。iPhone Safari 尚未真機測試。

第五輪歷史結果：已實作跟隨、商品、進店鏡頭、渲染與介面修訂，詳見 [第五輪紀錄](LOOKDEV-V5.md)。故事 411 項、實際 GLB／動作／跟隨 31 項、桌面瀏覽器 49 項檢查通過。結尾實際觀察 60.16 秒，持續閒聊，沒有 JavaScript／Shader 例外。入口鏡頭 12 項及正式子路徑畫面 19 項也通過，最後驗證日期為 2026-10-24。效能抽樣與原始結果詳見第五輪紀錄。第五輪已部署，公開程式、樣式、模型與本機測試版本核對一致。公開網址瀏覽器測試受此環境的代理憑證信任問題阻擋；沒有 iPhone Safari 真機結果。

第四輪歷史結果：故事 411 項、實際 GLB 骨架／移動 22 項、桌面瀏覽器 41 項檢查通過。結尾持續觀察 60.13 秒，閒聊正常，沒有 JavaScript／Shader 例外。詳細保留於 [第四輪紀錄](LOOKDEV-V4.md) 及 `artifacts/v4-browser-results.json`。第四輪數值不代表第五輪效能。

以下完整保留第一輪歷史紀錄。其中「故事與走路尚未加入」、建置大小、截圖與效能數字均為當時狀態，不代表目前版本。

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

使用者已建立並指定新 Repository：

https://github.com/Oloid666/endfield-model-lab

使用者已將 Pages Source 設為 GitHub Actions。重新執行工作流程後，建置與部署均成功：

https://github.com/Oloid666/endfield-model-lab/actions/runs/39987426931

實際網站：

https://oloid666.github.io/endfield-model-lab/

第一輪發布版本來源 commit：`fc85bdf49570ace896723851992eb241ca18aa11`。

已用正常 TLS 驗證下載公開 HTML、JavaScript、CSS、favicon 與 GLB。模型大小及 SHA-256 與原始檔完全一致。檢查結果記錄在 `artifacts/production-check.json`。

本環境 Chromium 直接開啟公開網址時，遇到本機代理憑證信任錯誤 `ERR_CERT_AUTHORITY_INVALID`。沒有停用 TLS 驗證；未取得公開網址的瀏覽器截圖。先前本機同版場景的 Chromium 測試與截圖仍有效，但不等同公開網址的端到端瀏覽器驗證。

尚無 iPhone Safari 真機測試結果，不能宣稱達成手機穩定 30 FPS。
