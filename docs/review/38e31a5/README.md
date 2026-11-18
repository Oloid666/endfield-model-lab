# 持板、👍 與紅柄接觸修正（2026-11-18）

受評程式：`38e31a52338195f16a46e01f54e75fccea596a0d`，包含 `68987b2` 的三項修正及初段鏡頭補修。比較基準：`e9e6cb028936eea83de03e83360d369a5e065784`。

發布分支沿用 `ui-preview`；可玩入口：https://ui-preview.endfield-model-lab.pages.dev 。部署結果以交付 commit 的 Cloudflare Pages check-run 為準；本地 Chromium 不能連入此網域，不以本地測試冒充遠端或 iPhone 實測。

## 本輪範圍與對應問題

| 上輪問題 | 修改與驗收結果 |
| --- | --- |
| 使用者截圖：冰箱設定頁，塞西手臂／袖子穿進平板 | 修正轉向後左右握點對反；板前移至可達的位置、降低傾角，右袖自然垂到下框外。相機固定在肩外，保留過肩，不再從板面法線進入身體。普通操作頁、三版型及三段反應均有取證。 |
| 紫色生物只要 👍 泡泡 | 移除立體比讚手及其 mesh；保留雙側承盤觸手、同一份晚餐及原接盤／還盤時序。成功節拍統一 👍。 |
| 上輪 partial：握柄只對手腕，指頭直、髮絲擋住 | 以真正橫柄中心與掌內點對位，既有四指三節及拇指包覆。先轉腕、預成 C 型，再沿紅柄自身 +X 方向入掌；鬆手時先退出再開指。髮束輕偏讓握點可見。兩個 L 柄 box 都納入真蒙皮測試。仍有最大約 2.43 mm 淺交疊，不能稱絕對零穿模。 |
| 取證發現的連續性問題 | 保留被抓姿態至釋放，從實際龍泡泡位置發射，修正 2 秒釋放時 0.65 rad 倒轉。初 1.5 秒改外側雙人建立鏡頭，移除舊跟拍穿過龍泡泡的路徑。 |

保留原角色、GLB、故事、玩法、引擎版本與部署設定。沒有新增套件、光源或陰影。共享手臂 IK 未改，晚餐原本交接順序與左側抖條保留。

## 修改的檔案

- `src/xaihi.js`：持板、左右實際握點、右袖、肩外相機與安全接近點。
- `src/mission-director.js`：初次平板接近、真正發射起點與連續轉角。
- `src/handle-grip.js`（新增）：使用原骨架的掌內錨點、四指與拇指，隔離掛在拇指上的衣袖。
- `src/performance.js`：分離到位／捲指／側向接觸與鬆手時間，保持被抓姿態，退出恢復。
- `src/companion.js`：grab marker 從 L 柄轉角改到實際橫柄中心，紅柄外形不變。
- `src/meal-remnant.js`、`src/tray-rescue.js`、`src/creature-communication.js`：移除立體比讚、保留 👍 與承盤、清理過時註解。
- `src/story-shots.js`：抓握初段以外側雙人鏡頭交代空間。
- `scripts/tablet-geometry-check.mjs`、`scripts/handle-grip-check.mjs`（新增）：真 GLB 的可見性、完整 L 柄 skin 接觸、30／60 Hz 全段與退出驗證。
- `scripts/tablet-grip-browser.py`（新增）：原入口操作、所有普通平板頁、三版型、接盤／釋放／還盤及 restart 取證。
- `scripts/acting-check.mjs`、`scripts/cinematic-check.mjs`、`scripts/director-check.mjs`、`scripts/next-dinner-check.mjs`、`scripts/cinematic-track-check.mjs`：新實際接觸語義與回歸驗證。舊「柄＝手腕」條件改為「柄＝掌內錨點」，另以完整蒙皮測試約束，沒有用放寬門檻取代接觸驗證。
- `.gitignore`：原始影片及中間圖留在本地；`docs/RAIN-BACKLOG.md` 與本資料夾為交付紀錄。

## 編號圖片

所有圖片來自實際遊戲 Chromium／SwiftShader。三版型為 390×844、844×390、1440×900，DPR 1／low；不是 AI 重繪。18 張精選圖在本資料夾，不進 public 或網站下載包。

| 編號 | 圖片／判讀 |
| --- | --- |
| 01 | [搜尋修改前](01-tablet-before.png)／[修改後](01-tablet-after.png)：保留肩膀、看清板面。 |
| 02 | [冰箱設定前](02-temperature-before.png)／[修改後](02-temperature-after.png)。 |
| 03–04 | [PHP 頁](03-php-after.png)／[電網頁](04-grid-after.png)。 |
| 05–06 | [橫屏功率](05-power-landscape-after.png)／[桌機 ready](06-ready-desktop-after.png)：HTML 操作按鈕正常、無橫向溢出。 |
| 07 | [握柄前](07-grip-before.png)／[修改後](07-grip-after.png)。 |
| 08–09 | [橫屏握柄](08-grip-landscape-after.png)／[桌機握柄](09-grip-desktop-after.png)。 |
| 10 | [👍 泡泡及雙側承盤](10-helper-after.png)：沒有立體比讚手。 |
| 11–13 | [有降](11-satisfied-after.png)／[心虛退手](12-avert-after.png)／[轉移話題](13-redirect-after.png)：保留眼睛及嘴部可見性。 |
| 14–15 | [抓握初段外側雙人](14-approach-after.png)／[實際鬆手發射](15-release-after.png)。這兩張來自錄製 JPEG 幀轉 PNG，未增強或重繪。 |

原始來源與各輪影像對應見 [capture-sources.json](capture-sources.json)：final5 的 tablet/UI 和 reactions7 的反應姿態與最終程式一致；final8 使用最終掌指／L 柄／釋放程式且包含三版型；final9 只新增初段外側鏡頭。

## 可重現入口與步驟

入口名稱完全保留：`window.__rainy711.debugJump`、`restoreChapter`、`tick` 與 711 正面招牌七次。

1. 開啟載入詳情、直接進入；等待角色準備好。點正面 711 招牌七次。
2. `debugJump('fridge')`，用現有對話及操作按鈕走完搜尋→PHP→後台→控制器→冰箱→便當標籤→電網→管理電腦→power→confirm→ready；不要只跳到反應特寫。
3. `debugJump('chapter:last')`，正常推進／協助／砲擊至最後一發，查看 0–3 秒、接餐 7 秒、👍 9.3 秒及 12.3 秒握柄。
4. 按發射，查看 0–2 秒保留握住、2 秒釋放及後續還盤；重新開始應回到 ready。

```sh
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
python3 scripts/tablet-grip-browser.py --url http://127.0.0.1:4173 --out artifacts/tablet-grip/recheck --layouts --film
# 只重驗抓握／發射：再加 --only-grip
node scripts/tablet-geometry-check.mjs
node scripts/handle-grip-check.mjs
```

瀏覽器腳本需 Python Playwright、`/usr/bin/chromium` 及錄影時使用的 ffmpeg。固定更新 30 Hz、取證 8 fps 是重現設定，不能當作裝置 FPS。

## 驗證

- Vite production build 通過；`git diff --check` 通過。
- `68987b2` 的全部 52 支 `scripts/*check.mjs` 通過，[逐支結果](test-summary.json)。初段鏡頭補修後相關 `cinematic-track` **914**、`director` **493** 項再過。
- 真 GLB：7 種普通操作姿態、315 條中央文字／按鈕視線無角色遮擋，採樣板內 skin 頂點 0；三種 aspect 的四角在安全範圍。[量測](tablet-geometry-check.txt)。這是採樣證據，不代表未採樣的所有動態瞬間均零穿透。
- 握柄：實際掌指蒙皮、橫柄與直柱 union；30／60 Hz 逐幀完整附著、鬆手、reset 與對位 API 通過。穩定姿勢最大約 2.43 mm 淺交疊，拇指最近約 1.42 mm，[量測](handle-grip-check.txt)。原 GLB 雜湊由現有 cinematic 檢查確認不變。
- 開場交餐 1,091 項及端盤接觸檢查通過；這次沒有改晚餐、共享 IK 或交接順序。
- 實際瀏覽器普通平板全流程 37 張、抓握三版型與釋放／還盤、三段表演與 quiet-song 補圖通過。無 pageerror、無橫向溢出；重開始回 ready。
- 連續取證：最終抓握／發射／還盤固定步進共 67 幀，沒有音軌。原始 MP4、全部中間 JPEG/JSON 位於忽略的 `artifacts/tablet-grip/`；本輪沒有可公開的真機影片連結，不把本地路徑當成可下載證據。
- **iPhone 真機、Safari 觸控、音效、發熱、FPS、背景切出返回未在本輪真機測試。** 不宣稱提升了手機幀率。

## 獨立複核與剩餘項

獨立唯讀 reviewer 另行閱讀 diff、親跑真蒙皮與平板測試、檢查實際 before/after 及連續圖；實作者自測不是獨立通過。複核發現的 align API 作用域、釋放角度跳變、拇指過渡與 L 柄直柱掃指已逐一修正並補測。最終結論另見 [獨立複核紀錄](independent-review.md)。

仍留在待改：塞西嘴周深色區、2.43 mm 淺交疊的進一步美術精修、保險／學堂分鏡小改，以及 iPhone／聲音／真實效能。Mac mini Dream Loop 自動化未在本輪部署。這次不把它們寫成已完成。
