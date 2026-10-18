import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { validateRootAuthority, validateRootAuthorityMigration, validateSignatureFile } from "../core/validate.ts";
import { verifyMigrationSignatures } from "../core/migration.ts";

export async function migrateVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  for (const flag of ["expected-old-authority-hash", "expected-new-authority-hash", "previous-migration"]) {
    if (options[flag] !== undefined) requireOption(options[flag], `--${flag} requires a value`);
  }
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
  let predecessorStatus = "NOT_APPLICABLE";

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
  if (migration.version === "2.0") {
    predecessorStatus = migration.previous_migration_hash === null ? "NO_PREDECESSOR_DECLARED" : "NOT_CHECKED";
    if (typeof options["previous-migration"] === "string") {
      const previous = validateRootAuthorityMigration(await readJsonFile(options["previous-migration"]));
      if (sha256CanonicalJson(previous) !== migration.previous_migration_hash) errors.push("Predecessor hash does not match --previous-migration");
      if (previous.new_root_authority_hash !== oldAuthorityHash) errors.push("Predecessor does not end at the old authority");
      if (Number(previous.sequence ?? 0) + 1 !== migration.sequence) errors.push("Migration sequence does not follow its predecessor");
      if (Date.parse(previous.effective_at) > Date.parse(migration.effective_at)) errors.push("Migration effective_at precedes its predecessor");
      predecessorStatus = "LINK_CHECKED_PREDECESSOR_SIGNATURES_NOT_CHECKED";
    } else if (migration.previous_migration_hash === null && migration.sequence !== 1) {
      errors.push("A migration without a predecessor must start at sequence 1");
    }
  }

  const acceptance = typeof options["acceptance-sig"] === "string" ? validateSignatureFile(await readJsonFile(options["acceptance-sig"])) : undefined;
  const verification = verifyMigrationSignatures(migration, signature, acceptance);
  const result = verification.oldResult;
  errors.push(...verification.errors);

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
  if (migration.version === "2.0") {
    console.log(`Valid new-authority authorizers: ${verification.newResult?.valid_authorizers.join(", ") ?? "none"}`);
    console.log(`Predecessor link: ${predecessorStatus}`);
    console.log("Verification scope: this migration's authorization and acceptance; use full package verification to check the complete declared chain.");
    console.log("External publication time: NOT_CHECKED; signature validity alone does not establish pre-compromise migration.");
  }
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
