import { canonicalizeJson } from "../core/canonicalize.ts";
import { fail } from "../core/errors.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import type { JsonValue } from "../core/json.ts";
import type { OrgAnchorPrivateKey, RootAuthority, SignatureFile } from "../types/artifacts.ts";
import { signBytes, verifyBytes } from "./keys.ts";
import { completeAuthorizers } from "../core/crypto-policy.ts";

export function createSignatureFile(
  statement: JsonValue,
  privateKey: OrgAnchorPrivateKey,
  now = new Date(),
  authority?: RootAuthority
): SignatureFile {
  const v2 = authority?.version === "2.0";
  if (privateKey.algorithm !== "ed25519" && !v2) throw new Error("Post-quantum signing requires a v2 root authority");
  const entry = { key_id: privateKey.id, algorithm: privateKey.algorithm, signature: "", signed_at: now.toISOString() };
  const authorityHash = authority ? sha256CanonicalJson(authority) : "";
  const canonical = signingInput(statement, v2 ? "2.0" : "1.0", entry, authorityHash);
  entry.signature = signBytes(canonical, privateKey);
  return {
    type: "OrgAnchorSignature",
    version: v2 ? "2.0" : "1.0",
    ...(v2 ? { authority_hash: authorityHash } : {}),
    canonicalization: "RFC8785-JCS",
    hash: {
      algorithm: "sha256",
      value: sha256CanonicalJson(statement)
    },
    signatures: [entry]
  };
}

export interface VerificationResult {
  ok: boolean;
  statement_hash: string;
  valid_signatures: string[];
  valid_authorizers: string[];
  required_signatures: number;
  errors: string[];
}

export function verifySignatureFile(
  statement: JsonValue,
  signatureFile: SignatureFile,
  authority: RootAuthority
): VerificationResult {
  const statementHash = sha256CanonicalJson(statement);
  const errors: string[] = [];
  const validSignatures: string[] = [];
  if (authority.version === "2.0" && signatureFile.version !== "2.0") errors.push("V2 root authority requires a v2 authority-bound signature envelope");
  if (signatureFile.version === "2.0" && signatureFile.authority_hash !== sha256CanonicalJson(authority)) errors.push("Signature authority hash mismatch");
  if (signatureFile.version !== "1.0" && signatureFile.version !== "2.0") errors.push("Unsupported signature version");

  if (signatureFile.hash.value !== statementHash) {
    errors.push(`Statement hash mismatch: expected ${signatureFile.hash.value}, got ${statementHash}`);
  }

  for (const signature of signatureFile.signatures) {
    const key = authority.keys.find((candidate) => candidate.id === signature.key_id);
    if (!key) {
      errors.push(`Signature key "${signature.key_id}" is not in root authority`);
      continue;
    }
    if (key.algorithm !== signature.algorithm) {
      errors.push(`Signature algorithm mismatch for key "${signature.key_id}"`);
      continue;
    }
    if (signature.algorithm !== "ed25519" && signature.algorithm !== "ml-dsa-65") {
      errors.push(`Unsupported signature algorithm "${signature.algorithm}"`);
      continue;
    }
    const canonical = signingInput(statement, signatureFile.version, signature, String(signatureFile.authority_hash ?? ""));
    if (verifyBytes(canonical, signature.signature, key)) {
      validSignatures.push(signature.key_id);
    } else {
      errors.push(`Invalid signature for key "${signature.key_id}"`);
    }
  }

  const uniqueValid = [...new Set(validSignatures)];
  const authorizers = completeAuthorizers(authority, uniqueValid);
  if (authorizers.length < authority.threshold.required) {
    errors.push(
      `Root authority threshold not met: ${authorizers.length}/${authority.threshold.required} complete authorizers`
    );
  }

  return {
    ok: errors.length === 0,
    statement_hash: statementHash,
    valid_signatures: uniqueValid,
    valid_authorizers: authorizers,
    required_signatures: authority.threshold.required,
    errors
  };
}

function signingInput(statement: JsonValue, version: string, entry: { key_id: string; algorithm: string; signed_at: string }, authorityHash: string): Buffer {
  return Buffer.from(canonicalizeJson(version === "1.0" ? statement : {
    type: "OrgAnchorSigningInput", version: "2.0", authority_hash: authorityHash,
    key_id: entry.key_id, algorithm: entry.algorithm, signed_at: entry.signed_at, payload: statement
  }), "utf8");
}

export function assertVerified(result: VerificationResult): void {
  if (!result.ok) {
    fail("VERIFY_FAILED", result.errors.join("; "));
  }
}
