import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsRoot = resolve(root, "docs");
const activeAreas = [
  "project",
  "protocol",
  "guides",
  "operations",
  "evaluations",
  "outreach"
];
const requiredAreas = [...activeAreas, "history", "adr", "assets"];
const allowedRootMarkdown = new Set([
  "README.md",
  "DOCS_INDEX.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md"
]);
const ignoredDirectories = new Set([".git", "node_modules", "dist", "outputs"]);
const errors = [];
const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
const packageId = `organchor@${packageJson.version}`;

for (const entry of readdirSync(root, { withFileTypes: true })) {
  if (!entry.isFile() || extname(entry.name).toLowerCase() !== ".md") continue;
  if (!allowedRootMarkdown.has(entry.name)) {
    errors.push(`Unexpected root Markdown file: ${entry.name}`);
  }
}

for (const area of requiredAreas) {
  if (!existsSync(resolve(docsRoot, area))) {
    errors.push(`Missing documentation area: docs/${area}`);
  }
}

for (const area of activeAreas) {
  const areaRoot = resolve(docsRoot, area);
  for (const file of collectMarkdown(areaRoot)) {
    if (file.endsWith("README.md")) continue;
    const head = readFileSync(file, "utf8").split(/\r?\n/).slice(0, 24).join("\n");
    if (!/^Status:/m.test(head)) {
      errors.push(`Active document has no Status line: ${toRepoPath(file)}`);
    }
  }
}

const historyRoot = resolve(docsRoot, "history");
for (const file of collectMarkdown(historyRoot)) {
  if (file.endsWith("README.md")) continue;
  const head = readFileSync(file, "utf8").split(/\r?\n/).slice(0, 24).join("\n");
  if (!/^Status: Historical record\./m.test(head)) {
    errors.push(`Historical document lacks archival status: ${toRepoPath(file)}`);
  }
}

let checkedLinks = 0;
for (const file of collectMarkdown(root)) {
  const text = readFileSync(file, "utf8");
  for (const match of text.matchAll(/(\]\()([^\s)]+)(\))/g)) {
    checkLocalTarget(file, match[2]);
  }
  for (const match of text.matchAll(/^(\s*\[[^\]]+\]:\s*)([^\s]+)(.*)$/gm)) {
    checkLocalTarget(file, match[2]);
  }

  if (!file.startsWith(`${historyRoot}\\`) && text.includes("E:\\CivX\\OrgAnchor-self-pilot")) {
    errors.push(`Active document contains retired local self-pilot path: ${toRepoPath(file)}`);
  }
}

checkRequiredText("README.md", packageId);
checkRequiredText("README.md", "docs/project/QUALITY_ASSURANCE_STATUS.md");
checkRequiredText("docs/project/IMPLEMENTATION_STATUS.md", packageId);
checkRequiredText("docs/project/QUALITY_ASSURANCE_STATUS.md", packageId);
checkRequiredText("docs/project/QUALITY_ASSURANCE_STATUS.md", "ALPHA_REVIEW_READY");
checkRequiredText(
  "docs/project/QUALITY_ASSURANCE_STATUS.md",
  "PRODUCTION_IDENTITY_ASSURANCE_NOT_ESTABLISHED"
);
checkRequiredText("docs/operations/V1_RELEASE_CHECKLIST.md", packageId);
checkRequiredText("docs/operations/V1_RELEASE_CHECKLIST.md", `v${packageJson.version}`);
checkRequiredText("docs/project/IMPLEMENTATION_STATUS.md", "Stable v1: NOT_RELEASED");
checkRequiredText(
  "docs/project/IMPLEMENTATION_STATUS.md",
  "Broad external organization pilot: NOT_COMPLETED"
);
checkRequiredText(
  "docs/project/IMPLEMENTATION_STATUS.md",
  "Broad internet discovery coverage: NOT_IMPLEMENTED"
);
checkRequiredText(
  "docs/project/ARCHITECTURE.md",
  "does not by itself provide global discovery coverage"
);
checkRequiredText(
  "docs/protocol/ORGANCHOR_BEACON.md",
  "It does not guarantee that an unlinked"
);
checkRequiredText(
  "docs/protocol/DIRECTORY_MODEL.md",
  "Bounded alpha tooling implemented"
);
checkRequiredText(
  "docs/outreach/PUBLIC_EXPLAINER.md",
  "accepted design direction, not a current"
);
checkForbiddenText("docs/project/ROADMAP.md", "Stage 6 / Post-v1");
checkForbiddenText("docs/project/ROADMAP.md", "longer post-v1 discovery frontier");
checkForbiddenText("README.md", "making every adopter natively discoverable");
checkForbiddenText(
  "docs/evaluations/EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md",
  "Fresh-context independent Agent results have not yet been collected"
);

if (existsSync(resolve(root, "docs", "operations", "MVP_LAUNCH_CHECKLIST.md"))) {
  errors.push("Completed version-specific MVP launch checklist must not remain in active operations");
}
if (!existsSync(resolve(root, "docs", "history", "MVP_LAUNCH_CHECKLIST_0.1.0-alpha.3.md"))) {
  errors.push("Missing archived alpha.3 MVP launch checklist");
}

if (errors.length > 0) {
  console.error(`Documentation audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Documentation audit passed: ${allowedRootMarkdown.size} root entry documents, ` +
      `${activeAreas.length} active areas, ${checkedLinks} local links checked.`
  );
}

function collectMarkdown(directory) {
  if (!existsSync(directory)) return [];
  const result = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...collectMarkdown(path));
    if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") result.push(path);
  }
  return result;
}

function checkLocalTarget(sourceFile, target) {
  if (/^(?:https?:|mailto:|#|data:)/i.test(target)) return;
  const clean = target.split("#")[0].split("?")[0];
  if (!clean || clean.includes("{") || clean.includes("<")) return;
  checkedLinks += 1;
  const resolved = resolve(dirname(sourceFile), clean.replaceAll("/", "\\"));
  if (!existsSync(resolved)) {
    errors.push(`Broken link in ${toRepoPath(sourceFile)}: ${target}`);
  }
}

function toRepoPath(path) {
  return relative(root, path).replaceAll("\\", "/");
}

function checkRequiredText(repoPath, expected) {
  const file = resolve(root, repoPath.replaceAll("/", "\\"));
  if (!existsSync(file) || !readFileSync(file, "utf8").includes(expected)) {
    errors.push(`${repoPath} is missing required current-state text: ${expected}`);
  }
}

function checkForbiddenText(repoPath, forbidden) {
  const file = resolve(root, repoPath.replaceAll("/", "\\"));
  if (existsSync(file) && readFileSync(file, "utf8").includes(forbidden)) {
    errors.push(`${repoPath} contains retired current-state text: ${forbidden}`);
  }
}
