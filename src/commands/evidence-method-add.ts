import { readJsonFile, type JsonValue } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { validateEvidenceManifest } from "../core/evidence-validate.ts";
import { asObject } from "../core/validate.ts";

export async function evidenceMethodAddCommand(options: Record<string, string | boolean>): Promise<void> {
  const manifestPath = typeof options.manifest === "string" ? options.manifest : "evidence/evidence-manifest.json";
  const id = requireOption(options.id, "--id is required");
  const evidenceId = requireOption(options["evidence-id"], "--evidence-id is required");
  const manifest = asObject(validateEvidenceManifest(await readJsonFile(manifestPath)), "evidence manifest");
  const evidence = arrayObjects(manifest.evidence);
  const evidenceItem = evidence.find((item) => stringValue(item.id) === evidenceId);
  if (!evidenceItem) throw new Error(`Evidence id "${evidenceId}" does not exist`);

  const methods = arrayObjects(manifest.methods);
  if (methods.some((method) => stringValue(method.id) === id)) {
    throw new Error(`Evidence method id "${id}" already exists`);
  }

  const steps = parseList(options.steps);
  const expectedResults = parseList(options["expected-results"]);
  if (steps.length === 0) throw new Error("--steps is required. Use semicolon-separated steps.");
  if (expectedResults.length === 0) throw new Error("--expected-results is required. Use semicolon-separated expected results.");

  const claimIds = parseList(options["claim-ids"] ?? options["claim-id"]);
  const targetClaimIds = claimIds.length > 0 ? claimIds : claimIdsFromEvidence(evidenceItem);
  if (targetClaimIds.length === 0) {
    throw new Error("--claim-id is required when the evidence item does not already relate to a claim");
  }

  const method: Record<string, JsonValue> = {
    type: "OrgAnchorEvidenceMethod",
    id,
    method_kind: stringOption(options.kind) || "manual_recheck",
    title: stringOption(options.title) || `Recheck method for ${evidenceId}`,
    target_claim_ids: targetClaimIds,
    target_evidence_ids: [evidenceId],
    cost_to_verify: stringOption(options["cost-to-verify"]) || "low",
    required_tools: parseList(options["required-tools"]),
    steps,
    expected_results: expectedResults,
    limitations: parseList(options.limitations)
  };

  methods.push(method);
  manifest.methods = methods as JsonValue[];

  const refs = arrayStrings(evidenceItem.method_refs);
  if (!refs.includes(id)) refs.push(id);
  evidenceItem.method_refs = refs;

  validateEvidenceManifest(manifest as JsonValue);
  await writeJsonFile(manifestPath, manifest);
  console.log(`Added evidence method: ${id}`);
  console.log(`Evidence: ${evidenceId}`);
  console.log(`Claims: ${targetClaimIds.join(", ")}`);
  console.log(`Cost to verify: ${method.cost_to_verify}`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

function stringOption(value: string | boolean | undefined): string {
  return typeof value === "string" ? value : "";
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function arrayObjects(value: JsonValue | undefined): Record<string, JsonValue>[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asObject(item, "array item"));
}

function arrayStrings(value: JsonValue | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function parseList(value: string | boolean | undefined): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function claimIdsFromEvidence(evidenceItem: Record<string, JsonValue>): string[] {
  const relations = arrayObjects(evidenceItem.relations);
  const ids = new Set<string>();
  for (const relation of relations) {
    const claimId = stringValue(relation.claim_id);
    if (claimId) ids.add(claimId);
  }
  return [...ids];
}
