import { readEnsRecordsSnapshot } from "../auxiliary-names/ens.ts";

export async function ensInspectCommand(options: Record<string, string | boolean>): Promise<void> {
  const ensName = typeof options.name === "string" ? options.name : typeof options._ === "string" ? options._ : undefined;
  if (!ensName) {
    throw new Error("ens inspect requires an ENS name.");
  }
  const recordsPath = typeof options.records === "string" ? options.records : undefined;
  if (!recordsPath) {
    console.log("MANUAL_CHECK_REQUIRED");
    console.log(`ENS: ${ensName}`);
    console.log("Live ENS resolver reads require an Ethereum RPC adapter, which is not configured in this build.");
    console.log("Use --records <records.json> to inspect a captured records snapshot.");
    return;
  }

  const records = await readEnsRecordsSnapshot(recordsPath);
  console.log("ENS records snapshot");
  console.log(`ENS: ${ensName}`);
  console.log(JSON.stringify(records, null, 2));
}
