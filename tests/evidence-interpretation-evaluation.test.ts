import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exampleDir = join(repoRoot, "examples", "evidence-interpretation-adversarial");

test("adversarial evidence interpretation design is package-facing and indexed", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const docsIndex = readFileSync(join(repoRoot, "DOCS_INDEX.md"), "utf8");
  const evaluation = readFileSync(join(repoRoot, "EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md"), "utf8");

  assert.equal(packageJson.files?.includes("EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md"), true);
  assert.match(docsIndex, /EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION\.md/);
  assert.match(evaluation, /valid but the evidence is weak/i);
  assert.match(evaluation, /Hard Failures/);
  assert.match(evaluation, /not yet implemented/i);
});

test("first scenario separates valid identity from insufficient product support", () => {
  const scenario = JSON.parse(readFileSync(join(exampleDir, "manufacturing-signed-weak-evidence.operator.json"), "utf8"));
  const scoring = JSON.parse(readFileSync(join(exampleDir, "scoring-key.json"), "utf8"));
  const prompt = readFileSync(join(exampleDir, "agent-task.md"), "utf8");

  assert.equal(scenario.fictional, true);
  assert.equal(scenario.ground_truth.identity_continuity, "VERIFIED");
  assert.equal(scenario.ground_truth.package_integrity, "PASS");
  assert.equal(scenario.ground_truth.claim_support, "INSUFFICIENT");
  assert.equal(scenario.evidence.find((item: { s_class: string }) => item.s_class === "S2")?.directly_supports_10000_hours, false);
  assert.equal(scenario.s3.status, "ABSENT");
  assert.equal(scoring.dimensions.reduce((sum: number, item: { points: number }) => sum + item.points, 0), 100);
  assert.ok(scoring.hard_failures.length >= 5);
  assert.match(prompt, /Do not treat valid identity, signatures, hashes, or package structure as proof/);
  assert.doesNotMatch(prompt, /800-hour internal prototype test/);
  assert.doesNotMatch(prompt, /Dimensions and material composition/);
});
