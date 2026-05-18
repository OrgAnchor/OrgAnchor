import { canonicalizeJson } from "../core/canonicalize.ts";
import { fail } from "../core/errors.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import type { JsonValue } from "../core/json.ts";
import type { OrgAnchorPrivateKey, RootAuthority, SignatureFile } from "../types/artifacts.ts";
import { signEd25519, verifyEd25519 } from "./ed25519.ts";

export function createSignatureFile(
  statement: JsonValue,
  privateKey: OrgAnchorPrivateKey,
  now = new Date()
): SignatureFile {
  const canonical = Buffer.from(canonicalizeJson(statement), "utf8");
  return {
    type: "OrgAnchorSignature",
    version: "1.0",
    canonicalization: "RFC8785-JCS",
    hash: {
      algorithm: "sha256",
      value: sha256CanonicalJson(statement)
    },
    signatures: [
      {
        key_id: privateKey.id,
        algorithm: privateKey.algorithm,
        signature: signEd25519(canonical, privateKey),
        signed_at: now.toISOString()
      }
    ]
  };
}

export interface VerificationResult {
  ok: boolean;
  statement_hash: string;
  valid_signatures: string[];
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

  if (signatureFile.hash.value !== statementHash) {
    errors.push(`Statement hash mismatch: expected ${signatureFile.hash.value}, got ${statementHash}`);
  }

  const canonical = Buffer.from(canonicalizeJson(statement), "utf8");
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
    if (signature.algorithm !== "ed25519") {
      errors.push(`Unsupported signature algorithm "${signature.algorithm}"`);
      continue;
    }
    if (verifyEd25519(canonical, signature.signature, key)) {
      validSignatures.push(signature.key_id);
    } else {
      errors.push(`Invalid signature for key "${signature.key_id}"`);
    }
  }

  const uniqueValid = [...new Set(validSignatures)];
  if (uniqueValid.length < authority.threshold.required) {
    errors.push(
      `Root authority threshold not met: ${uniqueValid.length}/${authority.threshold.required} valid signatures`
    );
  }

  return {
    ok: errors.length === 0,
    statement_hash: statementHash,
    valid_signatures: uniqueValid,
    required_signatures: authority.threshold.required,
    errors
  };
}

export function assertVerified(result: VerificationResult): void {
  if (!result.ok) {
    fail("VERIFY_FAILED", result.errors.join("; "));
  }
}
