import { writeFile } from "node:fs/promises";
import { hashFile } from "../core/artifacts.ts";
import { ensureDir, writeJsonFile } from "../core/files.ts";
import { readJsonFile } from "../core/json.ts";
import { asObject } from "../core/validate.ts";
import { validateClaimsManifest, validateEvidenceManifest } from "../core/evidence-validate.ts";
import type { JsonValue } from "../core/json.ts";
import type { AuditStatus } from "../types/report.ts";

export type ClaimVerificationLevel =
  | "SELF_ASSERTED"
  | "EVIDENCE_LINKED"
  | "THIRD_PARTY"
  | "REPRODUCIBLE"
  | "TIME_PROVEN";

export type ClaimProtocolSupportLevel =
  | "L0_UNSUPPORTED"
  | "L1_SIGNED_SELF_CLAIM"
  | "L2_HASH_BOUND_EVIDENCE"
  | "L3_REPRODUCIBLE_METHOD"
  | "L4_INDEPENDENT_ATTESTATION"
  | "TIME_OBSERVED";

export type ClaimPolicyRoute =
  | "REQUEST_VALUE_EVIDENCE"
  | "REVIEW_VALUE_WARNINGS"
  | "EXTERNAL_POLICY_REVIEW"
  | "READY_FOR_EXTERNAL_POLICY";

export type RealWorldEvidenceProfile =
  | "physical_product"
  | "service_delivery"
  | "saas_api"
  | "certification_compliance"
  | "dataset_research";

export type ClaimProfileReviewStatus = "PASS" | "WARN" | "NOT_DECLARED";

export type SubjectCoverageRelation =
  | "EXACT_SUBJECT_MATCH"
  | "SUBJECT_ID_MISMATCH"
  | "EVIDENCE_BROADER_THAN_CLAIM"
  | "EVIDENCE_NARROWER_THAN_CLAIM"
  | "FAMILY_TO_MODEL_REVIEW_REQUIRED"
  | "BATCH_TO_FUTURE_BATCH_UNSUPPORTED"
  | "ORGANIZATION_TO_PRODUCT_UNSUPPORTED"
  | "SUBJECT_UNKNOWN";

export interface SubjectRef {
  subject_type: string;
  subject_id: string;
  source: string;
  scope_text?: string;
}

export interface EvidenceSubjectCoverage {
  evidence_id: string;
  subject: SubjectRef;
  relation: SubjectCoverageRelation;
  summary: string;
}

export interface SubjectCoverageReview {
  status: AuditStatus;
  claim_subject: SubjectRef;
  evidence_subjects: EvidenceSubjectCoverage[];
  relations: Record<SubjectCoverageRelation, number>;
  gaps: string[];
  next_best_actions: string[];
  not_a_trust_decision: true;
}

export type S2MaterialState =
  | "NOT_S2"
  | "CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL"
  | "S2_1_GENERIC_ROUTE_PROVIDED"
  | "S2_2_VERIFIED_ROUTE_CHECKED"
  | "S2_3_ISSUER_BACKED";

export interface S2EvidenceAudit {
  declared_state: string;
  state: S2MaterialState;
  effective: boolean;
  claim_refs: string[];
  unresolved_claim_refs: string[];
  covered_subject_type: string;
  covered_subject_id: string;
  scope_text: string;
  route_id: string;
  route_kind: string;
  external_recheck_anchor_present: boolean;
  anchor_url_valid: boolean;
  expired: boolean;
  sample_source_unknown: boolean;
  selected_by_unknown: boolean;
  relationship_unknown: boolean;
  gaps: string[];
  checks: ValueAuditCheck[];
}

export interface S2Summary {
  effective_s2_count: number;
  candidate_unverified_external_material_count: number;
  s2_state_counts: Record<"S2_1_GENERIC_ROUTE_PROVIDED" | "S2_2_VERIFIED_ROUTE_CHECKED" | "S2_3_ISSUER_BACKED", number>;
  expired_s2_count: number;
  broken_s2_anchor_count: number;
  manual_check_s2_count: number;
  unknown_sample_source_count: number;
  unknown_relationship_count: number;
  top_s2_gaps: string[];
  next_actions: string[];
  not_a_trust_decision: true;
}

export type S3SamplingState =
  | "NOT_S3"
  | "CANDIDATE_UNVERIFIED_SAMPLING"
  | "S3_1_SAMPLING_ROUTE_PROVIDED"
  | "S3_2_CUSTODY_DOCUMENTED"
  | "S3_3_INDEPENDENT_TEST_RECORDED";

export interface S3EvidenceAudit {
  declared_state: string;
  state: S3SamplingState;
  effective: boolean;
  claim_refs: string[];
  unresolved_claim_refs: string[];
  sample_type: string;
  sampler_type: string;
  sample_source: string;
  selected_by: string;
  sample_size: number;
  claim_binding_present: boolean;
  sample_pool_id: string;
  sample_slot_id: string;
  sample_slot_declared: boolean;
  finite_sample_policy_present: boolean;
  max_active_samples: number;
  duplicate_control_present: boolean;
  credential_binding_present: boolean;
  credential_verified_against_root: boolean;
  sampling_plan_present: boolean;
  organization_can_choose_samples: boolean;
  subject_type: string;
  subject_id: string;
  batch_id: string;
  serial_or_unit_id: string;
  organization_selected_sample: boolean;
  organization_provided_sample: boolean;
  sample_identity_present: boolean;
  acquired_at_present: boolean;
  raw_evidence_reference_present: boolean;
  raw_availability_status: string;
  storage_role: string;
  custody_documented: boolean;
  gaps: string[];
  checks: ValueAuditCheck[];
}

export interface S3Summary {
  effective_s3_count: number;
  candidate_unverified_sampling_count: number;
  s3_state_counts: Record<"S3_1_SAMPLING_ROUTE_PROVIDED" | "S3_2_CUSTODY_DOCUMENTED" | "S3_3_INDEPENDENT_TEST_RECORDED", number>;
  organization_selected_sample_count: number;
  organization_provided_sample_count: number;
  missing_sample_identity_count: number;
  missing_claim_binding_count: number;
  missing_sample_pool_count: number;
  missing_sample_slot_count: number;
  missing_finite_policy_count: number;
  missing_duplicate_control_count: number;
  missing_credential_binding_count: number;
  missing_sampling_plan_count: number;
  organization_can_choose_samples_count: number;
  missing_raw_evidence_reference_count: number;
  organization_controlled_storage_count: number;
  missing_custody_count: number;
  manual_check_s3_count: number;
  top_s3_gaps: string[];
  next_actions: string[];
  not_a_trust_decision: true;
}

export type S4ObservationState =
  | "NOT_S4"
  | "CANDIDATE_UNVERIFIED_OBSERVATION"
  | "S4_1_OBSERVATION_SUMMARY_PROVIDED"
  | "S4_2_RAW_BUNDLE_AVAILABLE"
  | "S4_3_OBSERVER_OR_DIRECTORY_REVIEWED";

export interface S4EvidenceAudit {
  declared_state: string;
  state: S4ObservationState;
  effective: boolean;
  claim_refs: string[];
  unresolved_claim_refs: string[];
  observation_type: string;
  observer_type: string;
  observer_id_or_origin: string;
  subject_type: string;
  subject_id: string;
  observation_window_present: boolean;
  current_window: boolean;
  metric_type: string;
  metric_summary_present: boolean;
  raw_bundle_hash_valid: boolean;
  raw_bundle_location_present: boolean;
  gaps: string[];
  checks: ValueAuditCheck[];
}

export interface S4Summary {
  effective_s4_count: number;
  candidate_unverified_observation_count: number;
  s4_state_counts: Record<"S4_1_OBSERVATION_SUMMARY_PROVIDED" | "S4_2_RAW_BUNDLE_AVAILABLE" | "S4_3_OBSERVER_OR_DIRECTORY_REVIEWED", number>;
  current_window_observation_count: number;
  historical_observation_count: number;
  raw_bundle_available_count: number;
  missing_subject_binding_count: number;
  manual_check_s4_count: number;
  top_s4_gaps: string[];
  next_actions: string[];
  not_a_trust_decision: true;
}

export interface ClaimProfileReview {
  profile: RealWorldEvidenceProfile | "not_declared";
  status: ClaimProfileReviewStatus;
  missing_fields: string[];
  risk_gaps: string[];
  next_best_actions: string[];
}

export interface ClaimSupportAxes {
  artifact_integrity: "HASH_DECLARED" | "LOCAL_HASH_FAILED" | "NOT_CHECKED";
  retrievability: "HAS_PUBLIC_LOCATIONS" | "PARTIAL_PUBLIC_LOCATIONS" | "NO_PUBLIC_LOCATIONS" | "NO_EVIDENCE";
  specificity: "SCOPED" | "BROAD_OR_UNSCOPED";
  limitations: "PRESENT" | "MISSING";
  issuer_independence: "INDEPENDENT_EVIDENCE_PRESENT" | "FIRST_PARTY_ONLY" | "NO_EVIDENCE";
  method_reproducibility: "REPRODUCIBLE_OR_INDEPENDENT" | "NOT_SPECIFIED";
  freshness: "CURRENT_OR_NOT_DATED" | "STALE";
  challenge_status: "NO_KNOWN_CHALLENGE" | "DISPUTED_OR_WITHDRAWN" | "SUPERSEDED_OR_CORRECTED";
}

export interface ValueAuditCheck {
  id: string;
  title: string;
  status: AuditStatus;
  summary: string;
  details?: Record<string, unknown>;
}

export interface ClaimValueAudit {
  id: string;
  status: AuditStatus;
  level: ClaimVerificationLevel;
  protocol_support_level: ClaimProtocolSupportLevel;
  support_axes: ClaimSupportAxes;
  risk_gaps: string[];
  next_best_actions: string[];
  organchor_trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR";
  policy_route: ClaimPolicyRoute;
  profile_review: ClaimProfileReview;
  subject_coverage: SubjectCoverageReview;
  has_third_party_evidence: boolean;
  has_reproducible_evidence: boolean;
  evidence_refs: string[];
  resolved_evidence_refs: string[];
  missing_evidence_refs: string[];
  findings: string[];
}

export interface EvidenceValueAudit {
  id: string;
  status: AuditStatus;
  evidence_type: string;
  issuer_type: string;
  reproducibility: string;
  method_refs: string[];
  resolved_method_refs: string[];
  missing_method_refs: string[];
  method_kinds: string[];
  has_recheck_method: boolean;
  has_low_cost_recheck_method: boolean;
  has_external_location: boolean;
  is_stale: boolean;
  s_class: string;
  subject: SubjectRef;
  s2: S2EvidenceAudit;
  s3: S3EvidenceAudit;
  s4: S4EvidenceAudit;
  findings: string[];
}

export interface ValueContinuityReport {
  type: "OrgAnchorValueContinuityReport";
  version: "1.0";
  audited_at: string;
  generated_by: "organchor";
  claims_path: string;
  evidence_path: string;
  summary: Record<AuditStatus, number> & {
    total_claims: number;
    self_asserted_claims: number;
    evidence_linked_claims: number;
    third_party_claims: number;
    reproducible_claims: number;
    time_proven_claims: number;
    unsupported_claims: number;
    total_evidence_items: number;
    external_evidence_items: number;
    first_party_evidence_items: number;
    stale_evidence_items: number;
    profile_declared_claims: number;
    profile_pass_claims: number;
    profile_gap_claims: number;
  };
  s2_summary: S2Summary;
  s3_summary: S3Summary;
  s4_summary: S4Summary;
  checks: ValueAuditCheck[];
  claims: ClaimValueAudit[];
  evidence: EvidenceValueAudit[];
}

export interface ValueAuditOptions {
  now?: Date;
  checkFiles?: boolean;
}

export async function auditValueContinuity(
  claimsPath: string,
  evidencePath: string,
  options: ValueAuditOptions = {}
): Promise<ValueContinuityReport> {
  const now = options.now ?? new Date();
  const claimsManifest = asObject(validateClaimsManifest(await readJsonFile(claimsPath)), "claims manifest");
  const evidenceManifest = asObject(validateEvidenceManifest(await readJsonFile(evidencePath)), "evidence manifest");
  const checks: ValueAuditCheck[] = [
    pass("claims_manifest", "Claims manifest", `Claims manifest loaded from ${claimsPath}.`),
    pass("evidence_manifest", "Evidence manifest", `Evidence manifest loaded from ${evidencePath}.`)
  ];

  if (hasCorrectionPolicy(claimsManifest, evidenceManifest)) {
    checks.push(pass("correction_chain", "Correction chain", "A correction or supersession policy is present."));
  } else {
    checks.push(
      manual(
        "correction_chain",
        "Correction chain",
        "No correction or supersession policy is present. Long-term value claims should explain how mistakes are corrected."
      )
    );
  }

  const evidenceItems = arrayObjects(evidenceManifest.evidence);
  const claims = arrayObjects(claimsManifest.claims);
  const claimIds = new Set(claims.map((claim) => stringValue(claim.id)).filter(Boolean));
  const methodsById = new Map<string, Record<string, JsonValue>>();
  for (const method of arrayObjects(evidenceManifest.methods)) {
    methodsById.set(stringValue(method.id), method);
  }
  const evidenceById = new Map<string, Record<string, JsonValue>>();
  for (const item of evidenceItems) {
    evidenceById.set(stringValue(item.id), item);
  }

  const evidenceAudits: EvidenceValueAudit[] = [];
  for (const item of evidenceItems) {
    const audit = await auditEvidenceItem(item, now, Boolean(options.checkFiles), methodsById, claimIds);
    evidenceAudits.push(audit);
    checks.push(...evidenceChecks(audit));
  }

  const claimAudits: ClaimValueAudit[] = [];
  for (const claim of claims) {
    const audit = auditClaim(claim, evidenceById, evidenceAudits);
    claimAudits.push(audit);
    checks.push(...claimChecks(claim, audit));
  }

  return {
    type: "OrgAnchorValueContinuityReport",
    version: "1.0",
    audited_at: now.toISOString(),
    generated_by: "organchor",
    claims_path: claimsPath,
    evidence_path: evidencePath,
    summary: summarize(checks, claimAudits, evidenceAudits),
    s2_summary: summarizeS2(evidenceAudits),
    s3_summary: summarizeS3(evidenceAudits),
    s4_summary: summarizeS4(evidenceAudits),
    checks,
    claims: claimAudits,
    evidence: evidenceAudits
  };
}

export async function writeValueContinuityReport(report: ValueContinuityReport, outputDir = "reports"): Promise<void> {
  await ensureDir(outputDir);
  await writeJsonFile(`${outputDir}/value-continuity-report.json`, report as unknown as JsonValue);
  await writeFile(`${outputDir}/value-continuity-report.md`, renderValueContinuityMarkdown(report), "utf8");
}

export function renderValueContinuityMarkdown(report: ValueContinuityReport): string {
  const checks = report.checks
    .map((check) => `| ${check.status} | ${escapeMarkdown(check.id)} | ${escapeMarkdown(check.summary)} |`)
    .join("\n");
  const claims = report.claims
    .map(
      (claim) =>
        `| ${claim.status} | ${escapeMarkdown(claim.id)} | ${claim.level} | ${claim.protocol_support_level} | ${claim.policy_route} | ${claim.profile_review.profile} | ${claim.subject_coverage.status} | ${claim.risk_gaps.length} | ${claim.resolved_evidence_refs.length} | ${claim.missing_evidence_refs.length} |`
    )
    .join("\n");
  const evidence = report.evidence
    .map(
      (item) =>
        `| ${item.status} | ${escapeMarkdown(item.id)} | ${escapeMarkdown(subjectLabel(item.subject))} | ${escapeMarkdown(item.issuer_type)} | ${escapeMarkdown(item.reproducibility)} | ${item.has_external_location ? "yes" : "no"} | ${item.s2.state} | ${item.s2.effective ? "yes" : "no"} | ${item.s3.state} | ${item.s3.effective ? "yes" : "no"} | ${item.s4.state} | ${item.s4.effective ? "yes" : "no"} |`
    )
    .join("\n");

  return `# Value Continuity Report

Audited at: \`${report.audited_at}\`

Claims: \`${report.claims_path}\`

Evidence: \`${report.evidence_path}\`

## Summary

| Status | Count |
| --- | ---: |
| PASS | ${report.summary.PASS} |
| WARN | ${report.summary.WARN} |
| FAIL | ${report.summary.FAIL} |
| MANUAL_CHECK_REQUIRED | ${report.summary.MANUAL_CHECK_REQUIRED} |

## Value Metrics

| Metric | Count |
| --- | ---: |
| Total claims | ${report.summary.total_claims} |
| Self-asserted claims | ${report.summary.self_asserted_claims} |
| Evidence-linked claims | ${report.summary.evidence_linked_claims} |
| Third-party claims | ${report.summary.third_party_claims} |
| Reproducible claims | ${report.summary.reproducible_claims} |
| Time-proven claims | ${report.summary.time_proven_claims} |
| Unsupported claims | ${report.summary.unsupported_claims} |
| Total evidence items | ${report.summary.total_evidence_items} |
| External evidence items | ${report.summary.external_evidence_items} |
| First-party evidence items | ${report.summary.first_party_evidence_items} |
| Stale evidence items | ${report.summary.stale_evidence_items} |
| Profile-declared claims | ${report.summary.profile_declared_claims} |
| Profile PASS claims | ${report.summary.profile_pass_claims} |
| Profile gap claims | ${report.summary.profile_gap_claims} |

## S2 Third-Party Material Metrics

| Metric | Count |
| --- | ---: |
| Effective S2 items | ${report.s2_summary.effective_s2_count} |
| Candidate unverified external materials | ${report.s2_summary.candidate_unverified_external_material_count} |
| S2 generic-route items | ${report.s2_summary.s2_state_counts.S2_1_GENERIC_ROUTE_PROVIDED} |
| S2 verified-route items | ${report.s2_summary.s2_state_counts.S2_2_VERIFIED_ROUTE_CHECKED} |
| S2 issuer-backed items | ${report.s2_summary.s2_state_counts.S2_3_ISSUER_BACKED} |
| Expired S2 items | ${report.s2_summary.expired_s2_count} |
| Broken S2 anchor URLs | ${report.s2_summary.broken_s2_anchor_count} |
| S2 manual checks | ${report.s2_summary.manual_check_s2_count} |

## S3 Random Purchase / Sampling Metrics

| Metric | Count |
| --- | ---: |
| Effective S3 items | ${report.s3_summary.effective_s3_count} |
| Candidate unverified sampling items | ${report.s3_summary.candidate_unverified_sampling_count} |
| S3 sampling-route items | ${report.s3_summary.s3_state_counts.S3_1_SAMPLING_ROUTE_PROVIDED} |
| S3 custody-documented items | ${report.s3_summary.s3_state_counts.S3_2_CUSTODY_DOCUMENTED} |
| S3 independent-test items | ${report.s3_summary.s3_state_counts.S3_3_INDEPENDENT_TEST_RECORDED} |
| Organization-selected samples | ${report.s3_summary.organization_selected_sample_count} |
| Organization-provided samples | ${report.s3_summary.organization_provided_sample_count} |
| Missing sample identity | ${report.s3_summary.missing_sample_identity_count} |
| Missing claim binding | ${report.s3_summary.missing_claim_binding_count} |
| Missing sample pool | ${report.s3_summary.missing_sample_pool_count} |
| Missing sample slot | ${report.s3_summary.missing_sample_slot_count} |
| Missing finite sample policy | ${report.s3_summary.missing_finite_policy_count} |
| Missing duplicate control | ${report.s3_summary.missing_duplicate_control_count} |
| Missing credential binding | ${report.s3_summary.missing_credential_binding_count} |
| Missing sampling plan | ${report.s3_summary.missing_sampling_plan_count} |
| Organization can choose samples | ${report.s3_summary.organization_can_choose_samples_count} |
| Missing raw evidence reference | ${report.s3_summary.missing_raw_evidence_reference_count} |
| Organization-controlled raw storage | ${report.s3_summary.organization_controlled_storage_count} |
| Missing custody documentation | ${report.s3_summary.missing_custody_count} |
| S3 manual checks | ${report.s3_summary.manual_check_s3_count} |

## S4 Real-World Observation Metrics

| Metric | Count |
| --- | ---: |
| Effective S4 items | ${report.s4_summary.effective_s4_count} |
| Candidate unverified observation items | ${report.s4_summary.candidate_unverified_observation_count} |
| S4 observation-summary items | ${report.s4_summary.s4_state_counts.S4_1_OBSERVATION_SUMMARY_PROVIDED} |
| S4 raw-bundle-available items | ${report.s4_summary.s4_state_counts.S4_2_RAW_BUNDLE_AVAILABLE} |
| S4 reviewed observation items | ${report.s4_summary.s4_state_counts.S4_3_OBSERVER_OR_DIRECTORY_REVIEWED} |
| Current-window observations | ${report.s4_summary.current_window_observation_count} |
| Historical observations | ${report.s4_summary.historical_observation_count} |
| Raw bundle available | ${report.s4_summary.raw_bundle_available_count} |
| Missing subject binding | ${report.s4_summary.missing_subject_binding_count} |
| S4 manual checks | ${report.s4_summary.manual_check_s4_count} |

## Checks

| Status | Check | Summary |
| --- | --- | --- |
${checks}

## Claims

| Status | Claim | Legacy level | Protocol support | Policy route | Profile | Subject coverage | Risk gaps | Resolved evidence | Missing evidence |
| --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: |
${claims}

## Evidence

| Status | Evidence | Subject | Issuer | Reproducibility | External location | S2 state | Effective S2 | S3 state | Effective S3 | S4 state | Effective S4 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${evidence}
`;
}

async function auditEvidenceItem(
  item: Record<string, JsonValue>,
  now: Date,
  checkFiles: boolean,
  methodsById: Map<string, Record<string, JsonValue>>,
  claimIds: Set<string>
): Promise<EvidenceValueAudit> {
  const id = stringValue(item.id);
  const evidenceType = stringValue(item.evidence_type) || "not_specified";
  const issuerType = stringValue(item.issuer_type) || "unknown";
  const sClass = stringValue(item.s_class);
  const reproducibility = stringValue(item.reproducibility) || stringValue(asRecord(item.quality).reproducibility) || "not_specified";
  const locations = arrayObjects(item.locations);
  const methodRefs = arrayStrings(item.method_refs);
  const resolvedMethodRefs = methodRefs.filter((ref) => methodsById.has(ref));
  const missingMethodRefs = methodRefs.filter((ref) => !methodsById.has(ref));
  const resolvedMethods = resolvedMethodRefs.map((ref) => methodsById.get(ref)).filter((method): method is Record<string, JsonValue> => Boolean(method));
  const methodKinds = uniqueStrings(resolvedMethods.map((method) => stringValue(method.method_kind)).filter(Boolean));
  const hasRecheckMethod = resolvedMethods.some(hasExecutableReviewShape);
  const hasLowCostRecheckMethod = resolvedMethods.some((method) => isLowCostMethod(stringValue(method.cost_to_verify)));
  const hasExternalLocation = locations.some((location) => {
    const type = stringValue(location.type);
    return type !== "" && type !== "local";
  });
  const findings: string[] = [];
  if (!hasExternalLocation) findings.push("Evidence has no external/public location.");
  if (isFirstPartyIssuer(issuerType)) findings.push("Evidence is first-party; independent review may still be needed.");
  if (reproducibility === "not_specified") findings.push("Evidence reproducibility is not specified.");
  for (const ref of missingMethodRefs) findings.push(`Evidence references missing recheck method: ${ref}.`);
  if (methodRefs.length > 0 && !hasRecheckMethod) findings.push("Evidence method does not include actionable steps and expected results.");
  const isStale = isEvidenceStale(item, now);
  if (isStale) findings.push("Evidence is past its valid_until date.");
  const s2 = auditS2Material(item, now, claimIds);
  const s3 = auditS3Sampling(item, claimIds);
  const s4 = auditS4Observation(item, now, claimIds, hasExternalLocation);
  const subject = evidenceSubject(item, s2, s3, s4);

  if (checkFiles) {
    await checkLocalLocations(item, locations, findings);
  }

  const status = worstStatus(statusFromFindings(findings, false), [...s2.checks, ...s3.checks, ...s4.checks].map((check) => check.status));
  return {
    id,
    status,
    evidence_type: evidenceType,
    issuer_type: issuerType,
    reproducibility,
    method_refs: methodRefs,
    resolved_method_refs: resolvedMethodRefs,
    missing_method_refs: missingMethodRefs,
    method_kinds: methodKinds,
    has_recheck_method: hasRecheckMethod,
    has_low_cost_recheck_method: hasLowCostRecheckMethod,
    has_external_location: hasExternalLocation,
    is_stale: isStale,
    s_class: sClass,
    subject,
    s2,
    s3,
    s4,
    findings
  };
}

function auditS2Material(item: Record<string, JsonValue>, now: Date, claimIds: Set<string>): S2EvidenceAudit {
  const id = stringValue(item.id);
  const sClass = stringValue(item.s_class);
  const s2 = asRecord(item.s2);
  const isDeclaredS2 = sClass === "S2_THIRD_PARTY_DOCUMENTS" || Object.keys(s2).length > 0;
  if (!isDeclaredS2) {
    return emptyS2Audit();
  }

  const support = asRecord(s2.organization_claimed_support);
  const route = asRecord(s2.verification_route);
  const anchor = asRecord(s2.external_recheck_anchor);
  const health = asRecord(s2.health);
  const disclosures = asRecord(s2.disclosures);
  const checks: ValueAuditCheck[] = [];
  const gaps: string[] = [];
  const declaredState = stringValue(s2.state);
  let state: S2MaterialState = isS2MaterialState(declaredState) ? declaredState : "CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL";
  const materialType = stringValue(s2.material_type);
  const issuerName = stringValue(s2.issuer_name);
  const claimRefs = uniqueStrings([...arrayStrings(support.claim_refs), ...relationClaimRefs(item)]);
  const unresolvedClaimRefs = claimRefs.filter((ref) => !claimIds.has(ref));
  const scopeText = stringValue(support.scope_text);
  const coveredSubjectType = stringValue(support.covered_subject_type);
  const coveredSubjectId = stringValue(support.covered_subject_id);
  const limitations = arrayStrings(support.limitations);
  const routeId = stringValue(route.route_id);
  const routeKind = stringValue(route.route_kind);
  const routeKnown = S2_ROUTE_IDS.has(routeId) || S2_ROUTE_KINDS.has(routeKind);
  const anchorPresent = Object.keys(anchor).length > 0;
  const anchorUrl = stringValue(anchor.url);
  const anchorUrlValid = !anchorUrl || isHttpUrl(anchorUrl);
  const anchorCheckedAt = stringValue(anchor.checked_at) || stringValue(anchor.issued_at);
  const validUntil = stringValue(health.valid_until) || stringValue(item.valid_until);
  const expired = validUntil ? isPastTimestamp(validUntil, now) : false;
  const sampleSourceUnknown = isUnknownOrMissing(disclosures.sample_source);
  const selectedByUnknown = isUnknownOrMissing(disclosures.selected_by);
  const relationshipUnknown = isUnknownOrMissing(disclosures.relationship_to_organization);

  addS2Check(
    checks,
    gaps,
    sClass === "S2_THIRD_PARTY_DOCUMENTS" ? "PASS" : "WARN",
    id,
    "S2_CORE_FIELDS_PRESENT",
    sClass === "S2_THIRD_PARTY_DOCUMENTS" ? "S2 class is declared." : "S2 metadata is present but s_class is not S2_THIRD_PARTY_DOCUMENTS."
  );
  addS2Check(
    checks,
    gaps,
    state === "CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL" ? "WARN" : "PASS",
    id,
    "S2_STATE_DECLARED",
    state === "CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL"
      ? "S2 state is missing, unsupported, or explicitly candidate-only."
      : `S2 state is ${state}.`
  );
  addS2Check(
    checks,
    gaps,
    materialType ? "PASS" : "WARN",
    id,
    "S2_MATERIAL_TYPE_DECLARED",
    materialType ? `S2 material type is ${materialType}.` : "S2 material_type is missing."
  );
  addS2Check(
    checks,
    gaps,
    issuerName ? "PASS" : "WARN",
    id,
    "S2_ISSUER_NAME_DECLARED",
    issuerName ? `S2 issuer is ${issuerName}.` : "S2 issuer_name is missing."
  );
  addS2Check(
    checks,
    gaps,
    claimRefs.length === 0 ? "WARN" : unresolvedClaimRefs.length > 0 ? "FAIL" : "PASS",
    id,
    "S2_CLAIM_REFS_RESOLVE",
    claimRefs.length === 0
      ? "S2 material does not declare which claim it supports."
      : unresolvedClaimRefs.length > 0
        ? `S2 material references unknown claim(s): ${unresolvedClaimRefs.join(", ")}.`
        : "S2 claim references resolve."
  );
  addS2Check(
    checks,
    gaps,
    scopeText ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S2_SCOPE_DECLARED",
    scopeText ? "S2 claimed support scope is declared." : "S2 scope_text is missing; scope review is required."
  );
  addS2Check(
    checks,
    gaps,
    limitations.length > 0 ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S2_LIMITATIONS_DECLARED",
    limitations.length > 0 ? "S2 limitations are declared." : "S2 limitations are missing."
  );
  addS2Check(
    checks,
    gaps,
    Object.keys(route).length === 0 ? "WARN" : routeKnown ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S2_ROUTE_KNOWN",
    Object.keys(route).length === 0
      ? "S2 verification_route is missing."
      : routeKnown
        ? `S2 route is ${routeId || routeKind}.`
        : "S2 route is custom or not recognized; manual route review is required."
  );
  addS2Check(
    checks,
    gaps,
    anchorPresent ? "PASS" : "WARN",
    id,
    "S2_EXTERNAL_RECHECK_ANCHOR_PRESENT",
    anchorPresent ? "S2 external recheck anchor is present." : "S2 external_recheck_anchor is missing; this is not effective S2."
  );
  addS2Check(
    checks,
    gaps,
    anchorPresent && anchorCheckedAt ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S2_ANCHOR_TIME_DECLARED",
    anchorPresent && anchorCheckedAt ? "S2 anchor check time is declared." : "S2 anchor checked_at or issued_at is missing."
  );
  if (anchorUrl) {
    addS2Check(
      checks,
      gaps,
      anchorUrlValid ? "PASS" : "WARN",
      id,
      "S2_ANCHOR_URL_WELL_FORMED",
      anchorUrlValid ? "S2 anchor URL is well formed." : "S2 anchor URL is not a valid http(s) URL."
    );
  }
  if (state === "S2_2_VERIFIED_ROUTE_CHECKED") {
    addS2Check(
      checks,
      gaps,
      "MANUAL_CHECK_REQUIRED",
      id,
      "S2_VERIFIED_ROUTE_CHECKED",
      "S2_2 requires a bounded route adapter check. Local audit records this as S2_1 until route adapters are implemented."
    );
  }
  if (state === "S2_3_ISSUER_BACKED") {
    addS2Check(
      checks,
      gaps,
      "MANUAL_CHECK_REQUIRED",
      id,
      "S2_ISSUER_BACKING_PRESENT",
      "S2_3 requires issuer-backed signature or issuer-hosted verification. Local audit records this as S2_1 until issuer-backed workflows are implemented."
    );
  }
  addS2Check(
    checks,
    gaps,
    stringValue(health.maintenance_status) ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S2_HEALTH_DECLARED",
    stringValue(health.maintenance_status) ? `S2 health is ${stringValue(health.maintenance_status)}.` : "S2 health.maintenance_status is missing."
  );
  if (validUntil) {
    addS2Check(
      checks,
      gaps,
      expired ? "WARN" : "PASS",
      id,
      "S2_VALID_UNTIL_NOT_EXPIRED",
      expired ? "S2 material is past valid_until." : "S2 material is not past valid_until."
    );
  }
  addDisclosureCheck(checks, gaps, id, "S2_SAMPLE_SOURCE_DISCLOSED", "sample_source", sampleSourceUnknown);
  addDisclosureCheck(checks, gaps, id, "S2_SELECTED_BY_DISCLOSED", "selected_by", selectedByUnknown);
  addDisclosureCheck(checks, gaps, id, "S2_RELATIONSHIP_DISCLOSED", "relationship_to_organization", relationshipUnknown);

  const hasRequiredCore =
    sClass === "S2_THIRD_PARTY_DOCUMENTS" &&
    state !== "CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL" &&
    Boolean(materialType) &&
    Boolean(issuerName) &&
    claimRefs.length > 0 &&
    unresolvedClaimRefs.length === 0 &&
    Boolean(scopeText) &&
    limitations.length > 0 &&
    Object.keys(route).length > 0 &&
    anchorPresent &&
    Boolean(anchorCheckedAt);

  if (!hasRequiredCore) state = "CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL";
  if (state === "S2_2_VERIFIED_ROUTE_CHECKED" || state === "S2_3_ISSUER_BACKED") state = "S2_1_GENERIC_ROUTE_PROVIDED";
  const effective = S2_EFFECTIVE_STATES.has(state);

  return {
    declared_state: declaredState,
    state,
    effective,
    claim_refs: claimRefs,
    unresolved_claim_refs: unresolvedClaimRefs,
    covered_subject_type: coveredSubjectType,
    covered_subject_id: coveredSubjectId,
    scope_text: scopeText,
    route_id: routeId,
    route_kind: routeKind,
    external_recheck_anchor_present: anchorPresent,
    anchor_url_valid: anchorUrlValid,
    expired,
    sample_source_unknown: sampleSourceUnknown,
    selected_by_unknown: selectedByUnknown,
    relationship_unknown: relationshipUnknown,
    gaps: uniqueStrings(gaps),
    checks
  };
}

function emptyS2Audit(): S2EvidenceAudit {
  return {
    declared_state: "",
    state: "NOT_S2",
    effective: false,
    claim_refs: [],
    unresolved_claim_refs: [],
    covered_subject_type: "",
    covered_subject_id: "",
    scope_text: "",
    route_id: "",
    route_kind: "",
    external_recheck_anchor_present: false,
    anchor_url_valid: true,
    expired: false,
    sample_source_unknown: false,
    selected_by_unknown: false,
    relationship_unknown: false,
    gaps: [],
    checks: []
  };
}

function auditS3Sampling(item: Record<string, JsonValue>, claimIds: Set<string>): S3EvidenceAudit {
  const id = stringValue(item.id);
  const sClass = stringValue(item.s_class);
  const s3 = asRecord(item.s3);
  const isDeclaredS3 = sClass === "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING" || Object.keys(s3).length > 0;
  if (!isDeclaredS3) return emptyS3Audit();

  const support = asRecord(s3.organization_claimed_support);
  const sampler = asRecord(s3.sampler);
  const claimBinding = asRecord(s3.claim_binding);
  const credentialBinding = asRecord(s3.credential_binding);
  const identity = asRecord(s3.sample_identity);
  const event = asRecord(s3.sampling_event);
  const samplePolicy = asRecord(s3.sample_policy);
  const samplingPlan = asRecord(s3.sampling_plan);
  const sampleSlot = asRecord(s3.sample_slot);
  const intake = asRecord(s3.intake);
  const rawEvidence = asRecord(s3.raw_evidence);
  const custody = asRecord(s3.custody);
  const checks: ValueAuditCheck[] = [];
  const gaps: string[] = [];
  const declaredState = stringValue(s3.state);
  let state: S3SamplingState = isS3SamplingState(declaredState) ? declaredState : "CANDIDATE_UNVERIFIED_SAMPLING";
  const sampleType = stringValue(s3.sample_type);
  const samplerType = stringValue(sampler.type);
  const samplerName = stringValue(sampler.name);
  const claimBindingClaimId = stringValue(claimBinding.claim_id);
  const claimRefs = uniqueStrings([claimBindingClaimId, ...arrayStrings(support.claim_refs), ...relationClaimRefs(item)].filter(Boolean));
  const unresolvedClaimRefs = claimRefs.filter((ref) => !claimIds.has(ref));
  const claimBindingPresent = Boolean(claimBindingClaimId && stringValue(claimBinding.claim_version));
  const samplePoolId = stringValue(claimBinding.sample_pool_id);
  const samplePoolPresent = Boolean(samplePoolId);
  const sampleSlotId = stringValue(s3.sample_slot_id) || stringValue(sampleSlot.sample_slot_id) || stringValue(intake.sample_slot_id);
  const sampleSlotDeclared = Boolean(sampleSlotId);
  const maxActiveSamples = positiveIntegerValue(samplePolicy.max_active_samples);
  const replacementPolicy = stringValue(samplePolicy.replacement_policy);
  const uniquenessBasis = stringValue(samplePolicy.uniqueness_basis);
  const finiteSamplePolicyPresent =
    maxActiveSamples > 0 &&
    replacementPolicy === "NEWEST_VALID_SAMPLE_REPLACES_OLDEST_ACTIVE_SAMPLE" &&
    uniquenessBasis === "sample_nullifier";
  const credentialHash = stringValue(credentialBinding.credential_hash);
  const sampleNullifier = stringValue(credentialBinding.sample_nullifier);
  const duplicateControlPresent = Boolean(sampleNullifier);
  const credentialBindingPresent = Boolean(credentialHash && sampleNullifier);
  const credentialVerifiedAgainstRoot = booleanValue(credentialBinding.credential_verified_against_root);
  const selectorControl = stringValue(samplingPlan.selector_control);
  const organizationCanChooseSamplesDeclared = samplingPlan.organization_can_choose_samples !== undefined;
  const organizationCanChooseSamples = booleanValue(samplingPlan.organization_can_choose_samples);
  const samplingPlanPresent = Boolean(
    selectorControl &&
      organizationCanChooseSamplesDeclared &&
      (Array.isArray(samplingPlan.eligible_channels) || Array.isArray(samplingPlan.eligible_regions) || stringValue(samplingPlan.plan_id))
  );
  const scopeText = stringValue(support.scope_text);
  const limitations = arrayStrings(support.limitations);
  const sampleSource = stringValue(event.sample_source);
  const selectedBy = stringValue(event.selected_by);
  const organizationProvidedDeclared = event.organization_provided_sample !== undefined;
  const organizationProvidedSample = booleanValue(event.organization_provided_sample) || isOrganizationControlledSample(sampleSource);
  const organizationSelectedSample = isOrganizationControlledSample(selectedBy) || isOrganizationControlledSample(samplerType);
  const subjectType = stringValue(identity.subject_type);
  const subjectId = stringValue(identity.subject_id);
  const batchId = stringValue(identity.batch_id);
  const serialOrUnitId = stringValue(identity.serial_or_unit_id);
  const sampleIdentityPresent = Boolean(subjectType && subjectId);
  const acquiredAt = stringValue(event.acquired_at);
  const acquiredAtPresent = Boolean(acquiredAt && Number.isFinite(Date.parse(acquiredAt)));
  const sampleSize = positiveIntegerValue(event.sample_size);
  const rawBundleHash = stringValue(rawEvidence.bundle_hash) || stringValue(rawEvidence.receipt_hash);
  const rawAvailabilityStatus = stringValue(rawEvidence.raw_availability_status) || stringValue(rawEvidence.availability_state);
  const storageRole = stringValue(rawEvidence.storage_role) || stringValue(intake.storage_role);
  const rawAvailabilityStatusKnown = S3_RAW_AVAILABILITY_STATUSES.has(rawAvailabilityStatus);
  const rawEvidenceReferencePresent = isSha256Digest(rawBundleHash) && rawAvailabilityStatusKnown;
  const storageRoleKnown = S3_STORAGE_ROLES.has(storageRole);
  const custodyDocumented = booleanValue(custody.custody_documented);

  addS3Check(
    checks,
    gaps,
    sClass === "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING" ? "PASS" : "WARN",
    id,
    "S3_CORE_FIELDS_PRESENT",
    sClass === "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING" ? "S3 class is declared." : "S3 metadata is present but s_class is not S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING."
  );
  addS3Check(
    checks,
    gaps,
    state === "CANDIDATE_UNVERIFIED_SAMPLING" ? "WARN" : "PASS",
    id,
    "S3_STATE_DECLARED",
    state === "CANDIDATE_UNVERIFIED_SAMPLING" ? "S3 state is missing, unsupported, or explicitly candidate-only." : `S3 state is ${state}.`
  );
  addS3Check(checks, gaps, sampleType ? "PASS" : "WARN", id, "S3_SAMPLE_TYPE_DECLARED", sampleType ? `S3 sample type is ${sampleType}.` : "S3 sample_type is missing.");
  addS3Check(
    checks,
    gaps,
    samplerType ? "PASS" : "WARN",
    id,
    "S3_SAMPLER_DECLARED",
    samplerType ? `S3 sampler type is ${samplerType}${samplerName ? ` (${samplerName})` : ""}.` : "S3 sampler.type is missing."
  );
  addS3Check(
    checks,
    gaps,
    claimRefs.length === 0 ? "WARN" : unresolvedClaimRefs.length > 0 ? "FAIL" : "PASS",
    id,
    "S3_CLAIM_REFS_RESOLVE",
    claimRefs.length === 0
      ? "S3 sampling evidence does not declare which claim it supports."
      : unresolvedClaimRefs.length > 0
        ? `S3 sampling evidence references unknown claim(s): ${unresolvedClaimRefs.join(", ")}.`
        : "S3 claim references resolve."
  );
  addS3Check(
    checks,
    gaps,
    claimBindingPresent ? "PASS" : "WARN",
    id,
    "S3_CLAIM_BINDING_DECLARED",
    claimBindingPresent ? `S3 claim binding is ${claimBindingClaimId}@${stringValue(claimBinding.claim_version)}.` : "S3 claim_binding.claim_id and claim_binding.claim_version are required for bounded claim-level sampling."
  );
  addS3Check(
    checks,
    gaps,
    samplePoolPresent ? "PASS" : "WARN",
    id,
    "S3_SAMPLE_POOL_DECLARED",
    samplePoolPresent ? `S3 sample pool is ${samplePoolId}.` : "S3 claim_binding.sample_pool_id is missing; active sample-pool limits cannot be enforced."
  );
  addS3Check(
    checks,
    gaps,
    sampleSlotDeclared ? "PASS" : "WARN",
    id,
    "S3_SAMPLE_SLOT_DECLARED",
    sampleSlotDeclared
      ? `S3 sample slot is ${sampleSlotId}. Local alpha tooling records this field but does not yet verify slot issuance.`
      : "S3 sample_slot_id is missing; the sample cannot be tied to a bounded slot-gated intake plan."
  );
  addS3Check(
    checks,
    gaps,
    finiteSamplePolicyPresent ? "PASS" : "WARN",
    id,
    "S3_FINITE_SAMPLE_POLICY_DECLARED",
    finiteSamplePolicyPresent
      ? `S3 sample policy caps active samples at ${maxActiveSamples} and uses rolling replacement.`
      : "S3 sample_policy must declare max_active_samples, NEWEST_VALID_SAMPLE_REPLACES_OLDEST_ACTIVE_SAMPLE, and uniqueness_basis=sample_nullifier."
  );
  addS3Check(
    checks,
    gaps,
    credentialBindingPresent ? "PASS" : "WARN",
    id,
    "S3_CREDENTIAL_BINDING_DECLARED",
    credentialBindingPresent ? "S3 credential_binding includes credential_hash and sample_nullifier." : "S3 credential_binding is missing credential_hash or sample_nullifier; the sample is not strongly bound to a product/service credential."
  );
  addS3Check(
    checks,
    gaps,
    duplicateControlPresent ? "PASS" : "WARN",
    id,
    "S3_DUPLICATE_CONTROL_DECLARED",
    duplicateControlPresent ? "S3 sample_nullifier is declared for duplicate control." : "S3 sample_nullifier is missing; duplicate sample submissions cannot be detected."
  );
  addS3Check(
    checks,
    gaps,
    credentialVerifiedAgainstRoot ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S3_CREDENTIAL_ROOT_VERIFIED_DECLARED",
    credentialVerifiedAgainstRoot ? "S3 credential binding is declared as verified against the organization root chain." : "S3 credential binding is not declared as verified against the organization root chain."
  );
  addS3Check(
    checks,
    gaps,
    samplingPlanPresent ? "PASS" : "WARN",
    id,
    "S3_SAMPLING_PLAN_DECLARED",
    samplingPlanPresent ? "S3 sampling_plan is declared." : "S3 sampling_plan is missing or incomplete; random-selection meaning cannot be assessed."
  );
  addS3Check(
    checks,
    gaps,
    organizationCanChooseSamples ? "WARN" : organizationCanChooseSamplesDeclared ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S3_ORGANIZATION_CANNOT_CHOOSE_SAMPLES",
    organizationCanChooseSamples
      ? "S3 sampling_plan says the organization can choose samples; this is weak S3."
      : organizationCanChooseSamplesDeclared
        ? "S3 sampling_plan says the organization cannot choose samples."
        : "S3 sampling_plan.organization_can_choose_samples is not declared."
  );
  addS3Check(checks, gaps, scopeText ? "PASS" : "MANUAL_CHECK_REQUIRED", id, "S3_SCOPE_DECLARED", scopeText ? "S3 claimed support scope is declared." : "S3 scope_text is missing; scope review is required.");
  addS3Check(checks, gaps, limitations.length > 0 ? "PASS" : "MANUAL_CHECK_REQUIRED", id, "S3_LIMITATIONS_DECLARED", limitations.length > 0 ? "S3 limitations are declared." : "S3 limitations are missing.");
  addS3Check(
    checks,
    gaps,
    sampleIdentityPresent ? "PASS" : "WARN",
    id,
    "S3_SAMPLE_IDENTITY_DECLARED",
    sampleIdentityPresent ? `S3 sample binds to ${subjectType}:${subjectId}.` : "S3 sample_identity.subject_type and sample_identity.subject_id are required."
  );
  addS3Check(
    checks,
    gaps,
    acquiredAtPresent ? "PASS" : "WARN",
    id,
    "S3_ACQUIRED_AT_DECLARED",
    acquiredAtPresent ? "S3 acquired_at is declared." : "S3 sampling_event.acquired_at is missing or invalid."
  );
  addS3Check(
    checks,
    gaps,
    sampleSize > 0 ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S3_SAMPLE_SIZE_DECLARED",
    sampleSize > 0 ? `S3 sample size is ${sampleSize}.` : "S3 sampling_event.sample_size is missing or invalid."
  );
  addS3Check(
    checks,
    gaps,
    isUnknownOrMissing(sampleSource) ? "MANUAL_CHECK_REQUIRED" : "PASS",
    id,
    "S3_SAMPLE_SOURCE_DISCLOSED",
    isUnknownOrMissing(sampleSource) ? "S3 sampling_event.sample_source is missing or unknown." : `S3 sample source is ${sampleSource}.`
  );
  addS3Check(
    checks,
    gaps,
    isUnknownOrMissing(selectedBy) ? "MANUAL_CHECK_REQUIRED" : "PASS",
    id,
    "S3_SELECTED_BY_DISCLOSED",
    isUnknownOrMissing(selectedBy) ? "S3 sampling_event.selected_by is missing or unknown." : `S3 selected_by is ${selectedBy}.`
  );
  addS3Check(
    checks,
    gaps,
    organizationProvidedDeclared ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S3_ORGANIZATION_PROVIDED_DECLARED",
    organizationProvidedDeclared ? "S3 organization_provided_sample is declared." : "S3 organization_provided_sample is not declared."
  );
  addS3Check(
    checks,
    gaps,
    organizationSelectedSample ? "WARN" : "PASS",
    id,
    "S3_ORGANIZATION_NOT_SELECTOR",
    organizationSelectedSample ? "S3 sample appears selected by the organization or first party." : "S3 sample selector is not organization-controlled."
  );
  addS3Check(
    checks,
    gaps,
    organizationProvidedSample ? "WARN" : "PASS",
    id,
    "S3_ORGANIZATION_NOT_PROVIDER",
    organizationProvidedSample ? "S3 sample appears provided by the organization or first party." : "S3 sample source is not organization-provided."
  );
  addS3Check(
    checks,
    gaps,
    custodyDocumented ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S3_CUSTODY_DOCUMENTED",
    custodyDocumented ? "S3 custody is documented." : "S3 custody is not documented; acceptable for S3_1 but weak for higher-assurance review."
  );
  addS3Check(
    checks,
    gaps,
    rawEvidenceReferencePresent ? "PASS" : "WARN",
    id,
    "S3_RAW_EVIDENCE_REFERENCE_DECLARED",
    rawEvidenceReferencePresent
      ? `S3 raw evidence reference is declared with ${rawAvailabilityStatus}.`
      : "S3 raw_evidence.bundle_hash and a known raw_availability_status are required so agents can see where the underlying material is or was held."
  );
  addS3Check(
    checks,
    gaps,
    storageRoleKnown ? (storageRole === "ORGANIZATION_CONTROLLED" ? "MANUAL_CHECK_REQUIRED" : "PASS") : "MANUAL_CHECK_REQUIRED",
    id,
    "S3_STORAGE_ROLE_DECLARED",
    storageRoleKnown
      ? storageRole === "ORGANIZATION_CONTROLLED"
        ? "S3 raw storage role is ORGANIZATION_CONTROLLED; useful for availability, but weaker than an external vault for externally controlled S3."
        : `S3 raw storage role is ${storageRole}.`
      : "S3 raw_evidence.storage_role should be ORGANIZATION_CONTROLLED, DIRECTORY_VAULT, or PUBLIC_INTEREST_ARCHIVE."
  );
  if (state === "S3_2_CUSTODY_DOCUMENTED") {
    addS3Check(
      checks,
      gaps,
      "MANUAL_CHECK_REQUIRED",
      id,
      "S3_CUSTODY_ROUTE_CHECKED",
      "S3_2 requires custody route review. Local audit records this as S3_1 until custody route adapters are implemented."
    );
  }
  if (state === "S3_3_INDEPENDENT_TEST_RECORDED") {
    addS3Check(
      checks,
      gaps,
      "MANUAL_CHECK_REQUIRED",
      id,
      "S3_INDEPENDENT_TEST_RECORDED",
      "S3_3 requires independent test record review. Local audit records this as S3_1 until independent test route adapters are implemented."
    );
  }

  const hasRequiredCore =
    sClass === "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING" &&
    state !== "CANDIDATE_UNVERIFIED_SAMPLING" &&
    Boolean(sampleType) &&
    Boolean(samplerType) &&
    claimRefs.length > 0 &&
    unresolvedClaimRefs.length === 0 &&
    claimBindingPresent &&
    samplePoolPresent &&
    sampleSlotDeclared &&
    finiteSamplePolicyPresent &&
    credentialBindingPresent &&
    duplicateControlPresent &&
    credentialVerifiedAgainstRoot &&
    samplingPlanPresent &&
    !organizationCanChooseSamples &&
    Boolean(scopeText) &&
    limitations.length > 0 &&
    sampleIdentityPresent &&
    acquiredAtPresent &&
    sampleSize > 0 &&
    !isUnknownOrMissing(sampleSource) &&
    !isUnknownOrMissing(selectedBy) &&
    organizationProvidedDeclared &&
    !organizationSelectedSample &&
    !organizationProvidedSample &&
    rawEvidenceReferencePresent &&
    storageRoleKnown;

  if (!hasRequiredCore) state = "CANDIDATE_UNVERIFIED_SAMPLING";
  if (state === "S3_2_CUSTODY_DOCUMENTED" || state === "S3_3_INDEPENDENT_TEST_RECORDED") state = "S3_1_SAMPLING_ROUTE_PROVIDED";
  const effective = S3_EFFECTIVE_STATES.has(state);

  return {
    declared_state: declaredState,
    state,
    effective,
    claim_refs: claimRefs,
    unresolved_claim_refs: unresolvedClaimRefs,
    sample_type: sampleType,
    sampler_type: samplerType,
    sample_source: sampleSource,
    selected_by: selectedBy,
    sample_size: sampleSize,
    claim_binding_present: claimBindingPresent,
    sample_pool_id: samplePoolId,
    sample_slot_id: sampleSlotId,
    sample_slot_declared: sampleSlotDeclared,
    finite_sample_policy_present: finiteSamplePolicyPresent,
    max_active_samples: maxActiveSamples,
    duplicate_control_present: duplicateControlPresent,
    credential_binding_present: credentialBindingPresent,
    credential_verified_against_root: credentialVerifiedAgainstRoot,
    sampling_plan_present: samplingPlanPresent,
    organization_can_choose_samples: organizationCanChooseSamples,
    subject_type: subjectType,
    subject_id: subjectId,
    batch_id: batchId,
    serial_or_unit_id: serialOrUnitId,
    organization_selected_sample: organizationSelectedSample,
    organization_provided_sample: organizationProvidedSample,
    sample_identity_present: sampleIdentityPresent,
    acquired_at_present: acquiredAtPresent,
    raw_evidence_reference_present: rawEvidenceReferencePresent,
    raw_availability_status: rawAvailabilityStatus,
    storage_role: storageRole,
    custody_documented: custodyDocumented,
    gaps: uniqueStrings(gaps),
    checks
  };
}

function emptyS3Audit(): S3EvidenceAudit {
  return {
    declared_state: "",
    state: "NOT_S3",
    effective: false,
    claim_refs: [],
    unresolved_claim_refs: [],
    sample_type: "",
    sampler_type: "",
    sample_source: "",
    selected_by: "",
    sample_size: 0,
    claim_binding_present: false,
    sample_pool_id: "",
    sample_slot_id: "",
    sample_slot_declared: false,
    finite_sample_policy_present: false,
    max_active_samples: 0,
    duplicate_control_present: false,
    credential_binding_present: false,
    credential_verified_against_root: false,
    sampling_plan_present: false,
    organization_can_choose_samples: false,
    subject_type: "",
    subject_id: "",
    batch_id: "",
    serial_or_unit_id: "",
    organization_selected_sample: false,
    organization_provided_sample: false,
    sample_identity_present: false,
    acquired_at_present: false,
    raw_evidence_reference_present: false,
    raw_availability_status: "",
    storage_role: "",
    custody_documented: false,
    gaps: [],
    checks: []
  };
}

function auditS4Observation(item: Record<string, JsonValue>, now: Date, claimIds: Set<string>, hasExternalLocation: boolean): S4EvidenceAudit {
  const id = stringValue(item.id);
  const sClass = stringValue(item.s_class);
  const s4 = asRecord(item.s4);
  const isDeclaredS4 = sClass === "S4_REAL_WORLD_OBSERVATION" || Object.keys(s4).length > 0;
  if (!isDeclaredS4) return emptyS4Audit();

  const support = asRecord(s4.organization_claimed_support);
  const observer = asRecord(s4.observer);
  const subject = asRecord(s4.subject);
  const window = asRecord(s4.observation_window);
  const metricSummary = asRecord(s4.metric_summary);
  const rawEvidence = asRecord(s4.raw_evidence);
  const health = asRecord(s4.health);
  const checks: ValueAuditCheck[] = [];
  const gaps: string[] = [];
  const declaredState = stringValue(s4.state);
  let state: S4ObservationState = isS4ObservationState(declaredState) ? declaredState : "CANDIDATE_UNVERIFIED_OBSERVATION";
  const observationType = stringValue(s4.observation_type);
  const observerType = stringValue(observer.type);
  const observerIdOrOrigin = stringValue(observer.id_or_origin) || stringValue(observer.origin) || stringValue(observer.id);
  const subjectType = stringValue(subject.subject_type);
  const subjectId = stringValue(subject.subject_id);
  const claimRefs = uniqueStrings([...arrayStrings(support.claim_refs), ...relationClaimRefs(item)]);
  const unresolvedClaimRefs = claimRefs.filter((ref) => !claimIds.has(ref));
  const scopeText = stringValue(support.scope_text);
  const limitations = uniqueStrings([...arrayStrings(support.limitations), ...arrayStrings(s4.limitations)]);
  const windowStart = stringValue(window.start);
  const windowEnd = stringValue(window.end);
  const observationWindowPresent = validTimestamp(windowStart) && validTimestamp(windowEnd) && Date.parse(windowEnd) >= Date.parse(windowStart);
  const currentWindow = observationWindowPresent ? isCurrentObservationWindow(windowEnd, now) : false;
  const metricType = stringValue(s4.metric_type);
  const metricSummaryPresent = Object.keys(metricSummary).length > 0;
  const rawBundleHash = stringValue(rawEvidence.bundle_hash) || stringValue(rawEvidence.bundle_manifest_hash);
  const rawBundleHashValid = isSha256Digest(rawBundleHash);
  const rawVaults = [...arrayObjects(rawEvidence.vaults), ...arrayObjects(rawEvidence.locations_or_vaults)];
  const rawBundleLocationPresent = rawVaults.length > 0 || hasExternalLocation;

  addS4Check(
    checks,
    gaps,
    sClass === "S4_REAL_WORLD_OBSERVATION" ? "PASS" : "WARN",
    id,
    "S4_CORE_FIELDS_PRESENT",
    sClass === "S4_REAL_WORLD_OBSERVATION" ? "S4 class is declared." : "S4 metadata is present but s_class is not S4_REAL_WORLD_OBSERVATION."
  );
  addS4Check(
    checks,
    gaps,
    state === "CANDIDATE_UNVERIFIED_OBSERVATION" ? "WARN" : "PASS",
    id,
    "S4_STATE_DECLARED",
    state === "CANDIDATE_UNVERIFIED_OBSERVATION" ? "S4 state is missing, unsupported, or explicitly candidate-only." : `S4 state is ${state}.`
  );
  addS4Check(checks, gaps, observationType ? "PASS" : "WARN", id, "S4_OBSERVATION_TYPE_DECLARED", observationType ? `S4 observation type is ${observationType}.` : "S4 observation_type is missing.");
  addS4Check(
    checks,
    gaps,
    observerType && observerIdOrOrigin ? "PASS" : "WARN",
    id,
    "S4_OBSERVER_DECLARED",
    observerType && observerIdOrOrigin ? `S4 observer is ${observerType}:${observerIdOrOrigin}.` : "S4 observer.type and observer.id_or_origin are required."
  );
  addS4Check(
    checks,
    gaps,
    claimRefs.length === 0 ? "WARN" : unresolvedClaimRefs.length > 0 ? "FAIL" : "PASS",
    id,
    "S4_CLAIM_REFS_RESOLVE",
    claimRefs.length === 0
      ? "S4 observation does not declare which claim it supports."
      : unresolvedClaimRefs.length > 0
        ? `S4 observation references unknown claim(s): ${unresolvedClaimRefs.join(", ")}.`
        : "S4 claim references resolve."
  );
  addS4Check(checks, gaps, scopeText ? "PASS" : "MANUAL_CHECK_REQUIRED", id, "S4_SCOPE_DECLARED", scopeText ? "S4 claimed support scope is declared." : "S4 scope_text is missing; scope review is required.");
  addS4Check(checks, gaps, limitations.length > 0 ? "PASS" : "MANUAL_CHECK_REQUIRED", id, "S4_LIMITATIONS_DECLARED", limitations.length > 0 ? "S4 limitations are declared." : "S4 limitations are missing.");
  addS4Check(
    checks,
    gaps,
    subjectType && subjectId ? "PASS" : "WARN",
    id,
    "S4_SUBJECT_DECLARED",
    subjectType && subjectId ? `S4 observation binds to ${subjectType}:${subjectId}.` : "S4 subject.subject_type and subject.subject_id are required."
  );
  addS4Check(
    checks,
    gaps,
    observationWindowPresent ? "PASS" : "WARN",
    id,
    "S4_OBSERVATION_WINDOW_DECLARED",
    observationWindowPresent ? `S4 observation window is ${windowStart}/${windowEnd}.` : "S4 observation_window.start/end are missing, invalid, or reversed."
  );
  addS4Check(checks, gaps, metricType ? "PASS" : "WARN", id, "S4_METRIC_TYPE_DECLARED", metricType ? `S4 metric type is ${metricType}.` : "S4 metric_type is missing.");
  addS4Check(
    checks,
    gaps,
    metricSummaryPresent ? "PASS" : "WARN",
    id,
    "S4_METRIC_SUMMARY_DECLARED",
    metricSummaryPresent ? "S4 metric_summary is present." : "S4 metric_summary is missing."
  );
  addS4Check(
    checks,
    gaps,
    rawBundleHashValid ? "PASS" : "WARN",
    id,
    "S4_RAW_BUNDLE_HASH_DECLARED",
    rawBundleHashValid ? "S4 raw bundle hash is declared." : "S4 raw_evidence.bundle_hash must be sha256:<64 hex chars>."
  );
  addS4Check(
    checks,
    gaps,
    rawBundleLocationPresent ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S4_RAW_BUNDLE_LOCATION_DECLARED",
    rawBundleLocationPresent ? "S4 raw bundle location or evidence location is present." : "S4 raw evidence vault/location is missing."
  );
  addS4Check(
    checks,
    gaps,
    stringValue(health.maintenance_status) ? "PASS" : "MANUAL_CHECK_REQUIRED",
    id,
    "S4_HEALTH_DECLARED",
    stringValue(health.maintenance_status) ? `S4 health is ${stringValue(health.maintenance_status)}.` : "S4 health.maintenance_status is missing."
  );
  if (state === "S4_2_RAW_BUNDLE_AVAILABLE") {
    addS4Check(checks, gaps, "MANUAL_CHECK_REQUIRED", id, "S4_RAW_BUNDLE_REVIEWED", "S4_2 requires raw-bundle availability review. Local audit records this as S4_1 until route adapters are implemented.");
  }
  if (state === "S4_3_OBSERVER_OR_DIRECTORY_REVIEWED") {
    addS4Check(checks, gaps, "MANUAL_CHECK_REQUIRED", id, "S4_OBSERVER_OR_DIRECTORY_REVIEWED", "S4_3 requires observer signature or directory review. Local audit records this as S4_1 until review workflows are implemented.");
  }

  const hasRequiredCore =
    sClass === "S4_REAL_WORLD_OBSERVATION" &&
    state !== "CANDIDATE_UNVERIFIED_OBSERVATION" &&
    Boolean(observationType) &&
    Boolean(observerType) &&
    Boolean(observerIdOrOrigin) &&
    claimRefs.length > 0 &&
    unresolvedClaimRefs.length === 0 &&
    Boolean(scopeText) &&
    limitations.length > 0 &&
    Boolean(subjectType) &&
    Boolean(subjectId) &&
    observationWindowPresent &&
    Boolean(metricType) &&
    metricSummaryPresent &&
    rawBundleHashValid &&
    rawBundleLocationPresent;

  if (!hasRequiredCore) state = "CANDIDATE_UNVERIFIED_OBSERVATION";
  if (state === "S4_2_RAW_BUNDLE_AVAILABLE" || state === "S4_3_OBSERVER_OR_DIRECTORY_REVIEWED") state = "S4_1_OBSERVATION_SUMMARY_PROVIDED";
  const effective = S4_EFFECTIVE_STATES.has(state);

  return {
    declared_state: declaredState,
    state,
    effective,
    claim_refs: claimRefs,
    unresolved_claim_refs: unresolvedClaimRefs,
    observation_type: observationType,
    observer_type: observerType,
    observer_id_or_origin: observerIdOrOrigin,
    subject_type: subjectType,
    subject_id: subjectId,
    observation_window_present: observationWindowPresent,
    current_window: currentWindow,
    metric_type: metricType,
    metric_summary_present: metricSummaryPresent,
    raw_bundle_hash_valid: rawBundleHashValid,
    raw_bundle_location_present: rawBundleLocationPresent,
    gaps: uniqueStrings(gaps),
    checks
  };
}

function emptyS4Audit(): S4EvidenceAudit {
  return {
    declared_state: "",
    state: "NOT_S4",
    effective: false,
    claim_refs: [],
    unresolved_claim_refs: [],
    observation_type: "",
    observer_type: "",
    observer_id_or_origin: "",
    subject_type: "",
    subject_id: "",
    observation_window_present: false,
    current_window: false,
    metric_type: "",
    metric_summary_present: false,
    raw_bundle_hash_valid: false,
    raw_bundle_location_present: false,
    gaps: [],
    checks: []
  };
}

function auditClaim(
  claim: Record<string, JsonValue>,
  evidenceById: Map<string, Record<string, JsonValue>>,
  evidenceAudits: EvidenceValueAudit[]
): ClaimValueAudit {
  const id = stringValue(claim.id);
  const refs = arrayStrings(claim.evidence_refs);
  const resolved = refs.filter((ref) => evidenceById.has(ref));
  const missing = refs.filter((ref) => !evidenceById.has(ref));
  const referencedEvidence = evidenceAudits.filter((item) => resolved.includes(item.id));
  const hasThirdPartyEvidence = referencedEvidence.some((item) => !isFirstPartyIssuer(item.issuer_type));
  const hasReproducibleEvidence = referencedEvidence.some((item) => evidenceHasReproduciblePath(item));
  const findings: string[] = [];

  if (refs.length === 0) findings.push("Claim has no evidence_refs and remains self-asserted.");
  for (const ref of missing) findings.push(`Claim references missing evidence: ${ref}.`);
  if (!hasLimitations(claim)) findings.push("Claim has no limitations field.");
  if (!hasScope(claim)) findings.push("Claim has no explicit scope.");
  if (hasBroadMarketingLanguage(stringValue(claim.claim_text))) {
    findings.push("Claim contains broad marketing language that needs human review.");
  }

  const level = claimLevel(claim, referencedEvidence);
  const supportAxes = claimSupportAxes(claim, referencedEvidence);
  const profileReview = reviewClaimProfile(claim, referencedEvidence);
  const subjectCoverage = reviewSubjectCoverage(claim, referencedEvidence);
  const riskGaps = [
    ...claimRiskGaps(claim, refs, missing, referencedEvidence, supportAxes),
    ...profileReview.risk_gaps,
    ...subjectCoverage.gaps
  ];
  const hasHardFailure = missing.length > 0;
  const status = hasHardFailure
    ? statusFromFindings(findings, true)
    : worstStatus(statusFromFindings(findings, false), [
        profileReview.status === "WARN" ? "WARN" : "PASS",
        subjectCoverage.status
      ]);
  return {
    id,
    status,
    level,
    protocol_support_level: protocolSupportLevel(claim, refs, missing, referencedEvidence),
    support_axes: supportAxes,
    risk_gaps: riskGaps,
    next_best_actions: uniqueStrings([
      ...claimNextBestActions(riskGaps),
      ...profileReview.next_best_actions,
      ...subjectCoverage.next_best_actions
    ]),
    organchor_trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR",
    policy_route: claimPolicyRoute(refs, missing, riskGaps, referencedEvidence),
    profile_review: profileReview,
    subject_coverage: subjectCoverage,
    has_third_party_evidence: hasThirdPartyEvidence,
    has_reproducible_evidence: hasReproducibleEvidence,
    evidence_refs: refs,
    resolved_evidence_refs: resolved,
    missing_evidence_refs: missing,
    findings
  };
}

function evidenceChecks(audit: EvidenceValueAudit): ValueAuditCheck[] {
  const checks: ValueAuditCheck[] = [];
  checks.push(
    audit.has_external_location
      ? pass(`evidence:${audit.id}:location`, `Evidence ${audit.id} location`, "Evidence has at least one external/public location.")
      : warn(`evidence:${audit.id}:location`, `Evidence ${audit.id} location`, "Evidence has no external/public location.")
  );
  checks.push(
    isFirstPartyIssuer(audit.issuer_type)
      ? manual(
          `evidence:${audit.id}:issuer`,
          `Evidence ${audit.id} issuer`,
          "Evidence is first-party. This may be valid, but it is not independent evidence."
        )
      : pass(`evidence:${audit.id}:issuer`, `Evidence ${audit.id} issuer`, `Evidence issuer type is ${audit.issuer_type}.`)
  );
  checks.push(
    audit.reproducibility === "not_specified"
      ? manual(
          `evidence:${audit.id}:reproducibility`,
          `Evidence ${audit.id} reproducibility`,
          "Evidence reproducibility is not specified."
        )
      : pass(
          `evidence:${audit.id}:reproducibility`,
          `Evidence ${audit.id} reproducibility`,
          `Evidence reproducibility is ${audit.reproducibility}.`
        )
  );
  if (audit.is_stale) {
    checks.push(warn(`evidence:${audit.id}:freshness`, `Evidence ${audit.id} freshness`, "Evidence is past its valid_until date."));
  }
  if (audit.missing_method_refs.length > 0) {
    checks.push(
      failCheck(
        `evidence:${audit.id}:method_refs`,
        `Evidence ${audit.id} recheck methods`,
        `Evidence references missing recheck methods: ${audit.missing_method_refs.join(", ")}.`
      )
    );
  } else if (audit.has_recheck_method) {
    checks.push(
      pass(
        `evidence:${audit.id}:method_refs`,
        `Evidence ${audit.id} recheck methods`,
        audit.has_low_cost_recheck_method
          ? "Evidence links to a low-cost recheck method."
          : "Evidence links to a recheck method."
      )
    );
  }
  checks.push(...audit.s2.checks, ...audit.s3.checks, ...audit.s4.checks);
  return checks;
}

function claimChecks(claim: Record<string, JsonValue>, audit: ClaimValueAudit): ValueAuditCheck[] {
  const checks: ValueAuditCheck[] = [];
  if (audit.evidence_refs.length === 0) {
    checks.push(warn(`claim:${audit.id}:evidence`, `Claim ${audit.id} evidence`, "Claim has no evidence_refs."));
  } else if (audit.missing_evidence_refs.length > 0) {
    checks.push(
      failCheck(
        `claim:${audit.id}:evidence`,
        `Claim ${audit.id} evidence`,
        `Claim references missing evidence: ${audit.missing_evidence_refs.join(", ")}.`
      )
    );
  } else {
    checks.push(pass(`claim:${audit.id}:evidence`, `Claim ${audit.id} evidence`, "Claim references existing evidence."));
  }

  checks.push(
    hasLimitations(claim)
      ? pass(`claim:${audit.id}:limitations`, `Claim ${audit.id} limitations`, "Claim includes limitations.")
      : warn(`claim:${audit.id}:limitations`, `Claim ${audit.id} limitations`, "Claim has no limitations field.")
  );
  checks.push(
    hasScope(claim)
      ? pass(`claim:${audit.id}:scope`, `Claim ${audit.id} scope`, "Claim includes explicit scope.")
      : manual(`claim:${audit.id}:scope`, `Claim ${audit.id} scope`, "Claim has no explicit scope.")
  );
  if (hasBroadMarketingLanguage(stringValue(claim.claim_text))) {
    checks.push(
      manual(
        `claim:${audit.id}:marketing_language`,
        `Claim ${audit.id} marketing language`,
        "Claim contains broad marketing language that should be narrowed or backed by stronger evidence."
      )
    );
  }
  if (audit.profile_review.status === "PASS") {
    checks.push(
      pass(
        `claim:${audit.id}:profile`,
        `Claim ${audit.id} real-world profile`,
        `Claim satisfies the minimum ${audit.profile_review.profile} profile checks.`
      )
    );
  } else if (audit.profile_review.status === "WARN") {
    checks.push(
      warn(
        `claim:${audit.id}:profile`,
        `Claim ${audit.id} real-world profile`,
        `Claim is missing profile fields: ${audit.profile_review.missing_fields.join(", ")}.`,
        {
          profile: audit.profile_review.profile,
          missing_fields: audit.profile_review.missing_fields,
          next_best_actions: audit.profile_review.next_best_actions
        }
      )
    );
  }
  checks.push(
    buildCheck(
      `claim:${audit.id}:subject_coverage`,
      `Claim ${audit.id} subject coverage`,
      audit.subject_coverage.status,
      subjectCoverageSummary(audit.subject_coverage),
      {
        claim_subject: audit.subject_coverage.claim_subject,
        relations: audit.subject_coverage.relations,
        gaps: audit.subject_coverage.gaps,
        not_a_trust_decision: true
      }
    )
  );
  return checks;
}

function reviewSubjectCoverage(claim: Record<string, JsonValue>, evidence: EvidenceValueAudit[]): SubjectCoverageReview {
  const claimSubject = extractClaimSubject(claim);
  const relations = emptySubjectRelations();
  const evidenceSubjects: EvidenceSubjectCoverage[] = evidence.map((item) => {
    const relation = subjectCoverageRelation(claimSubject, item.subject);
    relations[relation] += 1;
    return {
      evidence_id: item.id,
      subject: item.subject,
      relation,
      summary: subjectRelationSummary(claimSubject, item.subject, relation)
    };
  });

  const gaps: string[] = [];
  const nextBestActions: string[] = [];
  if (evidence.length > 0 && !isKnownSubject(claimSubject)) {
    gaps.push("Claim subject is unknown, so evidence coverage cannot be mechanically checked.");
    nextBestActions.push("Declare claim.subject or a specific product_id, service_id, batch_id, deployment_id, or dataset version.");
  }
  for (const item of evidenceSubjects) {
    if (item.relation === "EXACT_SUBJECT_MATCH") continue;
    gaps.push(item.summary);
  }
  if (relations.SUBJECT_UNKNOWN > 0) {
    nextBestActions.push("Bind every evidence item to the exact subject it supports, or mark it as broad organization material.");
  }
  if (relations.SUBJECT_ID_MISMATCH > 0) {
    nextBestActions.push("Align evidence subject_id with the claim subject_id, or split the claim by product/service/model.");
  }
  if (relations.EVIDENCE_BROADER_THAN_CLAIM > 0 || relations.FAMILY_TO_MODEL_REVIEW_REQUIRED > 0 || relations.ORGANIZATION_TO_PRODUCT_UNSUPPORTED > 0) {
    nextBestActions.push("Add scope text proving the broader material explicitly covers the narrower claim subject.");
  }
  if (relations.EVIDENCE_NARROWER_THAN_CLAIM > 0 || relations.BATCH_TO_FUTURE_BATCH_UNSUPPORTED > 0) {
    nextBestActions.push("Narrow the claim or add additional evidence that covers the broader product/service range.");
  }

  const uniqueGaps = uniqueStrings(gaps);
  return {
    status: subjectCoverageStatus(relations, evidence.length, uniqueGaps),
    claim_subject: claimSubject,
    evidence_subjects: evidenceSubjects,
    relations,
    gaps: uniqueGaps,
    next_best_actions: uniqueStrings(nextBestActions),
    not_a_trust_decision: true
  };
}

function subjectCoverageStatus(
  relations: Record<SubjectCoverageRelation, number>,
  evidenceCount: number,
  gaps: string[]
): AuditStatus {
  if (evidenceCount === 0 || gaps.length === 0) return "PASS";
  if (relations.SUBJECT_UNKNOWN > 0) return "MANUAL_CHECK_REQUIRED";
  return "WARN";
}

function subjectCoverageSummary(review: SubjectCoverageReview): string {
  if (review.evidence_subjects.length === 0) return "No resolved evidence is available for subject coverage review.";
  if (review.status === "PASS") return `All resolved evidence subject bindings match ${subjectLabel(review.claim_subject)}.`;
  return `${review.gaps.length} subject coverage gap(s) found for ${subjectLabel(review.claim_subject)}.`;
}

function subjectCoverageRelation(claimSubject: SubjectRef, evidenceSubject: SubjectRef): SubjectCoverageRelation {
  if (!isKnownSubject(claimSubject) || !isKnownSubject(evidenceSubject)) return "SUBJECT_UNKNOWN";
  const claimType = normalizeSubjectType(claimSubject.subject_type);
  const evidenceType = normalizeSubjectType(evidenceSubject.subject_type);
  const claimId = normalizeSubjectId(claimSubject.subject_id);
  const evidenceId = normalizeSubjectId(evidenceSubject.subject_id);
  if (claimType === evidenceType) return claimId === evidenceId ? "EXACT_SUBJECT_MATCH" : "SUBJECT_ID_MISMATCH";
  if (evidenceType === "organization" && claimType !== "organization") return "ORGANIZATION_TO_PRODUCT_UNSUPPORTED";
  if (isFamilyType(evidenceType) && isModelOrLowerType(claimType)) return "FAMILY_TO_MODEL_REVIEW_REQUIRED";
  if (isBatchOrLowerType(evidenceType) && !isBatchOrLowerType(claimType)) return "BATCH_TO_FUTURE_BATCH_UNSUPPORTED";

  const claimRank = subjectSpecificityRank(claimType);
  const evidenceRank = subjectSpecificityRank(evidenceType);
  if (evidenceRank < claimRank) return "EVIDENCE_BROADER_THAN_CLAIM";
  if (evidenceRank > claimRank) return "EVIDENCE_NARROWER_THAN_CLAIM";
  return "SUBJECT_UNKNOWN";
}

function subjectRelationSummary(claimSubject: SubjectRef, evidenceSubject: SubjectRef, relation: SubjectCoverageRelation): string {
  const claim = subjectLabel(claimSubject);
  const evidence = subjectLabel(evidenceSubject);
  switch (relation) {
    case "EXACT_SUBJECT_MATCH":
      return `Evidence subject ${evidence} exactly matches claim subject ${claim}.`;
    case "SUBJECT_ID_MISMATCH":
      return `Evidence subject ${evidence} has the same subject type as claim subject ${claim}, but the subject_id differs.`;
    case "EVIDENCE_BROADER_THAN_CLAIM":
      return `Evidence subject ${evidence} is broader than claim subject ${claim}; scope review is required.`;
    case "EVIDENCE_NARROWER_THAN_CLAIM":
      return `Evidence subject ${evidence} is narrower than claim subject ${claim}; it must not be used to prove the broader claim by itself.`;
    case "FAMILY_TO_MODEL_REVIEW_REQUIRED":
      return `Evidence subject ${evidence} is family-level while claim subject ${claim} is model-level or lower; explicit scope coverage is required.`;
    case "BATCH_TO_FUTURE_BATCH_UNSUPPORTED":
      return `Evidence subject ${evidence} is batch/lot/unit-level while claim subject ${claim} is broader; it does not support future or broader production by itself.`;
    case "ORGANIZATION_TO_PRODUCT_UNSUPPORTED":
      return `Evidence subject ${evidence} is organization-level while claim subject ${claim} is product/service-specific; exact coverage is not established.`;
    case "SUBJECT_UNKNOWN":
      return `Claim subject ${claim} or evidence subject ${evidence} is unknown; mechanical coverage review is not possible.`;
  }
}

function extractClaimSubject(claim: Record<string, JsonValue>): SubjectRef {
  const direct = subjectFromRecord(asRecord(claim.subject), "claim.subject");
  if (isKnownSubject(direct)) return direct;

  const scope = asRecord(claim.claim_scope);
  const scoped = subjectFromRecord(scope, "claim.claim_scope");
  if (isKnownSubject(scoped)) return scoped;

  const scopeCandidates: Array<[string, string, string]> = [
    ["unit", "unit_id", "claim.claim_scope.unit_id"],
    ["unit", "serial_or_unit_id", "claim.claim_scope.serial_or_unit_id"],
    ["batch", "batch_id", "claim.claim_scope.batch_id"],
    ["lot", "lot_id", "claim.claim_scope.lot_id"],
    ["product_model", "model_id", "claim.claim_scope.model_id"],
    ["product_model", "product_model", "claim.claim_scope.product_model"],
    ["product", "product_id", "claim.claim_scope.product_id"],
    ["service_delivery", "delivery_id", "claim.claim_scope.delivery_id"],
    ["service_plan", "service_plan_id", "claim.claim_scope.service_plan_id"],
    ["service", "service_id", "claim.claim_scope.service_id"],
    ["deployment", "deployment_id", "claim.claim_scope.deployment_id"],
    ["project", "project_id", "claim.claim_scope.project_id"],
    ["dataset", "dataset_version", "claim.claim_scope.dataset_version"],
    ["api", "api_id", "claim.claim_scope.api_id"]
  ];
  for (const [subjectType, field, source] of scopeCandidates) {
    const value = stringValue(scope[field]);
    if (value) return buildSubject(subjectType, value, source, stringValue(scope.scope_text) || stringValue(scope.scope));
  }

  const productId = stringValue(claim.product_id);
  if (productId) return buildSubject("product", productId, "claim.product_id");
  const serviceId = stringValue(claim.service_id);
  if (serviceId) return buildSubject("service", serviceId, "claim.service_id");
  return unknownSubject("claim");
}

function evidenceSubject(item: Record<string, JsonValue>, s2: S2EvidenceAudit, s3: S3EvidenceAudit, s4: S4EvidenceAudit): SubjectRef {
  if (s3.subject_type && s3.subject_id) {
    return buildSubject(s3.subject_type, s3.subject_id, "evidence.s3.sample_identity");
  }
  if (s4.subject_type && s4.subject_id) {
    return buildSubject(s4.subject_type, s4.subject_id, "evidence.s4.subject");
  }
  if (s2.covered_subject_type && s2.covered_subject_id) {
    return buildSubject(s2.covered_subject_type, s2.covered_subject_id, "evidence.s2.organization_claimed_support", s2.scope_text);
  }
  const direct = subjectFromRecord(asRecord(item.subject), "evidence.subject");
  if (isKnownSubject(direct)) return direct;
  return unknownSubject("evidence");
}

function subjectFromRecord(record: Record<string, JsonValue>, source: string): SubjectRef {
  const subjectType = stringValue(record.subject_type) || stringValue(record.type) || stringValue(record.covered_subject_type);
  const subjectId = stringValue(record.subject_id) || stringValue(record.id) || stringValue(record.covered_subject_id);
  const scopeText = stringValue(record.scope_text) || stringValue(record.scope);
  if (subjectType && subjectId) return buildSubject(subjectType, subjectId, source, scopeText);
  return unknownSubject(source);
}

function buildSubject(subjectType: string, subjectId: string, source: string, scopeText = ""): SubjectRef {
  const subject: SubjectRef = {
    subject_type: normalizeSubjectType(subjectType),
    subject_id: subjectId,
    source
  };
  if (scopeText) subject.scope_text = scopeText;
  return subject;
}

function unknownSubject(source: string): SubjectRef {
  return {
    subject_type: "unknown",
    subject_id: "unknown",
    source
  };
}

function isKnownSubject(subject: SubjectRef): boolean {
  return Boolean(subject.subject_type && subject.subject_id && subject.subject_type !== "unknown" && subject.subject_id !== "unknown");
}

function subjectLabel(subject: SubjectRef): string {
  return isKnownSubject(subject) ? `${subject.subject_type}:${subject.subject_id}` : `unknown (${subject.source})`;
}

function emptySubjectRelations(): Record<SubjectCoverageRelation, number> {
  return {
    EXACT_SUBJECT_MATCH: 0,
    SUBJECT_ID_MISMATCH: 0,
    EVIDENCE_BROADER_THAN_CLAIM: 0,
    EVIDENCE_NARROWER_THAN_CLAIM: 0,
    FAMILY_TO_MODEL_REVIEW_REQUIRED: 0,
    BATCH_TO_FUTURE_BATCH_UNSUPPORTED: 0,
    ORGANIZATION_TO_PRODUCT_UNSUPPORTED: 0,
    SUBJECT_UNKNOWN: 0
  };
}

function normalizeSubjectType(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-\s]/g, "_");
}

function normalizeSubjectId(value: string): string {
  return value.trim().toLowerCase();
}

function subjectSpecificityRank(type: string): number {
  switch (type) {
    case "organization":
      return 0;
    case "brand":
    case "capability":
    case "discovery_unit":
      return 1;
    case "product_line":
    case "service_line":
      return 2;
    case "product_family":
    case "service_plan":
      return 3;
    case "product":
    case "product_model":
    case "service":
    case "api":
    case "dataset":
      return 4;
    case "variant":
    case "deployment":
    case "project":
    case "service_delivery":
      return 5;
    case "batch":
    case "lot":
    case "region":
    case "time_window":
      return 6;
    case "unit":
      return 7;
    default:
      return 4;
  }
}

function isFamilyType(type: string): boolean {
  return ["product_family", "product_line", "service_line", "service_plan", "discovery_unit"].includes(type);
}

function isModelOrLowerType(type: string): boolean {
  return subjectSpecificityRank(type) >= subjectSpecificityRank("product_model");
}

function isBatchOrLowerType(type: string): boolean {
  return ["batch", "lot", "unit"].includes(type);
}

async function checkLocalLocations(
  item: Record<string, JsonValue>,
  locations: Record<string, JsonValue>[],
  findings: string[]
): Promise<void> {
  const id = stringValue(item.id);
  const expectedHash = stringValue(item.hash);
  for (const location of locations) {
    if (location.type !== "local") continue;
    const uri = stringValue(location.uri);
    if (!uri) {
      findings.push(`Evidence ${id} has a local location without a uri.`);
      continue;
    }
    try {
      const artifact = await hashFile(uri);
      if (artifact.hash !== expectedHash) {
        findings.push(`Local evidence hash mismatch for ${uri}.`);
      }
    } catch {
      findings.push(`Local evidence file cannot be read: ${uri}.`);
    }
  }
}

function claimLevel(claim: Record<string, JsonValue>, referencedEvidence: EvidenceValueAudit[]): ClaimVerificationLevel {
  if (stringValue(claim.time_proven_since)) return "TIME_PROVEN";
  if (referencedEvidence.some((item) => evidenceHasReproduciblePath(item))) return "REPRODUCIBLE";
  if (referencedEvidence.some((item) => !isFirstPartyIssuer(item.issuer_type))) return "THIRD_PARTY";
  if (referencedEvidence.length > 0) return "EVIDENCE_LINKED";
  return "SELF_ASSERTED";
}

function protocolSupportLevel(
  claim: Record<string, JsonValue>,
  refs: string[],
  missing: string[],
  referencedEvidence: EvidenceValueAudit[]
): ClaimProtocolSupportLevel {
  if (missing.length > 0) return "L0_UNSUPPORTED";
  if (refs.length === 0) return "L1_SIGNED_SELF_CLAIM";
  if (stringValue(claim.time_proven_since) && referencedEvidence.length > 0) return "TIME_OBSERVED";
  if (referencedEvidence.some((item) => isDedicatedAttestation(item))) return "L4_INDEPENDENT_ATTESTATION";
  if (referencedEvidence.some((item) => evidenceHasReproduciblePath(item))) return "L3_REPRODUCIBLE_METHOD";
  if (referencedEvidence.length > 0) return "L2_HASH_BOUND_EVIDENCE";
  return "L1_SIGNED_SELF_CLAIM";
}

function claimSupportAxes(claim: Record<string, JsonValue>, referencedEvidence: EvidenceValueAudit[]): ClaimSupportAxes {
  return {
    artifact_integrity: claimArtifactIntegrity(referencedEvidence),
    retrievability: claimRetrievability(referencedEvidence),
    specificity: hasScope(claim) ? "SCOPED" : "BROAD_OR_UNSCOPED",
    limitations: hasLimitations(claim) ? "PRESENT" : "MISSING",
    issuer_independence:
      referencedEvidence.length === 0
        ? "NO_EVIDENCE"
        : referencedEvidence.some((item) => !isFirstPartyIssuer(item.issuer_type))
          ? "INDEPENDENT_EVIDENCE_PRESENT"
          : "FIRST_PARTY_ONLY",
    method_reproducibility: referencedEvidence.some((item) => evidenceHasReproduciblePath(item))
      ? "REPRODUCIBLE_OR_INDEPENDENT"
      : "NOT_SPECIFIED",
    freshness: referencedEvidence.some((item) => item.is_stale) ? "STALE" : "CURRENT_OR_NOT_DATED",
    challenge_status: claimChallengeStatus(claim)
  };
}

function claimArtifactIntegrity(referencedEvidence: EvidenceValueAudit[]): ClaimSupportAxes["artifact_integrity"] {
  if (referencedEvidence.length === 0) return "NOT_CHECKED";
  if (referencedEvidence.some((item) => item.findings.some((finding) => /hash mismatch|cannot be read/i.test(finding)))) {
    return "LOCAL_HASH_FAILED";
  }
  return "HASH_DECLARED";
}

function claimRetrievability(referencedEvidence: EvidenceValueAudit[]): ClaimSupportAxes["retrievability"] {
  if (referencedEvidence.length === 0) return "NO_EVIDENCE";
  const publicCount = referencedEvidence.filter((item) => item.has_external_location).length;
  if (publicCount === referencedEvidence.length) return "HAS_PUBLIC_LOCATIONS";
  if (publicCount > 0) return "PARTIAL_PUBLIC_LOCATIONS";
  return "NO_PUBLIC_LOCATIONS";
}

function claimChallengeStatus(claim: Record<string, JsonValue>): ClaimSupportAxes["challenge_status"] {
  const status = stringValue(claim.status).toLowerCase();
  if (["disputed", "challenged", "withdrawn"].includes(status)) return "DISPUTED_OR_WITHDRAWN";
  if (["superseded", "corrected"].includes(status) || stringValue(claim.superseded_by) || stringValue(claim.corrected_by)) {
    return "SUPERSEDED_OR_CORRECTED";
  }
  return "NO_KNOWN_CHALLENGE";
}

function claimRiskGaps(
  claim: Record<string, JsonValue>,
  refs: string[],
  missing: string[],
  referencedEvidence: EvidenceValueAudit[],
  axes: ClaimSupportAxes
): string[] {
  const gaps: string[] = [];
  if (refs.length === 0) gaps.push("No evidence is linked to this claim.");
  for (const ref of missing) gaps.push(`Evidence reference is missing: ${ref}.`);
  if (axes.specificity === "BROAD_OR_UNSCOPED") gaps.push("Claim has no explicit scope.");
  if (axes.limitations === "MISSING") gaps.push("Claim has no limitations.");
  if (axes.issuer_independence === "FIRST_PARTY_ONLY") gaps.push("Only first-party evidence is linked.");
  if (axes.method_reproducibility === "NOT_SPECIFIED") gaps.push("No explicit recheck method or reproducibility metadata is linked.");
  if (referencedEvidence.some((item) => item.missing_method_refs.length > 0)) {
    gaps.push("At least one linked evidence method reference is missing.");
  }
  if (axes.retrievability === "NO_PUBLIC_LOCATIONS") gaps.push("Linked evidence has no public retrieval location.");
  if (axes.retrievability === "PARTIAL_PUBLIC_LOCATIONS") gaps.push("Only some linked evidence has public retrieval locations.");
  if (axes.artifact_integrity === "LOCAL_HASH_FAILED") gaps.push("At least one local evidence hash check failed.");
  if (axes.freshness === "STALE") gaps.push("At least one linked evidence item is stale.");
  if (axes.challenge_status !== "NO_KNOWN_CHALLENGE") gaps.push("Claim is marked disputed, withdrawn, superseded, or corrected.");
  if (hasBroadMarketingLanguage(stringValue(claim.claim_text))) gaps.push("Claim uses broad marketing language that should be narrowed.");
  if (referencedEvidence.length === 0 && refs.length > 0 && missing.length === 0) gaps.push("Claim has no resolved evidence after audit.");
  return gaps;
}

function claimNextBestActions(riskGaps: string[]): string[] {
  const actions: string[] = [];
  if (riskGaps.some((gap) => /No evidence|missing/i.test(gap))) {
    actions.push("Link at least one hash-bound evidence item to the claim.");
  }
  if (riskGaps.some((gap) => /scope|marketing/i.test(gap))) {
    actions.push("Narrow the claim to a specific product, version, metric, region, or time window.");
  }
  if (riskGaps.some((gap) => /limitations/i.test(gap))) {
    actions.push("Add explicit limitations explaining what the claim does not prove.");
  }
  if (riskGaps.some((gap) => /first-party/i.test(gap))) {
    actions.push("Add an independent attestation or external evidence source for the exact claim.");
  }
  if (riskGaps.some((gap) => /reproducible method|recheck method|reproducibility metadata/i.test(gap))) {
    actions.push("Add a concrete recheck method with steps, expected results, tools, cost, and limitations.");
  }
  if (riskGaps.some((gap) => /public retrieval/i.test(gap))) {
    actions.push("Publish evidence through HTTPS, IPFS, Arweave, Git release, or another public retrieval path.");
  }
  if (riskGaps.some((gap) => /hash check failed/i.test(gap))) {
    actions.push("Fix the artifact hash or replace the evidence with a corrected signed manifest.");
  }
  if (riskGaps.some((gap) => /stale/i.test(gap))) {
    actions.push("Refresh the evidence or mark the claim as expired, superseded, or withdrawn.");
  }
  if (riskGaps.some((gap) => /disputed|withdrawn|superseded|corrected/i.test(gap))) {
    actions.push("Publish a correction or replacement claim that explains the current state.");
  }
  if (actions.length === 0) {
    actions.push("Route this supported claim to the consuming agent's external policy for final trust evaluation.");
  }
  return actions;
}

function claimPolicyRoute(
  refs: string[],
  missing: string[],
  riskGaps: string[],
  referencedEvidence: EvidenceValueAudit[]
): ClaimPolicyRoute {
  if (refs.length === 0 || missing.length > 0 || referencedEvidence.length === 0) return "REQUEST_VALUE_EVIDENCE";
  if (riskGaps.some((gap) => /hash check failed|stale|disputed|withdrawn|superseded|corrected/i.test(gap))) return "REVIEW_VALUE_WARNINGS";
  if (riskGaps.length > 0) return "EXTERNAL_POLICY_REVIEW";
  return "READY_FOR_EXTERNAL_POLICY";
}

function reviewClaimProfile(claim: Record<string, JsonValue>, referencedEvidence: EvidenceValueAudit[]): ClaimProfileReview {
  const profile = normalizeProfile(stringValue(claim.claim_category) || stringValue(claim.profile) || stringValue(claim.claim_type));
  if (!profile) {
    return {
      profile: "not_declared",
      status: "NOT_DECLARED",
      missing_fields: [],
      risk_gaps: [],
      next_best_actions: []
    };
  }

  const missing: string[] = [];
  const gaps: string[] = [];
  const actions: string[] = [];
  for (const requirement of profileRequirements(profile, claim, referencedEvidence)) {
    if (requirement.met()) continue;
    missing.push(requirement.id);
    gaps.push(requirement.risk_gap);
    actions.push(requirement.next_best_action);
  }

  return {
    profile,
    status: missing.length === 0 ? "PASS" : "WARN",
    missing_fields: missing,
    risk_gaps: gaps,
    next_best_actions: uniqueStrings(actions)
  };
}

interface ProfileRequirement {
  id: string;
  met: () => boolean;
  risk_gap: string;
  next_best_action: string;
}

function profileRequirements(
  profile: RealWorldEvidenceProfile,
  claim: Record<string, JsonValue>,
  referencedEvidence: EvidenceValueAudit[]
): ProfileRequirement[] {
  const linkedEvidence = {
    id: "evidence_refs",
    met: () => referencedEvidence.length > 0,
    risk_gap: "Profile claim has no resolved evidence item.",
    next_best_action: "Link at least one hash-bound evidence item to this profile claim."
  };
  const recheckMethod = {
    id: "method_refs",
    met: () => referencedEvidence.some((item) => item.has_recheck_method),
    risk_gap: "Profile claim has no explicit low-friction recheck method.",
    next_best_action: "Attach a recheck method with concrete steps, expected results, tools, cost, and limitations."
  };

  switch (profile) {
    case "physical_product":
      return [
        fieldRequirement(claim, "product_id", ["product_id", "claim_scope.product_id"], "Physical product claim does not identify the product.", "Add product_id to the claim."),
        fieldRequirement(
          claim,
          "claim_scope.batch_or_model",
          ["claim_scope.batch_id", "claim_scope.lot_id", "claim_scope.serial_range", "claim_scope.model", "claim_scope.version"],
          "Physical product claim does not identify a batch, lot, serial range, model, or version.",
          "Add batch_id, lot_id, serial_range, model, or version to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.test_standard",
          ["claim_scope.test_standard", "claim_scope.standard"],
          "Physical product claim does not identify the test standard or inspection standard.",
          "Add test_standard or standard to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.sampling_method",
          ["claim_scope.sampling_method", "claim_scope.sample_size"],
          "Physical product claim does not describe sampling method or sample size.",
          "Add sampling_method or sample_size to claim_scope."
        ),
        linkedEvidence,
        recheckMethod
      ];
    case "service_delivery":
      return [
        fieldRequirement(
          claim,
          "claim_scope.service_or_project",
          ["claim_scope.service_id", "claim_scope.project_id", "product_id"],
          "Service delivery claim does not identify the service or project.",
          "Add service_id, project_id, or product_id."
        ),
        fieldRequirement(
          claim,
          "claim_scope.customer_ref",
          ["claim_scope.customer_ref", "claim_scope.customer_id", "claim_scope.customer_segment"],
          "Service delivery claim does not identify a customer reference or anonymized customer segment.",
          "Add customer_ref, customer_id, or customer_segment."
        ),
        fieldRequirement(
          claim,
          "claim_scope.delivery_date",
          ["claim_scope.delivered_at", "claim_scope.delivery_date", "claim_scope.time_window"],
          "Service delivery claim does not identify a delivery date or delivery window.",
          "Add delivered_at, delivery_date, or time_window."
        ),
        fieldRequirement(
          claim,
          "claim_scope.acceptance_record",
          ["claim_scope.acceptance_record_id", "claim_scope.acceptance_status"],
          "Service delivery claim does not identify acceptance status or acceptance record.",
          "Add acceptance_record_id or acceptance_status."
        ),
        linkedEvidence,
        recheckMethod
      ];
    case "saas_api":
      return [
        fieldRequirement(claim, "claim_scope.metric", ["claim_scope.metric"], "SaaS/API claim does not identify the measured metric.", "Add metric to claim_scope."),
        fieldRequirement(
          claim,
          "claim_scope.time_window",
          ["claim_scope.time_window", "claim_scope.start_at", "claim_scope.period"],
          "SaaS/API claim does not define a measurement time window.",
          "Add time_window, start_at/end_at, or period to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.regions",
          ["claim_scope.regions", "claim_scope.region"],
          "SaaS/API claim does not identify measurement region or regions.",
          "Add region or regions to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.monitoring_method",
          ["claim_scope.monitoring_method", "claim_scope.measurement_method"],
          "SaaS/API claim does not identify the monitoring or measurement method.",
          "Add monitoring_method or measurement_method to claim_scope."
        ),
        linkedEvidence,
        recheckMethod
      ];
    case "certification_compliance":
      return [
        fieldRequirement(
          claim,
          "claim_scope.certificate_id",
          ["claim_scope.certificate_id", "claim_scope.registration_id"],
          "Certification claim does not identify a certificate or registration id.",
          "Add certificate_id or registration_id to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.issuer",
          ["claim_scope.issuer", "claim_scope.authority"],
          "Certification claim does not identify the issuer or authority.",
          "Add issuer or authority to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.valid_from",
          ["claim_scope.valid_from"],
          "Certification claim does not identify when validity begins.",
          "Add valid_from to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.valid_until",
          ["claim_scope.valid_until"],
          "Certification claim does not identify when validity ends.",
          "Add valid_until to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.scope",
          ["claim_scope.scope", "claim_scope.covered_products", "claim_scope.covered_services"],
          "Certification claim does not identify what the certificate covers.",
          "Add scope, covered_products, or covered_services to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.verification_url",
          ["claim_scope.verification_url", "claim_scope.registry_url"],
          "Certification claim does not provide a registry or verification URL.",
          "Add verification_url or registry_url to claim_scope."
        ),
        linkedEvidence
      ];
    case "dataset_research":
      return [
        fieldRequirement(
          claim,
          "claim_scope.dataset_version",
          ["claim_scope.dataset_version", "claim_scope.version"],
          "Dataset/research claim does not identify the dataset or result version.",
          "Add dataset_version or version to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.sample_size",
          ["claim_scope.sample_size", "claim_scope.record_count"],
          "Dataset/research claim does not identify sample size or record count.",
          "Add sample_size or record_count to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.source_description",
          ["claim_scope.source_description", "claim_scope.source", "claim_scope.data_sources"],
          "Dataset/research claim does not describe data source or sources.",
          "Add source_description, source, or data_sources to claim_scope."
        ),
        fieldRequirement(
          claim,
          "claim_scope.collection_window",
          ["claim_scope.collection_window", "claim_scope.time_window"],
          "Dataset/research claim does not identify the collection or observation window.",
          "Add collection_window or time_window to claim_scope."
        ),
        linkedEvidence,
        recheckMethod
      ];
  }
}

function fieldRequirement(
  claim: Record<string, JsonValue>,
  id: string,
  paths: string[],
  riskGap: string,
  nextBestAction: string
): ProfileRequirement {
  return {
    id,
    met: () => paths.some((path) => hasPath(claim, path)),
    risk_gap: riskGap,
    next_best_action: nextBestAction
  };
}

function normalizeProfile(value: string): RealWorldEvidenceProfile | null {
  const normalized = value.toLowerCase().replace(/[-\s]/g, "_");
  if (normalized === "physical_product") return "physical_product";
  if (normalized === "service_delivery" || normalized === "professional_service") return "service_delivery";
  if (normalized === "saas_api" || normalized === "saas" || normalized === "api") return "saas_api";
  if (normalized === "certification_compliance" || normalized === "certification" || normalized === "compliance") {
    return "certification_compliance";
  }
  if (normalized === "dataset_research" || normalized === "dataset" || normalized === "research") return "dataset_research";
  return null;
}

function hasPath(object: Record<string, JsonValue>, path: string): boolean {
  let current: JsonValue | undefined = object;
  for (const part of path.split(".")) {
    if (!current || typeof current !== "object" || Array.isArray(current)) return false;
    current = current[part];
  }
  if (typeof current === "string") return current.trim().length > 0;
  if (Array.isArray(current)) return current.length > 0;
  if (typeof current === "number") return Number.isFinite(current);
  if (typeof current === "boolean") return true;
  if (current && typeof current === "object") return Object.keys(current).length > 0;
  return false;
}

function summarize(
  checks: ValueAuditCheck[],
  claims: ClaimValueAudit[],
  evidence: EvidenceValueAudit[]
): ValueContinuityReport["summary"] {
  return {
    PASS: checks.filter((check) => check.status === "PASS").length,
    WARN: checks.filter((check) => check.status === "WARN").length,
    FAIL: checks.filter((check) => check.status === "FAIL").length,
    MANUAL_CHECK_REQUIRED: checks.filter((check) => check.status === "MANUAL_CHECK_REQUIRED").length,
    total_claims: claims.length,
    self_asserted_claims: claims.filter((claim) => claim.level === "SELF_ASSERTED").length,
    evidence_linked_claims: claims.filter((claim) => claim.resolved_evidence_refs.length > 0).length,
    third_party_claims: claims.filter((claim) => claim.has_third_party_evidence).length,
    reproducible_claims: claims.filter((claim) => claim.has_reproducible_evidence).length,
    time_proven_claims: claims.filter((claim) => claim.level === "TIME_PROVEN").length,
    unsupported_claims: claims.filter((claim) => claim.level === "SELF_ASSERTED" || claim.missing_evidence_refs.length > 0).length,
    total_evidence_items: evidence.length,
    external_evidence_items: evidence.filter((item) => item.has_external_location).length,
    first_party_evidence_items: evidence.filter((item) => isFirstPartyIssuer(item.issuer_type)).length,
    stale_evidence_items: evidence.filter((item) => item.is_stale).length,
    profile_declared_claims: claims.filter((claim) => claim.profile_review.status !== "NOT_DECLARED").length,
    profile_pass_claims: claims.filter((claim) => claim.profile_review.status === "PASS").length,
    profile_gap_claims: claims.filter((claim) => claim.profile_review.status === "WARN").length
  };
}

function summarizeS2(evidence: EvidenceValueAudit[]): S2Summary {
  const s2Items = evidence.filter((item) => item.s2.state !== "NOT_S2");
  const effectiveItems = s2Items.filter((item) => item.s2.effective);
  const manualCheckCount = s2Items.reduce(
    (count, item) => count + item.s2.checks.filter((check) => check.status === "MANUAL_CHECK_REQUIRED").length,
    0
  );
  const summary: S2Summary = {
    effective_s2_count: effectiveItems.length,
    candidate_unverified_external_material_count: s2Items.filter((item) => item.s2.state === "CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL").length,
    s2_state_counts: {
      S2_1_GENERIC_ROUTE_PROVIDED: s2Items.filter((item) => item.s2.state === "S2_1_GENERIC_ROUTE_PROVIDED").length,
      S2_2_VERIFIED_ROUTE_CHECKED: s2Items.filter((item) => item.s2.state === "S2_2_VERIFIED_ROUTE_CHECKED").length,
      S2_3_ISSUER_BACKED: s2Items.filter((item) => item.s2.state === "S2_3_ISSUER_BACKED").length
    },
    expired_s2_count: s2Items.filter((item) => item.s2.expired).length,
    broken_s2_anchor_count: s2Items.filter((item) => !item.s2.anchor_url_valid).length,
    manual_check_s2_count: manualCheckCount,
    unknown_sample_source_count: s2Items.filter((item) => item.s2.sample_source_unknown).length,
    unknown_relationship_count: s2Items.filter((item) => item.s2.relationship_unknown).length,
    top_s2_gaps: uniqueStrings(s2Items.flatMap((item) => item.s2.gaps)).slice(0, 5),
    next_actions: [],
    not_a_trust_decision: true
  };
  summary.next_actions = s2NextActions(summary);
  return summary;
}

function summarizeS3(evidence: EvidenceValueAudit[]): S3Summary {
  const s3Items = evidence.filter((item) => item.s3.state !== "NOT_S3");
  const effectiveItems = s3Items.filter((item) => item.s3.effective);
  const manualCheckCount = s3Items.reduce(
    (count, item) => count + item.s3.checks.filter((check) => check.status === "MANUAL_CHECK_REQUIRED").length,
    0
  );
  const summary: S3Summary = {
    effective_s3_count: effectiveItems.length,
    candidate_unverified_sampling_count: s3Items.filter((item) => item.s3.state === "CANDIDATE_UNVERIFIED_SAMPLING").length,
    s3_state_counts: {
      S3_1_SAMPLING_ROUTE_PROVIDED: s3Items.filter((item) => item.s3.state === "S3_1_SAMPLING_ROUTE_PROVIDED").length,
      S3_2_CUSTODY_DOCUMENTED: s3Items.filter((item) => item.s3.state === "S3_2_CUSTODY_DOCUMENTED").length,
      S3_3_INDEPENDENT_TEST_RECORDED: s3Items.filter((item) => item.s3.state === "S3_3_INDEPENDENT_TEST_RECORDED").length
    },
    organization_selected_sample_count: s3Items.filter((item) => item.s3.organization_selected_sample).length,
    organization_provided_sample_count: s3Items.filter((item) => item.s3.organization_provided_sample).length,
    missing_sample_identity_count: s3Items.filter((item) => !item.s3.sample_identity_present).length,
    missing_claim_binding_count: s3Items.filter((item) => !item.s3.claim_binding_present).length,
    missing_sample_pool_count: s3Items.filter((item) => !item.s3.sample_pool_id).length,
    missing_sample_slot_count: s3Items.filter((item) => !item.s3.sample_slot_declared).length,
    missing_finite_policy_count: s3Items.filter((item) => !item.s3.finite_sample_policy_present).length,
    missing_duplicate_control_count: s3Items.filter((item) => !item.s3.duplicate_control_present).length,
    missing_credential_binding_count: s3Items.filter((item) => !item.s3.credential_binding_present || !item.s3.credential_verified_against_root).length,
    missing_sampling_plan_count: s3Items.filter((item) => !item.s3.sampling_plan_present).length,
    organization_can_choose_samples_count: s3Items.filter((item) => item.s3.organization_can_choose_samples).length,
    missing_raw_evidence_reference_count: s3Items.filter((item) => !item.s3.raw_evidence_reference_present).length,
    organization_controlled_storage_count: s3Items.filter((item) => item.s3.storage_role === "ORGANIZATION_CONTROLLED").length,
    missing_custody_count: s3Items.filter((item) => !item.s3.custody_documented).length,
    manual_check_s3_count: manualCheckCount,
    top_s3_gaps: uniqueStrings(s3Items.flatMap((item) => item.s3.gaps)).slice(0, 5),
    next_actions: [],
    not_a_trust_decision: true
  };
  summary.next_actions = s3NextActions(summary);
  return summary;
}

function summarizeS4(evidence: EvidenceValueAudit[]): S4Summary {
  const s4Items = evidence.filter((item) => item.s4.state !== "NOT_S4");
  const effectiveItems = s4Items.filter((item) => item.s4.effective);
  const manualCheckCount = s4Items.reduce(
    (count, item) => count + item.s4.checks.filter((check) => check.status === "MANUAL_CHECK_REQUIRED").length,
    0
  );
  const summary: S4Summary = {
    effective_s4_count: effectiveItems.length,
    candidate_unverified_observation_count: s4Items.filter((item) => item.s4.state === "CANDIDATE_UNVERIFIED_OBSERVATION").length,
    s4_state_counts: {
      S4_1_OBSERVATION_SUMMARY_PROVIDED: s4Items.filter((item) => item.s4.state === "S4_1_OBSERVATION_SUMMARY_PROVIDED").length,
      S4_2_RAW_BUNDLE_AVAILABLE: s4Items.filter((item) => item.s4.state === "S4_2_RAW_BUNDLE_AVAILABLE").length,
      S4_3_OBSERVER_OR_DIRECTORY_REVIEWED: s4Items.filter((item) => item.s4.state === "S4_3_OBSERVER_OR_DIRECTORY_REVIEWED").length
    },
    current_window_observation_count: s4Items.filter((item) => item.s4.current_window).length,
    historical_observation_count: s4Items.filter((item) => item.s4.observation_window_present && !item.s4.current_window).length,
    raw_bundle_available_count: s4Items.filter((item) => item.s4.raw_bundle_hash_valid && item.s4.raw_bundle_location_present).length,
    missing_subject_binding_count: s4Items.filter((item) => !item.s4.subject_type || !item.s4.subject_id).length,
    manual_check_s4_count: manualCheckCount,
    top_s4_gaps: uniqueStrings(s4Items.flatMap((item) => item.s4.gaps)).slice(0, 5),
    next_actions: [],
    not_a_trust_decision: true
  };
  summary.next_actions = s4NextActions(summary);
  return summary;
}

function s2NextActions(summary: S2Summary): string[] {
  const actions: string[] = [];
  if (summary.candidate_unverified_external_material_count > 0) {
    actions.push("Add external recheck anchors, claim linkage, scope, limitations, and route metadata before treating candidate materials as effective S2.");
  }
  if (summary.expired_s2_count > 0) actions.push("Refresh expired S2 material or mark the related claim as expired, superseded, or withdrawn.");
  if (summary.broken_s2_anchor_count > 0) actions.push("Fix malformed S2 anchor URLs or replace them with valid issuer or public registry anchors.");
  if (summary.unknown_sample_source_count > 0 || summary.unknown_relationship_count > 0) {
    actions.push("Disclose sample source, selected_by, and relationship fields before using S2 for high-value or safety-critical review.");
  }
  if (actions.length === 0 && summary.effective_s2_count > 0) {
    actions.push("Review S2 scope and limitations against the consuming agent's own policy; OrgAnchor does not assign final trust.");
  }
  if (actions.length === 0) actions.push("No S2 material is declared; request S2 only if the target purpose requires external support.");
  return actions;
}

function s3NextActions(summary: S3Summary): string[] {
  const actions: string[] = [];
  if (summary.candidate_unverified_sampling_count > 0) {
    actions.push("Disclose sample identity, acquisition time, sample source, selector, claim linkage, scope, and limitations before treating candidate sampling as effective S3.");
  }
  if (summary.organization_selected_sample_count > 0 || summary.organization_provided_sample_count > 0) {
    actions.push("Use samples selected and acquired outside organization control, such as market purchase, distributor inventory, warehouse sampling, or customer-site sampling.");
  }
  if (summary.missing_sample_identity_count > 0) {
    actions.push("Bind each S3 sample to a product model, service id, batch, lot, serial range, or unit credential.");
  }
  if (
    summary.missing_claim_binding_count > 0 ||
    summary.missing_sample_pool_count > 0 ||
    summary.missing_sample_slot_count > 0 ||
    summary.missing_finite_policy_count > 0
  ) {
    actions.push("Add claim_binding, sample_slot_id, and sample_policy so S3 is a bounded slot-gated rolling sample pool rather than an unlimited upload channel.");
  }
  if (summary.missing_credential_binding_count > 0 || summary.missing_duplicate_control_count > 0) {
    actions.push("Add product/service credential binding and sample_nullifier so duplicate or misattributed samples cannot inflate S3.");
  }
  if (summary.missing_sampling_plan_count > 0 || summary.organization_can_choose_samples_count > 0) {
    actions.push("Add a sampling_plan controlled outside the organization; S3 cannot rely on organization-chosen samples.");
  }
  if (summary.missing_raw_evidence_reference_count > 0) {
    actions.push("Add raw_evidence bundle hashes, availability state, and vault/storage pointers so agents can see where the underlying sample material is or was held.");
  }
  if (summary.organization_controlled_storage_count > 0) {
    actions.push("For stronger S3, mirror raw sample material or receipts into a Directory vault or public-interest archive instead of relying only on organization-controlled storage.");
  }
  if (summary.missing_custody_count > 0) {
    actions.push("Add custody notes when the purpose requires higher assurance; S3_1 can remain usable but custody gaps should be visible.");
  }
  if (actions.length === 0 && summary.effective_s3_count > 0) {
    actions.push("Review S3 sampling scope and limitations against the consuming agent's own policy; OrgAnchor does not assign final trust.");
  }
  if (actions.length === 0) {
    actions.push("No S3 sampling evidence is declared; request S3 only if the target purpose requires random sampling or anti-hand-picked-sample support.");
  }
  return actions;
}

function s4NextActions(summary: S4Summary): string[] {
  const actions: string[] = [];
  if (summary.candidate_unverified_observation_count > 0) {
    actions.push("Disclose observer, subject binding, observation window, metrics, claim linkage, raw bundle hash, and vault/location before treating candidate observations as effective S4.");
  }
  if (summary.missing_subject_binding_count > 0) {
    actions.push("Bind every S4 observation to the exact product family, product model, service, deployment, API, order set, or delivery context it covers.");
  }
  if (summary.raw_bundle_available_count < summary.effective_s4_count) {
    actions.push("Add raw bundle hashes and evidence-vault or observer-controlled storage pointers for S4 observations.");
  }
  if (summary.historical_observation_count > 0 && summary.current_window_observation_count === 0) {
    actions.push("Add recent S4 observations when current transaction screening depends on current delivery, support, uptime, or supply continuity.");
  }
  if (actions.length === 0 && summary.effective_s4_count > 0) {
    actions.push("Review S4 observation scope, window, metrics, and limitations against the consuming agent's own policy; OrgAnchor does not assign final trust.");
  }
  if (actions.length === 0) {
    actions.push("No S4 observation evidence is declared; request S4 only if the target purpose requires real delivery, use, support, uptime, or supply-continuity observation.");
  }
  return actions;
}

function statusFromFindings(findings: string[], hasHardFailure: boolean): AuditStatus {
  if (hasHardFailure) return "FAIL";
  if (findings.some((finding) => /missing evidence|hash mismatch|cannot be read|past its valid_until/i.test(finding))) {
    return "WARN";
  }
  if (findings.length > 0) return "MANUAL_CHECK_REQUIRED";
  return "PASS";
}

const S2_EFFECTIVE_STATES = new Set<S2MaterialState>([
  "S2_1_GENERIC_ROUTE_PROVIDED",
  "S2_2_VERIFIED_ROUTE_CHECKED",
  "S2_3_ISSUER_BACKED"
]);

const S2_ROUTE_IDS = new Set(["VR-S2-001", "VR-S2-002"]);
const S2_ROUTE_KINDS = new Set(["ISSUER_ORIGIN_CONFIRMATION", "PUBLIC_REGISTRY_CONFIRMATION"]);

function isS2MaterialState(value: string): value is S2MaterialState {
  return value === "CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL" || S2_EFFECTIVE_STATES.has(value as S2MaterialState);
}

const S3_EFFECTIVE_STATES = new Set<S3SamplingState>([
  "S3_1_SAMPLING_ROUTE_PROVIDED",
  "S3_2_CUSTODY_DOCUMENTED",
  "S3_3_INDEPENDENT_TEST_RECORDED"
]);

const S3_STORAGE_ROLES = new Set(["ORGANIZATION_CONTROLLED", "DIRECTORY_VAULT", "PUBLIC_INTEREST_ARCHIVE"]);
const S3_RAW_AVAILABILITY_STATUSES = new Set([
  "AVAILABLE",
  "REQUEST_REQUIRED",
  "RESTRICTED",
  "MIXED",
  "EXPIRED_SUMMARY_ONLY",
  "WITHDRAWN",
  "LOST",
  "DISPUTED"
]);

function isS3SamplingState(value: string): value is S3SamplingState {
  return value === "CANDIDATE_UNVERIFIED_SAMPLING" || S3_EFFECTIVE_STATES.has(value as S3SamplingState);
}

const S4_EFFECTIVE_STATES = new Set<S4ObservationState>([
  "S4_1_OBSERVATION_SUMMARY_PROVIDED",
  "S4_2_RAW_BUNDLE_AVAILABLE",
  "S4_3_OBSERVER_OR_DIRECTORY_REVIEWED"
]);

function isS4ObservationState(value: string): value is S4ObservationState {
  return value === "CANDIDATE_UNVERIFIED_OBSERVATION" || S4_EFFECTIVE_STATES.has(value as S4ObservationState);
}

function addS2Check(
  checks: ValueAuditCheck[],
  gaps: string[],
  status: AuditStatus,
  evidenceId: string,
  id: string,
  summary: string
): void {
  checks.push(buildCheck(`evidence:${evidenceId}:s2:${id}`, `Evidence ${evidenceId} ${id}`, status, summary));
  if (status !== "PASS") gaps.push(summary);
}

function addDisclosureCheck(
  checks: ValueAuditCheck[],
  gaps: string[],
  evidenceId: string,
  id: string,
  field: string,
  unknown: boolean
): void {
  addS2Check(
    checks,
    gaps,
    unknown ? "MANUAL_CHECK_REQUIRED" : "PASS",
    evidenceId,
    id,
    unknown ? `S2 disclosure ${field} is missing or unknown.` : `S2 disclosure ${field} is declared.`
  );
}

function addS3Check(
  checks: ValueAuditCheck[],
  gaps: string[],
  status: AuditStatus,
  evidenceId: string,
  id: string,
  summary: string
): void {
  checks.push(buildCheck(`evidence:${evidenceId}:s3:${id}`, `Evidence ${evidenceId} ${id}`, status, summary));
  if (status !== "PASS") gaps.push(summary);
}

function addS4Check(
  checks: ValueAuditCheck[],
  gaps: string[],
  status: AuditStatus,
  evidenceId: string,
  id: string,
  summary: string
): void {
  checks.push(buildCheck(`evidence:${evidenceId}:s4:${id}`, `Evidence ${evidenceId} ${id}`, status, summary));
  if (status !== "PASS") gaps.push(summary);
}

function relationClaimRefs(item: Record<string, JsonValue>): string[] {
  return arrayObjects(item.relations)
    .map((relation) => stringValue(relation.claim_id))
    .filter(Boolean);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isPastTimestamp(value: string, now: Date): boolean {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed < now.getTime();
}

function validTimestamp(value: string): boolean {
  return value.length > 0 && Number.isFinite(Date.parse(value));
}

function isSha256Digest(value: string): boolean {
  return /^sha256:[0-9a-f]{64}$/i.test(value);
}

function isCurrentObservationWindow(windowEnd: string, now: Date): boolean {
  const parsed = Date.parse(windowEnd);
  if (!Number.isFinite(parsed)) return false;
  const maxCurrentAgeMs = 180 * 24 * 60 * 60 * 1000;
  return parsed >= now.getTime() - maxCurrentAgeMs;
}

function isUnknownOrMissing(value: JsonValue | undefined): boolean {
  if (typeof value !== "string") return true;
  const normalized = value.trim().toLowerCase();
  return normalized.length === 0 || normalized === "unknown" || normalized === "not_disclosed";
}

function isOrganizationControlledSample(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return [
    "organization",
    "first_party",
    "manufacturer",
    "supplier",
    "seller",
    "vendor",
    "organization_selected",
    "organization_provided",
    "company",
    "self"
  ].includes(normalized);
}

function booleanValue(value: JsonValue | undefined): boolean {
  return value === true || (typeof value === "string" && value.toLowerCase() === "true");
}

function positiveIntegerValue(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : 0;
}

function worstStatus(base: AuditStatus, statuses: AuditStatus[]): AuditStatus {
  const all = [base, ...statuses];
  if (all.includes("FAIL")) return "FAIL";
  if (all.includes("WARN")) return "WARN";
  if (all.includes("MANUAL_CHECK_REQUIRED")) return "MANUAL_CHECK_REQUIRED";
  return "PASS";
}

function hasCorrectionPolicy(claimsManifest: Record<string, JsonValue>, evidenceManifest: Record<string, JsonValue>): boolean {
  return Boolean(
    claimsManifest.correction_policy ||
      evidenceManifest.correction_policy ||
      Array.isArray(claimsManifest.corrections) ||
      Array.isArray(evidenceManifest.corrections)
  );
}

function hasLimitations(claim: Record<string, JsonValue>): boolean {
  return Array.isArray(claim.limitations) && claim.limitations.length > 0;
}

function hasScope(claim: Record<string, JsonValue>): boolean {
  return Boolean(claim.claim_scope || claim.scope || claim.applies_to || claim.product_id);
}

function hasBroadMarketingLanguage(value: string): boolean {
  return /\b(best|trusted|guaranteed|revolutionary|unmatched|perfect|permanent|forever)\b/i.test(value);
}

function isFirstPartyIssuer(value: string): boolean {
  return ["", "unknown", "first_party", "self", "organization"].includes(value.toLowerCase());
}

function isReproducible(value: string): boolean {
  return ["reproducible", "independently_reproducible", "fully_reproducible"].includes(value.toLowerCase());
}

function evidenceHasReproduciblePath(item: EvidenceValueAudit): boolean {
  return isReproducible(item.reproducibility) || item.has_recheck_method;
}

function isDedicatedAttestation(item: EvidenceValueAudit): boolean {
  return ["third_party_attestation", "signed_attestation", "automated_attestation"].includes(item.evidence_type.toLowerCase());
}

function hasExecutableReviewShape(method: Record<string, JsonValue>): boolean {
  return arrayStrings(method.steps).length > 0 && arrayStrings(method.expected_results).length > 0;
}

function isLowCostMethod(value: string): boolean {
  return ["very_low", "low"].includes(value.toLowerCase());
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)];
}

function isEvidenceStale(item: Record<string, JsonValue>, now: Date): boolean {
  const validUntil = stringValue(item.valid_until) || stringValue(asRecord(item.quality).valid_until);
  if (!validUntil) return false;
  const parsed = Date.parse(validUntil);
  return Number.isFinite(parsed) && parsed < now.getTime();
}

function pass(id: string, title: string, summary: string, details?: Record<string, unknown>): ValueAuditCheck {
  return buildCheck(id, title, "PASS", summary, details);
}

function warn(id: string, title: string, summary: string, details?: Record<string, unknown>): ValueAuditCheck {
  return buildCheck(id, title, "WARN", summary, details);
}

function failCheck(id: string, title: string, summary: string, details?: Record<string, unknown>): ValueAuditCheck {
  return buildCheck(id, title, "FAIL", summary, details);
}

function manual(id: string, title: string, summary: string, details?: Record<string, unknown>): ValueAuditCheck {
  return buildCheck(id, title, "MANUAL_CHECK_REQUIRED", summary, details);
}

function buildCheck(
  id: string,
  title: string,
  status: AuditStatus,
  summary: string,
  details?: Record<string, unknown>
): ValueAuditCheck {
  const check: ValueAuditCheck = { id, title, status, summary };
  if (details !== undefined) check.details = details;
  return check;
}

function arrayObjects(value: JsonValue | undefined): Record<string, JsonValue>[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asObject(item, "array item"));
}

function arrayStrings(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}
