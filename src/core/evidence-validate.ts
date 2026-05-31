import { fail } from "./errors.ts";
import { asObject, requireIsoTimestamp, requireSha256Digest, requireString } from "./validate.ts";
import type { JsonValue } from "./json.ts";

export function validateClaimsManifest(value: JsonValue): JsonValue {
  const object = asObject(value, "claims manifest");
  if (object.type !== "OrgAnchorProductClaims") fail("VALIDATION_ERROR", "Invalid claims manifest type");
  if (object.version !== "1.0") fail("VALIDATION_ERROR", "Unsupported claims manifest version");
  requireString(object, "schema", "claims manifest");
  requireString(object, "statement_id", "claims manifest");
  requireIsoTimestamp(object, "issued_at", "claims manifest");
  asObject(object.organization_ref ?? null, "claims manifest.organization_ref");
  if (!Array.isArray(object.claims)) fail("VALIDATION_ERROR", "claims manifest.claims must be an array");
  for (const claim of object.claims) {
    const claimObject = asObject(claim, "claim");
    requireString(claimObject, "id", "claim");
    requireString(claimObject, "claim_text", "claim");
    if (!Array.isArray(claimObject.evidence_refs)) {
      fail("VALIDATION_ERROR", "claim.evidence_refs must be an array");
    }
  }
  return value;
}

export function validateEvidenceManifest(value: JsonValue): JsonValue {
  const object = asObject(value, "evidence manifest");
  if (object.type !== "OrgAnchorEvidenceManifest") fail("VALIDATION_ERROR", "Invalid evidence manifest type");
  if (object.version !== "1.0") fail("VALIDATION_ERROR", "Unsupported evidence manifest version");
  requireString(object, "schema", "evidence manifest");
  requireString(object, "manifest_id", "evidence manifest");
  requireIsoTimestamp(object, "issued_at", "evidence manifest");
  asObject(object.organization_ref ?? null, "evidence manifest.organization_ref");
  if (!Array.isArray(object.evidence)) fail("VALIDATION_ERROR", "evidence manifest.evidence must be an array");
  const methodIds = validateMethods(object);
  const ids = new Set<string>();
  for (const item of object.evidence) {
    const itemObject = asObject(item, "evidence item");
    const id = requireString(itemObject, "id", "evidence item");
    if (ids.has(id)) fail("VALIDATION_ERROR", `Duplicate evidence id "${id}"`);
    ids.add(id);
    requireString(itemObject, "title", "evidence item");
    requireString(itemObject, "issuer_type", "evidence item");
    requireString(itemObject, "media_type", "evidence item");
    requireSha256Digest(itemObject, "hash", "evidence item");
    validateOptionalSClass(itemObject);
    if (typeof itemObject.size !== "number" || itemObject.size < 0) {
      fail("VALIDATION_ERROR", "evidence item.size must be a non-negative number");
    }
    if (!Array.isArray(itemObject.locations)) fail("VALIDATION_ERROR", "evidence item.locations must be an array");
    if (itemObject.method_refs !== undefined) {
      if (!Array.isArray(itemObject.method_refs)) fail("VALIDATION_ERROR", "evidence item.method_refs must be an array");
      for (const ref of itemObject.method_refs) {
        if (typeof ref !== "string" || ref.length === 0) fail("VALIDATION_ERROR", "evidence item.method_refs must contain strings");
        if (!methodIds.has(ref)) fail("VALIDATION_ERROR", `Evidence method reference "${ref}" does not exist`);
      }
    }
  }
  return value;
}

function validateOptionalSClass(itemObject: Record<string, JsonValue>): void {
  if (itemObject.s_class !== undefined && typeof itemObject.s_class !== "string") {
    fail("VALIDATION_ERROR", "evidence item.s_class must be a string");
  }
  if (itemObject.s2 !== undefined && (!itemObject.s2 || typeof itemObject.s2 !== "object" || Array.isArray(itemObject.s2))) {
    fail("VALIDATION_ERROR", "evidence item.s2 must be an object");
  }
  if (itemObject.s3 !== undefined && (!itemObject.s3 || typeof itemObject.s3 !== "object" || Array.isArray(itemObject.s3))) {
    fail("VALIDATION_ERROR", "evidence item.s3 must be an object");
  }
  if (itemObject.s4 !== undefined && (!itemObject.s4 || typeof itemObject.s4 !== "object" || Array.isArray(itemObject.s4))) {
    fail("VALIDATION_ERROR", "evidence item.s4 must be an object");
  }
  if (itemObject.s_class === "S2_THIRD_PARTY_DOCUMENTS" && itemObject.s2 === undefined) {
    fail("VALIDATION_ERROR", "S2 evidence item requires s2 metadata");
  }
  if (itemObject.s_class === "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING" && itemObject.s3 === undefined) {
    fail("VALIDATION_ERROR", "S3 evidence item requires s3 metadata");
  }
  if (itemObject.s_class === "S4_REAL_WORLD_OBSERVATION" && itemObject.s4 === undefined) {
    fail("VALIDATION_ERROR", "S4 evidence item requires s4 metadata");
  }
}

function validateMethods(object: Record<string, JsonValue>): Set<string> {
  const ids = new Set<string>();
  if (object.methods === undefined) return ids;
  if (!Array.isArray(object.methods)) fail("VALIDATION_ERROR", "evidence manifest.methods must be an array");
  for (const method of object.methods) {
    const methodObject = asObject(method, "evidence method");
    if (methodObject.type !== undefined && methodObject.type !== "OrgAnchorEvidenceMethod") {
      fail("VALIDATION_ERROR", "evidence method.type must be OrgAnchorEvidenceMethod");
    }
    const id = requireString(methodObject, "id", "evidence method");
    if (ids.has(id)) fail("VALIDATION_ERROR", `Duplicate evidence method id "${id}"`);
    ids.add(id);
    requireString(methodObject, "method_kind", "evidence method");
    requireString(methodObject, "title", "evidence method");
    requireNonEmptyStringArray(methodObject.steps, "evidence method.steps");
    requireNonEmptyStringArray(methodObject.expected_results, "evidence method.expected_results");
    if (methodObject.target_evidence_ids !== undefined) {
      requireNonEmptyStringArray(methodObject.target_evidence_ids, "evidence method.target_evidence_ids");
    }
    if (methodObject.target_claim_ids !== undefined) {
      requireNonEmptyStringArray(methodObject.target_claim_ids, "evidence method.target_claim_ids");
    }
  }
  return ids;
}

function requireNonEmptyStringArray(value: JsonValue | undefined, label: string): void {
  if (!Array.isArray(value) || value.length === 0) fail("VALIDATION_ERROR", `${label} must be a non-empty array`);
  for (const item of value) {
    if (typeof item !== "string" || item.length === 0) fail("VALIDATION_ERROR", `${label} must contain non-empty strings`);
  }
}
