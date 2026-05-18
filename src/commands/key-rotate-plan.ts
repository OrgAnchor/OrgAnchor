import { writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { readRootAuthorityKey } from "../core/root-authority-keys.ts";
import { validateRootAuthority } from "../core/validate.ts";
import type { JsonValue } from "../core/json.ts";
import type { RootAuthority } from "../types/artifacts.ts";

export async function keyRotatePlanCommand(options: Record<string, string | boolean>): Promise<void> {
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const replaceKeyId = requireOption(options["replace-key"], "--replace-key is required");
  const newKeyPath = requireOption(options["new-key"], "--new-key is required");
  const out = typeof options.out === "string" ? options.out : "root-authority-next.json";
  const planOut = typeof options["plan-out"] === "string" ?
    options["plan-out"] :
    `statements/key-rotation-plan-${new Date().getUTCFullYear()}-001.json`;
  const oldAuthority = validateRootAuthority(await readJsonFile(authorityPath));
  const oldAuthorityHash = sha256CanonicalJson(oldAuthority);
  const newRootKey = await readRootAuthorityKey(newKeyPath);
  if (!oldAuthority.keys.some((key) => key.id === replaceKeyId)) {
    throw new Error(`Cannot replace missing root key: ${replaceKeyId}`);
  }
  if (oldAuthority.keys.some((key) => key.id === newRootKey.id && key.id !== replaceKeyId)) {
    throw new Error(`New key id already exists in root authority: ${newRootKey.id}`);
  }
  const thresholdRequired = parseThreshold(options.threshold, oldAuthority.threshold.required, oldAuthority.threshold.total);
  const newAuthority: RootAuthority = {
    schema: oldAuthority.schema,
    type: "OrgAnchorRootAuthority",
    version: "1.0",
    authority_id: typeof options["new-authority-id"] === "string" ? options["new-authority-id"] : `${oldAuthority.authority_id}-next`,
    created_at: new Date().toISOString(),
    threshold: {
      required: thresholdRequired,
      total: oldAuthority.threshold.total
    },
    keys: oldAuthority.keys.map((key) => key.id === replaceKeyId ? newRootKey : key)
  };
  validateRootAuthority(newAuthority);
  const newAuthorityHash = sha256CanonicalJson(newAuthority);
  const plan: JsonValue = {
    schema: "https://organchor.org/schemas/key-rotation-plan.v1.json",
    type: "OrgAnchorKeyRotationPlan",
    version: "1.0",
    plan_id: typeof options.id === "string" ? options.id : `organchor-key-rotation-${new Date().getUTCFullYear()}-001`,
    created_at: new Date().toISOString(),
    action: "replace-root-member-key",
    replaced_key_id: replaceKeyId,
    added_key_id: newRootKey.id,
    old_root_authority_path: authorityPath,
    new_root_authority_path: out,
    old_root_authority_hash: oldAuthorityHash,
    new_root_authority_hash: newAuthorityHash,
    old_threshold: oldAuthority.threshold,
    new_threshold: newAuthority.threshold,
    next_step: "Review this plan, then create and sign a root authority migration statement from the old authority to the new authority."
  };
  await writeJsonFile(out, newAuthority);
  await writeJsonFile(planOut, plan);
  console.log(`Created next root authority: ${out}`);
  console.log(`Created key rotation plan: ${planOut}`);
  console.log(`Replaced key: ${replaceKeyId}`);
  console.log(`Added key: ${newRootKey.id}`);
  console.log(`Old authority hash: ${oldAuthorityHash}`);
  console.log(`New authority hash: ${newAuthorityHash}`);
}

function parseThreshold(value: string | boolean | undefined, fallback: number, total: number): number {
  if (value === undefined || value === false) return fallback;
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
    throw new Error("--threshold must be a positive integer");
  }
  const parsed = Number(value);
  if (parsed > total) throw new Error("--threshold cannot be greater than the number of keys");
  return parsed;
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
