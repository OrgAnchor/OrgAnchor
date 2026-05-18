import { readFile } from "node:fs/promises";
import { hashFile } from "../core/artifacts.ts";
import { findBitcoinAttestations, findPendingAttestations, parseDetachedOpenTimestamp } from "../anchors/opentimestamps.ts";

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
  const offline = options.offline === true;
  const bitcoinApi = typeof options["bitcoin-api"] === "string" ? options["bitcoin-api"] : "https://blockstream.info/api";
  const timeoutMs = parsePositiveInteger(options["timeout-ms"], 15000);

  const artifact = await hashFile(filePath);
  const proof = parseDetachedOpenTimestamp(await readFile(proofPath));
  const proofHash = `sha256:${proof.digest.toString("hex")}`;
  if (artifact.hash !== proofHash) {
    console.log("FAIL");
    console.log(`File hash: ${artifact.hash}`);
    console.log(`Proof hash: ${proofHash}`);
    process.exitCode = 1;
    return;
  }

  const pending = findPendingAttestations(proof.timestamp);
  const bitcoin = findBitcoinAttestations(proof.timestamp);
  if (bitcoin.length === 0) {
    console.log(requireBitcoin ? "FAIL" : "PASS");
    console.log(`File: ${filePath}`);
    console.log(`Proof: ${proofPath}`);
    console.log(`File hash: ${artifact.hash}`);
    console.log("Bitcoin anchor status: PENDING");
    console.log(`Pending calendars: ${pending.length}`);
    if (requireBitcoin) process.exitCode = 1;
    return;
  }

  if (offline) {
    console.log("PASS");
    console.log(`File: ${filePath}`);
    console.log(`Proof: ${proofPath}`);
    console.log(`File hash: ${artifact.hash}`);
    console.log("Bitcoin anchor status: PRESENT_NOT_EXTERNALLY_CHECKED");
    console.log(`Bitcoin attestations: ${bitcoin.length}`);
    return;
  }

  const results: BitcoinVerification[] = [];
  for (const attestation of bitcoin) {
    results.push(await verifyBitcoinAttestation(bitcoinApi, attestation.height, attestation.commitment, timeoutMs));
  }
  const ok = results.some((result) => result.ok);
  console.log(ok ? "PASS" : "FAIL");
  console.log(`File: ${filePath}`);
  console.log(`Proof: ${proofPath}`);
  console.log(`File hash: ${artifact.hash}`);
  console.log(`Bitcoin anchor status: ${ok ? "ANCHORED" : "FAILED"}`);
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
    const blockHashResponse = await fetch(new URL(`/block-height/${height}`, api), {
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!blockHashResponse.ok) throw new Error(`block-height returned ${blockHashResponse.status}`);
    const blockHash = (await blockHashResponse.text()).trim();
    const blockResponse = await fetch(new URL(`/block/${blockHash}`, api), {
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!blockResponse.ok) throw new Error(`block returned ${blockResponse.status}`);
    const block = await blockResponse.json() as { merkle_root?: string; timestamp?: number };
    if (typeof block.merkle_root !== "string") throw new Error("block response missing merkle_root");
    if (block.merkle_root.toLowerCase() !== commitment.toLowerCase()) {
      throw new Error(`commitment does not match block merkle_root ${block.merkle_root}`);
    }
    const result: BitcoinVerification = {
      height,
      commitment,
      ok: true,
      blockHash
    };
    if (typeof block.timestamp === "number") result.blockTime = block.timestamp;
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
