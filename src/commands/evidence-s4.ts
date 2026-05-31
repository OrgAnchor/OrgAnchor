import { writeJsonFile } from "../core/files.ts";
import { validateEvidenceManifest } from "../core/evidence-validate.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import { asObject } from "../core/validate.ts";

type S4TemplateId = "order_delivery" | "service_uptime" | "warranty_repair" | "field_use";

interface S4Template {
  id: S4TemplateId;
  observationType: string;
  observerType: string;
  metricType: string;
  defaultLimitations: string[];
}

const S4_TEMPLATES: Record<S4TemplateId, S4Template> = {
  order_delivery: {
    id: "order_delivery",
    observationType: "order_delivery",
    observerType: "buyer_or_buyer_agent",
    metricType: "order_delivery_performance",
    defaultLimitations: ["This observation covers only the stated orders, window, channel, and available raw records."]
  },
  service_uptime: {
    id: "service_uptime",
    observationType: "service_uptime",
    observerType: "monitoring_service",
    metricType: "service_availability",
    defaultLimitations: ["Synthetic or external monitoring may not cover every user, region, deployment, or failure mode."]
  },
  warranty_repair: {
    id: "warranty_repair",
    observationType: "warranty_repair",
    observerType: "repair_or_warranty_provider",
    metricType: "warranty_repair_behavior",
    defaultLimitations: ["Warranty and repair observations cover only the observed channel, window, and accessible records."]
  },
  field_use: {
    id: "field_use",
    observationType: "field_use",
    observerType: "customer_or_operator",
    metricType: "field_use_continuity",
    defaultLimitations: ["Field-use observations depend on operating conditions and do not prove every environment or future deployment."]
  }
};

export async function evidenceS4AttachCommand(options: Record<string, string | boolean>): Promise<void> {
  const manifestPath = stringOption(options.manifest) || "evidence/evidence-manifest.json";
  const evidenceId = requireOption(options["evidence-id"], "--evidence-id is required");
  const template = templateFromOption(options.template);
  const observerType = stringOption(options["observer-type"]) || template.observerType;
  const observerId = requireOption(options["observer-id"] ?? options["observer-origin"], "--observer-id or --observer-origin is required");
  const subjectType = requireOption(options["subject-type"], "--subject-type is required");
  const subjectId = requireOption(options["subject-id"], "--subject-id is required");
  const windowStart = requireDate(options["window-start"], "--window-start is required and must be a valid date or ISO timestamp");
  const windowEnd = requireDate(options["window-end"], "--window-end is required and must be a valid date or ISO timestamp");
  if (Date.parse(windowEnd) < Date.parse(windowStart)) throw new Error("--window-end must be on or after --window-start");
  const scopeText = requireOption(options.scope, "--scope is required");
  const rawBundleHash = requireSha256Option(options["raw-bundle-hash"], "--raw-bundle-hash is required and must be sha256:<64 hex chars>");
  const vaultUri = requireOption(options["vault-uri"], "--vault-uri is required");
  if (!isHttpUrl(vaultUri)) throw new Error("--vault-uri must be an http(s) URL");

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
  const checkedAt = timestampOption(options["checked-at"]) || new Date().toISOString();
  const issuerType = stringOption(options["issuer-type"]);
  item.s_class = "S4_REAL_WORLD_OBSERVATION";
  if (issuerType) item.issuer_type = issuerType;
  item.s4 = buildS4Metadata({
    template,
    observerType,
    observerId,
    subjectType,
    subjectId,
    credentialRef: stringOption(options["credential-ref"]),
    windowStart,
    windowEnd,
    region: parseList(options.region),
    channel: stringOption(options.channel) || "not_disclosed",
    privacyRedactionNote: stringOption(options["privacy-redaction-note"]) || "Describe redactions before publishing or sharing raw records.",
    claimRefs: resolvedClaimRefs,
    scopeText,
    limitations: limitations.length > 0 ? limitations : template.defaultLimitations,
    metricSummary: metricSummaryForTemplate(template.id, options),
    rawBundleHash,
    vaultUri,
    accessPolicy: stringOption(options["access-policy"]) || "request_required",
    rawAvailabilityStatus: stringOption(options["raw-availability-status"]) || "REQUEST_REQUIRED",
    checkedAt
  });

  validateEvidenceManifest(manifest as JsonValue);
  await writeJsonFile(manifestPath, manifest);
  console.log(`Attached S4 metadata to evidence: ${evidenceId}`);
  console.log(`Template: ${template.id}`);
  console.log("State: S4_1_OBSERVATION_SUMMARY_PROVIDED");
  console.log(`Claims: ${resolvedClaimRefs.join(", ")}`);
  console.log(`Subject: ${subjectType}:${subjectId}`);
  console.log(`Window: ${windowStart}/${windowEnd}`);
}

export async function evidenceS4TemplateCommand(options: Record<string, string | boolean>): Promise<void> {
  const template = templateFromOption(options.template);
  const claimRefs = parseList(options["claim-ids"] ?? options["claim-id"]);
  const checkedAt = timestampOption(options["checked-at"]) || "2026-05-28T00:00:00.000Z";
  const sample = {
    s_class: "S4_REAL_WORLD_OBSERVATION",
    s4: buildS4Metadata({
      template,
      observerType: stringOption(options["observer-type"]) || template.observerType,
      observerId: stringOption(options["observer-id"] ?? options["observer-origin"]) || "observer-origin-or-id",
      subjectType: stringOption(options["subject-type"]) || "product_family",
      subjectId: stringOption(options["subject-id"]) || "product-or-service-family-id",
      credentialRef: stringOption(options["credential-ref"]) || "organization-root-or-product-credential-ref",
      windowStart: stringOption(options["window-start"]) || "2026-05-01T00:00:00.000Z",
      windowEnd: stringOption(options["window-end"]) || "2026-05-31T00:00:00.000Z",
      region: parseList(options.region).length > 0 ? parseList(options.region) : ["region-or-market"],
      channel: stringOption(options.channel) || "direct/distributor/platform/customer_site",
      privacyRedactionNote: stringOption(options["privacy-redaction-note"]) || "Describe what was redacted and why.",
      claimRefs: claimRefs.length > 0 ? claimRefs : ["claim-001"],
      scopeText: stringOption(options.scope) || "Describe exactly which claim, subject, window, and metric this S4 observation supports.",
      limitations: parseList(options.limitations).length > 0 ? parseList(options.limitations) : template.defaultLimitations,
      metricSummary: metricSummaryForTemplate(template.id, options),
      rawBundleHash: stringOption(options["raw-bundle-hash"]) || "sha256:<raw-observation-bundle-manifest-hash>",
      vaultUri: stringOption(options["vault-uri"]) || "https://vault.example/evidence/observation-bundle",
      accessPolicy: stringOption(options["access-policy"]) || "request_required",
      rawAvailabilityStatus: stringOption(options["raw-availability-status"]) || "REQUEST_REQUIRED",
      checkedAt
    })
  };
  console.log(JSON.stringify(sample, null, 2));
}

function buildS4Metadata(options: {
  template: S4Template;
  observerType: string;
  observerId: string;
  subjectType: string;
  subjectId: string;
  credentialRef: string;
  windowStart: string;
  windowEnd: string;
  region: string[];
  channel: string;
  privacyRedactionNote: string;
  claimRefs: string[];
  scopeText: string;
  limitations: string[];
  metricSummary: Record<string, JsonValue>;
  rawBundleHash: string;
  vaultUri: string;
  accessPolicy: string;
  rawAvailabilityStatus: string;
  checkedAt: string;
}): Record<string, JsonValue> {
  const context: Record<string, JsonValue> = {
    channel: options.channel,
    privacy_redaction_note: options.privacyRedactionNote
  };
  if (options.region.length > 0) context.region = options.region;

  const result: Record<string, JsonValue> = {
    state: "S4_1_OBSERVATION_SUMMARY_PROVIDED",
    observation_type: options.template.observationType,
    observer: {
      type: options.observerType,
      id_or_origin: options.observerId
    },
    subject: {
      subject_type: options.subjectType,
      subject_id: options.subjectId
    },
    observation_window: {
      start: options.windowStart,
      end: options.windowEnd
    },
    observation_context: context,
    metric_type: options.template.metricType,
    metric_summary: options.metricSummary,
    organization_claimed_support: {
      support_type: "supports_claim",
      claim_refs: options.claimRefs,
      scope_text: options.scopeText,
      limitations: options.limitations
    },
    raw_evidence: {
      bundle_hash: options.rawBundleHash,
      vaults: [
        {
          type: "evidence_vault",
          uri: options.vaultUri,
          access_policy: options.accessPolicy,
          raw_availability_status: options.rawAvailabilityStatus
        }
      ]
    },
    health: {
      last_checked_at: options.checkedAt,
      maintenance_status: "FRESH"
    }
  };
  if (options.credentialRef) result.organization_root_or_credential_ref = options.credentialRef;
  return result;
}

function metricSummaryForTemplate(template: S4TemplateId, options: Record<string, string | boolean>): Record<string, JsonValue> {
  if (template === "service_uptime") {
    return {
      monitoring_window: stringOption(options["monitoring-window"]) || "same_as_observation_window",
      regions_or_environments: parseList(options["regions-or-environments"]).length > 0 ? parseList(options["regions-or-environments"]) : parseList(options.region),
      availability_observations: nonNegativeNumberOption(options["availability-observations"]),
      incident_count: nonNegativeNumberOption(options["incident-count"]),
      degraded_period_count: nonNegativeNumberOption(options["degraded-period-count"]),
      support_response_observations: nonNegativeNumberOption(options["support-response-observations"]),
      measurement_method: stringOption(options["measurement-method"]) || "Describe probe frequency, probe locations, and failure criteria."
    };
  }
  if (template === "warranty_repair") {
    return {
      observed_unit_count: nonNegativeNumberOption(options["observed-unit-count"]),
      warranty_claim_count: nonNegativeNumberOption(options["warranty-claim-count"]),
      repair_count: nonNegativeNumberOption(options["repair-count"]),
      replacement_count: nonNegativeNumberOption(options["replacement-count"]),
      unresolved_issue_count: nonNegativeNumberOption(options["unresolved-issue-count"]),
      average_repair_time_days: nonNegativeNumberOption(options["average-repair-time-days"])
    };
  }
  if (template === "field_use") {
    return {
      observed_deployment_count: nonNegativeNumberOption(options["observed-deployment-count"]),
      usage_hours_observed: nonNegativeNumberOption(options["usage-hours-observed"]),
      failure_count: nonNegativeNumberOption(options["failure-count"]),
      maintenance_event_count: nonNegativeNumberOption(options["maintenance-event-count"]),
      unresolved_issue_count: nonNegativeNumberOption(options["unresolved-issue-count"])
    };
  }
  return {
    order_count: nonNegativeNumberOption(options["order-count"]),
    on_time_delivery_count: nonNegativeNumberOption(options["on-time-delivery-count"]),
    delayed_delivery_count: nonNegativeNumberOption(options["delayed-delivery-count"]),
    partial_delivery_count: nonNegativeNumberOption(options["partial-delivery-count"]),
    quality_issue_count: nonNegativeNumberOption(options["quality-issue-count"]),
    support_or_correction_count: nonNegativeNumberOption(options["support-or-correction-count"]),
    major_incident_count: nonNegativeNumberOption(options["major-incident-count"])
  };
}

function templateFromOption(value: string | boolean | undefined): S4Template {
  const template = stringOption(value) || "order_delivery";
  if (isS4TemplateId(template)) return S4_TEMPLATES[template];
  throw new Error(`--template must be one of: ${Object.keys(S4_TEMPLATES).join(", ")}`);
}

function isS4TemplateId(value: string): value is S4TemplateId {
  return Object.prototype.hasOwnProperty.call(S4_TEMPLATES, value);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

function requireDate(value: string | boolean | undefined, message: string): string {
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

function requireSha256Option(value: string | boolean | undefined, message: string): string {
  const digest = stringOption(value);
  if (!/^sha256:[0-9a-f]{64}$/i.test(digest)) throw new Error(message);
  return digest.toLowerCase();
}

function nonNegativeNumberOption(value: string | boolean | undefined): number {
  const string = stringOption(value);
  if (!string) return 0;
  const number = Number(string);
  if (!Number.isFinite(number) || number < 0) throw new Error("Numeric metric option must be a non-negative number");
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

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
