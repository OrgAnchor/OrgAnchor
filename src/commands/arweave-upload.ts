import { createReadStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { basename, extname, isAbsolute, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { hashDirectory, hashFile } from "../core/artifacts.ts";
import { pathExists } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { appendLockReceipt } from "../core/lockfile.ts";
import type { JsonValue } from "../core/json.ts";

interface TurboTag {
  name: string;
  value: string;
}

interface TurboUploadResult {
  id?: string;
  owner?: string;
  dataCaches?: string[];
  fastFinalityIndexes?: string[];
  deadlineHeight?: number;
  timestamp?: number;
  version?: string;
}

interface TurboClient {
  uploadFile(input: {
    fileStreamFactory: () => ReturnType<typeof createReadStream>;
    fileSizeFactory: () => number;
    dataItemOpts: {
      tags: TurboTag[];
    };
    signal?: AbortSignal;
  }): Promise<TurboUploadResult>;
}

interface TurboSdkModule {
  TurboFactory?: {
    authenticated(input: Record<string, unknown>): TurboClient;
  };
  ArweaveSigner?: new (wallet: unknown) => unknown;
}

interface PackageManifestEntry {
  role: string;
  package_path: string;
  hash: string;
  size: number;
}

interface PackageManifestInfo {
  path: string | null;
  canonicalHash: string | null;
  fileHash: string | null;
  entriesByRelativePath: Map<string, PackageManifestEntry>;
}

interface UploadFileRecord {
  path: string;
  hash: string;
  size: number;
  role: string | null;
  tx_id: string;
  gateway_url: string;
  owner: string | null;
  data_caches: string[];
  fast_finality_indexes: string[];
  deadline_height: number | null;
  timestamp: number | null;
  version: string | null;
}

const DEFAULT_TURBO_SDK_MODULE = "@ardrive/turbo-sdk";
const DEFAULT_GATEWAY = "https://arweave.net";

export async function arweaveUploadCommand(options: Record<string, string | boolean>): Promise<void> {
  const provider = requireOption(options.provider, "--provider is required");
  if (provider !== "turbo") {
    throw new Error(`Unsupported Arweave upload provider: ${provider}`);
  }

  const dir = typeof options.dir === "string" ? options.dir : "arweave-package";
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const gateway = typeof options.gateway === "string" ? options.gateway : DEFAULT_GATEWAY;
  const timeoutMs = parsePositiveInteger(options["timeout-ms"], 120000);
  const dryRun = options["dry-run"] === true || options.dryRun === true || options.dryrun === true;
  const directory = await hashDirectory(dir);
  assertNoSensitivePaths(directory.files.map((file) => file.path));
  const manifest = await loadPackageManifest(dir);
  const totalSize = directory.files.reduce((sum, file) => sum + file.size, 0);
  const artifactHash = manifest.canonicalHash ?? directory.hash;

  if (dryRun) {
    await appendLockReceipt({
      artifactHash,
      artifactKind: "arweave-turbo-upload",
      artifactPath: dir,
      provider: "arweave-turbo",
      action: "archive.arweave.upload",
      status: "DRY_RUN",
      lockfilePath,
      receipt: {
        mode: "turbo-sdk",
        directory: dir,
        directory_hash: directory.hash,
        manifest_path: manifest.path,
        manifest_canonical_hash: manifest.canonicalHash,
        manifest_file_hash: manifest.fileHash,
        total_size: totalSize,
        file_count: directory.files.length,
        wallet_source: "not-required-for-dry-run",
        note: "Dry-run only. No Arweave upload request was sent."
      }
    });
    console.log("Arweave Turbo upload dry-run complete.");
    console.log(`Directory: ${dir}`);
    console.log(`Directory hash: ${directory.hash}`);
    if (manifest.canonicalHash) console.log(`Manifest canonical hash: ${manifest.canonicalHash}`);
    console.log(`Total size: ${totalSize} bytes`);
    console.log(`Files: ${directory.files.length}`);
    console.log(`Updated lockfile: ${lockfilePath}`);
    return;
  }

  const walletPath = requireOption(options["wallet-file"] ?? options.wallet, "--wallet-file is required");
  const wallet = await readJsonFile(walletPath);
  const sdk = await loadTurboSdk(typeof options["sdk-module"] === "string" ? options["sdk-module"] : DEFAULT_TURBO_SDK_MODULE);
  const turbo = createTurboClient(sdk, wallet);
  const uploaded: UploadFileRecord[] = [];

  for (const file of directory.files) {
    const path = join(dir, file.path);
    const entry = manifest.entriesByRelativePath.get(file.path) ?? null;
    const result = await turbo.uploadFile({
      fileStreamFactory: () => createReadStream(path),
      fileSizeFactory: () => file.size,
      dataItemOpts: {
        tags: buildTags({
          path: file.path,
          hash: file.hash,
          role: entry?.role ?? null,
          manifestHash: manifest.canonicalHash,
          contentType: contentTypeForPath(file.path)
        })
      },
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (typeof result.id !== "string" || result.id.length === 0) {
      throw new Error(`Turbo upload response did not include an Arweave transaction id for ${file.path}`);
    }
    uploaded.push({
      path: file.path,
      hash: file.hash,
      size: file.size,
      role: entry?.role ?? null,
      tx_id: result.id,
      gateway_url: joinGatewayUrl(gateway, result.id),
      owner: result.owner ?? null,
      data_caches: Array.isArray(result.dataCaches) ? result.dataCaches : [],
      fast_finality_indexes: Array.isArray(result.fastFinalityIndexes) ? result.fastFinalityIndexes : [],
      deadline_height: result.deadlineHeight ?? null,
      timestamp: result.timestamp ?? null,
      version: result.version ?? null
    });
  }

  await appendLockReceipt({
    artifactHash,
    artifactKind: "arweave-turbo-upload",
    artifactPath: dir,
    provider: "arweave-turbo",
    action: "archive.arweave.upload",
    status: "PUBLISHED",
    lockfilePath,
    receipt: {
      mode: "turbo-sdk",
      directory: dir,
      directory_hash: directory.hash,
      manifest_path: manifest.path,
      manifest_canonical_hash: manifest.canonicalHash,
      manifest_file_hash: manifest.fileHash,
      total_size: totalSize,
      file_count: uploaded.length,
      wallet_source: `file:${walletPath}`,
      gateway,
      files: uploaded.map((file) => ({
        path: file.path,
        hash: file.hash,
        size: file.size,
        role: file.role,
        tx_id: file.tx_id,
        gateway_url: file.gateway_url,
        owner: file.owner,
        data_caches: file.data_caches,
        fast_finality_indexes: file.fast_finality_indexes,
        deadline_height: file.deadline_height,
        timestamp: file.timestamp,
        version: file.version
      })),
      note: "Files uploaded to Arweave through Turbo. Turbo is a publication carrier, not the OrgAnchor identity root."
    }
  });

  console.log("Arweave Turbo upload complete.");
  console.log(`Directory: ${dir}`);
  console.log(`Directory hash: ${directory.hash}`);
  if (manifest.canonicalHash) console.log(`Manifest canonical hash: ${manifest.canonicalHash}`);
  console.log(`Total size: ${totalSize} bytes`);
  console.log(`Files uploaded: ${uploaded.length}`);
  for (const file of uploaded) {
    console.log(`${file.path}: ${file.tx_id}`);
  }
  console.log(`Updated lockfile: ${lockfilePath}`);
}

async function loadPackageManifest(dir: string): Promise<PackageManifestInfo> {
  const manifestPath = join(dir, "arweave-manifest.json");
  if (!(await pathExists(manifestPath))) {
    return {
      path: null,
      canonicalHash: null,
      fileHash: null,
      entriesByRelativePath: new Map()
    };
  }

  const manifest = await readJsonFile(manifestPath);
  const object = asRecord(manifest);
  const artifacts = Array.isArray(object.artifacts) ? object.artifacts : [];
  const entriesByRelativePath = new Map<string, PackageManifestEntry>();
  for (const value of artifacts) {
    const entry = asManifestEntry(value);
    if (!entry) continue;
    entriesByRelativePath.set(normalizeRelativePackagePath(dir, entry.package_path), entry);
  }
  const manifestFile = await hashFile(manifestPath);
  return {
    path: manifestPath,
    canonicalHash: sha256CanonicalJson(manifest),
    fileHash: manifestFile.hash,
    entriesByRelativePath
  };
}

function asManifestEntry(value: unknown): PackageManifestEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const object = value as Record<string, unknown>;
  if (
    typeof object.role !== "string" ||
    typeof object.package_path !== "string" ||
    typeof object.hash !== "string" ||
    typeof object.size !== "number"
  ) {
    return null;
  }
  return {
    role: object.role,
    package_path: object.package_path,
    hash: object.hash,
    size: object.size
  };
}

async function loadTurboSdk(moduleName: string): Promise<TurboSdkModule> {
  const specifier = moduleName.startsWith(".") || moduleName.startsWith("/") || /^[A-Za-z]:[\\/]/.test(moduleName)
    ? pathToFileURL(resolve(moduleName)).href
    : moduleName;
  try {
    return await import(specifier) as TurboSdkModule;
  } catch (error) {
    throw new Error(
      `Unable to load Turbo SDK module "${moduleName}". Install @ardrive/turbo-sdk or pass --sdk-module <PATH>. ` +
        "OrgAnchor intentionally relies on the mature Turbo SDK instead of implementing Arweave data-item signing itself."
    );
  }
}

function createTurboClient(sdk: TurboSdkModule, wallet: JsonValue): TurboClient {
  if (!sdk.TurboFactory || typeof sdk.TurboFactory.authenticated !== "function") {
    throw new Error("Turbo SDK module does not export TurboFactory.authenticated");
  }
  if (typeof sdk.ArweaveSigner === "function") {
    const signer = new sdk.ArweaveSigner(wallet);
    return sdk.TurboFactory.authenticated({ signer });
  }
  return sdk.TurboFactory.authenticated({ privateKey: wallet });
}

function buildTags(input: {
  path: string;
  hash: string;
  role: string | null;
  manifestHash: string | null;
  contentType: string;
}): TurboTag[] {
  const tags: TurboTag[] = [
    { name: "Content-Type", value: input.contentType },
    { name: "App-Name", value: "OrgAnchor" },
    { name: "OrgAnchor-Artifact-Path", value: input.path },
    { name: "OrgAnchor-Artifact-Hash", value: input.hash }
  ];
  if (input.role) tags.push({ name: "OrgAnchor-Artifact-Role", value: input.role });
  if (input.manifestHash) tags.push({ name: "OrgAnchor-Manifest-Hash", value: input.manifestHash });
  return tags;
}

function assertNoSensitivePaths(paths: string[]): void {
  const forbidden = paths.filter((path) => {
    const normalized = path.toLowerCase();
    return (
      normalized.includes(".private.") ||
      normalized.includes("private-key") ||
      normalized.includes("wallet") ||
      normalized.includes("secret") ||
      normalized.includes("token") ||
      normalized.includes("credential") ||
      basename(normalized).startsWith(".env")
    );
  });
  if (forbidden.length > 0) {
    throw new Error(`Refusing to upload sensitive-looking files to Arweave: ${forbidden.join(", ")}`);
  }
}

function contentTypeForPath(path: string): string {
  const ext = extname(path).toLowerCase();
  if (ext === ".json" || ext === ".sig") return "application/json";
  if (ext === ".html" || ext === ".htm") return "text/html; charset=utf-8";
  if (ext === ".txt") return "text/plain; charset=utf-8";
  if (ext === ".md") return "text/markdown; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js" || ext === ".mjs") return "text/javascript; charset=utf-8";
  return "application/octet-stream";
}

function normalizeRelativePackagePath(dir: string, packagePath: string): string {
  const normalized = packagePath.replaceAll("\\", "/");
  const normalizedDir = dir.replaceAll("\\", "/").replace(/\/$/, "");
  if (normalized === basename(normalizedDir)) return "";
  if (normalized.startsWith(`${normalizedDir}/`)) {
    return normalized.slice(normalizedDir.length + 1);
  }
  if (isAbsolute(packagePath)) {
    return relative(dir, packagePath).replaceAll("\\", "/");
  }
  return normalized.replace(/^\.?\//, "");
}

function joinGatewayUrl(gateway: string, txId: string): string {
  const url = new URL(gateway.endsWith("/") ? gateway : `${gateway}/`);
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${encodeURIComponent(txId)}`;
  return url.toString();
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

function asRecord(value: JsonValue): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, JsonValue>;
}
