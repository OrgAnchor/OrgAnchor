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
import { buildDirectorySnapshot, validateDirectorySnapshot } from "../src/directory/snapshot.ts";
import type { JsonValue } from "../src/core/json.ts";
import { sha256CanonicalJson } from "../src/core/hash.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("example directory snapshot is a discovery aid, not a trust root", () => {
  const snapshot = readJson(join(repoRoot, "examples", "directory", "directory-snapshot.json"));
  validateDirectorySnapshot(snapshot as JsonValue);

  assert.equal(snapshot.type, "OrgAnchorDirectorySnapshot");
  assert.equal(snapshot.version, "0.1");
  assert.equal(asRecord(snapshot.trust_boundary).directory_is_trust_root, false);
  assert.equal(asRecord(snapshot.trust_boundary).final_trust_decision, "EXTERNAL_AGENT");
  assert.equal(asRecord(snapshot.trust_boundary).records_must_verify_at_origin, true);

  const records = asArray(snapshot.records);
  assert.equal(records.length, 1);

  const record = asRecord(records[0]);
  const origin = asString(record.origin);
  assert.equal(record.type, "OrgAnchorDirectoryRecord");
  assert.equal(record.version, "0.1");
  assert.match(origin, /^https:\/\//);
  assert.equal(
    record.well_known_url,
    `${origin}/.well-known/organchor.json`,
    "records must point agents back to origin-owned discovery"
  );
  assert.equal(
    record.verify_index_url,
    `${origin}/verify/organchor.json`,
    "records must point agents back to origin-owned verify index"
  );

  const verification = asRecord(record.verification_summary);
  assert.equal(verification.identity_status, "PASS");
  assert.equal(verification.value_status, "NOT_INCLUDED");
  assert.equal(verification.policy_route, "REQUEST_VALUE_EVIDENCE");
  assert.match(asString(verification.root_authority_hash), /^sha256:[0-9a-f]{64}$/);
  assert.match(asString(verification.statement_hash), /^sha256:[0-9a-f]{64}$/);

  const limitations = asArray(record.limitations).map(asString);
  assert.ok(
    limitations.some((item) => item.includes("summary only")),
    "directory examples must warn that records are summaries"
  );
  assert.ok(
    limitations.some((item) => item.includes("verify against the origin")),
    "directory examples must require direct origin verification"
  );
});

test("directory build and verify commands generate a static discovery snapshot", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-directory-"));
  try {
    const build = run([
      "directory",
      "build",
      "--origins",
      join(repoRoot, "examples", "directory", "directory-origins.json"),
      "--out",
      join(workspace, "public", "directory"),
      "--generated-at",
      "2026-05-23T00:00:00.000Z"
    ]);
    assert.match(build.stdout, /Directory snapshot generated/);
    assert.match(build.stdout, /Records: 1/);

    const snapshotPath = join(workspace, "public", "directory", "directory-snapshot.json");
    const verify = run(["directory", "verify", "--snapshot", snapshotPath]);
    assert.match(verify.stdout, /^PASS/m);
    assert.match(verify.stdout, /records_must_verify_at_origin|origin_links/);

    const generated = validateDirectorySnapshot(readJson(snapshotPath) as JsonValue);
    assert.equal(generated.trust_boundary.directory_is_trust_root, false);
    assert.equal(generated.records[0]?.well_known_url, "https://vector.example/.well-known/organchor.json");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("directory build can verify origins before writing crawler records", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-directory-live-"));
  try {
    createAgentFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      const originsPath = join(workspace, "directory-origins.json");
      writeFileSync(
        originsPath,
        `${JSON.stringify({
          snapshot_id: "directory-live-test-001",
          directory_node: {
            name: "Test Directory",
            origin: "https://directory.example",
            policy_url: "https://directory.example/directory-policy.json"
          },
          origins: [
            {
              origin,
              discovery: {
                categories: ["software"],
                capabilities: ["identity-continuity"],
                regions: ["global"],
                languages: ["en"]
              }
            }
          ]
        }, null, 2)}\n`,
        "utf8"
      );

      const build = await runAsync([
        "directory",
        "build",
        "--origins",
        originsPath,
        "--out",
        join(workspace, "public", "directory"),
        "--generated-at",
        "2026-05-23T00:00:00.000Z",
        "--verify-origins"
      ]);
      assert.match(build.stdout, /Origin verification: enabled/);

      const snapshotPath = join(workspace, "public", "directory", "directory-snapshot.json");
      const generated = validateDirectorySnapshot(readJson(snapshotPath) as JsonValue);
      const record = generated.records[0];
      assert.ok(record);
      assert.equal(record.origin, origin);
      assert.equal(record.source.method, "crawler");
      assert.equal(record.verification_summary.identity_status, "PASS");
      assert.equal(record.verification_summary.value_status, "PASS");
      assert.equal(record.verification_summary.policy_route, "EXTERNAL_POLICY_REVIEW");
      assert.equal(record.verification_summary.conformance_status, "FULL_COMPATIBLE");
      assert.equal(record.verification_summary.last_verified_at, "2026-05-23T00:00:00.000Z");
      assert.match(record.verification_summary.root_authority_hash, /^sha256:[0-9a-f]{64}$/);
      assert.match(record.verification_summary.statement_hash, /^sha256:[0-9a-f]{64}$/);
      assert.equal(record.evidence_summary.total_evidence_items, 1);
      assert.equal(record.evidence_summary.reproducible_claims, 1);

      const verify = run(["directory", "verify", "--snapshot", snapshotPath]);
      assert.match(verify.stdout, /^PASS/m);
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("directory inspect discovers and verifies an origin-published Directory", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-directory-inspect-"));
  try {
    createAgentFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      const originsPath = join(workspace, "directory-origins.json");
      writeFileSync(
        originsPath,
        `${JSON.stringify({
          snapshot_id: "directory-inspect-test-001",
          directory_node: {
            name: "Test Directory",
            origin,
            policy_url: `${origin}/directory/directory-policy.json`
          },
          origins: [
            {
              record_id: "self",
              origin,
              discovery: {
                categories: ["software"],
                capabilities: ["identity-continuity"],
                regions: ["global"],
                languages: ["en"]
              }
            }
          ]
        }, null, 2)}\n`,
        "utf8"
      );

      await runAsync([
        "directory",
        "build",
        "--origins",
        originsPath,
        "--out",
        join(workspace, "public", "directory"),
        "--generated-at",
        "2026-05-23T00:00:00.000Z",
        "--verify-origins"
      ]);
      const snapshotPath = join(workspace, "public", "directory", "directory-snapshot.json");
      const snapshot = validateDirectorySnapshot(readJson(snapshotPath) as JsonValue);
      snapshot.records.push({
        type: "OrgAnchorDirectoryRecord",
        version: "0.1",
        record_id: "hardware-vendor",
        origin: "https://hardware.example",
        well_known_url: "https://hardware.example/.well-known/organchor.json",
        verify_index_url: "https://hardware.example/verify/organchor.json",
        organization: {
          name: "Hardware Vendor",
          display_name: "Hardware Vendor"
        },
        discovery: {
          categories: ["hardware"],
          capabilities: ["precision-machining"],
          regions: ["eu"],
          languages: ["en"]
        },
        verification_summary: {
          identity_status: "PASS",
          value_status: "WARN",
          policy_route: "REVIEW_VALUE_WARNINGS",
          root_authority_hash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
          statement_hash: "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
          last_verified_at: "2026-05-23T00:00:00.000Z"
        },
        evidence_summary: {
          total_evidence_items: 3,
          third_party_claims: 1,
          reproducible_claims: 1,
          manual_checks: 1,
          unsupported_claims: 0
        },
        source: {
          method: "manual",
          added_at: "2026-05-23T00:00:00.000Z"
        },
        limitations: [
          "Directory record is a summary only.",
          "Agent must verify against the origin package before relying on it."
        ]
      });
      validateDirectorySnapshot(snapshot as JsonValue);
      writeFileSync(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
      writeFileSync(
        `${snapshotPath}.sha256`,
        `${sha256CanonicalJson(snapshot as JsonValue)}\n`,
        "utf8"
      );
      writeFileSync(
        join(workspace, "public", "directory", "directory-policy.json"),
        `${JSON.stringify({
          type: "OrgAnchorDirectoryPolicy",
          version: "0.1",
          directory_node: {
            name: "Test Directory",
            origin
          },
          trust_boundary: {
            directory_is_trust_root: false,
            final_trust_decision: "EXTERNAL_AGENT",
            records_must_verify_at_origin: true
          }
        }, null, 2)}\n`,
        "utf8"
      );
      regenerateAgentPage(workspace);

      const inspect = await runAsync(["directory", "inspect", origin]);
      const report = JSON.parse(inspect.stdout);
      assert.equal(report.type, "OrgAnchorDirectoryInspectReport");
      assert.equal(report.status, "PASS");
      assert.equal(report.directory.status, "PASS");
      assert.equal(report.directory.snapshot_url, `${origin}/directory/directory-snapshot.json`);
      assert.equal(report.directory.snapshot_id, "directory-inspect-test-001");
      assert.equal(report.directory.record_count, 2);
      assert.equal(report.directory.trust_boundary.directory_is_trust_root, false);
      assert.equal(hasInspectCheck(report, "directory_snapshot_hash", "PASS"), true);
      assert.equal(hasInspectCheck(report, "directory_hash_file", "PASS"), true);
      assert.equal(hasInspectCheck(report, "directory_policy_hash", "PASS"), true);

      const fetch = await runAsync([
        "directory",
        "fetch",
        origin,
        "--out",
        join(workspace, "downloaded-directory-snapshot.json")
      ]);
      const fetchReport = JSON.parse(fetch.stdout);
      assert.equal(fetchReport.type, "OrgAnchorDirectoryFetchResult");
      assert.equal(fetchReport.status, "PASS");
      assert.equal(fetchReport.snapshot.snapshot_id, "directory-inspect-test-001");
      assert.equal(fetchReport.snapshot.record_count, 2);
      assert.equal(fetchReport.snapshot.saved_to, join(workspace, "downloaded-directory-snapshot.json"));
      assert.equal(fetchReport.counts.total_records, 2);
      assert.equal(fetchReport.counts.matched_records, 2);
      assert.equal(fetchReport.counts.returned_records, 2);
      assert.equal(fetchReport.candidates.length, 2);
      assert.equal(fetchReport.candidates[0].record_id, "self");
      assert.equal(fetchReport.candidates[0].origin, origin);
      assert.equal(fetchReport.candidates[0].verification_summary.identity_status, "PASS");
      assert.equal(fetchReport.candidates[0].next_step, `organchor verify url ${origin} --compact`);
      assert.equal(existsSync(join(workspace, "downloaded-directory-snapshot.json")), true);

      const filteredFetch = await runAsync([
        "directory",
        "fetch",
        origin,
        "--capability",
        "identity-continuity",
        "--identity-status",
        "PASS",
        "--limit",
        "1"
      ]);
      const filteredFetchReport = JSON.parse(filteredFetch.stdout);
      assert.equal(filteredFetchReport.status, "PASS");
      assert.deepEqual(filteredFetchReport.filters.capabilities, ["identity-continuity"]);
      assert.deepEqual(filteredFetchReport.filters.identity_statuses, ["PASS"]);
      assert.equal(filteredFetchReport.filters.limit, 1);
      assert.equal(filteredFetchReport.counts.total_records, 2);
      assert.equal(filteredFetchReport.counts.matched_records, 1);
      assert.equal(filteredFetchReport.counts.returned_records, 1);
      assert.equal(filteredFetchReport.candidates[0].origin, origin);

      const hardwareFetch = await runAsync(["directory", "fetch", origin, "--category", "hardware"]);
      const hardwareFetchReport = JSON.parse(hardwareFetch.stdout);
      assert.equal(hardwareFetchReport.counts.matched_records, 1);
      assert.equal(hardwareFetchReport.candidates[0].origin, "https://hardware.example");
      assert.equal(hardwareFetchReport.candidates[0].verification_summary.value_status, "WARN");

      writeFileSync(
        join(workspace, "public", "directory", "directory-snapshot.json.sha256"),
        "sha256:0000000000000000000000000000000000000000000000000000000000000000\n",
        "utf8"
      );
      const failedInspect = await runAsync(["directory", "inspect", origin], 1);
      const failedReport = JSON.parse(failedInspect.stdout);
      assert.equal(failedReport.status, "FAIL");
      assert.equal(hasInspectCheck(failedReport, "directory_hash_file", "FAIL"), true);

      const failedFetch = await runAsync(["directory", "fetch", origin], 1);
      const failedFetchReport = JSON.parse(failedFetch.stdout);
      assert.equal(failedFetchReport.status, "FAIL");
      assert.equal(failedFetchReport.candidates.length, 0);
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("directory snapshot builder fills safe discovery defaults but still requires origin hashes", () => {
  const snapshot = buildDirectorySnapshot({
    snapshotId: "directory-test-001",
    generatedAt: "2026-05-23T00:00:00.000Z",
    directoryNode: {
      name: "Test Directory",
      origin: "https://directory.example",
      policy_url: "https://directory.example/directory-policy.json"
    },
    records: [
      {
        origin: "https://minimal.example",
        organization: {
          name: "Minimal Org",
          display_name: "Minimal Organization"
        },
        verification_summary: {
          root_authority_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          statement_hash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        },
        limitations: [
          "Directory record is a summary only.",
          "Agent must verify against the origin package before relying on it."
        ]
      }
    ]
  });
  assert.equal(snapshot.records[0]?.verification_summary.identity_status, "NOT_VERIFIED");
  assert.equal(snapshot.records[0]?.verification_summary.policy_route, "REQUEST_ORIGIN_VERIFICATION");
  assert.equal(snapshot.records[0]?.well_known_url, "https://minimal.example/.well-known/organchor.json");
});

test("directory verify fails closed when a snapshot claims directory trust-root authority", () => {
  const invalid = readJson(join(repoRoot, "examples", "directory", "directory-snapshot.json"));
  asRecord(invalid.trust_boundary).directory_is_trust_root = true;
  assert.throws(() => validateDirectorySnapshot(invalid as JsonValue), /directory_is_trust_root must be false/);
});

function createAgentFixture(workspace: string): void {
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

function regenerateAgentPage(workspace: string): void {
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
  copyFileSync(
    join(workspace, "public", "verify", "organchor.json"),
    join(workspace, "public", ".well-known", "organchor.json")
  );
}

function hasInspectCheck(result: { checks: Array<{ id: string; status: string }> }, id: string, status: string): boolean {
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

function readJson(path: string): Record<string, unknown> {
  return asRecord(JSON.parse(readFileSync(path, "utf8")));
}

function asRecord(value: unknown): Record<string, unknown> {
  assert.equal(typeof value, "object");
  assert.notEqual(value, null);
  assert.equal(Array.isArray(value), false);
  return value as Record<string, unknown>;
}

function asArray(value: unknown): unknown[] {
  assert.ok(Array.isArray(value));
  return value;
}

function asString(value: unknown): string {
  assert.equal(typeof value, "string");
  return value as string;
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
