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
  assert.ok(packageJson.files?.includes("FIRESEED_LAUNCH_DECISION_2026-06-01.md"));
  assert.ok(packageJson.files?.includes("FIRESEED_READINESS_GATE.md"));
  assert.match(docsIndex, /FIRESEED_ALPHA_PLAN\.md/);
  assert.match(docsIndex, /FIRESEED_LAUNCH_DECISION_2026-06-01\.md/);
  assert.match(docsIndex, /FIRESEED_READINESS_GATE\.md/);
  assert.match(status, /FIRESEED_ALPHA_PLAN\.md/);
  assert.match(status, /FIRESEED_LAUNCH_DECISION_2026-06-01\.md/);
  assert.match(status, /FIRESEED_READINESS_GATE\.md/);
});

test("Fireseed Alpha keeps S3 as acceptance and S4/S5 as design preview", () => {
  const plan = readText("FIRESEED_ALPHA_PLAN.md");

  assert.match(plan, /S3 \| Acceptance gate/);
  assert.match(plan, /S4 \| Design Preview/);
  assert.match(plan, /S5 \| Design Preview/);
  assert.match(plan, /sample-slot/);
  assert.match(plan, /raw-evidence/);
  assert.match(plan, /S3 proves the evidence layer is not merely self-assertion/);
  assert.match(plan, /S4\/S5 show the direction and invite co-design/);
  assert.match(plan, /FIRESEED_READINESS_GATE\.md/);
});

test("Fireseed readiness gate defines GO/HOLD without turning OrgAnchor into a trust authority", () => {
  const gate = readText("FIRESEED_READINESS_GATE.md");

  for (const phrase of [
    "GO",
    "HOLD",
    "LIMITED_GO",
    "S1-S3 Evidence Baseline",
    "sample_slot_id",
    "raw evidence availability status",
    "storage role",
    "S4 and S5 are Design Preview during Fireseed",
    "OrgAnchor does not certify that an organization is good"
  ]) {
    assert.match(gate, new RegExp(escapeRegExp(phrase)));
  }
});

test("Fireseed launch decision records GO scope, verification results, and accepted gaps", () => {
  const decision = readText("FIRESEED_LAUNCH_DECISION_2026-06-01.md");

  for (const phrase of [
    "Status: GO for named Fireseed outreach",
    "da1d2a5cec4538e7af805c20b8920847aedfd6ab",
    "0.1.0-alpha.3",
    "https://organchor.org/verify/",
    "overall_status: PASS",
    "conformance_status: FULL_COMPATIBLE",
    "Accepted Known Gaps",
    "S4 real-use observation remains Design Preview",
    "S5 public challenge and negative evidence remains Design Preview",
    "Adopting Organization Trial",
    "Technical Review",
    "Evidence And Governance Review",
    "This launch decision does not claim"
  ]) {
    assert.match(decision, new RegExp(escapeRegExp(phrase)));
  }
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
