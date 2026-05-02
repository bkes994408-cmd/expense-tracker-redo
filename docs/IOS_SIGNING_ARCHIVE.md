# iOS Signing & Archive Guide

## 專案
- Xcode project: `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo/ios/App/App.xcodeproj`
- App ID: `com.bruce.expensetracker.redo`

## 真機或上架前要做
1. 開啟 Xcode project
2. 選 `App` target
3. 到 `Signing & Capabilities`
4. 選 Team
5. 確認 Bundle Identifier 可用
6. 確認 Provisioning / Signing 正常

## 真機測試
1. 連接 iPhone
2. 在 Xcode 選你的裝置
3. Run

## Archive
1. `npm run build`
2. `npx cap sync ios`
3. Xcode 開啟專案
4. 選 Any iOS Device / 真機
5. Product → Archive
6. 由 Organizer 匯出或上傳 App Store Connect

## 常見卡點
- Team 未設定
- Bundle Identifier 衝突
- Apple Developer 權限不足
- 第一次 package resolve 太慢

## 建議
- 真機 build 成功後再做 Archive
- 每次 web UI 有更新，都先 `npm run build && npx cap sync ios`
