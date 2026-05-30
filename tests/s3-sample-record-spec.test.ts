import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sha256Pattern = /^sha256:[0-9a-f]{64}$/;

test("S3 sample event and sample-set schemas are package-facing and documented", () => {
  const docsIndex = readText("DOCS_INDEX.md");
  const packageJson = readJson("package.json") as { files?: string[] };
  const spec = readText("S3_SAMPLE_RECORD_SPEC.md");

  assert.ok(packageJson.files?.includes("S3_SAMPLE_RECORD_SPEC.md"));
  assert.match(docsIndex, /S3_SAMPLE_RECORD_SPEC\.md/);
  assert.match(spec, /S3_EVENT/);
  assert.match(spec, /S3_SAMPLE_SET/);
  assert.match(spec, /src\/schema\/s3-sample-event\.schema\.json/);
  assert.match(spec, /src\/schema\/s3-sample-set\.schema\.json/);
});

test("S3 sample event example follows the accepted minimum shape", () => {
  const schema = readJson("src/schema/s3-sample-event.schema.json") as Record<string, unknown>;
  const event = readJson("examples/s3-random-sampling/sample-event.example.json") as Record<string, any>;

  assert.equal(schema.$id, "https://organchor.org/schemas/s3-sample-event.v1.json");
  assert.equal(event.schema, "https://organchor.org/schemas/s3-sample-event.v1.json");
  assert.equal(event.type, "OrgAnchorS3SampleEvent");
  assert.equal(event.version, "1.0");
  assert.equal(event.not_a_trust_decision, true);
  assert.equal(event.subject.subject_type, "product_model");
  assert.equal(event.subject.subject_id, "model-x1");
  assert.equal(event.acquisition.organization_provided_sample, false);
  assert.equal(event.acquisition.sample_size, 1);
  assert.match(event.raw_evidence.bundle_hash, sha256Pattern);
  assert.equal(Array.isArray(event.raw_evidence.vaults), true);
  assert.equal(event.raw_evidence.vaults[0].raw_availability_status, "AVAILABLE");
  assert.ok(event.limitations.some((item: string) => item.includes("One sample")));
});

test("S3 sample set example exposes sufficiency, coverage, and raw vault state", () => {
  const schema = readJson("src/schema/s3-sample-set.schema.json") as Record<string, unknown>;
  const sampleSet = readJson("examples/s3-random-sampling/sample-set.example.json") as Record<string, any>;

  assert.equal(schema.$id, "https://organchor.org/schemas/s3-sample-set.v1.json");
  assert.equal(sampleSet.schema, "https://organchor.org/schemas/s3-sample-set.v1.json");
  assert.equal(sampleSet.type, "OrgAnchorS3SampleSet");
  assert.equal(sampleSet.version, "1.0");
  assert.equal(sampleSet.not_a_trust_decision, true);
  assert.equal(sampleSet.subject.subject_type, "product_model");
  assert.equal(sampleSet.subject.subject_id, "model-x1");
  assert.equal(sampleSet.sample_count, 24);
  assert.equal(sampleSet.sampling_method.organization_selected_sample, false);
  assert.equal(sampleSet.sufficiency.status, "PURPOSE_SUFFICIENT");
  assert.match(sampleSet.raw_evidence.sample_set_manifest_hash, sha256Pattern);
  assert.equal(sampleSet.raw_evidence.raw_availability_status, "MIXED");
  assert.ok(sampleSet.coverage.regions.includes("EU"));
  assert.ok(sampleSet.limitations.some((item: string) => item.includes("future batches")));
});

function readText(path: string): string {
  return readFileSync(join(repoRoot, path), "utf8");
}

function readJson(path: string): unknown {
  return JSON.parse(readText(path));
}
