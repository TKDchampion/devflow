---
name: develop
description: Run the complete risk-based development quality-gate workflow for a software change. Use only when the user explicitly invokes the development workflow and wants analysis, solution trade-offs, implementation, validation, verification, and independent review coordinated end to end.
argument-hint: <development request>
disable-model-invocation: true
allowed-tools: Read, Grep, Glob
---

# Develop

## External override

If an external skill named `devflow-develop` is available — listed as `devflow-develop` (organization, personal, or project) or as `<plugin>:devflow-develop` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Coordinate the request `$ARGUMENTS` through visible, proportionate quality gates. If `$ARGUMENTS` is empty, use the user's latest concrete development request.

Read `${CLAUDE_PLUGIN_ROOT}/references/risk-model.md`, `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md`, `${CLAUDE_PLUGIN_ROOT}/references/tool-strategy.md`, `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`, and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before routing. Apply the response style to every interim and final user-facing message, including delegated agent results.

## Visible progress

Emit an initial `工作流程進度` contract before analysis, then emit a route-specific update after risk routing. Emit another update before every user decision, at the start and end of each plan, and before review and commit. Update the active marker as work advances. Never silently run several plans as one opaque implementation phase.

## Non-negotiable decision gate

When a meaningful architectural or implementation decision exists:

1. Do not modify code.
2. Present two or three viable approaches with concise trade-offs.
3. Recommend one approach with reasons tied to the repository and request.
4. Stop and wait for the user's explicit selection.
5. Create the execution plan set only after selection, then wait for separate plan-set approval before editing code.

A recommendation, prior convention, or lack of objection is not user approval. Do not create option theater for a trivial change with one obvious approach.

## Workflow

1. Emit the initial `工作流程進度`, then invoke `devflow:analyze` with the request. Preserve its risk level, ambiguity, decision status, and required gates. Capture the initial Git status, current `HEAD`, and any pre-existing staged or unstaged changes so later commits cannot absorb unrelated work. After routing, emit the route-specific progress update.
2. For HIGH risk with material ambiguity, invoke `devflow:grill`. Ask only questions whose answers alter behavior, risk, scope, or architecture. Stop for the answers, then update the analysis.
3. For HIGH risk, invoke `devflow:architecture` before proposing solutions.
4. If a meaningful decision exists, invoke `devflow:tradeoff`. Stop at `狀態：等待使用者`. On the next user turn, record the explicit choice and continue; do not ask again unless new evidence invalidates it.
5. Invoke `devflow:plan` for every task. Split non-trivial work into the smallest useful ordered set of independently reviewable, committable plans. A truly indivisible LOW task may use one plan, but state why it cannot be split without creating artificial commits.
6. Show the complete `執行計畫組` with `核准狀態：等待使用者`, then stop. Do not edit, stage, or commit until the user explicitly approves the plan set. Approval authorizes only the listed branch action, plan scopes, and proposed commit messages; it does not authorize any `git commit`.
7. After approval and before the first plan, invoke `devflow:branch apply` with the approved branch action from the plan set's `分支` field. If it reports `阻塞`, stop and ask the user. Afterwards, confirm with `git branch --show-current` and `git rev-parse HEAD` that the approved branch is checked out, and record them as the workflow's starting point.
8. Execute exactly one plan at a time. For the active plan only, invoke `devflow:implement`, then `devflow:validate`, then `devflow:verify` when observable behavior is required. Do not begin a later plan early.
9. Invoke `devflow:checkpoint` for the active plan. It must isolate and stage only that plan's changes, establish the exact patch identity, run every specialist review selected by `devflow:review-routing` and the independent correctness review against that same staged patch, emit the traffic-light result, and enforce the commit gate.
10. On 🔴 紅燈, do not commit. Invoke `devflow:improve`, then repeat affected validation and verification before a fresh checkpoint for that same plan. The checkpoint must rerun affected specialist and correctness reviews against the new patch identity. Limit this loop to two correction cycles; after that, report the blocker.
11. On 🟡 黃燈, show the findings, proposed commit message, and `Commit 確認`, then stop. Commit only on a later user turn that explicitly accepts the listed residual risks and confirms that exact patch.
12. On 🟢 綠燈, show the clean review, proposed commit message, and `Commit 確認`, then stop. Commit only on a later user turn that explicitly confirms that exact patch.
13. After a valid confirmation, allow `devflow:checkpoint` to commit through `devflow:commit`, record the commit hash and confirmation evidence, mark the plan complete, then start the next approved plan.
14. If implementation reveals a new meaningful decision or requires scope outside the approved plan set, stop and return to `devflow:tradeoff`; create and obtain approval for a revised plan set afterward.
15. If an approved plan produces no diff, stop and revise the plan set instead of recording a synthetic no-commit completion.
16. After every plan has a recorded reviewed and explicitly confirmed commit, invoke `devflow:finish`.

## Route by risk

- LOW: analyze → plan set → user approval → branch → one plan → validate → checkpoint review → user commit confirmation → commit → finish.
- MEDIUM: analyze → tradeoff if meaningful → solution decision → plan set → user approval → branch → repeat plan → validate → verify if needed → checkpoint (stage → reviews → signal → user commit confirmation → commit) → finish.
- HIGH: analyze → grill if needed → architecture → tradeoff → solution decision → plan set → user approval → branch → repeat plan → validate → verify → checkpoint (stage → specialist and correctness reviews → signal → user commit confirmation → commit) → finish.

## Resume behavior

Treat a short reply such as `B` as a solution selection only when the immediately preceding decision is waiting and option B is unambiguous. Treat `確認計畫`, `核准`, or an equivalent clear reply as plan-set approval only when the displayed plan set is the immediately pending decision; never reuse it as commit confirmation. Treat `確認 commit` as authorization only when one exact 🟢 綠燈 or accepted 🟡 黃燈 patch is immediately pending. If the user changes requirements or the patch identity changes, invalidate the confirmation and review again.
