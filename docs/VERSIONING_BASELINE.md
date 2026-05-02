# Versioning Baseline

最後更新：2026-04-25（L2-C 第一輪）

## 版本資訊來源盤點

### Package（Web/JS）
- 檔案：`package.json`
- 欄位：`version`
- 目前：`1.0.0`

### Android
- 檔案：`android/app/build.gradle`
- 欄位：
  - `versionCode`
  - `versionName`
- 目前：
  - `versionCode = 2`
  - `versionName = "1.0.0"`

### iOS
- 檔案：`ios/App/App.xcodeproj/project.pbxproj`
- 欄位：
  - `MARKETING_VERSION`（對應 iOS Marketing Version）
  - `CURRENT_PROJECT_VERSION`（對應 iOS Build Number）
- 目前：
  - `MARKETING_VERSION = 1.0.0`
  - `CURRENT_PROJECT_VERSION = 2`

> 補充：`ios/App/App/Info.plist` 未直接管理版本號，實際值由 Xcode build setting 注入。

## 建議更新規則

### 1) 對外版本（語意版本）
- 使用 `MAJOR.MINOR.PATCH`（例如 `1.0.0`、`1.0.1`）
- 建議同步於：
  - `package.json version`
  - Android `versionName`
  - iOS `MARKETING_VERSION`

### 2) Android build number
- `versionCode` 必須單調遞增
- 每次要提交到 Play Console 的新 build，都至少 +1

### 3) iOS build number
- `CURRENT_PROJECT_VERSION` 必須單調遞增
- 每次要上傳 App Store Connect 新 build，都至少 +1

## Build Number 固定遞增方法（已落地）

### npm scripts
- `npm run version:bump:build`
  - 自動讀取 Android/iOS 目前 build number
  - 以 `max(android, ios) + 1` 同步寫回：
    - `android/app/build.gradle` 的 `versionCode`
    - `ios/App/App.xcodeproj/project.pbxproj` 的 `CURRENT_PROJECT_VERSION`
- `npm run version:bump:build:set -- 12`
  - 指定目標 build number（需大於 Android/iOS 目前值）

### 實作檔案
- `scripts/bump-build-number.mjs`

## 建議發版流程（低風險）
1. 決定本次對外版本（例如 `1.0.1`）
2. 同步更新：`package.json`、Android `versionName`、iOS `MARKETING_VERSION`
3. 執行 `npm run version:bump:build` 遞增 Android/iOS build number
4. 執行 `npm run release:check`（含 test/build/e2e smoke/版本摘要）
   - 若 CI 要吃穩定機器輸出，使用 `node scripts/release-check.mjs --json`
5. 再進行 `npx cap sync` 與原生打包

## Release Check 版本檢查規則

`npm run release:check` 會檢查：
- `package.json version == android versionName`
- `package.json version == iOS MARKETING_VERSION`
- iOS `MARKETING_VERSION` 在 pbxproj 內部一致
- iOS `CURRENT_PROJECT_VERSION` 在 pbxproj 內部一致
- `android versionCode == iOS CURRENT_PROJECT_VERSION`

若上述任一不一致，`release:check` 會回傳 non-zero，避免誤發版。

另外 JSON 輸出會提供穩定欄位：
- `summary.status`
- `summary.baselineStatus`
- `baseline`
- `summary.versionChecks`
- `versions`
- `checks.version[]`
- `checks.execution[]`
