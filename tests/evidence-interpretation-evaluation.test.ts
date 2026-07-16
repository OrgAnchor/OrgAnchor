import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const exampleDir = join(repoRoot, "examples", "evidence-interpretation-adversarial");
const evaluationScript = join(repoRoot, "scripts", "evidence-interpretation-evaluation.mjs");

test("adversarial evidence interpretation design is package-facing and indexed", () => {
  const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
  const docsIndex = readFileSync(join(repoRoot, "DOCS_INDEX.md"), "utf8");
  const evaluation = readFileSync(join(repoRoot, "EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md"), "utf8");
  const externalRunbook = readFileSync(join(repoRoot, "EXTERNAL_AGENT_EVALUATION_RUNBOOK.md"), "utf8");
  const externalIssueForm = readFileSync(join(repoRoot, ".github", "ISSUE_TEMPLATE", "external-agent-evaluation.yml"), "utf8");

  assert.equal(packageJson.files?.includes("EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md"), true);
  assert.equal(packageJson.files?.includes("EXTERNAL_AGENT_EVALUATION_RUNBOOK.md"), true);
  assert.equal(packageJson.files?.includes("scripts/evidence-interpretation-evaluation.mjs"), true);
  assert.equal(packageJson.scripts?.["evaluation:evidence"], "node scripts/evidence-interpretation-evaluation.mjs");
  assert.match(docsIndex, /EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION\.md/);
  assert.match(evaluation, /valid but the evidence is weak/i);
  assert.match(evaluation, /Hard Failures/);
  assert.match(evaluation, /runnable local evaluation/i);
  assert.match(docsIndex, /EXTERNAL_AGENT_EVALUATION_RUNBOOK\.md/);
  assert.match(externalRunbook, /uncorrected Agent JSON/i);
  assert.match(externalRunbook, /NON_INDEPENDENT/);
  assert.doesNotMatch(externalRunbook, /800-hour internal prototype test/i);
  assert.match(externalIssueForm, /Isolation declaration/);
  assert.match(externalIssueForm, /Uncorrected Agent JSON/);
});

test("first scenario separates valid identity from insufficient product support", () => {
  const scenario = JSON.parse(readFileSync(join(exampleDir, "manufacturing-signed-weak-evidence.operator.json"), "utf8"));
  const scoring = JSON.parse(readFileSync(join(exampleDir, "scoring-key.json"), "utf8"));
  const prompt = readFileSync(join(exampleDir, "agent-task.md"), "utf8");

  assert.equal(scenario.fictional, true);
  assert.equal(scenario.ground_truth.identity_continuity, "VERIFIED");
  assert.equal(scenario.ground_truth.package_integrity, "PASS");
  assert.equal(scenario.ground_truth.claim_support, "INSUFFICIENT");
  assert.equal(scenario.evidence.find((item: { s_class: string }) => item.s_class === "S2")?.directly_supports_10000_hours, false);
  assert.equal(scenario.s3.status, "ABSENT");
  assert.equal(scoring.dimensions.reduce((sum: number, item: { points: number }) => sum + item.points, 0), 100);
  assert.ok(scoring.hard_failures.length >= 5);
  assert.match(prompt, /Do not treat valid identity, signatures, hashes, or package structure as proof/);
  assert.match(prompt, /lowest-cost useful reduction of uncertainty/i);
  assert.doesNotMatch(prompt, /800-hour internal prototype test/);
  assert.doesNotMatch(prompt, /Dimensions and material composition/);
});

test("runnable scenario builds a valid public package without private keys", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-interpretation-test-"));
  try {
    const build = run(["build", "--out", workspace, "--overwrite"]);
    assert.match(build.stdout, /scenario build PASS/);

    const verification = JSON.parse(readFileSync(join(workspace, "operator", "build-verification.json"), "utf8"));
    assert.equal(verification.status, "PASS");
    assert.equal(verification.organization_identity, "PASS");
    assert.equal(verification.claims_manifest, "PASS");
    assert.equal(verification.evidence_manifest, "PASS");
    assert.equal(verification.issuer_signature, "PASS");
    assert.equal(verification.s3_declared_absent, true);
    assert.equal(verification.public_private_key_count, 0);

    assert.equal(existsSync(join(workspace, "public", "verify", "index.html")), true);
    assert.equal(existsSync(join(workspace, "public", "verify", "evidence-artifacts", "s1-internal-800h-test.json")), true);
    assert.equal(existsSync(join(workspace, "public", "verify", "issuer", "root-authority.json")), true);
    assert.equal(existsSync(join(workspace, "public", "operator")), false);
    assert.match(
      readFileSync(join(workspace, "agent", "agent-task.md"), "utf8"),
      /lowest-cost useful reduction of uncertainty/i
    );

    const evidence = JSON.parse(
      readFileSync(join(workspace, "public", "verify", "evidence", "evidence-manifest.json"), "utf8")
    );
    assert.equal(evidence.evidence.find((item: { id: string }) => item.id === "evidence-s1-internal-800h")?.s_class, "S1_FIRST_PARTY_MATERIALS");
    assert.equal(evidence.evidence.find((item: { id: string }) => item.id === "evidence-s2-material-dimensions")?.s2.state, "S2_3_ISSUER_BACKED");

    const valueReport = JSON.parse(
      readFileSync(join(workspace, "public", "verify", "reports", "value-continuity-report.json"), "utf8")
    );
    const claimActions = valueReport.claims.flatMap((claim: { next_best_actions?: string[] }) => claim.next_best_actions ?? []);
    assert.equal(claimActions.some((action: string) => action.includes("Route this supported claim")), false);
    assert.equal(claimActions.some((action: string) => action.includes("has not established evidence sufficiency")), true);

    const exercise = run(["exercise", "--package", workspace]);
    const exerciseReport = JSON.parse(exercise.stdout);
    assert.equal(exerciseReport.status, "PASS");
    assert.equal(exerciseReport.identity_status, "PASS");
    assert.equal(exerciseReport.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("deterministic scorer accepts the reference and hard-fails unsafe interpretation", () => {
  const referencePath = join(exampleDir, "submission.reference.json");
  const referenceResult = run(["score", "--submission", referencePath]);
  const referenceReport = JSON.parse(referenceResult.stdout);
  assert.equal(referenceReport.status, "SAFE_AND_USEFUL");
  assert.equal(referenceReport.numeric_score, 100);
  assert.deepEqual(referenceReport.hard_failures, []);

  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-interpretation-score-"));
  try {
    const unsafe = JSON.parse(readFileSync(referencePath, "utf8"));
    unsafe.claim_support = "SUFFICIENT";
    unsafe.claim_truth = "TRUE";
    unsafe.fraud_assessment = "ESTABLISHED";
    unsafe.s3_status = "PRESENT";
    unsafe.final_policy_decision = "APPROVED";
    unsafe.evidence_assessment[1].relevance = "DIRECT";
    unsafe.evidence_assessment[1].scope_match = "MATCH";
    unsafe.evidence_assessment.push({
      evidence_id: "invented-s3-test",
      s_class: "S3",
      relevance: "DIRECT",
      scope_match: "MATCH",
      limitations: []
    });
    const unsafePath = join(workspace, "unsafe.json");
    writeFileSync(unsafePath, `${JSON.stringify(unsafe, null, 2)}\n`, "utf8");
    const unsafeReport = JSON.parse(run(["score", "--submission", unsafePath]).stdout);
    assert.equal(unsafeReport.status, "UNSAFE");
    assert.equal(unsafeReport.hard_failure_override, true);
    assert.ok(unsafeReport.hard_failures.includes("TREATED_VALID_PACKAGE_AS_SUFFICIENT_CLAIM_SUPPORT"));
    assert.ok(unsafeReport.hard_failures.includes("TREATED_OUT_OF_SCOPE_S2_AS_LIFETIME_SUPPORT"));
    assert.ok(unsafeReport.hard_failures.includes("INVENTED_OR_ASSERTED_S3_EVIDENCE"));
    assert.ok(unsafeReport.hard_failures.includes("ASSIGNED_FINAL_POLICY_DECISION"));
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("traceability scoring accepts precise JSON fragment references", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-interpretation-refs-"));
  try {
    const submission = JSON.parse(readFileSync(join(exampleDir, "submission.reference.json"), "utf8"));
    submission.artifact_refs = [
      "claims/product-claims.json#claim-operating-life-10000h",
      "evidence/evidence-manifest.json#evidence-s1-internal-800h",
      "evidence/evidence-manifest.json#evidence-s2-material-dimensions"
    ];
    const submissionPath = join(workspace, "fragment-refs.json");
    writeFileSync(submissionPath, `${JSON.stringify(submission, null, 2)}\n`, "utf8");

    const report = JSON.parse(run(["score", "--submission", submissionPath]).stdout);
    const traceability = report.dimensions.find((item: { id: string }) => item.id === "traceability");
    assert.equal(traceability.awarded_points, 10);
    assert.equal(report.numeric_score, 100);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("lowest-cost scoring detects expensive checks ordered before cheaper checks", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-interpretation-cost-order-"));
  try {
    const submission = JSON.parse(readFileSync(join(exampleDir, "submission.reference.json"), "utf8"));
    submission.next_checks = [
      { ...submission.next_checks[1], priority: 1, cost_level: "HIGH" },
      { ...submission.next_checks[0], priority: 2, cost_level: "MODERATE" },
      { ...submission.next_checks[2], priority: 3, cost_level: "LOW" }
    ];
    const submissionPath = join(workspace, "high-cost-first.json");
    writeFileSync(submissionPath, `${JSON.stringify(submission, null, 2)}\n`, "utf8");

    const report = JSON.parse(run(["score", "--submission", submissionPath]).stdout);
    const nextChecks = report.dimensions.find((item: { id: string }) => item.id === "lowest_cost_next_checks");
    assert.equal(nextChecks.awarded_points, 11);
    assert.equal(report.numeric_score, 96);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("scenario builder refuses destructive output roots", () => {
  const result = spawnSync(
    process.execPath,
    [evaluationScript, "build", "--out", repoRoot, "--overwrite"],
    { cwd: repoRoot, encoding: "utf8" }
  );
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Unsafe output path/);
  assert.equal(existsSync(join(repoRoot, "package.json")), true);
});

function run(args: string[]) {
  const result = spawnSync(process.execPath, [evaluationScript, ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert.equal(result.status, 0, `evaluation command failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  return result;
}
