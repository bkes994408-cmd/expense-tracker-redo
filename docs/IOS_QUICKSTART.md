# iOS Quickstart

## 專案位置
- `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo`

## Xcode 專案
- `/Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo/ios/App/App.xcodeproj`

## 最短步驟

```bash
cd /Users/bkes994104/.openclaw/workspace-dev/expense-tracker-redo
npm run build
npx cap sync ios
npx cap open ios
```

打開 Xcode 後：
1. 選 `App` target
2. 選 simulator 或真機
3. 若要真機，先設 Team / Signing
4. 按 Run

## 如果 web 改了
```bash
npm run build
npx cap sync ios
```

再回 Xcode Build / Run。

## 注意
- 第一次開啟 iOS 專案時，Xcode 可能先做 package resolve，會比較久。
- 若要 Archive / 上架，請改看 `docs/IOS_SIGNING_ARCHIVE.md`。
