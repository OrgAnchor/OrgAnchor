import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { hashFile } from "../core/artifacts.ts";
import { appendLockReceipt } from "../core/lockfile.ts";
import {
  DEFAULT_OPENTIMESTAMPS_CALENDARS,
  detachedProofFromTimestampBytes,
  mergeTimestamp,
  serializeDetachedOpenTimestamp
} from "../anchors/opentimestamps.ts";
import type { DetachedOpenTimestamp } from "../anchors/opentimestamps.ts";

export async function opentimestampsStampCommand(options: Record<string, string | boolean>): Promise<void> {
  const filePath = requireOption(options.file, "--file is required");
  const artifact = await hashFile(filePath);
  const digest = Buffer.from(artifact.hash.slice("sha256:".length), "hex");
  const calendars = parseCalendars(options);
  const outPath =
    typeof options.out === "string" ? options.out : join("anchors", "opentimestamps", `${basename(filePath)}.ots`);
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const timeoutMs = parsePositiveInteger(options["timeout-ms"], 15000);
  const now = new Date();

  let proof: DetachedOpenTimestamp | null = null;
  const results = [];
  for (const calendar of calendars) {
    try {
      const timestampBytes = await submitDigest(calendar, digest, timeoutMs);
      const incoming = detachedProofFromTimestampBytes(digest, timestampBytes);
      if (!proof) proof = incoming;
      else mergeTimestamp(proof.timestamp, incoming.timestamp);
      results.push({ calendar, status: "OK" });
    } catch (error) {
      results.push({ calendar, status: "FAIL", error: error instanceof Error ? error.message : String(error) });
    }
  }
  if (!proof) throw new Error("OpenTimestamps stamp failed: no calendar returned a proof");

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, serializeDetachedOpenTimestamp(proof));
  await appendLockReceipt({
    artifactHash: artifact.hash,
    artifactKind: "opentimestamps-stamped-file",
    artifactPath: filePath,
    provider: "opentimestamps",
    action: "anchor.opentimestamps.stamp",
    status: "PUBLISHED",
    lockfilePath,
    now,
    receipt: {
      proof_path: outPath,
      file_hash: artifact.hash,
      file_size: artifact.size,
      calendars: results,
      bitcoin_anchor_status: "PENDING",
      note: "OpenTimestamps calendar receipt created. Run upgrade after Bitcoin confirmation, then verify."
    }
  });

  console.log("OpenTimestamps proof created.");
  console.log(`File: ${filePath}`);
  console.log(`File hash: ${artifact.hash}`);
  console.log(`Proof: ${outPath}`);
  console.log(`Calendars attempted: ${calendars.length}`);
  console.log(`Calendars accepted: ${results.filter((result) => result.status === "OK").length}`);
  console.log("Bitcoin anchor status: PENDING");
  console.log(`Updated lockfile: ${lockfilePath}`);
}

function parseCalendars(options: Record<string, string | boolean>): string[] {
  if (typeof options.calendar === "string") return [options.calendar];
  if (typeof options.calendars === "string") {
    return options.calendars.split(",").map((value) => value.trim()).filter(Boolean);
  }
  return DEFAULT_OPENTIMESTAMPS_CALENDARS;
}

async function submitDigest(calendar: string, digest: Buffer, timeoutMs: number): Promise<Buffer> {
  const url = new URL("/digest", calendar);
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/vnd.opentimestamps.v1",
      "content-type": "application/octet-stream"
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: new Uint8Array(digest)
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
