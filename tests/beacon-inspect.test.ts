import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFile,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("beacon inspect reports a full generated verify package as compatible", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-full-"));
  try {
    createFullVerifyFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      const inspect = await runAsync(["beacon", "inspect", origin]);
      const report = JSON.parse(inspect.stdout);

      assert.equal(report.type, "OrgAnchorBeaconInspectResult");
      assert.equal(report.status, "PASS");
      assert.equal(report.conformance_status, "FULL_COMPATIBLE");
      assert.equal(report.signal.claimed, true);
      assert.equal(report.signal.kind, "verify_index");
      assert.equal(report.verification.identity_status, "PASS");
      assert.equal(report.verification.value_status, "PASS");
      assert.match(report.verification.root_authority_hash, /^sha256:[0-9a-f]{64}$/);
      assert.match(report.verification.statement_hash, /^sha256:[0-9a-f]{64}$/);
      assert.equal(hasCheck(report, "strict_identity_verification", "PASS"), true);
      assert.equal(hasCheck(report, "strict_value_verification", "PASS"), true);
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("beacon inspect rejects Beacon claims whose declared hashes do not match strict verification", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-impostor-"));
  try {
    createFullVerifyFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      writeFileSync(
        join(workspace, "public", ".well-known", "organchor.json"),
        `${JSON.stringify({
          type: "OrgAnchorBeacon",
          version: "1.0",
          origin,
          verify_url: `${origin}/verify/`,
          well_known_url: `${origin}/.well-known/organchor.json`,
          verify_index_url: `${origin}/verify/organchor.json`,
          root_authority_hash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
          statement_hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
          officially_verified: true,
          organization: {
            name: "Impostor Org",
            display_name: "Impostor Org"
          },
          discovery: {
            categories: ["software"],
            capabilities: ["identity-continuity"],
            regions: ["global"],
            languages: ["en"]
          },
          summary_status: {
            identity_status: "PASS",
            value_status: "PASS",
            policy_route: "EXTERNAL_POLICY_REVIEW",
            updated_at: "2026-05-24T00:00:00.000Z"
          },
          agent_flow: {
            first_pass: `organchor verify url ${origin} --compact`,
            deep_verify: `organchor verify url ${origin}`,
            trust_decision: "EXTERNAL_AGENT"
          }
        }, null, 2)}\n`,
        "utf8"
      );

      const inspect = await runAsync(["beacon", "inspect", origin], 1);
      const report = JSON.parse(inspect.stdout);

      assert.equal(report.status, "FAIL");
      assert.equal(report.conformance_status, "FAILED");
      assert.equal(report.signal.kind, "beacon");
      assert.deepEqual(report.signal.ignored_unknown_fields, ["officially_verified"]);
      assert.equal(hasCheck(report, "beacon_shape", "PASS"), true);
      assert.equal(hasCheck(report, "strict_identity_verification", "PASS"), true);
      assert.equal(hasCheck(report, "declared_root_authority_hash", "FAIL"), true);
      assert.equal(hasCheck(report, "declared_statement_hash", "FAIL"), true);
      assert.equal(hasRisk(report, "DECLARED_HASH_MISMATCH"), true);
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("beacon inspect keeps malformed Beacon files at claimed-signal level", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-claimed-"));
  try {
    mkdirSync(join(workspace, "public", "fake"), { recursive: true });
    writeFileSync(
      join(workspace, "public", "fake", "organchor.json"),
      `${JSON.stringify({
        type: "OrgAnchorBeacon",
        version: "1.0",
        officially_verified: true
      }, null, 2)}\n`,
      "utf8"
    );

    await withStaticServer(join(workspace, "public"), async (origin) => {
      const inspect = await runAsync(["beacon", "inspect", `${origin}/fake/organchor.json`]);
      const report = JSON.parse(inspect.stdout);

      assert.equal(report.status, "WARN");
      assert.equal(report.conformance_status, "CLAIMED_SIGNAL");
      assert.equal(report.signal.claimed, true);
      assert.equal(report.signal.kind, "beacon");
      assert.equal(hasCheck(report, "beacon_shape", "FAIL"), true);
      assert.equal(hasRisk(report, "BEACON_SHAPE_INVALID"), true);
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createFullVerifyFixture(workspace: string): void {
  writeFileSync(join(workspace, "README.md"), "# Example Evidence\n\nAgent-verifiable evidence artifact.\n", "utf8");
  run(["init"], 0, workspace);
  run(["key", "generate", "--id", "root-2026"], 0, workspace);
  run(["authority", "create", "--key", "keys/root-2026.private.json"], 0, workspace);
  run(["statement", "create", "--config", "organchor.config.json", "--authority", "root-authority.json"], 0, workspace);
  run([
    "statement",
    "sign",
    "--key",
    "keys/root-2026.private.json",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json"
  ], 0, workspace);
  run(["claims", "create", "--config", "organchor.config.json"], 0, workspace);
  run(["evidence", "create", "--config", "organchor.config.json"], 0, workspace);
  run([
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
  ], 0, workspace);
  run(["claims", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"], 0, workspace);
  run(["evidence", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"], 0, workspace);
  run([
    "value",
    "audit",
    "--claims",
    "claims/product-claims.json",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--check-files"
  ], 0, workspace);
  run([
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
  ], 0, workspace);
  mkdirSync(join(workspace, "public", ".well-known"), { recursive: true });
  copyFileSync(
    join(workspace, "public", "verify", "organchor.json"),
    join(workspace, "public", ".well-known", "organchor.json")
  );
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

async function runAsync(args: string[], expectedStatus = 0, cwd = repoRoot): Promise<{ stdout: string; stderr: string }> {
  const child = spawn(process.execPath, [cliPath, ...args], {
    cwd,
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

function hasCheck(result: { checks: Array<{ id: string; status: string }> }, id: string, status: string): boolean {
  return result.checks.some((check) => check.id === id && check.status === status);
}

function hasRisk(result: { risk_gaps: Array<{ code: string }> }, code: string): boolean {
  return result.risk_gaps.some((risk) => risk.code === code);
}

function run(args: string[], expectedStatus = 0, cwd = repoRoot): { stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
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
