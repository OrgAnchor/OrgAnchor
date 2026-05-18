import { verifyManifestFile } from "../core/manifest-signing.ts";
import { validateEvidenceManifest } from "../core/evidence-validate.ts";
import { hashFile } from "../core/artifacts.ts";
import { readJsonFile } from "../core/json.ts";
import { asObject } from "../core/validate.ts";

export async function evidenceVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.in === "string" ? options.in : "evidence/evidence-manifest.json";
  const sig = typeof options.sig === "string" ? options.sig : `${input}.sig`;
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const expectedAuthorityHash =
    typeof options["expected-authority-hash"] === "string" ? options["expected-authority-hash"] : undefined;
  const result = await verifyManifestFile({
    authorityPath,
    inputPath: input,
    signaturePath: sig,
    expectedAuthorityHash,
    validate: validateEvidenceManifest
  });
  if (result.ok && options["check-files"] === true) {
    result.errors.push(...(await verifyLocalEvidenceFiles(input)));
    result.ok = result.errors.length === 0;
  }
  if (!result.ok) {
    console.log("FAIL");
    for (const error of result.errors) console.log(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log("PASS");
  console.log(`Evidence manifest hash: ${result.hash}`);
  console.log(`Authority hash: ${result.authorityHash}`);
  console.log(`Valid signatures: ${result.validSignatures.join(", ")}`);
}

async function verifyLocalEvidenceFiles(input: string): Promise<string[]> {
  const manifest = asObject(validateEvidenceManifest(await readJsonFile(input)), "evidence manifest");
  const evidence = Array.isArray(manifest.evidence) ? manifest.evidence : [];
  const errors: string[] = [];
  for (const item of evidence) {
    const itemObject = asObject(item, "evidence item");
    const expectedHash = String(itemObject.hash);
    const locations = Array.isArray(itemObject.locations) ? itemObject.locations : [];
    for (const location of locations) {
      const locationObject = asObject(location, "evidence location");
      if (locationObject.type !== "local" || typeof locationObject.uri !== "string") continue;
      try {
        const artifact = await hashFile(locationObject.uri);
        if (artifact.hash !== expectedHash) {
          errors.push(`Evidence "${String(itemObject.id)}" local file hash mismatch: ${locationObject.uri}`);
        }
      } catch (error) {
        errors.push(`Evidence "${String(itemObject.id)}" local file cannot be read: ${locationObject.uri}`);
      }
    }
  }
  return errors;
}
