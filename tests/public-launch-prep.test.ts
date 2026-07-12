import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const sourceRepoPublicDocs = [
  "PUBLIC_EXPLAINER.md",
  "PUBLIC_RELEASE_CHECKLIST.md",
  "FIRESEED_OUTREACH_KIT.md",
  "FIRESEED_VALIDATION_TRACKING_ISSUE.md"
];

const offRepoPublicationMaterials = [
  "OUTREACH_PLAN.md",
  "FIRESEED_DECK_OUTLINE.md",
  "VIDEO_SCRIPT_SHORT.md",
  "VIDEO_SCRIPT_90S.md",
  "VIDEO_SCRIPT_DEMO.md",
  "VIDEO_SCRIPT_DEEP_DIVE.md",
  "PUBLIC_FEEDBACK_CHAIN_PLAN.md",
  "PUBLIC_POSTS_FIRESEED_WAVE_1.md",
  "PUBLIC_VIDEO_90S_RELEASE_PACK.md",
  "SPONSOR_LETTER.md"
];

test("README exposes public source-repository entry points without hiding alpha status", () => {
  const readme = readText("README.md");
  const packageJson = JSON.parse(readText("package.json")) as { name: string };

  assert.match(readme, /## 3-Minute Version/);
  assert.match(readme, /not a trust badge/i);
  assert.match(readme, /not stable v1/i);
  assert.match(readme, /NOT_ASSIGNED_BY_ORGANCHOR/);
  assert.match(readme, /npm run agent:demo/);
  assert.match(readme, /npm run visible:demo/);
  assert.match(readme, new RegExp(`npm install -g ${escapeRegExp(packageJson.name)}@alpha`));

  for (const doc of sourceRepoPublicDocs) {
    assert.match(readme, new RegExp(escapeRegExp(doc)), `${doc} should be linked from README`);
  }
});

test("source-repository public docs are indexed and packaged", () => {
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };

  for (const doc of sourceRepoPublicDocs) {
    assert.match(docsIndex, new RegExp(escapeRegExp(doc)), `${doc} should be listed in DOCS_INDEX.md`);
    assert.equal(packageJson.files?.includes(doc), true, `${doc} should be included in package.json files`);
    assert.equal(existsSync(join(repoRoot, doc)), true, `${doc} should exist in the source repository`);
  }
});

test("publication production materials stay outside the source repository and npm package", () => {
  const readme = readText("README.md");
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };

  for (const doc of offRepoPublicationMaterials) {
    assert.equal(existsSync(join(repoRoot, doc)), false, `${doc} should not exist in the source repository`);
    assert.doesNotMatch(readme, new RegExp(escapeRegExp(doc)), `${doc} should not be linked from README`);
    assert.doesNotMatch(docsIndex, new RegExp(escapeRegExp(doc)), `${doc} should not be listed in DOCS_INDEX.md`);
    assert.equal(packageJson.files?.includes(doc), false, `${doc} should not be included in package.json files`);
  }

  assert.equal(existsSync(join(repoRoot, "public-assets", "video-90s")), false);
  assert.equal(existsSync(join(repoRoot, "scripts", "render-90s-video.mjs")), false);
  assert.equal(existsSync(join(repoRoot, "scripts", "synthesize-90s-voice.ps1")), false);
  assert.equal(packageJson.files?.includes("public-assets/"), false);
});

test("design rationale is public, packaged, and aligned with the core loop", () => {
  const readme = readText("README.md");
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };
  const rationale = readText("DESIGN_RATIONALE.md");

  assert.match(readme, /DESIGN_RATIONALE\.md/);
  assert.match(docsIndex, /DESIGN_RATIONALE\.md/);
  assert.equal(packageJson.files?.includes("DESIGN_RATIONALE.md"), true);

  for (const phrase of [
    "core goal -> required properties -> design mechanisms -> expected effects -> limits",
    "discover -> verify identity -> inspect evidence -> expose gaps -> screen commercial fit -> external decision",
    "final trust decision remains external",
    "The lockfile is not the identity root",
    "Directory builders can reduce search cost while remaining replaceable"
  ]) {
    assert.match(rationale, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("source-repository public docs preserve the Fireseed boundary", () => {
  const combined = sourceRepoPublicDocs.map((doc) => readText(doc)).join("\n\n");

  for (const phrase of [
    "Fireseed Alpha",
    "not stable v1",
    "not a trust badge",
    "not a marketplace",
    "not a certification authority",
    "NOT_ASSIGNED_BY_ORGANCHOR",
    "S1-S3",
    "S4/S5",
    "Fireseed Alpha External Validation Wave 1"
  ]) {
    assert.match(combined, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("public explainer exposes commercial fit without turning OrgAnchor into a marketplace", () => {
  const explainer = readText("PUBLIC_EXPLAINER.md");

  for (const phrase of [
    "Commercial Fit Without Becoming A Marketplace",
    "price disclosure mode",
    "signed private quote paths",
    "minimum order quantity",
    "OrgAnchor does not force every organization to publish prices",
    "It also does not decide which supplier is best"
  ]) {
    assert.match(explainer, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("public release checklist defines owner gates and hold criteria", () => {
  const checklist = readText("PUBLIC_RELEASE_CHECKLIST.md");

  for (const phrase of [
    "Local Verification Gate",
    "Public Self-Pilot Gate",
    "Public Asset Gate",
    "Human-Owner Intervention Gates",
    "Recommended Publishing Order",
    "Hold Criteria",
    "OrgAnchor's trust decision remains NOT_ASSIGNED_BY_ORGANCHOR",
    "Sponsorship does not buy ranking",
    "publishing videos or public posts",
    "claiming a public launch wave has succeeded"
  ]) {
    assert.match(checklist, new RegExp(escapeRegExp(phrase), "i"));
  }
});

test("source-repository public docs do not contain common mojibake markers", () => {
  const combined = sourceRepoPublicDocs.map((doc) => readText(doc)).join("\n\n");

  for (const marker of [
    "娑擃厽",
    "閸氼偂",
    "閵",
    "閿",
    "閻",
    "缁",
    "閳",
    "????"
  ]) {
    assert.equal(combined.includes(marker), false, `public source docs contain likely mojibake marker: ${marker}`);
  }
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
