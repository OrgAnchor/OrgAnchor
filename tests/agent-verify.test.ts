import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  existsSync,
  mkdtempSync,
  readFile,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("verify url discovers well-known OrgAnchor index and verifies agent-readable artifacts", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-agent-verify-"));
  try {
    createAgentFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      rewriteBeaconOrigin(workspace, origin);
      const verify = await runAsync(workspace, ["verify", "url", origin]);
      const result = JSON.parse(verify.stdout);
      assert.equal(result.type, "OrgAnchorAgentVerificationResult");
      assert.equal(result.overall_status, "PASS");
      assert.equal(result.identity_status, "PASS");
      assert.equal(result.value_status, "PASS");
      assert.equal(result.conformance_status, "FULL_COMPATIBLE");
      assert.equal(result.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
      assert.equal(result.index_url, `${origin}/verify/organchor.json`);
      assert.equal(result.discovery_signal.kind, "beacon");
      assert.equal(result.discovery_signal.url, `${origin}/.well-known/organchor.json`);
      assert.equal(result.artifact_base_url, `${origin}/verify/`);
      assert.equal(result.identity.threshold_required, 1);
      assert.equal(result.value_continuity.summary.evidence_linked_claims, 1);
      assert.equal(result.value_continuity.summary.unsupported_claims, 0);
      assert.equal(result.policy_route.route, "EXTERNAL_POLICY_REVIEW");
      assert.equal(result.policy_route.policy_owner, "EXTERNAL_AGENT");
      assert.equal(result.policy_route.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
      assert.equal(result.policy_route.reasons.includes("manual_checks_present"), true);
      assert.equal(result.policy_route.reasons.includes("no_third_party_claims"), true);
      assert.equal(hasCheck(result, "statement_signature_threshold", "PASS"), true);
      assert.equal(hasCheck(result, "claims_manifest", "PASS"), true);
      assert.equal(hasCheck(result, "evidence_manifest", "PASS"), true);
      assert.equal(hasCheck(result, "value_continuity", "PASS"), true);

      const compactVerify = await runAsync(workspace, ["verify", "url", origin, "--compact"]);
      const compact = JSON.parse(compactVerify.stdout);
      assert.equal(compact.type, "OrgAnchorAgentVerificationCompactResult");
      assert.equal(compact.overall_status, "PASS");
      assert.equal(compact.identity_status, "PASS");
      assert.equal(compact.value_status, "PASS");
      assert.equal(compact.conformance_status, "FULL_COMPATIBLE");
      assert.equal(compact.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
      assert.equal(compact.evidence_summary.claims, "PASS");
      assert.equal(compact.evidence_summary.evidence, "PASS");
      assert.equal(compact.evidence_summary.value, "PASS");
      assert.equal(compact.evidence_summary.unsupported_claims, 0);
      assert.equal(compact.evidence_summary.total_evidence_items, 1);
      assert.equal(compact.policy_route.route, "EXTERNAL_POLICY_REVIEW");
      assert.equal(compact.policy_route.policy_owner, "EXTERNAL_AGENT");
      assert.equal(compact.policy_route.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
      assert.equal(compact.failures.length, 0);
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("verify url fails when public statement content is changed after signing", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-agent-tamper-"));
  try {
    createAgentFixture(workspace);
    rewriteBeaconOrigin(workspace, "http://127.0.0.1");
    const statementPath = join(workspace, "public", "verify", "official-endpoints.json");
    const statement = JSON.parse(readFileSync(statementPath, "utf8"));
    statement.official_endpoints.website = "https://attacker.example";
    writeFileSync(statementPath, `${JSON.stringify(statement, null, 2)}\n`, "utf8");

    await withStaticServer(join(workspace, "public"), async (origin) => {
      rewriteBeaconOrigin(workspace, origin);
      const verify = await runAsync(workspace, ["verify", "url", origin], 1);
      const result = JSON.parse(verify.stdout);
      assert.equal(result.overall_status, "FAIL");
      assert.equal(result.identity_status, "FAIL");
      assert.equal(hasCheck(result, "statement_hash", "FAIL"), true);
      assert.equal(hasCheck(result, "statement_signature_threshold", "FAIL"), true);

      const compactVerify = await runAsync(workspace, ["verify", "url", origin, "--compact"], 1);
      const compact = JSON.parse(compactVerify.stdout);
      assert.equal(compact.overall_status, "FAIL");
      assert.equal(compact.identity_status, "FAIL");
      assert.equal(compact.conformance_status, "FAILED");
      assert.equal(compact.policy_route.route, "STOP_IDENTITY_FAILURE");
      assert.equal(compact.policy_route.reasons.includes("identity_verification_failed"), true);
      assert.equal(
        compact.failures.some((failure: string) => failure.startsWith("statement_hash:")),
        true
      );
      assert.equal(
        compact.failures.some((failure: string) => failure.startsWith("statement_signature_threshold:")),
        true
      );
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createAgentFixture(workspace: string): void {
  writeFileSync(join(workspace, "README.md"), "# Example Evidence\n\nAgent-verifiable evidence artifact.\n", "utf8");
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "root-2026"]);
  run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
  run(workspace, ["statement", "create", "--config", "organchor.config.json", "--authority", "root-authority.json"]);
  run(workspace, [
    "statement",
    "sign",
    "--key",
    "keys/root-2026.private.json",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json"
  ]);
  run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
  run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
  run(workspace, [
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
  ]);
  run(workspace, ["claims", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);
  run(workspace, ["evidence", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);
  run(workspace, [
    "value",
    "audit",
    "--claims",
    "claims/product-claims.json",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--check-files"
  ]);
  run(workspace, [
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
  ]);
}

function rewriteBeaconOrigin(workspace: string, origin: string): void {
  const beaconPath = join(workspace, "public", ".well-known", "organchor.json");
  const beacon = JSON.parse(readFileSync(beaconPath, "utf8"));
  beacon.origin = origin;
  beacon.verify_url = `${origin}/verify/`;
  beacon.well_known_url = `${origin}/.well-known/organchor.json`;
  beacon.verify_index_url = `${origin}/verify/organchor.json`;
  beacon.agent_flow.first_pass = `organchor verify url ${origin} --compact`;
  beacon.agent_flow.deep_verify = `organchor verify url ${origin}`;
  writeFileSync(beaconPath, `${JSON.stringify(beacon, null, 2)}\n`, "utf8");
}

function hasCheck(result: { checks: Array<{ id: string; status: string }> }, id: string, status: string): boolean {
  return result.checks.some((check) => check.id === id && check.status === status);
}

async function withStaticServer(root: string, fn: (origin: string) => Promise<void>): Promise<void> {
  assert.equal(existsSync(root), true);
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
      response.writeHead(200, { "content-type": filePath.endsWith(".json") ? "application/json" : "text/plain" });
      response.end(data);
    });
  });
  await new Promise<void>((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
  try {
    const address = server.address() as AddressInfo;
    await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolvePromise, reject) => {
      server.close((error) => (error ? reject(error) : resolvePromise()));
    });
  }
}

function run(workspace: string, args: string[], expectedStatus = 0): { stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: workspace,
    encoding: "utf8"
  });
  assert.equal(
    result.status,
    expectedStatus,
    `organchor ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}

async function runAsync(workspace: string, args: string[], expectedStatus = 0): Promise<{ stdout: string; stderr: string }> {
  const child = spawn(process.execPath, [cliPath, ...args], {
    cwd: workspace,
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk: string) => {
    stderr += chunk;
  });
  const status = await new Promise<number | null>((resolvePromise) => {
    child.on("close", resolvePromise);
  });
  assert.equal(
    status,
    expectedStatus,
    `organchor ${args.join(" ")}\nstdout:\n${stdout}\nstderr:\n${stderr}`
  );
  return { stdout, stderr };
}
