# 終末地模型實驗室｜Endfield Model Lab

以 iPhone Safari 為優先的終末地模型、場景與互動實驗專案。

目前場景：《莊的晚餐｜雨夜711》。

**[開啟網站](https://oloid666.github.io/endfield-model-lab/?v=6)**

第六輪：先選晚餐，接入梨花旁的機房事件，三十秒充能後操作力度條砲擊。建築分段倒塌，最後由玩家發射龍泡泡摧毀剩餘伺服器。完成後持續聽雨與閒聊。

梨花、機房、升空、真實建築破壞、力度條與終結技的驗證及發布狀態記錄在 [第六輪文件](docs/LOOKDEV-V6.md)。第五輪的跟隨、五區 40 種商品及薄玻璃沿用。

## 啟動

使用 Node.js 22 或更新版本。

```sh
npm install
npm run dev
```

```sh
npm run build
npm run preview
```

預設相對資源路徑。GitHub Pages 工作流程使用 `VITE_BASE_PATH=/endfield-model-lab/`。模型依 `import.meta.env.BASE_URL` 載入，沒有路由或後端。

## 操作

- 單指拖曳：旋轉。
- 雙指：縮放與平移。
- 下方按鈕：街角、店前、屋簷、梨花、近看、重設。可以雙指繼續放大。
- 「散步」：拖曳左下搖桿；電腦也可用 WASD／方向鍵。活動範圍是店內與騎樓，人物會避開貨架、櫃台與非入口玻璃。龍泡泡會跟隨，進店時鏡頭會調整；手動拖曳仍可接管鏡頭。
- 「開始今晚的故事」：點擊台詞繼續，或開啟自動。選項會一直等待。
- 右側可暫停／繼續。主線對話可略過本段；充能持續三十個有效秒，終結技完整播放。
- 砲擊：點亮框選目標，看準力度條中央按「砲擊」；電腦也可按空白鍵。邊緣 MISS 不耗能，中央威力最高。
- 99% 時推進最後對話，再看準中央按「發射龍泡泡」。飛行、撞擊、返回及落地完成才到 100%。
- 結束後「重新選餐」會復原建築、機櫃與所有進度。
- 結尾後點人物、晚餐、手機或「聽雨」，觸發短對話。主線進行時不會插入閒聊。
- 右上設定：雨、雨聲、人物預覽、畫質與素材來源。

雨聲在使用者開啟後，以 Web Audio 產生。沒有外部音訊、付費 API 或資料追蹤。

## 文件

- [早期方向與故事草案](docs/DIRECTION.md)
- [初次評估紀錄](docs/ASSESSMENT.md)（歷史紀錄，部分缺口已在開發時解決）
- [第六輪：梨花、機房與互動砲擊](docs/LOOKDEV-V6.md)
- [第五輪：跟隨、商品、進店鏡頭與介面](docs/LOOKDEV-V5.md)（歷史紀錄）
- [第四輪：抗鋸齒、自動門、散步與完整短劇](docs/LOOKDEV-V4.md)（歷史紀錄）
- [第三輪：人物補光、店內動線、薄玻璃與自然待機](docs/LOOKDEV-V3.md)（歷史紀錄）
- [第二輪：光影、玻璃與樹木改版](docs/LOOKDEV-V2.md)（歷史紀錄）
- [測試紀錄](docs/VALIDATION.md)

## 素材

莊芳宜 GLB 原始檔保留不變。只使用外層 Group 放置模型，並在執行時調整骨架姿勢。

- 作者：Abcxyz51
- [模型來源](https://sketchfab.com/3d-models/zhuang-fangyi-arknights-endfield-51d669eb7ef94cb49aeeaf2d9541d9de)
- [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- 大小：7,520,868 bytes
- SHA-256：`43c4d1063caf4f5d5f7405aae32cbd02ceb2de0ab043acc54e26dd7aa49ceb94`

人物節點設定與龍泡泡建模參考使用者指定的 [原專案版本](https://github.com/Oloid666/endfield-si-viewer/tree/5d002c146f41f25efdf06bbe06254550bd2c5318)。僅抽取與莊芳宜待機及龍泡泡有關的必要做法，未帶入原專案其他玩法。

本專案為原創二創。與遊戲官方及便利店品牌無關。

十年加班、通訊、電信警察與砲擊均為本篇創作設定，不代表官方劇情。所有通訊與任務僅在網頁內演出。
