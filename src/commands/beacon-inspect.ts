import { parseStrictJson, type JsonValue } from "../core/json.ts";
import { verifyUrlTarget, type AgentVerificationResult } from "./verify-url.ts";

export type BeaconInspectStatus = "PASS" | "WARN" | "FAIL";
export type BeaconCheckStatus = "PASS" | "WARN" | "FAIL" | "NOT_INCLUDED";

export type BeaconConformanceStatus =
  | "CLAIMED_SIGNAL"
  | "BEACON_SHAPE_PASS"
  | "IDENTITY_VERIFY_PASS"
  | "VALUE_VERIFY_PASS"
  | "FULL_COMPATIBLE"
  | "PARTIAL"
  | "FAILED";

export interface BeaconInspectCheck {
  id: string;
  status: BeaconCheckStatus;
  detail: string;
}

export interface BeaconRiskGap {
  code: string;
  severity: "INFO" | "WARN" | "FAIL";
  detail: string;
  next_action: string;
}

export interface BeaconInspectResult {
  type: "OrgAnchorBeaconInspectResult";
  version: "0.1";
  target: string;
  status: BeaconInspectStatus;
  conformance_status: BeaconConformanceStatus;
  signal: {
    claimed: boolean;
    kind: "beacon" | "verify_index" | "organchor_like" | "none";
    url: string | null;
    declared_type: string | null;
    declared_version: string | null;
    ignored_unknown_fields: string[];
    http: {
      status_code: number | null;
      content_type: string | null;
      cache_control: string | null;
      etag: string | null;
      last_modified: string | null;
      body_size_bytes: number | null;
    };
  };
  hints: {
    organization: {
      name: string | null;
      display_name: string | null;
    };
    discovery: {
      categories: string[];
      capabilities: string[];
      regions: string[];
      languages: string[];
    };
    summary_status: {
      identity_status: string | null;
      value_status: string | null;
      policy_route: string | null;
      updated_at: string | null;
    };
  };
  verification: {
    attempted: boolean;
    target: string | null;
    overall_status: string | null;
    identity_status: string | null;
    value_status: string | null;
    root_authority_hash: string | null;
    statement_hash: string | null;
    policy_route: string | null;
  };
  checks: BeaconInspectCheck[];
  risk_gaps: BeaconRiskGap[];
  next_steps: string[];
}

const DEFAULT_TIMEOUT_MS = 15000;
const SHA256 = /^sha256:[0-9a-f]{64}$/;
const BEACON_ALLOWED_KEYS = new Set([
  "type",
  "version",
  "origin",
  "verify_url",
  "well_known_url",
  "verify_index_url",
  "root_authority_hash",
  "statement_hash",
  "organization",
  "discovery",
  "summary_status",
  "agent_flow",
  "extensions"
]);

export async function beaconInspectCommand(options: Record<string, string | boolean>): Promise<void> {
  const target = typeof options.url === "string" ? options.url : typeof options._ === "string" ? options._ : "";
  if (!target) throw new Error("beacon inspect requires <organization-url>");
  const report = await inspectBeaconTarget(target, parseTimeoutMs(options["timeout-ms"]));
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "FAIL") process.exitCode = 1;
}

export async function inspectBeaconTarget(target: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<BeaconInspectResult> {
  const checks: BeaconInspectCheck[] = [];
  const riskGaps: BeaconRiskGap[] = [];
  let signal: BeaconInspectResult["signal"] = {
    claimed: false,
    kind: "none",
    url: null,
    declared_type: null,
    declared_version: null,
    ignored_unknown_fields: [],
    http: emptySignalHttp()
  };
  let hints = emptyHints();
  let verification: BeaconInspectResult["verification"] = emptyVerification();
  let conformance: BeaconConformanceStatus = "FAILED";

  try {
    const discovered = await discoverSignal(target, timeoutMs);
    const signalObject = asRecord(discovered.value);
    const declaredType = stringValue(signalObject.type);
    const declaredVersion = stringValue(signalObject.version);
    const kind = signalKind(signalObject);
    signal = {
      claimed: kind !== "none",
      kind,
      url: discovered.url.toString(),
      declared_type: declaredType || null,
      declared_version: declaredVersion || null,
      ignored_unknown_fields: kind === "beacon" ? unknownBeaconFields(signalObject) : [],
      http: discovered.http
    };
    hints = hintsFromSignal(signalObject);

    addCheck(
      checks,
      "claimed_signal",
      signal.claimed ? "PASS" : "FAIL",
      signal.claimed
        ? `Found an OrgAnchor-like signal at ${discovered.url.toString()}.`
        : `Found JSON at ${discovered.url.toString()}, but it is not an OrgAnchor Beacon or verify index.`
    );

    if (!signal.claimed) {
      addRisk(riskGaps, "NO_ORGANCHOR_SIGNAL", "FAIL", "No OrgAnchor-compatible signal was found.", "Do not treat this origin as an OrgAnchor adopter.");
      return finalize(target, "FAILED", signal, hints, verification, checks, riskGaps);
    }

    conformance = "CLAIMED_SIGNAL";
    inspectSignalHttp(discovered.http, checks, riskGaps);
    let verificationTarget: string | null = null;
    if (kind === "beacon") {
      verificationTarget = inspectBeaconShape(signalObject, checks, riskGaps);
      if (signal.ignored_unknown_fields.length > 0) {
        addCheck(
          checks,
          "beacon_unknown_fields",
          "WARN",
          `Unknown Beacon fields are ignored: ${signal.ignored_unknown_fields.join(", ")}.`
        );
        addRisk(
          riskGaps,
          "UNKNOWN_BEACON_FIELDS_IGNORED",
          "WARN",
          "The Beacon contains non-core fields. They cannot change OrgAnchor verification meaning.",
          "Ignore unknown fields unless they are explicitly supported by the verifier."
        );
      }
      inspectExtensions(signalObject, checks, riskGaps);
      if (requiredShapePassed(checks, "beacon_shape")) conformance = "BEACON_SHAPE_PASS";
    } else if (kind === "verify_index") {
      verificationTarget = inspectVerifyIndexShape(signalObject, discovered.url, checks, riskGaps);
      if (requiredShapePassed(checks, "verify_index_shape")) conformance = "BEACON_SHAPE_PASS";
    } else {
      addRisk(
        riskGaps,
        "ORGANCHOR_LIKE_BUT_UNSUPPORTED",
        "WARN",
        "The signal uses OrgAnchor-like naming but is not a supported Beacon or verify index.",
        "Treat it as a claim only; request a valid OrgAnchor verify package."
      );
      return finalize(target, conformance, signal, hints, verification, checks, riskGaps);
    }

    if (!verificationTarget) {
      addCheck(checks, "strict_verification", "NOT_INCLUDED", "No strict verification target could be derived from the signal.");
      return finalize(target, conformance, signal, hints, verification, checks, riskGaps);
    }

    const strict = await runStrictVerification(verificationTarget, timeoutMs, checks, riskGaps);
    verification = strict.verification;
    conformance = conformanceFromVerification(strict.result, signalObject, kind, checks, riskGaps);
    return finalize(target, conformance, signal, hints, verification, checks, riskGaps);
  } catch (error) {
    addCheck(checks, "beacon_inspect", "FAIL", error instanceof Error ? error.message : String(error));
    addRisk(
      riskGaps,
      "BEACON_INSPECT_FAILED",
      "FAIL",
      "Beacon inspection could not complete.",
      "Do not treat this origin as a verified OrgAnchor adopter until inspection succeeds."
    );
    return finalize(target, "FAILED", signal, hints, verification, checks, riskGaps);
  }
}

async function runStrictVerification(
  target: string,
  timeoutMs: number,
  checks: BeaconInspectCheck[],
  riskGaps: BeaconRiskGap[]
): Promise<{ result: AgentVerificationResult; verification: BeaconInspectResult["verification"] }> {
  addCheck(checks, "strict_verification_attempted", "PASS", `Running strict OrgAnchor verification against ${target}.`);
  try {
    const result = await verifyUrlTarget(target, { timeoutMs });
    addCheck(
      checks,
      "strict_identity_verification",
      result.identity_status === "PASS" ? "PASS" : "FAIL",
      result.identity_status === "PASS"
        ? "Root authority, statement, signature, and required hashes verify."
        : "Strict identity verification failed."
    );
    addCheck(
      checks,
      "strict_value_verification",
      result.value_status === "PASS" ? "PASS" : result.value_status === "WARN" ? "WARN" : "NOT_INCLUDED",
      `Strict value verification status is ${result.value_status}.`
    );
    if (result.identity_status !== "PASS") {
      addRisk(
        riskGaps,
        "IDENTITY_VERIFICATION_FAILED",
        "FAIL",
        "The origin did not pass strict identity verification.",
        "Reject the origin as a verified OrgAnchor adopter until signatures and hashes pass."
      );
    }
    if (result.value_status !== "PASS") {
      addRisk(
        riskGaps,
        result.value_status === "NOT_INCLUDED" ? "VALUE_LAYER_NOT_INCLUDED" : "VALUE_LAYER_REQUIRES_REVIEW",
        result.value_status === "NOT_INCLUDED" ? "WARN" : "WARN",
        `The value layer status is ${result.value_status}.`,
        "Do not treat product or service claims as fully supported without external review."
      );
    }
    return {
      result,
      verification: {
        attempted: true,
        target,
        overall_status: result.overall_status,
        identity_status: result.identity_status,
        value_status: result.value_status,
        root_authority_hash: stringValue(result.identity.root_authority_hash),
        statement_hash: stringValue(result.identity.statement_hash),
        policy_route: result.policy_route.route
      }
    };
  } catch (error) {
    addCheck(checks, "strict_verification", "FAIL", error instanceof Error ? error.message : String(error));
    addRisk(
      riskGaps,
      "STRICT_VERIFICATION_FAILED",
      "FAIL",
      "The claimed signal could not be verified as a valid OrgAnchor package.",
      "Treat this as an unverified or failed OrgAnchor claim."
    );
    throw error;
  }
}

function conformanceFromVerification(
  result: AgentVerificationResult,
  signalObject: Record<string, JsonValue>,
  kind: BeaconInspectResult["signal"]["kind"],
  checks: BeaconInspectCheck[],
  riskGaps: BeaconRiskGap[]
): BeaconConformanceStatus {
  if (result.identity_status !== "PASS") return "FAILED";
  if (kind === "beacon" && !declaredHashesMatch(signalObject, result, checks, riskGaps)) return "FAILED";
  if (result.value_status === "PASS" && result.overall_status === "PASS") return "FULL_COMPATIBLE";
  if (result.value_status === "PASS") return "VALUE_VERIFY_PASS";
  if (result.value_status === "WARN") return "PARTIAL";
  return "IDENTITY_VERIFY_PASS";
}

function declaredHashesMatch(
  signalObject: Record<string, JsonValue>,
  result: AgentVerificationResult,
  checks: BeaconInspectCheck[],
  riskGaps: BeaconRiskGap[]
): boolean {
  const declaredAuthorityHash = stringValue(signalObject.root_authority_hash);
  const declaredStatementHash = stringValue(signalObject.statement_hash);
  const actualAuthorityHash = stringValue(result.identity.root_authority_hash);
  const actualStatementHash = stringValue(result.identity.statement_hash);
  const authorityOk = declaredAuthorityHash === actualAuthorityHash;
  const statementOk = declaredStatementHash === actualStatementHash;
  addCheck(
    checks,
    "declared_root_authority_hash",
    authorityOk ? "PASS" : "FAIL",
    authorityOk
      ? `Beacon root authority hash matches ${actualAuthorityHash}.`
      : `Beacon root authority hash mismatch: expected ${declaredAuthorityHash || "(missing)"}, got ${actualAuthorityHash}.`
  );
  addCheck(
    checks,
    "declared_statement_hash",
    statementOk ? "PASS" : "FAIL",
    statementOk
      ? `Beacon statement hash matches ${actualStatementHash}.`
      : `Beacon statement hash mismatch: expected ${declaredStatementHash || "(missing)"}, got ${actualStatementHash}.`
  );
  if (!authorityOk || !statementOk) {
    addRisk(
      riskGaps,
      "DECLARED_HASH_MISMATCH",
      "FAIL",
      "The Beacon declares hashes that do not match strict verification results.",
      "Reject the Beacon claim until declared hashes match signed artifacts."
    );
  }
  return authorityOk && statementOk;
}

function inspectBeaconShape(
  signalObject: Record<string, JsonValue>,
  checks: BeaconInspectCheck[],
  riskGaps: BeaconRiskGap[]
): string | null {
  const errors: string[] = [];
  const origin = requireUrl(signalObject.origin, "origin", errors);
  const verifyIndexUrl = requireUrl(signalObject.verify_index_url, "verify_index_url", errors, true);
  const verifyUrl = requireUrl(signalObject.verify_url, "verify_url", errors, true);
  if (!verifyIndexUrl && !verifyUrl) errors.push("verify_index_url or verify_url is required");
  if (signalObject.version !== "1.0") errors.push("version must be 1.0");
  if (!SHA256.test(stringValue(signalObject.root_authority_hash))) errors.push("root_authority_hash must be sha256:<64 hex>");
  if (!SHA256.test(stringValue(signalObject.statement_hash))) errors.push("statement_hash must be sha256:<64 hex>");
  const organization = asRecord(signalObject.organization);
  if (!stringValue(organization.name)) errors.push("organization.name is required");
  const agentFlow = asRecord(signalObject.agent_flow);
  if (!stringValue(agentFlow.first_pass)) errors.push("agent_flow.first_pass is required");

  addCheck(
    checks,
    "beacon_shape",
    errors.length === 0 ? "PASS" : "FAIL",
    errors.length === 0 ? "Beacon has the required first-pass shape." : errors.join("; ")
  );
  if (errors.length > 0) {
    addRisk(
      riskGaps,
      "BEACON_SHAPE_INVALID",
      "FAIL",
      "The Beacon does not satisfy the required shape.",
      "Treat the origin as a claimed signal only until the Beacon shape is fixed."
    );
  }
  return verifyIndexUrl || verifyUrl || origin;
}

function inspectVerifyIndexShape(
  signalObject: Record<string, JsonValue>,
  signalUrl: URL,
  checks: BeaconInspectCheck[],
  riskGaps: BeaconRiskGap[]
): string | null {
  const statement = asRecord(signalObject.statement);
  const signature = asRecord(signalObject.signature);
  const authority = asRecord(signalObject.root_authority);
  const errors: string[] = [];
  if (signalObject.type !== "OrgAnchorVerifyIndex") errors.push("type must be OrgAnchorVerifyIndex");
  if (signalObject.version !== "1.0") errors.push("version must be 1.0");
  if (!stringValue(statement.path)) errors.push("statement.path is required");
  if (!stringValue(signature.path)) errors.push("signature.path is required");
  if (!stringValue(authority.path)) errors.push("root_authority.path is required");
  if (!SHA256.test(stringValue(statement.hash))) errors.push("statement.hash must be sha256:<64 hex>");
  if (!SHA256.test(stringValue(signature.hash))) errors.push("signature.hash must be sha256:<64 hex>");
  if (!SHA256.test(stringValue(authority.hash))) errors.push("root_authority.hash must be sha256:<64 hex>");

  addCheck(
    checks,
    "verify_index_shape",
    errors.length === 0 ? "PASS" : "FAIL",
    errors.length === 0 ? "Verify index has the required first-pass shape." : errors.join("; ")
  );
  if (errors.length > 0) {
    addRisk(
      riskGaps,
      "VERIFY_INDEX_SHAPE_INVALID",
      "FAIL",
      "The verify index is missing required machine-readable verification references.",
      "Treat the origin as a claimed signal only until the verify index is fixed."
    );
  }
  return errors.length === 0 ? signalUrl.toString() : null;
}

function inspectExtensions(
  signalObject: Record<string, JsonValue>,
  checks: BeaconInspectCheck[],
  riskGaps: BeaconRiskGap[]
): void {
  const extensions = signalObject.extensions;
  if (extensions === undefined) return;
  const extensionObject = asRecord(extensions);
  if (Object.keys(extensionObject).length === 0 && (!extensions || typeof extensions !== "object" || Array.isArray(extensions))) {
    addCheck(checks, "beacon_extensions", "WARN", "extensions must be an object when present.");
    return;
  }
  const unsafeKeys = Object.keys(extensionObject).filter((key) => !key.includes(".") && !key.includes(":"));
  if (unsafeKeys.length === 0) {
    addCheck(checks, "beacon_extensions", "PASS", "Beacon extension keys are namespaced.");
    return;
  }
  addCheck(
    checks,
    "beacon_extensions",
    "WARN",
    `Extension keys should be namespaced: ${unsafeKeys.join(", ")}.`
  );
  addRisk(
    riskGaps,
    "UNNAMESPACED_EXTENSIONS",
    "WARN",
    "The Beacon includes extension keys that are not clearly namespaced.",
    "Ignore extension semantics unless the verifier explicitly supports them."
  );
}

function requiredShapePassed(checks: BeaconInspectCheck[], id: string): boolean {
  return checks.some((check) => check.id === id && check.status === "PASS");
}

function signalKind(signalObject: Record<string, JsonValue>): BeaconInspectResult["signal"]["kind"] {
  if (signalObject.type === "OrgAnchorBeacon") return "beacon";
  if (signalObject.type === "OrgAnchorVerifyIndex") return "verify_index";
  const type = stringValue(signalObject.type).toLowerCase();
  if (type.includes("organchor") || "organchor" in signalObject || "root_authority_hash" in signalObject) return "organchor_like";
  return "none";
}

function unknownBeaconFields(signalObject: Record<string, JsonValue>): string[] {
  return Object.keys(signalObject).filter((key) => !BEACON_ALLOWED_KEYS.has(key));
}

async function discoverSignal(target: string, timeoutMs: number): Promise<{
  url: URL;
  value: JsonValue;
  http: BeaconInspectResult["signal"]["http"];
}> {
  const targetUrl = normalizeTargetUrl(target);
  const candidates = signalCandidates(targetUrl);
  const failures: string[] = [];
  for (const candidate of candidates) {
    const response = await fetch(candidate, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "user-agent": "OrgAnchor beacon inspector"
      }
    });
    if (!response.ok) {
      failures.push(`${candidate.toString()} returned ${response.status}`);
      continue;
    }
    const body = await response.text();
    return {
      url: candidate,
      value: parseStrictJson(body, candidate.toString()),
      http: {
        status_code: response.status,
        content_type: response.headers.get("content-type"),
        cache_control: response.headers.get("cache-control"),
        etag: response.headers.get("etag"),
        last_modified: response.headers.get("last-modified"),
        body_size_bytes: Buffer.byteLength(body, "utf8")
      }
    };
  }
  throw new Error(`Could not discover OrgAnchor Beacon signal. Tried: ${failures.join("; ")}`);
}

function inspectSignalHttp(
  http: BeaconInspectResult["signal"]["http"],
  checks: BeaconInspectCheck[],
  riskGaps: BeaconRiskGap[]
): void {
  const contentType = http.content_type?.toLowerCase() ?? "";
  const jsonLike = contentType.includes("json") || contentType.includes("text/plain");
  addCheck(
    checks,
    "beacon_content_type",
    jsonLike ? "PASS" : "WARN",
    jsonLike
      ? `Beacon content type is ${http.content_type ?? "(not provided)"}.`
      : `Beacon content type is ${http.content_type ?? "(not provided)"}; application/json is preferred.`
  );
  const size = http.body_size_bytes ?? 0;
  addCheck(
    checks,
    "beacon_size",
    size <= 64 * 1024 ? "PASS" : "WARN",
    size <= 64 * 1024
      ? `Beacon response is ${size} bytes.`
      : `Beacon response is ${size} bytes; keep first-pass discovery signals small.`
  );
  const hasCacheHint = Boolean(http.cache_control || http.etag || http.last_modified);
  addCheck(
    checks,
    "beacon_cache_hint",
    hasCacheHint ? "PASS" : "WARN",
    hasCacheHint
      ? "Beacon response includes cache validators or cache-control metadata."
      : "Beacon response does not include cache hints; static or cache-friendly hosting is preferred."
  );
  if (!jsonLike) {
    addRisk(
      riskGaps,
      "BEACON_CONTENT_TYPE_NOT_JSON",
      "WARN",
      "The Beacon response is not served with a JSON-like content type.",
      "Serve /.well-known/organchor.json and /verify/organchor.json as application/json where possible."
    );
  }
  if (size > 64 * 1024) {
    addRisk(
      riskGaps,
      "BEACON_RESPONSE_TOO_LARGE",
      "WARN",
      "The Beacon response is larger than the recommended first-pass discovery size.",
      "Keep Beacon files small and move large evidence artifacts behind hashed manifest references."
    );
  }
  if (!hasCacheHint) {
    addRisk(
      riskGaps,
      "BEACON_CACHE_HINT_MISSING",
      "WARN",
      "The Beacon response lacks cache hints.",
      "Use static hosting, ETag, Last-Modified, or Cache-Control headers to reduce repeated crawler cost."
    );
  }
}

function signalCandidates(targetUrl: URL): URL[] {
  const candidates: URL[] = [];
  if (targetUrl.pathname.endsWith(".json")) {
    candidates.push(targetUrl);
  } else {
    if (targetUrl.pathname !== "/") candidates.push(new URL("organchor.json", ensureDirectoryUrl(targetUrl)));
    candidates.push(new URL("/.well-known/organchor.json", targetUrl));
    candidates.push(new URL("/verify/organchor.json", targetUrl));
  }
  return uniqueUrls(candidates);
}

function finalize(
  target: string,
  conformance: BeaconConformanceStatus,
  signal: BeaconInspectResult["signal"],
  hints: BeaconInspectResult["hints"],
  verification: BeaconInspectResult["verification"],
  checks: BeaconInspectCheck[],
  riskGaps: BeaconRiskGap[]
): BeaconInspectResult {
  const status: BeaconInspectStatus = conformance === "FAILED"
    ? "FAIL"
    : conformance === "FULL_COMPATIBLE" || conformance === "VALUE_VERIFY_PASS" || conformance === "IDENTITY_VERIFY_PASS"
      ? "PASS"
      : "WARN";
  return {
    type: "OrgAnchorBeaconInspectResult",
    version: "0.1",
    target,
    status,
    conformance_status: conformance,
    signal,
    hints,
    verification,
    checks,
    risk_gaps: riskGaps,
    next_steps: nextSteps(conformance, verification)
  };
}

function nextSteps(
  conformance: BeaconConformanceStatus,
  verification: BeaconInspectResult["verification"]
): string[] {
  if (conformance === "FULL_COMPATIBLE") {
    return ["Use this OrgAnchor package as a verified input to your own external policy; OrgAnchor still does not assign final trust."];
  }
  if (conformance === "VALUE_VERIFY_PASS") {
    return ["Review warnings before treating the adopter as fully compatible.", verification.target ? `Run organchor verify url ${verification.target}` : "Run full OrgAnchor verification."];
  }
  if (conformance === "IDENTITY_VERIFY_PASS") {
    return ["Identity continuity verifies, but the value layer is incomplete or needs review.", "Ask the organization for signed claims, evidence, and value continuity artifacts if product/service evaluation matters."];
  }
  if (conformance === "PARTIAL") {
    return ["Treat this as partial OrgAnchor adoption only.", "Review missing or warning checks before indexing as compatible."];
  }
  if (conformance === "BEACON_SHAPE_PASS") {
    return ["Beacon shape is usable for discovery only.", "Run strict origin verification before indexing this as an OrgAnchor adopter."];
  }
  if (conformance === "CLAIMED_SIGNAL") {
    return ["Treat this as a self-claim only.", "Request a valid OrgAnchor verify index and signed artifacts."];
  }
  return ["Reject this as verified OrgAnchor adoption until the failing checks are resolved."];
}

function hintsFromSignal(signalObject: Record<string, JsonValue>): BeaconInspectResult["hints"] {
  const organization = asRecord(signalObject.organization);
  const discovery = asRecord(signalObject.discovery);
  const summaryStatus = asRecord(signalObject.summary_status);
  return {
    organization: {
      name: stringValue(organization.name) || null,
      display_name: stringValue(organization.display_name) || stringValue(organization.name) || null
    },
    discovery: {
      categories: stringArray(discovery.categories),
      capabilities: stringArray(discovery.capabilities),
      regions: stringArray(discovery.regions),
      languages: stringArray(discovery.languages)
    },
    summary_status: {
      identity_status: stringValue(summaryStatus.identity_status) || null,
      value_status: stringValue(summaryStatus.value_status) || null,
      policy_route: stringValue(summaryStatus.policy_route) || null,
      updated_at: stringValue(summaryStatus.updated_at) || null
    }
  };
}

function emptyHints(): BeaconInspectResult["hints"] {
  return {
    organization: {
      name: null,
      display_name: null
    },
    discovery: {
      categories: [],
      capabilities: [],
      regions: [],
      languages: []
    },
    summary_status: {
      identity_status: null,
      value_status: null,
      policy_route: null,
      updated_at: null
    }
  };
}

function emptyVerification(): BeaconInspectResult["verification"] {
  return {
    attempted: false,
    target: null,
    overall_status: null,
    identity_status: null,
    value_status: null,
    root_authority_hash: null,
    statement_hash: null,
    policy_route: null
  };
}

function emptySignalHttp(): BeaconInspectResult["signal"]["http"] {
  return {
    status_code: null,
    content_type: null,
    cache_control: null,
    etag: null,
    last_modified: null,
    body_size_bytes: null
  };
}

function addCheck(checks: BeaconInspectCheck[], id: string, status: BeaconCheckStatus, detail: string): void {
  checks.push({ id, status, detail });
}

function addRisk(
  riskGaps: BeaconRiskGap[],
  code: BeaconRiskGap["code"],
  severity: BeaconRiskGap["severity"],
  detail: string,
  nextAction: string
): void {
  riskGaps.push({ code, severity, detail, next_action: nextAction });
}

function requireUrl(value: JsonValue | undefined, key: string, errors: string[], optional = false): string {
  const text = stringValue(value);
  if (!text) {
    if (!optional) errors.push(`${key} is required`);
    return "";
  }
  try {
    const url = new URL(text);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      errors.push(`${key} must be an http(s) URL`);
      return "";
    }
    return url.toString();
  } catch {
    errors.push(`${key} must be a valid URL`);
    return "";
  }
}

function normalizeTargetUrl(target: string): URL {
  const withScheme = /^https?:\/\//.test(target) ? target : `https://${target}`;
  const url = new URL(withScheme);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("beacon inspect only supports http(s) URLs");
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

function parseTimeoutMs(value: string | boolean | undefined): number {
  if (value === undefined || value === false) return DEFAULT_TIMEOUT_MS;
  if (typeof value !== "string") throw new Error("--timeout-ms must be a positive integer");
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("--timeout-ms must be a positive integer");
  return parsed;
}

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function stringArray(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
