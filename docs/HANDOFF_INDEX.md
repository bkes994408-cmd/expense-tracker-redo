# Handoff Index

最後更新：2026-05-08（新增更新功能規劃入口）

這份文件是 `expense-tracker-redo` 的單一交付入口，方便快速找到 Android / iOS / 測試 / 發佈相關資料。

## 專案
- Project root:
  - `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo`
- App ID:
  - `com.bruce.expensetracker.redo`

## 交付產物
### Android debug APK
- latest:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-latest-debug.apk`
- versioned:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260419-2138-a3f980f6-debug.apk`

### Android release
- APK:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260418-0824-763d42e1-release.apk`
- AAB:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260418-0824-2da2d229-release.aab`

### iOS project
- Xcode project:
  - `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo/ios/App/App.xcodeproj`
- simulator build output:
  - `/Users/bkes994104/Library/Developer/Xcode/DerivedData/App-fdwupwkmhtzrhnduhhzmnxulcbgk/Build/Products/Debug-iphonesimulator/App.app`

## 文件入口
### 測試 / 驗收
- 測試者交接：`docs/TESTER_HANDOFF.md`
- 真機 QA 清單：`docs/DEVICE_QA_CHECKLIST.md`

### 建置 / 發佈
- 雙平台建置：`docs/MOBILE_BUILD_GUIDE.md`
- Release 交接：`docs/RELEASE_HANDOFF.md`
- Play Console 上傳：`docs/PLAY_CONSOLE_UPLOAD.md`
- App Store Connect 上傳：`docs/APP_STORE_CONNECT_UPLOAD.md`
- 上架前檢查：`docs/PRELAUNCH_CHECKLIST.md`
- 商店文案草稿：`docs/STORE_LISTING_DRAFT.md`
- 可直接貼上的商店文案：`docs/STORE_LISTING_READY.md`
- Play Console 貼上版：`docs/PLAY_CONSOLE_COPY_READY.md`
- App Store Connect 貼上版：`docs/APP_STORE_CONNECT_COPY_READY.md`
- 商店截圖清單：`docs/SCREENSHOT_CHECKLIST.md`
- 實際拍攝 shot list：`docs/SCREENSHOT_SHOTLIST.md`
- 截圖拍攝操作版：`docs/SCREENSHOT_CAPTURE_PLAYBOOK.md`
- 今天就上架清單：`docs/LAUNCH_TODAY_CHECKLIST.md`
- 今日上架一步一步 runbook：`docs/LAUNCH_TODAY_RUNBOOK.md`
- 今日上架逐步版：`docs/LAUNCH_TODAY_STEP_BY_STEP.md`
- 今日上架陪跑版：`docs/LAUNCH_TODAY_GUIDED.md`
- 手動補欄位總表：`docs/MANUAL_FIELDS_TODO.md`
- 手動補欄位最短表：`docs/MANUAL_FIELDS_SHORTLIST.md`
- Play Console 欄位提交順序：`docs/PLAY_CONSOLE_FIELD_ORDER.md`

### iOS 專用
- 快速開始：`docs/IOS_QUICKSTART.md`
- Signing / Archive：`docs/IOS_SIGNING_ARCHIVE.md`

### 工程內部
- 完成度：`docs/IMPLEMENTATION_STATUS.md`
- 測試導覽：`docs/TEST_GUIDE.md`
- E2E baseline / Playwright smoke：`docs/E2E_PLAN.md`
- Playwright 設定：`playwright.config.ts`
- Smoke 測試：`e2e/smoke.spec.ts`
- 版本管理 baseline：`docs/VERSIONING_BASELINE.md`
- P1/P2 總結：`docs/P1_P2_SUMMARY.md`
- 下一階段規劃：`docs/NEXT_PHASE_PLAN.md`
- 更新功能規劃：`docs/UPDATE_FEATURE_PLAN.md`
- 更新 Roadmap：`docs/UPDATE_ROADMAP.md`
- 架構：`docs/ARCHITECTURE.md`
- Roadmap：`docs/REDO_PLAN.md`
- Prototype breakdown：`docs/PROTOTYPE_BREAKDOWN.md`

## 建議使用順序
### 如果你是測試者
1. `docs/TESTER_HANDOFF.md`
2. `docs/DEVICE_QA_CHECKLIST.md`

### 如果你要建 APK / AAB
1. `docs/MOBILE_BUILD_GUIDE.md`
2. `docs/RELEASE_HANDOFF.md`

### 如果你要跑 iOS
1. `docs/IOS_QUICKSTART.md`
2. `docs/IOS_SIGNING_ARCHIVE.md`

### 如果你要準備上架
1. `docs/LAUNCH_TODAY_GUIDED.md`
2. `docs/MANUAL_FIELDS_SHORTLIST.md`
3. `docs/PRELAUNCH_CHECKLIST.md`
4. `docs/PLAY_CONSOLE_FIELD_ORDER.md`
5. `docs/PLAY_CONSOLE_UPLOAD.md`
6. `docs/APP_STORE_CONNECT_UPLOAD.md`
7. `docs/PLAY_CONSOLE_COPY_READY.md`
8. `docs/APP_STORE_CONNECT_COPY_READY.md`
9. `docs/SCREENSHOT_CAPTURE_PLAYBOOK.md`

### 如果你要接手開發
1. `docs/IMPLEMENTATION_STATUS.md`
2. `docs/ARCHITECTURE.md`
3. `docs/REDO_PLAN.md`
