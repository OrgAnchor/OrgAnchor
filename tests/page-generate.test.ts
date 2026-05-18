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
    assert.equal(existsSync(join(verifyDir, "index.html")), true);
    assert.equal(existsSync(join(verifyDir, "organchor.json")), true);
    assert.equal(existsSync(join(verifyDir, "official-endpoints.json")), true);
    assert.equal(existsSync(join(verifyDir, "official-endpoints.json.sig")), true);
    assert.equal(existsSync(join(verifyDir, "root-authority.json")), true);
    assert.equal(existsSync(join(verifyDir, "claims", "product-claims.json")), true);
    assert.equal(existsSync(join(verifyDir, "claims", "product-claims.json.sig")), true);
    assert.equal(existsSync(join(verifyDir, "evidence", "evidence-manifest.json")), true);
    assert.equal(existsSync(join(verifyDir, "evidence", "evidence-manifest.json.sig")), true);

    const html = readFileSync(join(verifyDir, "index.html"), "utf8");
    assert.match(html, /Example Organization/);
    assert.match(html, /https:\/\/example\.org/);
    assert.match(html, /Statement hash/);
    assert.match(html, /Root authority hash/);
    assert.match(html, /Visible Proof Trail/);
    assert.match(html, /Signature threshold/);
    assert.match(html, /Migration history/);
    assert.match(html, /Root Continuity/);
    assert.match(html, /Historical statements use the root authority that signed them/);
    assert.match(html, /Claims And Evidence/);
    assert.match(html, /Product Claims Manifest/);
    assert.match(html, /Evidence Manifest/);
    assert.match(html, /CLI Verification/);
    assert.match(html, /display does not by itself prove identity/);

    const index = JSON.parse(readFileSync(join(verifyDir, "organchor.json"), "utf8"));
    assert.equal(index.type, "OrgAnchorVerifyIndex");
    assert.equal(index.role, "adopting-organization-verify-index");
    assert.equal(index.statement.path, "official-endpoints.json");
    assert.match(index.statement.hash, /^sha256:[0-9a-f]{64}$/);
    assert.equal(index.signature.path, "official-endpoints.json.sig");
    assert.equal(index.root_authority.path, "root-authority.json");
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
    assert.equal(
      index.visible_proof.checks.some((check: { label: string; status: string }) =>
        check.label === "Signature threshold" && check.status === "PASS"
      ),
      true
    );
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
