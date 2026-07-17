import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("agent integration guide defines low-friction discovery and trust boundary", () => {
  const guide = readFileSync(join(repoRoot, "AGENT_INTEGRATION_GUIDE.md"), "utf8");
  assert.match(guide, /AI 代理接入指南/);
  assert.match(guide, /\/\.well-known\/organchor\.json/);
  assert.match(guide, /organchor verify url https:\/\/example\.org --brief/);
  assert.match(guide, /policy_route/);
  assert.match(guide, /EXTERNAL_POLICY_REVIEW/);
  assert.match(guide, /OrgAnchor reports verification facts, gaps, and warnings/);
  assert.match(guide, /It does not assign the final trust decision/);
  assert.match(guide, /organchor beacon query --index beacon-index\.json --need/);
  assert.match(guide, /OrgAnchorBeaconQueryResult/);
  assert.match(guide, /discovery_match_is_not_recommendation/);
});

test("agent compact example is a valid first-pass result", () => {
  const examplePath = join(repoRoot, "examples", "agent-verification", "organchor-compact-result.json");
  const result = JSON.parse(readFileSync(examplePath, "utf8"));

  assert.equal(result.type, "OrgAnchorAgentVerificationCompactResult");
  assert.equal(result.version, "1.0");
  assert.equal(result.target, "https://organchor.org");
  assert.equal(result.overall_status, "PASS");
  assert.equal(result.identity_status, "PASS");
  assert.equal(result.value_status, "PASS");
  assert.equal(result.conformance_status, "FULL_COMPATIBLE");
  assert.equal(result.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
  assert.equal(result.status_scope.value_status, "REPORT_INTEGRITY_AND_DECLARED_RELATION_CHECKS");
  assert.equal(result.status_scope.evidence_sufficiency, "EXTERNAL_POLICY_DECISION");
  assert.equal(result.status_scope.claim_truth, "NOT_PROVEN_BY_ORGANCHOR_STATUS");
  assert.match(result.root_authority_hash, /^sha256:[0-9a-f]{64}$/);
  assert.match(result.statement_hash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(result.evidence_summary.claims, "PASS");
  assert.equal(result.evidence_summary.evidence, "PASS");
  assert.equal(result.evidence_summary.value, "PASS");
  assert.equal(result.evidence_summary.unsupported_claims, 0);
  assert.equal(result.evidence_summary.claim_support_levels.L0_UNSUPPORTED, 0);
  assert.equal(result.evidence_summary.claim_support_levels.L3_REPRODUCIBLE_METHOD, 1);
  assert.equal(result.evidence_summary.risk_gaps > 0, true);
  assert.equal(typeof result.evidence_summary.profile_declared_claims, "number");
  assert.equal(typeof result.evidence_summary.profile_gap_claims, "number");
  assert.equal(result.evidence_summary.s2_summary.effective_s2_count, 0);
  assert.equal(result.evidence_summary.s2_summary.not_a_trust_decision, true);
  assert.equal(result.evidence_summary.s3_summary.effective_s3_count, 0);
  assert.equal(typeof result.evidence_summary.s3_summary.missing_sample_pool_count, "number");
  assert.equal(typeof result.evidence_summary.s3_summary.missing_sample_slot_count, "number");
  assert.equal(typeof result.evidence_summary.s3_summary.missing_duplicate_control_count, "number");
  assert.equal(typeof result.evidence_summary.s3_summary.missing_sampling_plan_count, "number");
  assert.equal(typeof result.evidence_summary.s3_summary.missing_raw_evidence_reference_count, "number");
  assert.equal(typeof result.evidence_summary.s3_summary.organization_controlled_storage_count, "number");
  assert.equal(result.evidence_summary.s3_summary.not_a_trust_decision, true);
  assert.equal(result.evidence_summary.s4_summary.effective_s4_count, 0);
  assert.equal(result.evidence_summary.s4_summary.not_a_trust_decision, true);
  assert.equal(result.evidence_summary.top_risk_gaps.length > 0, true);
  assert.equal(result.evidence_summary.next_best_actions.length > 0, true);
  assert.equal(result.policy_route.route, "EXTERNAL_POLICY_REVIEW");
  assert.equal(result.policy_route.policy_owner, "EXTERNAL_AGENT");
  assert.equal(result.policy_route.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
  assert.equal(result.policy_route.reasons.includes("manual_checks_present"), true);
  assert.equal(result.policy_route.reasons.includes("no_third_party_claims"), true);
  assert.equal(result.failures.length, 0);
  assert.equal(result.warnings.length, 0);
});

test("agent Beacon query example is a valid need-match discovery result", () => {
  const examplePath = join(repoRoot, "examples", "agent-verification", "organchor-beacon-query-result.json");
  const result = JSON.parse(readFileSync(examplePath, "utf8"));

  assert.equal(result.type, "OrgAnchorBeaconQueryResult");
  assert.equal(result.version, "0.1");
  assert.equal(result.trust_boundary.local_index_is_trust_root, false);
  assert.equal(result.trust_boundary.final_trust_decision, "EXTERNAL_AGENT");
  assert.equal(result.trust_boundary.records_must_verify_at_origin, true);
  assert.equal(result.match_report.type, "OrgAnchorBeaconNeedMatchReport");
  assert.equal(result.match_report.boundary.discovery_match_is_not_recommendation, true);
  assert.equal(result.match_report.boundary.no_paid_ranking, true);
  assert.equal(result.match_report.boundary.final_decision, "EXTERNAL_AGENT");
  assert.equal(result.match_report.summary.high_priority_candidates, 1);
  assert.deepEqual(result.match_report.summary.strongest_candidate_origins, ["https://example.org"]);
  assert.equal(result.candidates[0].candidate_priority, "HIGH");
  assert.equal(result.candidates[0].need_match.status, "STRONG_DISCOVERY_MATCH");
  assert.equal(result.candidates[0].next_step, "organchor verify url https://example.org --brief");
  assert.equal(
    result.candidates[0].risk_gaps.some((risk: { code: string }) => risk.code === "DIRECT_ORIGIN_VERIFICATION_REQUIRED"),
    true
  );
});
