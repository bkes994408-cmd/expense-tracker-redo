# Launch Final Wrap-up Plan

最後更新：2026-04-22

這份文件把 `expense-tracker-redo` 下一階段更新方向，改成更適合目前狀態的三段式規劃。

目前判斷：
- P1 / P2 / P3 的主要目標已大致完成
- 現在最缺的不是功能，而是 **真機驗證、iOS archive、商店提交流程**
- 因此接下來應以 **上架封板** 為主線，而不是再開新功能坑

---

## L0. 上架封板版（最優先）

目標：讓專案進入「可提交商店」狀態。

### L0-1. 真機 QA
#### Android
- 安裝最新 debug APK
- 依 `docs/DEVICE_QA_CHECKLIST.md` 跑完整流程
- 特別確認：
  - 首次啟動無 demo data
  - Transactions / Reports / Recurring / Settings 主流程正常
  - CSV 匯出在真機上的下載行為合理

#### iPhone
- 用 Xcode Run 到真機
- 跑同一輪核心流程
- 確認：
  - 啟動 / 導覽 / FAB / 表單正常
  - Reports / Goals / Budget / Settings 正常
  - 無明顯 layout / safe-area 問題

### L0-2. iOS Signing / Archive
- 設定 Team
- 確認 Bundle Identifier 可用
- 真機 Run 成功
- `npm run build && npx cap sync ios`
- Xcode Archive
- App Store Connect upload 驗證

### L0-3. 商店素材與 metadata
#### Android / iOS 共用先補齊
- App icon 定稿
- 手機截圖
- App 名稱 / 簡述 / 詳述
- Privacy Policy URL
- Support / Contact Email

#### Play Console
- App access
- Ads
- Data safety
- Content rating
- Target audience
- Store listing

#### App Store Connect
- Subtitle
- Description
- Keywords
- App Privacy
- Age Rating
- Contact info

### L0-4. 上架封板規則
- 非 blocker 不開新功能
- 只修真機驗收或上傳流程中發現的問題
- 每修一輪都回到 QA checklist 驗一次

---

## L1. 上架後第一版（v1.0.1 方向）

目標：把目前仍偏 placeholder 的能力補成真的。

### 建議優先項目
1. **評分 App 接真實商店頁**
2. **iCloud backup 要嘛接真功能，要嘛先收斂入口**
3. **Recurring 提醒 / 自動入帳規則**
4. **CSV 匯出一致性收尾**
   - 檔名
   - 匯出記錄
   - 成功卡與版本資訊一致化

---

## L2. 中期產品進化

目標：上架穩定後，再往產品深度推進。

### 可放這裡的方向
1. 多幣別 / 匯率 / 國際化
2. 更進階 Reports
3. 更完整 recurring automation
4. 第 2 / 第 3 條 E2E smoke
5. 發版自動化 / CI

---

## 建議節奏

### 第一輪（現在就該做）
1. Android 真機 QA 缺口清單
2. iPhone 真機 QA 缺口清單
3. iOS Signing / Archive 待辦拆解
4. 商店 metadata 缺口清單

### 第二輪（修 blocker）
1. 修真機 QA blocker
2. 跑 iOS Archive
3. 補齊 icon / screenshots / policy / contact

### 第三輪（提交流程）
1. Android AAB 上傳 Internal testing
2. iOS build 上傳 App Store Connect
3. 完成送審前最終檢查

---

## 如果只做最少一包就要上架
先做這 5 件：
1. Android 真機 QA
2. iPhone 真機 QA
3. iOS Archive 驗證
4. 商店截圖 + icon
5. Privacy Policy / Support Email

---

## 現階段不建議優先做
- 大改 UI 架構
- 再開一批新報表功能
- 深挖多幣別 / 匯率
- 複雜 recurring engine
- 大型自動化重構

原因：這些都會延後上架，不是目前最高價值。

---

## 目前最推薦的主線
**直接進 L0，上架封板版。**

最值得先拆的三包：
1. 真機 QA
2. iOS Signing / Archive
3. 商店提交流程
