import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("value audit exposes unsupported claims and missing evidence", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-missing-"));
  try {
    createAuthority(workspace);
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);

    const audit = run(workspace, [
      "value",
      "audit",
      "--claims",
      "claims/product-claims.json",
      "--evidence",
      "evidence/evidence-manifest.json",
      "--now",
      "2026-05-19T00:00:00Z"
    ]);
    assert.match(audit.stdout, /Value continuity audit complete/);
    assert.match(audit.stdout, /Self-asserted claims: 1/);
    assert.equal(existsSync(join(workspace, "reports", "value-continuity-report.json")), true);
    assert.equal(existsSync(join(workspace, "reports", "value-continuity-report.md")), true);

    const report = readReport(workspace);
    assert.equal(report.summary.unsupported_claims, 1);
    assert.equal(report.summary.FAIL, 1);
    const claim = report.claims[0];
    assert.ok(claim);
    assert.equal(claim.level, "SELF_ASSERTED");
    assert.deepEqual(claim.missing_evidence_refs, ["evidence-001"]);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("value audit recognizes external reproducible evidence and local hash checks", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-evidence-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "benchmark.md"), "# Benchmark\n\nReproducible method.\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "benchmark.md",
      "--id",
      "evidence-001",
      "--issuer-type",
      "third_party",
      "--uri",
      "https://example.org/evidence/benchmark.md",
      "--location-type",
      "https",
      "--reproducibility",
      "independently_reproducible",
      "--evidence-strength",
      "moderate",
      "--valid-until",
      "2027-01-01T00:00:00Z",
      "--limitations",
      "Synthetic benchmark;Does not prove all real-world performance"
    ]);

    run(workspace, [
      "value",
      "audit",
      "--claims",
      "claims/product-claims.json",
      "--evidence",
      "evidence/evidence-manifest.json",
      "--check-files",
      "--now",
      "2026-05-19T00:00:00Z"
    ]);

    const report = readReport(workspace);
    assert.equal(report.summary.FAIL, 0);
    assert.equal(report.summary.unsupported_claims, 0);
    assert.equal(report.summary.evidence_linked_claims, 1);
    assert.equal(report.summary.third_party_claims, 1);
    assert.equal(report.summary.reproducible_claims, 1);
    const claim = report.claims[0];
    const evidence = report.evidence[0];
    assert.ok(claim);
    assert.ok(evidence);
    assert.equal(claim.level, "REPRODUCIBLE");
    assert.equal(evidence.has_external_location, true);
    assert.equal(evidence.reproducibility, "independently_reproducible");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createAuthority(workspace: string): void {
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "root-2026"]);
  run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
}

function readReport(workspace: string): {
  summary: Record<string, number>;
  claims: Array<{ level: string; missing_evidence_refs: string[] }>;
  evidence: Array<{ has_external_location: boolean; reproducibility: string }>;
} {
  return JSON.parse(readFileSync(join(workspace, "reports", "value-continuity-report.json"), "utf8"));
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
