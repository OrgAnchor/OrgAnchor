import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "transaction-cost-benchmark.mjs");
const reference = join(repoRoot, "examples", "transaction-cost-benchmark", "submission.reference.json");

test("transaction-cost benchmark is packaged and documented as a Fireseed experiment", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const docsIndex = readFileSync(join(repoRoot, "DOCS_INDEX.md"), "utf8");
  const readme = readFileSync(join(repoRoot, "README.md"), "utf8");
  const benchmarkDoc = readFileSync(join(repoRoot, "FIRESEED_TRANSACTION_COST_BENCHMARK.md"), "utf8");

  assert.equal(packageJson.scripts?.["benchmark:transaction"], "node scripts/transaction-cost-benchmark.mjs");
  assert.equal(packageJson.files?.includes("scripts/transaction-cost-benchmark.mjs"), true);
  assert.equal(packageJson.files?.includes("FIRESEED_TRANSACTION_COST_BENCHMARK.md"), true);
  assert.match(docsIndex, /FIRESEED_TRANSACTION_COST_BENCHMARK\.md/);
  assert.match(readme, /## Transaction-Cost Benchmark/);
  assert.match(readme, /does not prove a general transaction-cost reduction claim/i);
  assert.match(readme, /post-Alpha\.4 Fireseed benchmark tooling/);
  assert.match(readme, /Use a source checkout for the benchmark commands below/);
  assert.match(benchmarkDoc, /Internal Cold-Start Observation: 2026-07-16/);
  assert.match(benchmarkDoc, /does not yet establish lower total transaction cost/i);
});

test("cold-start prompts do not expose pinned benchmark answers", () => {
  const exampleDir = join(repoRoot, "examples", "transaction-cost-benchmark");
  const prompts = [
    readFileSync(join(exampleDir, "prompt.website-only.md"), "utf8"),
    readFileSync(join(exampleDir, "prompt.organchor-enabled.md"), "utf8")
  ];
  const benchmarkCase = JSON.parse(readFileSync(join(exampleDir, "benchmark-case.alpha4.json"), "utf8"));

  for (const prompt of prompts) {
    assert.match(prompt, /exact machine-contract status string or `null`/);
    assert.match(prompt, /non-negative numeric count or `null`/);
    assert.match(prompt, /do not substitute descriptions/);
    for (const fact of benchmarkCase.facts) {
      if (["organization_name", "official_origin"].includes(fact.id)) continue;
      if (fact.expected === null || typeof fact.expected === "number") continue;
      assert.equal(prompt.includes(String(fact.expected)), false, `prompt leaked expected value for ${fact.id}`);
    }
  }
});

test("transaction-cost benchmark scores the reference pair without treating it as external evidence", () => {
  const result = spawnSync(process.execPath, [script, "--submission", reference], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 0, `benchmark failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  const report = JSON.parse(result.stdout);
  assert.equal(report.type, "OrgAnchorTransactionCostBenchmarkReport");
  assert.equal(report.status, "READY_FOR_EXTERNAL_RUNS");
  assert.equal(report.submission.is_external_evidence, false);
  assert.equal(report.summary.website_only_coverage_rate, 0.1667);
  assert.equal(report.summary.organchor_enabled_coverage_rate, 1);
  assert.equal(report.summary.coverage_rate_change, 0.8333);
  assert.equal(report.summary.organchor_enabled_incorrect_facts, 0);
  assert.equal(report.summary.organchor_enabled_trust_boundary, "SAFE");
  assert.equal(report.decision_scope.transaction_cost_reduction_proven, false);
  assert.equal(report.decision_scope.unknown_candidate_discovery_tested, false);
  assert.ok(report.findings.includes("EXTERNAL_VALIDATION_REQUIRED"));
});

test("transaction-cost benchmark rejects submissions that omit a pinned fact", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-transaction-benchmark-test-"));
  try {
    const submission = JSON.parse(readFileSync(reference, "utf8"));
    delete submission.runs[1].facts.trust_decision;
    const path = join(workspace, "invalid-submission.json");
    writeFileSync(path, `${JSON.stringify(submission, null, 2)}\n`, "utf8");

    const result = spawnSync(process.execPath, [script, "--submission", path], {
      cwd: repoRoot,
      encoding: "utf8"
    });

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /ORGANCHOR_ENABLED is missing fact trust_decision/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
