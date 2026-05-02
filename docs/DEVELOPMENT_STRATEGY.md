# DEVELOPMENT_STRATEGY

## 原則

1. 先把互動 contract 對齊 prototype（功能與流程），再談設計細節優化。
2. 每一個功能實作都要能對回 prototype 的具體區塊。
3. 優先建可測試的狀態與 selector，避免全部邏輯塞進畫面元件。

## 實作順序

### Phase 1 - App Shell
- App Layout（title + content + bottom nav + FAB）
- Screen transition（左右切換動畫）
- Theme token（minimal/material + light/dark）

### Phase 2 - 交易核心
- 交易列表（日期分組、搜尋、排序、分類）
- Swipe row（edit/delete）
- Add/Edit Txn Modal（含 calculator）
- Recurring tab（active toggle）

### Phase 3 - 報表/預算/目標
- 報表統計（bar + donut + breakdown）
- 預算編輯與超支警示
- 目標新增、進度、快速存入

### Phase 4 - 行動端化
- local persistence（先 LocalStorage，後續可切 SQLite）
- CSV 匯出
- Capacitor Android / iOS smoke test

## 狀態設計（建議）

- `appStore`
  - theme / activeScreen / monthCursor / global ui
- `financeStore`
  - transactions / recurring / budgets / goals
  - actions: add/edit/delete/toggle/updateBudget/updateGoal
- `selectors`
  - monthly summary / category totals / budget usage / goal progress

## Definition of Done（每個 feature）

- 與 prototype 行為一致
- 主要操作 flow 可跑通
- 至少一個對應 selector 或純函式測試（後續補上）
- 不破壞現有 tab 與 modal 流程
