# Test Guide

最後更新：2026-04-25（L2-C 第一輪）

## 測試分層

### 1) Unit / Store / Utility
- `src/test/expression.test.ts`
- `src/test/csvExport.test.ts`
- `src/test/appStore.test.ts`
- `src/test/financeStore.test.ts`

主要保護：
- 計算機算式解析與錯誤處理
- CSV 過濾、輸出內容與檔名規則
- appStore recent usage 排序與 migration
- financeStore reset/migration 與資料一致性

### 2) Interaction（元件互動）
- `src/test/interaction.test.tsx`
- `src/test/smoke.test.tsx`
- `src/test/reportsRealData.test.tsx`

主要保護：
- TxnModal、Recurring、Settings、Reports 關鍵互動
- Reports 在「有真實資料」時的趨勢/分類占比/月對月正確性
- 基本 smoke（主要頁籤可切換、核心流程不爆）

### 3) Integration（接近真實流程）
- `src/test/settingsCsvExportFlow.test.tsx`
- `src/test/appCsvDownload.test.tsx`
- `src/test/appIntegration.test.tsx`

主要保護：
- App 層 CSV 匯出（UI 預覽、檔名、下載觸發）
- 從 App 主流程新增交易後，Reports 即時反映
- 在 Reports 調整預算後，Home 預算警示可觀察更新（跨頁面 / 跨 store）
- 設定流程與 app state 串接不回歸

## 本輪新增重點（P3 第三輪）
- `src/test/appIntegration.test.tsx`
  - 新增路徑：在 Reports 新增 goals 後，切回 Home 可看到儲蓄目標卡片（跨頁面 / 跨 store）
- `e2e/smoke.spec.ts`
  - 新增最小 Playwright smoke：新增交易後到報表驗證月支出摘要
- `playwright.config.ts`
  - 建立最小可跑 baseline（chromium + webServer）
- `vite.config.ts`
  - 排除 `e2e/**`，避免 `npm test` 誤載 Playwright spec

## E2E 指令
- `npm run test:e2e:smoke`

## 發版前整包檢查（Local Baseline）
- `npm run release:check`
  - 依序執行：`npm test` → `npm run build` → `npm run test:e2e:smoke`
  - 另外輸出 package/Android/iOS 版本一致性摘要

可選：
- `npm run release:check -- --skip-e2e`
- `npm run release:check -- --allow-e2e-skip`
- `npm run release:check -- --dry-run`

更多說明見：`docs/RELEASE_CHECKLIST.md`

## 前一輪（P3 第一輪）
- `reportsRealData.test.tsx`：補齊 Reports 真實資料核心路徑
- `appIntegration.test.tsx`：補一條「新增交易 → Reports 反映」整合路徑
- `testTheme.ts`：抽共用 theme 測試 helper，減少重複常數
