import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { validateLockfile } from "../core/lockfile.ts";

export async function lockfileHashCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = typeof options.in === "string" ? options.in : "organchor.lock.json";
  const lockfile = validateLockfile(await readJsonFile(input));
  console.log(`Lockfile hash: ${sha256CanonicalJson(lockfile)}`);
}
