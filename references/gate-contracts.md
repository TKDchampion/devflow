# Gate contracts

Use these compact contracts so a workflow can resume across turns without writing state files. Apply `${CLAUDE_PLUGIN_ROOT}/references/response-style.md`; the rendered contract content must use Traditional Chinese and readable Markdown layout.

## Progress contract

Emit this contract before analysis at workflow start, again after risk routing, before every user wait, at the start and end of each approved plan, and immediately before review and commit. Keep completed items compact, but never hide the current stage.

```text
工作流程進度
整體：已完成 <completed>/<total> 個階段
[x] 需求分析
[x] 方案討論
[x] 計畫組已核准
[>] 計畫 1/3 — 驗證
[ ] 計畫 2/3 — ...
[ ] 計畫 3/3 — ...
目前：...
下一步：...
```

Use `[x]` for complete, `[>]` for active, `[ ]` for pending, `[!]` for blocked, and `[-]` for a justified skip. Do not mark a stage complete until its required evidence exists.

## Analysis contract

```text
任務分析
目標：...
範圍：...
限制：...
風險：LOW | MEDIUM | HIGH
風險原因：...
模糊程度：無 | 可處理 | 阻塞
需要重大決策：是 | 否
必要關卡：...
``` 

## Clarification contract

Emit this contract only when no blocking clarification question remains. While waiting for answers, use a readable `待確認問題` section instead and do not label the requirements as clarified.

```text
已釐清需求
預期結果：...
非目標：...
限制：...
驗收條件：...
待確認問題：無 | ...
``` 

## Decision contract

```text
方案決策
決策主題：...
選項：A | B | C
建議：...
狀態：等待使用者 | 已選擇
已選方案：無 | ...
``` 

Only an explicit user message selects an option. A recommendation is not approval.

## Plan-set contract

```text
執行計畫組
已選方案：...
核准狀態：等待使用者 | 已核准
計畫數量：...

計畫 1 — <name>
  目標：...
  範圍：...
  相依計畫：無 | ...
  驗收條件：...
  驗證方式：...
  Runtime 驗證：...
  Review 重點：...
  Commit 訊息：<message>

計畫 2 — <name>
  ...

跨計畫回復方式：...
```

Each plan is an ordered, independently reviewable and committable unit. Approval applies to the complete plan set, scopes, and proposed commit messages. Plan-set approval never authorizes `git commit`; every plan requires a separate explicit user confirmation after its exact staged diff and review result are shown. It also does not authorize scope expansion, force-push, push, merge, deploy, or unrelated changes.

## Validation contract

```text
驗證結果
計畫：...
已執行指令：...
通過：...
失敗：...
未執行：...
狀態：通過 | 失敗 | 部分完成
``` 

## Review contract

```text
獨立程式碼審查
計畫：...
已審查 diff：git diff --cached --binary --full-index
Patch 身分：base <commit OID>; tree <index-tree OID>
Diff 摘要：...
發現事項：P0 ... | P1 ... | P2 ... | P3 ... | 無
殘餘風險：...
狀態：通過 | 需要修改 | 阻塞
燈號：🟢 綠燈 | 🟡 黃燈 | 🔴 紅燈
Commit 關卡：等待人工確認 | 阻擋
```

## Commit confirmation contract

Emit this contract after a 🟢 綠燈 or 🟡 黃燈 review and stop. Never run `git commit` in the same turn that first presents the review result.

```text
Commit 確認
計畫：<number>/<total> — <name>
Review 燈號：🟢 綠燈 | 🟡 黃燈
Patch 身分：base <commit OID>; tree <index-tree OID>
Commit 訊息：<message>
殘餘風險：無 | ...
確認狀態：等待使用者
綠燈可回覆：確認 commit | 取消
黃燈可回覆：接受風險並確認 commit | 修正 finding | 取消
```

## Plan checkpoint contract

```text
計畫檢查點
計畫：<number>/<total> — <name>
實作：完成 | 未完成
驗證：通過 | 失敗 | 部分完成
Runtime 驗證：通過 | 失敗 | 部分完成 | 已跳過（附原因）
Review 燈號：🟢 綠燈 | 🟡 黃燈 | 🔴 紅燈
風險接受：不適用 | 已接受 — <使用者決策證據>
Commit 確認：已確認 — <使用者決策證據>
Patch 身分：...
已審查檔案：...
Commit：<hash and subject>
剩餘計畫：...
下一步：...
```

## Final contract

```text
完成
已實作：...
驗證：...
Runtime 驗證：...
Review：...
各計畫 Commit：...
已跳過關卡與原因：...
殘餘風險：...
```
