# Branch Protection Recommendation

建議先對 `main` 套用以下最小規則：

## Required

- Require a pull request before merging
- Require status checks to pass before merging
  - `release-check`
- Dismiss stale approvals when new commits are pushed
- Require conversation resolution before merging
- Block force pushes
- Block branch deletion

## Optional (等協作規模變大再開)

- Require approvals: 1
- Require code owner review
- Require linear history
- Require merge queue

## Why this baseline

目前 repo 還在快速迭代期，先保留速度：
- 先卡住直接把壞東西推進 `main`
- 先把 CI 當最低門檻
- 先不要把流程鎖過重，避免自己也被卡住
