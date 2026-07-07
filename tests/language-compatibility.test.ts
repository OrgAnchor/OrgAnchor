import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("language compatibility policy is package-facing and indexed", () => {
  const readme = readText("README.md");
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = JSON.parse(readText("package.json")) as { files?: string[] };

  assert.match(readme, /LANGUAGE_COMPATIBILITY\.md/);
  assert.match(readme, /VISIBLE_ACCEPTANCE_REVIEW_2026-06-01\.md/);
  assert.match(docsIndex, /LANGUAGE_COMPATIBILITY\.md/);
  assert.match(docsIndex, /VISIBLE_ACCEPTANCE_REVIEW_2026-06-01\.md/);
  assert.equal(packageJson.files?.includes("LANGUAGE_COMPATIBILITY.md"), true);
  assert.equal(packageJson.files?.includes("VISIBLE_ACCEPTANCE_REVIEW_2026-06-01.md"), true);
});

test("language policy keeps machine contract stable and human explanation localizable", () => {
  const policy = readText("LANGUAGE_COMPATIBILITY.md");
  const review = readText("VISIBLE_ACCEPTANCE_REVIEW_2026-06-01.md");
  const visible = readText("VISIBLE_ACCEPTANCE.md");

  for (const phrase of [
    "Machine contract stays stable",
    "Human explanation can be localized",
    "Localization must not create a different protocol",
    "status enums such as `PASS`, `WARN`, `FAIL`",
    "policy route codes such as `EXTERNAL_POLICY_REVIEW` and `STOP_IDENTITY_FAILURE`",
    "The current alpha has basic discovery language metadata"
  ]) {
    assert.match(policy, new RegExp(escapeRegExp(phrase)));
  }

  for (const phrase of [
    "PASS FOR FIRESEED VISIBLE ACCEPTANCE, WITH LANGUAGE GAP DISCLOSED",
    "Stable English machine contract",
    "localized human explanation",
    "Do not localize JSON keys"
  ]) {
    assert.match(review, new RegExp(escapeRegExp(phrase)));
  }

  assert.match(visible, /机器协议稳定英文/);
  assert.match(visible, /人类解释支持本地化/);
});

test("public entry documents keep readable Chinese text", () => {
  const readme = readText("README.md");
  const agentGuide = readText("AGENT_INTEGRATION_GUIDE.md");
  const outreach = readText("FIRESEED_OUTREACH_KIT.md");

  assert.match(readme, /帮助组织发布经过签名、可复查的公开资料/);
  assert.match(agentGuide, /Chinese name: AI 代理接入指南/);
  assert.match(agentGuide, /AI agent = AI 代理，代表某个用户、组织、买家、平台或审计方做查询和判断的程序/);
  assert.match(outreach, /我们正在邀请少量具名早期验证者/);

  for (const text of [readme, agentGuide, outreach]) {
    assert.equal(/鐜|舶|浠庤|绛惧|缁勭粐|浠ｇ悊|鎺ュ叆|楠岃|閭€璇|\?\?\?\?/.test(text), false);
  }
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
