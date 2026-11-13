# 使用者提供的原始人物素材

此目錄保存使用者提供的原始素材，不會直接發布到網站。相同原檔另置於 `public/models/xaihi.glb`，在 VCR 回放前載入。原始 GLB 保留不變。

## 塞西

- 檔案：`xaihi-original.glb`
- 原始上傳檔名：`xaihi__arknights_endfield.glb`
- 大小：8,029,820 bytes
- SHA-256：`f953e5890ed0b208d02e59581b3ddee60650cd2646cf94a4324f1e15e5404a68`
- 內嵌作者：Abcxyz51
- 內嵌來源：[Xaihi / Arknights Endfield](https://sketchfab.com/3d-models/xaihi-arknights-endfield-a3e990b410eb46e7a5e0ab0f4bd71df1)
- 內嵌授權：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- 7 個蒙皮 Mesh、57,953 三角形、960 骨架 joints、7 張內嵌 PNG。
- 沒有動畫 Clip 或 Morph target；目前以執行時骨架姿勢處理待機、看終端及取餐。

已完成原始檔結構、權重、圖片與 Three.js 幾何解析檢查；瀏覽器檢視採獨立中性燈光，並非故事中的實際角色演出，也不是 iPhone 效能測試。

檢查紀錄：`artifacts/xaihi-asset-audit.json`、`artifacts/xaihi-browser-check.json`。預覽：`artifacts/xaihi-preview.png`、`artifacts/xaihi-face-preview.png`、`artifacts/xaihi-back-preview.png`。

## 發布素材的原稿與無損傳輸（2026-11-13）

- `images/store-posters.png`：原1536×1024海報圖集；公開衍生檔改為`public/images/store-posters.webp`，Pillow WebP `lossless=True, method=6`。解碼像素逐一相同，三欄UV不變。
- `images/bonus/before.png`、`images/bonus/after.png`與`images/mifu-portrait-a-source.png`：沒有遊戲顯示引用的原稿由public移到此處保存，不再隨網站發布。通訊仍用原有`public/images/mifu-a.jpg`。
- `public/models/zhuang-fangyi.glb`原檔未改；新增`.glb.gz`只供傳輸，解壓後每個byte相同。以Python `gzip.compress(data, compresslevel=9, mtime=0)`產生，大小4,661,344 bytes；不支援DecompressionStream或檔案有問題時回退原GLB。
- 原GLB SHA256：`43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94`。若未來更新壓縮衍生檔，需同步核對`src/actors.js`進度大小與`scripts/model-transport-check.mjs`，不能把壓縮變成更換模型。
- 開發時若需重新產生WebP，需Pillow支援WebP；gzip為Python標準庫。網站執行不新增套件，不在build自動重壓原稿。
