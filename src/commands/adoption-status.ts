import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { ensureDir, pathExists, writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import {
  validateOfficialStatement,
  validateRootAuthority,
  validateSignatureFile
} from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";

type AdoptionStatus = "READY" | "NEEDS_WORK" | "BLOCKED";
type CheckStatus = "PASS" | "WARN" | "FAIL" | "NOT_INCLUDED" | "MANUAL_CHECK_REQUIRED";

interface AdoptionStatusCheck {
  id: string;
  status: CheckStatus;
  detail: string;
}

interface AdoptionStatusReport {
  type: "OrgAnchorAdoptionStatusReport";
  version: "0.1";
  generated_at: string;
  status: AdoptionStatus;
  adoption_level: number;
  organization: {
    name: string | null;
    display_name: string | null;
  };
  public_urls: {
    verify_url: string | null;
    well_known_url: string | null;
    verify_index_url: string | null;
  };
  identity: {
    status: "PASS" | "FAIL" | "NOT_INCLUDED";
    root_authority_hash: string | null;
    statement_hash: string | null;
    signature_hash: string | null;
    root_authority_threshold: string | null;
    valid_signature_count: number;
    required_signature_count: number;
  };
  value_evidence: {
    status: string;
    claims: string;
    evidence: string;
    value_report: string;
    unsupported_claims: number | null;
  };
  carriers: {
    status: string;
    receipt_count: number;
    providers: string[];
  };
  domain_audit: {
    status: string;
    PASS: number;
    WARN: number;
    FAIL: number;
    MANUAL_CHECK_REQUIRED: number;
  } | null;
  discovery: {
    beacon: string;
    robots: string;
    sitemap: string;
    directory_discovery: string;
  };
  checks: AdoptionStatusCheck[];
  known_gaps: string[];
  next_actions: string[];
  trust_boundary: {
    adoption_status_is_trust_decision: false;
    final_trust_decision: "EXTERNAL_AGENT";
    identity_root: "ROOT_AUTHORITY";
  };
}

export async function adoptionStatusCommand(options: Record<string, string | boolean>): Promise<void> {
  const verifyDir = typeof options["verify-dir"] === "string" ? options["verify-dir"] : "public/verify";
  const publicRoot = typeof options["public-root"] === "string" ? options["public-root"] : dirname(verifyDir);
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const domainReportPath = typeof options["domain-report"] === "string" ? options["domain-report"] : "reports/domain-security-report.json";
  const outPath = typeof options.out === "string" ? options.out : "ADOPTION_STATUS.md";
  const jsonPath = typeof options.json === "string" ? options.json : "reports/adoption-status-report.json";
  const generatedAt = typeof options["generated-at"] === "string" ? options["generated-at"] : new Date().toISOString();
  const adoptionLevel = parseAdoptionLevel(options.level);
  const origin = typeof options.origin === "string" ? new URL(options.origin).origin : "";
  const report = await buildAdoptionStatusReport({
    verifyDir,
    publicRoot,
    lockfilePath,
    domainReportPath,
    generatedAt,
    adoptionLevel,
    origin
  });
  await writeJsonFile(jsonPath, report as unknown as JsonValue);
  await ensureDir(dirname(outPath));
  await writeFile(outPath, renderMarkdown(report), "utf8");
  console.log(JSON.stringify({
    type: "OrgAnchorAdoptionStatusSummary",
    version: "0.1",
    status: report.status,
    adoption_level: report.adoption_level,
    organization: report.organization,
    identity_status: report.identity.status,
    known_gap_count: report.known_gaps.length,
    markdown: outPath,
    json: jsonPath
  }, null, 2));
  if (report.status === "BLOCKED") process.exitCode = 1;
}

async function buildAdoptionStatusReport(options: {
  verifyDir: string;
  publicRoot: string;
  lockfilePath: string;
  domainReportPath: string;
  generatedAt: string;
  adoptionLevel: number;
  origin: string;
}): Promise<AdoptionStatusReport> {
  const checks: AdoptionStatusCheck[] = [];
  const indexPath = join(options.verifyDir, "organchor.json");
  const indexExists = await pathExists(indexPath);
  addCheck(checks, "verify_index", indexExists ? "PASS" : "FAIL", indexExists ? `Found ${indexPath}.` : `Missing ${indexPath}.`);
  const index = indexExists ? asRecord(await readJsonFile(indexPath)) : {};
  const organization = asRecord(index.organization);
  const identity = indexExists ? await inspectIdentity(options.verifyDir, index, checks) : emptyIdentity();
  const valueEvidence = inspectValueEvidence(index, checks);
  const carriers = await inspectCarriers(options.lockfilePath, index, checks);
  const domainAudit = await inspectDomainAudit(options.domainReportPath, checks);
  const discovery = await inspectDiscovery(options.publicRoot, index, checks);
  const knownGaps = knownGapsFor({
    adoptionLevel: options.adoptionLevel,
    identity,
    valueEvidence,
    carriers,
    domainAudit,
    discovery,
    checks
  });
  const report: AdoptionStatusReport = {
    type: "OrgAnchorAdoptionStatusReport",
    version: "0.1",
    generated_at: options.generatedAt,
    status: adoptionStatus(identity, knownGaps, checks),
    adoption_level: options.adoptionLevel,
    organization: {
      name: stringValue(organization.name) || null,
      display_name: stringValue(organization.display_name) || stringValue(organization.name) || null
    },
    public_urls: publicUrls(index, options.origin),
    identity,
    value_evidence: valueEvidence,
    carriers,
    domain_audit: domainAudit,
    discovery,
    checks,
    known_gaps: knownGaps,
    next_actions: nextActions(identity, knownGaps, checks),
    trust_boundary: {
      adoption_status_is_trust_decision: false,
      final_trust_decision: "EXTERNAL_AGENT",
      identity_root: "ROOT_AUTHORITY"
    }
  };
  return report;
}

async function inspectIdentity(
  verifyDir: string,
  index: Record<string, JsonValue>,
  checks: AdoptionStatusCheck[]
): Promise<AdoptionStatusReport["identity"]> {
  try {
    const statementRef = asRecord(index.statement);
    const signatureRef = asRecord(index.signature);
    const authorityRef = asRecord(index.root_authority);
    const statementPath = join(verifyDir, stringValue(statementRef.path) || "official-endpoints.json");
    const signaturePath = join(verifyDir, stringValue(signatureRef.path) || "official-endpoints.json.sig");
    const authorityPath = join(verifyDir, stringValue(authorityRef.path) || "root-authority.json");
    const statement = validateOfficialStatement(await readJsonFile(statementPath));
    const signature = validateSignatureFile(await readJsonFile(signaturePath));
    const authority = validateRootAuthority(await readJsonFile(authorityPath));
    const statementHash = sha256CanonicalJson(statement);
    const signatureHash = sha256CanonicalJson(signature);
    const authorityHash = sha256CanonicalJson(authority);
    const errors: string[] = [];
    if (stringValue(statementRef.hash) && stringValue(statementRef.hash) !== statementHash) errors.push("verify index statement hash mismatch");
    if (stringValue(signatureRef.hash) && stringValue(signatureRef.hash) !== signatureHash) errors.push("verify index signature hash mismatch");
    if (stringValue(authorityRef.hash) && stringValue(authorityRef.hash) !== authorityHash) errors.push("verify index root authority hash mismatch");
    if (statement.root_authority_hash !== authorityHash) errors.push("statement root authority hash mismatch");
    const verification = verifySignatureFile(statement, signature, authority);
    errors.push(...verification.errors);
    const status = errors.length === 0 ? "PASS" : "FAIL";
    addCheck(
      checks,
      "identity_verification",
      status,
      status === "PASS" ? "Statement, signature, and root authority verify from public verify artifacts." : errors.join("; ")
    );
    return {
      status,
      root_authority_hash: authorityHash,
      statement_hash: statementHash,
      signature_hash: signatureHash,
      root_authority_threshold: `${authority.threshold.required}-of-${authority.threshold.total}`,
      valid_signature_count: verification.valid_signatures.length,
      required_signature_count: verification.required_signatures
    };
  } catch (error) {
    addCheck(checks, "identity_verification", "FAIL", error instanceof Error ? error.message : String(error));
    return emptyIdentity("FAIL");
  }
}

function inspectValueEvidence(index: Record<string, JsonValue>, checks: AdoptionStatusCheck[]): AdoptionStatusReport["value_evidence"] {
  const linkedArtifacts = asRecord(index.linked_artifacts);
  const valueContinuity = asRecord(index.value_continuity);
  const claimsStatus = linkedArtifacts.claims ? "PRESENT" : "NOT_INCLUDED";
  const evidenceStatus = linkedArtifacts.evidence ? "PRESENT" : "NOT_INCLUDED";
  const valueStatus = stringValue(valueContinuity.status) || "NOT_INCLUDED";
  const summary = asRecord(valueContinuity.summary);
  const unsupportedClaims = numberOrNull(summary.unsupported_claims);
  addCheck(
    checks,
    "value_evidence",
    claimsStatus === "PRESENT" && evidenceStatus === "PRESENT" && valueStatus === "PRESENT" ? "PASS" : "NOT_INCLUDED",
    `Claims: ${claimsStatus}; evidence: ${evidenceStatus}; value report: ${valueStatus}.`
  );
  return {
    status: valueStatus === "PRESENT" && unsupportedClaims === 0 ? "PASS" : valueStatus === "PRESENT" ? "WARN" : "NOT_INCLUDED",
    claims: claimsStatus,
    evidence: evidenceStatus,
    value_report: valueStatus,
    unsupported_claims: unsupportedClaims
  };
}

async function inspectCarriers(
  lockfilePath: string,
  index: Record<string, JsonValue>,
  checks: AdoptionStatusCheck[]
): Promise<AdoptionStatusReport["carriers"]> {
  const carrierReceipts = asRecord(index.carrier_receipts);
  const receiptArray = Array.isArray(carrierReceipts.receipts) ? carrierReceipts.receipts : [];
  let providers = receiptArray
    .map((receipt) => stringValue(asRecord(receipt).provider))
    .filter(Boolean);
  if (providers.length === 0 && await pathExists(lockfilePath)) {
    const lockfile = asRecord(await readJsonFile(lockfilePath));
    const artifacts = asRecord(lockfile.artifacts);
    providers = Object.values(artifacts).flatMap((artifact) => {
      const receipts = asRecord(artifact).receipts;
      return Array.isArray(receipts) ? receipts.map((receipt) => stringValue(asRecord(receipt).provider)).filter(Boolean) : [];
    });
  }
  const uniqueProviders = Array.from(new Set(providers));
  addCheck(
    checks,
    "carrier_receipts",
    uniqueProviders.length > 0 ? "PASS" : "NOT_INCLUDED",
    uniqueProviders.length > 0 ? `Carrier providers recorded: ${uniqueProviders.join(", ")}.` : "No carrier receipts found."
  );
  return {
    status: uniqueProviders.length > 0 ? "PRESENT" : "NOT_INCLUDED",
    receipt_count: providers.length,
    providers: uniqueProviders
  };
}

async function inspectDomainAudit(path: string, checks: AdoptionStatusCheck[]): Promise<AdoptionStatusReport["domain_audit"]> {
  if (!(await pathExists(path))) {
    addCheck(checks, "domain_audit", "NOT_INCLUDED", `Missing ${path}.`);
    return null;
  }
  const report = asRecord(await readJsonFile(path));
  const summary = asRecord(report.summary);
  const result = {
    status: numberValue(summary.FAIL) > 0 ? "FAIL" : numberValue(summary.WARN) > 0 ? "WARN" : "PASS",
    PASS: numberValue(summary.PASS),
    WARN: numberValue(summary.WARN),
    FAIL: numberValue(summary.FAIL),
    MANUAL_CHECK_REQUIRED: numberValue(summary.MANUAL_CHECK_REQUIRED)
  };
  addCheck(
    checks,
    "domain_audit",
    result.FAIL > 0 ? "FAIL" : result.WARN > 0 || result.MANUAL_CHECK_REQUIRED > 0 ? "WARN" : "PASS",
    `Domain audit summary PASS=${result.PASS} WARN=${result.WARN} FAIL=${result.FAIL} MANUAL=${result.MANUAL_CHECK_REQUIRED}.`
  );
  return result;
}

async function inspectDiscovery(
  publicRoot: string,
  index: Record<string, JsonValue>,
  checks: AdoptionStatusCheck[]
): Promise<AdoptionStatusReport["discovery"]> {
  const beacon = await pathExists(join(publicRoot, ".well-known", "organchor.json")) ? "PRESENT" : "NOT_INCLUDED";
  const robots = await pathExists(join(publicRoot, "robots.txt")) ? "PRESENT" : "NOT_INCLUDED";
  const sitemap = await pathExists(join(publicRoot, "sitemap.xml")) ? "PRESENT" : "NOT_INCLUDED";
  const directoryDiscovery = asRecord(index.directory_discovery).status === "PRESENT" ? "PRESENT" : "NOT_INCLUDED";
  addCheck(checks, "beacon_discovery", beacon === "PRESENT" ? "PASS" : "WARN", `${join(publicRoot, ".well-known", "organchor.json")}: ${beacon}.`);
  addCheck(checks, "crawler_hints", robots === "PRESENT" && sitemap === "PRESENT" ? "PASS" : "WARN", `robots.txt=${robots}; sitemap.xml=${sitemap}.`);
  return {
    beacon,
    robots,
    sitemap,
    directory_discovery: directoryDiscovery
  };
}

function knownGapsFor(options: {
  adoptionLevel: number;
  identity: AdoptionStatusReport["identity"];
  valueEvidence: AdoptionStatusReport["value_evidence"];
  carriers: AdoptionStatusReport["carriers"];
  domainAudit: AdoptionStatusReport["domain_audit"];
  discovery: AdoptionStatusReport["discovery"];
  checks: AdoptionStatusCheck[];
}): string[] {
  const gaps: string[] = [];
  if (options.identity.status !== "PASS") gaps.push("Identity verification from public verify artifacts does not pass.");
  if (options.discovery.beacon !== "PRESENT") gaps.push("Missing /.well-known/organchor.json Beacon discovery surface.");
  if (options.discovery.robots !== "PRESENT" || options.discovery.sitemap !== "PRESENT") gaps.push("Missing crawler-friendly robots.txt or sitemap.xml hints.");
  if (options.adoptionLevel >= 2 && !options.domainAudit) gaps.push("Domain audit report is not included.");
  if (options.domainAudit && options.domainAudit.FAIL > 0) gaps.push("Domain audit contains FAIL results.");
  if (options.adoptionLevel >= 3 && options.carriers.status !== "PRESENT") gaps.push("No IPFS, Arweave, OpenTimestamps, website, or other carrier receipts are visible.");
  if (options.adoptionLevel >= 3 && options.valueEvidence.status === "NOT_INCLUDED") gaps.push("Claims, evidence, or value continuity report are not included.");
  if (options.valueEvidence.status === "WARN") gaps.push("Value evidence exists but has unsupported claims or warnings.");
  return Array.from(new Set(gaps));
}

function adoptionStatus(
  identity: AdoptionStatusReport["identity"],
  knownGaps: string[],
  checks: AdoptionStatusCheck[]
): AdoptionStatus {
  if (identity.status !== "PASS" || checks.some((check) => check.status === "FAIL" && check.id !== "domain_audit")) return "BLOCKED";
  return knownGaps.length === 0 ? "READY" : "NEEDS_WORK";
}

function nextActions(
  identity: AdoptionStatusReport["identity"],
  knownGaps: string[],
  checks: AdoptionStatusCheck[]
): string[] {
  if (identity.status !== "PASS") {
    return ["Fix identity verification first: statement, signature, root authority, and verify index hashes must pass before publishing adoption claims."];
  }
  const actions = knownGaps.map((gap) => `Resolve: ${gap}`);
  if (checks.some((check) => check.status === "MANUAL_CHECK_REQUIRED")) {
    actions.push("Complete manual registrar, billing, custody, or provider checks and record the outcome.");
  }
  actions.push("Run organchor doctor <origin> after public deployment to verify the origin-facing Beacon and agent path.");
  return Array.from(new Set(actions));
}

function renderMarkdown(report: AdoptionStatusReport): string {
  return `# OrgAnchor Adoption Status

Status: ${report.status}
Date: ${report.generated_at}
Adoption level: Level ${report.adoption_level}

## Organization

- Name: ${report.organization.name ?? "unknown"}
- Display name: ${report.organization.display_name ?? "unknown"}

## Public URLs

- Verify URL: ${report.public_urls.verify_url ?? "not recorded"}
- Well-known URL: ${report.public_urls.well_known_url ?? "not recorded"}
- Verify index URL: ${report.public_urls.verify_index_url ?? "not recorded"}

## Identity

- Status: ${report.identity.status}
- Root authority hash: ${report.identity.root_authority_hash ?? "not available"}
- Statement hash: ${report.identity.statement_hash ?? "not available"}
- Signature hash: ${report.identity.signature_hash ?? "not available"}
- Root authority threshold: ${report.identity.root_authority_threshold ?? "not available"}
- Valid signatures: ${report.identity.valid_signature_count}/${report.identity.required_signature_count}

## Value Evidence

- Status: ${report.value_evidence.status}
- Claims: ${report.value_evidence.claims}
- Evidence: ${report.value_evidence.evidence}
- Value report: ${report.value_evidence.value_report}
- Unsupported claims: ${report.value_evidence.unsupported_claims ?? "not available"}

## Carriers

- Status: ${report.carriers.status}
- Receipt count: ${report.carriers.receipt_count}
- Providers: ${report.carriers.providers.length > 0 ? report.carriers.providers.join(", ") : "none"}

## Domain Audit

${report.domain_audit ? `- Status: ${report.domain_audit.status}
- PASS: ${report.domain_audit.PASS}
- WARN: ${report.domain_audit.WARN}
- FAIL: ${report.domain_audit.FAIL}
- MANUAL_CHECK_REQUIRED: ${report.domain_audit.MANUAL_CHECK_REQUIRED}` : "- Not included"}

## Discovery

- Beacon: ${report.discovery.beacon}
- robots.txt: ${report.discovery.robots}
- sitemap.xml: ${report.discovery.sitemap}
- Directory discovery: ${report.discovery.directory_discovery}

## Known Gaps

${report.known_gaps.length > 0 ? report.known_gaps.map((gap) => `- ${gap}`).join("\n") : "- None for the selected adoption level."}

## Next Actions

${report.next_actions.map((action) => `- ${action}`).join("\n")}

## Checks

${report.checks.map((check) => `- ${check.status}: ${check.id} - ${check.detail}`).join("\n")}

## Boundary

This adoption status report is not a trust decision, certification, ranking, or legal identity claim. The identity root is the organization's root authority. Final trust decisions belong to the external verifier or agent.
`;
}

function publicUrls(index: Record<string, JsonValue>, explicitOrigin: string): AdoptionStatusReport["public_urls"] {
  const agent = asRecord(index.agent_verification);
  const origin = explicitOrigin || originFromIndex(index);
  return {
    verify_url: origin ? new URL(stringValue(agent.artifact_base_path) || "/verify/", `${origin}/`).toString() : null,
    well_known_url: origin ? new URL("/.well-known/organchor.json", `${origin}/`).toString() : null,
    verify_index_url: origin ? new URL("organchor.json", new URL(stringValue(agent.artifact_base_path) || "/verify/", `${origin}/`)).toString() : null
  };
}

function originFromIndex(index: Record<string, JsonValue>): string {
  const organization = asRecord(index.organization);
  const endpoints = asRecord(index.official_endpoints);
  const website = stringValue(endpoints.website);
  if (website) return new URL(website).origin;
  const statement = asRecord(index.statement);
  const path = stringValue(statement.path);
  if (/^https?:\/\//.test(path)) return new URL(path).origin;
  const visibleOrigin = stringValue(organization.url);
  return visibleOrigin ? new URL(visibleOrigin).origin : "";
}

function emptyIdentity(status: "FAIL" | "NOT_INCLUDED" = "NOT_INCLUDED"): AdoptionStatusReport["identity"] {
  return {
    status,
    root_authority_hash: null,
    statement_hash: null,
    signature_hash: null,
    root_authority_threshold: null,
    valid_signature_count: 0,
    required_signature_count: 0
  };
}

function addCheck(checks: AdoptionStatusCheck[], id: string, status: CheckStatus, detail: string): void {
  checks.push({ id, status, detail });
}

function parseAdoptionLevel(value: string | boolean | undefined): number {
  if (value === undefined || value === false) return 3;
  if (typeof value !== "string") throw new Error("--level must be an integer from 1 to 5");
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) throw new Error("--level must be an integer from 1 to 5");
  return parsed;
}

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function numberValue(value: JsonValue | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function numberOrNull(value: JsonValue | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
