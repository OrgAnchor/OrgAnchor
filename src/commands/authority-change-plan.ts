import { writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { readRootAuthorityKey } from "../core/root-authority-keys.ts";
import { validateRootAuthority } from "../core/validate.ts";
import type { RootAuthority, RootAuthorityChangePlan, RootAuthorityKey } from "../types/artifacts.ts";

export async function authorityChangePlanCommand(options: Record<string, string | boolean>): Promise<void> {
  const oldAuthorityPath = typeof options["old-authority"] === "string" ?
    options["old-authority"] :
    typeof options.authority === "string" ?
      options.authority :
      "root-authority.json";
  const out = typeof options.out === "string" ? options.out : "root-authority-next.json";
  const planOut = typeof options["plan-out"] === "string" ?
    options["plan-out"] :
    `statements/root-authority-change-plan-${new Date().getUTCFullYear()}-001.json`;
  const oldAuthority = validateRootAuthority(await readJsonFile(oldAuthorityPath));
  const oldAuthorityHash = sha256CanonicalJson(oldAuthority);
  const retainedKeys = selectRetainedKeys(oldAuthority, options);
  const addedKeys = await readAddedKeys(options);
  const nextKeys = [...retainedKeys, ...addedKeys];
  assertUniqueKeyIds(nextKeys);
  const thresholdRequired = parseRequiredThreshold(options.threshold, nextKeys.length);
  const newAuthority: RootAuthority = {
    schema: oldAuthority.schema,
    type: "OrgAnchorRootAuthority",
    version: "1.0",
    authority_id: typeof options["new-authority-id"] === "string" ? options["new-authority-id"] : `${oldAuthority.authority_id}-next`,
    created_at: new Date().toISOString(),
    threshold: {
      required: thresholdRequired,
      total: nextKeys.length
    },
    keys: nextKeys
  };
  validateRootAuthority(newAuthority);
  const newAuthorityHash = sha256CanonicalJson(newAuthority);
  if (newAuthorityHash === oldAuthorityHash) {
    throw new Error("No root authority change requested; old and new authority hashes are identical");
  }

  const retainedKeyIds = retainedKeys.map((key) => key.id);
  const addedKeyIds = addedKeys.map((key) => key.id);
  const removedKeyIds = oldAuthority.keys
    .map((key) => key.id)
    .filter((id) => !retainedKeyIds.includes(id));
  const plan: RootAuthorityChangePlan = {
    schema: "https://organchor.org/schemas/root-authority-change-plan.v1.json",
    type: "OrgAnchorRootAuthorityChangePlan",
    version: "1.0",
    plan_id: typeof options.id === "string" ? options.id : `organchor-root-authority-change-${new Date().getUTCFullYear()}-001`,
    created_at: new Date().toISOString(),
    reason: typeof options.reason === "string" ? options.reason : "Root authority change plan.",
    old_root_authority_path: oldAuthorityPath,
    new_root_authority_path: out,
    old_root_authority_hash: oldAuthorityHash,
    new_root_authority_hash: newAuthorityHash,
    old_authority_id: oldAuthority.authority_id,
    new_authority_id: newAuthority.authority_id,
    old_threshold: oldAuthority.threshold,
    new_threshold: newAuthority.threshold,
    changes: {
      retained_key_ids: retainedKeyIds,
      added_key_ids: addedKeyIds,
      removed_key_ids: removedKeyIds,
      authority_id_changed: oldAuthority.authority_id !== newAuthority.authority_id,
      threshold_changed: oldAuthority.threshold.required !== newAuthority.threshold.required ||
        oldAuthority.threshold.total !== newAuthority.threshold.total
    },
    next_step: "Review this plan, then create and sign a root authority migration statement from the old authority to the new authority."
  };

  await writeJsonFile(out, newAuthority);
  await writeJsonFile(planOut, plan);
  console.log(`Created next root authority: ${out}`);
  console.log(`Created root authority change plan: ${planOut}`);
  console.log(`Retained keys: ${formatList(retainedKeyIds)}`);
  console.log(`Added keys: ${formatList(addedKeyIds)}`);
  console.log(`Removed keys: ${formatList(removedKeyIds)}`);
  console.log(`Old threshold: ${oldAuthority.threshold.required}-of-${oldAuthority.threshold.total}`);
  console.log(`New threshold: ${newAuthority.threshold.required}-of-${newAuthority.threshold.total}`);
  console.log(`Old authority hash: ${oldAuthorityHash}`);
  console.log(`New authority hash: ${newAuthorityHash}`);
}

function selectRetainedKeys(oldAuthority: RootAuthority, options: Record<string, string | boolean>): RootAuthorityKey[] {
  const removeIds = parseCsv(options.remove);
  const oldIds = oldAuthority.keys.map((key) => key.id);
  for (const id of removeIds) {
    if (!oldIds.includes(id)) throw new Error(`Cannot remove missing root key: ${id}`);
  }
  if (options["replace-all"] === true) {
    return [];
  }
  if (typeof options.keep === "string") {
    const keepIds = parseCsv(options.keep);
    for (const id of keepIds) {
      if (!oldIds.includes(id)) throw new Error(`Cannot keep missing root key: ${id}`);
      if (removeIds.includes(id)) throw new Error(`Root key cannot be both kept and removed: ${id}`);
    }
    return oldAuthority.keys.filter((key) => keepIds.includes(key.id));
  }
  return oldAuthority.keys.filter((key) => !removeIds.includes(key.id));
}

async function readAddedKeys(options: Record<string, string | boolean>): Promise<RootAuthorityKey[]> {
  const paths = parseCsv(options["add-keys"] ?? options["add-key"]);
  const keys: RootAuthorityKey[] = [];
  for (const path of paths) {
    keys.push(await readRootAuthorityKey(path));
  }
  return keys;
}

function assertUniqueKeyIds(keys: RootAuthorityKey[]): void {
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key.id)) throw new Error(`Duplicate root authority key id: ${key.id}`);
    seen.add(key.id);
  }
}

function parseRequiredThreshold(value: string | boolean | undefined, total: number): number {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error("--threshold is required for authority change-plan");
  }
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error("--threshold must be a positive integer");
  }
  const parsed = Number(value);
  if (parsed > total) throw new Error("--threshold cannot be greater than the number of keys");
  return parsed;
}

function parseCsv(value: string | boolean | undefined): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join(", ") : "(none)";
}
