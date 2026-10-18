import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test, { type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { serializeDetachedOpenTimestamp } from "../src/anchors/opentimestamps.ts";
import { cryptoAssurance } from "../src/core/crypto-policy.ts";
import { sha256CanonicalJson } from "../src/core/hash.ts";
import {
  assessHistoricalSignature,
  createHistoryCheckpoint,
  rawDigests,
  validateHistoryCheckpoint,
  verifyCheckpointAnchor,
  verifyCheckpointFiles,
  type HistoryCheckpoint,
  type HistoryFile
} from "../src/core/history.ts";
import { asObject, validateOfficialStatement, validateRootAuthority, validateRootAuthorityMigration } from "../src/core/validate.ts";
import type { JsonValue } from "../src/core/json.ts";
import { generatePrivateKey, rootAuthorityKeyFromPrivate } from "../src/crypto/keys.ts";
import { createSignatureFile, verifySignatureFile } from "../src/crypto/signature.ts";
import type { OfficialEndpointsStatement, OrgAnchorPrivateKey, RootAuthority, RootAuthorityMigration, SignatureFile } from "../src/types/artifacts.ts";

const cliPath = resolve(dirname(fileURLToPath(import.meta.url)), "../src/cli.ts");
const fixedTime = "2026-05-01T00:00:00.000Z";
const cutoff = "2026-06-01T00:00:00.000Z";
const requiredFiles = ["official-endpoints.json", "official-endpoints.json.sig", "organchor.json", "root-authority.json"];
const previousNames = ["checkpoint", "signature", "authority"] as const;
const anchorBytes = Buffer.from("Synthetic OrgAnchor checkpoint: no live-chain membership claim.\n");
// Fixed synthetic vector, not a mined block or evidence of canonical-chain membership.
const syntheticPin = {
  height: 42,
  header_hex: "0200000011111111111111111111111111111111111111111111111111111111111111111c8386f0e3d4505c966eebe1ba86371c8416ab76f7150ddd5cbb4b211d1de59f00edf369ffff7f2007000000",
  block_hash: "e9f5b60e3c1aa0b01dc7e83624ee19276ef49d84c0b35262ed7235274cfeb2b1"
};

test("checkpoint binds exact statement, signature, authority and discovery-index bytes with both digests", async (t) => {
  const fixture = makeFixture(t);
  const checkpoint = await createHistoryCheckpoint(fixture.directory);
  assert.equal(validateHistoryCheckpoint(checkpoint), checkpoint);
  assert.equal(checkpoint.root_authority_hash, sha256CanonicalJson(fixture.authority));
  assert.equal(checkpoint.statement_hash, sha256CanonicalJson(fixture.statement));
  assert.equal(checkpoint.previous, null);
  assert.deepEqual(checkpoint.files.map((file) => file.path), requiredFiles);
  for (const file of checkpoint.files) {
    const bytes = readFileSync(join(fixture.directory, file.path));
    assert.deepEqual(file, { path: file.path, size: bytes.length, ...independentDigests(bytes) });
  }
  await verifyCheckpointFiles(checkpoint, fixture.directory);
});

for (const path of requiredFiles) {
  test(`checkpoint rejects raw-byte changes to ${path} even when parsed JSON is unchanged`, async (t) => {
    const fixture = makeFixture(t);
    const checkpoint = await createHistoryCheckpoint(fixture.directory);
    const full = join(fixture.directory, path);
    const original = readFileSync(full, "utf8");
    const reformatted = `${JSON.stringify(JSON.parse(original))}\n`;
    assert.notEqual(reformatted, original);
    assert.deepEqual(JSON.parse(reformatted), JSON.parse(original));
    writeFileSync(full, reformatted);
    assert.equal(verifySignatureFile(fixture.statement, fixture.statementSignature, fixture.authority).ok, true);
    await assert.rejects(verifyCheckpointFiles(checkpoint, fixture.directory), /Checkpoint file hash mismatch/);
  });

  test(`checkpoint creation requires ${path}`, async (t) => {
    const fixture = makeFixture(t);
    rmSync(join(fixture.directory, path));
    await assert.rejects(createHistoryCheckpoint(fixture.directory), /Checkpoint requires/);
  });
}

test("checkpoint rejects changed signature bytes with the signed payload and envelope hash unchanged", async (t) => {
  const fixture = makeFixture(t);
  const checkpoint = await createHistoryCheckpoint(fixture.directory);
  const statementBytes = readFileSync(join(fixture.directory, "official-endpoints.json"));
  const tampered = corruptSignature(fixture.statementSignature);
  assert.equal(tampered.hash.value, fixture.statementSignature.hash.value);
  assert.equal(verifySignatureFile(fixture.statement, tampered, fixture.authority).ok, false);
  writeJson(join(fixture.directory, "official-endpoints.json.sig"), tampered);
  assert.deepEqual(readFileSync(join(fixture.directory, "official-endpoints.json")), statementBytes);
  await assert.rejects(verifyCheckpointFiles(checkpoint, fixture.directory), /Checkpoint file hash mismatch: official-endpoints\.json\.sig/);
  await assert.rejects(createHistoryCheckpoint(fixture.directory), /Invalid signed snapshot/);
});

for (const digest of ["sha256", "sha512"] as const) {
  test(`file verification checks ${digest} independently of size and the other digest`, async (t) => {
    const fixture = makeFixture(t);
    const checkpoint = await createHistoryCheckpoint(fixture.directory);
    fileEntry(checkpoint, "organchor.json")[digest] = `${digest}:${"0".repeat(digest === "sha256" ? 64 : 128)}`;
    validateHistoryCheckpoint(checkpoint);
    await assert.rejects(verifyCheckpointFiles(checkpoint, fixture.directory), /Checkpoint file hash mismatch: organchor\.json/);
  });
}

test("checkpoint rejects changed size and canonical authority or statement bindings", async (t) => {
  const fixture = makeFixture(t);
  const checkpoint = await createHistoryCheckpoint(fixture.directory);
  const wrongSize = structuredClone(checkpoint);
  fileEntry(wrongSize, "organchor.json").size++;
  await assert.rejects(verifyCheckpointFiles(wrongSize, fixture.directory), /Checkpoint file hash mismatch/);
  for (const field of ["root_authority_hash", "statement_hash"] as const) {
    const modified = structuredClone(checkpoint);
    modified[field] = `sha256:${"0".repeat(64)}`;
    await assert.rejects(verifyCheckpointFiles(modified, fixture.directory), /authority or statement binding mismatch/);
  }
});

test("checkpoint creation rejects a separately supplied root that differs from the signed embedded authority", async (t) => {
  const fixture = makeFixture(t);
  const other = validateRootAuthority({ ...fixture.authority, authority_id: "different-authority-same-key" });
  assert.equal(verifySignatureFile(fixture.statement, fixture.statementSignature, other).ok, true);
  writeJson(fixture.authorityPath, other);
  await assert.rejects(createHistoryCheckpoint(fixture.directory), /Invalid signed snapshot/);
});

const unsafePaths = ["", "../outside.json", "sub/../../outside.json", "/absolute.json", "C:/absolute.json", "C:relative.json", "\\\\server\\share", "sub\\file.json", "./file.json", "sub/./file.json", "sub//file.json", "sub/", "file.json:stream", "nul\0.json", "line\nfile.json"];
for (const path of unsafePaths) {
  test(`checkpoint validation and reads reject unsafe path ${JSON.stringify(path)}`, async (t) => {
    const fixture = makeFixture(t);
    const checkpoint = await createHistoryCheckpoint(fixture.directory);
    const entry = fileEntry(checkpoint, "organchor.json");
    const unsafe = { ...checkpoint, files: [{ ...entry, path }, ...checkpoint.files] };
    assert.throws(() => validateHistoryCheckpoint(unsafe), path === "" ? /path must be a non-empty string/ : /Unsafe checkpoint relative path/);
    await assert.rejects(verifyCheckpointFiles(unsafe, fixture.directory), /Unsafe checkpoint relative path/);
  });
}

test("checkpoint validation rejects duplicates and missing required files", async (t) => {
  const fixture = makeFixture(t);
  const checkpoint = await createHistoryCheckpoint(fixture.directory);
  const entry = fileEntry(checkpoint, "organchor.json");
  assert.throws(() => validateHistoryCheckpoint({ ...checkpoint, files: [...checkpoint.files, entry] }), /Duplicate checkpoint path/);
  if (process.platform === "win32") {
    assert.throws(() => validateHistoryCheckpoint({ ...checkpoint, files: [...checkpoint.files, { ...entry, path: entry.path.toUpperCase() }] }), /Duplicate checkpoint path/);
  }
  for (const path of requiredFiles) {
    assert.throws(() => validateHistoryCheckpoint({ ...checkpoint, files: checkpoint.files.filter((file) => file.path !== path) }), /Checkpoint requires/);
  }
});

test("checkpoint creation and verification reject directory links in public packages", async (t) => {
  const fixture = makeFixture(t);
  const checkpoint = await createHistoryCheckpoint(fixture.directory);
  const outside = join(fixture.workspace, "outside");
  mkdirSync(outside);
  writeFileSync(join(outside, "public.txt"), "synthetic public content\n");
  symlinkSync(outside, join(fixture.directory, "linked"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(createHistoryCheckpoint(fixture.directory), /disclosure scan failed|symbolic links/i);
  const bytes = readFileSync(join(outside, "public.txt"));
  checkpoint.files.push({ path: "linked/public.txt", size: bytes.length, ...independentDigests(bytes) });
  await assert.rejects(verifyCheckpointFiles(checkpoint, fixture.directory), /symbolic links/);
});

test("renewal binds exact previous checkpoint, signature and authority bytes with SHA-256 and SHA-512", async (t) => {
  const fixture = makeFixture(t);
  const old = await signedCheckpoint(fixture, "previous.json");
  const renewed = await createHistoryCheckpoint(fixture.directory, old.material);
  validateHistoryCheckpoint(renewed);
  assert.deepEqual(renewed.previous, {
    checkpoint: independentDigests(old.material.checkpoint),
    signature: independentDigests(old.material.signature),
    authority: independentDigests(old.material.authority)
  });
  await verifyCheckpointFiles(renewed, fixture.directory);
});

test("renewal creation rejects wrong prior authority and corrupt prior signature", async (t) => {
  const fixture = makeFixture(t);
  const old = await signedCheckpoint(fixture, "previous.json");
  await assert.rejects(createHistoryCheckpoint(fixture.directory, {
    ...old.material, authority: jsonBytes({ ...fixture.authority, authority_id: "wrong-prior-authority" })
  }), /Previous checkpoint authority mismatch/);
  await assert.rejects(createHistoryCheckpoint(fixture.directory, {
    ...old.material, signature: jsonBytes(corruptSignature(old.signature))
  }), /Invalid previous checkpoint signature/);
  await assert.rejects(createHistoryCheckpoint(fixture.directory, {
    ...old.material, checkpoint: jsonBytes({ ...old.checkpoint, created_at: "2026-05-02T00:00:00.000Z" })
  }), /Invalid previous checkpoint signature/);
});

test("an unrelated key cannot create or sign its way into a renewal without an authenticated migration", async (t) => {
  const previous = makeFixture(t);
  const current = makeFixture(t);
  const old = await signedCheckpoint(previous, "previous.json");
  assert.notEqual(sha256CanonicalJson(previous.authority), sha256CanonicalJson(current.authority));
  const priorOptions = ["--previous", old.path, "--previous-sig", `${old.path}.sig`, "--previous-authority", previous.authorityPath,
    "--previous-verify-dir", previous.directory];
  await assert.rejects(createHistoryCheckpoint(current.directory, old.material), /requires an authenticated migration from the previous authority/);
  const rejectedOutput = join(current.workspace, "rejected-renewal.json");
  assert.match(run(current, ["create", "--verify-dir", current.directory, "--out", rejectedOutput, ...priorOptions], 1).stderr, /requires an authenticated migration from the previous authority/);
  assert.equal(existsSync(rejectedOutput), false);

  const forged = await signedCheckpoint(current, "forged-renewal.json");
  forged.checkpoint.previous = {
    checkpoint: independentDigests(old.material.checkpoint), signature: independentDigests(old.material.signature),
    authority: independentDigests(old.material.authority)
  };
  writeJson(forged.path, forged.checkpoint);
  writeJson(`${forged.path}.sig`, signPayload(forged.checkpoint, current.keys, current.authority));
  const rejected = verifyCli(current, forged.path, priorOptions, 1);
  assert.equal(rejected.signature_valid, true);
  assert.match(rejected.errors.join("\n"), /Renewal has no authenticated migration from previous authority/);

  const transition = writeMigration(previous, current);
  const migrated = await signedCheckpoint(current, "migrated-renewal.json", { ...old.material, verifyDirectory: previous.directory });
  const snapshot = await verifyCheckpointFiles(migrated.checkpoint, current.directory);
  assert.deepEqual(snapshot.migrationAuthorities, new Set([transition.migration.old_root_authority_hash, transition.migration.new_root_authority_hash]));
  const accepted = verifyCli(current, migrated.path, priorOptions);
  assert.equal(accepted.status, "PASS");
  assert.equal(accepted.signature_valid, true);
  assert.equal(accepted.previous, "SNAPSHOT_AND_POLICY_CHECKED");
});

test("renewal creation and verification reject a post-quantum to classical downgrade", async (t) => {
  const previous = makeFixture(t, "pq");
  const current = makeFixture(t);
  const old = await signedCheckpoint(previous, "previous.json");
  await assert.rejects(createHistoryCheckpoint(current.directory, old.material), /Cryptographic downgrade/);
  const forged = await signedCheckpoint(current, "downgrade.json");
  forged.checkpoint.previous = {
    checkpoint: independentDigests(old.material.checkpoint), signature: independentDigests(old.material.signature),
    authority: independentDigests(old.material.authority)
  };
  const signature = signPayload(forged.checkpoint, current.keys, current.authority);
  assert.equal(verifySignatureFile(forged.checkpoint, signature, current.authority).ok, true);
  writeJson(forged.path, forged.checkpoint);
  writeJson(`${forged.path}.sig`, signature);
  const options = ["--previous", old.path, "--previous-sig", `${old.path}.sig`, "--previous-authority", previous.authorityPath];
  assert.match(run(current, verifyArgs(current, forged.path, options), 1).stderr, /Cryptographic downgrade/);
});

test("renewal schema requires all previous material and both digest algorithms for each", async (t) => {
  const fixture = makeFixture(t);
  const old = await signedCheckpoint(fixture, "previous.json");
  const renewed = await createHistoryCheckpoint(fixture.directory, old.material);
  for (const name of previousNames) {
    const missing = structuredClone(renewed);
    delete asObject(missing.previous ?? null, "previous")[name];
    assert.throws(() => validateHistoryCheckpoint(missing), /must be an object/);
    for (const digest of ["sha256", "sha512"] as const) {
      const incomplete = structuredClone(renewed);
      const previous = asObject(incomplete.previous ?? null, "previous");
      delete asObject(previous[name] ?? null, name)[digest];
      assert.throws(() => validateHistoryCheckpoint(incomplete), /sha256|SHA-512/);
    }
  }
});

test("synthetic SHA-256 OTS path checks an independently supplied 80-byte header/hash pin without claiming a live chain", () => {
  const header = Buffer.from(syntheticPin.header_hex, "hex");
  assert.equal(header.length, 80);
  assert.equal(independentBlockHash(header), syntheticPin.block_hash);
  const result = verifyCheckpointAnchor(anchorBytes, syntheticProof(anchorBytes), syntheticPin);
  assert.equal(result.status, "ANCHORED_TO_PINNED_BLOCK");
  assert.equal(result.block_hash, syntheticPin.block_hash);
  assert.equal(result.height, 42);
  assert.equal(result.block_time, fixedTime);
  assert.match(result.boundary, /independently establish canonical-chain membership and confirmations/);
  assert.match(result.boundary, /not exact wall-clock signing time/);
});

test("anchor verification rejects a proof for different checkpoint bytes, including formatting-only changes", () => {
  const proof = syntheticProof(anchorBytes);
  assert.throws(() => verifyCheckpointAnchor(Buffer.concat([anchorBytes, Buffer.from(" ")]), proof, syntheticPin), /digest does not bind/);
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, syntheticProof(Buffer.from("different checkpoint")), syntheticPin), /digest does not bind/);
});

test("anchor verification rejects malformed OTS data and oversized proofs", () => {
  const proof = syntheticProof(anchorBytes);
  const wrongMagic = Buffer.from(proof);
  wrongMagic[0] = 1;
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, wrongMagic, syntheticPin), /Invalid OpenTimestamps proof header/);
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, proof.subarray(0, -1), syntheticPin), /Unexpected end/);
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, Buffer.alloc(1024 * 1024 + 1), syntheticPin), /size limit/);
});

test("anchor verification rejects altered header bytes or a wrong independently supplied block hash", () => {
  const proof = syntheticProof(anchorBytes);
  const header = Buffer.from(syntheticPin.header_hex, "hex");
  header.writeUInt32LE(8, 76);
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, proof, { ...syntheticPin, header_hex: header.toString("hex") }), /block hash does not match header/);
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, proof, { ...syntheticPin, block_hash: "0".repeat(64) }), /block hash does not match header/);
});

for (const pin of [
  { ...syntheticPin, block_hash: "00" },
  { ...syntheticPin, block_hash: "z".repeat(64) },
  { ...syntheticPin, header_hex: syntheticPin.header_hex.slice(2) },
  { ...syntheticPin, header_hex: "z".repeat(160) },
  { ...syntheticPin, height: -1 },
  { ...syntheticPin, height: 42.5 },
  { ...syntheticPin, height: Number.MAX_SAFE_INTEGER + 1 },
  { ...syntheticPin, height: "42" }
]) {
  test(`anchor verification rejects invalid pin ${JSON.stringify(pin)}`, () => {
    assert.throws(() => verifyCheckpointAnchor(anchorBytes, syntheticProof(anchorBytes), pin), /Invalid trusted Bitcoin block pin/);
  });
}

test("anchor verification rejects the wrong attested height, Merkle root or attestation tag", () => {
  const proof = syntheticProof(anchorBytes);
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, proof, { ...syntheticPin, height: 43 }), /Merkle root and height/);
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, syntheticProof(anchorBytes, 43), syntheticPin), /Merkle root and height/);
  const header = Buffer.from(syntheticPin.header_hex, "hex");
  header.fill(0x22, 36, 68);
  const wrongMerklePin = { ...syntheticPin, header_hex: header.toString("hex"), block_hash: independentBlockHash(header) };
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, proof, wrongMerklePin), /Merkle root and height/);
  assert.throws(() => verifyCheckpointAnchor(anchorBytes, syntheticProof(anchorBytes, 42, "06869a0d73d71b45"), syntheticPin), /Merkle root and height/);
});

test("historical policy rejects classical signatures at or after cutoff despite valid mathematics and backdated metadata", (t) => {
  const fixture = makeFixture(t);
  assert.equal(verifySignatureFile(fixture.statement, fixture.statementSignature, fixture.authority).ok, true);
  assert.ok(Date.parse(fixture.statement.issued_at) < Date.parse(cutoff));
  for (const time of [cutoff, "2027-01-01T00:00:00.000Z"]) {
    const policy = assessHistoricalSignature(fixture.authority, { status: "ANCHORED_TO_PINNED_BLOCK", block_time: time }, cutoff);
    assert.equal(policy.accepted_under_supplied_policy, false);
    assert.equal(policy.status, "CLASSICAL_HISTORY_REQUIRES_PRE_CUTOFF_PROOF");
    assert.match(policy.boundary, /mathematical validity does not by itself establish historical authorship/);
  }
});

test("historical policy requires a checked anchor, not a claimed timestamp or unchecked status", (t) => {
  const fixture = makeFixture(t);
  for (const anchor of [
    { status: "NOT_CHECKED" },
    { status: "NOT_CHECKED", block_time: fixedTime },
    { status: "PENDING", block_time: fixedTime },
    { status: "ANCHORED", block_time: fixedTime },
    { status: "ANCHORED_TO_PINNED_BLOCK" },
    { status: "ANCHORED_TO_PINNED_BLOCK", block_time: "not-a-date" }
  ]) {
    const policy = assessHistoricalSignature(fixture.authority, anchor, cutoff);
    assert.equal(policy.accepted_under_supplied_policy, false, JSON.stringify(anchor));
    assert.equal(policy.status, "CLASSICAL_HISTORY_REQUIRES_PRE_CUTOFF_PROOF");
  }
  assert.throws(() => assessHistoricalSignature(fixture.authority, { status: "NOT_CHECKED" }, "invalid-cutoff"), /valid timestamp/);
});

test("historical policy accepts checked synthetic pre-cutoff evidence while no cutoff applies no retirement decision", (t) => {
  const fixture = makeFixture(t);
  const anchor = verifyCheckpointAnchor(anchorBytes, syntheticProof(anchorBytes), syntheticPin);
  const checked = assessHistoricalSignature(fixture.authority, anchor, cutoff);
  assert.equal(checked.accepted_under_supplied_policy, true);
  assert.equal(checked.status, "PRE_CUTOFF_EVIDENCE_CHECKED");
  const unconstrained = assessHistoricalSignature(fixture.authority, { status: "NOT_CHECKED" });
  assert.equal(unconstrained.accepted_under_supplied_policy, true);
  assert.equal(unconstrained.status, "NO_RETIREMENT_DECISION_APPLIED");
});

for (const profile of ["pq", "hybrid"] as const) {
  test(`${profile} signature validity makes no historical-time claim without checked evidence`, () => {
    const { keys, authority } = makeIdentity(profile);
    const payload = { type: "SyntheticHistoryPolicyPayload", issued_at: fixedTime };
    const signature = signPayload(payload, keys, authority);
    assert.equal(verifySignatureFile(payload, signature, authority).ok, true);
    const assurance = cryptoAssurance(authority);
    assert.equal(assurance.post_quantum_required, true);
    assert.equal(assurance.historical_time_evidence, "NOT_CHECKED");
    const policy = assessHistoricalSignature(authority, { status: "NOT_CHECKED" }, cutoff);
    assert.equal(policy.accepted_under_supplied_policy, true);
    assert.equal(policy.status, "NO_RETIREMENT_DECISION_APPLIED");
    assert.match(policy.boundary, /first publication time/);
    assert.equal(assessHistoricalSignature(authority, { status: "ANCHORED_TO_PINNED_BLOCK", block_time: "2027-01-01T00:00:00.000Z" }, cutoff).status, "NO_RETIREMENT_DECISION_APPLIED");
  });
}

test("CLI creates, signs, seals and verifies a local checkpoint without claiming checked time", (t) => {
  const fixture = makeFixture(t);
  const path = join(fixture.workspace, "checkpoint.json");
  const created = JSON.parse(run(fixture, ["create", "--verify-dir", fixture.directory, "--out", path]).stdout);
  assert.equal(created.status, "CREATED");
  assert.equal(created.external_time_evidence, "NOT_CHECKED");
  assert.equal(created.sha256, independentDigests(readFileSync(path)).sha256);
  assert.equal(created.sha512, independentDigests(readFileSync(path)).sha512);
  run(fixture, ["sign", "--in", path, "--authority", fixture.authorityPath, "--key", fixture.keyPath]);
  const sealed = JSON.parse(run(fixture, ["seal", "--in", path, "--authority", fixture.authorityPath]).stdout);
  assert.equal(sealed.status, "SEALED");
  assert.equal(sealed.file, `${path}.seal.json`);
  const sealBytes = readFileSync(sealed.file);
  assert.equal(sealed.sha256, independentDigests(sealBytes).sha256);
  assert.equal(sealed.sha512, independentDigests(sealBytes).sha512);
  assert.deepEqual(JSON.parse(sealBytes.toString()), {
    type: "OrgAnchorHistorySeal", version: "1.0", checkpoint: independentDigests(readFileSync(path)),
    signature: independentDigests(readFileSync(`${path}.sig`)), authority: independentDigests(readFileSync(fixture.authorityPath))
  });
  const result = verifyCli(fixture, path);
  assert.equal(result.status, "PASS");
  assert.equal(result.signature_valid, true);
  assert.equal(result.files_checked, 4);
  assert.equal(result.time_evidence.status, "NOT_CHECKED");
  assert.equal(result.crypto_assurance.historical_time_evidence, "NOT_CHECKED");
  assert.equal(result.historical_policy.status, "NO_RETIREMENT_DECISION_APPLIED");
  assert.equal(result.previous, "NOT_INCLUDED");
});

test("CLI refuses checkpoint output inside the snapshot and refuses a mismatched signing authority", async (t) => {
  const fixture = makeFixture(t);
  const inside = join(fixture.directory, "checkpoint.json");
  assert.match(run(fixture, ["create", "--verify-dir", fixture.directory, "--out", inside], 1).stderr, /outside the snapshotted directory/);
  assert.equal(existsSync(inside), false);
  const signed = await signedCheckpoint(fixture);
  const wrongPath = join(fixture.workspace, "wrong-authority.json");
  writeJson(wrongPath, { ...fixture.authority, authority_id: "same-key-wrong-authority" });
  assert.match(run(fixture, ["sign", "--in", signed.path, "--authority", wrongPath, "--key", fixture.keyPath], 1).stderr, /declared snapshot authority/);
});

test("CLI rejects mismatched authority and authority pin even when signature mathematics still pass", async (t) => {
  const fixture = makeFixture(t);
  const signed = await signedCheckpoint(fixture);
  const wrongPath = join(fixture.workspace, "wrong-authority.json");
  writeJson(wrongPath, { ...fixture.authority, authority_id: "same-key-wrong-authority" });
  const wrongAuthority = verifyCli(fixture, signed.path, ["--authority", wrongPath], 1);
  assert.equal(wrongAuthority.signature_valid, true);
  assert.equal(wrongAuthority.status, "FAIL");
  assert.match(wrongAuthority.errors.join("\n"), /Checkpoint authority hash mismatch/);
  const wrongPin = verifyCli(fixture, signed.path, ["--expected-authority-hash", `sha256:${"0".repeat(64)}`], 1);
  assert.match(wrongPin.errors.join("\n"), /Pinned authority hash mismatch/);
  assert.equal(verifyCli(fixture, signed.path, ["--expected-authority-hash", sha256CanonicalJson(fixture.authority)]).status, "PASS");
});

test("CLI reports corrupted checkpoint signature independently of intact file bindings", async (t) => {
  const fixture = makeFixture(t);
  const signed = await signedCheckpoint(fixture);
  writeJson(`${signed.path}.sig`, corruptSignature(signed.signature));
  const result = verifyCli(fixture, signed.path, [], 1);
  assert.equal(result.signature_valid, false);
  assert.equal(result.status, "FAIL");
  assert.match(result.errors.join("\n"), /Invalid signature/);
});

test("CLI distinguishes valid classical signatures from unchecked, pre-cutoff and post-cutoff time evidence", async (t) => {
  const fixture = makeFixture(t);
  const signed = await signedCheckpoint(fixture);
  const noTime = verifyCli(fixture, signed.path, ["--classical-cutoff", cutoff], 1);
  assert.equal(noTime.signature_valid, true);
  assert.equal(noTime.time_evidence.status, "NOT_CHECKED");
  assert.equal(noTime.historical_policy.accepted_under_supplied_policy, false);
  const anchorOptions = writeAnchor(fixture, signed.path);
  const checked = verifyCli(fixture, signed.path, [...anchorOptions, "--classical-cutoff", cutoff, "--before", cutoff]);
  assert.equal(checked.signature_valid, true);
  assert.equal(checked.time_evidence.status, "ANCHORED_TO_PINNED_BLOCK");
  assert.equal(checked.historical_policy.status, "PRE_CUTOFF_EVIDENCE_CHECKED");
  const tooLate = verifyCli(fixture, signed.path, [...anchorOptions, "--classical-cutoff", fixedTime], 1);
  assert.equal(tooLate.signature_valid, true);
  assert.match(tooLate.errors.join("\n"), /CLASSICAL_HISTORY_REQUIRES_PRE_CUTOFF_PROOF/);
  assert.match(verifyCli(fixture, signed.path, ["--before", cutoff], 1).errors.join("\n"), /checked independently pinned timestamp/);
  assert.match(verifyCli(fixture, signed.path, [...anchorOptions, "--before", fixedTime], 1).errors.join("\n"), /checked independently pinned timestamp/);
  assert.match(verifyCli(fixture, signed.path, ["--require-post-quantum"], 1).errors.join("\n"), /requires post-quantum/);
});

test("CLI trusted time requires seal, proof and trusted block pin together", async (t) => {
  const fixture = makeFixture(t);
  const signed = await signedCheckpoint(fixture);
  const options = writeAnchor(fixture, signed.path);
  assert.match(run(fixture, verifyArgs(fixture, signed.path, options.slice(0, 4)), 1).stderr, /--trusted-bitcoin-block is required/);
  assert.match(run(fixture, verifyArgs(fixture, signed.path, [...options.slice(0, 2), ...options.slice(4)]), 1).stderr, /--proof is required/);
  assert.match(run(fixture, verifyArgs(fixture, signed.path, options.slice(2)), 1).stderr, /--seal is required/);
});

test("CLI payload-only anchor cannot bypass the classical cutoff with or without a seal", async (t) => {
  const fixture = makeFixture(t);
  const signed = await signedCheckpoint(fixture);
  const options = writeAnchor(fixture, signed.path);
  const payloadOnly = writeProofAndPin(fixture, readFileSync(signed.path));
  assert.match(run(fixture, verifyArgs(fixture, signed.path, [...payloadOnly, "--classical-cutoff", cutoff]), 1).stderr, /--seal is required/);
  assert.match(run(fixture, verifyArgs(fixture, signed.path, [...options, "--classical-cutoff", cutoff]), 1).stderr, /Timestamp digest does not bind/);
  const unchecked = verifyCli(fixture, signed.path, ["--seal", `${signed.path}.seal.json`, "--classical-cutoff", cutoff], 1);
  assert.equal(unchecked.signature_valid, true);
  assert.equal(unchecked.time_evidence.status, "NOT_CHECKED");
  assert.equal(unchecked.historical_policy.accepted_under_supplied_policy, false);
});

test("CLI rejects changed raw checkpoint, signature and authority bytes against the timestamped seal", async (t) => {
  const fixture = makeFixture(t);
  const signed = await signedCheckpoint(fixture);
  const authorityCopy = join(fixture.workspace, "sealed-authority.json");
  writeFileSync(authorityCopy, readFileSync(fixture.authorityPath));
  const options = [...writeAnchor(fixture, signed.path), "--authority", authorityCopy, "--classical-cutoff", cutoff];
  assert.equal(verifyCli(fixture, signed.path, options).status, "PASS");
  for (const [name, path] of [
    ["checkpoint", signed.path], ["signature", `${signed.path}.sig`], ["authority", authorityCopy]
  ]) {
    assert.ok(path);
    const original = readFileSync(path);
    writeFileSync(path, Buffer.concat([original, Buffer.from(" \n")]));
    assert.match(run(fixture, verifyArgs(fixture, signed.path, options), 1).stderr, new RegExp(`History seal ${name} hash mismatch`));
    writeFileSync(path, original);
  }
  const checkpointBytes = readFileSync(signed.path);
  const tamperedSignature = corruptSignature(signed.signature);
  assert.equal(tamperedSignature.hash.value, signed.signature.hash.value);
  writeJson(`${signed.path}.sig`, tamperedSignature);
  assert.deepEqual(readFileSync(signed.path), checkpointBytes);
  assert.match(run(fixture, verifyArgs(fixture, signed.path, options), 1).stderr, /History seal signature hash mismatch/);
});

test("CLI sealing rejects invalid signatures and an authority mismatch even with the same signing key", async (t) => {
  const fixture = makeFixture(t);
  const signed = await signedCheckpoint(fixture);
  const wrongPath = join(fixture.workspace, "wrong-authority.json");
  writeJson(wrongPath, { ...fixture.authority, authority_id: "wrong-sealing-authority" });
  assert.match(run(fixture, ["seal", "--in", signed.path, "--authority", wrongPath], 1).stderr, /Cannot seal an invalid or incomplete checkpoint signature/);
  writeJson(`${signed.path}.sig`, corruptSignature(signed.signature));
  assert.match(run(fixture, ["seal", "--in", signed.path, "--authority", fixture.authorityPath], 1).stderr, /Cannot seal an invalid or incomplete checkpoint signature/);
  assert.equal(existsSync(`${signed.path}.seal.json`), false);
});

test("CLI renewal requires prior checkpoint, signature and authority and verifies each exact-byte hash", async (t) => {
  const fixture = makeFixture(t);
  const old = await signedCheckpoint(fixture, "previous.json");
  const path = join(fixture.workspace, "renewed.json");
  const priorOptions = ["--previous", old.path, "--previous-sig", `${old.path}.sig`, "--previous-authority", fixture.authorityPath];
  run(fixture, ["create", "--verify-dir", fixture.directory, "--out", path, ...priorOptions]);
  run(fixture, ["sign", "--in", path, "--authority", fixture.authorityPath, "--key", fixture.keyPath]);
  assert.match(verifyCli(fixture, path, [], 1).errors.join("\n"), /Renewal requires previous checkpoint, signature and authority/);
  const good = verifyCli(fixture, path, priorOptions);
  assert.equal(good.previous, "SNAPSHOT_AND_POLICY_CHECKED");
  for (const name of previousNames) {
    const index = previousNames.indexOf(name) * 2;
    const incomplete = priorOptions.filter((_, i) => i !== index && i !== index + 1);
    assert.match(run(fixture, verifyArgs(fixture, path, incomplete), 1).stderr, /is required/);
    const originalPath = priorOptions[index + 1];
    assert.ok(originalPath);
    const modifiedPath = join(fixture.workspace, `reformatted-${name}.json`);
    writeFileSync(modifiedPath, Buffer.concat([readFileSync(originalPath), Buffer.from(" \n")]));
    const modifiedOptions = [...priorOptions];
    modifiedOptions[index + 1] = modifiedPath;
    const result = verifyCli(fixture, path, modifiedOptions, 1);
    assert.equal(result.signature_valid, true);
    assert.match(result.errors.join("\n"), new RegExp(`Previous ${name} hash mismatch`));
  }
});

test("CLI renewal verifies both algorithms for every prior hash even when the renewed checkpoint is re-signed", async (t) => {
  const fixture = makeFixture(t);
  const old = await signedCheckpoint(fixture, "previous.json");
  const checkpoint = await createHistoryCheckpoint(fixture.directory, old.material);
  const path = join(fixture.workspace, "renewed.json");
  const options = ["--previous", old.path, "--previous-sig", `${old.path}.sig`, "--previous-authority", fixture.authorityPath];
  for (const name of previousNames) {
    for (const digest of ["sha256", "sha512"] as const) {
      const tampered = structuredClone(checkpoint);
      const previous = asObject(tampered.previous ?? null, "previous");
      asObject(previous[name] ?? null, name)[digest] = `${digest}:${"0".repeat(digest === "sha256" ? 64 : 128)}`;
      writeJson(path, tampered);
      writeJson(`${path}.sig`, signPayload(tampered, fixture.keys, fixture.authority));
      const result = verifyCli(fixture, path, options, 1);
      assert.equal(result.signature_valid, true);
      assert.match(result.errors.join("\n"), new RegExp(`Previous ${name} hash mismatch`));
    }
  }
});

test("CLI renewal requires the prior classical checkpoint's own pre-cutoff proof", async (t) => {
  const fixture = makeFixture(t);
  const old = await signedCheckpoint(fixture, "previous.json");
  const renewed = await signedCheckpoint(fixture, "renewed.json", old.material);
  const options = ["--previous", old.path, "--previous-sig", `${old.path}.sig`, "--previous-authority", fixture.authorityPath,
    "--classical-cutoff", cutoff, ...writeAnchor(fixture, renewed.path)];
  const missingOldTime = verifyCli(fixture, renewed.path, options, 1);
  assert.equal(missingOldTime.signature_valid, true);
  assert.equal(missingOldTime.historical_policy.accepted_under_supplied_policy, true);
  assert.match(missingOldTime.errors.join("\n"), /Previous classical checkpoint requires its own pre-cutoff timestamp proof/);
  const result = verifyCli(fixture, renewed.path, [...options, ...writeAnchor(fixture, old.path, "previous-")]);
  assert.equal(result.status, "PASS");
});

test("CLI post-quantum checkpoint passes algorithm policy but still makes no time claim", async (t) => {
  const fixture = makeFixture(t, "pq");
  const signed = await signedCheckpoint(fixture);
  const result = verifyCli(fixture, signed.path, ["--require-post-quantum", "--classical-cutoff", cutoff]);
  assert.equal(result.status, "PASS");
  assert.equal(result.signature_valid, true);
  assert.equal(result.crypto_assurance.post_quantum_required, true);
  assert.equal(result.crypto_assurance.historical_time_evidence, "NOT_CHECKED");
  assert.equal(result.time_evidence.status, "NOT_CHECKED");
  assert.equal(result.historical_policy.status, "NO_RETIREMENT_DECISION_APPLIED");
  const before = verifyCli(fixture, signed.path, ["--require-post-quantum", "--before", cutoff], 1);
  assert.equal(before.signature_valid, true);
  assert.match(before.errors.join("\n"), /checked independently pinned timestamp/);
});

for (const profile of ["hybrid", "pq"] as const) {
  test(`CLI ${profile} successor cannot bypass cutoff for an old Ed25519 migration`, async (t) => {
    const previous = makeFixture(t);
    const current = makeFixture(t, profile);
    const old = await signedCheckpoint(previous, "previous.json");
    const transition = writeMigration(previous, current);
    assert.equal(verifySignatureFile(transition.migration, transition.authorization, previous.authority).ok, true);
    assert.equal(verifySignatureFile(transition.migration, transition.acceptance, current.authority).ok, true);
    const signed = await signedCheckpoint(current, "renewed.json", { ...old.material, verifyDirectory: previous.directory });
    const snapshot = await verifyCheckpointFiles(signed.checkpoint, current.directory);
    const migrationHashes = transition.paths.map((path) => independentDigests(readFileSync(join(current.directory, path))).sha256);
    assert.equal(migrationHashes.length, 3);
    assert.deepEqual(new Set(snapshot.classicalAuthorizationHashes), new Set(migrationHashes));
    assert.equal(old.checkpoint.files.some((file) => migrationHashes.includes(file.sha256)), false);
    const options = ["--previous", old.path, "--previous-sig", `${old.path}.sig`, "--previous-authority", previous.authorityPath, "--previous-verify-dir", previous.directory,
      "--require-post-quantum", ...writeAnchor(previous, old.path, "previous-")];
    assert.equal(verifyCli(current, signed.path, options).status, "PASS");

    const unchecked = verifyCli(current, signed.path, [...options, "--classical-cutoff", cutoff], 1);
    assert.equal(unchecked.signature_valid, true);
    assert.equal(unchecked.crypto_assurance.post_quantum_required, true);
    assert.equal(unchecked.historical_policy.accepted_under_supplied_policy, true);
    assert.equal(unchecked.time_evidence.status, "NOT_CHECKED");
    assert.equal(unchecked.migration_pre_cutoff_required, true);
    assert.equal(unchecked.migration_pre_cutoff_checked, false);
    assert.match(unchecked.errors.join("\n"), /Classical migration authorization requires pre-cutoff evidence/);
    assert.doesNotMatch(unchecked.errors.join("\n"), /Previous classical checkpoint requires its own pre-cutoff/);

    const anchored = [...options, ...writeAnchor(current, signed.path)];
    for (const retirement of [fixedTime, "2026-04-30T00:00:00.000Z"]) {
      const late = verifyCli(current, signed.path, [...anchored, "--classical-cutoff", retirement], 1);
      assert.equal(late.signature_valid, true);
      assert.equal(late.historical_policy.accepted_under_supplied_policy, true);
      assert.equal(late.time_evidence.status, "ANCHORED_TO_PINNED_BLOCK");
      assert.equal(late.migration_pre_cutoff_checked, false);
      assert.match(late.errors.join("\n"), /a successor's PQ signature cannot repair late migration/);
    }
    const checked = verifyCli(current, signed.path, [...anchored, "--classical-cutoff", cutoff]);
    assert.equal(checked.status, "PASS");
    assert.equal(checked.migration_pre_cutoff_required, true);
    assert.equal(checked.migration_pre_cutoff_checked, true);
  });
}

test("checkpoint rejects missing, contradictory and mismatched migration indexes", async (t) => {
  const old = makeFixture(t);
  const current = makeFixture(t, "hybrid");
  const transition = writeMigration(old, current);
  const original = await signedCheckpoint(current);
  const validIndex = JSON.parse(readFileSync(join(current.directory, "organchor.json"), "utf8"));
  const variants = [
    { root_continuity: validIndex.root_continuity },
    { migration_history: validIndex.migration_history },
    { ...validIndex, migration_history: { status: "NOT_INCLUDED", migrations: [] } },
    { ...validIndex, root_continuity: { status: "CURRENT_ROOT_ONLY", migration_chain: [] } },
    { migration_history: { status: "PASS" }, root_continuity: { status: "MIGRATION_CHAIN_VERIFIED" } },
    { migration_history: { migrations: "omitted" }, root_continuity: validIndex.root_continuity },
    { ...validIndex, root_continuity: { ...validIndex.root_continuity, status: "CURRENT_ROOT_ONLY" } }
  ];
  for (const field of ["path", "hash", "signature_path", "signature_hash", "acceptance_path", "acceptance_hash"]) {
    const mismatched = structuredClone(validIndex);
    mismatched.root_continuity.migration_chain[0][field] = field.endsWith("hash") ? `sha256:${"0".repeat(64)}` : "migrations/different.json";
    variants.push(mismatched);
  }
  for (const index of variants) {
    writeJson(join(current.directory, "organchor.json"), index);
    await assert.rejects(createHistoryCheckpoint(current.directory), /migration indexes|migration continuity|must be an array|index status/i);
    const forged = structuredClone(original.checkpoint);
    const bytes = readFileSync(join(current.directory, "organchor.json"));
    Object.assign(fileEntry(forged, "organchor.json"), { size: bytes.length, ...independentDigests(bytes) });
    await assert.rejects(verifyCheckpointFiles(forged, current.directory), /migration indexes|migration continuity|must be an array|index status/i);
  }
  writeJson(join(current.directory, "organchor.json"), variants[0]!);
  const omitted = structuredClone(original.checkpoint);
  const bytes = readFileSync(join(current.directory, "organchor.json"));
  Object.assign(fileEntry(omitted, "organchor.json"), { size: bytes.length, ...independentDigests(bytes) });
  const path = storeCheckpoint(current, omitted, "omitted-index.json").path;
  assert.match(run(current, verifyArgs(current, path, ["--classical-cutoff", cutoff]), 1).stderr, /Migration indexes/);
  writeJson(join(current.directory, "organchor.json"), validIndex);
  assert.equal((await verifyCheckpointFiles(original.checkpoint, current.directory)).classicalAuthorizationFiles.length, transition.paths.length);
});

test("renewal rechecks the preserved previous snapshot and rejects failed A laundered into same-root B", async (t) => {
  const old = makeFixture(t);
  const fixture = makeFixture(t, "hybrid");
  writeMigration(old, fixture);
  const a = await signedCheckpoint(fixture, "a.json");
  const policy = ["--classical-cutoff", cutoff, "--require-post-quantum"];
  assert.equal(verifyCli(fixture, a.path, policy, 1).migration_pre_cutoff_required, true);
  const preserved = join(fixture.workspace, "preserved-a");
  cpSync(fixture.directory, preserved, { recursive: true });
  writeJson(join(fixture.directory, "organchor.json"), { type: "SyntheticDiscoveryIndex" });
  await assert.rejects(createHistoryCheckpoint(fixture.directory, a.material), /preserved --previous-verify-dir/);
  const b = await signedCheckpoint(fixture, "b.json", { ...a.material, verifyDirectory: preserved });
  const previous = previousOptions(fixture, a.path);
  const missingSnapshot = verifyCli(fixture, b.path, [...policy, ...previous], 1);
  assert.match(missingSnapshot.errors.join("\n"), /Previous snapshot verification failed/);
  const rejected = verifyCli(fixture, b.path, [...policy, ...previous, "--previous-verify-dir", preserved], 1);
  assert.equal(rejected.signature_valid, true);
  assert.equal(rejected.previous_lineage.snapshot_checked, true);
  assert.equal(rejected.migration_pre_cutoff_required, true);
  assert.equal(rejected.migration_pre_cutoff_checked, false);
  assert.equal(rejected.cache_eligible, false);
  assert.match(rejected.errors.join("\n"), /Previous snapshot classical migration authorization requires its own pre-cutoff evidence/);
  b.checkpoint.trusted_previous_checkpoint_hash = independentDigests(a.material.checkpoint).sha256;
  b.checkpoint.lineage_verified = true;
  storeCheckpoint(fixture, b.checkpoint, "b.json");
  assert.equal(verifyCli(fixture, b.path, [...policy, ...previous, "--previous-verify-dir", preserved], 1).status, "FAIL");
});

test("multilevel renewal requires an exact verifier-owned cache pin and ignores publisher trust claims", async (t) => {
  const fixture = makeFixture(t, "pq");
  const a = await signedCheckpoint(fixture, "a.json");
  const b = await signedCheckpoint(fixture, "b.json", a.material);
  const bResult = verifyCli(fixture, b.path, [...previousOptions(fixture, a.path), "--classical-cutoff", cutoff]);
  assert.equal(bResult.status, "PASS");
  assert.equal(bResult.checkpoint_file_hash, independentDigests(readFileSync(b.path)).sha256);
  const c = await signedCheckpoint(fixture, "c.json", b.material);
  c.checkpoint.trusted_previous_checkpoint_hash = bResult.checkpoint_file_hash;
  c.checkpoint.lineage_verified = true;
  storeCheckpoint(fixture, c.checkpoint, "c.json");
  const options = [...previousOptions(fixture, b.path), "--classical-cutoff", cutoff];
  const missing = verifyCli(fixture, c.path, options, 1);
  assert.equal(missing.previous_lineage.status, "DEEPER_ANCESTRY_NOT_CHECKED");
  assert.equal(missing.previous_lineage.trusted_cache_pin_checked, false);
  assert.match(missing.errors.join("\n"), /older ancestry.*--trusted-previous-checkpoint-hash/);
  const wrong = verifyCli(fixture, c.path, [...options, "--trusted-previous-checkpoint-hash", `sha256:${"0".repeat(64)}`], 1);
  assert.match(wrong.errors.join("\n"), /does not match the exact previous checkpoint file/);
  const accepted = verifyCli(fixture, c.path, [...options, "--trusted-previous-checkpoint-hash", bResult.checkpoint_file_hash]);
  assert.equal(accepted.status, "PASS");
  assert.equal(accepted.previous_lineage.status, "VERIFIER_CACHE_PIN_CHECKED");
  assert.equal(accepted.previous_lineage.policy_source, "VERIFIER_OWNED_CACHE");
  assert.match(accepted.previous_lineage.cache_boundary, /same or stricter policy.*never from publisher-signed metadata/);
  const reformatted = join(fixture.workspace, "b-reformatted.json");
  writeFileSync(reformatted, Buffer.concat([b.material.checkpoint, Buffer.from(" \n")]));
  const mismatch = verifyCli(fixture, c.path, [...options, "--previous", reformatted, "--trusted-previous-checkpoint-hash", bResult.checkpoint_file_hash], 1);
  assert.match(mismatch.errors.join("\n"), /Trusted previous checkpoint hash does not match/);
});

test("pre-cutoff A supports post-cutoff B and cache-pinned post-cutoff C through hybrid to PQ", async (t) => {
  const original = makeFixture(t);
  const aFixture = makeFixture(t, "hybrid");
  const transition = writeMigration(original, aFixture);
  const a = await signedCheckpoint(aFixture, "a.json");
  const policy = ["--classical-cutoff", cutoff, "--require-post-quantum"];
  assert.equal(verifyCli(aFixture, a.path, [...policy, ...writeAnchor(aFixture, a.path)]).status, "PASS");
  const bFixture = makeFixture(t, "hybrid", aFixture);
  cpSync(aFixture.directory, bFixture.directory, { recursive: true });
  const b = await signedCheckpoint(bFixture, "b.json", { ...a.material, verifyDirectory: aFixture.directory });
  const after = "2026-07-01T00:00:00.000Z";
  const bOptions = [...policy, ...previousOptions(aFixture, a.path), "--previous-verify-dir", aFixture.directory,
    ...writeAnchor(aFixture, a.path, "previous-"), ...writeAnchor(bFixture, b.path, "", after)];
  const verifiedB = verifyCli(bFixture, b.path, bOptions);
  assert.equal(verifiedB.status, "PASS");
  assert.ok(Date.parse(verifiedB.time_evidence.block_time!) > Date.parse(cutoff));
  assert.equal(verifiedB.migration_pre_cutoff_checked, true);
  assert.equal(verifiedB.cache_eligible, true);

  const cFixture = makeFixture(t, "pq");
  writeMigration(bFixture, cFixture, transition);
  const c = await signedCheckpoint(cFixture, "c.json", { ...b.material, verifyDirectory: bFixture.directory });
  const cOptions = [...policy, ...previousOptions(bFixture, b.path), "--previous-verify-dir", bFixture.directory,
    ...writeAnchor(bFixture, b.path, "previous-", after), ...writeAnchor(cFixture, c.path, "", after)];
  const missing = verifyCli(cFixture, c.path, cOptions, 1);
  assert.match(missing.errors.join("\n"), /older ancestry/);
  const pinnedOptions = [...cOptions, "--trusted-previous-checkpoint-hash", verifiedB.checkpoint_file_hash];
  const checked = verifyCli(cFixture, c.path, pinnedOptions);
  assert.equal(checked.status, "PASS");
  assert.equal(checked.crypto_assurance.profile, "POST_QUANTUM_ONLY");
  assert.equal(checked.migration_pre_cutoff_required, true);
  assert.equal(checked.migration_pre_cutoff_checked, true);
  assert.equal(checked.previous_lineage.trusted_cache_pin_checked, true);
  assert.ok(Date.parse(checked.time_evidence.block_time!) > Date.parse(cutoff));

  const index = JSON.parse(readFileSync(join(cFixture.directory, "organchor.json"), "utf8"));
  const first = index.migration_history.migrations[0];
  const forgedMigration = { ...transition.migration, reason: "New post-cutoff migration bytes absent from the verifier cache" };
  const forgedAuthorization = signPayload(forgedMigration, original.keys, original.authority);
  const forgedAcceptance = signPayload(forgedMigration, bFixture.keys, bFixture.authority);
  writeJson(join(cFixture.directory, first.path), forgedMigration);
  writeJson(join(cFixture.directory, first.signature_path), forgedAuthorization);
  writeJson(join(cFixture.directory, first.acceptance_path), forgedAcceptance);
  Object.assign(first, { hash: sha256CanonicalJson(forgedMigration), signature_hash: sha256CanonicalJson(forgedAuthorization), acceptance_hash: sha256CanonicalJson(forgedAcceptance) });
  const second = index.migration_history.migrations[1];
  const nextMigration = JSON.parse(readFileSync(join(cFixture.directory, second.path), "utf8"));
  nextMigration.previous_migration_hash = sha256CanonicalJson(forgedMigration);
  const nextAuthorization = signPayload(nextMigration, bFixture.keys, bFixture.authority);
  const nextAcceptance = signPayload(nextMigration, cFixture.keys, cFixture.authority);
  writeJson(join(cFixture.directory, second.path), nextMigration);
  writeJson(join(cFixture.directory, second.signature_path), nextAuthorization);
  writeJson(join(cFixture.directory, second.acceptance_path), nextAcceptance);
  Object.assign(second, { hash: sha256CanonicalJson(nextMigration), signature_hash: sha256CanonicalJson(nextAuthorization), acceptance_hash: sha256CanonicalJson(nextAcceptance) });
  index.root_continuity.migration_chain = structuredClone(index.migration_history.migrations);
  writeJson(join(cFixture.directory, "organchor.json"), index);
  const forgedC = await signedCheckpoint(cFixture, "forged-c.json", { ...b.material, verifyDirectory: bFixture.directory });
  const refused = verifyCli(cFixture, forgedC.path, [...policy, ...previousOptions(bFixture, b.path),
    "--previous-verify-dir", bFixture.directory, "--trusted-previous-checkpoint-hash", verifiedB.checkpoint_file_hash], 1);
  assert.match(refused.errors.join("\n"), /Classical migration authorization requires pre-cutoff evidence/);
});

test("CLI security policy flags reject missing values instead of silently weakening verification", async (t) => {
  const fixture = makeFixture(t, "pq");
  const signed = await signedCheckpoint(fixture);
  for (const option of ["classical-cutoff", "before", "expected-authority-hash"]) {
    const result = run(fixture, verifyArgs(fixture, signed.path, [`--${option}`]), 1);
    assert.match(result.stderr, new RegExp(`--${option} requires a value`));
    assert.equal(result.stdout, "");
  }
});

test("CLI checkpoint PQ policy rejects supplied string values rather than accepting classical signatures", async (t) => {
  const fixture = makeFixture(t);
  const signed = await signedCheckpoint(fixture);
  for (const flags of [["--require-post-quantum", "true"], ["--require-post-quantum=true"], ["--require-post-quantum", "false"]]) {
    const result = run(fixture, verifyArgs(fixture, signed.path, flags), 1);
    assert.match(result.stderr, /--require-post-quantum is a flag without a value/);
    assert.equal(result.stdout, "");
  }
  const enforced = verifyCli(fixture, signed.path, ["--require-post-quantum"], 1);
  assert.ok(enforced.errors.some((error) => /requires post-quantum/.test(error)));
  assert.equal(enforced.cache_eligible, false);
});

function makeIdentity(profile: "classical" | "pq" | "hybrid" = "classical") {
  const algorithms = profile === "classical" ? ["ed25519"] as const : profile === "pq" ? ["ml-dsa-65"] as const : ["ed25519", "ml-dsa-65"] as const;
  const keys = algorithms.map((algorithm) => generatePrivateKey(`root-${algorithm}`, algorithm, "holder-1"));
  const v2 = profile !== "classical";
  const authority = validateRootAuthority({
    schema: `https://organchor.org/schemas/root-authority.v${v2 ? 2 : 1}.json`,
    type: "OrgAnchorRootAuthority", version: v2 ? "2.0" : "1.0", authority_id: "synthetic-history-authority",
    created_at: fixedTime, threshold: { required: 1, total: 1 }, keys: keys.map(rootAuthorityKeyFromPrivate),
    ...(v2 ? { signing_policy: profile === "pq" ? "ml-dsa-65" : "hybrid-ed25519-ml-dsa-65" } : {})
  });
  return { keys, authority };
}

function makeFixture(t: TestContext, profile: "classical" | "pq" | "hybrid" = "classical", identity?: ReturnType<typeof makeIdentity>) {
  const workspace = mkdtempSync(join(tmpdir(), "organchor-history-test-"));
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  const directory = join(workspace, "public", "verify");
  mkdirSync(directory, { recursive: true });
  const { keys, authority } = identity ?? makeIdentity(profile);
  const statement: OfficialEndpointsStatement = validateOfficialStatement({
    schema: "https://organchor.org/schemas/official-endpoints.v1.json", type: "OfficialOrganizationEndpoints", version: "1.0",
    statement_id: "synthetic-history-statement", issued_at: fixedTime,
    organization: { name: "Synthetic Org", display_name: "Synthetic Organization" },
    root_authority: authority, root_authority_hash: sha256CanonicalJson(authority),
    official_endpoints: { website: "https://history.example", verify: "https://history.example/verify" },
    archives: { arweave: [], ipfs: [] }, disaster_recovery: { onion: null }, auxiliary_names: { ens: null },
    domain_security: {}, notes: "Local synthetic test data, not a historical publication claim."
  });
  const statementSignature = signPayload(statement, keys, authority);
  const authorityPath = join(directory, "root-authority.json");
  const keyPath = join(workspace, "signer.private.json");
  const key = keys[0];
  assert.ok(key);
  writeJson(keyPath, key);
  writeJson(authorityPath, authority);
  writeJson(join(directory, "official-endpoints.json"), statement);
  writeJson(join(directory, "official-endpoints.json.sig"), statementSignature);
  writeJson(join(directory, "organchor.json"), { type: "SyntheticDiscoveryIndex", statement: "official-endpoints.json" });
  return { workspace, directory, authorityPath, keyPath, keys, authority, statement, statementSignature };
}

type Fixture = ReturnType<typeof makeFixture>;
type PreviousMaterial = { checkpoint: Buffer; signature: Buffer; authority: Buffer; verifyDirectory?: string };

function writeMigration(previous: Fixture, current: Fixture, predecessor?: { migration: RootAuthorityMigration; paths: string[] }) {
  const v2 = previous.authority.version === "2.0" || current.authority.version === "2.0";
  const migration = validateRootAuthorityMigration({
    schema: `https://organchor.org/schemas/root-authority-migration.v${v2 ? 2 : 1}.json`,
    type: "OrgAnchorRootAuthorityMigration", version: v2 ? "2.0" : "1.0",
    ...(v2 ? { sequence: predecessor ? Number(predecessor.migration.sequence ?? 0) + 1 : 1, previous_migration_hash: predecessor ? sha256CanonicalJson(predecessor.migration) : null } : {}),
    migration_id: "synthetic-history-migration", issued_at: fixedTime, effective_at: fixedTime,
    reason: "Local synthetic authority transition.", old_root_authority: previous.authority,
    old_root_authority_hash: sha256CanonicalJson(previous.authority), new_root_authority: current.authority,
    new_root_authority_hash: sha256CanonicalJson(current.authority),
    supersedes_statement_hashes: [sha256CanonicalJson(previous.statement)], notes: "No live-chain or publication-time claim."
  });
  const authorization = signPayload(migration, previous.keys, previous.authority);
  const acceptance = signPayload(migration, current.keys, current.authority);
  const name = predecessor ? "next-transition.json" : "transition.json";
  const reference = {
    path: `migrations/${name}`, hash: sha256CanonicalJson(migration),
    signature_path: `migrations/${name}.sig`, signature_hash: sha256CanonicalJson(authorization),
    ...(v2 ? { acceptance_path: `migrations/${name}.acceptance.sig`, acceptance_hash: sha256CanonicalJson(acceptance) } : {})
  };
  mkdirSync(join(current.directory, "migrations"), { recursive: true });
  const priorReferences: JsonValue[] = predecessor ? JSON.parse(readFileSync(join(previous.directory, "organchor.json"), "utf8")).migration_history.migrations : [];
  for (const path of predecessor?.paths ?? []) cpSync(join(previous.directory, path), join(current.directory, path));
  writeJson(join(current.directory, reference.path), migration);
  writeJson(join(current.directory, reference.signature_path), authorization);
  if (reference.acceptance_path) writeJson(join(current.directory, reference.acceptance_path), acceptance);
  writeJson(join(current.directory, "organchor.json"), {
    migration_history: { status: "PASS", migrations: [...priorReferences, reference] },
    root_continuity: { status: "MIGRATION_CHAIN_VERIFIED", migration_chain: [...priorReferences, reference] }
  });
  return { migration, authorization, acceptance, reference,
    paths: [...(predecessor?.paths ?? []), reference.path, reference.signature_path, ...(reference.acceptance_path ? [reference.acceptance_path] : [])] };
}

async function signedCheckpoint(fixture: Fixture, name = "checkpoint.json", previous?: PreviousMaterial) {
  const checkpoint = await createHistoryCheckpoint(fixture.directory, previous);
  return storeCheckpoint(fixture, checkpoint, name);
}

function storeCheckpoint(fixture: Fixture, checkpoint: HistoryCheckpoint, name: string) {
  const signature = signPayload(checkpoint, fixture.keys, fixture.authority);
  const path = join(fixture.workspace, name);
  writeJson(path, checkpoint);
  writeJson(`${path}.sig`, signature);
  const material = { checkpoint: readFileSync(path), signature: readFileSync(`${path}.sig`), authority: readFileSync(fixture.authorityPath) };
  return { checkpoint, signature, path, material };
}

function signPayload(payload: JsonValue, keys: OrgAnchorPrivateKey[], authority: RootAuthority): SignatureFile {
  const signatures = keys.map((key) => createSignatureFile(payload, key, new Date(fixedTime), authority));
  const first = signatures[0];
  assert.ok(first);
  return { ...first, signatures: signatures.flatMap((signature) => signature.signatures) };
}

function corruptSignature(original: SignatureFile): SignatureFile {
  const signature = structuredClone(original);
  const entry = signature.signatures[0];
  assert.ok(entry);
  const bytes = Buffer.from(entry.signature, "base64url");
  bytes[0] = (bytes[0] ?? 0) ^ 1;
  entry.signature = bytes.toString("base64url");
  return signature;
}

function independentDigests(bytes: Buffer) {
  return {
    sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    sha512: `sha512:${createHash("sha512").update(bytes).digest("hex")}`
  };
}

function independentBlockHash(header: Buffer): string {
  return createHash("sha256").update(createHash("sha256").update(header).digest()).digest().reverse().toString("hex");
}

function syntheticProof(bytes: Buffer, height = 42, tag = "0588960d73d71901"): Buffer {
  assert.ok(Number.isInteger(height) && height >= 0 && height < 128);
  const digest = createHash("sha256").update(bytes).digest();
  const commitment = createHash("sha256").update(digest).digest();
  return serializeDetachedOpenTimestamp({
    algorithm: "sha256", digest,
    timestamp: { msg: digest, entries: [{ kind: "op", tag: 0x08, child: {
      msg: commitment, entries: [{ kind: "attestation", tag: Buffer.from(tag, "hex"), payload: Buffer.from([height]) }]
    } }] }
  });
}

function writeAnchor(fixture: Fixture, checkpointPath: string, prefix = "", time = fixedTime): string[] {
  const sealPath = `${checkpointPath}.seal.json`;
  if (!existsSync(sealPath)) run(fixture, ["seal", "--in", checkpointPath, "--authority", fixture.authorityPath]);
  return [`--${prefix}seal`, sealPath, ...writeProofAndPin(fixture, readFileSync(sealPath), prefix, time)];
}

function writeProofAndPin(fixture: Fixture, bytes: Buffer, prefix = "", time = fixedTime): string[] {
  const header = Buffer.from(syntheticPin.header_hex, "hex");
  header.writeUInt32LE(Date.parse(time) / 1000, 68);
  createHash("sha256").update(createHash("sha256").update(bytes).digest()).digest().copy(header, 36);
  const proofPath = join(fixture.workspace, `${prefix}synthetic.ots`);
  const pinPath = join(fixture.workspace, `${prefix}synthetic-block.json`);
  writeFileSync(proofPath, syntheticProof(bytes));
  writeJson(pinPath, { height: 42, header_hex: header.toString("hex"), block_hash: independentBlockHash(header) });
  return [`--${prefix}proof`, proofPath, `--${prefix}trusted-bitcoin-block`, pinPath];
}

function fileEntry(checkpoint: HistoryCheckpoint, path: string): HistoryFile {
  const entry = checkpoint.files.find((file) => file.path === path);
  assert.ok(entry, `Missing fixture entry ${path}`);
  return entry;
}

function jsonBytes(value: JsonValue): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`);
}

function writeJson(path: string, value: JsonValue): void {
  writeFileSync(path, jsonBytes(value));
}

function run(fixture: Fixture, args: string[], expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cliPath, "history", "checkpoint", ...args], {
    cwd: fixture.workspace, encoding: "utf8", timeout: 15000
  });
  assert.ifError(result.error);
  assert.equal(result.status, expectedStatus, `history checkpoint ${args.join(" ")}\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`);
  return { stdout: result.stdout, stderr: result.stderr };
}

function verifyArgs(fixture: Fixture, path: string, extra: string[] = []): string[] {
  return ["verify", "--in", path, "--authority", fixture.authorityPath, "--verify-dir", fixture.directory, ...extra];
}

function previousOptions(fixture: Fixture, path: string): string[] {
  return ["--previous", path, "--previous-sig", `${path}.sig`, "--previous-authority", fixture.authorityPath];
}

interface HistoryReport {
  status: string;
  signature_valid: boolean;
  files_checked: number;
  crypto_assurance: ReturnType<typeof cryptoAssurance>;
  time_evidence: { status: string; block_time?: string };
  historical_policy: ReturnType<typeof assessHistoricalSignature>;
  migration_pre_cutoff_required: boolean;
  migration_pre_cutoff_checked: boolean;
  previous: string;
  checkpoint_file_hash: string;
  cache_eligible: boolean;
  previous_lineage: {
    status: string;
    snapshot_checked: boolean;
    trusted_cache_pin_checked: boolean;
    policy_source: string;
    cache_boundary: string;
  };
  errors: string[];
}

function verifyCli(fixture: Fixture, path: string, extra: string[] = [], expectedStatus = 0): HistoryReport {
  return JSON.parse(run(fixture, verifyArgs(fixture, path, extra), expectedStatus).stdout) as HistoryReport;
}

test("rawDigests hashes bytes, not parsed or canonicalized JSON", () => {
  const a = Buffer.from('{"value":1}\n');
  const b = Buffer.from('{ "value": 1 }\n');
  assert.deepEqual(JSON.parse(a.toString()), JSON.parse(b.toString()));
  assert.deepEqual(rawDigests(a), independentDigests(a));
  assert.deepEqual(rawDigests(b), independentDigests(b));
  assert.notEqual(rawDigests(a).sha256, rawDigests(b).sha256);
  assert.notEqual(rawDigests(a).sha512, rawDigests(b).sha512);
});
