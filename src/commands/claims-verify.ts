import { verifyManifestFile } from "../core/manifest-signing.ts";
import { validateClaimsManifest, validateEvidenceManifest } from "../core/evidence-validate.ts";
import { readJsonFile } from "../core/json.ts";
import { asObject } from "../core/validate.ts";

export async function claimsVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.in === "string" ? options.in : "claims/product-claims.json";
  const sig = typeof options.sig === "string" ? options.sig : `${input}.sig`;
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const expectedAuthorityHash =
    typeof options["expected-authority-hash"] === "string" ? options["expected-authority-hash"] : undefined;
  const result = await verifyManifestFile({
    authorityPath,
    inputPath: input,
    signaturePath: sig,
    expectedAuthorityHash,
    validate: validateClaimsManifest
  });
  if (result.ok && typeof options.evidence === "string") {
    const refErrors = await verifyEvidenceReferences(input, options.evidence);
    result.errors.push(...refErrors);
    result.ok = result.errors.length === 0;
  }
  printResult("Claims", result);
}

async function verifyEvidenceReferences(claimsPath: string, evidencePath: string): Promise<string[]> {
  const claimsManifest = asObject(validateClaimsManifest(await readJsonFile(claimsPath)), "claims manifest");
  const evidenceManifest = asObject(validateEvidenceManifest(await readJsonFile(evidencePath)), "evidence manifest");
  const evidenceItems = Array.isArray(evidenceManifest.evidence) ? evidenceManifest.evidence : [];
  const evidenceIds = new Set(evidenceItems.map((item) => String(asObject(item, "evidence item").id)));
  const errors: string[] = [];
  const claims = Array.isArray(claimsManifest.claims) ? claimsManifest.claims : [];
  for (const claim of claims) {
    const claimObject = asObject(claim, "claim");
    const claimId = String(claimObject.id);
    const refs = Array.isArray(claimObject.evidence_refs) ? claimObject.evidence_refs : [];
    for (const ref of refs) {
      if (!evidenceIds.has(String(ref))) {
        errors.push(`Claim "${claimId}" references missing evidence "${String(ref)}"`);
      }
    }
  }
  return errors;
}

function printResult(
  label: string,
  result: { ok: boolean; errors: string[]; hash: string; authorityHash: string; validSignatures: string[] }
): void {
  if (!result.ok) {
    console.log("FAIL");
    for (const error of result.errors) console.log(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log("PASS");
  console.log(`${label} hash: ${result.hash}`);
  console.log(`Authority hash: ${result.authorityHash}`);
  console.log(`Valid signatures: ${result.validSignatures.join(", ")}`);
}
