#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const repoRoot = resolve(process.cwd());
const tscPath = join(repoRoot, "node_modules", "typescript", "bin", "tsc");
const cliPath = join(repoRoot, "dist", "cli.js");

if (!existsSync(tscPath)) {
  throw new Error("Missing local TypeScript compiler. Run dependency installation before release smoke.");
}

run(process.execPath, [tscPath, "-p", "tsconfig.build.json"], repoRoot);

if (!existsSync(cliPath)) {
  throw new Error("Build did not produce dist/cli.js");
}

const firstLine = readFileSync(cliPath, "utf8").split(/\r?\n/, 1)[0];
if (firstLine !== "#!/usr/bin/env node") {
  throw new Error("dist/cli.js is missing the Node shebang");
}

const workspace = mkdtempSync(join(tmpdir(), "organchor-release-smoke-"));
try {
  writeFileSync(join(workspace, "README.md"), "# Example Evidence\n\nRelease smoke evidence artifact.\n", "utf8");

  organchor(workspace, ["init"]);
  organchor(workspace, ["key", "generate", "--id", "root-a-2026"]);
  organchor(workspace, ["key", "generate", "--id", "root-b-2026"]);
  organchor(workspace, ["key", "generate", "--id", "root-c-2026"]);
  organchor(workspace, [
    "authority",
    "create",
    "--keys",
    "keys/root-a-2026.private.json,keys/root-b-2026.private.json,keys/root-c-2026.private.json",
    "--threshold",
    "2",
    "--out",
    "root-authority.json"
  ]);
  organchor(workspace, ["authority", "verify", "--authority", "root-authority.json"]);

  organchor(workspace, [
    "statement",
    "create",
    "--config",
    "organchor.config.json",
    "--authority",
    "root-authority.json",
    "--out",
    "statements/official-endpoints.json"
  ]);
  organchor(workspace, [
    "statement",
    "sign",
    "--key",
    "keys/root-a-2026.private.json",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json",
    "--out",
    "statements/official-endpoints.json.sig"
  ]);
  organchor(workspace, [
    "statement",
    "sign",
    "--key",
    "keys/root-b-2026.private.json",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json",
    "--out",
    "statements/official-endpoints.json.sig",
    "--append"
  ]);
  const statementVerify = organchor(workspace, [
    "statement",
    "verify",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json",
    "--sig",
    "statements/official-endpoints.json.sig"
  ]);
  const authorityHash = requireMatch(statementVerify.stdout, /Authority hash: (sha256:[0-9a-f]{64})/, "authority hash");

  organchor(workspace, ["claims", "create", "--config", "organchor.config.json"]);
  organchor(workspace, ["evidence", "create", "--config", "organchor.config.json"]);
  organchor(workspace, ["evidence", "add", "--file", "README.md", "--id", "evidence-001"]);
  organchor(workspace, ["claims", "sign", "--key", "keys/root-a-2026.private.json", "--authority", "root-authority.json"]);
  organchor(workspace, [
    "claims",
    "sign",
    "--key",
    "keys/root-b-2026.private.json",
    "--authority",
    "root-authority.json",
    "--append"
  ]);
  organchor(workspace, ["evidence", "sign", "--key", "keys/root-a-2026.private.json", "--authority", "root-authority.json"]);
  organchor(workspace, [
    "evidence",
    "sign",
    "--key",
    "keys/root-b-2026.private.json",
    "--authority",
    "root-authority.json",
    "--append"
  ]);
  organchor(workspace, [
    "evidence",
    "verify",
    "--authority",
    "root-authority.json",
    "--in",
    "evidence/evidence-manifest.json",
    "--sig",
    "evidence/evidence-manifest.json.sig"
  ]);
  organchor(workspace, [
    "claims",
    "verify",
    "--authority",
    "root-authority.json",
    "--in",
    "claims/product-claims.json",
    "--sig",
    "claims/product-claims.json.sig",
    "--evidence",
    "evidence/evidence-manifest.json"
  ]);
  const valueAudit = organchor(workspace, [
    "value",
    "audit",
    "--claims",
    "claims/product-claims.json",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--check-files"
  ]);
  if (!valueAudit.stdout.includes("Value continuity audit complete")) {
    throw new Error(`value audit did not complete:\n${valueAudit.stdout}`);
  }
  const valueReport = JSON.parse(readFileSync(join(workspace, "reports", "value-continuity-report.json"), "utf8"));
  assertEqual(valueReport.summary.FAIL, 0, "value audit FAIL count");
  assertEqual(valueReport.summary.evidence_linked_claims, 1, "value audit evidence_linked_claims");

  organchor(workspace, [
    "page",
    "generate",
    "--statement",
    "statements/official-endpoints.json",
    "--sig",
    "statements/official-endpoints.json.sig",
    "--authority",
    "root-authority.json",
    "--claims",
    "claims/product-claims.json",
    "--claims-sig",
    "claims/product-claims.json.sig",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--evidence-sig",
    "evidence/evidence-manifest.json.sig",
    "--out",
    "public/verify"
  ]);
  organchor(workspace, [
    "statement",
    "verify",
    "--authority",
    "public/verify/root-authority.json",
    "--expected-authority-hash",
    authorityHash,
    "--in",
    "public/verify/official-endpoints.json",
    "--sig",
    "public/verify/official-endpoints.json.sig"
  ]);

  const index = JSON.parse(readFileSync(join(workspace, "public", "verify", "organchor.json"), "utf8"));
  assertEqual(index.visible_proof?.status, "PASS", "visible_proof.status");
  assertEqual(index.agent_verification?.contract_version, "1.0", "agent_verification.contract_version");
  assertEqual(index.agent_verification?.artifact_base_path, "/verify/", "agent_verification.artifact_base_path");
  assertEqual(
    index.agent_verification?.compact_result_type,
    "OrgAnchorAgentVerificationCompactResult",
    "agent_verification.compact_result_type"
  );
  assertEqual(
    index.agent_verification?.summary?.preferred_first_pass,
    "compact",
    "agent_verification.summary.preferred_first_pass"
  );
  assertEqual(index.root_continuity?.status, "CURRENT_ROOT_ONLY", "root_continuity.status");
  assertEqual(index.value_continuity?.status, "PRESENT", "value_continuity.status");
  assertEqual(index.value_continuity?.summary?.evidence_linked_claims, 1, "value_continuity.summary.evidence_linked_claims");
  assertEqual(index.root_authority?.threshold?.required, 2, "root_authority.threshold.required");
  assertEqual(index.root_authority?.threshold?.total, 3, "root_authority.threshold.total");

  const html = readFileSync(join(workspace, "public", "verify", "index.html"), "utf8");
  if (!html.includes("Visible Proof Trail")) throw new Error("verify page missing Visible Proof Trail");
  if (!html.includes("Root Continuity")) throw new Error("verify page missing Root Continuity");
  if (!html.includes("Value Continuity")) throw new Error("verify page missing Value Continuity");
  if (html.includes("OrgAnchorPrivateKey")) throw new Error("verify page appears to contain private key material");

  organchor(workspace, ["mirror", "ipfs", "publish", "--dir", "public/verify", "--dry-run"]);
  organchor(workspace, [
    "archive",
    "arweave",
    "publish",
    "--statement",
    "statements/official-endpoints.json",
    "--sig",
    "statements/official-endpoints.json.sig",
    "--authority",
    "root-authority.json",
    "--claims",
    "claims/product-claims.json",
    "--claims-sig",
    "claims/product-claims.json.sig",
    "--evidence",
    "evidence/evidence-manifest.json",
    "--evidence-sig",
    "evidence/evidence-manifest.json.sig"
  ]);

  if (!existsSync(join(workspace, "organchor.lock.json"))) throw new Error("release smoke did not create organchor.lock.json");
  if (!existsSync(join(workspace, "arweave-manifest.json"))) throw new Error("release smoke did not create arweave-manifest.json");

  const publicFiles = collectFiles(join(workspace, "public"));
  for (const file of publicFiles) {
    if (file.endsWith(".private.json")) throw new Error(`private key file leaked into public output: ${file}`);
    const text = readFileSync(file, "utf8");
    if (text.includes("OrgAnchorPrivateKey")) throw new Error(`private key material leaked into public output: ${file}`);
  }

  console.log("Release smoke PASS");
  console.log(`Workspace: ${workspace}`);
  console.log(`Authority hash: ${authorityHash}`);
  console.log(`Visible proof: ${index.visible_proof.status}`);
  console.log(`Root continuity: ${index.root_continuity.status}`);
} finally {
  const resolved = resolve(workspace);
  const tempRoot = resolve(tmpdir());
  if (resolved.startsWith(tempRoot)) {
    rmSync(resolved, { recursive: true, force: true });
  }
}

function organchor(cwd, args) {
  return run(process.execPath, [cliPath, ...args], cwd);
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

function requireMatch(text, pattern, label) {
  const match = text.match(pattern);
  if (!match?.[1]) throw new Error(`Missing ${label} in output:\n${text}`);
  return match[1];
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      files.push(...collectFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}
