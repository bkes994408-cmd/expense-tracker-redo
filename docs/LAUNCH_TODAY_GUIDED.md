# Launch Today Guided

最後更新：2026-04-18

這份是陪跑版。你如果今天就要推，照順序做，不要跳。

## Part A. 先確認可交付產物
- 打開 `docs/FINAL_DELIVERY_SUMMARY.md`
- 確認：
  - debug APK 在手
  - release APK / AAB 在手
  - iOS project 可開
  - iOS simulator build 已成功

## Part B. 最後驗收
- Android 安裝最新 debug APK
- iPhone 真機 Run 一次
- 快速核對 `docs/DEVICE_QA_CHECKLIST.md`
- 有 blocker 就停下來先修

## Part C. 先把你手動要填的補齊
- 開 `docs/MANUAL_FIELDS_SHORTLIST.md`
- 先補：
  - Privacy Policy URL
  - Support/Contact Email
  - icon
  - 截圖

## Part D. Android 上架
1. 開 `docs/PLAY_CONSOLE_COPY_READY.md`
2. 開 `docs/PLAY_CONSOLE_FIELD_ORDER.md`
3. 依順序把欄位填完
4. 上傳最新 AAB
5. 先走 Internal testing

## Part E. iOS 上架
1. 開 `docs/APP_STORE_CONNECT_COPY_READY.md`
2. 開 `docs/APP_STORE_CONNECT_UPLOAD.md`
3. 在 Xcode 設 Team / Signing
4. 真機 Run
5. Archive
6. 上傳 App Store Connect

## Part F. 今天如果只做最小可行版本
- Android：先完成 Internal testing
- iOS：先完成 Signing + Archive，不一定今天送審

## 最後一句
先把 Android internal testing 送出去，通常最實際。iOS 可以接著補，但不要兩邊一起亂掉。
