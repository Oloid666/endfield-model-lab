# 第二輪：16項整合修正

本輪依使用者確認的16項方案，將照片、持物、演出連續性與後半運鏡一併調整。沿用 Three.js 0.180.0、原 GLB、現有劇情時鐘與部署。保險／學堂場景大改仍保留在待辦。

## 完成內容與程式位置

| 項目 | 最終行為 | 程式 |
| --- | --- | --- |
| 1 照片近照 | 第一張與實體手機保持原曝光；通過臉部驗證後另渲染1536×1920光學近照，回復相機與渲染尺寸。沒有臉仍不能放大／送出 | `world.js`、`photo-viewer.js` |
| 2 托盤 | 掌心接觸、肘向下、前臂分攤翻掌，交接平滑放手。拿餐時停止隨機掏手機；必要手機動作以另一掌承托。人物觀看預設改依實際頭位與朝向構圖，保留碰撞安全 | `arm-support.js`、`performance.js`、`world.js` |
| 3 螢光棒 | 固定觀眾區與正常深度測試，握柄支點、手腕遲滯、個別拍差、起落停頓，定期以平滑權重同步一段；不再整組貼住鏡頭 | `concert-stage.js` |
| 4 食物連續變化 | 教學不預先燒焦。冒煙／沸騰／焦化／膨脹有連續美術值，暫停或重試不倒退。飯菜縮入紫團後才隱藏，容器保留 | `rhythm-heat.js`、`microwave.js` |
| 5 拒絕梗 | 胸上近景、微側正面，身體／手腕／掌面共用緩動；袖口在拒絕時向肘部收回，事件結束恢復。保留「那個我不要了」與白字黑邊 | `xaihi.js`、`story-shots.js` |
| 6 Explosion | 依劇情時鐘完整顯示2.8秒、再淡出0.35秒；避開人物及HUD，喊話改更近的臉部鏡頭。重新開始會清掉字幕 | `main.js`、`story-shots.js` |
| 7 假結尾 | `Fin.` → `Fin..` → `Fin...` → `Fin....` → `Fin....?`，總長4.05秒；問號保留1.5秒後才顯示後續入口，暫停不跳過 | `ending-title.js`、`mission.js`、`bonus.js` |
| 8 視線 | 眼、頭、上身以不同速度跟向對話者，配合原本動作，避免整身同時轉 | `performance.js`、`mission-director.js` |
| 9 衣飾 | 走路起停與轉向有髮絲／衣飾遲滯，升空與落地增加方向性拖曳；沿用原骨架 | `performance.js` |
| 10 龍泡泡 | 手勢限定說話者，加入短暫預備與回穩；保留既有表情、飛行與光影 | `performance.js`、`companion.js` |
| 11 平板 | 先交代持姿，再推近操作面；最初1.9秒等待鏡頭停穩後才開放操作 | `mission-director.js`、`vcr-tablet.js` |
| 12 建築長焦 | 實際退遠至街對面斜角，同時收窄視角，慢橫移展示建築、窗面與雨夜反光；直橫向分開配置 | `story-shots.js` |
| 13 倒敘 | 固定外部建築構圖看倒帶，再剪接進店內，保留倒帶世界時序，移除穿入建築的路徑 | `story-shots.js` |
| 14 嘆氣 | 收手機的中景後切龍泡泡近景，慢推與回穩，保留閱讀停頓 | `story-shots.js` |
| 15 唱歌／復原 | 洞口全貌接受困反應，唱歌短弧；沿用特寫、升空、彈指、拉遠，再固定全貌看重建的流程 | `mission-director.js`、`concert-stage.js`、`street-performance.js` |
| 16 供詞 | 改「飯還沒吃，鍋倒是先背上了？」並給反應近景，保留後面餐袋／供詞的不同資訊 | `mission-dialogue.js`、`story-shots.js` |

## 介面與相容性

沒有新增後端介面或套件。拍照結果保留 `src`、`closeup`、`faceValid`，以 `portraitSource: 'optical'` 記錄近照來源；近照不再提供 `cropRect`。已更新像素一致性的舊測試，改驗證近照尺寸、臉部門檻與第一張顯示來源。角色觀看預設保留原有名稱。

## 驗證

- `npm run build` 成功；原本大chunk提示仍在。
- 33套 Node 檢查通過，包含實際 GLB／骨架、相機、劇情、操作、模型原檔雜湊與資源釋放；最後的袖口位置還原亦有實骨架回歸。這些數字不代表GPU效能。
- `photo-recovery-browser-check.py`：實際有效／漏臉快門、1536×1920近照、相簿／設定／回報／BFCache返回與重開入口。
- `dinner-revision-browser-check.py`：完整平板與三輪加熱、誕生、拒絕、砲擊字幕與避臉、托盤收回、Fin逐字與入口門檻、演唱會、保險／學堂／評分返回。
- `second-wave-visual-browser.py`：無手機持盤多角度、食物／拒絕連續時間取樣、直式390×844／橫式844×390／桌面1366×768、長焦建築與固定倒敘。暫停擷取會先等待resize完成再繪製，避免將尚未重畫的canvas誤判為遊戲黑屏。
- 參數與實景均經獨立唯讀審核；修復過程包含IK四元數別名回歸、POS遮擋、手掌出框與黑袖瓣遮指根。最終結果見 [獨立唯讀審核](RAIN-SECOND-WAVE-REVIEW.md)。

尚未驗證 iPhone Safari 真機與實際手機GPU效能；模擬直式視窗不能視為真機通過。不宣稱本輪提高手機FPS。

只更新 `ui-preview`，正式 `main` 不變。

## 實景證據

[清晰近照](../artifacts/second-wave/optical-portrait.png) · [無手機持盤](../artifacts/second-wave/tray-front.png) · [低角持盤](../artifacts/second-wave/tray-low.png) · [最終拒絕手勢](../artifacts/second-wave/refusal-final-390.png) · [桌面拒絕近景](../artifacts/second-wave/refusal-final-1366.png) · [Explosion](../artifacts/second-wave/explosion-readable.png) · [Fin問號](../artifacts/second-wave/fin-2.6.png) · [建築長焦](../artifacts/second-wave/house-long-390.png) · [食物連續取樣影片](../artifacts/second-wave/food-fusion.mp4) · [驗證紀錄](../artifacts/second-wave/validation.json)。
