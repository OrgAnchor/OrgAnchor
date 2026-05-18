import { readFile, writeFile } from "node:fs/promises";
import { appendLockReceipt } from "../core/lockfile.ts";
import {
  detachedProofFromTimestampBytes,
  findPendingAttestations,
  findTimestampNode,
  mergeTimestamp,
  parseDetachedOpenTimestamp,
  serializeDetachedOpenTimestamp
} from "../anchors/opentimestamps.ts";

export async function opentimestampsUpgradeCommand(options: Record<string, string | boolean>): Promise<void> {
  const proofPath = requireOption(options.proof, "--proof is required");
  const outPath = typeof options.out === "string" ? options.out : proofPath;
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const timeoutMs = parsePositiveInteger(options["timeout-ms"], 15000);
  const proof = parseDetachedOpenTimestamp(await readFile(proofPath));
  const pending = findPendingAttestations(proof.timestamp);
  const results = [];
  let merged = 0;

  for (const attestation of pending) {
    const node = findTimestampNode(proof.timestamp, attestation.commitment);
    if (!node) continue;
    try {
      const timestampBytes = await fetchTimestamp(attestation.uri, attestation.commitment, timeoutMs);
      const incoming = detachedProofFromTimestampBytes(Buffer.from(attestation.commitment, "hex"), timestampBytes);
      merged += mergeTimestamp(node, incoming.timestamp);
      results.push({ calendar: attestation.uri, commitment: attestation.commitment, status: "OK" });
    } catch (error) {
      results.push({
        calendar: attestation.uri,
        commitment: attestation.commitment,
        status: "FAIL",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  await writeFile(outPath, serializeDetachedOpenTimestamp(proof));
  const artifactHash = `sha256:${proof.digest.toString("hex")}`;
  await appendLockReceipt({
    artifactHash,
    artifactKind: "opentimestamps-proof",
    artifactPath: proofPath,
    provider: "opentimestamps",
    action: "anchor.opentimestamps.upgrade",
    status: "PUBLISHED",
    lockfilePath,
    receipt: {
      proof_path: outPath,
      pending_count_before: pending.length,
      merged_entries: merged,
      calendars: results,
      note: "OpenTimestamps proof upgraded where calendars had Bitcoin attestations available."
    }
  });

  console.log("OpenTimestamps proof upgrade complete.");
  console.log(`Proof: ${proofPath}`);
  console.log(`Output: ${outPath}`);
  console.log(`Pending attestations checked: ${pending.length}`);
  console.log(`Merged entries: ${merged}`);
  console.log(`Updated lockfile: ${lockfilePath}`);
}

async function fetchTimestamp(calendar: string, commitment: string, timeoutMs: number): Promise<Buffer> {
  const url = new URL(`/timestamp/${commitment}`, calendar);
  const response = await fetch(url, {
    headers: {
      accept: "application/vnd.opentimestamps.v1"
    },
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`calendar ${calendar} returned ${response.status}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > 10000) throw new Error(`calendar ${calendar} returned an invalid proof size`);
  return bytes;
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
