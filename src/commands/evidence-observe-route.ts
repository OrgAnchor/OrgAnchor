type ObservationRoute = "S3_RECOMMENDED" | "S4_RECOMMENDED" | "MIXED_S3_S4" | "ROUTING_UNCLEAR";
type RoutingConfidence = "high" | "medium" | "low";

interface KeywordGroup {
  id: string;
  reason: string;
  terms: RegExp[];
}

interface RouteResult {
  type: "OrgAnchorObservationRouteResult";
  version: "1.0";
  recommended_route: ObservationRoute;
  routing_confidence: RoutingConfidence;
  routing_reasons: string[];
  detected_subject_hints: string[];
  missing_information: string[];
  suggested_next_command: string;
  user_confirmation_required: true;
  not_a_trust_decision: true;
}

const S3_GROUPS: KeywordGroup[] = [
  {
    id: "sample_identity",
    reason: "mentions a concrete sample, batch, unit, delivered artifact, API probe, or acceptance item",
    terms: [
      /\bsamples?\b/i,
      /\bspecimens?\b/i,
      /\bbatches?\b/i,
      /\blots?\b/i,
      /\bunits?\b/i,
      /\bapi probes?\b/i,
      /\bacceptance item\b/i,
      /\bdelivered artifacts?\b/i,
      /样品/,
      /样本/,
      /批次/,
      /批号/,
      /单件/,
      /单元/,
      /验收件/
    ]
  },
  {
    id: "sample_source",
    reason: "mentions market purchase, random sampling, distributor inventory, warehouse, or customer-site sample source",
    terms: [
      /\brandom(?:ly)? purchases?\b/i,
      /\brandom sampling\b/i,
      /\bmarket purchases?\b/i,
      /\bdistributor inventory\b/i,
      /\bwarehouse inventory\b/i,
      /\bcustomer[- ]site\b/i,
      /\bselected from\b/i,
      /随机购买/,
      /随机抽样/,
      /抽样/,
      /抽检/,
      /市场购买/,
      /经销商库存/,
      /仓库库存/,
      /客户现场/
    ]
  },
  {
    id: "conformance_method",
    reason: "mentions testing, inspection, measurement, acceptance, specification, or conformance language",
    terms: [
      /\btests?\b/i,
      /\btested\b/i,
      /\btesting\b/i,
      /\binspect(?:ed|ion)?\b/i,
      /\bmeasure(?:d|ment|s)?\b/i,
      /\btolerance\b/i,
      /\bspec(?:ification)?s?\b/i,
      /\bconform(?:s|ance)?\b/i,
      /\bacceptance testing\b/i,
      /\blaboratory\b/i,
      /\bhardness\b/i,
      /\bthermal\b/i,
      /\bschema\b/i,
      /检测/,
      /测试/,
      /检验/,
      /测量/,
      /尺寸/,
      /公差/,
      /规格/,
      /符合/,
      /达标/,
      /硬度/,
      /热/,
      /实验室/,
      /验收测试/,
      /接口返回/
    ]
  }
];

const S4_GROUPS: KeywordGroup[] = [
  {
    id: "time_window",
    reason: "mentions a time window or repeated observation period",
    terms: [
      /\b\d+\s*(?:day|days|week|weeks|month|months|quarter|quarters|year|years)\b/i,
      /\b(?:daily|weekly|monthly|quarterly|yearly)\b/i,
      /\bover\s+\d+\b/i,
      /\brecent\s+\d+\b/i,
      /\brecurring\b/i,
      /\brepeated\b/i,
      /最近/,
      /\d+\s*(?:天|周|个月|月|季度|年)/,
      /一段时间/,
      /持续/,
      /长期/,
      /反复/
    ]
  },
  {
    id: "delivery_continuity",
    reason: "mentions delivery, order, shipment, lead-time, supply, or fulfillment continuity",
    terms: [
      /\borders?\b/i,
      /\bshipments?\b/i,
      /\bon[- ]time\b/i,
      /\bdeliver(?:y|ed|ies)?\b/i,
      /\blead[- ]?time\b/i,
      /\bfulfill(?:ment|ed)?\b/i,
      /\bsupply\b/i,
      /\bpartial shipments?\b/i,
      /\blate shipments?\b/i,
      /订单/,
      /交付/,
      /履约/,
      /按时/,
      /延期/,
      /供给/,
      /供应/,
      /供货/,
      /出货/,
      /发货/,
      /产能/,
      /断供/
    ]
  },
  {
    id: "operation_continuity",
    reason: "mentions uptime, latency, availability, incident, outage, failure, or field-use continuity",
    terms: [
      /\buptime\b/i,
      /\blatency\b/i,
      /\bavailability\b/i,
      /\bmonitor(?:ing|s|ed)?\b/i,
      /\bincidents?\b/i,
      /\boutages?\b/i,
      /\bfailures?\b/i,
      /\bfailure rate\b/i,
      /\bfield failures?\b/i,
      /\bdeployed units?\b/i,
      /可用性/,
      /延迟/,
      /监控/,
      /运行/,
      /事故/,
      /故障/,
      /故障率/,
      /现场使用/,
      /部署设备/
    ]
  },
  {
    id: "support_continuity",
    reason: "mentions maintenance, repair, warranty, returns, support, replacement, or service response",
    terms: [
      /\bmaintenance\b/i,
      /\brepairs?\b/i,
      /\bwarranty\b/i,
      /\breturns?\b/i,
      /\bsupport\b/i,
      /\breplacements?\b/i,
      /\bservice response\b/i,
      /维护/,
      /维修/,
      /保修/,
      /退货/,
      /售后/,
      /更换/,
      /替换/,
      /支持/,
      /响应/
    ]
  }
];

const VAGUE_GROUPS: KeywordGroup[] = [
  {
    id: "promotional_language",
    reason: "contains broad marketing, testimonial, or vague quality language without enough routing detail",
    terms: [
      /\breliable\b/i,
      /\btrusted\b/i,
      /\bbest\b/i,
      /\bleading\b/i,
      /\bhigh quality\b/i,
      /\bcustomer(?:s)? (?:like|trust|recognize)\b/i,
      /\bcase stud(?:y|ies)\b/i,
      /可靠/,
      /值得信赖/,
      /质量很好/,
      /高质量/,
      /领先/,
      /优秀/,
      /好评/,
      /口碑/,
      /客户认可/,
      /知名客户/,
      /案例/
    ]
  }
];

export async function evidenceObserveRouteCommand(options: Record<string, string | boolean>): Promise<void> {
  const text = stringOption(options.text) || stringOption(options._);
  if (!text.trim()) {
    throw new Error('--text is required, for example: --text "Recent 90 day on-time delivery for model-x1 orders"');
  }
  console.log(JSON.stringify(routeObservation(text), null, 2));
}

function routeObservation(text: string): RouteResult {
  const s3Matches = matchedGroups(text, S3_GROUPS);
  const s4Matches = matchedGroups(text, S4_GROUPS);
  const vagueMatches = matchedGroups(text, VAGUE_GROUPS);
  const hasS3 = s3Matches.length > 0;
  const hasS4 = s4Matches.length > 0;
  const route = chooseRoute(hasS3, hasS4);
  const reasons = buildReasons(route, s3Matches, s4Matches, vagueMatches);

  return {
    type: "OrgAnchorObservationRouteResult",
    version: "1.0",
    recommended_route: route,
    routing_confidence: confidenceFor(route, s3Matches.length, s4Matches.length, vagueMatches.length),
    routing_reasons: reasons,
    detected_subject_hints: detectSubjectHints(text),
    missing_information: missingInformation(route, text),
    suggested_next_command: suggestedCommand(route),
    user_confirmation_required: true,
    not_a_trust_decision: true
  };
}

function matchedGroups(text: string, groups: KeywordGroup[]): KeywordGroup[] {
  return groups.filter((group) => group.terms.some((term) => term.test(text)));
}

function chooseRoute(hasS3: boolean, hasS4: boolean): ObservationRoute {
  if (hasS3 && hasS4) return "MIXED_S3_S4";
  if (hasS3) return "S3_RECOMMENDED";
  if (hasS4) return "S4_RECOMMENDED";
  return "ROUTING_UNCLEAR";
}

function confidenceFor(route: ObservationRoute, s3Count: number, s4Count: number, vagueCount: number): RoutingConfidence {
  if (route === "ROUTING_UNCLEAR") return "low";
  if (route === "MIXED_S3_S4") return s3Count >= 2 && s4Count >= 2 ? "medium" : "low";
  const matchedCount = route === "S3_RECOMMENDED" ? s3Count : s4Count;
  if (matchedCount >= 2 && vagueCount === 0) return "high";
  return "medium";
}

function buildReasons(route: ObservationRoute, s3Matches: KeywordGroup[], s4Matches: KeywordGroup[], vagueMatches: KeywordGroup[]): string[] {
  const reasons: string[] = [];
  if (route === "MIXED_S3_S4") {
    reasons.push("contains both sample-conformance and continuity signals; split into S3 and S4 records when possible");
  }
  for (const match of [...s3Matches, ...s4Matches, ...vagueMatches]) {
    if (!reasons.includes(match.reason)) reasons.push(match.reason);
  }
  if (reasons.length === 0) {
    reasons.push("does not include enough concrete sample, method, time-window, delivery, use, support, or continuity detail");
  }
  return reasons.slice(0, 6);
}

function missingInformation(route: ObservationRoute, text: string): string[] {
  const missing: string[] = [];
  const hasSubject = detectSubjectHints(text).length > 0;
  const hasTimeWindow = hasAny(text, S4_GROUPS.find((group) => group.id === "time_window")?.terms ?? []);
  const hasSampleSource = hasAny(text, S3_GROUPS.find((group) => group.id === "sample_source")?.terms ?? []);
  const hasMethod = hasAny(text, S3_GROUPS.find((group) => group.id === "conformance_method")?.terms ?? []);
  const hasCount = /\b\d+\s*(?:orders?|shipments?|samples?|units?|failures?|repairs?|days?|months?)\b/i.test(text) || /\d+\s*(?:个|次|件|批|单|台|天|月)/.test(text);

  if (!hasSubject) missing.push("exact subject identifier");
  if (route === "S3_RECOMMENDED" || route === "MIXED_S3_S4") {
    if (!hasSampleSource) missing.push("sample source and selector");
    if (!hasMethod) missing.push("test, inspection, measurement, or acceptance method");
  }
  if (route === "S4_RECOMMENDED" || route === "MIXED_S3_S4") {
    if (!hasTimeWindow) missing.push("observation window");
    if (!hasCount) missing.push("event count, order count, or metric numerator and denominator");
    missing.push("observer identity");
  }
  if (route === "ROUTING_UNCLEAR") {
    missing.push("whether this is about sample conformance or performance continuity");
    missing.push("method or observation window");
  }
  missing.push("raw evidence location or vault");
  return unique(missing);
}

function suggestedCommand(route: ObservationRoute): string {
  if (route === "S3_RECOMMENDED") return "organchor evidence s3 template --template market_purchase";
  if (route === "S4_RECOMMENDED") return "organchor evidence observe template --route S4_RECOMMENDED";
  if (route === "MIXED_S3_S4") return "organchor evidence observe template --route MIXED_S3_S4";
  return 'organchor evidence observe route --text "<more specific observation>"';
}

function detectSubjectHints(text: string): string[] {
  const patterns = [
    /\bmodel[-_\s]?[a-z0-9][a-z0-9._-]*\b/gi,
    /\b(?:batch|lot|serial|unit|sku|part)[-_\s]?[a-z0-9][a-z0-9._-]*\b/gi,
    /\bapi\b/gi,
    /型号[：:\s]*[A-Za-z0-9._-]+/g,
    /批次[：:\s]*[A-Za-z0-9._-]+/g,
    /订单[：:\s]*[A-Za-z0-9._-]+/g
  ];
  const hints: string[] = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = match[0]?.trim();
      if (value) hints.push(value.replace(/\s+/g, "-"));
    }
  }
  return unique(hints).slice(0, 8);
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function stringOption(value: string | boolean | undefined): string {
  return typeof value === "string" ? value : "";
}
