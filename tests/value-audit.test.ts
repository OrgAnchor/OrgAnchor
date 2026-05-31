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
      "--subject-type",
      "product",
      "--subject-id",
      "primary-product",
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
      "--subject-type",
      "product",
      "--subject-id",
      "primary-product",
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
      "--subject-type",
      "product",
      "--subject-id",
      "primary-product",
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
    const template = run(workspace, ["evidence", "s2", "template", "--template", "certification_record"]);
    assert.equal(JSON.parse(template.stdout).s2.material_type, "certification_record");
    const attach = run(workspace, [
      "evidence",
      "s2",
      "attach",
      "--evidence-id",
      "evidence-001",
      "--template",
      "certification_record",
      "--issuer-name",
      "Example Certification Body",
      "--anchor-url",
      "https://registry.example/records/ABC-123",
      "--anchor-record-id",
      "ABC-123",
      "--scope",
      "Organization claims this certificate supports claim-001 for model-x1.",
      "--covered-subject-type",
      "product_model",
      "--covered-subject-id",
      "model-x1",
      "--checked-at",
      "2026-05-19T00:00:00Z",
      "--valid-until",
      "2027-05-19T00:00:00Z"
    ]);
    assert.match(attach.stdout, /Attached S2 metadata to evidence: evidence-001/);

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

test("value audit classifies S3 random purchase sampling and exposes sample-control gaps", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-s3-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "random-sample-report.md"), "# Random sample report\n\nMarket purchase sample result.\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "random-sample-report.md",
      "--id",
      "evidence-001",
      "--subject-type",
      "product",
      "--subject-id",
      "primary-product",
      "--issuer-type",
      "third_party",
      "--uri",
      "https://example.org/evidence/random-sample-report.md",
      "--location-type",
      "https",
      "--limitations",
      "Single market purchase sample"
    ]);
    const template = run(workspace, ["evidence", "s3", "template", "--template", "market_purchase"]);
    const templateJson = JSON.parse(template.stdout);
    assert.equal(templateJson.s3.sample_type, "market_purchase");
    assert.equal(templateJson.s3.claim_binding.sample_pool_id, "s3-pool-claim-001-2026-05");
    assert.equal(templateJson.s3.sample_policy.replacement_policy, "NEWEST_VALID_SAMPLE_REPLACES_OLDEST_ACTIVE_SAMPLE");
    assert.equal(templateJson.s3.credential_binding.credential_verified_against_root, false);
    assert.equal(templateJson.s3.sampling_plan.organization_can_choose_samples, false);
    const attach = run(workspace, [
      "evidence",
      "s3",
      "attach",
      "--evidence-id",
      "evidence-001",
      "--template",
      "market_purchase",
      "--sampler-type",
      "buyer",
      "--sampler-name",
      "Example Buyer",
      "--acquired-at",
      "2026-05-19T00:00:00Z",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-x1",
      "--batch-id",
      "batch-2026-05",
      "--claim-version",
      "2026-05",
      "--sample-pool-id",
      "s3-pool-claim-001-2026-05",
      "--max-active-samples",
      "24",
      "--credential-hash",
      "sha256:9999999999999999999999999999999999999999999999999999999999999999",
      "--sample-nullifier",
      "sha256:8888888888888888888888888888888888888888888888888888888888888888",
      "--credential-issuer-key-id",
      "product-key-2026",
      "--credential-verified-against-root",
      "--selector-control",
      "buyer",
      "--eligible-channels",
      "retail_market",
      "--eligible-regions",
      "EU",
      "--scope",
      "Random market purchase sample supports claim-001 for model-x1."
    ]);
    assert.match(attach.stdout, /Attached S3 metadata to evidence: evidence-001/);

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
    assert.equal(report.s3_summary.effective_s3_count, 1);
    assert.equal(report.s3_summary.candidate_unverified_sampling_count, 0);
    assert.equal(report.s3_summary.s3_state_counts.S3_1_SAMPLING_ROUTE_PROVIDED, 1);
    assert.equal(report.s3_summary.organization_selected_sample_count, 0);
    assert.equal(report.s3_summary.organization_provided_sample_count, 0);
    assert.equal(report.s3_summary.missing_sample_identity_count, 0);
    assert.equal(report.s3_summary.missing_claim_binding_count, 0);
    assert.equal(report.s3_summary.missing_sample_pool_count, 0);
    assert.equal(report.s3_summary.missing_finite_policy_count, 0);
    assert.equal(report.s3_summary.missing_duplicate_control_count, 0);
    assert.equal(report.s3_summary.missing_credential_binding_count, 0);
    assert.equal(report.s3_summary.missing_sampling_plan_count, 0);
    assert.equal(report.s3_summary.organization_can_choose_samples_count, 0);
    assert.equal(report.s3_summary.missing_custody_count, 1);
    assert.equal(report.evidence[0]?.s3.state, "S3_1_SAMPLING_ROUTE_PROVIDED");
    assert.equal(report.evidence[0]?.s3.effective, true);
    assert.equal(report.evidence[0]?.s3.organization_selected_sample, false);
    assert.equal(report.evidence[0]?.s3.organization_provided_sample, false);
    assert.equal(report.evidence[0]?.s3.sample_pool_id, "s3-pool-claim-001-2026-05");
    assert.equal(report.evidence[0]?.s3.max_active_samples, 24);
    assert.equal(report.evidence[0]?.s3.duplicate_control_present, true);
    assert.equal(report.evidence[0]?.s3.credential_binding_present, true);
    assert.equal(report.evidence[0]?.s3.credential_verified_against_root, true);
    assert.equal(report.evidence[0]?.s3.sampling_plan_present, true);
    assert.deepEqual(report.evidence[0]?.s3.unresolved_claim_refs, []);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("value audit downgrades S3 when bounded pool and credential gates are missing", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-s3-gates-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "random-sample-report.md"), "# Random sample report\n\nMarket purchase sample result.\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "random-sample-report.md",
      "--id",
      "evidence-001",
      "--subject-type",
      "product",
      "--subject-id",
      "primary-product",
      "--issuer-type",
      "third_party",
      "--uri",
      "https://example.org/evidence/random-sample-report.md",
      "--location-type",
      "https",
      "--limitations",
      "Single market purchase sample"
    ]);
    const attach = run(workspace, [
      "evidence",
      "s3",
      "attach",
      "--evidence-id",
      "evidence-001",
      "--template",
      "market_purchase",
      "--sampler-type",
      "buyer",
      "--sampler-name",
      "Example Buyer",
      "--acquired-at",
      "2026-05-19T00:00:00Z",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-x1",
      "--batch-id",
      "batch-2026-05",
      "--scope",
      "Random market purchase sample supports claim-001 for model-x1."
    ]);
    assert.match(attach.stdout, /Attached S3 metadata to evidence: evidence-001/);

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
    assert.equal(report.s3_summary.effective_s3_count, 0);
    assert.equal(report.s3_summary.candidate_unverified_sampling_count, 1);
    assert.equal(report.s3_summary.missing_credential_binding_count, 1);
    assert.equal(report.s3_summary.missing_duplicate_control_count, 1);
    assert.equal(report.evidence[0]?.s3.state, "CANDIDATE_UNVERIFIED_SAMPLING");
    assert.equal(report.evidence[0]?.s3.effective, false);
    assert.equal(report.evidence[0]?.s3.credential_binding_present, false);
    assert.equal(report.evidence[0]?.s3.duplicate_control_present, false);
    assert.ok(report.evidence[0]?.s3.gaps.some((gap) => gap.includes("credential_binding")));
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
      "--subject-type",
      "product",
      "--subject-id",
      "primary-product",
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
      "--subject-type",
      "product",
      "--subject-id",
      "primary-product",
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

test("value audit exposes evidence subject mismatch against the claim subject", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-value-audit-subject-mismatch-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "model-y-report.md"), "# Model Y report\n\nDoes not cover model X.\n", "utf8");
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    updateClaim(workspace, {
      subject: {
        subject_type: "product_model",
        subject_id: "model-x1"
      }
    });
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, [
      "evidence",
      "add",
      "--file",
      "model-y-report.md",
      "--id",
      "evidence-001",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-y1",
      "--issuer-type",
      "third_party",
      "--uri",
      "https://example.org/evidence/model-y-report.md",
      "--location-type",
      "https",
      "--reproducibility",
      "independently_reproducible",
      "--limitations",
      "Report covers only model-y1"
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
    assert.ok(claim);
    assert.equal(claim.status, "WARN");
    assert.equal(claim.subject_coverage.status, "WARN");
    assert.equal(claim.subject_coverage.relations.SUBJECT_ID_MISMATCH, 1);
    assert.ok(claim.risk_gaps.some((gap) => gap.includes("subject_id differs")));
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
  s3_summary: {
    effective_s3_count: number;
    candidate_unverified_sampling_count: number;
    s3_state_counts: Record<string, number>;
    organization_selected_sample_count: number;
    organization_provided_sample_count: number;
    missing_sample_identity_count: number;
    missing_claim_binding_count: number;
    missing_sample_pool_count: number;
    missing_finite_policy_count: number;
    missing_duplicate_control_count: number;
    missing_credential_binding_count: number;
    missing_sampling_plan_count: number;
    organization_can_choose_samples_count: number;
    missing_custody_count: number;
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
    subject_coverage: {
      status: string;
      claim_subject: Record<string, string>;
      evidence_subjects: Array<Record<string, unknown>>;
      relations: Record<string, number>;
      gaps: string[];
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
    s3: {
      state: string;
      effective: boolean;
      organization_selected_sample: boolean;
      organization_provided_sample: boolean;
      sample_pool_id: string;
      max_active_samples: number;
      duplicate_control_present: boolean;
      credential_binding_present: boolean;
      credential_verified_against_root: boolean;
      sampling_plan_present: boolean;
      gaps: string[];
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
