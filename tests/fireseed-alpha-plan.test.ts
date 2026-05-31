import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("Fireseed Alpha plan is package-facing and indexed", () => {
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };
  const status = readText("IMPLEMENTATION_STATUS.md");

  assert.ok(packageJson.files?.includes("FIRESEED_ALPHA_PLAN.md"));
  assert.match(docsIndex, /FIRESEED_ALPHA_PLAN\.md/);
  assert.match(status, /FIRESEED_ALPHA_PLAN\.md/);
});

test("Fireseed Alpha keeps S3 as acceptance and S4/S5 as design preview", () => {
  const plan = readText("FIRESEED_ALPHA_PLAN.md");

  assert.match(plan, /S3 \| Acceptance gate/);
  assert.match(plan, /S4 \| Design Preview/);
  assert.match(plan, /S5 \| Design Preview/);
  assert.match(plan, /S3 proves the evidence layer is not merely self-assertion/);
  assert.match(plan, /S4\/S5 show the direction and invite co-design/);
});

test("Fireseed Freeze prevents infinite scope expansion before public collaboration", () => {
  const plan = readText("FIRESEED_ALPHA_PLAN.md");

  for (const phrase of [
    "do not expand S4/S5 into new large engineering tracks",
    "do not build a hosted marketplace",
    "do not claim official directory authority",
    "do not present unfinished governance as product maturity"
  ]) {
    assert.match(plan, new RegExp(escapeRegExp(phrase)));
  }
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

