---
name: implement
description: Implement exactly one active plan from an explicitly approved execution plan set with minimal, pattern-consistent changes and appropriate tests. Use only after required clarification, solution selection, and plan-set approval.
argument-hint: <approved plan number, task, selected solution, and plan scope>
---

# Implement

Implement `$ARGUMENTS`.

Read `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

Before editing:

1. Confirm the selected solution, approved plan-set status, active plan number, and that every earlier dependency plan is complete.
2. Restate the active plan's scope and acceptance criteria. Do not include work owned by later plans.
3. Inspect relevant code, project instructions, tests, and neighboring patterns.
4. Confirm that the planned files and assumptions still fit the repository and that unrelated pre-existing changes can be preserved.

During implementation:

- Keep the diff focused; preserve unrelated user changes.
- Execute only the active plan. Do not opportunistically start, stage, or commit a later plan.
- Reuse established abstractions and avoid speculative infrastructure.
- Add or update tests with the behavior change, including failure paths where material.
- Maintain compatibility, security, error handling, and observability obligations identified earlier.
- Do not silently change the chosen approach.

If new evidence invalidates the selected solution, expands scope, or changes later plans, stop edits at a safe boundary and return to `devflow:tradeoff` with the new evidence. Otherwise finish with a concise implementation summary and exact changed areas for this plan, then route to validation. Do not commit; `devflow:checkpoint` owns the review-and-commit gate.
