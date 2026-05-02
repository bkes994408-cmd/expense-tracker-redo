# Architecture（v1.3）

## Store 分層

- `src/store/financeStore.ts`
  - domain data（持久化）
  - `transactions / budgets / recurring / goals`
  - `budgets` 型別：`BudgetMap`
- `src/store/appStore.ts`
  - UI preference（持久化）
  - `style / mode / tab / month`

## App Composition

- `src/app/App.tsx`
  - app shell（裝置框、status/title、screen 切換、modal/toast 掛載）
  - 專注 orchestration，不承載 page 細節

## Pages（含 page-local components）

- `src/pages/home/HomePage.tsx`
- `src/pages/transactions/`
  - `TransactionsPage.tsx`
  - `RecordsTab.tsx`
  - `RecurringTab.tsx`
  - `TxnRow.tsx`
- `src/pages/reports/`
  - `ReportsPage.tsx`
  - `ReportTab.tsx`
  - `BudgetTab.tsx`
  - `GoalsTab.tsx`
- `src/pages/settings/SettingsPage.tsx`

## Shared Components

- `src/components/common/ui.tsx`
  - `Card / Chip / Seg / Toggle / IB / SecLabel / AnimBar / Skeleton`
- `src/components/common/icons.tsx`
  - icon wrapper + category/item icon map
- `src/components/navigation/BottomNav.tsx`
- `src/components/modals/TxnModal.tsx`
- `src/components/common/ToastStack.tsx`

## Theme / Domain Types

- `src/theme/theme.ts`
  - `APP_CSS / THEME_TOKENS / RADII / FONTS`
- `src/domain/types.ts`
  - `ThemePalette / ThemeRadii / ThemeFonts / BudgetMap / RecurringFrequency`
- `src/pages/pageTypes.ts`
  - page props（Transactions / Reports / Home / Settings）

## Test Safety Net

- `src/test/smoke.test.tsx`
  - Transactions tab 切換
  - Reports tab 切換
  - Goals quick add updater path
- `src/test/interaction.test.tsx`
  - Budget edit
  - TxnModal 新增/編輯/保存與關閉
  - TxnRow swipe edit/delete action 路徑
  - Transactions month updater path
- `src/test/expression.test.ts`
  - calculator expression parser（四則運算、小數、非法輸入）
- `src/test/financeStore.test.ts`
  - finance store hydrate / update / persistence 寫回

## 技術債

- expression parser 目前不支援括號與進階運算（依現行 UI 已夠用）
