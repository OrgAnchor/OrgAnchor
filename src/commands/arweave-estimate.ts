import { stat, readdir } from "node:fs/promises";
import { join, relative } from "node:path";

interface EstimateFile {
  path: string;
  size: number;
}

interface TurboQuote {
  winc: string;
  estimatedUsd?: string;
}

export async function arweaveEstimateCommand(options: Record<string, string | boolean>): Promise<void> {
  const input = resolveInput(options);
  const files = await collectFiles(input.path, input.kind);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const offline = options.offline === true;
  const turboApi = typeof options["turbo-api"] === "string" ? options["turbo-api"] : "https://payment.ardrive.io/v1";

  console.log("Arweave upload estimate.");
  console.log(`Input: ${input.path}`);
  console.log(`Input type: ${input.kind}`);
  console.log(`Files: ${files.length}`);
  console.log(`Total bytes: ${totalBytes}`);
  console.log(`Total size: ${formatBytes(totalBytes)}`);
  console.log("Upload performed: no");

  if (files.length > 0) {
    console.log("Largest files:");
    for (const file of [...files].sort((a, b) => b.size - a.size).slice(0, 5)) {
      console.log(`  ${file.path} (${formatBytes(file.size)})`);
    }
  }

  if (!offline) {
    const quote = await fetchTurboQuote(turboApi, totalBytes);
    if (quote) {
      console.log(`Turbo quoted cost: ${quote.winc} winc`);
      if (quote.estimatedUsd) {
        console.log(`Estimated USD: ${quote.estimatedUsd}`);
      }
    } else {
      console.log("WARN: Turbo price API was unavailable; size-only estimate shown.");
    }
  }

  console.log(
    "Policy: Arweave is append-only archival storage for small public final artifacts; it is not the current authority layer or a general evidence file store."
  );
  console.log("Policy: Correct mistakes by publishing a new signed statement that supersedes the old one; do not expect uploaded content to be modified.");
}

function resolveInput(options: Record<string, string | boolean>): { kind: "directory" | "file"; path: string } {
  if (typeof options.dir === "string" && typeof options.file === "string") {
    throw new Error("Use either --dir or --file, not both.");
  }
  if (typeof options.file === "string") {
    return { kind: "file", path: options.file };
  }
  return { kind: "directory", path: typeof options.dir === "string" ? options.dir : "arweave-package" };
}

async function collectFiles(path: string, kind: "directory" | "file"): Promise<EstimateFile[]> {
  const pathStat = await stat(path);
  if (kind === "file") {
    if (!pathStat.isFile()) throw new Error(`${path} is not a file`);
    return [{ path, size: pathStat.size }];
  }
  if (!pathStat.isDirectory()) throw new Error(`${path} is not a directory`);
  const result: EstimateFile[] = [];
  await walk(path, path, result);
  return result.sort((a, b) => a.path.localeCompare(b.path));
}

async function walk(root: string, dir: string, result: EstimateFile[]): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(root, path, result);
      continue;
    }
    if (!entry.isFile()) continue;
    const fileStat = await stat(path);
    result.push({
      path: normalizePath(relative(root, path)),
      size: fileStat.size
    });
  }
}

async function fetchTurboQuote(api: string, bytes: number): Promise<TurboQuote | null> {
  try {
    const byteQuote = await fetchJson(joinUrl(api, `/price/bytes/${bytes}`));
    const winc = readStringField(byteQuote, "winc");
    const usdQuote = await fetchJson(joinUrl(api, "/price/usd/1000"));
    const wincForTenUsd = readStringField(usdQuote, "winc");
    return {
      winc,
      estimatedUsd: estimateUsd(winc, wincForTenUsd)
    };
  } catch {
    return null;
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Price API failed: ${response.status}`);
  return response.json();
}

function readStringField(value: unknown, field: string): string {
  if (typeof value !== "object" || value === null || !(field in value)) throw new Error(`Missing ${field}`);
  const fieldValue = (value as Record<string, unknown>)[field];
  if (typeof fieldValue !== "string" || fieldValue.length === 0) throw new Error(`Invalid ${field}`);
  return fieldValue;
}

function joinUrl(api: string, path: string): string {
  const url = new URL(api.endsWith("/") ? api : `${api}/`);
  url.pathname = `${url.pathname.replace(/\/$/, "")}${path}`;
  return url.toString();
}

function estimateUsd(costWinc: string, wincForTenUsd: string): string {
  const cost = Number(costWinc);
  const base = Number(wincForTenUsd);
  if (!Number.isFinite(cost) || !Number.isFinite(base) || base <= 0) return "unknown";
  const dollars = (cost / base) * 10;
  if (dollars > 0 && dollars < 0.01) return "<$0.01";
  return `$${dollars.toFixed(4)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kib = bytes / 1024;
  if (kib < 1024) return `${kib.toFixed(2)} KiB`;
  const mib = kib / 1024;
  if (mib < 1024) return `${mib.toFixed(2)} MiB`;
  return `${(mib / 1024).toFixed(2)} GiB`;
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/");
}
