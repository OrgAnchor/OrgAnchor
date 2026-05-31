import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");
const rawBundleHash = `sha256:${"a".repeat(64)}`;

test("S4 template and attach create auditable real-world observation metadata", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-s4-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "order-observation.md"), "# Order observation\n\n18 orders, 17 on time.\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "order-observation.md",
      "--id",
      "evidence-001",
      "--subject-type",
      "product_family",
      "--subject-id",
      "model-x1",
      "--issuer-type",
      "third_party",
      "--uri",
      "https://example.org/evidence/order-observation.md",
      "--location-type",
      "https",
      "--limitations",
      "Observed order window only"
    ]);

    const template = run(workspace, ["evidence", "s4", "template", "--template", "order_delivery"]);
    assert.equal(JSON.parse(template.stdout).s4.observation_type, "order_delivery");

    const attach = run(workspace, [
      "evidence",
      "s4",
      "attach",
      "--evidence-id",
      "evidence-001",
      "--template",
      "order_delivery",
      "--observer-type",
      "buyer_or_buyer_agent",
      "--observer-id",
      "buyer.example",
      "--window-start",
      "2026-05-01",
      "--window-end",
      "2026-05-31",
      "--subject-type",
      "product_family",
      "--subject-id",
      "model-x1",
      "--scope",
      "Observed delivery performance supports claim-001 for model-x1.",
      "--raw-bundle-hash",
      rawBundleHash,
      "--vault-uri",
      "https://vault.example/evidence/orders",
      "--order-count",
      "18",
      "--on-time-delivery-count",
      "17",
      "--delayed-delivery-count",
      "1",
      "--quality-issue-count",
      "0",
      "--region",
      "EU",
      "--channel",
      "direct",
      "--checked-at",
      "2026-05-31T00:00:00Z"
    ]);
    assert.match(attach.stdout, /Attached S4 metadata to evidence: evidence-001/);

    const manifest = JSON.parse(readFileSync(join(workspace, "evidence", "evidence-manifest.json"), "utf8"));
    assert.equal(manifest.evidence[0].s_class, "S4_REAL_WORLD_OBSERVATION");
    assert.equal(manifest.evidence[0].s4.subject.subject_id, "model-x1");
    assert.equal(manifest.evidence[0].s4.metric_summary.order_count, 18);

    run(workspace, [
      "value",
      "audit",
      "--claims",
      "claims/product-claims.json",
      "--evidence",
      "evidence/evidence-manifest.json",
      "--check-files",
      "--now",
      "2026-05-31T00:00:00Z"
    ]);

    const report = JSON.parse(readFileSync(join(workspace, "reports", "value-continuity-report.json"), "utf8"));
    assert.equal(report.s4_summary.effective_s4_count, 1);
    assert.equal(report.s4_summary.candidate_unverified_observation_count, 0);
    assert.equal(report.s4_summary.s4_state_counts.S4_1_OBSERVATION_SUMMARY_PROVIDED, 1);
    assert.equal(report.s4_summary.current_window_observation_count, 1);
    assert.equal(report.s4_summary.raw_bundle_available_count, 1);
    assert.equal(report.evidence[0].s4.state, "S4_1_OBSERVATION_SUMMARY_PROVIDED");
    assert.equal(report.evidence[0].s4.effective, true);
    assert.equal(report.evidence[0].s4.metric_type, "order_delivery_performance");
    assert.deepEqual(report.evidence[0].s4.unresolved_claim_refs, []);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("S4 attach requires a raw bundle hash and vault URI", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-s4-invalid-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "order-observation.md"), "# Order observation\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "add", "--file", "order-observation.md", "--id", "evidence-001"]);

    const result = run(
      workspace,
      [
        "evidence",
        "s4",
        "attach",
        "--evidence-id",
        "evidence-001",
        "--observer-id",
        "buyer.example",
        "--window-start",
        "2026-05-01",
        "--window-end",
        "2026-05-31",
        "--subject-type",
        "product_family",
        "--subject-id",
        "model-x1",
        "--scope",
        "Observed delivery performance supports claim-001."
      ],
      1
    );
    assert.match(result.stderr, /--raw-bundle-hash is required/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createAuthority(workspace: string): void {
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "root-2026"]);
  run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
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
