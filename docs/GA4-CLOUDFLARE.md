# 莊的晚餐：GA4 與 Cloudflare 上線交接

網站名稱：泡泡龍背鍋有限公司。遊戲名稱：《莊的晚餐》。
預定正式網址：https://endfield10000t.aura87.online/

## 目前完成與待辦

使用者已提供衡量 ID：G-S7LEGD7354。GitHub Pages 建置已明確指定此公開 ID。尚未修改 Cloudflare DNS、建立 Pages 專案或改變 GitHub 公開狀態。Cloudflare 仍需填入下述環境變數並綁定網域。
只在正式建置、指定主機名且有有效 ID 時啟用。指定主機為 endfield10000t.aura87.online 與 oloid666.github.io；localhost、Pages 分支預覽停用，避免測試混進報表。賽車入口沒有載入本模組。

## 使用者：建立 GA4

1. 到 https://analytics.google.com/ 用自己的 Google 帳號登入。
2. 建立帳戶「泡泡龍背鍋有限公司」，資源「莊的晚餐」，時區台灣、幣別 TWD。
3. 建立 Web 資料串流，網址 https://endfield10000t.aura87.online，名稱「莊的晚餐－雨夜」。網址尚未上線也能先建立。
4. 關閉該串流的「加強型評估／Enhanced measurement」；程式自行送出 page_view 與遊戲事件，避免自動表單、歷史頁面事件混入遊戲資料。
5. 提供 G- 開頭的衡量 ID 即可，不需提供帳號密碼、服務帳戶或私鑰。

## 程式設定

建置環境變數：VITE_GA4_MEASUREMENT_ID=G-S7LEGD7354。
本機可複製 .env.example 為 .env.local；本機預覽仍不送統計。無需 Firebase SDK、Firestore 或新後端。
GitHub Pages 在 .github/workflows/pages.yml 的 VITE_GA4_MEASUREMENT_ID 指定此公開 ID，無需變數管理權限。日後換 ID 時修改此設定並重新建置。
Cloudflare Pages 則在專案的建置環境變數填 VITE_GA4_MEASUREMENT_ID。它是公開前端 ID，不是私密 API 金鑰。更改後重新部署。

## Cloudflare Pages 與網域

1. Workers & Pages → 建立應用程式 → Pages → 連接 Git，選 Oloid666/endfield-model-lab。
2. 正式分支 main；建置 npm run build；輸出 dist；根目錄預設。
3. 正式環境變數：NODE_VERSION=22、VITE_BASE_PATH=/，加入 VITE_GA4_MEASUREMENT_ID=G-S7LEGD7354。
4. 部署並檢查 pages.dev 網址：街景、角色、照片、二樓與賽車入口。這個預覽網址不送正式統計。
5. Pages 專案 → 自訂網域 → 設定 endfield10000t.aura87.online，依精靈建立 DNS 與 HTTPS。遇到既有同名紀錄，先核對用途，勿直接覆蓋。
6. 等 Active，實際從自訂網址玩一次，再檢查 GA4 即時報表。
7. 新網站驗收通過後才能考慮將 GitHub 改私人；Cloudflare GitHub App 必須仍有讀取該倉庫的權限。現有 GitHub Pages 可能受帳號方案影響。

不新增 GitHub CNAME 檔：自訂網域是綁到 Cloudflare Pages。保留 GitHub 的 VITE_BASE_PATH=/endfield-model-lab/，Cloudflare 用 /，避免模型載入路徑錯誤。
Cloudflare 版本標記使用 CF_PAGES_COMMIT_SHA；GitHub 使用 GITHUB_SHA。

## 收集的事件

| 事件 | 意義 |
| --- | --- |
| page_view | 一次網頁載入，由程式送出一次 |
| game_loaded | 主場景、角色及初始載入完成 |
| game_load_failed | 初始化失敗，僅固定分類，不上傳錯誤原文 |
| game_start | 一次開始／重新開始／章節重看；不等於一位玩家 |
| chapter_reached | 本局首次到達 intro、cargo、terminal-deploy、rewind、last |
| main_story_complete | 正常遊玩到主線結尾；返回街角不重複記錄 |
| story_replay_complete | 透過章節接續／重看抵達結尾 |
| shortcut_used | 七下捷徑；隨後內容不列入正常通關 |
| bonus_enter | 實際進入二樓，可重複進入 |
| rating_submit / rating_skip | 提交 1–5 星／略過；只送數字，不送文字 |
| content_complete | 完成二樓謝幕，含捷徑／重看，按 play_mode 區分 |
| game_complete | 正常主線＋二樓謝幕完成，每局一次 |
| play_time | 可見、未手動暫停／開選單的遊玩時間，二樓也計算 |

每個事件附 game_id=rainy711、build_version、play_mode、run_number。
play_mode 為 normal、chapter_replay、shortcut。is_replay 表示本頁本次開啟內是否重玩，非跨裝置身分。
active_seconds 是本局累積秒數，不要把各事件的累積值相加。
play_time 的 active_seconds_delta 才是可加總的增量，每約 30 秒、結尾、離開頁面或切背景時送出；背景時間、暫停及載入前時間不算。強制關閉／斷網仍可能遺失尾端事件。
評分是「提交事件」統計，允許玩家修改重送，不是每人一票的資料庫或排行榜。

## GA4 看報表

- 即時報表先驗證 game_loaded、game_start；一般報表處理通常需要 24–48 小時。
- Admin → Custom definitions 可新增事件範圍維度 chapter_id、play_mode、build_version、rating。
- 自訂指標 active_seconds_delta：單位秒，只加總 play_time 的增量。
- 可把 game_complete 標成重要事件；分析正常玩家時使用 game_start 且 play_mode=normal，通關用 game_complete。GA4 的使用者指標才是估計人數，事件次數是遊玩次數。
- 廣告與 Google signals 關閉。尊重瀏覽器 DNT/GPC；封鎖器、離線、未啟用統計都可能造成低估。
- 照片、戲內帳號密碼、對話內容不送出。網頁 URL 移除任意 query/hash，只保留格式受限的 UTM；不設定玩家 user_id。
- 設定頁在啟用時顯示統計用途；尚未設定時不顯示已啟用文字。

## 脆文來源連結

終末地玩家：
https://endfield10000t.aura87.online/?utm_source=threads&utm_medium=social&utm_campaign=dinner_launch&utm_content=endfield

AI 製作者：
https://endfield10000t.aura87.online/?utm_source=threads&utm_medium=social&utm_campaign=dinner_launch&utm_content=ai_creators

## 驗收

node scripts/analytics-check.mjs
npm run build

本機、空 ID、錯誤 ID、DNT/GPC 不應請求 Google。
有 ID 的正式來源測試應攔截 Google 程式，使用測試 ID，避免污染真人報表。
正常開始→章節→主線→二樓→評分→謝幕，應各自記錄；七下捷徑／章節重看不得觸發 game_complete。
暫停、背景、重玩和返回街角不能造成時間暴增或通關重複。
統計被封鎖或拋錯時，遊戲仍可載入、按鈕可操作。
實際 Google 收件需在正式網址開遊戲並核對 GA4 即時報表；DNS/HTTPS 驗證仍需等 Cloudflare 網域設定完成。本機測試不能代替。
