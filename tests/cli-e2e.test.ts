import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("Stage 1 CLI flow creates, signs, verifies, and rejects tampering", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-stage1-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "root-2026"]);
    run(workspace, ["key", "public", "--key", "keys/root-2026.private.json"]);
    const gitignore = readFileSync(join(workspace, ".gitignore"), "utf8");
    assert.match(gitignore, /keys\/\*\.private\.json/);
    assert.match(gitignore, /\*\.private\.json/);

    const privateKey = JSON.parse(readFileSync(join(workspace, "keys", "root-2026.private.json"), "utf8"));
    assert.equal(privateKey.type, "OrgAnchorPrivateKey");
    assert.equal(privateKey.algorithm, "ed25519");
    assert.ok(privateKey.key_material.jwk.d, "expected generated private key material");

    const publicKeyPath = join(workspace, "keys", "root-2026.public.json");
    assert.equal(existsSync(publicKeyPath), true);
    const publicKey = JSON.parse(readFileSync(publicKeyPath, "utf8"));
    assert.equal(publicKey.type, "OrgAnchorPublicKey");
    assert.equal(publicKey.algorithm, "ed25519");
    assert.ok(publicKey.public_key.jwk.x, "expected public key material");
    assert.equal("d" in publicKey.public_key.jwk, false, "public key export must not contain private material");

    run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
    run(workspace, ["authority", "verify", "--authority", "root-authority.json"]);
    run(workspace, [
      "statement",
      "create",
      "--config",
      "organchor.config.json",
      "--authority",
      "root-authority.json"
    ]);
    run(workspace, ["statement", "hash", "--in", "statements/official-endpoints.json"]);
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

    const verify = run(workspace, [
      "statement",
      "verify",
      "--authority",
      "root-authority.json",
      "--in",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig"
    ]);
    assert.match(verify.stdout, /PASS/);
    const authorityHash = verify.stdout.match(/Authority hash: (sha256:[0-9a-f]{64})/)?.[1];
    assert.ok(authorityHash, "expected authority hash in verify output");

    const anchoredVerify = run(workspace, [
      "statement",
      "verify",
      "--authority",
      "root-authority.json",
      "--expected-authority-hash",
      authorityHash,
      "--in",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig"
    ]);
    assert.match(anchoredVerify.stdout, /PASS/);

    const wrongAnchor = run(
      workspace,
      [
        "statement",
        "verify",
        "--authority",
        "root-authority.json",
        "--expected-authority-hash",
        "sha256:0000000000000000000000000000000000000000000000000000000000000000",
        "--in",
        "statements/official-endpoints.json",
        "--sig",
        "statements/official-endpoints.json.sig"
      ],
      1
    );
    assert.match(wrongAnchor.stdout, /FAIL/);
    assert.match(wrongAnchor.stdout, /Authority hash does not match/);

    const statementPath = join(workspace, "statements", "official-endpoints.json");
    const statement = JSON.parse(readFileSync(statementPath, "utf8"));
    statement.official_endpoints.website = "https://attacker.example";
    writeFileSync(statementPath, `${JSON.stringify(statement, null, 2)}\n`, "utf8");

    const tampered = run(
      workspace,
      [
        "statement",
        "verify",
        "--authority",
        "root-authority.json",
        "--in",
        "statements/official-endpoints.json",
        "--sig",
        "statements/official-endpoints.json.sig"
      ],
      1
    );
    assert.match(tampered.stdout, /FAIL/);
    assert.match(tampered.stdout, /Statement hash mismatch/);

    writeFileSync(statementPath, '{"schema":"x","schema":"y"}\n', "utf8");
    const duplicateKey = run(
      workspace,
      [
        "statement",
        "verify",
        "--authority",
        "root-authority.json",
        "--in",
        "statements/official-endpoints.json",
        "--sig",
        "statements/official-endpoints.json.sig"
      ],
      1
    );
    assert.match(duplicateKey.stderr, /Duplicate object key/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("CLI creates threshold root authority and appends independent signatures", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-threshold-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "root-a"]);
    run(workspace, ["key", "generate", "--id", "root-b"]);
    run(workspace, ["key", "generate", "--id", "root-c"]);

    const authority = run(workspace, [
      "authority",
      "create",
      "--keys",
      "keys/root-a.private.json,keys/root-b.private.json,keys/root-c.private.json",
      "--threshold",
      "2",
      "--id",
      "root-authority-2026"
    ]);
    assert.match(authority.stdout, /Threshold: 2-of-3/);

    const authorityFile = JSON.parse(readFileSync(join(workspace, "root-authority.json"), "utf8"));
    assert.equal(authorityFile.threshold.required, 2);
    assert.equal(authorityFile.threshold.total, 3);
    assert.equal(authorityFile.keys.length, 3);

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
      "keys/root-a.private.json",
      "--authority",
      "root-authority.json",
      "--in",
      "statements/official-endpoints.json"
    ]);

    const firstVerify = run(
      workspace,
      [
        "statement",
        "verify",
        "--authority",
        "root-authority.json",
        "--in",
        "statements/official-endpoints.json",
        "--sig",
        "statements/official-endpoints.json.sig"
      ],
      1
    );
    assert.match(firstVerify.stdout, /threshold not met/);

    const appended = run(workspace, [
      "statement",
      "sign",
      "--key",
      "keys/root-b.private.json",
      "--authority",
      "root-authority.json",
      "--in",
      "statements/official-endpoints.json",
      "--append"
    ]);
    assert.match(appended.stdout, /Signatures: 2\/2 required/);

    const verify = run(workspace, [
      "statement",
      "verify",
      "--authority",
      "root-authority.json",
      "--in",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig"
    ]);
    assert.match(verify.stdout, /PASS/);
    assert.match(verify.stdout, /Valid signatures: root-a, root-b/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

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
