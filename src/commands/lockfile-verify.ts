import { verifyManifestFile } from "../core/manifest-signing.ts";
import { validateLockfile } from "../core/lockfile.ts";

export async function lockfileVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.in === "string" ? options.in : "organchor.lock.json";
  const sig = typeof options.sig === "string" ? options.sig : `${input}.sig`;
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const expectedAuthorityHash =
    typeof options["expected-authority-hash"] === "string" ? options["expected-authority-hash"] : undefined;
  const result = await verifyManifestFile({
    authorityPath,
    inputPath: input,
    signaturePath: sig,
    expectedAuthorityHash,
    validate: validateLockfile
  });
  if (!result.ok) {
    console.log("FAIL");
    for (const error of result.errors) console.log(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log("PASS");
  console.log(`Lockfile hash: ${result.hash}`);
  console.log(`Authority hash: ${result.authorityHash}`);
  console.log(`Valid signatures: ${result.validSignatures.join(", ")}`);
}
