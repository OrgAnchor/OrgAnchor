import { readJsonFile } from "../core/json.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { validateRootAuthority } from "../core/validate.ts";

export async function authorityVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const path = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const authority = validateRootAuthority(await readJsonFile(path));
  console.log("Root authority is valid.");
  console.log(`Authority id: ${authority.authority_id}`);
  console.log(`Authority hash: ${sha256CanonicalJson(authority)}`);
}
