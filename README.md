# 莊的晚餐｜雨夜711

以 iPhone Safari 為優先的 Three.js 互動短劇專案。

目前為第一階段：雨夜便利店場景與人物預覽。故事、選餐、多結局及走路尚未實作。先確認店面與構圖，再繼續開發。

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

預設相對資源路徑。GitHub Pages 工作流程使用 `VITE_BASE_PATH=/zhuang-rainy-711/`。模型依 `import.meta.env.BASE_URL` 載入，沒有路由或後端。

## 操作

- 單指拖曳：旋轉。
- 雙指：縮放與平移。
- 下方按鈕：街角、店前、屋簷、重設。
- 右上設定：雨、雨聲、人物預覽、畫質與素材來源。

雨聲在使用者開啟後，以 Web Audio 產生。沒有外部音訊、付費 API 或資料追蹤。

## 文件

- [目前方向與後續故事草案](docs/DIRECTION.md)
- [初次評估紀錄](docs/ASSESSMENT.md)（歷史紀錄，部分缺口已在開發時解決）
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
