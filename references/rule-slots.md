# Rule slots

Some workflow actions are rule slots. devflow ships a default for each slot, and an organization, a user, or a repository may extend or replace it without editing the plugin. `scripts/resolve-rules.mjs` merges the layers and prints the effective rules with their sources; skills inject its output instead of reading override files themselves.

## Layers

Lowest to highest priority:

1. Built-in: `${CLAUDE_PLUGIN_ROOT}/rules/<slot>.md`
2. Organization: `$DEVFLOW_ORG_DIR/<slot>.md`
3. User project: `~/.devflow/projects/<name>/<slot>.md`, used when that folder's `project.md` lists the repository's Git remote (`DEVFLOW_HOME` replaces `~/.devflow`)
4. Repository: `<repo>/.devflow/rules/<slot>.md`

An override file's frontmatter sets `mode: extend` (default; appended after lower layers) or `mode: replace` (lower layers are discarded). A slot that no layer overrides uses the built-in default.

## Slots

| Slot | Decides | Applied by |
|---|---|---|
| `branching` | Whether to create or switch a branch, its name, and its base | `plan` fills the plan set's `分支` field; `develop` applies it after plan-set approval; `finish` checks it |
| `review-routing` | Which specialist reviews run for a plan | `checkpoint` |
| `commit-message` | Commit message format and language | `plan` drafts messages; `checkpoint` checks them before `Commit 確認` |

## How to apply the effective rules

- Treat the effective rules as the project's convention for that action. Combine every listed layer in order; a later layer wins where two layers conflict.
- When a rule needs information you do not have, such as a ticket key, ask the user instead of inventing it.
- Show the rule source when it explains a decision, for example `分支：feature/M1-123-order-export（依 repo 專案層 branching 規則）`.
- Report the `規則警告` section to the user when it is present.

## Non-negotiable gates

Rule slots tune their own action only. They never relax:

- Explicit user replies for the solution choice and plan-set approval
- Independent correctness review of every plan's exact staged diff
- The ban on committing a 🔴 紅燈 patch
- A separate explicit user confirmation before every commit
- The ban on automatic push, merge, rebase, force-push, branch deletion, or deploy

If an effective rule conflicts with these gates, ignore the conflicting part, follow the gate, and tell the user which rule was ignored.
