import { readJsonFile } from "../core/json.ts";
import { pathExists, writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import {
  validateOfficialStatement,
  validatePrivateKey,
  validateRootAuthority,
  validateSignatureFile
} from "../core/validate.ts";
import { createSignatureFile } from "../crypto/signature.ts";
import type { SignatureFile } from "../types/artifacts.ts";

export async function statementSignCommand(options: Record<string, string | boolean>): Promise<void> {
  const keyPath = requireOption(options.key, "--key is required");
  const input = requireOption(options.in, "--in is required");
  const out = typeof options.out === "string" ? options.out : `${input}.sig`;
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";

  const privateKey = validatePrivateKey(await readJsonFile(keyPath));
  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  if (!authority.keys.some((key) => key.id === privateKey.id)) {
    throw new Error(`Private key "${privateKey.id}" is not part of the root authority`);
  }

  const statement = validateOfficialStatement(await readJsonFile(input));
  if (statement.root_authority_hash !== sha256CanonicalJson(authority)) {
    throw new Error("Statement root_authority_hash does not match authority file");
  }

  const newSignature = createSignatureFile(statement, privateKey);
  const signature = await maybeAppendSignature(out, newSignature, options.append === true);
  await writeJsonFile(out, signature);
  console.log(`Created signature: ${out}`);
  console.log(`Statement hash: ${signature.hash.value}`);
  console.log(`Signatures: ${signature.signatures.length}/${authority.threshold.required} required`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

async function maybeAppendSignature(
  out: string,
  newSignature: SignatureFile,
  append: boolean
): Promise<SignatureFile> {
  if (!append || !(await pathExists(out))) return newSignature;
  const existing = validateSignatureFile(await readJsonFile(out));
  if (existing.hash.value !== newSignature.hash.value) {
    throw new Error("Existing signature file hash does not match the statement being signed");
  }
  const entry = newSignature.signatures[0];
  if (!entry) throw new Error("New signature file has no signature entry");
  return {
    ...existing,
    signatures: [...existing.signatures.filter((signature) => signature.key_id !== entry.key_id), entry]
  };
}
