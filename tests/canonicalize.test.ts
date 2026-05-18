import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeJson } from "../src/core/canonicalize.ts";
import { sha256CanonicalJson } from "../src/core/hash.ts";
import { parseStrictJson } from "../src/core/json.ts";

test("canonical JSON is stable under object key reordering", () => {
  const first = parseStrictJson('{"b":2,"a":{"y":true,"x":1},"c":["z",null]}');
  const second = parseStrictJson('{"c":["z",null],"a":{"x":1,"y":true},"b":2}');

  assert.equal(canonicalizeJson(first), '{"a":{"x":1,"y":true},"b":2,"c":["z",null]}');
  assert.equal(canonicalizeJson(first), canonicalizeJson(second));
  assert.equal(sha256CanonicalJson(first), sha256CanonicalJson(second));
});

test("canonical hash changes when signed content changes", () => {
  const original = parseStrictJson('{"a":1,"b":2}');
  const changed = parseStrictJson('{"a":1,"b":3}');

  assert.notEqual(sha256CanonicalJson(original), sha256CanonicalJson(changed));
});
