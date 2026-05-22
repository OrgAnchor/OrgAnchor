import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("agent integration guide defines low-friction discovery and trust boundary", () => {
  const guide = readFileSync(join(repoRoot, "AGENT_INTEGRATION_GUIDE.md"), "utf8");
  assert.match(guide, /AI 代理接入指南/);
  assert.match(guide, /\/\.well-known\/organchor\.json/);
  assert.match(guide, /organchor verify url https:\/\/example\.org --compact/);
  assert.match(guide, /policy_route/);
  assert.match(guide, /EXTERNAL_POLICY_REVIEW/);
  assert.match(guide, /OrgAnchor reports verification facts, gaps, and warnings/);
  assert.match(guide, /It does not assign the final trust decision/);
});

test("agent compact example is a valid first-pass result", () => {
  const examplePath = join(repoRoot, "examples", "agent-verification", "organchor-compact-result.json");
  const result = JSON.parse(readFileSync(examplePath, "utf8"));

  assert.equal(result.type, "OrgAnchorAgentVerificationCompactResult");
  assert.equal(result.version, "1.0");
  assert.equal(result.target, "https://organchor.org");
  assert.equal(result.overall_status, "PASS");
  assert.equal(result.identity_status, "PASS");
  assert.equal(result.value_status, "PASS");
  assert.equal(result.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
  assert.match(result.root_authority_hash, /^sha256:[0-9a-f]{64}$/);
  assert.match(result.statement_hash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(result.evidence_summary.claims, "PASS");
  assert.equal(result.evidence_summary.evidence, "PASS");
  assert.equal(result.evidence_summary.value, "PASS");
  assert.equal(result.evidence_summary.unsupported_claims, 0);
  assert.equal(result.policy_route.route, "EXTERNAL_POLICY_REVIEW");
  assert.equal(result.policy_route.policy_owner, "EXTERNAL_AGENT");
  assert.equal(result.policy_route.trust_decision, "NOT_ASSIGNED_BY_ORGANCHOR");
  assert.equal(result.policy_route.reasons.includes("manual_checks_present"), true);
  assert.equal(result.policy_route.reasons.includes("no_third_party_claims"), true);
  assert.equal(result.failures.length, 0);
  assert.equal(result.warnings.length, 0);
});
