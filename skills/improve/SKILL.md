---
name: improve
description: Apply confirmed review findings, simplify the resulting code when useful, and route the change back through affected checks. Use only after review identifies actionable issues or the user explicitly requests cleanup.
argument-hint: <accepted findings and current change>
---

# Improve

Improve `$ARGUMENTS` while preserving the selected solution and the active approved plan's scope.

Read `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

1. Triage findings against `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md` and verify each against the code before editing.
2. Fix all confirmed P0/P1 findings. Fix P2 findings when safely in scope. Treat P3 as optional unless the user requested cleanup or the change is obviously safe and local.
3. Reject false positives with concise evidence instead of changing correct code.
4. If a fix requires a different architecture, dependency, public contract, migration strategy, or other meaningful decision, stop and return to `devflow:tradeoff` for explicit user selection.
5. Keep fixes minimal and add regression tests for corrected behavior.
6. Optionally use Claude Code's bundled `/simplify` only after correctness findings are settled and only for the current change target.
7. Invoke `devflow:validate` again, then repeat runtime verification affected by the edits.
8. Return to `devflow:checkpoint`. It must safely restage the active plan, establish a new patch identity, and rerun all affected specialist and correctness reviews. Any previous traffic-light signal is invalid after an edit.

Return `改善結果` with fixed, rejected, deferred, and re-check-required items. Do not hide residual findings.
