import { sha256CanonicalJson } from "../core/hash.ts";
import { parseStrictJson, type JsonValue } from "../core/json.ts";
import { asObject } from "../core/validate.ts";
import { validateDirectorySnapshot } from "../directory/snapshot.ts";

export type InspectStatus = "PASS" | "WARN" | "FAIL" | "NOT_INCLUDED";

export interface InspectCheck {
  id: string;
  status: InspectStatus;
  detail: string;
}

export interface DirectoryInspectReport {
  type: "OrgAnchorDirectoryInspectReport";
  version: "0.1";
  target: string;
  status: InspectStatus;
  index_url: string;
  checks: InspectCheck[];
  directory: {
    status: InspectStatus;
    snapshot_url: string | null;
    snapshot_hash: string | null;
    snapshot_id: string | null;
    record_count: number;
    policy_url: string | null;
    policy_hash: string | null;
    trust_boundary: {
      directory_is_trust_root: false;
      final_trust_decision: "EXTERNAL_AGENT";
      records_must_verify_at_origin: true;
    } | null;
  };
}

export const DIRECTORY_INSPECT_DEFAULT_TIMEOUT_MS = 15000;

export async function directoryInspectCommand(options: Record<string, string | boolean>): Promise<void> {
  const target = typeof options.url === "string" ? options.url : typeof options._ === "string" ? options._ : "";
  if (!target) throw new Error("directory inspect requires <organization-url>");
  const report = await inspectDirectoryTarget(target, parseDirectoryTimeoutMs(options["timeout-ms"]));
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "FAIL") process.exitCode = 1;
}

export async function inspectDirectoryTarget(target: string, timeoutMs: number): Promise<DirectoryInspectReport> {
  const checks: InspectCheck[] = [];
  const emptyDirectory: DirectoryInspectReport["directory"] = {
    status: "NOT_INCLUDED",
    snapshot_url: null,
    snapshot_hash: null,
    snapshot_id: null,
    record_count: 0,
    policy_url: null,
    policy_hash: null,
    trust_boundary: null
  };

  try {
    const index = await discoverIndex(target, timeoutMs);
    const indexObject = asObject(index.value, "verify index");
    addCheck(
      checks,
      "index",
      indexObject.type === "OrgAnchorVerifyIndex" && indexObject.version === "1.0" ? "PASS" : "FAIL",
      `Discovered OrgAnchor index at ${index.url.toString()}.`
    );
    if (checks.some((check) => check.status === "FAIL")) {
      return report(target, index.url.toString(), checks, emptyDirectory);
    }

    const discovery = optionalRecord(indexObject.directory_discovery);
    if (discovery.status !== "PRESENT") {
      addCheck(checks, "directory_discovery", "NOT_INCLUDED", "No directory_discovery pointer is present in the verify index.");
      return report(target, index.url.toString(), checks, emptyDirectory);
    }

    addCheck(checks, "directory_discovery", "PASS", "The verify index exposes a directory_discovery pointer.");
    const boundary = optionalRecord(discovery.trust_boundary);
    const boundaryOk = boundary.directory_is_trust_root === false &&
      boundary.final_trust_decision === "EXTERNAL_AGENT" &&
      boundary.records_must_verify_at_origin === true;
    addCheck(
      checks,
      "directory_trust_boundary",
      boundaryOk ? "PASS" : "FAIL",
      boundaryOk
        ? "Directory discovery says it is not a trust root and records must verify at origin."
        : "Directory discovery trust boundary is missing or unsafe."
    );

    const snapshotRef = optionalRecord(discovery.snapshot);
    const snapshotPath = stringValue(snapshotRef.path);
    if (!snapshotPath) {
      addCheck(checks, "directory_snapshot_ref", "FAIL", "directory_discovery.snapshot.path is required.");
      return report(target, index.url.toString(), checks, emptyDirectory);
    }

    const snapshotUrl = resolvePublishedUrl(index.url, snapshotPath);
    const snapshotValue = await fetchJson(snapshotUrl, "Directory snapshot", timeoutMs);
    const snapshotHash = sha256CanonicalJson(snapshotValue);
    const snapshot = validateDirectorySnapshot(snapshotValue);
    addCheck(checks, "directory_snapshot_shape", "PASS", `Directory snapshot ${snapshot.snapshot_id} is valid.`);

    const expectedSnapshotHash = stringValue(snapshotRef.hash);
    addCheck(
      checks,
      "directory_snapshot_hash",
      expectedSnapshotHash === snapshotHash ? "PASS" : "FAIL",
      expectedSnapshotHash === snapshotHash
        ? `Directory snapshot hash matches ${snapshotHash}.`
        : `Directory snapshot hash mismatch: expected ${expectedSnapshotHash || "(missing)"}, got ${snapshotHash}.`
    );

    const expectedRecordCount = numberValue(snapshotRef.record_count);
    if (expectedRecordCount >= 0) {
      addCheck(
        checks,
        "directory_record_count",
        expectedRecordCount === snapshot.records.length ? "PASS" : "FAIL",
        expectedRecordCount === snapshot.records.length
          ? `Directory record count matches ${snapshot.records.length}.`
          : `Directory record count mismatch: expected ${expectedRecordCount}, got ${snapshot.records.length}.`
      );
    }

    const hashPath = stringValue(snapshotRef.hash_path);
    if (hashPath) {
      const hashUrl = resolvePublishedUrl(index.url, hashPath);
      const hashText = (await fetchText(hashUrl, "Directory snapshot hash", timeoutMs)).trim();
      addCheck(
        checks,
        "directory_hash_file",
        hashText === snapshotHash ? "PASS" : "FAIL",
        hashText === snapshotHash
          ? `Directory hash file matches ${snapshotHash}.`
          : `Directory hash file mismatch: expected ${snapshotHash}, got ${hashText || "(empty)"}.`
      );
    } else {
      addCheck(checks, "directory_hash_file", "WARN", "No directory snapshot hash_path was provided.");
    }

    const policyRef = optionalRecord(discovery.policy);
    const policyPath = stringValue(policyRef.path);
    let policyUrl: URL | null = null;
    let policyHash: string | null = null;
    if (policyPath) {
      policyUrl = resolvePublishedUrl(index.url, policyPath);
      const policy = await fetchJson(policyUrl, "Directory policy", timeoutMs);
      policyHash = sha256CanonicalJson(policy);
      const expectedPolicyHash = stringValue(policyRef.hash);
      addCheck(
        checks,
        "directory_policy_hash",
        expectedPolicyHash === policyHash ? "PASS" : "FAIL",
        expectedPolicyHash === policyHash
          ? `Directory policy hash matches ${policyHash}.`
          : `Directory policy hash mismatch: expected ${expectedPolicyHash || "(missing)"}, got ${policyHash}.`
      );
    } else {
      addCheck(checks, "directory_policy", "WARN", "No directory policy pointer was provided.");
    }

    return report(target, index.url.toString(), checks, {
      status: checks.some((check) => check.status === "FAIL") ? "FAIL" : checks.some((check) => check.status === "WARN") ? "WARN" : "PASS",
      snapshot_url: snapshotUrl.toString(),
      snapshot_hash: snapshotHash,
      snapshot_id: snapshot.snapshot_id,
      record_count: snapshot.records.length,
      policy_url: policyUrl?.toString() ?? null,
      policy_hash: policyHash,
      trust_boundary: {
        directory_is_trust_root: false,
        final_trust_decision: "EXTERNAL_AGENT",
        records_must_verify_at_origin: true
      }
    });
  } catch (error) {
    addCheck(checks, "directory_inspect", "FAIL", error instanceof Error ? error.message : String(error));
    return report(target, "", checks, emptyDirectory);
  }
}

function report(
  target: string,
  indexUrl: string,
  checks: InspectCheck[],
  directory: DirectoryInspectReport["directory"]
): DirectoryInspectReport {
  const status = checks.some((check) => check.status === "FAIL")
    ? "FAIL"
    : directory.status === "NOT_INCLUDED"
      ? "NOT_INCLUDED"
      : checks.some((check) => check.status === "WARN")
        ? "WARN"
        : "PASS";
  return {
    type: "OrgAnchorDirectoryInspectReport",
    version: "0.1",
    target,
    status,
    index_url: indexUrl,
    checks,
    directory
  };
}

async function discoverIndex(target: string, timeoutMs: number): Promise<{ url: URL; value: JsonValue }> {
  const targetUrl = normalizeTargetUrl(target);
  const candidates = indexCandidates(targetUrl);
  const failures: string[] = [];
  for (const candidate of candidates) {
    try {
      const response = await fetchWithTimeout(candidate, timeoutMs);
      if (!response.ok) {
        failures.push(`${candidate.toString()} returned ${response.status}`);
        continue;
      }
      const value = parseStrictJson(await response.text(), candidate.toString());
      const object = optionalRecord(value);
      if (object.type === "OrgAnchorVerifyIndex") {
        return {
          url: candidate,
          value
        };
      }
      if (object.type === "OrgAnchorBeacon") {
        const verifyIndexUrl = resolveBeaconVerifyIndexUrl(object, candidate);
        return {
          url: verifyIndexUrl,
          value: await fetchJson(verifyIndexUrl, "OrgAnchor verify index", timeoutMs)
        };
      }
      failures.push(`${candidate.toString()} is not an OrgAnchor verify index or Beacon`);
    } catch (error) {
      failures.push(`${candidate.toString()} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`Could not discover OrgAnchor index. Tried: ${failures.join("; ")}`);
}

function resolveBeaconVerifyIndexUrl(beacon: Record<string, JsonValue>, beaconUrl: URL): URL {
  const explicitIndex = stringValue(beacon.verify_index_url);
  if (explicitIndex) return new URL(explicitIndex, beaconUrl);
  const verifyUrl = stringValue(beacon.verify_url);
  if (verifyUrl) return new URL("organchor.json", ensureDirectoryUrl(new URL(verifyUrl, beaconUrl)));
  throw new Error("OrgAnchor Beacon must include verify_index_url or verify_url");
}

function indexCandidates(targetUrl: URL): URL[] {
  const candidates: URL[] = [];
  if (targetUrl.pathname.endsWith(".json")) {
    candidates.push(targetUrl);
  } else {
    if (targetUrl.pathname !== "/") {
      candidates.push(new URL("organchor.json", ensureDirectoryUrl(targetUrl)));
    }
    candidates.push(new URL("/.well-known/organchor.json", targetUrl));
    candidates.push(new URL("/verify/organchor.json", targetUrl));
  }
  return uniqueUrls(candidates);
}

function normalizeTargetUrl(target: string): URL {
  const withScheme = /^https?:\/\//.test(target) ? target : `https://${target}`;
  const url = new URL(withScheme);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("directory inspect only supports http(s) URLs");
  }
  return url;
}

function resolvePublishedUrl(indexUrl: URL, path: string): URL {
  if (/^https?:\/\//.test(path)) return new URL(path);
  return new URL(path, new URL("/", indexUrl));
}

function ensureDirectoryUrl(url: URL): URL {
  const copy = new URL(url.toString());
  if (!copy.pathname.endsWith("/")) copy.pathname = `${copy.pathname}/`;
  return copy;
}

function uniqueUrls(urls: URL[]): URL[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    const value = url.toString();
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

async function fetchJson(url: URL, label: string, timeoutMs: number): Promise<JsonValue> {
  return parseStrictJson(await fetchText(url, label, timeoutMs), url.toString());
}

async function fetchText(url: URL, label: string, timeoutMs: number): Promise<string> {
  const response = await fetchWithTimeout(url, timeoutMs);
  if (!response.ok) throw new Error(`Could not fetch ${label} at ${url.toString()}: HTTP ${response.status}`);
  return response.text();
}

async function fetchWithTimeout(url: URL, timeoutMs: number): Promise<Response> {
  return fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": "OrgAnchor directory inspector"
    }
  });
}

function addCheck(checks: InspectCheck[], id: string, status: InspectStatus, detail: string): void {
  checks.push({ id, status, detail });
}

export function parseDirectoryTimeoutMs(value: string | boolean | undefined): number {
  if (value === undefined || value === false) return DIRECTORY_INSPECT_DEFAULT_TIMEOUT_MS;
  if (typeof value !== "string") throw new Error("--timeout-ms must be a positive integer");
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("--timeout-ms must be a positive integer");
  return parsed;
}

function optionalRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : -1;
}
