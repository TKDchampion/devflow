# Devflow 使用教學

[English](./README.md) | **繁體中文**

`devflow` 是一套給 Claude Code 使用的風險導向開發流程。它會持續顯示目前進度，在方案討論後把工作分成多個可獨立驗證、review 與 commit 的 plans，等你確認完整計畫後才開始實作。

最重要的規則是：方案選擇與計畫核准都必須取得你的明確回覆。核准後一次只執行一個 plan；每個 plan 都必須完成 validation、檢查實際 staged diff、輸出紅黃綠 review，最後再次取得你的人工確認才會 commit。

## 目錄

- [你會得到什麼](#你會得到什麼)
- [需求與相容性](#需求與相容性)
- [快速開始](#快速開始)
- [日常使用方式](#日常使用方式)
- [回覆語言與排版](#回覆語言與排版)
- [完整流程](#完整流程)
- [風險分級](#風險分級)
- [方案決策關卡](#方案決策關卡)
- [Skills 一覽](#skills-一覽)
- [Reviewer Agents 一覽](#reviewer-agents-一覽)
- [自動格式化 Hook](#自動格式化-hook)
- [實際使用範例](#實際使用範例)
- [用外部 Skill 覆蓋步驟](#用外部-skill-覆蓋步驟)
- [如何自訂](#如何自訂)
- [驗證與疑難排解](#驗證與疑難排解)

## 你會得到什麼

這個 plugin 包含：

- 1 個總控 Skill：`develop`
- 15 個可獨立使用的品質關卡 Skills、可單獨重用的 `branch`、`commit` 與 `review-routing`，以及查看覆蓋狀態的 `overrides`
- 每個 Skill 都採退讓原則：有名為 `devflow-<skill>` 的外部 skill 就用外部的，否則嚴格遵循 plugin
- 5 個獨立 reviewer agents
- LOW、MEDIUM、HIGH 三級風險路由
- Solution／Trade-off／User Decision checkpoint
- 可見的 workflow 與 plan 進度
- 所有使用者可見回覆統一使用台灣繁體中文與分段 Markdown 排版
- 多段 execution plan 與一次性 plan-set approval
- lint、typecheck、tests、build 等 deterministic validation 規則
- runtime verification 規則
- correctness、security、performance、test coverage 獨立審查
- Review → Improve → Revalidate 的修正迴圈
- 🟢／🟡／🔴 staged-diff review 與每段 commit gate
- 每個 plan 不論燈號都不會自動 commit；可提交的 patch 仍須人工確認
- Review finding 在有足夠程式脈絡時附上可直接參考的最小 diff 或 code 範例
- 編輯檔案後自動使用既有 formatter 的 Hook

## 需求與相容性

基本需求：

- 已安裝並登入 Claude Code
- 使用資料夾載入時，可直接使用 `--plugin-dir`
- 使用 ZIP 載入時，需要 Claude Code 2.1.128 或更新版本
- 若要啟用自動格式化 Hook，系統需要能從 `PATH` 找到 `node`

本套件已使用 Claude Code 2.1.198 執行 `claude plugin validate` 驗證。

## 快速開始

### 方式一：從資料夾載入

如果正在開發或測試 devflow，切換到你要開發的專案，再用絕對路徑載入 plugin：

```bash
cd /path/to/your-project
claude --plugin-dir /absolute/path/to/devflow
```

### 方式二：從 ZIP 載入

```bash
cd /path/to/your-project
claude --plugin-dir /absolute/path/to/devflow.zip
```

`--plugin-dir` 只會在這次 Claude Code session 載入 plugin，不會永久安裝，也不會修改目標專案的 `.claude/settings.json`。

### 方式三：持久安裝到專案或個人環境

Claude Code 沒有 `claude plugin add <path>` 或 `--global` 語法。非測試用途需先加入本機 marketplace，再安裝 plugin。

只讓自己在目前專案使用：

```bash
cd /path/to/your-project
claude plugin marketplace add /absolute/path/to/devflow --scope local
claude plugin install devflow@devflow-local --scope local
```

要將 marketplace 與 plugin 登記到專案的 `.claude/settings.json`：

```bash
claude plugin marketplace add /absolute/path/to/devflow --scope project
claude plugin install devflow@devflow-local --scope project
```

本機絕對路徑對協作者不一定存在；若要將 project-scope 設定共用給團隊，marketplace 應改用團隊都能取得的 Git URL。

要在個人的所有專案使用：

```bash
claude plugin marketplace add /absolute/path/to/devflow --scope user
claude plugin install devflow@devflow-local --scope user
```

`user` 是預設 scope，可省略 `--scope user`。

載入後可以執行：

```text
/devflow:develop Add conversation caching using Redis
```

Plugin skills 一律包含 namespace，因此不能只輸入 `/develop`；完整名稱是 `/devflow:develop`。

## 日常使用方式

平常只需要記住一個入口：

```text
/devflow:develop <你的開發需求>
```

例如：

```text
/devflow:develop Add an archive action to the conversation menu
```

`develop` 會依序處理：

1. 顯示 `工作流程進度`，理解需求並判斷 LOW、MEDIUM 或 HIGH。
2. 視需要執行 Grill、Architecture 與 Trade-off。
3. 若有重大技術選擇，停下來等待你決定。
4. 將選定方案切成多個可獨立 commit 的 plans。
5. 顯示完整 `執行計畫組`，等你一次確認。
6. 一次只實作一個 plan，執行 validation 與必要的 runtime verification。
7. 將該 plan 的變更安全地 stage，讓 correctness 與必要的 specialist reviewers 審查同一份 `git diff --cached --binary --full-index`。
8. 顯示 diff 摘要、findings 與紅黃綠 commit signal。
9. 🟢 綠燈與 🟡 黃燈都會停下來顯示 `Commit 確認`；🔴 紅燈必須先修正並重新 validation 與 review。
10. 綠燈可回覆「確認 commit」；黃燈則回覆「接受風險並確認 commit」、要求修正 finding，或取消。
11. 確認 patch identity 沒有改變後才執行 `git commit`，記錄 hash，再進入下一個 plan。
12. 所有 plans 完成後，執行最終 Finish gate。

如果只想執行特定關卡，也可以直接呼叫對應 Skill。例如：

```text
/devflow:tradeoff Compare Redis List and Redis Hash for message history
/devflow:validate Validate the current authentication changes
/devflow:review Review the staged diff for the active approved plan
/devflow:security-review Review the RBAC changes
```

## 回覆語言與排版

Devflow 的進度、問題、方案、計畫、驗證、review、checkpoint 與完成摘要都會使用台灣繁體中文。程式碼 identifier、檔案路徑、shell command、API 名稱與必要技術詞彙會保留原文，避免失真。

為了方便掃讀，回覆會遵守以下格式：

- 先顯示目前結果或狀態。
- 使用短標題區分進度、證據、findings 與下一步。
- 標題、清單、表格與 code block 之間保留空行。
- 每個 plan 與 finding 各自分段，不把整份結果塞進單一長段落。
- 等待你決定時，最後只保留一個明確問題或可直接回覆的動作。
- Reviewer 有明確修法時，會附上標示為「參考修改（尚未套用）」的最小 code／diff 範例。

## 完整流程

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

Review 和 Verify 不相同：

- Review 問的是：「這段程式碼是否正確、穩健、可維護？」
- Verify 問的是：「實際把系統跑起來後，使用者需要的行為是否真的成立？」

## 風險分級

### LOW

適合需求清楚、範圍小、容易回復，而且只有一個明顯作法的修改。

常見例子：

- 修改文字或樣式
- 新增簡單欄位
- 已知 pattern 的小型 CRUD
- 範圍明確的小 bug

典型流程：

```text
Analyze → Plan Set → User Approval
→ Implement → Validate → Diff Review
→ User Commit Confirmation → Commit → Finish
```

LOW 任務不會為了形式硬列三個方案；若任務無法自然切分，可以使用一個 plan，但仍需要計畫確認與 commit gate。

### MEDIUM

適合跨越數個檔案或前後端層級、修改 state/API 行為、加入 dependency，或存在多個合理實作方式的功能。

典型流程：

```text
Analyze → Trade-off → User Decision → Execution Plan Set
→ Plan Approval
→ [Implement → Validate → Verify → Review → User Commit Confirmation → Commit]×N
→ Finish
```

### HIGH

下列項目通常直接視為 HIGH：

- Authentication、authorization、permissions
- Payment、billing、金融計算
- Database migration 或 destructive operation
- Security boundary、cryptography、untrusted input
- Cross-service protocol、queue、distributed coordination
- Concurrency correctness
- Public API compatibility
- 大型 refactor 或 architecture change
- Performance-critical path
- 會改變架構的重大需求模糊

典型流程：

```text
Analyze → Grill → Architecture → Trade-off → User Decision
→ Execution Plan Set → Plan Approval
→ [Implement → Validate → Verify → Independent + Specialist Reviews
   → User Commit Confirmation → Commit]×N
→ Finish
```

詳細判斷規則位於 `references/risk-model.md`。

## 方案決策關卡

當 Claude 判斷有 meaningful implementation decision 時，它必須先輸出類似：

```text
Decision: Conversation cache structure

A. Redis String
優點：簡單、讀取完整 conversation 快
缺點：更新單一 message 需要重寫 JSON

B. Redis List
優點：append 與 range query 自然
缺點：更新既有 message 較麻煩

C. Redis Hash
優點：單筆 lookup/update 容易
缺點：ordering 需要額外處理

Recommendation: B
狀態：等待使用者
```

此時 Claude 必須停止，不能開始寫 Code。你可以直接回覆：

```text
B
```

或：

```text
選 B，但請加入最多保留 500 則訊息的限制。
```

方案選定後，Claude 會再顯示整組 execution plans，並以 `核准狀態：等待使用者` 等待確認。回覆「確認計畫」後，才會按順序一次執行一個 plan。對方案的確認不等於對計畫的確認。

請在同一個 Claude Code session 回覆，讓原本的 Skill instructions 和 decision state 保留在 conversation context。如果重新開啟 session，請重新執行 `develop`，並在需求中明確寫出已選方案。

## Skills 一覽

| Skill                | 用途                                                  | 是否會修改程式碼          |
| -------------------- | ----------------------------------------------------- | ------------------------- |
| `develop`            | 總控 router，協調完整流程                             | 依目前 gate 決定          |
| `analyze`            | 理解需求、分類風險、決定需要哪些 gates                | 否                        |
| `grill`              | 問出會影響需求、風險或架構的未知條件                  | 否                        |
| `architecture`       | 分析現有架構、invariants、blast radius                | 否                        |
| `tradeoff`           | 比較 2–3 個方案並等待使用者選擇                       | 否                        |
| `plan`               | 切成多個可獨立 review／commit 的 plans 並等待整組核准 | 否                        |
| `implement`          | 一次只實作一個已核准 plan                             | 是                        |
| `validate`           | 執行 lint、typecheck、tests、build                    | 可能修正 in-scope failure |
| `verify`             | 啟動系統並觀察實際行為                                | 原則上否                  |
| `review`             | 審查單一 plan 的 staged diff 並輸出紅黃綠 signal      | 否                        |
| `checkpoint`         | 隔離並 stage plan diff，通過 review gate 後 commit    | Stage／commit             |
| `security-review`    | 安全性與 attack path 審查                             | 否                        |
| `performance-review` | 效能與 scalability 審查                               | 否                        |
| `test-review`        | 驗證測試是否真正覆蓋需求與風險                        | 否                        |
| `improve`            | 修正成立的 findings 並重新驗證                        | 是                        |
| `finish`             | 確認每個 plan 的 review signal、commit 與最終狀態     | 否                        |
| `branch`             | 提議或建立工作分支（預設留在目前分支）                | 切換／建立分支            |
| `commit`             | 草擬 commit message；人工確認後提交已 staged 變更     | Commit                    |
| `review-routing`     | 決定每個 plan 要加跑哪些 specialist review            | 否                        |
| `overrides`          | 顯示哪些步驟被外部 `devflow-*` skill 覆蓋             | 否                        |

完整呼叫格式是：

```text
/devflow:<skill-name> <arguments>
```

## Reviewer Agents 一覽

| Agent                   | 專責內容                                                  |
| ----------------------- | --------------------------------------------------------- |
| `architecture-reviewer` | 架構、invariants、dependency、blast radius                |
| `code-reviewer`         | correctness、regression、compatibility、maintainability   |
| `security-reviewer`     | trust boundary、auth、input、secrets、data exposure       |
| `performance-reviewer`  | complexity、query、allocation、cache、contention、scale   |
| `test-reviewer`         | acceptance criteria 對應測試、failure paths、test quality |

Reviewer agents 都被設計成 read-only。它們不能使用 Write、Edit 或 NotebookEdit；需要 Git 資訊的 reviewer 只能透過 Bash 執行 read-only inspection。

可以在 Claude Code 輸入 `/agents`，確認這些 agents 是否已被載入。

Correctness review 會優先使用 Claude Code 內建 `/code-review`。Security review 在 repository remote/base 條件適合時會優先使用內建 `/security-review`。若內建功能不存在或不適用，流程會使用 plugin 內的 reviewer agent。

每個 plan 的 correctness review 都必須查看實際 `git diff --cached --binary --full-index`；流程會用 base commit 與 staged index tree 固定 patch identity，再輸出一個 commit signal：

- 🟢 **綠燈**：沒有 actionable finding 且必要驗證已通過；仍會停下來等你確認該份 diff 才 commit。
- 🟡 **黃燈**：沒有 P0／P1，但仍有 P2／P3、證據缺口或 residual risk；等你選擇修正，或明確接受風險並確認 commit。
- 🔴 **紅燈**：有 P0／P1、必要驗證失敗、需求不符或 diff 無法安全審查；禁止 commit，修正後必須重新 review。

每個 finding 會獨立分段，至少顯示位置、問題、影響、證據與建議。若 reviewer 已取得足夠程式脈絡，還會附上：

```text
參考修改（尚未套用）
```

下方會提供最小 unified diff 或對應語言的 code block。這只是可直接參考的改法，不會在 review 階段自動套用；若決定修正，仍會經過 Improve、Validation 與新一輪 Review。

任何在 review 後發生的 edit 或 staging 變化都會使原本 signal 失效。

Plan-set approval 只核准實作範圍與預計使用的 commit message，不等於 commit 授權。每個 plan review 完成後，都必須另外取得一次人工 `Commit 確認`；若 Claude Code 的 permission mode 仍要求核准 `git commit`，CLI 可能還會再顯示工具權限提示。

## 自動格式化 Hook

`hooks/hooks.json` 設定了一個 `PostToolUse` hook。Claude 每次成功使用 `Edit` 或 `Write` 後，會執行 `scripts/format-after-edit.mjs`。

支援行為：

| 檔案類型                                                      | Formatter 條件                            |
| ------------------------------------------------------------- | ----------------------------------------- |
| JS、TS、JSON、CSS、HTML、Vue、Svelte、Markdown、YAML、GraphQL | 專案或最近 ancestor 已安裝本地 `prettier` |
| Python                                                        | 專案 `.venv` 或 `venv` 已安裝 `ruff`      |
| Go                                                            | `PATH` 找得到 `gofmt`                     |
| Rust                                                          | `PATH` 找得到 `rustfmt`                   |

安全限制：

- 只處理 `CLAUDE_PROJECT_DIR` 內的檔案。
- 不會下載 formatter。
- 不會自動安裝 dependency。
- 找不到 formatter 時直接跳過。
- formatter 失敗時把錯誤加入 Claude context，讓流程可以處理。

若不想啟用自動格式化，可以移除 `hooks/hooks.json` 裡的 `PostToolUse` 設定，再於 Claude Code 執行：

```text
/reload-plugins
```

## 實際使用範例

### 範例一：LOW — 小型 UI 修改

```text
/devflow:develop Change the primary button label from "Save" to "Create"
```

預期：

- 判定為 LOW
- 不執行 Grill
- 不製造無意義 trade-off
- 產生一個不可再分的 plan 並等待核准
- 修改、執行相關 checks、審查 staged diff，🟢 後等待人工確認才 commit

### 範例二：MEDIUM — Conversation cache

```text
/devflow:develop Add Redis caching for conversation history
```

預期：

1. 分析 read/write pattern、TTL、consistency 與既有 infrastructure。
2. 比較 String、List、Hash 等可行方案。
3. 推薦一個方案並輸出 `WAITING_FOR_USER`。
4. 等你選定後，切成多個 execution plans。
5. 等你核准完整 plan set。
6. 依序實作每個 plan，測試、verify、review staged diff，每一份都等你確認後才 commit。

### 範例三：HIGH — RBAC

```text
/devflow:develop Add organization-level roles and project permissions
```

預期：

- 先 Grill 權限繼承、default deny、tenant boundary 與 migration 規則
- 分析現有 authentication/authorization architecture
- 比較 schema 與 enforcement 方案
- 等待使用者選擇
- 建立包含 migration、enforcement、rollback、security tests 的多段 plan set 並等待核准
- 每個 plan 實作後執行 runtime、code、security 與 test review，等你人工確認 commit 後才進入下一段

### 範例四：只跑獨立 Code Review

先將要審查的變更明確 stage，並確認不包含無關修改，再執行：

```text
/devflow:review Review the staged diff for the approved task: prevent duplicate payments
```

Findings 會使用下列分級：

- P0：可能造成即時資料遺失、安全事故或系統性 outage
- P1：正常使用下很可能發生的 correctness/security/reliability failure
- P2：影響範圍較小但真實存在的 defect 或重要 test gap
- P3：非阻塞 cleanup 或 clarity improvement

結果會再對應成 🟢 綠燈、🟡 黃燈或 🔴 紅燈。單獨執行 `/devflow:review` 只輸出 review 與 commit gate，不會自行修改或 commit；若有明確修法，可附上尚未套用的 code／diff 範例。


## 用外部 Skill 覆蓋步驟

devflow 的每個步驟都是一個 skill，而且每個 skill 都採**退讓原則**：有同名的外部 skill 就改用外部的，沒有就嚴格照 plugin 內的流程。公司或個人規範不用修改 plugin，也不用另外放規則檔，寫成一個 skill 就好。

### 命名

取代 `devflow:<skill>` 的外部 skill 必須叫 `devflow-<skill>`：

| 想改的步驟 | 外部 skill 名稱 | 預設行為 |
|---|---|---|
| 切分支 | `devflow-branch` | 留在目前分支 |
| Commit 與 commit message | `devflow-commit` | 沿用 repository 既有慣例，`git commit -F` |
| 選擇 specialist review | `devflow-review-routing` | 依風險與 diff 內容選 security／performance／test |
| 其他任何步驟 | `devflow-<skill>`，例如 `devflow-review` | 該 skill 的內建流程 |

一般的 `commit`、`review`、`plan` 這類 skill 不會取代 devflow，只有刻意取 `devflow-` 開頭的才會，所以不會被無意間覆蓋。

### 放在哪裡

| 範圍 | 位置 |
|---|---|
| 個人（所有專案） | `~/.claude/skills/devflow-<skill>/SKILL.md` |
| 專案（提交後團隊共用） | `<repo>/.claude/skills/devflow-<skill>/SKILL.md` |
| 公司 | 公司 plugin 或 managed settings 發佈的同名 skill |

新增或修改 skill 後，開新的 session 才會載入。

### 三種寫法

- **完全取代**：在 skill 裡寫自己的做法。
- **延伸預設**：先做自己的檢查或調整，再用相同參數呼叫 `devflow:<skill>` 跑預設流程。devflow 被自己的覆蓋呼叫時不會再退讓，所以不會無限循環。
- **只對單一專案生效**：放在個人 skill，開頭先用 `git remote get-url origin` 判斷專案；不是目標專案就直接交回 `devflow:<skill>`。這樣不用動 repo，所有 worktree 也都讀得到。

`branch` 和 `commit` 會以 `propose`（只草擬，不改任何東西）和 `apply`（核准或確認後才執行）兩種模式被呼叫，覆蓋的 skill 要兩種都處理，或交回預設。各步驟要回傳的內容見 [`references/skill-overrides.md`](references/skill-overrides.md)。

範例在 [`examples/skill-overrides/`](examples/skill-overrides/)：

- `devflow-commit`：延伸預設，強制 commit message 帶票號
- `devflow-branch`：個人 skill，只對單一專案套用分支命名規則
- `devflow-review-routing`：在預設路由上加路徑條件

### 檢查覆蓋狀態

```text
/devflow:overrides
```

會列出每個 devflow 步驟目前用預設還是外部 skill，以及名稱打錯、缺少 `SKILL.md` 等警告。

### 不能覆寫的部分

外部 skill 只能改變步驟的做法，不能拿掉前後的關卡：方案選擇與計畫核准需要你明確回覆、每個 plan 都要獨立 review、🔴 紅燈不能 commit、每次 commit 都要你另外確認且 commit 前後會檢查 patch identity、不會自動 push／merge／rebase／deploy。外部 skill 與這些關卡衝突時，衝突的部分會被忽略並告知你。

## 如何自訂

### 調整風險判斷

編輯：

```text
references/risk-model.md
```

例如可以加入團隊專屬 HIGH risk trigger：

- 修改 audit log
- 修改 healthcare 或 financial data
- 變更 shared design system
- 影響特定 SLA 的 code path

### 調整總流程

編輯：

```text
skills/develop/SKILL.md
```

可以修改 required gates、review loop 次數或 LOW/MEDIUM/HIGH 路由。請保留方案選擇、plan-set approval、每個 plan 的 staged-diff review，以及綠燈／黃燈都適用的人工 `Commit 確認`。黃燈還必須保留 residual-risk acceptance，否則流程可能在未核准時修改程式或提交未經人工確認的內容。

### 調整 Review 標準

編輯：

```text
references/review-severity.md
agents/code-reviewer.md
agents/security-reviewer.md
agents/performance-reviewer.md
agents/test-reviewer.md
```

### 更新 plugin 後重新載入

如果正在使用資料夾版本，可以在 Claude Code 輸入：

```text
/reload-plugins
```

如果是透過本機 marketplace 持久安裝，更新來源後執行對應 scope 的 update，並重新啟動 Claude Code：

```bash
claude plugin update devflow@devflow-local --scope local
```

若原本使用 `project` 或 `user` scope，請將上面的 `local` 換成相同 scope。

ZIP 不會隨來源檔案自動更新；修改完成後需要重新建立 ZIP，並重新啟動使用該 ZIP 的 session。

## 驗證與疑難排解

### 驗證 plugin 結構

在 plugin 的上一層目錄執行：

```bash
claude plugin validate ./devflow
```

預期結果：

```text
✔ Validation passed
```

### 找不到 Skill

依序檢查：

1. 臨時載入時，確認啟動 Claude Code 時有正確的 `--plugin-dir`；持久安裝時，執行 `claude plugin list` 確認 `devflow@devflow-local` 已安裝且啟用。
2. 路徑指向 plugin 根目錄或完整 ZIP，而不是 `.claude-plugin` 子目錄。
3. 指令是否包含 namespace，例如 `/devflow:develop`。
4. 執行 `/reload-plugins`。
5. 執行 `/help` 或 `/skills` 搜尋 `devflow`。

### 找不到 Reviewer Agent

執行 `/agents` 並搜尋：

```text
devflow:code-reviewer
devflow:security-reviewer
devflow:performance-reviewer
devflow:test-reviewer
devflow:architecture-reviewer
```

架構分析可以在目前 context 以 read-only fallback 執行並揭露降級；commit 前的 correctness 或 specialist review 不會由 implementer 自我替代。若必要的內建 reviewer 與 plugin agent 都不可用，該 plan 會回報 🔴 紅燈／`阻塞`，且不會 commit。請先執行 `/reload-plugins`，再用 `/agents` 確認 reviewer 已載入。

### Hook 沒有執行

1. 執行 `/hooks`，確認 plugin 的 `PostToolUse` hook 已載入。
2. 執行 `node --version`，確認 `node` 在 `PATH`。
3. 確認 `scripts/format-after-edit.mjs` 具備執行權限。
4. 確認專案已經安裝對應 formatter。
5. 注意：找不到 formatter 時，Hook 會刻意安靜跳過。

### Trade-off 後沒有繼續

確認 Claude 的上一個狀態是：

```text
狀態：等待使用者
```

接著在同一個 session 明確回答選項，例如 `B`。如果同時修改需求，Claude 可能會重新執行 Analyze 或 Trade-off，這是預期行為。

### 流程太慢

先確認任務是否被錯誤分類為 MEDIUM/HIGH。LOW 任務應該只走短路徑。也可以單獨執行需要的 Skill，而不啟動完整 `develop` 流程。

不要為了加速而移除所有品質關卡；應該調整 `references/risk-model.md`，讓風險路由更符合你的 codebase。

## 官方文件

- [Claude Code Plugins](https://code.claude.com/docs/en/plugins)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Claude Code Subagents](https://code.claude.com/docs/en/subagents)
- [Claude Code Hooks](https://code.claude.com/docs/en/hooks)
- [Claude Code Commands](https://code.claude.com/docs/en/commands)
