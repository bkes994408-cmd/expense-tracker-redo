# L2 Minimal Package Plan

最後更新：2026-04-22（第一輪已完成）

這份文件把 `expense-tracker-redo` 的 **L2 最小一包** 拆成三輪可執行規劃。

## 為什麼是這一包
L2 可做的事情很多，但如果只挑一包最值得先做，我建議先做這 3 件：
1. **recurring 到期提醒**
2. **reports 時間分析深化**
3. **第 2 條 Playwright smoke**

原因：
- 有明確產品價值
- 不會過早引入太重的架構複雜度
- 能同時提升體驗、決策能力與品質保護

---

## 這一包的總目標
把產品從「基礎可用」往前推一階，讓它開始更像真的記帳工具：
- recurring 不只記錄，還會提醒
- reports 不只看單月，而是能看時間變化
- E2E 不只一條 smoke，而是開始保護第二條主流程

---

## 第一輪：提醒與時間分析 baseline（已完成）

### L2-M1. recurring 到期提醒 baseline
#### 目標
先把提醒能力做成最小可用版本，不急著碰推播或系統通知。

#### 建議內容
- 在 Home 或 Transactions 明確顯示：
  - 今日到期
  - 7 天內到期
  - 已逾期未處理
- recurring list 可快速篩到上述狀態
- 不先做 OS-level notification，先做 app 內提醒狀態

#### 驗收點
- 有到期 recurring 時，首頁或 recurring 區塊會有可觀察提示
- 使用者可快速切到相關項目處理
- reports / home 的摘要不會和 recurring 狀態打架

#### 完成摘要（2026-04-22）
- 已在 Recurring 區塊完成三類提醒摘要（今日到期 / 7 天內到期 / 已逾期未處理）
- 已提供對應快速篩選入口（today/due7/overdue）
- 已補互動測試覆蓋提醒摘要與篩選

### L2-M2. reports 時間分析 baseline
#### 目標
把現有 3/6/12 月切換，再往前推一層。

#### 建議內容
- 加入：
  - 月 / 季 / 年其中一種更高層級切換，優先 `月 / 季`
  - 同比或環比中的一項，優先環比強化
  - 時間區間摘要文案更清楚
- 先避免一次做自訂區間，保持簡單

#### 驗收點
- 使用者能明確看出不同期間趨勢
- 月對月 / 季對季的變化說明清楚
- 無資料情況仍穩定

#### 完成摘要（2026-04-22）
- 已在 Reports 加上 `月 / 季` 模式切換（保留原 3/6/12 月期間）
- 已強化環比文案（環比（月對月）/ 環比（季對季））
- 已補時間區間摘要與 edge case 文案（資料不足 / 前期為 0）
- 已補測試覆蓋新路徑

### L2-M3. 測試要求
- 補 recurring 到期提醒互動或摘要測試
- 補 reports 時間分析新路徑測試
- `npm test`、`npm run build` 必須成功

---

## 第二輪：提醒處理動作 + 第 2 條 smoke

### L2-M4. recurring 提醒處理動作
#### 目標
讓提醒不是只是看到，而是能處理。

#### 建議內容
- 對到期 recurring 提供最小操作：
  - 標記已處理
  - 延後到下次
  - 或快速進入編輯
- 保持規則簡單，不急著做完整自動入帳

#### 驗收點
- 使用者看到提醒後，可以立刻採取一個合理動作
- 動作後摘要狀態會同步更新

#### 第二輪實作結果（2026-04-22）
- 已新增兩個最小可理解動作（位於 recurring 列表列的快捷按鈕）：
  - `標記已處理`：把 `nextDate` 依頻率往後推，直到晚於今天（可一次消化逾期）
  - `延後一次`：把 `nextDate` 依頻率固定往後推 1 個週期（只推一次）
- 動作後會即時透過既有 `onRecSave -> financeStore` 流程更新，並同步反映：
  - 到期提醒摘要（今日/7天內/逾期）
  - 到期篩選結果（today/due7/overdue）
- 本輪刻意不導入完整自動入帳規則，維持 L2 baseline 範圍。

### L2-M5. 第 2 條 Playwright smoke
#### 目標
把第二條高價值主流程納入 E2E 保護。

#### 建議路徑
二選一即可：
1. recurring 建立 / 處理 / 摘要反映
2. goal 建立 / Home 顯示 / 回到 Reports 驗證

我更推薦：
- **recurring 路徑**
因為它更貼近這包的主線。

#### 驗收點
- `npm run test:e2e:smoke` 可維持原 smoke
- 新增第 2 條 smoke，並能獨立或一起跑

### L2-M6. 文件要求
- 更新 `docs/TEST_GUIDE.md`
- 更新 `docs/IMPLEMENTATION_STATUS.md`
- 若 E2E script 有變化，同步更新 README

---

## 第三輪：收斂與下一步接口

### L2-M7. reports 時間分析收斂
#### 目標
把第一輪新增的時間分析再補到可穩定交付。

#### 建議內容
- 補文案一致性
- 補 edge case：
  - 前期為 0
  - 資料不足
  - 跨期切換後 active state 合理
- 若有必要，補一層 tooltip / 說明

### L2-M8. recurring 與 reports / home 串接檢查
#### 目標
確認提醒、摘要、篩選、報表之間沒有互相打架。

#### 建議內容
- 補一條 integration 測試
- 確認 recurring 狀態改變後：
  - Home 摘要
  - Transactions recurring list
  - Reports（若有相關摘要）
  行為一致

#### 本輪落地（第三輪已完成）
- Home「即將扣款」新增提醒摘要（今日到期 / 7 天內到期 / 逾期未處理），作為最小可觀察跨頁同步點
- Recurring 提醒文案收斂：摘要、快速篩選、empty state 用詞一致
- 新增整合測試覆蓋：Recurring 操作（標記已處理、延後一次）後，回到 Home 驗證摘要同步更新
- Reports 本輪維持不直接承載 recurring 提醒摘要，避免超出最小包範圍

### L2-M9. 下一包接口
第三輪做完後，再決定下一包接哪條：
1. recurring 自動入帳規則
2. reports 預算 / 目標聯動
3. 多幣別顯示層 baseline

---

## 建議實作順序
### 第一輪先做
1. recurring 到期提醒 baseline
2. reports 時間分析 baseline

### 第二輪再做
3. recurring 提醒處理動作
4. 第 2 條 Playwright smoke

### 第三輪收尾
5. 文案 / edge case / integration 收斂
6. 決定接下一包方向

---

## 如果你只想做更小的 MVP
那就只做這 2 件：
1. recurring 到期提醒 baseline
2. 第 2 條 Playwright smoke

這是 L2 最小中的最小，但仍然有感。

---

## 我對這包的判斷
這包適合在：
- L0 完成後
- L1 至少把 placeholder 功能收斂後
再開始做。

如果太早開做，會和上架封板互搶時間。
