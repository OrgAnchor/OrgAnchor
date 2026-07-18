import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { packageIncludes, readDocumentationMap } from "./helpers/project-layout.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("README exposes the Fireseed public entry points", () => {
  const readme = readText("README.md");

  assert.match(readme, /## Fireseed Alpha/);
  assert.match(readme, /## Fireseed Review Tracks/);
  assert.match(readme, /S1-S3 evidence baseline/);
  assert.match(readme, /S4\/S5 design preview/);
  assert.match(readme, /FIRESEED_LAUNCH_DECISION_2026-06-01\.md/);
  assert.match(readme, /FIRESEED_OUTREACH_KIT\.md/);
  assert.match(readme, /FIRESEED_READINESS_GATE\.md/);
  assert.match(readme, /CONTRIBUTING\.md/);
  assert.match(readme, /CALL_FOR_FIRESEED_REVIEW\.md/);
  assert.match(readme, /EXTERNAL_AGENT_EVALUATION_RUNBOOK\.md/);
});

test("Fireseed contributor guide keeps participation paths and safety boundaries visible", () => {
  const contributing = readText("CONTRIBUTING.md");

  for (const phrase of [
    "Adopting Organization Trial",
    "Technical Review",
    "Evidence And Governance Review",
    "External Agent Evidence Evaluation",
    "docs/operations/FIRESEED_READINESS_GATE.md",
    "Do not submit private keys",
    "Do not describe OrgAnchor compatibility as a trust badge",
    "npm run package:smoke",
    "OrgAnchor should not expand into"
  ]) {
    assert.match(contributing, new RegExp(escapeRegExp(phrase)));
  }
});

test("Fireseed public review brief does not overclaim maturity", () => {
  const call = readText("docs/outreach/CALL_FOR_FIRESEED_REVIEW.md");

  assert.match(call, /Fireseed Alpha does not claim/);
  assert.match(call, /FIRESEED_LAUNCH_DECISION_2026-06-01\.md/);
  assert.match(call, /FIRESEED_READINESS_GATE\.md/);
  assert.match(call, /Product quality certification/);
  assert.match(call, /Guaranteed truth/);
  assert.match(call, /S4\/S5 are clearly marked as design preview/);
  assert.match(call, /Fireseed Success Condition/);
});

test("GitHub issue templates route Fireseed feedback into broad and focused review paths", () => {
  const templates = [
    ".github/ISSUE_TEMPLATE/adopter-trial.yml",
    ".github/ISSUE_TEMPLATE/technical-review.yml",
    ".github/ISSUE_TEMPLATE/evidence-governance-review.yml",
    ".github/ISSUE_TEMPLATE/external-agent-evaluation.yml",
    ".github/ISSUE_TEMPLATE/config.yml"
  ];

  for (const template of templates) {
    assert.equal(existsSync(join(repoRoot, template)), true, `${template} should exist`);
  }

  assert.match(readText(".github/ISSUE_TEMPLATE/adopter-trial.yml"), /Adopter Trial \/ Fireseed/);
  assert.match(readText(".github/ISSUE_TEMPLATE/adopter-trial.yml"), /FIRESEED_READINESS_GATE\.md/);
  assert.match(readText(".github/ISSUE_TEMPLATE/technical-review.yml"), /Technical Review \/ Fireseed/);
  assert.match(readText(".github/ISSUE_TEMPLATE/technical-review.yml"), /Fireseed gate impact/);
  assert.match(readText(".github/ISSUE_TEMPLATE/evidence-governance-review.yml"), /Evidence \/ Governance Review/);
  assert.match(readText(".github/ISSUE_TEMPLATE/evidence-governance-review.yml"), /Fireseed gate impact/);
  assert.match(readText(".github/ISSUE_TEMPLATE/external-agent-evaluation.yml"), /External Agent Evaluation \/ Fireseed/);
  assert.match(readText(".github/ISSUE_TEMPLATE/external-agent-evaluation.yml"), /Uncorrected Agent JSON/);
  assert.match(readText(".github/ISSUE_TEMPLATE/config.yml"), /Fireseed Readiness Gate/);
  assert.match(readText(".github/ISSUE_TEMPLATE/config.yml"), /External Agent Evaluation Runbook/);
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

test("Fireseed outreach kit gives external reviewers concrete tasks and boundaries", () => {
  const kit = readText("docs/outreach/FIRESEED_OUTREACH_KIT.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };
  const docsIndex = readDocumentationMap(repoRoot);
  const call = readText("docs/outreach/CALL_FOR_FIRESEED_REVIEW.md");

  assert.equal(packageIncludes(packageJson.files, "docs/outreach/FIRESEED_OUTREACH_KIT.md"), true);
  assert.match(docsIndex, /FIRESEED_OUTREACH_KIT\.md/);
  assert.match(call, /FIRESEED_OUTREACH_KIT\.md/);
  assert.match(kit, /https:\/\/github\.com\/OrgAnchor\/OrgAnchor\/issues\/4/);
  assert.match(kit, /EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION\.md/);
  assert.match(kit, /distinguishes valid identity\/package integrity from insufficient claim support/i);

  const trackingIssue = readText("docs/outreach/FIRESEED_VALIDATION_TRACKING_ISSUE.md");
  assert.match(trackingIssue, /Retired Internal Calibration/);
  assert.match(trackingIssue, /no longer a Wave 1 success criterion/i);

  for (const phrase of [
    "Adopting Organization Trial",
    "Technical Review",
    "Evidence And Governance Review",
    "AI-Agent Or Directory Builder",
    "What Counts As Useful Feedback",
    "Success Criteria",
    "Failure Or Hold Criteria",
    "Copyable Short Invitation",
    "Do not claim",
    "OrgAnchor 现在处于 Fireseed Alpha 阶段"
  ]) {
    assert.match(kit, new RegExp(escapeRegExp(phrase)));
  }
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
