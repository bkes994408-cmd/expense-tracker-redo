# Release Checklist（Local Baseline）

最後更新：2026-04-25（L2-C 第一輪）

這份文件定義本機發版前的最低檢查流程，避免靠人工記憶。

## 何時執行

建議在以下時機執行：
- 準備切 release branch 或準備打包前
- 準備上傳 Play Console / App Store Connect 前
- 版本號或 build number 調整後

## 指令

```bash
npm run release:check
```

### 可選參數

```bash
# 環境暫時不跑 e2e（例如 CI/本機無瀏覽器）
npm run release:check -- --skip-e2e

# e2e 失敗若屬環境未就緒（缺 browser / 顯示環境），標記 skipped 而非 fail
npm run release:check -- --allow-e2e-skip

# 僅看版本與流程摘要，不執行 test/build/e2e
npm run release:check -- --dry-run

# 機器可讀 JSON（stdout 僅輸出 JSON，適合接 CI baseline）
node scripts/release-check.mjs --json
```

## CI baseline 規則

- `summary.status` 反映整體狀態：`pass | warn | fail`
- `summary.baselineStatus` 反映 CI 是否可接受：`accepted | rejected`
- 目前 CI 接受的 warn 僅限：`intentional` e2e skip
- 若 skip reason 為 `env-missing` 或 `flaky`，baseline 一律視為 `rejected`

## release:check 會檢查什麼

1. `npm test`
2. `npm run build`
3. `npm run test:e2e:smoke`（依參數可 skip）
4. 版本一致性摘要：
   - package.json `version`
   - Android `versionCode` / `versionName`
   - iOS `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION`
   - 一致性檢查（package ↔ Android/iOS；Android build number ↔ iOS build number）

## 執行前準備

- 已完成 `npm install`
- 本機 Node/npm 可正常執行
- 若要跑 E2E：
  - 安裝 Playwright browser：`npx playwright install chromium`
  - 可啟動本機 web server（Playwright 會自動起）

## E2E smoke 失敗 / 跳過處理

標準 skip reason：
- `env-missing`：瀏覽器 / 顯示環境 / Playwright 執行環境未就緒
- `flaky`：timeout、連線中斷、browser 意外關閉等不穩定失敗
- `intentional`：本輪主動使用 `--skip-e2e` 或 dry-run

其中：
- `intentional` 可作為暫時可接受的 CI baseline
- `env-missing` / `flaky` 只可作為分類資訊，不代表可放行

- 若是「產品行為失敗」（assertion fail）：視為阻擋，先修正再重跑。
- 若是「環境未就緒」（缺 browser 或顯示環境）：
  1. 先補齊環境（建議 `npx playwright install chromium`）
  2. 若本輪僅做版本/build readiness，可暫時 `--allow-e2e-skip` 或 `--skip-e2e`
  3. 在 handoff / release note 註明這次 e2e 是 skipped，不可默默略過

## 即使 release:check 通過，仍需人工確認

- 真機 QA（Android / iOS）
- 商店素材與文案（icon、screenshot、描述、隱私政策）
- 簽章與憑證有效性
- 上傳後商店後台檢核（警告/拒審風險）

## 建議下一步

- 若版本一致性 mismatch：
  - 同步更新 `package.json version`、Android `versionName`、iOS `MARKETING_VERSION`
- 若 build number mismatch：
  - `npm run version:bump:build`
- 之後再做：
  - `npm run cap:sync`
  - Android/iOS 原生打包與上架流程
