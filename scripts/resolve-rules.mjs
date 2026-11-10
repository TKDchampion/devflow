#!/usr/bin/env node
// Resolve devflow rule slots across layers and print the effective rules.
//
// Layers, lowest to highest priority:
//   1. built-in      ${CLAUDE_PLUGIN_ROOT}/rules/<slot>.md
//   2. organization  $DEVFLOW_ORG_DIR/<slot>.md
//   3. user project  ${DEVFLOW_HOME:-~/.devflow}/projects/<name>/<slot>.md
//                    (matched by the `remote` list in that folder's project.md)
//   4. repository    <git toplevel>/.devflow/rules/<slot>.md
//
// Usage: node resolve-rules.mjs [--project <dir>] [slot ...]   (no slot = all)
//
// Each override file may set `mode: extend` (default, appended) or
// `mode: replace` (discards lower layers) in its frontmatter.
// The script always exits 0 so a skill that injects its output still loads;
// problems are reported in the printed warnings section instead.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SLOTS = ["branching", "review-routing", "commit-message"];
const MODES = new Set(["extend", "replace"]);

const pluginRoot = path.resolve(
  process.env.CLAUDE_PLUGIN_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
);
const warnings = [];

function expandHome(value) {
  if (!value) return value;
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

function git(cwd, args) {
  const result = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : null;
}

function normalizeRemote(value) {
  return String(value)
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, "") // scheme
    .replace(/^[^@/]+@/, "") // user or credentials
    .replace(/^([^/:]+):\d+\//, "$1/") // host:port/
    .replace(/^([^/:]+):/, "$1/") // scp-style host:path
    .replace(/\.git$/i, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

// Minimal frontmatter parser: `key: value`, `key: [a, b]`, and `- item` lists.
function parseFile(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta = {};
  if (match) {
    let listKey = null;
    for (const line of match[1].split("\n")) {
      const item = line.match(/^\s*-\s+(.+)$/);
      if (item && listKey) {
        meta[listKey].push(item[1].trim().replace(/^["']|["']$/g, ""));
        continue;
      }
      const pair = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
      if (!pair) continue;
      const [, key, raw] = pair;
      const value = raw.trim();
      if (value === "") {
        meta[key] = [];
        listKey = key;
      } else if (value.startsWith("[") && value.endsWith("]")) {
        meta[key] = value
          .slice(1, -1)
          .split(",")
          .map((part) => part.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
        listKey = null;
      } else {
        meta[key] = value.replace(/^["']|["']$/g, "");
        listKey = null;
      }
    }
  }
  return { meta, body: (match ? text.slice(match[0].length) : text).trim() };
}

function readRule(file, slot, label) {
  if (!fs.existsSync(file)) return null;
  let parsed;
  try {
    parsed = parseFile(file);
  } catch (error) {
    warnings.push(`無法讀取 ${file}：${error.message}`);
    return null;
  }
  let mode = String(parsed.meta.mode || "extend").toLowerCase();
  if (!MODES.has(mode)) {
    warnings.push(`${file} 的 mode「${parsed.meta.mode}」無效，已當作 extend。`);
    mode = "extend";
  }
  if (parsed.meta.slot && parsed.meta.slot !== slot) {
    warnings.push(`${file} 的 frontmatter slot「${parsed.meta.slot}」與檔名不符，仍以檔名 ${slot} 套用。`);
  }
  return { file, label, mode, body: parsed.body };
}

function warnUnknownFiles(dir, label, allowed = new Set()) {
  if (!dir || !fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".md") || allowed.has(name)) continue;
    if (!SLOTS.includes(name.slice(0, -3))) {
      warnings.push(`${label} 的 ${path.join(dir, name)} 不是支援的插槽，已忽略。支援：${SLOTS.join("、")}。`);
    }
  }
}

function findUserProject(devflowHome, remote) {
  const projectsDir = path.join(devflowHome, "projects");
  if (!remote || !fs.existsSync(projectsDir)) return null;
  const matches = [];
  for (const name of fs.readdirSync(projectsDir).sort()) {
    const dir = path.join(projectsDir, name);
    const manifest = path.join(dir, "project.md");
    if (!fs.existsSync(manifest)) continue;
    let remotes;
    try {
      const value = parseFile(manifest).meta.remote;
      remotes = Array.isArray(value) ? value : value ? [value] : [];
    } catch (error) {
      warnings.push(`無法讀取 ${manifest}：${error.message}`);
      continue;
    }
    if (remotes.length === 0) {
      warnings.push(`${manifest} 沒有設定 remote，無法對應專案。`);
      continue;
    }
    if (remotes.some((entry) => normalizeRemote(entry) === remote)) matches.push(dir);
  }
  if (matches.length > 1) {
    warnings.push(`多個使用者層專案資料夾對應到同一個 remote，只套用第一個：${matches.join("、")}`);
  }
  return matches[0] || null;
}

// ---- Determine requested slots -------------------------------------------

const argv = process.argv.slice(2);
let projectArg = null;
const requested = [];
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i] === "--project") {
    projectArg = argv[i + 1] || null;
    i += 1;
  } else if (argv[i]) {
    requested.push(argv[i]);
  }
}
// Ignore an unsubstituted placeholder such as "${CLAUDE_PROJECT_DIR}".
if (projectArg && (projectArg.includes("${") || !fs.existsSync(projectArg))) projectArg = null;

const slots = [];
for (const name of requested.length ? requested : SLOTS) {
  if (SLOTS.includes(name)) {
    if (!slots.includes(name)) slots.push(name);
  } else {
    warnings.push(`未知的插槽「${name}」。支援：${SLOTS.join("、")}。`);
  }
}

// ---- Locate layers ---------------------------------------------------------

const startDir = path.resolve(projectArg || process.env.CLAUDE_PROJECT_DIR || process.cwd());
const repoRoot = git(startDir, ["rev-parse", "--show-toplevel"]);
let remote = null;
if (repoRoot) {
  const raw =
    git(repoRoot, ["remote", "get-url", "origin"]) ||
    (() => {
      const first = git(repoRoot, ["remote"])?.split("\n").find(Boolean);
      return first ? git(repoRoot, ["remote", "get-url", first]) : null;
    })();
  remote = raw ? normalizeRemote(raw) : null;
}

const orgDir = expandHome(process.env.DEVFLOW_ORG_DIR || "");
if (orgDir && !fs.existsSync(orgDir)) warnings.push(`DEVFLOW_ORG_DIR 指向的資料夾不存在：${orgDir}`);
const devflowHome = path.resolve(expandHome(process.env.DEVFLOW_HOME || "~/.devflow"));
const userProjectDir = findUserProject(devflowHome, remote);
const repoRulesDir = repoRoot ? path.join(repoRoot, ".devflow", "rules") : null;

const layers = [
  { label: "內建", dir: path.join(pluginRoot, "rules") },
  { label: "公司層", dir: orgDir && fs.existsSync(orgDir) ? orgDir : null },
  { label: "使用者層專案", dir: userProjectDir },
  { label: "repo 專案層", dir: repoRulesDir }
];

warnUnknownFiles(layers[1].dir, "公司層");
warnUnknownFiles(userProjectDir, "使用者層專案", new Set(["project.md"]));
warnUnknownFiles(repoRulesDir, "repo 專案層");

// ---- Resolve and print -----------------------------------------------------

const out = [];
out.push("# devflow 生效規則", "");
out.push(`- 專案：${repoRoot || `${startDir}（不是 git repository）`}`);
out.push(`- remote：${remote || "無"}`);
out.push(`- 公司層：${layers[1].dir || "未設定"}`);
out.push(`- 使用者層專案：${userProjectDir || "未對應到"}`);
out.push(`- repo 專案層：${repoRulesDir && fs.existsSync(repoRulesDir) ? repoRulesDir : "無"}`);

for (const slot of slots) {
  let applied = [];
  for (const layer of layers) {
    if (!layer.dir) continue;
    const rule = readRule(path.join(layer.dir, `${slot}.md`), slot, layer.label);
    if (!rule) continue;
    applied = rule.mode === "replace" ? [rule] : [...applied, rule];
  }
  out.push("", `## ${slot}`);
  if (applied.length === 0) {
    out.push("", "（沒有任何規則）");
    continue;
  }
  for (const rule of applied) {
    const how = rule.label === "內建" ? "" : rule.mode === "replace" ? "，replace：取代較低層規則" : "，extend：疊加在較低層規則之後";
    out.push("", `### 來源：${rule.label}（${rule.file}${how}）`, "", rule.body || "（此層清空了規則）");
  }
}

if (warnings.length) {
  out.push("", "## 規則警告", "", ...warnings.map((warning) => `- ${warning}`));
}

out.push(
  "",
  "## 不可覆寫的底線",
  "",
  "上述規則只能調整所屬動作，不能放寬以下關卡；若規則與底線衝突，忽略衝突的部分並告知使用者：",
  "",
  "- 方案選擇與計畫組核准都必須取得使用者明確回覆。",
  "- 每個 plan 的 staged diff 都必須經過獨立 correctness review。",
  "- 🔴 紅燈禁止 commit。",
  "- 每次 commit 都需要使用者針對該 patch 另外確認。",
  "- 不得自動 push、merge、rebase、force-push、刪除分支或 deploy。"
);

process.stdout.write(`${out.join("\n")}\n`);
