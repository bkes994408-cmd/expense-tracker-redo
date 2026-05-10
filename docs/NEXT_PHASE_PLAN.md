# Next Phase Plan

最後更新：2026-05-08（更新功能 U1～U5 後）

這份文件整理 `expense-tracker-redo` 從現在開始的兩條主線，避免下一步分散。

## 路線 A，上架前最後收尾（建議優先）

### A1. 真機 QA
- Android 真機完整驗收
- iPhone 真機完整驗收
- 依 `docs/DEVICE_QA_CHECKLIST.md` 收斂 blocker

### A2. iOS 真機 Signing / Archive
- Xcode Team / Signing 設定
- 真機 Run
- Archive
- App Store Connect 上傳驗證

### A3. 商店素材與 metadata
- App icon 定稿
- 截圖實拍
- Privacy Policy URL
- Support / Contact Email
- Play Console / App Store Connect 必填欄位補齊

### A4. 上傳與送審
- Android：AAB 上傳 Internal testing / Closed testing
- iOS：Archive 上傳 App Store Connect

---

## 路線 B，P3 工程品質提升

### B1. 測試再補強
- Reports 有資料時的真實趨勢測試
- iOS / Android 端更接近真機的整合驗證
- 規劃 E2E smoke

### B2. 文件整理
- 同步更新 `FINAL_DELIVERY_SUMMARY.md`
- 保持 `HANDOFF_INDEX.md` 與最新產物一致
- 補開發 / 發佈流程標準化文件

### B3. 版本管理
- 明確版本號策略（1.0.0 / 1.0.1）
- Android versionCode / versionName 管理
- iOS build number / marketing version 管理

---

## 建議順序
### 若目標是最近就上架
請先走：
1. A1 真機 QA
2. A2 iOS Signing / Archive
3. A3 商店素材與 metadata
4. A4 上傳與送審

### 若目標是再磨工程品質
請先走：
1. B1 測試再補強
2. B2 文件整理
3. B3 版本管理

## 我目前建議
**先走路線 A。**

原因很簡單，P1 / P2 你要的功能面已經補到夠完整了，現在最有價值的是把它推到：
- 真機可驗
- 可上架
- 可交付

---

## 路線 C，更新功能後續（U6+）

U1～U20 已完成版本資訊、migration registry、本機復原點、檢查更新 UX、分類/備註規則版本化、更新診斷匯出、主動重新套用分類規則、同步狀態中心、匯率口徑準備、商店連結設定、遠端更新 manifest 基礎、遠端 manifest 查詢/fallback、required update 主要操作保護流程、optional/recommended 更新提醒與略過 baseline、Settings 更新入口狀態 badge、recommended 稍後提醒到期判斷、更新提醒清除/重新設定流程、提醒到期後一鍵再延後 24 小時、正式商店版本查詢前置檢查，以及正式商店版本查詢 adapter 型別與 fallback 優先序。

建議後續：
1. U21：正式 App Store / Play Store 版本查詢 mock adapter，先以可注入 fetcher 覆蓋成功/失敗與 fallback。
2. 接入正式 App Store / Play Store 版本查詢；商店連結已可用 `VITE_APP_STORE_URL` / `VITE_PLAY_STORE_URL` 設定，遠端版本 manifest 已可查詢並具備 fallback。
3. 若要啟用真正匯率換算，需補匯率來源、缺值 fallback 與歷史匯率測試。
3. 補更接近真機的 iOS / Android QA 驗證與截圖素材流程。

目前建議：仍優先走路線 A 上架前收尾；更新功能已足以支撐上架後安全迭代。
