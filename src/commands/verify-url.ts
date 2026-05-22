import { validateClaimsManifest, validateEvidenceManifest } from "../core/evidence-validate.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { parseStrictJson, type JsonValue } from "../core/json.ts";
import { asObject, validateOfficialStatement, validateRootAuthority, validateSignatureFile } from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";

type CheckStatus = "PASS" | "WARN" | "FAIL" | "NOT_INCLUDED";

interface AgentCheck {
  id: string;
  status: CheckStatus;
  detail: string;
}

interface AgentVerificationResult {
  type: "OrgAnchorAgentVerificationResult";
  version: "1.0";
  target: string;
  index_url: string;
  artifact_base_url: string;
  overall_status: "PASS" | "WARN" | "FAIL";
  identity_status: "PASS" | "FAIL";
  value_status: "PASS" | "WARN" | "NOT_INCLUDED";
  trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR";
  organization: JsonValue;
  identity: Record<string, JsonValue>;
  value_continuity: Record<string, JsonValue>;
  policy_route: AgentPolicyRoute;
  checks: AgentCheck[];
  recommended_next_steps: string[];
}

interface AgentVerificationCompactResult {
  type: "OrgAnchorAgentVerificationCompactResult";
  version: "1.0";
  target: string;
  overall_status: "PASS" | "WARN" | "FAIL";
  identity_status: "PASS" | "FAIL";
  value_status: "PASS" | "WARN" | "NOT_INCLUDED";
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
  };
  policy_route: AgentPolicyRoute;
  failures: string[];
  warnings: string[];
  next_step: string;
}

type AgentPolicyRouteName =
  | "STOP_IDENTITY_FAILURE"
  | "REVIEW_FAILED_CHECKS"
  | "REQUEST_VALUE_EVIDENCE"
  | "REVIEW_VALUE_WARNINGS"
  | "EXTERNAL_POLICY_REVIEW"
  | "READY_FOR_EXTERNAL_POLICY";

interface AgentPolicyRoute {
  route: AgentPolicyRouteName;
  policy_owner: "EXTERNAL_AGENT";
  trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR";
  reasons: string[];
  guidance: string;
}

export async function verifyUrlCommand(options: Record<string, string | boolean>): Promise<void> {
  const target = requireTarget(options);
  const timeoutMs = parseTimeoutMs(options["timeout-ms"]);
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
    trust_decision: "NOT_ASSIGNED_BY_ORGANCHOR",
    organization: statement.organization,
    identity: {
      statement_hash: statementHash,
      root_authority_hash: authorityHash,
      authority_id: authority.authority_id,
      threshold_required: authority.threshold.required,
      threshold_total: authority.threshold.total,
      valid_signatures: statementVerification.valid_signatures
    },
    value_continuity: valueContinuity.publicValue,
    policy_route: policyRoute,
    checks,
    recommended_next_steps: recommendedNextSteps(checks, valueContinuity.status)
  };

  const output = options.compact === true ? compactResult(result) : result;
  console.log(JSON.stringify(output, null, 2));
  if (overallStatus === "FAIL") process.exitCode = 1;
}

function compactResult(result: AgentVerificationResult): AgentVerificationCompactResult {
  const organization = asObject(result.organization, "organization");
  const valueContinuity = optionalRecord(result.value_continuity);
  const summary = optionalRecord(valueContinuity.summary);

  return {
    type: "OrgAnchorAgentVerificationCompactResult",
    version: "1.0",
    target: result.target,
    overall_status: result.overall_status,
    identity_status: result.identity_status,
    value_status: result.value_status,
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
      manual_checks: numberValue(summary.MANUAL_CHECK_REQUIRED)
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

const identityCheckIds = new Set([
  "index",
  "statement_hash",
  "signature_hash",
  "authority_hash",
  "statement_authority_binding",
  "statement_signature_threshold"
]);

const DEFAULT_TIMEOUT_MS = 15000;

async function discoverIndex(target: string, timeoutMs: number): Promise<{ url: URL; value: JsonValue }> {
  const targetUrl = normalizeTargetUrl(target);
  const candidates = indexCandidates(targetUrl);
  const failures: string[] = [];

  for (const candidate of candidates) {
    const response = await fetchWithTimeout(candidate, timeoutMs);
    if (!response.ok) {
      failures.push(`${candidate.toString()} returned ${response.status}`);
      continue;
    }
    const text = await response.text();
    return {
      url: candidate,
      value: parseStrictJson(text, candidate.toString())
    };
  }

  throw new Error(`Could not discover OrgAnchor index. Tried: ${failures.join("; ")}`);
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
      summary
    }
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
