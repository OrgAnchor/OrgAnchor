import { writeJsonFile } from "../core/files.ts";
import type { JsonValue } from "../core/json.ts";
import { validateOnionAddress } from "../onion/validate.ts";

export async function onionInitCommand(options: Record<string, string | boolean>): Promise<void> {
  const out = typeof options.out === "string" ? options.out : "onion/onion-entry.json";
  const onion = typeof options.onion === "string" ? options.onion : null;
  const normalized = onion ? validateOnionAddress(onion) : null;
  if (normalized && !normalized.ok) {
    throw new Error(normalized.reason ?? "Invalid onion address");
  }

  await writeJsonFile(out, {
    type: "OrgAnchorOnionEntry",
    version: "1.0",
    onion_address: normalized?.normalized ?? null,
    usage: "disaster_recovery_verify_endpoint",
    verify_url: normalized ? `http://${normalized.normalized}/verify/` : null,
    statement_binding: "Write this address to official-endpoints.json disaster_recovery.onion, then sign a new statement.",
    note: "OrgAnchor records and validates onion disaster recovery entries. It does not run Tor or guarantee onion service uptime."
  } as unknown as JsonValue);

  console.log("Onion entry initialized.");
  console.log(`Output: ${out}`);
  if (normalized) {
    console.log(`Onion: ${normalized.normalized}`);
  }
}
