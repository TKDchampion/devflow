---
name: checkpoint
description: Isolate, stage, run all required reviews, and wait for explicit human confirmation before committing exactly one completed plan. Use after that plan's implementation, validation, and verification; enforce the red/yellow/green commit gate.
argument-hint: <plan number, scope, evidence, and proposed commit message>
allowed-tools: Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/resolve-rules.mjs:*)
---

# Checkpoint

Create a reviewed commit boundary for exactly one active plan in `$ARGUMENTS`.

Read `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md`, `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md`, `${CLAUDE_PLUGIN_ROOT}/references/rule-slots.md`, and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md`.

## Effective rules

!`node ${CLAUDE_PLUGIN_ROOT}/scripts/resolve-rules.mjs --project "${CLAUDE_PROJECT_DIR}" review-routing commit-message`

If this section is missing or shows an error, run the same command with Bash before reviewing.

## Prepare the review target

1. Confirm the execution plan set is explicitly approved and identify the active plan, its allowed scope, acceptance criteria, validation evidence, and commit intent.
2. Compare the current index and working tree with the workflow's recorded initial Git state. Preserve all unrelated pre-existing and concurrent user changes.
3. If unrelated staged changes exist, or active-plan edits cannot be isolated from user edits in the same file, stop with `[!] 阻塞`; do not rewrite the index or commit.
4. Stage only active-plan changes using explicit paths or safely isolated hunks. Never use `git add .`, `git add -A`, `git commit -a`, or broad globs.
5. Inspect `git diff --cached --check`, the staged file list and stat, and the complete `git diff --cached --binary --full-index`. An empty staged diff is not a commit; return to plan-set revision rather than inventing a no-commit completion.
6. Record the current `git rev-parse HEAD` as the base commit and `git write-tree` as the reviewed index tree. The pair `<base commit>..<index tree>` is the content-addressed patch identity, including paths, modes, and binary contents. Any later change to either value invalidates the review.

## Review and commit gate

1. Emit `工作流程進度` with the active plan in Review.
2. Select specialist reviews by applying the effective `review-routing` rules to the risk analysis and the exact staged file list and diff. Run each selected review against the exact staged diff and recorded patch identity, and record the reason for every specialist not selected. A rule may name an additional reviewer agent; if that agent is unavailable, treat the review as `阻塞`.
3. Check the proposed commit message against the effective `commit-message` rules. If it does not comply, propose a compliant message in the review result; the user's commit confirmation covers that message.
4. Invoke `devflow:review` against the same staged diff and patch identity, including the specialist results. Aggregate all review evidence using `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md`; the strongest signal wins.
5. Show the user the reviewed file list, concise diff summary, findings, patch identity, proposed commit message, and traffic-light signal. Format each finding as a separate, readable subsection. In addition to the recommendation, include `參考修改（尚未套用）` with a minimal diff or code block whenever the reviewer can propose a context-correct change with reasonable confidence.
6. Enforce the result:
   - 🔴 紅燈: do not commit and do not accept an override for this patch. Return to `devflow:improve`, validation, and a fresh review of the updated staged diff.
   - 🟡 黃燈: do not commit. Emit the `Commit 確認` contract, then stop and ask the user to fix the findings, or explicitly accept the stated residual risk and confirm commit for this exact patch.
   - 🟢 綠燈: do not commit automatically. Emit the `Commit 確認` contract, ask the user to confirm commit for this exact patch, and stop.
7. Never amend, push, merge, rebase, deploy, or include unrelated changes unless the user separately authorizes that action.
8. After `git commit`, verify that its parent is the recorded base and `git rev-parse HEAD^{tree}` equals the reviewed index tree. If a hook rejects the commit or the identity does not match, do not claim a reviewed success; emit `[!] 阻塞`, disclose the exact repository state, and do not rewrite history automatically.
9. After a successful identity check, report the commit hash and subject, confirm what remains in the working tree, and emit the `計畫檢查點` contract.

Approval of the plan set does not authorize `git commit`. Every 🟢 綠燈 or 🟡 黃燈 patch requires a separate explicit user confirmation after review. A 🟡 黃燈 confirmation must also accept its listed residual risks. A 🔴 紅燈 patch is never allowed to commit.

## Resume after human confirmation

Commit only on a later user turn when the immediately pending checkpoint is 🟢 綠燈 or 🟡 黃燈 and the user explicitly confirms the exact patch:

1. Confirm the decision applies to the same plan, findings, proposed commit message, base commit, and index-tree identity. For 🟡 黃燈, also confirm and record explicit acceptance of every listed residual risk.
2. Re-run `git rev-parse HEAD` and `git write-tree`. If either differs, invalidate the acceptance and review the new patch instead of committing.
3. Record the explicit commit confirmation, emit `工作流程進度` with the active plan in Commit, then commit using the reviewed commit message. Do not infer confirmation from plan approval, silence, or a previous plan's confirmation.
4. Perform the same parent/tree verification and success reporting required above. The completed `計畫檢查點` must retain the review signal, commit-confirmation evidence, and any 黃燈 risk-acceptance evidence.

If the user chooses to fix findings or cancel, do not commit. Return to `devflow:improve` when applicable.
