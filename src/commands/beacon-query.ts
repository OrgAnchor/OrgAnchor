import { writeJsonFile } from "../core/files.ts";
import type { JsonValue } from "../core/json.ts";
import {
  readBeaconLocalIndex,
  type BeaconLocalIndex,
  type BeaconLocalIndexRecord
} from "./beacon-index.ts";
import type { BeaconConformanceStatus, BeaconInspectStatus } from "./beacon-inspect.ts";

type CandidatePriority = "HIGH" | "MEDIUM" | "REVIEW" | "LOW" | "REJECT";
type NeedMatchStatus =
  | "STRONG_DISCOVERY_MATCH"
  | "POSSIBLE_DISCOVERY_MATCH"
  | "NEEDS_IDENTITY_VERIFICATION"
  | "NEEDS_VALUE_REVIEW"
  | "REJECT_OR_RECHECK";

interface BeaconQueryFilters {
  need: string | null;
  q: string | null;
  categories: string[];
  capabilities: string[];
  regions: string[];
  languages: string[];
  statuses: BeaconInspectStatus[];
  conformance_statuses: BeaconConformanceStatus[];
  identity_statuses: string[];
  value_statuses: string[];
  limit: number | null;
}

interface BeaconQueryCandidate {
  origin: string;
  candidate_priority: CandidatePriority;
  organization: {
    name: string | null;
    display_name: string | null;
  };
  discovery: {
    categories: string[];
    capabilities: string[];
    regions: string[];
    languages: string[];
  };
  verification_summary: {
    status: BeaconInspectStatus;
    conformance_status: BeaconConformanceStatus;
    identity_status: string | null;
    value_status: string | null;
    policy_route: string | null;
    root_authority_hash: string | null;
    statement_hash: string | null;
    last_checked_at: string;
    seen_count: number;
  };
  match_explanation: {
    summary: string;
    matched_filters: string[];
  };
  need_match: {
    status: NeedMatchStatus;
    rationale: string[];
    limitations: string[];
    next_best_action: string;
  };
  risk_gaps: {
    code: string;
    severity: "INFO" | "WARN" | "FAIL";
    detail: string;
    next_action: string;
  }[];
  verification_plan: string[];
  next_step: string;
}

interface BeaconQueryResult {
  type: "OrgAnchorBeaconQueryResult";
  version: "0.1";
  index: {
    path: string;
    generated_at: string;
    total_origins: number;
  };
  trust_boundary: {
    local_index_is_trust_root: false;
    final_trust_decision: "EXTERNAL_AGENT";
    records_must_verify_at_origin: true;
  };
  filters: BeaconQueryFilters;
  match_report: {
    type: "OrgAnchorBeaconNeedMatchReport";
    version: "0.1";
    request: {
      need: string | null;
      q: string | null;
      explicit_filters: string[];
    };
    boundary: {
      discovery_match_is_not_recommendation: true;
      no_paid_ranking: true;
      final_decision: "EXTERNAL_AGENT";
    };
    summary: {
      high_priority_candidates: number;
      review_candidates: number;
      rejected_candidates: number;
      strongest_candidate_origins: string[];
      no_results: boolean;
    };
    recommended_actions: string[];
  };
  counts: {
    total_records: number;
    matched_records: number;
    returned_records: number;
  };
  candidates: BeaconQueryCandidate[];
}

export async function beaconQueryCommand(options: Record<string, string | boolean>): Promise<void> {
  const indexPath = typeof options.index === "string" ? options.index : typeof options._ === "string" ? options._ : "";
  if (!indexPath) throw new Error("beacon query requires --index <beacon-index.json>");
  const filters = parseFilters(options);
  const index = await readBeaconLocalIndex(indexPath);
  const result = queryIndex(indexPath, index, filters);
  if (typeof options.out === "string") {
    await writeJsonFile(options.out, result as unknown as JsonValue);
  }
  console.log(JSON.stringify(result, null, 2));
}

function queryIndex(indexPath: string, index: BeaconLocalIndex, filters: BeaconQueryFilters): BeaconQueryResult {
  const matched = index.records
    .filter((record) => recordMatchesFilters(record, filters))
    .sort(compareRecords);
  const returned = filters.limit === null ? matched : matched.slice(0, filters.limit);
  const candidates = returned.map((record) => candidateFromRecord(record, filters));
  return {
    type: "OrgAnchorBeaconQueryResult",
    version: "0.1",
    index: {
      path: indexPath,
      generated_at: index.generated_at,
      total_origins: index.counts.total_origins
    },
    trust_boundary: {
      local_index_is_trust_root: false,
      final_trust_decision: "EXTERNAL_AGENT",
      records_must_verify_at_origin: true
    },
    filters,
    match_report: buildMatchReport(filters, candidates),
    counts: {
      total_records: index.records.length,
      matched_records: matched.length,
      returned_records: returned.length
    },
    candidates
  };
}

function parseFilters(options: Record<string, string | boolean>): BeaconQueryFilters {
  return {
    need: typeof options.need === "string" ? options.need.trim() || null : null,
    q: typeof options.q === "string" ? options.q.trim() || null : null,
    categories: parseStringList(options.category ?? options.categories, "category"),
    capabilities: parseStringList(options.capability ?? options.capabilities, "capability"),
    regions: parseStringList(options.region ?? options.regions, "region"),
    languages: parseStringList(options.language ?? options.languages, "language"),
    statuses: parseEnumList(options.status, "status", ["PASS", "WARN", "FAIL"]) as BeaconInspectStatus[],
    conformance_statuses: parseEnumList(
      options.conformance ?? options["conformance-status"],
      "conformance",
      [
        "CLAIMED_SIGNAL",
        "BEACON_SHAPE_PASS",
        "IDENTITY_VERIFY_PASS",
        "VALUE_VERIFY_PASS",
        "FULL_COMPATIBLE",
        "PARTIAL",
        "FAILED"
      ]
    ) as BeaconConformanceStatus[],
    identity_statuses: parseStringList(options["identity-status"], "identity-status").map((value) => value.toUpperCase()),
    value_statuses: parseStringList(options["value-status"], "value-status").map((value) => value.toUpperCase()),
    limit: parseLimit(options.limit)
  };
}

function recordMatchesFilters(record: BeaconLocalIndexRecord, filters: BeaconQueryFilters): boolean {
  const discovery = discoveryOf(record);
  return (
    matchesQuery(record, filters.need) &&
    matchesQuery(record, filters.q) &&
    matchesAny(discovery.categories, filters.categories) &&
    matchesAny(discovery.capabilities, filters.capabilities) &&
    matchesAny(discovery.regions, filters.regions) &&
    matchesAny(discovery.languages, filters.languages) &&
    matchesExact(record.status, filters.statuses) &&
    matchesExact(record.conformance_status, filters.conformance_statuses) &&
    matchesNullableExact(record.identity_status, filters.identity_statuses) &&
    matchesNullableExact(record.value_status, filters.value_statuses)
  );
}

function candidateFromRecord(record: BeaconLocalIndexRecord, filters: BeaconQueryFilters): BeaconQueryCandidate {
  const organization = organizationOf(record);
  const discovery = discoveryOf(record);
  return {
    origin: record.origin,
    candidate_priority: candidatePriority(record),
    organization,
    discovery,
    verification_summary: {
      status: record.status,
      conformance_status: record.conformance_status,
      identity_status: record.identity_status,
      value_status: record.value_status,
      policy_route: record.policy_route ?? null,
      root_authority_hash: record.root_authority_hash,
      statement_hash: record.statement_hash,
      last_checked_at: record.last_checked_at,
      seen_count: record.seen_count
    },
    match_explanation: matchExplanation(record, filters),
    need_match: needMatch(record, filters),
    risk_gaps: riskGapsForRecord(record),
    verification_plan: verificationPlan(record),
    next_step: `organchor verify url ${record.origin} --brief`
  };
}

function candidatePriority(record: BeaconLocalIndexRecord): CandidatePriority {
  if (record.status === "FAIL" || record.conformance_status === "FAILED" || record.identity_status === "FAIL") return "REJECT";
  if (record.conformance_status === "FULL_COMPATIBLE" && record.identity_status === "PASS" && record.value_status === "PASS") return "HIGH";
  if (record.identity_status === "PASS" && record.value_status === "PASS") return "MEDIUM";
  if (record.identity_status === "PASS" || record.value_status === "WARN" || record.conformance_status === "PARTIAL") return "REVIEW";
  if (record.conformance_status === "CLAIMED_SIGNAL" || record.conformance_status === "BEACON_SHAPE_PASS") return "LOW";
  return "LOW";
}

function matchExplanation(record: BeaconLocalIndexRecord, filters: BeaconQueryFilters): BeaconQueryCandidate["match_explanation"] {
  const matched: string[] = [];
  const discovery = discoveryOf(record);
  if (filters.need) {
    const terms = matchedQueryTerms(record, filters.need);
    matched.push(terms.length > 0 ? `need terms: ${terms.join(", ")}` : `need: ${filters.need}`);
  }
  if (filters.q) {
    const terms = matchedQueryTerms(record, filters.q);
    matched.push(terms.length > 0 ? `q terms: ${terms.join(", ")}` : `q: ${filters.q}`);
  }
  addListMatches(matched, "category", discovery.categories, filters.categories);
  addListMatches(matched, "capability", discovery.capabilities, filters.capabilities);
  addListMatches(matched, "region", discovery.regions, filters.regions);
  addListMatches(matched, "language", discovery.languages, filters.languages);
  addExactMatch(matched, "status", record.status, filters.statuses);
  addExactMatch(matched, "conformance", record.conformance_status, filters.conformance_statuses);
  addNullableExactMatch(matched, "identity-status", record.identity_status, filters.identity_statuses);
  addNullableExactMatch(matched, "value-status", record.value_status, filters.value_statuses);
  if (matched.length === 0) {
    matched.push("No explicit filters were supplied; candidate was returned from the local Beacon index.");
  }
  return {
    summary: `${displayName(record)} was returned from a local Beacon index. The index is not a trust root; verify directly at ${record.origin}.`,
    matched_filters: matched
  };
}

function needMatch(record: BeaconLocalIndexRecord, filters: BeaconQueryFilters): BeaconQueryCandidate["need_match"] {
  const priority = candidatePriority(record);
  const rationale = matchExplanation(record, filters).matched_filters;
  const limitations: string[] = [
    "This is a discovery match only, not a recommendation or trust decision.",
    "The local Beacon index is a cached observation and must be checked against the origin."
  ];
  if (filters.need && matchedQueryTerms(record, filters.need).length === 0) {
    limitations.push("The free-text need did not directly match indexed organization or discovery terms; explicit filters may be carrying the match.");
  }
  if (record.identity_status !== "PASS") {
    return {
      status: priority === "REJECT" ? "REJECT_OR_RECHECK" : "NEEDS_IDENTITY_VERIFICATION",
      rationale,
      limitations,
      next_best_action: `Run organchor verify url ${record.origin} --brief and require identity PASS before contact decisions.`
    };
  }
  if (priority === "REJECT") {
    return {
      status: "REJECT_OR_RECHECK",
      rationale,
      limitations,
      next_best_action: `Run organchor beacon inspect ${record.origin}; only reconsider if failing checks are repaired.`
    };
  }
  if (record.value_status !== "PASS") {
    return {
      status: "NEEDS_VALUE_REVIEW",
      rationale,
      limitations,
      next_best_action: "Review signed claims, evidence, and value continuity artifacts before treating this as a fit."
    };
  }
  return {
    status: priority === "HIGH" ? "STRONG_DISCOVERY_MATCH" : "POSSIBLE_DISCOVERY_MATCH",
    rationale,
    limitations,
    next_best_action: `Run organchor verify url ${record.origin} for full checks, then apply the requesting agent's own policy.`
  };
}

function buildMatchReport(
  filters: BeaconQueryFilters,
  candidates: BeaconQueryCandidate[]
): BeaconQueryResult["match_report"] {
  const highPriority = candidates.filter((candidate) => candidate.candidate_priority === "HIGH").length;
  const review = candidates.filter((candidate) => candidate.candidate_priority === "REVIEW").length;
  const rejected = candidates.filter((candidate) => candidate.candidate_priority === "REJECT").length;
  const strongest = candidates
    .filter((candidate) => candidate.candidate_priority === "HIGH" || candidate.candidate_priority === "MEDIUM")
    .slice(0, 5)
    .map((candidate) => candidate.origin);
  return {
    type: "OrgAnchorBeaconNeedMatchReport",
    version: "0.1",
    request: {
      need: filters.need,
      q: filters.q,
      explicit_filters: explicitFilters(filters)
    },
    boundary: {
      discovery_match_is_not_recommendation: true,
      no_paid_ranking: true,
      final_decision: "EXTERNAL_AGENT"
    },
    summary: {
      high_priority_candidates: highPriority,
      review_candidates: review,
      rejected_candidates: rejected,
      strongest_candidate_origins: strongest,
      no_results: candidates.length === 0
    },
    recommended_actions: recommendedActions(candidates)
  };
}

function riskGapsForRecord(record: BeaconLocalIndexRecord): BeaconQueryCandidate["risk_gaps"] {
  const risks: BeaconQueryCandidate["risk_gaps"] = [];
  if (record.status === "FAIL" || record.conformance_status === "FAILED") {
    risks.push({
      code: "BEACON_VERIFICATION_FAILED",
      severity: "FAIL",
      detail: "The local index says Beacon inspection failed.",
      next_action: `Do not rely on this candidate until organchor beacon inspect ${record.origin} passes.`
    });
  }
  if (record.conformance_status === "CLAIMED_SIGNAL" || record.conformance_status === "BEACON_SHAPE_PASS") {
    risks.push({
      code: "SIGNAL_ONLY",
      severity: "WARN",
      detail: "The origin has a discoverable signal, but strict identity verification has not passed in the index.",
      next_action: `Run organchor verify url ${record.origin} --brief before treating it as an adopter.`
    });
  }
  if (record.identity_status === "FAIL") {
    risks.push({
      code: "IDENTITY_FAILED",
      severity: "FAIL",
      detail: "Strict identity verification failed in the indexed result.",
      next_action: "Reject this candidate until signatures and hashes verify."
    });
  } else if (record.identity_status !== "PASS") {
    risks.push({
      code: "IDENTITY_NOT_VERIFIED",
      severity: "WARN",
      detail: "Strict identity verification is missing or incomplete in the indexed result.",
      next_action: `Run organchor verify url ${record.origin} --brief.`
    });
  }
  if (record.value_status === "FAIL") {
    risks.push({
      code: "VALUE_FAILED",
      severity: "FAIL",
      detail: "Value evidence verification failed in the indexed result.",
      next_action: "Do not rely on product or service claims until the value layer is repaired."
    });
  } else if (record.value_status === "WARN" || record.conformance_status === "PARTIAL") {
    risks.push({
      code: "VALUE_REQUIRES_REVIEW",
      severity: "WARN",
      detail: "The value layer has warnings or only partial compatibility.",
      next_action: "Review signed claims, evidence, and the value continuity report before transaction decisions."
    });
  } else if (record.value_status !== "PASS") {
    risks.push({
      code: "VALUE_LAYER_INCOMPLETE",
      severity: "WARN",
      detail: "Value evidence is missing or not verified in the indexed result.",
      next_action: "Ask for signed claims, evidence, and a value continuity report if product/service evaluation matters."
    });
  }
  for (const code of record.risk_gap_codes ?? []) {
    risks.push({
      code,
      severity: severityForRiskCode(code),
      detail: `Beacon inspection reported risk code ${code}.`,
      next_action: "Review the full Beacon inspection result before using this candidate."
    });
  }
  if (risks.length === 0) {
    risks.push({
      code: "DIRECT_ORIGIN_VERIFICATION_REQUIRED",
      severity: "INFO",
      detail: "The local index has no obvious warning, but it is still only a cached observation.",
      next_action: `Run organchor verify url ${record.origin} --brief before relying on this candidate.`
    });
  }
  return dedupeRisks(risks);
}

function verificationPlan(record: BeaconLocalIndexRecord): string[] {
  return [
    `Run organchor beacon inspect ${record.origin}.`,
    `Run organchor verify url ${record.origin} --brief.`,
    `If still relevant, run organchor verify url ${record.origin} for full checks.`,
    "Review risk_gaps and apply the requesting agent's own external policy."
  ];
}

function recommendedActions(candidates: BeaconQueryCandidate[]): string[] {
  if (candidates.length === 0) {
    return [
      "Relax discovery filters or collect more seed origins before concluding no suitable organization exists.",
      "Do not treat an empty local index as evidence that no adopter exists on the open web."
    ];
  }
  const first = candidates[0];
  if (!first) return [];
  const actions = [
    `Start with ${first.origin}: ${first.next_step}.`,
    "Run full origin verification before outreach, listing, procurement, or transaction decisions.",
    "Review each candidate's risk_gaps and apply the requesting agent's own external policy."
  ];
  if (candidates.some((candidate) => candidate.need_match.status === "NEEDS_VALUE_REVIEW")) {
    actions.push("For value-layer warnings, request or inspect signed claims, evidence manifests, and value continuity reports.");
  }
  return actions;
}

function compareRecords(a: BeaconLocalIndexRecord, b: BeaconLocalIndexRecord): number {
  const priorityDelta = priorityRank(candidatePriority(a)) - priorityRank(candidatePriority(b));
  if (priorityDelta !== 0) return priorityDelta;
  const checkedDelta = b.last_checked_at.localeCompare(a.last_checked_at);
  if (checkedDelta !== 0) return checkedDelta;
  return a.origin.localeCompare(b.origin);
}

function priorityRank(priority: CandidatePriority): number {
  return {
    HIGH: 0,
    MEDIUM: 1,
    REVIEW: 2,
    LOW: 3,
    REJECT: 4
  }[priority];
}

function parseStringList(value: string | boolean | undefined, label: string): string[] {
  if (value === undefined) return [];
  if (typeof value !== "string") throw new Error(`--${label} requires a value`);
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function parseEnumList(value: string | boolean | undefined, label: string, allowed: string[]): string[] {
  const allowedSet = new Set(allowed);
  return parseStringList(value, label).map((item) => {
    const normalized = item.toUpperCase();
    if (!allowedSet.has(normalized)) {
      throw new Error(`--${label} must be one of: ${allowed.join(", ")}`);
    }
    return normalized;
  });
}

function parseLimit(value: string | boolean | undefined): number | null {
  if (value === undefined) return null;
  if (typeof value !== "string") throw new Error("--limit requires a value");
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("--limit must be a positive integer");
  return parsed;
}

function matchesQuery(record: BeaconLocalIndexRecord, query: string | null): boolean {
  if (!query) return true;
  const terms = queryTerms(query);
  if (terms.length === 0) return true;
  const haystack = [
    record.origin,
    organizationOf(record).name,
    organizationOf(record).display_name,
    ...discoveryOf(record).categories,
    ...discoveryOf(record).capabilities,
    ...discoveryOf(record).regions,
    ...discoveryOf(record).languages
  ].filter((value): value is string => Boolean(value)).join(" ").toLowerCase();
  return terms.some((term) => haystack.includes(term));
}

function matchesAny(values: string[], filters: string[]): boolean {
  if (filters.length === 0) return true;
  const normalized = new Set(values.map((value) => value.toLowerCase()));
  return filters.some((filter) => normalized.has(filter.toLowerCase()));
}

function matchesExact<T extends string>(value: T, filters: T[]): boolean {
  return filters.length === 0 || filters.includes(value);
}

function matchesNullableExact(value: string | null, filters: string[]): boolean {
  return filters.length === 0 || (value !== null && filters.includes(value.toUpperCase()));
}

function addListMatches(output: string[], label: string, values: string[], filters: string[]): void {
  if (filters.length === 0) return;
  const normalized = new Set(values.map((value) => value.toLowerCase()));
  const matched = filters.filter((filter) => normalized.has(filter.toLowerCase()));
  if (matched.length > 0) output.push(`${label}: ${matched.join(", ")}`);
}

function addExactMatch<T extends string>(output: string[], label: string, value: T, filters: T[]): void {
  if (filters.length === 0) return;
  if (filters.includes(value)) output.push(`${label}: ${value}`);
}

function addNullableExactMatch(output: string[], label: string, value: string | null, filters: string[]): void {
  if (filters.length === 0 || value === null) return;
  if (filters.includes(value.toUpperCase())) output.push(`${label}: ${value}`);
}

function organizationOf(record: BeaconLocalIndexRecord): BeaconLocalIndexRecord["organization"] {
  return record.organization ?? {
    name: null,
    display_name: null
  };
}

function discoveryOf(record: BeaconLocalIndexRecord): BeaconLocalIndexRecord["discovery"] {
  return record.discovery ?? {
    categories: [],
    capabilities: [],
    regions: [],
    languages: []
  };
}

function displayName(record: BeaconLocalIndexRecord): string {
  const organization = organizationOf(record);
  return organization.display_name ?? organization.name ?? record.origin;
}

function matchedQueryTerms(record: BeaconLocalIndexRecord, query: string): string[] {
  const terms = queryTerms(query);
  const haystack = [
    record.origin,
    organizationOf(record).name,
    organizationOf(record).display_name,
    ...discoveryOf(record).categories,
    ...discoveryOf(record).capabilities,
    ...discoveryOf(record).regions,
    ...discoveryOf(record).languages
  ].filter((value): value is string => Boolean(value)).join(" ").toLowerCase();
  return terms.filter((term) => haystack.includes(term));
}

function queryTerms(query: string): string[] {
  const stopwords = new Set([
    "a",
    "an",
    "and",
    "are",
    "for",
    "from",
    "in",
    "need",
    "needs",
    "of",
    "or",
    "the",
    "to",
    "with"
  ]);
  return Array.from(new Set(query
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2 && !stopwords.has(term))));
}

function explicitFilters(filters: BeaconQueryFilters): string[] {
  const output: string[] = [];
  addExplicitList(output, "category", filters.categories);
  addExplicitList(output, "capability", filters.capabilities);
  addExplicitList(output, "region", filters.regions);
  addExplicitList(output, "language", filters.languages);
  addExplicitList(output, "status", filters.statuses);
  addExplicitList(output, "conformance", filters.conformance_statuses);
  addExplicitList(output, "identity-status", filters.identity_statuses);
  addExplicitList(output, "value-status", filters.value_statuses);
  if (filters.limit !== null) output.push(`limit: ${filters.limit}`);
  return output;
}

function addExplicitList(output: string[], label: string, values: string[]): void {
  if (values.length > 0) output.push(`${label}: ${values.join(", ")}`);
}

function severityForRiskCode(code: string): "WARN" | "FAIL" {
  return /FAIL|FAILED|INVALID|MISMATCH|REJECT/i.test(code) ? "FAIL" : "WARN";
}

function dedupeRisks(risks: BeaconQueryCandidate["risk_gaps"]): BeaconQueryCandidate["risk_gaps"] {
  const seen = new Set<string>();
  return risks.filter((risk) => {
    if (seen.has(risk.code)) return false;
    seen.add(risk.code);
    return true;
  });
}
