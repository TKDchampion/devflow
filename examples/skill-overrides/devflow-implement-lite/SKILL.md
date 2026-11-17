---
name: devflow-implement-lite
description: Organization override for routine devflow plans. Applies the same rules as devflow-implement while keeping the plan on the cheaper model.
---

# devflow-implement-lite（範例：讓 sonnet 計畫沿用 devflow-implement 的規範）

把這個資料夾複製到 `~/.claude/skills/devflow-implement-lite/`（個人）或 `<repo>/.claude/skills/devflow-implement-lite/`（專案）。

只有 `devflow-implement`、沒有這份 skill 時，devflow 會讓所有計畫都走 `devflow:implement`，標記為 `實作模型：sonnet` 的計畫也會跑在較貴的模型上。加上這份之後，`sonnet` 計畫會留在較便宜的模型，並沿用同一套規範。

1. 用相同參數呼叫 `devflow-implement`，照它的規範實作。
2. 它要求交回 `devflow:implement` 的地方，一律改成交回 `devflow:implement-lite`。交回 `devflow:implement` 會把模型切回較貴的那個。
3. `devflow:implement-lite` 的停止規則仍然適用：計畫需要未定的設計判斷、未列出的跨模組修改，或涉及併發、資料遷移、安全邏輯時，停下來回報，由 `devflow:develop` 改用 `devflow:implement` 繼續。

這份 skill 不要設定 `model`，否則會蓋掉 `devflow:implement-lite` 選定的模型。
