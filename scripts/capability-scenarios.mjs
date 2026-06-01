#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const reportsDir = join(repoRoot, "reports");
const jsonReportPath = join(reportsDir, "capability-scenarios.json");
const markdownReportPath = join(reportsDir, "capability-scenarios.md");
const cliPath = existsSync(join(repoRoot, "src", "cli.ts")) ? join(repoRoot, "src", "cli.ts") : join(repoRoot, "dist", "cli.js");

const options = parseArgs(process.argv.slice(2));

if (options.help) {
  printHelp();
  process.exit(0);
}

const matrixCapabilities = readCapabilityIds();
const scenarios = buildScenarios();
const manifestFindings = validateScenarioManifest(scenarios, matrixCapabilities);

if (options.list) {
  console.log(JSON.stringify({ type: "OrgAnchorCapabilityScenarioList", version: "1.0", scenarios: publicScenarios(scenarios) }, null, 2));
  process.exit(0);
}

if (options.manifestOnly) {
  if (manifestFindings.length > 0) {
    console.error(renderFindings(manifestFindings));
    process.exit(1);
  }
  console.log(`Capability scenario manifest PASS: ${scenarios.length} scenarios`);
  process.exit(0);
}

const selected = scenarios.filter((scenario) => {
  if (options.scenarioIds.length > 0 && !options.scenarioIds.includes(scenario.id)) return false;
  if (scenario.status === "EXTERNAL_OPTIONAL" && !options.includeNetwork) return false;
  return true;
});

const skipped = scenarios
  .filter((scenario) => !selected.includes(scenario))
  .map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    status: "SKIPPED",
    reason:
      scenario.status === "EXTERNAL_OPTIONAL" && !options.includeNetwork
        ? "External/network scenario skipped by default. Re-run with --include-network."
        : "Scenario was not selected.",
    capabilities: scenario.capabilities,
    command_paths: scenario.commands
  }));

const results = [];
const startedAt = new Date();
if (manifestFindings.length > 0) {
  results.push({
    id: "MANIFEST",
    title: "Scenario manifest validation",
    status: "FAIL",
    capabilities: [],
    command_paths: [],
    duration_ms: 0,
    findings: manifestFindings
  });
} else {
  for (const scenario of selected) {
    results.push(runScenario(scenario));
  }
}

const finishedAt = new Date();
const report = {
  type: "OrgAnchorCapabilityScenarioReport",
  version: "1.0",
  generated_at: finishedAt.toISOString(),
  started_at: startedAt.toISOString(),
  duration_ms: finishedAt.getTime() - startedAt.getTime(),
  scenario_source: "CAPABILITY_AUDIT_SCENARIOS.md",
  matrix_source: "CAPABILITY_TRACEABILITY_MATRIX.md",
  summary: summarize(results, skipped),
  scenarios: [...results, ...skipped]
};

if (!options.check) {
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(markdownReportPath, renderMarkdown(report), "utf8");
}

if (report.summary.fail_count > 0) {
  console.error(`Capability scenarios FAIL: ${report.summary.fail_count} failed, ${report.summary.pass_count} passed, ${report.summary.skipped_count} skipped`);
  if (!options.check) {
    console.error(`Wrote ${relative(jsonReportPath)} and ${relative(markdownReportPath)}`);
  }
  process.exit(1);
}

console.log(`Capability scenarios PASS: ${report.summary.pass_count} passed, ${report.summary.skipped_count} skipped`);
if (!options.check) {
  console.log(`Wrote ${relative(jsonReportPath)}`);
  console.log(`Wrote ${relative(markdownReportPath)}`);
}

function buildScenarios() {
  return [
    {
      id: "CAS-001",
      title: "Identity, /verify, claims/evidence, IPFS dry-run, and Arweave package smoke",
      status: "LOCAL_EXECUTABLE",
      capabilities: ["OA-001", "OA-002", "OA-003", "OA-007", "OA-008", "OA-014", "OA-015", "OA-022"],
      docs: ["CAPABILITY_AUDIT_SCENARIOS.md", "README.md", "RELEASE_INTEGRITY.md"],
      commands: ["node scripts/release-smoke.mjs"],
      limitations: "Uses dry-run/manual-package carrier checks for providers that need credentials, funds, or public infrastructure.",
      run: () => runNodeScript("scripts/release-smoke.mjs")
    },
    {
      id: "CAS-002",
      title: "Local AI-agent discovery loop",
      status: "LOCAL_EXECUTABLE",
      capabilities: ["OA-004", "OA-005", "OA-006", "OA-020"],
      docs: ["AGENT_INTEGRATION_GUIDE.md", "ORGANCHOR_BEACON.md", "DIRECTORY_SNAPSHOT_SPEC.md"],
      commands: ["node scripts/agent-discovery-demo.mjs --cleanup"],
      limitations: "Runs on localhost and proves low-cost loop mechanics, not internet-scale discovery coverage.",
      run: () => runNodeScript("scripts/agent-discovery-demo.mjs", ["--cleanup"])
    },
    {
      id: "CAS-003",
      title: "Package-facing and installed CLI smoke gates",
      status: "LOCAL_EXECUTABLE",
      capabilities: ["OA-021", "OA-022"],
      docs: ["RELEASE_PUBLISHING_PLAN.md", "NPM_TRUSTED_PUBLISHING.md", "RELEASE_INTEGRITY.md"],
      commands: ["node scripts/package-smoke.mjs", "node scripts/install-smoke.mjs"],
      limitations: "Simulates package contents and installed CLI locally; npm publication remains a separate release action.",
      run: () => {
        const packageSmoke = runNodeScript("scripts/package-smoke.mjs");
        const installSmoke = runNodeScript("scripts/install-smoke.mjs");
        return {
          observations: {
            package_smoke: requireOutput(packageSmoke.stdout, "Package smoke PASS"),
            install_smoke: requireOutput(installSmoke.stdout, "Install smoke PASS")
          },
          stdout: `${packageSmoke.stdout}\n${installSmoke.stdout}`,
          stderr: `${packageSmoke.stderr}\n${installSmoke.stderr}`
        };
      }
    },
    {
      id: "CAS-004",
      title: "S1/S2/S3/S4 value-evidence summary path",
      status: "LOCAL_EXECUTABLE",
      capabilities: ["OA-007", "OA-008", "OA-009", "OA-010", "OA-012"],
      docs: ["CLAIMS_EVIDENCE_PROTOCOL.md", "S2_THIRD_PARTY_MATERIAL_MODEL.md", "S3_RANDOM_SAMPLING_MODEL.md", "S4_REAL_WORLD_OBSERVATION_MODEL.md"],
      commands: ["node scripts/capability-scenarios.mjs --scenario CAS-004"],
      limitations: "Checks local summary/gap mechanics. It does not prove external institutions, sample-slot ledgers, observer networks, or real-world truth.",
      run: runEvidenceSummaryScenario
    },
    {
      id: "CAS-005",
      title: "Capability traceability matrix validation",
      status: "LOCAL_EXECUTABLE",
      capabilities: ["OA-001", "OA-002", "OA-003", "OA-004", "OA-005", "OA-006", "OA-007", "OA-008", "OA-009", "OA-010", "OA-011", "OA-012", "OA-013", "OA-014", "OA-015", "OA-016", "OA-017", "OA-018", "OA-019", "OA-020", "OA-021", "OA-022", "OA-023", "OA-024", "OA-025", "OA-026"],
      docs: ["CAPABILITY_TRACEABILITY_MATRIX.md"],
      commands: ["node scripts/capability-audit.mjs --check"],
      limitations: "Validates traceability metadata and references; it is not a substitute for scenario execution.",
      run: () => runNodeScript("scripts/capability-audit.mjs", ["--check"])
    },
    {
      id: "CAS-006",
      title: "Public OrgAnchor self-pilot compact verification",
      status: "EXTERNAL_OPTIONAL",
      capabilities: ["OA-004", "OA-023"],
      docs: ["FIRESEED_LAUNCH_DECISION_2026-06-01.md", "README.md", "RELEASE_INTEGRITY.md"],
      commands: ["node src/cli.ts verify url https://organchor.org --compact"],
      limitations: "Depends on current public web availability, DNS, TLS, and deployed self-pilot artifacts.",
      run: () => {
        const result = run(process.execPath, [cliPath, "verify", "url", "https://organchor.org", "--compact"], repoRoot);
        const compact = JSON.parse(result.stdout);
        if (!["PASS", "WARN"].includes(compact.overall_status)) {
          throw new Error(`Unexpected public compact status: ${compact.overall_status}`);
        }
        return {
          observations: {
            overall_status: compact.overall_status,
            identity_status: compact.identity_status,
            value_status: compact.value_status,
            conformance_status: compact.conformance_status
          },
          stdout: result.stdout,
          stderr: result.stderr
        };
      }
    }
  ];
}

function runScenario(scenario) {
  const started = Date.now();
  try {
    const output = scenario.run();
    return {
      id: scenario.id,
      title: scenario.title,
      status: "PASS",
      scenario_status: scenario.status,
      capabilities: scenario.capabilities,
      command_paths: scenario.commands,
      duration_ms: Date.now() - started,
      observations: output.observations ?? {},
      stdout_excerpt: excerpt(output.stdout),
      stderr_excerpt: excerpt(output.stderr),
      limitations: scenario.limitations
    };
  } catch (error) {
    return {
      id: scenario.id,
      title: scenario.title,
      status: "FAIL",
      scenario_status: scenario.status,
      capabilities: scenario.capabilities,
      command_paths: scenario.commands,
      duration_ms: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
      limitations: scenario.limitations
    };
  }
}

function runEvidenceSummaryScenario() {
  if (!existsSync(cliPath)) {
    throw new Error(`Could not find OrgAnchor CLI at ${cliPath}`);
  }

  const workspace = mkdtempSync(join(tmpdir(), "organchor-capability-evidence-"));
  try {
    writeFileSync(join(workspace, "s1-spec.md"), "# S1 spec\n\nOrganization-authored specification.\n", "utf8");
    writeFileSync(join(workspace, "s2-cert.md"), "# S2 certificate\n\nExternal certification pointer fixture.\n", "utf8");
    writeFileSync(join(workspace, "s3-sample.md"), "# S3 sample\n\nRandom market purchase sample fixture.\n", "utf8");
    writeFileSync(join(workspace, "s4-delivery.md"), "# S4 delivery\n\nObserved delivery window fixture.\n", "utf8");

    cli(workspace, ["init"]);
    cli(workspace, ["key", "generate", "--id", "root-2026"]);
    cli(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
    cli(workspace, [
      "claims",
      "create",
      "--config",
      "organchor.config.json",
      "--product-id",
      "model-x1",
      "--product-name",
      "Model X1",
      "--claim-id",
      "claim-001",
      "--evidence-id",
      "evidence-s1",
      "--claim",
      "Model X1 has an identity-bound value evidence package."
    ]);
    rewriteClaimRefs(workspace, ["evidence-s1", "evidence-s2", "evidence-s3", "evidence-s4"]);

    cli(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    cli(workspace, [
      "evidence",
      "add",
      "--file",
      "s1-spec.md",
      "--id",
      "evidence-s1",
      "--uri",
      "https://example.org/evidence/s1-spec.md",
      "--location-type",
      "https",
      "--reproducibility",
      "independently_reproducible",
      "--evidence-strength",
      "moderate",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-x1",
      "--limitations",
      "First-party evidence only."
    ]);
    cli(workspace, [
      "evidence",
      "method",
      "add",
      "--id",
      "method-s1",
      "--evidence-id",
      "evidence-s1",
      "--steps",
      "Fetch artifact;Compute SHA-256;Compare with signed manifest",
      "--expected-results",
      "Artifact hash matches;Claim relation is present",
      "--cost-to-verify",
      "low"
    ]);

    cli(workspace, [
      "evidence",
      "add",
      "--file",
      "s2-cert.md",
      "--id",
      "evidence-s2",
      "--uri",
      "https://issuer.example/records/ABC-123",
      "--location-type",
      "https",
      "--issuer-type",
      "third_party",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-x1"
    ]);
    cli(workspace, [
      "evidence",
      "s2",
      "attach",
      "--evidence-id",
      "evidence-s2",
      "--template",
      "certification_record",
      "--issuer-name",
      "Example Certification Body",
      "--anchor-url",
      "https://issuer.example/records/ABC-123",
      "--anchor-record-id",
      "ABC-123",
      "--scope",
      "Certificate-style third-party material is claimed to support claim-001 for model-x1.",
      "--claim-id",
      "claim-001",
      "--covered-subject-type",
      "product_model",
      "--covered-subject-id",
      "model-x1",
      "--sample-source",
      "organization_provided",
      "--selected-by",
      "organization",
      "--relationship",
      "paid_certification"
    ]);

    cli(workspace, [
      "evidence",
      "add",
      "--file",
      "s3-sample.md",
      "--id",
      "evidence-s3",
      "--uri",
      "https://directory.example/vault/s3-sample",
      "--location-type",
      "https",
      "--issuer-type",
      "third_party",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-x1"
    ]);
    cli(workspace, [
      "evidence",
      "s3",
      "attach",
      "--evidence-id",
      "evidence-s3",
      "--template",
      "market_purchase",
      "--sampler-type",
      "buyer",
      "--sampler-name",
      "Example Buyer Agent",
      "--acquired-at",
      "2026-05-28T00:00:00Z",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-x1",
      "--claim-id",
      "claim-001",
      "--claim-version",
      "2026-05",
      "--sample-pool-id",
      "s3-pool-claim-001-2026-05",
      "--sample-slot-id",
      "sample-slot-claim-001-2026-05-001",
      "--max-active-samples",
      "24",
      "--credential-hash",
      "sha256:1111111111111111111111111111111111111111111111111111111111111111",
      "--sample-nullifier",
      "sha256:2222222222222222222222222222222222222222222222222222222222222222",
      "--credential-issuer-key-id",
      "product-key-2026",
      "--credential-verified-against-root",
      "--selector-control",
      "buyer",
      "--storage-role",
      "DIRECTORY_VAULT",
      "--raw-availability-status",
      "REQUEST_REQUIRED",
      "--vault-operator",
      "Example Directory Vault",
      "--vault-origin",
      "https://directory.example",
      "--custody-documented",
      "--custody-notes",
      "Buyer retained receipt, packaging photos, and sample handoff notes.",
      "--scope",
      "Random market purchase sample supports claim-001 for model-x1."
    ]);

    cli(workspace, [
      "evidence",
      "add",
      "--file",
      "s4-delivery.md",
      "--id",
      "evidence-s4",
      "--uri",
      "https://observer.example/vault/s4-delivery",
      "--location-type",
      "https",
      "--issuer-type",
      "third_party",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-x1"
    ]);
    cli(workspace, [
      "evidence",
      "s4",
      "attach",
      "--evidence-id",
      "evidence-s4",
      "--template",
      "order_delivery",
      "--observer-id",
      "buyer.example",
      "--window-start",
      "2026-05-01T00:00:00Z",
      "--window-end",
      "2026-05-31T00:00:00Z",
      "--subject-type",
      "product_model",
      "--subject-id",
      "model-x1",
      "--claim-id",
      "claim-001",
      "--scope",
      "Observed delivery window supports claim-001 for model-x1.",
      "--raw-bundle-hash",
      "sha256:3333333333333333333333333333333333333333333333333333333333333333",
      "--vault-uri",
      "https://observer.example/vault/s4-delivery",
      "--order-count",
      "3",
      "--on-time-delivery-count",
      "3",
      "--delayed-delivery-count",
      "0",
      "--quality-issue-count",
      "0"
    ]);

    const audit = cli(workspace, [
      "value",
      "audit",
      "--claims",
      "claims/product-claims.json",
      "--evidence",
      "evidence/evidence-manifest.json",
      "--check-files"
    ]);
    requireOutput(audit.stdout, "Value continuity audit complete");

    const report = JSON.parse(readFileSync(join(workspace, "reports", "value-continuity-report.json"), "utf8"));
    assertEqual(report.summary.total_evidence_items, 4, "total_evidence_items");
    assertEqual(report.summary.evidence_linked_claims, 1, "evidence_linked_claims");
    assertEqual(report.claims?.[0]?.resolved_evidence_refs?.length, 4, "resolved evidence refs");
    assertEqual(report.s2_summary.effective_s2_count, 1, "effective_s2_count");
    assertEqual(report.s3_summary.effective_s3_count, 1, "effective_s3_count");
    assertEqual(report.s4_summary.effective_s4_count, 1, "effective_s4_count");

    return {
      observations: {
        total_evidence_items: report.summary.total_evidence_items,
        resolved_evidence_refs: report.claims?.[0]?.resolved_evidence_refs?.length,
        effective_s2_count: report.s2_summary.effective_s2_count,
        effective_s3_count: report.s3_summary.effective_s3_count,
        effective_s4_count: report.s4_summary.effective_s4_count,
        s3_missing_sample_slot_count: report.s3_summary.missing_sample_slot_count,
        s3_missing_duplicate_control_count: report.s3_summary.missing_duplicate_control_count,
        s4_raw_bundle_available_count: report.s4_summary.raw_bundle_available_count
      },
      stdout: audit.stdout,
      stderr: audit.stderr
    };
  } finally {
    const resolved = resolve(workspace);
    const tempRoot = resolve(tmpdir());
    if (resolved.startsWith(tempRoot)) {
      rmSync(resolved, { recursive: true, force: true });
    }
  }
}

function rewriteClaimRefs(workspace, refs) {
  const path = join(workspace, "claims", "product-claims.json");
  const claims = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(claims.claims) || claims.claims.length !== 1) {
    throw new Error("Expected claims fixture to contain exactly one claim");
  }
  claims.claims[0].evidence_refs = refs;
  claims.claims[0].claim_scope = {
    subject_type: "product_model",
    subject_id: "model-x1"
  };
  claims.claims[0].real_world_profile = "physical_product";
  writeFileSync(path, `${JSON.stringify(claims, null, 2)}\n`, "utf8");
}

function cli(cwd, args) {
  return run(process.execPath, [cliPath, ...args], cwd);
}

function runNodeScript(relativeScript, args = []) {
  return run(process.execPath, [join(repoRoot, relativeScript), ...args], repoRoot);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
  return result;
}

function requireOutput(stdout, expected) {
  if (!stdout.includes(expected)) {
    throw new Error(`Expected output to include "${expected}", got:\n${stdout}`);
  }
  return true;
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, got ${actual}`);
}

function readCapabilityIds() {
  const matrixPath = join(repoRoot, "CAPABILITY_TRACEABILITY_MATRIX.md");
  const matrix = readFileSync(matrixPath, "utf8");
  return new Set([...matrix.matchAll(/\|\s*(OA-\d{3})\s*\|/g)].map((match) => match[1]));
}

function validateScenarioManifest(scenarios, capabilityIds) {
  const findings = [];
  const scenarioIds = new Set();
  for (const scenario of scenarios) {
    if (!/^CAS-\d{3}$/.test(scenario.id)) findings.push(`Invalid scenario id: ${scenario.id}`);
    if (scenarioIds.has(scenario.id)) findings.push(`Duplicate scenario id: ${scenario.id}`);
    scenarioIds.add(scenario.id);
    if (!scenario.title) findings.push(`${scenario.id} is missing title`);
    if (!["LOCAL_EXECUTABLE", "EXTERNAL_OPTIONAL", "MANUAL_EXTERNAL", "DESIGN_PREVIEW"].includes(scenario.status)) {
      findings.push(`${scenario.id} has unsupported status: ${scenario.status}`);
    }
    for (const id of scenario.capabilities) {
      if (!capabilityIds.has(id)) findings.push(`${scenario.id} references unknown capability: ${id}`);
    }
    for (const doc of scenario.docs) {
      if (!existsSync(join(repoRoot, doc))) findings.push(`${scenario.id} references missing doc: ${doc}`);
    }
    for (const command of scenario.commands) {
      if (!isKnownCommand(command)) findings.push(`${scenario.id} has unexpected command form: ${command}`);
    }
  }
  return findings;
}

function isKnownCommand(command) {
  return command.startsWith("node ") || command.startsWith("npm ") || command.startsWith("organchor ");
}

function summarize(results, skipped) {
  const all = [...results, ...skipped];
  return {
    total_scenarios: all.length,
    selected_scenarios: results.length,
    pass_count: all.filter((item) => item.status === "PASS").length,
    fail_count: all.filter((item) => item.status === "FAIL").length,
    skipped_count: all.filter((item) => item.status === "SKIPPED").length,
    covered_capabilities: [...new Set(results.flatMap((item) => item.capabilities ?? []))].sort(),
    skipped_capabilities: [...new Set(skipped.flatMap((item) => item.capabilities ?? []))].sort()
  };
}

function renderMarkdown(report) {
  const lines = [
    "# OrgAnchor Capability Scenario Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    "## Summary",
    "",
    `- Total scenarios: ${report.summary.total_scenarios}`,
    `- Selected scenarios: ${report.summary.selected_scenarios}`,
    `- Passed: ${report.summary.pass_count}`,
    `- Failed: ${report.summary.fail_count}`,
    `- Skipped: ${report.summary.skipped_count}`,
    `- Covered capabilities: ${report.summary.covered_capabilities.join(", ") || "none"}`,
    "",
    "## Scenarios",
    "",
    "| Status | Scenario | Capabilities | Duration | Observations |",
    "| --- | --- | --- | ---: | --- |"
  ];

  for (const scenario of report.scenarios) {
    lines.push(
      `| ${scenario.status} | ${scenario.id} ${escapeCell(scenario.title)} | ${(scenario.capabilities ?? []).join(", ")} | ${scenario.duration_ms ?? 0} ms | ${escapeCell(observationSummary(scenario))} |`
    );
  }

  lines.push("", "## Limits", "");
  for (const scenario of report.scenarios.filter((item) => item.limitations)) {
    lines.push(`- ${scenario.id}: ${scenario.limitations}`);
  }

  return `${lines.join("\n")}\n`;
}

function observationSummary(scenario) {
  if (scenario.status === "SKIPPED") return scenario.reason ?? "skipped";
  if (scenario.status === "FAIL") return scenario.error ?? "failed";
  const entries = Object.entries(scenario.observations ?? {});
  if (entries.length === 0) return "passed";
  return entries.map(([key, value]) => `${key}=${String(value)}`).join("; ");
}

function publicScenarios(scenarios) {
  return scenarios.map((scenario) => ({
    id: scenario.id,
    title: scenario.title,
    status: scenario.status,
    capabilities: scenario.capabilities,
    docs: scenario.docs,
    commands: scenario.commands,
    limitations: scenario.limitations
  }));
}

function renderFindings(findings) {
  return findings.map((finding) => `- ${finding}`).join("\n");
}

function excerpt(value) {
  if (!value) return "";
  const trimmed = value.trim();
  if (trimmed.length <= 2000) return trimmed;
  return `${trimmed.slice(0, 2000)}\n...`;
}

function escapeCell(value) {
  return String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");
}

function relative(path) {
  return normalize(path).slice(normalize(repoRoot).length + 1);
}

function parseArgs(args) {
  const parsed = {
    check: false,
    help: false,
    includeNetwork: false,
    list: false,
    manifestOnly: false,
    scenarioIds: []
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--check") {
      parsed.check = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--include-network") {
      parsed.includeNetwork = true;
      continue;
    }
    if (arg === "--list") {
      parsed.list = true;
      continue;
    }
    if (arg === "--manifest-only") {
      parsed.manifestOnly = true;
      continue;
    }
    if (arg === "--scenario") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error("--scenario requires a scenario id");
      parsed.scenarioIds.push(value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return parsed;
}

function printHelp() {
  console.log(`OrgAnchor capability scenario audit

Usage:
  node scripts/capability-scenarios.mjs
  node scripts/capability-scenarios.mjs --check
  node scripts/capability-scenarios.mjs --manifest-only
  node scripts/capability-scenarios.mjs --list
  node scripts/capability-scenarios.mjs --scenario CAS-004
  node scripts/capability-scenarios.mjs --include-network

Default mode runs local executable scenarios and writes reports/capability-scenarios.json plus reports/capability-scenarios.md.
`);
}
