# 單鍵蓄力、左側抖動與晚餐收尾

受評程式：`cdae8e39d851148e2b0e198d3a5f7a8efb0c8c3d`。比較版本：`ee98e6ae6654aa360d8cd93945e6518afc320ed2`。
本資料夾由下一個文件／證據 commit 補交，遊戲程式與受評版本相同。精選圖來自提交前最後一輪 production build，當時工作樹尚未提交；不是先前失敗或修正中的試拍圖。

預覽入口：[ui-preview](https://ui-preview.endfield-model-lab.pages.dev/)。部署是否完成以該交付 commit 的 Cloudflare Pages check 為準；此網址會隨後續版本更新。未修改 main、GitHub Pages workflow、部署設定、Three.js 版本、GLB、角色外觀或二樓劇情。

## 本輪改動及對照

| 項目 | 玩家現在看到什麼 | 證據 |
|---|---|---|
| 發射介面／出力：承接使用者「強中弱其實沒有」 | 改一顆圓形蓄力鍵。按住增強，鬆開射擊；1.2秒起變金色，1.6秒提醒快放，1.9秒自動洩壓並冷卻0.6秒。短按也能射擊。傷害8–22、效果強度0.35–1、後座幅度0.55–1.4確實跟蓄力變化，不再靠中央判定或隨機失敗 | [金環直屏](01-charge-gold-after.png)、[橫屏](02-charge-landscape-after.png) |
| R-F03 後續／最後一發 | 救餐演出與原12秒就緒門檻保留。白色指針只在左側5–11%抖動，保留被抓住的龍泡泡抖動；點擊直接發射，移除中央金區／MISS／出力選單 | [左側抖條](03-final-left-after.png)；[上輪中央判定介面](../682dec4/10-aim-face-after.png)，舊圖與新圖不是同一秒數 |
| 「我早想喊看看了」鏡頭 | 先給2.8秒落地回穩，再切胸上近景，鏡頭依真實頭部位置取側前方、小幅推近8cm。龍泡泡吐槽仍另外切鏡；同步延後台詞時鐘與整段長度 | [直屏](04-landing-face-after.png)、[桌機](10-landing-desktop-after.png) |
| 晚餐謝幕／Fin | tour最後4秒切晚餐；30秒謝詞、32.3秒金色「莊的晚餐」片名，完成後維持鏡頭，`Fin.`→`Fin..`→`Fin...`→`Fin....`→`Fin....?`。片名是畫面字卡，沒有改711招牌。結尾暫時隱藏除錯入口，避免蓋臉；桌機這段使用完整渲染寬度 | [謝詞](05-dinner-thanks-after.png)、[片名](06-dinner-title-after.png)、[問號](07-fin-question-after.png)、[橫屏](08-title-landscape-after.png)、[桌機](09-fin-desktop-after.png) |
| 操作取消 | 拖出按鈕24px、pointercancel、失去capture、blur、暫停、停止渲染、重開、切階段／章節都清除蓄力。過熱後再鬆手不補發，Space／Enter不因合成click雙發。蓄力中按鈕保持啟用 | 瀏覽器記錄與Node檢查，見下方 |

保留 `missionAttack()` 作為舊測試入口：普通戰鬥直接呼叫相當於弱射；最後一發仍直接發射。`missionOutput('steady')` 保留相容性，其餘已移除模式回傳false，不影響傷害。正常玩家介面沒有三模式。

## 修改檔案

- `src/shot-charge.js`：共用蓄力門檻、出力與左側抖動關鍵幀。
- `src/mission-state.js`：實際射擊、洩壓、取消、最後直發、落地延後與閱讀時鐘。
- `src/mission.js`：指標／鍵盤事件、圓環狀態、取消生命週期、結尾字卡。
- `src/shot-charge.css`、`src/main.js`：新按鈕材質與版型、結尾文字／完整畫面樣式的載入。
- `src/investigation-ui.js`：更新發射前操作說明，移除舊中央判定文案。
- `src/mission-director.js`：龍泡泡掙扎強度不再依中央命中區變化。
- `src/story-shots.js`、`src/ending-title.js`：落地／晚餐組鏡、共用時界。
- `src/world.js`：重建後邀請鏡頭要等Fin問號讀完，不能提早覆寫收尾。
- `scripts/shot-charge-check.mjs`：52個狀態、時間邊界、取消與取景檢查。
- `scripts/charge-ending-browser.py`：可重現的真實DOM輸入及三版型取證。
- `scripts/presentation-check.mjs`、`scripts/cinematic-track-check.mjs`：將舊中央MISS／完成前4秒鏡頭的假設改為本輪明確規格，原救餐與後續鏡頭保護仍檢查。
- 本證據資料夾與 `docs/RAIN-BACKLOG.md`：文件、精選圖與剩餘限制。

## 驗證與重現

- `npm run build` 通過，詳見 [build.log](build.log)。Vite仍提示大型chunk與「Three.js同時動態／靜態引用」警告，本輪未改打包架構。
- `node scripts/*check.mjs` 逐支執行：46／46通過，包括新的52項檢查。詳見 [node-checks.json](node-checks.json)。既有測試改寫的追蹤中artifacts在檢查後還原，未當成遊戲變更提交。
- Production build以無頭Chromium／SwiftShader跑實際鍵盤、滑鼠指標流程：390×844、844×390、1440×900，DPR1，balanced畫質。最後一輪共23張原生PNG，選10張加入本資料夾，無修圖或美化。階段、時間、相機座標、SHA256與9組操作結果見 [browser-verification.json](browser-verification.json)。
- 實際通過：金色蓄力22傷害；過熱鬆手無射擊；拖出／blur／pointercancel／lostcapture／暫停取消；Space與Enter只射一次；DOM指針落在左側；最後點擊直接發射；真實tour→Fin鏡頭位移小於5cm；三版型控制區在視口內；重開回ready並清除招牌解鎖與持續輸入。
- 1.899／1.900／1.901秒、30／60Hz、late-frame洩壓、章節／phase清除、洩壓協助入口與減少動態：Node檢查。這些數值不是裝置FPS量測。
- 兩次早期取證未當成通過：一次腳本誤點已自動前進的登入鍵，並遇開發伺服器重載；另一次因每個中間tick都軟體渲染而中止。改成production預覽、只在取證點render後，擴充測試與最後取證成功，無pageerror。

重現（需Node22+、Python3、Playwright及Chromium）：

```sh
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4216
# 另一個終端
python3 scripts/charge-ending-browser.py --url http://127.0.0.1:4216/ --out artifacts/visual-review/charge-ending-recheck
node scripts/shot-charge-check.mjs
```

測試入口沒有改名：先點正面711招牌七次；`debugJump('chapter:terminal-deploy')` 走帳號／密碼、勾選、拉桿、起飛、鞋子及充能，進普通砲擊。`debugJump('chapter:last')` 走救餐後到最後一發。`restoreChapter()`、`tick(time,delta,render)` 均保留。取證用 `pauseForCapture()` 停止自動時鐘，自己以tick推進，只有取圖時渲染；不是任意省略故事門檻。

## 獨立審核與驗收界線

沿用 [game-cinematic-camera Skill](../../../.agents/skills/game-cinematic-camera/SKILL.md) 與既有game-feel方向。依Skill的獨立審核要求，另由唯讀reviewer檢查差異、重跑focused檢查並目視截圖，不參與實作。最後覆驗 `verified` 版謝詞、Fin與橫屏／桌機片名，判定無新增blocker／major；早期快速測試遮眼與字幕過低已重拍確認。

**尚未驗證：**iPhone Safari真機長按、背景返回／BFCache、觸控手感、發熱、實機FPS、200%文字、聲音與連續錄影。本輪沒有提供影片或外部影片連結；離散時點檢查不能證明所有中間幀都自然。未宣稱托盤所有角度零穿模或表演全面定稿。

**保留待改：**橫屏砲擊吐槽長條仍較寬、會跨過部分場景光環（minor）；上輪BOOK手勢、塞西嘴影／持板接觸、抓柄髮絲遮擋及托盤1.1秒約1.1mm淺交疊等限制照舊。沒有為本輪擅自擴大成全部角色／場景重做。
