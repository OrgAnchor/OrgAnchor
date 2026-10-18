import { open, readFile } from "node:fs/promises";
import { sha256Digest } from "../core/hash.ts";
import { verifyCheckpointAnchor } from "../core/history.ts";
import { readJsonFile } from "../core/json.ts";
import { findBitcoinAttestations, findPendingAttestations, MAX_OPENTIMESTAMPS_PROOF_BYTES, parseDetachedOpenTimestamp } from "../anchors/opentimestamps.ts";

interface BitcoinVerification {
  height: number;
  commitment: string;
  ok: boolean;
  blockHash?: string;
  blockTime?: number;
  error?: string;
}

export async function opentimestampsVerifyCommand(options: Record<string, string | boolean>): Promise<void> {
  const filePath = requireOption(options.file, "--file is required");
  const proofPath = requireOption(options.proof, "--proof is required");
  const requireBitcoin = options["require-bitcoin"] === true;
  const requireTrusted = options["require-trusted"] === true;
  const trustedBlockPath = options["trusted-bitcoin-block"] === undefined ? undefined :
    requireOption(options["trusted-bitcoin-block"], "--trusted-bitcoin-block requires a file path");
  const offline = options.offline === true;
  const bitcoinApi = typeof options["bitcoin-api"] === "string" ? options["bitcoin-api"] : "https://blockstream.info/api";
  const timeoutMs = parsePositiveInteger(options["timeout-ms"], 15000);

  const fileBytes = await readFile(filePath);
  const fileHash = sha256Digest(fileBytes);
  const proofBytes = await readProofFile(proofPath);
  const proof = parseDetachedOpenTimestamp(proofBytes);
  const proofHash = `sha256:${proof.digest.toString("hex")}`;
  if (fileHash !== proofHash) {
    console.log("FAIL");
    console.log(`File hash: ${fileHash}`);
    console.log(`Proof hash: ${proofHash}`);
    process.exitCode = 1;
    return;
  }

  const pending = findPendingAttestations(proof.timestamp);
  const bitcoin = findBitcoinAttestations(proof.timestamp);
  const uncheckedStatus = bitcoin.length > 0 ? "PRESENT_NOT_EXTERNALLY_CHECKED" :
    pending.length > 0 ? "PENDING" : "NO_BITCOIN_ATTESTATION";

  if (trustedBlockPath) {
    try {
      const anchor = verifyCheckpointAnchor(fileBytes, proofBytes, await readJsonFile(trustedBlockPath));
      printVerification(true, anchor.status, filePath, proofPath, fileHash);
      console.log(`Bitcoin block: ${anchor.height}`);
      console.log(`Bitcoin block hash: ${anchor.block_hash}`);
      console.log(`Bitcoin block time: ${anchor.block_time}`);
      console.log(anchor.boundary);
    } catch (error) {
      printVerification(false, bitcoin.length > 0 ? "PINNED_BLOCK_VERIFICATION_FAILED" : uncheckedStatus, filePath, proofPath, fileHash);
      console.log(`Trusted Bitcoin block verification failed: ${error instanceof Error ? error.message : String(error)}`);
      process.exitCode = 1;
    }
    return;
  }

  if (requireTrusted) {
    printVerification(false, uncheckedStatus, filePath, proofPath, fileHash);
    console.log("--require-trusted requires --trusted-bitcoin-block with an independently supplied block pin.");
    process.exitCode = 1;
    return;
  }

  if (bitcoin.length === 0) {
    printVerification(!requireBitcoin, uncheckedStatus, filePath, proofPath, fileHash);
    console.log(`Pending calendars: ${pending.length}`);
    if (requireBitcoin) process.exitCode = 1;
    return;
  }

  if (offline) {
    printVerification(true, uncheckedStatus, filePath, proofPath, fileHash);
    console.log(`Bitcoin attestations: ${bitcoin.length}`);
    return;
  }

  const results: BitcoinVerification[] = [];
  for (const attestation of bitcoin) {
    results.push(await verifyBitcoinAttestation(bitcoinApi, attestation.height, attestation.commitment, timeoutMs));
  }
  const ok = results.some((result) => result.ok);
  printVerification(ok, ok ? "API_REPORTED_NOT_INDEPENDENTLY_CHECKED" : "FAILED", filePath, proofPath, fileHash);
  for (const result of results) {
    if (result.ok) {
      console.log(`Bitcoin block: ${result.height}`);
      console.log(`Bitcoin block hash: ${result.blockHash}`);
      if (result.blockTime !== undefined) console.log(`Bitcoin block time: ${new Date(result.blockTime * 1000).toISOString()}`);
    } else {
      console.log(`Bitcoin block ${result.height} verification failed: ${result.error}`);
    }
  }
  if (!ok) process.exitCode = 1;
}

async function verifyBitcoinAttestation(api: string, height: number, commitment: string, timeoutMs: number): Promise<BitcoinVerification> {
  try {
    const base = new URL(api);
    if (!base.pathname.endsWith("/")) base.pathname += "/";
    const blockHashResponse = await fetch(new URL(`block-height/${height}`, base), {
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!blockHashResponse.ok) throw new Error(`block-height returned ${blockHashResponse.status}`);
    const blockHash = (await blockHashResponse.text()).trim();
    if (!/^[a-f0-9]{64}$/i.test(blockHash)) throw new Error("block-height returned an invalid block hash");
    const blockResponse = await fetch(new URL(`block/${blockHash}`, base), {
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!blockResponse.ok) throw new Error(`block returned ${blockResponse.status}`);
    const block = await blockResponse.json() as { merkle_root?: string; timestamp?: number };
    if (typeof block.merkle_root !== "string" || !/^[a-f0-9]{64}$/i.test(block.merkle_root)) throw new Error("block response missing or invalid merkle_root");
    // OTS commits raw header bytes; Bitcoin APIs display the reversed hash.
    const displayedCommitment = Buffer.from(commitment, "hex").reverse().toString("hex");
    if (commitment.length !== 64 || block.merkle_root.toLowerCase() !== displayedCommitment) {
      throw new Error(`commitment does not match block merkle_root ${block.merkle_root}`);
    }
    const result: BitcoinVerification = {
      height,
      commitment,
      ok: true,
      blockHash
    };
    if (typeof block.timestamp === "number") {
      if (!Number.isSafeInteger(block.timestamp) || block.timestamp < 0 || block.timestamp > 0xffffffff) throw new Error("block response has an invalid timestamp");
      result.blockTime = block.timestamp;
    }
    return result;
  } catch (error) {
    return {
      height,
      commitment,
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function printVerification(ok: boolean, status: string, filePath: string, proofPath: string, fileHash: string): void {
  console.log(ok ? "PASS" : "FAIL");
  console.log(`File: ${filePath}`);
  console.log(`Proof: ${proofPath}`);
  console.log(`File hash: ${fileHash}`);
  console.log(`Bitcoin anchor status: ${status}`);
}

async function readProofFile(path: string): Promise<Buffer> {
  const file = await open(path, "r");
  try {
    const bytes = Buffer.alloc(MAX_OPENTIMESTAMPS_PROOF_BYTES + 1);
    let offset = 0;
    while (offset < bytes.length) {
      const { bytesRead } = await file.read(bytes, offset, bytes.length - offset, null);
      if (bytesRead === 0) return bytes.subarray(0, offset);
      offset += bytesRead;
    }
    throw new Error("OpenTimestamps proof exceeds the 1 MiB input size limit");
  } finally {
    await file.close();
  }
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

function parsePositiveInteger(value: string | boolean | undefined, fallback: number): number {
  if (value === undefined || typeof value === "boolean") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`Invalid --timeout-ms: ${value}`);
  return parsed;
}
