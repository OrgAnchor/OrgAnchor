import assert from "node:assert/strict";
import test from "node:test";
import { OrgAnchorError } from "../src/core/errors.ts";
import { parseStrictJson } from "../src/core/json.ts";

test("strict JSON parser accepts ordinary JSON", () => {
  assert.deepEqual(parseStrictJson('{"name":"Example","items":[true,false,null,1.25]}'), {
    name: "Example",
    items: [true, false, null, 1.25]
  });
});

test("strict JSON parser rejects duplicate object keys", () => {
  assert.throws(
    () => parseStrictJson('{"a":1,"nested":{"b":1,"b":2}}'),
    (error: unknown) => error instanceof OrgAnchorError && /Duplicate object key/.test(error.message)
  );
});

test("strict JSON parser rejects ambiguous or unsafe signed JSON", () => {
  assert.throws(() => parseStrictJson('{"n":9007199254740993}'), /Unsafe integer/);
  assert.throws(() => parseStrictJson('{"a":1,}'), /Expected object key string/);
  assert.throws(() => parseStrictJson('{"a":1}// comment'), /Unexpected trailing content/);
});
