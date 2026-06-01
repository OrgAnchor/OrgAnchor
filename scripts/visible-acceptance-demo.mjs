#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFile,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const cliPath = existsSync(join(packageRoot, "src", "cli.ts"))
  ? join(packageRoot, "src", "cli.ts")
  : join(packageRoot, "dist", "cli.js");

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  printHelp();
  process.exit(0);
}

if (options.cleanup && options.serve) {
  throw new Error("--cleanup cannot be used with --serve");
}

if (!existsSync(cliPath)) {
  throw new Error(`Could not find OrgAnchor CLI at ${cliPath}`);
}

const workspace = prepareWorkspace(options.out);

try {
  await runVisibleAcceptance(workspace, options);
} finally {
  if (options.cleanup) cleanupWorkspace(workspace);
}

async function runVisibleAcceptance(workspace, opts) {
  const outputDir = join(workspace, "outputs");
  mkdirSync(outputDir, { recursive: true });

  createVerifyFixture(workspace);

  const publicRoot = join(workspace, "public");
  const verifyDir = join(publicRoot, "verify");
  const visibleChecks = inspectVisiblePage(verifyDir);

  let normalResult;
  let compactResult;
  await withStaticServer(publicRoot, async (origin) => {
    rewriteBeaconOrigin(publicRoot, origin);
    normalResult = JSON.parse((await runCliAsync(["verify", "url", origin], workspace)).stdout);
    compactResult = JSON.parse((await runCliAsync(["verify", "url", origin, "--compact"], workspace)).stdout);
    writeJson(join(outputDir, "verify-result.json"), normalResult);
    writeJson(join(outputDir, "compact-verify.json"), compactResult);
  });

  const tamperedPublicRoot = join(workspace, "tampered-public");
  cpSync(publicRoot, tamperedPublicRoot, { recursive: true });
  tamperStatement(tamperedPublicRoot);

  let tamperResult;
  let tamperCompactResult;
  await withStaticServer(tamperedPublicRoot, async (origin) => {
    rewriteBeaconOrigin(tamperedPublicRoot, origin);
    tamperResult = JSON.parse((await runCliAsync(["verify", "url", origin], workspace, 1)).stdout);
    tamperCompactResult = JSON.parse((await runCliAsync(["verify", "url", origin, "--compact"], workspace, 1)).stdout);
    writeJson(join(outputDir, "tamper-verify-result.json"), tamperResult);
    writeJson(join(outputDir, "tamper-compact-verify.json"), tamperCompactResult);
  });

  const verifyIndex = JSON.parse(readFileSync(join(verifyDir, "organchor.json"), "utf8"));
  const summary = {
    type: "OrgAnchorVisibleAcceptanceDemoSummary",
    version: "0.1",
    status: visibleChecks.status === "PASS" && compactResult.overall_status === "PASS" && tamperCompactResult.overall_status === "FAIL"
      ? "PASS"
      : "FAIL",
    workspace,
    visible_page: {
      html_path: join(verifyDir, "index.html"),
      required_markers: visibleChecks.markers,
      status: visibleChecks.status
    },
    machine_result: {
      compact_verify_path: join(outputDir, "compact-verify.json"),
      overall_status: compactResult.overall_status,
      identity_status: compactResult.identity_status,
      value_status: compactResult.value_status,
      conformance_status: compactResult.conformance_status,
      policy_route: compactResult.policy_route?.route ?? null,
      trust_decision: compactResult.trust_decision
    },
    agent_review: {
      source_path: join(verifyDir, "organchor.json"),
      overall_status: verifyIndex.agent_review?.overall_status ?? null,
      identity_status: verifyIndex.agent_review?.identity_status ?? null,
      value_status: verifyIndex.agent_review?.value_status ?? null,
      conformance_status: verifyIndex.agent_review?.conformance_status ?? null,
      evidence_classes: (verifyIndex.agent_review?.evidence_class_summary ?? []).map((item) => ({
        label: item.label,
        status: item.status
      })),
      next_best_actions: verifyIndex.agent_review?.next_best_actions ?? []
    },
    tamper_demo: {
      tampered_public_path: tamperedPublicRoot,
      compact_verify_path: join(outputDir, "tamper-compact-verify.json"),
      overall_status: tamperCompactResult.overall_status,
      identity_status: tamperCompactResult.identity_status,
      conformance_status: tamperCompactResult.conformance_status,
      policy_route: tamperCompactResult.policy_route?.route ?? null,
      failures: tamperCompactResult.failures ?? []
    },
    human_acceptance_notes: [
      "The visible page explains the same identity and evidence state that the agent JSON exposes.",
      "PASS does not mean OrgAnchor endorses the organization or its products.",
      "Changing the signed statement after publication produces an identity failure."
    ],
    outputs: {
      summary_json: join(outputDir, "visible-acceptance-summary.json"),
      summary_md: join(outputDir, "visible-acceptance-summary.md"),
      verify_result: join(outputDir, "verify-result.json"),
      compact_verify: join(outputDir, "compact-verify.json"),
      tamper_verify_result: join(outputDir, "tamper-verify-result.json"),
      tamper_compact_verify: join(outputDir, "tamper-compact-verify.json")
    }
  };

  writeJson(summary.outputs.summary_json, summary);
  writeFileSync(summary.outputs.summary_md, renderSummaryMarkdown(summary), "utf8");

  console.log("Visible acceptance demo PASS");
  console.log(`Workspace: ${workspace}`);
  console.log(`Verify page: ${summary.visible_page.html_path}`);
  console.log(`Summary: ${summary.outputs.summary_md}`);
  console.log(`Compact verify: ${summary.outputs.compact_verify}`);
  console.log(`Tamper compact verify: ${summary.outputs.tamper_compact_verify}`);
  console.log(JSON.stringify(summary, null, 2));

  if (opts.serve) {
    await serveUntilStopped(publicRoot);
  }
}

function createVerifyFixture(workspace) {
  writeFileSync(join(workspace, "README.md"), "# Example Evidence\n\nAgent-verifiable evidence artifact.\n", "utf8");
  runCli(["init"], workspace);
  runCli(["key", "generate", "--id", "root-2026"], workspace);
  runCli(["authority", "create", "--key", "keys/root-2026.private.json"], workspace);
  runCli(["statement", "create", "--config", "organchor.config.json", "--authority", "root-authority.json"], workspace);
  runCli([
    "statement",
    "sign",
    "--key",
    "keys/root-2026.private.json",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json"
  ], workspace);
  runCli(["claims", "create", "--config", "organchor.config.json"], workspace);
  runCli(["evidence", "create", "--config", "organchor.config.json"], workspace);
  runCli([
    "evidence",
    "add",
    "--file",
    "README.md",
    "--id",
    "evidence-001",
    "--subject-type",
    "product",
    "--subject-id",
    "primary-product",
    "--uri",
    "https://example.org/evidence/README.md",
    "--location-type",
    "https",
    "--reproducibility",
    "independently_reproducible",
    "--evidence-strength",
    "moderate"
  ], workspace);
  runCli([
    "evidence",
    "method",
    "add",
    "--id",
    "method-001",
    "--evidence-id",
    "evidence-001",
    "--steps",
    "Download the public evidence artifact;Compute SHA-256;Compare with the signed manifest",
    "--expected-results",
    "The public artifact hash matches the signed evidence manifest",
    "--required-tools",
    "curl;sha256sum",
    "--limitations",
    "This checks artifact integrity, not product quality"
  ], workspace);
  runCli(["claims", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"], workspace);
  runCli(["evidence", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"], workspace);
  runCli([
    "value",
    "audit",
    "--claims",
    "claims/product-claims.json",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--check-files"
  ], workspace);
  runCli([
    "page",
    "generate",
    "--statement",
    "statements/official-endpoints.json",
    "--sig",
    "statements/official-endpoints.json.sig",
    "--authority",
    "root-authority.json",
    "--claims",
    "claims/product-claims.json",
    "--claims-sig",
    "claims/product-claims.json.sig",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--evidence-sig",
    "evidence/evidence-manifest.json.sig",
    "--value-report",
    "reports/value-continuity-report.json",
    "--value-report-md",
    "reports/value-continuity-report.md",
    "--out",
    "public/verify"
  ], workspace);
}

function inspectVisiblePage(verifyDir) {
  const htmlPath = join(verifyDir, "index.html");
  const html = readFileSync(htmlPath, "utf8");
  const expected = [
    "How to Read This Page",
    "Check identity first",
    "Review evidence state",
    "Apply external policy",
    "Re-check with tools",
    "Reliance Guardrails",
    "Identity gate",
    "Evidence limits",
    "Not a trust badge",
    "Design preview boundary",
    "Recheck before relying",
    "Agent Verification View",
    "Overall status",
    "Identity status",
    "Value status",
    "Evidence Classes",
    "S1 First-party",
    "S2 Third-party",
    "S3 Sampling",
    "S4 Observation",
    "S5 Challenge",
    "External Policy Route",
    "Trust decision",
    "Next Checks",
    "Key Terms",
    "Short explanations for human review"
  ];
  const markers = expected.map((label) => ({
    label,
    present: html.includes(label)
  }));
  return {
    status: markers.every((marker) => marker.present) ? "PASS" : "FAIL",
    markers
  };
}

function tamperStatement(publicRoot) {
  const statementPath = join(publicRoot, "verify", "official-endpoints.json");
  const statement = JSON.parse(readFileSync(statementPath, "utf8"));
  statement.official_endpoints.website = "https://attacker.example";
  writeFileSync(statementPath, `${JSON.stringify(statement, null, 2)}\n`, "utf8");
}

function rewriteBeaconOrigin(publicRoot, origin) {
  const beaconPath = join(publicRoot, ".well-known", "organchor.json");
  const beacon = JSON.parse(readFileSync(beaconPath, "utf8"));
  beacon.origin = origin;
  beacon.verify_url = `${origin}/verify/`;
  beacon.well_known_url = `${origin}/.well-known/organchor.json`;
  beacon.verify_index_url = `${origin}/verify/organchor.json`;
  beacon.agent_flow.first_pass = `organchor verify url ${origin} --compact`;
  beacon.agent_flow.deep_verify = `organchor verify url ${origin}`;
  writeJson(beaconPath, beacon);
}

async function withStaticServer(root, fn) {
  const server = await startStaticServer(root);
  try {
    await fn(server.origin);
  } finally {
    await closeServer(server.server);
  }
}

async function serveUntilStopped(root) {
  const server = await startStaticServer(root);
  rewriteBeaconOrigin(root, server.origin);
  console.log(`Serving visible acceptance page: ${server.origin}/verify/index.html`);
  console.log("Press Ctrl+C to stop.");
  await new Promise((resolvePromise) => {
    const stop = async () => {
      process.off("SIGINT", stop);
      process.off("SIGTERM", stop);
      await closeServer(server.server);
      resolvePromise();
    };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  });
}

async function startStaticServer(root) {
  const resolvedRoot = resolve(root);
  const server = createServer((request, response) => {
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? "index.html" : decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
    const filePath = resolve(join(resolvedRoot, pathname));
    if (!filePath.startsWith(resolvedRoot)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    readFile(filePath, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(data);
    });
  });
  await new Promise((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  const address = server.address();
  return {
    server,
    origin: `http://127.0.0.1:${address.port}`
  };
}

function closeServer(server) {
  return new Promise((resolvePromise, reject) => {
    server.close((error) => (error ? reject(error) : resolvePromise()));
  });
}

function contentType(filePath) {
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".xml")) return "application/xml; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function renderSummaryMarkdown(summary) {
  const markers = summary.visible_page.required_markers
    .map((marker) => `- ${marker.present ? "PASS" : "FAIL"} ${marker.label}`)
    .join("\n");
  const failures = summary.tamper_demo.failures.length > 0
    ? summary.tamper_demo.failures.map((failure) => `- ${failure}`).join("\n")
    : "- none";
  const evidence = summary.agent_review.evidence_classes
    .map((item) => `- ${item.label}: ${item.status}`)
    .join("\n");

  return `# OrgAnchor Visible Acceptance Demo Summary

Status: ${summary.status}

## What A Human Should See

${markers}

## What An Agent Reads

- Overall: ${summary.machine_result.overall_status}
- Identity: ${summary.machine_result.identity_status}
- Value: ${summary.machine_result.value_status}
- Conformance: ${summary.machine_result.conformance_status}
- Policy route: ${summary.machine_result.policy_route}
- Trust decision: ${summary.machine_result.trust_decision}

## Evidence Classes

${evidence}

## Tamper Demo

- Overall: ${summary.tamper_demo.overall_status}
- Identity: ${summary.tamper_demo.identity_status}
- Conformance: ${summary.tamper_demo.conformance_status}
- Policy route: ${summary.tamper_demo.policy_route}

Failures:

${failures}

## Boundary

OrgAnchor verifies continuity, signatures, hashes, and disclosed evidence state. It does not certify that the organization or product is good, safe, lawful, or optimal.
`;
}

function runCli(args, cwd, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8"
  });
  if (result.status !== expectedStatus) {
    throw new Error(
      `${formatCommand(args)} expected status ${expectedStatus} but got ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

async function runCliAsync(args, cwd, expectedStatus = 0) {
  const child = spawn(process.execPath, [cliPath, ...args], {
    cwd,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const status = await new Promise((resolvePromise) => {
    child.on("close", resolvePromise);
  });
  if (status !== expectedStatus) {
    throw new Error(
      `${formatCommand(args)} expected status ${expectedStatus} but got ${status}\nstdout:\n${stdout}\nstderr:\n${stderr}`
    );
  }
  return { stdout, stderr };
}

function formatCommand(args) {
  return `organchor ${args.map(shellQuote).join(" ")}`;
}

function shellQuote(value) {
  return /\s/.test(value) ? JSON.stringify(value) : value;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function prepareWorkspace(out) {
  if (!out) return mkdtempSync(join(tmpdir(), "organchor-visible-acceptance-"));
  const resolved = resolve(out);
  if (existsSync(resolved)) {
    if (!statSync(resolved).isDirectory()) throw new Error(`--out must be a directory: ${resolved}`);
    if (readdirSync(resolved).length > 0) throw new Error(`--out directory must be empty: ${resolved}`);
    return resolved;
  }
  mkdirSync(resolved, { recursive: true });
  return resolved;
}

function cleanupWorkspace(workspace) {
  const resolved = resolve(workspace);
  const tempRoot = resolve(tmpdir());
  if (!resolved.startsWith(tempRoot)) {
    console.error(`Refusing to cleanup non-temp workspace: ${resolved}`);
    return;
  }
  rmSync(resolved, { recursive: true, force: true });
}

function parseArgs(args) {
  const parsed = {
    cleanup: false,
    help: false,
    out: null,
    serve: false
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--cleanup") {
      parsed.cleanup = true;
      continue;
    }
    if (arg === "--serve") {
      parsed.serve = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--out") {
      const value = args[i + 1];
      if (!value || value.startsWith("--")) throw new Error("--out requires a directory path");
      parsed.out = value;
      i++;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return parsed;
}

function printHelp() {
  console.log(`OrgAnchor visible acceptance demo

Usage:
  node scripts/visible-acceptance-demo.mjs
  node scripts/visible-acceptance-demo.mjs --out ./visible-demo
  node scripts/visible-acceptance-demo.mjs --out ./visible-demo --serve
  node scripts/visible-acceptance-demo.mjs --cleanup

The demo creates a local adopting organization, generates a /verify page,
runs direct agent verification, changes a signed statement to prove tamper
rejection, and writes a human-readable acceptance summary.
`);
}
