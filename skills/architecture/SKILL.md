---
name: architecture
description: Map the current architecture, invariants, integration boundaries, and change impact before solution comparison. Use for HIGH-risk work, cross-service changes, data-model redesigns, large refactors, concurrency, or changes with a broad blast radius.
argument-hint: <clarified task>
allowed-tools: Read, Grep, Glob
---

# Architecture

## External override

If an external skill named `devflow-architecture` is available — listed as `devflow-architecture` (organization, personal, or project) or as `<plugin>:devflow-architecture` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

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
