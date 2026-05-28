import { writeJsonFile } from "../core/files.ts";
import { validateEvidenceManifest } from "../core/evidence-validate.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import { asObject } from "../core/validate.ts";

type S3TemplateId = "market_purchase" | "distributor_sampling" | "warehouse_sampling" | "customer_site_sampling";

interface S3Template {
  id: S3TemplateId;
  sampleType: string;
  samplerType: string;
  acquisitionChannel: string;
  sampleSource: string;
  selectedBy: string;
  samplingMethod: string;
  defaultLimitations: string[];
}

const S3_TEMPLATES: Record<S3TemplateId, S3Template> = {
  market_purchase: {
    id: "market_purchase",
    sampleType: "market_purchase",
    samplerType: "buyer",
    acquisitionChannel: "retail_market",
    sampleSource: "retail_market",
    selectedBy: "buyer",
    samplingMethod: "random_purchase",
    defaultLimitations: ["One market sample does not prove all batches, regions, or future production."]
  },
  distributor_sampling: {
    id: "distributor_sampling",
    sampleType: "distributor_inventory_sample",
    samplerType: "auditor",
    acquisitionChannel: "distributor",
    sampleSource: "distributor_inventory",
    selectedBy: "auditor",
    samplingMethod: "random_inventory_sample",
    defaultLimitations: ["Distributor inventory sampling does not prove every channel or future production."]
  },
  warehouse_sampling: {
    id: "warehouse_sampling",
    sampleType: "warehouse_inventory_sample",
    samplerType: "auditor",
    acquisitionChannel: "warehouse",
    sampleSource: "warehouse_inventory",
    selectedBy: "auditor",
    samplingMethod: "random_warehouse_sample",
    defaultLimitations: ["Warehouse sampling depends on warehouse access and may not cover all shipped units."]
  },
  customer_site_sampling: {
    id: "customer_site_sampling",
    sampleType: "customer_site_observation",
    samplerType: "customer",
    acquisitionChannel: "customer_site",
    sampleSource: "customer_site",
    selectedBy: "customer_or_auditor",
    samplingMethod: "field_sample_or_observation",
    defaultLimitations: ["Customer-site observations may reflect local configuration, usage, and maintenance conditions."]
  }
};

export async function evidenceS3AttachCommand(options: Record<string, string | boolean>): Promise<void> {
  const manifestPath = stringOption(options.manifest) || "evidence/evidence-manifest.json";
  const evidenceId = requireOption(options["evidence-id"], "--evidence-id is required");
  const template = templateFromOption(options.template);
  const acquiredAt = requireTimestamp(options["acquired-at"], "--acquired-at is required and must be a valid date or ISO timestamp");
  const subjectType = requireOption(options["subject-type"], "--subject-type is required");
  const subjectId = requireOption(options["subject-id"], "--subject-id is required");
  const scopeText = requireOption(options.scope, "--scope is required");
  const manifest = asObject(validateEvidenceManifest(await readJsonFile(manifestPath)), "evidence manifest");
  const evidence = arrayObjects(manifest.evidence);
  const item = evidence.find((candidate) => stringValue(candidate.id) === evidenceId);
  if (!item) throw new Error(`Evidence id "${evidenceId}" does not exist`);

  const claimRefs = parseList(options["claim-ids"] ?? options["claim-id"]);
  const resolvedClaimRefs = claimRefs.length > 0 ? claimRefs : claimIdsFromEvidence(item);
  if (resolvedClaimRefs.length === 0) {
    throw new Error("--claim-id or --claim-ids is required when the evidence item does not already relate to a claim");
  }

  const sampleSize = positiveIntegerOption(options["sample-size"]) || 1;
  const limitations = parseList(options.limitations);
  const checkedAt = timestampOption(options["checked-at"]) || new Date().toISOString();

  item.s_class = "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING";
  item.issuer_type = "third_party";
  item.s3 = buildS3Metadata({
    template,
    samplerType: stringOption(options["sampler-type"]) || template.samplerType,
    samplerName: stringOption(options["sampler-name"]),
    sampleSource: stringOption(options["sample-source"]) || template.sampleSource,
    selectedBy: stringOption(options["selected-by"]) || template.selectedBy,
    acquiredAt,
    sampleSize,
    subjectType,
    subjectId,
    batchId: stringOption(options["batch-id"]),
    serialOrUnitId: stringOption(options["serial-or-unit-id"]),
    organizationProvidedSample: options["organization-provided-sample"] === true,
    custodyDocumented: options["custody-documented"] === true,
    custodyNotes: stringOption(options["custody-notes"]),
    claimRefs: resolvedClaimRefs,
    scopeText,
    limitations: limitations.length > 0 ? limitations : template.defaultLimitations,
    checkedAt
  });

  validateEvidenceManifest(manifest as JsonValue);
  await writeJsonFile(manifestPath, manifest);
  console.log(`Attached S3 metadata to evidence: ${evidenceId}`);
  console.log(`Template: ${template.id}`);
  console.log("State: S3_1_SAMPLING_ROUTE_PROVIDED");
  console.log(`Claims: ${resolvedClaimRefs.join(", ")}`);
  console.log(`Sample: ${subjectType}:${subjectId}`);
}

export async function evidenceS3TemplateCommand(options: Record<string, string | boolean>): Promise<void> {
  const template = templateFromOption(options.template);
  const claimRefs = parseList(options["claim-ids"] ?? options["claim-id"]);
  const sample = {
    s_class: "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING",
    s3: buildS3Metadata({
      template,
      samplerType: stringOption(options["sampler-type"]) || template.samplerType,
      samplerName: stringOption(options["sampler-name"]) || "Example Buyer Or Auditor",
      sampleSource: stringOption(options["sample-source"]) || template.sampleSource,
      selectedBy: stringOption(options["selected-by"]) || template.selectedBy,
      acquiredAt: timestampOption(options["acquired-at"]) || "2026-05-28T00:00:00.000Z",
      sampleSize: positiveIntegerOption(options["sample-size"]) || 1,
      subjectType: stringOption(options["subject-type"]) || "product_model",
      subjectId: stringOption(options["subject-id"]) || "model-or-service-id",
      batchId: stringOption(options["batch-id"]) || "batch-or-lot-id",
      serialOrUnitId: stringOption(options["serial-or-unit-id"]),
      organizationProvidedSample: options["organization-provided-sample"] === true,
      custodyDocumented: options["custody-documented"] === true,
      custodyNotes: stringOption(options["custody-notes"]) || "Describe custody handoff, packaging state, and who held the sample before testing.",
      claimRefs: claimRefs.length > 0 ? claimRefs : ["claim-001"],
      scopeText: stringOption(options.scope) || "Describe exactly which claim this random purchase or sampling evidence supports.",
      limitations: parseList(options.limitations).length > 0 ? parseList(options.limitations) : template.defaultLimitations,
      checkedAt: timestampOption(options["checked-at"]) || "2026-05-28T00:00:00.000Z"
    })
  };
  console.log(JSON.stringify(sample, null, 2));
}

function buildS3Metadata(options: {
  template: S3Template;
  samplerType: string;
  samplerName: string;
  sampleSource: string;
  selectedBy: string;
  acquiredAt: string;
  sampleSize: number;
  subjectType: string;
  subjectId: string;
  batchId: string;
  serialOrUnitId: string;
  organizationProvidedSample: boolean;
  custodyDocumented: boolean;
  custodyNotes: string;
  claimRefs: string[];
  scopeText: string;
  limitations: string[];
  checkedAt: string;
}): Record<string, JsonValue> {
  const sampleIdentity: Record<string, JsonValue> = {
    subject_type: options.subjectType,
    subject_id: options.subjectId
  };
  if (options.batchId) sampleIdentity.batch_id = options.batchId;
  if (options.serialOrUnitId) sampleIdentity.serial_or_unit_id = options.serialOrUnitId;

  const sampler: Record<string, JsonValue> = {
    type: options.samplerType
  };
  if (options.samplerName) sampler.name = options.samplerName;

  const custody: Record<string, JsonValue> = {
    custody_documented: options.custodyDocumented
  };
  if (options.custodyNotes) custody.custody_notes = options.custodyNotes;

  return {
    state: "S3_1_SAMPLING_ROUTE_PROVIDED",
    sample_type: options.template.sampleType,
    sampler,
    sample_identity: sampleIdentity,
    sampling_event: {
      acquired_at: options.acquiredAt,
      acquisition_channel: options.template.acquisitionChannel,
      sample_source: options.sampleSource,
      selected_by: options.selectedBy,
      organization_provided_sample: options.organizationProvidedSample,
      sampling_method: options.template.samplingMethod,
      sample_size: options.sampleSize
    },
    custody,
    organization_claimed_support: {
      support_type: "supports_claim",
      claim_refs: options.claimRefs,
      scope_text: options.scopeText,
      limitations: options.limitations
    },
    health: {
      last_checked_at: options.checkedAt,
      maintenance_status: "FRESH"
    }
  };
}

function templateFromOption(value: string | boolean | undefined): S3Template {
  const template = stringOption(value) || "market_purchase";
  if (isS3TemplateId(template)) return S3_TEMPLATES[template];
  throw new Error(`--template must be one of: ${Object.keys(S3_TEMPLATES).join(", ")}`);
}

function isS3TemplateId(value: string): value is S3TemplateId {
  return Object.prototype.hasOwnProperty.call(S3_TEMPLATES, value);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

function requireTimestamp(value: string | boolean | undefined, message: string): string {
  const timestamp = stringOption(value);
  if (!timestamp || Number.isNaN(Date.parse(timestamp))) throw new Error(message);
  return new Date(timestamp).toISOString();
}

function timestampOption(value: string | boolean | undefined): string {
  const timestamp = stringOption(value);
  if (!timestamp) return "";
  if (Number.isNaN(Date.parse(timestamp))) throw new Error("Timestamp option must be a valid date or ISO timestamp");
  return new Date(timestamp).toISOString();
}

function positiveIntegerOption(value: string | boolean | undefined): number {
  const string = stringOption(value);
  if (!string) return 0;
  const number = Number(string);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error("Numeric option must be a positive integer");
  return number;
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

function parseList(value: string | boolean | undefined): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  return value
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function claimIdsFromEvidence(evidenceItem: Record<string, JsonValue>): string[] {
  const ids = new Set<string>();
  for (const relation of arrayObjects(evidenceItem.relations)) {
    const claimId = stringValue(relation.claim_id);
    if (claimId) ids.add(claimId);
  }
  return [...ids];
}
