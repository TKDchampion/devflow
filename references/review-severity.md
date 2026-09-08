# Review severity

Report only actionable findings introduced or exposed by the target change. Each finding must include a file and line or the narrowest possible location, impact, evidence, and a concrete remediation.

- **P0 — Critical:** Active data loss, security compromise, or system-wide outage. Block completion.
- **P1 — High:** Likely correctness, security, compatibility, or reliability failure in normal use. Block completion.
- **P2 — Medium:** Real defect or meaningful maintainability/test gap with limited blast radius. Fix when safely in scope; otherwise disclose.
- **P3 — Low:** Non-blocking cleanup or clarity improvement. Do not auto-fix unless requested or obviously safe.

Do not report formatting taste, speculative future problems, pre-existing unrelated issues, or claims without a plausible execution path.

Write every user-visible finding in Traditional Chinese and format it as its own subsection with these labels:

- `位置`
- `問題`
- `影響`
- `證據`
- `建議`

When the remediation is concrete and supported by the inspected repository context, also include `參考修改（尚未套用）` with a minimal unified diff or language-specific code block. The example must be directly useful, remain inside the approved plan scope, and preserve surrounding project conventions. Do not invent code when required context is missing; state the missing verification instead. Suggested code is advisory only and must still go through `devflow:improve`, validation, staging, and a fresh review before commit.

## Traffic-light commit signal

Map the complete review evidence to exactly one user-visible signal:

- **🔴 紅燈 — 阻擋：** Any P0/P1 finding, failed required validation, acceptance-criteria mismatch, unsafe or unreviewable diff, or unresolved uncertainty that could hide a material defect. Never commit this patch, even if the user asks to bypass the finding; fix it and review a new patch first.
- **🟡 黃燈 — 等待使用者：** No P0/P1, but at least one confirmed P2/P3, non-critical evidence gap, or disclosed residual risk deserves an explicit accept-or-fix decision. Commit only after the user explicitly accepts the exact residual risk and confirms the exact patch.
- **🟢 綠燈 — 等待使用者：** The exact staged diff was reviewed, required checks pass, no actionable finding remains, and any skipped check has a sound non-material reason. Stop and obtain explicit user confirmation for the exact patch before commit.

The signal is a commit gate, not decoration. No signal permits automatic commit. A later edit or staging change invalidates both the signal and any user confirmation, and requires a new review of the updated staged diff.
