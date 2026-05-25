import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import { asObject, requireIsoTimestamp, requireString } from "../core/validate.ts";
import { buildDirectorySnapshot } from "../directory/snapshot.ts";
import { readBeaconLocalIndex, type BeaconLocalIndexRecord } from "./beacon-index.ts";
import { verifyUrlTarget, type AgentVerificationResult } from "./verify-url.ts";

export async function directoryBuildCommand(options: Record<string, string | boolean>): Promise<void> {
  const originsPath = typeof options.origins === "string" ? options.origins : typeof options.in === "string" ? options.in : undefined;
  const beaconIndexPath = typeof options["beacon-index"] === "string" ? options["beacon-index"] : undefined;
  if (!originsPath && !beaconIndexPath) {
    throw new Error("directory build requires --origins <directory-origins.json> or --beacon-index <beacon-index.json>");
  }
  if (originsPath && beaconIndexPath) {
    throw new Error("directory build accepts either --origins or --beacon-index, not both");
  }

  const outputDir = typeof options.out === "string" ? options.out : "public/directory";
  const input = originsPath
    ? asObject(await readJsonFile(originsPath), "directory origins")
    : defaultBeaconIndexDirectoryInput(beaconIndexPath ?? "");
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
      : stringValue(asObject(input.directory_node ?? {}, "directory origins.directory_node").policy_url) || new URL("/directory/directory-policy.json", nodeOrigin).toString()
  };

  const recordsValue = beaconIndexPath
    ? await recordsFromBeaconIndex(beaconIndexPath, generatedAt)
    : Array.isArray(input.origins) ? input.origins : Array.isArray(input.records) ? input.records : undefined;
  if (!recordsValue) {
    throw new Error("directory origins file must contain an origins or records array");
  }
  const records = options["verify-origins"] === true
    ? await verifyOriginRecords(recordsValue as JsonValue[], generatedAt, parseTimeoutMs(options["timeout-ms"]))
    : recordsValue as JsonValue[];

  const snapshot = buildDirectorySnapshot({
    snapshotId: typeof options["snapshot-id"] === "string"
      ? options["snapshot-id"]
      : stringValue(input.snapshot_id) || `directory-${generatedAt.replace(/[^0-9]/g, "").slice(0, 14)}`,
    generatedAt,
    directoryNode,
    records
  });
  const snapshotHash = sha256CanonicalJson(snapshot);
  const policy = directoryPolicy({
    generatedAt,
    directoryNode
  });
  const policyHash = sha256CanonicalJson(policy);

  await ensureDir(outputDir);
  const snapshotPath = join(outputDir, "directory-snapshot.json");
  const hashPath = join(outputDir, "directory-snapshot.json.sha256");
  const policyPath = join(outputDir, "directory-policy.json");
  await writeJsonFile(snapshotPath, snapshot as unknown as JsonValue);
  await writeFile(hashPath, `${snapshotHash}\n`, "utf8");
  await writeJsonFile(policyPath, policy);

  console.log("Directory snapshot generated.");
  console.log(`Origins: ${originsPath ?? "(from beacon index)"}`);
  if (beaconIndexPath) console.log(`Beacon index: ${beaconIndexPath}`);
  console.log(`Origin verification: ${options["verify-origins"] === true ? "enabled" : "not requested"}`);
  console.log(`Records: ${snapshot.records.length}`);
  console.log(`Snapshot id: ${snapshot.snapshot_id}`);
  console.log(`Snapshot hash: ${snapshotHash}`);
  console.log(`Snapshot JSON: ${snapshotPath}`);
  console.log(`Snapshot hash file: ${hashPath}`);
  console.log(`Directory policy hash: ${policyHash}`);
  console.log(`Directory policy JSON: ${policyPath}`);
}

function directoryPolicy(options: {
  generatedAt: string;
  directoryNode: {
    name: string;
    origin: string;
    policy_url: string;
  };
}): JsonValue {
  return {
    type: "OrgAnchorDirectoryPolicy",
    version: "0.1",
    generated_at: options.generatedAt,
    directory_node: options.directoryNode,
    trust_boundary: {
      directory_is_trust_root: false,
      final_trust_decision: "EXTERNAL_AGENT",
      records_must_verify_at_origin: true
    },
    inclusion_policy: {
      directory_is_discovery_aid: true,
      inclusion_is_not_certification: true,
      paid_ranking_is_not_verification: true,
      records_are_rebuildable_from_origin_beacons: true,
      selected_records_require_direct_origin_verification: true,
      accepted_source_methods: ["manual", "crawler", "submitted", "imported"],
      minimum_record_requirement: "origin-owned OrgAnchor Beacon or verify index pointer"
    },
    exclusion_policy: {
      exclusion_is_not_a_negative_certification: true,
      common_reasons: [
        "origin verification failed",
        "record is stale",
        "required machine-readable fields are missing",
        "operator policy excludes the category or region",
        "source submitted malformed or unverifiable data"
      ],
      excluded_origins_can_still_be_verified_directly_at_origin: true
    },
    ranking_policy: {
      default_order: "deterministic snapshot order unless a caller applies explicit filters",
      paid_placement_changes_verification_status: false,
      ranking_is_not_supplier_quality: true,
      external_agent_must_apply_own_policy: true
    },
    stale_record_policy: {
      stale_records_should_be_marked_or_removed: true,
      recommended_refresh_days: 30,
      stale_status_is_not_proof_of_bad_behavior: true,
      agents_should_reverify_before_use: true
    },
    mirroring_policy: {
      snapshots_are_exportable: true,
      forks_and_mirrors_are_allowed: true,
      mirrors_must_preserve_origin_verification_requirement: true
    },
    non_goals: [
      "certify that an organization is good",
      "rank suppliers as the final decision",
      "replace direct OrgAnchor verification",
      "act as the organization identity root"
    ]
  };
}

function defaultBeaconIndexDirectoryInput(beaconIndexPath: string): Record<string, JsonValue> {
  return {
    snapshot_id: `directory-from-beacon-index-${Date.now()}`,
    directory_node: {
      name: "OrgAnchor Beacon Index Directory",
      origin: "https://directory.example",
      policy_url: "https://directory.example/directory-policy.json"
    },
    beacon_index: beaconIndexPath
  };
}

async function recordsFromBeaconIndex(path: string, generatedAt: string): Promise<JsonValue[]> {
  const index = await readBeaconLocalIndex(path);
  const records = index.records
    .filter((record) => record.root_authority_hash && record.statement_hash)
    .map((record) => directoryRecordFromBeaconIndexRecord(record, generatedAt));
  if (records.length === 0) {
    throw new Error("Beacon index contains no records with both root_authority_hash and statement_hash");
  }
  return records;
}

function directoryRecordFromBeaconIndexRecord(record: BeaconLocalIndexRecord, generatedAt: string): JsonValue {
  return {
    origin: record.origin,
    organization: {
      name: record.organization.name || record.origin,
      display_name: record.organization.display_name || record.organization.name || record.origin
    },
    discovery: {
      categories: nonEmpty(record.discovery.categories, ["uncategorized"]),
      capabilities: nonEmpty(record.discovery.capabilities, ["not-specified"]),
      regions: nonEmpty(record.discovery.regions, ["not-specified"]),
      languages: nonEmpty(record.discovery.languages, ["not-specified"])
    },
    verification_summary: {
      identity_status: directoryIdentityStatus(record.identity_status),
      value_status: directoryValueStatus(record.value_status),
      policy_route: directoryPolicyRoute(record.policy_route),
      root_authority_hash: record.root_authority_hash,
      statement_hash: record.statement_hash,
      last_verified_at: record.last_checked_at || generatedAt,
      conformance_status: record.conformance_status,
      beacon_status: record.status,
      signal_kind: record.signal_kind,
      signal_url: record.signal_url
    },
    evidence_summary: {
      total_evidence_items: 0,
      third_party_claims: 0,
      reproducible_claims: 0,
      manual_checks: 0,
      unsupported_claims: 0
    },
    source: {
      method: "crawler",
      added_at: record.first_seen_at || generatedAt,
      imported_from: "OrgAnchorBeaconLocalIndex"
    },
    limitations: [
      "Directory record was derived from a local Beacon index.",
      "Directory record is a summary only.",
      "Agent must verify against the origin package before relying on it."
    ]
  };
}

async function verifyOriginRecords(records: JsonValue[], generatedAt: string, timeoutMs: number): Promise<JsonValue[]> {
  const verified: JsonValue[] = [];
  for (let index = 0; index < records.length; index++) {
    const input = asObject(records[index] ?? null, `directory origins[${index}]`);
    const origin = requireString(input, "origin", `directory origins[${index}]`);
    let result: AgentVerificationResult;
    try {
      result = await verifyUrlTarget(origin, { timeoutMs });
    } catch (error) {
      throw new Error(`Origin verification failed for ${origin}: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (result.identity_status !== "PASS") {
      const failures = result.checks
        .filter((check) => check.status === "FAIL")
        .map((check) => `${check.id}: ${check.detail}`)
        .join("; ");
      throw new Error(`Origin identity verification failed for ${origin}: ${failures || result.overall_status}`);
    }
    verified.push(directoryRecordFromAgentResult(input, result, generatedAt));
  }
  return verified;
}

function directoryRecordFromAgentResult(
  input: Record<string, JsonValue>,
  result: AgentVerificationResult,
  generatedAt: string
): JsonValue {
  const organization = asObject(result.organization, "agent verification organization");
  const inputOrganization = optionalRecord(input.organization);
  const inputVerification = optionalRecord(input.verification_summary);
  const inputEvidence = optionalRecord(input.evidence_summary);
  const inputSource = optionalRecord(input.source);
  const valueContinuity = optionalRecord(result.value_continuity);
  const summary = optionalRecord(valueContinuity.summary);
  const limitations = Array.isArray(input.limitations)
    ? input.limitations
    : [
      "Directory record was built from a live origin verification result.",
      "Directory record is a summary only.",
      "Agent must verify against the origin package before relying on it."
    ];

  return {
    ...input,
    organization: {
      ...inputOrganization,
      name: stringValue(organization.name) || stringValue(inputOrganization.name) || "unknown",
      display_name: stringValue(organization.display_name) || stringValue(inputOrganization.display_name) || stringValue(organization.name) || "unknown"
    },
    verification_summary: {
      ...inputVerification,
      identity_status: result.identity_status,
      value_status: result.value_status,
      policy_route: result.policy_route.route,
      root_authority_hash: stringValue(result.identity.root_authority_hash),
      statement_hash: stringValue(result.identity.statement_hash),
      last_verified_at: generatedAt,
      overall_status: result.overall_status,
      conformance_status: conformanceStatus(result),
      index_url: result.index_url,
      artifact_base_url: result.artifact_base_url
    },
    evidence_summary: {
      ...inputEvidence,
      total_evidence_items: numberValue(summary.total_evidence_items),
      third_party_claims: numberValue(summary.third_party_claims),
      reproducible_claims: numberValue(summary.reproducible_claims),
      manual_checks: numberValue(summary.MANUAL_CHECK_REQUIRED),
      unsupported_claims: numberValue(summary.unsupported_claims)
    },
    source: {
      ...inputSource,
      method: "crawler",
      added_at: stringValue(inputSource.added_at) || generatedAt,
      verified_at: generatedAt
    },
    limitations
  } as JsonValue;
}

function parseTimeoutMs(value: string | boolean | undefined): number {
  if (value === undefined || value === false) return 15000;
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
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

function conformanceStatus(result: AgentVerificationResult): string {
  if (result.identity_status !== "PASS") return "FAILED";
  if (result.value_status === "PASS" && result.overall_status === "PASS") return "FULL_COMPATIBLE";
  if (result.value_status === "PASS") return "VALUE_VERIFY_PASS";
  if (result.value_status === "WARN") return "PARTIAL";
  return "IDENTITY_VERIFY_PASS";
}

function nonEmpty(values: string[], fallback: string[]): string[] {
  return values.length > 0 ? values : fallback;
}

function directoryIdentityStatus(value: string | null): string {
  if (value === "PASS" || value === "FAIL") return value;
  return "NOT_VERIFIED";
}

function directoryValueStatus(value: string | null): string {
  if (value === "PASS" || value === "WARN" || value === "FAIL" || value === "NOT_INCLUDED") return value;
  return "NOT_VERIFIED";
}

function directoryPolicyRoute(value: string | null): string {
  const allowed = new Set([
    "STOP_IDENTITY_FAILURE",
    "REVIEW_FAILED_CHECKS",
    "REQUEST_VALUE_EVIDENCE",
    "REVIEW_VALUE_WARNINGS",
    "EXTERNAL_POLICY_REVIEW",
    "READY_FOR_EXTERNAL_POLICY",
    "REQUEST_ORIGIN_VERIFICATION"
  ]);
  return value && allowed.has(value) ? value : "REQUEST_ORIGIN_VERIFICATION";
}
