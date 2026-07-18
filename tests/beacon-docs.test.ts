import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("Beacon model defines low-cost discovery and anti-capture boundaries", () => {
  const beacon = readFileSync(join(repoRoot, "docs/protocol/ORGANCHOR_BEACON.md"), "utf8");

  assert.match(beacon, /Discovery Efficiency Contract/);
  assert.match(beacon, /\/\.well-known\/organchor\.json/);
  assert.match(beacon, /\/verify\/organchor\.json/);
  assert.match(beacon, /Directory = shared Beacon sweep result/);
  assert.match(beacon, /not a new trust root/);
  assert.match(beacon, /without asking permission from a central index/);
});

test("Beacon model records cache and abuse-resistance requirements", () => {
  const beacon = readFileSync(join(repoRoot, "docs/protocol/ORGANCHOR_BEACON.md"), "utf8");

  assert.match(beacon, /Cache-Control/);
  assert.match(beacon, /ETag/);
  assert.match(beacon, /Last-Modified/);
  assert.match(beacon, /If-None-Match/);
  assert.match(beacon, /If-Modified-Since/);
  assert.match(beacon, /304/);
  assert.match(beacon, /429/);
  assert.match(beacon, /503/);
  assert.match(beacon, /Retry-After/);
  assert.match(beacon, /avoid JavaScript challenges/);
  assert.match(beacon, /User-Agent/);
  assert.match(beacon, /Good Crawler Contract/);
  assert.match(beacon, /Audit Checklist/);
});

test("Beacon model distinguishes self-claims from full compatibility", () => {
  const beacon = readFileSync(join(repoRoot, "docs/protocol/ORGANCHOR_BEACON.md"), "utf8");

  assert.match(beacon, /Conformance And Impostor Defense/);
  assert.match(beacon, /CLAIMED_SIGNAL/);
  assert.match(beacon, /BEACON_SHAPE_PASS/);
  assert.match(beacon, /IDENTITY_VERIFY_PASS/);
  assert.match(beacon, /VALUE_VERIFY_PASS/);
  assert.match(beacon, /FULL_COMPATIBLE/);
  assert.match(beacon, /PARTIAL/);
  assert.match(beacon, /FAILED/);
  assert.match(beacon, /never treat CLAIMED_SIGNAL as adoption proof/);
});
