import { writeJsonFile } from "../core/files.ts";
import { hashFile } from "../core/artifacts.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { validateRootAuthority, validateRootAuthorityMigration } from "../core/validate.ts";
import type { RootAuthorityMigration } from "../types/artifacts.ts";

export async function migrateCreateCommand(options: Record<string, string | boolean>): Promise<void> {
  const oldAuthorityPath = requireOption(options["old-authority"], "--old-authority is required");
  const newAuthorityPath = requireOption(options["new-authority"], "--new-authority is required");
  const out = typeof options.out === "string" ? options.out : `statements/migration-${new Date().getUTCFullYear()}-001.json`;
  const reason = typeof options.reason === "string" ? options.reason : "Root authority migration.";
  const now = new Date();
  const oldAuthority = validateRootAuthority(await readJsonFile(oldAuthorityPath));
  const newAuthority = validateRootAuthority(await readJsonFile(newAuthorityPath));
  const supersedes = await readSupersededStatementHashes(options);
  const migration: RootAuthorityMigration = {
    schema: "https://organchor.org/schemas/root-authority-migration.v1.json",
    type: "OrgAnchorRootAuthorityMigration",
    version: "1.0",
    migration_id: typeof options.id === "string" ? options.id : `organchor-migration-${now.getUTCFullYear()}-001`,
    issued_at: now.toISOString(),
    effective_at: typeof options["effective-at"] === "string" ? options["effective-at"] : now.toISOString(),
    reason,
    old_root_authority: oldAuthority,
    old_root_authority_hash: sha256CanonicalJson(oldAuthority),
    new_root_authority: newAuthority,
    new_root_authority_hash: sha256CanonicalJson(newAuthority),
    supersedes_statement_hashes: supersedes,
    notes: "This migration is valid only if signed by the old root authority threshold. Future statements should use the new root authority after the effective time."
  };
  validateRootAuthorityMigration(migration);
  await writeJsonFile(out, migration);
  console.log(`Created migration statement: ${out}`);
  console.log(`Migration hash: ${sha256CanonicalJson(migration)}`);
  console.log(`Old authority hash: ${migration.old_root_authority_hash}`);
  console.log(`New authority hash: ${migration.new_root_authority_hash}`);
}

async function readSupersededStatementHashes(options: Record<string, string | boolean>): Promise<string[]> {
  const hashes: string[] = [];
  if (typeof options["supersedes-hash"] === "string") {
    hashes.push(...options["supersedes-hash"].split(",").map((part) => part.trim()).filter(Boolean));
  }
  if (typeof options.statement === "string") {
    const artifact = await hashFile(options.statement);
    hashes.push(artifact.hash);
  }
  return [...new Set(hashes)];
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
