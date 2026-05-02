# Update Roadmap

最後更新：2026-04-24（L2-1a 顯示層多幣別 baseline 第三輪後）

這份文件整理 `expense-tracker-redo` 下一階段建議更新項目，依照 **優先度 / 影響範圍 / 上架價值** 排序。

## P0. 上架前必補

### 1. 真機驗收
- Android 真機完整驗收
- iPhone 真機完整驗收
- 依 `docs/DEVICE_QA_CHECKLIST.md` 跑一輪
- 收斂 blocker 與高風險 bug

### 2. iOS 真機 Signing / Archive
- Xcode Team / Signing 設定
- 真機 Run 驗證
- Archive 驗證
- App Store Connect upload 驗證

### 3. 商店素材與 metadata
- App icon 定稿
- 商店截圖拍攝
- Privacy Policy URL
- Support / Contact Email
- Play Console / App Store Connect 必填欄位補齊

---

## P1. 核心產品體驗補強

> 狀態更新：
> - CSV 匯出補強（成功卡 + 再次匯出同條件）✅
> - CSV 成功卡可讀性（scope/category/count 條件摘要 + 重跑說明）✅
> - Reports 再深化（趨勢標籤/tooltip + 月對月變化率）✅
> - Reports 行動端互動（點選柱狀固定資訊卡 + 明確選中月份）✅
> - Recurring 效率功能（7 天內到期篩選 + 批次啟停）✅
> - Recurring 批次 UX（影響筆數 toast + 選取/篩選筆數摘要）✅
> - Recurring 大量資料操作（sticky 工具列 + 關鍵字搜尋）✅
> - Reports period 切換 active month 策略（保留 / 回退）✅
> - CSV 成功卡 power-user copy（檔名 / 條件）✅
> - L2-M1 recurring 到期提醒 baseline（今日/7天內/逾期 + 快速篩選）✅
> - L2-M2 reports 時間分析 baseline（月/季 + 環比文案 + 區間摘要）✅
> - L2-M4 recurring 提醒處理動作 baseline（標記已處理/延後一次 + 摘要/篩選同步）✅
> - L2-M8 recurring 與 Home/Reports 串接一致性收尾（Home 摘要同步 + 提醒文案收斂）✅
> - L2-3b recurring 自動入帳 baseline（autoPost 開關 + reconcile + 去重保護）✅
> - L2-3b recurring confirm 模式（off/on/confirm 三態 + pending/確認/略過最小流程）✅
> - L2-3b recurring confirm 第三輪（pending 專屬篩選 + pending 批次操作 + confirm 日期策略）✅
> - L2-B reports 預算/目標聯動 baseline（summary card + empty state + integration）✅
> - L2-B reports 決策摘要微升級第二輪（時間口徑提示 + 超支/接近超支 top N + 即將完成標記 + 跨頁整合測試）✅
> - L2-B reports 決策摘要可行動化最小版第三輪（摘要快捷導流到 Budget/Goals + interaction/integration 測試）✅
> - L2-1a 顯示層多幣別 baseline 第一輪（統一 formatter + app-wide display currency 生效 + 核心頁面顯示一致化）✅
> - L2-1a 顯示層多幣別 baseline 第二輪（base/display semantic + display adapter 前置 + 設定/報表/預算/目標語意提示）✅
> - L2-1a 顯示層多幣別 baseline 第三輪（transaction originalCurrency 真接線 + adapter 實吃 + fallback migration + 語意可觀察）✅

### 4. CSV 匯出體驗再補強
- 匯出前顯示更清楚的範圍與筆數摘要
- 匯出成功後提供更明確的結果回饋
- 增加空資料 / 特定分類 0 筆時的更多提示文案

### 5. Reports 再深化
- 月支出趨勢加入更多真實資料驗證
- 加入分類支出排行 / 占比視圖
- 報表期間可切換（例如近 3 月 / 6 月 / 12 月）

### 6. Recurring 體驗補完
- 下次扣款日期編輯體驗再優化
- 增加 recurring 明確的排序 / 篩選（已完成 baseline）
- 提醒處理動作（標記已處理 / 延後一次，已完成 baseline）
- 定期帳目人工確認（confirm）第三輪 baseline 已完成；若後續要再推進，可評估真正 recurring engine

---

## P2. 使用效率提升

> 狀態更新：
> - 最近分類 / 最近備註排序升級（頻率 + 最近時間）✅
> - 最近備註排序加入分類場景權重（category context）✅
> - 清除資料流程邊界補強（取消/重開/清除後狀態）✅
> - 清除資料新增確認字串（CLEAR）✅
> - 匯出 / 備份 / 清除風險提示共用化 ✅
> - RiskNotice icon / 色階 / spacing 統一 ✅

### 7. 交易輸入更快
- 備註預設選項再依常用度排序
- 支援最近使用的分類 / 備註
- Calculator 體驗再優化（例如更明確的錯誤提示）

### 8. 設定頁功能補強
- 評分 App 連到真實商店頁
- iCloud 備份接真實雲端能力或移除誤導性入口
- 幣別若未來要國際化，可接續「匯率換算層」：接匯率來源、換算策略、歷史匯率口徑（目前仍僅顯示層）

### 9. 清資料 / 匯出 / 備份安全性
- 清除所有資料前增加二次確認（已完成）
- 備份與匯出流程加上更清楚的提示（已完成）
- 匯出檔案命名與版本資訊可再一致化（待續）

### 9-1. Recurring 批次能力下一步
- 批次操作可選「僅啟用中 / 僅停用中」自動排除無變更項

---

## P3. 工程品質提升

> 狀態更新（P3 第三輪）：
> - 跨 store/跨頁面整合測試（Reports 預算調整 → Home 預算警示）✅
> - 跨 store/跨頁面整合測試（Reports 新增 goals → Home 目標卡片）✅
> - Playwright 最小 smoke（開 app → 新增交易 → 報表驗證）✅
> - E2E baseline 文件同步到可執行版 ✅
> - build number 遞增腳本與 npm scripts（Android+iOS 同步）✅
> - Android/iOS build number 已同步遞增到 2 ✅

### 10. 測試再補強
- Reports 有資料時的真實趨勢測試（已完成）
- iOS / Android 端更接近真機的整合測試（已完成兩條 App 主流程整合）
- E2E 第 2 條 smoke（例如 recurring/goals）

### 11. 文件整理
- 更新 `IMPLEMENTATION_STATUS.md`（已完成）
- 更新 `FINAL_DELIVERY_SUMMARY.md`（已完成）
- 保持 `HANDOFF_INDEX.md` 與最新產物一致（已完成）

### 12. 版本管理
- 規劃版本號策略（已完成 baseline 文件）
- Android versionCode / versionName 同步管理（versionName 已同步）
- iOS build number / marketing version 規劃（marketing version 已同步）
- build number 固定遞增腳本（已完成，可直接執行）

---

## 建議更新順序

### 第一輪（最優先）
1. 真機 QA
2. iOS Signing / Archive
3. 商店素材與 metadata

### 第二輪
4. CSV 匯出體驗補強
5. Reports 深化
6. Recurring 體驗補完

### 第三輪
7. 設定頁外部能力
8. 測試補強
9. 文件與版本整理

---

## 如果只做最少更新就要上架
先做這 5 件：
1. Android 真機 QA
2. iPhone 真機 QA
3. iOS Archive 驗證
4. 商店截圖 + icon
5. Privacy Policy / 聯絡資訊補齊

---

## 下一步建議
如果現在要我直接幫你推，最值得先做的是：
- **真機 QA 缺口清單**
- **iOS Signing / Archive 待辦分解**
- **Reports / CSV 下一版功能規劃**
