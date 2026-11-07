# 晚餐演出、托盤與手機操作修正

延續 Three.js 0.180.0、既有模型與部署方式。套用專案內 `game-cinematic-camera` 的敘事動機、主體可見性及鏡頭交接方法，沿用 `game-ui-ux` 的手機操作原則。未新增套件或下載角色。保險與學堂場景美術不在本輪。

## 演出與分鏡

| 段落 | 實際修改 | 主要檔案 |
| --- | --- | --- |
| 莊拿晚餐 | 同一托盤保持水平；依實際指根估算掌面，雙臂解析式 IK 從下承托；轉身、走路保留支撐腳 | `arm-support.js`、`performance.js` |
| 起飛前／落地後 | 起飛前1.2秒交給龍泡泡；回放後紫色生物才在最後一發救餐、比👍。落地以「謝了。」接回再散步；新版細節見 [晚餐美術與救餐演出](RAIN-DINNER-FEAST-REVISION.md) | `mission-state.js`、`meal-remnant.js`、`mission-director.js`、`story-shots.js` |
| BOOK | 手邊召喚、翻頁、四節點電網圖、展開終端；最後切近景「請先登入。」。維持6秒與既有貪婪之島吐槽 | `connection-stage.js`、`story-shots.js` |
| 城域充能 | 四座天師樁遠景→人物低角度→樁體→人物近景→準備遠景，顯示「城域雷射砲・陣列同步中」及真實進度。直式獨立調整視野 | `story-shots.js`、`mission.js` |
| 冰箱事故 | +50°C時增加暖色水氣；保留溫度顯示、角色與台詞可讀性。未加入已刪除的平均五度笑話 | `vcr-effects.js` |
| 尋找電網入口 | 1號封閉→2號沒有入口→3號異常通道；「咦，這邊有機會。」再主動查看電腦。妮姬供應鏈／帳密竊取的說明保留，末句接「這樣我們可以周轉一下。」管理電腦移出天師樁基座，對準真實螢幕，供電源頭維持樁體 | `vcr-tablet.js`、`story-shots.js` |
| 三輪加熱 | 第一輪冒煙、第二輪沸騰；第三輪前兩拍焦黑，第三拍鼓起，第四拍必定電網過載。漏按仍進劇情，說明「不是你的失誤」；暫停／重試不把已焦黑食材變白 | `rhythm-heat.js`、`microwave.js`、`investigation-ui.js` |
| 紫色生物 | 鼓起、探出、逃離、落地後才等玩家讀台詞；原飯／肉／菜消失，留下容器。取消原本還要繼續加熱的流程 | `meal-birth.js`、`meal-remnant.js`、`mission-state.js` |
| 塞西拒絕 | 參照使用者梗圖：側身、微微後縮、單掌朝外、嘴角不對稱微笑；白字黑邊完整「那個我不要了」。鏡頭保留臉與手，字幕在下方 | `xaihi.js`、`story-shots.js`、`mission-dialogue.js`、`mission.css` |
| 後續 | 「便當跑了，保溫還開著。」→「所以整座城的電……」→「都拿去保溫空盤子了。」接回原主線 | `mission-dialogue.js` |

## 場景與操作

- `store.js`、`investigation-props.js`、`fridge-products.js`、`config.js`：小蔥傲嬌移到木框黑板，正面保留兩張同系列既有海報，咖啡小廣告移進店內；減少玻璃上的資訊量並更新觀看目標。
- `world.js`、`photo-viewer.js`：手機先顯示實際曝光；放大人像裁自同一張照片。沒拍到臉時，按鈕、滑動、鍵盤及縮放手勢均不能進人像，保留重新拍。
- `main.js`、`mission.js`、`exploration.js`、`investigation-ui.js`：背景與 BFCache 返回時清理按住狀態、恢復時鐘基準；保留對話框／相簿／回報草稿，解除暫停按鈕不被相簿設成 inert。重新開始回到尚未按開始的雨夜街角，重新接受招牌七下解鎖。
- `style.css`：按鈕及其子文字禁選取與 iOS 長按選單；意見輸入框仍可正常編輯。
- `xaihi.js`：修正持平板左右手目標反向造成雙臂交叉；空手放在身體前方自己的側邊。保留原 GLB。

## 驗證與限制

- `npm run build` 成功；仍有 Vite 的既有大 chunk 提示，未改依賴或部署。
- 31套既有 Node 檢查通過，另加 `scripts/dinner-revision-check.mjs` 的47項回歸檢查，共32套。新檢查涵蓋30／60Hz漏拍時的劇情進展、取消後焦黑狀態、完美輸入仍過載、暫停不提早交接及重開入口。
- `scripts/wire-framing-browser-check.py`：新增真實啟動器畫面亮區檢查；Node 另對實際天師樁模型做射線遮擋檢查，避免電腦再次埋入基座。
- `scripts/photo-recovery-browser-check.py`：實際快門的漏臉／有效照片、人像裁切逐像素一致、相簿／設定／回報草稿／BFCache 返回，以及重新開始入口。
- `scripts/dinner-revision-browser-check.py`：實際七下解鎖、BOOK／登入／托盤交接、完整冰箱與妮姬流程、12次節奏輸入、誕生與拒絕字幕、結尾回收托盤、保險／學堂／評分的背景恢復。最後砲擊依既有指針時間點輸入；主線命中判定由 Node 回歸另測。
- 截圖為 Chromium／SwiftShader，含390×844直式、844×390橫式、1366×768桌面的拒絕鏡頭。不能據此宣稱 iPhone Safari 真機通過或 FPS 提升。
- 獨立唯讀審閱指出第三拍漏按會略過鼓起、漏臉仍能手勢縮放、拒絕手掌未入鏡，皆已修正並由主執行者回歸。獨立代理其後因額度停止，最後截圖與修正沒有再次取得完整獨立審核通過。

僅發布 `ui-preview`，以該 commit 的 Cloudflare check-run 結果核對；正式 `main` 不變。

## 實景證據

[拒絕梗](../artifacts/dinner-revision/refusal-meme.png) · [托盤代拿](../artifacts/dinner-revision/tray-pass-helper.png) · [落地取回](../artifacts/dinner-revision/tray-reclaim-hero.png) · [BOOK 登入](../artifacts/dinner-revision/book-login.png) · [城域充能](../artifacts/dinner-revision/charge-city.png) · [妮姬電腦](../artifacts/dinner-revision/nikke-console.png) · [驗證紀錄](../artifacts/dinner-revision/validation.json)
