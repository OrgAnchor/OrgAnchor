import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const publicLaunchDocs = [
  "PUBLIC_EXPLAINER.md",
  "FIRESEED_DECK_OUTLINE.md",
  "VIDEO_SCRIPT_90S.md",
  "VIDEO_SCRIPT_DEMO.md",
  "SPONSOR_LETTER.md"
];

test("README exposes public launch prep entry points without hiding alpha status", () => {
  const readme = readText("README.md");
  const packageJson = JSON.parse(readText("package.json")) as { name: string };

  assert.match(readme, /## 3-Minute Version/);
  assert.match(readme, /not a trust badge/i);
  assert.match(readme, /not stable v1/i);
  assert.match(readme, /NOT_ASSIGNED_BY_ORGANCHOR/);
  assert.match(readme, /npm run agent:demo/);
  assert.match(readme, /npm run visible:demo/);
  assert.match(readme, new RegExp(`npm install -g ${escapeRegExp(packageJson.name)}@alpha`));

  for (const doc of publicLaunchDocs) {
    assert.match(readme, new RegExp(escapeRegExp(doc)), `${doc} should be linked from README`);
  }
});

test("public launch prep docs are indexed and packaged", () => {
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };

  for (const doc of publicLaunchDocs) {
    assert.match(docsIndex, new RegExp(escapeRegExp(doc)), `${doc} should be listed in DOCS_INDEX.md`);
    assert.equal(packageJson.files?.includes(doc), true, `${doc} should be included in package.json files`);
  }
});

test("public launch prep docs preserve the Fireseed boundary", () => {
  const combined = publicLaunchDocs.map((doc) => readText(doc)).join("\n\n");

  for (const phrase of [
    "Fireseed Alpha",
    "not stable v1",
    "not a trust badge",
    "not a marketplace",
    "not a certification authority",
    "NOT_ASSIGNED_BY_ORGANCHOR",
    "S1-S3",
    "S4/S5"
  ]) {
    assert.match(combined, new RegExp(escapeRegExp(phrase), "i"));
  }
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
