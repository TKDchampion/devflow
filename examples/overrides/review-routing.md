---
slot: review-routing
mode: extend
---

在預設條件之外：

- staged diff 動到 `src/payment/**` 或任何 `**/auth/**` 時，一律執行 `devflow:security-review`，不論風險等級。
- staged diff 動到 `db/migrations/**` 時，一律執行 `devflow:test-review`，並在 review 中確認有 rollback 方式。
