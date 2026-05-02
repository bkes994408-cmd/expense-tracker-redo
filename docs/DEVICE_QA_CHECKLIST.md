# Device QA Checklist

> 本版補充：已新增 App 層 CSV 匯出下載自動化測試（`src/test/appCsvDownload.test.tsx`），可先跑自動化再做實機抽查。

## Install
- Install the latest debug APK
- Confirm app opens without crash
- Confirm first launch has **no demo accounting data**

## Navigation
- Switch across Home / Transactions / Reports / Settings
- Confirm bottom nav and FAB respond normally

## Transactions
- Add a new expense
- Add a new income
- Edit an existing transaction
- Delete a transaction
- Verify month switch really filters records
- Verify search / sort / filter all work
- Test swipe/drag row actions on device for edit/delete

## Recurring
- Create a recurring item from modal
- Edit recurring name / amount / frequency
- Edit **next charge date** and confirm list updates immediately
- Disable and re-enable a recurring item
- Delete a recurring item

## Reports / Budget / Goals
- Open Reports tab
- Edit one budget value and confirm it persists after app restart
- Add a goal, quick add savings, then delete a goal
- Confirm charts/summary reflect current-month data only

## Settings
- Toggle design style
- Toggle dark mode
- Change default currency
- Change month start day
- Toggle bill reminder
- Toggle iCloud backup state
- Use clear-all-data and confirm all records/goals/recurring are reset

## CSV Export
- Test scope = current month
- Test scope = all
- Test scope = category, pick one category
- Confirm preview shows expected export count
- Confirm filename preview changes with scope/category
- When no matching records exist, confirm export is blocked or clearly warned

## Calculator
- In TxnModal try:
  - `100+20`
  - `12.5*2`
  - `100/0` (should fail safely)
- Confirm amount result is correct or safely rejected

## Persistence
- Restart app and confirm settings + entered data persist
- If upgraded from an older demo-data build, confirm seed data is gone

## Notes
- Calculator currently supports basic `+ - * /`, decimals, unary +/-
- Parentheses and advanced expressions are not supported yet
- For CSV export, category mode requires category selection before export

## 自動化覆蓋對照（本輪補齊）
- CSV 匯出 UI flow（scope 切換、分類選擇、檔名預覽）→ `src/test/settingsCsvExportFlow.test.tsx`
- App 層實際下載流程（`a.download`、`URL.createObjectURL`、匯出內容）→ `src/test/appCsvDownload.test.tsx`
- Recurring 下次扣款日期編輯與刪除 → `src/test/interaction.test.tsx`
- Finance store migration（舊 demo seed 清理）→ `src/test/financeStore.test.ts`

## 本輪未處理（保留給後續）
- 真機瀏覽器/Android WebView 實際下載目錄與權限行為（目前以模擬下載流程驗證）
- 外部商店評分頁深連結（設定頁目前為 app 內提示）
