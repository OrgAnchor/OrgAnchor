import { sha256Digest } from "./hash.ts";
import { parseStrictJson, type JsonValue } from "./json.ts";
import { asObject, validateRootAuthority, validateSignatureFile } from "./validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";

export type ExternalEvidenceSignatureStatus = "VERIFIED" | "INVALID" | "UNAVAILABLE" | "UNSUPPORTED";
export type ExternalEvidenceCheckStatus = "PASS" | "FAIL" | "WARN" | "NOT_CHECKED";

export interface ExternalEvidenceSignatureResult {
  evidence_id: string;
  signature_id: string;
  role: string;
  status: ExternalEvidenceSignatureStatus;
  check_status: "PASS" | "FAIL" | "WARN";
  artifact_url: string;
  signature_url: string;
  authority_url: string;
  authority_id: string | null;
  artifact_hash_status: ExternalEvidenceCheckStatus;
  signature_file_hash_status: ExternalEvidenceCheckStatus;
  authority_file_hash_status: ExternalEvidenceCheckStatus;
  cryptographic_signature_status: ExternalEvidenceCheckStatus;
  valid_signatures: string[];
  required_signatures: number | null;
  signer_identity_assurance: "HASH_BOUND_AUTHORITY_DOCUMENT_NOT_REAL_WORLD_IDENTITY";
  evidence_sufficiency: "NOT_DETERMINED_BY_SIGNATURE_VALIDITY";
  claim_truth: "NOT_DETERMINED_BY_SIGNATURE_VALIDITY";
  errors: string[];
}

export interface ExternalEvidenceSignatureSummary {
  total_declared: number;
  auto_verify_limit: number;
  not_checked_due_to_limit: number;
  verified: number;
  invalid: number;
  unavailable: number;
  unsupported: number;
  results: ExternalEvidenceSignatureResult[];
  trust_boundary: "SIGNATURE_VALIDITY_IS_NOT_CLAIM_TRUTH_OR_REAL_WORLD_ISSUER_IDENTITY";
}

interface FetchedJson {
  state: "OK" | "UNAVAILABLE" | "INVALID";
  value?: JsonValue;
  raw_hash?: string;
  error?: string;
}

export async function verifyExternalEvidenceSignatures(options: {
  evidenceManifest: JsonValue | null;
  artifactBaseUrl: URL;
  timeoutMs: number;
}): Promise<ExternalEvidenceSignatureSummary> {
  const declaredRoutes: Array<{ evidence: Record<string, JsonValue>; route: Record<string, JsonValue> }> = [];
  const results: ExternalEvidenceSignatureResult[] = [];
  if (options.evidenceManifest) {
    const manifest = asObject(options.evidenceManifest, "evidence manifest");
    const evidenceItems = Array.isArray(manifest.evidence) ? manifest.evidence : [];
    for (const value of evidenceItems) {
      const item = asObject(value, "evidence item");
      const routes = Array.isArray(item.external_signatures) ? item.external_signatures : [];
      for (const routeValue of routes) {
        declaredRoutes.push({ evidence: item, route: asObject(routeValue, "external signature") });
      }
    }
  }
  for (const declared of declaredRoutes.slice(0, MAX_AUTO_VERIFIED_ROUTES)) {
    results.push(await verifyRoute(declared.evidence, declared.route, options));
  }

  return {
    total_declared: declaredRoutes.length,
    auto_verify_limit: MAX_AUTO_VERIFIED_ROUTES,
    not_checked_due_to_limit: Math.max(0, declaredRoutes.length - MAX_AUTO_VERIFIED_ROUTES),
    verified: results.filter((result) => result.status === "VERIFIED").length,
    invalid: results.filter((result) => result.status === "INVALID").length,
    unavailable: results.filter((result) => result.status === "UNAVAILABLE").length,
    unsupported: results.filter((result) => result.status === "UNSUPPORTED").length,
    results,
    trust_boundary: "SIGNATURE_VALIDITY_IS_NOT_CLAIM_TRUTH_OR_REAL_WORLD_ISSUER_IDENTITY"
  };
}

const MAX_AUTO_VERIFIED_ROUTES = 64;

async function verifyRoute(
  evidence: Record<string, JsonValue>,
  route: Record<string, JsonValue>,
  options: { artifactBaseUrl: URL; timeoutMs: number }
): Promise<ExternalEvidenceSignatureResult> {
  const evidenceId = String(evidence.id);
  const signatureId = String(route.id);
  const role = String(route.role);
  const artifactPath = String(route.artifact_path);
  const signaturePath = String(route.signature_path);
  const authorityPath = String(route.authority_path);
  let artifactUrl: URL;
  let signatureUrl: URL;
  let authorityUrl: URL;

  try {
    artifactUrl = resolveBoundArtifactUrl(options.artifactBaseUrl, artifactPath);
    signatureUrl = resolveBoundArtifactUrl(options.artifactBaseUrl, signaturePath);
    authorityUrl = resolveBoundArtifactUrl(options.artifactBaseUrl, authorityPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return baseResult(evidenceId, signatureId, role, artifactPath, signaturePath, authorityPath, "INVALID", "FAIL", [message]);
  }

  if (!String(evidence.media_type).toLowerCase().includes("json")) {
    return baseResult(
      evidenceId,
      signatureId,
      role,
      artifactUrl.toString(),
      signatureUrl.toString(),
      authorityUrl.toString(),
      "UNSUPPORTED",
      "WARN",
      ["External signature verification currently supports JSON evidence artifacts only."]
    );
  }

  const [artifact, signatureDocument, authorityDocument] = await Promise.all([
    fetchJsonWithRawHash(artifactUrl, "evidence artifact", options.timeoutMs),
    fetchJsonWithRawHash(signatureUrl, "external signature file", options.timeoutMs),
    fetchJsonWithRawHash(authorityUrl, "external authority file", options.timeoutMs)
  ]);
  const fetched = [artifact, signatureDocument, authorityDocument];
  const unavailable = fetched.filter((entry) => entry.state === "UNAVAILABLE");
  const invalidDocuments = fetched.filter((entry) => entry.state === "INVALID");
  const errors = fetched.flatMap((entry) => entry.error ? [entry.error] : []);
  const result = baseResult(
    evidenceId,
    signatureId,
    role,
    artifactUrl.toString(),
    signatureUrl.toString(),
    authorityUrl.toString(),
    unavailable.length > 0 ? "UNAVAILABLE" : invalidDocuments.length > 0 ? "INVALID" : "VERIFIED",
    unavailable.length > 0 ? "WARN" : invalidDocuments.length > 0 ? "FAIL" : "PASS",
    errors
  );

  if (artifact.state === "OK") {
    result.artifact_hash_status = artifact.raw_hash === evidence.hash ? "PASS" : "FAIL";
    if (result.artifact_hash_status === "FAIL") {
      result.errors.push(`Evidence artifact hash mismatch: expected ${String(evidence.hash)}, got ${String(artifact.raw_hash)}`);
    }
  }
  if (signatureDocument.state === "OK") {
    result.signature_file_hash_status = signatureDocument.raw_hash === route.signature_hash ? "PASS" : "FAIL";
    if (result.signature_file_hash_status === "FAIL") {
      result.errors.push(`External signature file hash mismatch: expected ${String(route.signature_hash)}, got ${String(signatureDocument.raw_hash)}`);
    }
  }
  if (authorityDocument.state === "OK") {
    result.authority_file_hash_status = authorityDocument.raw_hash === route.authority_hash ? "PASS" : "FAIL";
    if (result.authority_file_hash_status === "FAIL") {
      result.errors.push(`External authority file hash mismatch: expected ${String(route.authority_hash)}, got ${String(authorityDocument.raw_hash)}`);
    }
  }

  if (unavailable.length > 0 || invalidDocuments.length > 0) return finalizeResult(result);

  try {
    const authority = validateRootAuthority(authorityDocument.value as JsonValue);
    const signature = validateSignatureFile(signatureDocument.value as JsonValue);
    const verification = verifySignatureFile(artifact.value as JsonValue, signature, authority);
    result.authority_id = authority.authority_id;
    result.valid_signatures = verification.valid_signatures;
    result.required_signatures = verification.required_signatures;
    result.cryptographic_signature_status = verification.ok ? "PASS" : "FAIL";
    result.errors.push(...verification.errors);
  } catch (error) {
    result.cryptographic_signature_status = "FAIL";
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return finalizeResult(result);
}

function finalizeResult(result: ExternalEvidenceSignatureResult): ExternalEvidenceSignatureResult {
  const failed = [
    result.artifact_hash_status,
    result.signature_file_hash_status,
    result.authority_file_hash_status,
    result.cryptographic_signature_status
  ].includes("FAIL");
  if (failed || result.errors.length > 0 && result.status !== "UNAVAILABLE") {
    result.status = "INVALID";
    result.check_status = "FAIL";
  } else if (result.status !== "UNAVAILABLE" && result.status !== "UNSUPPORTED") {
    result.status = "VERIFIED";
    result.check_status = "PASS";
  }
  return result;
}

function baseResult(
  evidenceId: string,
  signatureId: string,
  role: string,
  artifactUrl: string,
  signatureUrl: string,
  authorityUrl: string,
  status: ExternalEvidenceSignatureStatus,
  checkStatus: "PASS" | "FAIL" | "WARN",
  errors: string[]
): ExternalEvidenceSignatureResult {
  return {
    evidence_id: evidenceId,
    signature_id: signatureId,
    role,
    status,
    check_status: checkStatus,
    artifact_url: artifactUrl,
    signature_url: signatureUrl,
    authority_url: authorityUrl,
    authority_id: null,
    artifact_hash_status: "NOT_CHECKED",
    signature_file_hash_status: "NOT_CHECKED",
    authority_file_hash_status: "NOT_CHECKED",
    cryptographic_signature_status: "NOT_CHECKED",
    valid_signatures: [],
    required_signatures: null,
    signer_identity_assurance: "HASH_BOUND_AUTHORITY_DOCUMENT_NOT_REAL_WORLD_IDENTITY",
    evidence_sufficiency: "NOT_DETERMINED_BY_SIGNATURE_VALIDITY",
    claim_truth: "NOT_DETERMINED_BY_SIGNATURE_VALIDITY",
    errors
  };
}

function resolveBoundArtifactUrl(baseUrl: URL, path: string): URL {
  const url = new URL(path, baseUrl);
  if (url.origin !== baseUrl.origin || !url.pathname.startsWith(baseUrl.pathname) || url.search || url.hash) {
    throw new Error(`External signature path must remain under ${baseUrl.toString()}: ${path}`);
  }
  return url;
}

async function fetchJsonWithRawHash(url: URL, label: string, timeoutMs: number): Promise<FetchedJson> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { "user-agent": "OrgAnchor external evidence verifier" }
    });
  } catch (error) {
    return { state: "UNAVAILABLE", error: `Could not fetch ${label} at ${url.toString()}: ${error instanceof Error ? error.message : String(error)}` };
  }
  if (!response.ok) {
    return { state: "UNAVAILABLE", error: `Could not fetch ${label} at ${url.toString()}: HTTP ${response.status}` };
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  try {
    return {
      state: "OK",
      value: parseStrictJson(bytes.toString("utf8"), url.toString()),
      raw_hash: sha256Digest(bytes)
    };
  } catch (error) {
    return { state: "INVALID", error: `${label} at ${url.toString()} is not valid JSON: ${error instanceof Error ? error.message : String(error)}` };
  }
}
