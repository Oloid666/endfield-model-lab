# 載入、拍照減量與兩項UI修正

受評程式：`c99c692`；比較版本：`32f88b3`（遊戲程式與前次發布`44fda4e`相同，另含Claude意見記錄）。下一個僅含文件與證據的commit補交本資料夾，不改受評遊戲程式。精選截圖來自提交前最後 production build，同一份runtime內容；未把中途失敗取證當作最後通過。

預覽：[ui-preview](https://ui-preview.endfield-model-lab.pages.dev/)。此入口隨後續版本更新；發布狀態以交付commit的Cloudflare Pages check為準。未改main、部署設定、引擎／套件版本、角色外觀、原GLB或故事。

## 這次完成什麼

| 對應問題 | 改動與結果 |
|---|---|
| Claude P1 首屏載荷 | 相同Python HTTP server、冷快取、390×844／DPR1、展開載入詳情並點直接進入、等莊模型就緒與loading隱藏的標準路徑：**12,332,170→8,779,661 bytes（約12.33→8.78MB，減28.8%）**。含HTTP標頭，不混用Claude的14.03MB，也不把未請求圖片算成首屏節省 |
| 海報 | 2,846,405-byte PNG改2,152,062-byte無損WebP；尺寸1536×1024及圖集UV不變，PIL核對解碼RGBA像素完全相同。原稿保存在source-assets |
| 模型傳輸 | 原GLB7,520,868 bytes保留不動。新增4,661,344-byte gzip傳輸檔，內建DecompressionStream解開後逐byte相同，再交原GLTFLoader。這是傳輸壓縮，不是Draco／Meshopt重編模型。缺檔、損壞或API不可用時回退原GLB；使用原檔回退路徑不保證低於9MB |
| 未使用圖片 | before／after及弭弗大原稿共5,213,751 bytes移出public，保留在source-assets，不刪唯一原稿。加上保留原GLB備援及新增gzip等實際產物，整個dist由30,723,483→29,478,091 bytes，淨減約1.25MB；**不是**把5.21MB都算成下載節省 |
| Claude P2 拍照 | 同一實拍測試流程，全景仍長邊2048、近照改1024×1280光學視角，兩者JPEG0.86。兩張data URL字元總長**6,969,256→608,170（約6.97→0.61MB，減91.3%）**，符合<1,000,000的編碼預算；不是總RAM。手機縮圖仍來自第一張全景，未把第二張人像冒充第一張 |
| 設定教學 | 換掉「選出力、中央命中」，改說按住蓄力／鬆開發射、金色最強、過久洩壓，並說明最後一發點擊發射 |
| 橫屏吐槽條 | 從橫跨場景改成操作區附近的窄提示；直屏、橫屏、桌機分別配置。桌機提示在右側UI區，不壓主要渲染區 |

**此次範圍不含Claude P3分享卡、角色表情／托盤交接、保險或學堂改裝。**它們仍待改。

## 前後畫面

原生PNG截圖，沒有修圖、美化或合成。相同腳本操作，不保證角色待機處於完全相同毫秒；JPEG本來就是有損編碼，驗收是眼睛可辨認，沒有宣稱照片逐像素不變。

| 編號 | 圖片 |
|---|---|
| 01／02 | [全景之前](01-photo-wide-before.png)／[之後](02-photo-wide-after.png) |
| 03／04 | [近照之前](03-photo-closeup-before.png)／[之後](04-photo-closeup-after.png)；眼睛細節可讀 |
| 05 | [橫屏吐槽條](05-combat-landscape-after.png)；[前次寬條](../cdae8e3/02-charge-landscape-after.png)來自另一進度，不是同一幀 |
| 06 | [桌機提示在UI區](06-combat-desktop-after.png) |
| 07 | [更新後設定教學](07-instructions-after.png)，已展開作品與回報 |
| 08 | [橫屏照片介面](08-gallery-landscape-after.png) |

[verification.json](verification.json)提供檔案SHA256、各run狀態及完整取證索引。原圖、編碼測試資料與大量中間畫面留在忽略的artifacts/visual-review，不放public增加下載。

## 修改檔案

- `src/actors.js`、`src/model-download.js`：可選gzip傳輸、依實際body計算進度、驗證GLB完整長度、解壓與原檔回退；保留40秒閒置timeout、取消與既有呼叫相容性。
- `public/models/zhuang-fangyi.glb.gz`：新增傳輸衍生檔。原GLB SHA256仍為`43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94`。
- `src/store.js`、`src/investigation-props.js`、`public/images/store-posters.webp`：同步更換海報引用與無損素材。
- `source-assets/images/`及`source-assets/README.md`：原稿移入、來源與再產生方式。
- `src/world.js`：只改照片編碼與近照像素數；原兩個獨立視角、同一凍結姿勢、有效人臉判斷與finally還原流程保留。
- `index.html`、`src/shot-charge.css`：操作教學及吐槽條版型。
- `scripts/verify-production.py`：檢查實際顯示的mifu-a.jpg，不再強迫原稿進dist。
- `scripts/model-transport-check.mjs`：19項傳輸測試。
- `scripts/asset-photo-browser.py`：冷載入請求、真實照片與編碼預算、三版型、模型備援、子路徑與可見教學取證。
- `scripts/photo-recovery-browser-check.py`：更新新近照尺寸驗收，其他背景／重拍／輸入要求保留。
- `scripts/photo-flow-browser.py`：舊fixture仍尋找早已移除的返回按鈕；改測現有Escape關閉，再檢查重開、傳送及清除遮罩。
- 後續文件commit：本資料夾、待改區、Claude記錄的目前狀態與評審索引。

## 驗證

- `npm run build`及`VITE_BASE_PATH=/endfield-model-lab/ npm run build -- --outDir /tmp/rain-prefix-root/endfield-model-lab`通過；沿用既有大型chunk及靜態／動態import警告，沒有藉此改打包架構。見[build.log](build.log)、[prefix-build.log](prefix-build.log)。
- 47支`scripts/*check.mjs`全部通過，包含原GLB控制器與新的19項模型運輸測試；見[node-checks.json](node-checks.json)。測試改寫的追蹤artifacts已還原。
- 新增模型檢查：真正gzip解碼逐byte比對、正常串流、fetch依Content-Encoding已解壓、404、損壞、沒有DecompressionStream、取消不可啟動回退、損壞原檔拒絕及進度上下界。
- `verified`實際遊戲run通過，無pageerror；首屏<9MB、全景／近照<1MB、相簿初始確為本次全景、光學近照獨立、傳送、三版型吐槽條在視口內且不與按鈕相交、桌機提示不跨出UI區、設定可見文字皆檢查。
- 相同Python HTTP server的子路徑run：8,779,891 bytes，通過預算與載入；`legacy`不支援解壓、`missing`gzip404的兩個真實瀏覽器run皆成功使用原GLB，約11.64MB。這兩種回退只保證相容，不宣稱也達9MB。
- 既有真實[photo-recovery.log](photo-recovery.log)通過：無臉不能放大／傳送、重拍、有臉的獨立近照、相簿切換、設定與回報草稿、模擬背景、模擬BFCache返回、重新開始及文字不選取。另[photo-flow.log](photo-flow.log)通過遮罩清除與後續故事。
- Python改動檔案py_compile、git diff --check通過。
- 量測明細：[首屏之前](network-before.json)／[之後](network-after.json)、[照片之前](photo-before.json)／[之後](photo-after.json)。首屏是CDP encodedDataLength（包含HTTP標頭），等待點及URL明列；不代表Cloudflare CDN傳輸量或行動網路耗時。

測試過程沒有隱藏失敗：初次after取證的最後教學斷言因「作品與回報」收合而讀不到文字，修正腳本展開後重跑通過；舊photo-flow fixture尋找已移除按鈕而逾時，更新至現有Escape操作後通過。沒有更改產品行為來掩蓋測試。

## 重現

```sh
npm ci
npm run build
python3 -m http.server 4219 --bind 127.0.0.1 --directory dist
# 另一個終端
python3 scripts/asset-photo-browser.py --url http://127.0.0.1:4219/ --out artifacts/visual-review/budget-check --expect-budget
python3 scripts/asset-photo-browser.py --url http://127.0.0.1:4219/ --out artifacts/visual-review/legacy-check --transport-mode legacy --skip-photo
python3 scripts/asset-photo-browser.py --url http://127.0.0.1:4219/ --out artifacts/visual-review/missing-check --transport-mode missing --skip-photo
PREVIEW_URL=http://127.0.0.1:4219/ python3 scripts/photo-recovery-browser-check.py
node scripts/model-transport-check.mjs
```

需要Python3、Playwright、Chromium；WebP再產生才需要Pillow，遊戲不新增依賴。腳本使用Chromium／SwiftShader、DPR1；照片取證low畫質。冷載入基準是開始節點的預設畫質，之後才調low。before及verified都用同樣Python HTTP server、不額外壓縮JS／CSS；沒有把Vite preview自帶HTTP壓縮的另一組結果混進前後比較。

`window.__rainy711.debugJump`、`restoreChapter`、`tick`及711七次入口未改名或刪除。新腳本拍照走原開場、購餐與飛行；吐槽檢查用restoreChapter('terminal-deploy')後操作帳密、驗證與拉桿，沒有略過射擊前門檻。

## 審核與限制

沿用[performance-optimization Skill](../../../.agents/skills/performance-optimization/SKILL.md)的先量測、再修改、同條件比較方法；本輪測網路／編碼資料，沒有把軟體GPU當成手機FPS profiler。

另由不參與實作的唯讀reviewer獨立重跑19項傳輸檢查、比較海報像素、目視近照與吐槽條，並核對verified／prefix／legacy／missing和照片恢復證據，未發現blocker／major。這不是Claude外部簽核。

**仍未驗證：**iPhone Safari真機、真實觸控與背景返回、峰值RAM／GPU記憶體、發熱、FPS、200%文字、連續影片及聲音。沒有提供真機影片。解壓途中取消目前等內建解壓Promise結束後處理，不宣稱立即停止解壓；已測取消不會復活載入或誤啟回退。JPEG資料量減少不等於RAM同比減少。9MB預算只在本機標準路徑與明列條件下通過。
