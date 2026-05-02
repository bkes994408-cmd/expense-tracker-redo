# Launch Today Step by Step

最後更新：2026-04-18

如果你今天真的要推上架，直接照這份做。

## Step 1. 先打開交付摘要
- 開 `docs/FINAL_DELIVERY_SUMMARY.md`
- 確認你手上的產物路徑沒錯

## Step 2. 先做最後驗收
- Android 裝最新 debug APK
- iPhone 真機 Run 一次
- 快速對照 `docs/DEVICE_QA_CHECKLIST.md`
- 有 blocker 就先停

## Step 3. 準備文案
### Android
- 打開 `docs/PLAY_CONSOLE_COPY_READY.md`
- 直接複製短說明 / 完整說明

### iOS
- 打開 `docs/APP_STORE_CONNECT_COPY_READY.md`
- 直接複製副標題 / 描述 / Keywords

## Step 4. 準備截圖
- 打開 `docs/SCREENSHOT_CAPTURE_PLAYBOOK.md`
- 先拍最核心 5 張
- 若時間夠再補到 8 張

## Step 5. Android 上傳
- 打開 `docs/PLAY_CONSOLE_UPLOAD.md`
- 上傳最新 AAB
- 先選 Internal testing 或 Closed testing
- 填 release notes
- 補 Data safety / Content rating / App access / Ads

## Step 6. iOS 上傳
- 打開 `docs/APP_STORE_CONNECT_UPLOAD.md`
- Xcode 設 Team / Signing
- Run 真機
- Archive
- 上傳 App Store Connect

## Step 7. 最後確認
- release build 是否正確
- 截圖是否完整
- 隱私權政策網址是否可開
- 聯絡資訊是否正確
- keystore 是否安全保存

## 如果今天時間不夠
- Android 先上 Internal testing
- iOS 先完成 Signing + Archive
- 商店 metadata 可以同一天稍後補齊
