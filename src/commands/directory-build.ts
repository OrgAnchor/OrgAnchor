import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import { asObject, requireIsoTimestamp, requireString } from "../core/validate.ts";
import { buildDirectorySnapshot } from "../directory/snapshot.ts";
import { verifyUrlTarget, type AgentVerificationResult } from "./verify-url.ts";

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

  await ensureDir(outputDir);
  const snapshotPath = join(outputDir, "directory-snapshot.json");
  const hashPath = join(outputDir, "directory-snapshot.json.sha256");
  await writeJsonFile(snapshotPath, snapshot as unknown as JsonValue);
  await writeFile(hashPath, `${snapshotHash}\n`, "utf8");

  console.log("Directory snapshot generated.");
  console.log(`Origins: ${originsPath}`);
  console.log(`Origin verification: ${options["verify-origins"] === true ? "enabled" : "not requested"}`);
  console.log(`Records: ${snapshot.records.length}`);
  console.log(`Snapshot id: ${snapshot.snapshot_id}`);
  console.log(`Snapshot hash: ${snapshotHash}`);
  console.log(`Snapshot JSON: ${snapshotPath}`);
  console.log(`Snapshot hash file: ${hashPath}`);
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
