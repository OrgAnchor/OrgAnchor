import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { hashDirectory } from "../core/artifacts.ts";
import { appendLockReceipt } from "../core/lockfile.ts";

const DEFAULT_VERIFY_MIRROR_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_PINATA_API = "https://api.pinata.cloud";

interface PinataUploadResponse {
  IpfsHash?: string;
  PinSize?: number;
  Timestamp?: string;
  isDuplicate?: boolean;
}

interface PinataUploadResult extends PinataUploadResponse {
  IpfsHash: string;
}

export async function ipfsUploadCommand(options: Record<string, string | boolean>): Promise<void> {
  const provider = requireOption(options.provider, "--provider is required");
  if (provider !== "pinata") {
    throw new Error(`Unsupported IPFS upload provider: ${provider}`);
  }

  const dir = typeof options.dir === "string" ? options.dir : "public/verify";
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const name = typeof options.name === "string" ? options.name : "organchor-verify";
  const pinataApi = typeof options["pinata-api"] === "string" ? options["pinata-api"] :
    typeof options.api === "string" ? options.api :
      DEFAULT_PINATA_API;
  const dryRun = options["dry-run"] === true || options.dryRun === true || options.dryrun === true;
  const artifact = await hashDirectory(dir);
  const totalSize = artifact.files.reduce((sum, file) => sum + file.size, 0);
  const maxBytes = parsePositiveInteger(options["max-bytes"], DEFAULT_VERIFY_MIRROR_MAX_BYTES);
  const allowLarge = options["allow-large"] === true;
  if (!dryRun && !allowLarge && totalSize > maxBytes) {
    throw new Error(
      `IPFS verify mirror is ${totalSize} bytes, above the ${maxBytes} byte default limit. ` +
        "Keep public/verify small and put large evidence files in evidence-manifest.json as independent artifacts. " +
        "Use --allow-large only when you intentionally want to publish a large mirror directory."
    );
  }

  if (dryRun) {
    await appendLockReceipt({
      artifactHash: artifact.hash,
      artifactKind: "verify-directory",
      artifactPath: dir,
      provider: "ipfs-pinata",
      action: "mirror.ipfs.upload",
      status: "DRY_RUN",
      lockfilePath,
      receipt: {
        mode: "pinata-upload",
        api: redactUrl(pinataApi),
        directory: dir,
        directory_hash: artifact.hash,
        total_size: totalSize,
        max_bytes: maxBytes,
        file_count: artifact.files.length,
        token_source: "not-required-for-dry-run",
        note: "Dry-run only. No Pinata upload request was sent."
      }
    });
    console.log("IPFS Pinata upload dry-run complete.");
    console.log(`Directory: ${dir}`);
    console.log(`Directory hash: ${artifact.hash}`);
    console.log(`Total size: ${totalSize} bytes`);
    console.log(`Files: ${artifact.files.length}`);
    console.log(`Updated lockfile: ${lockfilePath}`);
    return;
  }

  const token = await resolveToken(options);
  const upload = await uploadDirectoryToPinata(pinataApi, token.value, dir, artifact.files.map((file) => file.path), name);
  await appendLockReceipt({
    artifactHash: artifact.hash,
    artifactKind: "verify-directory",
    artifactPath: dir,
    provider: "ipfs-pinata",
    action: "mirror.ipfs.upload",
    status: "PUBLISHED",
    lockfilePath,
    receipt: {
      mode: "pinata-upload",
      api: redactUrl(pinataApi),
      directory: dir,
      directory_hash: artifact.hash,
      total_size: totalSize,
      max_bytes: maxBytes,
      cid: upload.IpfsHash,
      pin_size: upload.PinSize ?? null,
      timestamp: upload.Timestamp ?? null,
      is_duplicate: upload.isDuplicate ?? null,
      file_count: artifact.files.length,
      files: artifact.files.map((file) => ({
        path: file.path,
        hash: file.hash,
        size: file.size
      })),
      token_source: token.source,
      note: "Directory uploaded to Pinata and pinned by the provider. This improves availability but is not a trust root."
    }
  });

  console.log("IPFS Pinata upload complete.");
  console.log(`Directory: ${dir}`);
  console.log(`Directory hash: ${artifact.hash}`);
  console.log(`Total size: ${totalSize} bytes`);
  console.log(`CID: ${upload.IpfsHash}`);
  if (upload.PinSize !== undefined) console.log(`Pin size: ${upload.PinSize}`);
  console.log(`Updated lockfile: ${lockfilePath}`);
}

async function uploadDirectoryToPinata(
  api: string,
  token: string,
  dir: string,
  relativeFiles: string[],
  name: string
): Promise<PinataUploadResult> {
  const form = new FormData();
  for (const relativePath of relativeFiles) {
    const data = await readFile(join(dir, relativePath));
    form.append("file", new Blob([data]), `${name}/${relativePath}`);
  }
  form.append("pinataMetadata", JSON.stringify({ name }));
  form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const response = await fetch(joinUrlPath(api, "pinning/pinFileToIPFS"), {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`
    },
    body: form
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Pinata upload failed (${response.status}): ${body}`);
  }
  const result = JSON.parse(body) as PinataUploadResponse;
  if (!result.IpfsHash) {
    throw new Error(`Pinata upload response did not include IpfsHash: ${body}`);
  }
  return {
    ...result,
    IpfsHash: result.IpfsHash
  };
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
    throw new Error(`Missing Pinata token. Set ${envName} or pass --token-file <PATH>.`);
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
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`Invalid --max-bytes: ${value}`);
  return parsed;
}

function redactUrl(input: string): string {
  const url = new URL(input);
  url.username = "";
  url.password = "";
  return url.toString().replace(/\/$/, "");
}

function joinUrlPath(base: string, path: string): URL {
  const url = new URL(base.endsWith("/") ? base : `${base}/`);
  const basePath = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  url.pathname = `${basePath}${path}`.replace(/\/{2,}/g, "/");
  return url;
}
