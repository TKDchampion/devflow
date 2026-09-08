# Claude Code tool strategy

Use built-in capabilities when available, and keep these fallbacks so the workflow still works across plans and versions.

| Gate | Preferred capability | Fallback |
|---|---|---|
| Repository exploration | Built-in Explore agent | Read, Grep, and Glob in the current context |
| Runtime verification | Bundled `/verify` or `/run` when the user invokes it | `devflow:verify` with direct local tools |
| Correctness review | Bundled `/code-review` (`/review`) | devflow:code-reviewer agent |
| Security review | Bundled `/security-review` when its git-remote assumptions fit | devflow:security-reviewer agent |
| Performance review | Focused independent reviewer | devflow:performance-reviewer agent |
| Cleanup | Bundled `/simplify` after correctness is settled | `devflow:improve` |

Do not shadow bundled skill names. The plugin namespace keeps the custom gates separate. Do not claim a bundled capability ran unless its result is present in the conversation.
