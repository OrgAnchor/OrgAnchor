import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("lockfile can be hashed, signed, verified, and rejects tampering", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-lockfile-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "root-2026"]);
    run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
    writeLockfile(workspace, "bafyexamplecid");

    const hash = run(workspace, ["lockfile", "hash", "--in", "organchor.lock.json"]);
    assert.match(hash.stdout, /Lockfile hash: sha256:[0-9a-f]{64}/);

    const sign = run(workspace, [
      "lockfile",
      "sign",
      "--key",
      "keys/root-2026.private.json",
      "--authority",
      "root-authority.json",
      "--in",
      "organchor.lock.json"
    ]);
    assert.match(sign.stdout, /Created lockfile signature/);
    assert.match(sign.stdout, /Signatures: 1\/1 required/);

    const verify = run(workspace, [
      "lockfile",
      "verify",
      "--authority",
      "root-authority.json",
      "--in",
      "organchor.lock.json",
      "--sig",
      "organchor.lock.json.sig"
    ]);
    assert.match(verify.stdout, /PASS/);

    writeLockfile(workspace, "bafytamperedcid");
    const tampered = run(
      workspace,
      [
        "lockfile",
        "verify",
        "--authority",
        "root-authority.json",
        "--in",
        "organchor.lock.json",
        "--sig",
        "organchor.lock.json.sig"
      ],
      1
    );
    assert.match(tampered.stdout, /FAIL/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("lockfile signing refuses sensitive-looking receipt fields", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-lockfile-sensitive-"));
  try {
    run(workspace, ["init"]);
    run(workspace, ["key", "generate", "--id", "root-2026"]);
    run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
    writeFileSync(
      join(workspace, "organchor.lock.json"),
      JSON.stringify(
        {
          type: "OrgAnchorLockfile",
          version: "1.0",
          artifacts: {
            "sha256:1111111111111111111111111111111111111111111111111111111111111111": {
              hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
              kind: "verify-directory",
              path: "public/verify",
              receipts: [
                {
                  provider: "pinata",
                  action: "mirror.ipfs.publish",
                  status: "PUBLISHED",
                  recorded_at: "2026-05-18T00:01:00.000Z",
                  receipt: {
                    api_token: "SHOULD_NOT_BE_SIGNED"
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
    const result = run(
      workspace,
      [
        "lockfile",
        "sign",
        "--key",
        "keys/root-2026.private.json",
        "--authority",
        "root-authority.json",
        "--in",
        "organchor.lock.json"
      ],
      1
    );
    assert.match(result.stderr, /sensitive-looking key/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function writeLockfile(workspace: string, cid: string): void {
  writeFileSync(
    join(workspace, "organchor.lock.json"),
    JSON.stringify(
      {
        type: "OrgAnchorLockfile",
        version: "1.0",
        created_at: "2026-05-18T00:00:00.000Z",
        updated_at: "2026-05-18T00:01:00.000Z",
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
                  cid,
                  directory_hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111"
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
