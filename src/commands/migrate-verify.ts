import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { validateRootAuthority, validateRootAuthorityMigration, validateSignatureFile } from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";

export async function migrateVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = requireOption(options.in, "--in is required");
  const sigPath = requireOption(options.sig, "--sig is required");
  const oldAuthorityPath = requireOption(options["old-authority"] ?? options.authority, "--old-authority is required");
  const newAuthorityPath = requireOption(options["new-authority"], "--new-authority is required");
  const migration = validateRootAuthorityMigration(await readJsonFile(input));
  const signature = validateSignatureFile(await readJsonFile(sigPath));
  const oldAuthority = validateRootAuthority(await readJsonFile(oldAuthorityPath));
  const newAuthority = validateRootAuthority(await readJsonFile(newAuthorityPath));
  const oldAuthorityHash = sha256CanonicalJson(oldAuthority);
  const newAuthorityHash = sha256CanonicalJson(newAuthority);
  const errors: string[] = [];

  if (migration.old_root_authority_hash !== oldAuthorityHash) {
    errors.push("Migration old_root_authority_hash does not match --old-authority");
  }
  if (migration.new_root_authority_hash !== newAuthorityHash) {
    errors.push("Migration new_root_authority_hash does not match --new-authority");
  }
  if (typeof options["expected-old-authority-hash"] === "string" && options["expected-old-authority-hash"] !== oldAuthorityHash) {
    errors.push("Old authority hash does not match --expected-old-authority-hash");
  }
  if (typeof options["expected-new-authority-hash"] === "string" && options["expected-new-authority-hash"] !== newAuthorityHash) {
    errors.push("New authority hash does not match --expected-new-authority-hash");
  }

  const result = verifySignatureFile(migration, signature, oldAuthority);
  errors.push(...result.errors);

  if (errors.length > 0) {
    console.log("FAIL");
    for (const error of errors) console.log(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log("PASS");
  console.log(`Migration hash: ${result.statement_hash}`);
  console.log(`Old authority hash: ${oldAuthorityHash}`);
  console.log(`New authority hash: ${newAuthorityHash}`);
  console.log(`Valid old-authority signatures: ${result.valid_signatures.join(", ")}`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
