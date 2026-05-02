# Mobile Build Guide

這份文件整理 `expense-tracker-redo` 的雙平台建置步驟，目標是讓你可以從同一份 React + Capacitor 專案產出：
- Android debug APK
- Android release APK / AAB
- iOS Xcode 專案與 Archive 準備流程

## 專案位置

- Project: `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo`
- App ID: `com.bruce.expensetracker.redo`
- Web output: `dist`

## 先決條件

### 共用
- Node.js / npm
- 本專案依賴已安裝：`npm install`
- Capacitor CLI 可透過本專案 devDependencies 使用

### Android
- Android Studio
- Android SDK
- Java 21
  - 目前本機可用路徑：
    - `/Users/bkes994104/.openclaw/workspace-dev/.local-jdks/jdk-21.0.10+7/Contents/Home`

### iOS
- macOS
- Xcode
- CocoaPods
- Apple Developer 帳號（若要真機簽署或上架）

---

## A. 共用 Web Build

每次建置 Android / iOS 前，先更新 web assets：

```bash
cd /Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo
npm install
npm test
npm run build
```

若要同步 Capacitor 原生專案資產：

```bash
npx cap sync
```

或只同步 Android：

```bash
npx cap sync android
```

或只同步 iOS：

```bash
npx cap sync ios
```

---

## B. Android Debug APK

### 1. 同步原生資產

```bash
cd /Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo
npx cap sync android
```

### 2. 建置 debug APK

```bash
cd /Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo/android
JAVA_HOME=/Users/bkes994104/.openclaw/workspace-dev/.local-jdks/jdk-21.0.10+7/Contents/Home ./gradlew assembleDebug
```

### 3. 輸出位置

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. 目前整理好的交付路徑

- latest:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-latest-debug.apk`
- versioned:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260411-1913-d3cb8a45-debug.apk`

### 5. 最新 SHA-256

```text
d3cb8a4565ae664f2de73b9ebbda3cbd25b842e52b8fc5f98a83b323acb78808
```

---

## C. Android Release Build

本專案已配置 release signing，可直接產：
- signed release APK
- signed release AAB

### 1. keystore / signing 檔位置

- keystore:
  - `android/keystore/expense-tracker-redo-upload.jks`
- signing config:
  - `android/key.properties`
- credentials note:
  - `android/keystore/keystore-credentials.txt`

> 這些都屬於敏感檔案，不要提交到 git。

### 2. 建置 release APK / AAB

```bash
cd /Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo/android
JAVA_HOME=/Users/bkes994104/.openclaw/workspace-dev/.local-jdks/jdk-21.0.10+7/Contents/Home ./gradlew assembleRelease bundleRelease
```

### 3. 輸出位置

- APK:
  - `android/app/build/outputs/apk/release/app-release.apk`
- AAB:
  - `android/app/build/outputs/bundle/release/app-release.aab`

### 4. 已整理好的 release 產物

- APK:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260411-1443-release.apk`
- AAB:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260411-1443-release.aab`

---

## D. iOS 專案初始化與建置

目前專案 **已建立 `ios/` 目錄**，也已完成 `@capacitor/ios` 安裝與 `npx cap add ios`。

### 1. 若你要在另一台機器第一次初始化 iOS 專案

```bash
cd /Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo
npm install
npm install @capacitor/ios
npm run build
npx cap add ios
```

### 2. 同步最新 web assets

```bash
npx cap sync ios
```

### 3. 用 Xcode 開啟

```bash
npx cap open ios
```

或直接打開：

```text
ios/App/App.xcodeproj
```

### 4. 在 Xcode 內要做的事

- 選擇 Team
- 設定 Signing & Capabilities
- 確認 Bundle Identifier（預設會對應 Capacitor appId）
- 選擇 target device / simulator
- Product → Build
- Product → Archive（若要發佈）

### 5. iOS debug / 測試流程

- 模擬器：直接在 Xcode Run
- 真機：需要有效簽署

### 6. iOS release / 上架流程

1. `npx cap sync ios`
2. Xcode 開啟 workspace
3. 設定 signing
4. Product → Archive
5. 經 Organizer 匯出或上傳 App Store Connect

---

## E. 常用指令速查

```bash
# 開發
npm run dev

# 測試
npm test

# Web build
npm run build

# Sync Android/iOS
npx cap sync

# Open Android Studio
npm run cap:open:android

# Open Xcode
npm run cap:open:ios
```

---

## F. 常見問題

### 1. Android Gradle / Java 相容問題
若看到類似：
- `Unsupported class file major version 69`

通常代表 Java 版本不對。請切回 Java 21：

```bash
export JAVA_HOME=/Users/bkes994104/.openclaw/workspace-dev/.local-jdks/jdk-21.0.10+7/Contents/Home
```

### 2. iOS 無法建置
請先檢查：
- 是否已 `npx cap add ios`
- 是否已安裝 Xcode / CocoaPods
- Signing Team 是否正確
- Bundle Identifier 是否可用

### 3. Web 改了但原生畫面沒更新
通常是忘了 sync：

```bash
npm run build
npx cap sync
```

---

## G. 建議交付順序

### 內測 / 快速驗收
1. `npm test`
2. `npm run build`
3. Android debug APK
4. 真機驗收 checklist

### 準備上架
1. Android signed release APK / AAB
2. iOS Xcode archive
3. 真機驗收
4. 上傳商店
