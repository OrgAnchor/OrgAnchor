import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("adoption status summarizes a local adoption workspace without making trust claims", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-adoption-status-"));
  try {
    createAdoptionWorkspace(workspace);
    const status = run(workspace, [
      "adoption",
      "status",
      "--verify-dir",
      "public/verify",
      "--public-root",
      "public",
      "--origin",
      "https://example.org",
      "--level",
      "3",
      "--generated-at",
      "2026-05-24T00:00:00.000Z",
      "--out",
      "ADOPTION_STATUS.md",
      "--json",
      "reports/adoption-status-report.json"
    ]);
    const summary = JSON.parse(status.stdout);
    assert.equal(summary.type, "OrgAnchorAdoptionStatusSummary");
    assert.equal(summary.status, "READY");
    assert.equal(summary.identity_status, "PASS");
    assert.equal(summary.known_gap_count, 0);
    assert.equal(existsSync(join(workspace, "ADOPTION_STATUS.md")), true);
    assert.equal(existsSync(join(workspace, "reports", "adoption-status-report.json")), true);

    const report = JSON.parse(readFileSync(join(workspace, "reports", "adoption-status-report.json"), "utf8"));
    assert.equal(report.type, "OrgAnchorAdoptionStatusReport");
    assert.equal(report.trust_boundary.adoption_status_is_trust_decision, false);
    assert.equal(report.trust_boundary.identity_root, "ROOT_AUTHORITY");
    assert.equal(report.identity.status, "PASS");
    assert.match(report.identity.root_authority_hash, /^sha256:[0-9a-f]{64}$/);
    assert.equal(report.value_evidence.status, "PASS");
    assert.equal(report.carriers.status, "PRESENT");
    assert.deepEqual(report.carriers.providers, ["ipfs-dry-run"]);
    assert.equal(report.domain_audit.status, "PASS");
    assert.equal(report.discovery.beacon, "PRESENT");
    assert.equal(report.discovery.robots, "PRESENT");
    assert.equal(report.discovery.sitemap, "PRESENT");
    assert.equal(report.known_gaps.length, 0);

    const markdown = readFileSync(join(workspace, "ADOPTION_STATUS.md"), "utf8");
    assert.match(markdown, /Status: READY/);
    assert.match(markdown, /This adoption status report is not a trust decision/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("adoption status reports needs-work when selected level requirements are missing", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-adoption-status-gaps-"));
  try {
    createMinimalWorkspace(workspace);
    const status = run(workspace, [
      "adoption",
      "status",
      "--verify-dir",
      "public/verify",
      "--public-root",
      "public",
      "--origin",
      "https://example.org",
      "--level",
      "3",
      "--generated-at",
      "2026-05-24T00:00:00.000Z"
    ]);
    const summary = JSON.parse(status.stdout);
    assert.equal(summary.status, "NEEDS_WORK");
    assert.equal(summary.identity_status, "PASS");
    assert.equal(summary.known_gap_count > 0, true);
    const report = JSON.parse(readFileSync(join(workspace, "reports", "adoption-status-report.json"), "utf8"));
    assert.equal(report.known_gaps.some((gap: string) => gap.includes("No IPFS")), true);
    assert.equal(report.known_gaps.some((gap: string) => gap.includes("Domain audit")), true);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createAdoptionWorkspace(workspace: string): void {
  createMinimalWorkspace(workspace);
  writeFileSync(
    join(workspace, "organchor.lock.json"),
    JSON.stringify({
      type: "OrgAnchorLockfile",
      version: "1.0",
      artifacts: {
        "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": {
          kind: "verify-directory",
          receipts: [
            {
              provider: "ipfs-dry-run",
              action: "mirror.ipfs.publish",
              status: "DRY_RUN",
              recorded_at: "2026-05-24T00:00:00.000Z",
              receipt: {
                mode: "dry-run"
              }
            }
          ]
        }
      }
    }, null, 2),
    "utf8"
  );
  writeFileSync(
    join(workspace, "reports", "domain-security-report.json"),
    JSON.stringify({
      type: "OrgAnchorDomainSecurityReport",
      domain: "example.org",
      summary: {
        PASS: 12,
        WARN: 0,
        FAIL: 0,
        MANUAL_CHECK_REQUIRED: 0
      },
      checks: []
    }, null, 2),
    "utf8"
  );
}

function createMinimalWorkspace(workspace: string): void {
  writeFileSync(join(workspace, "README.md"), "# Evidence\n\nUseful public evidence.\n", "utf8");
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "root-2026"]);
  run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
  run(workspace, ["statement", "create", "--config", "organchor.config.json", "--authority", "root-authority.json"]);
  run(workspace, [
    "statement",
    "sign",
    "--key",
    "keys/root-2026.private.json",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json"
  ]);
  run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
  run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
  run(workspace, [
    "evidence",
    "add",
    "--file",
    "README.md",
    "--id",
    "evidence-001",
    "--uri",
    "https://example.org/evidence/README.md",
    "--location-type",
    "https",
    "--reproducibility",
    "independently_reproducible",
    "--evidence-strength",
    "moderate"
  ]);
  run(workspace, ["claims", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);
  run(workspace, ["evidence", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);
  run(workspace, [
    "value",
    "audit",
    "--claims",
    "claims/product-claims.json",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--check-files"
  ]);
  run(workspace, [
    "page",
    "generate",
    "--statement",
    "statements/official-endpoints.json",
    "--sig",
    "statements/official-endpoints.json.sig",
    "--authority",
    "root-authority.json",
    "--claims",
    "claims/product-claims.json",
    "--claims-sig",
    "claims/product-claims.json.sig",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--evidence-sig",
    "evidence/evidence-manifest.json.sig",
    "--value-report",
    "reports/value-continuity-report.json",
    "--value-report-md",
    "reports/value-continuity-report.md",
    "--out",
    "public/verify"
  ]);
}

function run(workspace: string, args: string[], expectedStatus = 0): { stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: workspace,
    encoding: "utf8"
  });
  assert.equal(
    result.status,
    expectedStatus,
    `organchor ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}
