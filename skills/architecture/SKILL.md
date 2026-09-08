---
name: architecture
description: Map the current architecture, invariants, integration boundaries, and change impact before solution comparison. Use for HIGH-risk work, cross-service changes, data-model redesigns, large refactors, concurrency, or changes with a broad blast radius.
argument-hint: <clarified task>
allowed-tools: Read, Grep, Glob
---

# Architecture

Perform a read-only architecture assessment for `$ARGUMENTS`.

Read `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

Delegate one isolated task to the `devflow:architecture-reviewer` subagent with the Agent tool. Give it the clarified task and ask it to inspect the repository independently. If that agent is unavailable, do the same read-only assessment in the current context and disclose the fallback. Translate and reorganize delegated output before presenting it; do not expose a long raw agent response.

Require the result to cover:

- Current components, data flow, ownership, and trust boundaries
- Invariants and compatibility constraints that must remain true
- Likely change surface and downstream consumers
- Migration, concurrency, rollout, and rollback concerns
- Architecture facts that distinguish viable solutions
- Unknowns that still block solution comparison

Return an `架構摘要` in Traditional Chinese with evidence anchored to files or symbols. Do not select a solution and do not modify code.
