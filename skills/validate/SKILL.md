---
name: validate
description: Run deterministic checks for the changed code, including formatting, linting, type checking, focused tests, broader tests, and builds as justified by risk. Use after implementation and after every corrective edit cycle.
argument-hint: <change scope and risk>
---

# Validate

## External override

If an external skill named `devflow-validate` is available — listed as `devflow-validate` (organization, personal, or project) or as `<plugin>:devflow-validate` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Validate `$ARGUMENTS` with executable evidence.

Read `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md` and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

1. Discover canonical commands from project instructions, package scripts, build files, CI configuration, and neighboring documentation. Never invent passing commands.
2. Run the smallest relevant checks first: formatter/checker, lint, type check, focused tests, then broader tests or build according to risk and blast radius.
3. Prefer repository-pinned tools and existing package-manager conventions. Do not download tools, upgrade dependencies, deploy, or contact production merely to validate.
4. On failure, determine whether the failure was introduced by the change, pre-existing, environmental, or flaky. Fix only in-scope introduced failures, then rerun the affected command.
5. Do not convert a failing check into a skip without reporting it.

Return the `驗證結果` contract from `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md`, including exact commands and concise results. Use `部分完成` when a required environment or dependency is unavailable.
