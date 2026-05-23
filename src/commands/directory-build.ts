import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import { asObject, requireIsoTimestamp, requireString } from "../core/validate.ts";
import { buildDirectorySnapshot } from "../directory/snapshot.ts";

export async function directoryBuildCommand(options: Record<string, string | boolean>): Promise<void> {
  const originsPath = typeof options.origins === "string" ? options.origins : typeof options.in === "string" ? options.in : undefined;
  if (!originsPath) {
    throw new Error("directory build requires --origins <directory-origins.json>");
  }

  const outputDir = typeof options.out === "string" ? options.out : "public/directory";
  const input = asObject(await readJsonFile(originsPath), "directory origins");
  const generatedAt = typeof options["generated-at"] === "string" ? options["generated-at"] : new Date().toISOString();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(generatedAt)) {
    throw new Error("--generated-at must be an ISO timestamp with milliseconds, e.g. 2026-05-23T00:00:00.000Z");
  }
  requireIsoTimestamp({ generated_at: generatedAt }, "generated_at", "directory build");

  const nodeOrigin = typeof options["node-origin"] === "string"
    ? options["node-origin"]
    : stringValue(asObject(input.directory_node ?? {}, "directory origins.directory_node").origin);
  if (!nodeOrigin) {
    throw new Error("directory build requires --node-origin <https://directory.example> or directory_node.origin in the origins file");
  }
  const directoryNode = {
    name: typeof options["node-name"] === "string"
      ? options["node-name"]
      : stringValue(asObject(input.directory_node ?? {}, "directory origins.directory_node").name) || "OrgAnchor Directory",
    origin: nodeOrigin,
    policy_url: typeof options["policy-url"] === "string"
      ? options["policy-url"]
      : stringValue(asObject(input.directory_node ?? {}, "directory origins.directory_node").policy_url) || new URL("/directory-policy.json", nodeOrigin).toString()
  };

  const recordsValue = Array.isArray(input.origins) ? input.origins : Array.isArray(input.records) ? input.records : undefined;
  if (!recordsValue) {
    throw new Error("directory origins file must contain an origins or records array");
  }

  const snapshot = buildDirectorySnapshot({
    snapshotId: typeof options["snapshot-id"] === "string"
      ? options["snapshot-id"]
      : stringValue(input.snapshot_id) || `directory-${generatedAt.replace(/[^0-9]/g, "").slice(0, 14)}`,
    generatedAt,
    directoryNode,
    records: recordsValue as JsonValue[]
  });
  const snapshotHash = sha256CanonicalJson(snapshot);

  await ensureDir(outputDir);
  const snapshotPath = join(outputDir, "directory-snapshot.json");
  const hashPath = join(outputDir, "directory-snapshot.json.sha256");
  await writeJsonFile(snapshotPath, snapshot as unknown as JsonValue);
  await writeFile(hashPath, `${snapshotHash}\n`, "utf8");

  console.log("Directory snapshot generated.");
  console.log(`Origins: ${originsPath}`);
  console.log(`Records: ${snapshot.records.length}`);
  console.log(`Snapshot id: ${snapshot.snapshot_id}`);
  console.log(`Snapshot hash: ${snapshotHash}`);
  console.log(`Snapshot JSON: ${snapshotPath}`);
  console.log(`Snapshot hash file: ${hashPath}`);
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}
