import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("S3 intake and slot model is package-facing and indexed", () => {
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };
  const s3Model = readText("S3_RANDOM_SAMPLING_MODEL.md");

  assert.ok(packageJson.files?.includes("S3_INTAKE_AND_SLOT_MODEL.md"));
  assert.match(docsIndex, /S3_INTAKE_AND_SLOT_MODEL\.md/);
  assert.match(s3Model, /S3_INTAKE_AND_SLOT_MODEL\.md/);
});

test("S3 intake model preserves anti-brushing and storage admission boundaries", () => {
  const model = readText("S3_INTAKE_AND_SLOT_MODEL.md");

  for (const phrase of [
    "Open reporting is cheap",
    "Effective S3 is slot-gated",
    "Raw storage is admission-gated",
    "Fireseed S3 Gate Matrix",
    "Who submits?",
    "Where is it stored?",
    "What is required?",
    "What does it mean?",
    "sample_slot_id",
    "sample_nullifier",
    "max_active_samples",
    "ORGANIZATION_CONTROLLED",
    "DIRECTORY_VAULT",
    "PUBLIC_INTEREST_ARCHIVE",
    "candidate signal",
    "not_a_trust_decision"
  ]) {
    assert.match(model, new RegExp(escapeRegExp(phrase)));
  }
});

test("S3 intake model states current tooling gaps explicitly", () => {
  const model = readText("S3_INTAKE_AND_SLOT_MODEL.md");

  for (const gap of [
    "sample slot issuance",
    "sample slot verification",
    "slot-use ledger",
    "raw-vault admission workflow",
    "near-duplicate media detection"
  ]) {
    assert.match(model, new RegExp(escapeRegExp(gap)));
  }
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
