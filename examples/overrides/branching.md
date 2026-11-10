---
slot: branching
mode: replace
---

- 每個 devflow 任務都從 `origin/develop` 建立新分支，不在 `main` 或 `develop` 上直接 commit。
- 新功能：`feature/<JIRA-KEY>-<kebab-case-slug>`；修 bug：`bugfix/<JIRA-KEY>-<kebab-case-slug>`。
- 沒有 Jira key 時先問使用者，不要自己編。
- 目前已經在符合格式的分支上時，沿用該分支。
