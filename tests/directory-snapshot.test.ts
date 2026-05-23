import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("example directory snapshot is a discovery aid, not a trust root", () => {
  const snapshot = readJson(join(repoRoot, "examples", "directory", "directory-snapshot.json"));

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
