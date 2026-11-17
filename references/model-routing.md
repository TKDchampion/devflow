# Model routing

devflow spends the strongest model on decisions, a strong model on review and hard implementation, and a cheaper model on routine implementation. Models are pinned in skill and agent frontmatter, so nobody switches models by hand. The one decision made at run time is which implementing skill runs each plan.

## Models per stage

| Stage | Skills and agents | Model |
|---|---|---|
| Decisions | `analyze`, `grill`, `architecture`, `tradeoff`, `plan`, and the `architecture-reviewer` agent | `fable` |
| Hard implementation and corrections | `implement`, `improve` | `opus` |
| Routine implementation | `implement-lite` | `sonnet` |
| Independent review | `code-reviewer`, `security-reviewer`, `performance-reviewer`, and `test-reviewer` agents | `opus` |
| Everything else | `develop`, `validate`, `verify`, `checkpoint`, `finish`, `branch`, `commit`, `review-routing`, `overrides`, and the review skills | Not pinned |

A skill's `model` applies until the current turn ends; the session model resumes on the user's next message. A skill that pins no model runs on whichever model is active when it is invoked. So `validate`, `verify`, and `checkpoint` run on the model that implemented the active plan, and anything at the start of a turn runs on the session model. Start the session on Opus.

Reviewer agents run in their own context, so their model does not change the main conversation's model.

A pinned model is skipped without an error, and the active model is kept, when the organization's `availableModels` allowlist excludes it or when auto mode does not support it. If decisions seem to run on the wrong model, check this first.

## Tagging a plan

`devflow:plan` gives every plan an `實作模型` tag of `sonnet` or `opus` with a one-line reason. Judge the plan's own difficulty, not the task's overall risk level: a HIGH task can contain routine plans, and a LOW task can contain one that needs judgment.

- `sonnet`: the plan follows a pattern that already exists in the repository, touches a small and explicitly listed area, and its acceptance criteria leave no design judgment to the implementer. Typical cases are a UI adjustment, adding a field end to end along an existing path, and adding tests for settled behavior.
- `opus`: the plan crosses module boundaries, involves concurrency or shared state, migrates data, touches security-sensitive logic, changes a public contract, or still leaves some judgment to the implementer.

When unsure, tag `opus`. A plan tagged `sonnet` must be specific enough to implement without further design decisions; if it is not, tighten the plan or tag it `opus`.

The tags are part of the plan set the user approves, and the user may change any tag when approving.

## Routing a plan

`devflow:develop` picks the implementing skill from the approved tag:

- `實作模型：opus` → `devflow:implement`
- `實作模型：sonnet` → `devflow:implement-lite`
- A missing or unclear tag, for example from an overriding plan skill that does not emit one → `devflow:implement`

External overrides take priority over the tag. When `devflow-implement` exists without `devflow-implement-lite`, every plan goes to `devflow:implement`. The rule is "The implement-lite fallback" in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

## Escalate, never downgrade

A plan moves from `sonnet` to `opus` in two cases, and never from `opus` to `sonnet` without the user changing the tag:

- `devflow:implement-lite` stops because the plan is harder than its tag. `devflow:develop` continues the same plan with `devflow:implement`. This changes the model, not the scope, so it needs no new plan-set approval.
- The plan receives 🔴 紅燈. `devflow:improve` runs on `opus`, and any re-implementation in that correction cycle uses `devflow:implement`.

Say in the progress update whenever a plan runs on a different skill than its tag selects, and why.

## Tuning

- Lower cost across the board: change `implement` and `improve` to `sonnet`.
- Higher quality across the board: change `implement-lite` to `opus`, or tag every plan `opus` when approving.
- Each model keeps its own prompt cache. Every switch in the main conversation makes the new model read whatever it has not seen yet, so adding a third model to the main conversation costs more than it appears to save.
