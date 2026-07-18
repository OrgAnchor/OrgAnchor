import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { packageIncludes, readDocumentationMap } from "./helpers/project-layout.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("commercial fit layer is package-facing and indexed", () => {
  const docsIndex = readDocumentationMap(repoRoot);
  const readme = readText("README.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };
  const matrix = readText("docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md");

  assert.match(docsIndex, /COMMERCIAL_FIT_LAYER\.md/);
  assert.match(readme, /COMMERCIAL_FIT_LAYER\.md/);
  assert.ok(packageIncludes(packageJson.files, "docs/protocol/COMMERCIAL_FIT_LAYER.md"));
  assert.match(matrix, /Commercial fit layer/);
  assert.match(matrix, /DESIGN_ONLY/);
});

test("commercial fit layer reduces transaction cost without becoming a marketplace", () => {
  const model = readText("docs/protocol/COMMERCIAL_FIT_LAYER.md");

  for (const phrase of [
    "lower transaction cost",
    "not implemented as CLI commands",
    "PRICE_NOT_DISCLOSED",
    "PRICE_BAND_DISCLOSED",
    "PUBLIC_PRICE_SHEET",
    "SIGNED_PRIVATE_QUOTE",
    "PRICE_STALE_OR_EXPIRED",
    "private signed quote",
    "delegated commercial key",
    "not a price recommendation",
    "not force universal price disclosure",
    "not a marketplace"
  ]) {
    assert.match(model, new RegExp(escapeRegExp(phrase)));
  }
});

test("north star includes commercial screening but keeps final decisions external", () => {
  const northStar = readText("docs/project/PROJECT_NORTH_STAR.md");

  assert.match(northStar, /commercial-fit constraints/);
  assert.match(northStar, /commercial-screening cost/);
  assert.match(northStar, /this price is fair/);
  assert.match(northStar, /Commercial fit is not a price recommendation/);
  assert.match(northStar, /let the external party or agent decide/);
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
