import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { scanPublicDirectory } from "../src/commands/safety-scan.ts";

test("public safety scan accepts public Ed25519 JWK material", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-safety-public-"));
  try {
    mkdirSync(join(workspace, "verify"), { recursive: true });
    writeFileSync(
      join(workspace, "verify", "root-authority.json"),
      JSON.stringify({ kty: "OKP", crv: "Ed25519", x: "public-material-is-not-a-secret" }),
      "utf8"
    );

    const report = await scanPublicDirectory(workspace);
    assert.equal(report.status, "PASS");
    assert.equal(report.files_scanned, 1);
    assert.deepEqual(report.findings, []);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("public safety scan rejects private key material without exposing its value", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-safety-private-"));
  const secret = "do-not-print-this-private-value";
  try {
    mkdirSync(join(workspace, "verify"), { recursive: true });
    writeFileSync(
      join(workspace, "verify", "root.private.json"),
      JSON.stringify({ type: "OrgAnchorPrivateKey", key_material: { jwk: { kty: "OKP", crv: "Ed25519", x: "public", d: secret } } }),
      "utf8"
    );

    const report = await scanPublicDirectory(workspace);
    assert.equal(report.status, "FAIL");
    assert.equal(report.findings.some((finding) => finding.code === "SENSITIVE_FILENAME"), true);
    assert.equal(report.findings.some((finding) => finding.code === "ORGANCHOR_PRIVATE_KEY"), true);
    assert.equal(report.findings.some((finding) => finding.code === "PRIVATE_JWK"), true);
    assert.equal(JSON.stringify(report).includes(secret), false);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test("public safety scan rejects common credential markers", async () => {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-safety-marker-"));
  try {
    writeFileSync(join(workspace, "notes.txt"), "-----BEGIN PRIVATE KEY-----\nredacted\n", "utf8");
    const report = await scanPublicDirectory(workspace);
    assert.equal(report.status, "FAIL");
    assert.equal(report.findings.some((finding) => finding.code === "PRIVATE_KEY_PEM"), true);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
