import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("documentation index is discoverable from README and package metadata", () => {
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as { files?: string[] };

  assert.match(readme, /PROJECT_NORTH_STAR\.md/);
  assert.match(readme, /DOCS_INDEX\.md/);
  assert.match(readme, /FIRESEED_ALPHA_PLAN\.md/);
  assert.match(readme, /CONTRIBUTING\.md/);
  assert.match(readme, /CALL_FOR_FIRESEED_REVIEW\.md/);
  assert.match(readme, /DISCOVERY_STRATEGY\.md/);
  assert.match(readme, /ORGANCHOR_BEACON\.md/);
  assert.match(readme, /DIRECTORY_MODEL\.md/);
  assert.match(readme, /DIRECTORY_SNAPSHOT_SPEC\.md/);
  assert.match(readme, /Operator-facing adoption and verification documents/);
  assert.ok(packageJson.files?.includes("PROJECT_NORTH_STAR.md"), "package.json files must include PROJECT_NORTH_STAR.md");
  assert.ok(packageJson.files?.includes("DOCS_INDEX.md"), "package.json files must include DOCS_INDEX.md");
  assert.ok(packageJson.files?.includes("FIRESEED_ALPHA_PLAN.md"), "package.json files must include FIRESEED_ALPHA_PLAN.md");
  assert.ok(packageJson.files?.includes("CONTRIBUTING.md"), "package.json files must include CONTRIBUTING.md");
  assert.ok(
    packageJson.files?.includes("CALL_FOR_FIRESEED_REVIEW.md"),
    "package.json files must include CALL_FOR_FIRESEED_REVIEW.md"
  );
  assert.ok(packageJson.files?.includes("DISCOVERY_STRATEGY.md"), "package.json files must include DISCOVERY_STRATEGY.md");
  assert.ok(packageJson.files?.includes("ORGANCHOR_BEACON.md"), "package.json files must include ORGANCHOR_BEACON.md");
  assert.ok(packageJson.files?.includes("DIRECTORY_MODEL.md"), "package.json files must include DIRECTORY_MODEL.md");
  assert.ok(packageJson.files?.includes("DIRECTORY_SNAPSHOT_SPEC.md"), "package.json files must include DIRECTORY_SNAPSHOT_SPEC.md");
});

test("documentation index names the package-facing guidance documents", () => {
  const docsIndex = readFileSync(join(repoRoot, "DOCS_INDEX.md"), "utf8");
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as { files?: string[] };

  assert.match(docsIndex, /Current Public Entry Points/);
  assert.match(docsIndex, /Discovery, Beacon, And Directory/);
  assert.match(docsIndex, /AI Agent Documents/);
  assert.match(docsIndex, /Historical Or Local Notes/);
  assert.match(docsIndex, /Current Known Gaps/);

  const packageFacingDocs = (packageJson.files ?? [])
    .filter((entry) => entry.endsWith(".md"))
    .filter((entry) => entry !== "LICENSE");

  for (const doc of packageFacingDocs) {
    assert.match(docsIndex, new RegExp(escapeRegExp(doc)), `${doc} should be listed in DOCS_INDEX.md`);
  }
});

test("current stage documents do not keep superseded self-pilot status wording", () => {
  const stalePhrases = [
    "public execution pending explicit domain",
    "pending user confirmation before implementation",
    "Pages deployment pending",
    "IPFS and Arweave remain dry-run/manual-package carriers until real CIDs or TX ids are produced"
  ];
  const files = ["PILOT_PLAN.md", "EVIDENCE_MODEL.md", "ROADMAP.md", "README.md"];

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
