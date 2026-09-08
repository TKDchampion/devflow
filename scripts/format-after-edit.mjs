#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let payload;
try {
  payload = JSON.parse(Buffer.concat(chunks).toString("utf8"));
} catch {
  process.exit(0);
}

const filePath = payload?.tool_input?.file_path;
const projectRoot = path.resolve(process.env.CLAUDE_PROJECT_DIR || payload?.cwd || process.cwd());
if (typeof filePath !== "string") process.exit(0);

const target = path.resolve(filePath);
const relative = path.relative(projectRoot, target);
if (relative.startsWith("..") || path.isAbsolute(relative) || !fs.existsSync(target)) process.exit(0);

const extension = path.extname(target).toLowerCase();
const prettierExtensions = new Set([
  ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".jsonc",
  ".css", ".scss", ".less", ".html", ".vue", ".svelte", ".md", ".mdx",
  ".yaml", ".yml", ".graphql", ".gql"
]);

function ancestors(start, stop) {
  const values = [];
  let current = path.dirname(start);
  while (true) {
    values.push(current);
    if (current === stop || current === path.dirname(current)) break;
    current = path.dirname(current);
  }
  return values;
}

function findPrettierBin() {
  for (const dir of ancestors(target, projectRoot)) {
    const manifest = path.join(dir, "node_modules", "prettier", "package.json");
    if (!fs.existsSync(manifest)) continue;
    try {
      const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
      const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.prettier;
      if (bin) return path.resolve(path.dirname(manifest), bin);
    } catch {
      return null;
    }
  }
  return null;
}

function executable(candidates) {
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

let command = null;
let args = [];

if (prettierExtensions.has(extension)) {
  const prettierBin = findPrettierBin();
  if (prettierBin) {
    command = process.execPath;
    args = [prettierBin, "--write", target];
  }
} else if (extension === ".py") {
  command = executable([
    path.join(projectRoot, ".venv", "bin", "ruff"),
    path.join(projectRoot, "venv", "bin", "ruff"),
    path.join(projectRoot, ".venv", "Scripts", "ruff.exe"),
    path.join(projectRoot, "venv", "Scripts", "ruff.exe")
  ]);
  if (command) args = ["format", target];
} else if (extension === ".go") {
  command = "gofmt";
  args = ["-w", target];
} else if (extension === ".rs") {
  command = "rustfmt";
  args = [target];
}

if (!command) process.exit(0);

const result = spawnSync(command, args, {
  cwd: projectRoot,
  encoding: "utf8",
  timeout: 30_000,
  windowsHide: true
});

if (result.error?.code === "ENOENT") process.exit(0);
if (result.status === 0) process.exit(0);

const detail = (result.stderr || result.stdout || result.error?.message || "unknown formatter error")
  .trim()
  .slice(0, 1200);
process.stdout.write(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: `Automatic formatting failed for ${relative}: ${detail}`
  }
}));
