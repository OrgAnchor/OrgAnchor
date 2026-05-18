import { readJsonFile } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { validatePrivateKey, validateRootAuthority } from "../core/validate.ts";
import { rootAuthorityKeyFromPrivate } from "../crypto/ed25519.ts";
import type { RootAuthority } from "../types/artifacts.ts";

export async function authorityCreateCommand(options: Record<string, string | boolean>): Promise<void> {
  const keyPaths = getKeyPaths(options);
  const out = typeof options.out === "string" ? options.out : "root-authority.json";
  const privateKeys = [];
  for (const keyPath of keyPaths) {
    privateKeys.push(validatePrivateKey(await readJsonFile(keyPath)));
  }
  const thresholdRequired = parseThreshold(options.threshold, privateKeys.length);
  const authority: RootAuthority = {
    schema: "https://organchor.org/schemas/root-authority.v1.json",
    type: "OrgAnchorRootAuthority",
    version: "1.0",
    authority_id: typeof options.id === "string" ? options.id : "root-authority-2026",
    created_at: new Date().toISOString(),
    threshold: {
      required: thresholdRequired,
      total: privateKeys.length
    },
    keys: privateKeys.map((privateKey) => rootAuthorityKeyFromPrivate(privateKey))
  };
  validateRootAuthority(authority);
  await writeJsonFile(out, authority);
  console.log(`Created root authority: ${out}`);
  console.log(`Threshold: ${authority.threshold.required}-of-${authority.threshold.total}`);
  console.log(`Root authority hash: ${sha256CanonicalJson(authority)}`);
}

function getKeyPaths(options: Record<string, string | boolean>): string[] {
  const value = typeof options.keys === "string" ? options.keys : options.key;
  if (typeof value !== "string" || value.length === 0) throw new Error("--key or --keys is required");
  const keyPaths = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (keyPaths.length === 0) throw new Error("--key or --keys is required");
  return keyPaths;
}

function parseThreshold(value: string | boolean | undefined, total: number): number {
  if (value === undefined || value === false) return 1;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new Error("--threshold must be a positive integer");
  }
  const required = Number(value);
  if (required > total) {
    throw new Error("--threshold cannot be greater than the number of keys");
  }
  return required;
}
