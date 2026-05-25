import { writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import { validateDirectorySnapshot, type DirectoryRecord, type DirectorySnapshot } from "../directory/snapshot.ts";

type ConflictSeverity = "INFO" | "WARN" | "FAIL";

interface DirectoryCompareSnapshotSummary {
  path: string;
  snapshot_id: string;
  generated_at: string;
  hash: string;
  record_count: number;
  directory_node: {
    name: string;
    origin: string;
    policy_url: string;
  };
}

interface DirectoryCompareRecordSummary {
  snapshot_id: string;
  record_id: string;
  identity_status: string;
  value_status: string;
  policy_route: string;
  root_authority_hash: string;
  statement_hash: string;
  last_verified_at: string;
}

interface DirectoryCompareOriginMatrixRow {
  origin: string;
  present_in: string[];
  missing_from: string[];
  records: DirectoryCompareRecordSummary[];
  conflict_status: "NONE" | "WARN" | "FAIL";
  conflicts: DirectoryCompareConflict[];
}

interface DirectoryCompareConflict {
  origin: string;
  field: string;
  severity: ConflictSeverity;
  values: Array<{
    snapshot_id: string;
    value: string;
  }>;
  detail: string;
}

interface DirectoryCompareResult {
  type: "OrgAnchorDirectoryCompareResult";
  version: "0.1";
  generated_at: string;
  trust_boundary: {
    directory_comparison_is_not_trust_decision: true;
    directories_are_not_identity_roots: true;
    records_must_verify_at_origin: true;
    final_decision: "EXTERNAL_AGENT";
  };
  snapshots: DirectoryCompareSnapshotSummary[];
  counts: {
    snapshots: number;
    total_unique_origins: number;
    common_origins: number;
    origins_with_conflicts: number;
    fail_conflicts: number;
    warn_conflicts: number;
  };
  origin_matrix: DirectoryCompareOriginMatrixRow[];
  conflicts: DirectoryCompareConflict[];
  recommended_actions: string[];
}

export async function directoryCompareCommand(options: Record<string, string | boolean>): Promise<void> {
  const snapshotPaths = parseSnapshotPaths(options);
  if (snapshotPaths.length < 2) {
    throw new Error("directory compare requires at least two snapshots via --snapshots <a.json,b.json>");
  }
  const loaded = await Promise.all(snapshotPaths.map(readSnapshot));
  const result = compareSnapshots(loaded, new Date().toISOString());
  if (typeof options.out === "string") {
    await writeJsonFile(options.out, result as unknown as JsonValue);
  }
  console.log(JSON.stringify(result, null, 2));
  if (result.counts.fail_conflicts > 0) process.exitCode = 1;
}

async function readSnapshot(path: string): Promise<{
  path: string;
  value: JsonValue;
  snapshot: DirectorySnapshot;
  hash: string;
}> {
  const value = await readJsonFile(path);
  return {
    path,
    value,
    snapshot: validateDirectorySnapshot(value),
    hash: sha256CanonicalJson(value)
  };
}

function compareSnapshots(
  loaded: Array<{ path: string; snapshot: DirectorySnapshot; hash: string }>,
  generatedAt: string
): DirectoryCompareResult {
  const snapshots = loaded.map((item) => snapshotSummary(item.path, item.snapshot, item.hash));
  const recordsByOrigin = collectRecordsByOrigin(loaded);
  const allSnapshotIds = snapshots.map((snapshot) => snapshot.snapshot_id);
  const originMatrix = Array.from(recordsByOrigin.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([origin, records]) => originMatrixRow(origin, records, allSnapshotIds));
  const conflicts = originMatrix.flatMap((row) => row.conflicts);
  const failConflicts = conflicts.filter((conflict) => conflict.severity === "FAIL").length;
  const warnConflicts = conflicts.filter((conflict) => conflict.severity === "WARN").length;

  return {
    type: "OrgAnchorDirectoryCompareResult",
    version: "0.1",
    generated_at: generatedAt,
    trust_boundary: {
      directory_comparison_is_not_trust_decision: true,
      directories_are_not_identity_roots: true,
      records_must_verify_at_origin: true,
      final_decision: "EXTERNAL_AGENT"
    },
    snapshots,
    counts: {
      snapshots: snapshots.length,
      total_unique_origins: originMatrix.length,
      common_origins: originMatrix.filter((row) => row.present_in.length === snapshots.length).length,
      origins_with_conflicts: originMatrix.filter((row) => row.conflict_status !== "NONE").length,
      fail_conflicts: failConflicts,
      warn_conflicts: warnConflicts
    },
    origin_matrix: originMatrix,
    conflicts,
    recommended_actions: recommendedActions(failConflicts, warnConflicts, originMatrix)
  };
}

function snapshotSummary(path: string, snapshot: DirectorySnapshot, hash: string): DirectoryCompareSnapshotSummary {
  return {
    path,
    snapshot_id: snapshot.snapshot_id,
    generated_at: snapshot.generated_at,
    hash,
    record_count: snapshot.records.length,
    directory_node: {
      name: snapshot.directory_node.name,
      origin: snapshot.directory_node.origin,
      policy_url: snapshot.directory_node.policy_url
    }
  };
}

function collectRecordsByOrigin(
  loaded: Array<{ snapshot: DirectorySnapshot }>
): Map<string, Array<{ snapshot: DirectorySnapshot; record: DirectoryRecord }>> {
  const output = new Map<string, Array<{ snapshot: DirectorySnapshot; record: DirectoryRecord }>>();
  for (const item of loaded) {
    for (const record of item.snapshot.records) {
      const records = output.get(record.origin) ?? [];
      records.push({ snapshot: item.snapshot, record });
      output.set(record.origin, records);
    }
  }
  return output;
}

function originMatrixRow(
  origin: string,
  records: Array<{ snapshot: DirectorySnapshot; record: DirectoryRecord }>,
  allSnapshotIds: string[]
): DirectoryCompareOriginMatrixRow {
  const presentIn = records.map((item) => item.snapshot.snapshot_id).sort();
  const conflicts = [
    ...compareRecordField(origin, records, "root_authority_hash", "FAIL"),
    ...compareRecordField(origin, records, "statement_hash", "FAIL"),
    ...compareRecordField(origin, records, "identity_status", "FAIL"),
    ...compareRecordField(origin, records, "value_status", "WARN"),
    ...compareRecordField(origin, records, "policy_route", "WARN")
  ];
  const conflictStatus = conflicts.some((conflict) => conflict.severity === "FAIL")
    ? "FAIL"
    : conflicts.some((conflict) => conflict.severity === "WARN")
      ? "WARN"
      : "NONE";

  return {
    origin,
    present_in: presentIn,
    missing_from: allSnapshotIds.filter((snapshotId) => !presentIn.includes(snapshotId)),
    records: records.map((item) => recordSummary(item.snapshot, item.record)),
    conflict_status: conflictStatus,
    conflicts
  };
}

function recordSummary(snapshot: DirectorySnapshot, record: DirectoryRecord): DirectoryCompareRecordSummary {
  return {
    snapshot_id: snapshot.snapshot_id,
    record_id: record.record_id,
    identity_status: record.verification_summary.identity_status,
    value_status: record.verification_summary.value_status,
    policy_route: record.verification_summary.policy_route,
    root_authority_hash: record.verification_summary.root_authority_hash,
    statement_hash: record.verification_summary.statement_hash,
    last_verified_at: record.verification_summary.last_verified_at
  };
}

function compareRecordField(
  origin: string,
  records: Array<{ snapshot: DirectorySnapshot; record: DirectoryRecord }>,
  field: keyof DirectoryRecord["verification_summary"],
  severity: ConflictSeverity
): DirectoryCompareConflict[] {
  const values = records.map((item) => ({
    snapshot_id: item.snapshot.snapshot_id,
    value: String(item.record.verification_summary[field])
  }));
  const uniqueValues = Array.from(new Set(values.map((item) => item.value)));
  if (uniqueValues.length <= 1) return [];
  return [{
    origin,
    field: String(field),
    severity,
    values,
    detail: `${field} differs across Directory snapshots for ${origin}. Run direct origin verification before using this record.`
  }];
}

function recommendedActions(
  failConflicts: number,
  warnConflicts: number,
  originMatrix: DirectoryCompareOriginMatrixRow[]
): string[] {
  const actions: string[] = [];
  if (failConflicts > 0) {
    actions.push("Treat origins with FAIL conflicts as unresolved until direct origin verification confirms the current signed package.");
  }
  if (warnConflicts > 0) {
    actions.push("Review origins with WARN conflicts; value status and policy route may differ because snapshots were generated at different times or by different policies.");
  }
  const partialOrigins = originMatrix.filter((row) => row.missing_from.length > 0);
  if (partialOrigins.length > 0) {
    actions.push("For origins missing from some snapshots, use direct Beacon inspection before assuming inclusion or exclusion means anything.");
  }
  actions.push("Directory comparison is a consistency check only; every selected candidate still requires direct origin verification.");
  return actions;
}

function parseSnapshotPaths(options: Record<string, string | boolean>): string[] {
  const value = options.snapshots ?? options.snapshot ?? options.in ?? options._;
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}
