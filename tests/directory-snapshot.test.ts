import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { buildDirectorySnapshot, validateDirectorySnapshot } from "../src/directory/snapshot.ts";
import type { JsonValue } from "../src/core/json.ts";

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

function run(args: string[], expectedStatus = 0): { stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: repoRoot,
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
