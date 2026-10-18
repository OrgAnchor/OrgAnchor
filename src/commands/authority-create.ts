import { readJsonFile } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readRootAuthorityKey } from "../core/root-authority-keys.ts";
import { applyHolderIds, buildRootAuthority } from "../crypto/authority.ts";

export async function authorityCreateCommand(options: Record<string, string | boolean>): Promise<void> {
  const keyPaths = getKeyPaths(options);
  const out = typeof options.out === "string" ? options.out : "root-authority.json";
  const keys = [];
  for (const keyPath of keyPaths) {
    keys.push(await readRootAuthorityKey(keyPath));
  }
  const thresholdRequired = parseThreshold(options.threshold, keys.length);
  const authority = buildRootAuthority(applyHolderIds(keys, options["holder-ids"]), thresholdRequired,
    typeof options.id === "string" ? options.id : "root-authority-2026",
    typeof options.policy === "string" ? options.policy : undefined);
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
