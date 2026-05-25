import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ensureDir, writeJsonFile } from "../core/files.ts";
import type { JsonValue } from "../core/json.ts";

const INDEX_FILE = "organchor.json";
const WELL_KNOWN_DIR = ".well-known";
const ROBOTS_FILE = "robots.txt";
const SITEMAP_FILE = "sitemap.xml";

export interface BeaconDiscoverySurfaceOptions {
  publicRootDir: string;
  origin: string;
  artifactBasePath: string;
  organization: Record<string, JsonValue>;
  authorityHash: string;
  statementHash: string;
  generatedAt: string;
  valueContinuity: {
    status: string;
    summary: Record<string, JsonValue>;
  };
  discovery: Record<string, JsonValue>;
}

export async function writeBeaconDiscoverySurfaces(options: BeaconDiscoverySurfaceOptions): Promise<void> {
  const origin = normalizeBeaconOrigin(options.origin);
  const verifyUrl = ensureTrailingSlash(new URL(options.artifactBasePath, `${origin}/`).toString());
  const verifyIndexUrl = new URL(INDEX_FILE, verifyUrl).toString();
  const wellKnownUrl = new URL(`/${WELL_KNOWN_DIR}/${INDEX_FILE}`, `${origin}/`).toString();
  const valueStatus = publicValueStatus(options.valueContinuity);
  const beacon: JsonValue = {
    type: "OrgAnchorBeacon",
    version: "1.0",
    origin,
    verify_url: verifyUrl,
    well_known_url: wellKnownUrl,
    verify_index_url: verifyIndexUrl,
    root_authority_hash: options.authorityHash,
    statement_hash: options.statementHash,
    organization: options.organization,
    discovery: options.discovery,
    summary_status: {
      identity_status: "PASS",
      value_status: valueStatus,
      policy_route: valueStatus === "PASS" ? "READY_FOR_EXTERNAL_POLICY" : valueStatus === "WARN" ? "REVIEW_VALUE_WARNINGS" : "REQUEST_VALUE_EVIDENCE",
      updated_at: options.generatedAt
    },
    agent_flow: {
      first_pass: `organchor verify url ${origin} --compact`,
      deep_verify: `organchor verify url ${origin}`,
      beacon_inspect: `organchor beacon inspect ${origin}`,
      doctor: `organchor doctor ${origin}`,
      trust_decision: "EXTERNAL_AGENT"
    },
    extensions: {}
  };

  const wellKnownDir = join(options.publicRootDir, WELL_KNOWN_DIR);
  await ensureDir(wellKnownDir);
  await writeJsonFile(join(wellKnownDir, INDEX_FILE), beacon);
  await writeFile(
    join(options.publicRootDir, ROBOTS_FILE),
    [
      "User-agent: *",
      "Allow: /.well-known/organchor.json",
      "Allow: /verify/",
      `Sitemap: ${new URL(`/${SITEMAP_FILE}`, `${origin}/`).toString()}`,
      ""
    ].join("\n"),
    "utf8"
  );
  await writeFile(
    join(options.publicRootDir, SITEMAP_FILE),
    renderSitemapXml([
      new URL("/", `${origin}/`).toString(),
      verifyUrl,
      verifyIndexUrl,
      wellKnownUrl
    ]),
    "utf8"
  );
}

export function normalizeBeaconOrigin(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("--origin must be an http(s) URL");
  }
  return url.origin;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function publicValueStatus(valueContinuity: BeaconDiscoverySurfaceOptions["valueContinuity"]): "PASS" | "WARN" | "NOT_INCLUDED" {
  if (valueContinuity.status !== "PRESENT") return "NOT_INCLUDED";
  const summary = valueContinuity.summary;
  const failCount = numberMetric(summary.FAIL);
  const warnCount = numberMetric(summary.WARN);
  const unsupportedClaims = numberMetric(summary.unsupported_claims);
  return failCount > 0 || warnCount > 0 || unsupportedClaims > 0 ? "WARN" : "PASS";
}

function numberMetric(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function renderSitemapXml(urls: string[]): string {
  const unique = Array.from(new Set(urls));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join("\n")}
</urlset>
`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
