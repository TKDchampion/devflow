---
name: tradeoff
description: Present viable implementation approaches and obtain an explicit user choice before coding. Use when two or more credible solutions differ meaningfully in architecture, data model, API, dependency, security, performance, maintainability, rollout, or reversibility.
argument-hint: <analyzed task and architecture context>
allowed-tools: Read, Grep, Glob
---

# Tradeoff

## External override

If an external skill named `devflow-tradeoff` is available — listed as `devflow-tradeoff` (organization, personal, or project) or as `<plugin>:devflow-tradeoff` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Evaluate `$ARGUMENTS` without modifying code.

Read `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md` and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

If there is no meaningful decision, state `已跳過方案比較：只有一個明確且合理的實作方向` with one sentence of evidence and return. Do not invent weak alternatives.

Otherwise:

1. State the decision to be made and the constraints that matter.
2. Present two or three genuinely viable approaches. Give each a short implementation sketch.
3. Compare repository fit, implementation complexity, operational risk, security, performance, maintainability, migration/rollback, and future flexibility. Omit irrelevant criteria.
4. Recommend one approach and explain why it best fits the current request and codebase.
5. Ask the user to choose A, B, C, or propose a modification.
6. Emit the `方案決策` contract with `狀態：等待使用者`.
7. Stop. Do not create an implementation plan, edit files, run write-capable commands, or treat the recommendation as approval.

When invoked after an explicit selection, record `狀態：已選擇` and the chosen option. If the choice adds a new material requirement, return to analysis instead of assuming details.
