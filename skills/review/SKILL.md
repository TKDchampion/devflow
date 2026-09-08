---
name: review
description: Independently review the exact staged diff for one approved execution plan, report correctness and regression findings, and assign a red/yellow/green commit signal. Use after validation and before every plan commit.
argument-hint: <plan, acceptance criteria, git diff --cached target, and validation evidence>
---

# Review

Review `$ARGUMENTS` independently and without editing files, staging changes, or committing.

Read `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md`, `${CLAUDE_PLUGIN_ROOT}/references/tool-strategy.md`, and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md`.

The required target is the exact staged patch from `git diff --cached --binary --full-index`, identified by its recorded base commit and index-tree object IDs. Inspect its file list, stat, full patch, and enough surrounding code to prove each claim. Prefer Claude Code's bundled `/code-review` (`/review`) only when it can review that exact target. Otherwise delegate one isolated task to the `devflow:code-reviewer` subagent using the Agent tool. Provide the active plan, original task, selected solution, acceptance criteria, validation and verification evidence, specialist-review results, patch identity, and staged diff target, but do not seed it with the implementer's self-review conclusions. If neither independent mechanism is available, return `阻塞`, 🔴 紅燈, and do not replace it with the implementer's own review.

Require the reviewer to:

- Inspect the actual diff plus enough surrounding code to prove each claim
- Prioritize correctness and realistic regression paths over style preferences
- Check boundary cases, error handling, compatibility, concurrency, performance, maintainability, and test coverage as applicable
- Exclude unrelated pre-existing issues and unsupported speculation
- Return findings ordered by severity with precise locations and fixes
- For every finding with a concrete, context-supported fix, include a minimal `參考修改（尚未套用）` diff or code block in addition to the written recommendation
- Confirm that the staged patch contains only the active plan and no unrelated or later-plan changes

Read the traffic-light mapping in `${CLAUDE_PLUGIN_ROOT}/references/review-severity.md`. Return the `獨立程式碼審查` contract with exactly one signal and commit gate. No findings is a valid 🟢 綠燈 result only when required evidence passes. Any change to the staged diff after review invalidates the signal and requires review again.
