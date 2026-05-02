# Launch Today Checklist

最後更新：2026-04-18

如果今天就要上架，先照這份做。

## 1. 先確認產物
- [ ] 最新 debug APK 在手
- [ ] 最新 release APK 在手
- [ ] 最新 release AAB 在手
- [ ] iOS Xcode project 可開

## 2. 先跑最後驗收
- [ ] Android 真機安裝一次
- [ ] iPhone 真機 Run 一次
- [ ] 依 `docs/DEVICE_QA_CHECKLIST.md` 快速過一輪

## 3. Android 上架
- [ ] 打開 `docs/PLAY_CONSOLE_UPLOAD.md`
- [ ] 上傳最新 AAB
- [ ] 填 release notes
- [ ] 補齊 store listing / data safety / content rating
- [ ] 先走 Internal testing 或 Closed testing

## 4. iOS 上架
- [ ] 打開 `docs/APP_STORE_CONNECT_UPLOAD.md`
- [ ] Xcode 設 Team / Signing
- [ ] Archive
- [ ] 上傳 App Store Connect
- [ ] 補齊 metadata / privacy / review info

## 5. 商店素材
- [ ] App 名稱與短說明
- [ ] 長說明
- [ ] 截圖
- [ ] 隱私權政策網址
- [ ] 聯絡資訊

## 6. 如果時間不夠
最低限度先做：
1. Android 先上 Internal testing
2. iOS 先完成真機簽署與 Archive
3. 商店文案先用 `docs/STORE_LISTING_DRAFT.md`
4. 截圖先照 `docs/SCREENSHOT_CHECKLIST.md` 補最核心 5 張
