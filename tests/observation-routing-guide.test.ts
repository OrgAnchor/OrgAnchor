import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { packageIncludes, readDocumentationMap } from "./helpers/project-layout.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("observation routing guide is package-facing and indexed", () => {
  const guide = readText("docs/protocol/OBSERVATION_ROUTING_GUIDE.md");
  const docsIndex = readDocumentationMap(repoRoot);
  const evidenceModel = readText("docs/protocol/EVIDENCE_MODEL.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };

  assert.ok(packageIncludes(packageJson.files, "docs/protocol/OBSERVATION_ROUTING_GUIDE.md"));
  assert.match(docsIndex, /OBSERVATION_ROUTING_GUIDE\.md/);
  assert.match(evidenceModel, /OBSERVATION_ROUTING_GUIDE\.md/);
  assert.match(guide, /S3 = sample conformance/);
  assert.match(guide, /S4 = performance continuity/);
});

test("observation routing guide defines stable route values and CLI output fields", () => {
  const guide = readText("docs/protocol/OBSERVATION_ROUTING_GUIDE.md");

  for (const route of ["S3_RECOMMENDED", "S4_RECOMMENDED", "MIXED_S3_S4", "ROUTING_UNCLEAR"]) {
    assert.match(guide, new RegExp(route));
  }

  for (const field of [
    "recommended_route",
    "routing_confidence",
    "routing_reasons",
    "detected_subject_hints",
    "missing_information",
    "user_confirmation_required",
    "not_a_trust_decision"
  ]) {
    assert.match(guide, new RegExp(field));
  }
});

test("observation routing guide keeps the first example set intentionally small", () => {
  const guide = readText("docs/protocol/OBSERVATION_ROUTING_GUIDE.md");
  const exampleRows = guide
    .split("\n")
    .filter((line) => /^\| \d+ \|/.test(line));

  assert.equal(exampleRows.length, 24);
  assert.equal(exampleRows.filter((line) => line.includes("S3_RECOMMENDED")).length, 6);
  assert.equal(exampleRows.filter((line) => line.includes("S4_RECOMMENDED")).length, 6);
  assert.equal(exampleRows.filter((line) => line.includes("MIXED_S3_S4")).length, 6);
  assert.equal(exampleRows.filter((line) => line.includes("ROUTING_UNCLEAR")).length, 6);
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}
