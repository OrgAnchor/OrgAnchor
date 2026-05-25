import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { validateDirectorySnapshot } from "../directory/snapshot.ts";

interface DirectoryExportSummary {
  type: "OrgAnchorDirectoryExportSummary";
  version: "0.1";
  snapshot: string;
  snapshot_id: string;
  snapshot_hash: string;
  format: "ndjson";
  out: string;
  record_count: number;
}

export async function directoryExportCommand(options: Record<string, string | boolean>): Promise<void> {
  const snapshotPath = typeof options.snapshot === "string" ? options.snapshot : typeof options._ === "string" ? options._ : "";
  if (!snapshotPath) throw new Error("directory export requires --snapshot <directory-snapshot.json>");
  const format = typeof options.format === "string" ? options.format : "ndjson";
  if (format !== "ndjson") throw new Error("directory export currently supports --format ndjson only");
  const outPath = typeof options.out === "string" ? options.out : "directory-feed.ndjson";
  const value = await readJsonFile(snapshotPath);
  const snapshot = validateDirectorySnapshot(value);
  const body = `${snapshot.records.map((record) => JSON.stringify(record)).join("\n")}${snapshot.records.length > 0 ? "\n" : ""}`;
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, body, "utf8");
  const summary: DirectoryExportSummary = {
    type: "OrgAnchorDirectoryExportSummary",
    version: "0.1",
    snapshot: snapshotPath,
    snapshot_id: snapshot.snapshot_id,
    snapshot_hash: sha256CanonicalJson(value),
    format: "ndjson",
    out: outPath,
    record_count: snapshot.records.length
  };
  console.log(JSON.stringify(summary, null, 2));
}
