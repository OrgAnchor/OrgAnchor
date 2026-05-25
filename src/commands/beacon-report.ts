import { readFile } from "node:fs/promises";
import { writeJsonFile } from "../core/files.ts";
import type { JsonValue } from "../core/json.ts";
import type { BeaconConformanceStatus, BeaconInspectStatus } from "./beacon-inspect.ts";
import type { BeaconSweepRecord } from "./beacon-sweep.ts";

interface BeaconDiscoveryReport {
  type: "OrgAnchorBeaconDiscoveryReport";
  version: "0.1";
  generated_at: string;
  inputs: {
    sweeps: string[];
    stale_days: number;
  };
  trust_boundary: {
    report_is_trust_root: false;
    final_trust_decision: "EXTERNAL_AGENT";
    records_must_verify_at_origin: true;
  };
  counts: {
    sweep_files: number;
    total_records: number;
    unique_origins: number;
    claimed_signals: number;
    identity_pass: number;
    value_pass: number;
    full_compatible: number;
    stale_records: number;
  };
  rates: {
    beacon_find_rate: number | null;
    origin_verification_success_rate: number | null;
    full_compatible_rate: number | null;
    stale_beacon_rate: number | null;
    third_party_sweep_reproducibility: number | null;
  };
  counts_by_status: Record<BeaconInspectStatus, number>;
  counts_by_conformance: Record<BeaconConformanceStatus, number>;
  reproducibility: {
    available: boolean;
    pair_count: number;
    average_jaccard: number | null;
    pairs: Array<{
      a: string;
      b: string;
      a_origins: number;
      b_origins: number;
      shared_origins: number;
      jaccard: number;
    }>;
  };
  stale: {
    threshold_days: number;
    origins: string[];
  };
  limitations: string[];
  recommended_actions: string[];
}

const STATUSES = new Set(["PASS", "WARN", "FAIL"]);
const CONFORMANCE_STATUSES = new Set([
  "CLAIMED_SIGNAL",
  "BEACON_SHAPE_PASS",
  "IDENTITY_VERIFY_PASS",
  "VALUE_VERIFY_PASS",
  "FULL_COMPATIBLE",
  "PARTIAL",
  "FAILED"
]);

export async function beaconReportCommand(options: Record<string, string | boolean>): Promise<void> {
  const sweepPaths = parseSources(options.sweeps ?? options.in ?? options._);
  if (sweepPaths.length === 0) throw new Error("beacon report requires --sweeps <a.ndjson[,b.ndjson]>");
  const staleDays = parsePositiveInteger(options["stale-days"], "--stale-days", 30);
  const generatedAt = typeof options["generated-at"] === "string" ? options["generated-at"] : new Date().toISOString();
  const sweepFiles = await Promise.all(sweepPaths.map(readSweepFile));
  const report = buildReport({
    generatedAt,
    staleDays,
    sweepFiles
  });
  if (typeof options.out === "string") {
    await writeJsonFile(options.out, report as unknown as JsonValue);
  }
  console.log(JSON.stringify(report, null, 2));
}

async function readSweepFile(path: string): Promise<{ path: string; records: BeaconSweepRecord[] }> {
  const text = await readFile(path, "utf8");
  if (!text.trim()) return { path, records: [] };
  const records = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => asSweepRecord(JSON.parse(line), `${path}:${index + 1}`));
  return { path, records };
}

function buildReport(options: {
  generatedAt: string;
  staleDays: number;
  sweepFiles: Array<{ path: string; records: BeaconSweepRecord[] }>;
}): BeaconDiscoveryReport {
  const records = options.sweepFiles.flatMap((file) => file.records);
  const uniqueOrigins = Array.from(new Set(records.map(originFromSweepRecord).filter(Boolean)));
  const claimedSignals = records.filter((record) => record.signal.claimed).length;
  const identityPass = records.filter((record) => record.verification.identity_status === "PASS").length;
  const valuePass = records.filter((record) => record.verification.value_status === "PASS").length;
  const fullCompatible = records.filter((record) => record.conformance_status === "FULL_COMPATIBLE").length;
  const staleOrigins = staleOriginList(records, options.generatedAt, options.staleDays);
  const reproducibility = reproducibilityReport(options.sweepFiles);
  return {
    type: "OrgAnchorBeaconDiscoveryReport",
    version: "0.1",
    generated_at: options.generatedAt,
    inputs: {
      sweeps: options.sweepFiles.map((file) => file.path),
      stale_days: options.staleDays
    },
    trust_boundary: {
      report_is_trust_root: false,
      final_trust_decision: "EXTERNAL_AGENT",
      records_must_verify_at_origin: true
    },
    counts: {
      sweep_files: options.sweepFiles.length,
      total_records: records.length,
      unique_origins: uniqueOrigins.length,
      claimed_signals: claimedSignals,
      identity_pass: identityPass,
      value_pass: valuePass,
      full_compatible: fullCompatible,
      stale_records: staleOrigins.length
    },
    rates: {
      beacon_find_rate: ratio(claimedSignals, records.length),
      origin_verification_success_rate: ratio(identityPass, records.length),
      full_compatible_rate: ratio(fullCompatible, records.length),
      stale_beacon_rate: ratio(staleOrigins.length, uniqueOrigins.length),
      third_party_sweep_reproducibility: reproducibility.average_jaccard
    },
    counts_by_status: countStatuses(records),
    counts_by_conformance: countConformance(records),
    reproducibility,
    stale: {
      threshold_days: options.staleDays,
      origins: staleOrigins
    },
    limitations: [
      "This report summarizes local sweep artifacts only.",
      "It is not a certification, recommendation, ranking, or trust decision.",
      "Selected origins still require direct origin verification before outreach, listing, procurement, or transaction decisions.",
      "HTTP request counts and global web coverage are not measured by local sweep records."
    ],
    recommended_actions: recommendedActions(records, staleOrigins, reproducibility.average_jaccard)
  };
}

function reproducibilityReport(sweepFiles: Array<{ path: string; records: BeaconSweepRecord[] }>): BeaconDiscoveryReport["reproducibility"] {
  const pairs: BeaconDiscoveryReport["reproducibility"]["pairs"] = [];
  for (let aIndex = 0; aIndex < sweepFiles.length; aIndex++) {
    for (let bIndex = aIndex + 1; bIndex < sweepFiles.length; bIndex++) {
      const a = sweepFiles[aIndex];
      const b = sweepFiles[bIndex];
      if (!a || !b) continue;
      const aOrigins = new Set(a.records.map(originFromSweepRecord).filter(Boolean));
      const bOrigins = new Set(b.records.map(originFromSweepRecord).filter(Boolean));
      const shared = Array.from(aOrigins).filter((origin) => bOrigins.has(origin)).length;
      const union = new Set([...aOrigins, ...bOrigins]).size;
      pairs.push({
        a: a.path,
        b: b.path,
        a_origins: aOrigins.size,
        b_origins: bOrigins.size,
        shared_origins: shared,
        jaccard: union === 0 ? 1 : round(shared / union)
      });
    }
  }
  return {
    available: pairs.length > 0,
    pair_count: pairs.length,
    average_jaccard: pairs.length === 0 ? null : round(pairs.reduce((sum, pair) => sum + pair.jaccard, 0) / pairs.length),
    pairs
  };
}

function staleOriginList(records: BeaconSweepRecord[], generatedAt: string, staleDays: number): string[] {
  const generatedAtMs = Date.parse(generatedAt);
  if (!Number.isFinite(generatedAtMs)) throw new Error("--generated-at must be an ISO timestamp");
  const latestByOrigin = new Map<string, string>();
  for (const record of records) {
    const origin = originFromSweepRecord(record);
    if (!origin) continue;
    const previous = latestByOrigin.get(origin);
    if (!previous || record.checked_at > previous) latestByOrigin.set(origin, record.checked_at);
  }
  const thresholdMs = staleDays * 24 * 60 * 60 * 1000;
  return Array.from(latestByOrigin.entries())
    .filter(([, checkedAt]) => generatedAtMs - Date.parse(checkedAt) > thresholdMs)
    .map(([origin]) => origin)
    .sort();
}

function recommendedActions(
  records: BeaconSweepRecord[],
  staleOrigins: string[],
  reproducibility: number | null
): string[] {
  const actions: string[] = [];
  if (records.length === 0) {
    return [
      "Collect seed origins, Directory snapshots, sitemaps, or bounded crawl starts before drawing discovery conclusions.",
      "Do not treat an empty local report as evidence that no OrgAnchor adopters exist."
    ];
  }
  if (records.some((record) => record.conformance_status === "FAILED" || record.status === "FAIL")) {
    actions.push("Review failed origins and separate unreachable sites from impostor or malformed OrgAnchor signals.");
  }
  if (records.some((record) => record.conformance_status === "CLAIMED_SIGNAL" || record.conformance_status === "BEACON_SHAPE_PASS")) {
    actions.push("Run strict direct verification before indexing signal-only origins as compatible adopters.");
  }
  if (staleOrigins.length > 0) {
    actions.push("Refresh stale origins before using this report for current discovery or outreach.");
  }
  if (reproducibility === null) {
    actions.push("Compare two or more independent sweeps to measure third-party sweep reproducibility.");
  } else if (reproducibility < 0.5) {
    actions.push("Investigate low sweep overlap; seed coverage, crawler limits, and robots rules may be producing divergent discovery results.");
  }
  actions.push("Use returned candidates as discovery leads only; run origin verification and external policy review before decisions.");
  return actions;
}

function asSweepRecord(value: JsonValue, label: string): BeaconSweepRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label}: record must be an object`);
  const record = value as unknown as BeaconSweepRecord;
  if (record.type !== "OrgAnchorBeaconSweepRecord") throw new Error(`${label}: type must be OrgAnchorBeaconSweepRecord`);
  if (record.version !== "0.1") throw new Error(`${label}: version must be 0.1`);
  if (typeof record.target !== "string" || record.target.length === 0) throw new Error(`${label}: target must be a non-empty string`);
  if (typeof record.checked_at !== "string" || Number.isNaN(Date.parse(record.checked_at))) throw new Error(`${label}: checked_at must be an ISO timestamp`);
  if (!STATUSES.has(record.status)) throw new Error(`${label}: status is unsupported`);
  if (!CONFORMANCE_STATUSES.has(record.conformance_status)) throw new Error(`${label}: conformance_status is unsupported`);
  if (!record.signal || typeof record.signal !== "object") throw new Error(`${label}: signal must be an object`);
  if (!record.verification || typeof record.verification !== "object") throw new Error(`${label}: verification must be an object`);
  if (!Array.isArray(record.risk_gaps)) throw new Error(`${label}: risk_gaps must be an array`);
  if (!Array.isArray(record.next_steps)) throw new Error(`${label}: next_steps must be an array`);
  return record;
}

function originFromSweepRecord(record: BeaconSweepRecord): string {
  try {
    return new URL(record.target).origin;
  } catch {
    if (record.signal.url) return new URL(record.signal.url).origin;
    return "";
  }
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return round(numerator / denominator);
}

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function countStatuses(records: BeaconSweepRecord[]): Record<BeaconInspectStatus, number> {
  return {
    PASS: records.filter((record) => record.status === "PASS").length,
    WARN: records.filter((record) => record.status === "WARN").length,
    FAIL: records.filter((record) => record.status === "FAIL").length
  };
}

function countConformance(records: BeaconSweepRecord[]): Record<BeaconConformanceStatus, number> {
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

function parsePositiveInteger(value: string | boolean | undefined, label: string, fallback: number): number {
  if (value === undefined || value === false) return fallback;
  if (typeof value !== "string") throw new Error(`${label} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer`);
  return parsed;
}
