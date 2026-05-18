import { appendLockReceipt } from "../core/lockfile.ts";
import { readFile } from "node:fs/promises";

interface PinningResponse {
  requestid?: string;
  status?: string;
  created?: string;
  pin?: {
    cid?: string;
    name?: string;
    origins?: string[];
    meta?: Record<string, unknown>;
  };
  delegates?: string[];
  info?: Record<string, unknown>;
}

export async function ipfsPinCommand(options: Record<string, string | boolean>): Promise<void> {
  const cid = requireOption(options.cid, "--cid is required");
  const serviceUrl = requireOption(options["service-url"] ?? options.service, "--service-url is required");
  const name = typeof options.name === "string" ? options.name : `organchor-${cid}`;
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const artifactHash =
    typeof options["artifact-hash"] === "string" ? options["artifact-hash"] :
      typeof options["expected-hash"] === "string" ? options["expected-hash"] :
        `ipfs:${cid}`;
  const timeoutMs = parsePositiveInteger(options["timeout-ms"], 15000);
  const dryRun = options["dry-run"] === true || options.dryRun === true || options.dryrun === true;

  if (dryRun) {
    await appendLockReceipt({
      artifactHash,
      artifactKind: "ipfs-remote-pin",
      artifactPath: `ipfs://${cid}`,
      provider: "ipfs-pinning-service",
      action: "mirror.ipfs.pin",
      status: "DRY_RUN",
      lockfilePath,
      receipt: {
        mode: "remote-pinning-service",
        service_url: redactServiceUrl(serviceUrl),
        cid,
        name,
        token_source: "not-required-for-dry-run",
        note: "Dry-run only. No remote pin request was sent."
      }
    });
    console.log("IPFS remote pin dry-run complete.");
    console.log(`CID: ${cid}`);
    console.log(`Service: ${redactServiceUrl(serviceUrl)}`);
    console.log(`Updated lockfile: ${lockfilePath}`);
    return;
  }

  const token = await resolveToken(options);
  const response = await requestRemotePin(serviceUrl, token.value, { cid, name }, timeoutMs);
  await appendLockReceipt({
    artifactHash,
    artifactKind: "ipfs-remote-pin",
    artifactPath: `ipfs://${cid}`,
    provider: "ipfs-pinning-service",
    action: "mirror.ipfs.pin",
    status: "PUBLISHED",
    lockfilePath,
    receipt: {
      mode: "remote-pinning-service",
      service_url: redactServiceUrl(serviceUrl),
      cid,
      name,
      token_source: token.source,
      pin_status: response.status ?? "unknown",
      requestid: response.requestid ?? null,
      created: response.created ?? null,
      delegates: response.delegates ?? [],
      note: "Remote pin request accepted by an IPFS Pinning Service compatible API. This improves availability but is not a trust root."
    }
  });

  console.log("IPFS remote pin requested.");
  console.log(`CID: ${cid}`);
  console.log(`Service: ${redactServiceUrl(serviceUrl)}`);
  console.log(`Pin status: ${response.status ?? "unknown"}`);
  if (response.requestid) console.log(`Request ID: ${response.requestid}`);
  console.log(`Updated lockfile: ${lockfilePath}`);
}

async function requestRemotePin(
  serviceUrl: string,
  token: string,
  pin: { cid: string; name: string },
  timeoutMs: number
): Promise<PinningResponse> {
  const url = joinServicePath(serviceUrl, "pins");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      cid: pin.cid,
      name: pin.name,
      meta: {
        app: "organchor"
      }
    })
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`IPFS pinning service request failed (${response.status}): ${body}`);
  }
  if (body.trim().length === 0) {
    return {};
  }
  return JSON.parse(body) as PinningResponse;
}

async function resolveToken(options: Record<string, string | boolean>): Promise<{ value: string; source: string }> {
  if (typeof options["token-file"] === "string") {
    const value = (await readFile(options["token-file"], "utf8")).trim();
    if (!value) throw new Error(`Token file is empty: ${options["token-file"]}`);
    return {
      value,
      source: `file:${options["token-file"]}`
    };
  }

  const envName = typeof options["token-env"] === "string" ? options["token-env"] : "ORGANCHOR_IPFS_PINNING_JWT";
  const value = process.env[envName];
  if (!value) {
    throw new Error(`Missing pinning service token. Set ${envName} or pass --token-file <PATH>.`);
  }
  return {
    value,
    source: `env:${envName}`
  };
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

function redactServiceUrl(serviceUrl: string): string {
  const url = new URL(serviceUrl);
  url.username = "";
  url.password = "";
  return url.toString().replace(/\/$/, "");
}

function joinServicePath(serviceUrl: string, path: string): URL {
  const url = new URL(serviceUrl.endsWith("/") ? serviceUrl : `${serviceUrl}/`);
  const basePath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  url.pathname = `${basePath}${path}`.replace(/\/{2,}/g, "/");
  return url;
}
