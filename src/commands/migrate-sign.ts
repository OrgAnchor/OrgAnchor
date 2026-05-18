import { signManifestFile } from "../core/manifest-signing.ts";
import { validateRootAuthorityMigration } from "../core/validate.ts";

export async function migrateSignCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.in === "string" ? options.in : "statements/migration-2026-001.json";
  const out = typeof options.out === "string" ? options.out : `${input}.sig`;
  const keyPath = requireOption(options.key, "--key is required");
  const authorityPath = typeof options.authority === "string" ?
    options.authority :
    typeof options["old-authority"] === "string" ?
      options["old-authority"] :
      "root-authority.json";
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
