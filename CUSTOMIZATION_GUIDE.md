# Devflow 結構與手動維護指南

這份文件說明 `devflow` Plugin 內每個資料夾與檔案的職責，以及日後手動修改時需要同步調整的位置。

`README.md` 偏向安裝與日常使用；本文件則偏向結構、行為與維護。

## 目錄

- [整體架構](#整體架構)
- [根目錄檔案](#根目錄檔案)
- [Plugin manifest](#plugin-manifest)
- [Skills：工作流關卡](#skills工作流關卡)
- [Agents：獨立審查者](#agents獨立審查者)
- [References：共用政策與格式](#references共用政策與格式)
- [Hooks：自動事件](#hooks自動事件)
- [Scripts：自動格式化程式](#scripts自動格式化程式)
- [跨檔案修改對照表](#跨檔案修改對照表)
- [建議的手動修改流程](#建議的手動修改流程)
- [驗證方式](#驗證方式)

## 整體架構

```text
devflow/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   ├── develop/SKILL.md
│   ├── analyze/SKILL.md
│   ├── grill/SKILL.md
│   ├── architecture/SKILL.md
│   ├── tradeoff/SKILL.md
│   ├── plan/SKILL.md
│   ├── implement/SKILL.md
│   ├── validate/SKILL.md
│   ├── verify/SKILL.md
│   ├── review/SKILL.md
│   ├── checkpoint/SKILL.md
│   ├── security-review/SKILL.md
│   ├── performance-review/SKILL.md
│   ├── test-review/SKILL.md
│   ├── improve/SKILL.md
│   └── finish/SKILL.md
├── agents/
│   ├── architecture-reviewer.md
│   ├── code-reviewer.md
│   ├── security-reviewer.md
│   ├── performance-reviewer.md
│   └── test-reviewer.md
├── references/
│   ├── risk-model.md
│   ├── gate-contracts.md
│   ├── review-severity.md
│   ├── response-style.md
│   └── tool-strategy.md
├── hooks/
│   └── hooks.json
├── scripts/
│   └── format-after-edit.mjs
├── README.md
└── CUSTOMIZATION_GUIDE.md
```

各層的關係如下：

```text
plugin.json
    │
    └── 定義 Plugin 名稱與版本
            │
            ▼
    /devflow:develop
            │
            ├── 呼叫各個 skills/<gate>/SKILL.md
            │       │
            │       ├── 讀取 references/ 共用規則
            │       └── 必要時委派 agents/ 獨立審查
            │
            └── 完成整套風險導向工作流

Edit / Write
    │
    └── hooks/hooks.json
            │
            └── scripts/format-after-edit.mjs
                    └── 使用專案既有 formatter 格式化檔案
```

完整主流程：

```text
User Request
    ↓
Analyze
    ↓
LOW / MEDIUM / HIGH
    ↓
Grill（HIGH 且有重大模糊時）
    ↓
Architecture（HIGH）
    ↓
Tradeoff（存在重要方案選擇時）
    ↓
USER DECISION
    ↓
Execution Plan Set（非平凡任務切成多段）
    ↓
PLAN-SET APPROVAL
    ↓
[單一 Plan: Implement → Validate → Verify → Stage Diff
 → Independent + Specialist Review → 🟢/🟡/🔴 Gate
 → 🔴 修正後重審；🟢/🟡 User Commit Confirmation → Commit]
    ↺ 依序執行下一個 Plan
    ↓
Finish
```

## 根目錄檔案

### `README.md`

[開啟 README](README.md)

這是給使用者看的安裝與日常操作手冊，內容包括：

- 如何透過 `--plugin-dir` 載入 Plugin。
- 如何透過本機 marketplace 持久安裝 Plugin。
- 如何執行 `/devflow:develop`。
- LOW、MEDIUM、HIGH 路徑。
- 可見進度、plan-set approval、紅黃綠 review 與 commit gate。
- 全部使用者可見回覆的繁體中文語言與 Markdown 排版規則。
- Review finding 的文字建議與可選 code／diff 參考修改。
- Skills、Agents、Hook 的用途。
- 使用範例與疑難排解。

修改工作流不應只修改 README。README 描述的是行為；真正控制行為的是 `skills/`、`references/`、`agents/` 與 `hooks/`。

需要更新 README 的情況：

- Plugin 名稱或載入方式改變。
- 新增、刪除或改名 Skill／Agent。
- 主流程、風險路徑或使用方式改變。
- Hook 支援的 formatter 改變。

### `CUSTOMIZATION_GUIDE.md`

本文件是給維護者看的結構與修改指南，不參與 Claude 的工作流執行。

### `devflow.zip`

ZIP 位於 Plugin 資料夾外，是可載入或分享的交付版本。它不是原始碼來源。

正確更新方式：

1. 修改 `devflow/` 內的來源檔案。
2. 執行驗證。
3. 重新建立 `devflow.zip`。

不要只修改 ZIP 內的內容，否則資料夾版本與壓縮版本會不一致。

## Plugin manifest

### `.claude-plugin/plugin.json`

[開啟 plugin.json](.claude-plugin/plugin.json)

這是 Claude Code 辨識 Plugin 的 manifest。

```json
{
  "name": "devflow",
  "description": "...",
  "version": "1.2.0",
  "author": {
    "name": "Project Maintainers"
  }
}
```

欄位用途：

- `name`：Plugin namespace。`devflow` 會產生 `/devflow:develop` 等指令。
- `description`：整個 Plugin 的摘要。
- `version`：Plugin 版本。
- `author`：維護者資訊。

修改 `name` 時必須同步：

- 所有 `SKILL.md` 內的 `devflow:*` 引用。
- `references/tool-strategy.md` 的 fallback 名稱。
- README 和本文件中的指令。
- Plugin 資料夾名稱與 ZIP 名稱，建議保持一致。

版本建議：

- 只修正文案或小問題：增加 patch，例如 `1.1.0` → `1.1.1`。
- 新增向後相容功能：增加 minor，例如 `1.1.0` → `1.2.0`。
- 更改 namespace 或移除既有能力：增加 major，例如 `1.1.0` → `2.0.0`。

## Skills：工作流關卡

每個 Skill 位於：

```text
skills/<skill-name>/SKILL.md
```

Plugin namespace 與 Skill 名稱組合成指令：

```text
Plugin name: devflow
Skill name: develop
Command: /devflow:develop
```

### SKILL.md frontmatter

典型 frontmatter：

```yaml
---
name: analyze
description: ...
argument-hint: <task or changed requirement>
allowed-tools: Read, Grep, Glob
---
```

欄位用途：

- `name`：Skill 名稱，應與資料夾名稱一致。
- `description`：說明能力與使用時機，是 Claude 判斷何時使用 Skill 的重要依據。
- `argument-hint`：顯示給使用者看的參數提示。
- `allowed-tools`：預先核准 Skill 可直接使用、不必逐次詢問的工具；它不會限制其他工具是否存在。唯讀 Gate 通常只預先核准 `Read`、`Grep`、`Glob`，並在 Skill 指示中禁止修改。
- `disable-model-invocation`：設為 `true` 時，要求使用者明確呼叫，而不是由模型自行觸發。

Skill 內容中的兩個特殊變數：

- `$ARGUMENTS`：使用者呼叫 Skill 時提供的內容。
- `${CLAUDE_PLUGIN_ROOT}`：目前 Plugin 的根目錄，讓 Skill 不依賴固定安裝路徑。

### `skills/develop/SKILL.md`

[開啟 develop](skills/develop/SKILL.md)

整套工作流的總控制器，也是主要入口：

```text
/devflow:develop <development request>
```

負責：

- 依序協調 Analyze、Grill、Architecture、Tradeoff、Plan、Implement、Validate、Verify、Review、Checkpoint、Improve、Finish。
- 使用 `工作流程進度` 持續顯示當前階段、plan 與下一步。
- 強制重要方案先取得使用者明確選擇，再另外取得整組 execution plans 的核准。
- 核准後一次只執行一個 plan，不能預先開始後續 plan。
- 定義 LOW、MEDIUM、HIGH 的不同路線。
- 控制每個 plan 的 review 修正循環，現在最多兩次。
- 處理方案選擇、plan-set approval、🟢／🟡 人工 `Commit 確認` 與黃燈風險接受的跨回合恢復行為。

適合修改的項目：

- 增加、移除或調整 Gate 順序。
- 改變不同風險等級的路線。
- 調整 review loop 次數。
- 修改 solution、plan-set、🟢／🟡 人工 `Commit 確認` 或黃燈 residual-risk acceptance 的規則。
- 將新增 Skill 接入主流程。

這是整套 Plugin 最重要的行為檔案。

### `skills/analyze/SKILL.md`

[開啟 analyze](skills/analyze/SKILL.md)

在修改程式前分析需求，負責：

- 確認目標、範圍、限制與受影響元件。
- 將風險分類成 LOW、MEDIUM、HIGH。
- 將模糊程度分類成無、可處理、阻塞。
- 判斷是否存在 meaningful implementation decision。
- 選出後續必要 Gates。
- 輸出 `任務分析` contract。

這是一個唯讀 Gate，不會規劃、提方案或修改程式。

調整風險標準時，主要修改 `references/risk-model.md`；調整輸出欄位時，修改 `references/gate-contracts.md`。

### `skills/grill/SKILL.md`

[開啟 grill](skills/grill/SKILL.md)

釐清會影響行為、範圍、風險或架構的重大未知資訊。

目前規則：

- 先從 repository 尋找答案。
- 不詢問能安全自行查出的資訊。
- 每回合最多詢問三個緊密相關的問題。
- 問完後以易讀的 `待確認問題` 區塊停止並等待，不可提早宣告需求已釐清。
- 所有阻塞問題都有答案後，才輸出 `已釐清需求`，且 `待確認問題` 必須是「無」。

Grill 負責確認「要做什麼」，Architecture 和 Tradeoff 才負責「怎麼做」。

適合修改的項目：問題數量、必須釐清的領域，以及 blocking ambiguity 的處理方式。

### `skills/architecture/SKILL.md`

[開啟 architecture](skills/architecture/SKILL.md)

用於 HIGH risk、跨服務、資料模型重設計、大型重構、concurrency 或大範圍改動。

它會把唯讀分析委派給 `devflow:architecture-reviewer`，要求整理：

- Components、data flow、ownership、trust boundaries。
- Invariants 與 compatibility constraints。
- Change surface 和 downstream consumers。
- Migration、concurrency、rollout、rollback。
- 會影響方案比較的架構事實。
- 尚未解決的重大未知資訊。

輸出 `架構摘要`，但不替使用者選擇方案。

修改分析要求時可改此 Skill；修改 reviewer 的角色或詳細檢查方式時，改 `agents/architecture-reviewer.md`。

### `skills/tradeoff/SKILL.md`

[開啟 tradeoff](skills/tradeoff/SKILL.md)

這是 User Decision Gate。

存在重要決策時必須：

1. 說明要決定的問題與限制。
2. 提供二至三個真正可行的方案。
3. 比較 repository fit、複雜度、風險、安全、效能、維護性與 rollback。
4. 推薦一個方案。
5. 要求使用者選擇 A、B、C 或提出調整。
6. 輸出 `狀態：等待使用者`。
7. 停止，不建立實作計畫也不修改程式。

若只有一個明顯作法，就跳過 Tradeoff，避免為簡單工作製造假選項。

適合修改的項目：方案數量、比較維度、推薦格式與等待選擇的規則。

### `skills/plan/SKILL.md`

[開啟 plan](skills/plan/SKILL.md)

在方案選定後，建立有順序的 `執行計畫組`：

- 每個 plan 都必須是可獨立驗證、審查與 commit 的連貫增量。
- 非平凡任務應切成多個 plans；真正不可再分的 LOW 任務可使用一個 plan，但要說明理由。
- 每個 plan 都需要 Goal、Scope、Dependencies、Acceptance criteria、Validation、Runtime verification、Review target 與 Commit intent。
- HIGH 任務另外覆蓋 interface、migration、compatibility、failure handling、observability、rollout／rollback 與安全風險。

若使用者尚未完成重要方案選擇，必須回到 `devflow:tradeoff`。

輸出 `執行計畫組` 與 `核准狀態：等待使用者` 後必須停止。方案確認不能取代 plan-set approval；只有使用者後續的明確回覆才能開始編輯。

### `skills/implement/SKILL.md`

[開啟 implement](skills/implement/SKILL.md)

負責實際修改程式。

實作前會確認：

- 已選方案、plan set 已核准、當前 plan 編號和 acceptance criteria。
- 專案規則、相關程式與測試。
- 計畫中的檔案與假設仍符合 repository。

實作期間要求：

- Diff 保持集中。
- 只執行目前 plan，不預先開始下一個 plan。
- 保留使用者既有的無關修改。
- 優先沿用既有模式與 abstraction。
- 行為改變時同步更新測試。
- 不可偷偷改變選定方案。

若發現原方案不成立、需要擴大 scope 或出現新的重大決策，必須在安全邊界停止並回到 `devflow:tradeoff`。`implement` 不會自行 commit；commit 由 `checkpoint` 統一處理。

通用開發原則可加在此處；專案特定規則通常更適合放在專案的 `.claude/CLAUDE.md`。

### `skills/validate/SKILL.md`

[開啟 validate](skills/validate/SKILL.md)

負責執行可重現的自動化檢查：

- Formatter／format check。
- Lint。
- Typecheck。
- Focused tests。
- Broader tests。
- Build。

它會從專案指示、package scripts、build files、CI 與文件尋找正式命令，不會自行虛構成功結果。

失敗時會區分：

- 本次改動造成。
- 原本已存在。
- 環境限制。
- Flaky test。

最後輸出 `驗證結果`，狀態是通過、失敗或部分完成。

專案特定命令應優先寫在該專案的 `.claude/CLAUDE.md`，不要硬編進通用 Plugin。

### `skills/verify/SKILL.md`

[開啟 verify](skills/verify/SKILL.md)

透過實際可觀察行為驗證改動，而不只依賴靜態檢查。

適用場景：

- UI 操作。
- API request／response。
- Persistence readback。
- Migration dry run。
- Background job。
- Integration 或 configuration。
- Concurrency 行為。

要求先定義預期結果，再執行真實路徑並保留 screenshot、log、response、state transition 或 query result 等證據。

禁止未經授權使用 production credential、修改 production、發送真實訊息、收費或執行不可逆外部操作。

輸出 `Runtime 驗證結果`，狀態是通過、失敗、部分完成或已跳過（附原因）。

### `skills/review/SKILL.md`

[開啟 review](skills/review/SKILL.md)

在 Validate 後審查單一 plan 的實際 staged diff。

優先使用 Claude Code 內建 `/code-review` 或 `/review`；無法使用或 target 不合適時，委派 `devflow:code-reviewer`。

必須檢查 `git diff --cached --binary --full-index` 的檔案清單、stat、完整 patch 與必要的周邊程式，並確認 diff 只屬於當前 plan。Review target 以 base commit OID 和 staged index-tree OID 綁定，包含路徑、mode 與 binary 內容。檢查內容包括：

- Correctness 和 regression。
- Boundary cases 和 error handling。
- Compatibility 和 concurrency。
- Performance 和 maintainability。
- Test coverage。

只回報有執行路徑、證據與具體修正方式的 finding，不在這個 Gate 直接修改程式。結果必須包含：

- 🟢 綠燈：程式碼可提交，但仍須停止並等待人工確認。
- 🟡 黃燈：停止並等使用者決定修正或接受風險。
- 🔴 紅燈：禁止 commit，修正、重新驗證與 review。

每個 finding 使用獨立小節，列出位置、問題、影響、證據與建議。有足夠脈絡且修法明確時，再加上 `參考修改（尚未套用）` 的最小 diff 或 code block；程式碼範例不可取代 Improve、Validation 與重新 Review。

如果 review 後又修改、重新 staging，或 patch identity 改變，原 signal 失效。若內建 review 與 plugin reviewer 都無法使用，回報 🔴 紅燈／`阻塞`，不可由 implementer 自我審查後放行。

修改 review 項目時改此 Skill；修改等級時改 `references/review-severity.md`；修改 reviewer 人格與輸出細節時改 `agents/code-reviewer.md`。

### `skills/security-review/SKILL.md`

[開啟 security-review](skills/security-review/SKILL.md)

處理 authentication、authorization、secret、untrusted input、資料外洩、cryptography、payment、tenant、network boundary 和 supply-chain risk。

優先使用內建 `/security-review`；不適用時委派 `devflow:security-reviewer`。

它要求具體攻擊路徑，不接受只有 checklist 的泛泛提醒。輸出 `安全性審查` 與通過、需要修改或阻塞；有明確修法時也會附上尚未套用的 code／diff 範例。

若要讓某類改動固定觸發 Security Review，除了這個 Skill，還需要修改 `risk-model.md` 和 `develop/SKILL.md`。

### `skills/performance-review/SKILL.md`

[開啟 performance-review](skills/performance-review/SKILL.md)

處理 hot path、高流量 query、cache、fan-out、concurrency、resource usage、latency、throughput 和 scalability risk。

委派 `devflow:performance-reviewer`，檢查：

- Algorithmic complexity。
- I/O 和 query count。
- N+1。
- Allocation 和 copying。
- Cache semantics。
- Batching、contention、backpressure、pagination。
- Failure amplification。

實測結果與推理風險必須分開，不能虛構 benchmark 數字。

### `skills/test-review/SKILL.md`

[開啟 test-review](skills/test-review/SKILL.md)

判斷測試是否真的證明需求與重要 failure modes，而不只看測試是否通過。

委派 `devflow:test-reviewer`，建立 behavior-to-test matrix，涵蓋：

- Happy path。
- Boundary 和 invalid input。
- Failure recovery。
- State transition。
- Permission。
- Concurrency。
- Migration／rollback。
- Integration seams。

它會區分缺少 coverage、測試 assertion 錯誤，以及 brittle／redundant tests。

### `skills/improve/SKILL.md`

[開啟 improve](skills/improve/SKILL.md)

確認並修正 review findings：

- P0／P1：必須修正。
- P2：安全且在範圍內時修正。
- P3：通常是選擇性清理。
- False positive：以證據拒絕，不修改正確程式。

修正後重新執行 Validate 與受影響的 Verify，再回到 `checkpoint`。由 checkpoint 重新 stage、建立新的 patch identity，並針對新 diff 重跑受影響的 specialist 與 correctness reviews。

若修正需要改變架構、dependency、public contract 或 migration strategy，必須回到 `devflow:tradeoff` 取得新決策。

Review loop 的次數是在 `develop/SKILL.md` 控制，不是在此檔案。

### `skills/checkpoint/SKILL.md`

[開啟 checkpoint](skills/checkpoint/SKILL.md)

每個 plan 的 staged-diff review 與 commit gate：

1. 確認 plan set 已核准，並取得當前 plan 的 scope、acceptance criteria、validation evidence 與 commit intent。
2. 比對 workflow 開始時的 Git 狀態，排除使用者原本或同時進行的無關修改。
3. 只 stage 當前 plan 的明確路徑或可安全分離的 hunks，禁止 `git add .`、`git add -A` 和 `git commit -a`。
4. 檢查 `git diff --cached --check`、檔案清單、stat 與 `--binary --full-index` staged patch，以目前 HEAD 和 `git write-tree` 記錄 content-addressed patch identity。
5. 所有必要的 correctness、security、performance 與 test review 都針對同一個 staged patch identity 執行。
6. 向使用者顯示 diff 摘要、findings、patch identity、預計 commit message 與紅黃綠 signal。
7. 🟢 綠燈與 🟡 黃燈都輸出 `Commit 確認` 並停止；黃燈還必須明確接受 residual risks。🔴 紅燈不得 commit，必須先修正並重新 review。
8. 只有使用者在後續回合明確確認 exact patch，且 identity 保持不變，才顯示 Commit 進度並執行 `git commit`。
9. commit 後確認 parent 與 tree 等於審查時的 identity，再輸出 `計畫檢查點`、commit hash、subject 和剩餘 plans。

核准整組 plans 只代表同意實作範圍與預計 commit message，不授權任何 `git commit`。每個 plan 都要在 review 結果顯示後另外取得人工確認；確認只適用於該份 patch identity，不可沿用到下一個 plan。若存在無法安全分離的既有 staged 變更或同檔案修改，checkpoint 必須停止，不能將它們一起 commit。Claude Code 仍可依使用者的 permission mode 對 `git commit` 顯示額外 CLI 核准提示。

### `skills/finish/SKILL.md`

[開啟 finish](skills/finish/SKILL.md)

最後的完成判定，檢查：

- 每個已核准 plan 都依序執行並有 `計畫檢查點`。
- 每個已核准 plan 都要記錄獨立的人工 commit confirmation；🟡 黃燈還要記錄該版 residual risks 的接受證據。不可提交 🔴 紅燈，也不可用空白或 no-commit 結果假裝完成。
- 是否符合選定方案和 acceptance criteria。
- 各 plan 最新修改後的必要 checks、runtime verification 與 specialist reviews 是否完成或有合理跳過理由。
- 是否還有任務所屬的 staged／unstaged 變更，或無關修改被誤放入 plan commit。
- 已接受的 P2／P3 和 residual risks。

每個 plan 的 commit 已在 `checkpoint` 完成；Finish 不會再建立額外 commit，也不會自行 amend、push、merge、rebase、deploy 或開 Pull Request。

條件不足時輸出 `尚未完成` 和下一個必要 Gate；全部滿足才輸出 `完成` contract。

若要調整 Definition of Done，主要修改此檔案。

## Agents：獨立審查者

Skills 定義流程入口與委派規則；Agents 是實際執行獨立分析的角色。

典型 Agent frontmatter：

```yaml
---
name: code-reviewer
description: ...
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit, NotebookEdit
model: inherit
maxTurns: 24
---
```

欄位用途：

- `name`：Agent 名稱。
- `description`：Agent 的能力與委派時機。
- `tools`：可使用的工具。
- `disallowedTools`：明確禁止的工具。
- `model: inherit`：沿用主 Claude Code session 的模型。
- `maxTurns`：最多執行回合數。

目前 reviewer 全部禁止 `Write`、`Edit`、`NotebookEdit`。維護時不要隨意移除這些限制，否則獨立審查可能變成邊看邊修改。

### `agents/architecture-reviewer.md`

[開啟 architecture-reviewer](agents/architecture-reviewer.md)

唯讀軟體架構師，分析 components、ownership、data flow、trust boundaries、public contracts、invariants、change surface、migration、concurrency、rollout、rollback、observability 與相關風險。

它只提供架構事實，不直接選擇方案。

### `agents/code-reviewer.md`

[開啟 code-reviewer](agents/code-reviewer.md)

獨立資深 Code Reviewer。可使用 Bash 執行 `git status`、`git diff`、`git show` 等唯讀檢查，但不能修改檔案、安裝 dependency 或直接修復 finding。

它以 P0～P3 回報位置、問題、影響、證據與建議，最後輸出通過、需要修改或阻塞。修法明確時會附上 `參考修改（尚未套用）` 的最小 diff 或 code block。

### `agents/security-reviewer.md`

[開啟 security-reviewer](agents/security-reviewer.md)

唯讀 Application Security Reviewer，先建立 assets、actors、entry points、trust boundaries 和 abuse cases 的小型 threat model，再尋找具體可利用路徑。

禁止探測 live system、使用真實 credentials、安裝工具或修改程式。

### `agents/performance-reviewer.md`

[開啟 performance-reviewer](agents/performance-reviewer.md)

唯讀效能 Reviewer，聚焦 workload、scale assumptions、hot paths、complexity、query count、cache、allocation、contention、backpressure 和 scalability。

可以查看現有的非破壞性 benchmark，但不能虛構測量數字。

### `agents/test-reviewer.md`

[開啟 test-reviewer](agents/test-reviewer.md)

唯讀測試 Reviewer，把 acceptance criteria 和 material risks 對應到現有測試，回傳 behavior-to-test matrix、blocking gaps、non-blocking gaps、brittle tests、redundant tests 和最小必要測試建議。

## References：共用政策與格式

Reference 不會因為存在就自動套用；需要由 `SKILL.md` 明確要求讀取，例如：

```text
Read ${CLAUDE_PLUGIN_ROOT}/references/risk-model.md
```

### `references/risk-model.md`

[開啟 risk-model](references/risk-model.md)

定義 LOW、MEDIUM、HIGH、meaningful implementation decision 和執行途中升級風險的規則。

HIGH hard triggers 包括：

- Authentication、authorization、permission、secret、sensitive data。
- Payment、billing、financial calculation。
- Database migration、destructive operation、困難 rollback。
- Security boundary、cryptography、sandbox、執行 untrusted input。
- Distributed coordination、queue、concurrency correctness。
- Public API compatibility、large refactor、architecture change。
- Performance-critical path 或大 blast radius。
- 會改變架構的重大模糊需求。

若要讓某類任務提高或降低風險，主要修改此檔案，並確認 `develop` 的 routing 仍合理。

### `references/gate-contracts.md`

[開啟 gate-contracts](references/gate-contracts.md)

定義 Gate 之間傳遞狀態的標準格式：

- `任務分析`
- `工作流程進度`
- `已釐清需求`
- `方案決策`
- `執行計畫組`
- `驗證結果`
- `獨立程式碼審查`
- `Commit 確認`
- `計畫檢查點`
- `完成`

例如 `方案決策` 會透過 `狀態：等待使用者` 表示流程必須暫停，`執行計畫組` 則使用獨立的 `核准狀態：等待使用者`。只有使用者明確回覆才能繼續。

新增欄位時，也要確認使用該 contract 的 Skills 知道如何填寫與讀取新欄位。

### `references/response-style.md`

[開啟 response-style](references/response-style.md)

定義所有使用者可見輸出的共用規則：

- 使用台灣繁體中文；identifier、路徑、command 與必要技術詞彙保留原文。
- 先顯示狀態，再以短標題、清單、空行和必要表格分段。
- 每個 plan 與 finding 各自成段，避免長篇密集文字。
- 等待決策時，以一個明確問題收尾。
- Finding 有可靠、in-scope 的具體修法時，附上 `參考修改（尚未套用）` 的最小 unified diff 或 code block。

每個會直接輸出內容的 Skill 都必須讀取此檔案；Reviewer Agents 也要在自身 prompt 中明確要求繁體中文與相同排版。參考修改只供閱讀，不代表已修改檔案，也不能略過 Improve、Validation 和重新 Review。

### `references/review-severity.md`

[開啟 review-severity](references/review-severity.md)

統一 Reviewer 的 finding 等級：

- P0：主動資料損失、安全 compromise 或全系統 outage；阻擋完成。
- P1：正常使用下很可能發生的 correctness、安全、相容或可靠性失敗；阻擋完成。
- P2：影響範圍有限但真實的缺陷、維護性或測試缺口。
- P3：非阻擋的清理或清晰度改善。

同時排除純格式偏好、無執行路徑的猜測、無關既有問題和沒有證據的 finding。

並將完整證據映射成 commit signal：

- 🔴 紅燈：P0／P1、必要驗證失敗、acceptance mismatch 或無法安全審查；禁止 commit。
- 🟡 黃燈：只有 P2／P3、非關鍵證據缺口或 residual risk；等待使用者修正，或接受風險並確認 commit。
- 🟢 綠燈：實際 staged diff 已審查、必要驗證通過且無 actionable finding；仍須等待人工 commit confirmation。

若要改變哪些 finding 會阻擋完成，需要同步檢查 `improve/SKILL.md` 和 `finish/SKILL.md`。

### `references/tool-strategy.md`

[開啟 tool-strategy](references/tool-strategy.md)

定義每個 Gate 的首選 Claude Code 能力與 fallback：

| 工作 | 首選 | Fallback |
|---|---|---|
| Repository exploration | Explore agent | Read、Grep、Glob |
| Runtime verification | `/verify` 或 `/run` | `devflow:verify` |
| Correctness review | `/code-review` 或 `/review` | `devflow:code-reviewer` |
| Security review | `/security-review` | `devflow:security-reviewer` |
| Performance review | 獨立 Reviewer | `devflow:performance-reviewer` |
| Cleanup | `/simplify` | `devflow:improve` |

Claude Code 新增、移除或改名內建能力時，應檢查此檔案。Plugin 改名時，這裡的 namespace 也必須同步。

## Hooks：自動事件

### `hooks/hooks.json`

[開啟 hooks.json](hooks/hooks.json)

目前設定 `PostToolUse` Hook。每次 Claude 使用 `Edit` 或 `Write` 後，自動執行：

```text
node ${CLAUDE_PLUGIN_ROOT}/scripts/format-after-edit.mjs
```

Hook 與 Validate 的差異：

- Hook：每次編輯後針對單一檔案嘗試自動格式化。
- Validate：實作完成後執行整體 format check、lint、typecheck、tests 和 build。

常見修改：

- 取消自動格式化：移除該 Hook。
- 只在某種工具後執行：調整 `matcher`。
- 改執行腳本：調整 `command` 與 `args`。
- 新增其他事件：在 `hooks` 下加入 Claude Code 支援的事件。

路徑應繼續使用 `${CLAUDE_PLUGIN_ROOT}`，避免依賴特定安裝位置。

## Scripts：自動格式化程式

### `scripts/format-after-edit.mjs`

[開啟 format-after-edit.mjs](scripts/format-after-edit.mjs)

Node.js 腳本，從 stdin 讀取 Claude Code Hook 傳入的 JSON，取得被修改檔案後選擇 formatter。

處理流程：

1. 解析 Hook payload。
2. 取得 `tool_input.file_path`。
3. 取得 `CLAUDE_PROJECT_DIR` 或目前工作目錄。
4. 確認目標檔案位於專案內且存在。
5. 依副檔名尋找 formatter。
6. Formatter 存在才執行。
7. Formatter 不存在時安靜跳過。
8. 格式化失敗時將訊息加入 Claude context。

目前支援：

| 類型 | Formatter | 尋找方式 |
|---|---|---|
| JS、TS、JSON、CSS、HTML、Vue、Svelte、Markdown、YAML、GraphQL 等 | Prettier | 專案或上層目錄中的本地 `node_modules/prettier` |
| Python | Ruff | 專案 `.venv` 或 `venv` |
| Go | gofmt | 系統 command |
| Rust | rustfmt | 系統 command |

安全設計：

- 不處理專案外檔案。
- 不自動安裝或下載 formatter。
- Formatter 找不到就跳過。
- 每次 formatter 最長執行 30 秒。
- 失敗訊息最多保留 1,200 個字元。
- Formatter 失敗時通知 Claude，不直接阻擋整個工作流。

常見修改位置：

- 增加 Prettier 副檔名：修改 `prettierExtensions`。
- 增加語言：在 formatter 選擇區增加新的 `extension` 分支。
- 修改 timeout：調整 `timeout: 30_000`。
- 修改錯誤長度：調整 `.slice(0, 1200)`。

新增 formatter 時應同時定義 executable 搜尋方式、arguments、找不到時的行為，以及是否允許使用系統全域工具。

## 跨檔案修改對照表

| 想修改的事情 | 主要修改處 | 需要同步檢查 |
|---|---|---|
| 改 Plugin 名稱 | `.claude-plugin/plugin.json` | 所有 namespace、README、本文件、資料夾與 ZIP |
| 改風險定義 | `references/risk-model.md` | `skills/analyze`、`skills/develop`、README |
| 改工作流順序 | `skills/develop/SKILL.md` | 對應 Skills、README |
| 改 User Decision Gate | `skills/tradeoff/SKILL.md`、`skills/plan/SKILL.md` | `skills/develop`、`gate-contracts.md` |
| 改 plan commit gate | `skills/checkpoint/SKILL.md` | `skills/review`、`review-severity.md`、`skills/finish` |
| 改輸出格式 | `references/gate-contracts.md` | 所有讀寫該 contract 的 Skills |
| 改 Review 嚴重程度 | `references/review-severity.md` | `skills/improve`、`skills/finish`、Reviewer Agents |
| 新增 Skill | 新增 `skills/<name>/SKILL.md` | `skills/develop`、README、本文件 |
| 新增 Reviewer Agent | 新增 `agents/<name>.md` | 對應 Review Skill、`skills/develop` |
| 改內建工具 fallback | `references/tool-strategy.md` | 對應 Skill 與 Agent 名稱 |
| 改自動格式化事件 | `hooks/hooks.json` | Script、README |
| 改 formatter 支援 | `scripts/format-after-edit.mjs` | Hook 說明、README |
| 改 Definition of Done | `skills/finish/SKILL.md` | `skills/develop`、review severity |
| 改 review loop 次數 | `skills/develop/SKILL.md` | `skills/improve` 的文字是否仍一致 |

## 建議的手動修改流程

修改工作流時建議依序進行：

1. 先確認改動屬於共用政策、單一 Gate、Reviewer，還是 Hook。
2. 若是共用政策，先修改 `references/`。
3. 修改負責該行為的單一 `SKILL.md`。
4. 若路由或執行順序改變，修改 `skills/develop/SKILL.md`。
5. 若涉及獨立分析方式，修改對應 Agent。
6. 更新 README 和本維護指南。
7. 視改動性質更新 `plugin.json` 版本。
8. 執行 Plugin、引用與腳本驗證。
9. 重新建立 `devflow.zip`。

最常需要修改的六個核心檔案：

- `skills/develop/SKILL.md`：整體流程與 routing。
- `references/risk-model.md`：風險分級與 meaningful decision。
- `references/gate-contracts.md`：各 Gate 的狀態和輸出格式。
- `references/response-style.md`：繁體中文、排版與 review code 範例規則。
- `skills/checkpoint/SKILL.md`：每個 plan 的 staged-diff review 與 commit gate。
- `skills/finish/SKILL.md`：Definition of Done。

## 驗證方式

### 驗證 Plugin 結構

從 `devflow` 的上層目錄執行：

```bash
claude plugin validate ./devflow
```

### 檢查舊 namespace 或錯誤引用

例如 Plugin 改名後：

```bash
rg -n "old-plugin-name|devflow:" devflow
```

確認每個 `devflow:<name>` 都能對應到：

```text
skills/<name>/SKILL.md
```

或：

```text
agents/<name>.md
```

### 檢查 formatter 腳本語法

```bash
node --check devflow/scripts/format-after-edit.mjs
```

### 檢查 ZIP

重新壓縮後執行：

```bash
unzip -t devflow.zip
```

確認壓縮檔沒有 `.DS_Store`、暫存檔、測試產物或其他不需要交付的內容。

### 實際載入測試

開發或測試時，直接從原始碼路徑載入：

```bash
claude --plugin-dir /absolute/path/to/devflow
```

然後確認主要入口可用：

```text
/devflow:develop <測試需求>
```

測試時確認 Claude 先以繁體中文顯示 `工作流程進度`，方案選定後輸出多段 `執行計畫組` 並停在 `核准狀態：等待使用者`。核准後應一次只執行一個 plan，審查實際 staged diff，以清楚分段顯示紅黃綠 signal；存在明確修法時附上尚未套用的 code／diff 範例。綠燈與黃燈都必須停在 `Commit 確認`，只有使用者後續明確確認該份 exact patch 才可 commit；紅燈不可提交。

### 非測試用途的持久安裝

Claude Code 沒有 `claude plugin add <path>` 或 `--global` 語法。持久安裝需要先加入本機 marketplace，再安裝 `devflow`。

```bash
cd /path/to/your-project
claude plugin marketplace add /absolute/path/to/devflow --scope local
claude plugin install devflow@devflow-local --scope local
```

`local` 只供自己在目前專案使用；`project` 寫入專案設定；`user` 是個人全域且為預設 scope。加入 marketplace 與安裝 plugin 時應使用相同 scope。使用絕對本機路徑的 project-scope 設定只有在協作者也擁有同一路徑時才可攜；團隊共用應改用所有人都能取得的 Git URL。

修改本機來源後，持久安裝版本可用相同 scope 更新，接著重新啟動 Claude Code：

```bash
claude plugin update devflow@devflow-local --scope local
```

若原本安裝在 `project` 或 `user`，請換成相同 scope。

若修改了 Analyze、Tradeoff 或其他複雜 Gate，除了格式驗證，也應用一個真實但安全的範例進行 forward test，確認風險分類、停等使用者決策與後續恢復行為符合預期。
