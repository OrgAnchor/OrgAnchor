import { dirname, isAbsolute, join } from "node:path";
import { writeBeaconDiscoverySurfaces } from "../beacon/surfaces.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile, type JsonValue } from "../core/json.ts";
import {
  asObject,
  requireLiteral,
  requireSha256Digest,
  validateOfficialStatement,
  validateRootAuthority,
  validateSignatureFile
} from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";
import type { OfficialEndpointsStatement } from "../types/artifacts.ts";

const INDEX_FILE = "organchor.json";
const STATEMENT_FILE = "official-endpoints.json";
const SIGNATURE_FILE = "official-endpoints.json.sig";
const AUTHORITY_FILE = "root-authority.json";

export async function beaconGenerateCommand(options: Record<string, string | boolean>): Promise<void> {
  const verifyDir = typeof options["verify-dir"] === "string"
    ? options["verify-dir"]
    : typeof options.dir === "string"
      ? options.dir
      : "public/verify";
  const publicRootDir = typeof options["out-public"] === "string"
    ? options["out-public"]
    : typeof options.out === "string"
      ? options.out
      : dirname(verifyDir);
  const indexPath = join(verifyDir, INDEX_FILE);
  const index = asObject(await readJsonFile(indexPath), "verify index");
  requireLiteral(index, "type", "OrgAnchorVerifyIndex", "verify index");
  requireLiteral(index, "version", "1.0", "verify index");

  const statementRef = asObject(index.statement ?? null, "verify index.statement");
  const signatureRef = asObject(index.signature ?? null, "verify index.signature");
  const authorityRef = asObject(index.root_authority ?? null, "verify index.root_authority");
  const statementPath = resolveVerifyPath(verifyDir, optionalString(statementRef.path) || STATEMENT_FILE);
  const signaturePath = resolveVerifyPath(verifyDir, optionalString(signatureRef.path) || SIGNATURE_FILE);
  const authorityPath = resolveVerifyPath(verifyDir, optionalString(authorityRef.path) || AUTHORITY_FILE);

  const statement = validateOfficialStatement(await readJsonFile(statementPath));
  const signature = validateSignatureFile(await readJsonFile(signaturePath));
  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  const statementHash = sha256CanonicalJson(statement);
  const signatureHash = sha256CanonicalJson(signature);
  const authorityHash = sha256CanonicalJson(authority);
  assertIndexHash(statementRef, "statement.hash", statementHash);
  assertIndexHash(signatureRef, "signature.hash", signatureHash);
  assertIndexHash(authorityRef, "root_authority.hash", authorityHash);

  if (statement.root_authority_hash !== authorityHash) {
    throw new Error("Statement root_authority_hash does not match authority file");
  }
  const verification = verifySignatureFile(statement, signature, authority);
  if (!verification.ok) {
    throw new Error(`Cannot generate Beacon surfaces for invalid verify package: ${verification.errors.join("; ")}`);
  }

  const generatedAt = typeof options["generated-at"] === "string" ? options["generated-at"] : new Date().toISOString();
  const origin = typeof options.origin === "string" ? options.origin : originFromStatement(statement);
  const artifactBasePath = typeof options["artifact-base-path"] === "string"
    ? options["artifact-base-path"]
    : artifactBasePathFromIndex(index) || "/verify/";
  await writeBeaconDiscoverySurfaces({
    publicRootDir,
    origin,
    artifactBasePath,
    organization: statement.organization as unknown as Record<string, JsonValue>,
    authorityHash,
    statementHash,
    generatedAt,
    valueContinuity: valueContinuityFromIndex(index),
    discovery: discoveryFromOptions(options)
  });

  console.log(JSON.stringify({
    type: "OrgAnchorBeaconGenerateSummary",
    version: "0.1",
    status: "PASS",
    verify_dir: verifyDir,
    public_root_dir: publicRootDir,
    origin: new URL(origin).origin,
    well_known: join(publicRootDir, ".well-known", INDEX_FILE),
    robots: join(publicRootDir, "robots.txt"),
    sitemap: join(publicRootDir, "sitemap.xml"),
    root_authority_hash: authorityHash,
    statement_hash: statementHash
  }, null, 2));
}

function resolveVerifyPath(verifyDir: string, path: string): string {
  return isAbsolute(path) ? path : join(verifyDir, path);
}

function assertIndexHash(ref: Record<string, JsonValue>, label: string, actual: string): void {
  const expected = requireSha256Digest(ref, label.split(".").at(-1) ?? "hash", label);
  if (expected !== actual) {
    throw new Error(`Verify index ${label} mismatch: expected ${expected}, got ${actual}`);
  }
}

function artifactBasePathFromIndex(index: Record<string, JsonValue>): string {
  const agentVerification = optionalRecord(index.agent_verification);
  return optionalString(agentVerification.artifact_base_path) || optionalString(agentVerification.verify_base_path);
}

function valueContinuityFromIndex(index: Record<string, JsonValue>): { status: string; summary: Record<string, JsonValue> } {
  const valueContinuity = optionalRecord(index.value_continuity);
  return {
    status: optionalString(valueContinuity.status) || "NOT_INCLUDED",
    summary: optionalRecord(valueContinuity.summary)
  };
}

function discoveryFromOptions(options: Record<string, string | boolean>): Record<string, JsonValue> {
  return {
    categories: parseListOption(options.category ?? options.categories, ["uncategorized"]),
    capabilities: parseListOption(options.capability ?? options.capabilities, ["identity-continuity"]),
    regions: parseListOption(options.region ?? options.regions, ["global"]),
    languages: parseListOption(options.language ?? options.languages, ["en"])
  };
}

function parseListOption(value: string | boolean | undefined, fallback: string[]): string[] {
  if (typeof value !== "string") return fallback;
  const values = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return values.length > 0 ? values : fallback;
}

function originFromStatement(statement: OfficialEndpointsStatement): string {
  const website = statement.official_endpoints.website;
  if (typeof website === "string" && website) return new URL(website).origin;
  const verify = statement.official_endpoints.verify;
  if (typeof verify === "string" && verify) return new URL(verify).origin;
  const primaryDomain = statement.domain_security.primary_domain;
  if (typeof primaryDomain === "string" && primaryDomain) return new URL(`https://${primaryDomain}`).origin;
  throw new Error("Cannot infer public origin for Beacon surfaces; pass --origin https://example.org");
}

function optionalRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function optionalString(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}
