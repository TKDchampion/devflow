---
name: performance-review
description: Perform an independent review of a performance-sensitive change. Use for hot paths, high-volume queries, caches, fan-out, concurrency, resource usage, latency, throughput, or scalability risk.
argument-hint: <diff target and workload assumptions>
---

# Performance review

Review `$ARGUMENTS` without modifying code.

Read `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md` and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

Delegate one isolated task to the `devflow:performance-reviewer` subagent using the Agent tool. Give it the workload, scale assumptions, selected solution, exact staged diff and patch identity, existing measurements, and validation evidence. If the agent is unavailable, return `阻塞`; do not substitute the implementer's own assessment.

Inspect algorithmic complexity, I/O and query count, N+1 behavior, allocation, copying, cache semantics, batching, contention, fan-out, backpressure, pagination, and failure amplification only where relevant. Never invent benchmark results; label reasoned risks separately from measured regressions.

Return `效能審查` in Traditional Chinese with findings, evidence or measurement gaps, remediation, residual risk, and `通過`, `需要修改`, or `阻塞`. Include a minimal advisory code or diff example for each concrete, context-supported remediation.
