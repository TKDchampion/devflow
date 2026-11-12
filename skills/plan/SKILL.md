---
name: plan
description: Split a selected solution into an ordered set of independently reviewable and committable execution plans, present the full set, and obtain explicit approval before coding. Use after solution discussion for every devflow development task; never bypass an unresolved solution decision.
argument-hint: <risk, selected solution, and task>
allowed-tools: Read, Grep, Glob
---

# Plan

## External override

If an external skill named `devflow-plan` is available — listed as `devflow-plan` (organization, personal, or project) or as `<plugin>:devflow-plan` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Plan `$ARGUMENTS` without modifying files, staging changes, or committing.

Read `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md`, `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`, and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

## Branch and commit messages

- Fill the plan set's `分支` field by invoking `devflow:branch propose` with the task. Use its result as is, and pass any question it raises, such as a missing ticket key, to the user.
- Draft every plan's `Commit 訊息` by invoking `devflow:commit propose` once with all plans.

If a meaningful solution decision exists but no explicit user selection is recorded, stop and return to `devflow:tradeoff`.

Split the work into the smallest useful ordered set of plans:

- Each plan must deliver a coherent increment that can be validated, reviewed as an isolated diff, and committed independently.
- Keep dependencies explicit and order foundational work before consumers.
- Avoid plans that mix unrelated concerns or are so small that they create empty or cosmetic commits.
- Do not create investigation-only or no-change plans. Put discovery in the planning work or an adjacent implementation plan; every approved execution plan must be expected to produce a reviewable commit.
- A non-trivial task should have multiple plans. If a LOW task is genuinely indivisible, use one plan and explain why splitting would be artificial.
- MEDIUM plans must identify component/file areas, acceptance criteria, tests, runtime verification, review target, and commit intent.
- HIGH plans must additionally cover interfaces, data/migration steps, compatibility, failure handling, observability, rollout/rollback, security, and cross-plan risks.

Every plan must be concrete and consistent with the selected solution. Mention files only when repository inspection supports them. Separate required work from optional follow-ups. Identify likely shared files so execution can avoid mixing two plans in one diff.

Return the `執行計畫組` contract from `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md` with `核准狀態：等待使用者`. Emit `工作流程進度`, ask for one explicit approval of the complete set, and stop. Only a later explicit response can change the status to `已核准`; silence or prior solution approval is not plan approval. Plan approval covers the branch action, scope, and proposed commit messages only. It never replaces the separate human commit confirmation required after each plan review.
