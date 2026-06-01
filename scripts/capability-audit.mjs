#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, normalize, resolve } from "node:path";

const repoRoot = resolve(process.cwd());
const matrixPath = join(repoRoot, "CAPABILITY_TRACEABILITY_MATRIX.md");
const reportsDir = join(repoRoot, "reports");
const jsonReportPath = join(reportsDir, "capability-audit.json");
const markdownReportPath = join(reportsDir, "capability-audit.md");
const checkOnly = process.argv.includes("--check");
const sourceTestsAvailable = existsSync(join(repoRoot, "tests"));

const allowedStatuses = new Set([
  "IMPLEMENTED_AND_TESTED",
  "IMPLEMENTED_MANUAL_CHECK",
  "PARTIAL",
  "DESIGN_ONLY",
  "NOT_IMPLEMENTED"
]);

const rows = parseMatrix(readFileSync(matrixPath, "utf8"));
const findings = [];

for (const row of rows) {
  validateRow(row, findings);
}

const summary = summarize(rows, findings);
const report = {
  type: "OrgAnchorCapabilityAuditReport",
  version: "1.0",
  matrix: "CAPABILITY_TRACEABILITY_MATRIX.md",
  generated_at: new Date().toISOString(),
  summary,
  capabilities: rows,
  findings
};

if (!checkOnly) {
  mkdirSync(reportsDir, { recursive: true });
  writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  writeFileSync(markdownReportPath, renderMarkdown(report), "utf8");
}

if (findings.some((finding) => finding.severity === "ERROR")) {
  console.error(`Capability audit FAIL: ${summary.error_count} error(s), ${summary.warning_count} warning(s)`);
  if (!checkOnly) {
    console.error(`Wrote ${relative(jsonReportPath)} and ${relative(markdownReportPath)}`);
  }
  process.exit(1);
}

console.log(`Capability audit PASS: ${summary.total_capabilities} capabilities, ${summary.warning_count} warning(s)`);
if (!checkOnly) {
  console.log(`Wrote ${relative(jsonReportPath)}`);
  console.log(`Wrote ${relative(markdownReportPath)}`);
}

function parseMatrix(markdown) {
  const lines = markdown.split(/\r?\n/);
  const headerIndex = lines.findIndex((line) => line.startsWith("| Capability ID | Capability | Status |"));
  if (headerIndex === -1) throw new Error("Missing capability matrix table header");

  const header = splitTableRow(lines[headerIndex]);
  const rows = [];

  for (let index = headerIndex + 2; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line.startsWith("| ")) break;
    const cells = splitTableRow(line);
    if (cells.length !== header.length) {
      throw new Error(`Invalid table row at line ${index + 1}: expected ${header.length} cells, found ${cells.length}`);
    }
    rows.push(Object.fromEntries(header.map((key, cellIndex) => [key, cells[cellIndex]])));
  }

  if (rows.length === 0) throw new Error("Capability matrix contains no rows");
  return rows.map(normalizeRow);
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function normalizeRow(row) {
  return {
    capability_id: row["Capability ID"],
    capability: row.Capability,
    status: row.Status,
    fireseed_gate: row["Fireseed Gate"],
    docs: splitRefs(row.Docs),
    commands: splitRefs(row.Commands),
    tests: splitRefs(row.Tests),
    evidence_artifacts: splitRefs(row["Evidence Artifacts"]),
    known_limits: row["Known Limits"]
  };
}

function splitRefs(value) {
  if (!value || value.toLowerCase() === "none") return [];
  return value
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function validateRow(row, findings) {
  if (!/^OA-\d{3}$/.test(row.capability_id)) {
    addFinding(findings, "ERROR", row, "INVALID_ID", "Capability ID must match OA-001 style.");
  }
  if (!allowedStatuses.has(row.status)) {
    addFinding(findings, "ERROR", row, "INVALID_STATUS", `Unsupported status: ${row.status}`);
  }
  for (const doc of row.docs) {
    if (!pathExists(doc)) addFinding(findings, "ERROR", row, "MISSING_DOC", `Referenced document does not exist: ${doc}`);
  }
  for (const test of row.tests) {
    if (sourceTestsAvailable && !pathExists(test)) addFinding(findings, "ERROR", row, "MISSING_TEST", `Referenced test does not exist: ${test}`);
  }
  if (!sourceTestsAvailable && row.tests.length > 0) {
    addFinding(
      findings,
      "WARNING",
      row,
      "TESTS_NOT_PACKAGED",
      "Test references are retained in the matrix, but test files are not included in the npm package."
    );
  }
  for (const command of row.commands) {
    if (!isKnownCommandForm(command)) {
      addFinding(findings, "WARNING", row, "UNKNOWN_COMMAND_FORM", `Command has an unrecognized prefix: ${command}`);
    }
  }
  if (row.status === "IMPLEMENTED_AND_TESTED") {
    if (row.commands.length === 0) addFinding(findings, "ERROR", row, "MISSING_COMMAND", "Implemented-and-tested capability must name at least one command.");
    if (row.tests.length === 0) addFinding(findings, "ERROR", row, "MISSING_TEST_REF", "Implemented-and-tested capability must name at least one test.");
    if (row.evidence_artifacts.length === 0) {
      addFinding(findings, "ERROR", row, "MISSING_ARTIFACT", "Implemented-and-tested capability must name at least one evidence artifact.");
    }
  }
  if (["IMPLEMENTED_MANUAL_CHECK", "PARTIAL", "DESIGN_ONLY", "NOT_IMPLEMENTED"].includes(row.status)) {
    if (!row.known_limits || row.known_limits.toLowerCase() === "none") {
      addFinding(findings, "ERROR", row, "MISSING_LIMITS", `${row.status} capability must expose known limits.`);
    }
  }
  if (row.fireseed_gate === "Required" && ["DESIGN_ONLY", "NOT_IMPLEMENTED"].includes(row.status)) {
    addFinding(findings, "ERROR", row, "REQUIRED_NOT_IMPLEMENTED", "Fireseed-required capability cannot be design-only or not implemented.");
  }
  if (row.status === "DESIGN_ONLY" && row.commands.length > 0) {
    addFinding(findings, "WARNING", row, "DESIGN_ONLY_HAS_COMMAND", "Design-only capability names commands; verify the status is not understated.");
  }
}

function pathExists(path) {
  if (path.endsWith("/")) return existsSync(join(repoRoot, path));
  return existsSync(join(repoRoot, path));
}

function isKnownCommandForm(command) {
  return command.startsWith("organchor ") || command.startsWith("npm ") || command.startsWith("node ");
}

function addFinding(findings, severity, row, code, message) {
  findings.push({
    severity,
    code,
    capability_id: row.capability_id,
    capability: row.capability,
    message
  });
}

function summarize(rows, findings) {
  const byStatus = Object.fromEntries([...allowedStatuses].map((status) => [status, 0]));
  for (const row of rows) byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
  return {
    total_capabilities: rows.length,
    status_counts: byStatus,
    fireseed_required_count: rows.filter((row) => row.fireseed_gate === "Required").length,
    design_preview_count: rows.filter((row) => row.fireseed_gate === "Design Preview").length,
    future_or_post_fireseed_count: rows.filter((row) => ["Future", "Post-Fireseed"].includes(row.fireseed_gate)).length,
    error_count: findings.filter((finding) => finding.severity === "ERROR").length,
    warning_count: findings.filter((finding) => finding.severity === "WARNING").length
  };
}

function renderMarkdown(report) {
  const lines = [
    "# OrgAnchor Capability Audit Report",
    "",
    `Generated: ${report.generated_at}`,
    "",
    "## Summary",
    "",
    `- Total capabilities: ${report.summary.total_capabilities}`,
    `- Errors: ${report.summary.error_count}`,
    `- Warnings: ${report.summary.warning_count}`,
    `- Fireseed required: ${report.summary.fireseed_required_count}`,
    `- Design preview: ${report.summary.design_preview_count}`,
    `- Future or post-Fireseed: ${report.summary.future_or_post_fireseed_count}`,
    "",
    "## Status Counts",
    "",
    "| Status | Count |",
    "| --- | ---: |"
  ];

  for (const [status, count] of Object.entries(report.summary.status_counts)) {
    lines.push(`| ${status} | ${count} |`);
  }

  lines.push("", "## Findings", "");
  if (report.findings.length === 0) {
    lines.push("No findings.");
  } else {
    lines.push("| Severity | Code | Capability | Message |", "| --- | --- | --- | --- |");
    for (const finding of report.findings) {
      lines.push(
        `| ${finding.severity} | ${finding.code} | ${finding.capability_id} ${escapeCell(finding.capability)} | ${escapeCell(finding.message)} |`
      );
    }
  }

  lines.push("", "## Capability Status", "", "| Capability | Status | Fireseed Gate | Known Limits |", "| --- | --- | --- | --- |");
  for (const row of report.capabilities) {
    lines.push(`| ${row.capability_id} ${escapeCell(row.capability)} | ${row.status} | ${row.fireseed_gate} | ${escapeCell(row.known_limits)} |`);
  }

  return `${lines.join("\n")}\n`;
}

function escapeCell(value) {
  return String(value).replaceAll("|", "\\|");
}

function relative(path) {
  return normalize(path).slice(normalize(repoRoot).length + 1);
}
