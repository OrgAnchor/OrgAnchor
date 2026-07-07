import { validateClaimsManifest, validateEvidenceManifest } from "../core/evidence-validate.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { parseStrictJson, type JsonValue } from "../core/json.ts";
import { validateLockfile } from "../core/lockfile.ts";
import { asObject, validateOfficialStatement, validateRootAuthority, validateSignatureFile } from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";

export type CheckStatus = "PASS" | "WARN" | "FAIL" | "NOT_INCLUDED";
export type AgentConformanceStatus =
  | "IDENTITY_VERIFY_PASS"
  | "VALUE_VERIFY_PASS"
  | "FULL_COMPATIBLE"
  | "PARTIAL"
  | "FAILED";

export interface AgentCheck {
  id: string;
  status: CheckStatus;
  detail: string;
}

export interface AgentDiscoverySignal {
  kind: "beacon" | "verify_index";
  url: string;
  verify_index_url: string;
  declared_root_authority_hash: string | null;
  declared_statement_hash: string | null;
}

export interface AgentVerificationResult {
  type: "OrgAnchorAgentVerificationResult";
  version: "1.0";
  target: string;
  index_url: string;
  artifact_base_url: string;
  overall_status: "PASS" | "WARN" | "FAIL";
  identity_status: "PASS" | "FAIL";
  value_status: "PASS" | "WARN" | "NOT_INCLUDED";
  conformance_status: AgentConformanceStatus;
  trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR";
  discovery_signal: AgentDiscoverySignal;
  organization: JsonValue;
  identity: Record<string, JsonValue>;
  history: Record<string, JsonValue>;
  value_continuity: Record<string, JsonValue>;
  policy_route: AgentPolicyRoute;
  checks: AgentCheck[];
  recommended_next_steps: string[];
}

export interface AgentVerificationCompactResult {
  type: "OrgAnchorAgentVerificationCompactResult";
  version: "1.0";
  target: string;
  overall_status: "PASS" | "WARN" | "FAIL";
  identity_status: "PASS" | "FAIL";
  value_status: "PASS" | "WARN" | "NOT_INCLUDED";
  conformance_status: AgentConformanceStatus;
  trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR";
  organization: {
    name: string;
    display_name?: string;
  };
  root_authority_hash: string;
  statement_hash: string;
  evidence_summary: {
    claims: CheckStatus;
    evidence: CheckStatus;
    value: CheckStatus;
    unsupported_claims: number;
    total_evidence_items: number;
    third_party_claims: number;
    reproducible_claims: number;
    manual_checks: number;
    profile_declared_claims: number;
    profile_pass_claims: number;
    profile_gap_claims: number;
    claim_support_levels: Record<string, number>;
    risk_gaps: number;
    top_risk_gaps: string[];
    next_best_actions: string[];
    s2_summary: {
      effective_s2_count: number;
      candidate_unverified_external_material_count: number;
      s2_state_counts: Record<string, number>;
      expired_s2_count: number;
      broken_s2_anchor_count: number;
      manual_check_s2_count: number;
      unknown_sample_source_count: number;
      unknown_relationship_count: number;
      top_s2_gaps: string[];
      next_actions: string[];
      not_a_trust_decision: boolean;
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
      not_a_trust_decision: boolean;
    };
    s4_summary: {
      effective_s4_count: number;
      candidate_unverified_observation_count: number;
      s4_state_counts: Record<string, number>;
      current_window_observation_count: number;
      historical_observation_count: number;
      raw_bundle_available_count: number;
      missing_subject_binding_count: number;
      manual_check_s4_count: number;
      top_s4_gaps: string[];
      next_actions: string[];
      not_a_trust_decision: boolean;
    };
  };
  history_summary: {
    lockfile: CheckStatus;
    lockfile_hash: string;
    carrier_receipts: CheckStatus;
  };
  policy_route: AgentPolicyRoute;
  failures: string[];
  warnings: string[];
  next_step: string;
}

export type AgentPolicyRouteName =
  | "STOP_IDENTITY_FAILURE"
  | "REVIEW_FAILED_CHECKS"
  | "REQUEST_VALUE_EVIDENCE"
  | "REVIEW_VALUE_WARNINGS"
  | "EXTERNAL_POLICY_REVIEW"
  | "READY_FOR_EXTERNAL_POLICY";

export interface AgentPolicyRoute {
  route: AgentPolicyRouteName;
  policy_owner: "EXTERNAL_AGENT";
  trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR";
  reasons: string[];
  guidance: string;
}

export async function verifyUrlCommand(options: Record<string, string | boolean>): Promise<void> {
  const target = requireTarget(options);
  const result = await verifyUrlTarget(target, { timeoutMs: parseTimeoutMs(options["timeout-ms"]) });
  const output = options.compact === true ? compactResult(result) : result;
  console.log(JSON.stringify(output, null, 2));
  if (result.overall_status === "FAIL") process.exitCode = 1;
}

export async function verifyUrlTarget(
  target: string,
  options: {
    timeoutMs?: number;
  } = {}
): Promise<AgentVerificationResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const index = await discoverIndex(target, timeoutMs);
  const indexObject = asObject(index.value, "verify index");
  const artifactBaseUrl = resolveArtifactBaseUrl(index.url, indexObject);
  const checks: AgentCheck[] = [];

  addCheck(
    checks,
    "index",
    indexObject.type === "OrgAnchorVerifyIndex" && indexObject.version === "1.0" ? "PASS" : "FAIL",
    `Discovered OrgAnchor index at ${index.url.toString()}.`
  );

  const statementRef = asObject(indexObject.statement ?? null, "index.statement");
  const signatureRef = asObject(indexObject.signature ?? null, "index.signature");
  const authorityRef = asObject(indexObject.root_authority ?? null, "index.root_authority");

  const statementPath = requireString(statementRef, "path", "index.statement");
  const signaturePath = requireString(signatureRef, "path", "index.signature");
  const authorityPath = requireString(authorityRef, "path", "index.root_authority");

  const statementUrl = resolveArtifactUrl(artifactBaseUrl, statementPath);
  const signatureUrl = resolveArtifactUrl(artifactBaseUrl, signaturePath);
  const authorityUrl = resolveArtifactUrl(artifactBaseUrl, authorityPath);

  const statement = validateOfficialStatement(await fetchJson(statementUrl, "official endpoint statement", timeoutMs));
  const signature = validateSignatureFile(await fetchJson(signatureUrl, "official endpoint signature", timeoutMs));
  const authority = validateRootAuthority(await fetchJson(authorityUrl, "root authority", timeoutMs));
  const authorityHash = sha256CanonicalJson(authority);
  const statementHash = sha256CanonicalJson(statement);
  const signatureHash = sha256CanonicalJson(signature);

  addHashCheck(checks, "statement_hash", statementRef.hash, statementHash, "Official endpoint statement hash");
  addHashCheck(checks, "signature_hash", signatureRef.hash, signatureHash, "Official endpoint signature hash");
  addHashCheck(checks, "authority_hash", authorityRef.hash, authorityHash, "Root authority hash");
  addOptionalDeclaredHashCheck(
    checks,
    "beacon_declared_root_authority_hash",
    index.signal.declared_root_authority_hash,
    authorityHash,
    "Beacon declared root authority hash"
  );
  addOptionalDeclaredHashCheck(
    checks,
    "beacon_declared_statement_hash",
    index.signal.declared_statement_hash,
    statementHash,
    "Beacon declared statement hash"
  );
  addCheck(
    checks,
    "statement_authority_binding",
    statement.root_authority_hash === authorityHash ? "PASS" : "FAIL",
    statement.root_authority_hash === authorityHash
      ? `Statement binds to root authority ${authorityHash}.`
      : "Statement root_authority_hash does not match the fetched root authority."
  );

  const statementVerification = verifySignatureFile(statement, signature, authority);
  addCheck(
    checks,
    "statement_signature_threshold",
    statementVerification.ok ? "PASS" : "FAIL",
    statementVerification.ok
      ? `${statementVerification.valid_signatures.length}/${statementVerification.required_signatures} required root signatures are valid.`
      : statementVerification.errors.join("; ")
  );

  const linkedArtifacts = optionalRecord(indexObject.linked_artifacts);
  const evidence = await verifyOptionalSignedManifest({
    checks,
    id: "evidence_manifest",
    label: "Evidence manifest",
    artifactBaseUrl,
    authority,
    artifact: optionalRecord(linkedArtifacts.evidence),
    validate: validateEvidenceManifest,
    timeoutMs
  });
  const claims = await verifyOptionalSignedManifest({
    checks,
    id: "claims_manifest",
    label: "Claims manifest",
    artifactBaseUrl,
    authority,
    artifact: optionalRecord(linkedArtifacts.claims),
    validate: validateClaimsManifest,
    timeoutMs
  });
  if (claims.value && evidence.value) {
    const refErrors = verifyEvidenceReferences(claims.value, evidence.value);
    addCheck(
      checks,
      "claims_evidence_references",
      refErrors.length === 0 ? "PASS" : "FAIL",
      refErrors.length === 0 ? "Claim evidence references resolve." : refErrors.join("; ")
    );
  } else {
    addCheck(
      checks,
      "claims_evidence_references",
      "NOT_INCLUDED",
      "Claims/evidence reference checks require both signed manifests."
    );
  }

  const valueContinuity = await verifyValueContinuity({
    checks,
    indexValueContinuity: optionalRecord(indexObject.value_continuity),
    artifactBaseUrl,
    timeoutMs
  });
  const history = await verifyLockfileIntegrity({
    checks,
    indexLockfile: optionalRecord(indexObject.lockfile_integrity),
    artifactBaseUrl,
    authority,
    timeoutMs
  });

  addCheck(
    checks,
    "carrier_receipts",
    carrierReceiptStatus(indexObject),
    carrierReceiptDetail(indexObject)
  );

  const identityStatus = checks.some((check) => check.status === "FAIL" && identityCheckIds.has(check.id)) ? "FAIL" : "PASS";
  const hasFailures = checks.some((check) => check.status === "FAIL");
  const hasWarnings = checks.some((check) => check.status === "WARN");
  const valueStatus = valueContinuity.status;
  const overallStatus = hasFailures ? "FAIL" : hasWarnings || valueStatus !== "PASS" ? "WARN" : "PASS";
  const conformanceStatus = conformanceStatusFromVerification(identityStatus, overallStatus, valueStatus);
  const policyRoute = buildPolicyRoute({
    identityStatus,
    overallStatus,
    valueStatus,
    checks,
    valueContinuity: valueContinuity.publicValue
  });
  const result: AgentVerificationResult = {
    type: "OrgAnchorAgentVerificationResult",
    version: "1.0",
    target,
    index_url: index.url.toString(),
    artifact_base_url: artifactBaseUrl.toString(),
    overall_status: overallStatus,
    identity_status: identityStatus,
    value_status: valueStatus,
    conformance_status: conformanceStatus,
    trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR",
    discovery_signal: index.signal,
    organization: statement.organization,
    identity: {
      statement_hash: statementHash,
      root_authority_hash: authorityHash,
      authority_id: authority.authority_id,
      threshold_required: authority.threshold.required,
      threshold_total: authority.threshold.total,
      valid_signatures: statementVerification.valid_signatures
    },
    history: history.publicHistory,
    value_continuity: valueContinuity.publicValue,
    policy_route: policyRoute,
    checks,
    recommended_next_steps: recommendedNextSteps(checks, valueContinuity.status)
  };
  return result;
}

function compactResult(result: AgentVerificationResult): AgentVerificationCompactResult {
  const organization = asObject(result.organization, "organization");
  const valueContinuity = optionalRecord(result.value_continuity);
  const summary = optionalRecord(valueContinuity.summary);
  const claimSupportSummary = optionalRecord(valueContinuity.claim_support_summary);
  const claimSupportLevels = optionalRecord(claimSupportSummary.support_levels);
  const s2Summary = optionalRecord(valueContinuity.s2_summary);
  const s3Summary = optionalRecord(valueContinuity.s3_summary);
  const s4Summary = optionalRecord(valueContinuity.s4_summary);

  return {
    type: "OrgAnchorAgentVerificationCompactResult",
    version: "1.0",
    target: result.target,
    overall_status: result.overall_status,
    identity_status: result.identity_status,
    value_status: result.value_status,
    conformance_status: result.conformance_status,
    trust_decision: result.trust_decision,
    organization: compactOrganization(organization),
    root_authority_hash: String(result.identity.root_authority_hash ?? ""),
    statement_hash: String(result.identity.statement_hash ?? ""),
    evidence_summary: {
      claims: checkStatus(result.checks, "claims_manifest"),
      evidence: checkStatus(result.checks, "evidence_manifest"),
      value: checkStatus(result.checks, "value_continuity"),
      unsupported_claims: numberValue(summary.unsupported_claims),
      total_evidence_items: numberValue(summary.total_evidence_items),
      third_party_claims: numberValue(summary.third_party_claims),
      reproducible_claims: numberValue(summary.reproducible_claims),
      manual_checks: numberValue(summary.MANUAL_CHECK_REQUIRED),
      profile_declared_claims: numberValue(summary.profile_declared_claims),
      profile_pass_claims: numberValue(summary.profile_pass_claims),
      profile_gap_claims: numberValue(summary.profile_gap_claims),
      claim_support_levels: compactClaimSupportLevels(claimSupportLevels),
      risk_gaps: numberValue(claimSupportSummary.risk_gap_count),
      top_risk_gaps: arrayStrings(claimSupportSummary.top_risk_gaps),
      next_best_actions: arrayStrings(claimSupportSummary.next_best_actions),
      s2_summary: compactS2Summary(s2Summary),
      s3_summary: compactS3Summary(s3Summary),
      s4_summary: compactS4Summary(s4Summary)
    },
    history_summary: {
      lockfile: strongestCheckStatus(result.checks, ["lockfile_signature", "lockfile_hash"]),
      lockfile_hash: stringValue(optionalRecord(result.history.lockfile).hash),
      carrier_receipts: checkStatus(result.checks, "carrier_receipts")
    },
    policy_route: result.policy_route,
    failures: result.checks
      .filter((check) => check.status === "FAIL")
      .map((check) => `${check.id}: ${check.detail}`),
    warnings: result.checks
      .filter((check) => check.status === "WARN")
      .map((check) => `${check.id}: ${check.detail}`),
    next_step: result.recommended_next_steps[0] ?? "Use the verified artifacts as inputs to your own policy."
  };
}

function buildPolicyRoute(options: {
  identityStatus: AgentVerificationResult["identity_status"];
  overallStatus: AgentVerificationResult["overall_status"];
  valueStatus: AgentVerificationResult["value_status"];
  checks: AgentCheck[];
  valueContinuity: Record<string, JsonValue>;
}): AgentPolicyRoute {
  const summary = optionalRecord(options.valueContinuity.summary);
  const failCount = options.checks.filter((check) => check.status === "FAIL").length;
  const warnCount = options.checks.filter((check) => check.status === "WARN").length;
  const manualChecks = numberValue(summary.MANUAL_CHECK_REQUIRED);
  const unsupportedClaims = numberValue(summary.unsupported_claims);
  const thirdPartyClaims = numberValue(summary.third_party_claims);
  const totalClaims = numberValue(summary.total_claims);
  const reasons: string[] = [];

  if (options.identityStatus === "FAIL") {
    reasons.push("identity_verification_failed");
    return policyRoute(
      "STOP_IDENTITY_FAILURE",
      reasons,
      "Do not use the published endpoints as verified OrgAnchor endpoints until identity failures are resolved."
    );
  }

  if (options.overallStatus === "FAIL" || failCount > 0) {
    reasons.push("non_identity_verification_failures_present");
    return policyRoute(
      "REVIEW_FAILED_CHECKS",
      reasons,
      "Identity passed, but one or more non-identity checks failed. Review the full result before using claims or evidence."
    );
  }

  if (options.valueStatus === "NOT_INCLUDED") {
    reasons.push("value_layer_not_included");
    return policyRoute(
      "REQUEST_VALUE_EVIDENCE",
      reasons,
      "Identity can be used for endpoint continuity, but product or service evaluation needs signed claims/evidence from the organization."
    );
  }

  if (options.valueStatus === "WARN" || warnCount > 0 || unsupportedClaims > 0) {
    if (warnCount > 0) reasons.push("value_warnings_present");
    if (unsupportedClaims > 0) reasons.push("unsupported_claims_present");
    return policyRoute(
      "REVIEW_VALUE_WARNINGS",
      reasons,
      "The value layer is present but has warnings or unsupported claims. Route to external policy review before transaction decisions."
    );
  }

  if (manualChecks > 0 || (totalClaims > 0 && thirdPartyClaims === 0)) {
    if (manualChecks > 0) reasons.push("manual_checks_present");
    if (totalClaims > 0 && thirdPartyClaims === 0) reasons.push("no_third_party_claims");
    return policyRoute(
      "EXTERNAL_POLICY_REVIEW",
      reasons,
      "Verification passed, but external policy still needs to decide whether first-party evidence and manual checks are sufficient."
    );
  }

  reasons.push("identity_and_value_checks_passed");
  return policyRoute(
    "READY_FOR_EXTERNAL_POLICY",
    reasons,
    "The OrgAnchor package is ready as an input to the external agent's own policy. OrgAnchor still does not assign final trust."
  );
}

function policyRoute(route: AgentPolicyRouteName, reasons: string[], guidance: string): AgentPolicyRoute {
  return {
    route,
    policy_owner: "EXTERNAL_AGENT",
    trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR",
    reasons,
    guidance
  };
}

function compactOrganization(organization: Record<string, JsonValue>): AgentVerificationCompactResult["organization"] {
  const name = stringValue(organization.name) || "unknown";
  const displayName = stringValue(organization.display_name);
  if (!displayName) return { name };
  return { name, display_name: displayName };
}

function checkStatus(checks: AgentCheck[], id: string): CheckStatus {
  return checks.find((check) => check.id === id)?.status ?? "NOT_INCLUDED";
}

function strongestCheckStatus(checks: AgentCheck[], ids: string[]): CheckStatus {
  const statuses = ids.map((id) => checkStatus(checks, id));
  if (statuses.includes("FAIL")) return "FAIL";
  if (statuses.includes("WARN")) return "WARN";
  if (statuses.includes("PASS")) return "PASS";
  return "NOT_INCLUDED";
}

const identityCheckIds = new Set([
  "index",
  "statement_hash",
  "signature_hash",
  "authority_hash",
  "beacon_declared_root_authority_hash",
  "beacon_declared_statement_hash",
  "statement_authority_binding",
  "statement_signature_threshold"
]);

const DEFAULT_TIMEOUT_MS = 15000;

async function discoverIndex(target: string, timeoutMs: number): Promise<{
  url: URL;
  value: JsonValue;
  signal: AgentDiscoverySignal;
}> {
  const targetUrl = normalizeTargetUrl(target);
  const candidates = indexCandidates(targetUrl);
  const failures: string[] = [];

  for (const candidate of candidates) {
    try {
      const response = await fetchWithTimeout(candidate, timeoutMs);
      if (!response.ok) {
        failures.push(`${candidate.toString()} returned ${response.status}`);
        continue;
      }
      const value = parseStrictJson(await response.text(), candidate.toString());
      const object = optionalRecord(value);
      if (object.type === "OrgAnchorVerifyIndex") {
        return {
          url: candidate,
          value,
          signal: {
            kind: "verify_index",
            url: candidate.toString(),
            verify_index_url: candidate.toString(),
            declared_root_authority_hash: null,
            declared_statement_hash: null
          }
        };
      }
      if (object.type === "OrgAnchorBeacon") {
        const verifyIndexUrl = resolveBeaconVerifyIndexUrl(object, candidate);
        const indexValue = await fetchJson(verifyIndexUrl, "OrgAnchor verify index", timeoutMs);
        return {
          url: verifyIndexUrl,
          value: indexValue,
          signal: {
            kind: "beacon",
            url: candidate.toString(),
            verify_index_url: verifyIndexUrl.toString(),
            declared_root_authority_hash: stringValue(object.root_authority_hash) || null,
            declared_statement_hash: stringValue(object.statement_hash) || null
          }
        };
      }
      failures.push(`${candidate.toString()} is not an OrgAnchor verify index or Beacon`);
    } catch (error) {
      failures.push(`${candidate.toString()} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Could not discover OrgAnchor index. Tried: ${failures.join("; ")}`);
}

function resolveBeaconVerifyIndexUrl(beacon: Record<string, JsonValue>, beaconUrl: URL): URL {
  const explicitIndex = stringValue(beacon.verify_index_url);
  if (explicitIndex) return new URL(explicitIndex, beaconUrl);
  const verifyUrl = stringValue(beacon.verify_url);
  if (verifyUrl) return new URL("organchor.json", ensureDirectoryUrl(new URL(verifyUrl, beaconUrl)));
  throw new Error("OrgAnchor Beacon must include verify_index_url or verify_url");
}

function indexCandidates(targetUrl: URL): URL[] {
  const candidates: URL[] = [];
  if (targetUrl.pathname.endsWith(".json")) {
    candidates.push(targetUrl);
  } else {
    if (targetUrl.pathname !== "/") {
      candidates.push(new URL("organchor.json", ensureDirectoryUrl(targetUrl)));
    }
    candidates.push(new URL("/.well-known/organchor.json", targetUrl));
    candidates.push(new URL("/verify/organchor.json", targetUrl));
  }
  return uniqueUrls(candidates);
}

function normalizeTargetUrl(target: string): URL {
  const withScheme = /^https?:\/\//.test(target) ? target : `https://${target}`;
  const url = new URL(withScheme);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("verify url only supports http(s) URLs");
  }
  return url;
}

function ensureDirectoryUrl(url: URL): URL {
  const copy = new URL(url.toString());
  if (!copy.pathname.endsWith("/")) copy.pathname = `${copy.pathname}/`;
  return copy;
}

function uniqueUrls(urls: URL[]): URL[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    const value = url.toString();
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function resolveArtifactBaseUrl(indexUrl: URL, index: Record<string, JsonValue>): URL {
  const agent = optionalRecord(index.agent_verification);
  const explicitBaseUrl = stringValue(agent.artifact_base_url);
  if (explicitBaseUrl) return new URL(explicitBaseUrl, indexUrl);

  const explicitBasePath = stringValue(agent.artifact_base_path) || stringValue(agent.verify_base_path);
  if (explicitBasePath) return new URL(explicitBasePath, new URL("/", indexUrl));

  if (indexUrl.pathname === "/.well-known/organchor.json") {
    return new URL("/verify/", indexUrl);
  }
  return new URL("./", indexUrl);
}

function resolveArtifactUrl(baseUrl: URL, path: string): URL {
  return new URL(path, baseUrl);
}

async function fetchJson(url: URL, label: string, timeoutMs: number): Promise<JsonValue> {
  const response = await fetchWithTimeout(url, timeoutMs);
  if (!response.ok) {
    throw new Error(`Could not fetch ${label} at ${url.toString()}: HTTP ${response.status}`);
  }
  return parseStrictJson(await response.text(), url.toString());
}

async function fetchWithTimeout(url: URL, timeoutMs: number): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": "OrgAnchor agent verifier"
    }
  });
}

async function verifyOptionalSignedManifest(options: {
  checks: AgentCheck[];
  id: string;
  label: string;
  artifactBaseUrl: URL;
  authority: ReturnType<typeof validateRootAuthority>;
  artifact: Record<string, JsonValue>;
  validate: (value: JsonValue) => JsonValue;
  timeoutMs: number;
}): Promise<{ value: JsonValue | null }> {
  const path = stringValue(options.artifact.path);
  const signaturePath = stringValue(options.artifact.signature_path);
  if (!path || !signaturePath) {
    addCheck(options.checks, options.id, "NOT_INCLUDED", `${options.label} was not indexed.`);
    return { value: null };
  }

  const manifest = options.validate(await fetchJson(resolveArtifactUrl(options.artifactBaseUrl, path), options.label, options.timeoutMs));
  const signature = validateSignatureFile(
    await fetchJson(resolveArtifactUrl(options.artifactBaseUrl, signaturePath), `${options.label} signature`, options.timeoutMs)
  );
  const manifestHash = sha256CanonicalJson(manifest);
  const signatureHash = sha256CanonicalJson(signature);
  const errors: string[] = [];
  const expectedManifestHash = stringValue(options.artifact.hash);
  const expectedSignatureHash = stringValue(options.artifact.signature_hash);
  if (expectedManifestHash && expectedManifestHash !== manifestHash) {
    errors.push(`${options.label} hash mismatch: expected ${expectedManifestHash}, got ${manifestHash}`);
  }
  if (expectedSignatureHash && expectedSignatureHash !== signatureHash) {
    errors.push(`${options.label} signature hash mismatch: expected ${expectedSignatureHash}, got ${signatureHash}`);
  }

  const verification = verifySignatureFile(manifest, signature, options.authority);
  errors.push(...verification.errors);
  addCheck(
    options.checks,
    options.id,
    errors.length === 0 ? "PASS" : "FAIL",
    errors.length === 0
      ? `${options.label} is signed by ${verification.valid_signatures.length}/${verification.required_signatures} required root member(s).`
      : errors.join("; ")
  );
  return { value: manifest };
}

function verifyEvidenceReferences(claimsManifest: JsonValue, evidenceManifest: JsonValue): string[] {
  const claimsObject = asObject(claimsManifest, "claims manifest");
  const evidenceObject = asObject(evidenceManifest, "evidence manifest");
  const evidenceItems = Array.isArray(evidenceObject.evidence) ? evidenceObject.evidence : [];
  const evidenceIds = new Set(evidenceItems.map((item) => String(asObject(item, "evidence item").id)));
  const errors: string[] = [];
  const claims = Array.isArray(claimsObject.claims) ? claimsObject.claims : [];
  for (const claim of claims) {
    const claimObject = asObject(claim, "claim");
    const claimId = String(claimObject.id);
    const refs = Array.isArray(claimObject.evidence_refs) ? claimObject.evidence_refs : [];
    for (const ref of refs) {
      if (!evidenceIds.has(String(ref))) {
        errors.push(`Claim "${claimId}" references missing evidence "${String(ref)}"`);
      }
    }
  }
  return errors;
}

async function verifyValueContinuity(options: {
  checks: AgentCheck[];
  indexValueContinuity: Record<string, JsonValue>;
  artifactBaseUrl: URL;
  timeoutMs: number;
}): Promise<{
  status: "PASS" | "WARN" | "NOT_INCLUDED";
  publicValue: Record<string, JsonValue>;
}> {
  if (options.indexValueContinuity.status !== "PRESENT") {
    addCheck(options.checks, "value_continuity", "NOT_INCLUDED", "No value continuity report was indexed.");
    return {
      status: "NOT_INCLUDED",
      publicValue: {
        status: "NOT_INCLUDED"
      }
    };
  }

  const path = requireString(options.indexValueContinuity, "path", "index.value_continuity");
  const report = await fetchJson(resolveArtifactUrl(options.artifactBaseUrl, path), "value continuity report", options.timeoutMs);
  const reportObject = asObject(report, "value continuity report");
  const reportHash = sha256CanonicalJson(report);
  const expectedHash = stringValue(options.indexValueContinuity.hash);
  const summary = optionalRecord(reportObject.summary);
  const failCount = numberValue(summary.FAIL);
  const warnCount = numberValue(summary.WARN);
  const unsupportedClaims = numberValue(summary.unsupported_claims);
  const status = failCount > 0 || warnCount > 0 || unsupportedClaims > 0 ? "WARN" : "PASS";
  const errors: string[] = [];
  if (reportObject.type !== "OrgAnchorValueContinuityReport") errors.push("Invalid value continuity report type");
  if (reportObject.version !== "1.0") errors.push("Unsupported value continuity report version");
  if (expectedHash && expectedHash !== reportHash) {
    errors.push(`Value continuity report hash mismatch: expected ${expectedHash}, got ${reportHash}`);
  }

  if (errors.length > 0) {
    addCheck(options.checks, "value_continuity", "FAIL", errors.join("; "));
    return {
      status: "WARN",
      publicValue: {
        status: "INVALID",
        hash: reportHash
      }
    };
  }

  addCheck(
    options.checks,
    "value_continuity",
    status,
    status === "PASS"
      ? "Value continuity report is present and has no FAIL/WARN/unsupported claim summary counts."
      : `Value continuity report requires review: FAIL ${failCount}, WARN ${warnCount}, unsupported claims ${unsupportedClaims}.`
  );
  return {
    status,
    publicValue: {
      status: "PRESENT",
      path,
      hash: reportHash,
      summary,
      claim_support_summary: summarizeClaimSupport(reportObject),
      s2_summary: optionalRecord(reportObject.s2_summary),
      s3_summary: optionalRecord(reportObject.s3_summary),
      s4_summary: optionalRecord(reportObject.s4_summary)
    }
  };
}

async function verifyLockfileIntegrity(options: {
  checks: AgentCheck[];
  indexLockfile: Record<string, JsonValue>;
  artifactBaseUrl: URL;
  authority: ReturnType<typeof validateRootAuthority>;
  timeoutMs: number;
}): Promise<{
  publicHistory: Record<string, JsonValue>;
}> {
  const indexedStatus = stringValue(options.indexLockfile.status);
  if (indexedStatus !== "SIGNED" && indexedStatus !== "UNSIGNED") {
    addCheck(options.checks, "lockfile_hash", "NOT_INCLUDED", "No lockfile snapshot was indexed.");
    addCheck(options.checks, "lockfile_signature", "NOT_INCLUDED", "No lockfile signature was indexed.");
    return {
      publicHistory: {
        lockfile: {
          status: "NOT_INCLUDED"
        }
      }
    };
  }

  const path = requireString(options.indexLockfile, "path", "index.lockfile_integrity");
  const lockfile = validateLockfile(await fetchJson(resolveArtifactUrl(options.artifactBaseUrl, path), "lockfile", options.timeoutMs));
  const hash = sha256CanonicalJson(lockfile);
  const expectedHash = stringValue(options.indexLockfile.hash);
  const hashMatches = expectedHash === hash;
  addCheck(
    options.checks,
    "lockfile_hash",
    hashMatches ? "PASS" : "FAIL",
    hashMatches ? `Lockfile hash matches ${hash}.` : `Lockfile hash mismatch: expected ${expectedHash}, got ${hash}.`
  );

  const signaturePath = stringValue(options.indexLockfile.signature_path);
  const publicLockfile: Record<string, JsonValue> = {
    status: indexedStatus,
    path,
    hash,
    signature_path: signaturePath || null,
    required_signatures: numberValue(options.indexLockfile.required_signatures),
    valid_signatures: []
  };

  if (!signaturePath) {
    addCheck(
      options.checks,
      "lockfile_signature",
      "WARN",
      "Lockfile snapshot is present but unsigned. Treat carrier receipts as unsigned metadata."
    );
    return {
      publicHistory: {
        lockfile: publicLockfile
      }
    };
  }

  const signature = validateSignatureFile(
    await fetchJson(resolveArtifactUrl(options.artifactBaseUrl, signaturePath), "lockfile signature", options.timeoutMs)
  );
  const signatureHash = sha256CanonicalJson(signature);
  const expectedSignatureHash = stringValue(options.indexLockfile.signature_hash);
  const verification = verifySignatureFile(lockfile, signature, options.authority);
  const errors = [...verification.errors];
  if (expectedSignatureHash && expectedSignatureHash !== signatureHash) {
    errors.push(`Lockfile signature hash mismatch: expected ${expectedSignatureHash}, got ${signatureHash}`);
  }

  publicLockfile.signature_hash = signatureHash;
  publicLockfile.valid_signatures = verification.valid_signatures as unknown as JsonValue;
  publicLockfile.required_signatures = verification.required_signatures;
  addCheck(
    options.checks,
    "lockfile_signature",
    errors.length === 0 ? "PASS" : "FAIL",
    errors.length === 0
      ? `Lockfile is signed by ${verification.valid_signatures.length}/${verification.required_signatures} required root member(s).`
      : errors.join("; ")
  );
  return {
    publicHistory: {
      lockfile: publicLockfile
    }
  };
}

function summarizeClaimSupport(report: Record<string, JsonValue>): Record<string, JsonValue> {
  const claims = Array.isArray(report.claims) ? report.claims.map((claim) => asObject(claim, "value report claim")) : [];
  const supportLevels = emptyClaimSupportLevels();
  const riskGaps: string[] = [];
  const nextBestActions: string[] = [];
  for (const claim of claims) {
    const level = stringValue(claim.protocol_support_level);
    if (level in supportLevels) supportLevels[level] = (supportLevels[level] ?? 0) + 1;
    for (const gap of arrayStrings(claim.risk_gaps)) riskGaps.push(gap);
    for (const action of arrayStrings(claim.next_best_actions)) nextBestActions.push(action);
  }
  return {
    support_levels: supportLevels as unknown as JsonValue,
    risk_gap_count: riskGaps.length,
    top_risk_gaps: uniqueFirst(riskGaps, 5) as unknown as JsonValue,
    next_best_actions: uniqueFirst(nextBestActions, 5) as unknown as JsonValue
  };
}

function compactClaimSupportLevels(value: Record<string, JsonValue>): Record<string, number> {
  const result = emptyClaimSupportLevels();
  for (const level of Object.keys(result)) {
    result[level] = numberValue(value[level]);
  }
  return result;
}

function compactS2Summary(value: Record<string, JsonValue>): AgentVerificationCompactResult["evidence_summary"]["s2_summary"] {
  const stateCounts = optionalRecord(value.s2_state_counts);
  return {
    effective_s2_count: numberValue(value.effective_s2_count),
    candidate_unverified_external_material_count: numberValue(value.candidate_unverified_external_material_count),
    s2_state_counts: {
      S2_1_GENERIC_ROUTE_PROVIDED: numberValue(stateCounts.S2_1_GENERIC_ROUTE_PROVIDED),
      S2_2_VERIFIED_ROUTE_CHECKED: numberValue(stateCounts.S2_2_VERIFIED_ROUTE_CHECKED),
      S2_3_ISSUER_BACKED: numberValue(stateCounts.S2_3_ISSUER_BACKED)
    },
    expired_s2_count: numberValue(value.expired_s2_count),
    broken_s2_anchor_count: numberValue(value.broken_s2_anchor_count),
    manual_check_s2_count: numberValue(value.manual_check_s2_count),
    unknown_sample_source_count: numberValue(value.unknown_sample_source_count),
    unknown_relationship_count: numberValue(value.unknown_relationship_count),
    top_s2_gaps: arrayStrings(value.top_s2_gaps),
    next_actions: arrayStrings(value.next_actions),
    not_a_trust_decision: value.not_a_trust_decision === true
  };
}

function compactS3Summary(value: Record<string, JsonValue>): AgentVerificationCompactResult["evidence_summary"]["s3_summary"] {
  const stateCounts = optionalRecord(value.s3_state_counts);
  return {
    effective_s3_count: numberValue(value.effective_s3_count),
    candidate_unverified_sampling_count: numberValue(value.candidate_unverified_sampling_count),
    s3_state_counts: {
      S3_1_SAMPLING_ROUTE_PROVIDED: numberValue(stateCounts.S3_1_SAMPLING_ROUTE_PROVIDED),
      S3_2_CUSTODY_DOCUMENTED: numberValue(stateCounts.S3_2_CUSTODY_DOCUMENTED),
      S3_3_INDEPENDENT_TEST_RECORDED: numberValue(stateCounts.S3_3_INDEPENDENT_TEST_RECORDED)
    },
    organization_selected_sample_count: numberValue(value.organization_selected_sample_count),
    organization_provided_sample_count: numberValue(value.organization_provided_sample_count),
    missing_sample_identity_count: numberValue(value.missing_sample_identity_count),
    missing_claim_binding_count: numberValue(value.missing_claim_binding_count),
    missing_sample_pool_count: numberValue(value.missing_sample_pool_count),
    missing_sample_slot_count: numberValue(value.missing_sample_slot_count),
    missing_finite_policy_count: numberValue(value.missing_finite_policy_count),
    missing_duplicate_control_count: numberValue(value.missing_duplicate_control_count),
    missing_credential_binding_count: numberValue(value.missing_credential_binding_count),
    missing_sampling_plan_count: numberValue(value.missing_sampling_plan_count),
    organization_can_choose_samples_count: numberValue(value.organization_can_choose_samples_count),
    missing_raw_evidence_reference_count: numberValue(value.missing_raw_evidence_reference_count),
    organization_controlled_storage_count: numberValue(value.organization_controlled_storage_count),
    missing_custody_count: numberValue(value.missing_custody_count),
    manual_check_s3_count: numberValue(value.manual_check_s3_count),
    top_s3_gaps: arrayStrings(value.top_s3_gaps),
    next_actions: arrayStrings(value.next_actions),
    not_a_trust_decision: value.not_a_trust_decision === true
  };
}

function compactS4Summary(value: Record<string, JsonValue>): AgentVerificationCompactResult["evidence_summary"]["s4_summary"] {
  const stateCounts = optionalRecord(value.s4_state_counts);
  return {
    effective_s4_count: numberValue(value.effective_s4_count),
    candidate_unverified_observation_count: numberValue(value.candidate_unverified_observation_count),
    s4_state_counts: {
      S4_1_OBSERVATION_SUMMARY_PROVIDED: numberValue(stateCounts.S4_1_OBSERVATION_SUMMARY_PROVIDED),
      S4_2_RAW_BUNDLE_AVAILABLE: numberValue(stateCounts.S4_2_RAW_BUNDLE_AVAILABLE),
      S4_3_OBSERVER_OR_DIRECTORY_REVIEWED: numberValue(stateCounts.S4_3_OBSERVER_OR_DIRECTORY_REVIEWED)
    },
    current_window_observation_count: numberValue(value.current_window_observation_count),
    historical_observation_count: numberValue(value.historical_observation_count),
    raw_bundle_available_count: numberValue(value.raw_bundle_available_count),
    missing_subject_binding_count: numberValue(value.missing_subject_binding_count),
    manual_check_s4_count: numberValue(value.manual_check_s4_count),
    top_s4_gaps: arrayStrings(value.top_s4_gaps),
    next_actions: arrayStrings(value.next_actions),
    not_a_trust_decision: value.not_a_trust_decision === true
  };
}

function emptyClaimSupportLevels(): Record<string, number> {
  return {
    L0_UNSUPPORTED: 0,
    L1_SIGNED_SELF_CLAIM: 0,
    L2_HASH_BOUND_EVIDENCE: 0,
    L3_REPRODUCIBLE_METHOD: 0,
    L4_INDEPENDENT_ATTESTATION: 0,
    TIME_OBSERVED: 0
  };
}

function carrierReceiptStatus(index: Record<string, JsonValue>): CheckStatus {
  const carrierReceipts = optionalRecord(index.carrier_receipts);
  if (carrierReceipts.status !== "PRESENT") return "NOT_INCLUDED";
  return Array.isArray(carrierReceipts.receipts) && carrierReceipts.receipts.length > 0 ? "PASS" : "WARN";
}

function carrierReceiptDetail(index: Record<string, JsonValue>): string {
  const carrierReceipts = optionalRecord(index.carrier_receipts);
  if (carrierReceipts.status !== "PRESENT") return "No carrier receipts were indexed.";
  const receipts = Array.isArray(carrierReceipts.receipts) ? carrierReceipts.receipts : [];
  return `${receipts.length} carrier receipt(s) are indexed. Carriers are discovery/durability surfaces, not the identity root.`;
}

function recommendedNextSteps(checks: AgentCheck[], valueStatus: "PASS" | "WARN" | "NOT_INCLUDED"): string[] {
  const steps: string[] = [];
  if (checks.some((check) => check.status === "FAIL" && identityCheckIds.has(check.id))) {
    steps.push("Do not rely on the endpoint statement until identity signature failures are resolved.");
  }
  if (valueStatus === "WARN") {
    steps.push("Review value continuity warnings before using product/service claims in a transaction decision.");
  }
  if (valueStatus === "NOT_INCLUDED") {
    steps.push("Ask the organization for signed claims/evidence manifests or a value continuity report if product/service evaluation matters.");
  }
  if (checks.some((check) => check.id === "carrier_receipts" && check.status !== "PASS")) {
    steps.push("Consider checking additional mirrors or archives if long-term availability matters.");
  }
  if (checks.some((check) => check.id === "lockfile_signature" && check.status !== "PASS")) {
    steps.push("Ask the organization to publish a root-signed lockfile snapshot if publication history matters.");
  }
  if (steps.length === 0) {
    steps.push("Use the verified artifacts as inputs to your own policy; OrgAnchor does not assign final trust.");
  }
  return steps;
}

function addHashCheck(
  checks: AgentCheck[],
  id: string,
  expected: JsonValue | undefined,
  actual: string,
  label: string
): void {
  const expectedString = stringValue(expected);
  addCheck(
    checks,
    id,
    expectedString === actual ? "PASS" : "FAIL",
    expectedString === actual ? `${label} matches ${actual}.` : `${label} mismatch: expected ${expectedString}, got ${actual}.`
  );
}

function addOptionalDeclaredHashCheck(
  checks: AgentCheck[],
  id: string,
  expected: string | null,
  actual: string,
  label: string
): void {
  if (!expected) {
    addCheck(checks, id, "NOT_INCLUDED", `${label} was not declared by the discovery signal.`);
    return;
  }
  addCheck(
    checks,
    id,
    expected === actual ? "PASS" : "FAIL",
    expected === actual ? `${label} matches ${actual}.` : `${label} mismatch: expected ${expected}, got ${actual}.`
  );
}

function conformanceStatusFromVerification(
  identityStatus: AgentVerificationResult["identity_status"],
  overallStatus: AgentVerificationResult["overall_status"],
  valueStatus: AgentVerificationResult["value_status"]
): AgentConformanceStatus {
  if (identityStatus !== "PASS") return "FAILED";
  if (valueStatus === "PASS" && overallStatus === "PASS") return "FULL_COMPATIBLE";
  if (valueStatus === "PASS") return "VALUE_VERIFY_PASS";
  if (valueStatus === "WARN") return "PARTIAL";
  return "IDENTITY_VERIFY_PASS";
}

function addCheck(checks: AgentCheck[], id: string, status: CheckStatus, detail: string): void {
  checks.push({ id, status, detail });
}

function requireTarget(options: Record<string, string | boolean>): string {
  const target = typeof options.url === "string" ? options.url : typeof options._ === "string" ? options._ : "";
  if (!target) throw new Error("Usage: organchor verify url <https://example.org>");
  return target;
}

function parseTimeoutMs(value: string | boolean | undefined): number {
  if (value === undefined || value === false) return DEFAULT_TIMEOUT_MS;
  if (typeof value !== "string") throw new Error("--timeout-ms must be a positive integer");
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("--timeout-ms must be a positive integer");
  return parsed;
}

function requireString(object: Record<string, JsonValue>, key: string, label: string): string {
  const value = stringValue(object[key]);
  if (!value) throw new Error(`${label}.${key} must be a non-empty string`);
  return value;
}

function optionalRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function arrayStrings(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function uniqueFirst(values: string[], limit: number): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
    if (result.length >= limit) break;
  }
  return result;
}
