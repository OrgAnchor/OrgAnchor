import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cliPath = join(repoRoot, "src", "cli.ts");

test("observation template command creates an S3 fillable skeleton", () => {
  const result = template([
    "--route",
    "S3_RECOMMENDED",
    "--template",
    "distributor_sampling",
    "--subject-type",
    "product_model",
    "--subject-id",
    "model-x1",
    "--claim-id",
    "claim-001"
  ]);

  assert.equal(result.type, "OrgAnchorObservationTemplate");
  assert.equal(result.route, "S3_RECOMMENDED");
  assert.equal(result.not_a_trust_decision, true);
  assert.equal(result.templates.length, 1);
  const first = result.templates[0] as Record<string, any>;
  assert.equal(first.template_id, "distributor_sampling");
  assert.equal(first.implementation_status, "attach_command_available");
  assert.match(first.suggested_attach_command, /evidence s3 attach/);
  assert.equal(first.evidence_item_patch.s_class, "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING");
  assert.equal(first.evidence_item_patch.s3.sample_identity.subject_id, "model-x1");
});

test("observation template command creates an S4 continuity skeleton", () => {
  const result = template([
    "--route",
    "S4_RECOMMENDED",
    "--template",
    "order_delivery",
    "--subject-type",
    "product_family",
    "--subject-id",
    "series-a",
    "--window-start",
    "2026-05-01",
    "--window-end",
    "2026-05-31"
  ]);

  assert.equal(result.route, "S4_RECOMMENDED");
  assert.equal(result.templates.length, 1);
  const first = result.templates[0] as Record<string, any>;
  assert.equal(first.template_id, "order_delivery");
  assert.equal(first.implementation_status, "attach_command_available");
  assert.match(first.suggested_attach_command, /evidence s4 attach/);
  assert.equal(first.evidence_item_patch.s_class, "S4_REAL_WORLD_OBSERVATION");
  assert.equal(first.evidence_item_patch.s4.observation_window.start, "2026-05-01");
  assert.equal(first.evidence_item_patch.s4.metric_summary.order_count, 0);
});

test("observation template command splits mixed records into S3 and S4 skeletons", () => {
  const result = template(["--route", "MIXED_S3_S4", "--subject-id", "model-x1"]);

  assert.equal(result.route, "MIXED_S3_S4");
  assert.equal(result.templates.length, 2);
  assert.deepEqual(
    result.templates.map((item: Record<string, any>) => item.route),
    ["S3_RECOMMENDED", "S4_RECOMMENDED"]
  );
  assert.ok(result.next_actions.some((action: string) => action.includes("Split the material")));
});

test("observation template command gives clarification questions for unclear records", () => {
  const result = template(["--route", "ROUTING_UNCLEAR"]);

  assert.equal(result.route, "ROUTING_UNCLEAR");
  assert.deepEqual(result.templates, []);
  assert.ok(result.clarification_questions.length >= 3);
  assert.ok(result.next_actions.some((action: string) => action.includes("route again")));
});

test("observation template command requires a valid route", () => {
  const result = spawnSync(process.execPath, [cliPath, "evidence", "observe", "template"], {
    cwd: repoRoot,
    encoding: "utf8"
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--route is required/);
});

function template(args: string[]): Record<string, any> {
  const result = spawnSync(process.execPath, [cliPath, "evidence", "observe", "template", ...args], {
    cwd: repoRoot,
    encoding: "utf8"
  });
  assert.equal(
    result.status,
    0,
    `organchor evidence observe template failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`
  );
  return JSON.parse(result.stdout) as Record<string, any>;
}
