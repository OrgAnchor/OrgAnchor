import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("capability traceability matrix is package-facing and indexed", () => {
  const readme = readText("README.md");
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[]; scripts?: Record<string, string> };

  assert.match(readme, /CAPABILITY_TRACEABILITY_MATRIX\.md/);
  assert.match(docsIndex, /CAPABILITY_TRACEABILITY_MATRIX\.md/);
  assert.ok(packageJson.files?.includes("CAPABILITY_TRACEABILITY_MATRIX.md"));
  assert.ok(packageJson.files?.includes("scripts/capability-audit.mjs"));
  assert.equal(packageJson.scripts?.["capability:audit"], "node scripts/capability-audit.mjs");
});

test("capability audit validates the matrix without writing reports", () => {
  const result = spawnSync(process.execPath, ["scripts/capability-audit.mjs", "--check"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.match(result.stdout, /Capability audit PASS/);
});

test("capability matrix distinguishes implemented, partial, design-only, and not implemented work", () => {
  const matrix = readText("CAPABILITY_TRACEABILITY_MATRIX.md");

  for (const phrase of [
    "IMPLEMENTED_AND_TESTED",
    "IMPLEMENTED_MANUAL_CHECK",
    "PARTIAL",
    "DESIGN_ONLY",
    "NOT_IMPLEMENTED",
    "S3 sample-slot issuance and ledger",
    "S4 real-use or delivery observation",
    "S5 public challenge and negative evidence",
    "Broad external organization pilot"
  ]) {
    assert.match(matrix, new RegExp(escapeRegExp(phrase)));
  }
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

