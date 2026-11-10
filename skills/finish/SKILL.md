---
name: finish
description: Close a development workflow only after every approved plan has passed validation, received a traffic-light diff review, and reached its required commit checkpoint. Use as the final quality gate before reporting completion.
argument-hint: <workflow evidence>
allowed-tools: Read, Grep, Glob
---

# Finish

Assess whether `$ARGUMENTS` is genuinely complete.

Read `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

1. Inspect the final working-tree status and commit history. Separate task changes from unrelated user changes. Confirm the plan commits are on the branch recorded in the approved plan set's `分支` field.
2. Confirm every approved plan ran in order and has a `計畫檢查點` record.
3. Confirm each approved plan committed the exact reviewed diff only after a separate explicit user commit confirmation. A 🟡 黃燈 plan must also record acceptance of its exact residual risks. No 🔴 紅燈 plan or synthetic no-commit outcome may be complete.
4. Confirm the combined implementation matches the selected solution and acceptance criteria.
5. Confirm required deterministic checks passed after each plan's latest edit.
6. Confirm runtime verification and specialist reviews ran when required, or record a specific defensible skip reason.
7. Confirm no task-owned staged or unstaged change remains and no unrelated user change entered a plan commit.
8. List accepted P2/P3 findings and residual risks.
9. Do not create an extra final commit, amend, push, merge, rebase, deploy, or open a pull request unless the user separately requested it.

If any completion condition fails, return `尚未完成` with the exact next gate. Otherwise return the `完成` contract from `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md` in a concise Traditional Chinese user-facing summary.
