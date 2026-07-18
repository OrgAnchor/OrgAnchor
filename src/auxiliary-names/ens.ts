import { writeFile } from "node:fs/promises";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import { escapeMarkdownTableCell as escapePipes } from "../core/markdown.ts";
import { validateOfficialStatement } from "../core/validate.ts";
import { ensureDir, writeJsonFile } from "../core/files.ts";

export interface EnsTextRecordPlan {
  key: string;
  value: string;
  reason: string;
}

export interface EnsPlan {
  type: "OrgAnchorEnsPlan";
  version: "1.0";
  ens_name: string;
  generated_at: string;
  role: "auxiliary_name";
  identity_root_warning: string;
  statement_hash: string;
  root_authority_hash: string;
  recommended_text_records: EnsTextRecordPlan[];
  recommended_contenthash: {
    value: string | null;
    reason: string;
  };
  manual_steps: string[];
}

export interface EnsRecordsSnapshot {
  text_records?: Record<string, string>;
  contenthash?: string | null;
}

export interface EnsVerificationReport {
  type: "OrgAnchorEnsVerificationReport";
  version: "1.0";
  ens_name: string;
  verified_at: string;
  status: "PASS" | "FAIL";
  checks: Array<{
    id: string;
    status: "PASS" | "FAIL" | "WARN";
    summary: string;
    expected?: string | null;
    actual?: string | null;
  }>;
}

export async function createEnsPlanFromStatementFile(
  ensName: string,
  statementPath: string,
  options: { ipfsCid?: string; generatedAt?: Date } = {}
): Promise<EnsPlan> {
  const statement = validateOfficialStatement(await readJsonFile(statementPath));
  return createEnsPlan(ensName, statement, options);
}

export function createEnsPlan(
  ensNameInput: string,
  statement: JsonValue,
  options: { ipfsCid?: string; generatedAt?: Date } = {}
): EnsPlan {
  const ensName = normalizeEnsName(ensNameInput);
  const object = asObject(statement);
  const officialEndpoints = asObject(object.official_endpoints);
  const organization = asObject(object.organization);
  const statementHash = sha256CanonicalJson(statement);
  const rootAuthorityHash = asString(object.root_authority_hash, "root_authority_hash");
  const verifyUrl = optionalString(officialEndpoints.verify);
  const websiteUrl = optionalString(officialEndpoints.website);

  const textRecords: EnsTextRecordPlan[] = [];
  if (websiteUrl) {
    textRecords.push({
      key: "url",
      value: websiteUrl,
      reason: "Standard ENS website URL record for human discovery."
    });
  }
  if (verifyUrl) {
    textRecords.push({
      key: "organchor.verify",
      value: verifyUrl,
      reason: "OrgAnchor machine and human verification entry."
    });
    textRecords.push({
      key: "organchor.index",
      value: new URL("organchor.json", ensureTrailingSlash(verifyUrl)).toString(),
      reason: "Machine-readable OrgAnchor verify index."
    });
    textRecords.push({
      key: "organchor.statement",
      value: new URL("official-endpoints.json", ensureTrailingSlash(verifyUrl)).toString(),
      reason: "Signed official endpoint statement."
    });
  }
  textRecords.push({
    key: "organchor.statement.sha256",
    value: statementHash,
    reason: "Canonical SHA-256 hash of the signed endpoint statement."
  });
  textRecords.push({
    key: "organchor.root-authority.sha256",
    value: rootAuthorityHash,
    reason: "Expected OrgAnchor root authority hash. This anchors ENS as an auxiliary pointer only."
  });
  if (typeof organization.display_name === "string") {
    textRecords.push({
      key: "organchor.organization",
      value: organization.display_name,
      reason: "Human-readable organization display name from the signed statement."
    });
  }
  if (options.ipfsCid) {
    textRecords.push({
      key: "organchor.ipfs.verify-cid",
      value: options.ipfsCid,
      reason: "CID of the mirrored OrgAnchor verify directory."
    });
  }

  return {
    type: "OrgAnchorEnsPlan",
    version: "1.0",
    ens_name: ensName,
    generated_at: (options.generatedAt ?? new Date()).toISOString(),
    role: "auxiliary_name",
    identity_root_warning: "ENS is an auxiliary discovery name. OrgAnchor identity continuity remains rooted in the signed root authority.",
    statement_hash: statementHash,
    root_authority_hash: rootAuthorityHash,
    recommended_text_records: textRecords,
    recommended_contenthash: {
      value: options.ipfsCid ? `ipfs://${options.ipfsCid}` : null,
      reason: options.ipfsCid
        ? "Set ENS contenthash to the IPFS mirror only if the CID is pinned or otherwise expected to be retrievable."
        : "No IPFS CID was provided, so no contenthash recommendation is generated."
    },
    manual_steps: [
      "Review the ENS name owner and resolver before making changes.",
      "Set text records through the ENS app or a trusted wallet workflow.",
      "Set contenthash only after deciding the IPFS availability strategy.",
      "Re-run organchor ens verify after records are updated.",
      "Do not treat ENS ownership or resolver state as the OrgAnchor identity root."
    ]
  };
}

export async function writeEnsPlan(plan: EnsPlan, outputDir = "ens"): Promise<void> {
  await ensureDir(outputDir);
  await writeJsonFile(`${outputDir}/ens-plan.json`, plan as unknown as JsonValue);
  await writeFile(`${outputDir}/ens-plan.md`, renderEnsPlanMarkdown(plan), "utf8");
}

export function verifyEnsRecords(plan: EnsPlan, records: EnsRecordsSnapshot, verifiedAt = new Date()): EnsVerificationReport {
  const checks: EnsVerificationReport["checks"] = [];
  const actualText = records.text_records ?? {};

  for (const expected of plan.recommended_text_records) {
    const actual = actualText[expected.key] ?? null;
    checks.push({
      id: `text.${expected.key}`,
      status: actual === expected.value ? "PASS" : "FAIL",
      summary: actual === expected.value ? `${expected.key} matches.` : `${expected.key} does not match.`,
      expected: expected.value,
      actual
    });
  }

  if (plan.recommended_contenthash.value) {
    const actual = records.contenthash ?? null;
    checks.push({
      id: "contenthash",
      status: actual === plan.recommended_contenthash.value ? "PASS" : "FAIL",
      summary: actual === plan.recommended_contenthash.value ? "contenthash matches." : "contenthash does not match.",
      expected: plan.recommended_contenthash.value,
      actual
    });
  } else {
    checks.push({
      id: "contenthash",
      status: "WARN",
      summary: "No contenthash recommendation was generated.",
      expected: null,
      actual: records.contenthash ?? null
    });
  }

  const status = checks.some((check) => check.status === "FAIL") ? "FAIL" : "PASS";
  return {
    type: "OrgAnchorEnsVerificationReport",
    version: "1.0",
    ens_name: plan.ens_name,
    verified_at: verifiedAt.toISOString(),
    status,
    checks
  };
}

export function renderEnsPlanMarkdown(plan: EnsPlan): string {
  const textRows = plan.recommended_text_records
    .map((record) => `| \`${record.key}\` | \`${escapePipes(record.value)}\` | ${escapePipes(record.reason)} |`)
    .join("\n");

  return `# ENS Plan

ENS name: \`${plan.ens_name}\`

Statement hash: \`${plan.statement_hash}\`

Root authority hash: \`${plan.root_authority_hash}\`

ENS is an auxiliary discovery name. It is not the OrgAnchor identity root.

## Text Records

| Key | Value | Reason |
| --- | --- | --- |
${textRows}

## Contenthash

Recommended value: \`${plan.recommended_contenthash.value ?? "none"}\`

${plan.recommended_contenthash.reason}

## Manual Steps

${plan.manual_steps.map((step) => `- ${step}`).join("\n")}
`;
}

export function renderEnsVerificationMarkdown(report: EnsVerificationReport): string {
  const rows = report.checks
    .map((check) => `| ${check.status} | \`${check.id}\` | ${escapePipes(check.summary)} |`)
    .join("\n");
  return `# ENS Verification Report

ENS name: \`${report.ens_name}\`

Status: \`${report.status}\`

Verified at: \`${report.verified_at}\`

| Status | Check | Summary |
| --- | --- | --- |
${rows}
`;
}

export function normalizeEnsName(input: string): string {
  const name = input.trim().toLowerCase().replace(/\.$/, "");
  if (!/^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(name)) {
    throw new Error("ENS name must be a lowercase ASCII name such as example.eth for this v1 planner.");
  }
  return name;
}

export async function readEnsRecordsSnapshot(path: string): Promise<EnsRecordsSnapshot> {
  const value = await readJsonFile(path);
  const object = asObject(value);
  const textRecords = object.text_records === undefined ? undefined : asStringRecord(object.text_records, "text_records");
  const contenthash = object.contenthash === undefined || object.contenthash === null ? null : asString(object.contenthash, "contenthash");
  return {
    ...(textRecords !== undefined ? { text_records: textRecords } : {}),
    contenthash
  };
}

function asObject(value: JsonValue | undefined): Record<string, JsonValue> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Expected JSON object");
  }
  return value;
}

function asString(value: JsonValue | undefined, label: string): string {
  if (typeof value !== "string") {
    throw new Error(`Expected ${label} to be a string`);
  }
  return value;
}

function optionalString(value: JsonValue | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asStringRecord(value: JsonValue, label: string): Record<string, string> {
  const object = asObject(value);
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(object)) {
    if (typeof entry !== "string") {
      throw new Error(`Expected ${label}.${key} to be a string`);
    }
    result[key] = entry;
  }
  return result;
}

function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}
