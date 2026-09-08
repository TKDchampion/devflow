---
name: verify
description: Verify that a code change works through observable runtime behavior rather than only static checks. Use for UI flows, APIs, persistence, migrations, integrations, concurrency, configuration, or any change whose acceptance criteria require running the system.
argument-hint: <acceptance criteria and changed behavior>
---

# Verify

Verify `$ARGUMENTS` against observable acceptance criteria.

Read `${CLAUDE_PLUGIN_ROOT}/references/tool-strategy.md` and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md`. Use the project's existing run/verify instructions. If a project-specific run skill exists, use it. The user may invoke Claude Code's bundled `/verify` or `/run`; do not claim either ran unless its result is present.

When direct verification is needed:

1. Define the behavior to observe and the expected result before launching anything.
2. Start the minimum required local services using established commands.
3. Exercise the real path: UI interaction, request/response, persistence readback, migration dry run, job execution, or another relevant boundary.
4. Capture concrete evidence such as observed output, status, state transition, screenshot, log, or query result.
5. Clean up temporary local processes and data when safe.

Never use production credentials, mutate production, send real messages, charge accounts, or perform irreversible external actions without explicit authorization. If tools or the environment cannot exercise the path, report the exact limitation and a manual verification recipe.

Return `Runtime 驗證結果` with scenarios, expected results, observed results, evidence, and `通過`, `失敗`, `部分完成`, or `已跳過（附原因）`.
