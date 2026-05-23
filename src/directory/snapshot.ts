import { sha256CanonicalJson } from "../core/hash.ts";
import type { JsonValue } from "../core/json.ts";
import {
  asObject,
  requireIsoTimestamp,
  requireLiteral,
  requireSha256Digest,
  requireString
} from "../core/validate.ts";
import { fail } from "../core/errors.ts";

export type DirectoryRecordSourceMethod = "manual" | "crawler" | "submitted" | "imported";
export type DirectoryIdentityStatus = "PASS" | "FAIL" | "NOT_VERIFIED";
export type DirectoryValueStatus = "PASS" | "WARN" | "FAIL" | "NOT_INCLUDED" | "NOT_VERIFIED";
export type DirectoryPolicyRoute =
  | "STOP_IDENTITY_FAILURE"
  | "REVIEW_FAILED_CHECKS"
  | "REQUEST_VALUE_EVIDENCE"
  | "REVIEW_VALUE_WARNINGS"
  | "EXTERNAL_POLICY_REVIEW"
  | "READY_FOR_EXTERNAL_POLICY"
  | "REQUEST_ORIGIN_VERIFICATION";

export interface DirectorySnapshot {
  [key: string]: JsonValue;
  type: "OrgAnchorDirectorySnapshot";
  version: "0.1";
  snapshot_id: string;
  generated_at: string;
  directory_node: {
    [key: string]: JsonValue;
    name: string;
    origin: string;
    policy_url: string;
  };
  trust_boundary: {
    [key: string]: JsonValue;
    directory_is_trust_root: false;
    final_trust_decision: "EXTERNAL_AGENT";
    records_must_verify_at_origin: true;
  };
  records: DirectoryRecord[];
}

export interface DirectoryRecord {
  [key: string]: JsonValue;
  type: "OrgAnchorDirectoryRecord";
  version: "0.1";
  record_id: string;
  origin: string;
  well_known_url: string;
  verify_index_url: string;
  organization: {
    [key: string]: JsonValue;
    name: string;
    display_name: string;
  };
  discovery: {
    [key: string]: JsonValue;
    categories: string[];
    capabilities: string[];
    regions: string[];
    languages: string[];
  };
  verification_summary: {
    [key: string]: JsonValue;
    identity_status: DirectoryIdentityStatus;
    value_status: DirectoryValueStatus;
    policy_route: DirectoryPolicyRoute;
    root_authority_hash: string;
    statement_hash: string;
    last_verified_at: string;
  };
  evidence_summary: {
    [key: string]: JsonValue;
    total_evidence_items: number;
    third_party_claims: number;
    reproducible_claims: number;
    manual_checks: number;
    unsupported_claims: number;
  };
  source: {
    [key: string]: JsonValue;
    method: DirectoryRecordSourceMethod;
    added_at: string;
  };
  limitations: string[];
}

export interface DirectoryVerificationReport {
  [key: string]: JsonValue;
  type: "OrgAnchorDirectoryVerificationReport";
  version: "0.1";
  status: "PASS" | "FAIL";
  snapshot_hash: string;
  snapshot_id: string;
  record_count: number;
  checks: {
    [key: string]: JsonValue;
    id: string;
    status: "PASS" | "FAIL";
    detail: string;
  }[];
}

const HTTP_URL = /^https?:\/\/.+/;
const ID = /^[A-Za-z0-9._:-]+$/;
const IDENTITY_STATUSES = new Set(["PASS", "FAIL", "NOT_VERIFIED"]);
const VALUE_STATUSES = new Set(["PASS", "WARN", "FAIL", "NOT_INCLUDED", "NOT_VERIFIED"]);
const POLICY_ROUTES = new Set([
  "STOP_IDENTITY_FAILURE",
  "REVIEW_FAILED_CHECKS",
  "REQUEST_VALUE_EVIDENCE",
  "REVIEW_VALUE_WARNINGS",
  "EXTERNAL_POLICY_REVIEW",
  "READY_FOR_EXTERNAL_POLICY",
  "REQUEST_ORIGIN_VERIFICATION"
]);
const SOURCE_METHODS = new Set(["manual", "crawler", "submitted", "imported"]);

export function validateDirectorySnapshot(value: JsonValue): DirectorySnapshot {
  const snapshot = asObject(value, "directory snapshot");
  requireLiteral(snapshot, "type", "OrgAnchorDirectorySnapshot", "directory snapshot");
  requireLiteral(snapshot, "version", "0.1", "directory snapshot");
  requireId(snapshot, "snapshot_id", "directory snapshot");
  requireIsoTimestamp(snapshot, "generated_at", "directory snapshot");

  const node = asObject(snapshot.directory_node ?? null, "directory snapshot.directory_node");
  requireString(node, "name", "directory snapshot.directory_node");
  requireHttpUrl(node, "origin", "directory snapshot.directory_node");
  requireHttpUrl(node, "policy_url", "directory snapshot.directory_node");

  const boundary = asObject(snapshot.trust_boundary ?? null, "directory snapshot.trust_boundary");
  if (boundary.directory_is_trust_root !== false) {
    fail("VALIDATION_ERROR", "directory snapshot.trust_boundary.directory_is_trust_root must be false");
  }
  requireLiteral(boundary, "final_trust_decision", "EXTERNAL_AGENT", "directory snapshot.trust_boundary");
  if (boundary.records_must_verify_at_origin !== true) {
    fail("VALIDATION_ERROR", "directory snapshot.trust_boundary.records_must_verify_at_origin must be true");
  }

  if (!Array.isArray(snapshot.records)) {
    fail("VALIDATION_ERROR", "directory snapshot.records must be an array");
  }
  const records = snapshot.records.map((record, index) => validateDirectoryRecord(record, `directory snapshot.records[${index}]`));
  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.record_id)) {
      fail("VALIDATION_ERROR", `Duplicate directory record_id "${record.record_id}"`);
    }
    seen.add(record.record_id);
  }
  return {
    ...(snapshot as Record<string, JsonValue>),
    records
  } as DirectorySnapshot;
}

export function validateDirectoryRecord(value: JsonValue, label = "directory record"): DirectoryRecord {
  const record = asObject(value, label);
  requireLiteral(record, "type", "OrgAnchorDirectoryRecord", label);
  requireLiteral(record, "version", "0.1", label);
  requireId(record, "record_id", label);
  const origin = requireOrigin(record, "origin", label);
  const expectedWellKnown = new URL("/.well-known/organchor.json", `${origin}/`).toString();
  const expectedVerifyIndex = new URL("/verify/organchor.json", `${origin}/`).toString();
  const wellKnown = requireHttpUrl(record, "well_known_url", label);
  const verifyIndex = requireHttpUrl(record, "verify_index_url", label);
  if (wellKnown !== expectedWellKnown) {
    fail("VALIDATION_ERROR", `${label}.well_known_url must be ${expectedWellKnown}`);
  }
  if (verifyIndex !== expectedVerifyIndex) {
    fail("VALIDATION_ERROR", `${label}.verify_index_url must be ${expectedVerifyIndex}`);
  }

  const organization = asObject(record.organization ?? null, `${label}.organization`);
  requireString(organization, "name", `${label}.organization`);
  requireString(organization, "display_name", `${label}.organization`);

  const discovery = asObject(record.discovery ?? null, `${label}.discovery`);
  requireStringArray(discovery, "categories", `${label}.discovery`);
  requireStringArray(discovery, "capabilities", `${label}.discovery`);
  requireStringArray(discovery, "regions", `${label}.discovery`);
  requireStringArray(discovery, "languages", `${label}.discovery`);

  const verification = asObject(record.verification_summary ?? null, `${label}.verification_summary`);
  requireEnum(verification, "identity_status", IDENTITY_STATUSES, `${label}.verification_summary`);
  requireEnum(verification, "value_status", VALUE_STATUSES, `${label}.verification_summary`);
  requireEnum(verification, "policy_route", POLICY_ROUTES, `${label}.verification_summary`);
  requireSha256Digest(verification, "root_authority_hash", `${label}.verification_summary`);
  requireSha256Digest(verification, "statement_hash", `${label}.verification_summary`);
  requireIsoTimestamp(verification, "last_verified_at", `${label}.verification_summary`);

  const evidence = asObject(record.evidence_summary ?? null, `${label}.evidence_summary`);
  requireNonNegativeInteger(evidence, "total_evidence_items", `${label}.evidence_summary`);
  requireNonNegativeInteger(evidence, "third_party_claims", `${label}.evidence_summary`);
  requireNonNegativeInteger(evidence, "reproducible_claims", `${label}.evidence_summary`);
  requireNonNegativeInteger(evidence, "manual_checks", `${label}.evidence_summary`);
  requireNonNegativeInteger(evidence, "unsupported_claims", `${label}.evidence_summary`);

  const source = asObject(record.source ?? null, `${label}.source`);
  requireEnum(source, "method", SOURCE_METHODS, `${label}.source`);
  requireIsoTimestamp(source, "added_at", `${label}.source`);

  if (!Array.isArray(record.limitations) || record.limitations.length === 0) {
    fail("VALIDATION_ERROR", `${label}.limitations must be a non-empty array`);
  }
  for (const limitation of record.limitations) {
    if (typeof limitation !== "string" || limitation.length === 0) {
      fail("VALIDATION_ERROR", `${label}.limitations entries must be non-empty strings`);
    }
  }
  if (!record.limitations.some((item) => typeof item === "string" && item.includes("verify against the origin"))) {
    fail("VALIDATION_ERROR", `${label}.limitations must require direct origin verification`);
  }

  return record as unknown as DirectoryRecord;
}

export function buildDirectorySnapshot(options: {
  snapshotId: string;
  generatedAt: string;
  directoryNode: DirectorySnapshot["directory_node"];
  records: JsonValue[];
}): DirectorySnapshot {
  const snapshot: DirectorySnapshot = {
    type: "OrgAnchorDirectorySnapshot",
    version: "0.1",
    snapshot_id: options.snapshotId,
    generated_at: options.generatedAt,
    directory_node: options.directoryNode,
    trust_boundary: {
      directory_is_trust_root: false,
      final_trust_decision: "EXTERNAL_AGENT",
      records_must_verify_at_origin: true
    },
    records: options.records.map((record, index) => normalizeDirectoryRecord(record, options.generatedAt, index))
  };
  return validateDirectorySnapshot(snapshot as JsonValue);
}

export function verifyDirectorySnapshot(value: JsonValue): DirectoryVerificationReport {
  const checks: DirectoryVerificationReport["checks"] = [];
  let snapshot: DirectorySnapshot | null = null;
  try {
    snapshot = validateDirectorySnapshot(value);
    checks.push({
      id: "snapshot_shape",
      status: "PASS",
      detail: "Directory snapshot structure is valid."
    });
    checks.push({
      id: "trust_boundary",
      status: "PASS",
      detail: "Directory snapshot explicitly says it is not a trust root and records must verify at origin."
    });
    checks.push({
      id: "origin_links",
      status: "PASS",
      detail: `${snapshot.records.length} record(s) point back to origin-owned discovery and verify URLs.`
    });
  } catch (error) {
    checks.push({
      id: "snapshot_shape",
      status: "FAIL",
      detail: error instanceof Error ? error.message : String(error)
    });
  }

  return {
    type: "OrgAnchorDirectoryVerificationReport",
    version: "0.1",
    status: checks.some((check) => check.status === "FAIL") ? "FAIL" : "PASS",
    snapshot_hash: sha256CanonicalJson(value),
    snapshot_id: snapshot?.snapshot_id ?? "",
    record_count: snapshot?.records.length ?? 0,
    checks
  };
}

function normalizeDirectoryRecord(value: JsonValue, generatedAt: string, index: number): DirectoryRecord {
  const input = asObject(value, `directory origin ${index}`);
  const origin = requireOrigin(input, "origin", `directory origin ${index}`);
  const recordId = stringValue(input.record_id) || slugFromOrigin(origin);
  const organization = asObject(input.organization ?? {}, `directory origin ${index}.organization`);
  const discovery = asObject(input.discovery ?? {}, `directory origin ${index}.discovery`);
  const verification = asObject(input.verification_summary ?? {}, `directory origin ${index}.verification_summary`);
  const evidence = asObject(input.evidence_summary ?? {}, `directory origin ${index}.evidence_summary`);
  const source = asObject(input.source ?? {}, `directory origin ${index}.source`);
  const limitations = Array.isArray(input.limitations)
    ? input.limitations
    : [
      "Directory record is a summary only.",
      "Agent must verify against the origin package before relying on it."
    ];

  return validateDirectoryRecord({
    ...input,
    type: "OrgAnchorDirectoryRecord",
    version: "0.1",
    record_id: recordId,
    origin,
    well_known_url: stringValue(input.well_known_url) || new URL("/.well-known/organchor.json", `${origin}/`).toString(),
    verify_index_url: stringValue(input.verify_index_url) || new URL("/verify/organchor.json", `${origin}/`).toString(),
    organization: {
      ...organization,
      name: requireString(organization, "name", `directory origin ${index}.organization`),
      display_name: requireString(organization, "display_name", `directory origin ${index}.organization`)
    },
    discovery: {
      ...discovery,
      categories: stringArrayValue(discovery.categories, ["uncategorized"]),
      capabilities: stringArrayValue(discovery.capabilities, ["not-specified"]),
      regions: stringArrayValue(discovery.regions, ["not-specified"]),
      languages: stringArrayValue(discovery.languages, ["not-specified"])
    },
    verification_summary: {
      ...verification,
      identity_status: stringValue(verification.identity_status) || "NOT_VERIFIED",
      value_status: stringValue(verification.value_status) || "NOT_VERIFIED",
      policy_route: stringValue(verification.policy_route) || "REQUEST_ORIGIN_VERIFICATION",
      root_authority_hash: requireSha256Digest(verification, "root_authority_hash", `directory origin ${index}.verification_summary`),
      statement_hash: requireSha256Digest(verification, "statement_hash", `directory origin ${index}.verification_summary`),
      last_verified_at: stringValue(verification.last_verified_at) || generatedAt
    },
    evidence_summary: {
      ...evidence,
      total_evidence_items: numberValue(evidence.total_evidence_items),
      third_party_claims: numberValue(evidence.third_party_claims),
      reproducible_claims: numberValue(evidence.reproducible_claims),
      manual_checks: numberValue(evidence.manual_checks),
      unsupported_claims: numberValue(evidence.unsupported_claims)
    },
    source: {
      ...source,
      method: stringValue(source.method) || "manual",
      added_at: stringValue(source.added_at) || generatedAt
    },
    limitations
  } as JsonValue);
}

function requireStringArray(object: Record<string, JsonValue>, key: string, label: string): string[] {
  const value = object[key];
  if (!Array.isArray(value) || value.length === 0 || !value.every((item) => typeof item === "string" && item.length > 0)) {
    fail("VALIDATION_ERROR", `${label}.${key} must be a non-empty string array`);
  }
  return value as string[];
}

function requireEnum(object: Record<string, JsonValue>, key: string, allowed: Set<string>, label: string): string {
  const value = requireString(object, key, label);
  if (!allowed.has(value)) {
    fail("VALIDATION_ERROR", `${label}.${key} has unsupported value "${value}"`);
  }
  return value;
}

function requireNonNegativeInteger(object: Record<string, JsonValue>, key: string, label: string): number {
  const value = object[key];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    fail("VALIDATION_ERROR", `${label}.${key} must be a non-negative integer`);
  }
  return value;
}

function requireHttpUrl(object: Record<string, JsonValue>, key: string, label: string): string {
  const value = requireString(object, key, label);
  if (!HTTP_URL.test(value)) {
    fail("VALIDATION_ERROR", `${label}.${key} must be an http(s) URL`);
  }
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      fail("VALIDATION_ERROR", `${label}.${key} must be an http(s) URL`);
    }
    return url.toString();
  } catch {
    fail("VALIDATION_ERROR", `${label}.${key} must be a valid URL`);
  }
}

function requireOrigin(object: Record<string, JsonValue>, key: string, label: string): string {
  const value = requireHttpUrl(object, key, label);
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) {
    fail("VALIDATION_ERROR", `${label}.${key} must be an origin URL without path, query, or fragment`);
  }
  return url.origin;
}

function requireId(object: Record<string, JsonValue>, key: string, label: string): string {
  const value = requireString(object, key, label);
  if (!ID.test(value)) {
    fail("VALIDATION_ERROR", `${label}.${key} must contain only letters, numbers, dot, underscore, colon, or dash`);
  }
  return value;
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function stringArrayValue(value: JsonValue | undefined, fallback: string[]): string[] {
  if (Array.isArray(value) && value.every((item) => typeof item === "string" && item.length > 0)) return value as string[];
  return fallback;
}

function numberValue(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

function slugFromOrigin(origin: string): string {
  return new URL(origin).hostname.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}
