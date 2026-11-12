---
name: overrides
description: Show which devflow steps are replaced by external devflow-* skills for the current project, where each override comes from, and any naming mistakes. Use when the user asks which overrides devflow is using or why one is not picked up.
allowed-tools: Read, Bash(node ${CLAUDE_PLUGIN_ROOT}/scripts/list-overrides.mjs:*)
---

# Overrides

## External override

If an external skill named `devflow-overrides` is available — listed as `devflow-overrides` (organization, personal, or project) or as `<plugin>:devflow-overrides` from another plugin — invoke it with the same arguments and follow it instead of the rest of this file. Do not yield when that skill itself sent you here to run the default. Otherwise follow this file strictly. Precedence, the contract an override must honor, and the gates that still apply are in `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md`.

Read `${CLAUDE_PLUGIN_ROOT}/references/skill-overrides.md` and `${CLAUDE_PLUGIN_ROOT}/references/response-style.md`.

## Detected personal and project overrides

!`node ${CLAUDE_PLUGIN_ROOT}/scripts/list-overrides.mjs --project "${CLAUDE_PROJECT_DIR}"`

If this section is missing or shows an error, run the same command with Bash.

Present the result in Traditional Chinese without modifying any file:

1. Every devflow skill and whether it uses the default or an override, with the override's source.
2. Add overrides the script cannot see: any skill in your available-skills list named `devflow-<name>` or `<plugin>:devflow-<name>` whose `<name>` is a devflow skill. These come from managed settings or other plugins.
3. Every warning, with the likely fix, such as a misspelled name or a missing `SKILL.md`.
4. If the user expected an override that is not listed, give the locations and naming rule from `skill-overrides.md`, and remind them that a new skill is picked up in a new session.
