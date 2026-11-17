---
name: implement-lite
description: Implement exactly one active plan that the approved plan set tags `實作模型：sonnet`, on a cheaper model. Use only when devflow:develop routes a routine, fully specified plan here; every other plan goes to devflow:implement.
argument-hint: <approved plan number, task, selected solution, and plan scope>
model: sonnet
---

# Implement (lite)

## External override

This skill has a fallback that the other devflow skills do not have. Resolve it in this order; the rule and its reasons are "The implement-lite fallback" in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

1. If an external skill named `devflow-implement-lite` is available — listed as `devflow-implement-lite` (organization, personal, or project) or as `<plugin>:devflow-implement-lite` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default; go to the default below.
2. Otherwise, if an external `devflow-implement` is available, do not implement here. Invoke `devflow:implement` with the same arguments so that override is used, and say that the `sonnet` tag was not applied.
3. Otherwise follow this file strictly.

## Default

Implement `$ARGUMENTS`.

This skill is `devflow:implement` on a cheaper model. Read `${CLAUDE_PLUGIN_ROOT}/skills/implement/SKILL.md` and follow every instruction in it except its `External override` section, which the steps above already resolved. That file is the single source of truth for how a plan is implemented.

One more rule applies here. The plan was tagged `sonnet` because it looked routine. If it is not, stop edits at a safe boundary and report it instead of pushing through. Stop when the work needs any of these:

- A design judgment the plan does not already settle
- Changes across module boundaries or to shared state that the plan did not list
- Concurrency, data migration, or security-sensitive logic

Report what you found and which edits already exist, then hand the same plan to `devflow:develop` to continue with `devflow:implement`. This changes the model, not the scope, so it needs no new plan-set approval. If the scope itself has to grow, return to `devflow:tradeoff` as `devflow:implement` requires.
