# 《莊的晚餐｜雨夜711》開發前評估

評估日期：2026-10-23。以下保留初次評估時的狀態。之後已開始第一階段場景開發，模型下載與 hash 核對也已完成。目前結果請見 [測試紀錄](VALIDATION.md)；創作方向請見 [方向文件](DIRECTION.md)。

## 目標與範圍

建立獨立專案 `zhuang-rainy-711`，優先服務 iPhone Safari。以雨夜便利店微縮街角、莊方宜與龍泡泡的表演，以及原創二創對話構成可重播的互動短劇。

美術優先順序：構圖 → 店內暖光與街道冷光 → 人物臉部與腳底接觸 → 小動作與停頓 → 濕地反射、雨水與克制 Bloom。第一版不含自由行走、經營、付款、開放世界，也不帶入原專案其他遊戲。

保留使用者提供的主線台詞。單輪目標約 2～4 分鐘，實際依閱讀與動作節奏驗證；選項等待時間不設上限。A/B/C 必須各有不同台詞、食物道具與結尾表演。

主線結束後保留場景與表演：至少 14 組、每組 2～4 句閒聊，組間約 8～14 秒安靜時間；五類熱點各 2～3 組反應。主線與選餐期間禁止閒聊插入。

## 已搜集並核對

工作區搜尋包含隱藏檔，未找到既有 `AGENTS.md`、`HANDOFF.md`、`DIALOGUE.md` 或原專案素材。接手依據為本次使用者規格。

已透過 GitHub 連線讀取原專案固定版本 `5d002c146f41f25efdf06bbe06254550bd2c5318` 的檔案樹，以及以下程式：

- `package.json`：Three.js `^0.180.0`、Vite `^7.1.0`、ES Modules。
- `src/viewer/ZhuangIdleController.js`：以 GLTFLoader node association 對應骨架；保存原始姿勢，執行時修改 quaternion 與眼皮位置；有呼吸、眨眼、頭眼偏轉及有限手臂姿勢。
- `src/config/characters.js`：提供莊方宜骨架與眼皮節點設定。
- `src/game/RideProps.js`：龍泡泡有身體、角、短手腳、尾巴、紅飾與曲面表情網格，表情圖建立後重用。該檔直接引用 `InkCompanion.js`，不可整檔搬入新專案。
- `src/viewer/ModelManager.js`：以外層 Group 置中而保留模型內部變換；載入、控制器與其他玩法耦合，適合參考必要模式後重寫精簡版。
- `src/viewer/CameraController.js`：已有手動操作停止故事運鏡的做法，但包含舊玩法視角，不能原樣沿用。
- `src/viewer/SceneManager.js`：已有單一 Renderer／animation loop、背景分頁跳過更新及 Context Lost 處理；尚不足以構成新專案光影、反射、後製與完整重試流程。

模型檔案樹紀錄：

| 項目 | 核對結果 |
| --- | --- |
| 路徑 | `public/models/zhuang-fangyi.glb` |
| 大小 | 7,520,868 bytes，與使用者規格一致 |
| Git blob SHA | `e9e1394faeb62dbc8abe44fd0730b5584c8ffa96` |
| SHA-256 | 尚未取得二進位檔，未實測 |
| animation／Morph target／GLB 授權 | 使用者提供的資訊，尚未解析 GLB 獨立核對 |

預期 SHA-256：`43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94`。

作者 Abcxyz51、CC BY 4.0 與來源連結需保留，待取得 GLB 後核對內嵌 metadata；署名放在「設定 → 關於 → 素材來源」。原始 GLB 保持不變，只用外層 Group 放置場景與修改執行時姿勢。

## 驗證缺口

1. 網頁讀取工具無法讀取雨夜 711 參考頁；未完成視覺核對，不能聲稱已比對構圖或效果。
2. shell 經既有代理 `proxy:8080` 下載參考 HTML 與 GLB 均立即連線失敗。環境狀態顯示 connected，與 shell 實際結果有落差。未改動代理、未繞過網路設定。
3. GitHub 工具可讀原始碼與檔案樹，但此次二進位讀取被拒絕，無法代替 GLB 下載與 hash 核對。
4. 查詢 `Oloid666/zhuang-rainy-711` 回傳 404，只能確定目前連線查不到，不能斷言名稱必定可用。未建立遠端 Repository，也未驗證建立與 Pages 管理權限。
5. 本機有 Node v24.19.0、npm 11.9.0；尚未執行 npm install／build，未證明依賴可下載。
6. 沒有 iPhone 真機測試結果。桌面手機尺寸模擬、WebKit 測試均不能等同 iPhone Safari 真機驗收。

## 技術評估

整體範圍可行，風險集中於程序骨架表演、人物融入場景，以及手機多重渲染成本。

既有待機控制器可以提供骨架操作基礎，但不是完整短劇動作庫。需要另外製作看商品／手機／龍泡泡、接袋子、拿餐盒、小幅搖頭，並設計姿勢混合與道具掛點。龍泡泡也需新增拉袖口、指物、抱食物、受驚、靠近與滾半圈；既有擺臂與擺尾不足以滿足因果表演。

故事以單一可暫停時鐘與狀態機驅動：開場 → 看商品 → 等待選擇 → 分支 → 結帳 → 躲雨 → 分支結尾 → 自由互動。對話資料含 id、speaker、text、mood、gesture、next，選擇節點另含 choices。動作與相機用明確事件觸發，禁止散落的計時器搶進度。

主線、閒聊與點擊回應共用對話仲裁：同時只顯示一句；熱點有冷卻，拖曳、雙指、長按及 pointercancel 均不得觸發。結尾閒聊採打散佇列，避免連續重複。重播重設狀態與待處理事件，不能重新掛一套 listeners。

只用一個 WebGLRenderer 與主循環；反射與 Bloom 仍會增加 render passes，不能因 Renderer 只有一個就視為成本低。先量測模型 triangles、draw calls、貼圖記憶體與基礎畫面，再逐項加入低解析度反射及 Bloom。保留人物補光、冷暖配色與接觸陰影，畫質降級優先減少反射更新率、後製解析度與雨量。DPR 初始 1～1.25、上限 1.5；30 FPS 為實測目標。

UI 採單一對話框與可收合工具列，視角提供街角／兩人／近看／重設。以 Safe Area、動態 viewport 與實際可用畫面構圖；手動鏡頭操作取消自動過場，明確點選視角或重設後再恢復。

## 分階段交付與驗收

| 階段 | 交付與通過條件 |
| --- | --- |
| 1：素材與角色 | 取得原始 GLB、hash 一致、核對授權與骨架；實際載入、腳底落地、置中、旋轉縮放，錯誤可重試 |
| 2：美術基準 | 完整街角體積與背面、店內商品區、冷暖光、人物補光、接觸陰影、龍泡泡；提供實際直橫式渲染截圖 |
| 3：一條完整流程 | 先完成 A 分支至結尾待機，動作有前因、停頓、結果；選餐永遠等待 |
| 4：完整內容 | 補 B/C 對話、道具與不同結尾；補至少 6 組閒聊使總量達 14，五類熱點各 2～3 組 |
| 5：互動與穩定 | 測三分支，結尾至少觀察 60 秒；測拖曳／雙指／長按／取消、冷卻、重播、背景時鐘暫停、Context Lost 與載入失敗 |
| 6：效果與效能 | 逐項加雨、水花、低解析度濕地反射、克制 Bloom；在有紀錄的 iPhone 型號與 iOS／Safari 版本量測 FPS 並調整分級 |
| 7：發布 | npm install 與 build 實際通過；新 Repository、子路徑 base、BASE_URL 模型路徑、Actions Pages workflow；實際驗證部署網址、重新整理與資源載入，附截圖 |

使用者已有完整創作與技術方向，開始開發前不需要再問角色、分支或龍泡泡模型。需要真機驗收時再取得可用的 iPhone 型號／iOS 與測試方式；取得二進位素材與參考畫面則先修復環境可用性。

## 來源

- 指定版本：https://github.com/Oloid666/endfield-si-viewer/tree/5d002c146f41f25efdf06bbe06254550bd2c5318
- 模型來源：https://sketchfab.com/3d-models/zhuang-fangyi-arknights-endfield-51d669eb7ef94cb49aeeaf2d9541d9de
- 授權連結：https://creativecommons.org/licenses/by/4.0/
- 視覺參考（尚未讀取成功）：https://rainy-711.shareyourhtml.com/
