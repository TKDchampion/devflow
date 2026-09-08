---
name: test-review
description: Independently assess whether tests prove the changed behavior and important failure modes. Use for MEDIUM/HIGH behavior changes, regressions, concurrency, migrations, integrations, or whenever passing tests may still leave material gaps.
argument-hint: <task, diff target, and test results>
---

# Test review

Review `$ARGUMENTS` without modifying code.

Read `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md` and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

Delegate one isolated task to the `devflow:test-reviewer` subagent using the Agent tool. Give it the acceptance criteria, selected solution, exact staged diff and patch identity, and exact validation results. If the agent is unavailable, return `阻塞`; do not substitute the implementer's own assessment.

Require a behavior-to-test matrix covering happy paths, boundaries, failures, state transitions, permissions, concurrency, migration/rollback, and integration seams as applicable. Distinguish missing coverage from tests that exist but assert the wrong thing. Avoid demanding low-value implementation-detail tests.

Return `測試審查` in Traditional Chinese with blocking gaps, non-blocking gaps, redundant/brittle tests, and `通過`, `需要修改`, or `阻塞`. Include the smallest useful advisory test code or diff example when repository context supports one.
