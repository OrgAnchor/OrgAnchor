import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("claims and evidence manifests sign, verify, and check local evidence hashes", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "README.md"), "# Evidence\n\nThis is a test artifact.\n", "utf8");
    const rawHash = run(workspace, ["evidence", "hash", "--file", "README.md"]);
    assert.match(rawHash.stdout.trim(), /^sha256:[0-9a-f]{64}$/);

    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["claims", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);

    const missingRef = run(
      workspace,
      [
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
      ],
      1
    );
    assert.match(missingRef.stdout, /references missing evidence/);

    const add = run(workspace, ["evidence", "add", "--file", "README.md", "--id", "evidence-001"]);
    assert.match(add.stdout, /Evidence hash: sha256:/);

    run(workspace, [
      "evidence",
      "sign",
      "--key",
      "keys/root-2026.private.json",
      "--authority",
      "root-authority.json"
    ]);

    const claims = run(workspace, [
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
    assert.match(claims.stdout, /PASS/);

    const evidence = run(workspace, [
      "evidence",
      "verify",
      "--authority",
      "root-authority.json",
      "--in",
      "evidence/evidence-manifest.json",
      "--sig",
      "evidence/evidence-manifest.json.sig",
      "--check-files"
    ]);
    assert.match(evidence.stdout, /PASS/);

    const manifest = JSON.parse(readFileSync(join(workspace, "evidence", "evidence-manifest.json"), "utf8"));
    assert.equal(manifest.evidence[0].issuer_type, "first_party");
    assert.equal(manifest.evidence[0].media_type, "text/markdown");
    assert.match(manifest.evidence[0].hash, /^sha256:[0-9a-f]{64}$/);

    writeFileSync(join(workspace, "README.md"), "# Evidence\n\nTampered.\n", "utf8");
    const mismatch = run(
      workspace,
      [
        "evidence",
        "verify",
        "--authority",
        "root-authority.json",
        "--in",
        "evidence/evidence-manifest.json",
        "--sig",
        "evidence/evidence-manifest.json.sig",
        "--check-files"
      ],
      1
    );
    assert.match(mismatch.stdout, /local file hash mismatch/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("evidence add records an external location for independently hosted large artifacts", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-location-"));
  try {
    createAuthority(workspace);
    writeFileSync(join(workspace, "demo.mp4"), Buffer.from("not really a video"), "utf8");
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);

    const add = run(workspace, [
      "evidence",
      "add",
      "--file",
      "demo.mp4",
      "--id",
      "demo-video-001",
      "--uri",
      "https://r2.example.com/organchor/demo.mp4",
      "--location-type",
      "https",
      "--media-type",
      "video/mp4"
    ]);
    assert.match(add.stdout, /Evidence location: https https:\/\/r2\.example\.com\/organchor\/demo\.mp4/);

    const manifest = JSON.parse(readFileSync(join(workspace, "evidence", "evidence-manifest.json"), "utf8"));
    assert.equal(manifest.evidence[0].id, "demo-video-001");
    assert.equal(manifest.evidence[0].media_type, "video/mp4");
    assert.deepEqual(manifest.evidence[0].locations, [
      { type: "local", uri: "demo.mp4" },
      { type: "https", uri: "https://r2.example.com/organchor/demo.mp4" }
    ]);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("claims and evidence signatures can be appended to satisfy threshold authority", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-evidence-threshold-"));
  try {
    createThresholdAuthority(workspace);
    writeFileSync(join(workspace, "README.md"), "# Evidence\n\nThreshold evidence.\n", "utf8");

    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["claims", "sign", "--key", "keys/root-a.private.json", "--authority", "root-authority.json"]);
    const firstClaims = run(
      workspace,
      ["claims", "verify", "--authority", "root-authority.json", "--in", "claims/product-claims.json", "--sig", "claims/product-claims.json.sig"],
      1
    );
    assert.match(firstClaims.stdout, /threshold not met/);

    const claimsAppend = run(workspace, [
      "claims",
      "sign",
      "--key",
      "keys/root-b.private.json",
      "--authority",
      "root-authority.json",
      "--append"
    ]);
    assert.match(claimsAppend.stdout, /Signatures: 2\/2 required/);
    const claims = run(workspace, [
      "claims",
      "verify",
      "--authority",
      "root-authority.json",
      "--in",
      "claims/product-claims.json",
      "--sig",
      "claims/product-claims.json.sig"
    ]);
    assert.match(claims.stdout, /PASS/);
    assert.match(claims.stdout, /Valid signatures: root-a, root-b/);

    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "add", "--file", "README.md"]);
    run(workspace, ["evidence", "sign", "--key", "keys/root-a.private.json", "--authority", "root-authority.json"]);
    const firstEvidence = run(
      workspace,
      [
        "evidence",
        "verify",
        "--authority",
        "root-authority.json",
        "--in",
        "evidence/evidence-manifest.json",
        "--sig",
        "evidence/evidence-manifest.json.sig"
      ],
      1
    );
    assert.match(firstEvidence.stdout, /threshold not met/);

    const evidenceAppend = run(workspace, [
      "evidence",
      "sign",
      "--key",
      "keys/root-b.private.json",
      "--authority",
      "root-authority.json",
      "--append"
    ]);
    assert.match(evidenceAppend.stdout, /Signatures: 2\/2 required/);
    const evidence = run(workspace, [
      "evidence",
      "verify",
      "--authority",
      "root-authority.json",
      "--in",
      "evidence/evidence-manifest.json",
      "--sig",
      "evidence/evidence-manifest.json.sig"
    ]);
    assert.match(evidence.stdout, /PASS/);
    assert.match(evidence.stdout, /Valid signatures: root-a, root-b/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createAuthority(workspace: string): void {
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "root-2026"]);
  run(workspace, ["authority", "create", "--key", "keys/root-2026.private.json"]);
}

function createThresholdAuthority(workspace: string): void {
  run(workspace, ["init"]);
  run(workspace, ["key", "generate", "--id", "root-a"]);
  run(workspace, ["key", "generate", "--id", "root-b"]);
  run(workspace, ["key", "generate", "--id", "root-c"]);
  run(workspace, [
    "authority",
    "create",
    "--keys",
    "keys/root-a.private.json,keys/root-b.private.json,keys/root-c.private.json",
    "--threshold",
    "2"
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
