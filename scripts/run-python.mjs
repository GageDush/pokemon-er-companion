/* global console, process */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const script = process.argv[2];
const args = process.argv.slice(3);

if (!script) {
  console.error("Usage: node scripts/run-python.mjs <script.py> [...args]");
  process.exit(1);
}

const candidates = [
  process.env.PYTHON,
  join(homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe"),
  "python",
  "py"
].filter(Boolean);

const python = candidates.find((candidate) => candidate && (candidate.includes("\\") || candidate.includes("/") ? existsSync(candidate) : true));

if (!python) {
  console.error("No Python executable found. Set PYTHON to a Python 3 executable with openpyxl and pypdf installed.");
  process.exit(1);
}

const result = spawnSync(python, [script, ...args], {
  stdio: "inherit",
  shell: false
});

process.exit(result.status ?? 1);
