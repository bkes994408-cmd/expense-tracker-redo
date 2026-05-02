# Play Console Upload Guide

最後更新：2026-04-18

## 目標
把 `expense-tracker-redo` 的 Android 版本上傳到 Google Play Console。

## 目前可用產物
- AAB:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260418-0824-2da2d229-release.aab`
- Release APK:
  - `/Users/bkes994104/.openclaw/workspace/apks/expense-tracker-redo-v1.0-20260418-0824-763d42e1-release.apk`

> Play Console 正式上架建議使用 **AAB**，APK 主要用於本機或側載驗收。

## 上傳前準備
1. 確認 Google Play Console 專案已建立
2. 確認 App 名稱 / 說明 / 圖示 / 截圖已準備
3. 確認隱私權政策網址與聯絡資訊
4. 確認版本代碼/versionCode 沒有倒退
5. 保管好 upload keystore

## 上傳步驟
### 1. 進入 Play Console
- 打開 https://play.google.com/console
- 選你的 app，或建立新 app

### 2. 建立發佈版本
- 左側進入：
  - `Testing` → `Internal testing`
  - 或 `Production`（如果你要正式上架）
- 點 `Create new release`

### 3. 上傳 AAB
- 拖曳或選擇：
  - `expense-tracker-redo-v1.0-20260418-0824-2da2d229-release.aab`
- 等 Play Console 分析完成

### 4. 填寫 release notes
建議至少寫：
- 初版記帳功能
- 定期帳目管理
- CSV 匯出
- 報表 / 預算 / 目標

### 5. 檢查 App content
依序完成：
- App access
- Ads
- Data safety
- Content rating
- Target audience
- Privacy policy

### 6. Store listing
補齊：
- App 名稱
- 簡短說明
- 完整說明
- 圖示
- 手機截圖
- 分類
- 聯絡資訊

### 7. 送出版本
- 儲存
- Review release
- Start rollout

## 建議發佈順序
1. 先上 `Internal testing`
2. 跑真機驗收
3. 修正問題
4. 再推到 `Closed testing` / `Production`

## 相關文件
- `docs/RELEASE_HANDOFF.md`
- `docs/FINAL_DELIVERY_SUMMARY.md`
- `docs/DEVICE_QA_CHECKLIST.md`
