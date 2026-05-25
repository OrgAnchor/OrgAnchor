import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const demoScript = join(repoRoot, "scripts", "agent-discovery-demo.mjs");

test("agent discovery demo runs the local sweep-index-query-verify loop", () => {
  const result = spawnSync(process.execPath, [demoScript, "--cleanup"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(
    result.status,
    0,
    `demo failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  assert.match(result.stdout, /Agent discovery demo PASS/);
  assert.match(result.stdout, /OrgAnchorAgentDiscoveryDemoSummary/);
  assert.match(result.stdout, /beacon-query-result\.json/);
  assert.match(result.stdout, /compact-verify\.json/);
  assert.match(result.stdout, /"compact_identity_status": "PASS"/);
});
