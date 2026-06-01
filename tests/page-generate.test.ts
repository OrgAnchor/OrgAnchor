import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("page generate creates static verify page and machine-readable artifacts", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-page-"));
  try {
    createSignedStatement(workspace);
    createDirectoryDiscoveryFiles(workspace);

    const page = run(workspace, [
      "page",
      "generate",
      "--statement",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig",
      "--authority",
      "root-authority.json",
      "--out",
      "public/verify"
    ]);
    assert.match(page.stdout, /Generated verify page/);

    const verifyDir = join(workspace, "public", "verify");
    const publicDir = join(workspace, "public");
    assert.equal(existsSync(join(verifyDir, "index.html")), true);
    assert.equal(existsSync(join(verifyDir, "organchor.json")), true);
    assert.equal(existsSync(join(publicDir, ".well-known", "organchor.json")), true);
    assert.equal(existsSync(join(publicDir, "robots.txt")), true);
    assert.equal(existsSync(join(publicDir, "sitemap.xml")), true);
    assert.equal(existsSync(join(verifyDir, "official-endpoints.json")), true);
    assert.equal(existsSync(join(verifyDir, "official-endpoints.json.sig")), true);
    assert.equal(existsSync(join(verifyDir, "root-authority.json")), true);
    assert.equal(existsSync(join(verifyDir, "claims", "product-claims.json")), true);
    assert.equal(existsSync(join(verifyDir, "claims", "product-claims.json.sig")), true);
    assert.equal(existsSync(join(verifyDir, "evidence", "evidence-manifest.json")), true);
    assert.equal(existsSync(join(verifyDir, "evidence", "evidence-manifest.json.sig")), true);
    assert.equal(existsSync(join(verifyDir, "reports", "value-continuity-report.json")), true);
    assert.equal(existsSync(join(verifyDir, "reports", "value-continuity-report.md")), true);

    const html = readFileSync(join(verifyDir, "index.html"), "utf8");
    assert.match(html, /Example Organization/);
    assert.match(html, /https:\/\/example\.org/);
    assert.match(html, /Statement hash/);
    assert.match(html, /Root authority hash/);
    assert.match(html, /Visible Proof Trail/);
    assert.match(html, /Signature threshold/);
    assert.match(html, /Carrier Receipts/);
    assert.match(html, /ipfs-pinata/);
    assert.match(html, /bafyexampleverifycid/);
    assert.match(html, /arweave-tx-statement/);
    assert.doesNotMatch(html, /SHOULD_NOT_BE_INCLUDED/);
    assert.match(html, /Migration history/);
    assert.match(html, /Root Continuity/);
    assert.match(html, /Historical statements use the root authority that signed them/);
    assert.match(html, /Claims And Evidence/);
    assert.match(html, /Product Claims Manifest/);
    assert.match(html, /Evidence Manifest/);
    assert.match(html, /Value Continuity/);
    assert.match(html, /Evidence-linked/);
    assert.match(html, /Unsupported/);
    assert.match(html, /Agent Verification View/);
    assert.match(html, /Overall status/);
    assert.match(html, /Identity status/);
    assert.match(html, /Value status/);
    assert.match(html, /External Policy Route/);
    assert.match(html, /Trust decision/);
    assert.match(html, /S1 First-party/);
    assert.match(html, /S2 Third-party/);
    assert.match(html, /S3 Sampling/);
    assert.match(html, /S4 Observation/);
    assert.match(html, /S5 Challenge/);
    assert.match(html, /Next Checks/);
    assert.match(html, /Key Terms/);
    assert.match(html, /Short explanations for human review/);
    assert.match(html, /authority record for OrgAnchor verification/);
    assert.match(html, /The final reliance decision/);
    assert.match(html, /designed to reduce hand-picked sample risk/);
    assert.match(html, /CLI Verification/);
    assert.match(html, /display does not by itself prove identity/);
    assert.match(html, /rel="organchor"/);
    assert.match(html, /application\/ld\+json/);

    const index = JSON.parse(readFileSync(join(verifyDir, "organchor.json"), "utf8"));
    assert.equal(index.type, "OrgAnchorVerifyIndex");
    assert.equal(index.role, "adopting-organization-verify-index");
    assert.equal(index.statement.path, "official-endpoints.json");
    assert.match(index.statement.hash, /^sha256:[0-9a-f]{64}$/);
    assert.equal(index.signature.path, "official-endpoints.json.sig");
    assert.equal(index.root_authority.path, "root-authority.json");
    assert.equal(index.agent_verification.contract_version, "1.0");
    assert.equal(index.agent_verification.primary_entrypoint, "/.well-known/organchor.json");
    assert.equal(index.agent_verification.artifact_base_path, "/verify/");
    assert.equal(index.agent_verification.result_type, "OrgAnchorAgentVerificationResult");
    assert.equal(index.agent_verification.compact_command, "organchor verify url <organization-url> --compact");
    assert.equal(index.agent_verification.compact_result_type, "OrgAnchorAgentVerificationCompactResult");
    assert.equal(index.agent_verification.summary.preferred_first_pass, "compact");
    assert.equal(
      index.agent_verification.summary.required_identity_checks.includes("statement_signature_threshold"),
      true
    );
    assert.equal(index.root_continuity.status, "CURRENT_ROOT_ONLY");
    assert.equal(index.root_continuity.current_root_authority.hash, index.root_authority.hash);
    assert.equal(index.root_continuity.current_root_authority.authority_id, index.root_authority.authority_id);
    assert.equal(index.root_continuity.previous_root_authorities.length, 0);
    assert.equal(index.root_continuity.migration_chain.length, 0);
    assert.equal(
      index.root_continuity.historical_verification_rule,
      "Historical statements use the root authority that signed them."
    );
    assert.equal(index.visible_proof.status, "PASS");
    assert.equal(index.visible_proof.summary.threshold_met, true);
    assert.equal(index.visible_proof.summary.valid_signature_count, 1);
    assert.equal(index.visible_proof.summary.required_signature_count, 1);
    assert.equal(index.visible_proof.summary.carrier_receipt_count, 2);
    assert.equal(index.agent_review.overall_status, "WARN");
    assert.equal(index.agent_review.identity_status, "PASS");
    assert.equal(index.agent_review.value_status, "WARN");
    assert.equal(index.agent_review.conformance_status, "PARTIAL");
    assert.equal(index.agent_review.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
    assert.equal(index.agent_review.policy_route.route, "REVIEW_VALUE_WARNINGS");
    assert.equal(index.agent_review.evidence_class_summary.some((item: { label: string }) => item.label === "S1 First-party"), true);
    assert.equal(index.agent_review.evidence_class_summary.some((item: { label: string }) => item.label === "S3 Sampling"), true);
    assert.equal(index.agent_review.source_files.includes("organchor.json"), true);
    assert.equal(index.value_continuity.status, "PRESENT");
    assert.equal(index.value_continuity.path, "reports/value-continuity-report.json");
    assert.match(index.value_continuity.hash, /^sha256:[0-9a-f]{64}$/);
    assert.equal(index.value_continuity.markdown_path, "reports/value-continuity-report.md");
    assert.equal(index.value_continuity.summary.total_claims, 1);
    assert.equal(index.value_continuity.summary.evidence_linked_claims, 1);
    assert.equal(index.value_continuity.summary.unsupported_claims, 0);
    assert.equal(index.value_continuity.claim_support_summary.support_levels.L2_HASH_BOUND_EVIDENCE, 1);
    assert.equal(index.value_continuity.s2_summary.effective_s2_count, 0);
    assert.equal(index.value_continuity.s3_summary.effective_s3_count, 0);
    assert.equal(index.value_continuity.s4_summary.effective_s4_count, 0);
    assert.equal(index.directory_discovery.status, "PRESENT");
    assert.equal(index.directory_discovery.trust_boundary.directory_is_trust_root, false);
    assert.equal(index.directory_discovery.trust_boundary.records_must_verify_at_origin, true);
    assert.equal(index.directory_discovery.snapshot.path, "/directory/directory-snapshot.json");
    assert.equal(index.directory_discovery.snapshot.hash_path, "/directory/directory-snapshot.json.sha256");
    assert.equal(index.directory_discovery.snapshot.snapshot_id, "test-directory-2026-001");
    assert.equal(index.directory_discovery.snapshot.record_count, 1);
    assert.equal(index.directory_discovery.policy.path, "/directory/directory-policy.json");
    assert.match(index.directory_discovery.policy.hash, /^sha256:[0-9a-f]{64}$/);
    assert.equal(index.directory_discovery.agent_flow.command, "organchor verify url <origin> --compact");
    assert.equal(
      index.visible_proof.checks.some((check: { label: string; status: string }) =>
        check.label === "Signature threshold" && check.status === "PASS"
      ),
      true
    );
    assert.equal(
      index.visible_proof.checks.some((check: { label: string; status: string }) =>
        check.label === "Value continuity report" && check.status === "PRESENT"
      ),
      true
    );
    assert.equal(
      index.visible_proof.checks.some((check: { label: string; status: string }) =>
        check.label === "Carrier receipts" && check.status === "PRESENT"
      ),
      true
    );
    assert.equal(index.carrier_receipts.status, "PRESENT");
    assert.equal(index.carrier_receipts.receipts.length, 2);
    assert.equal(index.carrier_receipts.receipts[0].provider, "arweave");
    assert.deepEqual(index.carrier_receipts.receipts[0].summary.tx_ids, [
      "arweave-tx-statement",
      "arweave-tx-signature",
      "arweave-tx-verify-index",
      "arweave-tx-verify-page"
    ]);
    assert.equal(index.carrier_receipts.receipts[0].summary.verify_index_tx_id, "arweave-tx-verify-index");
    assert.equal(index.carrier_receipts.receipts[0].summary.verify_page_tx_id, "arweave-tx-verify-page");
    assert.equal(index.carrier_receipts.receipts[1].provider, "ipfs-pinata");
    assert.equal(index.carrier_receipts.receipts[1].summary.cid, "bafyexampleverifycid");
    assert.equal(index.carrier_receipts.receipts[1].summary.token_source, undefined);
    assert.equal(
      index.visible_proof.checks.some((check: { label: string; status: string }) =>
        check.label === "Migration history" && check.status === "NOT_INCLUDED"
      ),
      true
    );
    assert.equal(index.linked_artifacts.claims.path, "claims/product-claims.json");
    assert.match(index.linked_artifacts.claims.hash, /^sha256:[0-9a-f]{64}$/);
    assert.equal(index.linked_artifacts.evidence.path, "evidence/evidence-manifest.json");
    assert.match(index.linked_artifacts.evidence.hash, /^sha256:[0-9a-f]{64}$/);
    assert.match(index.verification.command, /expected-authority-hash/);

    const beacon = JSON.parse(readFileSync(join(publicDir, ".well-known", "organchor.json"), "utf8"));
    assert.equal(beacon.type, "OrgAnchorBeacon");
    assert.equal(beacon.version, "1.0");
    assert.equal(beacon.origin, "https://example.org");
    assert.equal(beacon.verify_url, "https://example.org/verify/");
    assert.equal(beacon.verify_index_url, "https://example.org/verify/organchor.json");
    assert.equal(beacon.well_known_url, "https://example.org/.well-known/organchor.json");
    assert.equal(beacon.root_authority_hash, index.root_authority.hash);
    assert.equal(beacon.statement_hash, index.statement.hash);
    assert.equal(beacon.discovery.capabilities.includes("identity-continuity"), true);
    assert.equal(beacon.summary_status.identity_status, "PASS");
    assert.equal(beacon.summary_status.value_status, "WARN");
    assert.equal(beacon.agent_flow.trust_decision, "EXTERNAL_AGENT");
    assert.match(readFileSync(join(publicDir, "robots.txt"), "utf8"), /\/\.well-known\/organchor\.json/);
    assert.match(readFileSync(join(publicDir, "sitemap.xml"), "utf8"), /https:\/\/example\.org\/verify\/organchor\.json/);

    const copiedVerify = run(verifyDir, [
      "statement",
      "verify",
      "--authority",
      "root-authority.json",
      "--expected-authority-hash",
      index.root_authority.hash,
      "--in",
      "official-endpoints.json",
      "--sig",
      "official-endpoints.json.sig"
    ]);
    assert.match(copiedVerify.stdout, /PASS/);

    const copiedClaims = run(verifyDir, [
      "claims",
      "verify",
      "--authority",
      "root-authority.json",
      "--in",
      "claims/product-claims.json",
      "--sig",
      "claims/product-claims.json.sig",
      "--evidence",
      "evidence/evidence-manifest.json"
    ]);
    assert.match(copiedClaims.stdout, /PASS/);

    const copiedEvidence = run(verifyDir, [
      "evidence",
      "verify",
      "--authority",
      "root-authority.json",
      "--in",
      "evidence/evidence-manifest.json",
      "--sig",
      "evidence/evidence-manifest.json.sig"
    ]);
    assert.match(copiedEvidence.stdout, /PASS/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("page generate includes verified migration history", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-page-migration-"));
  try {
    createMigratedStatement(workspace);

    run(workspace, [
      "page",
      "generate",
      "--statement",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig",
      "--authority",
      "root-authority-new.json",
      "--migration",
      "statements/migration-2027-001.json",
      "--migration-sig",
      "statements/migration-2027-001.json.sig",
      "--out",
      "public/verify"
    ]);

    const verifyDir = join(workspace, "public", "verify");
    assert.equal(existsSync(join(verifyDir, "migrations", "migration-2027-001.json")), true);
    assert.equal(existsSync(join(verifyDir, "migrations", "migration-2027-001.json.sig")), true);

    const html = readFileSync(join(verifyDir, "index.html"), "utf8");
    assert.match(html, /Migration History/);
    assert.match(html, /Root Continuity/);
    assert.match(html, /Previous Root Authorities/);
    assert.match(html, /organchor-migration-2027-001/);
    assert.match(html, /root-authority-old/);
    assert.match(html, /root-authority-new/);
    assert.match(html, /1 of 1/);

    const index = JSON.parse(readFileSync(join(verifyDir, "organchor.json"), "utf8"));
    assert.equal(index.root_continuity.status, "MIGRATION_CHAIN_VERIFIED");
    assert.equal(index.root_continuity.current_root_authority.authority_id, "root-authority-new");
    assert.equal(index.root_continuity.previous_root_authorities.length, 1);
    assert.equal(index.root_continuity.previous_root_authorities[0].authority_id, "root-authority-old");
    assert.equal(index.root_continuity.migration_chain.length, 1);
    assert.equal(index.root_continuity.migration_chain[0].old_root_authority.authority_id, "root-authority-old");
    assert.equal(index.root_continuity.migration_chain[0].new_root_authority.authority_id, "root-authority-new");
    assert.equal(index.root_continuity.migration_chain[0].old_root_valid_signatures.length, 1);
    assert.equal(
      index.root_continuity.historical_verification_rule,
      "Historical statements use the root authority that signed them."
    );
    assert.equal(index.migration_history.status, "PASS");
    assert.equal(index.migration_history.migrations.length, 1);
    assert.equal(index.migration_history.migrations[0].migration_id, "organchor-migration-2027-001");
    assert.equal(index.visible_proof.summary.migration_count, 1);
    assert.equal(
      index.visible_proof.checks.some((check: { label: string; status: string }) =>
        check.label === "Migration history" && check.status === "PASS"
      ),
      true
    );

    const copiedVerify = run(verifyDir, [
      "statement",
      "verify",
      "--authority",
      "root-authority.json",
      "--expected-authority-hash",
      index.root_authority.hash,
      "--in",
      "official-endpoints.json",
      "--sig",
      "official-endpoints.json.sig"
    ]);
    assert.match(copiedVerify.stdout, /PASS/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("page generate rejects migration history that does not reach current authority", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-page-migration-mismatch-"));
  try {
    createMismatchedMigrationStatement(workspace);

    const page = run(
      workspace,
      [
        "page",
        "generate",
        "--statement",
        "statements/official-endpoints.json",
        "--sig",
        "statements/official-endpoints.json.sig",
        "--authority",
        "root-authority-current.json",
        "--migration",
        "statements/migration-2027-001.json",
        "--migration-sig",
        "statements/migration-2027-001.json.sig",
        "--out",
        "public/verify"
      ],
      1
    );
    assert.match(page.stderr, /does not end at the current root authority/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createSignedStatement(workspace: string): void {
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "root-2026"]);
  run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
  run(workspace, [
    "statement",
    "create",
    "--config",
    "organchor.config.json",
    "--authority",
    "root-authority.json"
  ]);
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
  writeFileSync(join(workspace, "README.md"), "# Evidence\n\nThis is a page-linked evidence artifact.\n", "utf8");
  run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
  run(workspace, ["claims", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);
  run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
  run(workspace, ["evidence", "add", "--file", "README.md", "--id", "evidence-001"]);
  run(workspace, ["evidence", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);
  run(workspace, ["value", "audit", "--claims", "claims/product-claims.json", "--evidence", "evidence/evidence-manifest.json", "--check-files"]);
  writeFileSync(
    join(workspace, "organchor.lock.json"),
    JSON.stringify(
      {
        type: "OrgAnchorLockfile",
        version: "1.0",
        created_at: "2026-05-18T00:00:00.000Z",
        updated_at: "2026-05-18T00:03:00.000Z",
        artifacts: {
          "sha256:1111111111111111111111111111111111111111111111111111111111111111": {
            hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
            kind: "verify-directory",
            path: "public/verify",
            updated_at: "2026-05-18T00:01:00.000Z",
            receipts: [
              {
                provider: "ipfs-pinata",
                action: "mirror.ipfs.upload",
                status: "PUBLISHED",
                recorded_at: "2026-05-18T00:01:00.000Z",
                receipt: {
                  mode: "pinata-upload",
                  cid: "bafyexampleverifycid",
                  directory_hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
                  total_size: 1234,
                  file_count: 5,
                  token_source: "env:SHOULD_NOT_BE_INCLUDED"
                }
              }
            ]
          },
          "sha256:2222222222222222222222222222222222222222222222222222222222222222": {
            hash: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
            kind: "arweave-manual-package",
            path: "arweave-manifest.json",
            updated_at: "2026-05-18T00:02:00.000Z",
            receipts: [
              {
                provider: "arweave",
                action: "archive.arweave.publish",
                status: "MANUAL_PACKAGE",
                recorded_at: "2026-05-18T00:02:00.000Z",
                receipt: {
                  mode: "manual-package",
                  manifest_path: "arweave-manifest.json",
                  manifest_hash: "sha256:2222222222222222222222222222222222222222222222222222222222222222",
                  package_dir: "arweave-package",
                  files: [
                    { role: "statement", path: "official-endpoints.json", tx_id: "arweave-tx-statement" },
                    { role: "signature", path: "official-endpoints.json.sig", tx_id: "arweave-tx-signature" },
                    { role: "verify-index", path: "verify/organchor.json", tx_id: "arweave-tx-verify-index" },
                    { role: "verify-page", path: "verify/index.html", tx_id: "arweave-tx-verify-page" }
                  ]
                }
              }
            ]
          }
        }
      },
      null,
      2
    ),
    "utf8"
  );
}

function createDirectoryDiscoveryFiles(workspace: string): void {
  writeFileSync(
    join(workspace, "directory-origins.json"),
    JSON.stringify(
      {
        snapshot_id: "test-directory-2026-001",
        directory_node: {
          name: "Example Directory",
          origin: "https://directory.example",
          policy_url: "https://directory.example/directory-policy.json"
        },
        origins: [
          {
            record_id: "example-org",
            origin: "https://example.org",
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
              statement_hash: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
            },
            limitations: [
              "Directory record is a summary only.",
              "Agent must verify against the origin package before relying on it."
            ]
          }
        ]
      },
      null,
      2
    ),
    "utf8"
  );
  run(workspace, [
    "directory",
    "build",
    "--origins",
    "directory-origins.json",
    "--out",
    "public/directory",
    "--generated-at",
    "2026-05-23T00:00:00.000Z"
  ]);
  writeFileSync(
    join(workspace, "public", "directory", "directory-policy.json"),
    JSON.stringify(
      {
        type: "OrgAnchorDirectoryPolicy",
        version: "0.1",
        directory_node: {
          name: "Example Directory",
          origin: "https://directory.example"
        },
        trust_boundary: {
          directory_is_trust_root: false,
          final_trust_decision: "EXTERNAL_AGENT",
          records_must_verify_at_origin: true
        }
      },
      null,
      2
    ),
    "utf8"
  );
}

function createMigratedStatement(workspace: string): void {
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "old-root"]);
  run(workspace, ["key", "generate", "--id", "new-root"]);
  run(workspace, [
    "authority",
    "create",
    "--key",
    "keys/old-root.private.json",
    "--id",
    "root-authority-old",
    "--out",
    "root-authority-old.json"
  ]);
  run(workspace, [
    "authority",
    "create",
    "--key",
    "keys/new-root.private.json",
    "--id",
    "root-authority-new",
    "--out",
    "root-authority-new.json"
  ]);
  run(workspace, [
    "statement",
    "create",
    "--config",
    "organchor.config.json",
    "--authority",
    "root-authority-new.json"
  ]);
  run(workspace, [
    "statement",
    "sign",
    "--key",
    "keys/new-root.private.json",
    "--authority",
    "root-authority-new.json",
    "--in",
    "statements/official-endpoints.json"
  ]);
  run(workspace, [
    "migrate",
    "create",
    "--old-authority",
    "root-authority-old.json",
    "--new-authority",
    "root-authority-new.json",
    "--out",
    "statements/migration-2027-001.json",
    "--id",
    "organchor-migration-2027-001"
  ]);
  run(workspace, [
    "migrate",
    "sign",
    "--key",
    "keys/old-root.private.json",
    "--old-authority",
    "root-authority-old.json",
    "--in",
    "statements/migration-2027-001.json"
  ]);
}

function createMismatchedMigrationStatement(workspace: string): void {
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "old-root"]);
  run(workspace, ["key", "generate", "--id", "migration-new-root"]);
  run(workspace, ["key", "generate", "--id", "current-root"]);
  run(workspace, [
    "authority",
    "create",
    "--key",
    "keys/old-root.private.json",
    "--id",
    "root-authority-old",
    "--out",
    "root-authority-old.json"
  ]);
  run(workspace, [
    "authority",
    "create",
    "--key",
    "keys/migration-new-root.private.json",
    "--id",
    "root-authority-migration-new",
    "--out",
    "root-authority-migration-new.json"
  ]);
  run(workspace, [
    "authority",
    "create",
    "--key",
    "keys/current-root.private.json",
    "--id",
    "root-authority-current",
    "--out",
    "root-authority-current.json"
  ]);
  run(workspace, [
    "statement",
    "create",
    "--config",
    "organchor.config.json",
    "--authority",
    "root-authority-current.json"
  ]);
  run(workspace, [
    "statement",
    "sign",
    "--key",
    "keys/current-root.private.json",
    "--authority",
    "root-authority-current.json",
    "--in",
    "statements/official-endpoints.json"
  ]);
  run(workspace, [
    "migrate",
    "create",
    "--old-authority",
    "root-authority-old.json",
    "--new-authority",
    "root-authority-migration-new.json",
    "--out",
    "statements/migration-2027-001.json"
  ]);
  run(workspace, [
    "migrate",
    "sign",
    "--key",
    "keys/old-root.private.json",
    "--old-authority",
    "root-authority-old.json",
    "--in",
    "statements/migration-2027-001.json"
  ]);
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
