type ObservationRoute = "S3_RECOMMENDED" | "S4_RECOMMENDED" | "MIXED_S3_S4" | "ROUTING_UNCLEAR";

interface ObservationTemplateOutput {
  type: "OrgAnchorObservationTemplate";
  version: "1.0";
  route: ObservationRoute;
  generated_at: string;
  templates: Record<string, unknown>[];
  clarification_questions: string[];
  next_actions: string[];
  user_confirmation_required: true;
  not_a_trust_decision: true;
}

export async function evidenceObserveTemplateCommand(options: Record<string, string | boolean>): Promise<void> {
  const route = parseRoute(options.route);
  const generatedAt = new Date().toISOString();
  const templates = buildTemplates(route, options, generatedAt);
  const output: ObservationTemplateOutput = {
    type: "OrgAnchorObservationTemplate",
    version: "1.0",
    route,
    generated_at: generatedAt,
    templates,
    clarification_questions: route === "ROUTING_UNCLEAR" ? unclearQuestions() : [],
    next_actions: nextActions(route),
    user_confirmation_required: true,
    not_a_trust_decision: true
  };
  console.log(JSON.stringify(output, null, 2));
}

function buildTemplates(route: ObservationRoute, options: Record<string, string | boolean>, generatedAt: string): Record<string, unknown>[] {
  if (route === "S3_RECOMMENDED") return [buildS3Template(options, generatedAt)];
  if (route === "S4_RECOMMENDED") return [buildS4Template(options, generatedAt)];
  if (route === "MIXED_S3_S4") return [buildS3Template(options, generatedAt), buildS4Template(options, generatedAt)];
  return [];
}

function buildS3Template(options: Record<string, string | boolean>, generatedAt: string): Record<string, unknown> {
  const subjectType = stringOption(options["subject-type"]) || "product_model";
  const subjectId = stringOption(options["subject-id"]) || "model-or-service-id";
  const claimId = stringOption(options["claim-id"]) || "claim-001";
  const observerType = stringOption(options["observer-type"]) || "buyer";
  const templateId = s3TemplateId(options.template);
  return {
    route: "S3_RECOMMENDED",
    template_id: templateId,
    purpose: "Concrete sample conformance: one sample, batch, unit, delivered artifact, API probe, or acceptance item is checked against a stated claim.",
    implementation_status: "attach_command_available",
    suggested_attach_command:
      `organchor evidence s3 attach --evidence-id evidence-001 --template ${templateId} --sampler-type ${observerType} ` +
      `--acquired-at ${generatedAt} --subject-type ${subjectType} --subject-id ${subjectId} --scope "Sample observation supports ${claimId} for ${subjectId}"`,
    required_before_publish: [
      "evidence item id",
      "claim id",
      "sample source and selector",
      "acquisition timestamp",
      "sample identity",
      "test, inspection, measurement, or acceptance method",
      "raw evidence hash and location or vault"
    ],
    evidence_item_patch: {
      s_class: "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING",
      issuer_type: "third_party",
      relations: [
        {
          type: "supports_claim",
          claim_id: claimId
        }
      ],
      s3: {
        state: "S3_1_SAMPLING_ROUTE_PROVIDED",
        sample_type: templateId,
        sampler: {
          type: observerType,
          name: "observer-or-sampler-name"
        },
        sample_identity: {
          subject_type: subjectType,
          subject_id: subjectId,
          batch_id: "batch-or-lot-id-if-known",
          serial_or_unit_id: "serial-or-unit-id-if-known"
        },
        sampling_event: {
          acquired_at: generatedAt,
          acquisition_channel: acquisitionChannelForS3(templateId),
          sample_source: sampleSourceForS3(templateId),
          selected_by: observerType,
          organization_provided_sample: false,
          sampling_method: samplingMethodForS3(templateId),
          sample_size: 1
        },
        custody: {
          custody_documented: false,
          custody_notes: "Describe custody handoff, packaging state, and who held the sample before testing."
        },
        organization_claimed_support: {
          support_type: "supports_claim",
          claim_refs: [claimId],
          scope_text: `Sample observation supports ${claimId} for ${subjectId}.`,
          limitations: ["One sample does not prove all batches, regions, channels, or future production."]
        },
        raw_evidence: {
          bundle_hash: "sha256:<raw-bundle-or-report-hash>",
          locations_or_vaults: [
            {
              type: "evidence_vault",
              uri: stringOption(options["vault-uri"]) || "https://vault.example/evidence/sample-bundle",
              access_policy: "request_required"
            }
          ]
        },
        health: {
          last_checked_at: generatedAt,
          maintenance_status: "DRAFT"
        }
      }
    }
  };
}

function buildS4Template(options: Record<string, string | boolean>, generatedAt: string): Record<string, unknown> {
  const subjectType = stringOption(options["subject-type"]) || "product_family";
  const subjectId = stringOption(options["subject-id"]) || "product-or-service-family-id";
  const claimId = stringOption(options["claim-id"]) || "claim-001";
  const observerType = stringOption(options["observer-type"]) || "buyer_or_buyer_agent";
  const templateId = s4TemplateId(options.template);
  return {
    route: "S4_RECOMMENDED",
    template_id: templateId,
    purpose: "Performance continuity: delivery, operation, usage, support, repair, uptime, supply, or service behavior is observed over a time window.",
    implementation_status: "attach_command_available",
    suggested_attach_command:
      `organchor evidence s4 attach --evidence-id evidence-001 --template ${templateId} --observer-id observer.example ` +
      `--window-start YYYY-MM-DD --window-end YYYY-MM-DD --subject-type ${subjectType} --subject-id ${subjectId} ` +
      `--scope "Observed continuity supports ${claimId} for ${subjectId}" --raw-bundle-hash sha256:<64-hex> --vault-uri https://vault.example/evidence/observation-bundle`,
    required_before_publish: [
      "observer identity or origin",
      "subject binding",
      "observation window",
      "metric definitions",
      "metric numerator and denominator where applicable",
      "raw evidence hash and location or vault",
      "privacy and redaction policy"
    ],
    evidence_item_patch: {
      s_class: "S4_REAL_WORLD_OBSERVATION",
      issuer_type: "third_party",
      relations: [
        {
          type: "supports_claim",
          claim_id: claimId
        }
      ],
      s4: {
        state: "S4_1_OBSERVATION_SUMMARY_PROVIDED",
        observation_type: templateId,
        observer: {
          type: observerType,
          id_or_origin: "observer-origin-or-id"
        },
        subject: {
          subject_type: subjectType,
          subject_id: subjectId
        },
        organization_root_or_credential_ref: "organization-root-or-product-credential-ref",
        observation_window: {
          start: stringOption(options["window-start"]) || "YYYY-MM-DD",
          end: stringOption(options["window-end"]) || "YYYY-MM-DD"
        },
        observation_context: {
          region: ["region-or-market"],
          channel: "direct/distributor/platform/customer_site",
          privacy_redaction_note: "Describe what was redacted and why."
        },
        metric_type: metricTypeForS4(templateId),
        metric_summary: metricSummaryForS4(templateId),
        raw_evidence: {
          bundle_hash: "sha256:<raw-observation-bundle-manifest-hash>",
          vaults: [
            {
              type: "evidence_vault",
              uri: stringOption(options["vault-uri"]) || "https://vault.example/evidence/observation-bundle",
              access_policy: "request_required",
              raw_availability_status: "REQUEST_REQUIRED"
            }
          ]
        },
        limitations: [
          "This observation covers only the stated subject, observer, window, channel, and available raw records.",
          "It does not guarantee future delivery, support, uptime, supply continuity, or all customer outcomes."
        ],
        health: {
          last_checked_at: generatedAt,
          maintenance_status: "DRAFT"
        }
      }
    }
  };
}

function parseRoute(value: string | boolean | undefined): ObservationRoute {
  const route = stringOption(value).toUpperCase();
  if (route === "S3" || route === "S3_RECOMMENDED") return "S3_RECOMMENDED";
  if (route === "S4" || route === "S4_RECOMMENDED") return "S4_RECOMMENDED";
  if (route === "MIXED" || route === "MIXED_S3_S4") return "MIXED_S3_S4";
  if (route === "UNCLEAR" || route === "ROUTING_UNCLEAR") return "ROUTING_UNCLEAR";
  throw new Error("--route is required and must be one of: S3_RECOMMENDED, S4_RECOMMENDED, MIXED_S3_S4, ROUTING_UNCLEAR");
}

function s3TemplateId(value: string | boolean | undefined): string {
  const template = stringOption(value) || "market_purchase";
  if (["market_purchase", "distributor_sampling", "warehouse_sampling", "customer_site_sampling"].includes(template)) return template;
  throw new Error("--template for S3 must be one of: market_purchase, distributor_sampling, warehouse_sampling, customer_site_sampling");
}

function s4TemplateId(value: string | boolean | undefined): string {
  const template = stringOption(value) || "order_delivery";
  if (["order_delivery", "service_uptime", "warranty_repair", "field_use"].includes(template)) return template;
  throw new Error("--template for S4 must be one of: order_delivery, service_uptime, warranty_repair, field_use");
}

function acquisitionChannelForS3(templateId: string): string {
  if (templateId === "distributor_sampling") return "distributor";
  if (templateId === "warehouse_sampling") return "warehouse";
  if (templateId === "customer_site_sampling") return "customer_site";
  return "retail_market";
}

function sampleSourceForS3(templateId: string): string {
  if (templateId === "distributor_sampling") return "distributor_inventory";
  if (templateId === "warehouse_sampling") return "warehouse_inventory";
  if (templateId === "customer_site_sampling") return "customer_site";
  return "retail_market";
}

function samplingMethodForS3(templateId: string): string {
  if (templateId === "distributor_sampling") return "random_inventory_sample";
  if (templateId === "warehouse_sampling") return "random_warehouse_sample";
  if (templateId === "customer_site_sampling") return "customer_site_sample_acquisition";
  return "random_purchase";
}

function metricTypeForS4(templateId: string): string {
  if (templateId === "service_uptime") return "service_availability";
  if (templateId === "warranty_repair") return "warranty_repair_behavior";
  if (templateId === "field_use") return "field_use_continuity";
  return "order_delivery_performance";
}

function metricSummaryForS4(templateId: string): Record<string, unknown> {
  if (templateId === "service_uptime") {
    return {
      monitoring_window: "same_as_observation_window",
      regions_or_environments: ["region-or-environment"],
      availability_observations: 0,
      incident_count: 0,
      degraded_period_count: 0,
      support_response_observations: 0,
      measurement_method: "Describe probe frequency, probe locations, and failure criteria."
    };
  }
  if (templateId === "warranty_repair") {
    return {
      observed_unit_count: 0,
      warranty_claim_count: 0,
      repair_count: 0,
      replacement_count: 0,
      unresolved_issue_count: 0,
      average_repair_time_days: null
    };
  }
  if (templateId === "field_use") {
    return {
      observed_deployment_count: 0,
      usage_hours_observed: 0,
      failure_count: 0,
      maintenance_event_count: 0,
      unresolved_issue_count: 0
    };
  }
  return {
    order_count: 0,
    on_time_delivery_count: 0,
    delayed_delivery_count: 0,
    partial_delivery_count: 0,
    quality_issue_count: 0,
    support_or_correction_count: 0,
    major_incident_count: 0
  };
}

function unclearQuestions(): string[] {
  return [
    "What exact product, service, model, batch, unit, deployment, API, or project deliverable is this about?",
    "Is the material mainly about a concrete sample/result, or behavior over a time window?",
    "What method, observation window, metric, and raw evidence bundle support the record?",
    "Who observed, selected, tested, measured, or controlled the underlying evidence?"
  ];
}

function nextActions(route: ObservationRoute): string[] {
  if (route === "S3_RECOMMENDED") {
    return [
      "Create or identify the evidence item that will hold the raw report or receipt.",
      "Fill the S3 fields, then use organchor evidence s3 attach.",
      "Run organchor value audit to expose remaining sample-route gaps."
    ];
  }
  if (route === "S4_RECOMMENDED") {
    return [
      "Create or identify the evidence item that will hold the S4 observation receipt or summary.",
      "Fill the S4 fields, then use organchor evidence s4 attach.",
      "Publish only small receipts, summaries, hashes, and vault pointers publicly."
    ];
  }
  if (route === "MIXED_S3_S4") {
    return [
      "Split the material into a sample-conformance record and a performance-continuity record.",
      "Do not combine sample test results and time-window performance metrics into one ambiguous evidence item.",
      "Use the S3 attach path for the S3 part and the S4 attach path for the S4 part."
    ];
  }
  return [
    "Clarify the subject, method, observer, time window, and intended claim.",
    "Run organchor evidence observe route again with the more specific description."
  ];
}

function stringOption(value: string | boolean | undefined): string {
  return typeof value === "string" ? value : "";
}
