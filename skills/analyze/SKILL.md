---
name: analyze
description: Analyze a software request before coding, identify scope and constraints, classify LOW/MEDIUM/HIGH risk, detect ambiguity and meaningful implementation decisions, and select required quality gates. Use at the start of development or whenever requirements materially change.
argument-hint: <task or changed requirement>
allowed-tools: Read, Grep, Glob
---

# Analyze

Analyze `$ARGUMENTS` without modifying files. Read `${CLAUDE_PLUGIN_ROOT}/references/risk-model.md`, `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md`, and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md`.

1. Inspect the nearest project instructions, relevant code, tests, interfaces, and established patterns. Explore only enough to classify the work reliably.
2. Restate the requested outcome, acceptance criteria, non-goals, constraints, and affected components. Distinguish stated facts from assumptions.
3. Classify risk as LOW, MEDIUM, or HIGH using the highest applicable level.
4. Mark ambiguity as NONE, RESOLVABLE, or BLOCKING. Treat it as blocking only when a reasonable assumption could materially change behavior, risk, or architecture.
5. Decide whether a meaningful implementation decision exists. Consider architecture, data model, state, API design, dependencies, performance, security, maintainability, rollout, and reversibility.
6. Select only the gates justified by the evidence.

Return exactly one compact `任務分析` contract in Traditional Chinese. Do not plan, propose solutions, or edit code in this gate.
