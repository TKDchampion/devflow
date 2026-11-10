---
slot: review-routing
---

依 `references/risk-model.md` 的判斷與實際 staged diff 決定要加跑哪些 specialist review：

- `devflow:security-review`：authentication、authorization、secrets、敏感資料、不受信任輸入、payments、tenancy、network boundary、dependency 或 supply-chain 相關變更。
- `devflow:performance-review`：hot path、大量查詢、cache、fan-out、concurrency、資源用量、latency、throughput 或 scalability 相關變更。
- `devflow:test-review`：MEDIUM／HIGH 且有非 trivial 測試義務的行為變更。

沒有符合條件的 specialist 可以不跑，但要在 `計畫檢查點` 寫出跳過原因。
