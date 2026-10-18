import assert from "node:assert/strict";
import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto";
import type { JsonWebKey } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalizeJson } from "../src/core/canonicalize.ts";
import { cryptoAssurance } from "../src/core/crypto-policy.ts";
import { sha256CanonicalJson } from "../src/core/hash.ts";
import { parseStrictJson } from "../src/core/json.ts";
import type { JsonValue } from "../src/core/json.ts";
import {
  asObject,
  validateOfficialStatement,
  validatePrivateKey,
  validatePublicKey,
  validateRootAuthority,
  validateSignatureFile
} from "../src/core/validate.ts";
import { buildRootAuthority } from "../src/crypto/authority.ts";
import { exportPublicKey, generatePrivateKey, rootAuthorityKeyFromPrivate } from "../src/crypto/keys.ts";
import { createSignatureFile, verifySignatureFile } from "../src/crypto/signature.ts";
import type { Algorithm, OrgAnchorPrivateKey, OrgAnchorPublicKey, RootAuthority, SignatureFile } from "../src/types/artifacts.ts";

const now = new Date("2026-10-18T12:00:00.000Z");
const holders = ["alice", "bob", "carol"];
const payload = {
  statement_id: "pq-memory-test",
  official_endpoints: { website: "https://example.org", verify: "https://example.org/verify" },
  sequence: [1, 2, 3]
};

function makeFixture(policy = "hybrid-ed25519-ml-dsa-65", required = 2) {
  const algorithms: Algorithm[] = policy === "ml-dsa-65" ? ["ml-dsa-65"] : ["ed25519", "ml-dsa-65"];
  const keys = holders.flatMap((holder) => algorithms.map((algorithm) =>
    generatePrivateKey(`${holder}-${algorithm}`, algorithm, holder)
  ));
  const authority = buildRootAuthority(keys.map(rootAuthorityKeyFromPrivate), required, "pq-test-authority", policy);
  const signatures = keys.map((key) => createSignatureFile(payload, key, now, authority));
  const signature = validateSignatureFile({
    ...signatures[0]!,
    signatures: signatures.flatMap((file) => file.signatures)
  });
  return { keys, authority, signature };
}

function selectSignatures(signature: SignatureFile, ids: string[]): SignatureFile {
  const selected = structuredClone(signature);
  selected.signatures = selected.signatures.filter((entry) => ids.includes(entry.key_id));
  return selected;
}

function nativePrivateKey(key: OrgAnchorPrivateKey) {
  const material = key.key_material;
  return material.format === "jwk"
    ? createPrivateKey({ key: material.jwk as JsonWebKey, format: "jwk" })
    : createPrivateKey({ key: Buffer.from(material.data, "base64url"), format: "der", type: "pkcs8" });
}

function signingInput(signature: SignatureFile, index: number): Record<string, JsonValue> {
  const entry = signature.signatures[index]!;
  return {
    type: "OrgAnchorSigningInput",
    version: "2.0",
    authority_hash: signature.authority_hash!,
    key_id: entry.key_id,
    algorithm: entry.algorithm,
    signed_at: entry.signed_at,
    payload
  };
}

function canonicalBytes(value: JsonValue): Buffer {
  return Buffer.from(canonicalizeJson(value), "utf8");
}

function assertRejected(signature: SignatureFile, authority: RootAuthority, reason: RegExp, statement: JsonValue = payload) {
  const result = verifySignatureFile(statement, signature, authority);
  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), reason);
  return result;
}

test("ML-DSA-65 uses native PKCS#8 private keys and exports only native SPKI public material", () => {
  const privateKey = validatePrivateKey(generatePrivateKey("native-pq", "ml-dsa-65", "alice"));
  assert.equal(privateKey.version, "2.0");
  assert.equal(privateKey.algorithm, "ml-dsa-65");
  assert.equal(privateKey.holder_id, "alice");
  assert.equal(privateKey.key_material.format, "pkcs8-der");
  if (privateKey.key_material.format !== "pkcs8-der") assert.fail("Expected native private DER");
  const native = nativePrivateKey(privateKey);
  assert.equal(native.asymmetricKeyType, "ml-dsa-65");

  const publicKey = validatePublicKey(exportPublicKey(privateKey));
  assert.equal(publicKey.type, "OrgAnchorPublicKey");
  assert.equal(publicKey.version, "2.0");
  assert.equal(publicKey.id, privateKey.id);
  assert.equal(publicKey.algorithm, "ml-dsa-65");
  assert.equal(publicKey.holder_id, "alice");
  assert.equal(publicKey.public_key.format, "spki-der");
  if (publicKey.public_key.format !== "spki-der") assert.fail("Expected native public DER");
  assert.equal(publicKey.public_key.data, createPublicKey(native).export({ format: "der", type: "spki" }).toString("base64url"));
  assert.notEqual(publicKey.public_key.data, privateKey.key_material.data);
  const authorityKey = rootAuthorityKeyFromPrivate(privateKey);
  assert.deepEqual(authorityKey, {
    id: privateKey.id, algorithm: "ml-dsa-65", holder_id: "alice", public_key: publicKey.public_key
  });
  for (const artifact of [publicKey, authorityKey]) {
    assert.equal("key_material" in artifact, false);
    assert.equal(JSON.stringify(artifact).includes(privateKey.key_material.data), false);
    assert.deepEqual(Object.keys(artifact.public_key).sort(), ["data", "format"]);
  }
});

test("published v1 Ed25519 vector retains its hashes and verifies unchanged", () => {
  const vector = asObject(parseStrictJson(
    readFileSync(new URL("./fixtures/stage1-vector.json", import.meta.url), "utf8"), "stage1 vector"
  ), "stage1 vector");
  const authority = validateRootAuthority(vector.authority ?? null);
  const statement = validateOfficialStatement(vector.statement ?? null);
  const signature = validateSignatureFile(vector.signature ?? null);
  assert.equal(authority.version, "1.0");
  assert.equal(signature.version, "1.0");
  assert.equal(sha256CanonicalJson(authority), "sha256:12ce12a2a8e24a9c364aa56156cf182e1fd118463c63f59b1cf452a05f6effeb");
  assert.equal(sha256CanonicalJson(statement), "sha256:c8ab6ad8dec4f474d6b8c126611655301c66b851ca2ae3a7f223b23b72739268");
  assert.equal(signature.hash.value, vector.statement_hash);
  const result = verifySignatureFile(statement, signature, authority);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.valid_signatures, ["root-vector-2026"]);
});

test("default Ed25519 key generation and v1 payload-only signing remain compatible", () => {
  const key = validatePrivateKey(generatePrivateKey("legacy-ed"));
  assert.equal(key.version, "1.0");
  assert.equal(key.algorithm, "ed25519");
  const publicKey = validatePublicKey(exportPublicKey(key));
  assert.equal(publicKey.public_key.format, "jwk");
  if (publicKey.public_key.format !== "jwk") assert.fail("Expected unchanged Ed25519 JWK");
  assert.equal("d" in publicKey.public_key.jwk, false);
  const authority = buildRootAuthority([rootAuthorityKeyFromPrivate(key)], 1, "legacy-test");
  assert.equal(authority.version, "1.0");
  assert.equal("signing_policy" in authority, false);
  const signature = createSignatureFile(payload, key, now);
  assert.equal(signature.version, "1.0");
  assert.equal("authority_hash" in signature, false);
  assert.equal(signature.signatures[0]!.signature, sign(null, canonicalBytes(payload), nativePrivateKey(key)).toString("base64url"));
  assert.equal(verifySignatureFile(payload, signature, authority).ok, true);
});

test("v1 accepts unknown metadata including signing_policy without changing legacy verification", () => {
  const metadata = { signing_policy: "future-policy", future_field: { enabled: true } };
  const key = validatePrivateKey({ ...generatePrivateKey("legacy-metadata"), ...metadata });
  const publicKey = validatePublicKey({ ...exportPublicKey(key), ...metadata });
  const authority = validateRootAuthority({
    ...buildRootAuthority([rootAuthorityKeyFromPrivate(key)], 1, "legacy-metadata-authority"),
    ...metadata
  });
  const signature = validateSignatureFile({ ...createSignatureFile(payload, key, now, authority), ...metadata });
  for (const artifact of [key, publicKey, authority, signature]) {
    assert.equal(artifact.version, "1.0");
    assert.equal(artifact.signing_policy, metadata.signing_policy);
    assert.deepEqual(artifact.future_field, metadata.future_field);
  }
  const result = verifySignatureFile(payload, signature, authority);
  assert.equal(result.ok, true, result.errors.join("\n"));
  assert.deepEqual(result.valid_authorizers, [key.id]);
  const assurance = cryptoAssurance(authority);
  assert.equal(assurance.profile, "CLASSICAL_ONLY");
  assert.deepEqual(assurance.algorithms, ["ed25519"]);
  assert.equal(assurance.post_quantum_required, false);
  assert.equal(assurance.algorithm_security, "QUANTUM_VULNERABLE");
});

test("v2 signing interoperates with native crypto over the exact domain-separated canonical input", () => {
  const { keys, authority, signature } = makeFixture();
  assert.equal(signature.version, "2.0");
  assert.equal(signature.canonicalization, "RFC8785-JCS");
  assert.equal(signature.authority_hash, sha256CanonicalJson(authority));
  assert.equal(signature.hash.value, sha256CanonicalJson(payload));
  for (const [index, key] of keys.entries()) {
    const native = nativePrivateKey(key);
    const entry = signature.signatures[index]!;
    assert.equal(entry.signed_at, now.toISOString());
    const input = canonicalBytes(signingInput(signature, index));
    assert.equal(verify(null, input, createPublicKey(native), Buffer.from(entry.signature, "base64url")), true, key.id);
    assert.equal(verify(null, canonicalBytes(payload), createPublicKey(native), Buffer.from(entry.signature, "base64url")), false, key.id);
    const independent = structuredClone(signature);
    independent.signatures[index]!.signature = sign(null, input, native).toString("base64url");
    assert.equal(verifySignatureFile(payload, independent, authority).ok, true, key.id);
  }
});

test("hybrid 2-of-3 exhaustively counts complete same-holder pairs across all 64 subsets", () => {
  const { authority, signature } = makeFixture();
  assert.equal(authority.version, "2.0");
  assert.equal(authority.signing_policy, "hybrid-ed25519-ml-dsa-65");
  assert.deepEqual(authority.threshold, { required: 2, total: 3 });
  assert.equal(authority.keys.length, 6);
  for (let mask = 0; mask < 64; mask++) {
    const ids = signature.signatures.filter((_, index) => (mask & (1 << index)) !== 0).map((entry) => entry.key_id);
    const selected = selectSignatures(signature, ids);
    if (ids.length > 0) validateSignatureFile(selected);
    const expectedHolders = holders.filter((_, index) => (mask & (3 << (2 * index))) === (3 << (2 * index)));
    const result = verifySignatureFile(payload, selected, authority);
    const label = `signature subset ${mask.toString(2).padStart(6, "0")}: ${ids.join(", ")}`;
    assert.deepEqual(result.valid_signatures, ids, label);
    assert.deepEqual(result.valid_authorizers, expectedHolders, label);
    assert.equal(result.required_signatures, 2, label);
    assert.equal(result.ok, expectedHolders.length >= 2, label);
    if (expectedHolders.length < 2) assert.match(result.errors.join("\n"), /threshold not met/, label);
    else assert.deepEqual(result.errors, [], label);
  }
});

test("ML-DSA-only 2-of-3 counts distinct holders without requiring Ed25519", () => {
  const { authority, signature } = makeFixture("ml-dsa-65");
  assert.equal(authority.signing_policy, "ml-dsa-65");
  assert.deepEqual(authority.threshold, { required: 2, total: 3 });
  assert.equal(authority.keys.length, 3);
  for (let mask = 0; mask < 8; mask++) {
    const ids = signature.signatures.filter((_, index) => (mask & (1 << index)) !== 0).map((entry) => entry.key_id);
    const expected = holders.filter((_, index) => (mask & (1 << index)) !== 0);
    const result = verifySignatureFile(payload, selectSignatures(signature, ids), authority);
    assert.deepEqual(result.valid_authorizers, expected);
    assert.equal(result.ok, expected.length >= 2, `ML-DSA-only subset ${mask}`);
  }
});

test("authority builder infers PQ policies while retaining holder-based totals", () => {
  for (const policy of ["hybrid-ed25519-ml-dsa-65", "ml-dsa-65"]) {
    const { authority } = makeFixture(policy);
    const inferred = buildRootAuthority(authority.keys, 2, "inferred-policy");
    assert.equal(inferred.version, "2.0");
    assert.equal(inferred.signing_policy, policy);
    assert.deepEqual(inferred.threshold, { required: 2, total: 3 });
  }
});

test("v2 verification accepts canonical object reordering, not a different array order", () => {
  const { authority, signature } = makeFixture();
  const reordered = {
    sequence: [1, 2, 3],
    official_endpoints: { verify: "https://example.org/verify", website: "https://example.org" },
    statement_id: "pq-memory-test"
  };
  assert.equal(verifySignatureFile(reordered, signature, authority).ok, true);
  const changed = { ...reordered, sequence: [3, 2, 1] };
  const editedHash = { ...signature, hash: { ...signature.hash, value: sha256CanonicalJson(changed) } };
  assertRejected(editedHash, authority, /Invalid signature/, changed);
});

for (const algorithm of ["ed25519", "ml-dsa-65"] as const) {
  test(`v2 ${algorithm} signed_at cannot be edited even when the other holders meet threshold`, () => {
    const { authority, signature } = makeFixture();
    signature.signatures.find((entry) => entry.algorithm === algorithm)!.signed_at = "2020-01-01T00:00:00.000Z";
    validateSignatureFile(signature);
    const result = assertRejected(signature, authority, /Invalid signature/);
    assert.deepEqual(result.valid_authorizers, ["bob", "carol"]);
  });

  test(`v2 ${algorithm} verification checks every signed input field independently`, () => {
    const { keys, authority, signature } = makeFixture();
    const index = keys.findIndex((key) => key.algorithm === algorithm);
    const native = nativePrivateKey(keys[index]!);
    const substitutions: Record<string, JsonValue> = {
      type: "OtherSigningInput", version: "1.0", key_id: "alias",
      algorithm: algorithm === "ed25519" ? "ml-dsa-65" : "ed25519",
      signed_at: "2020-01-01T00:00:00.000Z",
      authority_hash: `sha256:${"0".repeat(64)}`, payload: { ...payload, sequence: [9] }
    };
    for (const [field, value] of Object.entries(substitutions)) {
      const input = canonicalBytes({ ...signingInput(signature, index), [field]: value });
      const edited = structuredClone(signature);
      edited.signatures[index]!.signature = sign(null, input, native).toString("base64url");
      assert.equal(verify(null, input, createPublicKey(native), Buffer.from(edited.signatures[index]!.signature, "base64url")), true);
      const result = assertRejected(edited, authority, /Invalid signature/);
      assert.equal(result.valid_signatures.includes(keys[index]!.id), false, `${algorithm}: ${field}`);
    }
  });
}

test("v2 payload modification fails both before and after the attacker recomputes its hash", () => {
  const { authority, signature } = makeFixture();
  const changed = { ...payload, official_endpoints: { ...payload.official_endpoints, website: "https://attacker.example" } };
  assertRejected(signature, authority, /Statement hash mismatch/, changed);
  const edited = { ...signature, hash: { ...signature.hash, value: sha256CanonicalJson(changed) } };
  const result = assertRejected(edited, authority, /Invalid signature/, changed);
  assert.deepEqual(result.valid_signatures, []);
});

test("v2 authority binding rejects substitution even after its envelope hash is recomputed", () => {
  const { authority, signature } = makeFixture();
  const replacement = validateRootAuthority({ ...authority, authority_id: "substituted-authority" });
  assertRejected(signature, replacement, /authority hash mismatch/);
  const edited = { ...signature, authority_hash: sha256CanonicalJson(replacement) };
  validateSignatureFile(edited);
  const result = assertRejected(edited, replacement, /Invalid signature/);
  assert.deepEqual(result.valid_authorizers, []);

  const weakened = validateRootAuthority({ ...authority, threshold: { required: 1, total: 3 } });
  assertRejected({ ...signature, authority_hash: sha256CanonicalJson(weakened) }, weakened, /Invalid signature/);
});

test("editing v2 key IDs or algorithm labels is rejected", () => {
  const { authority, signature } = makeFixture();
  const unknownKey = structuredClone(signature);
  unknownKey.signatures[0]!.key_id = "not-authorized";
  assertRejected(unknownKey, authority, /not in root authority/);
  const relabeled = structuredClone(signature);
  relabeled.signatures[0]!.algorithm = "ml-dsa-65";
  assertRejected(relabeled, authority, /algorithm mismatch/);
});

test("stripping PQ signatures or one PQ half of two complete hybrid holders fails", () => {
  const { authority, signature } = makeFixture();
  const classicalOnly = { ...signature, signatures: signature.signatures.filter((entry) => entry.algorithm === "ed25519") };
  validateSignatureFile(classicalOnly);
  const result = assertRejected(classicalOnly, authority, /threshold not met/);
  assert.equal(result.valid_signatures.length, 3);
  assert.deepEqual(result.valid_authorizers, []);
  const twoHolders = signature.signatures.filter((entry) => !entry.key_id.startsWith("carol-"));
  const partial = { ...signature, signatures: twoHolders.filter((entry) => entry.key_id !== "bob-ml-dsa-65") };
  assert.deepEqual(assertRejected(partial, authority, /threshold not met/).valid_authorizers, ["alice"]);
});

test("relabeling a v2 hybrid signature and authority as v1 cannot create a classical-only bypass", () => {
  const { authority, signature } = makeFixture();
  const downgraded = structuredClone(signature);
  downgraded.version = "1.0";
  delete downgraded.authority_hash;
  downgraded.signatures = downgraded.signatures.filter((entry) => entry.algorithm === "ed25519");
  validateSignatureFile(downgraded);
  assertRejected(downgraded, authority, /V2 root authority requires a v2/);
  const classicalAuthority = buildRootAuthority(authority.keys.filter((key) => key.algorithm === "ed25519"), 2, "classical-downgrade");
  const result = assertRejected(downgraded, classicalAuthority, /Invalid signature/);
  assert.deepEqual(result.valid_signatures, []);
  assert.throws(() => validateRootAuthority({
    ...authority, version: "1.0", schema: "https://organchor.org/schemas/root-authority.v1.json",
    threshold: { required: 2, total: authority.keys.length }
  }), { code: "UNSUPPORTED_ALGORITHM", message: /only ed25519 is supported in v1/ });
});

test("ML-DSA signing requires a v2 authority rather than silently falling back to v1", () => {
  const key = generatePrivateKey("pq-no-fallback", "ml-dsa-65", "alice");
  assert.throws(() => createSignatureFile(payload, key, now), /requires a v2 root authority/);
  const legacy = buildRootAuthority([rootAuthorityKeyFromPrivate(generatePrivateKey("legacy"))], 1, "legacy");
  assert.throws(() => createSignatureFile(payload, key, now, legacy), /requires a v2 root authority/);
});

test("duplicate signature entries cannot satisfy another holder or a missing algorithm", () => {
  const { authority, signature } = makeFixture();
  const onePair = selectSignatures(signature, ["alice-ed25519", "alice-ml-dsa-65"]);
  onePair.signatures.push(...structuredClone(onePair.signatures));
  assert.throws(() => validateSignatureFile(onePair), /Duplicate signature/);
  const result = assertRejected(onePair, authority, /threshold not met/);
  assert.deepEqual(result.valid_signatures, ["alice-ed25519", "alice-ml-dsa-65"]);
  assert.deepEqual(result.valid_authorizers, ["alice"]);
});

test("v2 authorities reject missing holder IDs, incomplete pairs and key-count thresholds", () => {
  const { authority } = makeFixture();
  const missingHolder = structuredClone(authority);
  delete missingHolder.keys[0]!.holder_id;
  assert.throws(() => validateRootAuthority(missingHolder), /holder_id/);
  assert.throws(() => buildRootAuthority(authority.keys.slice(1), 2, "missing-ed", "hybrid-ed25519-ml-dsa-65"), /complete required algorithm set/);
  assert.throws(() => buildRootAuthority(authority.keys.slice(0, -1), 2, "missing-pq", "hybrid-ed25519-ml-dsa-65"), /complete required algorithm set/);
  assert.throws(() => validateRootAuthority({ ...authority, threshold: { required: 2, total: 6 } }), /number of holders/);
  assert.throws(() => buildRootAuthority(authority.keys, 4, "too-many-votes", "hybrid-ed25519-ml-dsa-65"), /threshold/);
  assert.throws(() => buildRootAuthority(authority.keys, 0, "no-votes", "hybrid-ed25519-ml-dsa-65"), /threshold/);
});

test("v2 authorities reject duplicate key IDs, duplicate holder algorithms and duplicate material under aliases", () => {
  const { authority } = makeFixture();
  const duplicateId = structuredClone(authority);
  duplicateId.keys[2]!.id = duplicateId.keys[0]!.id;
  assert.throws(() => validateRootAuthority(duplicateId), /Duplicate root authority key id/);
  const duplicateAlgorithm = structuredClone(authority);
  duplicateAlgorithm.keys[2]!.holder_id = "alice";
  assert.throws(() => validateRootAuthority(duplicateAlgorithm), /one key per required algorithm/);
  for (const [original, alias] of [[0, 2], [1, 3]] as const) {
    const duplicateMaterial = structuredClone(authority);
    duplicateMaterial.keys[alias]!.public_key = structuredClone(duplicateMaterial.keys[original]!.public_key);
    assert.throws(() => validateRootAuthority(duplicateMaterial), /Duplicate public key material/);
  }
});

test("v2 rejects duplicate Ed25519 material hidden by noncanonical base64url padding bits without changing v1", () => {
  const { keys, authority } = makeFixture();
  const original = authority.keys[0]!;
  assert.equal(original.public_key.format, "jwk");
  if (original.public_key.format !== "jwk") assert.fail("Expected Ed25519 JWK");
  const x = original.public_key.jwk.x;
  assert.equal(typeof x, "string");
  if (typeof x !== "string") assert.fail("Expected Ed25519 public x");
  const bytes = Buffer.from(x, "base64url");
  assert.equal(bytes.length, 32);
  assert.equal(bytes.toString("base64url"), x);
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  const lastIndex = alphabet.indexOf(x.at(-1)!);
  assert.notEqual(lastIndex, -1);
  assert.equal(lastIndex & 3, 0);

  // A 32-byte key leaves two unused low bits in the final base64url character.
  for (const lowBits of [1, 2, 3]) {
    const alias: string = x.slice(0, -1) + alphabet[lastIndex | lowBits]!;
    assert.notEqual(alias, x);
    assert.deepEqual(Buffer.from(alias, "base64url"), bytes);
    assert.equal(Buffer.from(alias, "base64url").toString("base64url"), x);
    const aliasedMaterial = { format: "jwk" as const, jwk: { ...original.public_key.jwk, x: alias } };
    const duplicate = structuredClone(authority);
    duplicate.keys[2]!.public_key = aliasedMaterial;
    assert.notEqual(duplicate.keys[2]!.id, original.id);
    assert.notEqual(duplicate.keys[2]!.holder_id, original.holder_id);
    assert.throws(() => validateRootAuthority(duplicate), {
      code: "VALIDATION_ERROR", message: /canonical 32-byte base64url encoding/
    });

    const legacy = buildRootAuthority([{ ...original, public_key: aliasedMaterial }], 1, "legacy-padding-bits");
    assert.equal(legacy.version, "1.0");
    const signature = createSignatureFile(payload, keys[0]!, now);
    const result = verifySignatureFile(payload, signature, legacy);
    assert.equal(result.ok, true, result.errors.join("\n"));
    assert.deepEqual(result.valid_signatures, [original.id]);
  }
});

test("unknown policies and algorithms are rejected rather than treated as supported PQ keys", () => {
  const { authority, keys, signature } = makeFixture();
  assert.throws(() => buildRootAuthority(authority.keys, 2, "unknown-policy", "hybrid-unknown"), /Unsupported.*policy/);
  assert.throws(() => buildRootAuthority(authority.keys, 2, "wrong-policy", "ml-dsa-65"), /algorithm.*not permitted/);
  assert.throws(() => generatePrivateKey("unsupported", "ml-dsa-44" as Algorithm), /Unsupported signing algorithm/);
  assert.throws(() => validatePrivateKey({ ...keys[1]!, algorithm: "ml-dsa-44" }), /unsupported key algorithm/);
  assert.throws(() => validatePublicKey({ ...exportPublicKey(keys[1]!), algorithm: "ml-dsa-44" }), /unsupported key algorithm/);
  const badSignature = structuredClone(signature);
  badSignature.signatures[1]!.algorithm = "ml-dsa-44" as Algorithm;
  assert.throws(() => validateSignatureFile(badSignature), /Unsupported v2 signature algorithm/);
  const badAuthority = structuredClone(authority);
  badAuthority.keys[1]!.algorithm = "ml-dsa-44" as Algorithm;
  assert.throws(() => validateRootAuthority(badAuthority), /algorithm.*not permitted/);
});

test("ML-DSA labels cannot disguise Ed25519 DER keys or use the wrong material format", () => {
  const { privateKey: edPrivate, publicKey: edPublic } = generateKeyPairSync("ed25519");
  const pq = generatePrivateKey("algorithm-mismatch", "ml-dsa-65", "alice");
  const wrongPrivate = { ...pq, key_material: { format: "pkcs8-der" as const, data: edPrivate.export({ format: "der", type: "pkcs8" }).toString("base64url") } };
  assert.throws(() => validatePrivateKey(wrongPrivate), /Invalid or unsupported ML-DSA-65 key encoding/);
  assert.throws(() => exportPublicKey(wrongPrivate), /does not match ML-DSA-65/);
  const authority = buildRootAuthority([rootAuthorityKeyFromPrivate(pq)], 1, "pq-only", "ml-dsa-65");
  assert.throws(() => createSignatureFile(payload, wrongPrivate, now, authority), /algorithm mismatch/);
  const publicKey = exportPublicKey(pq);
  const wrongPublic: OrgAnchorPublicKey = {
    ...publicKey,
    public_key: { format: "spki-der", data: edPublic.export({ format: "der", type: "spki" }).toString("base64url") }
  };
  assert.throws(() => validatePublicKey(wrongPublic), /Invalid or unsupported ML-DSA-65 key encoding/);
  assert.throws(() => buildRootAuthority([{ ...rootAuthorityKeyFromPrivate(pq), public_key: wrongPublic.public_key }], 1, "wrong-native-type", "ml-dsa-65"), /Invalid or unsupported ML-DSA-65 key encoding/);
  assert.throws(() => validatePrivateKey({ ...pq, key_material: publicKey.public_key }), /pkcs8-der/);
  assert.throws(() => validatePublicKey({ ...publicKey, public_key: pq.key_material }), /spki-der/);
});

test("malformed, truncated, trailing-byte and non-base64url ML-DSA DER encodings are rejected", () => {
  const pq = generatePrivateKey("malformed-der", "ml-dsa-65", "alice");
  const publicKey = exportPublicKey(pq);
  assert.equal(pq.key_material.format, "pkcs8-der");
  assert.equal(publicKey.public_key.format, "spki-der");
  if (pq.key_material.format !== "pkcs8-der" || publicKey.public_key.format !== "spki-der") assert.fail("Expected DER keys");
  for (const [format, data, validate] of [
    ["pkcs8-der", pq.key_material.data, (material: JsonValue) => validatePrivateKey({ ...pq, key_material: material })],
    ["spki-der", publicKey.public_key.data, (material: JsonValue) => validatePublicKey({ ...publicKey, public_key: material })]
  ] as const) {
    const bytes = Buffer.from(data, "base64url");
    for (const malformed of [
      "", "not+base64/der=", Buffer.from("not DER").toString("base64url"),
      bytes.subarray(0, bytes.length - 1).toString("base64url"),
      Buffer.concat([bytes, Buffer.from([0])]).toString("base64url"), "A".repeat(20001)
    ]) {
      assert.throws(() => validate({ format, data: malformed }), { code: "VALIDATION_ERROR" }, format);
    }
  }
});

test("public validators reject private DER and private fields in both PQ and Ed25519 materials", () => {
  const pq = generatePrivateKey("private-public-confusion", "ml-dsa-65", "alice");
  const publicKey = exportPublicKey(pq);
  const rootKey = rootAuthorityKeyFromPrivate(pq);
  const leakedMaterials = [
    pq.key_material,
    { ...pq.key_material, format: "spki-der" },
    { ...publicKey.public_key, d: "private-field" },
    { ...publicKey.public_key, key_material: pq.key_material }
  ];
  for (const material of leakedMaterials) {
    assert.throws(() => validatePublicKey({ ...publicKey, public_key: material }), { code: "VALIDATION_ERROR" });
    assert.throws(() => validateRootAuthority({
      ...buildRootAuthority([rootKey], 1, "public-only", "ml-dsa-65"),
      keys: [{ ...rootKey, public_key: material }]
    }), { code: "VALIDATION_ERROR" });
  }
  const ed = generatePrivateKey("ed-private-field");
  const edPublic = exportPublicKey(ed);
  const edRoot = rootAuthorityKeyFromPrivate(ed);
  assert.throws(() => validatePublicKey({ ...edPublic, public_key: ed.key_material }), /d must not be present/);
  assert.throws(() => validateRootAuthority({
    ...buildRootAuthority([edRoot], 1, "legacy-public-only"), keys: [{ ...edRoot, public_key: ed.key_material }]
  }), /d must not be present/);
});

test("unknown versions and key algorithm/version mismatches fail closed", () => {
  const { keys, authority, signature } = makeFixture();
  for (const version of ["0.0", "2.1", "3.0"]) {
    for (const key of [keys[0]!, keys[1]!]) {
      assert.throws(() => validatePrivateKey({ ...key, version }), { code: "UNSUPPORTED_VERSION" });
      assert.throws(() => validatePublicKey({ ...exportPublicKey(key), version }), { code: "UNSUPPORTED_VERSION" });
    }
    assert.throws(() => validateRootAuthority({ ...authority, version }), { code: "UNSUPPORTED_VERSION" });
    assert.throws(() => validateSignatureFile({ ...signature, version }), { code: "UNSUPPORTED_VERSION" });
    assertRejected({ ...signature, version } as SignatureFile, authority, /Unsupported signature version/);
  }
  for (const key of [keys[0]!, keys[1]!]) {
    const version = key.algorithm === "ed25519" ? "2.0" : "1.0";
    assert.throws(() => validatePrivateKey({ ...key, version }), { code: "VALIDATION_ERROR" });
    assert.throws(() => validatePublicKey({ ...exportPublicKey(key), version }), { code: "VALIDATION_ERROR" });
  }
});
