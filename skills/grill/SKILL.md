---
name: grill
description: Clarify materially ambiguous or high-risk software requirements before architecture and solution selection. Use when unknowns affect scope, security, data behavior, compatibility, failure handling, rollout, or acceptance criteria; do not use for trivial preferences.
argument-hint: <task and known unknowns>
allowed-tools: Read, Grep, Glob
---

# Grill

Clarify `$ARGUMENTS` without modifying code or proposing a preferred implementation.

Read `${CLAUDE_PLUGIN_ROOT}/references/response-style.md` before producing user-facing output.

1. Inspect the repository for answers before asking the user.
2. Identify assumptions that could change behavior, scope, risk, architecture, migration, compatibility, or acceptance criteria.
3. Ask at most three tightly related questions per turn. Offer concrete choices when they make the decision easier, but do not force a false binary.
4. Explain briefly why each answer matters. Do not ask about facts that can be discovered safely from the repository.
5. While any answer is pending, end with a clearly formatted `待確認問題` section and one direct reply instruction. Do not emit `已釐清需求` or imply clarification is complete.
6. Stop after the questions and wait. Continue until no blocking unknown remains.
7. Only after all blocking questions are answered, finish with the `已釐清需求` contract from `${CLAUDE_PLUGIN_ROOT}/references/gate-contracts.md`; its `待確認問題` value must be `無`.

Grill answers what must be built. Leave how to build it to the architecture and tradeoff gates.
