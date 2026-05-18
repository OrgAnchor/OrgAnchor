import { readJsonFile } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { validatePrivateKey } from "../core/validate.ts";
import { exportPublicKey } from "../crypto/ed25519.ts";

export async function keyPublicCommand(options: Record<string, string | boolean>): Promise<void> {
  const keyPath = requireOption(options.key, "--key is required");
  const privateKey = validatePrivateKey(await readJsonFile(keyPath));
  const out = typeof options.out === "string" ? options.out : `keys/${privateKey.id}.public.json`;
  const publicKey = exportPublicKey(privateKey);
  await writeJsonFile(out, publicKey);
  console.log(`Created public key: ${out}`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}
