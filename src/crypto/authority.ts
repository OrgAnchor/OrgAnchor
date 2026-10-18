import { validateRootAuthority } from "../core/validate.ts";
import type { RootAuthority, RootAuthorityKey } from "../types/artifacts.ts";

export function buildRootAuthority(keys: RootAuthorityKey[], required: number, id: string, policy?: string): RootAuthority {
  const resolvedPolicy = policy ?? (keys.some((key) => key.algorithm === "ml-dsa-65") ?
    keys.every((key) => key.algorithm === "ml-dsa-65") ? "ml-dsa-65" : "hybrid-ed25519-ml-dsa-65" : undefined);
  const v2 = resolvedPolicy !== undefined;
  const total = v2 ? new Set(keys.map((key) => key.holder_id)).size : keys.length;
  const authority: RootAuthority = {
    schema: `https://organchor.org/schemas/root-authority.v${v2 ? "2" : "1"}.json`,
    type: "OrgAnchorRootAuthority", version: v2 ? "2.0" : "1.0", authority_id: id,
    created_at: new Date().toISOString(), threshold: { required, total }, keys,
    ...(v2 ? { signing_policy: resolvedPolicy } : {})
  };
  return validateRootAuthority(authority);
}

export function applyHolderIds(keys: RootAuthorityKey[], value: string | boolean | undefined): RootAuthorityKey[] {
  if (value === undefined) return keys;
  if (typeof value !== "string") throw new Error("--holder-ids requires comma-separated holder IDs, one per key");
  const holders = value.split(",").map((part) => part.trim());
  if (holders.length !== keys.length || holders.some((holder) => !holder)) throw new Error("--holder-ids must provide one non-empty holder ID per key");
  return keys.map((key, index) => ({ ...key, holder_id: holders[index]! }));
}
