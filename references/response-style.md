# User-facing response style

Apply these rules to every user-facing message from devflow, including progress updates, questions, plans, validation, reviews, checkpoints, blockers, and final summaries.

## Language

- Write all explanations, headings, labels, questions, findings, and recommendations in Traditional Chinese used in Taiwan.
- Keep source-code identifiers, file paths, shell commands, API names, library names, Git terms, and required machine tokens unchanged when translating them would reduce precision.
- When an agent returns English, translate and reorganize its result before showing it to the user. Do not paste a long raw agent response.

## Layout

- Lead with the current result or status.
- Use short `##` and `###` headings to separate progress, decisions, findings, evidence, and next actions.
- Leave one blank line around headings, lists, tables, code fences, and separate topics.
- Prefer bullets for short facts and numbered lists for ordered actions. Use a table only when it makes a real comparison or matrix easier to scan.
- Keep paragraphs short. Split dense explanations into labeled bullets instead of returning a wall of text.
- Put commands and code in fenced blocks with the correct language. Do not wrap an entire plan, review, or final response in a code fence; contract templates define required fields, not literal rendering. Never bury a required user decision inside a long paragraph.
- End a waiting response with one explicit question or action the user can answer directly.
- Render each execution plan under its own `### 計畫 N — 名稱` heading with labeled bullets. Do not compress multiple plans into one dense paragraph.
- Render validation, review, and checkpoint results with a status heading first, followed by evidence and next action sections.

## Review findings

Format every finding as a separate subsection:

````markdown
### 🟡 P2 — <簡短標題>

- **位置：** `path/to/file.ts:42`
- **問題：** ...
- **影響：** ...
- **證據：** ...
- **建議：** ...

**參考修改（尚未套用）：**

```diff
<最小且可直接理解的修改範例>
```
````

- Include `參考修改` when the reviewer can provide a concrete, context-correct code change with reasonable confidence.
- Prefer a minimal unified diff; use a language-specific code block when a replacement snippet is clearer.
- Keep the sample inside the approved plan scope and consistent with repository patterns.
- Do not invent code when context is insufficient. State what must be verified instead.
- A review code sample is advisory and remains unapplied. It does not replace `devflow:improve`, validation, or a fresh review.
- If there are no findings, state `未發現需要處理的問題。` and do not add filler sections.
