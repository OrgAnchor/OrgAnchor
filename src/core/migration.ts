import type { RootAuthorityMigration, SignatureFile } from "../types/artifacts.ts";
import { verifySignatureFile } from "../crypto/signature.ts";
import { assertNoCryptoDowngrade } from "./crypto-policy.ts";

export function verifyMigrationSignatures(migration: RootAuthorityMigration, authorization: SignatureFile, acceptance?: SignatureFile) {
  const oldResult = verifySignatureFile(migration, authorization, migration.old_root_authority);
  const errors = [...oldResult.errors];
  assertNoCryptoDowngrade(migration.old_root_authority, migration.new_root_authority);
  const newResult = acceptance ? verifySignatureFile(migration, acceptance, migration.new_root_authority) : undefined;
  if (migration.version === "2.0") {
    if (!newResult) errors.push("V2 migration requires new-authority acceptance signatures");
    else errors.push(...newResult.errors.map((error) => `New authority acceptance: ${error}`));
  }
  return { ok: errors.length === 0, errors, oldResult, newResult };
}
