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
    assert.equal(claim.protocol_support_level, "L0_UNSUPPORTED");
    assert.equal(claim.policy_route, "REQUEST_VALUE_EVIDENCE");
    assert.equal(claim.organchor_trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
    assert.ok(claim.risk_gaps.some((gap) => gap.includes("Evidence reference is missing")));
    assert.ok(claim.next_best_actions.some((action) => action.includes("Link at least one hash-bound evidence")));
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
    assert.equal(claim.protocol_support_level, "L3_REPRODUCIBLE_METHOD");
    assert.equal(claim.policy_route, "READY_FOR_EXTERNAL_POLICY");
    assert.deepEqual(claim.risk_gaps, []);
    assert.deepEqual(claim.support_axes, {
      artifact_integrity: "HASH_DECLARED",
      retrievability: "HAS_PUBLIC_LOCATIONS",
      specificity: "SCOPED",
      limitations: "PRESENT",
      issuer_independence: "INDEPENDENT_EVIDENCE_PRESENT",
      method_reproducibility: "REPRODUCIBLE_OR_INDEPENDENT",
      freshness: "CURRENT_OR_NOT_DATED",
      challenge_status: "NO_KNOWN_CHALLENGE"
    });
    assert.equal(evidence.has_external_location, true);
    assert.equal(evidence.reproducibility, "independently_reproducible");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("value audit treats explicit recheck methods as reproducible support", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-method-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "inspection-report.md"), "# Inspection\n\nBatch inspection result.\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "inspection-report.md",
      "--id",
      "evidence-001",
      "--issuer-type",
      "third_party",
      "--uri",
      "https://example.org/evidence/inspection-report.md",
      "--location-type",
      "https",
      "--evidence-strength",
      "moderate",
      "--limitations",
      "Single batch inspection;Does not prove future batches"
    ]);
    run(workspace, [
      "evidence",
      "method",
      "add",
      "--id",
      "method-001",
      "--evidence-id",
      "evidence-001",
      "--kind",
      "public_artifact_hash_check",
      "--steps",
      "Download the public inspection report;Compute SHA-256;Compare the hash with the signed evidence manifest",
      "--expected-results",
      "The downloaded report hash equals the declared evidence hash",
      "--required-tools",
      "curl;sha256sum",
      "--cost-to-verify",
      "low",
      "--limitations",
      "This verifies the published report artifact, not the laboratory's competence"
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
    const claim = report.claims[0];
    const evidence = report.evidence[0];
    assert.ok(claim);
    assert.ok(evidence);
    assert.equal(claim.level, "REPRODUCIBLE");
    assert.equal(claim.protocol_support_level, "L3_REPRODUCIBLE_METHOD");
    assert.equal(claim.policy_route, "READY_FOR_EXTERNAL_POLICY");
    assert.deepEqual(claim.risk_gaps, []);
    assert.equal(evidence.has_recheck_method, true);
    assert.equal(evidence.has_low_cost_recheck_method, true);
    assert.deepEqual(evidence.resolved_method_refs, ["method-001"]);
    assert.deepEqual(evidence.method_kinds, ["public_artifact_hash_check"]);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("value audit classifies S2 third-party material and exposes low-friction gaps", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-s2-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "certificate.pdf"), "example certificate bytes\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "certificate.pdf",
      "--id",
      "evidence-001",
      "--issuer-type",
      "third_party",
      "--media-type",
      "application/pdf",
      "--uri",
      "https://example.org/evidence/certificate.pdf",
      "--location-type",
      "https",
      "--limitations",
      "Certificate scope still requires buyer policy review"
    ]);
    patchEvidence(workspace, {
      s_class: "S2_THIRD_PARTY_DOCUMENTS",
      s2: {
        state: "S2_1_GENERIC_ROUTE_PROVIDED",
        material_type: "certification_record",
        issuer_name: "Example Certification Body",
        organization_claimed_support: {
          support_type: "supports_claim",
          claim_refs: ["claim-001"],
          covered_subject_type: "product_model",
          covered_subject_id: "model-x1",
          scope_text: "Organization claims this certificate supports claim-001 for model-x1.",
          limitations: ["Scope and legal sufficiency require external policy review."]
        },
        verification_route: {
          route_id: "VR-S2-002",
          route_kind: "PUBLIC_REGISTRY_CONFIRMATION",
          verification_mode: "manual_check"
        },
        external_recheck_anchor: {
          anchor_type: "public_registry_record",
          url: "https://registry.example/records/ABC-123",
          record_id: "ABC-123",
          checked_at: "2026-05-19T00:00:00Z"
        },
        health: {
          valid_until: "2027-05-19T00:00:00Z",
          last_checked_at: "2026-05-19T00:00:00Z",
          maintenance_status: "FRESH"
        },
        disclosures: {
          sample_source: "unknown",
          selected_by: "unknown",
          relationship_to_organization: "paid_certification"
        }
      }
    });

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
    assert.equal(report.s2_summary.effective_s2_count, 1);
    assert.equal(report.s2_summary.candidate_unverified_external_material_count, 0);
    assert.equal(report.s2_summary.s2_state_counts.S2_1_GENERIC_ROUTE_PROVIDED, 1);
    assert.equal(report.s2_summary.unknown_sample_source_count, 1);
    assert.equal(report.s2_summary.unknown_relationship_count, 0);
    assert.equal(report.s2_summary.manual_check_s2_count, 2);
    assert.equal(report.evidence[0]?.s2.state, "S2_1_GENERIC_ROUTE_PROVIDED");
    assert.equal(report.evidence[0]?.s2.effective, true);
    assert.deepEqual(report.evidence[0]?.s2.unresolved_claim_refs, []);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("value audit reports profile gaps for underspecified physical product claims", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-profile-gap-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "inspection-report.md"), "# Inspection\n\nBatch inspection result.\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    updateClaim(workspace, {
      claim_category: "physical_product",
      claim_scope: {
        batch_id: "B-2026-05"
      }
    });
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "inspection-report.md",
      "--id",
      "evidence-001",
      "--issuer-type",
      "third_party",
      "--uri",
      "https://example.org/evidence/inspection-report.md",
      "--location-type",
      "https",
      "--limitations",
      "Single batch inspection"
    ]);
    addMethod(workspace);

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
    const claim = report.claims[0];
    assert.ok(claim);
    assert.equal(report.summary.profile_declared_claims, 1);
    assert.equal(report.summary.profile_pass_claims, 0);
    assert.equal(report.summary.profile_gap_claims, 1);
    assert.equal(claim.status, "WARN");
    assert.equal(claim.profile_review.profile, "physical_product");
    assert.equal(claim.profile_review.status, "WARN");
    assert.deepEqual(claim.profile_review.missing_fields, ["claim_scope.test_standard", "claim_scope.sampling_method"]);
    assert.ok(claim.risk_gaps.some((gap) => gap.includes("test standard")));
    assert.ok(claim.next_best_actions.some((action) => action.includes("test_standard")));
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("value audit passes a complete SaaS API profile without turning it into a trust badge", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-profile-pass-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "uptime-report.json"), "{\"uptime\":0.9994}\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    updateClaim(workspace, {
      claim_category: "saas_api",
      claim_scope: {
        metric: "monthly_uptime",
        time_window: "2026-04-01/2026-04-30",
        regions: ["iad", "fra", "sin"],
        monitoring_method: "synthetic_https_probe"
      }
    });
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "uptime-report.json",
      "--id",
      "evidence-001",
      "--issuer-type",
      "third_party",
      "--uri",
      "https://example.org/evidence/uptime-report.json",
      "--location-type",
      "https",
      "--limitations",
      "Synthetic monitoring only"
    ]);
    addMethod(workspace);

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
    const claim = report.claims[0];
    assert.ok(claim);
    assert.equal(report.summary.profile_declared_claims, 1);
    assert.equal(report.summary.profile_pass_claims, 1);
    assert.equal(report.summary.profile_gap_claims, 0);
    assert.equal(claim.profile_review.profile, "saas_api");
    assert.equal(claim.profile_review.status, "PASS");
    assert.deepEqual(claim.profile_review.missing_fields, []);
    assert.equal(claim.organchor_trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
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
  s2_summary: {
    effective_s2_count: number;
    candidate_unverified_external_material_count: number;
    s2_state_counts: Record<string, number>;
    unknown_sample_source_count: number;
    unknown_relationship_count: number;
    manual_check_s2_count: number;
  };
  claims: Array<{
    status: string;
    level: string;
    protocol_support_level: string;
    support_axes: Record<string, string>;
    risk_gaps: string[];
    next_best_actions: string[];
    organchor_trust_decision: string;
    policy_route: string;
    profile_review: {
      profile: string;
      status: string;
      missing_fields: string[];
      risk_gaps: string[];
      next_best_actions: string[];
    };
    missing_evidence_refs: string[];
  }>;
  evidence: Array<{
    has_external_location: boolean;
    reproducibility: string;
    resolved_method_refs: string[];
    method_kinds: string[];
    has_recheck_method: boolean;
    has_low_cost_recheck_method: boolean;
    s2: {
      state: string;
      effective: boolean;
      unresolved_claim_refs: string[];
    };
  }>;
} {
  return JSON.parse(readFileSync(join(workspace, "reports", "value-continuity-report.json"), "utf8"));
}

function updateClaim(workspace: string, patch: Record<string, unknown>): void {
  const claimsPath = join(workspace, "claims", "product-claims.json");
  const claims = JSON.parse(readFileSync(claimsPath, "utf8"));
  Object.assign(claims.claims[0], patch);
  writeFileSync(claimsPath, `${JSON.stringify(claims, null, 2)}\n`, "utf8");
}

function addMethod(workspace: string): void {
  run(workspace, [
    "evidence",
    "method",
    "add",
    "--id",
    "method-001",
    "--evidence-id",
    "evidence-001",
    "--kind",
    "public_artifact_hash_check",
    "--steps",
    "Download the public artifact;Compute SHA-256;Compare the hash with the signed evidence manifest",
    "--expected-results",
    "The downloaded artifact hash equals the declared evidence hash",
    "--required-tools",
    "curl;sha256sum",
    "--cost-to-verify",
    "low",
    "--limitations",
    "This verifies artifact integrity, not final product quality"
  ]);
}

function patchEvidence(workspace: string, patch: Record<string, unknown>): void {
  const evidencePath = join(workspace, "evidence", "evidence-manifest.json");
  const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
  Object.assign(evidence.evidence[0], patch);
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
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
