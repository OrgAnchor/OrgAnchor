import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("IPFS dry-run records verify directory receipt in lockfile and verifies local hash", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ipfs-"));
  try {
    createVerifyDirectory(workspace);

    const publish = run(workspace, ["mirror", "ipfs", "publish", "--dir", "public/verify", "--dry-run"]);
    assert.match(publish.stdout, /IPFS publish dry-run complete/);
    const directoryHash = matchHash(publish.stdout, /Directory hash: (sha256:[0-9a-f]{64})/);

    const lockfile = JSON.parse(readFileSync(join(workspace, "organchor.lock.json"), "utf8"));
    assert.equal(lockfile.type, "OrgAnchorLockfile");
    assert.equal(lockfile.artifacts[directoryHash].kind, "verify-directory");
    assert.equal(lockfile.artifacts[directoryHash].receipts[0].provider, "ipfs");
    assert.equal(lockfile.artifacts[directoryHash].receipts[0].status, "DRY_RUN");
    assert.equal(lockfile.artifacts[directoryHash].receipts[0].receipt.file_count > 0, true);
    assert.equal(lockfile.artifacts[directoryHash].receipts[0].receipt.total_size > 0, true);
    assert.doesNotMatch(JSON.stringify(lockfile), /private/i);

    const verify = run(workspace, [
      "mirror",
      "ipfs",
      "verify",
      "--dir",
      "public/verify",
      "--expected-hash",
      directoryHash
    ]);
    assert.match(verify.stdout, /PASS/);

    const mismatch = run(
      workspace,
      [
        "mirror",
        "ipfs",
        "verify",
        "--dir",
        "public/verify",
        "--expected-hash",
        "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      ],
      1
    );
    assert.match(mismatch.stdout, /FAIL/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("IPFS publish refuses an oversized verify mirror unless explicitly allowed", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ipfs-large-"));
  try {
    createVerifyDirectory(workspace);
    writeFileSync(join(workspace, "public", "verify", "large-video.mp4"), Buffer.alloc(1024 * 1024 + 1));

    const publish = run(
      workspace,
      ["mirror", "ipfs", "publish", "--dir", "public/verify", "--max-bytes", "1048576"],
      1
    );
    assert.match(publish.stderr, /above the 1048576 byte default limit/);

    const dryRun = run(workspace, [
      "mirror",
      "ipfs",
      "publish",
      "--dir",
      "public/verify",
      "--max-bytes",
      "1048576",
      "--dry-run"
    ]);
    assert.match(dryRun.stdout, /WARN: Directory exceeds default verify mirror limit/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("IPFS Kubo publish records returned CID and Kubo cat verification checks content hash", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ipfs-kubo-"));
  const cidContent = Buffer.from("hello from kubo");
  const cidHash = `sha256:${createHash("sha256").update(cidContent).digest("hex")}`;
  const server = createServer((request, response) => {
    void handleMockKuboRequest(request, response, cidContent);
  });

  await listen(server);
  const address = server.address() as AddressInfo;
  const api = `http://127.0.0.1:${address.port}`;

  try {
    createVerifyDirectory(workspace);

    const publish = await runAsync(workspace, ["mirror", "ipfs", "publish", "--dir", "public/verify", "--api", api]);
    assert.match(publish.stdout, /IPFS publish complete/);
    assert.match(publish.stdout, /CID: bafyorganchorroot/);
    const directoryHash = matchHash(publish.stdout, /Directory hash: (sha256:[0-9a-f]{64})/);

    const lockfile = JSON.parse(readFileSync(join(workspace, "organchor.lock.json"), "utf8"));
    const receipt = lockfile.artifacts[directoryHash].receipts[0];
    assert.equal(lockfile.artifacts[directoryHash].kind, "verify-directory");
    assert.equal(receipt.provider, "ipfs");
    assert.equal(receipt.status, "PUBLISHED");
    assert.equal(receipt.receipt.mode, "kubo");
    assert.equal(receipt.receipt.cid, "bafyorganchorroot");
    assert.equal(receipt.receipt.kubo_results.at(-1).Hash, "bafyorganchorroot");
    assert.doesNotMatch(JSON.stringify(lockfile), /private/i);

    const verify = await runAsync(workspace, [
      "mirror",
      "ipfs",
      "verify",
      "--cid",
      "bafyorganchorfile",
      "--api",
      api,
      "--expected-hash",
      cidHash
    ]);
    assert.match(verify.stdout, /PASS/);

    const mismatch = await runAsync(
      workspace,
      [
        "mirror",
        "ipfs",
        "verify",
        "--cid",
        "bafyorganchorfile",
        "--api",
        api,
        "--expected-hash",
        "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      ],
      1
    );
    assert.match(mismatch.stdout, /FAIL/);
  } finally {
    await closeServer(server);
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("IPFS remote pinning service records accepted pin without leaking token", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ipfs-pin-"));
  const expectedToken = "test-pinning-token";
  const server = createServer((request, response) => {
    void handleMockPinningService(request, response, expectedToken);
  });

  await listen(server);
  const address = server.address() as AddressInfo;
  const serviceUrl = `http://127.0.0.1:${address.port}/psa`;

  try {
    const pin = await runAsync(
      workspace,
      [
        "mirror",
        "ipfs",
        "pin",
        "--cid",
        "bafyorganchorroot",
        "--service-url",
        serviceUrl,
        "--artifact-hash",
        "sha256:1111111111111111111111111111111111111111111111111111111111111111",
        "--name",
        "organchor-verify"
      ],
      0,
      { ORGANCHOR_IPFS_PINNING_JWT: expectedToken }
    );
    assert.match(pin.stdout, /IPFS remote pin requested/);
    assert.match(pin.stdout, /Pin status: queued/);

    const lockfileText = readFileSync(join(workspace, "organchor.lock.json"), "utf8");
    assert.doesNotMatch(lockfileText, new RegExp(expectedToken));
    const lockfile = JSON.parse(lockfileText);
    const receipt =
      lockfile.artifacts["sha256:1111111111111111111111111111111111111111111111111111111111111111"].receipts[0];
    assert.equal(receipt.provider, "ipfs-pinning-service");
    assert.equal(receipt.status, "PUBLISHED");
    assert.equal(receipt.receipt.cid, "bafyorganchorroot");
    assert.equal(receipt.receipt.pin_status, "queued");
    assert.equal(receipt.receipt.requestid, "pin-request-1");
    assert.equal(receipt.receipt.token_source, "env:ORGANCHOR_IPFS_PINNING_JWT");
  } finally {
    await closeServer(server);
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("IPFS Pinata directory upload records returned CID without leaking token", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ipfs-pinata-upload-"));
  const expectedToken = "test-pinata-upload-token";
  const server = createServer((request, response) => {
    void handleMockPinataUpload(request, response, expectedToken);
  });

  await listen(server);
  const address = server.address() as AddressInfo;
  const api = `http://127.0.0.1:${address.port}`;

  try {
    createVerifyDirectory(workspace);
    writeFileSync(join(workspace, "pinata.secret"), expectedToken, "utf8");

    const upload = await runAsync(workspace, [
      "mirror",
      "ipfs",
      "upload",
      "--provider",
      "pinata",
      "--dir",
      "public/verify",
      "--api",
      api,
      "--token-file",
      "pinata.secret",
      "--name",
      "organchor-verify"
    ]);
    assert.match(upload.stdout, /IPFS Pinata upload complete/);
    assert.match(upload.stdout, /CID: bafypinatauploadroot/);
    const directoryHash = matchHash(upload.stdout, /Directory hash: (sha256:[0-9a-f]{64})/);

    const lockfileText = readFileSync(join(workspace, "organchor.lock.json"), "utf8");
    assert.doesNotMatch(lockfileText, new RegExp(expectedToken));
    const lockfile = JSON.parse(lockfileText);
    const receipt = lockfile.artifacts[directoryHash].receipts[0];
    assert.equal(receipt.provider, "ipfs-pinata");
    assert.equal(receipt.status, "PUBLISHED");
    assert.equal(receipt.receipt.mode, "pinata-upload");
    assert.equal(receipt.receipt.cid, "bafypinatauploadroot");
    assert.equal(receipt.receipt.pin_size, 1234);
    assert.equal(receipt.receipt.token_source, "file:pinata.secret");
  } finally {
    await closeServer(server);
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("Arweave manual package records receipt and verifies packaged artifact hash", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-arweave-"));
  try {
    createVerifyDirectory(workspace);

    const publish = run(workspace, [
      "archive",
      "arweave",
      "publish",
      "--statement",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig",
      "--authority",
      "root-authority.json"
    ]);
    assert.match(publish.stdout, /Arweave manual package created/);
    const manifestHash = matchHash(publish.stdout, /Manifest canonical hash: (sha256:[0-9a-f]{64})/);
    const manifestFileHash = matchHash(publish.stdout, /Manifest file hash: (sha256:[0-9a-f]{64})/);

    assert.equal(existsSync(join(workspace, "arweave-manifest.json")), true);
    assert.equal(existsSync(join(workspace, "arweave-package", "official-endpoints.json")), true);
    assert.equal(existsSync(join(workspace, "arweave-package", "official-endpoints.json.sig")), true);
    assert.equal(existsSync(join(workspace, "arweave-package", "root-authority.json")), true);

    const manifest = JSON.parse(readFileSync(join(workspace, "arweave-manifest.json"), "utf8"));
    assert.equal(manifest.type, "OrgAnchorArweaveManifest");
    assert.equal(manifest.mode, "manual-package");
    const statement = manifest.artifacts.find((artifact: { role: string }) => artifact.role === "statement");
    assert.ok(statement);

    const lockfile = JSON.parse(readFileSync(join(workspace, "organchor.lock.json"), "utf8"));
    assert.equal(lockfile.artifacts[manifestHash].kind, "arweave-manual-package");
    assert.equal(lockfile.artifacts[manifestHash].receipts[0].provider, "arweave");
    assert.equal(lockfile.artifacts[manifestHash].receipts[0].status, "MANUAL_PACKAGE");
    assert.equal(lockfile.artifacts[manifestHash].receipts[0].receipt.manifest_file_hash, manifestFileHash);
    assert.doesNotMatch(JSON.stringify(lockfile), /private/i);

    const verify = run(workspace, [
      "archive",
      "arweave",
      "verify",
      "--file",
      "arweave-package/official-endpoints.json",
      "--expected-hash",
      statement.hash
    ]);
    assert.match(verify.stdout, /PASS/);

    const mismatch = run(
      workspace,
      [
        "archive",
        "arweave",
        "verify",
        "--file",
        "arweave-package/official-endpoints.json",
        "--expected-hash",
        "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      ],
      1
    );
    assert.match(mismatch.stdout, /FAIL/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("Arweave estimate reports package size without uploading", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-arweave-estimate-"));
  try {
    createVerifyDirectory(workspace);
    run(workspace, [
      "archive",
      "arweave",
      "publish",
      "--statement",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig",
      "--authority",
      "root-authority.json"
    ]);

    const estimate = run(workspace, ["archive", "arweave", "estimate", "--dir", "arweave-package", "--offline"]);
    assert.match(estimate.stdout, /Arweave upload estimate/);
    assert.match(estimate.stdout, /Upload performed: no/);
    assert.match(estimate.stdout, /Input type: directory/);
    assert.match(estimate.stdout, /Policy: Arweave is append-only archival storage/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("Arweave estimate can read a Turbo-compatible price API", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-arweave-estimate-api-"));
  const server = createServer((request, response) => {
    void handleMockTurboPriceApi(request, response);
  });
  await listen(server);
  const address = server.address() as AddressInfo;
  const api = `http://127.0.0.1:${address.port}/v1`;

  try {
    mkdirSync(join(workspace, "arweave-package"), { recursive: true });
    writeFileSync(join(workspace, "arweave-package", "tiny.txt"), "hello", "utf8");

    const estimate = await runAsync(workspace, [
      "archive",
      "arweave",
      "estimate",
      "--dir",
      "arweave-package",
      "--turbo-api",
      api
    ]);
    assert.match(estimate.stdout, /Turbo quoted cost: 100 winc/);
    assert.match(estimate.stdout, /Estimated USD: \$0\.1000/);
  } finally {
    await closeServer(server);
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("Arweave Turbo upload uses SDK adapter and records TX ids without leaking wallet", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-arweave-turbo-"));
  try {
    createVerifyDirectory(workspace);
    run(workspace, [
      "archive",
      "arweave",
      "publish",
      "--statement",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig",
      "--authority",
      "root-authority.json"
    ]);
    const sdkPath = join(workspace, "mock-turbo-sdk.mjs");
    writeFileSync(sdkPath, mockTurboSdkModule(), "utf8");
    const walletSecret = "turbo-wallet-secret-marker";
    writeFileSync(join(workspace, "arweave-wallet.local.json"), JSON.stringify({ kty: "RSA", d: walletSecret }), "utf8");

    const upload = await runAsync(workspace, [
      "archive",
      "arweave",
      "upload",
      "--provider",
      "turbo",
      "--dir",
      "arweave-package",
      "--wallet-file",
      "arweave-wallet.local.json",
      "--sdk-module",
      sdkPath,
      "--gateway",
      "https://arweave.net"
    ]);
    assert.match(upload.stdout, /Arweave Turbo upload complete/);
    assert.match(upload.stdout, /official-endpoints\.json: tx-/);
    const manifestHash = matchHash(upload.stdout, /Manifest canonical hash: (sha256:[0-9a-f]{64})/);

    const lockfileText = readFileSync(join(workspace, "organchor.lock.json"), "utf8");
    assert.doesNotMatch(lockfileText, new RegExp(walletSecret));
    const lockfile = JSON.parse(lockfileText);
    const receipt = lockfile.artifacts[manifestHash].receipts.find(
      (item: { provider: string }) => item.provider === "arweave-turbo"
    );
    assert.ok(receipt);
    assert.equal(receipt.status, "PUBLISHED");
    assert.equal(receipt.receipt.mode, "turbo-sdk");
    assert.equal(receipt.receipt.wallet_source, "file:arweave-wallet.local.json");
    assert.equal(receipt.receipt.files.length >= 4, true);
    const statement = receipt.receipt.files.find((item: { path: string }) => item.path === "official-endpoints.json");
    assert.ok(statement);
    assert.equal(statement.role, "statement");
    assert.match(statement.tx_id, /^tx-/);
    assert.equal(statement.gateway_url, `https://arweave.net/${statement.tx_id}`);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("Arweave Turbo upload refuses sensitive-looking package files", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-arweave-sensitive-"));
  try {
    mkdirSync(join(workspace, "arweave-package"), { recursive: true });
    writeFileSync(join(workspace, "arweave-package", "root.private.json"), "{}", "utf8");

    const upload = run(
      workspace,
      [
        "archive",
        "arweave",
        "upload",
        "--provider",
        "turbo",
        "--dir",
        "arweave-package",
        "--wallet-file",
        "arweave-wallet.local.json",
        "--sdk-module",
        "mock-turbo-sdk.mjs"
      ],
      1
    );
    assert.match(upload.stderr, /Refusing to upload sensitive-looking files/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("Arweave manual package includes signed claims and evidence manifests when available", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-arweave-evidence-"));
  try {
    createVerifyDirectory(workspace);
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["claims", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);
    run(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
    run(workspace, ["evidence", "add", "--file", "public/verify/index.html"]);
    run(workspace, ["evidence", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);

    run(workspace, [
      "archive",
      "arweave",
      "publish",
      "--statement",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig",
      "--authority",
      "root-authority.json"
    ]);

    assert.equal(existsSync(join(workspace, "arweave-package", "claims", "product-claims.json")), true);
    assert.equal(existsSync(join(workspace, "arweave-package", "claims", "product-claims.json.sig")), true);
    assert.equal(existsSync(join(workspace, "arweave-package", "evidence", "evidence-manifest.json")), true);
    assert.equal(existsSync(join(workspace, "arweave-package", "evidence", "evidence-manifest.json.sig")), true);

    const manifest = JSON.parse(readFileSync(join(workspace, "arweave-manifest.json"), "utf8"));
    const roles = manifest.artifacts.map((artifact: { role: string }) => artifact.role);
    assert.deepEqual(
      roles.filter((role: string) => role === "claims" || role === "claims-signature" || role === "evidence" || role === "evidence-signature"),
      ["claims", "claims-signature", "evidence", "evidence-signature"]
    );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("Arweave manual package rejects invalid optional signed claims manifest", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-arweave-invalid-claims-"));
  try {
    createVerifyDirectory(workspace);
    run(workspace, ["claims", "create", "--config", "organchor.config.json"]);
    run(workspace, ["claims", "sign", "--key", "keys/root-2026.private.json", "--authority", "root-authority.json"]);

    const claimsPath = join(workspace, "claims", "product-claims.json");
    const claims = JSON.parse(readFileSync(claimsPath, "utf8"));
    claims.claims[0].summary = "tampered after signing";
    writeFileSync(claimsPath, `${JSON.stringify(claims, null, 2)}\n`, "utf8");

    const publish = run(
      workspace,
      [
        "archive",
        "arweave",
        "publish",
        "--statement",
        "statements/official-endpoints.json",
        "--sig",
        "statements/official-endpoints.json.sig",
        "--authority",
        "root-authority.json"
      ],
      1
    );
    assert.match(publish.stderr, /Cannot include invalid Product claims manifest/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("Arweave TX verify fetches gateway content and checks expected hash", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-arweave-tx-"));
  const txContent = Buffer.from("arweave transaction content");
  const txHash = `sha256:${createHash("sha256").update(txContent).digest("hex")}`;
  const server = createServer((request, response) => {
    void handleMockArweaveGateway(request, response, txContent);
  });

  await listen(server);
  const address = server.address() as AddressInfo;
  const gateway = `http://127.0.0.1:${address.port}`;

  try {
    const verify = await runAsync(workspace, [
      "archive",
      "arweave",
      "verify",
      "--tx",
      "arweave-tx-123",
      "--gateway",
      gateway,
      "--expected-hash",
      txHash
    ]);
    assert.match(verify.stdout, /PASS/);
    assert.match(verify.stdout, /TX: arweave-tx-123/);

    const mismatch = await runAsync(
      workspace,
      [
        "archive",
        "arweave",
        "verify",
        "--tx",
        "arweave-tx-123",
        "--gateway",
        gateway,
        "--expected-hash",
        "sha256:0000000000000000000000000000000000000000000000000000000000000000"
      ],
      1
    );
    assert.match(mismatch.stdout, /FAIL/);
  } finally {
    await closeServer(server);
    rmSync(workspace, { recursive: true, force: true });
  }
});

function createVerifyDirectory(workspace: string): void {
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
  run(workspace, [
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
}

function mockTurboSdkModule(): string {
  return `
import { createHash } from "node:crypto";

export class ArweaveSigner {
  constructor(wallet) {
    this.wallet = wallet;
  }
}

export const TurboFactory = {
  authenticated(input) {
    if (!input.signer && !input.privateKey) throw new Error("missing signer");
    return {
      async uploadFile(options) {
        const chunks = [];
        for await (const chunk of options.fileStreamFactory()) {
          chunks.push(Buffer.from(chunk));
        }
        const data = Buffer.concat(chunks);
        if (options.fileSizeFactory() !== data.length) {
          throw new Error("file size mismatch");
        }
        const tags = Object.fromEntries(options.dataItemOpts.tags.map((tag) => [tag.name, tag.value]));
        if (!tags["OrgAnchor-Artifact-Path"] || !tags["OrgAnchor-Artifact-Hash"]) {
          throw new Error("missing OrgAnchor tags");
        }
        return {
          id: "tx-" + createHash("sha256").update(tags["OrgAnchor-Artifact-Path"]).digest("hex").slice(0, 16),
          owner: "mock-owner",
          dataCaches: ["arweave.net"],
          fastFinalityIndexes: ["arweave.net"],
          deadlineHeight: 1310000,
          timestamp: 1778660000000,
          version: "0.1.0"
        };
      }
    };
  }
};
`;
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

function runAsync(
  workspace: string,
  args: string[],
  expectedStatus = 0,
  env?: Record<string, string>
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: workspace,
      env: {
        ...process.env,
        ...env
      },
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
    child.on("error", reject);
    child.on("close", (status) => {
      try {
        assert.equal(
          status,
          expectedStatus,
          `organchor ${args.join(" ")}\nstdout:\n${stdout}\nstderr:\n${stderr}`
        );
        resolvePromise({ stdout, stderr });
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function handleMockPinningService(
  request: IncomingMessage,
  response: ServerResponse,
  expectedToken: string
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const body = await readRequestBody(request);

  if (request.method === "POST" && url.pathname === "/psa/pins") {
    assert.equal(request.headers.authorization, `Bearer ${expectedToken}`);
    const pin = JSON.parse(body.toString("utf8")) as { cid?: string; name?: string };
    assert.equal(pin.cid, "bafyorganchorroot");
    assert.equal(pin.name, "organchor-verify");
    response.writeHead(202, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        requestid: "pin-request-1",
        status: "queued",
        created: "2026-05-13T00:00:00Z",
        pin: {
          cid: "bafyorganchorroot",
          name: "organchor-verify"
        },
        delegates: []
      })
    );
    return;
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
}

async function handleMockPinataUpload(
  request: IncomingMessage,
  response: ServerResponse,
  expectedToken: string
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const body = await readRequestBody(request);

  if (request.method === "POST" && url.pathname === "/pinning/pinFileToIPFS") {
    assert.equal(request.headers.authorization, `Bearer ${expectedToken}`);
    assert.match(request.headers["content-type"] ?? "", /multipart\/form-data/);
    const bodyText = body.toString("utf8");
    assert.match(bodyText, /official-endpoints\.json/);
    assert.match(bodyText, /pinataMetadata/);
    assert.match(bodyText, /organchor-verify/);
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        IpfsHash: "bafypinatauploadroot",
        PinSize: 1234,
        Timestamp: "2026-05-13T00:00:00.000Z",
        isDuplicate: false
      })
    );
    return;
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
}

function readRequestBody(request: IncomingMessage): Promise<Buffer> {
  return new Promise((resolvePromise, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      resolvePromise(Buffer.concat(chunks));
    });
    request.on("error", reject);
  });
}

function matchHash(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  assert.ok(match?.[1], `expected hash matching ${pattern}`);
  return match[1];
}

async function handleMockKuboRequest(
  request: IncomingMessage,
  response: ServerResponse,
  cidContent: Buffer
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  await drain(request);

  if (request.method === "POST" && url.pathname === "/api/v0/add") {
    response.writeHead(200, { "content-type": "application/x-ndjson" });
    response.end(
      [
        JSON.stringify({ Name: "official-endpoints.json", Hash: "bafyorganchorfile", Size: "123" }),
        JSON.stringify({ Name: "", Hash: "bafyorganchorroot", Size: "456" })
      ].join("\n")
    );
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v0/cat" && url.searchParams.get("arg") === "bafyorganchorfile") {
    response.writeHead(200, { "content-type": "application/octet-stream" });
    response.end(cidContent);
    return;
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
}

async function handleMockArweaveGateway(
  request: IncomingMessage,
  response: ServerResponse,
  txContent: Buffer
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (request.method === "GET" && url.pathname === "/arweave-tx-123") {
    response.writeHead(200, { "content-type": "application/octet-stream" });
    response.end(txContent);
    return;
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
}

async function handleMockTurboPriceApi(
  request: IncomingMessage,
  response: ServerResponse
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (request.method === "GET" && url.pathname === "/v1/price/bytes/5") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ winc: "100" }));
    return;
  }
  if (request.method === "GET" && url.pathname === "/v1/price/usd/1000") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ winc: "10000" }));
    return;
  }

  response.writeHead(404, { "content-type": "text/plain" });
  response.end("not found");
}

function drain(request: IncomingMessage): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    request.on("data", () => undefined);
    request.on("end", resolvePromise);
    request.on("error", reject);
  });
}

function listen(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", resolvePromise);
  });
}

function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolvePromise, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolvePromise();
    });
  });
}
