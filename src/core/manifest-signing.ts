import { readJsonFile } from "./json.ts";
import { pathExists, writeJsonFile } from "./files.ts";
import { sha256CanonicalJson } from "./hash.ts";
import { validatePrivateKey, validateRootAuthority, validateSignatureFile } from "./validate.ts";
import { createSignatureFile, verifySignatureFile } from "../crypto/signature.ts";
import type { JsonValue } from "./json.ts";
import type { SignatureFile } from "../types/artifacts.ts";

export async function signManifestFile(options: {
  keyPath: string;
  authorityPath: string;
  inputPath: string;
  outputPath: string;
  validate: (value: JsonValue) => JsonValue;
  append?: boolean;
}): Promise<{ hash: string; signatures: number; required: number }> {
  const privateKey = validatePrivateKey(await readJsonFile(options.keyPath));
  const authority = validateRootAuthority(await readJsonFile(options.authorityPath));
  if (!authority.keys.some((key) => key.id === privateKey.id)) {
    throw new Error(`Private key "${privateKey.id}" is not part of the root authority`);
  }
  const manifest = options.validate(await readJsonFile(options.inputPath));
  const newSignature = createSignatureFile(manifest, privateKey);
  const signature = await maybeAppendSignature(options.outputPath, newSignature, options.append === true);
  await writeJsonFile(options.outputPath, signature);
  return {
    hash: signature.hash.value,
    signatures: signature.signatures.length,
    required: authority.threshold.required
  };
}

export async function verifyManifestFile(options: {
  authorityPath: string;
  inputPath: string;
  signaturePath: string;
  expectedAuthorityHash?: string | undefined;
  validate: (value: JsonValue) => JsonValue;
}): Promise<{ ok: boolean; errors: string[]; hash: string; authorityHash: string; validSignatures: string[] }> {
  const authority = validateRootAuthority(await readJsonFile(options.authorityPath));
  const authorityHash = sha256CanonicalJson(authority);
  const manifest = options.validate(await readJsonFile(options.inputPath));
  const signature = validateSignatureFile(await readJsonFile(options.signaturePath));
  const verification = verifySignatureFile(manifest, signature, authority);
  const errors = [...verification.errors];

  if (options.expectedAuthorityHash && options.expectedAuthorityHash !== authorityHash) {
    errors.push("Authority hash does not match --expected-authority-hash");
  }

  return {
    ok: errors.length === 0,
    errors,
    hash: verification.statement_hash,
    authorityHash,
    validSignatures: verification.valid_signatures
  };
}

async function maybeAppendSignature(
  outputPath: string,
  newSignature: SignatureFile,
  append: boolean
): Promise<SignatureFile> {
  if (!append || !(await pathExists(outputPath))) return newSignature;
  const existing = validateSignatureFile(await readJsonFile(outputPath));
  if (existing.hash.value !== newSignature.hash.value) {
    throw new Error("Existing signature file hash does not match the manifest being signed");
  }
  const entry = newSignature.signatures[0];
  if (!entry) throw new Error("New signature file has no signature entry");
  return {
    ...existing,
    signatures: [...existing.signatures.filter((signature) => signature.key_id !== entry.key_id), entry]
  };
}
