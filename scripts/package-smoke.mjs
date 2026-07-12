#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const repoRoot = resolve(process.cwd());
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const packageFiles = packageJson.files ?? [];
const tscPath = join(repoRoot, "node_modules", "typescript", "bin", "tsc");

if (!existsSync(tscPath)) {
  throw new Error("Missing local TypeScript compiler. Run dependency installation before package smoke.");
}

run(process.execPath, [tscPath, "-p", "tsconfig.build.json"], repoRoot);

const workspace = mkdtempSync(join(tmpdir(), "organchor-package-smoke-"));
const packageDir = join(workspace, "package");

try {
  mkdirSync(packageDir, { recursive: true });
  copyRequiredFile("package.json");
  copyRequiredFile("LICENSE");

  for (const entry of packageFiles) {
    if (entry === "*.md") {
      for (const file of readdirSync(repoRoot).filter((name) => name.endsWith(".md"))) {
        copyRequiredFile(file);
      }
      continue;
    }
    if (entry.endsWith("/")) {
      copyRequiredDirectory(entry.slice(0, -1));
      continue;
    }
    copyRequiredFile(entry);
  }

  const copiedFiles = collectFiles(packageDir);
  assertContains(copiedFiles, "package.json");
  assertContains(copiedFiles, "LICENSE");
  assertContains(copiedFiles, "README.md");
  assertContains(copiedFiles, "CAPABILITY_TRACEABILITY_MATRIX.md");
  assertContains(copiedFiles, "CAPABILITY_AUDIT_SCENARIOS.md");
  assertContains(copiedFiles, "VISIBLE_ACCEPTANCE.md");
  assertContains(copiedFiles, "VISIBLE_ACCEPTANCE_REVIEW_2026-06-01.md");
  assertContains(copiedFiles, "LANGUAGE_COMPATIBILITY.md");
  assertContains(copiedFiles, "CALL_FOR_FIRESEED_REVIEW.md");
  assertContains(copiedFiles, "CHANGELOG.md");
  assertContains(copiedFiles, "CONTRIBUTING.md");
  assertContains(copiedFiles, "DOCS_INDEX.md");
  assertContains(copiedFiles, "PUBLIC_EXPLAINER.md");
  assertContains(copiedFiles, "FIRESEED_VALIDATION_TRACKING_ISSUE.md");
  assertContains(copiedFiles, "FIRESEED_LAUNCH_DECISION_2026-06-01.md");
  assertContains(copiedFiles, "FIRESEED_ALPHA4_LOCAL_CONVERGENCE_2026-07-11.md");
  assertContains(copiedFiles, "FIRESEED_READINESS_GATE.md");
  assertContains(copiedFiles, "PROJECT_NORTH_STAR.md");
  assertContains(copiedFiles, "ARCHITECTURE.md");
  assertContains(copiedFiles, "IMPLEMENTATION_STATUS.md");
  assertContains(copiedFiles, "DISCOVERY_STRATEGY.md");
  assertContains(copiedFiles, "DIRECTORY_MODEL.md");
  assertContains(copiedFiles, "DIRECTORY_SNAPSHOT_SPEC.md");
  assertContains(copiedFiles, "PURPOSE_AND_VALUES.md");
  assertContains(copiedFiles, "ADOPTION_PRINCIPLES.md");
  assertContains(copiedFiles, "ADOPTION_GUIDE.md");
  assertContains(copiedFiles, "EXTERNAL_PILOT_RUNBOOK.md");
  assertContains(copiedFiles, "ROOT_AUTHORITY_CUSTODY_GUIDE.md");
  assertContains(copiedFiles, "MIGRATION_GUIDE.md");
  assertContains(copiedFiles, "PUBLISHING_GUIDE.md");
  assertContains(copiedFiles, "RELEASE_INTEGRITY.md");
  assertContains(copiedFiles, "SHOWCASE_POLICY.md");
  assertContains(copiedFiles, "VALUE_CONTINUITY_MODEL.md");
  assertContains(copiedFiles, "EVIDENCE_ONBOARDING_GUIDE.md");
  assertContains(copiedFiles, join("scripts", "agent-discovery-demo.mjs"));
  assertContains(copiedFiles, join("scripts", "capability-audit.mjs"));
  assertContains(copiedFiles, join("scripts", "capability-scenarios.mjs"));
  assertContains(copiedFiles, join("scripts", "visible-acceptance-demo.mjs"));
  assertContains(copiedFiles, join("dist", "cli.js"));
  assertContains(copiedFiles, join("examples", "agent-discovery-loop", "README.md"));
  assertContains(copiedFiles, join("examples", "agent-verification", "organchor-beacon-query-result.json"));
  assertContains(copiedFiles, join("examples", "complete", "root-authority.json"));
  assertContains(copiedFiles, join("examples", "directory", "directory-origins.json"));
  assertContains(copiedFiles, join("examples", "directory", "directory-snapshot.json"));
  assertContains(copiedFiles, join("examples", "complete", "statements", "official-endpoints.json"));
  assertContains(copiedFiles, join("examples", "complete", "statements", "official-endpoints.json.sig"));
  assertContains(copiedFiles, join("src", "schema", "directory-snapshot.schema.json"));
  assertContains(copiedFiles, join("src", "schema", "official-endpoints.schema.json"));
  assertNotContainsPrefix(copiedFiles, "public-assets/");

  const packageBytes = copiedFiles.reduce((total, file) => total + statSync(file).size, 0);
  const packageBudgetBytes = 4 * 1024 * 1024;
  if (packageBytes > packageBudgetBytes) {
    throw new Error(`Simulated package exceeds ${packageBudgetBytes} byte budget: ${packageBytes}`);
  }

  const forbiddenPatterns = [
    /(^|[\\/])node_modules([\\/]|$)/,
    /(^|[\\/])\.git([\\/]|$)/,
    /(^|[\\/])keys[\\/].*\.private\.json$/i,
    /\.local\./i,
    /cloudflare-credentials/i,
    /pinata-jwt/i,
    /arweave-wallet/i,
    /organchor-pages-public\.zip/i,
    /^CLOUDFLARE_.*\.md$/i,
    /^SELF_PILOT_.*\.md$/i,
    /^DOMAIN_CANDIDATE_REPORT\.md$/i,
    /^PILOT_PLAN\.md$/i,
    /^PROJECT_BRIEF\.md$/i,
    /^ROADMAP\.md$/i,
    /^V1_RELEASE_CHECKLIST\.md$/i
  ];
  for (const file of copiedFiles) {
    const relative = relativePath(packageDir, file);
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(relative)) {
        throw new Error(`Forbidden file included in package smoke: ${relative}`);
      }
    }
    const text = safeReadText(file);
    if (text && /"type"\s*:\s*"OrgAnchorPrivateKey"/.test(text)) {
      throw new Error(`Private key material marker included in package smoke: ${relative}`);
    }
  }

  const cliPath = join(packageDir, "dist", "cli.js");
  const firstLine = readFileSync(cliPath, "utf8").split(/\r?\n/, 1)[0];
  if (firstLine !== "#!/usr/bin/env node") {
    throw new Error("packaged dist/cli.js is missing the Node shebang");
  }

  const help = run(process.execPath, [cliPath, "--help"], packageDir);
  if (!help.stdout.includes("organchor init")) {
    throw new Error("packaged CLI help does not contain organchor init");
  }
  if (!help.stdout.includes("organchor adoption status")) {
    throw new Error("packaged CLI help does not contain organchor adoption status");
  }

  const demo = run(process.execPath, [join(packageDir, "scripts", "agent-discovery-demo.mjs"), "--cleanup"], packageDir);
  if (!demo.stdout.includes("Agent discovery demo PASS")) {
    throw new Error(`packaged agent discovery demo did not pass:\n${demo.stdout}`);
  }
  const visibleDemo = run(process.execPath, [join(packageDir, "scripts", "visible-acceptance-demo.mjs"), "--cleanup"], packageDir);
  if (!visibleDemo.stdout.includes("Visible acceptance demo PASS")) {
    throw new Error(`packaged visible acceptance demo did not pass:\n${visibleDemo.stdout}`);
  }
  const capabilityAudit = run(process.execPath, [join(packageDir, "scripts", "capability-audit.mjs"), "--check"], packageDir);
  if (!capabilityAudit.stdout.includes("Capability audit PASS")) {
    throw new Error(`packaged capability audit did not pass:\n${capabilityAudit.stdout}`);
  }
  const capabilityScenarios = run(process.execPath, [join(packageDir, "scripts", "capability-scenarios.mjs"), "--manifest-only"], packageDir);
  if (!capabilityScenarios.stdout.includes("Capability scenario manifest PASS")) {
    throw new Error(`packaged capability scenario manifest did not pass:\n${capabilityScenarios.stdout}`);
  }

  const exampleDir = join(packageDir, "examples", "complete");
  const verify = run(
    process.execPath,
    [
      cliPath,
      "statement",
      "verify",
      "--authority",
      "root-authority.json",
      "--expected-authority-hash",
      "sha256:12ce12a2a8e24a9c364aa56156cf182e1fd118463c63f59b1cf452a05f6effeb",
      "--in",
      "statements/official-endpoints.json",
      "--sig",
      "statements/official-endpoints.json.sig"
    ],
    exampleDir
  );
  if (!verify.stdout.includes("PASS")) {
    throw new Error(`packaged example verification did not pass:\n${verify.stdout}`);
  }

  const fresh = join(workspace, "fresh-workspace");
  mkdirSync(fresh);
  run(process.execPath, [cliPath, "init"], fresh);
  run(process.execPath, [cliPath, "key", "generate", "--id", "root-2026"], fresh);
  run(process.execPath, [cliPath, "authority", "create", "--key", "keys/root-2026.private.json"], fresh);
  run(process.execPath, [cliPath, "statement", "create", "--config", "organchor.config.json", "--authority", "root-authority.json"], fresh);
  run(process.execPath, [
    cliPath,
    "statement",
    "sign",
    "--key",
    "keys/root-2026.private.json",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json"
  ], fresh);
  const freshVerify = run(process.execPath, [
    cliPath,
    "statement",
    "verify",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json",
    "--sig",
    "statements/official-endpoints.json.sig"
  ], fresh);
  if (!freshVerify.stdout.includes("PASS")) {
    throw new Error(`fresh packaged Stage 1 flow did not pass:\n${freshVerify.stdout}`);
  }
  run(process.execPath, [
    cliPath,
    "page",
    "generate",
    "--statement",
    "statements/official-endpoints.json",
    "--sig",
    "statements/official-endpoints.json.sig",
    "--authority",
    "root-authority.json",
    "--out",
    "public/verify"
  ], fresh);
  const adoptionStatus = run(process.execPath, [
    cliPath,
    "adoption",
    "status",
    "--verify-dir",
    "public/verify",
    "--public-root",
    "public",
    "--origin",
    "https://example.org",
    "--level",
    "1"
  ], fresh);
  if (!adoptionStatus.stdout.includes('"status": "READY"')) {
    throw new Error(`fresh packaged adoption status did not pass:\n${adoptionStatus.stdout}`);
  }
  const originsPath = join(fresh, "directory-origins.json");
  const directoryAdd = run(process.execPath, [
    cliPath,
    "directory",
    "add",
    "--origins",
    originsPath,
    "--node-origin",
    "https://directory.example",
    "--origin",
    "https://candidate.example",
    "--category",
    "software",
    "--capability",
    "identity-continuity"
  ], fresh);
  if (!directoryAdd.stdout.includes("OrgAnchorDirectoryAddSummary")) {
    throw new Error(`fresh packaged Directory add did not pass:\n${directoryAdd.stdout}`);
  }

  console.log("Package smoke PASS");
  console.log(`Simulated package files: ${copiedFiles.length}`);
  console.log(`Simulated package bytes: ${packageBytes}`);
  console.log(`Package directory: ${packageDir}`);
} finally {
  const resolved = resolve(workspace);
  const tempRoot = resolve(tmpdir());
  if (resolved.startsWith(tempRoot)) {
    rmSync(resolved, { recursive: true, force: true });
  }
}

function copyRequiredFile(relative) {
  const source = join(repoRoot, relative);
  if (!existsSync(source) || !statSync(source).isFile()) {
    throw new Error(`Missing package file: ${relative}`);
  }
  const target = join(packageDir, relative);
  mkdirSync(join(target, ".."), { recursive: true });
  cpSync(source, target);
}

function copyRequiredDirectory(relative) {
  const source = join(repoRoot, relative);
  if (!existsSync(source) || !statSync(source).isDirectory()) {
    throw new Error(`Missing package directory: ${relative}`);
  }
  cpSync(source, join(packageDir, relative), { recursive: true });
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
  return result;
}

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...collectFiles(path));
    else files.push(path);
  }
  return files;
}

function assertContains(files, relative) {
  const normalized = relative.replaceAll("\\", "/");
  if (!files.some((file) => relativePath(packageDir, file).replaceAll("\\", "/") === normalized)) {
    throw new Error(`Simulated package is missing ${relative}`);
  }
}

function assertNotContainsPrefix(files, prefix) {
  const normalized = prefix.replaceAll("\\", "/");
  const match = files
    .map((file) => relativePath(packageDir, file).replaceAll("\\", "/"))
    .find((relative) => relative.startsWith(normalized));
  if (match) {
    throw new Error(`Simulated package unexpectedly includes ${match}`);
  }
}

function relativePath(root, file) {
  return file.slice(root.length + 1);
}

function safeReadText(file) {
  const size = statSync(file).size;
  if (size > 1024 * 1024) return "";
  const extension = basename(file).includes(".") ? basename(file).split(".").at(-1) : "";
  if (!["js", "json", "md", "txt", "html", "css", "ts", "map"].includes(extension ?? "")) return "";
  return readFileSync(file, "utf8");
}
