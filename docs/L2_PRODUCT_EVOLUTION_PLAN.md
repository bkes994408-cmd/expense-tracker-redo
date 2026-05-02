# L2 Product Evolution Plan

最後更新：2026-04-22

這份文件把 `expense-tracker-redo` 的 **L2 中期產品進化** 拆成可執行方向。

前提：
- L2 不應該和 L0 上架封板互相搶資源
- 建議在「已上架」或「至少上架流程穩定」後再開始
- L2 的目標不是補洞，而是把產品從可用推向更有延展性

---

## L2-1. 多幣別 / 匯率 / 國際化

### 目標
讓記帳資料不再被單一幣別綁死，為跨市場、跨地區使用做準備。

### 建議拆法
#### L2-1a. 顯示層多幣別
- 幣別符號與格式化規則整理
- 交易 / 報表 / 目標 / 預算統一顯示策略
- 先不碰自動匯率，只處理顯示與手動切換

#### L2-1b. 資料層幣別欄位
- transaction / budget / goal 是否要帶 `currency`
- 舊資料 migration 規劃
- 匯出格式如何表達幣別

#### L2-1c. 匯率與換算
- 規劃 base currency
- 手動匯率輸入或固定匯率表
- 報表是否以 base currency 聚合

#### L2-1d. 國際化 baseline
- 文案抽離
- 幣別 / 日期 / 數字格式 locale 化
- 先從 zh-TW / en 開始即可

### 建議優先順序
1. 顯示層多幣別
2. 資料層幣別欄位
3. 匯率換算
4. 國際化

---

## L2-2. 更進階 Reports

### 目標
把現在的基礎月報表，提升到能支撐回顧與決策。

### 建議拆法
#### L2-2a. 時間分析深化
- 月 / 季 / 年切換
- 同比 / 環比
- 自訂區間

#### L2-2b. 類別與趨勢深化
- 類別趨勢比較
- top categories over time
- 收入 / 支出淨流量視圖

#### L2-2c. 預算與目標聯動報表
- 預算使用率歷史
- 目標存入節奏
- 超支 / 落後提示

#### L2-2d. 可匯出報表摘要
- 將目前報表摘要輸出為 CSV / image / text snapshot
- 方便分享或留存

### 建議優先順序
1. 時間分析深化
2. 預算 / 目標聯動
3. 類別趨勢深化
4. 報表摘要匯出

---

## L2-3. 更完整 recurring automation

### 目標
讓 recurring 從「可管理」走向「真的能幫忙處理重複帳務」。

### 建議拆法
#### L2-3a. 提醒邏輯
- 到期前提醒
- 今日到期提醒
- 逾期未處理提醒

#### L2-3b. 自動入帳規則
- 每次到期自動產生交易
- 可選是否需人工確認
- 避免重複入帳的保護機制

#### L2-3c. recurring 與預算互動
- recurring 產生交易後即時反映到預算
- recurring 對 reports 的標記與追蹤

#### L2-3d. recurring 管理面補強
- 批次策略更細
- 異常狀態（跳過 / 補記 / 延後）
- 歷史紀錄

### 建議優先順序
1. 提醒邏輯
2. 自動入帳規則
3. recurring 與預算 / reports 串接
4. 管理面補強

---

## L2-4. 測試與 E2E 擴張

### 目標
讓核心產品流程在更多真實路徑下都有保護。

### 建議拆法
#### L2-4a. 第 2 條 smoke
- recurring 或 goals 主流程

#### L2-4b. 第 3 條 smoke
- settings / export / reset 類高風險流程

#### L2-4c. 更完整 integration matrix
- transaction -> report
- recurring -> home/report
- goal/budget -> dashboard

### 建議優先順序
1. 第 2 條 smoke
2. 第 3 條 smoke
3. integration matrix 補強

---

## L2-5. 發版自動化 / CI

### 目標
把目前已建立的測試、build、version bump 串成穩定發版流程。

### 建議拆法
#### L2-5a. 本機 release checklist script
- test
- build
- e2e smoke
- build number bump

#### L2-5b. CI baseline
- pull request 跑 test + build
- main branch 跑 smoke

#### L2-5c. 發版文件與腳本整合
- release notes 模板
- AAB / archive 前檢查清單

### 建議優先順序
1. 本機 release checklist script
2. CI baseline
3. 發版腳本整合

---

## L2 建議更新順序

### 第一階段（最值得先做）
1. L2-3a 提醒邏輯
2. L2-2a 時間分析深化
3. L2-4a 第 2 條 smoke

### 第二階段
4. L2-3b 自動入帳規則
5. L2-2c 預算 / 目標聯動報表
6. L2-5a 本機 release checklist script

### 第三階段
7. L2-1a 顯示層多幣別
8. L2-1b 資料層幣別欄位
9. L2-5b CI baseline

---

## 如果只做最小一包 L2
我會建議只做這 3 件：
1. recurring 到期提醒
2. reports 時間分析深化
3. 第 2 條 Playwright smoke

這三件的平衡最好：
- 有產品價值
- 不會過早把架構複雜化
- 也能讓測試與體驗一起升級

---

## 我目前最推薦的 L2 主線
如果未來要真的開始做 L2，我建議先從：

### L2-A. recurring 變真實
- 提醒
- 自動入帳
- 與 budget / reports 串接

### L2-B. reports 變更有決策價值
- 時間分析
- 預算 / 目標聯動

### L2-C. 測試與發版能力跟上
- 第 2 / 第 3 條 smoke
- release checklist / CI
