# Prototype Breakdown

## Source of Truth
- `/Users/bkes994104/.openclaw/media/inbound/eb25e6fa-39cd-422a-83e5-7f4c93c4e742.txt`
- `/Users/bkes994104/.openclaw/workspace/prototypes/expense-tracker-redo-reference.tsx`

## 頁面拆分

## 1) Home
- HeroBalanceCard（結餘/收入/支出/儲蓄率）
- MonthlyTrendMiniBar
- GoalsPreviewList
- BudgetAlertList
- RecurringUpcomingList
- RecentTransactionsList

## 2) Transactions
- MonthNavigator
- RecordsRecurringSegment
- CategoryFilterChips
- SearchBar（可展開）
- SortBar（date/amount/name + asc/desc）
- DateGroupedTransactionList
- SwipeableTransactionRow
- RecurringList

## 3) Reports
- ReportTab
  - InteractiveMonthlyBarChart
  - CategoryDonutChart
  - CategoryBreakdownBars
- BudgetTab
  - OverallBudgetCard
  - BudgetCategoryRow（可 inline edit）
- GoalsTab
  - GoalCard
  - AddGoalPanel

## 4) Settings
- AppearanceSection（style + dark mode）
- PreferenceSection
- DataSection
- AboutSection

## 共用元件
- Card / Chip / SegmentedControl / Toggle / IconBadge / AnimatedBar / Toast
- ModalContainer
- FloatingActionButton
- BottomNav

## 狀態管理建議（Zustand slices）

- `appSlice`
  - `themeStyle`, `themeMode`, `activeScreen`, `monthCursor`
- `transactionsSlice`
  - `transactions`, `search`, `sort`, `categoryFilter`
  - actions: add/edit/delete/bulk import
- `recurringSlice`
  - `recurringItems`, toggle/update frequency
- `budgetSlice`
  - `budgetsByCategory`, computed usage
- `goalsSlice`
  - `goals`, add/remove/quick save
- `uiSlice`
  - `showTxnModal`, `editingTxn`, `toasts`

## 資料與服務層規劃
- `domain/*`：型別與商業規則
- `services/storage/*`：local storage adapter（先 local，後續可換 SQLite）
- `services/reporting/*`：統計運算與 selector
