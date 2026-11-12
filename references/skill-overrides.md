# Skill overrides

Every devflow skill yields to an external skill that deliberately takes its place. Without one, the devflow skill is followed strictly. This is the only way to customize devflow without editing the plugin.

## Naming

An external override for `devflow:<name>` must be named `devflow-<name>`. For example, `devflow-commit` replaces `devflow:commit` and `devflow-review-routing` replaces `devflow:review-routing`.

The `devflow-` prefix is deliberate: a generic personal or organization skill such as `commit`, `review`, or `plan` never replaces a devflow skill by accident.

## Where an override can live

| Scope | Location | Listed as |
|---|---|---|
| Organization (managed) | Skills distributed through managed settings | `devflow-<name>` |
| Personal | `~/.claude/skills/devflow-<name>/SKILL.md` | `devflow-<name>` |
| Project | `<repo>/.claude/skills/devflow-<name>/SKILL.md` | `devflow-<name>` |
| Another plugin | `skills/devflow-<name>/SKILL.md` in that plugin | `<plugin>:devflow-<name>` |

Claude Code already resolves managed, personal, and project skills that share a name, so at most one bare `devflow-<name>` is listed. A personal override applies to every project; to limit it to one repository, have it check the repository (for example its Git remote) and hand back to the devflow skill otherwise.

## Precedence

1. A bare `devflow-<name>` skill wins.
2. Otherwise, a single `<plugin>:devflow-<name>` skill from another plugin wins.
3. If several plugins provide `devflow-<name>` and no bare one exists, stop and ask the user which to use.
4. If none exists, follow the devflow skill.

## Delegating back

An override may handle part of the step and then hand back to the devflow skill, for example: "Check the ticket in Jira, then follow `devflow:commit`." When a devflow skill is invoked by its own override, it must not yield again; it follows its own file. This prevents a loop and lets an override extend the default instead of replacing it.

## Contracts an override must honor

An override receives the same arguments as the skill it replaces and must return what the caller expects.

| Override | Called by | Must support |
|---|---|---|
| `devflow-branch` | `plan`, `develop` | `propose <task>`: change nothing; return `分支動作` (`沿用 <branch>` or `建立 <name>，base <ref>`) and any question for the user. `apply <approved action>`: create or confirm exactly the approved branch; return `分支結果`, or `[!] 阻塞` with the exact error. |
| `devflow-commit` | `plan`, `checkpoint` | `propose <plans or staged diff, optional draft>`: change nothing; return the message for each plan. `apply <message, identity, confirmation>`: commit only the staged index with exactly that message; return the hash, subject, and parent, or `[!] 阻塞` with the exact error. |
| `devflow-review-routing` | `checkpoint` | Return `Review 路由`: `執行` or `不執行` with a reason for security, performance, and test review, plus any additional reviewer agent to run. |

For any other skill, the override returns the same contract the devflow skill documents, so the workflow can continue.

## Gates an override cannot remove

An override replaces how a step is done, not the gates around it. The calling skill keeps enforcing:

- Explicit user replies for the solution choice and plan-set approval
- Independent correctness review of every plan's exact staged diff
- The ban on committing a 🔴 紅燈 patch
- A separate explicit user confirmation before every commit, checked against the reviewed patch identity before and after the commit
- The ban on automatic push, merge, rebase, force-push, branch deletion, or deploy

If an override instructs otherwise, ignore that part, follow the gate, and tell the user which instruction was ignored.
