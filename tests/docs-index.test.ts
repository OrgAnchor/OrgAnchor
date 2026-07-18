import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { packageIncludes, readDocumentationMap } from "./helpers/project-layout.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("documentation index is discoverable from README and package metadata", () => {
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
  const docsMap = readDocumentationMap(repoRoot);
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as { files?: string[] };

  assert.match(readme, /PROJECT_NORTH_STAR\.md/);
  assert.match(readme, /DOCS_INDEX\.md/);
  assert.match(readme, /CONTRIBUTING\.md/);
  assert.match(readme, /docs\/history\//);

  for (const doc of [
    "AI_OPERATING_MODEL.md",
    "FIRESEED_ALPHA_PLAN.md",
    "FIRESEED_LAUNCH_DECISION_2026-06-01.md",
    "FIRESEED_READINESS_GATE.md",
    "CALL_FOR_FIRESEED_REVIEW.md",
    "DISCOVERY_STRATEGY.md",
    "ORGANCHOR_BEACON.md",
    "DIRECTORY_MODEL.md",
    "DIRECTORY_SNAPSHOT_SPEC.md"
  ]) {
    assert.match(docsMap, new RegExp(escapeRegExp(doc)), `${doc} should be reachable through the two-level map`);
  }
  for (const doc of [
    "docs/project/PROJECT_NORTH_STAR.md",
    "docs/project/AI_OPERATING_MODEL.md",
    "DOCS_INDEX.md",
    "docs/operations/FIRESEED_ALPHA_PLAN.md",
    "docs/operations/FIRESEED_READINESS_GATE.md",
    "CONTRIBUTING.md",
    "docs/outreach/CALL_FOR_FIRESEED_REVIEW.md",
    "docs/protocol/DISCOVERY_STRATEGY.md",
    "docs/protocol/ORGANCHOR_BEACON.md",
    "docs/protocol/DIRECTORY_MODEL.md",
    "docs/protocol/DIRECTORY_SNAPSHOT_SPEC.md"
  ]) {
    assert.ok(packageIncludes(packageJson.files, doc), `${doc} must be included in the npm package`);
  }

  assert.equal(
    packageIncludes(packageJson.files, "docs/history/FIRESEED_LAUNCH_DECISION_2026-06-01.md"),
    false,
    "historical records must stay in the repository but out of the npm package"
  );
});

test("documentation map separates current areas from historical records", () => {
  const rootIndex = readFileSync(join(repoRoot, "DOCS_INDEX.md"), "utf8");
  const docsMap = readDocumentationMap(repoRoot);

  for (const area of [
    "Project design and state",
    "Protocol and data models",
    "Adoption and operator guides",
    "Release and project operations",
    "Evaluations and audits",
    "Public explanation and outreach",
    "Historical records"
  ]) {
    assert.match(rootIndex, new RegExp(escapeRegExp(area)));
  }

  for (const doc of [
    "AI_OPERATING_MODEL.md",
    "ORGANCHOR_BEACON.md",
    "AGENT_VERIFICATION_CONTRACT.md",
    "FIRESEED_READINESS_GATE.md",
    "IMPLEMENTATION_STATUS.md",
    "FIRESEED_LAUNCH_DECISION_2026-06-01.md"
  ]) {
    assert.match(docsMap, new RegExp(escapeRegExp(doc)), `${doc} should be present in the two-level documentation map`);
  }
});

test("AI operating model defines execution authority and owner decision gates", () => {
  const docsIndex = readDocumentationMap(repoRoot);
  const model = readFileSync(join(repoRoot, "docs/project/AI_OPERATING_MODEL.md"), "utf8");

  assert.match(docsIndex, /AI_OPERATING_MODEL\.md/);

  for (const phrase of [
    "human project owner plus AI execution lead model",
    "Default Execution Authority",
    "Required Owner Decision Gates",
    "public posting, paid actions, account changes, permission expansion, or final release publication",
    "If a decision is ambiguous and could affect public trust, security, money, law, or project values",
    "docs/project/PROJECT_NORTH_STAR.md",
    "docs/operations/FIRESEED_READINESS_GATE.md",
    "The current priority is Fireseed Alpha external validation",
    "It is not part of the OrgAnchor verification protocol"
  ]) {
    assert.match(model, new RegExp(escapeRegExp(phrase)));
  }
});

test("current stage documents do not keep superseded self-pilot status wording", () => {
  const stalePhrases = [
    "public execution pending explicit domain",
    "pending user confirmation before implementation",
    "Pages deployment pending",
    "IPFS and Arweave remain dry-run/manual-package carriers until real CIDs or TX ids are produced"
  ];
  const files = ["docs/operations/PILOT_PLAN.md", "docs/protocol/EVIDENCE_MODEL.md", "docs/project/ROADMAP.md", "README.md"];

  for (const file of files) {
    const text = readFileSync(join(repoRoot, file), "utf8");
    for (const phrase of stalePhrases) {
      assert.equal(text.includes(phrase), false, `${file} still contains stale phrase: ${phrase}`);
    }
  }
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
