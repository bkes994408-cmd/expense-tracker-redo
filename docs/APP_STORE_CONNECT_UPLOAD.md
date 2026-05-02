# App Store Connect Upload Guide

最後更新：2026-04-18

## 目標
把 `expense-tracker-redo` 的 iOS 版本整理成可上傳 App Store Connect 的流程。

## 目前狀態
- iOS project:
  - `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo/ios/App/App.xcodeproj`
- Simulator build: ✅ 已驗證
- 真機 signing / archive: 尚待實跑

## 上傳前準備
1. Apple Developer 帳號與 Team 可用
2. Bundle Identifier 可註冊
3. App Store Connect 已建立 app record
4. App 名稱 / 描述 / 截圖 / 關鍵字 / 隱私資訊已準備
5. 真機簽署與 archive 可成功

## 建議流程
### 1. 同步最新 web assets
```bash
cd /Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo
npm run build
npx cap sync ios
```

### 2. 打開 Xcode
- 開啟：
  - `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo/ios/App/App.xcodeproj`

### 3. 設定 Signing
- 選 `App` target
- `Signing & Capabilities`
- 選 Team
- 確認 Bundle Identifier
- 確認 provisioning 正常

### 4. 真機驗收
- 接上 iPhone
- 用 Xcode Run 一次
- 確認安裝、啟動、主要功能正常

### 5. Archive
- 在 Xcode 選真機或 `Any iOS Device`
- `Product` → `Archive`
- 等 Organizer 出現 archive

### 6. 上傳 App Store Connect
- 在 Organizer 選 archive
- `Distribute App`
- 選 `App Store Connect`
- 依流程送出

### 7. App Store Connect 內完成版本資訊
補齊：
- App 名稱
- 副標題
- 描述
- 關鍵字
- 截圖
- 隱私權政策
- Age rating
- App Privacy
- 聯絡資訊

## 上傳後
1. 建立版本號
2. 綁定剛上傳的 build
3. 填完 metadata
4. `Submit for Review`

## 相關文件
- `docs/IOS_QUICKSTART.md`
- `docs/IOS_SIGNING_ARCHIVE.md`
- `docs/RELEASE_HANDOFF.md`
