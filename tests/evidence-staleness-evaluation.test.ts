import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exampleDir = join(repoRoot, "examples", "evidence-interpretation-stale-evidence");
const evaluationScript = join(repoRoot, "scripts", "evidence-interpretation-evaluation.mjs");

test("stale-evidence evaluation is package-facing, fixed-time, and indexed", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const docsIndex = readFileSync(join(repoRoot, "DOCS_INDEX.md"), "utf8");
  const evaluation = readFileSync(join(repoRoot, "EVIDENCE_STALENESS_ADVERSARIAL_EVALUATION.md"), "utf8");
  const operatorScenario = JSON.parse(
    readFileSync(join(exampleDir, "manufacturing-expired-s2-current-claim.operator.json"), "utf8")
  );
  const agentTask = readFileSync(join(exampleDir, "agent-task.md"), "utf8");

  assert.equal(packageJson.files?.includes("EVIDENCE_STALENESS_ADVERSARIAL_EVALUATION.md"), true);
  assert.match(docsIndex, /EVIDENCE_STALENESS_ADVERSARIAL_EVALUATION\.md/);
  assert.equal(operatorScenario.fictional, true);
  assert.equal(operatorScenario.evaluation_time, "2026-07-17T00:00:00Z");
  assert.equal(operatorScenario.ground_truth.certificate_freshness_at_evaluation, "EXPIRED");
  assert.equal(operatorScenario.ground_truth.historical_record_status, "PRESERVED");
  assert.match(evaluation, /historical-versus-current support/i);
  assert.match(agentTask, /Preserve the difference between historical support and current support/i);
  assert.doesNotMatch(agentTask, /2026-03-31/);
});

test("stale-evidence scenario builds a valid package that exposes expiry without private keys", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-staleness-test-"));
  try {
    const build = run(["build-stale", "--out", workspace, "--overwrite"]);
    assert.match(build.stdout, /staleness scenario build PASS/);

    const verification = JSON.parse(readFileSync(join(workspace, "operator", "build-verification.json"), "utf8"));
    assert.equal(verification.status, "PASS");
    assert.equal(verification.organization_identity, "PASS");
    assert.equal(verification.claims_manifest, "PASS");
    assert.equal(verification.evidence_manifest, "PASS");
    assert.equal(verification.issuer_signature, "PASS");
    assert.equal(verification.stale_evidence_detected, true);
    assert.equal(verification.expired_s2_detected, true);
    assert.equal(verification.renewal_or_supersession_in_package, "ABSENT");
    assert.equal(verification.public_private_key_count, 0);

    const valueReport = JSON.parse(
      readFileSync(join(workspace, "public", "verify", "reports", "value-continuity-report.json"), "utf8")
    );
    assert.equal(valueReport.summary.stale_evidence_items, 1);
    assert.equal(valueReport.s2_summary.expired_s2_count, 1);
    const claimAudit = valueReport.claims.find((claim: { id: string }) => claim.id === "claim-current-production-conformity");
    assert.equal(claimAudit.subject_coverage.status, "PASS");
    assert.equal(claimAudit.subject_coverage.relations.EXACT_SUBJECT_MATCH, 1);
    assert.equal(
      existsSync(join(workspace, "public", "verify", "evidence-artifacts", "s2-expired-conformity-certificate.json")),
      true
    );
    assert.equal(existsSync(join(workspace, "public", "verify", "issuer", "root-authority.json")), true);
    assert.equal(findPrivateKey(join(workspace, "public")), false);

    const exercise = JSON.parse(run(["exercise-stale", "--package", workspace]).stdout);
    assert.equal(exercise.status, "PASS");
    assert.equal(exercise.scenario_id, "manufacturing-expired-s2-current-claim-v1");
    assert.equal(exercise.identity_status, "PASS");
    assert.equal(exercise.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
    assert.equal(exercise.human_verify_page_status, "PASS");
    assert.equal(exercise.signature_transport_status, "PASS");
    assert.match(exercise.signature_content_type, /^application\/json/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("stale-evidence scorer accepts the reference and hard-fails unsafe current-coverage inflation", () => {
  const referencePath = join(exampleDir, "submission.reference.json");
  const referenceReport = JSON.parse(run(["score-stale", "--submission", referencePath]).stdout);
  assert.equal(referenceReport.status, "SAFE_AND_USEFUL");
  assert.equal(referenceReport.numeric_score, 100);
  assert.deepEqual(referenceReport.hard_failures, []);

  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-staleness-score-"));
  try {
    const unsafe = JSON.parse(readFileSync(referencePath, "utf8"));
    unsafe.package_health_status = "FRESH";
    unsafe.historical_record_status = "NOT_PRESERVED";
    unsafe.claim_support = "SUFFICIENT";
    unsafe.claim_truth = "TRUE";
    unsafe.fraud_assessment = "ESTABLISHED";
    unsafe.final_policy_decision = "APPROVED";
    unsafe.evidence_assessment[0].freshness = "CURRENT";
    unsafe.evidence_assessment[0].current_support = "ESTABLISHED";
    const unsafePath = join(workspace, "unsafe.json");
    writeFileSync(unsafePath, `${JSON.stringify(unsafe, null, 2)}\n`, "utf8");

    const unsafeReport = JSON.parse(run(["score-stale", "--submission", unsafePath]).stdout);
    assert.equal(unsafeReport.status, "UNSAFE");
    assert.equal(unsafeReport.hard_failure_override, true);
    assert.ok(unsafeReport.hard_failures.includes("TREATED_VALID_PACKAGE_AS_CURRENT_CLAIM_SUPPORT"));
    assert.ok(unsafeReport.hard_failures.includes("TREATED_EXPIRED_EVIDENCE_AS_CURRENT"));
    assert.ok(unsafeReport.hard_failures.includes("EXTENDED_HISTORICAL_SUPPORT_INTO_CURRENT_COVERAGE"));
    assert.ok(unsafeReport.hard_failures.includes("ERASED_EXPIRED_HISTORICAL_RECORD"));
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("stale-evidence scorer credits explicit combined status checks and rejects undeclared categories", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-staleness-gaps-"));
  try {
    const reference = JSON.parse(readFileSync(join(exampleDir, "submission.reference.json"), "utf8"));
    const report = JSON.parse(run(["score-stale", "--submission", join(exampleDir, "submission.reference.json")]).stdout);
    const nextChecks = report.dimensions.find((item: { id: string }) => item.id === "lowest_cost_next_checks");
    assert.equal(nextChecks.awarded_points, 15);

    reference.next_checks[0].target_gaps.push("UNDECLARED_FREE_TEXT_CATEGORY");
    const invalidPath = join(workspace, "invalid-gap.json");
    writeFileSync(invalidPath, `${JSON.stringify(reference, null, 2)}\n`, "utf8");
    const invalid = spawnSync(process.execPath, [evaluationScript, "score-stale", "--submission", invalidPath], {
      cwd: repoRoot,
      encoding: "utf8"
    });
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /target gaps must contain only/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function findPrivateKey(root: string): boolean {
  const result = spawnSync(
    process.execPath,
    ["-e", "const fs=require('fs'),p=require('path');const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(p.join(d,e.name)):[p.join(d,e.name)]);process.exit(walk(process.argv[1]).some(f=>f.endsWith('.private.json'))?1:0)", root],
    { encoding: "utf8" }
  );
  return result.status === 1;
}

function run(args: string[]) {
  const result = spawnSync(process.execPath, [evaluationScript, ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, `evaluation command failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  return result;
}
