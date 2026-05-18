import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { sha256CanonicalJson } from "../src/core/hash.ts";
import { asObject, validateOfficialStatement, validateRootAuthority, validateSignatureFile } from "../src/core/validate.ts";
import { parseStrictJson } from "../src/core/json.ts";
import { verifySignatureFile } from "../src/crypto/signature.ts";

const fixturesDir = join(resolve(dirname(fileURLToPath(import.meta.url))), "fixtures");
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("published Stage 1 vector verifies with stable hashes", () => {
  const vector = asObject(
    parseStrictJson(readFileSync(join(fixturesDir, "stage1-vector.json"), "utf8"), "stage1-vector.json"),
    "stage1 vector"
  );
  const authority = validateRootAuthority(vector.authority ?? null);
  const statement = validateOfficialStatement(vector.statement ?? null);
  const signature = validateSignatureFile(vector.signature ?? null);

  assert.equal(sha256CanonicalJson(authority), vector.authority_hash);
  assert.equal(sha256CanonicalJson(statement), vector.statement_hash);
  assert.equal(signature.hash.value, vector.statement_hash);

  const result = verifySignatureFile(statement, signature, authority);
  assert.equal(result.ok, true);
  assert.deepEqual(result.valid_signatures, ["root-vector-2026"]);
});

test("complete public example verifies with stable hashes", () => {
  const exampleDir = join(repoRoot, "examples", "complete");
  const authority = validateRootAuthority(
    parseStrictJson(readFileSync(join(exampleDir, "root-authority.json"), "utf8"), "example root authority")
  );
  const statement = validateOfficialStatement(
    parseStrictJson(
      readFileSync(join(exampleDir, "statements", "official-endpoints.json"), "utf8"),
      "example official endpoints"
    )
  );
  const signature = validateSignatureFile(
    parseStrictJson(
      readFileSync(join(exampleDir, "statements", "official-endpoints.json.sig"), "utf8"),
      "example signature"
    )
  );

  assert.equal(sha256CanonicalJson(authority), "sha256:12ce12a2a8e24a9c364aa56156cf182e1fd118463c63f59b1cf452a05f6effeb");
  assert.equal(sha256CanonicalJson(statement), "sha256:c8ab6ad8dec4f474d6b8c126611655301c66b851ca2ae3a7f223b23b72739268");
  assert.equal(signature.hash.value, sha256CanonicalJson(statement));

  const result = verifySignatureFile(statement, signature, authority);
  assert.equal(result.ok, true);
  assert.deepEqual(result.valid_signatures, ["root-vector-2026"]);
});
