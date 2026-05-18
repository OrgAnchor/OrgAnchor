import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createEnsPlan, verifyEnsRecords } from "../src/auxiliary-names/ens.ts";
import type { JsonValue } from "../src/core/json.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("ENS plan creates auxiliary text records and optional IPFS contenthash", () => {
  const plan = createEnsPlan("ExampleOrg.ETH", statementFixture(), {
    ipfsCid: "bafyexamplecid",
    generatedAt: new Date("2026-05-12T00:00:00Z")
  });
  assert.equal(plan.ens_name, "exampleorg.eth");
  assert.equal(plan.role, "auxiliary_name");
  assert.equal(plan.recommended_contenthash.value, "ipfs://bafyexamplecid");
  assert.equal(plan.recommended_text_records.find((record) => record.key === "url")?.value, "https://example.org");
  assert.equal(
    plan.recommended_text_records.find((record) => record.key === "organchor.root-authority.sha256")?.value,
    "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  );
  assert.match(plan.identity_root_warning, /auxiliary/);
});

test("ENS verify fails when records do not match the signed statement plan", () => {
  const plan = createEnsPlan("exampleorg.eth", statementFixture(), {
    ipfsCid: "bafyexamplecid",
    generatedAt: new Date("2026-05-12T00:00:00Z")
  });
  const report = verifyEnsRecords(plan, {
    text_records: {
      url: "https://wrong.example"
    },
    contenthash: "ipfs://bafywrong"
  }, new Date("2026-05-12T00:00:00Z"));
  assert.equal(report.status, "FAIL");
  assert.equal(report.checks.some((check) => check.status === "FAIL"), true);
});

test("ENS CLI writes plan and verifies a records snapshot", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ens-"));
  try {
    createSignedStatementWorkspace(workspace);

    const planResult = run(workspace, [
      "ens",
      "plan",
      "exampleorg.eth",
      "--statement",
      "statements/official-endpoints.json",
      "--ipfs-cid",
      "bafyexamplecid"
    ]);
    assert.match(planResult.stdout, /ENS plan generated/);
    assert.equal(existsSync(join(workspace, "ens", "ens-plan.json")), true);
    const plan = JSON.parse(readFileSync(join(workspace, "ens", "ens-plan.json"), "utf8"));
    const records = {
      text_records: Object.fromEntries(plan.recommended_text_records.map((record: { key: string; value: string }) => [record.key, record.value])),
      contenthash: plan.recommended_contenthash.value
    };
    writeFileSync(join(workspace, "ens-records.json"), `${JSON.stringify(records, null, 2)}\n`, "utf8");

    const verify = run(workspace, [
      "ens",
      "verify",
      "exampleorg.eth",
      "--statement",
      "statements/official-endpoints.json",
      "--ipfs-cid",
      "bafyexamplecid",
      "--records",
      "ens-records.json"
    ]);
    assert.match(verify.stdout, /PASS/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function statementFixture(): JsonValue {
  return {
    schema: "https://organchor.org/schemas/official-endpoints.v1.json",
    type: "OfficialOrganizationEndpoints",
    version: "1.0",
    statement_id: "statement-001",
    issued_at: "2026-05-12T00:00:00Z",
    organization: {
      name: "Example Org",
      display_name: "Example Org"
    },
    root_authority: {
      type: "OrgAnchorRootAuthority"
    },
    root_authority_hash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    official_endpoints: {
      website: "https://example.org",
      verify: "https://example.org/verify/"
    },
    archives: {
      arweave: [],
      ipfs: []
    },
    disaster_recovery: {
      onion: null
    },
    auxiliary_names: {
      ens: null
    },
    domain_security: {
      primary_domain: "example.org"
    },
    notes: "fixture"
  };
}

function createSignedStatementWorkspace(workspace: string): void {
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "root-2026"]);
  run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
  run(workspace, ["statement", "create", "--config", "organchor.config.json", "--authority", "root-authority.json"]);
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
