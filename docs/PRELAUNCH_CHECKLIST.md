# Prelaunch Checklist

最後更新：2026-04-18

這份清單用於 `expense-tracker-redo` 上架前最後確認。

## 1. 版本與產物
- [ ] Debug APK 已驗收
- [ ] 最新 release APK 已產出
- [ ] 最新 release AAB 已產出
- [ ] iOS Xcode project 可開啟
- [ ] iOS 真機 signing 驗證完成
- [ ] iOS Archive 成功

## 2. 功能驗收
- [ ] 首次啟動無 demo 記帳資料
- [ ] 交易新增 / 編輯 / 刪除正常
- [ ] 定期帳目新增 / 編輯 / 刪除 / 日期編輯正常
- [ ] 報表 / 預算 / 目標正常
- [ ] 設定頁所有可見項目都有合理互動
- [ ] CSV 匯出當月 / 全部 / 分類正常
- [ ] 0 筆資料時不會誤觸發下載

## 3. 真機 QA
- [ ] Android 真機 QA 跑完
- [ ] iPhone 真機 QA 跑完
- [ ] 重要 bug 已清空或列為已知限制
- [ ] 依 `docs/DEVICE_QA_CHECKLIST.md` 核對完成

## 4. 自動化驗證
- [ ] `npm test` 通過
- [ ] `npm run build` 通過
- [ ] Android debug build 通過
- [ ] Android release build 通過
- [ ] iOS simulator build 通過

## 5. 商店素材
- [ ] App 名稱
- [ ] 簡短說明 / 完整說明
- [ ] 圖示
- [ ] Android 截圖
- [ ] iPhone 截圖
- [ ] 隱私權政策網址
- [ ] 聯絡信箱 / 支援網址

## 6. 商店表單
### Google Play
- [ ] Data safety
- [ ] Content rating
- [ ] App access
- [ ] Ads 宣告
- [ ] 測試版或正式版 track 選定

### Apple
- [ ] App Privacy
- [ ] Age rating
- [ ] Export compliance
- [ ] App Review 資訊
- [ ] Test account（若需要）

## 7. 安全與發佈
- [ ] Android upload keystore 已安全備份
- [ ] iOS Team / Signing 已確認
- [ ] 敏感檔未進 git
- [ ] 版本號 / build 號正確

## 8. 已知限制需確認是否可接受
- [ ] 評分 App 仍為 coming soon 是否接受
- [ ] iCloud 備份尚未接真實雲端是否接受
- [ ] calculator 只支援基本算式是否接受

## 參考文件
- `docs/DEVICE_QA_CHECKLIST.md`
- `docs/FINAL_DELIVERY_SUMMARY.md`
- `docs/PLAY_CONSOLE_UPLOAD.md`
- `docs/APP_STORE_CONNECT_UPLOAD.md`
