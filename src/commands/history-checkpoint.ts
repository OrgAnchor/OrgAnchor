import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { writeNewJsonFile } from "../core/files.ts";
import { parseStrictJson, readJsonFile } from "../core/json.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { signManifestFile } from "../core/manifest-signing.ts";
import { asObject, validateRootAuthority, validateSignatureFile } from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";
import { assertNoCryptoDowngrade, cryptoAssurance } from "../core/crypto-policy.ts";
import { assessHistoricalSignature, createHistoryCheckpoint, rawDigests, validateHistoryCheckpoint, verifyCheckpointAnchor, verifyCheckpointFiles } from "../core/history.ts";

type Options = Record<string, string | boolean>;

export async function historyCheckpointCreateCommand(options: Options): Promise<void> {
  const directory = typeof options["verify-dir"] === "string" ? options["verify-dir"] : "public/verify";
  const out = requireOption(options.out, "--out");
  const outputRelative = relative(resolve(directory), resolve(out));
  if (!outputRelative || (!(outputRelative === ".." || outputRelative.startsWith(`..${sep}`)) && !isAbsolute(outputRelative))) throw new Error("Checkpoint output must be outside the snapshotted directory to avoid self-reference");
  const previous = await previousMaterial(options);
  const checkpoint = await createHistoryCheckpoint(directory, previous);
  await writeNewJsonFile(out, checkpoint);
  console.log(JSON.stringify({ status: "CREATED", checkpoint: out, ...rawDigests(await readFile(out)), external_time_evidence: "NOT_CHECKED" }, null, 2));
}

export async function historyCheckpointSignCommand(options: Options): Promise<void> {
  const input = requireOption(options.in, "--in");
  const authorityPath = requireOption(options.authority, "--authority");
  const checkpoint = validateHistoryCheckpoint(await readJsonFile(input));
  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  if (checkpoint.root_authority_hash !== sha256CanonicalJson(authority)) throw new Error("Checkpoint must be signed by its declared snapshot authority");
  const result = await signManifestFile({ keyPath: requireOption(options.key, "--key"), authorityPath, inputPath: input,
    outputPath: typeof options.out === "string" ? options.out : `${input}.sig`, validate: validateHistoryCheckpoint, append: options.append === true });
  console.log(JSON.stringify(result, null, 2));
}

export async function historyCheckpointSealCommand(options: Options): Promise<void> {
  const input = requireOption(options.in, "--in");
  const signaturePath = typeof options.sig === "string" ? options.sig : `${input}.sig`;
  const authorityPath = requireOption(options.authority, "--authority");
  const checkpoint = validateHistoryCheckpoint(await readJsonFile(input));
  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  const signature = validateSignatureFile(await readJsonFile(signaturePath));
  const verified = verifySignatureFile(checkpoint, signature, authority);
  if (!verified.ok || checkpoint.root_authority_hash !== sha256CanonicalJson(authority)) throw new Error("Cannot seal an invalid or incomplete checkpoint signature");
  const out = typeof options.out === "string" ? options.out : `${input}.seal.json`;
  const seal = { type: "OrgAnchorHistorySeal", version: "1.0", checkpoint: rawDigests(await readFile(input)),
    signature: rawDigests(await readFile(signaturePath)), authority: rawDigests(await readFile(authorityPath)) };
  await writeNewJsonFile(out, seal);
  console.log(JSON.stringify({ status: "SEALED", file: out, ...rawDigests(await readFile(out)), next: "Timestamp this exact seal file; retain checkpoint, signature, authority and proof together." }, null, 2));
}

export async function historyCheckpointVerifyCommand(options: Options): Promise<void> {
  if (options["require-post-quantum"] !== undefined && options["require-post-quantum"] !== true) throw new Error("--require-post-quantum is a flag without a value");
  const input = requireOption(options.in, "--in");
  const bytes = await readFile(input);
  const checkpoint = validateHistoryCheckpoint(parseStrictJson(bytes.toString("utf8"), input));
  const signatureBytes = await readFile(typeof options.sig === "string" ? options.sig : `${input}.sig`);
  const authorityBytes = await readFile(requireOption(options.authority, "--authority"));
  const signature = validateSignatureFile(parseStrictJson(signatureBytes.toString("utf8")));
  const authority = validateRootAuthority(parseStrictJson(authorityBytes.toString("utf8")));
  const checkpointFileHash = rawDigests(bytes).sha256;
  const cutoff = optionalStringOption(options, "classical-cutoff");
  const beforeOption = optionalStringOption(options, "before");
  const expectedAuthorityHash = optionalStringOption(options, "expected-authority-hash");
  const trustedPreviousHash = optionalStringOption(options, "trusted-previous-checkpoint-hash");
  if (trustedPreviousHash !== undefined && !/^sha256:[a-f0-9]{64}$/.test(trustedPreviousHash)) throw new Error("--trusted-previous-checkpoint-hash must be a sha256:<64 lowercase hex> verifier cache pin");
  const result = verifySignatureFile(checkpoint, signature, authority);
  const errors = [...result.errors];
  if (checkpoint.root_authority_hash !== sha256CanonicalJson(authority)) errors.push("Checkpoint authority hash mismatch");
  if (expectedAuthorityHash !== undefined && expectedAuthorityHash !== checkpoint.root_authority_hash) errors.push("Pinned authority hash mismatch");
  if (options["require-post-quantum"] === true && !cryptoAssurance(authority).post_quantum_required) errors.push("Verifier policy requires post-quantum signatures");
  const snapshot = await verifyCheckpointFiles(checkpoint, requireOption(options["verify-dir"], "--verify-dir"));
  const previous = await previousMaterial(options);
  let previousStatus = "NOT_INCLUDED";
  let previousSnapshotChecked = false;
  let previousCachePinChecked = false;
  let previousCacheUsed = false;
  let previousCheckpointHash: string | null = null;
  let previousAncestryStatus = "NOT_INCLUDED";
  let inheritedMigrationRequired = false;
  let inheritedMigrationChecked = false;
  let previousCoversClassicalMigration = false;
  if (checkpoint.previous !== null && checkpoint.previous !== undefined) {
    if (!previous) errors.push("Renewal requires previous checkpoint, signature and authority files");
    else {
      const previousErrorCount = errors.length;
      const declared = asObject(checkpoint.previous, "previous");
      for (const name of ["checkpoint", "signature", "authority"] as const) {
        const expected = asObject(declared[name] ?? null, name);
        const actual = rawDigests(previous[name]);
        if (actual.sha256 !== expected.sha256 || actual.sha512 !== expected.sha512) errors.push(`Previous ${name} hash mismatch`);
      }
      const old = validateHistoryCheckpoint(parseStrictJson(previous.checkpoint.toString("utf8")));
      const oldAuthority = validateRootAuthority(parseStrictJson(previous.authority.toString("utf8")));
      const oldSig = validateSignatureFile(parseStrictJson(previous.signature.toString("utf8")));
      previousCheckpointHash = rawDigests(previous.checkpoint).sha256;
      if (trustedPreviousHash !== undefined) {
        previousCachePinChecked = trustedPreviousHash === previousCheckpointHash;
        if (!previousCachePinChecked) errors.push("Trusted previous checkpoint hash does not match the exact previous checkpoint file");
      }
      const hasOlderAncestry = old.previous !== null && old.previous !== undefined;
      previousAncestryStatus = hasOlderAncestry ? previousCachePinChecked ? "VERIFIER_CACHE_PIN_CHECKED" : "DEEPER_ANCESTRY_NOT_CHECKED" : "NO_OLDER_CHECKPOINT";
      if (hasOlderAncestry && !previousCachePinChecked) errors.push("Previous checkpoint has older ancestry; --trusted-previous-checkpoint-hash from a previously verified cache is required");
      assertNoCryptoDowngrade(oldAuthority, authority);
      if (old.root_authority_hash !== checkpoint.root_authority_hash && !snapshot.migrationAuthorities.has(old.root_authority_hash)) errors.push("Renewal has no authenticated migration from previous authority");
      const oldVerified = verifySignatureFile(old, oldSig, oldAuthority);
      if (!oldVerified.ok || old.root_authority_hash !== sha256CanonicalJson(oldAuthority)) errors.push("Previous checkpoint signature or authority invalid");
      let oldSnapshot: Awaited<ReturnType<typeof verifyCheckpointFiles>> | undefined;
      try {
        oldSnapshot = await verifyCheckpointFiles(old, previous.verifyDirectory ?? requireOption(options["verify-dir"], "--verify-dir"));
        previousSnapshotChecked = true;
      } catch (error) {
        errors.push(`Previous snapshot verification failed; supply its preserved --previous-verify-dir: ${error instanceof Error ? error.message : String(error)}`);
      }
      const oldTime = await timeEvidence(previous, options, "previous-");
      const oldPolicy = assessHistoricalSignature(oldAuthority, oldTime, cutoff);
      const trustedPreviousCache = previousCachePinChecked && previousSnapshotChecked && errors.length === previousErrorCount;
      previousCacheUsed = trustedPreviousCache;
      if (!oldPolicy.accepted_under_supplied_policy && !trustedPreviousCache) errors.push("Previous classical checkpoint requires its own pre-cutoff timestamp proof");
      const oldPreCutoff = isPreCutoff(oldTime, cutoff);
      inheritedMigrationRequired = cutoff !== undefined && (oldSnapshot?.classicalAuthorizationFiles.length ?? 0) > 0;
      inheritedMigrationChecked = inheritedMigrationRequired && (oldPreCutoff || trustedPreviousCache);
      if (inheritedMigrationRequired && !inheritedMigrationChecked) errors.push("Previous snapshot classical migration authorization requires its own pre-cutoff evidence");
      // A cache carries accepted migration obligations, not arbitrary unreviewed files.
      const priorEvidence = oldPreCutoff ? old.files : trustedPreviousCache ? oldSnapshot?.classicalAuthorizationFiles ?? [] : [];
      previousCoversClassicalMigration = previousSnapshotChecked && (oldPreCutoff || trustedPreviousCache) &&
        snapshot.classicalAuthorizationFiles.every((file) => priorEvidence.some((entry) => entry.sha256 === file.sha256 && entry.sha512 === file.sha512));
      previousStatus = previousSnapshotChecked && errors.length === previousErrorCount ? "SNAPSHOT_AND_POLICY_CHECKED" : "LINEAGE_NOT_ESTABLISHED";
    }
  } else if (previous || trustedPreviousHash !== undefined || options["previous-verify-dir"] !== undefined) {
    errors.push("Previous checkpoint inputs were supplied but this checkpoint declares no renewal ancestry");
  }
  const time = await timeEvidence({ checkpoint: bytes, signature: signatureBytes, authority: authorityBytes }, options);
  const policy = assessHistoricalSignature(authority, time, cutoff);
  if (!policy.accepted_under_supplied_policy) errors.push(policy.status);
  const currentMigrationRequired = snapshot.classicalAuthorizationFiles.length > 0 && cutoff !== undefined;
  const migrationNeedsCutoff = currentMigrationRequired || inheritedMigrationRequired;
  const migrationPreCutoff = isPreCutoff(time, cutoff);
  if (currentMigrationRequired && !migrationPreCutoff && !previousCoversClassicalMigration) errors.push("Classical migration authorization requires pre-cutoff evidence; a successor's PQ signature cannot repair late migration");
  if (beforeOption !== undefined) {
    const before = Date.parse(beforeOption);
    if (Number.isNaN(before) || time.status !== "ANCHORED_TO_PINNED_BLOCK" || !("block_time" in time) || Date.parse(time.block_time) >= before) errors.push("A checked independently pinned timestamp before --before is required");
  }
  console.log(JSON.stringify({ type: "OrgAnchorHistoryVerificationResult", version: "1.0", status: errors.length ? "FAIL" : "PASS",
    checkpoint_file_hash: checkpointFileHash, cache_eligible: errors.length === 0,
    verifier_policy: { classical_cutoff: cutoff ?? null, require_post_quantum: options["require-post-quantum"] === true },
    signature_valid: result.ok, crypto_assurance: cryptoAssurance(authority), time_evidence: time,
    historical_policy: policy, migration_pre_cutoff_required: migrationNeedsCutoff,
    migration_pre_cutoff_checked: migrationNeedsCutoff && (!currentMigrationRequired || migrationPreCutoff || previousCoversClassicalMigration) && (!inheritedMigrationRequired || inheritedMigrationChecked),
    previous_lineage: { status: previousAncestryStatus, snapshot_checked: previousSnapshotChecked,
      checkpoint_file_hash: previousCheckpointHash, trusted_cache_pin_checked: previousCachePinChecked,
      policy_source: previousCacheUsed ? "VERIFIER_OWNED_CACHE" : "CHECKED_IMMEDIATE_EVIDENCE",
      cache_boundary: "A trusted previous checkpoint hash must come from the verifier's own successful ancestry verification under the same or stricter policy, never from publisher-signed metadata. Deeper ancestry is not re-walked by this command." },
    previous: previousStatus, files_checked: checkpoint.files.length, errors }, null, 2));
  if (errors.length) process.exitCode = 1;
}

async function previousMaterial(options: Options) {
  if (options.previous === undefined && options["previous-sig"] === undefined && options["previous-authority"] === undefined) return undefined;
  const verifyDirectory = options["previous-verify-dir"] === undefined ? undefined : requireOption(options["previous-verify-dir"], "--previous-verify-dir");
  return { checkpoint: await readFile(requireOption(options.previous, "--previous")),
    signature: await readFile(requireOption(options["previous-sig"], "--previous-sig")),
    authority: await readFile(requireOption(options["previous-authority"], "--previous-authority")),
    ...(verifyDirectory === undefined ? {} : { verifyDirectory }) };
}

function isPreCutoff(time: { status: string; block_time?: string }, cutoff?: string): boolean {
  return cutoff !== undefined && time.status === "ANCHORED_TO_PINNED_BLOCK" && typeof time.block_time === "string" && Date.parse(time.block_time) < Date.parse(cutoff);
}

async function timeEvidence(materials: { checkpoint: Buffer; signature: Buffer; authority: Buffer }, options: Options, prefix = "") {
  const proof = options[`${prefix}proof`];
  const pin = options[`${prefix}trusted-bitcoin-block`];
  if (proof === undefined && pin === undefined) return { status: "NOT_CHECKED" };
  const sealPath = requireOption(options[`${prefix}seal`], `--${prefix}seal`);
  const sealBytes = await readFile(sealPath);
  const seal = asObject(parseStrictJson(sealBytes.toString("utf8")), "history seal");
  if (seal.type !== "OrgAnchorHistorySeal" || seal.version !== "1.0") throw new Error("Unsupported history seal");
  for (const key of ["checkpoint", "signature", "authority"] as const) {
    const declared = asObject(seal[key] ?? null, key);
    const actual = rawDigests(materials[key]);
    if (declared.sha256 !== actual.sha256 || declared.sha512 !== actual.sha512) throw new Error(`History seal ${key} hash mismatch`);
  }
  return verifyCheckpointAnchor(sealBytes, await readFile(requireOption(proof, `--${prefix}proof`)), await readJsonFile(requireOption(pin, `--${prefix}trusted-bitcoin-block`)));
}

function requireOption(value: string | boolean | undefined, name: string): string {
  if (typeof value !== "string" || !value) throw new Error(`${name} is required`);
  return value;
}

function optionalStringOption(options: Options, name: string): string | undefined {
  const value = options[name];
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !value) throw new Error(`--${name} requires a value`);
  return value;
}
