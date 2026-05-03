# Contributing

## Branch strategy

- `main`：保持可發版
- feature work：從 `main` 開新 branch
- branch naming 建議：
  - `feat/<short-name>`
  - `fix/<short-name>`
  - `chore/<short-name>`
  - `test/<short-name>`

## Before opening a PR

請先在本機確認：

```bash
npm test
npm run build
npm run test:e2e:smoke
npm run release:check
```

## PR expectations

- 標題使用清楚的 conventional-style 前綴
  - `feat:`
  - `fix:`
  - `chore:`
  - `test:`
  - `docs:`
  - `refactor:`
- 說明變更範圍、驗證方式、風險與 rollback 方式
- UI 變更建議附 screenshot / 錄影

## Release baseline

合併前至少要滿足：

- GitHub Actions `Release Check` 綠燈
- `main` 不帶明顯已知壞狀態
- 版本資訊一致（package / Android / iOS）

## Notes

- prototype 是 source of truth
- 不直接改舊專案 `expense-tracker-native`
- 若改到版本號、build number、Capacitor sync，請在 PR 內明講
