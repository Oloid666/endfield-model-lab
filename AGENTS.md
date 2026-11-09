# 本專案協作偏好

- 一般遊戲交付依現有發布流程更新可玩版本並附網址。外部評審協作輪次依使用者最新格式：最終只回報交付commit號與`docs/review/<受評短commit>/README.md`路徑，發布網址、狀態及細節放在該README。
- 延續目前工作的部署分支與平台，不自行更換部署架構、不使用force push。發布前完成適當檢查；發布後核對對應commit的部署結果。
- 若發布失敗，明確交代實際阻礙與目前版本，不把舊網址說成已更新。iPhone真機未測須如實註明。
- 保留角色名稱、GLB、故事與機制。完整影片、大量中間取證仍留在忽略目錄；每輪精選的編號截圖必須加入Git追蹤的`docs/review/<受評短commit>/`，使用`編號-階段-說明.png`命名，修改前後皆有證據時各放一張。不要放進`public/`或網站下載包。
- 每輪評審README必須列：受評及比較commit、修改項目與上一輪問題編號、修改檔案、截圖索引、可重現入口與步驟、測試範圍、iPhone已測／未測、影片連結及時間碼（若有）。證據不能只存在本機路徑或對話附件。範本及完整約定見`docs/review/README.md`與`docs/review/TEMPLATE.md`。
- 避免commit自指：先提交程式取得受評commit，再以該短碼建立證據資料夾；證據可由下一個僅含文件／截圖的commit補上。最終回報包含證據的交付commit，README明確列出受評程式commit；不要amend或force push來追逐資料夾名稱。
- 保留並維護`window.__rainy711.debugJump`、`restoreChapter`、`tick`及點711正面招牌七次的快速測試。若名稱、參數或流程有變，必須在當輪README交代遷移方式。本次交付不更動這些入口。
- Claude是外部唯讀評審，不會push、開Issue或部署。它在自己的環境以指定commit和Chromium軟體渲染取證；可用來判斷可見性／穿模／UI／已走過的流程，不能視為iPhone幀率、觸控手感或聲音驗收。不要把Codex的完成敘述當作Claude通過紀錄。
