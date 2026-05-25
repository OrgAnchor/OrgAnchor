import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import {
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
      rewriteBeaconOrigin(workspace, origin);
      const inspect = await runAsync(["beacon", "inspect", origin]);
      const report = JSON.parse(inspect.stdout);

      assert.equal(report.type, "OrgAnchorBeaconInspectResult");
      assert.equal(report.status, "PASS");
      assert.equal(report.conformance_status, "FULL_COMPATIBLE");
      assert.equal(report.signal.claimed, true);
      assert.equal(report.signal.kind, "beacon");
      assert.equal(report.signal.url, `${origin}/.well-known/organchor.json`);
      assert.equal(report.signal.http.status_code, 200);
      assert.match(report.signal.http.content_type, /application\/json/);
      assert.equal(hasCheck(report, "beacon_size", "PASS"), true);
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

test("beacon generate rebuilds discovery surfaces from a verified package", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-generate-"));
  try {
    createFullVerifyFixture(workspace);
    rmSync(join(workspace, "public", ".well-known"), { recursive: true, force: true });
    rmSync(join(workspace, "public", "robots.txt"), { force: true });
    rmSync(join(workspace, "public", "sitemap.xml"), { force: true });

    await withStaticServer(join(workspace, "public"), async (origin) => {
      const generate = run([
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
        "identity-continuity,agent-verification"
      ], 0, workspace);
      const summary = JSON.parse(generate.stdout);
      assert.equal(summary.type, "OrgAnchorBeaconGenerateSummary");
      assert.equal(summary.status, "PASS");
      assert.equal(existsSync(join(workspace, "public", ".well-known", "organchor.json")), true);
      assert.equal(existsSync(join(workspace, "public", "robots.txt")), true);
      assert.equal(existsSync(join(workspace, "public", "sitemap.xml")), true);

      const inspect = await runAsync(["beacon", "inspect", origin]);
      const report = JSON.parse(inspect.stdout);
      assert.equal(report.status, "PASS");
      assert.equal(report.conformance_status, "FULL_COMPATIBLE");
      assert.deepEqual(report.hints.discovery.categories, ["software"]);
      assert.deepEqual(report.hints.discovery.capabilities, ["identity-continuity", "agent-verification"]);
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("beacon generate refuses to emit PASS surfaces from a mismatched verify index", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-generate-mismatch-"));
  try {
    createFullVerifyFixture(workspace);
    const indexPath = join(workspace, "public", "verify", "organchor.json");
    const index = JSON.parse(readFileSync(indexPath, "utf8"));
    index.statement.hash = "sha256:0000000000000000000000000000000000000000000000000000000000000000";
    writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

    const result = run([
      "beacon",
      "generate",
      "--verify-dir",
      "public/verify",
      "--out-public",
      "public",
      "--origin",
      "https://example.org"
    ], 1, workspace);
    assert.match(result.stderr, /Verify index statement\.hash mismatch/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("beacon inspect rejects Beacon claims whose declared hashes do not match strict verification", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-impostor-"));
  try {
    createFullVerifyFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      rewriteBeaconOrigin(workspace, origin);
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

      const doctor = await runAsync(["doctor", origin], 1);
      const doctorReport = JSON.parse(doctor.stdout);
      assert.equal(doctorReport.type, "OrgAnchorDoctorReport");
      assert.equal(doctorReport.status, "BLOCKED");
      assert.equal(doctorReport.conformance_status, "FAILED");
      assert.equal(
        doctorReport.blocking_issues.some((issue: string) => issue.includes("DECLARED_HASH_MISMATCH")),
        true
      );
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

test("beacon sweep checks a seed list and writes reusable NDJSON records", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-sweep-"));
  try {
    createFullVerifyFixture(workspace);
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
      rewriteBeaconOrigin(workspace, origin);
      const seedsPath = join(workspace, "seeds.txt");
      const outPath = join(workspace, "beacon-sweep.ndjson");
      writeFileSync(
        seedsPath,
        [
          "# OrgAnchor sweep seeds",
          origin,
          `${origin}/fake/organchor.json`,
          origin,
          ""
        ].join("\n"),
        "utf8"
      );

      const sweep = await runAsync([
        "beacon",
        "sweep",
        "--seeds",
        seedsPath,
        "--out",
        outPath,
        "--concurrency",
        "2",
        "--timeout-ms",
        "10000"
      ]);
      const summary = JSON.parse(sweep.stdout);
      assert.equal(summary.type, "OrgAnchorBeaconSweepSummary");
      assert.equal(summary.total_targets, 2);
      assert.equal(summary.checked_targets, 2);
      assert.equal(summary.counts_by_conformance.FULL_COMPATIBLE, 1);
      assert.equal(summary.counts_by_conformance.CLAIMED_SIGNAL, 1);

      const records = readFileSync(outPath, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      assert.equal(records.length, 2);
      assert.equal(records[0].type, "OrgAnchorBeaconSweepRecord");
      assert.equal(records[0].target, origin);
      assert.equal(records[0].status, "PASS");
      assert.equal(records[0].conformance_status, "FULL_COMPATIBLE");
      assert.equal(records[0].signal.kind, "beacon");
      assert.equal(records[1].target, `${origin}/fake/organchor.json`);
      assert.equal(records[1].status, "WARN");
      assert.equal(records[1].conformance_status, "CLAIMED_SIGNAL");
      assert.equal(records[1].risk_gaps.some((risk: { code: string }) => risk.code === "BEACON_SHAPE_INVALID"), true);

      const verify = await runAsync(["beacon", "verify", "--in", outPath]);
      const verifyReport = JSON.parse(verify.stdout);
      assert.equal(verifyReport.type, "OrgAnchorBeaconSweepVerificationReport");
      assert.equal(verifyReport.status, "PASS");
      assert.equal(verifyReport.record_count, 2);
      assert.equal(verifyReport.counts_by_conformance.FULL_COMPATIBLE, 1);
      assert.equal(verifyReport.counts_by_conformance.CLAIMED_SIGNAL, 1);
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("beacon sweep can derive seeds from Directory snapshots and sitemaps", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-sweep-sources-"));
  try {
    createFullVerifyFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      rewriteBeaconOrigin(workspace, origin);
      const directoryPath = join(workspace, "directory-snapshot.json");
      const sitemapPath = join(workspace, "sitemap.xml");
      const outPath = join(workspace, "beacon-sweep-sources.ndjson");
      writeFileSync(
        directoryPath,
        `${JSON.stringify({
          type: "OrgAnchorDirectorySnapshot",
          version: "0.1",
          snapshot_id: "sweep-source-test-001",
          generated_at: "2026-05-24T00:00:00.000Z",
          directory_node: {
            name: "Sweep Test Directory",
            origin,
            policy_url: `${origin}/directory-policy.json`
          },
          trust_boundary: {
            directory_is_trust_root: false,
            final_trust_decision: "EXTERNAL_AGENT",
            records_must_verify_at_origin: true
          },
          records: [
            {
              type: "OrgAnchorDirectoryRecord",
              version: "0.1",
              record_id: "self",
              origin,
              well_known_url: `${origin}/.well-known/organchor.json`,
              verify_index_url: `${origin}/verify/organchor.json`,
              organization: {
                name: "Example Org",
                display_name: "Example Organization"
              },
              discovery: {
                categories: ["software"],
                capabilities: ["identity-continuity"],
                regions: ["global"],
                languages: ["en"]
              },
              verification_summary: {
                identity_status: "PASS",
                value_status: "PASS",
                policy_route: "EXTERNAL_POLICY_REVIEW",
                root_authority_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                statement_hash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                last_verified_at: "2026-05-24T00:00:00.000Z"
              },
              evidence_summary: {
                total_evidence_items: 1,
                third_party_claims: 0,
                reproducible_claims: 1,
                manual_checks: 1,
                unsupported_claims: 0
              },
              source: {
                method: "crawler",
                added_at: "2026-05-24T00:00:00.000Z"
              },
              limitations: [
                "Directory record is a summary only.",
                "Agent must verify against the origin package before relying on it."
              ]
            }
          ]
        }, null, 2)}\n`,
        "utf8"
      );
      writeFileSync(
        sitemapPath,
        `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${origin}/</loc></url>
  <url><loc>${origin}/verify/</loc></url>
</urlset>
`,
        "utf8"
      );
      writeFileSync(
        join(workspace, "public", "index.html"),
        `<html><head><link rel="organchor" href="/.well-known/organchor.json"></head><body>OrgAnchor demo</body></html>\n`,
        "utf8"
      );

      const sweep = await runAsync([
        "beacon",
        "sweep",
        "--directory-snapshot",
        directoryPath,
        "--sitemap",
        sitemapPath,
        "--crawl",
        origin,
        "--crawl-max-pages",
        "5",
        "--crawl-max-depth",
        "1",
        "--out",
        outPath,
        "--concurrency",
        "2"
      ]);
      const summary = JSON.parse(sweep.stdout);
      assert.deepEqual(summary.sources.directory_snapshots, [directoryPath]);
      assert.deepEqual(summary.sources.sitemaps, [sitemapPath]);
      assert.deepEqual(summary.sources.crawl, [origin]);
      assert.equal(summary.total_targets, 1);
      assert.equal(summary.counts_by_conformance.FULL_COMPATIBLE, 1);

      const records = readFileSync(outPath, "utf8")
        .trim()
        .split("\n")
        .map((line) => JSON.parse(line));
      assert.equal(records.length, 1);
      assert.equal(records[0].target, origin);
      assert.equal(records[0].conformance_status, "FULL_COMPATIBLE");
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("beacon sweep bounded crawl respects robots.txt disallow rules", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-crawl-robots-"));
  try {
    createFullVerifyFixture(workspace);
    await withStaticServer(join(workspace, "public"), async (origin) => {
      rewriteBeaconOrigin(workspace, origin);
      writeFileSync(
        join(workspace, "public", "index.html"),
        `<html><head><link rel="organchor" href="/.well-known/organchor.json"></head><body>Blocked Beacon</body></html>\n`,
        "utf8"
      );
      writeFileSync(
        join(workspace, "public", "robots.txt"),
        [
          "User-agent: *",
          "Disallow: /.well-known/",
          "Disallow: /verify/",
          ""
        ].join("\n"),
        "utf8"
      );

      const outPath = join(workspace, "beacon-sweep-robots.ndjson");
      const sweep = await runAsync([
        "beacon",
        "sweep",
        "--crawl",
        origin,
        "--crawl-max-pages",
        "5",
        "--crawl-max-depth",
        "1",
        "--out",
        outPath
      ]);
      const summary = JSON.parse(sweep.stdout);
      assert.deepEqual(summary.sources.crawl, [origin]);
      assert.equal(summary.total_targets, 0);
      assert.equal(summary.checked_targets, 0);
      assert.equal(readFileSync(outPath, "utf8"), "");
    });
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("beacon index merges sweep NDJSON into an incremental local index", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-index-"));
  try {
    const oldSweep = join(workspace, "old.ndjson");
    const newSweep = join(workspace, "new.ndjson");
    const nextSweep = join(workspace, "next.ndjson");
    const indexPath = join(workspace, "beacon-index.json");
    const nextIndexPath = join(workspace, "beacon-index-next.json");
    writeFileSync(
      oldSweep,
      `${JSON.stringify(sweepRecord({
        target: "https://example.org",
        checkedAt: "2026-05-24T00:00:00.000Z",
        status: "WARN",
        conformance: "CLAIMED_SIGNAL"
      }))}\n`,
      "utf8"
    );
    writeFileSync(
      newSweep,
      [
        JSON.stringify(sweepRecord({
          target: "https://example.org/verify/organchor.json",
          checkedAt: "2026-05-24T01:00:00.000Z",
          status: "PASS",
          conformance: "FULL_COMPATIBLE",
          identityStatus: "PASS",
          valueStatus: "PASS"
        })),
        JSON.stringify(sweepRecord({
          target: "https://failed.example",
          checkedAt: "2026-05-24T01:10:00.000Z",
          status: "FAIL",
          conformance: "FAILED"
        }))
      ].join("\n") + "\n",
      "utf8"
    );

    const build = run([
      "beacon",
      "index",
      "--in",
      `${oldSweep},${newSweep}`,
      "--out",
      indexPath
    ]);
    const summary = JSON.parse(build.stdout);
    assert.equal(summary.type, "OrgAnchorBeaconIndexSummary");
    assert.equal(summary.sweep_files, 2);
    assert.equal(summary.sweep_records, 3);
    assert.equal(summary.total_origins, 2);
    assert.equal(summary.counts_by_conformance.FULL_COMPATIBLE, 1);
    assert.equal(summary.counts_by_conformance.FAILED, 1);

    const index = JSON.parse(readFileSync(indexPath, "utf8"));
    assert.equal(index.type, "OrgAnchorBeaconLocalIndex");
    assert.equal(index.counts.total_origins, 2);
    const example = index.records.find((record: { origin: string }) => record.origin === "https://example.org");
    assert.ok(example);
    assert.equal(example.seen_count, 2);
    assert.equal(example.first_seen_at, "2026-05-24T00:00:00.000Z");
    assert.equal(example.last_checked_at, "2026-05-24T01:00:00.000Z");
    assert.equal(example.status, "PASS");
    assert.equal(example.conformance_status, "FULL_COMPATIBLE");
    assert.deepEqual(example.discovery.capabilities, ["identity-continuity", "agent-verification"]);

    const query = run([
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
      "5"
    ]);
    const queryResult = JSON.parse(query.stdout);
    assert.equal(queryResult.type, "OrgAnchorBeaconQueryResult");
    assert.equal(queryResult.trust_boundary.local_index_is_trust_root, false);
    assert.equal(queryResult.match_report.type, "OrgAnchorBeaconNeedMatchReport");
    assert.equal(queryResult.match_report.boundary.discovery_match_is_not_recommendation, true);
    assert.equal(queryResult.match_report.summary.high_priority_candidates, 1);
    assert.deepEqual(queryResult.match_report.summary.strongest_candidate_origins, ["https://example.org"]);
    assert.equal(queryResult.counts.matched_records, 1);
    assert.equal(queryResult.counts.returned_records, 1);
    assert.equal(queryResult.candidates[0].origin, "https://example.org");
    assert.equal(queryResult.candidates[0].candidate_priority, "HIGH");
    assert.equal(
      queryResult.candidates[0].match_explanation.matched_filters.includes("capability: identity-continuity"),
      true
    );
    assert.equal(
      queryResult.candidates[0].match_explanation.matched_filters.includes("need terms: identity, continuity"),
      true
    );
    assert.equal(
      queryResult.candidates[0].match_explanation.matched_filters.includes("conformance: FULL_COMPATIBLE"),
      true
    );
    assert.equal(queryResult.candidates[0].need_match.status, "STRONG_DISCOVERY_MATCH");
    assert.equal(
      queryResult.candidates[0].need_match.limitations.includes("This is a discovery match only, not a recommendation or trust decision."),
      true
    );
    assert.equal(
      queryResult.candidates[0].risk_gaps.some((risk: { code: string }) => risk.code === "DIRECT_ORIGIN_VERIFICATION_REQUIRED"),
      true
    );

    writeFileSync(
      nextSweep,
      `${JSON.stringify(sweepRecord({
        target: "https://example.org",
        checkedAt: "2026-05-24T02:00:00.000Z",
        status: "WARN",
        conformance: "PARTIAL",
        identityStatus: "PASS",
        valueStatus: "WARN",
        riskCodes: ["VALUE_LAYER_REQUIRES_REVIEW"]
      }))}\n`,
      "utf8"
    );
    run([
      "beacon",
      "index",
      "--previous",
      indexPath,
      "--in",
      nextSweep,
      "--out",
      nextIndexPath
    ]);
    const nextIndex = JSON.parse(readFileSync(nextIndexPath, "utf8"));
    assert.equal(nextIndex.sources.previous_index, indexPath);
    const updated = nextIndex.records.find((record: { origin: string }) => record.origin === "https://example.org");
    assert.ok(updated);
    assert.equal(updated.seen_count, 3);
    assert.equal(updated.first_seen_at, "2026-05-24T00:00:00.000Z");
    assert.equal(updated.last_checked_at, "2026-05-24T02:00:00.000Z");
    assert.equal(updated.status, "WARN");
    assert.equal(updated.conformance_status, "PARTIAL");
    assert.deepEqual(updated.risk_gap_codes, ["VALUE_LAYER_REQUIRES_REVIEW"]);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("beacon report turns sweep artifacts into discovery quality metrics", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-beacon-report-"));
  try {
    const sweepA = join(workspace, "sweep-a.ndjson");
    const sweepB = join(workspace, "sweep-b.ndjson");
    const reportPath = join(workspace, "beacon-discovery-report.json");
    writeFileSync(
      sweepA,
      [
        JSON.stringify(sweepRecord({
          target: "https://example.org",
          checkedAt: "2026-05-24T00:00:00.000Z",
          status: "PASS",
          conformance: "FULL_COMPATIBLE",
          identityStatus: "PASS",
          valueStatus: "PASS"
        })),
        JSON.stringify(sweepRecord({
          target: "https://claimed.example",
          checkedAt: "2026-04-01T00:00:00.000Z",
          status: "WARN",
          conformance: "CLAIMED_SIGNAL"
        }))
      ].join("\n") + "\n",
      "utf8"
    );
    writeFileSync(
      sweepB,
      [
        JSON.stringify(sweepRecord({
          target: "https://example.org",
          checkedAt: "2026-05-24T01:00:00.000Z",
          status: "PASS",
          conformance: "FULL_COMPATIBLE",
          identityStatus: "PASS",
          valueStatus: "PASS"
        })),
        JSON.stringify(sweepRecord({
          target: "https://other.example",
          checkedAt: "2026-05-24T01:10:00.000Z",
          status: "FAIL",
          conformance: "FAILED"
        }))
      ].join("\n") + "\n",
      "utf8"
    );

    const reportRun = run([
      "beacon",
      "report",
      "--sweeps",
      `${sweepA},${sweepB}`,
      "--generated-at",
      "2026-05-24T02:00:00.000Z",
      "--stale-days",
      "30",
      "--out",
      reportPath
    ]);
    const report = JSON.parse(reportRun.stdout);
    assert.equal(report.type, "OrgAnchorBeaconDiscoveryReport");
    assert.equal(report.trust_boundary.report_is_trust_root, false);
    assert.equal(report.counts.sweep_files, 2);
    assert.equal(report.counts.total_records, 4);
    assert.equal(report.counts.unique_origins, 3);
    assert.equal(report.counts.claimed_signals, 3);
    assert.equal(report.counts.identity_pass, 2);
    assert.equal(report.counts.full_compatible, 2);
    assert.equal(report.counts.stale_records, 1);
    assert.equal(report.rates.beacon_find_rate, 0.75);
    assert.equal(report.rates.origin_verification_success_rate, 0.5);
    assert.equal(report.rates.full_compatible_rate, 0.5);
    assert.equal(report.rates.stale_beacon_rate, 0.3333);
    assert.equal(report.reproducibility.available, true);
    assert.equal(report.reproducibility.average_jaccard, 0.3333);
    assert.equal(report.stale.origins.includes("https://claimed.example"), true);
    assert.equal(existsSync(reportPath), true);
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
}

function sweepRecord(options: {
  target: string;
  checkedAt: string;
  status: "PASS" | "WARN" | "FAIL";
  conformance: string;
  identityStatus?: string | null;
  valueStatus?: string | null;
  riskCodes?: string[];
}): Record<string, unknown> {
  return {
    type: "OrgAnchorBeaconSweepRecord",
    version: "0.1",
    target: options.target,
    checked_at: options.checkedAt,
    duration_ms: 1,
    status: options.status,
    conformance_status: options.conformance,
    signal: {
      claimed: options.status !== "FAIL",
      kind: options.status === "FAIL" ? "none" : "beacon",
      url: options.status === "FAIL" ? null : `${new URL(options.target).origin}/.well-known/organchor.json`,
      declared_type: options.status === "FAIL" ? null : "OrgAnchorBeacon",
      declared_version: options.status === "FAIL" ? null : "1.0",
      ignored_unknown_fields: []
    },
    hints: {
      organization: {
        name: "example-org",
        display_name: options.target.includes("failed") ? "Failed Example" : "Example Organization"
      },
      discovery: {
        categories: ["software"],
        capabilities: ["identity-continuity", "agent-verification"],
        regions: ["global"],
        languages: ["en"]
      },
      summary_status: {
        identity_status: options.identityStatus ?? null,
        value_status: options.valueStatus ?? null,
        policy_route: "EXTERNAL_POLICY_REVIEW",
        updated_at: options.checkedAt
      }
    },
    verification: {
      attempted: options.status !== "FAIL",
      target: options.target,
      overall_status: options.status,
      identity_status: options.identityStatus ?? null,
      value_status: options.valueStatus ?? null,
      root_authority_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      statement_hash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      policy_route: null
    },
    risk_gaps: (options.riskCodes ?? []).map((code) => ({
      code,
      severity: "WARN",
      detail: code,
      next_action: "Review this risk before using the candidate."
    })),
    next_steps: ["Use the verified artifacts as inputs to your own policy."]
  };
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
