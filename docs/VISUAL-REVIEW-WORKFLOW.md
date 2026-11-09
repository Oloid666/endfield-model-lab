# 分段品質取證與評分

目標：用有限的圖像分析找出會影響觀眾理解、角色個性與畫面質感的短板，保留同條件證據，供修改後複驗。本輪僅建立工具與基準；不改角色、故事、玩法或部署。

## 工作方式

1. 報告列出全遊戲17個區段。尚未擷取的區段標示「待擷取／未評分」，不能填0分或預測分數。
2. 每個已檢查節拍都列出目標、分數、證據、限制，不能只挑好看的畫面。
3. 每個已發現缺點都保留「證據→觀眾影響→怎麼改→驗收」。另外選最多3項優先修正；這個上限不會刪掉其他發現。
4. 修改後重跑相同設定，先看畫面再看改動說明。原程式／素材未變的重拍不能宣稱改善。
5. 一個節拍允許跨數個鏡頭。畫外對白、數字插入特寫、安靜停頓都可成立，不強制每句露臉或每鏡頭運動。

## 取證與用量

第一個完整離線影片路徑是冰箱105°C，設定在 `scripts/visual-review-fridge.json`；第二輪新增五處固定節點截圖路徑，第三輪補齊17段，執行方式見本文末。冰箱每次先評8張585×1266 JPG，影片及原始狀態留在本機。遇到眨眼等抽樣疑點，最多從相同影片補抽2張，不把每幀送進模型。其餘區段以稀疏節點截圖取證，不冒充連續影片。

瀏覽器擷取、FFmpeg編碼與整理報告不呼叫模型API。由本對話中的Codex讀取證據並填寫 `review.json`；腳本不會自行判斷美感，也不會自動寫出高分。模型讀圖、工具調度及文字分析仍會使用Codex額度；本工具沒有精確Token計數器，不宣稱固定費用。

目前影片是12fps的固定場景時鐘離線擷取，沒有音訊，也不是iPhone效能證據。可以回看狀態與關鍵姿勢順序，不能替即時流暢度、聲音同步、玩家實際停頓打分。CSS動畫採真實擷取時鐘，不能用此影片測量其播放時長。完整節奏欄預設留空，程式拒絕替離線資料填入此欄分數。

使用真實遊戲鏡頭、角色與UI，透過已有的七下解鎖與快速測試進入。等待通知自然退場，不修改CSS隱藏干擾。快速測試按鈕仍會出現在畫面，因此不能據此評斷未解鎖玩家的正常UI。後續正式驗收應另補正常流程與iPhone Safari。

## 執行

沿用既有Node/Vite；錄製另需Python3、Python Playwright、Chromium、FFmpeg。雲端環境已有這些工具。本工具未增加遊戲npm相依，也不需要API Key。

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4204 --strictPort
```

另一個終端：

```sh
npm run review:capture -- --out artifacts/visual-review/fridge-before
```

輸出目錄必須是新目錄，避免覆蓋前一版。擷取失敗會留 `packet.json` 與失敗原因，不能產生已完成的評分報告。

- `preview.mp4`：固定場景時鐘的離線片段。
- `frames/01.jpg` 至 `08.jpg`：與影片相同畫面的關鍵幀。
- `packet.json`：版本、程式／素材指紋、設定、時間碼、實際溫度、鏡頭、角色狀態及錯誤。
- `review.json`：初始為未評分；本對話讀圖後填入分數與全部缺點。
- `report.html`：手機／桌面可讀的完整報告。
- `report.md`：可貼給其他評審的文字報告。

填妥評分後重新產報告：

```sh
npm run review:report -- artifacts/visual-review/fridge-before
```

遇到單幀恰逢眨眼，先查時間碼，在附近補抽，不能直接把閉眼判成表演失敗：

```sh
python3 scripts/visual-review.py extract artifacts/visual-review/fridge-before --frame 130 --id 05a --title "反應相鄰影格"
```

實際影格號以該次 `packet.json` 與影片為準；補圖會註明解碼時間，沒有對原遊戲擺姿或修圖。

下一版重跑，再對照：

```sh
npm run review:capture -- --out artifacts/visual-review/fridge-after
npm run review:compare -- artifacts/visual-review/fridge-before artifacts/visual-review/fridge-after --out artifacts/visual-review/fridge-compare.html
```

設定與節拍不一致會拒絕比較。對照頁不自動宣稱改善，也不以像素差異替代品質判斷。若修改擷取時機或流程，需建立新profile ID並重錄基準。生成物位於git忽略目錄，不會進入 `public/` 或正式網站。

## 評分規則與驗證

敘事清楚度、角色表演、構圖美感、節奏連續性分開評，1＝意圖難懂，3＝能懂但支援不足，5＝清楚、有個性且吸引人。不適用或證據不足用null／破折號，不算平均分。例如溫度特寫不要求人物表情，也不能因此把表演打1分。

穿模、重要資訊被遮、操作失效、卡住另列必修。不得用漂亮畫面抵銷功能問題。每項缺點必須引用真實圖片編號；改法是下一階段提案，不能寫成已完成。

```sh
npm run review:test
```

護欄測試涵蓋未知分數、漏掉節拍、虛構證據、不相容比較、離線資料誤評節奏，以及相同程式被誤報改善。

## 第一輪基準與交付

2026-11-08已完成冰箱基準：`artifacts/visual-review/fridge-baseline-02/`，24.33秒、12fps、292影格；8個固定節拍，另由同一影片補抽2張，排除眨眼誤判並核對升溫切鏡。填入本對話的靜態評分與7項缺點；不是外部獨立評審。其他16段尚未擷取／評分。

優先項目為塞西心理轉折、龍泡泡驚訝表情與遮嘴、最高溫讀數停留。影片中升溫特寫的切鏡前補圖是104°C；程式雖有升溫，尚未保留105°C的閱讀節拍，不能只看程式就當作畫面已充分展示。

12項護欄測試、Build通過；Build保留既有的大型chunk提醒。報告於390×844、844×390、1440×900檢查無頁面橫向溢出、10張證據圖載入與7項缺點完整；同版本比較頁正確提醒不能宣稱改善。iPhone遊戲操作、實機FPS與聲音同步尚未驗證。

本輪修改範圍：

| 檔案 | 用途 |
|---|---|
| `scripts/visual-review.py` | 擷取、有限補抽、報告、同條件前後對照；不呼叫模型API |
| `scripts/visual-review-fridge.json` | 固定目標、尺寸、畫質、節拍與8張取樣位置 |
| `scripts/test_visual_review.py` | 12項評分與證據護欄 |
| `package.json` | 新增4個review指令，未增加相依套件 |
| `.gitignore` | 排除本機影片、圖片與報告 |
| `README.md` | 新增取證工具入口 |
| 本文件 | 評分目標、成本控制、限制與執行方式 |

遊戲 `src/`、模型、故事、頁面與正式部署未修改。二進位證據不進Git與網站；需要跨工作階段保留時，保存輸出的ZIP或另用經授權的artifact儲存方式。

## 第二輪：五處初評

2026-11-09新增莊拿晚餐、拍照／相簿、妮姬電腦、紫色生物出場與拒絕、拋餐與發射前半，共19張固定節點截圖。這輪沒有錄影，節奏欄全部留空。已評內容連同前輪冰箱共6個區段；其他11段待取證，已評區段亦須依各自限制補連續性與操作驗收。

```sh
python3 scripts/visual-review-five.py --out artifacts/visual-review/five-before
```

沿用同一個Chromium、390×844、DPR1.5與balanced畫質，等待解鎖通知自然消失，僅在19個檢查點渲染。D03明確標為手動道具檢視，不當作正常分鏡；R06約2秒的finisher近景亦不宣稱已拍到離手或爆炸。

讀圖填好五份 `review.json` 後：

```sh
python3 scripts/visual-review-summary.py --batch artifacts/visual-review/five-before
```

會驗證五處是同一程式／素材版本，再產生逐段完整報告與一份總表；整段初評是依本次目標判斷，不是逐圖分數平均。總表只將同版本且確實讀圖評分的其他區段列為已取證，避免把舊版或失敗資料混算。

本輪新增9項建議。已保留的成果包含晚餐細節、清晰近照、通俗木馬說明與遮眼、拒絕梗、紫色生物實體比讚。優先修正為掌根承重可讀性、拒絕梗的臉部表演與取景、發射準備時的握柄可讀性；比讚氣泡遮手可做小範圍修正。這些尚未實作。

本輪工具新增 `scripts/visual-review-five.py`、`scripts/visual-review-summary.py`；通用報告支援純截圖並拒絕補抽不存在的影片，新增一項護欄測試。遊戲程式與素材未修改，未部署。

驗證：13項護欄測試與Build通過（保留既有chunk大小提醒）；總報告在390×844、844×390、1440×900無頁面橫向溢出，19張圖與9項建議完整；五份個別報告在390px檢查圖片載入且沒有虛構影片播放器。輸出位於 `artifacts/visual-review/five-baseline-01/`，含PDF、HTML、Markdown、逐圖分數、截圖與原始狀態。

## 第三輪：17段全遊戲初評

2026-11-09補齊其餘11段，並補拍電網搜尋、微波三輪、正常路徑還盤與彈指等缺口。總計17段、88張圖、25項問題與候選改善；冰箱段沿用同版本24.33秒無聲離線影片，其餘為固定節點截圖。八題小學堂均有逐題分數，保險走完一條理賠分支，結尾採略過留言且未發送任何回饋。

```sh
python3 scripts/visual-review-finish.py --out artifacts/visual-review/all-before
# 中斷後在程式／素材版本相同時續跑；舊圖不覆蓋。
python3 scripts/visual-review-finish.py --out artifacts/visual-review/all-before --resume
```

這個補齊工具預設依賴已完成且同版本的 `fridge-baseline-02/` 與 `five-baseline-01/`，可用`--fridge-source`與`--five-source`指定新一輪來源。若來源不存在或版本不同，會停止並要求先重拍來源，不下載舊證據冒充新版本。續跑只保留已存在樣本並補缺口，不是重跑後的全新基準。首次建立新版本時應先重跑前兩個工具到新資料夾，完成評分再補齊；其餘11段的路徑在 `scripts/visual-review-finish.py`。

讀完原圖、填好每段 `review.json`，並以原始截圖製作帶編號的 `contact.jpg` 後：

```sh
python3 scripts/visual-review-summary.py --batch artifacts/visual-review/all-before --all
npm run review:test
npm run build
```

`--all`拒絕缺少任何一段、未完成取證、尚未評分、不同來源版本或缺少證據總覽的輸出。每份評分包含本段分數、逐圖分數、優點、檢查結果、缺點、相關檔案、可執行改法和驗收條件；證據不足不補滿分數，也不要求每段硬湊缺點。原圖不修臉、不換姿勢、不美化，contact只縮圖加編號。

目前輸出在 `artifacts/visual-review/all-baseline-01/`。報告最先列出兩個確認錯誤：紫色生物還盤後托舉狀態復發，以及小學堂第7題殘留正五十。第一輪表演建議是冰箱心理反差、端盤承重、拒絕梗與唱歌姿態。保險與小學堂大型場景依先前安排暫緩，只列小範圍板書和取景提案。

取樣曾因預載暫停故事時鐘、略過留言跳卡片、重複close選擇器而中斷，修正的是取證程式；這些不列為遊戲缺點。Q04更正為預載入場，T03更正為彈指前，H06/H07更正為輪間狀態。T05～T07另用正常出生流程取證，避免以捷徑狀態推論生物行為。失敗歷程保留在`capture-retry-history.json`，完成資料的`errors`與`feedback_posts`均為空。

本輪16項證據護欄測試及Build通過，保留既有chunk大小提醒。總報告檢查390×844、844×390、1440×900無頁面橫向溢出，17張證據總覽和25項建議完整；17份逐段報告的88張原圖均載入，只有冰箱段有實際影片播放器。PDF含總表、全段建議、圖片總覽與小學堂逐題評分，ZIP保留原圖和JSON供下一輪同節點對照。

驗證僅針對取證、報告與本次走過的路徑；沒有完成全分支、所有對白、iPhone Safari、長按選字、背景返回、聲音或實機效能測試。所有節奏分數仍空白，不輸出虛構留存率。沒有新增模型API費用、相依套件，亦未修改遊戲`src/`、素材、故事或部署。
