---
name: rules
description: Show the effective devflow rule slots (branching, review-routing, commit-message) for the current project, which layer each rule comes from, and any override-file warnings. Use when the user asks which rules devflow is applying or wants to check that an organization, user, or repository override is being picked up.
argument-hint: [slot ...]
allowed-tools: Read, Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/resolve-rules.mjs:*)
---

# Rules

Read `${CLAUDE_PLUGIN_ROOT}/references/rule-slots.md` and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md`.

## Effective rules

!`node ${CLAUDE_PLUGIN_ROOT}/scripts/resolve-rules.mjs --project "${CLAUDE_PROJECT_DIR}"`

If this section is missing or shows an error, run the same command with Bash. If `$ARGUMENTS` names specific slots, show only those.

Present the result in Traditional Chinese without modifying any file:

1. The detected project, Git remote, and which layers were found.
2. For each slot, the rules in effect and their source layer. Say plainly when a slot uses only the built-in default.
3. Every `規則警告` entry, with the likely fix, such as a misspelled filename, a missing `remote` in `project.md`, or a `DEVFLOW_ORG_DIR` that points nowhere.
4. If no override was found and the user expected one, list the four layer paths from `rule-slots.md` so they can check where the file should go.
