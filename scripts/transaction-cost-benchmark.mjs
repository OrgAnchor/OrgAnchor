#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const defaultCasePath = resolve(repoRoot, "examples", "transaction-cost-benchmark", "benchmark-case.alpha4.json");
const cliPath = existsSync(resolve(repoRoot, "src", "cli.ts"))
  ? resolve(repoRoot, "src", "cli.ts")
  : resolve(repoRoot, "dist", "cli.js");

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

const benchmarkCase = readJson(options.casePath ?? defaultCasePath);
validateCase(benchmarkCase);

let submission;
if (options.collectOrigin) {
  submission = await collectDeterministicSubmission(benchmarkCase, options.collectOrigin);
} else if (options.submissionPath) {
  submission = readJson(options.submissionPath);
} else {
  throw new Error("Use --collect <origin> or --submission <file>.");
}

validateSubmission(submission, benchmarkCase);
const report = scoreSubmission(benchmarkCase, submission);
const output = `${JSON.stringify(report, null, 2)}\n`;

if (options.outPath) {
  const outPath = resolve(options.outPath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, output, "utf8");
}

console.log(output.trimEnd());

async function collectDeterministicSubmission(testCase, suppliedOrigin) {
  const origin = new URL(suppliedOrigin).origin;
  if (origin !== new URL(testCase.origin).origin) {
    throw new Error(`Case ${testCase.case_id} is pinned to ${testCase.origin}, not ${origin}.`);
  }

  const websiteStartedAt = performance.now();
  const homepageResponse = await fetch(`${origin}/`, {
    headers: { "user-agent": "OrgAnchor-Transaction-Cost-Reference/0.1" }
  });
  const homepageBytes = new Uint8Array(await homepageResponse.arrayBuffer());
  const homepageElapsedMs = Math.round(performance.now() - websiteStartedAt);
  if (!homepageResponse.ok) {
    throw new Error(`Homepage fetch failed with HTTP ${homepageResponse.status}.`);
  }
  const homepageText = new TextDecoder().decode(homepageBytes);
  const expectedOrganization = expectedFact(testCase, "organization_name");

  const verifyStartedAt = performance.now();
  const verify = spawnSync(process.execPath, [cliPath, "verify", "url", origin, "--compact"], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  const verifyElapsedMs = Math.round(performance.now() - verifyStartedAt);
  if (verify.status !== 0) {
    throw new Error(
      `Compact verification failed with status ${verify.status}\nstdout:\n${verify.stdout}\nstderr:\n${verify.stderr}`
    );
  }
  const compact = JSON.parse(verify.stdout);

  return {
    type: "OrgAnchorTransactionCostBenchmarkSubmission",
    version: "0.1",
    case_id: testCase.case_id,
    evidence_class: "INTERNAL_DETERMINISTIC",
    runner: {
      name: "organchor-reference-collector",
      version: "0.1",
      run_id: new Date().toISOString()
    },
    runs: [
      {
        condition: "WEBSITE_ONLY",
        metrics: {
          elapsed_ms: homepageElapsedMs,
          http_requests: 1,
          bytes_read: homepageBytes.byteLength,
          command_count: 0,
          output_bytes: homepageBytes.byteLength,
          prompt_tokens: null,
          completion_tokens: null
        },
        facts: blankFacts(testCase, {
          organization_name: homepageText.includes(String(expectedOrganization)) ? expectedOrganization : null,
          official_origin: origin
        }),
        evidence_urls: [`${origin}/`],
        notes: "Deterministic homepage-only extraction. This is not an AI-Agent judgment."
      },
      {
        condition: "ORGANCHOR_ENABLED",
        metrics: {
          elapsed_ms: verifyElapsedMs,
          http_requests: null,
          bytes_read: null,
          command_count: 1,
          output_bytes: Buffer.byteLength(verify.stdout, "utf8"),
          prompt_tokens: null,
          completion_tokens: null
        },
        facts: blankFacts(testCase, {
          organization_name: compact.organization?.name ?? null,
          official_origin: new URL(compact.target).origin,
          root_authority_hash: compact.root_authority_hash ?? null,
          statement_hash: compact.statement_hash ?? null,
          overall_status: compact.overall_status ?? null,
          identity_status: compact.identity_status ?? null,
          value_status: compact.value_status ?? null,
          conformance_status: compact.conformance_status ?? null,
          trust_decision: compact.trust_decision ?? null,
          third_party_claims: compact.evidence_summary?.third_party_claims ?? null,
          manual_checks: compact.evidence_summary?.manual_checks ?? null,
          risk_gaps: compact.evidence_summary?.risk_gaps ?? null
        }),
        evidence_urls: [
          `${origin}/.well-known/organchor.json`,
          `${origin}/verify/organchor.json`
        ],
        notes: "Deterministic compact verification extraction. This is not independent external evidence."
      }
    ]
  };
}

function scoreSubmission(testCase, candidate) {
  const results = candidate.runs.map((run) => scoreRun(testCase, run));
  const website = results.find((result) => result.condition === "WEBSITE_ONLY");
  const enhanced = results.find((result) => result.condition === "ORGANCHOR_ENABLED");
  const isExternal = candidate.evidence_class === "EXTERNAL_INDEPENDENT";
  const coverageChange = round(enhanced.coverage_rate - website.coverage_rate);
  const unsafe = enhanced.incorrect_facts > 0 || enhanced.trust_boundary === "UNSAFE";
  const status = unsafe
    ? "UNSAFE_RESULT"
    : coverageChange <= 0
      ? "NO_OBSERVED_COVERAGE_GAIN"
      : isExternal
        ? "OBSERVED_IMPROVEMENT"
        : "READY_FOR_EXTERNAL_RUNS";

  const findings = [];
  findings.push(coverageChange > 0 ? "ENHANCED_COVERAGE_IMPROVED" : "NO_ENHANCED_COVERAGE_GAIN");
  findings.push(enhanced.incorrect_facts === 0 ? "NO_ENHANCED_FALSE_ASSERTIONS" : "ENHANCED_FALSE_ASSERTIONS_PRESENT");
  findings.push(
    enhanced.trust_boundary === "SAFE" ? "TRUST_BOUNDARY_PRESERVED" : `TRUST_BOUNDARY_${enhanced.trust_boundary}`
  );
  findings.push(costMetricsComplete(candidate.runs) ? "COST_METRICS_COMPLETE" : "COST_METRICS_INCOMPLETE");
  if (!isExternal) findings.push("EXTERNAL_VALIDATION_REQUIRED");

  return {
    type: "OrgAnchorTransactionCostBenchmarkReport",
    version: "0.1",
    generated_at: new Date().toISOString(),
    case_id: testCase.case_id,
    submission: {
      evidence_class: candidate.evidence_class,
      runner: candidate.runner,
      is_external_evidence: isExternal
    },
    status,
    summary: {
      fact_count: testCase.facts.length,
      website_only_coverage_rate: website.coverage_rate,
      organchor_enabled_coverage_rate: enhanced.coverage_rate,
      coverage_rate_change: coverageChange,
      website_only_incorrect_facts: website.incorrect_facts,
      organchor_enabled_incorrect_facts: enhanced.incorrect_facts,
      organchor_enabled_trust_boundary: enhanced.trust_boundary
    },
    runs: results,
    findings,
    decision_scope: {
      transaction_cost_reduction_proven: false,
      reason: isExternal
        ? "A single independent paired run is an observation, not a general proof. Aggregate multiple independent runs."
        : "Reference and internal runs validate benchmark mechanics but do not count as external Fireseed evidence.",
      unknown_candidate_discovery_tested: false,
      final_trust_assigned_by_organchor: false
    },
    limits: testCase.limits
  };
}

function scoreRun(testCase, run) {
  let exact = 0;
  let unknown = 0;
  let incorrect = 0;
  const factResults = {};

  for (const fact of testCase.facts) {
    const actual = run.facts[fact.id];
    const status = actual === null ? "UNKNOWN" : Object.is(actual, fact.expected) ? "EXACT" : "INCORRECT";
    if (status === "EXACT") exact += 1;
    if (status === "UNKNOWN") unknown += 1;
    if (status === "INCORRECT") incorrect += 1;
    factResults[fact.id] = { status, actual };
  }

  const asserted = exact + incorrect;
  const trust = factResults.trust_decision;
  const trustBoundary = trust.status === "EXACT" ? "SAFE" : trust.status === "UNKNOWN" ? "UNKNOWN" : "UNSAFE";

  return {
    condition: run.condition,
    exact_facts: exact,
    unknown_facts: unknown,
    incorrect_facts: incorrect,
    coverage_rate: round(exact / testCase.facts.length),
    false_assertion_rate: asserted === 0 ? 0 : round(incorrect / asserted),
    trust_boundary: trustBoundary,
    metrics: run.metrics,
    evidence_urls: run.evidence_urls,
    fact_results: factResults,
    notes: run.notes ?? null
  };
}

function validateCase(testCase) {
  if (testCase.type !== "OrgAnchorTransactionCostBenchmarkCase" || testCase.version !== "0.1") {
    throw new Error("Unsupported benchmark case type or version.");
  }
  if (!testCase.case_id || !testCase.origin) throw new Error("Benchmark case requires case_id and origin.");
  if (!Array.isArray(testCase.facts) || testCase.facts.length === 0) throw new Error("Benchmark case requires facts.");
  const ids = new Set();
  for (const fact of testCase.facts) {
    if (!fact.id || ids.has(fact.id)) throw new Error(`Invalid or duplicate fact id: ${fact.id}`);
    ids.add(fact.id);
    if (!Object.hasOwn(fact, "expected")) throw new Error(`Fact ${fact.id} requires expected.`);
  }
  for (const required of ["organization_name", "official_origin", "trust_decision"]) {
    if (!ids.has(required)) throw new Error(`Benchmark case requires fact ${required}.`);
  }
}

function validateSubmission(candidate, testCase) {
  if (candidate.type !== "OrgAnchorTransactionCostBenchmarkSubmission" || candidate.version !== "0.1") {
    throw new Error("Unsupported benchmark submission type or version.");
  }
  if (candidate.case_id !== testCase.case_id) throw new Error("Submission case_id does not match benchmark case.");
  const allowedEvidenceClasses = new Set([
    "REFERENCE_FIXTURE",
    "INTERNAL_DETERMINISTIC",
    "INTERNAL_COLD_START",
    "EXTERNAL_INDEPENDENT"
  ]);
  if (!allowedEvidenceClasses.has(candidate.evidence_class)) {
    throw new Error(`Unsupported evidence_class: ${candidate.evidence_class}`);
  }
  if (!candidate.runner?.name || !candidate.runner?.version || !candidate.runner?.run_id) {
    throw new Error("Submission requires runner name, version, and run_id.");
  }
  if (!Array.isArray(candidate.runs) || candidate.runs.length !== 2) {
    throw new Error("Submission requires exactly two condition runs.");
  }

  const conditions = new Set();
  const factIds = testCase.facts.map((fact) => fact.id);
  for (const run of candidate.runs) {
    if (!new Set(["WEBSITE_ONLY", "ORGANCHOR_ENABLED"]).has(run.condition)) {
      throw new Error(`Unsupported condition: ${run.condition}`);
    }
    if (conditions.has(run.condition)) throw new Error(`Duplicate condition: ${run.condition}`);
    conditions.add(run.condition);
    if (!run.metrics || !run.facts || !Array.isArray(run.evidence_urls)) {
      throw new Error(`${run.condition} requires metrics, facts, and evidence_urls.`);
    }
    for (const fact of testCase.facts) {
      if (!Object.hasOwn(run.facts, fact.id)) throw new Error(`${run.condition} is missing fact ${fact.id}.`);
      const value = run.facts[fact.id];
      if (value !== null && typeof value !== fact.value_type) {
        throw new Error(`${run.condition}.${fact.id} must be ${fact.value_type} or null.`);
      }
    }
    const unknownKeys = Object.keys(run.facts).filter((key) => !factIds.includes(key));
    if (unknownKeys.length > 0) throw new Error(`${run.condition} has unknown facts: ${unknownKeys.join(", ")}`);
    validateMetrics(run.metrics, run.condition);
  }
}

function validateMetrics(metrics, condition) {
  for (const key of metricKeys()) {
    if (!Object.hasOwn(metrics, key)) throw new Error(`${condition} is missing metric ${key}.`);
    const value = metrics[key];
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      throw new Error(`${condition}.${key} must be a non-negative number or null.`);
    }
  }
}

function costMetricsComplete(runs) {
  return runs.every((run) => metricKeys().every((key) => run.metrics[key] !== null));
}

function metricKeys() {
  return [
    "elapsed_ms",
    "http_requests",
    "bytes_read",
    "command_count",
    "output_bytes",
    "prompt_tokens",
    "completion_tokens"
  ];
}

function blankFacts(testCase, values = {}) {
  return Object.fromEntries(testCase.facts.map((fact) => [fact.id, Object.hasOwn(values, fact.id) ? values[fact.id] : null]));
}

function expectedFact(testCase, id) {
  const fact = testCase.facts.find((candidate) => candidate.id === id);
  if (!fact) throw new Error(`Unknown benchmark fact: ${id}`);
  return fact.expected;
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}

function parseArgs(args) {
  const parsed = {
    casePath: null,
    collectOrigin: null,
    help: false,
    outPath: null,
    submissionPath: null
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (["--case", "--collect", "--out", "--submission"].includes(arg)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${arg} requires a value.`);
      if (arg === "--case") parsed.casePath = value;
      if (arg === "--collect") parsed.collectOrigin = value;
      if (arg === "--out") parsed.outPath = value;
      if (arg === "--submission") parsed.submissionPath = value;
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  if (parsed.collectOrigin && parsed.submissionPath) {
    throw new Error("Use only one of --collect or --submission.");
  }
  return parsed;
}

function printHelp() {
  console.log(`OrgAnchor Fireseed transaction-cost benchmark

Usage:
  node scripts/transaction-cost-benchmark.mjs --collect https://organchor.org
  node scripts/transaction-cost-benchmark.mjs --submission submission.json
  node scripts/transaction-cost-benchmark.mjs --submission submission.json --out report.json
  node scripts/transaction-cost-benchmark.mjs --case case.json --submission submission.json
`);
}
