# 七項演出、桌機版面與分享卡：實作及保留限制

## 版本與發布

- 起點／修改前：`8ec95776c8f2797ee6815c3d0b4912162821bdcc`。
- 第一批演出程式：`fdd7b817f7173fcce656badc9355ef9ba913e994`。
- 第二批版面／分享卡：`b6c2df57461f852a67809705b3695ab94ff2b290`，包含第一批。
- 最終受評程式：`426ebbb86bfcbe342680bb99f1b66cfeb6c19271`，補上交餐→起飛的舊瞬移。
- 包含本資料夾的下一個交付commit只新增文件與精選證據，不改遊戲程式。沿用`ui-preview`／Cloudflare，不改main、DNS或正式部署設定。
- 發布網址：[開啟受評版本](https://94177c32.endfield-model-lab.pages.dev/)；Cloudflare Pages對`426ebbb`回報`completed/success`。

**七項均有實作；塞西嘴周與手指扣柄保留minor／partial，不宣稱全部美術細節已結案。** 保險／教室大型改裝、其他工程待辦不在此輪。角色、GLB、故事台詞、晚餐分支、發射按鈕與左側抖條保留。

## 修改與原問題對照

| 項目／原待辦 | 本輪改動與驗收狀態 | 證據 |
|---|---|---|
| 1 F01／塞西持板 | 自信、心虛、轉移話題分別有視線／頭肩／板高／手勢，眼→頭→身有時間差，跨cue緩動；把板移回左掌可達範圍，共用板框解IK。修137個局部唇面runtime法線、用原下唇骨輕抿嘴；**嘴周暗區仍可見，partial** | 01–03 |
| 2 BOOK手與書同框 | 保留6秒流程：0–1.35s手、書、臉同框；書從手旁飛往終端、展開電網，4.8s接登入。右手追實際書世界位置，左手保護晚餐。補修從持盤進BOOK第一幀跳手 | 04–05、14 |
| 3 抓柄／髮絲遮擋 | 側前略高固定鏡頭、前臂與紅柄同框；原髮絲骨小幅避讓，退出還原。catchGrip原接觸約束保留；**髮尾仍疊紅柄下支架、手指未完整扣柄，partial** | 06、10 |
| 4 D-F01其餘交盤 | 單雙手切換改0.65秒連續路徑，先收拇指、再讓承托掌移到盤中；原莊→龍與紫色還盤走既有劇情。獨立複核另找到交餐→起飛2.744m舊跳位，補首1.5秒位置與朝向接軌，入口盤位移2.11mm | 12–13、幾何數據 |
| 5 G-F01／G-F02演唱應援 | 改善原六組唱歌姿勢的銜接，手、身體、腳及表情有變化；應援有個別拍差、手腕遲滯、平滑群體同步，調整前景高度。牆上演唱不拔出洞、105°C唱歌不露手、兩句歌詞保留 | 07、11 |
| 6 桌機空側欄 | 僅walk-out且無對話面板時全寬，其他phase自然回原布局；實測1440px交餐→922px對話場景，沒有留下全寬class | 08–09 |
| 7 分享預覽 | 靜態OG／Twitter Card／canonical／180圖示；1200×630真實遊戲畫面＋HTML排版，JPG163,352bytes。Vite按Cloudflare預覽或GitHub子路徑產生公開絕對圖片網址。**LINE實際卡片與快取尚未驗證** | 分享資產與停JS測試 |

嘴部處理沒有新增補光、漂白貼圖或改GLB；局部法線採clone，原頂點位置／UV／權重及嘴內部法線保留。相較測試中的全skin emission方案，最終不使用該emission。沒有新增第三方套件、光源或後處理。

## 修改檔案

- 表演／接觸：`src/acting-beats.js`、`src/face-normals.js`（新增），`src/xaihi.js`、`src/performance.js`、`src/companion.js`。
- 書與鏡頭／應援：`src/connection-stage.js`、`src/mission-director.js`、`src/story-shots.js`、`src/concert-stage.js`。
- 桌機／分享：`src/responsive.css`、`index.html`、`vite.config.js`；新增`scripts/sharing-meta.mjs`、`public/images/og-rainy711-v1.jpg`、`public/apple-touch-icon.png`。圖示由原favicon輸出，沒有更換原favicon。
- 新增檢查／取證：`scripts/acting-check.mjs`、`scripts/acting-seven-browser.py`、`scripts/ascent-continuity-browser.py`、`scripts/share-card-capture.py`、`scripts/sharing-check.mjs`、`scripts/sharing-browser.py`。
- 更新真實動作測試：`scripts/tray-grip-check.mjs`、`scripts/opening-handoff-check.mjs`、`scripts/director-check.mjs`、`scripts/cinematic-check.mjs`。單手靜態fixture先等待新0.65秒動作完成；頭部動畫fixture改用實際delta，保留原接觸／動作斷言，不把暫停零delta當成動畫時間。
- 沒有更名或移除七次招牌、`debugJump`、`restoreChapter`、`tick`；僅增量提供bookPositionAt等內部取景資訊及debug讀取欄位。

## 圖片與來源

PNG不裁切、不補畫、不美化。01–11及13–14修改後來自**b6c2df5**的完整取證；最後426ebbb只追加起飛接軌，另以12-after及ascent-result驗證。修改前來自獨立8ec9577建置；12-before則取自補起飛前的b6c2df5。沒有把不同程式版本混稱同一版。

條件：Chromium SwiftShader、DPR1、低畫質。一般390×844，09／14為1440×900、10／11為844×390，08為1440×900。12、13來源JPEG82轉PNG，不增加原圖細節；其餘原生PNG。來源與SHA256見[evidence.json](evidence.json)。

| 編號 | 修改前 | 修改後 | 節點與差異 |
|---|---|---|---|
| 01 自信 | [前](01-satisfied-before.png) | [後](01-satisfied-after.png) | satisfied cue，後圖補拍睜眼幀；前後非相同毫秒 |
| 02 心虛 | [前](02-avert-before.png) | [後](02-avert-after.png) | avert cue，後圖約1.5s，前圖約0.9s；動畫另錄自cue0 |
| 03 轉移話題 | [前](03-redirect-before.png) | [後](03-redirect-after.png) | side-eye cue，掌心與板位可見 |
| 04 BOOK手勢 | [前](04-book-hand-before.png) | [後](04-book-hand-after.png) | terminal-deploy約0.9s |
| 05 BOOK展開 | [前](05-book-open-before.png) | [後](05-book-open-after.png) | terminal-deploy約2.4s |
| 06 最後握柄 | [前](06-grip-before.png) | [後](06-grip-after.png) | aim-final約12s；保留partial |
| 07 唱歌 | [前](07-song-before.png) | [後](07-song-after.png) | tour演唱起始，未拔出牆洞 |
| 08 桌機交餐 | [前](08-desktop-handoff-before.png) | [後](08-desktop-handoff-after.png) | walk-out共托，場景由64%回全寬 |
| 09 對話恢復 | — | [後](09-desktop-panel-after.png) | photo-talk回側欄，不再全寬 |
| 10 握柄橫屏 | — | [後](10-grip-landscape-after.png) | 844×390 |
| 11 演唱橫屏 | — | [後](11-song-landscape-after.png) | 棒子／臉／字幕可見 |
| 12 起飛入口 | [補修前B](12-ascent-before.png) | [最終C](12-ascent-after.png) | 交餐後首個起飛影格；搭配32Hz位置樣本 |
| 13 紫色生物還盤 | — | [後](13-reclaim-after.png) | 連續錄製中的中間姿勢，非獨立擺拍 |
| 14 BOOK桌機 | — | [後](14-book-desktop-after.png) | 1440×900 |

分享卡：[實際JPG](../../../public/images/og-rainy711-v1.jpg)；[180圖示](../../../public/apple-touch-icon.png)。封面來自walk-out3.067s、A晚餐的真實遊戲畫面，標題／漸層用HTML排版，不以AI圖替換人物。取景見[share-source.json](share-source.json)。

## 重現

環境：Node.js22+、Python3、Playwright、`/usr/bin/chromium`、Pillow與ffmpeg。`npm ci`後依既有流程建置／啟動：

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4232
python3 scripts/acting-seven-browser.py --url http://127.0.0.1:4232/ --out artifacts/visual-review/acting-seven/recheck --film --layouts
python3 scripts/ascent-continuity-browser.py
```

取證腳本展開載入詳情→直接進入，等actorsLoaded及載入層隱藏，再pauseForCapture、低畫質。以實際座標點正面711招牌七次解鎖，走公開debugJump與遊戲操作：

- `fridge`：實際後台操作到success／hot，依序讀四段對白，拍自信、心虛、唱歌與轉移話題；avert從cue0錄1.5秒，另驗暫停10秒頭部姿勢不跳。
- `chapter:terminal-deploy`：拍手勢／書本／電網及完整6秒；經真實登入`endfield`、`_`、`power`、`520`、`1314`，驗證、拉桿，錄莊→龍交餐2.6秒（交接本體1.2秒＋起飛後續）。
- `chapter:last`：依實際assist／attack／next走到aim-final12秒，拍握柄；發射後錄還盤2.7秒、tour14.4秒起錄7秒唱歌。
- 三版型重拍關鍵鏡頭；最後重開、走到桌機交餐→photo-talk，驗全寬／側欄恢復，再重播回ready。
- 補起飛腳本用`restoreChapter('terminal-deploy')`與同樣的真實登入流程，168筆32Hz更新快照、42張8fps影格。每筆托盤陣列獨立複製，避免共用可變array製造假尖峰。

分享測試：`node scripts/sharing-check.mjs`驗來源選擇、靜態標籤、HTTPS與路徑；`scripts/sharing-browser.py`以關閉JS的Chromium分別檢查4232根路徑及4233的`/endfield-model-lab/`建置。子路徑由既有`VITE_BASE_PATH=/endfield-model-lab/`建置，沒有變更部署設定。單元與停JS實測見[sharing-result.json](sharing-result.json)。

## 驗證結果與限制

- 全部50支`scripts/*check.mjs`通過，摘要見[checks.json](checks.json)；Build、Python語法檢查及根／子路徑建置通過。保留既有bundle體積提示，沒有宣稱FPS或首屏下載改善。
- 演出focused檢查51,180項、真GLB交接1,091項、握持66／66、Director491項等通過。A／B／C晚餐30／60Hz單雙手切換最大穿透3mm、最大掌腕步長30Hz2.92cm／60Hz1.47cm；不是全遊戲所有視角零穿透保證。
- BOOK舊入口右腕25.8cm跳位修正後，30／60Hz最大步長5.57／2.78cm。左掌與平板的校準目標誤差<1mm（骨架定位，不是全手蒙皮碰撞驗證），右手姿勢跨cue有緩動；這些量測不能代替圖片中的美感判斷。
- [browser-summary.json](browser-summary.json)：30個關鍵幀、三版型與五段連續錄製通過，pageerror與遊戲自動請求分享JPG均為空。正常遊玩不額外下載這張分享封面。
- [ascent-result.json](ascent-result.json)：原交餐→起飛一步2.744m，最終龍位移2.03mm／盤2.11mm；全部168筆最大單步11.96cm。真實場景完整5.25秒連續畫面經獨立重算與目視，起飛瞬移可關閉。前兩次試錄使用共用array造成假的托盤尖峰，已修正取樣並以新目錄重錄；那些數字不當作遊戲量測。
- 依game-cinematic-camera Skill，由另一位唯讀agent獨立跑focused檢查、目視三版型／連續抽幀、重算起飛樣本，結論**PASS，無新blocker／major**；嘴周暗區及髮絲／手指扣柄保留minor／partial。不是Claude或真玩家盲測通過。
- 完整MP4與中間幀留在忽略目錄`artifacts/visual-review/acting-seven/delivery/`及`ascent-verified-final/`，不加入public或Git；沒有外部影片連結。公開Git提供上述精選原幀、位置資料與可重跑腳本。
- iPhone已實測：無。真機切出返回、觸控、聲音、發熱、FPS／記憶體及LINE實際分享卡／快取刷新均未驗證。固定步進8fps輸出不是硬體8fps測量，也沒有音軌。
- 本機建置／Chromium驗證不等於線上實機驗證；本環境連pages.dev受網路代理限制，部署成功以對應commit的Cloudflare Pages check-run確認。

## 下一步

優先補iPhone實測。演出若再磨細節，集中處理塞西閉唇／嘴周與真正的手指扣柄：兩者要另做正面／側前近景、實際蒙皮接觸及完整起止驗證，不以更亮的燈或遮住握點當作完成。保險／教室大改與分享平台快取驗收保留。
