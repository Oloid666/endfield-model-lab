# V9 · 電光、運鏡與三段加熱

本輪已完成實作，正核對最終畫面與發布資源。此文件區分桌面測試與 iPhone 真機結果。

## 本輪變更

- 常用材質與特效在載入階段準備著色器，減少第一次出現時的編譯停頓；不另建 Renderer 或主渲染循環。
- 砲擊使用重用的光束、槍口光、衝擊環、放射碎光、積水光波與煙塵。以分層效果增加視覺範圍，並依畫質限制數量。
- 充能鏡頭交替呈現莊、天師樁綠芯、接入全景及戰場。砲擊加強後座與衝擊運鏡；減少動態偏好保留較輕的演出。
- 新增一鍵回演出視角，恢復當前分鏡，不重設故事或任務。
- 微波爐電弧加粗，梨花保留盛開主體，只有少量花瓣飄出。
- 倒帶加入畫格、磁帶及時間標記，仍由同一劇情時鐘控制。
- 微波遊戲改為三段短脈衝：每段 0.10 電氣秒，合計 0.30 秒。判定逐段收窄；太早可重試當段，過熱換便當從頭開始。

## 驗證狀態

已在 `index-AehwXX8I.js` 完成 166 項桌面 Chromium／SwiftShader 整合檢查，JavaScript／shader 錯誤為零。包含主線、三種晚餐、鏡頭重設、充能分鏡、砲擊、倒帶、三段微波遊戲、重播及 Context Lost 恢復。結尾實際觀察 60.03 秒，更新 61 個軟體渲染影格，約 1.02 FPS；這不是 iPhone 效能。390×844、844×390 及合成觸控均不能當作 iPhone Safari 真機結果。

最後修正了伺服器命中鏡頭、結尾鏡頭重設及首次粒子顏色配置，最終 build 為 `index-CwflIFf0.js`／`index-Caycndcd.css`。由 `visual-v9.py` 完成 19 項畫面與操作回歸，並人工檢查最終爆點與人物構圖；無 JavaScript／shader 錯誤。原始證據為 `artifacts/v9-browser-results.json` 與 `artifacts/v9-visual-results.json`。

狀態 325、骨架 69、運鏡 63、道具 44、砲擊資源 25、著色器準備 15、UI／觸控 22 項檢查通過。

## 效能與限制

- 不在每幀建立幾何、材質、圖片或 Canvas 紋理。
- 爆炸共用固定光源與固定 pool；低畫質保留主要光波，降低煙塵及粒子數。
- 軟體 WebGL 的 FPS 只反映此測試環境。iPhone 型號、iOS／Safari 版本、溫度、工具列及穩定 30 FPS 均需真機確認。

預編譯不代表所有首次停頓都消失。最終 build 首次砲擊前後的 program 數為 100 → 104，仍有首次使用的 shader 變體。已把粒子顏色 attribute 提前配置，避免在發射時才建立；不以此宣稱 FPS 提升或完全消除卡頓。

## 技術參考

以下參考用於實作原則，沒有搬入其他引擎或付費特效素材。

- [Three.js WebGLRenderer／compileAsync](https://threejs.org/docs/pages/WebGLRenderer.html)：利用並行編譯能力預先準備材質；這不等於提高每幀渲染速度，也不保證任何新變體都已編譯。
- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)：同類碎光與花瓣共用幾何及材質，以固定容量重用。
- [Epic Niagara 效能分級與最佳做法](https://dev.epicgames.com/documentation/unreal-engine/scalability-and-best-practices-for-niagara)：採用分級預算、共用 pool 及控制大面積透明覆蓋的概念；本專案仍使用 Three.js 程序效果。

## 發布狀態

V9 尚未填入部署結果；正式發布後再核對公開 HTML、JavaScript、CSS、圖片及兩份原始 GLB。

## 實際畫面

以下是瀏覽器 WebGL 畫面，並非概念圖。

- [天師樁綠光特寫](../artifacts/v9-pylon-closeup-reviewed.png)
- [全城接入](../artifacts/v9-pylon-array-reviewed.png)
- [莊蓄能](../artifacts/v9-charge-face-reviewed.png)
- [砲擊衝擊](../artifacts/v9-impact-reviewed.png)
- [最後一發命中](../artifacts/v9-finisher-broad-impact-reviewed.png)
- [倒帶](../artifacts/v9-rewind-reviewed.png)
- [三段加熱與粗電弧](../artifacts/v9-cctv-player-reviewed.png)
- [橫式加熱](../artifacts/v9-cctv-heat-landscape-reviewed.png)
