import { hashDirectory } from "../core/artifacts.ts";
import { appendLockReceipt } from "../core/lockfile.ts";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_VERIFY_MIRROR_MAX_BYTES = 10 * 1024 * 1024;

export async function ipfsPublishCommand(options: Record<string, string | boolean>): Promise<void> {
  const dir = typeof options.dir === "string" ? options.dir : "public/verify";
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const api = typeof options.api === "string" ? options.api : "http://127.0.0.1:5001";
  const artifact = await hashDirectory(dir);
  const dryRun = options["dry-run"] === true || options.dryRun === true || options.dryrun === true;
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
      provider: "ipfs",
      action: "mirror.ipfs.publish",
      status: "DRY_RUN",
      lockfilePath,
      receipt: {
        mode: "dry-run",
        directory: dir,
        directory_hash: artifact.hash,
        total_size: totalSize,
        max_bytes: maxBytes,
        file_count: artifact.files.length,
        files: artifact.files.map((file) => ({
          path: file.path,
          hash: file.hash,
          size: file.size
        })),
        note: "No IPFS CID was produced. This dry-run records what would be published and the hashes to verify."
      }
    });

    console.log("IPFS publish dry-run complete.");
    console.log(`Directory: ${dir}`);
    console.log(`Directory hash: ${artifact.hash}`);
    console.log(`Total size: ${totalSize} bytes`);
    console.log(`Files: ${artifact.files.length}`);
    if (totalSize > maxBytes) {
      console.log(`WARN: Directory exceeds default verify mirror limit (${maxBytes} bytes).`);
    }
    console.log(`Updated lockfile: ${lockfilePath}`);
    return;
  }

  const publishResult = await publishDirectoryToKubo(api, dir, artifact.files.map((file) => file.path));
  await appendLockReceipt({
    artifactHash: artifact.hash,
    artifactKind: "verify-directory",
    artifactPath: dir,
    provider: "ipfs",
    action: "mirror.ipfs.publish",
    status: "PUBLISHED",
    lockfilePath,
    receipt: {
      mode: "kubo",
      api,
      directory: dir,
      directory_hash: artifact.hash,
      total_size: totalSize,
      max_bytes: maxBytes,
      cid: publishResult.cid,
      file_count: artifact.files.length,
      files: artifact.files.map((file) => ({
        path: file.path,
        hash: file.hash,
        size: file.size
      })),
      kubo_results: publishResult.results
    }
  });

  console.log("IPFS publish complete.");
  console.log(`Directory: ${dir}`);
  console.log(`Directory hash: ${artifact.hash}`);
  console.log(`Total size: ${totalSize} bytes`);
  console.log(`CID: ${publishResult.cid}`);
  console.log(`Files: ${artifact.files.length}`);
  console.log(`Updated lockfile: ${lockfilePath}`);
}

async function publishDirectoryToKubo(
  api: string,
  dir: string,
  relativeFiles: string[]
): Promise<{ cid: string; results: Array<Record<string, string>> }> {
  const form = new FormData();
  for (const relativePath of relativeFiles) {
    const data = await readFile(join(dir, relativePath));
    form.append("file", new Blob([data]), relativePath);
  }

  const url = new URL("/api/v0/add", api);
  url.searchParams.set("recursive", "true");
  url.searchParams.set("wrap-with-directory", "true");
  url.searchParams.set("pin", "true");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      body: form
    });
  } catch (error) {
    throw new Error(`Unable to reach Kubo API at ${api}. Start Kubo or use --dry-run.`);
  }

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Kubo add failed (${response.status}): ${body}`);
  }

  const results = parseKuboNdjson(body);
  const root = [...results].reverse().find((item) => typeof item.Hash === "string");
  if (!root?.Hash) {
    throw new Error("Kubo add response did not include a CID");
  }
  return {
    cid: root.Hash,
    results
  };
}

function parseKuboNdjson(body: string): Array<Record<string, string>> {
  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, string>);
}

function parsePositiveInteger(value: string | boolean | undefined, fallback: number): number {
  if (value === undefined || typeof value === "boolean") return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`Invalid --max-bytes: ${value}`);
  return parsed;
}
