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
  has_external_location: boolean;
  is_stale: boolean;
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
  };
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
  const evidenceById = new Map<string, Record<string, JsonValue>>();
  for (const item of evidenceItems) {
    evidenceById.set(stringValue(item.id), item);
  }

  const evidenceAudits: EvidenceValueAudit[] = [];
  for (const item of evidenceItems) {
    const audit = await auditEvidenceItem(item, now, Boolean(options.checkFiles));
    evidenceAudits.push(audit);
    checks.push(...evidenceChecks(audit));
  }

  const claimAudits: ClaimValueAudit[] = [];
  const claims = arrayObjects(claimsManifest.claims);
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
        `| ${claim.status} | ${escapeMarkdown(claim.id)} | ${claim.level} | ${claim.protocol_support_level} | ${claim.policy_route} | ${claim.risk_gaps.length} | ${claim.resolved_evidence_refs.length} | ${claim.missing_evidence_refs.length} |`
    )
    .join("\n");
  const evidence = report.evidence
    .map((item) => `| ${item.status} | ${escapeMarkdown(item.id)} | ${escapeMarkdown(item.issuer_type)} | ${escapeMarkdown(item.reproducibility)} | ${item.has_external_location ? "yes" : "no"} |`)
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

## Checks

| Status | Check | Summary |
| --- | --- | --- |
${checks}

## Claims

| Status | Claim | Legacy level | Protocol support | Policy route | Risk gaps | Resolved evidence | Missing evidence |
| --- | --- | --- | --- | --- | ---: | ---: | ---: |
${claims}

## Evidence

| Status | Evidence | Issuer | Reproducibility | External location |
| --- | --- | --- | --- | --- |
${evidence}
`;
}

async function auditEvidenceItem(
  item: Record<string, JsonValue>,
  now: Date,
  checkFiles: boolean
): Promise<EvidenceValueAudit> {
  const id = stringValue(item.id);
  const evidenceType = stringValue(item.evidence_type) || "not_specified";
  const issuerType = stringValue(item.issuer_type) || "unknown";
  const reproducibility = stringValue(item.reproducibility) || stringValue(asRecord(item.quality).reproducibility) || "not_specified";
  const locations = arrayObjects(item.locations);
  const hasExternalLocation = locations.some((location) => {
    const type = stringValue(location.type);
    return type !== "" && type !== "local";
  });
  const findings: string[] = [];
  if (!hasExternalLocation) findings.push("Evidence has no external/public location.");
  if (isFirstPartyIssuer(issuerType)) findings.push("Evidence is first-party; independent review may still be needed.");
  if (reproducibility === "not_specified") findings.push("Evidence reproducibility is not specified.");
  const isStale = isEvidenceStale(item, now);
  if (isStale) findings.push("Evidence is past its valid_until date.");

  if (checkFiles) {
    await checkLocalLocations(item, locations, findings);
  }

  return {
    id,
    status: statusFromFindings(findings, false),
    evidence_type: evidenceType,
    issuer_type: issuerType,
    reproducibility,
    has_external_location: hasExternalLocation,
    is_stale: isStale,
    findings
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
  const hasReproducibleEvidence = referencedEvidence.some((item) => isReproducible(item.reproducibility));
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
  const riskGaps = claimRiskGaps(claim, refs, missing, referencedEvidence, supportAxes);
  const hasHardFailure = missing.length > 0;
  return {
    id,
    status: statusFromFindings(findings, hasHardFailure),
    level,
    protocol_support_level: protocolSupportLevel(claim, refs, missing, referencedEvidence),
    support_axes: supportAxes,
    risk_gaps: riskGaps,
    next_best_actions: claimNextBestActions(riskGaps),
    organchor_trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR",
    policy_route: claimPolicyRoute(refs, missing, riskGaps, referencedEvidence),
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
  return checks;
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
  if (referencedEvidence.some((item) => isReproducible(item.reproducibility))) return "REPRODUCIBLE";
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
  if (referencedEvidence.some((item) => isReproducible(item.reproducibility))) return "L3_REPRODUCIBLE_METHOD";
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
    method_reproducibility: referencedEvidence.some((item) => isReproducible(item.reproducibility))
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
  if (axes.method_reproducibility === "NOT_SPECIFIED") gaps.push("No reproducible method is specified for linked evidence.");
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
  if (riskGaps.some((gap) => /reproducible method/i.test(gap))) {
    actions.push("Add a reproducible method, command, dataset, monitoring method, or test procedure.");
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
    stale_evidence_items: evidence.filter((item) => item.is_stale).length
  };
}

function statusFromFindings(findings: string[], hasHardFailure: boolean): AuditStatus {
  if (hasHardFailure) return "FAIL";
  if (findings.some((finding) => /missing evidence|hash mismatch|cannot be read|past its valid_until/i.test(finding))) {
    return "WARN";
  }
  if (findings.length > 0) return "MANUAL_CHECK_REQUIRED";
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

function isDedicatedAttestation(item: EvidenceValueAudit): boolean {
  return ["third_party_attestation", "signed_attestation", "automated_attestation"].includes(item.evidence_type.toLowerCase());
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
