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
    const policyPath = join(workspace, "public", "directory", "directory-policy.json");
    const feedPath = join(workspace, "directory-feed.ndjson");
    const verify = run(["directory", "verify", "--snapshot", snapshotPath]);
    assert.match(verify.stdout, /^PASS/m);
    assert.match(verify.stdout, /records_must_verify_at_origin|origin_links/);
    const exportFeed = run([
      "directory",
      "export",
      "--snapshot",
      snapshotPath,
      "--format",
      "ndjson",
      "--out",
      feedPath
    ]);
    const exportSummary = JSON.parse(exportFeed.stdout);
    assert.equal(exportSummary.type, "OrgAnchorDirectoryExportSummary");
    assert.equal(exportSummary.record_count, 1);
    const feedRecords = readFileSync(feedPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
    assert.equal(feedRecords.length, 1);
    assert.equal(feedRecords[0].type, "OrgAnchorDirectoryRecord");
    assert.equal(feedRecords[0].origin, "https://vector.example");

    const generated = validateDirectorySnapshot(readJson(snapshotPath) as JsonValue);
    assert.equal(generated.trust_boundary.directory_is_trust_root, false);
    assert.equal(generated.records[0]?.well_known_url, "https://vector.example/.well-known/organchor.json");
    const policy = readJson(policyPath);
    assert.equal(policy.type, "OrgAnchorDirectoryPolicy");
    assert.equal(asRecord(policy.trust_boundary).directory_is_trust_root, false);
    assert.equal(asRecord(policy.inclusion_policy).selected_records_require_direct_origin_verification, true);
    assert.equal(asRecord(policy.exclusion_policy).exclusion_is_not_a_negative_certification, true);
    assert.equal(asRecord(policy.ranking_policy).paid_placement_changes_verification_status, false);
    assert.equal(asRecord(policy.stale_record_policy).agents_should_reverify_before_use, true);
    assert.equal(asRecord(policy.mirroring_policy).forks_and_mirrors_are_allowed, true);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("directory add maintains a static candidate source without claiming verification", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-directory-add-"));
  try {
    const originsPath = join(workspace, "directory-origins.json");
    const add = run([
      "directory",
      "add",
      "--origins",
      originsPath,
      "--node-origin",
      "https://directory.example",
      "--origin",
      "https://candidate.example/some/page?ref=1",
      "--name",
      "candidate-org",
      "--display-name",
      "Candidate Organization",
      "--category",
      "software",
      "--capability",
      "identity-continuity,precision-machining",
      "--region",
      "eu",
      "--language",
      "en,zh",
      "--added-at",
      "2026-05-24T00:00:00.000Z"
    ]);
    const summary = JSON.parse(add.stdout);
    assert.equal(summary.type, "OrgAnchorDirectoryAddSummary");
    assert.equal(summary.action, "added");
    assert.equal(summary.origin, "https://candidate.example");

    const origins = readJson(originsPath);
    assert.equal(origins.type, "OrgAnchorDirectoryOrigins");
    assert.equal(asRecord(origins.directory_node).origin, "https://directory.example");
    const records = asArray(origins.origins);
    assert.equal(records.length, 1);
    const record = asRecord(records[0]);
    assert.equal(record.origin, "https://candidate.example");
    assert.equal(asRecord(record.organization).display_name, "Candidate Organization");
    assert.deepEqual(asRecord(record.discovery).capabilities, ["identity-continuity", "precision-machining"]);
    assert.equal(record.verification_summary, undefined);
    assert.ok(asArray(record.limitations).map(asString).some((item) => item.includes("verify against the origin")));

    const update = run([
      "directory",
      "add",
      "--origins",
      originsPath,
      "--origin",
      "https://candidate.example",
      "--display-name",
      "Candidate Org Updated",
      "--capability",
      "identity-continuity"
    ]);
    const updateSummary = JSON.parse(update.stdout);
    assert.equal(updateSummary.action, "updated");
    const updated = readJson(originsPath);
    const updatedRecords = asArray(updated.origins);
    assert.equal(updatedRecords.length, 1);
    assert.equal(asRecord(asRecord(updatedRecords[0]).organization).display_name, "Candidate Org Updated");
    assert.equal(asRecord(asRecord(updatedRecords[0]).source).added_at, "2026-05-24T00:00:00.000Z");
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("directory build can publish a snapshot from a local Beacon index", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-directory-from-beacon-index-"));
  try {
    const indexPath = join(workspace, "beacon-index.json");
    writeFileSync(
      indexPath,
      `${JSON.stringify({
        type: "OrgAnchorBeaconLocalIndex",
        version: "0.1",
        generated_at: "2026-05-24T00:00:00.000Z",
        sources: {
          previous_index: null,
          sweeps: ["beacon-sweep.ndjson"]
        },
        counts: {
          total_origins: 1,
          by_status: {
            PASS: 1,
            WARN: 0,
            FAIL: 0
          },
          by_conformance: {
            CLAIMED_SIGNAL: 0,
            BEACON_SHAPE_PASS: 0,
            IDENTITY_VERIFY_PASS: 0,
            VALUE_VERIFY_PASS: 0,
            FULL_COMPATIBLE: 1,
            PARTIAL: 0,
            FAILED: 0
          }
        },
        records: [
          {
            record_key: "https://indexed.example",
            origin: "https://indexed.example",
            latest_target: "https://indexed.example",
            first_seen_at: "2026-05-24T00:00:00.000Z",
            last_checked_at: "2026-05-24T01:00:00.000Z",
            seen_count: 2,
            organization: {
              name: "indexed-org",
              display_name: "Indexed Organization"
            },
            discovery: {
              categories: ["software"],
              capabilities: ["identity-continuity"],
              regions: ["global"],
              languages: ["en"]
            },
            status: "PASS",
            conformance_status: "FULL_COMPATIBLE",
            signal_kind: "beacon",
            signal_url: "https://indexed.example/.well-known/organchor.json",
            identity_status: "PASS",
            value_status: "PASS",
            policy_route: "EXTERNAL_POLICY_REVIEW",
            root_authority_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            statement_hash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
            risk_gap_codes: [],
            next_step: "Use the verified artifacts as inputs to your own policy."
          }
        ]
      }, null, 2)}\n`,
      "utf8"
    );

    const build = run([
      "directory",
      "build",
      "--beacon-index",
      indexPath,
      "--node-origin",
      "https://directory.example",
      "--node-name",
      "Beacon Derived Directory",
      "--snapshot-id",
      "directory-from-index-001",
      "--generated-at",
      "2026-05-24T02:00:00.000Z",
      "--out",
      join(workspace, "public", "directory")
    ]);
    assert.match(build.stdout, /Beacon index:/);
    assert.match(build.stdout, /Records: 1/);

    const snapshotPath = join(workspace, "public", "directory", "directory-snapshot.json");
    const snapshot = validateDirectorySnapshot(readJson(snapshotPath) as JsonValue);
    const record = snapshot.records[0];
    assert.ok(record);
    assert.equal(record.origin, "https://indexed.example");
    assert.equal(record.organization.display_name, "Indexed Organization");
    assert.equal(record.source.method, "crawler");
    assert.equal(record.source.imported_from, "OrgAnchorBeaconLocalIndex");
    assert.equal(record.verification_summary.identity_status, "PASS");
    assert.equal(record.verification_summary.value_status, "PASS");
    assert.equal(record.verification_summary.policy_route, "EXTERNAL_POLICY_REVIEW");
    assert.equal(record.verification_summary.conformance_status, "FULL_COMPATIBLE");
    assert.equal(record.verification_summary.last_verified_at, "2026-05-24T01:00:00.000Z");
    assert.equal(record.evidence_summary.total_evidence_items, 0);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("directory build can verify origins before writing crawler records", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-directory-live-"));
  try {
    createAgentFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      rewriteBeaconOrigin(workspace, origin);
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
      rewriteBeaconOrigin(workspace, origin);
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
      regenerateAgentPage(workspace, origin);

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
      assert.equal(fetchReport.candidates[0].candidate_priority, "MEDIUM");
      assert.equal(fetchReport.candidates[0].verification_summary.identity_status, "PASS");
      assert.equal(fetchReport.candidates[0].match_explanation.summary.includes("not a trust root"), true);
      assert.equal(fetchReport.candidates[0].risk_gaps.some((risk: { code: string }) => risk.code === "MANUAL_CHECKS_PRESENT"), true);
      assert.equal(fetchReport.candidates[0].verification_plan[0], `Run organchor beacon inspect ${origin}.`);
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
      assert.equal(hardwareFetchReport.candidates[0].candidate_priority, "REVIEW");
      assert.equal(hardwareFetchReport.candidates[0].verification_summary.value_status, "WARN");
      assert.equal(hardwareFetchReport.candidates[0].risk_gaps.some((risk: { code: string }) => risk.code === "VALUE_REQUIRES_REVIEW"), true);

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

test("directory compare reports cross-directory conflicts without making trust decisions", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-directory-compare-"));
  try {
    const snapshotA = buildDirectorySnapshot({
      snapshotId: "directory-a-001",
      generatedAt: "2026-05-23T00:00:00.000Z",
      directoryNode: {
        name: "Directory A",
        origin: "https://directory-a.example",
        policy_url: "https://directory-a.example/directory-policy.json"
      },
      records: [
        directoryRecordInput("https://shared.example", {
          valueStatus: "PASS",
          statementHash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
        }),
        directoryRecordInput("https://a-only.example")
      ]
    });
    const snapshotB = buildDirectorySnapshot({
      snapshotId: "directory-b-001",
      generatedAt: "2026-05-23T01:00:00.000Z",
      directoryNode: {
        name: "Directory B",
        origin: "https://directory-b.example",
        policy_url: "https://directory-b.example/directory-policy.json"
      },
      records: [
        directoryRecordInput("https://shared.example", {
          valueStatus: "WARN",
          statementHash: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
        }),
        directoryRecordInput("https://b-only.example")
      ]
    });
    const snapshotAPath = join(workspace, "directory-a.json");
    const snapshotBPath = join(workspace, "directory-b.json");
    writeFileSync(snapshotAPath, `${JSON.stringify(snapshotA, null, 2)}\n`, "utf8");
    writeFileSync(snapshotBPath, `${JSON.stringify(snapshotB, null, 2)}\n`, "utf8");

    const compare = run([
      "directory",
      "compare",
      "--snapshots",
      `${snapshotAPath},${snapshotBPath}`,
      "--out",
      join(workspace, "directory-compare.json")
    ], 1);
    const result = JSON.parse(compare.stdout);
    assert.equal(result.type, "OrgAnchorDirectoryCompareResult");
    assert.equal(result.trust_boundary.directory_comparison_is_not_trust_decision, true);
    assert.equal(result.counts.snapshots, 2);
    assert.equal(result.counts.total_unique_origins, 3);
    assert.equal(result.counts.common_origins, 1);
    assert.equal(result.counts.origins_with_conflicts, 1);
    assert.equal(result.counts.fail_conflicts, 1);
    assert.equal(result.counts.warn_conflicts, 2);
    assert.equal(result.conflicts.some((conflict: { field: string; severity: string }) => conflict.field === "statement_hash" && conflict.severity === "FAIL"), true);
    assert.equal(result.conflicts.some((conflict: { field: string; severity: string }) => conflict.field === "value_status" && conflict.severity === "WARN"), true);
    const shared = result.origin_matrix.find((row: { origin: string }) => row.origin === "https://shared.example");
    assert.ok(shared);
    assert.equal(shared.conflict_status, "FAIL");
    const aOnly = result.origin_matrix.find((row: { origin: string }) => row.origin === "https://a-only.example");
    assert.ok(aOnly);
    assert.deepEqual(aOnly.missing_from, ["directory-b-001"]);
    assert.equal(existsSync(join(workspace, "directory-compare.json")), true);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
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
}

function directoryRecordInput(
  origin: string,
  options: {
    valueStatus?: string;
    statementHash?: string;
  } = {}
): JsonValue {
  const hostname = new URL(origin).hostname;
  return {
    origin,
    organization: {
      name: hostname,
      display_name: hostname
    },
    discovery: {
      categories: ["software"],
      capabilities: ["identity-continuity"],
      regions: ["global"],
      languages: ["en"]
    },
    verification_summary: {
      identity_status: "PASS",
      value_status: options.valueStatus ?? "PASS",
      policy_route: options.valueStatus === "WARN" ? "REVIEW_VALUE_WARNINGS" : "EXTERNAL_POLICY_REVIEW",
      root_authority_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      statement_hash: options.statementHash ?? "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      last_verified_at: "2026-05-23T00:00:00.000Z"
    },
    evidence_summary: {
      total_evidence_items: 1,
      third_party_claims: 0,
      reproducible_claims: 1,
      manual_checks: 0,
      unsupported_claims: 0
    },
    source: {
      method: "crawler",
      added_at: "2026-05-23T00:00:00.000Z"
    },
    limitations: [
      "Directory record is a summary only.",
      "Agent must verify against the origin package before relying on it."
    ]
  };
}

function regenerateAgentPage(workspace: string, origin: string): void {
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
  rewriteBeaconOrigin(workspace, origin);
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
