---
name: review-routing
description: Decide which specialist reviews (security, performance, test, or additional reviewer agents) must run for one devflow plan's staged diff. Use when devflow:checkpoint selects reviews; replace it with a devflow-review-routing skill to change the routing.
argument-hint: <risk analysis, staged file list, and diff summary>
allowed-tools: Read, Grep, Glob
---

# Review routing

## External override

If an external skill named `devflow-review-routing` is available — listed as `devflow-review-routing` (organization, personal, or project) or as `<plugin>:devflow-review-routing` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Decide routing for `$ARGUMENTS` without running any review or changing files. Read `${CLAUDE_PLUGIN_ROOT}/references/risk-model.md`. If the staged file list is not supplied, inspect `git diff --cached --name-only`.

## Default routing

- `devflow:security-review`: authentication, authorization, secrets, sensitive data, untrusted input, payments, tenancy, network boundaries, or dependency and supply-chain changes.
- `devflow:performance-review`: hot paths, high-volume queries, caches, fan-out, concurrency, resource usage, latency, throughput, or scalability.
- `devflow:test-review`: MEDIUM or HIGH behavior changes with non-trivial test obligations.

The independent correctness review (`devflow:review`) always runs and is not decided here.

## Result

Return `Review 路由` with one line per specialist: `執行` or `不執行`, and the reason tied to the risk analysis or the staged files. List any additional reviewer agent to run, with its reason.
