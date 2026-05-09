# IMPLEMENTATION_STATUS

最後更新：2026-05-10（更新功能 U10）

## 0) 本輪完成（Update Feature U10：商店連結設定）

### U10. App Store / Play Store 連結設定
- `src/utils/updateInfo.ts`
  - 新增 `createStoreLinks()`、`normalizeStoreUrl()`、`getPrimaryReadyStoreLink()`，透過 `VITE_APP_STORE_URL` / `VITE_PLAY_STORE_URL` 產生商店更新連結狀態。
  - 只接受 `https://` 商店 URL；未設定或不安全 URL 會維持 placeholder，避免誤導可更新。
- `src/pages/settings/SettingsPage.tsx`
  - 「檢查更新」改讀設定後的商店連結；有可用連結且不是目前版本時，主要操作可開啟商店。
  - UI 顯示每個商店連結對應的 env key，方便上架前 QA 確認設定來源。
- `.env.example`、`.gitignore`
  - 新增商店連結範例環境變數，並避免本機 `.env*` 誤入版本庫。
- `src/test/updateInfo.test.ts`、`src/test/interaction.test.tsx`
  - 補安全 URL 正規化、env-driven store links 與既有 Settings 檢查更新流程測試。

### 驗證
- `npm run test -- updateInfo interaction` ✅ 2 files / 58 tests passed
- `npm run build` ✅ passed
- `npm run lint` ✅ passed

最後更新：2026-05-10（更新功能 U9）

## 0) 本輪完成（Update Feature U9：匯率口徑準備）

### U9. 匯率資料狀態 baseline
- `src/utils/exchangeRatePolicy.ts`
  - 新增 `createExchangeRateReadinessSummary()`，描述顯示幣別、基準幣別、匯率來源狀態與歷史匯率口徑。
  - 目前預設為「尚未設定匯率來源 / 尚未定義歷史匯率口徑 / 不自動換算」。
- `src/pages/settings/SettingsPage.tsx`
  - Settings > 偏好設定新增「匯率資料狀態」提示，明確說明目前只切換符號與格式，不會自動換算。
- `src/test/exchangeRatePolicy.test.ts`、`src/test/interaction.test.tsx`
  - 補匯率口徑 helper 與 Settings UI 文案測試。

### 驗證
- `npm run release:check` ✅ overall pass
  - `npm run test` ✅ 23 files / 144 tests passed
  - `npm run build` ✅ passed
  - `npm run test:e2e:smoke` ✅ 1 passed
- `npm run lint` ✅ passed

最後更新：2026-05-10（更新功能 U8）

## 0) 本輪完成（Update Feature U8：同步狀態中心）

### U8. Settings 同步狀態中心
- `src/utils/syncStatus.ts`
  - 新增 `createSyncStatusSummary()`，集中產生本機資料、CSV 匯出、本機復原點與雲端同步狀態。
  - 明確標示 iCloud 開關只代表本機狀態，不代表已上傳或可跨裝置同步。
- `src/pages/settings/SettingsPage.tsx`
  - Settings 新增「同步狀態」區塊，顯示本機交易筆數、最近 CSV 匯出、本機復原點與雲端同步限制。
  - 新增「複製同步狀態」按鈕，方便 QA / 換機 / 回報問題時交接。
- `src/test/syncStatus.test.ts`、`src/test/interaction.test.tsx`
  - 補同步狀態 helper 與 Settings UI 互動測試。

### 驗證
- `npm run release:check` ✅ overall pass
  - `npm run test` ✅ 22 files / 142 tests passed
  - `npm run build` ✅ passed
  - `npm run test:e2e:smoke` ✅ 1 passed
- `npm run lint` ✅ passed

最後更新：2026-05-09（更新功能 U7）

## 0) 本輪完成（Update Feature U7：主動重新套用分類規則）

### U7. 分類規則批次重新套用
- `src/domain/types.ts`
  - `Transaction` 新增 `categorySource` 與 `categoryRuleVersion`，用來區分系統分類與使用者手動分類。
- `src/rules/categoryRules.ts`
  - 新增 `reapplyCategoryRulesToTransactions()`，只會重新套用 `categorySource=system` 的交易。
  - 舊資料或手動分類預設視為受保護，不會被批次覆蓋。
- `src/pages/transactions/RecordsTab.tsx`、`src/app/App.tsx`
  - 記錄頁新增「重新套用分類規則」區塊，依目前篩選範圍操作，並回報更新筆數與受保護筆數。
- `src/utils/quickEntryParser.ts`、`src/components/modals/TxnModal.tsx`
  - Quick Entry 建立的分類會標記為系統分類；手動/計算機輸入維持使用者分類。
- `src/test/categoryRules.test.ts`、`src/test/interaction.test.tsx`
  - 補批次重新套用、手動分類保護與 UI 互動測試。

### 驗證
- `npm run release:check` ✅ overall pass
  - `npm run test` ✅ 21 files / 140 tests passed
  - `npm run build` ✅ passed
  - `npm run test:e2e:smoke` ✅ 1 passed
- `npm run lint` ✅ passed

最後更新：2026-05-09（更新功能 U6）

## 0) 本輪完成（Update Feature U6：更新診斷匯出）

### U6. 可複製更新診斷
- `src/utils/updateInfo.ts`
  - 新增 `createUpdateDiagnosticsText()`，彙整版本、build、schema、更新狀態、更新策略、商店連結狀態、本機復原點與規則版本。
- `src/pages/settings/SettingsPage.tsx`
  - Settings > 關於 > 更新保護新增「複製更新診斷」按鈕，方便回報問題或交接 QA。
- `src/test/updateInfo.test.ts`、`src/test/interaction.test.tsx`
  - 補診斷文字與複製互動測試。

### 驗證
- `npm run test -- updateInfo interaction` ✅ 2 files / 55 tests passed
- `npm run build` ✅ passed
- `npm run lint` ✅ passed

最後更新：2026-05-08（更新功能 U1～U5）

## 0) 本輪完成（Update Feature U1～U5）

### U1. 版本資訊 / Release Notes / 檢查更新 baseline
- `src/utils/updateInfo.ts`
  - 新增 App version、build number、data schema version、release channel、release notes 與 update status helpers。
- `src/pages/settings/SettingsPage.tsx`
  - Settings 顯示版本資訊、更新內容彈窗、檢查更新彈窗。
  - 明確標示目前商店查詢尚未接入，不假裝可直接更新。
- `src/test/updateInfo.test.ts`、`src/test/interaction.test.tsx`
  - 補版本資訊、更新內容與檢查更新互動測試。

### U2. Finance migration registry
- `src/store/financeMigrations.ts`
  - 集中管理 `FINANCE_SCHEMA_VERSION = 5` 與 migration registry。
  - migration report 記錄 reset legacy seed、交易幣別 fallback、recurring 欄位補齊與 warnings。
- `src/store/financeStore.ts`、`src/store/financeStoreHelpers.ts`
  - persistence version 改由 registry 單一來源管理。
- `src/test/financeMigrations.test.ts`、`src/test/financeStore.test.ts`
  - 補 registry、舊資料 migration 與既有行為保護測試。

### U3 / U3.5. 更新前本機復原點與 recovery status
- `src/store/migrationBackupStorage.ts`
  - schema upgrade 前建立 `expense-tracker-redo-finance-migration-backup`。
  - corrupted JSON 會保存原始 raw data，並讓 App 回復乾淨狀態，避免 hydrate 白屏。
  - 提供 backup snapshot parse 與 Settings status copy。
- `src/pages/settings/SettingsPage.tsx`
  - Settings 顯示本機復原點狀態；壞資料恢復時以 warning tone 顯示。
- `src/test/migrationBackupStorage.test.ts`
  - 補 schema upgrade backup、corrupted JSON backup、status parse 測試。

### U4. 檢查更新 UX 行為策略
- `src/utils/updateInfo.ts`
  - 定義 `current / optional / recommended / required` 更新策略。
  - required 更新限制主要操作，但資料匯出永遠保留。
  - App Store / Play Store 先以 placeholder 顯示「上架後啟用」。
- `src/pages/settings/SettingsPage.tsx`
  - 檢查更新彈窗顯示更新行為策略、商店連結狀態與復原點狀態。

### U5. 分類規則 / 備註建議版本化
- `src/rules/categoryRules.ts`
  - 新增 `CATEGORY_RULE_VERSION = 2026.05.08-u5`。
  - 新增 `NOTE_SUGGESTION_RULE_VERSION = 2026.05.08-u5`。
  - 集中管理 merchant/category keywords 與 note presets。
  - `shouldApplyRuleCategory()` 保護使用者手動分類，不讓系統規則覆蓋。
- `src/utils/quickEntryParser.ts`、`src/components/modals/TxnModal.tsx`
  - quick entry 分類與 note presets 改用 versioned rules。
- `src/test/categoryRules.test.ts`
  - 補規則版本、分類偵測與手動分類保護測試。

### 驗證
- `npm test` ✅ 21 files / 137 tests passed
- `npm run build` ✅ passed

最後更新：2026-04-24（L2-1a 顯示層多幣別 baseline 第三輪）

## 0) 本輪完成（L2-1a：顯示層多幣別 baseline 第三輪）

### 0-1. transaction originalCurrency 真接線
- `src/domain/types.ts`
  - `Transaction` 新增最小欄位 `originalCurrency?: 'NTD' | 'USD' | 'JPY'`
- `src/app/App.tsx`
  - 新增交易時，`originalCurrency` 來源改為「建立當下 display currency」
  - 編輯交易時保留既有 `originalCurrency`（若不存在則 fallback 當下 display currency）
- `src/store/financeStore.ts`
  - persistence version 升級到 `5`
  - migration 補舊交易 fallback：`originalCurrency ?? 'NTD'`

### 0-2. adapter 實際吃到 originalCurrency（仍不換算）
- `src/utils/currencyDisplay.ts`
  - `adaptAmountForDisplay()` 現在會 resolve `originalCurrency`（缺省 fallback 到 `baseCurrency`）
  - `converted` 維持 `false`，目前仍是 display adapter，不做匯率換算
- `src/pages/transactions/TxnRow.tsx`、`src/pages/home/HomePage.tsx`
  - 顯示層改由 `adaptAmountForDisplay(...)` 實際吃 `tx.originalCurrency`

### 0-3. 使用者可感知語意（低噪音）
- `Transactions > TxnRow`
  - 當 `originalCurrency !== displayCurrency` 時顯示：`原始 X → 顯示 Y（未換算）`
- `Home > 最近紀錄`
  - 同條件下顯示短版：`原始 X（未換算）`

### 0-4. 測試補強
- `src/test/currencyDisplay.test.ts`
  - unit：`originalCurrency` fallback 與 `converted=false`
- `src/test/financeStore.test.ts`
  - unit：舊交易 migration 會補 `originalCurrency=NTD`
- `src/test/interaction.test.tsx`
  - interaction：TxnRow 可觀察 original/display 語意
- `src/test/appIntegration.test.tsx`
  - integration：新增交易後 `originalCurrency` 寫入（來源為當下 display currency），切換 display 後語意可見

## 0) 本輪完成（L2-1a：顯示層多幣別 baseline 第二輪）

### 0-1. base/display 語意前置
- `src/utils/currencyDisplay.ts`
  - 新增 `CurrencyDisplayContext`（`displayCurrency` + `baseCurrency`）
  - 新增 `adaptAmountForDisplay()`：目前只做顯示 adapter（`converted=false`），不做換算
  - 新增 `getDisplayCurrencySemanticHint()`：統一顯示語意文案

### 0-2. 關鍵區塊補上短版顯示語意
- `src/pages/settings/SettingsPage.tsx`
  - 幣別說明改為動態口徑提示（顯示幣別 / 基準幣別 / 未換算）
- `src/pages/reports/ReportTab.tsx`
  - 報表摘要新增幣別口徑提示
- `src/pages/reports/BudgetTab.tsx`、`src/pages/reports/GoalsTab.tsx`
  - 頁首新增短版幣別口徑提示

### 0-3. 測試補強
- `src/test/currencyDisplay.test.ts`
  - unit：驗證 display/base currency adapter 核心路徑與「不換算」行為
- `src/test/appIntegration.test.tsx`
  - integration：Settings 切換 display currency 後，Reports/Budget 的幣別語意提示同步更新

## 0) 本輪完成（L2-B：Reports 決策摘要可行動化最小版第三輪）

### 0-1. 摘要快捷導流（Budget / Goals）
- `src/pages/reports/ReportTab.tsx`
  - 在「預算使用摘要」新增快捷入口：`前往預算查看`
  - 在「儲蓄目標摘要」新增快捷入口：`前往目標查看`
  - 入口採 summary shortcut 形式（icon + 簡短文案），維持摘要卡視覺
- `src/pages/reports/ReportsPage.tsx`
  - ReportTab 新增 `onJumpToSection`，點擊快捷後直接切換到對應 tab（budget / goals）

### 0-2. 目標區塊可觀察性補強
- `src/pages/reports/BudgetTab.tsx`
  - 加上 `aria-label="預算分頁內容"`
- `src/pages/reports/GoalsTab.tsx`
  - 加上 `aria-label="目標分頁內容"`

### 0-3. 測試補強
- `src/test/interaction.test.tsx`
  - 新增 interaction：點 Reports 摘要快捷可切到預算/目標分頁，且看得到對應內容
- `src/test/appIntegration.test.tsx`
  - 新增 integration：摘要先顯示超支/目標脈絡，點快捷後分別落到預算/目標頁並看到對應內容

## 0) 本輪完成（L2-B：Reports 決策摘要可操作性微升級第二輪）

### 0-1. 摘要語意補強（時間口徑 / 即時計算）
- `src/pages/reports/ReportTab.tsx`
  - 新增「報表決策摘要提示」：`口徑：本月預算/目標 + 近期趨勢區間；依目前資料即時計算。`

### 0-2. 超支 / 接近超支顯示收斂（top N + +N）
- `src/pages/reports/ReportTab.tsx`
  - 已超支與接近超支統一改為 `數量 + top N 名單 + +N`
  - empty state 統一為 `（目前無）`
  - 避免分類名單過長撐版

### 0-3. 目標摘要微升級
- `src/pages/reports/ReportTab.tsx`
  - 目標排序規則調整為：進度高優先 -> 剩餘金額少優先 -> target 小優先 -> id
  - 新增「即將完成（>=80%）」摘要（支援 top N + +N / empty state）

### 0-4. 測試補強
- `src/test/reportsRealData.test.tsx`
  - 新增決策摘要提示斷言
  - 新增超支/接近超支 top N + +N 斷言
  - 新增即將完成（>=80%）與無即將完成文案斷言
- `src/test/appIntegration.test.tsx`
  - 新增跨頁路徑：先在 Goals 變更資料，再切回 Reports 驗證摘要即時更新

## 0) 本輪完成（L2-B：Reports 預算 / 目標聯動 baseline）

### 0-1. Reports 新增「報表決策摘要（僅供檢視）」
- `src/pages/reports/ReportTab.tsx`
  - 新增預算摘要：本月總預算使用率、已超支分類數/名單、接近超支提醒（>=85%）
  - 新增目標摘要：目標整體進度、最接近完成目標
  - 與既有 `budgets/goals` 真實資料串接，無資料時提供 empty state
- `src/pages/reports/ReportsPage.tsx`
  - 報表 tab 傳入 `budgets/goals` 與當月交易 `summaryTxns`，讓摘要可反映跨頁更新

### 0-2. 測試補強
- `src/test/reportsRealData.test.tsx`
  - 新增預算聯動摘要與目標聯動摘要斷言
  - 新增 budget/goals empty state 斷言
- `src/test/appIntegration.test.tsx`
  - 補一條整合路徑：在 Reports 調整預算後，回到 Reports summary 立即反映
  - 補一條整合路徑：在 Reports 新增目標後，回到 Reports summary 立即反映

## 0) 本輪完成（L2-3b 自動入帳 baseline 第三輪：confirm/pending 補強）

### 0-1. pending 專屬篩選 / 分區（最小）
- `src/pages/transactions/RecurringTab.tsx`
  - 到期篩選新增 `待確認 (N)`
  - 到期提醒摘要新增 `待確認 N 項`
  - 與既有狀態篩選、搜尋、到期篩選共存

### 0-2. pending 批次操作 baseline
- `src/pages/transactions/RecurringTab.tsx`
  - 新增 `批次確認入帳`、`批次略過本輪`
  - 規則：已選取 pending 優先，否則作用於目前篩選結果中的 pending
- `src/app/App.tsx`
  - 批次結果 toast 顯示影響筆數，並列出部分名稱

### 0-3. confirm 交易日期策略（最小）
- `src/pages/transactions/RecurringTab.tsx`
  - 新增「確認入帳日期策略」：今天 / 到期日
- `src/domain/recurring.ts`
  - `buildRecurringTransaction()` 支援 `today | cycle`
- `src/app/App.tsx`
  - 單筆/批次 confirm 都套用同一策略，並回饋策略文案

### 0-4. 測試與驗證
- `src/test/interaction.test.tsx`
  - 新增 pending 專屬篩選
  - 新增 pending 批次確認 / 略過
  - 新增確認入帳日期策略切換
- `src/test/appIntegration.test.tsx`
  - 新增批次確認後交易與首頁摘要同步變化

## 0) 本輪完成（L2-3b 自動入帳 baseline 第二輪：confirm）

### 0-1. auto-post 升級為三態
- `src/domain/types.ts`
  - recurring 新增 `autoPostMode: off | on | confirm`
  - 新增 `pendingCycle`（待確認輪次）
- `src/domain/recurring.ts`
  - `normalizeRecurringItem()` 支援舊 `autoPost` 遷移為三態
  - reconcile 規則改為三態：
    - `off` 不處理
    - `on` 維持原自動入帳
    - `confirm` 建立 pending（不直接入帳）

### 0-2. confirm 最小流程（待確認 / 確認 / 略過）
- `src/pages/transactions/RecurringTab.tsx`
  - UI 可直接設定 `off / on / confirm`
  - pending 狀態明確顯示「尚未入帳」
  - 新增「確認入帳」「略過本輪」操作
- `src/app/App.tsx`
  - 確認入帳：建立交易 + 推進 nextDate
  - 略過本輪：不建交易 + 推進 nextDate

### 0-3. 最小資料規則與防重複
- 新增最小欄位：`pendingCycle`
- 防重複規則：
  - `pendingCycle === nextDate` 時不重複建立 pending
  - `lastAutoPostCycle === nextDate` 時不重複入帳
  - 確認/略過後皆寫入 `lastAutoPostCycle`，避免同輪再次進 pending

### 0-4. 測試與驗證
- `src/test/recurringAutoPost.test.ts`
  - unit：off/on/confirm 三態核心規則
  - unit：confirm pending 防重複
  - unit：confirm / skip 後狀態推進
- `src/test/interaction.test.tsx`
  - interaction：三態設定與 pending 操作按鈕
- `src/test/appIntegration.test.tsx`
  - integration：reconcile 後出現待確認，確認後交易/報表可觀察變化
- 驗證：
  - `npm test` ✅（12 files / 62 tests passed）
  - `npm run build` ✅

## 0) 本輪完成（L2-3b 自動入帳 baseline 第一輪）

### 0-1. recurring 自動入帳 baseline
- `src/domain/types.ts`
  - recurring 新增 `autoPost`（是否自動入帳）與 `lastAutoPostCycle`（去重保護）
- `src/domain/recurring.ts`
  - 新增 recurring 日期工具與 `reconcileRecurringAutoPost()`
  - 規則：到期且 `autoPost=true` 時自動產生 1 筆交易，並推進 `nextDate`
- `src/app/App.tsx`
  - reconcile 觸發時機：App 啟動時、切到「收支」頁時
  - 使用既有 financeStore，讓交易變更自然反映到 Transactions / Home / Reports

### 0-2. 重複入帳保護（最小）
- 以 `lastAutoPostCycle` 記錄「已入帳的到期輪次」
- 若同輪次重跑 reconcile（`lastAutoPostCycle===nextDate`）則不再產生交易，只推進 `nextDate`

### 0-3. UI 設定入口（最小）
- `src/pages/transactions/RecurringTab.tsx`
  - 列表每筆新增「自動入帳」快速切換
  - 編輯模式新增「到期自動入帳」勾選，儲存後寫回 recurring
  - 列表次要資訊顯示「自動入帳開啟/關閉」

### 0-4. 測試與驗證
- `src/test/recurringAutoPost.test.ts`
  - unit：到期自動入帳與 `nextDate` 推進
  - unit：同輪次去重保護不重複入帳
- `src/test/interaction.test.tsx`
  - interaction：Recurring 自動入帳設定可編輯與快速切換
- `src/test/appIntegration.test.tsx`
  - integration：reconcile 後交易列表與報表可觀察變化

## 0) 本輪完成（L2 最小一包第三輪）

### 0-1. L2-M8 recurring 與 Home / Reports 串接一致性
- `src/pages/home/HomePage.tsx`
  - 「即將扣款」卡片新增首頁提醒摘要（今日到期 / 7 天內到期 / 逾期未處理）
  - 摘要與 RecurringTab 共用同一份 recurring source，避免跨頁數值打架
  - Recurring 提醒處理後，回到 Home 可立即觀察摘要同步
- `src/pages/reports/ReportsPage.tsx`
  - 本輪確認 Reports 不直接顯示 recurring 提醒摘要，維持報表聚焦交易分析，不額外塞入重功能

### 0-2. L2-M8a 提醒文案一致性收斂
- `src/pages/transactions/RecurringTab.tsx`
  - 提醒摘要統一為：`今日到期 / 7 天內到期 / 逾期未處理`
  - 快速篩選文案統一：`全部到期項目 / 今日到期 / 7 天內到期 / 逾期未處理`
  - 提醒摘要卡與 empty state 文案同步收斂（避免「到期日/即將扣款/逾期」混用）

### 0-3. L2-M8b 測試補強與驗證
- `src/test/appIntegration.test.tsx`
  - 新增真實流程整合斷言：Recurring 操作前後，Home 與 Recurring 摘要同步變化
- `src/test/interaction.test.tsx`
  - 新增互動測試：提醒摘要 / 快速篩選 / empty state 文案一致性
- 驗證：
  - `npm test` ✅
  - `npm run build` ✅

## 0) 本輪完成（L2 最小一包第二輪）

### 0-1. L2-M4 recurring 提醒處理動作 baseline
- `src/pages/transactions/RecurringTab.tsx`
  - 新增提醒處理快捷按鈕：`標記已處理`、`延後一次`
  - 規則（最小一致版）：
    - 標記已處理：`nextDate` 依頻率推進到「晚於今天」
    - 延後一次：`nextDate` 依頻率固定推進 1 個週期
  - 延用既有 `onSave -> financeStore` 流程，不新增完整 recurring engine

### 0-2. L2-M4a 動作後同步
- `src/pages/transactions/RecurringTab.tsx`
  - 動作後提醒摘要（今日/7天內/逾期）立即更新
  - 動作後到期篩選結果立即更新（today/due7/overdue）
  - 與既有 Home/Transactions 共用 recurring source，避免狀態打架

### 0-3. L2-M4b 測試補強與驗證
- `src/test/interaction.test.tsx`
  - 新增互動測試：覆蓋 `標記已處理` / `延後一次` 兩種操作
- `src/test/appIntegration.test.tsx`
  - 新增整合測試：Recurring 操作後摘要與篩選立即同步（App 真實流程）
- 驗證：
  - `npm test` ✅
  - `npm run build` ✅

## 0) 本輪完成（L2 最小一包第一輪）

### 0-1. L2-M1 recurring 到期提醒 baseline
- `src/pages/transactions/RecurringTab.tsx`
  - 新增 app 內到期提醒摘要：今日到期 / 7 天內到期 / 已逾期未處理
  - 新增快速篩選：今日到期、7 天內到期、逾期未處理（保留既有全部/啟用/停用與搜尋）
  - 維持原有批次啟停與摘要，避免與既有 recurring 篩選打架

### 0-2. L2-M2 reports 時間分析 baseline
- `src/pages/reports/ReportTab.tsx`
  - 新增 `月 / 季` 分析模式切換（在原 3/6/12 月期間切換上再加一層）
  - 環比文案強化：月對月 / 季對季分別顯示，含資料不足與前期為 0 的處理
  - 新增時間區間摘要文案（目前分析模式 + 區間）

### 0-3. 測試補強與驗證
- `src/test/interaction.test.tsx`
  - 新增 recurring 今日到期/逾期篩選互動測試
  - 補 recurring 到期提醒摘要斷言
- `src/test/reportsRealData.test.tsx`
  - 新增 reports `月/季` 新路徑斷言（含季對季 fallback）
- 同步更新既有環比文案斷言：
  - `src/test/appIntegration.test.tsx`
  - `src/test/interaction.test.tsx`
  - `src/test/reportsRealData.test.tsx`
- 驗證：
  - `npm test` ✅（11 files / 52 tests passed）
  - `npm run build` ✅

## 0) 本輪完成（P3 第三輪）

### 0-1. Playwright 最小 smoke 正式落地
- 新增 `playwright.config.ts`
  - `chromium` baseline + `webServer`
- 新增 `e2e/smoke.spec.ts`
  - 流程：開 app → 新增交易 → 報表驗證 `NT$200`
- `package.json` 新增 `test:e2e:smoke`
- `vite.config.ts` 新增 `exclude: ['e2e/**', ...]`，避免 Vitest 載入 Playwright 測試
- `src/components/navigation/BottomNav.tsx` 補上 `aria-label`（FAB/底部切頁）以穩定 e2e selector

### 0-2. 跨 store / 跨頁面整合測試再補一條
- `src/test/appIntegration.test.tsx`
  - 新增路徑：Reports 新增 goals 後，切回 Home 驗證儲蓄目標卡片立即反映

## 0) 本輪完成（P3 第二輪）

### 0-1. 跨 store / 跨頁面整合測試補強
- `src/test/appIntegration.test.tsx`
  - 新增路徑：在 Reports 的 BudgetTab 調整「餐飲預算」後，切回 Home 驗證「預算警示」立即反映
  - 覆蓋點：
    - 跨頁面狀態連動（報表頁操作 -> 總覽頁顯示）
    - 跨 store 邊界（financeStore budgets 變動 -> Home alerts 可觀察變化）

### 0-2. E2E baseline 採文件落地
- 新增 `docs/E2E_PLAN.md`
  - 定義推薦工具（Playwright）
  - 定義最小 smoke 流程（新增交易 -> 報表驗證 -> 設定入口）
  - 明確列出現況 blocker 與下一輪落地步驟

### 0-3. 版本遞增流程 baseline（可執行）
- 新增 `scripts/bump-build-number.mjs`
  - 同步遞增 Android `versionCode` 與 iOS `CURRENT_PROJECT_VERSION`
  - 預設自動 +1（以 Android/iOS 較大值為基準）
  - 支援指定值 `--set <number>`
- `package.json` 新增 scripts
  - `version:bump:build`
  - `version:bump:build:set`
- 已驗證執行一次：
  - Android `versionCode`：`1 -> 2`
  - iOS `CURRENT_PROJECT_VERSION`：`1 -> 2`

## 0) 本輪完成（P3 第一輪）

### 0-1. Reports 真實資料測試補強
- `src/test/reportsRealData.test.tsx`
  - 補齊有資料時的核心路徑：
    - 月支出趨勢（最新月份選取與柱狀資料）
    - 分類占比（金額/百分比）
    - 月對月變化率（含可計算與前月為 0 的分支）

### 0-2. App integration smoke 補強
- `src/test/appIntegration.test.tsx`
  - 新增接近真實流程路徑：
    - 從 App 透過 FAB 新增交易
    - 切到 Reports，驗證趨勢/月對月/分類占比立即反映

### 0-3. 測試 helper 整理
- `src/test/testTheme.ts`
  - 抽出測試共用 theme token（`t/r/f`）
- `src/test/smoke.test.tsx`、`src/test/interaction.test.tsx`
  - 改用共用 helper，減少重複常數

### 0-4. 版本管理 baseline 建立與同步
- 新增 `docs/VERSIONING_BASELINE.md`
  - 盤點 package / Android / iOS 版本來源
  - 定義 `versionName/versionCode`、`MARKETING_VERSION/CURRENT_PROJECT_VERSION` 更新規則
- 低風險一致化：
  - `package.json` → `version: 1.0.0`
  - `android/app/build.gradle` → `versionName "1.0.0"`
  - `ios/App/App.xcodeproj/project.pbxproj` → `MARKETING_VERSION = 1.0.0`

### 0-5. 文件同步
- 更新 `docs/FINAL_DELIVERY_SUMMARY.md`
- 更新 `docs/HANDOFF_INDEX.md`
- 新增 `docs/TEST_GUIDE.md`（單元/互動/整合測試導覽）
- `README.md` 最小同步（狀態與文件入口）

## 0) 本輪完成（P2 第三輪）

### 0-1. recent note 排序加入分類場景權重
- `src/store/appStore.ts`
  - 新增 `recentNoteCategoryStats`，記錄「備註在各分類的使用次數 + 最近時間」
  - 新增 `rankRecentNotesByCategoryContext()`：原本頻率+時間分數上，再疊加目前分類的 context score
- `src/app/App.tsx`
  - 儲存交易時 `pushRecentNote(note, category)` 同步寫入分類脈絡
- `src/components/modals/TxnModal.tsx`
  - 最近備註會依目前選擇分類動態重排，分類切換時排序會跟著變

### 0-2. 清除流程新增確認字串
- `src/pages/settings/SettingsPage.tsx`
  - 清除流程改為兩階段：
    1) 先進入 armed
    2) 輸入確認字串 `CLEAR` 才能按下最終清除
  - 若未輸入/輸錯，按鈕 disabled，並顯示明確提示文案
  - 取消或關閉 dialog 會重置 armed 與輸入字串

### 0-3. RiskNotice 樣式 token/視覺統一
- `src/components/common/ui.tsx`
  - 抽出共用 `RiskNotice`，統一 icon、色階、間距與版型
- `src/pages/settings/SettingsPage.tsx`
  - 匯出/iCloud/清除風險提示全面改用共用元件

### 0-4. 測試補強
- `src/test/appStore.test.ts`
  - 新增 category context 影響 recent note 排序測試
- `src/test/interaction.test.tsx`
  - 新增 TxnModal 分類切換影響最近備註排序路徑
  - 清除流程測試覆蓋：未輸入/輸錯不可清、輸入 `CLEAR` 才可清
- `src/test/clearDataFlow.test.ts`
  - 補 `recentNoteCategoryStats` 在 reset 後應清空

## 0) 本輪完成（P2 第二輪）

### 0-1. 最近分類 / 最近備註排序升級
- `src/store/appStore.ts`
  - recent usage 新增 stats（`count` + `lastUsedAt`）
  - 排序改為「使用頻率 + 最近時間」混合分數
  - 維持最多 8 筆上限，超出會同步裁切 stats
  - 增加 migration：舊版只有 recent list 時會自動補 stats

### 0-2. 清除資料流程邊界補強
- `src/pages/settings/SettingsPage.tsx`
  - 清除確認 sheet 的「取消 / 點背景關閉」會同步重置 `clearArmed`
  - 避免使用者重開後直接處於第二次確認狀態
- `src/test/interaction.test.tsx`
  - 新增測試：取消後重開應回到第一階段確認、最終清除成功後 dialog 關閉
- `src/test/clearDataFlow.test.ts`
  - 新增測試：清除後交易/定期/目標/預算與 recent categories/notes/stats 一致回乾淨狀態

### 0-3. 匯出 / 備份 / 清除風險提示共用化
- `src/pages/settings/SettingsPage.tsx`
  - 抽出共用 `RiskNotice` 區塊
  - 套用到 CSV 匯出提醒、iCloud 備份提醒、清除資料高風險提示
  - 語氣與視覺樣式統一，減少散亂感

### 0-4. 測試補強
- `src/test/appStore.test.ts`
  - 新增排序核心邏輯測試（頻率 + 最近時間）
  - 新增最近項目上限與 stats 裁切測試
  - 新增舊版 recent list migration 與 reset 測試

## 0) 本輪完成（P2 第一輪）

### 0-1. 交易輸入效率
- `src/components/modals/TxnModal.tsx`
  - 新增最近使用分類（recent chips，優先顯示可用分類）
  - 新增最近使用備註（快速帶入）
  - Calculator 錯誤提示補強：
    - 除以 0 顯示「無法除以 0」
    - 非法算式顯示「算式格式不正確」
- `src/store/appStore.ts` + `src/app/App.tsx`
  - recent categories / notes 以 `appStore` 持久化（最多 8 筆）
  - 新增/編輯交易儲存時自動更新最近使用紀錄

### 0-2. 清資料 / 匯出 / 備份安全性
- `src/pages/settings/SettingsPage.tsx`
  - 清除所有資料改為二次確認（底部確認 sheet + 二次點擊）
  - CSV 區塊補「匯出流程提示」文案（產生檔案 -> 觸發下載 -> 成功摘要）
  - iCloud 備份補強說明：目前僅本機狀態開關，尚未上傳雲端
- `src/app/App.tsx`
  - 匯出 toast 文案更清楚（開始準備 / 完成下載）
  - 清除所有資料時同步清掉 recent usage 與最近匯出摘要

### 0-3. 測試補強
- `src/test/interaction.test.tsx`
  - 新增清除資料二次確認流程測試
  - 新增 TxnModal 最近分類/備註快速帶入測試
  - 新增 TxnModal Calculator 錯誤提示測試（除以 0、非法算式）

## 0) 本輪完成（P1 收尾輪）

### 0-1. Recurring sticky 工具列 + 大量資料可視性
- `src/pages/transactions/RecurringTab.tsx`
  - 批次操作工具列改為 `sticky`（置頂，長列表捲動不易消失）
  - 新增「搜尋名稱或分類」欄位，搭配既有狀態/到期篩選可快速收斂大量資料
  - 批次摘要新增總筆數（已選取 / 目前篩選 / 總共）

### 0-2. Reports period 切換一致策略
- `src/pages/reports/ReportTab.tsx`
  - active selection 改以 `monthKey`（YYYY-MM）追蹤，不再僅以 index
  - period 切換時策略：
    1) 舊選取月份仍存在於新 period → 保留選取
    2) 舊月份不存在 → 回退到新 period「最新有資料月份」
    3) 若期間內都 0 → 回退到最新月份

### 0-3. CSV 成功卡 power-user copy
- `src/pages/settings/SettingsPage.tsx`
  - 成功卡新增「複製檔名」「複製匯出條件」
  - 複製後顯示明確回饋文案（成功/失敗）

### 0-4. 測試補強
- `src/test/interaction.test.tsx`
  - 新增 ReportTab period 切換後 active selection 保留/回退測試
  - Recurring 測試補搜尋欄位互動
- `src/test/appCsvDownload.test.tsx`
  - 新增 CSV 成功卡「複製檔名」行為與回饋測試

## 0) 本輪完成（P1 第三輪）

### 0-1. Recurring 批次操作 UX 補強
- `src/pages/transactions/RecurringTab.tsx`
  - 批次啟用 / 批次停用新增結果回傳（affected/target）
  - 新增「已選取 X / 目前篩選 Y 筆」摘要
- `src/pages/transactions/TransactionsPage.tsx` + `src/app/App.tsx`
  - 接上批次結果回饋，toast 顯示實際影響筆數（例如 `批次停用完成（1/1 筆已更新）`）

### 0-2. Reports 行動端互動補強
- `src/pages/reports/ReportTab.tsx`
  - 月柱可 click/touch 選取，行動端不只依賴 hover/title
  - 新增固定「目前選取月份」資訊卡（active detail）
  - 選中柱狀加強視覺（outline + 月份字體/顏色變化）

### 0-3. CSV 成功卡摘要可讀性優化
- `src/pages/settings/SettingsPage.tsx`
  - 成功卡新增清楚條件列：範圍 / 分類 / 筆數
  - 「再次匯出相同條件」補充用途說明（快速重跑上一筆條件）

### 0-4. 測試補強
- `src/test/appCsvDownload.test.tsx`
  - 新增 Recurring 批次停用 toast 影響筆數路徑
  - 補強 CSV 成功卡條件摘要文案斷言
- `src/test/interaction.test.tsx`
  - 新增 ReportTab 點選月柱後固定資訊卡互動路徑
  - 補強 Recurring「已選取 / 目前篩選」摘要斷言

## 0) 本輪完成（P1 第二輪）

### 0-1. Reports 再深化
- `src/pages/reports/ReportTab.tsx`
  - 月支出趨勢每個 bar 新增數值標籤與月份縮寫（更易讀）
  - bar 新增 `title` tooltip（顯示月份 + 金額）
  - 新增「月對月變化率」區塊（最近月份 vs 前一個月份）
  - 前一月為 0 或資料不足時，顯示合理提示文案

### 0-2. CSV 匯出成功卡補強
- `src/pages/pageTypes.ts`
  - `CsvExportFeedback` 新增 `options`，保存當次匯出條件
- `src/app/App.tsx`
  - 匯出成功時把 scope/category 一起寫入 `lastCsvExport`
- `src/pages/settings/SettingsPage.tsx`
  - 匯出成功卡新增「再次匯出相同條件」按鈕
  - 再次匯出直接重用上次 `options`（同 scope/category）

### 0-3. Recurring 效率功能補強
- `src/pages/transactions/RecurringTab.tsx`
  - 新增快速篩選：「只看 7 天內到期」
  - 新增多選 checkbox、全選目前篩選、清除選取
  - 新增批次操作：「批次啟用 / 批次停用」
  - 批次目標優先使用「已選取項目」，未選取時套用「目前篩選結果」

## 0) 本輪完成（P1 第一輪可交付）

### 0-1. CSV 匯出體驗補強
- `src/pages/settings/SettingsPage.tsx`
  - 匯出前新增「範圍摘要」文案（例如當月全部、當月特定分類）
  - 0 筆 / 未選分類時，除了 disabled 外再補引導卡片（提示下一步）
  - 匯出成功後顯示「成功摘要卡」：摘要、檔名、匯出時間
- `src/app/App.tsx`
  - 匯出成功後，除了 toast 也會回寫 `lastCsvExport` 給 Settings 顯示明確結果

### 0-2. Reports 深化
- `src/pages/reports/ReportTab.tsx`
  - 報表期間切換：近 3 月 / 6 月 / 12 月，且實際影響彙總資料
  - 分類支出排行 / 占比：donut + 列表百分比與金額
  - 報表無資料時維持明確 empty state
- `src/pages/reports/ReportsPage.tsx` + `src/app/App.tsx`
  - ReportTab 改用全量交易資料（避免受單月過濾影響）

### 0-3. Recurring 體驗補完
- `src/pages/transactions/RecurringTab.tsx`
  - 新增篩選：全部 / 啟用中 / 已停用
  - 列表排序改為下次扣款日期優先（同日再依狀態與名稱）
  - 下次扣款日期編輯加入更清楚提示文案
  - 新增摘要資訊：每月預估總額 + 7 天內即將扣款項目

## 0) 本輪完成（使用者指定 3 項修正）

### 0-1. Settings「預設幣別 / 每月起始日」改為明確可選選單
- `src/pages/settings/SettingsPage.tsx`
  - 點擊 row 後開啟底部彈出選單（dialog + sheet）
  - 預設幣別提供 NTD / USD / JPY 明確選項
  - 每月起始日提供 1~28 日格狀選單
  - 選擇後立即更新畫面，沿用既有 `appStore` persistence

### 0-2. Reports「月支出趨勢」移除 demo bar data
- `src/pages/reports/ReportTab.tsx`
  - 不再使用硬編資料
  - 改以交易資料（近 6 個月、僅支出）彙總產生趨勢
  - 無資料時顯示 empty state 文案與 0 值柱狀狀態

### 0-3. TxnModal「備註說明」加入分類預設選項（每類 8 筆）
- `src/components/modals/TxnModal.tsx`
  - 新增 `NOTE_PRESETS`（含餐飲/交通/購物/娛樂/帳單/健康/教育/其他/收入，每類 8 筆）
  - 在備註輸入框下方顯示可點選預設 chip（4x2）
  - category 改變時，預設選項即時跟著切換
  - 點選預設選項時覆蓋目前備註內容；使用者仍可自由手動編輯

## 1) 本輪完成（清除預設資料 + 補完 layout 可見功能）

### A+. Recurring 下次扣款日期可編輯
- `src/pages/transactions/RecurringTab.tsx`
  - 編輯定期帳目時新增「下次扣款日期」`<input type="date">`
  - 儲存時會把 `nextDate` 一起寫回 `onRecSave`
  - 回到 list 後立即顯示更新後的「下次 MM/DD」
- 持久化沿用既有 `financeStore` 的 `recurring` 寫入流程，不需額外後端

### A++. Settings CSV 匯出範圍 + 匯出前預覽
- `src/pages/settings/SettingsPage.tsx`
  - 匯出區塊改為可選範圍：`當月 / 全部 / 分類`
  - 選「分類」時未選 category 會顯示引導提示
  - 依目前範圍即時顯示「預計匯出 N 筆記錄」
  - 新增「下載檔名」預覽，會依 scope/category 即時更新
  - 分類未選時不產生檔名，改顯示引導提示（避免假預覽）
  - 當結果為 0 筆時顯示明確提示，匯出按鈕 disabled
- `src/app/App.tsx` + `src/utils/csv.ts`
  - 實作真正過濾邏輯：依 scope 只匯出對應交易
  - 匯出檔名改集中由 `getCsvFilename()` 產生，UI 預覽與實際下載共用同一邏輯
  - 匯出檔名帶上 scope 後綴（`month` / `all` / `category-*`）與日期
  - 防呆：若匯出範圍為 0 筆，直接 toast 警示不觸發下載

### A. 預設記帳資料改為乾淨狀態
- `src/domain/initialData.ts`
  - `INITIAL_TRANSACTIONS = []`
  - `INITIAL_RECURRING = []`
  - `INITIAL_GOALS = []`
  - `INITIAL_BUDGETS` 保留必要分類骨架，但金額全為 `0`

### B. persistence migration/reset（避免升級後殘留 demo）
- `src/store/financeStore.ts`
  - 加入 `version: 2`
  - 加入 `migrate`：偵測舊版 demo seed persisted state（交易/定期/目標名稱指紋），命中時自動 reset 到乾淨初始值
  - 新增 `resetAllData()`，供 Settings 直接一鍵清除資料

### C. 補完 layout 中可見功能
- `Transactions`
  - month switch 現在真的影響資料：App 先依 month 過濾交易，再提供給 Home / Transactions / Reports
  - `TxnModal` 新增 `month` 參數，新交易日期會落在當前月份
  - `RecurringTab` 補齊編輯/刪除（原本只有啟用/停用）
- `Settings`
  - 所有 row 都可互動，不再有純靜態假按鈕
  - 新增可用行為：
    - 預設幣別輪換（NTD / USD / JPY）
    - 每月起始日調整（1~28）
    - 帳單提醒 toggle
    - iCloud 備份 toggle（本機狀態開關）
    - 匯出 CSV（瀏覽器下載）
    - 清除所有資料（呼叫 `resetAllData`）
    - 評分 App（目前顯示 in-app toast：即將推出）
- `App UI store`
  - `appStore` 新增並持久化 `currency / monthStartDay / billReminder / iCloudBackup`

## 2) 測試更新
- `src/test/csvExport.test.ts`
  - 新增 CSV scope 過濾測試（month/all/category）
  - 新增 CSV 內容輸出測試（含表頭）
  - 新增檔名生成測試（month/all/category）
- `src/test/financeStore.test.ts`
  - 新增 migration 測試：舊 demo seed persistence 會被清空
  - 調整測試資料，改為不依賴舊 seed 陣列
- `src/test/interaction.test.tsx`
  - recurring 編輯測試新增 `nextDate` 更新斷言
  - Settings 互動測試新增 CSV 預覽文案、未選分類 disabled、範圍切換斷言
  - Settings 互動測試改為驗證：開啟選單後選擇幣別 / 每月起始日
  - 新增 ReportTab 測試：無資料顯示 empty state，且不再出現 demo 趨勢數值
  - 新增 TxnModal 測試：category 改變後預設備註選項更新，點選可帶入備註欄位
  - 調整 TxnModal props（新增 `month`）
- `src/test/settingsCsvExportFlow.test.tsx`
  - 新增接近真實流程的整合測試：切換 scope -> 選 category -> 匯出
  - 驗證檔名預覽會隨 scope/category 改變
  - 驗證匯出時實際檔名與檔名預覽一致
  - 驗證匯出 CSV 內容確實符合分類篩選結果
- `src/test/appCsvDownload.test.tsx`
  - 新增 App 層 CSV 下載流程測試：實際 render `<App />` 後進設定頁匯出
  - 驗證 `a.download` 與 UI 檔名預覽一致
  - 驗證 `URL.createObjectURL` 的 Blob 內容會隨 scope/category 變動（分類匯出只含目標分類）
- `src/test/smoke.test.tsx`
  - 更新 TransactionsPage props 與測試資料（符合新乾淨預設）

## 2.5) 文件更新（測試交接）
- 新增 `docs/TESTER_HANDOFF.md`
  - 提供可直接給測試者的 APK 路徑、安裝方式、測試重點、已知限制與 bug 回報格式
- 更新 `docs/DEVICE_QA_CHECKLIST.md`
  - 加上「自動化覆蓋對照（本輪補齊）」
  - 明列本輪未處理項目（真機下載目錄/權限、商店評分深連結）

## 3) 驗證結果
- `npm test`：✅ 成功（7 files / 29 tests passed）
- `npm run build`：✅ 成功
- `npx cap sync android`：本輪未執行（本次變更不涉及 native plugin 或 capacitor config）
- Android debug APK：本輪未重建

## 4) 主要調整檔案
- `src/utils/csv.ts`
- `src/domain/initialData.ts`
- `src/store/financeStore.ts`
- `src/store/appStore.ts`
- `src/app/App.tsx`
- `src/components/modals/TxnModal.tsx`
- `src/pages/pageTypes.ts`
- `src/pages/transactions/TransactionsPage.tsx`
- `src/pages/transactions/RecurringTab.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/test/financeStore.test.ts`
- `src/test/interaction.test.tsx`
- `src/test/settingsCsvExportFlow.test.tsx`
- `src/test/appCsvDownload.test.tsx`
- `src/test/smoke.test.tsx`
- `README.md`
- `docs/DEVICE_QA_CHECKLIST.md`
- `docs/TESTER_HANDOFF.md`

## 5) 仍採替代方案的項目
- 「評分 App」目前無法直接連到外部商店頁，先提供明確 toast（即將推出），避免假按鈕無反應
- 「iCloud 備份」目前是 app 內狀態切換（未串外部雲端能力），有真實狀態回饋
- 真機 CSV 下載目錄與權限行為尚未做 E2E 裝置自動化（本輪先補 App 層下載流程測試）

## 6) L2-1a 顯示層多幣別 baseline（第一輪）

### 6-1. 收斂策略
- 新增共用 formatter：`src/utils/format.ts`
  - `formatAmount / formatMoney / formatSignedMoney`
  - 支援 `NTD / USD / JPY`
  - 小數位策略：`NTD=0, USD=2, JPY=0`
- 各頁改用共用 formatter，移除頁面內硬寫 `NT$` + `toLocaleString()` 的分散寫法。

### 6-2. Settings 幣別實際生效範圍
- `appStore.currency` 由 App 往下傳遞到主要畫面，已生效於：
  - Home（總覽卡、收入/支出、目標、近期交易、即將扣款）
  - Transactions（記錄列、定期帳目金額）
  - Reports（摘要、趨勢選中值/tooltip、分類占比）
  - Budget（總預算與分類額度）
  - Goals（已存/目標顯示）
- Settings 補上說明文案：幣別僅影響顯示，不做換算。

### 6-3. 測試補強
- `src/test/interaction.test.tsx`
  - 新增：`BudgetTab` 在 USD/JPY 下格式策略驗證（有/無小數位）
- `src/test/appIntegration.test.tsx`
  - 新增：從 Settings 切換 USD 後，Home 與 Reports/Budget 可觀察到顯示同步切換

### 6-4. 主要改動檔案
- `src/utils/format.ts`
- `src/pages/pageTypes.ts`
- `src/app/App.tsx`
- `src/pages/home/HomePage.tsx`
- `src/pages/transactions/{TransactionsPage.tsx,RecordsTab.tsx,TxnRow.tsx,RecurringTab.tsx}`
- `src/pages/reports/{ReportsPage.tsx,ReportTab.tsx,BudgetTab.tsx,GoalsTab.tsx}`
- `src/pages/settings/SettingsPage.tsx`
- `src/test/{interaction.test.tsx,appIntegration.test.tsx,reportsRealData.test.tsx,smoke.test.tsx}`

### 6-5. 驗證
- `npm test`：✅ 12 files / 73 tests passed
- `npm run build`：✅ 成功
