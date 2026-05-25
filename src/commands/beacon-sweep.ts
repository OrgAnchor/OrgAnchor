import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { parseStrictJson } from "../core/json.ts";
import { validateDirectorySnapshot } from "../directory/snapshot.ts";
import {
  inspectBeaconTarget,
  type BeaconConformanceStatus,
  type BeaconInspectResult,
  type BeaconInspectStatus
} from "./beacon-inspect.ts";

export interface BeaconSweepRecord {
  type: "OrgAnchorBeaconSweepRecord";
  version: "0.1";
  target: string;
  checked_at: string;
  duration_ms: number;
  status: BeaconInspectStatus;
  conformance_status: BeaconConformanceStatus;
  signal: BeaconInspectResult["signal"];
  hints: BeaconInspectResult["hints"];
  verification: BeaconInspectResult["verification"];
  risk_gaps: BeaconInspectResult["risk_gaps"];
  next_steps: string[];
}

interface BeaconSweepSummary {
  type: "OrgAnchorBeaconSweepSummary";
  version: "0.1";
  sources: {
    seeds: string[];
    directory_snapshots: string[];
    sitemaps: string[];
    crawl: string[];
  };
  out: string;
  started_at: string;
  completed_at: string;
  timeout_ms: number;
  concurrency: number;
  total_targets: number;
  checked_targets: number;
  counts_by_status: Record<BeaconInspectStatus, number>;
  counts_by_conformance: Record<BeaconConformanceStatus, number>;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_CONCURRENCY = 4;

interface RobotsRules {
  allow: string[];
  disallow: string[];
}

export async function beaconSweepCommand(options: Record<string, string | boolean>): Promise<void> {
  const seedSources = parseSources(options.seeds ?? options._);
  const directorySnapshotSources = parseSources(options["directory-snapshot"] ?? options.directory);
  const sitemapSources = parseSources(options.sitemap);
  const crawlSources = parseSources(options.crawl ?? options["crawl-start"]);
  if (
    seedSources.length === 0 &&
    directorySnapshotSources.length === 0 &&
    sitemapSources.length === 0 &&
    crawlSources.length === 0
  ) {
    throw new Error("beacon sweep requires at least one source: --seeds, --directory-snapshot, --sitemap, or --crawl");
  }
  const outPath = typeof options.out === "string" ? options.out : "beacon-sweep.ndjson";
  const timeoutMs = parsePositiveInteger(options["timeout-ms"], "--timeout-ms", DEFAULT_TIMEOUT_MS);
  const concurrency = parsePositiveInteger(options.concurrency, "--concurrency", DEFAULT_CONCURRENCY);
  const crawlMaxPages = parsePositiveInteger(options["crawl-max-pages"], "--crawl-max-pages", 25);
  const crawlMaxDepth = parseNonNegativeInteger(options["crawl-max-depth"], "--crawl-max-depth", 1);
  const startedAt = new Date().toISOString();
  const targets = await collectTargets({
    seedSources,
    directorySnapshotSources,
    sitemapSources,
    crawlSources,
    crawlMaxPages,
    crawlMaxDepth,
    timeoutMs
  });
  const records = await mapConcurrent(targets, concurrency, (target) => inspectTarget(target, timeoutMs));
  const completedAt = new Date().toISOString();

  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, `${records.map((record) => JSON.stringify(record)).join("\n")}${records.length > 0 ? "\n" : ""}`, "utf8");

  const summary = buildSummary({
    sources: {
      seeds: seedSources,
      directory_snapshots: directorySnapshotSources,
      sitemaps: sitemapSources,
      crawl: crawlSources
    },
    outPath,
    startedAt,
    completedAt,
    timeoutMs,
    concurrency,
    targets,
    records
  });
  console.log(JSON.stringify(summary, null, 2));
}

async function collectTargets(options: {
  seedSources: string[];
  directorySnapshotSources: string[];
  sitemapSources: string[];
  crawlSources: string[];
  crawlMaxPages: number;
  crawlMaxDepth: number;
  timeoutMs: number;
}): Promise<string[]> {
  const targets: string[] = [];
  for (const source of options.seedSources) {
    targets.push(...await readSeeds(source));
  }
  for (const source of options.directorySnapshotSources) {
    targets.push(...await readDirectorySnapshotSeeds(source, options.timeoutMs));
  }
  for (const source of options.sitemapSources) {
    targets.push(...await readSitemapSeeds(source, options.timeoutMs));
  }
  for (const source of options.crawlSources) {
    targets.push(...await crawlDiscoverySeeds(source, {
      timeoutMs: options.timeoutMs,
      maxPages: options.crawlMaxPages,
      maxDepth: options.crawlMaxDepth
    }));
  }
  return Array.from(new Set(targets));
}

async function inspectTarget(target: string, timeoutMs: number): Promise<BeaconSweepRecord> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  const result = await inspectBeaconTarget(target, timeoutMs);
  return {
    type: "OrgAnchorBeaconSweepRecord",
    version: "0.1",
    target,
    checked_at: checkedAt,
    duration_ms: Date.now() - started,
    status: result.status,
    conformance_status: result.conformance_status,
    signal: result.signal,
    hints: result.hints,
    verification: result.verification,
    risk_gaps: result.risk_gaps,
    next_steps: result.next_steps
  };
}

async function readSeeds(path: string): Promise<string[]> {
  const text = await readFile(path, "utf8");
  const targets = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
  return Array.from(new Set(targets));
}

async function readDirectorySnapshotSeeds(source: string, timeoutMs: number): Promise<string[]> {
  const value = parseStrictJson(await readTextSource(source, timeoutMs), source);
  const snapshot = validateDirectorySnapshot(value);
  return snapshot.records.map((record) => record.origin);
}

async function readSitemapSeeds(source: string, timeoutMs: number): Promise<string[]> {
  const text = await readTextSource(source, timeoutMs);
  const urls = Array.from(text.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi))
    .map((match) => decodeXmlText(match[1] ?? "").trim())
    .filter(Boolean);
  const origins = urls.map(originFromUrl).filter((value): value is string => Boolean(value));
  return Array.from(new Set(origins));
}

async function readTextSource(source: string, timeoutMs: number): Promise<string> {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "user-agent": "OrgAnchor beacon sweeper"
      }
    });
    if (!response.ok) throw new Error(`Could not fetch ${source}: HTTP ${response.status}`);
    return response.text();
  }
  return readFile(source, "utf8");
}

async function crawlDiscoverySeeds(
  source: string,
  options: {
    timeoutMs: number;
    maxPages: number;
    maxDepth: number;
  }
): Promise<string[]> {
  const start = normalizeHttpUrl(source, "--crawl");
  const startOrigin = start.origin;
  const targets = new Set<string>();
  const seenPages = new Set<string>();
  const queue: Array<{ url: URL; depth: number }> = [{ url: start, depth: 0 }];
  const robots = await readRobotsRules(start, options.timeoutMs);
  if (isAllowedByRobots(new URL("/.well-known/organchor.json", start), robots) ||
    isAllowedByRobots(new URL("/verify/organchor.json", start), robots)) {
    targets.add(startOrigin);
  }

  while (queue.length > 0 && seenPages.size < options.maxPages) {
    const item = queue.shift();
    if (!item) break;
    if (!isAllowedByRobots(item.url, robots)) continue;
    const pageKey = item.url.toString();
    if (seenPages.has(pageKey)) continue;
    seenPages.add(pageKey);

    let text = "";
    try {
      text = await readTextSource(pageKey, options.timeoutMs);
    } catch {
      continue;
    }

    for (const found of extractLinkedUrls(text, item.url)) {
      if (isOrgAnchorSignalUrl(found) && isAllowedByRobots(found, robots)) {
        targets.add(found.origin === startOrigin ? found.origin : found.toString());
      }
      if (
        found.origin === startOrigin &&
        item.depth < options.maxDepth &&
        isLikelyHtmlPage(found) &&
        isAllowedByRobots(found, robots)
      ) {
        queue.push({ url: found, depth: item.depth + 1 });
      }
    }
  }

  return Array.from(targets);
}

async function readRobotsRules(start: URL, timeoutMs: number): Promise<RobotsRules> {
  try {
    const robotsUrl = new URL("/robots.txt", start);
    return parseRobotsTxt(await readTextSource(robotsUrl.toString(), timeoutMs));
  } catch {
    return {
      allow: [],
      disallow: []
    };
  }
}

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length) as R[];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex++;
      const item = items[index];
      if (item === undefined) break;
      results[index] = await fn(item);
    }
  });
  await Promise.all(workers);
  return results;
}

function buildSummary(options: {
  sources: BeaconSweepSummary["sources"];
  outPath: string;
  startedAt: string;
  completedAt: string;
  timeoutMs: number;
  concurrency: number;
  targets: string[];
  records: BeaconSweepRecord[];
}): BeaconSweepSummary {
  return {
    type: "OrgAnchorBeaconSweepSummary",
    version: "0.1",
    sources: options.sources,
    out: options.outPath,
    started_at: options.startedAt,
    completed_at: options.completedAt,
    timeout_ms: options.timeoutMs,
    concurrency: options.concurrency,
    total_targets: options.targets.length,
    checked_targets: options.records.length,
    counts_by_status: countStatuses(options.records),
    counts_by_conformance: countConformance(options.records)
  };
}

function parseSources(value: string | boolean | undefined): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function originFromUrl(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function normalizeHttpUrl(value: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} requires an absolute http(s) URL: ${value}`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${label} only supports http(s) URLs: ${value}`);
  }
  return url;
}

function extractLinkedUrls(text: string, baseUrl: URL): URL[] {
  const urls: URL[] = [];
  const attributes = text.matchAll(/\b(?:href|src|action|content)\s*=\s*["']([^"']+)["']/gi);
  for (const match of attributes) {
    const value = match[1];
    if (value) pushResolvedUrl(urls, value, baseUrl);
  }
  const absoluteUrls = text.matchAll(/https?:\/\/[^\s"'<>]+/gi);
  for (const match of absoluteUrls) {
    const value = match[0];
    if (value) pushResolvedUrl(urls, value, baseUrl);
  }
  return uniqueUrlObjects(urls);
}

function pushResolvedUrl(urls: URL[], value: string, baseUrl: URL): void {
  try {
    const url = new URL(decodeXmlText(value.trim()), baseUrl);
    if (url.protocol === "http:" || url.protocol === "https:") urls.push(url);
  } catch {
    // Ignore malformed links; the crawler is a discovery helper, not an HTML validator.
  }
}

function uniqueUrlObjects(urls: URL[]): URL[] {
  const seen = new Set<string>();
  return urls.filter((url) => {
    const value = url.toString();
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function isOrgAnchorSignalUrl(url: URL): boolean {
  const pathname = url.pathname.replace(/\/+$/, "");
  return pathname === "/.well-known/organchor.json" || pathname === "/verify/organchor.json";
}

function isLikelyHtmlPage(url: URL): boolean {
  const pathname = url.pathname.toLowerCase();
  if (pathname.endsWith("/")) return true;
  return !/\.[a-z0-9]{1,8}$/i.test(pathname) || pathname.endsWith(".html") || pathname.endsWith(".htm");
}

function parseRobotsTxt(text: string): RobotsRules {
  const rules: RobotsRules = {
    allow: [],
    disallow: []
  };
  let agents: string[] = [];
  let applies = false;
  let sawDirective = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#", 1)[0]?.trim() ?? "";
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (key === "user-agent") {
      if (sawDirective) {
        agents = [];
        applies = false;
        sawDirective = false;
      }
      agents.push(value.toLowerCase());
      applies = agents.some((agent) => agent === "*" || agent.includes("organchor"));
      continue;
    }
    if (key !== "allow" && key !== "disallow") continue;
    sawDirective = true;
    if (!applies) continue;
    if (key === "allow") {
      if (value) rules.allow.push(value);
      continue;
    }
    if (value) rules.disallow.push(value);
  }

  return rules;
}

function isAllowedByRobots(url: URL, rules: RobotsRules): boolean {
  const path = `${url.pathname}${url.search}`;
  const matchedAllow = longestPrefixLength(path, rules.allow);
  const matchedDisallow = longestPrefixLength(path, rules.disallow);
  return matchedDisallow < 0 || matchedAllow >= matchedDisallow;
}

function longestPrefixLength(path: string, patterns: string[]): number {
  let longest = -1;
  for (const pattern of patterns) {
    if (pattern === "/") {
      longest = Math.max(longest, 1);
      continue;
    }
    if (path.startsWith(pattern)) longest = Math.max(longest, pattern.length);
  }
  return longest;
}

function decodeXmlText(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

function countStatuses(records: BeaconSweepRecord[]): Record<BeaconInspectStatus, number> {
  return {
    PASS: records.filter((record) => record.status === "PASS").length,
    WARN: records.filter((record) => record.status === "WARN").length,
    FAIL: records.filter((record) => record.status === "FAIL").length
  };
}

function countConformance(records: BeaconSweepRecord[]): Record<BeaconConformanceStatus, number> {
  return {
    CLAIMED_SIGNAL: records.filter((record) => record.conformance_status === "CLAIMED_SIGNAL").length,
    BEACON_SHAPE_PASS: records.filter((record) => record.conformance_status === "BEACON_SHAPE_PASS").length,
    IDENTITY_VERIFY_PASS: records.filter((record) => record.conformance_status === "IDENTITY_VERIFY_PASS").length,
    VALUE_VERIFY_PASS: records.filter((record) => record.conformance_status === "VALUE_VERIFY_PASS").length,
    FULL_COMPATIBLE: records.filter((record) => record.conformance_status === "FULL_COMPATIBLE").length,
    PARTIAL: records.filter((record) => record.conformance_status === "PARTIAL").length,
    FAILED: records.filter((record) => record.conformance_status === "FAILED").length
  };
}

function parsePositiveInteger(value: string | boolean | undefined, label: string, fallback: number): number {
  if (value === undefined || value === false) return fallback;
  if (typeof value !== "string") throw new Error(`${label} must be a positive integer`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${label} must be a positive integer`);
  return parsed;
}

function parseNonNegativeInteger(value: string | boolean | undefined, label: string, fallback: number): number {
  if (value === undefined || value === false) return fallback;
  if (typeof value !== "string") throw new Error(`${label} must be a non-negative integer`);
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) throw new Error(`${label} must be a non-negative integer`);
  return parsed;
}
