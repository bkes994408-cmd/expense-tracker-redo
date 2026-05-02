# E2E Plan（最小 Smoke Baseline）

最後更新：2026-04-21（P3 第三輪）

## 目前狀態
最小 Playwright smoke 已落地，可在本機直接執行。

## 已完成項目
1. 安裝與設定
   - `@playwright/test`
   - `playwright.config.ts`（chromium + `webServer`）
2. 最小 smoke
   - `e2e/smoke.spec.ts`
   - 流程：開 app → 新增一筆交易 → 切到報表 → 驗證月支出摘要含 `NT$200`
3. npm script
   - `npm run test:e2e:smoke`

## 本機執行
1. `npx playwright install chromium`
2. `npm run test:e2e:smoke`

## 目前策略
- baseline 先鎖 1 條 chromium smoke，避免一次擴太大
- selector 優先使用 `aria-label` + 可讀文案
- Vitest 與 Playwright 已分流（`vite.config.ts` exclude `e2e/**`）

## 後續建議（非本輪）
1. 補第 2 條 smoke（例如新增 recurring 或 goals）
2. 再評估是否加入 CI required job
