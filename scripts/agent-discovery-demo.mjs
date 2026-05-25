#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import {
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

if (!existsSync(cliPath)) {
  throw new Error(`Could not find OrgAnchor CLI at ${cliPath}`);
}

const workspace = prepareWorkspace(options.out);
const cleanup = options.cleanup === true;

try {
  await runDemo(workspace);
} finally {
  if (cleanup) {
    cleanupWorkspace(workspace);
  }
}

async function runDemo(workspace) {
  const outputDir = join(workspace, "outputs");
  mkdirSync(outputDir, { recursive: true });
  createFullVerifyFixture(workspace);

  await withStaticServer(join(workspace, "public"), async (origin) => {
    runCli([
      "beacon",
      "generate",
      "--verify-dir",
      "public/verify",
      "--out-public",
      "public",
      "--origin",
      origin,
      "--category",
      "software",
      "--capability",
      "identity-continuity,agent-verification",
      "--region",
      "global",
      "--language",
      "en"
    ], workspace);
    writeFileSync(
      join(workspace, "public", "index.html"),
      `<html><head><link rel="organchor" href="/.well-known/organchor.json"></head><body>OrgAnchor local discovery demo</body></html>\n`,
      "utf8"
    );

    const seedsPath = join(workspace, "seeds.txt");
    const sweepPath = join(outputDir, "beacon-sweep.ndjson");
    const indexPath = join(outputDir, "beacon-index.json");
    const queryPath = join(outputDir, "beacon-query-result.json");
    const reportPath = join(outputDir, "beacon-discovery-report.json");
    const compactPath = join(outputDir, "compact-verify.json");
    const commandsPath = join(outputDir, "commands.txt");
    const directoryOut = join(workspace, "public", "directory");
    const directorySnapshotPath = join(directoryOut, "directory-snapshot.json");
    const directoryPolicyPath = join(directoryOut, "directory-policy.json");
    const directoryFeedPath = join(outputDir, "directory-feed.ndjson");

    writeFileSync(seedsPath, `# Local OrgAnchor discovery demo seed\n${origin}\n`, "utf8");

    const commands = [
      [
        "beacon",
        "sweep",
        "--seeds",
        seedsPath,
        "--crawl",
        origin,
        "--crawl-max-pages",
        "5",
        "--crawl-max-depth",
        "1",
        "--out",
        sweepPath,
        "--concurrency",
        "1",
        "--timeout-ms",
        "10000"
      ],
      ["beacon", "verify", "--in", sweepPath],
      ["beacon", "index", "--in", sweepPath, "--out", indexPath],
      [
        "directory",
        "build",
        "--beacon-index",
        indexPath,
        "--node-origin",
        origin,
        "--policy-url",
        `${origin}/directory/directory-policy.json`,
        "--snapshot-id",
        "local-agent-demo-directory",
        "--out",
        directoryOut
      ],
      [
        "directory",
        "export",
        "--snapshot",
        directorySnapshotPath,
        "--format",
        "ndjson",
        "--out",
        directoryFeedPath
      ],
      [
        "beacon",
        "query",
        "--index",
        indexPath,
        "--need",
        "identity continuity support",
        "--capability",
        "identity-continuity",
        "--conformance",
        "FULL_COMPATIBLE",
        "--limit",
        "5",
        "--out",
        queryPath
      ],
      ["beacon", "report", "--sweeps", sweepPath, "--out", reportPath],
      ["verify", "url", origin, "--compact"]
    ];
    writeFileSync(commandsPath, `${commands.map(formatCommand).join("\n")}\n`, "utf8");

    const sweepSummary = await runCliAsync(commands[0], workspace);
    writeFileSync(join(outputDir, "beacon-sweep-summary.json"), sweepSummary.stdout, "utf8");
    const sweepVerify = await runCliAsync(commands[1], workspace);
    writeFileSync(join(outputDir, "beacon-sweep-verify.json"), sweepVerify.stdout, "utf8");
    const indexSummary = await runCliAsync(commands[2], workspace);
    writeFileSync(join(outputDir, "beacon-index-summary.json"), indexSummary.stdout, "utf8");
    const directoryBuild = await runCliAsync(commands[3], workspace);
    writeFileSync(join(outputDir, "directory-build.txt"), directoryBuild.stdout, "utf8");
    const directoryExport = await runCliAsync(commands[4], workspace);
    writeFileSync(join(outputDir, "directory-export-summary.json"), directoryExport.stdout, "utf8");
    const query = await runCliAsync(commands[5], workspace);
    const report = await runCliAsync(commands[6], workspace);
    writeFileSync(join(outputDir, "beacon-report-summary.json"), report.stdout, "utf8");
    const compact = await runCliAsync(commands[7], workspace);
    writeFileSync(compactPath, compact.stdout, "utf8");

    const queryResult = JSON.parse(query.stdout);
    const reportResult = JSON.parse(report.stdout);
    const compactResult = JSON.parse(compact.stdout);
    const summary = {
      type: "OrgAnchorAgentDiscoveryDemoSummary",
      version: "0.1",
      status: "PASS",
      workspace,
      cleaned_up: cleanup,
      local_origin: origin,
      outputs: {
        seeds: seedsPath,
        sweep: sweepPath,
        sweep_verify: join(outputDir, "beacon-sweep-verify.json"),
        index: indexPath,
        directory_snapshot: directorySnapshotPath,
        directory_policy: directoryPolicyPath,
        directory_feed: directoryFeedPath,
        query: queryPath,
        discovery_report: reportPath,
        compact_verify: compactPath,
        commands: commandsPath
      },
      observed: {
        candidates: queryResult.counts?.returned_records ?? 0,
        strongest_candidate_origins: queryResult.match_report?.summary?.strongest_candidate_origins ?? [],
        beacon_find_rate: reportResult.rates?.beacon_find_rate ?? null,
        origin_verification_success_rate: reportResult.rates?.origin_verification_success_rate ?? null,
        compact_overall_status: compactResult.overall_status,
        compact_identity_status: compactResult.identity_status,
        compact_value_status: compactResult.value_status,
        compact_conformance_status: compactResult.conformance_status
      }
    };
    writeFileSync(join(outputDir, "demo-summary.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");

    console.log("Agent discovery demo PASS");
    console.log(`Workspace: ${workspace}`);
    console.log(`Local origin: ${origin}`);
    console.log(`Query result: ${queryPath}`);
    console.log(`Compact verify: ${compactPath}`);
    console.log(`Commands: ${commandsPath}`);
    console.log(JSON.stringify(summary, null, 2));
  });
}

function createFullVerifyFixture(workspace) {
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
    "--uri",
    "https://example.org/evidence/README.md",
    "--location-type",
    "https",
    "--reproducibility",
    "independently_reproducible",
    "--evidence-strength",
    "moderate"
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

async function withStaticServer(root, fn) {
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
  try {
    const address = server.address();
    await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolvePromise, reject) => {
      server.close((error) => (error ? reject(error) : resolvePromise()));
    });
  }
}

function contentType(filePath) {
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".xml")) return "application/xml; charset=utf-8";
  return "text/plain; charset=utf-8";
}

function runCli(args, cwd) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(
      `${formatCommand(args)} failed with status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

async function runCliAsync(args, cwd) {
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
  if (status !== 0) {
    throw new Error(
      `${formatCommand(args)} failed with status ${status}\nstdout:\n${stdout}\nstderr:\n${stderr}`
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

function prepareWorkspace(out) {
  if (!out) return mkdtempSync(join(tmpdir(), "organchor-agent-discovery-demo-"));
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
    out: null
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--cleanup") {
      parsed.cleanup = true;
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
  console.log(`OrgAnchor local agent discovery demo

Usage:
  node scripts/agent-discovery-demo.mjs
  node scripts/agent-discovery-demo.mjs --out ./demo-workspace
  node scripts/agent-discovery-demo.mjs --cleanup

The demo creates a temporary OrgAnchor adopter, serves it on localhost, then runs:
  organchor beacon sweep
  organchor beacon index
  organchor beacon query
  organchor verify url --compact
`);
}
