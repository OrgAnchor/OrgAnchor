import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createBitcoinTimestampForTest,
  createPendingTimestampForTest,
  sha256Bytes
} from "../src/anchors/opentimestamps.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("OpenTimestamps stamp, pending verify, upgrade, and Bitcoin verify", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ots-"));
  let lastDigest: Buffer = Buffer.from(Buffer.alloc(32));
  let merkleRoot = "";
  const blockHeight = 123456;
  const server = createServer((request, response) => {
    void handleMockOpenTimestampsAndBitcoin(request, response, {
      getCalendarBase: () => calendarBase,
      blockHeight,
      getDigest: () => lastDigest,
      setDigest: (digest) => {
        lastDigest = Buffer.from(digest);
      },
      getMerkleRoot: () => merkleRoot,
      setMerkleRoot: (root) => {
        merkleRoot = root;
      }
    });
  });
  await listen(server);
  const address = server.address() as AddressInfo;
  const calendarBase = `http://127.0.0.1:${address.port}`;

  try {
    const statementPath = join(workspace, "statement.json");
    writeFileSync(statementPath, JSON.stringify({ statement: "hello opentimestamps" }, null, 2), "utf8");

    const stamp = await runAsync(workspace, [
      "anchor",
      "opentimestamps",
      "stamp",
      "--file",
      "statement.json",
      "--calendar",
      calendarBase
    ]);
    assert.match(stamp.stdout, /OpenTimestamps proof created/);
    assert.match(stamp.stdout, /Bitcoin anchor status: PENDING/);
    const proofPath = join(workspace, "anchors", "opentimestamps", "statement.json.ots");
    assert.equal(existsSync(proofPath), true);

    const lockfile = JSON.parse(readFileSync(join(workspace, "organchor.lock.json"), "utf8"));
    const artifactHash = `sha256:${sha256Bytes(readFileSync(statementPath)).toString("hex")}`;
    assert.equal(lockfile.artifacts[artifactHash].receipts[0].provider, "opentimestamps");
    assert.equal(lockfile.artifacts[artifactHash].receipts[0].receipt.bitcoin_anchor_status, "PENDING");

    const pending = await runAsync(workspace, [
      "anchor",
      "opentimestamps",
      "verify",
      "--file",
      "statement.json",
      "--proof",
      "anchors/opentimestamps/statement.json.ots"
    ]);
    assert.match(pending.stdout, /PASS/);
    assert.match(pending.stdout, /Bitcoin anchor status: PENDING/);

    const requireBitcoin = await runAsync(
      workspace,
      [
        "anchor",
        "opentimestamps",
        "verify",
        "--file",
        "statement.json",
        "--proof",
        "anchors/opentimestamps/statement.json.ots",
        "--require-bitcoin"
      ],
      1
    );
    assert.match(requireBitcoin.stdout, /FAIL/);

    const upgrade = await runAsync(workspace, [
      "anchor",
      "opentimestamps",
      "upgrade",
      "--proof",
      "anchors/opentimestamps/statement.json.ots"
    ]);
    assert.match(upgrade.stdout, /OpenTimestamps proof upgrade complete/);
    assert.match(upgrade.stdout, /Merged entries: 1/);

    const anchored = await runAsync(workspace, [
      "anchor",
      "opentimestamps",
      "verify",
      "--file",
      "statement.json",
      "--proof",
      "anchors/opentimestamps/statement.json.ots",
      "--bitcoin-api",
      calendarBase,
      "--require-bitcoin"
    ]);
    assert.match(anchored.stdout, /PASS/);
    assert.match(anchored.stdout, /Bitcoin anchor status: ANCHORED/);
    assert.match(anchored.stdout, new RegExp(`Bitcoin block: ${blockHeight}`));

    writeFileSync(statementPath, JSON.stringify({ statement: "tampered" }, null, 2), "utf8");
    const mismatch = await runAsync(
      workspace,
      [
        "anchor",
        "opentimestamps",
        "verify",
        "--file",
        "statement.json",
        "--proof",
        "anchors/opentimestamps/statement.json.ots",
        "--bitcoin-api",
        calendarBase
      ],
      1
    );
    assert.match(mismatch.stdout, /FAIL/);
  } finally {
    await closeServer(server);
    rmSync(workspace, { recursive: true, force: true });
  }
});

async function handleMockOpenTimestampsAndBitcoin(
  request: IncomingMessage,
  response: ServerResponse,
  state: {
    getCalendarBase: () => string;
    blockHeight: number;
    getDigest: () => Buffer;
    setDigest: (digest: Buffer) => void;
    getMerkleRoot: () => string;
    setMerkleRoot: (root: string) => void;
  }
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (request.method === "POST" && url.pathname === "/digest") {
    const digest = await readRequestBody(request);
    state.setDigest(digest);
    const proof = createPendingTimestampForTest(digest, state.getCalendarBase());
    response.writeHead(200, { "content-type": "application/vnd.opentimestamps.v1" });
    response.end(proof);
    return;
  }

  if (request.method === "GET" && url.pathname === `/timestamp/${state.getDigest().toString("hex")}`) {
    const upgraded = createBitcoinTimestampForTest(state.getDigest(), state.blockHeight, Buffer.from("organchor-test"));
    state.setMerkleRoot(upgraded.merkleRoot);
    response.writeHead(200, { "content-type": "application/vnd.opentimestamps.v1" });
    response.end(upgraded.timestamp);
    return;
  }

  if (request.method === "GET" && url.pathname === `/block-height/${state.blockHeight}`) {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("mock-block-hash");
    return;
  }

  if (request.method === "GET" && url.pathname === "/block/mock-block-hash") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ merkle_root: state.getMerkleRoot(), timestamp: 1770000000 }));
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

function runAsync(workspace: string, args: string[], expectedStatus = 0): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [cliPath, ...args], {
      cwd: workspace,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`organchor ${args.join(" ")} timed out`));
    }, 10000);
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
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (status) => {
      clearTimeout(timeout);
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
