# 評審交付：2f5c6fd

本資料夾是提交者的修改索引與證據，不是Claude通過聲明。請依指定程式、原圖及自己的本機重現判斷。

## 版本與本次補件

- 受評程式commit：`2f5c6fd25fb8d97476933fc372f705f5aedc7882`，分支`ui-preview`。
- 修改前比較commit：`c88911624c23d19e3195868095791484e62aa8ee`。
- 最終回報的交付commit是受評commit之後的證據補件；遊戲`src/`、`public/`、頁面、依賴與部署設定不變。額外改動是交付文件、PNG、來源索引，以及取證runner的`--browser`參數，方便獨立環境指定Chromium。
- 本資料夾用受評程式短碼命名，並非要求資料夾名稱等於包含自己的證據提交hash。
- 受評版本的固定發布快照：[Cloudflare 2f5c6fd](https://effca04d.endfield-model-lab.pages.dev/?v=2f5c6fd)。平台部署紀錄已確認成功；本環境無法直連pages.dev。Claude不必使用這個網址。
- 更新中的分支預覽：[ui-preview](https://ui-preview.endfield-model-lab.pages.dev/)。請以Git commit鎖版本，避免之後的分支更新混入評審。

## 本輪修改與上一輪問題編號

原編號來自17段初評。沒有編號的保留行為明列為回歸檢查，不新增虛構缺點。

| 原問題編號 | 實際改動與需要核對之處 | 修改檔案 | 圖片編號 |
|---|---|---|---|
| F03 | 105°C落定後保留0.65秒，再進反應對白；時間是試調值，須自行看是否足夠，不能只看常數 | `src/vcr-tablet.js` | 02 |
| F02 | hot第一句明確觸發shock；動作來源／年齡沿控制器傳遞；隱藏晚餐時停止用端盤姿態覆寫反應；驚訝眼嘴及掌位改得更可辨 | `src/vcr-tablet.js`、`src/mission-director.js`、`src/performance.js`、`src/companion.js` | 03、05 |
| F01 | 區分自信、心虛、轉移的眼神、頭身、持板高度；3/4近景露眼。這是部分改善，心理意圖是否足夠仍請獨立判斷 | `src/xaihi.js`、`src/story-shots.js` | 01、04、06 |
| F05 | 完整平板對話改為block及balanced換行，處理模／式孤字；普通逐字對話不套這個規則 | `src/mission.js`、`src/ui-refinement.css` | 04 |
| T-F01 | 還盤完成後鎖存放手狀態，不再跨段恢復托舉；重用地面路徑返回微波爐附近，讀取實際房屋破壞／復原狀態 | `src/meal-remnant.js`、`src/world.js` | 09、10、11、12 |
| R-F02 | 👍氣泡移往實體拇指的另一側，保留原表情符號順序 | `src/creature-communication.js` | 08 |
| C-F01 | 保留洛西模型及矮機櫃，僅提高特寫觀看位置，避開臉前窗框 | `src/story-shots.js` | 07 |
| K-F01 | 第7題講解的正五十改正一百零五，保留8題及全進度 | `src/bonus-data.js` | 13 |

回歸：冰箱唱歌仍不露手／麥克風；普通端盤及最後發射的手位不應受反應修正影響；重新開始清除生物與七下解鎖。

尚未處理：D-F01端盤掌面／盤底接觸、H-F02拒絕梗、G-F01/G-F02演唱／應援；F06平板握持辨識、F07嘴部暗影仍有缺口。F04亮背景HUD、實機操作及聲音也不能從這次文字宣稱通過。保險／學堂大型場景未重做。

## 編號截圖

全部檔案可直接用Git取得，無須本工作區的`artifacts/`。前後是同一故事節點的取樣，並非同一影片的逐像素對照；時間與來源限制見表及`evidence.json`。

| 編號／節點 | 修改前 | 修改後 | 核對重點／限制 |
|---|---|---|---|
| 01 success：嗯，有降 | [before](01-fridge-success-before.png) | [after](01-fridge-success-after.png) | 自信的視線、臉部可讀性；與04、06一起看，不能只因鏡頭拉近就判演技完成 |
| 02 105讀數落定 | [before](02-fridge-reading-before.png) | [after](02-fridge-reading-after.png) | 前圖是舊影片切反應前最後補幀104；後圖是defrost約3.9秒的105停留，不是要求相同秒數得相同讀數 |
| 03 shock：正一百零五 | [before](03-fridge-shock-before.png) | [after](03-fridge-shock-after.png) | 前圖已排除眨眼；檢查後圖的眼、嘴、掌位與意圖 |
| 04 avert：忘改預設模式 | [before](04-fridge-avert-before.png) | [after](04-fridge-avert-after.png) | 眼睛是否露出、是否讀得出避視；換行、握持與嘴部暗影一起查 |
| 05 song：105°C歌詞 | — | [after](05-fridge-song-after.png) | 回歸圖：完整兩句、無手、無麥克風；不是新增表演的前後比較 |
| 06 side-eye：先熱便當 | — | [after](06-fridge-redirect-after.png) | 與01、04比較頭、眼及持板，不靠台詞替情緒加分 |
| 07 洛西特寫 | [before](07-figurine-before.png) | [after](07-figurine-after.png) | 眼口與髮飾、窗框、原模型與擺放位置 |
| 08 保管員👍 | [before](08-rescue-thumb-before.png) | [after](08-rescue-thumb-after.png) | 表情符號、實體拇指、盤底都可辨；約救餐9.3秒 |
| 09 復原後 | [before](09-post-rebuild-before.png) | [after](09-post-rebuild-after.png) | 手有沒有再抬起；前後擷取秒數稍異，後圖生物已離開原位 |
| 10 還盤後約2.45秒 | — | [after](10-meal-reclaim-after.png) | 手先放下，配合09查下一段是否復發 |
| 11 回到微波爐附近 | — | [after](11-microwave-return-after.png) | 約再過40個場景秒；街角遠景看不清全部路徑，請另看狀態／自己重現，不把遠圖當作路徑逐幀證明 |
| 12 重新開始 | — | [after](12-restart-after.png) | ready、出生與解鎖重設；本圖不代表真機切App測試 |
| 13 小學堂第7題 | [before](13-classroom-microwave-before.png) | [after](13-classroom-microwave-after.png) | 兩圖都是第一張分析卡，正五十與正一百零五；後圖本次補拍 |

### 圖片條件與來源

- CSS viewport **390×844**，DPR **1.5**，一般輸出**585×1266**；balanced畫質，無頭Chromium／SwiftShader，無音訊。
- 本環境瀏覽器為Chromium 154.0.8037.57。獨立環境請具備繁中字型（例如Noto CJK TC）；瀏覽器及字型差異可能影響文字換行，應記錄差異。
- 圖片包含七下解鎖後的快速測試按鈕；正常未解鎖玩家不一定看到它。評估一般玩家HUD時，另用新頁面正常流程取證。
- 舊02、03是影片補幀，編碼補齊偶數寬後為**586×1266**；未裁切為585。這不是不同手機比例。
- 13-after為原生Playwright PNG。其餘是前輪實際JPG截圖／補幀解碼後無損轉存PNG，保留每個RGB像素，不銳化、不縮放、不合成，也不宣稱轉PNG能增加細節。
- 多數after取自先前最終取證。當時尚未提交實作，記錄的Git HEAD仍是c889116；**runtime指紋**與受評2f5c6fd一致。第13題after直接在2f5c6fd補拍。原始來源、指紋、尺寸與雜湊保存在[evidence.json](evidence.json)。
- 修改前來源是c889116的遊戲；當時取證工具／package測試指令尚有未提交變更，不能聲稱整個工作樹完全乾淨。遊戲src／public／index在該輪取證時未改。
- 修改後runtime SHA-256：`f2bf235fcd61dbd0cdcfa044d6e07cedddfe902abd270c9904c520a166d10cf3`。交付補件不得改變這個指紋。

## 在Claude的環境重現

### 取得與啟動

```sh
git clone --branch ui-preview https://github.com/Oloid666/endfield-model-lab.git
cd endfield-model-lab
# 再checkout使用者提供的交付commit，避免之後分支前進。
git checkout --detach <交付commit>
npm ci
npm run dev -- --host 127.0.0.1 --port 4213
```

Node.js 22+；Three.js維持0.180.0。無須API Key或後端即可檢查主線與教室，請勿送測試回饋。

可使用自己的Playwright runner。現有重點路徑也可直接跑：

```sh
# 另一個終端；若已有Playwright與Chromium，可略過環境安裝。
python3 -m venv /tmp/rainy711-review-venv
. /tmp/rainy711-review-venv/bin/activate
python -m pip install playwright
python -m playwright install chromium
python scripts/review-synthesis-browser.py --url http://127.0.0.1:4213/ --out /tmp/rainy711-review-new
```

本輪交付runner優先尋找系統`chromium`／`chromium-browser`，找不到就使用Playwright管理的瀏覽器；亦可傳`--browser /實際路徑/chromium`。若主機缺共享函式庫，依自己的環境安裝Playwright系統需求。這個runner不依賴本機舊artifact，會額外取橫屏與桌面圖；沒有重跑全部17段。

### 既有API：本輪未改名、未改參數

| 入口 | 用法／注意事項 |
|---|---|
| `window.__rainy711` | 等待`actorsLoaded`且`#loading`已隱藏；載入詳情的直接進入只提出要求，不代表模型已就緒 |
| 七下招牌 | ready或通關街角，點真正正面711招牌七次；新頁面記憶體解鎖，重新開始／重新整理清除 |
| `debugJump(id)` | 七下解鎖後`await`；回傳成功與否，禁止直接改私有狀態冒充入口成功；塞西入口會等待模型 |
| `restoreChapter(id)` | 正常章節接續入口；依已解鎖章節紀錄使用。新頁測試優先用已列出的debugJump章節ID，不假設全部正常章節已解鎖 |
| `pauseForCapture()` | 停止自動RAF，之後自行tick；不是`missionPause(true)` |
| `tick(time, delta, render)` | 傳遞單調的場景來源時間；render=false可推邏輯、最後render=true拍圖。不要把毫秒當秒 |
| `missionPause(bool)` | 手動暫停／恢復；資產預載另有暫停理由，須等`mission.paused`為false |
| `missionNext()`／`tabletAction(id)` | 正常對話／平板輸入；注意reading gate、busy與模型預載，不能每幀跳過 |
| `missionReplay()` | 回真正ready並清除出生與快速測試解鎖 |

可用debugJump ID：`fridge`、`nikke`、`birth`、`figurine`、`first-restore`、`claims`、`classroom`、`rating`、`street`；主線章節為`chapter:intro`、`chapter:cargo`、`chapter:terminal-deploy`、`chapter:rewind`、`chapter:last`。

第一次解鎖可照以下Playwright步驟，無須固定像素座標：

```python
await page.locator('.loading-details summary').click()
await page.locator('.loading-skip').click()
await page.wait_for_function("window.__rainy711?.actorsLoaded && document.querySelector('#loading').hidden")
await page.evaluate("__rainy711.pauseForCapture(); __rainy711.frameView('street'); __rainy711.tick(__rainy711.time, 0, true)")
for _ in range(7):
    point = await page.evaluate("""() => {
      const q=__rainy711, p=q.projectPoint([0,3.1,2.23]);
      const r=document.querySelector('#scene').getBoundingClientRect();
      return [r.x+(p[0]+1)*r.width/2, r.y+(1-p[1])*r.height/2];
    }""")
    await page.mouse.click(*point)
    await page.evaluate("__rainy711.tick(__rainy711.time+.1, .1, true)")
await page.wait_for_function("__rainy711.debug.unlocked && document.querySelector('.bonus-toast').hidden")
```

無頭啟動參數：`--no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader --disable-dev-shm-usage`。容器若已有沙箱支援，可依自己的環境調整；這些是測試瀏覽器參數，不是遊戲機制。

手動推時間範例（秒）：

```js
function advance(seconds) {
  const q=window.__rainy711, n=Math.max(1,Math.ceil(seconds/.05));
  for(let i=0;i<n;i++) q.tick(q.time+seconds/n,seconds/n,false);
  q.tick(q.time,0,true);
}
```

### 指定段落

- **01–06冰箱**：`await debugJump('fridge')`；完整找方法／登入冰箱與apply路徑在`scripts/review-synthesis-browser.py`。查`mission.tablet.stage`及`dialogue.cue`，依序是success/satisfied、defrost、hot/shock、avert、song、side-eye。defrost約3.9秒為02-after；hot各cue約1秒為03、04、06，song約3秒為05。每次操作先留0.35秒並查busy。
- **07洛西**：`await debugJump('figurine')`，用missionNext推到`mission.node.cue === 'rossi-closeup'`，再留1秒。
- **08–12救餐與還盤**：**不要只用chapter:last驗出生狀態**。本輪after先`debugJump('birth')`，完成出生對白，再沿正常回放結束→last→aim-final→發射→landing→meal-reclaim→tour→complete→首次復原。拍08時救餐age約9.3秒；到12秒才允許發射。讀`staging.remnant`及`mission.trayOwner`，還盤約2.45秒先看手放下，再看tour、復原後是否復發。09-after在首次復原推34秒後，11再推40秒；生物距微波爐落地點約0.22公尺。修改前09來自前輪完整微波路徑，兩者均born=true，但不是整條路徑完全相同的A/B錄影。
- **13教室**：`await debugJump('classroom')`→tick約2秒→點`[data-action="class-menu"]`、`[data-action="class-reset"]`。以`[data-action="class-next"]`逐卡推進；class-wait／class-stamping推時間，直到`bonus.route === 'lesson' && bonus.lesson === 'microwave' && bonus.page === 1`。留6秒顯示全文後拍圖。它是第7題，不是把全課進度改成7題。

## 自測、實機與影片界線

| 類型 | 實際範圍／結果 |
|---|---|
| 程式檢查 | 受評2f5c6fd已跑44組`node scripts/*-check.mjs`，包括真實GLB控制器；全部退出0。可重跑`scripts/review-synthesis-check.mjs`、`actor-check.mjs`與`vcr-tablet-check.mjs` |
| 證據護欄 | `npm run review:test`的16項通過，並不評估畫面美感 |
| Build | 受評版本及本次證據補件的`npm run build`均通過；既有大型chunk提醒保留。已確認21張docs圖片均未進入dist |
| Chromium | 先前最終版28張跨三版型取證，加上本次原生PNG的第7題補拍；無pageerror，未送出回饋POST。是重點路徑，不是全遊戲所有分支 |
| iPhone已實測 | **無**。使用者之前提供的手機畫面不當作本輪2f5c6fd實機驗收 |
| iPhone尚未實測 | Safari構圖／觸控、真實切App返回、長按、雙指、系統大字、聲音、幀率、發熱與記憶體 |
| 真機影片 | **未提供，無外部連結及時間碼**。中間版本的離線無聲影片不是最終版真機影片，不拿來代替 |
| Claude待核對 | 構圖、眼嘴與道具接觸、前景／UI遮擋、模型穿模、已跑路徑能否重現。表情意圖與節拍仍可判未改善或證據不足 |

原GLB、角色名稱、兩份便當的故事關係與玩法均保留。照片解謎、額外白閃、音樂、Hit Stop與二樓大型重做未加入本輪。
