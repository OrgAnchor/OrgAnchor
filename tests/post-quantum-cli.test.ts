import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import type { AddressInfo } from "node:net";
import { sha256CanonicalJson } from "../src/core/hash.ts";
import { verifyUrlTarget } from "../src/commands/verify-url.ts";

const cli = resolve(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");

test("an existing adopter can preserve v1, migrate to hybrid and PQ-only, and publish a verifiable complete chain", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-pq-adopter-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "root-ed", "--holder", "owner"]);
    run(workspace, ["key", "public", "--key", "keys/root-ed.private.json"]);
    run(workspace, ["authority", "create", "--key", "keys/root-ed.public.json", "--out", "old.json"]);
    run(workspace, ["statement", "create", "--authority", "old.json", "--out", "old-statement.json"]);
    signStatement(workspace, "old-statement.json", "old.json", ["root-ed"]);
    run(workspace, ["page", "generate", "--statement", "old-statement.json", "--authority", "old.json", "--out", "legacy/verify"]);
    const legacyFiles = new Map(["root-authority.json", "official-endpoints.json", "official-endpoints.json.sig"].map((name) => [name, readFileSync(join(workspace, "legacy/verify", name))]));
    const oldHash = sha256CanonicalJson(json(workspace, "old.json"));

    run(workspace, ["key", "generate", "--id", "root-pq", "--algorithm", "ml-dsa-65", "--holder", "owner"]);
    run(workspace, ["key", "public", "--key", "keys/root-pq.private.json"]);
    run(workspace, ["authority", "create", "--keys", "keys/root-ed.public.json,keys/root-pq.public.json", "--policy", "hybrid-ed25519-ml-dsa-65", "--out", "hybrid.json"]);
    const hybridHash = sha256CanonicalJson(json(workspace, "hybrid.json"));
    run(workspace, ["migrate", "create", "--old-authority", "old.json", "--new-authority", "hybrid.json", "--statement", "old-statement.json", "--out", "migrate-1.json"]);
    assert.equal(json(workspace, "migrate-1.json").version, "2.0");
    assert.equal(json(workspace, "migrate-1.json").supersedes_statement_hashes[0], sha256CanonicalJson(json(workspace, "old-statement.json")));
    signMigration(workspace, "migrate-1.json", "old.json", "old", ["root-ed"]);
    const missing = run(workspace, ["migrate", "verify", "--in", "migrate-1.json", "--sig", "migrate-1.json.sig", "--old-authority", "old.json", "--new-authority", "hybrid.json"], 1);
    assert.match(missing.stdout, /acceptance/);
    signMigration(workspace, "migrate-1.json", "hybrid.json", "new", ["root-ed", "root-pq"]);
    assert.match(run(workspace, migrationVerify("migrate-1.json", "old.json", "hybrid.json").concat(["--expected-old-authority-hash", oldHash, "--expected-new-authority-hash", hybridHash])).stdout, /PASS/);
    run(workspace, migrationVerify("migrate-1.json", "old.json", "hybrid.json").concat(["--expected-new-authority-hash", oldHash]), 1);
    run(workspace, migrationVerify("migrate-1.json", "old.json", "hybrid.json").concat(["--expected-old-authority-hash"]), 1);
    run(workspace, ["verify", "url", "https://example.invalid", "--expected-authority-hash"], 1);
    run(workspace, ["verify", "url", "https://example.invalid", "--require-post-quantum", "true"], 1);

    run(workspace, ["statement", "create", "--authority", "hybrid.json", "--out", "hybrid-statement.json"]);
    signStatement(workspace, "hybrid-statement.json", "hybrid.json", ["root-ed", "root-pq"]);
    run(workspace, ["statement", "verify", "--authority", "hybrid.json", "--in", "hybrid-statement.json", "--sig", "hybrid-statement.json.sig", "--require-post-quantum"]);
    run(workspace, ["statement", "verify", "--authority", "hybrid.json", "--in", "hybrid-statement.json", "--sig", "hybrid-statement.json.sig", "--expected-authority-hash"], 1);
    run(workspace, ["page", "generate", "--statement", "hybrid-statement.json", "--authority", "hybrid.json", "--migration", "migrate-1.json", "--out", "public/verify"]);
    const index = json(workspace, "public/verify/organchor.json");
    assert.equal(index.crypto_assurance.profile, "HYBRID");
    assert.equal(index.visible_proof.summary.valid_signature_count, 2);
    assert.equal(index.visible_proof.summary.valid_authorizer_count, 1);
    assert.match(readFileSync(join(workspace, "public/verify/index.html"), "utf8"), /HYBRID/);
    assert.equal(index.migration_history.migrations[0].acceptance_path, "migrations/migrate-1.json.acceptance.sig");

    await serve(join(workspace, "public"), async (origin) => {
      const target = `${origin}/verify/organchor.json`;
      const verified = await verifyUrlTarget(target, { requirePostQuantum: true, expectedAuthorityHash: hybridHash, expectedPredecessorAuthorityHash: oldHash });
      assert.equal(verified.identity_status, "PASS");
      assert.equal(verified.crypto_assurance.profile, "HYBRID");
      assert.equal((verified.identity.valid_authorizers as unknown[]).length, 1);
      assert.equal((verified.history.migration_continuity as Record<string, unknown>).status, "SIGNATURE_CHAIN_VERIFIED");
      assert.equal(verified.crypto_assurance.historical_time_evidence, "NOT_CHECKED");
      assert.equal((await verifyUrlTarget(target, { expectedAuthorityHash: oldHash })).identity_status, "FAIL");
      assert.equal((await verifyUrlTarget(target, { expectedPredecessorAuthorityHash: hybridHash })).identity_status, "FAIL");
      const acceptancePath = join(workspace, "public/verify/migrations/migrate-1.json.acceptance.sig");
      const original = readFileSync(acceptancePath);
      writeFileSync(acceptancePath, "{}\n");
      assert.equal((await verifyUrlTarget(target)).identity_status, "FAIL");
      writeFileSync(acceptancePath, original);
    });

    run(workspace, ["history", "checkpoint", "create", "--verify-dir", "public/verify", "--out", "history/checkpoint.json"]);
    for (const [i, key] of ["root-ed", "root-pq"].entries()) run(workspace, ["history", "checkpoint", "sign", "--in", "history/checkpoint.json", "--authority", "hybrid.json", "--key", `keys/${key}.private.json`, ...(i ? ["--append"] : [])]);
    run(workspace, ["history", "checkpoint", "seal", "--in", "history/checkpoint.json", "--authority", "hybrid.json"]);
    const history = JSON.parse(run(workspace, ["history", "checkpoint", "verify", "--in", "history/checkpoint.json", "--authority", "hybrid.json", "--verify-dir", "public/verify", "--require-post-quantum"]).stdout);
    assert.equal(history.status, "PASS");
    assert.equal(history.time_evidence.status, "NOT_CHECKED");
    assert.equal(history.signature_valid, true);

    run(workspace, ["authority", "create", "--key", "keys/root-pq.public.json", "--out", "pq.json"]);
    run(workspace, ["migrate", "create", "--old-authority", "hybrid.json", "--new-authority", "pq.json", "--previous-migration", "migrate-1.json", "--out", "migrate-2.json"]);
    signMigration(workspace, "migrate-2.json", "hybrid.json", "old", ["root-ed", "root-pq"]);
    signMigration(workspace, "migrate-2.json", "pq.json", "new", ["root-pq"]);
    assert.match(run(workspace, migrationVerify("migrate-2.json", "hybrid.json", "pq.json")).stdout, /PASS/);
    assert.match(run(workspace, migrationVerify("migrate-2.json", "hybrid.json", "pq.json")).stdout, /Predecessor link: NOT_CHECKED/);
    assert.match(run(workspace, migrationVerify("migrate-2.json", "hybrid.json", "pq.json").concat(["--previous-migration", "migrate-1.json"])).stdout, /LINK_CHECKED_PREDECESSOR_SIGNATURES_NOT_CHECKED/);
    run(workspace, migrationVerify("migrate-2.json", "hybrid.json", "pq.json").concat(["--previous-migration", "migrate-2.json"]), 1);
    assert.equal(json(workspace, "migrate-2.json").sequence, 2);
    assert.equal(json(workspace, "migrate-2.json").previous_migration_hash, sha256CanonicalJson(json(workspace, "migrate-1.json")));
    run(workspace, ["statement", "create", "--authority", "pq.json", "--out", "pq-statement.json"]);
    signStatement(workspace, "pq-statement.json", "pq.json", ["root-pq"]);
    run(workspace, ["page", "generate", "--statement", "pq-statement.json", "--authority", "pq.json", "--migration", "migrate-1.json,migrate-2.json", "--out", "pq-public/verify"]);
    run(workspace, ["migrate", "create", "--old-authority", "pq.json", "--new-authority", "old.json", "--out", "downgrade.json"], 1);
    run(workspace, ["key", "generate", "--id", "root-pq-next", "--algorithm", "ml-dsa-65", "--holder", "owner"]);
    run(workspace, ["key", "rotate-plan", "--authority", "pq.json", "--replace-key", "root-pq", "--new-key", "keys/root-pq-next.private.json", "--out", "pq-next.json"]);
    assert.equal(json(workspace, "pq-next.json").version, "2.0");
    assert.equal(json(workspace, "pq-next.json").signing_policy, "ml-dsa-65");
    for (const [name, bytes] of legacyFiles) assert.deepEqual(readFileSync(join(workspace, "legacy/verify", name)), bytes);
    assert.match(run(workspace, ["statement", "verify", "--authority", "legacy/verify/root-authority.json", "--in", "legacy/verify/official-endpoints.json", "--sig", "legacy/verify/official-endpoints.json.sig"]).stdout, /PASS/);
    run(workspace, ["statement", "verify", "--authority", "old.json", "--in", "old-statement.json", "--sig", "old-statement.json.sig", "--require-post-quantum"], 1);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function signStatement(workspace: string, input: string, authority: string, keys: string[]): void {
  for (const [i, key] of keys.entries()) run(workspace, ["statement", "sign", "--in", input, "--authority", authority, "--key", `keys/${key}.private.json`, ...(i ? ["--append"] : [])]);
}

function signMigration(workspace: string, input: string, authority: string, role: string, keys: string[]): void {
  for (const [i, key] of keys.entries()) run(workspace, ["migrate", "sign", "--in", input, `--${role}-authority`, authority, "--role", role, "--key", `keys/${key}.private.json`, ...(i ? ["--append"] : [])]);
}

function migrationVerify(input: string, old: string, next: string): string[] {
  return ["migrate", "verify", "--in", input, "--sig", `${input}.sig`, "--acceptance-sig", `${input}.acceptance.sig`, "--old-authority", old, "--new-authority", next];
}

function json(workspace: string, path: string) { return JSON.parse(readFileSync(join(workspace, path), "utf8")); }

function run(workspace: string, args: string[], expected = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: workspace, encoding: "utf8" });
  assert.equal(result.status, expected, `organchor ${args.join(" ")}\n${result.stdout}\n${result.stderr}`);
  return { stdout: result.stdout, stderr: result.stderr };
}

async function serve(root: string, action: (origin: string) => Promise<void>): Promise<void> {
  const server = createServer((request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    readFile(join(root, path)).then((bytes) => { response.writeHead(200, { "content-type": "application/json" }); response.end(bytes); })
      .catch(() => { response.writeHead(404); response.end(); });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try { await action(`http://127.0.0.1:${(server.address() as AddressInfo).port}`); }
  finally { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
}
