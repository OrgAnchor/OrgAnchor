import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("observation route command recommends S3 for concrete sample conformance", () => {
  const result = route("A buyer randomly purchases one bearing model-x1 and measures dimensional tolerance.");

  assert.equal(result.type, "OrgAnchorObservationRouteResult");
  assert.equal(result.recommended_route, "S3_RECOMMENDED");
  assert.equal(result.routing_confidence, "high");
  assert.equal(result.not_a_trust_decision, true);
  assert.equal(result.user_confirmation_required, true);
  assert.ok(result.detected_subject_hints.includes("model-x1"));
  assert.match(result.suggested_next_command, /evidence s3 template/);
});

test("observation route command recommends S4 for time-window delivery performance", () => {
  const result = route("A buyer records 18 orders over 90 days and reports 17 on-time deliveries for model-x1.");

  assert.equal(result.recommended_route, "S4_RECOMMENDED");
  assert.equal(result.routing_confidence, "high");
  assert.ok(result.routing_reasons.some((reason: string) => reason.includes("time window")));
  assert.ok(result.routing_reasons.some((reason: string) => reason.includes("delivery")));
});

test("observation route command reports mixed records when sample and continuity signals coexist", () => {
  const result = route("The delivered artifact passed acceptance testing, then the customer recorded six months of maintenance and repairs.");

  assert.equal(result.recommended_route, "MIXED_S3_S4");
  assert.ok(result.routing_reasons[0].includes("split into S3 and S4 records"));
  assert.ok(result.missing_information.includes("raw evidence location or vault"));
});

test("observation route command keeps vague promotion unclear", () => {
  const result = route("Our products are reliable, trusted by customers, and high quality.");

  assert.equal(result.recommended_route, "ROUTING_UNCLEAR");
  assert.equal(result.routing_confidence, "low");
  assert.ok(result.missing_information.includes("whether this is about sample conformance or performance continuity"));
});

test("observation route command handles Chinese S3 and S4 cues", () => {
  const s3 = route("随机购买一个批次样品，检测型号X1的尺寸和公差。");
  const s4 = route("最近90天18个订单，型号X1按时交付17个。");

  assert.equal(s3.recommended_route, "S3_RECOMMENDED");
  assert.equal(s4.recommended_route, "S4_RECOMMENDED");
});

test("observation route command requires text", () => {
  const result = spawnSync(process.execPath, [cliPath, "evidence", "observe", "route"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--text is required/);
});

function route(text: string): Record<string, any> {
  const result = spawnSync(process.execPath, [cliPath, "evidence", "observe", "route", "--text", text], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert.equal(
    result.status,
    0,
    `organchor evidence observe route failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return JSON.parse(result.stdout) as Record<string, any>;
}
