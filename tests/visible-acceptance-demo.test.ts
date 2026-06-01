import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const demoScript = join(repoRoot, "scripts", "visible-acceptance-demo.mjs");

test("visible acceptance demo proves human page, agent result, and tamper failure", () => {
  const result = spawnSync(process.execPath, [demoScript, "--cleanup"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(
    result.status,
    0,
    `visible acceptance demo failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  assert.match(result.stdout, /Visible acceptance demo PASS/);
  assert.match(result.stdout, /OrgAnchorVisibleAcceptanceDemoSummary/);
  assert.match(result.stdout, /"status": "PASS"/);
  assert.match(result.stdout, /"overall_status": "PASS"/);
  assert.match(result.stdout, /"identity_status": "PASS"/);
  assert.match(result.stdout, /"policy_route": "STOP_IDENTITY_FAILURE"/);
  assert.match(result.stdout, /Key Terms/);
  assert.match(result.stdout, /tamper-compact-verify\.json/);
});

test("visible acceptance guide is package-facing and explains boundaries", () => {
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
  const docsIndex = readFileSync(join(repoRoot, "DOCS_INDEX.md"), "utf8");
  const guide = readFileSync(join(repoRoot, "VISIBLE_ACCEPTANCE.md"), "utf8");
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8")) as {
    files?: string[];
    scripts?: Record<string, string>;
  };

  assert.match(readme, /VISIBLE_ACCEPTANCE\.md/);
  assert.match(docsIndex, /VISIBLE_ACCEPTANCE\.md/);
  assert.equal(packageJson.files?.includes("VISIBLE_ACCEPTANCE.md"), true);
  assert.equal(packageJson.files?.includes("scripts/visible-acceptance-demo.mjs"), true);
  assert.equal(packageJson.scripts?.["visible:demo"], "node scripts/visible-acceptance-demo.mjs");

  for (const phrase of [
    "可见验收不是信任根",
    "npm run visible:demo",
    "Agent Verification View",
    "organchor verify url <origin> --compact",
    "STOP_IDENTITY_FAILURE",
    "OrgAnchor 官方为该组织背书"
  ]) {
    assert.match(guide, new RegExp(escapeRegExp(phrase)));
  }
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
