import { signManifestFile } from "../core/manifest-signing.ts";
import { validateLockfile } from "../core/lockfile.ts";

export async function lockfileSignCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.in === "string" ? options.in : "organchor.lock.json";
  const out = typeof options.out === "string" ? options.out : `${input}.sig`;
  const keyPath = requireOption(options.key, "--key is required");
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const hash = await signManifestFile({
    keyPath,
    authorityPath,
    inputPath: input,
    outputPath: out,
    validate: validateLockfile,
    append: options.append === true
  });
  console.log(`Created lockfile signature: ${out}`);
  console.log(`Lockfile hash: ${hash.hash}`);
  console.log(`Signatures: ${hash.signatures}/${hash.required} required`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
