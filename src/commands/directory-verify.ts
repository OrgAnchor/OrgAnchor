import { readJsonFile } from "../core/json.ts";
import { verifyDirectorySnapshot } from "../directory/snapshot.ts";

export async function directoryVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const snapshotPath = typeof options.snapshot === "string" ? options.snapshot : typeof options._ === "string" ? options._ : undefined;
  if (!snapshotPath) {
    throw new Error("directory verify requires --snapshot <directory-snapshot.json>");
  }

  const report = verifyDirectorySnapshot(await readJsonFile(snapshotPath));
  console.log(report.status);
  console.log(`Snapshot: ${snapshotPath}`);
  console.log(`Snapshot id: ${report.snapshot_id || "(invalid)"}`);
  console.log(`Snapshot hash: ${report.snapshot_hash}`);
  console.log(`Records: ${report.record_count}`);
  for (const check of report.checks) {
    console.log(`${check.status}: ${check.id} - ${check.detail}`);
  }
  if (report.status === "FAIL") process.exitCode = 1;
}
