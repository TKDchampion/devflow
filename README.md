# Devflow

**English** | [繁體中文](./README_TW.md)

`devflow` is a risk-driven development workflow for Claude Code. It keeps the current progress visible, splits the work into plans that can be validated, reviewed, and committed independently after the solution has been discussed, and starts implementing only once you have approved the complete plan set.

The most important rule: both the solution choice and the plan approval require an explicit reply from you. After approval, exactly one plan is executed at a time. Every plan must pass validation, be checked against the actual staged diff, produce a red/yellow/green review signal, and get one more human confirmation from you before it is committed.

## Table of contents

- [What you get](#what-you-get)
- [Requirements and compatibility](#requirements-and-compatibility)
- [Quick start](#quick-start)
- [Everyday usage](#everyday-usage)
- [Response language and layout](#response-language-and-layout)
- [Full workflow](#full-workflow)
- [Risk levels](#risk-levels)
- [The solution decision gate](#the-solution-decision-gate)
- [Skills reference](#skills-reference)
- [Reviewer agents reference](#reviewer-agents-reference)
- [Auto-format hook](#auto-format-hook)
- [Worked examples](#worked-examples)
- [Override steps with external skills](#override-steps-with-external-skills)
- [Customization](#customization)
- [Validation and troubleshooting](#validation-and-troubleshooting)
- [Official documentation](#official-documentation)

## What you get

This plugin ships:

- 1 orchestrator skill: `develop`
- 15 quality-gate skills that can also be used on their own, reusable `branch`, `commit`, and `review-routing` skills, and `overrides` to inspect which steps are overridden
- A yield rule in every skill: an external skill named `devflow-<skill>` takes over that step; otherwise the plugin's skill is followed strictly
- 5 standalone reviewer agents
- LOW / MEDIUM / HIGH risk routing
- A Solution / Trade-off / User Decision checkpoint
- Visible workflow and plan progress
- User-facing responses in Traditional Chinese (Taiwan) with structured Markdown layout — see [Response language and layout](#response-language-and-layout) if you want English output
- Multi-step execution plans with a single plan-set approval
- Deterministic validation rules for lint, typecheck, tests, and build
- Runtime verification rules
- Independent correctness, security, performance, and test-coverage reviews
- A Review → Improve → Revalidate correction loop
- 🟢 / 🟡 / 🔴 staged-diff review with a commit gate per plan
- No plan is ever committed automatically, whatever its signal; even a committable patch still needs human confirmation
- Review findings include a minimal, directly usable diff or code sample whenever there is enough code context
- A hook that formats files with the project's existing formatter after every edit

## Requirements and compatibility

Baseline requirements:

- Claude Code installed and logged in
- `--plugin-dir` works out of the box when loading from a directory
- Claude Code 2.1.128 or newer when loading from a ZIP
- `node` reachable on `PATH` if you want the auto-format hook

This package has been verified with `claude plugin validate` on Claude Code 2.1.198.

## Quick start

### Option 1: load from a directory

If you are developing or testing devflow, switch to the project you want to work on and load the plugin by absolute path:

```bash
cd /path/to/your-project
claude --plugin-dir /absolute/path/to/devflow
```

### Option 2: load from a ZIP

```bash
cd /path/to/your-project
claude --plugin-dir /absolute/path/to/devflow.zip
```

`--plugin-dir` loads the plugin for the current Claude Code session only. It does not install anything permanently and does not modify the target project's `.claude/settings.json`.

### Option 3: install persistently for a project or for yourself

Claude Code has no `claude plugin add <path>` or `--global` syntax. For non-throwaway usage, add a local marketplace first, then install the plugin from it.

Just for you, in the current project:

```bash
cd /path/to/your-project
claude plugin marketplace add /absolute/path/to/devflow --scope local
claude plugin install devflow@devflow-local --scope local
```

To record the marketplace and the plugin in the project's `.claude/settings.json`:

```bash
claude plugin marketplace add /absolute/path/to/devflow --scope project
claude plugin install devflow@devflow-local --scope project
```

A local absolute path may not exist on a collaborator's machine. If you want to share the project-scope configuration with your team, point the marketplace at a Git URL everyone can reach instead.

For all of your own projects:

```bash
claude plugin marketplace add /absolute/path/to/devflow --scope user
claude plugin install devflow@devflow-local --scope user
```

`user` is the default scope, so `--scope user` can be omitted.

Once loaded, run:

```text
/devflow:develop Add conversation caching using Redis
```

Plugin skills are always namespaced, so `/develop` alone will not work — the full name is `/devflow:develop`.

## Everyday usage

Day to day there is only one entry point to remember:

```text
/devflow:develop <your development request>
```

For example:

```text
/devflow:develop Add an archive action to the conversation menu
```

`develop` then works through the following steps:

1. Show `工作流程進度` (workflow progress), understand the request, and classify it as LOW, MEDIUM, or HIGH.
2. Run Grill, Architecture, and Trade-off as needed.
3. Stop and wait for your decision if there is a meaningful technical choice.
4. Split the chosen solution into plans that can each be committed independently.
5. Show the complete `執行計畫組` (execution plan set) and wait for a single approval.
6. Implement one plan at a time, running validation and any required runtime verification.
7. Safely stage that plan's changes so correctness and any required specialist reviewers all inspect the same `git diff --cached --binary --full-index`.
8. Show the diff summary, the findings, and a red/yellow/green commit signal.
9. Both 🟢 green and 🟡 yellow stop at a `Commit 確認` (commit confirmation) prompt; 🔴 red must be fixed and then re-validated and re-reviewed.
10. On green, reply with a confirmation such as `確認 commit`; on yellow, either accept the residual risk and confirm (`接受風險並確認 commit`), ask for a finding to be fixed, or cancel. An equivalent, unambiguous reply in English works too.
11. Run `git commit` only after confirming the patch identity has not changed, record the hash, then move on to the next plan.
12. Once all plans are done, run the final Finish gate.

If you only want a single gate, you can call the corresponding skill directly. For example:

```text
/devflow:tradeoff Compare Redis List and Redis Hash for message history
/devflow:validate Validate the current authentication changes
/devflow:review Review the staged diff for the active approved plan
/devflow:security-review Review the RBAC changes
```

## Response language and layout

By default, devflow writes its progress, questions, solutions, plans, validation results, reviews, checkpoints, and completion summaries in Traditional Chinese as used in Taiwan. Code identifiers, file paths, shell commands, API names, and necessary technical terms are kept as-is so nothing is lost in translation.

**To get English output instead,** edit the Language section of `references/response-style.md` and replace "Traditional Chinese used in Taiwan" with the language you want. All skills and agents read their response style from that one file. You can also simply ask in-session ("reply in English"), but editing the reference file is what makes it stick across sessions.

Independently of language, responses follow these layout rules so they stay easy to scan:

- Lead with the current result or status.
- Use short headings to separate progress, evidence, findings, and next actions.
- Keep a blank line around headings, lists, tables, and code blocks.
- Give each plan and each finding its own section instead of packing everything into one long paragraph.
- When waiting on you, end with exactly one explicit question or directly answerable action.
- When a reviewer has a concrete fix in mind, include a minimal code/diff sample labeled `參考修改（尚未套用）` ("reference change, not yet applied").

## Full workflow

```text
User Request
    ↓
Analyze / Understand
    ↓
Risk + Complexity + Ambiguity
    ├── LOW ───────────────────────────────┐
    ├── MEDIUM ── Trade-off if meaningful ┤
    └── HIGH ── Grill → Architecture ─────┤
                                          ↓
                           Meaningful decision?
                               ├── No ──────────┐
                               └── Yes          │
                                    ↓           │
                              2–3 Solutions     │
                              + Trade-offs      │
                                    ↓           │
                           ★ USER DECISION ★    │
                                    └─────┬─────┘
                                          ↓
                           Execution Plan Set
                                          ↓
                            ★ PLAN APPROVAL ★
                                          ↓
                       ┌── Repeat one plan at a time ──┐
                       │          Implement           │
                       │              ↓               │
                       │  lint / typecheck / tests     │
                       │              ↓               │
                       │   Runtime Verify if needed   │
                       │              ↓               │
                       │  Stage exact plan-only diff  │
                       │              ↓               │
                       │ Independent + specialist     │
                       │          diff review          │
                       │              ↓               │
                       │     🔴 / 🟡 / 🟢 signal        │
                       │  🔴 → fix and review again   │
                       │  🟡 / 🟢 → user confirmation │
                       │                 ↓             │
                       │              commit          │
                       └──────────────┬─────────────┘
                                          ↓
                              More plans? ── Yes ↺
                                          │ No
                                          ↓
                                        Finish
```

Review and Verify are not the same thing:

- Review asks: "Is this code correct, robust, and maintainable?"
- Verify asks: "When the system actually runs, does the behavior the user asked for really hold?"

## Risk levels

### LOW

For changes with a clear requirement, small scope, easy rollback, and one obvious way to do it.

Typical examples:

- Copy or styling changes
- Adding a simple field
- Small CRUD work following a known pattern
- A small, well-scoped bug

Typical flow:

```text
Analyze → Plan Set → User Approval
→ Implement → Validate → Diff Review
→ User Commit Confirmation → Commit → Finish
```

A LOW task will not invent three solutions just for the sake of form. If the task cannot be split naturally, one plan is fine — but the plan approval and commit gate still apply.

### MEDIUM

For work that spans several files or front-end/back-end layers, changes state or API behavior, adds a dependency, or has more than one reasonable implementation.

Typical flow:

```text
Analyze → Trade-off → User Decision → Execution Plan Set
→ Plan Approval
→ [Implement → Validate → Verify → Review → User Commit Confirmation → Commit]×N
→ Finish
```

### HIGH

The following are usually treated as HIGH outright:

- Authentication, authorization, permissions
- Payments, billing, financial calculations
- Database migrations or destructive operations
- Security boundaries, cryptography, untrusted input
- Cross-service protocols, queues, distributed coordination
- Concurrency correctness
- Public API compatibility
- Large refactors or architecture changes
- Performance-critical paths
- Requirement ambiguity significant enough to change the architecture

Typical flow:

```text
Analyze → Grill → Architecture → Trade-off → User Decision
→ Execution Plan Set → Plan Approval
→ [Implement → Validate → Verify → Independent + Specialist Reviews
   → User Commit Confirmation → Commit]×N
→ Finish
```

The detailed classification rules live in `references/risk-model.md`.

## The solution decision gate

When Claude determines there is a meaningful implementation decision, it must first print something like:

```text
Decision: Conversation cache structure

A. Redis String
Pros: simple; fast to read a whole conversation
Cons: updating a single message means rewriting the JSON

B. Redis List
Pros: append and range queries are natural
Cons: updating an existing message is awkward

C. Redis Hash
Pros: single-item lookup/update is easy
Cons: ordering needs extra handling

Recommendation: B
Status: waiting for user
```

At this point Claude must stop and must not start writing code. You can simply reply:

```text
B
```

Or:

```text
Go with B, but cap it at 500 retained messages.
```

Once the solution is chosen, Claude shows the full set of execution plans and waits with a `核准狀態：等待使用者` ("approval status: waiting for user") marker. Only after you approve the plan set does it execute the plans one at a time, in order. **Approving a solution is not approving the plans.**

Reply in the same Claude Code session so the original skill instructions and decision state stay in the conversation context. If you start a new session, run `develop` again and state the already-chosen solution explicitly in your request.

## Skills reference

| Skill | Purpose | Modifies code? |
|---|---|---|
| `develop` | Orchestrating router for the whole workflow | Depends on the current gate |
| `analyze` | Understand the request, classify risk, decide which gates are needed | No |
| `grill` | Surface unknowns that would change the requirement, risk, or architecture | No |
| `architecture` | Analyze existing architecture, invariants, blast radius | No |
| `tradeoff` | Compare 2–3 solutions and wait for the user's choice | No |
| `plan` | Split work into independently reviewable/committable plans and wait for approval of the whole set | No |
| `implement` | Implement exactly one approved plan | Yes |
| `validate` | Run lint, typecheck, tests, build | May fix in-scope failures |
| `verify` | Start the system and observe actual behavior | Normally no |
| `review` | Review one plan's staged diff and emit a red/yellow/green signal | No |
| `checkpoint` | Isolate and stage the plan diff, then commit once the review gate passes | Stages / commits |
| `security-review` | Security and attack-path review | No |
| `performance-review` | Performance and scalability review | No |
| `test-review` | Check whether tests really cover the requirement and the risks | No |
| `improve` | Fix valid findings and re-validate | Yes |
| `finish` | Confirm each plan's review signal, commit, and final state | No |
| `branch` | Propose or create the working branch (default: stay on the current branch) | Creates / switches branches |
| `commit` | Draft commit messages; after human confirmation, commit the staged changes | Commits |
| `review-routing` | Decide which specialist reviews run for each plan | No |
| `overrides` | Show which steps are replaced by external `devflow-*` skills | No |

The full invocation format is:

```text
/devflow:<skill-name> <arguments>
```

## Reviewer agents reference

| Agent | Responsible for |
|---|---|
| `architecture-reviewer` | Architecture, invariants, dependencies, blast radius |
| `code-reviewer` | Correctness, regressions, compatibility, maintainability |
| `security-reviewer` | Trust boundaries, auth, input, secrets, data exposure |
| `performance-reviewer` | Complexity, queries, allocation, caching, contention, scale |
| `test-reviewer` | Tests matching acceptance criteria, failure paths, test quality |

All reviewer agents are designed to be read-only. They cannot use Write, Edit, or NotebookEdit; reviewers that need Git information may only run read-only inspection through Bash.

Run `/agents` in Claude Code to confirm these agents are loaded.

Correctness review prefers Claude Code's built-in `/code-review`. Security review prefers the built-in `/security-review` when the repository's remote/base conditions make it applicable. If a built-in is unavailable or not applicable, the workflow falls back to the plugin's own reviewer agent.

Every plan's correctness review must inspect the actual `git diff --cached --binary --full-index`. The workflow pins the patch identity using the base commit and the staged index tree, then emits one commit signal:

- 🟢 **Green**: no actionable findings and all required verification passed. It still stops for your confirmation of that exact diff before committing.
- 🟡 **Yellow**: no P0/P1, but P2/P3 findings, evidence gaps, or residual risk remain. You choose to fix them, or explicitly accept the risk and confirm the commit.
- 🔴 **Red**: P0/P1 present, required verification failed, the requirement is not met, or the diff cannot be safely reviewed. Committing is forbidden; after a fix it must be reviewed again.

Each finding gets its own section showing at minimum location, problem, impact, evidence, and recommendation. When the reviewer has enough code context, it also appends:

```text
參考修改（尚未套用）
```

("reference change, not yet applied"), followed by a minimal unified diff or a code block in the relevant language. It is a directly usable suggestion only — it is never auto-applied during review. If you decide to take it, it still goes through Improve, Validation, and a fresh Review.

Any edit or staging change after a review invalidates the previous signal.

Plan-set approval only approves the implementation scope and the intended commit messages — it is not commit authorization. Every plan needs its own separate human `Commit 確認` after its review. If your Claude Code permission mode still requires approval for `git commit`, the CLI may additionally show a tool permission prompt.

## Auto-format hook

`hooks/hooks.json` configures one `PostToolUse` hook. Every time Claude successfully uses `Edit` or `Write`, it runs `scripts/format-after-edit.mjs`.

Supported behavior:

| File type | Formatter condition |
|---|---|
| JS, TS, JSON, CSS, HTML, Vue, Svelte, Markdown, YAML, GraphQL | A local `prettier` installed in the project or the nearest ancestor |
| Python | `ruff` installed in the project's `.venv` or `venv` |
| Go | `gofmt` found on `PATH` |
| Rust | `rustfmt` found on `PATH` |

Safety limits:

- Only files inside `CLAUDE_PROJECT_DIR` are processed.
- It never downloads a formatter.
- It never installs dependencies automatically.
- It skips silently when no formatter is found.
- If a formatter fails, the error is added to Claude's context so the workflow can handle it.

If you do not want auto-formatting, remove the `PostToolUse` entry from `hooks/hooks.json` and then run this in Claude Code:

```text
/reload-plugins
```

## Worked examples

### Example 1: LOW — a small UI change

```text
/devflow:develop Change the primary button label from "Save" to "Create"
```

Expected:

- Classified as LOW
- No Grill
- No manufactured trade-off
- Produces one indivisible plan and waits for approval
- Makes the change, runs the relevant checks, reviews the staged diff, and on 🟢 waits for human confirmation before committing

### Example 2: MEDIUM — conversation cache

```text
/devflow:develop Add Redis caching for conversation history
```

Expected:

1. Analyze read/write patterns, TTL, consistency, and existing infrastructure.
2. Compare viable options such as String, List, and Hash.
3. Recommend one and emit `WAITING_FOR_USER`.
4. Split into multiple execution plans once you choose.
5. Wait for your approval of the complete plan set.
6. Implement each plan in order — test, verify, review the staged diff — and wait for your confirmation before committing each one.

### Example 3: HIGH — RBAC

```text
/devflow:develop Add organization-level roles and project permissions
```

Expected:

- Grill first on permission inheritance, default deny, tenant boundaries, and migration rules
- Analyze the existing authentication/authorization architecture
- Compare schema and enforcement options
- Wait for your choice
- Build a multi-step plan set covering migration, enforcement, rollback, and security tests, then wait for approval
- After each plan, run runtime, code, security, and test review, and only move on once you have manually confirmed the commit

### Example 4: a standalone code review

Stage exactly the changes you want reviewed, make sure nothing unrelated is included, then run:

```text
/devflow:review Review the staged diff for the approved task: prevent duplicate payments
```

Findings use these severities:

- P0: could cause immediate data loss, a security incident, or a systemic outage
- P1: a correctness/security/reliability failure very likely to occur in normal use
- P2: a real but narrower defect, or a significant test gap
- P3: non-blocking cleanup or clarity improvement

These map back to a 🟢 green, 🟡 yellow, or 🔴 red signal. Running `/devflow:review` on its own only produces the review and the commit gate — it will not modify code or commit by itself, though it may attach a not-yet-applied code/diff sample when the fix is clear.


## Override steps with external skills

Every devflow step is a skill, and every skill follows a **yield rule**: if an external skill with the matching name exists, it is used instead; otherwise the plugin's procedure is followed strictly. Organization or personal conventions need no plugin edits and no separate rule files; write them as a skill.

### Naming

The external skill that replaces `devflow:<skill>` must be named `devflow-<skill>`:

| Step | External skill name | Default |
|---|---|---|
| Branching | `devflow-branch` | Stay on the current branch |
| Commit and commit message | `devflow-commit` | Follow the repository's convention; `git commit -F` |
| Specialist review selection | `devflow-review-routing` | Security, performance, or test review chosen from risk and diff |
| Any other step | `devflow-<skill>`, for example `devflow-review` | That skill's built-in procedure |

Generic skills such as `commit`, `review`, or `plan` never replace a devflow step; only a deliberately named `devflow-*` skill does.

### Where to put it

| Scope | Location |
|---|---|
| Personal (all projects) | `~/.claude/skills/devflow-<skill>/SKILL.md` |
| Project (committed, shared with the team) | `<repo>/.claude/skills/devflow-<skill>/SKILL.md` |
| Organization | A skill with the same name from an organization plugin or managed settings |

A new or edited skill is picked up in a new session.

### Three ways to write one

- **Replace**: write your own procedure in the skill.
- **Extend**: run your own checks, then invoke `devflow:<skill>` with the same arguments for the default procedure. devflow does not yield again when its own override calls it, so there is no loop.
- **One project only**: make it a personal skill that first checks `git remote get-url origin` and hands back to `devflow:<skill>` for any other repository. The repository stays untouched and every worktree sees it.

`branch` and `commit` are called in two modes, `propose` (draft only, change nothing) and `apply` (run after approval or confirmation). An override must handle both or hand back to the default. What each step must return is in [`references/skill-overrides.md`](references/skill-overrides.md).

Examples are in [`examples/skill-overrides/`](examples/skill-overrides/):

- `devflow-commit`: extends the default to require a ticket in every message
- `devflow-branch`: a personal skill that applies a naming convention to one project only
- `devflow-review-routing`: adds path-based rules on top of the default routing

### Check what is overridden

```text
/devflow:overrides
```

It lists every devflow step with either the default or the external skill that replaces it, plus warnings such as a misspelled name or a missing `SKILL.md`.

### What cannot be overridden

An external skill changes how a step is done, not the gates around it: explicit replies for the solution choice and plan-set approval, independent review of every plan, no commit on 🔴 red, a separate confirmation for every commit with the patch identity checked before and after, and no automatic push, merge, rebase, or deploy. Any part of an override that conflicts with these gates is ignored and reported.

## Customization

### Adjust risk classification

Edit:

```text
references/risk-model.md
```

For example, you can add HIGH-risk triggers specific to your team:

- Changes to audit logs
- Changes to healthcare or financial data
- Changes to a shared design system
- Code paths tied to a particular SLA

### Adjust the overall workflow

Edit:

```text
skills/develop/SKILL.md
```

You can change the required gates, the number of review-loop iterations, or the LOW/MEDIUM/HIGH routing. Keep the solution choice, the plan-set approval, the per-plan staged-diff review, and the human `Commit 確認` that applies to both green and yellow. Yellow must also keep residual-risk acceptance — otherwise the workflow can end up modifying code without approval or committing content no human confirmed.

### Adjust review standards

Edit:

```text
references/review-severity.md
agents/code-reviewer.md
agents/security-reviewer.md
agents/performance-reviewer.md
agents/test-reviewer.md
```

### Adjust the response language

Edit:

```text
references/response-style.md
```

The Language section drives every user-facing message. Change it to English (or any other language) and reload the plugin.

### Reload after updating the plugin

If you are using the directory version, run this in Claude Code:

```text
/reload-plugins
```

If you installed persistently through a local marketplace, update the source and then run the update for the matching scope, and restart Claude Code:

```bash
claude plugin update devflow@devflow-local --scope local
```

If you originally used `project` or `user` scope, replace `local` above with the same scope.

A ZIP does not track its source files. After editing, rebuild the ZIP and restart any session using it.

## Validation and troubleshooting

### Validate the plugin structure

Run this from the plugin's parent directory:

```bash
claude plugin validate ./devflow
```

Expected result:

```text
✔ Validation passed
```

### A skill is not found

Check in order:

1. For a temporary load, confirm Claude Code was started with the right `--plugin-dir`. For a persistent install, run `claude plugin list` and confirm `devflow@devflow-local` is installed and enabled.
2. The path points at the plugin root directory or the complete ZIP, not the `.claude-plugin` subdirectory.
3. The command includes the namespace, e.g. `/devflow:develop`.
4. Run `/reload-plugins`.
5. Run `/help` or `/skills` and search for `devflow`.

### A reviewer agent is not found

Run `/agents` and look for:

```text
devflow:code-reviewer
devflow:security-reviewer
devflow:performance-reviewer
devflow:test-reviewer
devflow:architecture-reviewer
```

Architecture analysis may fall back to a read-only pass in the current context, with the degradation disclosed. Correctness and specialist reviews before a commit are never substituted by the implementer itself. If both the required built-in reviewer and the plugin agent are unavailable, the plan reports 🔴 red / `阻塞` (blocked) and nothing is committed. Run `/reload-plugins` first, then confirm with `/agents` that the reviewers are loaded.

### The hook did not run

1. Run `/hooks` and confirm the plugin's `PostToolUse` hook is loaded.
2. Run `node --version` and confirm `node` is on `PATH`.
3. Confirm `scripts/format-after-edit.mjs` is executable.
4. Confirm the project has the relevant formatter installed.
5. Note: when no formatter is found, the hook skips quietly on purpose.

### Nothing happens after a trade-off

Confirm Claude's previous state was:

```text
狀態：等待使用者
```

("status: waiting for user"). Then answer the option explicitly in the same session, e.g. `B`. If you change the requirement at the same time, Claude may re-run Analyze or Trade-off — that is expected.

### The workflow feels too slow

First check whether the task was misclassified as MEDIUM/HIGH. A LOW task should take the short path. You can also run just the skill you need instead of the full `develop` workflow.

Do not strip out all the quality gates to go faster. Tune `references/risk-model.md` instead so the risk routing fits your codebase.

## Official documentation

- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Claude Code Subagents](https://code.claude.com/docs/en/subagents)
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code Commands](https://code.claude.com/docs/en/commands)
