# 玩家意見收集：Cloudflare Pages Functions＋D1

## 已完成與仍需設定

遊戲內已加入結尾「星等＋選填文字」，設定選單也有「意見與問題回報」。文字最多 1000 字，類型為整體感想、喜歡的地方、操作問題、想新增的內容。
API 由 Cloudflare Pages Functions 執行，D1 保存回饋。只有使用者的 Cloudflare 後台才能建立與綁定資料庫、設定管理密碼；程式推送不等於這些後台設定已完成。
在未設定後端時，文字送出會顯示失敗並保留分頁草稿。原本僅星等的 GA4 流程及略過功能仍可繼續，不會阻擋通關。

## 使用者只需設定一次

### 1. 建立 D1 資料庫與資料表

Cloudflare 左側「Storage & databases／儲存與資料庫」→「D1」→「Create database」。
資料庫名稱建議 rainy711-feedback，位置用預設即可。

進入資料庫 Console／主控台，執行 migrations/0001_feedback.sql 的內容建立資料表與索引。若主控台一次只接受一段 SQL，就按照分號分成三次執行（CREATE TABLE、兩個 CREATE INDEX）。不要刪除既有資料庫或資料表。
資料表名稱應為 feedback。

### 2. 綁定到既有 Pages 專案

Workers & Pages → endfield-model-lab → Settings → Bindings（有些介面在 Functions 區域）。
新增 D1 database binding：

- Variable name／變數名稱：FEEDBACK_DB
- Database／資料庫：rainy711-feedback

設定 Production／正式環境。正式 pages.dev 網址也可收件；分支預覽網址未列入來源白名單，不應綁定正式收件資料庫。分支預覽送出失敗是預期行為。

### 3. 設定作者管理密碼

同一 Pages 專案 → Settings → Variables and Secrets／變數與密鑰 → 新增 Secret：

- 名稱：FEEDBACK_ADMIN_TOKEN
- 值：由密碼管理器產生至少 32 字元的隨機密碼，建議 64 字元。

保存在你自己的密碼管理器，無需貼給 ChatGPT。不要加 VITE_ 前綴，不要把密碼放進 GitHub、網址、前端程式或公開截圖。
沒有資料庫綁定或管理密碼時，API 會回 503，不接受回饋也不公開資料。

### 4. 重新部署

綁定和密碼儲存後，到 Deployments → 最新正式部署 → Retry deployment／重新部署。
Pages 會自動編譯倉庫根目錄的 functions/。網站建置仍是 npm run build、輸出 dist，沿用現有網域、GA4 與 VITE_BASE_PATH=/。
public/_routes.json 只讓 /api/* 執行 Functions，靜態模型、圖片和遊戲頁不需要經過回饋後端。

## 作者在哪裡看

https://endfield10000t.aura87.online/feedback-admin.html

輸入剛才設定的管理密碼。這個頁面不是公開留言板；API 每次讀取都驗證密碼，未授權讀取回 401。新版將密碼以 UTF-8／Base64URL 封裝成 ASCII 標頭，支援中文、全形字與 emoji，不會直接將這些字元放入 HTTP 標頭；傳輸仍依賴 HTTPS 保護。管理頁可篩選有文字／全部、類型、星等，每頁 50 筆，可翻到更早回覆，或匯出目前這頁 CSV。
總筆數與平均星等是整個 D1 資料庫，不隨列表篩選改變。時間顯示台灣時間。
密碼只保留在管理頁的記憶體（登入嘗試期間保留於密碼欄位，成功或密碼不符後清空），不放網址、cookie 或瀏覽器儲存；重新整理後需再輸入，登出或離開頁面會清除顯示的內容。切勿把密碼提供給玩家。

## 玩家流程與失敗處理

- 有文字時，必須取得 API 成功回覆才顯示收到；離線、逾時、503、429 都保留草稿。
- 失敗後可重試、略過，或「只送星等，繼續（留言未送出）」；不會假裝文字已收到。
- 僅星等仍立即沿用原本 GA4 流程，另嘗試存入 D1；此背景寫入失敗不影響謝幕。因此 GA4 星等事件數與 D1 筆數不一定相同。
- 草稿存在 sessionStorage，通常保留在目前分頁的瀏覽器工作階段，不保證關閉分頁或瀏覽器後仍保留。瀏覽器不允許儲存時，只能在記憶體中保留。
- 相同內容重試沿用 UUID，後端避免重複存檔；編輯內容後視為新的提交。
- 設定選單的回報不強制選星等，方便尚未通關的人反映問題。
- 寫入成功會送 feedback_submit 統計事件，絕不把留言文字、管理密碼放進 GA4。

## 資料與基本防護

資料包含星等（可空）、文字、類型、時間、版本、劇情階段及 normal／chapter_replay／shortcut 狀態。無需玩家帳號，不儲存照片或戲內帳密。
伺服器用每日變動的來源雜湊做基本限制（每來源 10 分鐘 20 筆），不保存原始 IP；多人共用網路會共用額度。這是基本防洗版，不是完整的機器人辨識服務。
請求上限 8 KB、文字上限 1000 個 JS 字元、星等 1–5；固定允許正式網域、既有 Pages 主機與 GitHub Pages 來源。採參數化 SQL、原子寫入頻率限制、查閱密碼驗證、no-store 回應及受限 CORS。
作者頁以文字節點顯示留言；CSV 會處理公式開頭，避免開啟試算表時執行留言公式。
管理密碼同時參與來源雜湊，更新密碼會使既有管理登入失效，亦重設當日來源雜湊的限流分組。
此功能需要 Pages Functions 與 D1 額度，沿用 Cloudflare 帳戶方案與限制；程式不會替使用者升級或啟用付費方案。

## 驗收與排錯

node scripts/feedback-check.mjs
npm run build
python scripts/feedback-browser.py（先在 4195 開啟根目錄版本的 Vite preview）

後端測試使用真正 SQLite，瀏覽器測試攔截收件請求，不向正式資料庫發送測試留言。
完成後台設定後，請自行送出一筆「作者測試」，到管理頁確認收到，再測試失敗／重試、略過與正常謝幕。

- 503：檢查 FEEDBACK_DB、FEEDBACK_ADMIN_TOKEN（至少 32 字元）、資料表是否存在，以及設定後是否重新部署。
- 401：管理密碼不符，或尚未輸入 Bearer 密碼；不能用 GA4 ID 當管理密碼。
- 404／收到 HTML：檢查是否從 Pages Git 整合建置 functions/，而非只上傳 dist。GitHub Pages 本身不執行 API；前端已把 GitHub 網址的回饋送到正式 Cloudflare 網域。
- 429：短時間送出太多，等待後重試。

D1、管理密碼與正式收件的最後驗收，必須等使用者完成 Cloudflare 後台設定；不能把本機 SQLite 或 API 模擬測試當成正式收件成功。
