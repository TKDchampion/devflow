---
name: devflow-branch
description: Personal override for the devflow branch step that applies only to one repository and hands back to the default everywhere else.
---

# devflow-branch（範例：只對單一專案生效）

把這個資料夾複製到 `~/.claude/skills/devflow-branch/`。個人 skill 會在所有專案載入，所以先判斷目前是不是目標專案。

## 先判斷專案

執行 `git remote get-url origin`。結果不是 `git@github.com:your-org/your-repo.git` 時，用相同參數呼叫 `devflow:branch`，照預設流程處理，忽略本文件其餘內容。

## 命名規則

- 每個任務都要有 Jira 票號（例 `MOP-1234`）；沒有時先問使用者，不要自己編。
- 新功能：`feature/{TICKET}-{kebab-case-description}`；修 bug：`bugfix/{TICKET}-{kebab-case-description}`。
- 從最新的 `origin/main` 切出；目前分支已符合格式且票號相同時，沿用。

## 模式

參數第一個字是模式：

- `propose`：不改任何東西，回傳 `分支動作`（`沿用 <branch>` 或 `建立 <name>，base origin/main`），以及需要問使用者的問題。
- `apply`：只在計畫組核准後執行。先 `git fetch origin main`，再 `git switch -c <核准的名稱> origin/main`。分支已存在、本機有會被覆蓋的變更或指令失敗時，回報 `[!] 阻塞` 與完整錯誤訊息並停下，不要改用其他方式。回傳 `分支結果`。

不要 stash、reset、刪除分支或 push。
