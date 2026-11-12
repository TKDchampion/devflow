---
name: checkpoint
description: Isolate, stage, run all required reviews, and wait for explicit human confirmation before committing exactly one completed plan. Use after that plan's implementation, validation, and verification; enforce the red/yellow/green commit gate.
argument-hint: <plan number, scope, evidence, and proposed commit message>
---

# Checkpoint

## External override

If an external skill named `devflow-checkpoint` is available — listed as `devflow-checkpoint` (organization, personal, or project) or as `<plugin>:devflow-checkpoint` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Create a reviewed commit boundary for exactly one active plan in `$ARGUMENTS`.

Read `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md`, `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md`, `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`, and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md`.

## Prepare the review target

1. Confirm the execution plan set is explicitly approved and identify the active plan, its allowed scope, acceptance criteria, validation evidence, and commit intent.
2. Compare the current index and working tree with the workflow's recorded initial Git state. Preserve all unrelated pre-existing and concurrent user changes.
3. If unrelated staged changes exist, or active-plan edits cannot be isolated from user edits in the same file, stop with `[!] 阻塞`; do not rewrite the index or commit.
4. Stage only active-plan changes using explicit paths or safely isolated hunks. Never use `git add .`, `git add -A`, `git commit -a`, or broad globs.
5. Inspect `git diff --cached --check`, the staged file list and stat, and the complete `git diff --cached --binary --full-index`. An empty staged diff is not a commit; return to plan-set revision rather than inventing a no-commit completion.
6. Record the current `git rev-parse HEAD` as the base commit and `git write-tree` as the reviewed index tree. The pair `<base commit>..<index tree>` is the content-addressed patch identity, including paths, modes, and binary contents. Any later change to either value invalidates the review.

## Review and commit gate

1. Emit `工作流程進度` with the active plan in Review.
2. Invoke `devflow:review-routing` with the risk analysis, the exact staged file list, and a diff summary. Run each specialist review it selects against the exact staged diff and recorded patch identity, and record its reason for every specialist not selected. If it names an additional reviewer agent that is unavailable, treat that review as `阻塞`.
3. Invoke `devflow:commit propose` with the staged diff summary and the plan's proposed commit message. If it returns a different message, show both in the review result; the user's commit confirmation covers the returned message.
4. Invoke `devflow:review` against the same staged diff and patch identity, including the specialist results. Aggregate all review evidence using `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md`; the strongest signal wins.
5. Show the user the reviewed file list, concise diff summary, findings, patch identity, proposed commit message, and traffic-light signal. Format each finding as a separate, readable subsection. In addition to the recommendation, include `參考修改（尚未套用）` with a minimal diff or code block whenever the reviewer can propose a context-correct change with reasonable confidence.
6. Enforce the result:
   - 🔴 紅燈: do not commit and do not accept an override for this patch. Return to `devflow:improve`, validation, and a fresh review of the updated staged diff.
   - 🟡 黃燈: do not commit. Emit the `Commit 確認` contract, then stop and ask the user to fix the findings, or explicitly accept the stated residual risk and confirm commit for this exact patch.
   - 🟢 綠燈: do not commit automatically. Emit the `Commit 確認` contract, ask the user to confirm commit for this exact patch, and stop.
7. Never amend, push, merge, rebase, deploy, or include unrelated changes unless the user separately authorizes that action.
8. After `devflow:commit` returns, verify that the new commit's parent is the recorded base and `git rev-parse HEAD^{tree}` equals the reviewed index tree. If a hook rejects the commit or the identity does not match, do not claim a reviewed success; emit `[!] 阻塞`, disclose the exact repository state, and do not rewrite history automatically.
9. After a successful identity check, report the commit hash and subject, confirm what remains in the working tree, and emit the `計畫檢查點` contract.

Approval of the plan set does not authorize `git commit`. Every 🟢 綠燈 or 🟡 黃燈 patch requires a separate explicit user confirmation after review. A 🟡 黃燈 confirmation must also accept its listed residual risks. A 🔴 紅燈 patch is never allowed to commit.

## Resume after human confirmation

Commit only on a later user turn when the immediately pending checkpoint is 🟢 綠燈 or 🟡 黃燈 and the user explicitly confirms the exact patch:

1. Confirm the decision applies to the same plan, findings, proposed commit message, base commit, and index-tree identity. For 🟡 黃燈, also confirm and record explicit acceptance of every listed residual risk.
2. Re-run `git rev-parse HEAD` and `git write-tree`. If either differs, invalidate the acceptance and review the new patch instead of committing.
3. Record the explicit commit confirmation and emit `工作流程進度` with the active plan in Commit. Invoke `devflow:commit apply` with the confirmed commit message, the base-commit and index-tree OIDs, and the confirmation evidence; do not run `git commit` here. Do not infer confirmation from plan approval, silence, or a previous plan's confirmation.
4. Perform the same parent/tree verification and success reporting required above, whether `devflow:commit` or an override of it made the commit. The completed `計畫檢查點` must retain the review signal, commit-confirmation evidence, and any 黃燈 risk-acceptance evidence.

If the user chooses to fix findings or cancel, do not commit. Return to `devflow:improve` when applicable.
