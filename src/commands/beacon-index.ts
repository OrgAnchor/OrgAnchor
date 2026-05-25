import { mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import { writeJsonFile } from "../core/files.ts";
import type { JsonValue } from "../core/json.ts";
import type { BeaconConformanceStatus, BeaconInspectStatus } from "./beacon-inspect.ts";
import type { BeaconSweepRecord } from "./beacon-sweep.ts";

export interface BeaconLocalIndex {
  type: "OrgAnchorBeaconLocalIndex";
  version: "0.1";
  generated_at: string;
  sources: {
    previous_index: string | null;
    sweeps: string[];
  };
  counts: {
    total_origins: number;
    by_status: Record<BeaconInspectStatus, number>;
    by_conformance: Record<BeaconConformanceStatus, number>;
  };
  records: BeaconLocalIndexRecord[];
}

export interface BeaconLocalIndexRecord {
  record_key: string;
  origin: string;
  latest_target: string;
  first_seen_at: string;
  last_checked_at: string;
  seen_count: number;
  organization: {
    name: string | null;
    display_name: string | null;
  };
  discovery: {
    categories: string[];
    capabilities: string[];
    regions: string[];
    languages: string[];
  };
  status: BeaconInspectStatus;
  conformance_status: BeaconConformanceStatus;
  signal_kind: string;
  signal_url: string | null;
  identity_status: string | null;
  value_status: string | null;
  policy_route: string | null;
  root_authority_hash: string | null;
  statement_hash: string | null;
  risk_gap_codes: string[];
  next_step: string | null;
}

export async function beaconIndexCommand(options: Record<string, string | boolean>): Promise<void> {
  const sweepPaths = parseSources(options.in ?? options.sweeps ?? options._);
  if (sweepPaths.length === 0) throw new Error("beacon index requires --in <beacon-sweep.ndjson[,more.ndjson]>");
  const previousIndexPath = typeof options.previous === "string" ? options.previous : null;
  const outPath = typeof options.out === "string" ? options.out : "beacon-index.json";
  const previousIndex = previousIndexPath ? await readBeaconLocalIndex(previousIndexPath) : null;
  const sweepRecords = (await Promise.all(sweepPaths.map(readSweepRecords))).flat();
  const index = buildIndex({
    previousIndex,
    previousIndexPath,
    sweepPaths,
    sweepRecords,
    generatedAt: new Date().toISOString()
  });
  await mkdir(dirname(outPath), { recursive: true });
  await writeJsonFile(outPath, index as unknown as JsonValue);
  console.log(JSON.stringify({
    type: "OrgAnchorBeaconIndexSummary",
    version: "0.1",
    out: outPath,
    previous_index: previousIndexPath,
    sweep_files: sweepPaths.length,
    sweep_records: sweepRecords.length,
    total_origins: index.counts.total_origins,
    counts_by_conformance: index.counts.by_conformance
  }, null, 2));
}

function buildIndex(options: {
  previousIndex: BeaconLocalIndex | null;
  previousIndexPath: string | null;
  sweepPaths: string[];
  sweepRecords: BeaconSweepRecord[];
  generatedAt: string;
}): BeaconLocalIndex {
  const records = new Map<string, BeaconLocalIndexRecord>();
  for (const previous of options.previousIndex?.records ?? []) {
    records.set(previous.record_key, previous);
  }
  for (const sweepRecord of options.sweepRecords) {
    const record = localRecordFromSweep(sweepRecord);
    const existing = records.get(record.record_key);
    if (!existing) {
      records.set(record.record_key, record);
      continue;
    }
    records.set(record.record_key, mergeRecord(existing, record));
  }
  const sorted = Array.from(records.values()).sort((a, b) => a.origin.localeCompare(b.origin));
  return {
    type: "OrgAnchorBeaconLocalIndex",
    version: "0.1",
    generated_at: options.generatedAt,
    sources: {
      previous_index: options.previousIndexPath,
      sweeps: options.sweepPaths
    },
    counts: {
      total_origins: sorted.length,
      by_status: countStatuses(sorted),
      by_conformance: countConformance(sorted)
    },
    records: sorted
  };
}

function mergeRecord(existing: BeaconLocalIndexRecord, incoming: BeaconLocalIndexRecord): BeaconLocalIndexRecord {
  const latest = incoming.last_checked_at >= existing.last_checked_at ? incoming : existing;
  const earliest = incoming.first_seen_at <= existing.first_seen_at ? incoming.first_seen_at : existing.first_seen_at;
  return {
    ...latest,
    first_seen_at: earliest,
    seen_count: existing.seen_count + incoming.seen_count
  };
}

function localRecordFromSweep(record: BeaconSweepRecord): BeaconLocalIndexRecord {
  const origin = originFromTarget(record.target) ?? originFromNullableUrl(record.signal.url) ?? record.target;
  return {
    record_key: origin,
    origin,
    latest_target: record.target,
    first_seen_at: record.checked_at,
    last_checked_at: record.checked_at,
    seen_count: 1,
    status: record.status,
    conformance_status: record.conformance_status,
    organization: record.hints?.organization ?? {
      name: null,
      display_name: null
    },
    discovery: record.hints?.discovery ?? {
      categories: [],
      capabilities: [],
      regions: [],
      languages: []
    },
    signal_kind: record.signal.kind,
    signal_url: record.signal.url,
    identity_status: record.verification.identity_status,
    value_status: record.verification.value_status,
    policy_route: record.verification.policy_route,
    root_authority_hash: record.verification.root_authority_hash,
    statement_hash: record.verification.statement_hash,
    risk_gap_codes: record.risk_gaps.map((risk) => risk.code),
    next_step: record.next_steps[0] ?? null
  };
}

async function readSweepRecords(path: string): Promise<BeaconSweepRecord[]> {
  const text = await readFile(path, "utf8");
  if (!text.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => asSweepRecord(JSON.parse(line), `${path}:${index + 1}`));
}

export async function readBeaconLocalIndex(path: string): Promise<BeaconLocalIndex> {
  const value = JSON.parse(await readFile(path, "utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid Beacon index: ${path}`);
  const index = value as BeaconLocalIndex;
  if (index.type !== "OrgAnchorBeaconLocalIndex" || index.version !== "0.1") {
    throw new Error(`Unsupported Beacon index: ${path}`);
  }
  if (!Array.isArray(index.records)) throw new Error(`Invalid Beacon index records: ${path}`);
  return index;
}

function asSweepRecord(value: unknown, label: string): BeaconSweepRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`Invalid sweep record at ${label}`);
  const record = value as BeaconSweepRecord;
  if (record.type !== "OrgAnchorBeaconSweepRecord" || record.version !== "0.1") {
    throw new Error(`Unsupported sweep record at ${label}`);
  }
  if (typeof record.target !== "string" || typeof record.checked_at !== "string") {
    throw new Error(`Invalid sweep record target or checked_at at ${label}`);
  }
  return record;
}

function countStatuses(records: BeaconLocalIndexRecord[]): Record<BeaconInspectStatus, number> {
  return {
    PASS: records.filter((record) => record.status === "PASS").length,
    WARN: records.filter((record) => record.status === "WARN").length,
    FAIL: records.filter((record) => record.status === "FAIL").length
  };
}

function countConformance(records: BeaconLocalIndexRecord[]): Record<BeaconConformanceStatus, number> {
  return {
    CLAIMED_SIGNAL: records.filter((record) => record.conformance_status === "CLAIMED_SIGNAL").length,
    BEACON_SHAPE_PASS: records.filter((record) => record.conformance_status === "BEACON_SHAPE_PASS").length,
    IDENTITY_VERIFY_PASS: records.filter((record) => record.conformance_status === "IDENTITY_VERIFY_PASS").length,
    VALUE_VERIFY_PASS: records.filter((record) => record.conformance_status === "VALUE_VERIFY_PASS").length,
    FULL_COMPATIBLE: records.filter((record) => record.conformance_status === "FULL_COMPATIBLE").length,
    PARTIAL: records.filter((record) => record.conformance_status === "PARTIAL").length,
    FAILED: records.filter((record) => record.conformance_status === "FAILED").length
  };
}

function parseSources(value: string | boolean | undefined): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function originFromTarget(value: string): string | null {
  try {
    const url = new URL(/^https?:\/\//.test(value) ? value : `https://${value}`);
    return url.origin;
  } catch {
    return null;
  }
}

function originFromNullableUrl(value: string | null): string | null {
  if (!value) return null;
  return originFromTarget(value);
}
