import {
  inspectBeaconTarget,
  type BeaconConformanceStatus,
  type BeaconInspectResult
} from "./beacon-inspect.ts";

type DoctorStatus = "READY" | "NEEDS_WORK" | "BLOCKED";

interface DoctorReport {
  type: "OrgAnchorDoctorReport";
  version: "0.1";
  target: string;
  status: DoctorStatus;
  conformance_status: BeaconConformanceStatus;
  summary: {
    signal_kind: string;
    signal_url: string | null;
    identity_status: string | null;
    value_status: string | null;
    root_authority_hash: string | null;
    statement_hash: string | null;
  };
  blocking_issues: string[];
  warnings: string[];
  missing_capabilities: string[];
  next_actions: string[];
}

export async function doctorCommand(options: Record<string, string | boolean>): Promise<void> {
  const target = typeof options.url === "string" ? options.url : typeof options._ === "string" ? options._ : "";
  if (!target) throw new Error("doctor requires <organization-url>");
  const inspect = await inspectBeaconTarget(target, parseTimeoutMs(options["timeout-ms"]));
  const report = buildDoctorReport(target, inspect);
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "BLOCKED") process.exitCode = 1;
}

function buildDoctorReport(target: string, inspect: BeaconInspectResult): DoctorReport {
  const blockingIssues = [
    ...inspect.risk_gaps
      .filter((risk) => risk.severity === "FAIL")
      .map((risk) => `${risk.code}: ${risk.detail}`),
    ...inspect.checks
      .filter((check) => check.status === "FAIL")
      .map((check) => `${check.id}: ${check.detail}`)
  ];
  const warnings = [
    ...inspect.risk_gaps
      .filter((risk) => risk.severity === "WARN")
      .map((risk) => `${risk.code}: ${risk.detail}`),
    ...inspect.checks
      .filter((check) => check.status === "WARN")
      .map((check) => `${check.id}: ${check.detail}`)
  ];
  return {
    type: "OrgAnchorDoctorReport",
    version: "0.1",
    target,
    status: doctorStatus(inspect, blockingIssues),
    conformance_status: inspect.conformance_status,
    summary: {
      signal_kind: inspect.signal.kind,
      signal_url: inspect.signal.url,
      identity_status: inspect.verification.identity_status,
      value_status: inspect.verification.value_status,
      root_authority_hash: inspect.verification.root_authority_hash,
      statement_hash: inspect.verification.statement_hash
    },
    blocking_issues: unique(blockingIssues),
    warnings: unique(warnings),
    missing_capabilities: missingCapabilities(inspect),
    next_actions: nextActions(inspect)
  };
}

function doctorStatus(inspect: BeaconInspectResult, blockingIssues: string[]): DoctorStatus {
  if (blockingIssues.length > 0 || inspect.conformance_status === "FAILED") return "BLOCKED";
  if (inspect.conformance_status === "FULL_COMPATIBLE") return "READY";
  return "NEEDS_WORK";
}

function missingCapabilities(inspect: BeaconInspectResult): string[] {
  const missing: string[] = [];
  if (!inspect.signal.claimed) missing.push("Publish /.well-known/organchor.json.");
  if (inspect.signal.kind !== "beacon") missing.push("Publish a dedicated OrgAnchor Beacon instead of relying only on /verify/organchor.json.");
  if (inspect.verification.identity_status !== "PASS") missing.push("Make statement, root authority, signature, and hash checks pass.");
  if (inspect.verification.value_status === "NOT_INCLUDED") missing.push("Publish signed claims, evidence, and a value continuity report.");
  if (inspect.verification.value_status === "WARN") missing.push("Resolve value evidence warnings or document them for external policy review.");
  if (inspect.signal.ignored_unknown_fields.length > 0) missing.push("Remove or namespace unknown Beacon fields.");
  return unique(missing);
}

function nextActions(inspect: BeaconInspectResult): string[] {
  if (inspect.conformance_status === "FULL_COMPATIBLE") {
    return [
      "Keep the Beacon, verify index, signed artifacts, and value evidence cached and publicly reachable.",
      "Mirror or archive high-value artifacts when they become stable."
    ];
  }
  return unique([
    ...inspect.next_steps,
    ...inspect.risk_gaps.map((risk) => risk.next_action)
  ]);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function parseTimeoutMs(value: string | boolean | undefined): number {
  if (value === undefined || value === false) return 15000;
  if (typeof value !== "string") throw new Error("--timeout-ms must be a positive integer");
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("--timeout-ms must be a positive integer");
  return parsed;
}
