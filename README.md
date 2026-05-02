# Expense Tracker Redo

以 prototype 為唯一 source of truth 的新版實作（**不改動** `expense-tracker-native` 舊專案）。

## 專案路徑

`/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo`

## 目前狀態（v3.5）

- ✅ App Shell：Header / Bottom Nav / FAB / screen transition
- ✅ Pages 拆分：Home / Transactions / Reports / Settings
- ✅ Theme token：minimal/material + light/dark 基礎結構（已拆到 `src/theme/theme.ts`）
- ✅ Transactions：月份切換（含資料過濾）、搜尋、排序、分類篩選、row actions、add/edit modal、calculator amount input
- ✅ Reports / Budget / Goals 初版可跑
- ✅ Recurring：新增 / 啟用停用 / 編輯 / 刪除（含下次扣款日期可編輯並持久化）
- ✅ Zustand store 分層：`financeStore`（domain）/ `appStore`（UI preference）
- ✅ persistence DI：store 可注入 storage（預設仍使用 localStorage + safe fallback）
- ✅ 首次啟動為乾淨資料（transactions / recurring / goals 皆空；budgets 保留空骨架）
- ✅ 舊版 demo seed persistence migration：偵測舊示範資料後自動清空
- ✅ Settings rows 全部可互動（預設幣別/每月起始日改為彈出選單可明確選擇、提醒/備份 toggle、CSV 匯出範圍：當月/全部/分類、匯出前筆數+檔名預覽+範圍摘要、空資料引導、匯出成功摘要、清空資料、評分入口）
- ✅ L2-1a 顯示層多幣別 baseline：
  - 第一輪：統一金額格式化策略（NTD/USD/JPY）+ app-wide 顯示切換
  - 第二輪：補上 `displayCurrency/baseCurrency` 語意與 display adapter 前置層（仍僅顯示，不做換算）
  - 第三輪：`transaction.originalCurrency` 真接線（新增/編輯/持久化 fallback），adapter 實際吃到 original/display/base 語意（仍不換算）
- ✅ Reports 強化（報表期間可切換近 3/6/12 月，並定義 period 切換後 active month 保留/回退策略）
- ✅ Recurring 強化（全部/啟用中/已停用篩選、依下次扣款日期排序、近期 7 天到期摘要、sticky 批次工具列、關鍵字搜尋）
- ✅ L2-M1 recurring 到期提醒 baseline（今日到期 / 7 天內到期 / 逾期未處理摘要 + 快速篩選入口）
- ✅ L2-M2 reports 時間分析 baseline（`月 / 季` 切換、環比（月對月/季對季）文案、時間區間摘要）
- ✅ L2-M4 recurring 提醒處理動作 baseline（標記已處理 / 延後一次，並同步更新提醒摘要與篩選結果）
- ✅ L2-M8 recurring 與 Home / Reports 串接一致性收尾（Home 摘要同步 + 提醒文案一致化）
- ✅ L2-3b recurring 自動入帳第三輪（pending 專屬篩選、pending 批次確認/略過、confirm 日期策略：今天/到期日）
- ✅ CSV 成功卡 power-user 功能（一鍵複製檔名 / 匯出條件，含明確複製回饋）
- ✅ 新增/編輯交易 modal：依分類提供 8 組備註預設選項（可一鍵帶入，仍可自由手動輸入）
- ✅ 新增/編輯交易 modal：最近使用分類 + 最近使用備註快速帶入（最多保留 8 筆，持久化）
- ✅ 最近分類 / 最近備註排序改為「使用頻率 + 最近時間」混合排序（仍保留 8 筆上限）
- ✅ 最近備註排序加入「分類場景權重」（同一備註在目前分類使用越多、越近期，排序越前）
- ✅ Calculator 錯誤提示補強（非法算式與除以 0 顯示明確訊息）
- ✅ 清除所有資料改為二次確認流程（confirm sheet + 再次點擊確認）
- ✅ 清除所有資料新增確認字串（`CLEAR`）才能執行，並提供可見引導
- ✅ 清除資料流程邊界補強（取消後重開會解除 armed 狀態，清除後 recent/匯出摘要同步重置）
- ✅ 設定頁 CSV 匯出流程補充明確提示文案，含開始匯出與完成下載回饋
- ✅ iCloud 備份補上「僅本機狀態，尚未上傳雲端」提示，避免誤解
- ✅ Settings 高風險/狀態提示區塊共用化（統一 icon / 色階 / spacing）
- ✅ Web build 成功
- ✅ 互動測試已補（budget edit、transaction add/edit、modal save/close、month updater、Settings 選單互動、Report empty state、分類備註預設選項）
- ✅ Reports 真實資料測試已補（趨勢、分類占比、月對月變化率）
- ✅ App 層整合 smoke 已補（新增交易 → Reports 立即反映）
- ✅ 跨 store / 跨頁面整合測試已補（Reports 預算調整 → Home 預算警示、Reports 新增目標 → Home 目標卡片）
- ✅ Reports 決策摘要第二輪微升級（時間口徑提示、超支/接近超支 top N + +N、目標即將完成 >=80%）
- ✅ Reports 決策摘要第三輪最小可行動化（摘要快捷可直接導到預算/目標分頁）
- ✅ App 層 CSV 下載流程測試已補（實際走到 App export、檢查 `a.download` 與檔名預覽一致，並驗證 scope/category 影響匯出內容）
- ✅ Playwright 最小 E2E smoke 已落地（開 app → 新增交易 → 報表驗證）
- ✅ 既有目標檔案 `@ts-nocheck` 已清除

> 詳細完成度請看 `docs/IMPLEMENTATION_STATUS.md`

## 開發

```bash
cd expense-tracker-redo
npm install
npm run dev
```

## Build

```bash
npm run build
```

## 測試

```bash
npm test
npm run test:e2e:smoke

# 發版前本機 baseline（test + build + e2e + 版本摘要）
npm run release:check

# 機器可讀輸出（建議 CI 直接呼叫）
node scripts/release-check.mjs --json

# GitHub Actions baseline（目前預設 skip e2e）
# .github/workflows/release-check.yml
```

## 版本遞增（Build Number）

```bash
# 自動 +1（同步 Android versionCode / iOS CURRENT_PROJECT_VERSION）
npm run version:bump:build

# 指定 build number（需大於目前值）
npm run version:bump:build:set -- 12
```

## Capacitor Android

```bash
# 第一次
npm i @capacitor/android
npx cap add android

# 每次同步 web 資產
npm run cap:sync

# 產生 debug APK（建議 Java 21）
cd android
JAVA_HOME=/Users/bkes994104/.openclaw/workspace-dev/.local-jdks/jdk-21.0.10+7/Contents/Home ./gradlew assembleDebug
```

APK 路徑：

`android/app/build/outputs/apk/debug/app-debug.apk`

最近一次 SHA-256：

`d3cb8a4565ae664f2de73b9ebbda3cbd25b842e52b8fc5f98a83b323acb78808`

## Persistence 說明

目前持久化鍵值：

- `expense-tracker-redo-finance`
  - transactions
  - budgets
  - recurring
  - goals
  - version 5 migration：若偵測到舊版 demo seed persisted data，會自動 reset 為乾淨狀態；並補齊 recurring `autoPostMode/autoPost/lastAutoPostCycle/pendingCycle` 與 transaction `originalCurrency` fallback（預設 NTD）
- `expense-tracker-redo-app-ui`
  - style / mode
  - tab / month
  - currency / monthStartDay / billReminder / iCloudBackup
  - recentCategories / recentNotes
  - recentCategoryStats / recentNoteStats（排序計分用）

## 參考文件

- `docs/REDO_PLAN.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/HANDOFF_INDEX.md`
- `docs/FINAL_DELIVERY_SUMMARY.md`
- `docs/TEST_GUIDE.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/VERSIONING_BASELINE.md`
- `docs/E2E_PLAN.md`
- `docs/P1_P2_SUMMARY.md`
- `docs/NEXT_PHASE_PLAN.md`
- `docs/TESTER_HANDOFF.md`
- `docs/RECURRING_AUTO_POST_BASELINE.md`
- `docs/RELEASE_HANDOFF.md`
- `docs/MOBILE_BUILD_GUIDE.md`
- `docs/PLAY_CONSOLE_UPLOAD.md`
- `docs/APP_STORE_CONNECT_UPLOAD.md`
- `docs/PRELAUNCH_CHECKLIST.md`
- `docs/STORE_LISTING_DRAFT.md`
- `docs/STORE_LISTING_READY.md`
- `docs/PLAY_CONSOLE_COPY_READY.md`
- `docs/APP_STORE_CONNECT_COPY_READY.md`
- `docs/PLAY_CONSOLE_FIELD_ORDER.md`
- `docs/SCREENSHOT_CHECKLIST.md`
- `docs/SCREENSHOT_SHOTLIST.md`
- `docs/SCREENSHOT_CAPTURE_PLAYBOOK.md`
- `docs/LAUNCH_TODAY_CHECKLIST.md`
- `docs/LAUNCH_TODAY_RUNBOOK.md`
- `docs/LAUNCH_TODAY_STEP_BY_STEP.md`
- `docs/LAUNCH_TODAY_GUIDED.md`
- `docs/MANUAL_FIELDS_TODO.md`
- `docs/MANUAL_FIELDS_SHORTLIST.md`
- `docs/IOS_QUICKSTART.md`
- `docs/IOS_SIGNING_ARCHIVE.md`
- `docs/ARCHITECTURE.md`
- `docs/PROTOTYPE_BREAKDOWN.md`
- prototype：`/Users/bkes994104/.openclaw/media/inbound/eb25e6fa-39cd-422a-83e5-7f4c93c4e742.txt`
