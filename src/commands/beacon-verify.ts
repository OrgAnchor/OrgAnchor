import { readFile } from "node:fs/promises";
import type { JsonValue } from "../core/json.ts";
import type { BeaconConformanceStatus, BeaconInspectStatus } from "./beacon-inspect.ts";
import type { BeaconSweepRecord } from "./beacon-sweep.ts";

interface BeaconSweepVerificationReport {
  type: "OrgAnchorBeaconSweepVerificationReport";
  version: "0.1";
  status: "PASS" | "FAIL";
  input: string;
  record_count: number;
  counts_by_status: Record<BeaconInspectStatus, number>;
  counts_by_conformance: Record<BeaconConformanceStatus, number>;
  checks: Array<{
    id: string;
    status: "PASS" | "FAIL";
    detail: string;
  }>;
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

export async function beaconVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const inputPath = typeof options.in === "string" ? options.in : typeof options._ === "string" ? options._ : "";
  if (!inputPath) throw new Error("beacon verify requires --in <beacon-sweep.ndjson>");
  const report = await verifyBeaconSweepFile(inputPath);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "FAIL") process.exitCode = 1;
}

async function verifyBeaconSweepFile(path: string): Promise<BeaconSweepVerificationReport> {
  const checks: BeaconSweepVerificationReport["checks"] = [];
  const records: BeaconSweepRecord[] = [];
  const text = await readFile(path, "utf8");
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = 0; index < lines.length; index++) {
    const label = `${path}:${index + 1}`;
    try {
      records.push(asSweepRecord(JSON.parse(lines[index] ?? ""), label));
    } catch (error) {
      checks.push({
        id: "record_shape",
        status: "FAIL",
        detail: `${label}: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
  if (checks.length === 0) {
    checks.push({
      id: "record_shape",
      status: "PASS",
      detail: `${records.length} Beacon sweep record(s) are valid.`
    });
  }
  checks.push({
    id: "trust_boundary",
    status: "PASS",
    detail: "A sweep file is a cache of observations, not a trust root; selected origins still require direct verification."
  });
  return {
    type: "OrgAnchorBeaconSweepVerificationReport",
    version: "0.1",
    status: checks.some((check) => check.status === "FAIL") ? "FAIL" : "PASS",
    input: path,
    record_count: records.length,
    counts_by_status: countStatuses(records),
    counts_by_conformance: countConformance(records),
    checks
  };
}

function asSweepRecord(value: JsonValue, label: string): BeaconSweepRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("record must be an object");
  const record = value as unknown as BeaconSweepRecord;
  if (record.type !== "OrgAnchorBeaconSweepRecord") throw new Error("type must be OrgAnchorBeaconSweepRecord");
  if (record.version !== "0.1") throw new Error("version must be 0.1");
  if (typeof record.target !== "string" || record.target.length === 0) throw new Error("target must be a non-empty string");
  if (typeof record.checked_at !== "string" || record.checked_at.length === 0) throw new Error("checked_at must be a non-empty string");
  if (!STATUSES.has(record.status)) throw new Error("status is unsupported");
  if (!CONFORMANCE_STATUSES.has(record.conformance_status)) throw new Error("conformance_status is unsupported");
  if (!record.signal || typeof record.signal !== "object") throw new Error("signal must be an object");
  if (!record.verification || typeof record.verification !== "object") throw new Error("verification must be an object");
  if (!Array.isArray(record.risk_gaps)) throw new Error("risk_gaps must be an array");
  if (!Array.isArray(record.next_steps)) throw new Error("next_steps must be an array");
  return record;
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
