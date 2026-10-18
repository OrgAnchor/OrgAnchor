import { fail } from "./errors.ts";
import { createPrivateKey, createPublicKey } from "node:crypto";
import { fromBase64Url, toBase64Url } from "./base64url.ts";
import { assertNoCryptoDowngrade, requiredAlgorithms } from "./crypto-policy.ts";
import { sha256CanonicalJson } from "./hash.ts";
import type { JsonValue } from "./json.ts";
import type {
  OfficialEndpointsStatement,
  OrgAnchorPrivateKey,
  OrgAnchorPublicKey,
  RootAuthorityMigration,
  RootAuthority,
  SignatureFile
} from "../types/artifacts.ts";

const ROOT_AUTHORITY_SCHEMA = "https://organchor.org/schemas/root-authority.v1.json";
const OFFICIAL_ENDPOINTS_SCHEMA = "https://organchor.org/schemas/official-endpoints.v1.json";
const ROOT_MIGRATION_SCHEMA = "https://organchor.org/schemas/root-authority-migration.v1.json";
const SHA256_DIGEST = /^sha256:[0-9a-f]{64}$/;
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

export function asObject(value: JsonValue, label: string): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("VALIDATION_ERROR", `${label} must be an object`);
  }
  return value;
}

export function requireLiteral(
  object: Record<string, JsonValue>,
  key: string,
  expected: string,
  label: string
): void {
  if (object[key] !== expected) {
    fail("VALIDATION_ERROR", `${label}.${key} must be "${expected}"`);
  }
}

export function requireString(object: Record<string, JsonValue>, key: string, label: string): string {
  const value = object[key];
  if (typeof value !== "string" || value.length === 0) {
    fail("VALIDATION_ERROR", `${label}.${key} must be a non-empty string`);
  }
  return value;
}

export function requireInteger(object: Record<string, JsonValue>, key: string, label: string): number {
  const value = object[key];
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail("VALIDATION_ERROR", `${label}.${key} must be an integer`);
  }
  return value;
}

export function requireSha256Digest(object: Record<string, JsonValue>, key: string, label: string): string {
  const value = requireString(object, key, label);
  if (!SHA256_DIGEST.test(value)) {
    fail("VALIDATION_ERROR", `${label}.${key} must be a sha256:<64 lowercase hex> digest`);
  }
  return value;
}

export function requireBase64Url(object: Record<string, JsonValue>, key: string, label: string): string {
  const value = requireString(object, key, label);
  if (!BASE64URL.test(value)) {
    fail("VALIDATION_ERROR", `${label}.${key} must be base64url`);
  }
  return value;
}

export function requireIsoTimestamp(object: Record<string, JsonValue>, key: string, label: string): string {
  const value = requireString(object, key, label);
  if (!ISO_TIMESTAMP.test(value) || Number.isNaN(Date.parse(value))) {
    fail("VALIDATION_ERROR", `${label}.${key} must be an ISO 8601 UTC timestamp`);
  }
  return value;
}

export function validatePrivateKey(value: JsonValue): OrgAnchorPrivateKey {
  const object = asObject(value, "private key");
  requireLiteral(object, "type", "OrgAnchorPrivateKey", "private key");
  requireKeyVersion(object, "private key");
  requireString(object, "id", "private key");
  requireIsoTimestamp(object, "created_at", "private key");
  const material = asObject(object.key_material ?? null, "private key.key_material");
  if (object.algorithm === "ed25519") {
    if (material.format !== "jwk") fail("VALIDATION_ERROR", "Private key material must be JWK");
    validateEd25519Jwk(asObject(material.jwk ?? null, "private key.key_material.jwk"), true, "private key.key_material.jwk");
  } else {
    validateDerMaterial(material, true);
  }
  return value as unknown as OrgAnchorPrivateKey;
}

export function validatePublicKey(value: JsonValue): OrgAnchorPublicKey {
  const object = asObject(value, "public key");
  requireLiteral(object, "type", "OrgAnchorPublicKey", "public key");
  requireKeyVersion(object, "public key");
  requireString(object, "id", "public key");
  requireIsoTimestamp(object, "created_at", "public key");
  const publicKey = asObject(object.public_key ?? null, "public key.public_key");
  validatePublicMaterial(object.algorithm, publicKey);
  return value as unknown as OrgAnchorPublicKey;
}

export function validateRootAuthority(value: JsonValue): RootAuthority {
  const object = asObject(value, "root authority");
  requireLiteral(object, "type", "OrgAnchorRootAuthority", "root authority");
  requireSupportedVersion(object, "root authority");
  requireLiteral(object, "schema", object.version === "1.0" ? ROOT_AUTHORITY_SCHEMA : "https://organchor.org/schemas/root-authority.v2.json", "root authority");
  requireString(object, "authority_id", "root authority");
  requireIsoTimestamp(object, "created_at", "root authority");
  const threshold = asObject(object.threshold ?? null, "root authority.threshold");
  const required = requireInteger(threshold, "required", "root authority.threshold");
  const total = requireInteger(threshold, "total", "root authority.threshold");
  const keys = object.keys;
  if (!Array.isArray(keys) || keys.length === 0) fail("VALIDATION_ERROR", "root authority.keys must be non-empty");
  if (required < 1 || total < 1 || required > total || (object.version === "1.0" && total !== keys.length)) {
    fail("VALIDATION_ERROR", "Invalid root authority threshold");
  }
  const seen = new Set<string>();
  const materials = new Set<string>();
  const holders = new Map<string, Set<string>>();
  const algorithms = object.version === "2.0" ? requiredAlgorithms(value as unknown as RootAuthority) : ["ed25519"];
  if (object.version === "2.0" && keys.length > 128) fail("VALIDATION_ERROR", "A v2 authority supports at most 128 keys");
  for (const key of keys) {
    const keyObject = asObject(key, "root authority key");
    const id = requireString(keyObject, "id", "root authority key");
    if (seen.has(id)) fail("VALIDATION_ERROR", `Duplicate root authority key id "${id}"`);
    seen.add(id);
    if (object.version === "1.0") requireEd25519Algorithm(keyObject.algorithm, "root authority key.algorithm");
    else if (!algorithms.includes(keyObject.algorithm as "ed25519" | "ml-dsa-65")) fail("UNSUPPORTED_ALGORITHM", "Root key algorithm is not permitted by the authority policy");
    const publicKey = asObject(keyObject.public_key ?? null, "root authority key.public_key");
    validatePublicMaterial(keyObject.algorithm, publicKey);
    if (object.version === "2.0") {
      const holder = requireString(keyObject, "holder_id", "root authority key");
      const holderAlgorithms = holders.get(holder) ?? new Set<string>();
      if (holderAlgorithms.has(String(keyObject.algorithm))) fail("VALIDATION_ERROR", "A holder can have only one key per required algorithm");
      holderAlgorithms.add(String(keyObject.algorithm));
      holders.set(holder, holderAlgorithms);
      let fingerprint: string;
      if (publicKey.format === "jwk") {
        const x = requireString(asObject(publicKey.jwk ?? null, "JWK"), "x", "JWK");
        const bytes = fromBase64Url(x);
        if (bytes.length !== 32 || toBase64Url(bytes) !== x) fail("VALIDATION_ERROR", "V2 Ed25519 public key must have canonical 32-byte base64url encoding");
        fingerprint = `ed25519:${bytes.toString("hex")}`;
      } else fingerprint = `ml-dsa-65:${String(publicKey.data)}`;
      if (materials.has(fingerprint)) fail("VALIDATION_ERROR", "Duplicate public key material cannot represent independent holders");
      materials.add(fingerprint);
    }
  }
  if (object.version === "2.0" && (holders.size !== total || [...holders.values()].some((set) => algorithms.some((algorithm) => !set.has(algorithm))))) {
    fail("VALIDATION_ERROR", "V2 threshold total must equal the number of holders with a complete required algorithm set");
  }
  return value as unknown as RootAuthority;
}

export function validateSignatureFile(value: JsonValue): SignatureFile {
  const object = asObject(value, "signature");
  requireLiteral(object, "type", "OrgAnchorSignature", "signature");
  requireSupportedVersion(object, "signature");
  if (object.version === "2.0") requireSha256Digest(object, "authority_hash", "signature");
  requireLiteral(object, "canonicalization", "RFC8785-JCS", "signature");
  const hash = asObject(object.hash ?? null, "signature.hash");
  requireLiteral(hash, "algorithm", "sha256", "signature.hash");
  requireSha256Digest(hash, "value", "signature.hash");
  if (!Array.isArray(object.signatures) || object.signatures.length === 0) {
    fail("VALIDATION_ERROR", "signature.signatures must be non-empty");
  }
  const seen = new Set<string>();
  for (const entry of object.signatures) {
    const sig = asObject(entry, "signature entry");
    const keyId = requireString(sig, "key_id", "signature entry");
    if (seen.has(keyId)) fail("VALIDATION_ERROR", `Duplicate signature for key "${keyId}"`);
    seen.add(keyId);
    if (object.version === "1.0") requireEd25519Algorithm(sig.algorithm, "signature entry.algorithm");
    else if (sig.algorithm !== "ed25519" && sig.algorithm !== "ml-dsa-65") fail("UNSUPPORTED_ALGORITHM", "Unsupported v2 signature algorithm");
    requireBase64Url(sig, "signature", "signature entry");
    requireIsoTimestamp(sig, "signed_at", "signature entry");
  }
  return value as unknown as SignatureFile;
}

export function validateOfficialStatement(value: JsonValue): OfficialEndpointsStatement {
  const object = asObject(value, "official endpoints statement");
  requireLiteral(object, "schema", OFFICIAL_ENDPOINTS_SCHEMA, "statement");
  requireLiteral(object, "type", "OfficialOrganizationEndpoints", "statement");
  requireLiteral(object, "version", "1.0", "statement");
  requireString(object, "statement_id", "statement");
  requireIsoTimestamp(object, "issued_at", "statement");
  const rootAuthorityHash = requireSha256Digest(object, "root_authority_hash", "statement");
  const organization = asObject(object.organization ?? null, "statement.organization");
  requireString(organization, "name", "statement.organization");
  requireString(organization, "display_name", "statement.organization");
  const rootAuthority = validateRootAuthority(object.root_authority ?? null);
  if (rootAuthorityHash !== sha256CanonicalJson(rootAuthority)) {
    fail("VALIDATION_ERROR", "statement.root_authority_hash does not match embedded root_authority");
  }
  asObject(object.official_endpoints ?? null, "statement.official_endpoints");
  const archives = asObject(object.archives ?? null, "statement.archives");
  if (!Array.isArray(archives.arweave)) fail("VALIDATION_ERROR", "statement.archives.arweave must be an array");
  if (!Array.isArray(archives.ipfs)) fail("VALIDATION_ERROR", "statement.archives.ipfs must be an array");
  asObject(object.disaster_recovery ?? null, "statement.disaster_recovery");
  asObject(object.auxiliary_names ?? null, "statement.auxiliary_names");
  asObject(object.domain_security ?? null, "statement.domain_security");
  requireString(object, "notes", "statement");
  return value as unknown as OfficialEndpointsStatement;
}

export function validateRootAuthorityMigration(value: JsonValue): RootAuthorityMigration {
  const object = asObject(value, "root authority migration");
  requireLiteral(object, "type", "OrgAnchorRootAuthorityMigration", "migration");
  requireSupportedVersion(object, "migration");
  requireLiteral(object, "schema", object.version === "1.0" ? ROOT_MIGRATION_SCHEMA : "https://organchor.org/schemas/root-authority-migration.v2.json", "migration");
  requireString(object, "migration_id", "migration");
  requireIsoTimestamp(object, "issued_at", "migration");
  requireIsoTimestamp(object, "effective_at", "migration");
  requireString(object, "reason", "migration");
  const oldRootAuthorityHash = requireSha256Digest(object, "old_root_authority_hash", "migration");
  const newRootAuthorityHash = requireSha256Digest(object, "new_root_authority_hash", "migration");
  const oldRootAuthority = validateRootAuthority(object.old_root_authority ?? null);
  const newRootAuthority = validateRootAuthority(object.new_root_authority ?? null);
  if (object.version === "1.0" && (oldRootAuthority.version !== "1.0" || newRootAuthority.version !== "1.0")) {
    fail("VALIDATION_ERROR", "Migration involving a v2 authority requires a v2 migration record");
  }
  if (object.version === "2.0") {
    assertNoCryptoDowngrade(oldRootAuthority, newRootAuthority);
    if (requireInteger(object, "sequence", "migration") < 1) fail("VALIDATION_ERROR", "Migration sequence must be positive");
    if (object.previous_migration_hash !== null) requireSha256Digest(object, "previous_migration_hash", "migration");
    if (Date.parse(String(object.effective_at)) < Date.parse(String(object.issued_at))) fail("VALIDATION_ERROR", "Migration effective_at must not precede issued_at");
  }
  if (oldRootAuthorityHash !== sha256CanonicalJson(oldRootAuthority)) {
    fail("VALIDATION_ERROR", "migration.old_root_authority_hash does not match embedded old_root_authority");
  }
  if (newRootAuthorityHash !== sha256CanonicalJson(newRootAuthority)) {
    fail("VALIDATION_ERROR", "migration.new_root_authority_hash does not match embedded new_root_authority");
  }
  if (oldRootAuthorityHash === newRootAuthorityHash) {
    fail("VALIDATION_ERROR", "migration old and new root authority hashes must differ");
  }
  if (!Array.isArray(object.supersedes_statement_hashes)) {
    fail("VALIDATION_ERROR", "migration.supersedes_statement_hashes must be an array");
  }
  for (const hash of object.supersedes_statement_hashes) {
    if (typeof hash !== "string" || !SHA256_DIGEST.test(hash)) {
      fail("VALIDATION_ERROR", "migration.supersedes_statement_hashes entries must be sha256:<64 lowercase hex>");
    }
  }
  requireString(object, "notes", "migration");
  return value as unknown as RootAuthorityMigration;
}

function requireEd25519Algorithm(value: JsonValue | undefined, label: string): void {
  if (value !== "ed25519") {
    fail("UNSUPPORTED_ALGORITHM", `${label}: only ed25519 is supported in v1`);
  }
}

function requireSupportedVersion(object: Record<string, JsonValue>, label: string): void {
  if (object.version !== "1.0" && object.version !== "2.0") fail("UNSUPPORTED_VERSION", `${label}: unsupported version`);
}

function requireKeyVersion(object: Record<string, JsonValue>, label: string): void {
  requireSupportedVersion(object, label);
  if (object.algorithm === "ed25519") requireLiteral(object, "version", "1.0", label);
  else if (object.algorithm === "ml-dsa-65") requireLiteral(object, "version", "2.0", label);
  else fail("UNSUPPORTED_ALGORITHM", `${label}: unsupported key algorithm`);
  if (object.holder_id !== undefined) requireString(object, "holder_id", label);
}

function validatePublicMaterial(algorithm: JsonValue | undefined, material: Record<string, JsonValue>): void {
  if (algorithm === "ed25519") {
    if (material.format !== "jwk") fail("VALIDATION_ERROR", "Ed25519 public key must be JWK");
    validateEd25519Jwk(asObject(material.jwk ?? null, "public JWK"), false, "public JWK");
  } else if (algorithm === "ml-dsa-65") validateDerMaterial(material, false);
  else fail("UNSUPPORTED_ALGORITHM", "Unsupported public key algorithm");
}

function validateDerMaterial(material: Record<string, JsonValue>, privateMaterial: boolean): void {
  requireLiteral(material, "format", privateMaterial ? "pkcs8-der" : "spki-der", "ML-DSA material");
  if (Object.keys(material).some((key) => key !== "format" && key !== "data")) fail("VALIDATION_ERROR", "Unexpected ML-DSA material field");
  const data = requireBase64Url(material, "data", "ML-DSA material");
  if (data.length > 20000) fail("VALIDATION_ERROR", "ML-DSA material exceeds the bounded key size");
  try {
    const bytes = fromBase64Url(data);
    const key = privateMaterial ? createPrivateKey({ key: bytes, format: "der", type: "pkcs8" }) : createPublicKey({ key: bytes, format: "der", type: "spki" });
    const exported = privateMaterial ? key.export({ format: "der", type: "pkcs8" }) : key.export({ format: "der", type: "spki" });
    if (key.asymmetricKeyType !== "ml-dsa-65" || toBase64Url(exported) !== data) throw new Error("Invalid encoding or algorithm");
  } catch {
    fail("VALIDATION_ERROR", "Invalid or unsupported ML-DSA-65 key encoding; use a native ML-DSA capable runtime");
  }
}

function validateEd25519Jwk(jwk: Record<string, JsonValue>, requirePrivate: boolean, label: string): void {
  requireLiteral(jwk, "kty", "OKP", label);
  requireLiteral(jwk, "crv", "Ed25519", label);
  requireBase64Url(jwk, "x", label);
  if (requirePrivate) {
    requireBase64Url(jwk, "d", label);
  } else if ("d" in jwk) {
    fail("VALIDATION_ERROR", `${label}.d must not be present in public key material`);
  }
}
