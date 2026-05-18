import { writeNewJsonFile } from "../core/files.ts";
import { restrictPrivateFilePermissions } from "../core/permissions.ts";
import { generateEd25519PrivateKey } from "../crypto/ed25519.ts";

export async function keyGenerateCommand(options: Record<string, string | boolean>): Promise<void> {
  const id = getString(options.id, "root-2026");
  const out = getString(options.out, `keys/${id}.private.json`);
  const privateKey = generateEd25519PrivateKey(id);
  await writeNewJsonFile(out, privateKey, 0o600);
  await restrictPrivateFilePermissions(out);
  console.log(`Created private key: ${out}`);
  console.log("Keep this file offline or tightly protected. It is ignored by Git by default.");
}

function getString(value: string | boolean | undefined, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}
