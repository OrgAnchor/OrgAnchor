import { sha256CanonicalJson } from "../core/hash.ts";
import { parseStrictJson, type JsonValue } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { validateDirectorySnapshot, type DirectoryRecord } from "../directory/snapshot.ts";
import {
  inspectDirectoryTarget,
  parseDirectoryTimeoutMs,
  type DirectoryInspectReport,
  type InspectCheck,
  type InspectStatus
} from "./directory-inspect.ts";

interface DirectoryFetchCandidate {
  record_id: string;
  origin: string;
  organization: {
    name: string;
    display_name: string;
  };
  discovery: {
    categories: string[];
    capabilities: string[];
    regions: string[];
    languages: string[];
  };
  verification_summary: {
    identity_status: string;
    value_status: string;
    policy_route: string;
    root_authority_hash: string;
    statement_hash: string;
    last_verified_at: string;
  };
  evidence_summary: {
    total_evidence_items: number;
    third_party_claims: number;
    reproducible_claims: number;
    manual_checks: number;
    unsupported_claims: number;
  };
  next_step: string;
}

interface DirectoryFetchResult {
  type: "OrgAnchorDirectoryFetchResult";
  version: "0.1";
  target: string;
  status: InspectStatus;
  inspect: DirectoryInspectReport;
  snapshot: {
    url: string | null;
    hash: string | null;
    snapshot_id: string | null;
    record_count: number;
    saved_to: string | null;
  };
  candidates: DirectoryFetchCandidate[];
}

export async function directoryFetchCommand(options: Record<string, string | boolean>): Promise<void> {
  const target = typeof options.url === "string" ? options.url : typeof options._ === "string" ? options._ : "";
  if (!target) throw new Error("directory fetch requires <organization-url>");
  const report = await fetchDirectoryTarget({
    target,
    timeoutMs: parseDirectoryTimeoutMs(options["timeout-ms"]),
    out: typeof options.out === "string" ? options.out : null
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.status === "FAIL" || report.status === "NOT_INCLUDED") process.exitCode = 1;
}

async function fetchDirectoryTarget(options: {
  target: string;
  timeoutMs: number;
  out: string | null;
}): Promise<DirectoryFetchResult> {
  const inspect = await inspectDirectoryTarget(options.target, options.timeoutMs);
  const snapshotUrl = inspect.directory.snapshot_url;
  const emptySnapshot = {
    url: snapshotUrl,
    hash: inspect.directory.snapshot_hash,
    snapshot_id: inspect.directory.snapshot_id,
    record_count: inspect.directory.record_count,
    saved_to: null
  };
  if (inspect.status === "FAIL" || inspect.status === "NOT_INCLUDED" || !snapshotUrl) {
    return {
      type: "OrgAnchorDirectoryFetchResult",
      version: "0.1",
      target: options.target,
      status: inspect.status,
      inspect,
      snapshot: emptySnapshot,
      candidates: []
    };
  }

  try {
    const snapshotValue = await fetchJson(new URL(snapshotUrl), "Directory snapshot", options.timeoutMs);
    const snapshotHash = sha256CanonicalJson(snapshotValue);
    const snapshot = validateDirectorySnapshot(snapshotValue);
    if (inspect.directory.snapshot_hash && inspect.directory.snapshot_hash !== snapshotHash) {
      const failedInspect = {
        ...inspect,
        status: "FAIL" as const,
        checks: [
          ...inspect.checks,
          {
            id: "directory_fetch_hash",
            status: "FAIL" as const,
            detail: `Fetched snapshot hash mismatch: expected ${inspect.directory.snapshot_hash}, got ${snapshotHash}.`
          }
        ]
      };
      return {
        type: "OrgAnchorDirectoryFetchResult",
        version: "0.1",
        target: options.target,
        status: "FAIL",
        inspect: failedInspect,
        snapshot: emptySnapshot,
        candidates: []
      };
    }

    if (options.out) {
      await writeJsonFile(options.out, snapshot as unknown as JsonValue);
    }

    return {
      type: "OrgAnchorDirectoryFetchResult",
      version: "0.1",
      target: options.target,
      status: inspect.status,
      inspect,
      snapshot: {
        url: snapshotUrl,
        hash: snapshotHash,
        snapshot_id: snapshot.snapshot_id,
        record_count: snapshot.records.length,
        saved_to: options.out
      },
      candidates: snapshot.records.map(candidateFromRecord)
    };
  } catch (error) {
    const checks: InspectCheck[] = [
      ...inspect.checks,
      {
        id: "directory_fetch",
        status: "FAIL",
        detail: error instanceof Error ? error.message : String(error)
      }
    ];
    return {
      type: "OrgAnchorDirectoryFetchResult",
      version: "0.1",
      target: options.target,
      status: "FAIL",
      inspect: {
        ...inspect,
        status: "FAIL",
        checks
      },
      snapshot: emptySnapshot,
      candidates: []
    };
  }
}

function candidateFromRecord(record: DirectoryRecord): DirectoryFetchCandidate {
  return {
    record_id: record.record_id,
    origin: record.origin,
    organization: {
      name: record.organization.name,
      display_name: record.organization.display_name
    },
    discovery: {
      categories: record.discovery.categories,
      capabilities: record.discovery.capabilities,
      regions: record.discovery.regions,
      languages: record.discovery.languages
    },
    verification_summary: {
      identity_status: record.verification_summary.identity_status,
      value_status: record.verification_summary.value_status,
      policy_route: record.verification_summary.policy_route,
      root_authority_hash: record.verification_summary.root_authority_hash,
      statement_hash: record.verification_summary.statement_hash,
      last_verified_at: record.verification_summary.last_verified_at
    },
    evidence_summary: {
      total_evidence_items: record.evidence_summary.total_evidence_items,
      third_party_claims: record.evidence_summary.third_party_claims,
      reproducible_claims: record.evidence_summary.reproducible_claims,
      manual_checks: record.evidence_summary.manual_checks,
      unsupported_claims: record.evidence_summary.unsupported_claims
    },
    next_step: `organchor verify url ${record.origin} --compact`
  };
}

async function fetchJson(url: URL, label: string, timeoutMs: number): Promise<JsonValue> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": "OrgAnchor directory fetcher"
    }
  });
  if (!response.ok) throw new Error(`Could not fetch ${label} at ${url.toString()}: HTTP ${response.status}`);
  return parseStrictJson(await response.text(), url.toString());
}
