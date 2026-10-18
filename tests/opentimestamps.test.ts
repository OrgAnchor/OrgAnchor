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
  ByteReader,
  ByteWriter,
  createBitcoinTimestampForTest,
  createPendingTimestampForTest,
  detachedProofFromTimestampBytes,
  findBitcoinAttestations,
  MAX_OPENTIMESTAMPS_PROOF_BYTES,
  parseDetachedOpenTimestamp,
  serializeDetachedOpenTimestamp,
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
      `${calendarBase}/api`,
      "--require-bitcoin"
    ]);
    assert.match(anchored.stdout, /PASS/);
    assert.match(anchored.stdout, /Bitcoin anchor status: API_REPORTED_NOT_INDEPENDENTLY_CHECKED/);
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

test("OpenTimestamps API fabrication never satisfies trusted verification", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ots-api-"));
  const file = Buffer.from("API-reported existence is not independently trusted history");
  const digest = sha256Bytes(file);
  const bitcoin = createBitcoinTimestampForTest(digest, 123456, Buffer.from("fabricated"));
  const requests: string[] = [];
  let displayedMerkleRoot = Buffer.from(bitcoin.merkleRoot, "hex").reverse().toString("hex");
  const server = createServer((request, response) => {
    requests.push(request.url ?? "");
    if (request.url === "/api/block-height/123456") {
      response.end("ab".repeat(32));
    } else if (request.url === `/api/block/${"ab".repeat(32)}`) {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify({ merkle_root: displayedMerkleRoot, timestamp: 946684800 }));
    } else {
      response.writeHead(404);
      response.end();
    }
  });
  await listen(server);
  const api = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

  try {
    writeFileSync(join(workspace, "file"), file);
    writeFileSync(join(workspace, "proof.ots"), detachedProof(digest, bitcoin.timestamp));
    const args = ["anchor", "opentimestamps", "verify", "--file", "file", "--proof", "proof.ots"];
    for (const base of [api, `${api}/`]) {
      const reported = await runAsync(workspace, [...args, "--bitcoin-api", base, "--require-bitcoin"]);
      assert.match(reported.stdout, /Bitcoin anchor status: API_REPORTED_NOT_INDEPENDENTLY_CHECKED/);
      assert.match(reported.stdout, /Bitcoin block time: 2000-01-01/);
      assert.doesNotMatch(reported.stdout, /^Bitcoin anchor status: ANCHORED/m);
    }
    assert.equal(requests.length, 4);

    for (const flags of [[], ["--offline"], ["--offline", "--require-bitcoin"]]) {
      const untrusted = await runAsync(workspace, [...args, "--bitcoin-api", api, "--require-trusted", ...flags], 1);
      assert.match(untrusted.stdout, /^FAIL/m);
      assert.match(untrusted.stdout, /Bitcoin anchor status: PRESENT_NOT_EXTERNALLY_CHECKED/);
      assert.match(untrusted.stdout, /--require-trusted requires --trusted-bitcoin-block/);
    }
    assert.equal(requests.length, 4, "Trusted verification must not infer trust from an API response");

    writeFileSync(join(workspace, "forged-pin.json"), JSON.stringify({
      block_hash: "ab".repeat(32), header_hex: Buffer.alloc(80).toString("hex"), height: 123456
    }));
    const forged = await runAsync(workspace, [
      ...args, "--bitcoin-api", api, "--require-trusted", "--trusted-bitcoin-block", "forged-pin.json"
    ], 1);
    assert.match(forged.stdout, /Bitcoin anchor status: PINNED_BLOCK_VERIFICATION_FAILED/);
    assert.match(forged.stdout, /Pinned Bitcoin block hash does not match header/);
    assert.equal(requests.length, 4, "A failed pin must not fall back to the matching fabricated API");

    const unchecked = await runAsync(workspace, [...args, "--offline", "--require-bitcoin"]);
    assert.match(unchecked.stdout, /Bitcoin anchor status: PRESENT_NOT_EXTERNALLY_CHECKED/);

    displayedMerkleRoot = bitcoin.merkleRoot;
    const wrongByteOrder = await runAsync(workspace, [...args, "--bitcoin-api", api], 1);
    assert.match(wrongByteOrder.stdout, /commitment does not match block merkle_root/);
  } finally {
    await closeServer(server);
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("OpenTimestamps trusted pins check header hash, raw Merkle bytes, and height offline", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ots-pin-"));
  const file = Buffer.from("exact bytes bound to an independently supplied block pin");
  const digest = sha256Bytes(file);
  const bitcoin = createBitcoinTimestampForTest(digest, 123456, Buffer.from("pinned"));
  const pin = trustedBlockPin(bitcoin.merkleRoot, 123456);
  try {
    writeFileSync(join(workspace, "file"), file);
    writeFileSync(join(workspace, "proof.ots"), detachedProof(digest, bitcoin.timestamp));
    writeFileSync(join(workspace, "pin.json"), JSON.stringify(pin));
    const args = [
      "anchor", "opentimestamps", "verify", "--file", "file", "--proof", "proof.ots",
      "--trusted-bitcoin-block", "pin.json", "--require-trusted", "--require-bitcoin",
      "--bitcoin-api", "http://127.0.0.1:1/api"
    ];
    for (const flags of [[], ["--offline"]]) {
      const checked = await runAsync(workspace, [...args, ...flags]);
      assert.match(checked.stdout, /^PASS/m);
      assert.match(checked.stdout, /Bitcoin anchor status: ANCHORED_TO_PINNED_BLOCK/);
      assert.match(checked.stdout, new RegExp(`Bitcoin block hash: ${pin.block_hash}`));
      assert.match(checked.stdout, /independently establish canonical-chain membership/);
    }

    for (const [invalid, error] of [
      [{ ...pin, block_hash: "00".repeat(32) }, /Pinned Bitcoin block hash does not match header/],
      [trustedBlockPin("00".repeat(32), pin.height), /Merkle root and height/],
      [{ ...pin, height: pin.height + 1 }, /Merkle root and height/]
    ] as const) {
      writeFileSync(join(workspace, "pin.json"), JSON.stringify(invalid));
      const rejected = await runAsync(workspace, [...args, "--offline"], 1);
      assert.match(rejected.stdout, /^FAIL/m);
      assert.match(rejected.stdout, /Bitcoin anchor status: PINNED_BLOCK_VERIFICATION_FAILED/);
      assert.match(rejected.stdout, error);
    }

    writeFileSync(join(workspace, "pin.json"), JSON.stringify(pin));
    writeFileSync(join(workspace, "file"), "different bytes");
    const mismatch = await runAsync(workspace, [...args, "--offline"], 1);
    assert.match(mismatch.stdout, /^FAIL/m);
    assert.match(mismatch.stdout, /Proof hash:/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("OpenTimestamps pending receipts cannot satisfy require-trusted even offline or with a pin", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ots-pending-trust-"));
  const file = Buffer.from("pending is not anchored");
  const digest = sha256Bytes(file);
  try {
    writeFileSync(join(workspace, "file"), file);
    writeFileSync(join(workspace, "proof.ots"), detachedProof(digest, createPendingTimestampForTest(digest, "https://example.org")));
    writeFileSync(join(workspace, "pin.json"), JSON.stringify(trustedBlockPin("00".repeat(32), 123456)));
    const args = ["anchor", "opentimestamps", "verify", "--file", "file", "--proof", "proof.ots", "--require-trusted"];
    for (const flags of [[], ["--offline"], ["--offline", "--trusted-bitcoin-block", "pin.json"]]) {
      const pending = await runAsync(workspace, [...args, ...flags], 1);
      assert.match(pending.stdout, /^FAIL/m);
      assert.match(pending.stdout, /Bitcoin anchor status: PENDING/);
    }
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("OpenTimestamps verify refuses proof files larger than 1 MiB", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-ots-input-limit-"));
  try {
    writeFileSync(join(workspace, "file"), "bounded proof input");
    writeFileSync(join(workspace, "proof.ots"), Buffer.alloc(MAX_OPENTIMESTAMPS_PROOF_BYTES + 1));
    const oversized = await runAsync(workspace, [
      "anchor", "opentimestamps", "verify", "--file", "file", "--proof", "proof.ots", "--offline"
    ], 1);
    assert.match(oversized.stderr, /1 MiB input size limit/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("OpenTimestamps parser accepts a 1 MiB proof and rejects larger inputs", () => {
  const digest = Buffer.alloc(32);
  const prefix = detachedPrefix(digest);
  const fullEntry = opaqueAttestation(8192);
  const count = Math.floor((MAX_OPENTIMESTAMPS_PROOF_BYTES - prefix.length - 11) / (fullEntry.length + 1));
  const lastSize = MAX_OPENTIMESTAMPS_PROOF_BYTES - prefix.length - count * (fullEntry.length + 1) - 11;
  const proof = Buffer.concat([
    prefix,
    ...Array.from({ length: count }, () => Buffer.concat([Buffer.from([0xff]), fullEntry])),
    opaqueAttestation(lastSize)
  ]);
  assert.equal(proof.length, MAX_OPENTIMESTAMPS_PROOF_BYTES);
  assert.equal(parseDetachedOpenTimestamp(proof).timestamp.entries.length, count + 1);
  assert.throws(() => parseDetachedOpenTimestamp(Buffer.concat([proof, Buffer.from([0])])), /1 MiB input size limit/);
  assert.throws(() => detachedProofFromTimestampBytes(digest, Buffer.alloc(MAX_OPENTIMESTAMPS_PROOF_BYTES + 1)), /1 MiB input size limit/);
});

test("OpenTimestamps parser bounds recursive depth at 128 timestamp levels", () => {
  const digest = Buffer.alloc(32);
  const pending = createPendingTimestampForTest(digest, "https://example.org");
  const allowed = Buffer.concat([Buffer.alloc(127, 0xf2), pending]);
  assert.doesNotThrow(() => detachedProofFromTimestampBytes(digest, allowed));
  assert.throws(() => detachedProofFromTimestampBytes(digest, Buffer.concat([Buffer.from([0xf2]), allowed])), /depth limit of 128/);
});

test("OpenTimestamps parser counts at most 4096 entries across the entire proof", () => {
  const digest = Buffer.alloc(32);
  const entry = opaqueAttestation(0);
  const siblings = (count: number) => Buffer.concat([
    ...Array.from({ length: count - 1 }, () => Buffer.concat([Buffer.from([0xff]), entry])), entry
  ]);
  const allowed = siblings(4096);
  assert.equal(detachedProofFromTimestampBytes(digest, allowed).timestamp.entries.length, 4096);
  assert.throws(() => detachedProofFromTimestampBytes(digest, siblings(4097)), /entry limit of 4096/);
  const nested = Buffer.concat([Buffer.from([0xff, 0xf2]), siblings(2048), siblings(2048)]);
  assert.throws(() => detachedProofFromTimestampBytes(digest, nested), /entry limit of 4096/);
});

test("OpenTimestamps parser bounds transformed messages before allocating oversized results", () => {
  const digest = Buffer.alloc(32);
  const entry = opaqueAttestation(0);
  const atLimit = Buffer.alloc(15, 0xf3);
  assert.doesNotThrow(() => detachedProofFromTimestampBytes(digest, Buffer.concat([atLimit, entry])));
  for (const op of [Buffer.from([0xf3]), Buffer.from([0xf0, 1, 0]), Buffer.from([0xf1, 1, 0])]) {
    assert.throws(() => detachedProofFromTimestampBytes(digest, Buffer.concat([atLimit, op, entry])), /transformed message exceeds the 1 MiB limit/);
  }
  assert.throws(() => detachedProofFromTimestampBytes(Buffer.alloc(MAX_OPENTIMESTAMPS_PROOF_BYTES + 1), entry), /message exceeds the 1 MiB limit/);
});

test("OpenTimestamps parser rejects tiny reverse chains exceeding the cumulative message budget", () => {
  const digest = Buffer.alloc(32);
  const timestamp = expandingTimestamp(1, Buffer.alloc(15, 0xf2));
  const proof = Buffer.concat([detachedPrefix(digest), timestamp]);
  assert.ok(proof.length < 128);
  assert.throws(() => parseDetachedOpenTimestamp(proof), /cumulative message size limit of 16 MiB/);
  assert.throws(() => detachedProofFromTimestampBytes(digest, timestamp), /cumulative message size limit of 16 MiB/);
});

test("OpenTimestamps cumulative message budget spans all reverse and concat branches", () => {
  const digest = Buffer.alloc(32);
  for (const op of [Buffer.from([0xf2]), Buffer.from([0xf0, 0]), Buffer.from([0xf1, 0])]) {
    const chain = Buffer.concat(Array.from({ length: 4 }, () => op));
    assert.doesNotThrow(() => detachedProofFromTimestampBytes(digest, expandingTimestamp(3, chain)));
    const timestamp = expandingTimestamp(4, chain);
    const proof = Buffer.concat([detachedPrefix(digest), timestamp]);
    assert.ok(proof.length < 256);
    assert.throws(() => parseDetachedOpenTimestamp(proof), /cumulative message size limit of 16 MiB/);
    assert.throws(() => detachedProofFromTimestampBytes(digest, timestamp), /cumulative message size limit of 16 MiB/);
  }
});

test("OpenTimestamps cumulative budget counts the root and actual hash output, allowing exactly 16 MiB", () => {
  const digest = Buffer.alloc(32);
  // Root + hexlify outputs + 14 reversals + a 32-byte hash total exactly 16 MiB.
  const chain = Buffer.concat([Buffer.alloc(14, 0xf2), Buffer.from([0x08])]);
  const allowed = expandingTimestamp(1, chain);
  assert.doesNotThrow(() => parseDetachedOpenTimestamp(Buffer.concat([detachedPrefix(digest), allowed])));
  const oversized = expandingTimestamp(1, Buffer.concat([chain, Buffer.from([0xf2])]));
  assert.throws(() => detachedProofFromTimestampBytes(digest, oversized), /cumulative message size limit of 16 MiB/);
  assert.doesNotThrow(() => detachedProofFromTimestampBytes(digest, createPendingTimestampForTest(digest, "https://example.org")));
});

test("OpenTimestamps lengths cannot wrap to negative signed integers", () => {
  const encoded = Buffer.from([0xff, 0xff, 0xff, 0xff, 0x0f]);
  assert.equal(new ByteReader(encoded).readVaruint(), 0xffffffff);
  assert.throws(() => new ByteReader(encoded).readVarBytes(8192), /varbytes too large/);
  assert.throws(() => new ByteReader(Buffer.alloc(0)).readBytes(-1), /Invalid OpenTimestamps byte length/);
});

test("OpenTimestamps existing pending and Bitcoin proof bytes round-trip unchanged", () => {
  const digest = sha256Bytes(Buffer.from("fixture"));
  const bitcoin = createBitcoinTimestampForTest(digest, 123456, Buffer.from("suffix"));
  for (const timestamp of [createPendingTimestampForTest(digest, "https://example.org"), bitcoin.timestamp]) {
    const proof = detachedProof(digest, timestamp);
    assert.deepEqual(serializeDetachedOpenTimestamp(parseDetachedOpenTimestamp(proof)), proof);
  }
  assert.deepEqual(findBitcoinAttestations(detachedProofFromTimestampBytes(digest, bitcoin.timestamp).timestamp), [
    { height: 123456, commitment: bitcoin.merkleRoot }
  ]);
});

function detachedProof(digest: Buffer, timestamp: Buffer): Buffer {
  return serializeDetachedOpenTimestamp(detachedProofFromTimestampBytes(digest, timestamp));
}

function detachedPrefix(digest: Buffer): Buffer {
  const timestamp = opaqueAttestation(0);
  const proof = detachedProof(digest, timestamp);
  return proof.subarray(0, proof.length - timestamp.length);
}

function opaqueAttestation(size: number): Buffer {
  const writer = new ByteWriter();
  writer.writeByte(0);
  writer.writeBytes(Buffer.alloc(8, 0x42));
  writer.writeVarBytes(Buffer.alloc(size));
  return writer.toBuffer();
}

function expandingTimestamp(branches: number, chain: Buffer): Buffer {
  const branch = Buffer.concat([chain, opaqueAttestation(0)]);
  return Buffer.concat([
    Buffer.alloc(15, 0xf3),
    ...Array.from({ length: branches - 1 }, () => Buffer.concat([Buffer.from([0xff]), branch])),
    branch
  ]);
}

function trustedBlockPin(merkleRoot: string, height: number) {
  const header = Buffer.alloc(80);
  header.writeInt32LE(1, 0);
  Buffer.from(merkleRoot, "hex").copy(header, 36);
  header.writeUInt32LE(1770000000, 68);
  return {
    block_hash: sha256Bytes(sha256Bytes(header)).reverse().toString("hex"),
    header_hex: header.toString("hex"), height
  };
}

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

  if (request.method === "GET" && url.pathname === `/api/block-height/${state.blockHeight}`) {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ab".repeat(32));
    return;
  }

  if (request.method === "GET" && url.pathname === `/api/block/${"ab".repeat(32)}`) {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ merkle_root: Buffer.from(state.getMerkleRoot(), "hex").reverse().toString("hex"), timestamp: 1770000000 }));
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
