import { validateEvidenceManifest } from "../core/evidence-validate.ts";
import { signManifestFile } from "../core/manifest-signing.ts";

export async function evidenceSignCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.in === "string" ? options.in : "evidence/evidence-manifest.json";
  const out = typeof options.out === "string" ? options.out : `${input}.sig`;
  const keyPath = requireOption(options.key, "--key is required");
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const hash = await signManifestFile({
    keyPath,
    authorityPath,
    inputPath: input,
    outputPath: out,
    validate: validateEvidenceManifest,
    append: options.append === true
  });
  console.log(`Created evidence signature: ${out}`);
  console.log(`Evidence manifest hash: ${hash.hash}`);
  console.log(`Signatures: ${hash.signatures}/${hash.required} required`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
