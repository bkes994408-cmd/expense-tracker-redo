# Release Handoff

最後更新：2026-04-18

這份文件整理目前 `expense-tracker-redo` 可直接交付的建置產物與交接重點。

## 1. 專案資訊
- Project: `expense-tracker-redo`
- App ID: `com.bruce.expensetracker.redo`
- Platform stack: React + Vite + Capacitor

## 2. 可交付產物

### Android debug APK
- latest:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-latest-debug.apk`
- versioned:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260411-1921-f881fed0-debug.apk`
- SHA-256:
  - `f881fed005d67b3cdfa5b8bbc54ba09932183eaa911c172a78b0dfbf2d689d85`

### Android release APK
- `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260418-0824-763d42e1-release.apk`
- SHA-256:
  - `763d42e128940c417958ce26f4e28d66f885fd83a8bd3bbe9950fd4a7dd911a0`

### Android release AAB
- `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260418-0824-2da2d229-release.aab`
- SHA-256:
  - `2da2d229a2eac19e57329ee8a5166a65666cdb241ad3e75807dc173018f49136`

### iOS 專案
- iOS platform 已初始化
- Xcode project:
  - `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo/ios/App/App.xcodeproj`
- Simulator build 驗證：✅ 成功
- 最近一次 `.app` 產物：
  - `/Users/bkes994104/Library/Developer/Xcode/DerivedData/App-fdwupwkmhtzrhnduhhzmnxulcbgk/Build/Products/Debug-iphonesimulator/App.app`
- 相關文件:
  - `docs/IOS_QUICKSTART.md`
  - `docs/IOS_SIGNING_ARCHIVE.md`

## 3. 目前狀態摘要
- 首次啟動無 demo 記帳資料
- Transactions / Recurring / Reports / Budget / Goals / Settings 主要 layout 功能已接通
- 外框與假 status bar / notch 已移除，手機版為全螢幕貼齊
- CSV 匯出支援當月 / 全部 / 分類
- 匯出前有筆數預覽與檔名預覽
- 0 筆資料時不會觸發下載
- App 層 CSV 下載流程已有自動化測試
- Android debug / release、iOS simulator build 均已驗證

## 4. Android signing 資訊
- keystore:
  - `android/keystore/expense-tracker-redo-upload.jks`
- key properties:
  - `android/key.properties`
- credentials note:
  - `android/keystore/keystore-credentials.txt`

> 以上檔案屬敏感資訊，請留在本機安全保存，不要提交到 git。

## 5. 推薦交接文件
- 測試者：`docs/TESTER_HANDOFF.md`
- 真機 QA：`docs/DEVICE_QA_CHECKLIST.md`
- 雙平台建置：`docs/MOBILE_BUILD_GUIDE.md`
- 目前完成度：`docs/IMPLEMENTATION_STATUS.md`

## 6. 若要下一步發佈
### Android
1. 確認 release APK / AAB
2. 用 Play Console 上傳 AAB
3. 保管 upload keystore

### iOS
1. 用 Xcode 開啟 `ios/App/App.xcodeproj`
2. 先照 `docs/IOS_QUICKSTART.md` 跑起來
3. 設定 Team / Signing
4. Build + Run 真機驗收
5. Archive 後上傳 App Store Connect

## 7. 上架前還差的事
- iOS 尚未完成真機簽署驗收與 Archive 實測
- Android / iOS 仍需一輪真機 QA 依 `docs/DEVICE_QA_CHECKLIST.md` 實跑
- 設定頁「評分 App」仍為 coming soon，未串商店 deep link
- iCloud 備份目前是 app 內狀態切換，尚未接真實雲端能力
- 若要正式商店發佈，仍需整理版本號、截圖、商店文案與隱私資訊
