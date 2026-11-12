---
name: commit
description: Draft commit messages or create exactly one Git commit from already staged changes. devflow:plan and devflow:checkpoint call it with `propose` to draft or check messages, devflow:checkpoint calls it with `apply` only after an explicit user commit confirmation, and the user may invoke /devflow:commit directly.
argument-hint: propose|apply <plans or staged diff, draft message, patch identity, confirmation evidence>
---

# Commit

## External override

If an external skill named `devflow-commit` is available — listed as `devflow-commit` (organization, personal, or project) or as `<plugin>:devflow-commit` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the mode contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Read `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

The first word of `$ARGUMENTS` selects the mode: `propose` or `apply`. Without either, run the standalone flow.

## Default commit-message convention

- Follow the language and format of the repository's recent `git log`.
- Without a clear convention: an imperative subject of at most 72 characters that describes only the current plan.
- Add a body after a blank line only when the reason needs explaining.
- Never describe more than one plan in one commit message.

## propose

Change nothing. For each plan or staged diff supplied, return the commit message that satisfies the convention. If a supplied draft already complies, return it unchanged. Ask for any value the convention needs but the repository cannot supply, such as a ticket key; never invent it.

## apply

1. Require the confirmed commit message, the reviewed base-commit and index-tree OIDs, and the user's explicit commit-confirmation evidence. If any is missing, stop with `[!] 阻塞`.
2. Re-run `git rev-parse HEAD` and `git write-tree`. If either differs from the reviewed identity, do not commit; return to `devflow:checkpoint` for a fresh review.
3. Write the confirmed message to a temporary file and run `git commit -F <file>`, committing only the staged index.
4. Never run `git add`, `git commit -a`, `--amend`, `--no-verify`, or push.
5. If the command or a hook fails, show the exact output and stop. Do not retry another way.
6. Return the commit hash, subject, and parent. `devflow:checkpoint` verifies the commit against the reviewed identity.

## Standalone

When the user invokes `/devflow:commit` without a mode:

1. Inspect the staged file list, stat, and patch. If nothing is staged, say so and stop. Do not stage anything.
2. Run `propose` for the staged diff.
3. Show the staged files, the message, and `git write-tree` as the staged-tree identity, then stop for the user's explicit confirmation.
4. On confirmation, re-run `git write-tree`. If it changed, show the new staged diff and ask again.
5. Run `apply` steps 3–5, then report the commit hash and subject.
