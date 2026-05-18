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
    if (typeof itemObject.size !== "number" || itemObject.size < 0) {
      fail("VALIDATION_ERROR", "evidence item.size must be a non-negative number");
    }
    if (!Array.isArray(itemObject.locations)) fail("VALIDATION_ERROR", "evidence item.locations must be an array");
  }
  return value;
}
