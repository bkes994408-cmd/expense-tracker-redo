# Launch Today Runbook

最後更新：2026-04-18

這份是今天真的要推上架時，可以直接照著走的一步一步版本。

## Phase 1. 先確認產物（10 分鐘）
1. 確認 debug APK
2. 確認最新 release APK / AAB
3. 確認 iOS project 可開
4. 確認 iOS simulator build 已成功

參考：
- `docs/FINAL_DELIVERY_SUMMARY.md`
- `docs/RELEASE_HANDOFF.md`

## Phase 2. 最後驗收（20~40 分鐘）
1. Android 裝最新 debug APK
2. iPhone 真機 Run 一次
3. 依 `docs/DEVICE_QA_CHECKLIST.md` 快速跑一輪
4. 若有 blocker，先停，不要急著送商店

## Phase 3. 準備商店素材（20~40 分鐘）
1. 用 `docs/STORE_LISTING_READY.md` 先填文案
2. 用 `docs/SCREENSHOT_SHOTLIST.md` 拍最核心 5 張
3. 準備隱私權政策網址與聯絡資訊

## Phase 4. Android 上傳（20 分鐘）
1. 打開 `docs/PLAY_CONSOLE_UPLOAD.md`
2. 先走 Internal testing 或 Closed testing
3. 上傳最新 AAB
4. 填 release notes
5. 補齊 Data safety / Content rating / App access / Ads
6. 儲存並送出

## Phase 5. iOS 上傳（30 分鐘以上）
1. 打開 `docs/APP_STORE_CONNECT_UPLOAD.md`
2. Xcode 設 Team / Signing
3. 真機 Run 成功
4. Product → Archive
5. 上傳 App Store Connect
6. 補 metadata / privacy / review info
7. Submit for Review

## 如果時間只夠做最小版
### Android
- 先上 Internal testing

### iOS
- 先完成真機 signing + Archive
- 不急著當天送審也可以

## 最後確認
- 是否有已知限制會影響商店審核
- 是否有明顯 UI bug
- 是否已安全保存 Android keystore
