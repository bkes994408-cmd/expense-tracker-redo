# Recurring Auto-Post Baseline（L2-3b 第三輪：confirm/pending 補強）

最後更新：2026-04-23（第三輪）

## 模式定義（off / on / confirm）

- `off`：只保留到期提醒，不自動處理
- `on`：到期時自動入帳（沿用第一輪 baseline）
- `confirm`：到期時先進入待確認，不直接產生交易

## 規則定義（最小版）

- 每筆 recurring 可設定 `autoPostMode`
- reconcile 時，若符合以下條件會自動產生 1 筆交易：
  - `active = true`
  - `autoPostMode = on`
  - `nextDate <= 今天`
- 成功產生後：
  - 寫入一筆交易（date=今天，amount/cat/name 來自 recurring）
  - `lastAutoPostCycle = 原本 nextDate`
  - `nextDate` 依 `freq` 推進一個週期

## 重複入帳保護（最小版）

- 若 `lastAutoPostCycle === nextDate`，表示這個到期輪次已入帳過
- 這次 reconcile 不再產生交易，只把 `nextDate` 推進一個週期
- 目的：避免同一輪到期因重複 reconcile 產生重複交易

## confirm 模式最小規則（本輪新增）

- 何時建立 pending：
  - reconcile 命中 `active=true && autoPostMode=confirm && nextDate<=今天`
  - 若該輪尚未處理（`lastAutoPostCycle !== nextDate`）且尚未 pending（`pendingCycle !== nextDate`）
  - 則建立 `pendingCycle = nextDate`
- pending 期間：
  - 不產生交易
  - UI 顯示「待確認輪次：MM/DD（尚未入帳）」
- 使用者確認入帳：
  - 立刻產生 1 筆交易
  - `lastAutoPostCycle = pendingCycle`
  - `pendingCycle = null`
  - `nextDate` 依 `freq` 推進一個週期
- 使用者略過本輪：
  - 不產生交易
  - `lastAutoPostCycle = pendingCycle`
  - `pendingCycle = null`
  - `nextDate` 依 `freq` 推進一個週期

> 透過 `pendingCycle` + `lastAutoPostCycle`，避免同一輪反覆進 pending 或重複入帳。

## 第三輪補強（confirm/pending baseline）

- RecurringTab 新增 pending 專屬篩選：`待確認 (N)`，可和既有狀態篩選、到期篩選、搜尋共存。
- 新增 pending 批次操作：
  - `批次確認入帳`
  - `批次略過本輪`
  - 作用範圍規則：
    1. 若有勾選且其中包含 pending，優先處理「已選取 pending」
    2. 否則處理「目前篩選結果中的 pending」
- 新增 confirm 交易日期策略（最小）：
  - 今天（確認當天）
  - 到期日（pending cycle）
  - 套用於單筆確認與批次確認

## reconcile 觸發時機（本輪）

- App 啟動時跑一次（silent）
- 切到「收支」頁時再跑一次（silent）
- 不做背景工作、不做原生排程
