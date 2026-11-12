#!/usr/bin/env node
// List which devflow skills are overridden by personal or project devflow-* skills.
//
// Usage: node list-overrides.mjs [--project <dir>]
//
// Managed (organization) and plugin-provided overrides have no fixed path, so
// they are not listed here; the overrides skill reads them from its
// available-skills list. Always exits 0 so a skill that injects this output
// still loads.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const pluginRoot = path.resolve(
  process.env.CLAUDE_PLUGIN_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
);

function expandHome(value) {
  if (value === "~") return os.homedir();
  if (value.startsWith("~/")) return path.join(os.homedir(), value.slice(2));
  return value;
}

const argv = process.argv.slice(2);
let projectArg = argv[argv.indexOf("--project") + 1] || null;
if (!argv.includes("--project") || (projectArg && (projectArg.includes("${") || !fs.existsSync(projectArg)))) {
  projectArg = null;
}
const startDir = path.resolve(projectArg || process.env.CLAUDE_PROJECT_DIR || process.cwd());
const top = spawnSync("git", ["-C", startDir, "rev-parse", "--show-toplevel"], { encoding: "utf8" });
const repoRoot = top.status === 0 ? top.stdout.trim() : null;

const skillsDir = path.join(pluginRoot, "skills");
const pluginSkills = fs.existsSync(skillsDir)
  ? fs.readdirSync(skillsDir).filter((name) => fs.existsSync(path.join(skillsDir, name, "SKILL.md"))).sort()
  : [];

const claudeDir = path.resolve(expandHome(process.env.CLAUDE_CONFIG_DIR || "~/.claude"));
const locations = [
  ["個人", path.join(claudeDir, "skills")],
  ["專案", repoRoot ? path.join(repoRoot, ".claude", "skills") : null]
];

const found = new Map();
const warnings = [];
for (const [label, dir] of locations) {
  if (!dir || !fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.startsWith("devflow-")) continue;
    const file = path.join(dir, name, "SKILL.md");
    if (!fs.existsSync(file)) {
      warnings.push(`${label} 的 ${path.join(dir, name)} 沒有 SKILL.md，不會被載入。`);
      continue;
    }
    const target = name.slice("devflow-".length);
    if (!pluginSkills.includes(target)) {
      warnings.push(`${label} skill \`${name}\`（${file}）不對應任何 devflow skill，不會覆蓋任何步驟。`);
      continue;
    }
    if (!found.has(target)) found.set(target, []);
    found.get(target).push(`${label}：${file}`);
  }
}

const out = ["# devflow 外部覆蓋 skill（個人與專案）", ""];
out.push(`- 專案：${repoRoot || `${startDir}（不是 git repository）`}`);
out.push(`- 個人 skill 資料夾：${locations[0][1]}`);
out.push(`- 專案 skill 資料夾：${locations[1][1] || "無"}`);
out.push("", "| devflow skill | 狀態 |", "|---|---|");
for (const name of pluginSkills) {
  const hits = found.get(name);
  out.push(`| \`devflow:${name}\` | ${hits ? `由 \`devflow-${name}\` 覆蓋（${hits.join("；")}）` : "預設"} |`);
}
for (const [name, hits] of found) {
  if (hits.length > 1) {
    warnings.push(`\`devflow-${name}\` 同時存在於多個位置，Claude Code 只會載入其中一份：${hits.join("；")}`);
  }
}
if (warnings.length) out.push("", "## 警告", "", ...warnings.map((w) => `- ${w}`));
process.stdout.write(`${out.join("\n")}\n`);
