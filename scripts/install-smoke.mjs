#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import {
  chmodSync,
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
import { delimiter, isAbsolute, join, relative as pathRelative, resolve } from "node:path";

const repoRoot = resolve(process.cwd());
const packageJson = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const packageFiles = packageJson.files ?? [];
const packageIncludes = packageFiles.filter((entry) => !entry.startsWith("!"));
const packageExclusions = packageFiles
  .filter((entry) => entry.startsWith("!"))
  .map((entry) => entry.slice(1).replace(/\/$/, ""));
const tscPath = join(repoRoot, "node_modules", "typescript", "bin", "tsc");

if (!existsSync(tscPath)) {
  throw new Error("Missing local TypeScript compiler. Run dependency installation before install smoke.");
}

run(process.execPath, [tscPath, "-p", "tsconfig.build.json"], repoRoot);

const workspace = mkdtempSync(join(tmpdir(), "organchor-install-smoke-"));
const packageDir = join(workspace, "node_modules", "organchor");
const binDir = join(workspace, "node_modules", ".bin");
const installWorkspace = join(workspace, "fresh-workspace");

try {
  mkdirSync(packageDir, { recursive: true });
  mkdirSync(binDir, { recursive: true });
  mkdirSync(installWorkspace, { recursive: true });

  copyRequiredFile("package.json");
  copyRequiredFile("LICENSE");
  for (const entry of packageIncludes) {
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
  for (const entry of packageExclusions) {
    removeExcludedEntry(entry);
  }

  const binPath = createBinShim();
  const env = {
    ...process.env,
    PATH: `${binDir}${delimiter}${process.env.PATH ?? ""}`
  };

  const help = runInstalled(binPath, ["--help"], workspace, env);
  if (!help.stdout.includes("organchor init")) {
    throw new Error("installed CLI help does not contain organchor init");
  }

  runInstalled(binPath, ["init"], installWorkspace, env);
  runInstalled(binPath, ["key", "generate", "--id", "root-2026"], installWorkspace, env);
  runInstalled(binPath, ["authority", "create", "--key", "keys/root-2026.private.json"], installWorkspace, env);
  runInstalled(binPath, [
    "statement",
    "create",
    "--config",
    "organchor.config.json",
    "--authority",
    "root-authority.json",
    "--out",
    "statements/official-endpoints.json"
  ], installWorkspace, env);
  runInstalled(binPath, [
    "statement",
    "sign",
    "--key",
    "keys/root-2026.private.json",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json",
    "--out",
    "statements/official-endpoints.json.sig"
  ], installWorkspace, env);
  const verify = runInstalled(binPath, [
    "statement",
    "verify",
    "--authority",
    "root-authority.json",
    "--in",
    "statements/official-endpoints.json",
    "--sig",
    "statements/official-endpoints.json.sig"
  ], installWorkspace, env);
  if (!verify.stdout.includes("PASS")) {
    throw new Error(`installed CLI statement verification did not pass:\n${verify.stdout}`);
  }
  const authorityHash = requireMatch(verify.stdout, /Authority hash: (sha256:[0-9a-f]{64})/, "authority hash");

  runInstalled(binPath, [
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
  ], installWorkspace, env);
  runInstalled(binPath, [
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
  ], installWorkspace, env);

  const index = JSON.parse(readFileSync(join(installWorkspace, "public", "verify", "organchor.json"), "utf8"));
  assertEqual(index.visible_proof?.status, "PASS", "visible_proof.status");
  assertEqual(index.root_continuity?.status, "CURRENT_ROOT_ONLY", "root_continuity.status");

  const evaluationScript = join(packageDir, "scripts", "evidence-interpretation-evaluation.mjs");
  const evaluationOut = join(workspace, "evidence-interpretation-evaluation");
  const evaluationBuild = run(
    process.execPath,
    [evaluationScript, "build", "--out", evaluationOut],
    packageDir,
    env
  );
  if (!evaluationBuild.stdout.includes("scenario build PASS")) {
    throw new Error(`installed evidence evaluation build did not pass:\n${evaluationBuild.stdout}`);
  }
  const evaluationScore = run(
    process.execPath,
    [
      evaluationScript,
      "score",
      "--submission",
      join(packageDir, "examples", "evidence-interpretation-adversarial", "submission.reference.json")
    ],
    packageDir,
    env
  );
  const scoreReport = JSON.parse(evaluationScore.stdout);
  assertEqual(scoreReport.status, "SAFE_AND_USEFUL", "evidence evaluation reference status");
  assertEqual(scoreReport.numeric_score, 100, "evidence evaluation reference score");

  console.log("Install smoke PASS");
  console.log(`Installed package: ${packageDir}`);
  console.log(`Bin shim: ${binPath}`);
  console.log(`Authority hash: ${authorityHash}`);
} finally {
  const resolved = resolve(workspace);
  const tempRoot = resolve(tmpdir());
  if (resolved.startsWith(tempRoot)) {
    rmSync(resolved, { recursive: true, force: true });
  }
}

function createBinShim() {
  const cliRelative = join("..", "organchor", "dist", "cli.js");
  if (process.platform === "win32") {
    const cmdPath = join(binDir, "organchor.cmd");
    writeFileSync(cmdPath, `@echo off\r\nnode "%~dp0\\${cliRelative}" %*\r\n`, "utf8");
    return cmdPath;
  }

  const shimPath = join(binDir, "organchor");
  writeFileSync(
    shimPath,
    `#!/usr/bin/env sh\nbasedir=$(dirname "$0")\nexec node "$basedir/${cliRelative}" "$@"\n`,
    "utf8"
  );
  chmodSync(shimPath, 0o755);
  return shimPath;
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

function removeExcludedEntry(relative) {
  const root = resolve(packageDir);
  const target = resolve(root, relative);
  const relativeTarget = pathRelative(root, target);
  if (relativeTarget === "" || relativeTarget.startsWith("..") || isAbsolute(relativeTarget)) {
    throw new Error(`Package exclusion escapes package directory: ${relative}`);
  }
  rmSync(target, { recursive: true, force: true });
}

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with status ${result.status}\nerror:\n${result.error?.message ?? ""}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
    );
  }
  return result;
}

function runInstalled(binPath, args, cwd, env) {
  if (process.platform === "win32") {
    return run(process.execPath, [join(packageDir, "dist", "cli.js"), ...args], cwd, env);
  }
  return run(binPath, args, cwd, env);
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
