#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = readJson("package.json");
const status = readJson("docs/project/quality-assurance-status.json");
const statusPage = readText("docs/project/QUALITY_ASSURANCE_STATUS.md");
const errors = [];

const allowedStatuses = new Set([
  "MACHINE_VERIFIED",
  "INTERNALLY_EVALUATED",
  "PUBLIC_RUN_PENDING",
  "EXTERNAL_VERIFICATION_PENDING",
  "NOT_COMPLETED",
  "OUT_OF_SCOPE"
]);

if (status.type !== "OrgAnchorQualityAssuranceStatus") {
  errors.push("quality status type must be OrgAnchorQualityAssuranceStatus");
}

const expectedPackage = `${packageJson.name}@${packageJson.version}`;
if (status.package !== expectedPackage) {
  errors.push(`quality status package must be ${expectedPackage}`);
}

if (status.release_decision?.status !== "ALPHA_REVIEW_READY") {
  errors.push("quality status must retain the bounded ALPHA_REVIEW_READY decision");
}

if (status.production_identity_assurance !== "NOT_ESTABLISHED") {
  errors.push("production identity assurance must remain NOT_ESTABLISHED until an explicit external gate changes it");
}

const coverage = status.automated_baseline?.coverage_thresholds;
const coverageScript = packageJson.scripts?.["test:coverage"] ?? "";
for (const [name, flag] of [
  ["lines", "--test-coverage-lines"],
  ["functions", "--test-coverage-functions"],
  ["branches", "--test-coverage-branches"]
]) {
  const value = coverage?.[name];
  if (!Number.isFinite(value) || !coverageScript.includes(`${flag}=${value}`)) {
    errors.push(`coverage threshold ${name} must match package.json test:coverage`);
  }
}

const requiredItems = new Set([
  "core-cryptographic-behavior",
  "cross-platform-ci",
  "test-coverage-gate",
  "package-and-install-smoke",
  "dependency-and-static-security",
  "independent-security-review",
  "external-organization-pilot",
  "real-world-transaction-cost-effect"
]);

for (const item of status.assurance_items ?? []) {
  requiredItems.delete(item.id);
  if (!allowedStatuses.has(item.status)) {
    errors.push(`unknown assurance status for ${item.id}: ${item.status}`);
  }
  if (!Array.isArray(item.evidence) || item.evidence.length === 0) {
    errors.push(`assurance item ${item.id} must expose at least one evidence or gap reference`);
  }
  for (const reference of item.evidence ?? []) {
    if (/^https:\/\//.test(reference)) continue;
    if (!existsSync(resolve(root, reference))) {
      errors.push(`assurance item ${item.id} references missing evidence: ${reference}`);
    }
  }
}

for (const missing of requiredItems) {
  errors.push(`missing required assurance item: ${missing}`);
}

for (const requiredText of [
  expectedPackage,
  "ALPHA_REVIEW_READY",
  "PRODUCTION_IDENTITY_ASSURANCE_NOT_ESTABLISHED",
  "An independent security and cryptographic review has not been completed"
]) {
  if (!statusPage.includes(requiredText)) {
    errors.push(`quality assurance status page is missing: ${requiredText}`);
  }
}

for (const workflow of [
  ".github/workflows/quality.yml",
  ".github/workflows/security.yml",
  ".github/dependabot.yml",
  ".github/SECURITY.md"
]) {
  if (!existsSync(resolve(root, workflow))) {
    errors.push(`missing quality baseline file: ${workflow}`);
  }
}

if (errors.length > 0) {
  console.error(`Quality assurance audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Quality assurance audit PASS: ${status.assurance_items.length} bounded assurance items checked.`);
}

function readText(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}
