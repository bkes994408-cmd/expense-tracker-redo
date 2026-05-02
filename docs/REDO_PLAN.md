# REDO_PLAN

## 目標
建立可持續迭代、可直接包 Android 的新版本，對齊指定 prototype 互動方向。

## 里程碑

### M0 - 基礎重置（已完成）
- [x] 新專案 `expense-tracker-redo`
- [x] React + TS + Vite 初始化
- [x] Capacitor config 建立
- [x] 文件骨架建立

### M1 - App Shell + Transactions v1（已完成）
- [x] title/header
- [x] bottom nav
- [x] FAB
- [x] transition / 基本動畫容器
- [x] theme token（minimal/material、light/dark）
- [x] transactions list + date group
- [x] month switch
- [x] sort / filter / search
- [x] row interaction（以 row actions 實作，含 edit/delete）
- [x] add/edit modal
- [x] calculator / amount input

### M2 - Reports / Budget / Goals 初版（已完成）
- [x] Reports 主結構（趨勢 + 分類）
- [x] Budget 顯示與編輯流
- [x] Goals 列表 / 進度 / 新增 / 刪除 / quick update

### M3 - 可測版本（已完成）
- [x] `npm run build` 成功
- [x] Capacitor Android 專案建立
- [x] debug APK 產出

### M4 - 下一階段（未完成）
- [ ] prototype 重互動（真 swipe + 手勢優化）
- [ ] store/module 拆分（從單檔 prototype code 拆元件）
- [ ] persistence（local storage/SQLite）
- [ ] 測試（unit + e2e smoke）
- [ ] release build / signing
