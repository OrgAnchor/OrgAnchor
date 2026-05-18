import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { generateOnionConfig } from "../src/onion/config.ts";
import { validateOnionAddress } from "../src/onion/validate.ts";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");
const validV3 = `${"a".repeat(56)}.onion`;

test("onion v3 validation accepts v3 format and rejects v2 or malformed addresses", () => {
  assert.equal(validateOnionAddress(validV3).ok, true);
  assert.equal(validateOnionAddress(`http://${validV3}/verify/`).normalized, validV3);
  assert.equal(validateOnionAddress("abcdefghijklmnop.onion").ok, false);
  assert.equal(validateOnionAddress("not-an-onion.example.com").ok, false);
  assert.equal(validateOnionAddress(`${"a".repeat(55)}.onion`).ok, false);
});

test("onion config generate creates torrc guidance", () => {
  const plan = generateOnionConfig({
    onionAddress: validV3,
    hiddenServiceDir: "/var/lib/tor/organchor-test",
    target: "127.0.0.1:8080"
  });
  assert.match(plan.torrc, /HiddenServiceDir \/var\/lib\/tor\/organchor-test/);
  assert.match(plan.torrc, /HiddenServicePort 80 127\.0\.0\.1:8080/);
  assert.equal(plan.verify_url, `http://${validV3}/verify/`);
});

test("onion CLI writes config files and rejects invalid addresses", () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-onion-"));
  try {
    const generated = run(workspace, ["onion", "config", "generate", "--domain", validV3]);
    assert.match(generated.stdout, /Onion config generated/);
    assert.equal(existsSync(join(workspace, "onion", "torrc-snippet.txt")), true);
    assert.match(readFileSync(join(workspace, "onion", "onion-deployment.md"), "utf8"), /OrgAnchor does not run Tor/);

    const verify = run(workspace, ["onion", "verify", validV3]);
    assert.match(verify.stdout, /PASS/);

    const invalid = run(workspace, ["onion", "verify", "abcdefghijklmnop.onion"], 1);
    assert.match(invalid.stdout, /FAIL/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

function run(workspace: string, args: string[], expectedStatus = 0): { stdout: string; stderr: string } {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: workspace,
    encoding: "utf8"
  });
  assert.equal(
    result.status,
    expectedStatus,
    `organchor ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return {
    stdout: result.stdout,
    stderr: result.stderr
  };
}
