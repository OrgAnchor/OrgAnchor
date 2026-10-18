import { signManifestFile } from "../core/manifest-signing.ts";
import { validateRootAuthorityMigration } from "../core/validate.ts";
import { readJsonFile } from "../core/json.ts";
import { validateRootAuthority } from "../core/validate.ts";
import { sha256CanonicalJson } from "../core/hash.ts";

export async function migrateSignCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.in === "string" ? options.in : "statements/migration-2026-001.json";
  const role = typeof options.role === "string" ? options.role : "old";
  if (role !== "old" && role !== "new") throw new Error("--role must be old or new");
  const out = typeof options.out === "string" ? options.out : role === "new" ? `${input}.acceptance.sig` : `${input}.sig`;
  const keyPath = requireOption(options.key, "--key is required");
  const authorityPath = typeof options.authority === "string" ?
    options.authority :
    role === "new" && typeof options["new-authority"] === "string" ? options["new-authority"] :
    typeof options["old-authority"] === "string" ?
      options["old-authority"] :
      "root-authority.json";
  const migration = validateRootAuthorityMigration(await readJsonFile(input));
  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  if (sha256CanonicalJson(authority) !== (role === "new" ? migration.new_root_authority_hash : migration.old_root_authority_hash)) {
    throw new Error(`The signing authority does not match the migration's ${role} authority`);
  }
  const result = await signManifestFile({
    keyPath,
    authorityPath,
    inputPath: input,
    outputPath: out,
    validate: validateRootAuthorityMigration,
    append: options.append === true
  });
  console.log(`Created migration signature: ${out}`);
  console.log(`Migration hash: ${result.hash}`);
  console.log(`Signatures: ${result.signatures}/${result.required} required`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
