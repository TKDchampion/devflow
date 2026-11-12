---
name: devflow-review-routing
description: Project override for devflow review routing that adds path-based rules on top of the default routing.
---

# devflow-review-routing（範例：在預設上加條件）

把這個資料夾複製到 `<repo>/.claude/skills/devflow-review-routing/`，提交後團隊共用。

1. 用相同參數呼叫 `devflow:review-routing`，取得預設的 `Review 路由`。
2. 在預設結果上再套用以下條件，只能把 `不執行` 改成 `執行`，不能反過來：
   - staged 檔案含 `src/payment/**` 或任何 `**/auth/**`：security review 一律 `執行`。
   - staged 檔案含 `db/migrations/**`：test review 一律 `執行`，並要求確認有 rollback 方式。
3. 回傳合併後的 `Review 路由`，每一項都寫出理由。
