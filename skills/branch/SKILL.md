---
name: branch
description: Propose or create the working branch for a devflow task. devflow:plan calls it with `propose` to fill the plan set's 分支 field, devflow:develop calls it with `apply` after plan-set approval, and the user may invoke /devflow:branch directly.
argument-hint: propose|apply <task and ticket, or the approved branch action>
---

# Branch

## External override

If an external skill named `devflow-branch` is available — listed as `devflow-branch` (organization, personal, or project) or as `<plugin>:devflow-branch` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the mode contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Read `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

The first word of `$ARGUMENTS` selects the mode: `propose` or `apply`. Without either, run the standalone flow.

## Default branching convention

- Stay on the current branch; do not create or switch branches.
- If `HEAD` is detached, ask the user which branch to use instead of creating one.

## propose

Change nothing. Inspect `git branch --show-current` and `git status --porcelain`, then return:

- `分支動作`: `沿用 <current branch>` or `建立 <name>，base <ref>`
- Any value the convention needs but the repository cannot supply, such as a ticket key, as a question for the user. Never invent it.

## apply

1. Confirm the plan set is explicitly approved and take the branch action from its `分支` field. Use exactly the approved branch name and base.
2. To keep the current branch, confirm `git branch --show-current` matches it. If it differs or `HEAD` is detached, stop with `[!] 阻塞`.
3. To create a branch, inspect `git status --porcelain`, then run `git switch -c <name> <base>`.
4. Stop with `[!] 阻塞` and show the exact command output when the branch already exists, the base is missing, switching would require stashing, discarding, or overwriting local changes, or the command fails. Do not retry another way.
5. Never stash, reset, delete or force-update a branch, or push.
6. Return `分支結果`: the branch, its base, the new `HEAD`, and whether it was created or kept.

## Standalone

When the user invokes `/devflow:branch` without a mode, run `propose`, show the result, and stop for the user's explicit confirmation of the exact name and base. On confirmation, run `apply` steps 3–6.
