# 外部評審與受指派實作交付

本目錄存放Claude可透過公開Git直接取得的每輪證據。未受指派實作時維持唯讀評審；受指派時可在指定工作分支提交程式與證據，不自行整合或部署。Codex主控核對與發布。評審結論須根據指定版本、圖片與本機重現，不以任何實作者的完成敘述作為通過依據；Claude不需要連pages.dev。

## 每輪的版本關係

1. Codex完成實作與驗證，將程式commit推至`ui-preview`。
2. 以受評程式的短commit建立`docs/review/<短commit>/`，填README並加入精選編號PNG。
3. 若證據在程式提交後補上，用下一個只含證據／文件／交付工具的commit提交，保持遊戲程式與受評commit一致。這個commit是提供Claude的「交付commit」。不改寫歷史。
4. 最終只回報交付commit與當輪README路徑。Claude checkout交付commit即可同時取得相同程式和證據；README亦提供純程式commit供diff。

資料夾不使用「包含自己README的commit」命名，避免hash自指。受評commit、比較commit、取證時的dirty工作樹資訊必須如實記錄；不可把不同遊戲版本的圖混稱同版本。

## 必要內容

- `README.md`：按[TEMPLATE.md](TEMPLATE.md)列明修改與原問題編號、檔案、重現方式、證據與驗收界線。
- 編號PNG：例如`03-fridge-shock-before.png`與`03-fridge-shock-after.png`；保留原圖，不修臉、修姿勢、合成或美化。
- 截圖條件：CSS viewport、DPR、實際像素、瀏覽器／渲染方式、畫質、入口、故事階段／時間。前後不是完全同秒數時明說。
- 若PNG由既有JPEG轉存，標明來源與轉存方式，不宣稱提高了原圖細節。原生PNG亦註明。
- 真機影片過大時提供經授權的外部連結、裝置及時間碼；沒有影片就寫未提供，不捏造連結。
- iPhone「已實測」與「尚未實測」分列。無頭Chromium不是iPhone，不替聲音、手感或實機FPS背書。
- 可選`evidence.json`：圖檔雜湊、尺寸、來源版本與狀態，方便核對資料，不能代替看圖。
- 每輪只選本次改動與必要回歸的圖；一般每項一組前後，不重複提交整個遊戲或所有影片影格。

## 重現入口的維護

保留`window.__rainy711.debugJump(id)`、`restoreChapter(id)`、`tick(time, delta, render)`與正面711招牌七次解鎖。各輪列出可用ID、載入等待與相機／時鐘條件；改名或流程變更必須在當輪README附舊→新對照。

可重用現有`scripts/review-synthesis-browser.py`重現重點段落。獨立環境需自行具備Node.js 22+、Python 3、Playwright與Chromium，不能假設對方有本工作區的全域套件或私有artifact。

圖與影片放`docs/review`或外部連結，不能放`public/`增加遊戲首次下載量。大量中間畫面仍在忽略的`artifacts/visual-review/`；公開交付所需的精選證據必須另行提交到本目錄。

## 已補交的輪次

- [2f5c6fd：105°C反應、還盤狀態與遮擋修正](2f5c6fd/README.md)
- [d5721c1：D-F01莊端托盤的手與盤接觸（Claude原實作與證據）](d5721c1/README.md)
- [0974e9e：Codex核對D-F01、修正拇指插值並增量整合；單手拇指與收回路徑仍待改](0974e9e/README.md)
