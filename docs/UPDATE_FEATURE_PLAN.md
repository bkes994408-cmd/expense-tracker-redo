# Update Feature Plan

最後更新：2026-05-08

本文件規劃 `expense-tracker-redo` 的「更新功能」。這裡的更新分成四條線：

1. App 版本更新：讓使用者知道新版內容、是否需要更新、如何安全升級。
2. 本機資料更新：處理 schema migration、資料修復、匯入後重算。
3. 規則/參考資料更新：分類規則、幣別、匯率、預算建議參數。
4. 備份/同步狀態更新：未來接 iCloud / Google Drive / 自架同步時，讓使用者清楚知道同步狀態。

---

## 目標

### 使用者目標
- 清楚知道目前版本與最新版本。
- 更新前知道會改什麼，不被突然打斷。
- 資料不因更新遺失。
- 更新失敗時有明確補救方式。
- 分類、預算、幣別等規則能逐步變聰明，但不覆蓋使用者既有選擇。

### 產品目標
- 支援上架後穩定迭代。
- 支援重大版本 migration。
- 支援安全更新提示。
- 為未來雲端備份、AI 分類、匯率換算鋪路。

### 工程目標
- 更新流程可測、可回滾、可觀察。
- 所有 migration 都有版本號與測試。
- 更新提示與 release/version metadata 可由單一來源產生。

---

## 功能範圍

## P0：本機版本與更新資訊 baseline

### 1. About / Version 區塊
放在 Settings 頁。

顯示：
- App version
- Build number
- Data schema version
- 最後資料更新時間
- Release channel：Production / TestFlight / Internal（先可寫死或用 build env）

初版資料來源：
- `package.json` version
- Capacitor native build number
- local persisted schema version

驗收：
- Settings 能看到版本資訊。
- Web / Android / iOS 顯示格式一致。
- 測試覆蓋 version formatter。

### 2. Release Notes 顯示
新增「更新內容」入口。

初版可使用本機靜態檔：
- `docs` 僅給開發者看。
- App 內用 `src/releaseNotes.ts` 或 JSON fixture 顯示最近 3 筆 release notes。

欄位：
- version
- date
- highlights
- fixes
- migration note（如有）

驗收：
- Settings 點擊後可看到最近更新內容。
- 空狀態不報錯。
- 文案不承諾尚未完成的雲端能力。

---

## P1：資料 migration 與安全更新

### 3. Migration Registry
建立集中式 migration registry，管理 persisted data schema。

建議檔案：
- `src/data/migrations.ts`
- `src/data/migrationTypes.ts`
- `src/data/migrationReport.ts`

每次 migration 應記錄：
- fromVersion
- toVersion
- description
- migration function
- changed counts
- warnings

驗收：
- 舊資料載入時可逐版升級。
- migration 可重複執行且不破壞資料。
- migration report 可供 debug 顯示或匯出。

### 4. 更新前本機備份
在高風險 migration 前建立 local backup snapshot。

初版 scope：
- localStorage snapshot
- finance store persisted payload
- app settings payload

注意：
- 初版只做本機備份，不稱為 iCloud 備份。
- 顯示「更新前已建立本機復原點」。

驗收：
- migration 前會建立 backup。
- backup 有 timestamp / app version / schema version。
- migration 失敗時不覆蓋原資料。

### 5. Migration 失敗處理
失敗時顯示安全畫面：
- 保留原始資料
- 提供「重試」
- 提供「匯出診斷資料」
- 提供「清除並重新開始」（高風險，需輸入 CLEAR）

驗收：
- 人為丟入壞資料時 App 不白屏。
- 使用者可看到下一步。
- 測試覆蓋 corrupted payload。

---

## P2：App 更新提示

### 6. 手動檢查更新
Settings 增加「檢查更新」。

初版策略：
- Web / dev：顯示目前版本與 release notes。
- iOS / Android：先導向商店頁或顯示「上架後啟用」。

未來策略：
- App Store / Play Store 版本查詢。
- Remote config 提供 minimum supported version。

驗收：
- 點擊有明確回饋。
- 未上架時不假裝可更新。
- 已上架後可導到正確商店頁。

已落地（U10）：
- 使用 `VITE_APP_STORE_URL` / `VITE_PLAY_STORE_URL` 設定商店連結。
- 只接受 `https://` URL；未設定時維持「上架後啟用」。

已落地（U11）：
- 使用 `VITE_UPDATE_MANIFEST_URL` 設定遠端版本 manifest 來源。
- 已建立 `latestVersion` / `minimumSupportedVersion` 判定模型；未設定時回落本機 release notes。

### 7. 強制更新 / 建議更新
定義更新等級：

- optional：一般功能更新，可略過。
- recommended：建議更新，影響體驗或修 bug。
- required：必須更新，通常是資料相容性或安全問題。

初版只先做資料模型與 UI 狀態，不接遠端。

驗收：
- optional 可略過。
- recommended 可稍後提醒。
- required 會限制主要操作，但仍允許匯出資料。

---

## P3：規則與參考資料更新

### 8. 分類規則更新
未來 AI / heuristic 分類會需要規則版本。

規則應包含：
- ruleVersion
- category keywords
- merchant aliases
- note suggestions
- confidence threshold

原則：
- 不覆蓋使用者手動改過的分類。
- 新規則只影響新交易或使用者選擇「重新套用」。

驗收：
- 規則更新不改掉既有交易。
- 可對單筆 / 批次交易重新套用分類建議。
- 顯示規則版本。

### 9. 幣別 / 匯率資料更新
延續目前 L2-1a 顯示層多幣別 baseline。

下一階段：
- currency metadata 更新：代碼、符號、小數位。
- exchange rate provider 抽象層。
- 歷史匯率口徑：交易日 / 今天 / 月均價。

初版不要直接做自動換算，先補資料模型與設定說明。

驗收：
- 使用者知道目前仍是顯示層，不是換算層。
- 匯率資料缺失時有 fallback。
- 報表金額口徑明確。

---

## P4：同步狀態更新

### 10. Backup / Sync Status Center
Settings 新增狀態區塊，統一顯示：
- 本機資料狀態
- 最後匯出時間
- 最後本機備份時間
- 未來雲端同步狀態

初版重點：避免誤導。

文案範例：
- 「目前資料儲存在此裝置。」
- 「iCloud 備份尚未啟用，這裡只顯示本機備份狀態。」
- 「建議定期匯出 CSV。」

驗收：
- 使用者不會誤以為已經雲端備份。
- 狀態與實際能力一致。

---

## 建議開發切分

### Sprint U1：版本資訊 baseline
- Settings 加入版本區塊。
- App 內 release notes viewer。
- 補 version formatter 測試。

### Sprint U2：Migration registry
- 建立 migration registry。✅
- 整理既有 persisted schema version。✅
- 補舊資料 migration tests。✅

實作檔案：
- `src/store/financeMigrations.ts`
- `src/test/financeMigrations.test.ts`

### Sprint U3：安全更新與 backup snapshot
- migration 前 local backup。✅
- migration report。✅
- corrupted payload fallback。✅
- corrupted payload fallback UI / backup status。✅

實作檔案：
- `src/store/migrationBackupStorage.ts`
- `src/test/migrationBackupStorage.test.ts`
- `src/test/financeStore.test.ts`
- `src/pages/settings/SettingsPage.tsx`

### Sprint U4：檢查更新 UX
- Settings「檢查更新」。✅
- optional / recommended / required 狀態模型。✅
- 商店頁連結 placeholder。✅

實作檔案：
- `src/utils/updateInfo.ts`
- `src/pages/settings/SettingsPage.tsx`
- `src/test/updateInfo.test.ts`
- `src/test/interaction.test.tsx`

### Sprint U5：規則資料版本化
- category rule version。✅
- note suggestion rule version。✅
- 不覆蓋使用者手動分類的保護策略。✅

實作檔案：
- `src/rules/categoryRules.ts`
- `src/utils/quickEntryParser.ts`
- `src/components/modals/TxnModal.tsx`
- `src/pages/settings/SettingsPage.tsx`
- `src/test/categoryRules.test.ts`

---

## 推薦優先順序

如果只做一輪，先做：

1. Settings 版本資訊。
2. Release notes viewer。
3. Migration registry。
4. Migration 前 local backup。
5. Corrupted data fallback UI。

理由：這五項最直接支撐上架後持續迭代，也能降低資料遺失風險。

---

## 風險與注意事項

- 不要把「本機備份」寫成「雲端備份」。
- 不要在沒有商店查詢能力前假裝能自動更新 App。
- Required update 必須保留資料匯出能力。
- Migration 必須先備份再改資料。
- 規則更新不得覆蓋使用者手動輸入。

---

## Definition of Done

此更新功能階段完成時，應符合：

- Settings 可看到版本、build、schema version。
- 使用者可查看最近 release notes。
- persisted data migration 有集中 registry。
- migration 前會建立本機 backup snapshot。
- 壞資料不會導致白屏。
- 更新提示狀態模型已存在，可等上架後接 App Store / Play Store。
- 文件、測試、release checklist 同步更新。
