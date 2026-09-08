---
name: security-review
description: Perform an independent security review of a security-sensitive change. Use for authentication, authorization, secrets, untrusted input, data exposure, cryptography, payments, tenancy, network boundaries, or dependency and supply-chain risk.
argument-hint: <diff target and threat context>
---

# Security review

Review `$ARGUMENTS` without editing files.

Read `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md` and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

Prefer Claude Code's bundled `/security-review` when it is callable and can inspect the recorded staged-patch identity. Otherwise delegate one isolated task to the `devflow:security-reviewer` subagent using the Agent tool. If neither independent mechanism is available, return `阻塞`; do not substitute the implementer's own assessment.

Provide the task, trust boundaries, selected solution, exact staged diff and patch identity, and validation evidence. Require concrete attack paths and inspect authentication, authorization, tenant isolation, input handling, injection, secrets, sensitive data, logging, SSRF/path traversal, dependency risk, cryptographic misuse, unsafe defaults, and abuse/resource exhaustion only where relevant.

Return `安全性審查` in Traditional Chinese with findings, evidence, remediation, residual risk, and `通過`, `需要修改`, or `阻塞`. Include a minimal advisory code or diff example for each concrete, context-supported remediation. Do not dilute real findings with generic checklist items.
