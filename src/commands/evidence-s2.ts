import { readJsonFile, type JsonValue } from "../core/json.ts";
import { writeJsonFile } from "../core/files.ts";
import { validateEvidenceManifest } from "../core/evidence-validate.ts";
import { asObject } from "../core/validate.ts";

type S2TemplateId = "certification_record" | "laboratory_report" | "platform_public_record" | "customer_confirmation";

interface S2Template {
  id: S2TemplateId;
  materialType: string;
  routeId: "VR-S2-001" | "VR-S2-002";
  routeKind: "ISSUER_ORIGIN_CONFIRMATION" | "PUBLIC_REGISTRY_CONFIRMATION";
  routeTemplate: string;
  anchorType: string;
  relationship: string;
  defaultLimitations: string[];
}

const S2_TEMPLATES: Record<S2TemplateId, S2Template> = {
  certification_record: {
    id: "certification_record",
    materialType: "certification_record",
    routeId: "VR-S2-002",
    routeKind: "PUBLIC_REGISTRY_CONFIRMATION",
    routeTemplate: "public_registry_record",
    anchorType: "public_registry_record",
    relationship: "paid_certification",
    defaultLimitations: ["Certificate scope and legal sufficiency require external policy review."]
  },
  laboratory_report: {
    id: "laboratory_report",
    materialType: "laboratory_report",
    routeId: "VR-S2-001",
    routeKind: "ISSUER_ORIGIN_CONFIRMATION",
    routeTemplate: "issuer_origin_page",
    anchorType: "issuer_origin_page",
    relationship: "paid_testing",
    defaultLimitations: ["Report scope, sample source, and method sufficiency require external policy review."]
  },
  platform_public_record: {
    id: "platform_public_record",
    materialType: "platform_public_record",
    routeId: "VR-S2-002",
    routeKind: "PUBLIC_REGISTRY_CONFIRMATION",
    routeTemplate: "platform_public_record",
    anchorType: "platform_public_record",
    relationship: "platform_record",
    defaultLimitations: ["Platform record availability and account ownership require external policy review."]
  },
  customer_confirmation: {
    id: "customer_confirmation",
    materialType: "customer_confirmation",
    routeId: "VR-S2-001",
    routeKind: "ISSUER_ORIGIN_CONFIRMATION",
    routeTemplate: "issuer_origin_page",
    anchorType: "issuer_origin_page",
    relationship: "customer_or_counterparty",
    defaultLimitations: ["Customer confirmation is not automatically representative of all deliveries or future performance."]
  }
};

export async function evidenceS2AttachCommand(options: Record<string, string | boolean>): Promise<void> {
  const manifestPath = stringOption(options.manifest) || "evidence/evidence-manifest.json";
  const evidenceId = requireOption(options["evidence-id"], "--evidence-id is required");
  const template = templateFromOption(options.template);
  const issuerName = requireOption(options["issuer-name"], "--issuer-name is required");
  const anchorUrl = requireOption(options["anchor-url"], "--anchor-url is required");
  if (!isHttpUrl(anchorUrl)) throw new Error("--anchor-url must be an http(s) URL");
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

  const limitations = parseList(options.limitations);
  const validUntil = stringOption(options["valid-until"]);
  if (validUntil && Number.isNaN(Date.parse(validUntil))) {
    throw new Error("--valid-until must be a valid date or ISO timestamp");
  }
  const checkedAt = stringOption(options["checked-at"]) || new Date().toISOString();
  if (Number.isNaN(Date.parse(checkedAt))) throw new Error("--checked-at must be a valid date or ISO timestamp");

  item.s_class = "S2_THIRD_PARTY_DOCUMENTS";
  item.issuer_type = "third_party";
  item.s2 = buildS2Metadata({
    template,
    issuerName,
    claimRefs: resolvedClaimRefs,
    scopeText,
    limitations: limitations.length > 0 ? limitations : template.defaultLimitations,
    anchorUrl,
    anchorRecordId: stringOption(options["anchor-record-id"]),
    checkedAt: new Date(checkedAt).toISOString(),
    validUntil: validUntil ? new Date(validUntil).toISOString() : "",
    coveredSubjectType: stringOption(options["covered-subject-type"]),
    coveredSubjectId: stringOption(options["covered-subject-id"]),
    sampleSource: stringOption(options["sample-source"]) || "unknown",
    selectedBy: stringOption(options["selected-by"]) || "unknown",
    relationship: stringOption(options.relationship) || template.relationship
  });

  validateEvidenceManifest(manifest as JsonValue);
  await writeJsonFile(manifestPath, manifest);
  console.log(`Attached S2 metadata to evidence: ${evidenceId}`);
  console.log(`Template: ${template.id}`);
  console.log(`State: S2_1_GENERIC_ROUTE_PROVIDED`);
  console.log(`Claims: ${resolvedClaimRefs.join(", ")}`);
  console.log(`Anchor: ${anchorUrl}`);
}

export async function evidenceS2TemplateCommand(options: Record<string, string | boolean>): Promise<void> {
  const template = templateFromOption(options.template);
  const templateClaimRefs = parseList(options["claim-ids"] ?? options["claim-id"]);
  const sample = {
    s_class: "S2_THIRD_PARTY_DOCUMENTS",
    s2: buildS2Metadata({
      template,
      issuerName: stringOption(options["issuer-name"]) || "Example Issuer",
      claimRefs: templateClaimRefs.length > 0 ? templateClaimRefs : ["claim-001"],
      scopeText: stringOption(options.scope) || "Describe exactly which claim, product, service, model, batch, or time window this material supports.",
      limitations: parseList(options.limitations).length > 0 ? parseList(options.limitations) : template.defaultLimitations,
      anchorUrl: stringOption(options["anchor-url"]) || "https://issuer.example/records/RECORD-ID",
      anchorRecordId: stringOption(options["anchor-record-id"]) || "RECORD-ID",
      checkedAt: stringOption(options["checked-at"]) || "2026-05-28T00:00:00.000Z",
      validUntil: stringOption(options["valid-until"]),
      coveredSubjectType: stringOption(options["covered-subject-type"]) || "product_model",
      coveredSubjectId: stringOption(options["covered-subject-id"]) || "model-or-service-id",
      sampleSource: stringOption(options["sample-source"]) || "unknown",
      selectedBy: stringOption(options["selected-by"]) || "unknown",
      relationship: stringOption(options.relationship) || template.relationship
    })
  };
  console.log(JSON.stringify(sample, null, 2));
}

function buildS2Metadata(options: {
  template: S2Template;
  issuerName: string;
  claimRefs: string[];
  scopeText: string;
  limitations: string[];
  anchorUrl: string;
  anchorRecordId: string;
  checkedAt: string;
  validUntil: string;
  coveredSubjectType: string;
  coveredSubjectId: string;
  sampleSource: string;
  selectedBy: string;
  relationship: string;
}): Record<string, JsonValue> {
  const support: Record<string, JsonValue> = {
    support_type: "supports_claim",
    claim_refs: options.claimRefs,
    scope_text: options.scopeText,
    limitations: options.limitations
  };
  if (options.coveredSubjectType) support.covered_subject_type = options.coveredSubjectType;
  if (options.coveredSubjectId) support.covered_subject_id = options.coveredSubjectId;

  const anchor: Record<string, JsonValue> = {
    anchor_type: options.template.anchorType,
    url: options.anchorUrl,
    checked_at: options.checkedAt
  };
  if (options.anchorRecordId) anchor.record_id = options.anchorRecordId;

  const health: Record<string, JsonValue> = {
    last_checked_at: options.checkedAt,
    maintenance_status: "FRESH"
  };
  if (options.validUntil) health.valid_until = options.validUntil;

  return {
    state: "S2_1_GENERIC_ROUTE_PROVIDED",
    material_type: options.template.materialType,
    issuer_name: options.issuerName,
    organization_claimed_support: support,
    verification_route: {
      route_id: options.template.routeId,
      route_kind: options.template.routeKind,
      route_template: options.template.routeTemplate,
      verification_mode: "manual_check"
    },
    external_recheck_anchor: anchor,
    health,
    disclosures: {
      sample_source: options.sampleSource,
      selected_by: options.selectedBy,
      relationship_to_organization: options.relationship
    }
  };
}

function templateFromOption(value: string | boolean | undefined): S2Template {
  const template = stringOption(value) || "certification_record";
  if (isS2TemplateId(template)) return S2_TEMPLATES[template];
  throw new Error(`--template must be one of: ${Object.keys(S2_TEMPLATES).join(", ")}`);
}

function isS2TemplateId(value: string): value is S2TemplateId {
  return Object.prototype.hasOwnProperty.call(S2_TEMPLATES, value);
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

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
