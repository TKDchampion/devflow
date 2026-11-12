---
name: devflow-commit
description: Organization override for the devflow commit step. Enforces the ticket in every commit message, then hands back to the default devflow commit procedure.
---

# devflow-commit（範例：延伸預設步驟）

把這個資料夾複製到 `~/.claude/skills/devflow-commit/`（個人）或 `<repo>/.claude/skills/devflow-commit/`（專案），`devflow:commit` 就會改用這份。

參數第一個字是模式：`propose`（只草擬 message，不改任何東西）或 `apply`（人工確認後實際 commit）。

1. 從目前分支名稱取出 Jira 票號（例如 `feature/MOP-1234-add-field` → `MOP-1234`）。找不到時停下來問使用者，不要自己編。
2. `propose`：草擬的 subject 都要以票號開頭，例如 `MOP-1234 add shipper field`。
3. `apply`：確認要 commit 的 message 含有該票號；不含就停下來，回報 `[!] 阻塞`。
4. 以上都處理完後，用相同參數呼叫 `devflow:commit`，照它的預設流程完成。

若要完全取代預設流程，把第 4 步換成自己的做法即可，但 `propose` 與 `apply` 都要回傳 `references/skill-overrides.md` 規定的內容。devflow 的 checkpoint 仍會在 commit 前後檢查 patch identity 與人工確認。
