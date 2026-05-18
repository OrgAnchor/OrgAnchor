import type { CaaRecord, MxRecord } from "node:dns";
import { Resolver } from "node:dns/promises";
import { writeFile } from "node:fs/promises";
import { request as httpsRequest } from "node:https";
import { connect as tlsConnect } from "node:tls";
import { ensureDir, writeJsonFile } from "../core/files.ts";
import type { JsonValue } from "../core/json.ts";
import type { AuditStatus, DomainAuditCheck, DomainSecurityReport } from "../types/report.ts";

export interface DomainAuditOptions {
  now?: Date;
  timeoutMs?: number;
  dnsServer?: string;
  resolveIp?: string;
  outputDir?: string;
}

export interface DomainAuditDependencies {
  resolver?: DomainResolver;
  httpGet?: HttpGet;
  inspectCertificate?: CertificateInspector;
}

export interface DomainResolver {
  resolveMx(hostname: string): Promise<MxRecord[]>;
  resolveTxt(hostname: string): Promise<string[][]>;
  resolveCaa(hostname: string): Promise<CaaRecord[]>;
  resolveDs(hostname: string): Promise<unknown[]>;
}

export interface HttpResult {
  url: string;
  finalUrl: string;
  status: number;
  ok: boolean;
  contentType?: string;
  bodyText?: string;
}

export type HttpGet = (url: string, options: { timeoutMs: number; resolveIp?: string }) => Promise<HttpResult>;

export interface CertificateInfo {
  valid_to: string;
  days_remaining: number;
  authorized?: boolean;
  issuer?: string;
  subject_alt_name?: string;
}

export type CertificateInspector = (
  domain: string,
  options: { now: Date; timeoutMs: number; resolveIp?: string }
) => Promise<CertificateInfo>;

export async function auditDomain(
  inputDomain: string,
  options: DomainAuditOptions = {},
  dependencies: DomainAuditDependencies = {}
): Promise<DomainSecurityReport> {
  const domain = normalizeDomain(inputDomain);
  const now = options.now ?? new Date();
  const timeoutMs = options.timeoutMs ?? 15000;
  const resolver = dependencies.resolver ?? createResolver(options.dnsServer);
  const httpGet = dependencies.httpGet ?? defaultHttpGet;
  const inspectCertificate = dependencies.inspectCertificate ?? defaultInspectCertificate;

  const checks: DomainAuditCheck[] = [];
  checks.push(await checkDnssec(domain, resolver));
  checks.push(await checkMx(domain, resolver));
  checks.push(await checkSpf(domain, resolver));
  checks.push(await checkDmarc(domain, resolver));
  checks.push(await checkCaa(domain, resolver));
  checks.push(await checkHttps(domain, httpGet, timeoutMs, options.resolveIp));
  checks.push(await checkCertificate(domain, inspectCertificate, now, timeoutMs, options.resolveIp));
  checks.push(await checkSecurityTxt("security_txt_root", "security.txt at /security.txt", `https://${domain}/security.txt`, httpGet, timeoutMs, options.resolveIp));
  checks.push(await checkSecurityTxt("security_txt_well_known", "security.txt at /.well-known/security.txt", `https://${domain}/.well-known/security.txt`, httpGet, timeoutMs, options.resolveIp));
  checks.push(await checkPath("verify_page", "/verify page", `https://${domain}/verify/`, httpGet, timeoutMs, options.resolveIp, "FAIL"));
  checks.push(await checkPath("official_statement", "official-endpoints.json", `https://${domain}/verify/official-endpoints.json`, httpGet, timeoutMs, options.resolveIp, "FAIL"));
  checks.push(await checkPath("official_statement_signature", "official-endpoints.json.sig", `https://${domain}/verify/official-endpoints.json.sig`, httpGet, timeoutMs, options.resolveIp, "FAIL"));
  checks.push(manualCheck("domain_expiry", "Domain expiration date", "Check the registrar account for the expiration date and renewal state."));
  checks.push(manualCheck("registry_lock", "Registry Lock", "Check the registrar account or registry support channel. OrgAnchor cannot reliably enable or prove registry lock automatically."));
  checks.push(manualCheck("auto_renewal", "Domain auto-renewal", "Check the registrar billing settings and payment method status."));

  return {
    type: "OrgAnchorDomainSecurityReport",
    version: "1.0",
    domain,
    audited_at: now.toISOString(),
    generated_by: "organchor",
    summary: summarize(checks),
    checks
  };
}

export async function writeDomainAuditReport(report: DomainSecurityReport, outputDir = "reports"): Promise<void> {
  await ensureDir(outputDir);
  await writeJsonFile(`${outputDir}/domain-security-report.json`, report as unknown as JsonValue);
  await writeFile(`${outputDir}/domain-security-report.md`, renderDomainAuditMarkdown(report), "utf8");
}

export function renderDomainAuditMarkdown(report: DomainSecurityReport): string {
  const rows = report.checks
    .map((check) => `| ${check.status} | ${check.id} | ${escapeMarkdown(check.summary)} |`)
    .join("\n");

  return `# Domain Security Report

Domain: \`${report.domain}\`

Audited at: \`${report.audited_at}\`

## Summary

| Status | Count |
| --- | ---: |
| PASS | ${report.summary.PASS} |
| WARN | ${report.summary.WARN} |
| FAIL | ${report.summary.FAIL} |
| MANUAL_CHECK_REQUIRED | ${report.summary.MANUAL_CHECK_REQUIRED} |

## Checks

| Status | Check | Summary |
| --- | --- | --- |
${rows}
`;
}

function createResolver(dnsServer?: string): DomainResolver {
  const resolver = new Resolver();
  if (dnsServer) {
    resolver.setServers([dnsServer]);
  }
  return {
    resolveMx: (hostname) => resolver.resolveMx(hostname),
    resolveTxt: (hostname) => resolver.resolveTxt(hostname),
    resolveCaa: (hostname) => resolver.resolveCaa(hostname),
    resolveDs: (hostname) => resolveDsViaDnsJson(hostname, dnsServer)
  };
}

async function checkDnssec(domain: string, resolver: DomainResolver): Promise<DomainAuditCheck> {
  try {
    const records = await resolver.resolveDs(domain);
    const count = records.length;
    if (count > 0) {
      return pass("dnssec", "DNSSEC", `DS record found (${count}).`, { record_count: count });
    }
    return warn("dnssec", "DNSSEC", "No DS record found at the parent zone.", { record_count: 0 });
  } catch (error) {
    return warn("dnssec", "DNSSEC", "Could not confirm DNSSEC DS record.", errorDetails(error));
  }
}

async function checkMx(domain: string, resolver: DomainResolver): Promise<DomainAuditCheck> {
  try {
    const records = await resolver.resolveMx(domain);
    if (records.length > 0) {
      return pass("mx", "MX records", `MX records found (${records.length}).`, { records });
    }
    return warn("mx", "MX records", "No MX records found.", { records });
  } catch (error) {
    return warn("mx", "MX records", isMissingDnsRecord(error) ? "No MX records found." : "Could not confirm MX records.", errorDetails(error));
  }
}

async function checkSpf(domain: string, resolver: DomainResolver): Promise<DomainAuditCheck> {
  try {
    const records = await resolver.resolveTxt(domain);
    const flattened = flattenTxt(records);
    const spf = flattened.filter((record) => record.toLowerCase().startsWith("v=spf1"));
    if (spf.length > 0) {
      return pass("spf", "SPF", "SPF TXT record found.", { records: spf });
    }
    return warn("spf", "SPF", "No SPF TXT record found.", { txt_record_count: flattened.length });
  } catch (error) {
    return warn("spf", "SPF", isMissingDnsRecord(error) ? "No SPF TXT record found." : "Could not confirm SPF TXT record.", errorDetails(error));
  }
}

async function checkDmarc(domain: string, resolver: DomainResolver): Promise<DomainAuditCheck> {
  try {
    const records = await resolver.resolveTxt(`_dmarc.${domain}`);
    const flattened = flattenTxt(records);
    const dmarc = flattened.filter((record) => record.toLowerCase().startsWith("v=dmarc1"));
    if (dmarc.length > 0) {
      return pass("dmarc", "DMARC", "DMARC TXT record found.", { records: dmarc });
    }
    return warn("dmarc", "DMARC", "No DMARC TXT record found.", { txt_record_count: flattened.length });
  } catch (error) {
    return warn("dmarc", "DMARC", isMissingDnsRecord(error) ? "No DMARC TXT record found." : "Could not confirm DMARC TXT record.", errorDetails(error));
  }
}

async function checkCaa(domain: string, resolver: DomainResolver): Promise<DomainAuditCheck> {
  try {
    const records = await resolver.resolveCaa(domain);
    if (records.length > 0) {
      return pass("caa", "CAA", `CAA records found (${records.length}).`, { records });
    }
    return warn("caa", "CAA", "No CAA records found.", { records });
  } catch (error) {
    return warn("caa", "CAA", isMissingDnsRecord(error) ? "No CAA records found." : "Could not confirm CAA records.", errorDetails(error));
  }
}

async function checkHttps(domain: string, httpGet: HttpGet, timeoutMs: number, resolveIp?: string): Promise<DomainAuditCheck> {
  const url = `https://${domain}/`;
  try {
    const result = await httpGet(url, httpOptions(timeoutMs, resolveIp));
    if (result.ok) {
      return pass("https", "HTTPS", `HTTPS is reachable with status ${result.status}.`, httpDetails(result));
    }
    return failCheck("https", "HTTPS", `HTTPS returned status ${result.status}.`, httpDetails(result));
  } catch (error) {
    return failCheck("https", "HTTPS", "HTTPS request failed.", errorDetails(error));
  }
}

async function checkCertificate(
  domain: string,
  inspectCertificate: CertificateInspector,
  now: Date,
  timeoutMs: number,
  resolveIp?: string
): Promise<DomainAuditCheck> {
  try {
    const certificate = await inspectCertificate(domain, certificateOptions(now, timeoutMs, resolveIp));
    if (certificate.days_remaining < 0) {
      return failCheck("certificate_expiry", "Certificate expiration", "HTTPS certificate is expired.", toDetails(certificate));
    }
    if (certificate.days_remaining < 30) {
      return warn("certificate_expiry", "Certificate expiration", `HTTPS certificate expires in ${certificate.days_remaining} days.`, toDetails(certificate));
    }
    return pass("certificate_expiry", "Certificate expiration", `HTTPS certificate expires in ${certificate.days_remaining} days.`, toDetails(certificate));
  } catch (error) {
    return failCheck("certificate_expiry", "Certificate expiration", "Could not inspect HTTPS certificate.", errorDetails(error));
  }
}

async function checkSecurityTxt(
  id: string,
  title: string,
  url: string,
  httpGet: HttpGet,
  timeoutMs: number,
  resolveIp?: string
): Promise<DomainAuditCheck> {
  try {
    const result = await httpGet(url, httpOptions(timeoutMs, resolveIp));
    if (!result.ok) {
      return warn(id, title, `${title} returned status ${result.status}.`, httpDetails(result));
    }
    if (/^contact\s*:/im.test(result.bodyText ?? "")) {
      return pass(id, title, `${title} contains a Contact field.`, httpDetails(result));
    }
    return warn(id, title, `${title} is reachable but does not look like a valid security.txt file.`, httpDetails(result));
  } catch (error) {
    return warn(id, title, `${title} request failed.`, errorDetails(error));
  }
}

async function checkPath(
  id: string,
  title: string,
  url: string,
  httpGet: HttpGet,
  timeoutMs: number,
  resolveIp: string | undefined,
  missingStatus: "WARN" | "FAIL"
): Promise<DomainAuditCheck> {
  try {
    const result = await httpGet(url, httpOptions(timeoutMs, resolveIp));
    if (result.ok) {
      return pass(id, title, `${title} is reachable with status ${result.status}.`, httpDetails(result));
    }
    const summary = `${title} returned status ${result.status}.`;
    return missingStatus === "FAIL" ? failCheck(id, title, summary, httpDetails(result)) : warn(id, title, summary, httpDetails(result));
  } catch (error) {
    const summary = `${title} request failed.`;
    return missingStatus === "FAIL" ? failCheck(id, title, summary, errorDetails(error)) : warn(id, title, summary, errorDetails(error));
  }
}

export function normalizeDomain(input: string): string {
  const trimmed = input.trim();
  const hostname = /^https?:\/\//i.test(trimmed) ? new URL(trimmed).hostname : trimmed.split("/")[0] ?? "";
  const domain = hostname.toLowerCase().replace(/\.$/, "");
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
    throw new Error(`Invalid domain: ${input}`);
  }
  return domain;
}

async function defaultHttpGet(url: string, options: { timeoutMs: number; resolveIp?: string }): Promise<HttpResult> {
  return requestUrl(url, options, 0);
}

async function requestUrl(url: string, options: { timeoutMs: number; resolveIp?: string }, redirectCount: number): Promise<HttpResult> {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    throw new Error(`Unsupported URL protocol for domain audit: ${parsed.protocol}`);
  }

  return new Promise((resolvePromise, reject) => {
    const request = httpsRequest(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port ? Number(parsed.port) : 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: "GET",
        servername: parsed.hostname,
        timeout: options.timeoutMs,
        headers: {
          "user-agent": "OrgAnchor domain audit"
        },
        lookup: options.resolveIp ? forcedLookup(options.resolveIp) : undefined
      },
      (response) => {
        const chunks: Buffer[] = [];
        let collected = 0;
        response.on("data", (chunk: Buffer) => {
          if (collected >= 65_536) return;
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          const remaining = 65_536 - collected;
          chunks.push(buffer.subarray(0, remaining));
          collected += Math.min(buffer.length, remaining);
        });
        response.on("end", () => {
          const location = response.headers.location;
          if (
            response.statusCode &&
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            typeof location === "string" &&
            redirectCount < 5
          ) {
            const nextUrl = new URL(location, url).toString();
            requestUrl(nextUrl, options, redirectCount + 1).then(resolvePromise, reject);
            return;
          }
          const status = response.statusCode ?? 0;
          const result: HttpResult = {
            url,
            finalUrl: url,
            status,
            ok: status >= 200 && status < 400
          };
          if (typeof response.headers["content-type"] === "string") {
            result.contentType = response.headers["content-type"];
          }
          if (chunks.length > 0) {
            result.bodyText = Buffer.concat(chunks).toString("utf8");
          }
          resolvePromise(result);
        });
      }
    );

    request.on("timeout", () => {
      request.destroy(new Error(`Request timed out after ${options.timeoutMs} ms`));
    });
    request.on("error", reject);
    request.end();
  });
}

async function defaultInspectCertificate(
  domain: string,
  options: { now: Date; timeoutMs: number; resolveIp?: string }
): Promise<CertificateInfo> {
  return new Promise((resolvePromise, reject) => {
    const socket = tlsConnect({
      host: domain,
      port: 443,
      servername: domain,
      timeout: options.timeoutMs,
      lookup: options.resolveIp ? forcedLookup(options.resolveIp) : undefined
    });

    socket.once("secureConnect", () => {
      const certificate = socket.getPeerCertificate();
      socket.end();
      const validTo = certificate.valid_to;
      const validToMs = Date.parse(validTo);
      if (!Number.isFinite(validToMs)) {
        reject(new Error("Certificate did not include a parseable valid_to value"));
        return;
      }
      const daysRemaining = Math.floor((validToMs - options.now.getTime()) / 86_400_000);
      const info: CertificateInfo = {
        valid_to: new Date(validToMs).toISOString(),
        days_remaining: daysRemaining,
        authorized: socket.authorized
      };
      if (typeof certificate.issuer?.O === "string") {
        info.issuer = certificate.issuer.O;
      }
      if (typeof certificate.subjectaltname === "string") {
        info.subject_alt_name = certificate.subjectaltname;
      }
      resolvePromise(info);
    });

    socket.once("timeout", () => {
      socket.destroy(new Error(`TLS inspection timed out after ${options.timeoutMs} ms`));
    });
    socket.once("error", reject);
  });
}

function flattenTxt(records: string[][]): string[] {
  return records.map((record) => record.join(""));
}

function summarize(checks: DomainAuditCheck[]): Record<AuditStatus, number> {
  return {
    PASS: checks.filter((check) => check.status === "PASS").length,
    WARN: checks.filter((check) => check.status === "WARN").length,
    FAIL: checks.filter((check) => check.status === "FAIL").length,
    MANUAL_CHECK_REQUIRED: checks.filter((check) => check.status === "MANUAL_CHECK_REQUIRED").length
  };
}

function pass(id: string, title: string, summary: string, details?: Record<string, unknown>): DomainAuditCheck {
  return buildCheck(id, title, "PASS", summary, details);
}

function warn(id: string, title: string, summary: string, details?: Record<string, unknown>): DomainAuditCheck {
  return buildCheck(id, title, "WARN", summary, details);
}

function failCheck(id: string, title: string, summary: string, details?: Record<string, unknown>): DomainAuditCheck {
  return buildCheck(id, title, "FAIL", summary, details);
}

function manualCheck(id: string, title: string, summary: string): DomainAuditCheck {
  return { id, title, status: "MANUAL_CHECK_REQUIRED", summary };
}

function errorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const maybeCode = error as Error & { code?: string };
    return {
      error: error.message,
      code: maybeCode.code
    };
  }
  return {
    error: String(error)
  };
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

async function resolveDsViaDnsJson(hostname: string, dnsServer?: string): Promise<unknown[]> {
  const endpoint = dnsServer?.startsWith("8.8.8.") || dnsServer?.startsWith("2001:4860")
    ? "https://dns.google/resolve"
    : "https://cloudflare-dns.com/dns-query";
  const url = new URL(endpoint);
  url.searchParams.set("name", hostname);
  url.searchParams.set("type", "DS");

  const response = await fetch(url, {
    headers: {
      accept: "application/dns-json"
    }
  });
  if (!response.ok) {
    throw new Error(`DNS-over-HTTPS DS query failed with status ${response.status}`);
  }
  const body = (await response.json()) as { Status?: number; Answer?: unknown[] };
  if (body.Status === 3) {
    return [];
  }
  return Array.isArray(body.Answer) ? body.Answer : [];
}

function forcedLookup(ip: string) {
  return (_hostname: string, optionsOrCallback: unknown, maybeCallback?: unknown): void => {
    const callback = typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    if (typeof callback !== "function") {
      throw new Error("Forced DNS lookup callback missing");
    }
    const family = ip.includes(":") ? 6 : 4;
    if (
      typeof optionsOrCallback === "object" &&
      optionsOrCallback !== null &&
      "all" in optionsOrCallback &&
      (optionsOrCallback as { all?: boolean }).all === true
    ) {
      (callback as (error: NodeJS.ErrnoException | null, addresses: Array<{ address: string; family: number }>) => void)(
        null,
        [{ address: ip, family }]
      );
      return;
    }
    (callback as (error: NodeJS.ErrnoException | null, address: string, family: number) => void)(null, ip, family);
  };
}

function isMissingDnsRecord(error: unknown): boolean {
  const code = error instanceof Error ? (error as Error & { code?: string }).code : undefined;
  return code === "ENODATA" || code === "ENOTFOUND" || code === "ENONAME" || code === "ENODOMAIN";
}

function buildCheck(
  id: string,
  title: string,
  status: AuditStatus,
  summary: string,
  details?: Record<string, unknown>
): DomainAuditCheck {
  const check: DomainAuditCheck = { id, title, status, summary };
  if (details !== undefined) {
    check.details = details;
  }
  return check;
}

function httpOptions(timeoutMs: number, resolveIp?: string): { timeoutMs: number; resolveIp?: string } {
  const options: { timeoutMs: number; resolveIp?: string } = { timeoutMs };
  if (resolveIp !== undefined) {
    options.resolveIp = resolveIp;
  }
  return options;
}

function certificateOptions(
  now: Date,
  timeoutMs: number,
  resolveIp?: string
): { now: Date; timeoutMs: number; resolveIp?: string } {
  const options: { now: Date; timeoutMs: number; resolveIp?: string } = { now, timeoutMs };
  if (resolveIp !== undefined) {
    options.resolveIp = resolveIp;
  }
  return options;
}

function toDetails(value: object): Record<string, unknown> {
  return { ...value };
}

function httpDetails(result: HttpResult): Record<string, unknown> {
  const details: Record<string, unknown> = {
    url: result.url,
    finalUrl: result.finalUrl,
    status: result.status,
    ok: result.ok
  };
  if (result.contentType !== undefined) {
    details.content_type = result.contentType;
  }
  return details;
}
