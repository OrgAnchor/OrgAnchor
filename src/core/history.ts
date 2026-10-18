import { createHash } from "node:crypto";
import { lstat, readdir, readFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { assertNoCryptoDowngrade, cryptoAssurance } from "./crypto-policy.ts";
import { sha256CanonicalJson } from "./hash.ts";
import { parseStrictJson, type JsonValue } from "./json.ts";
import { asObject, requireIsoTimestamp, requireSha256Digest, requireString, validateOfficialStatement, validateRootAuthority, validateRootAuthorityMigration, validateSignatureFile } from "./validate.ts";
import { verifyMigrationSignatures } from "./migration.ts";
import { verifySignatureFile } from "../crypto/signature.ts";
import { findBitcoinAttestations, parseDetachedOpenTimestamp } from "../anchors/opentimestamps.ts";
import { scanPublicDirectory } from "../commands/safety-scan.ts";

const REQUIRED_FILES = ["root-authority.json", "official-endpoints.json", "official-endpoints.json.sig", "organchor.json"];
const MAX_FILES = 1000;
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;

export interface HistoryFile { [key: string]: JsonValue; path: string; size: number; sha256: string; sha512: string; }
export interface HistoryCheckpoint {
  [key: string]: JsonValue;
  type: "OrgAnchorHistoryCheckpoint";
  version: "1.0";
  created_at: string;
  root_authority_hash: string;
  statement_hash: string;
  files: HistoryFile[];
}

export interface PreviousHistoryMaterial {
  checkpoint: Buffer;
  signature: Buffer;
  authority: Buffer;
  verifyDirectory?: string;
}

export function rawDigests(bytes: Buffer): { sha256: string; sha512: string } {
  return {
    sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    sha512: `sha512:${createHash("sha512").update(bytes).digest("hex")}`
  };
}

export async function createHistoryCheckpoint(directory: string, previous?: PreviousHistoryMaterial): Promise<HistoryCheckpoint> {
  const root = resolve(directory);
  if ((await lstat(root)).isSymbolicLink()) throw new Error("Checkpoint root must not be a symbolic link");
  const files: HistoryFile[] = [];
  let total = 0;
  async function walk(path: string): Promise<void> {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const full = join(path, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Checkpoint source must not contain symbolic links");
      if (entry.isDirectory()) { await walk(full); continue; }
      if (!entry.isFile()) throw new Error("Unsupported file in public checkpoint source");
      const stat = await lstat(full);
      total += stat.size;
      if (stat.size > MAX_FILE_BYTES || total > MAX_TOTAL_BYTES || files.length >= MAX_FILES) throw new Error("Checkpoint exceeds the bounded public-package size; keep large evidence outside the verify package");
      const filePath = relative(root, full).replaceAll("\\", "/");
      assertSafePath(filePath);
      const bytes = await readFile(full);
      files.push({ path: filePath, size: bytes.length, ...rawDigests(bytes) });
    }
  }
  await walk(root);
  const safety = await scanPublicDirectory(directory);
  if (safety.status !== "PASS") throw new Error("Public disclosure scan failed; remove sensitive material before checkpointing");
  files.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  for (const path of REQUIRED_FILES) if (!files.some((file) => file.path === path)) throw new Error(`Checkpoint requires ${path}`);
  const { authority, statement, migrationAuthorities } = await verifySnapshot(root, new Set(files.map((file) => file.path)));
  let renewal: JsonValue = null;
  if (previous) {
    const old = validateHistoryCheckpoint(parseStrictJson(previous.checkpoint.toString("utf8")));
    const oldAuthority = validateRootAuthority(parseStrictJson(previous.authority.toString("utf8")));
    if (old.root_authority_hash !== sha256CanonicalJson(oldAuthority)) throw new Error("Previous checkpoint authority mismatch");
    assertNoCryptoDowngrade(oldAuthority, authority);
    if (old.root_authority_hash !== sha256CanonicalJson(authority) && !migrationAuthorities.has(old.root_authority_hash)) throw new Error("Checkpoint renewal requires an authenticated migration from the previous authority");
    const oldSig = validateSignatureFile(parseStrictJson(previous.signature.toString("utf8")));
    const verified = verifySignatureFile(old, oldSig, oldAuthority);
    if (!verified.ok) throw new Error(`Invalid previous checkpoint signature: ${verified.errors.join("; ")}`);
    try {
      await verifyCheckpointFiles(old, previous.verifyDirectory ?? directory);
    } catch (error) {
      throw new Error(`Previous snapshot verification failed; supply its preserved --previous-verify-dir: ${error instanceof Error ? error.message : String(error)}`);
    }
    renewal = { checkpoint: rawDigests(previous.checkpoint), signature: rawDigests(previous.signature), authority: rawDigests(previous.authority) };
  }
  return {
    type: "OrgAnchorHistoryCheckpoint", version: "1.0", created_at: new Date().toISOString(),
    root_authority_hash: sha256CanonicalJson(authority), statement_hash: sha256CanonicalJson(statement), files,
    previous: renewal
  };
}

export function validateHistoryCheckpoint(value: JsonValue): HistoryCheckpoint {
  const object = asObject(value, "history checkpoint");
  if (object.type !== "OrgAnchorHistoryCheckpoint" || object.version !== "1.0") throw new Error("Unsupported history checkpoint type/version");
  requireIsoTimestamp(object, "created_at", "checkpoint");
  requireSha256Digest(object, "root_authority_hash", "checkpoint");
  requireSha256Digest(object, "statement_hash", "checkpoint");
  if (!Array.isArray(object.files) || !object.files.length || object.files.length > MAX_FILES) throw new Error("Invalid checkpoint file count");
  const seen = new Set<string>();
  let total = 0;
  for (const value of object.files) {
    const file = asObject(value, "checkpoint file");
    const path = requireString(file, "path", "checkpoint file");
    assertSafePath(path);
    const identity = process.platform === "win32" ? path.toLowerCase() : path;
    if (seen.has(identity)) throw new Error("Duplicate checkpoint path");
    seen.add(identity);
    if (typeof file.size !== "number" || !Number.isSafeInteger(file.size) || file.size < 0 || file.size > MAX_FILE_BYTES) throw new Error("Invalid checkpoint file size");
    total += file.size;
    requireSha256Digest(file, "sha256", "checkpoint file");
    if (typeof file.sha512 !== "string" || !/^sha512:[a-f0-9]{128}$/.test(file.sha512)) throw new Error("Invalid checkpoint SHA-512 digest");
  }
  if (total > MAX_TOTAL_BYTES) throw new Error("Checkpoint total size exceeds the public-package limit");
  for (const path of REQUIRED_FILES) if (!object.files.some((entry) => asObject(entry, "file").path === path)) throw new Error(`Checkpoint requires ${path}`);
  if (object.previous !== undefined && object.previous !== null) {
    const previous = asObject(object.previous, "previous checkpoint");
    for (const key of ["checkpoint", "signature", "authority"]) {
      const digests = asObject(previous[key] ?? null, `previous.${key}`);
      requireSha256Digest(digests, "sha256", key);
      if (typeof digests.sha512 !== "string" || !/^sha512:[a-f0-9]{128}$/.test(digests.sha512)) throw new Error("Previous evidence requires SHA-512");
    }
  }
  return value as unknown as HistoryCheckpoint;
}

export async function verifyCheckpointFiles(checkpoint: HistoryCheckpoint, directory: string) {
  const root = resolve(directory);
  for (const file of checkpoint.files) {
    const bytes = await readSafeFile(root, file.path);
    const digests = rawDigests(bytes);
    if (bytes.length !== file.size || digests.sha256 !== file.sha256 || digests.sha512 !== file.sha512) throw new Error(`Checkpoint file hash mismatch: ${file.path}`);
  }
  const { authority, statement, classicalAuthorizationPaths, migrationAuthorities } = await verifySnapshot(root, new Set(checkpoint.files.map((file) => file.path)));
  if (sha256CanonicalJson(authority) !== checkpoint.root_authority_hash || sha256CanonicalJson(statement) !== checkpoint.statement_hash) throw new Error("Checkpoint authority or statement binding mismatch");
  const classicalAuthorizationFiles = checkpoint.files.filter((file) => classicalAuthorizationPaths.has(file.path));
  return { classicalAuthorizationHashes: classicalAuthorizationFiles.map((file) => file.sha256), classicalAuthorizationFiles, migrationAuthorities };
}

export function verifyCheckpointAnchor(checkpointBytes: Buffer, proofBytes: Buffer, trustedBlock: JsonValue) {
  if (proofBytes.length > 1024 * 1024) throw new Error("Timestamp proof exceeds size limit");
  const proof = parseDetachedOpenTimestamp(proofBytes);
  const inspect = (node: typeof proof.timestamp): void => {
    for (const entry of node.entries) if (entry.kind === "op") {
      if (entry.tag === 0x02 || entry.tag === 0x03) throw new Error("Historical assurance does not accept SHA-1 or RIPEMD-160 timestamp paths");
      inspect(entry.child);
    }
  };
  inspect(proof.timestamp);
  if (`sha256:${proof.digest.toString("hex")}` !== rawDigests(checkpointBytes).sha256) throw new Error("Timestamp digest does not bind this exact checkpoint file");
  const block = asObject(trustedBlock, "independently trusted Bitcoin block");
  const hash = requireString(block, "block_hash", "trusted block");
  const headerHex = requireString(block, "header_hex", "trusted block");
  if (!/^[a-f0-9]{64}$/i.test(hash) || !/^[a-f0-9]{160}$/i.test(headerHex) || typeof block.height !== "number" || !Number.isSafeInteger(block.height) || block.height < 0) throw new Error("Invalid trusted Bitcoin block pin");
  const header = Buffer.from(headerHex, "hex");
  const computedHash = createHash("sha256").update(createHash("sha256").update(header).digest()).digest().reverse().toString("hex");
  if (computedHash !== hash.toLowerCase()) throw new Error("Pinned Bitcoin block hash does not match header");
  const attestations = findBitcoinAttestations(proof.timestamp);
  if (!attestations.some((entry) => entry.height === block.height && entry.commitment === header.subarray(36, 68).toString("hex"))) throw new Error("Timestamp does not reach the pinned Bitcoin block Merkle root and height");
  return {
    status: "ANCHORED_TO_PINNED_BLOCK", block_hash: computedHash, height: block.height,
    block_time: new Date(header.readUInt32LE(68) * 1000).toISOString(),
    boundary: "The caller must independently establish canonical-chain membership and confirmations of the pinned block. Header time is an approximate chain timestamp, not exact wall-clock signing time."
  };
}

export function assessHistoricalSignature(authority: import("../types/artifacts.ts").RootAuthority, anchor: { status: string; block_time?: string }, cutoff?: string) {
  const assurance = cryptoAssurance(authority);
  if (cutoff && Number.isNaN(Date.parse(cutoff))) throw new Error("Algorithm cutoff must be a valid timestamp");
  const preCutoff = cutoff !== undefined && anchor.status === "ANCHORED_TO_PINNED_BLOCK" && typeof anchor.block_time === "string" && Date.parse(anchor.block_time) < Date.parse(cutoff);
  const accepted = !cutoff || assurance.post_quantum_required || preCutoff;
  return {
    accepted_under_supplied_policy: accepted,
    status: cutoff && !assurance.post_quantum_required ? preCutoff ? "PRE_CUTOFF_EVIDENCE_CHECKED" : "CLASSICAL_HISTORY_REQUIRES_PRE_CUTOFF_PROOF" : "NO_RETIREMENT_DECISION_APPLIED",
    boundary: "Preserved mathematical validity does not by itself establish historical authorship, first publication time, or absence of a newer authority."
  };
}

async function verifySnapshot(root: string, included: Set<string>) {
  const authority = validateRootAuthority(parseStrictJson((await readSafeFile(root, "root-authority.json")).toString("utf8")));
  const statement = validateOfficialStatement(parseStrictJson((await readSafeFile(root, "official-endpoints.json")).toString("utf8")));
  const sig = validateSignatureFile(parseStrictJson((await readSafeFile(root, "official-endpoints.json.sig")).toString("utf8")));
  const verified = verifySignatureFile(statement, sig, authority);
  if (!verified.ok || statement.root_authority_hash !== sha256CanonicalJson(authority)) throw new Error(`Invalid signed snapshot: ${verified.errors.join("; ")}`);
  const index = asObject(parseStrictJson((await readSafeFile(root, "organchor.json")).toString("utf8")), "verify index");
  const linked = index.linked_artifacts && typeof index.linked_artifacts === "object" && !Array.isArray(index.linked_artifacts) ? index.linked_artifacts : {};
  for (const value of Object.values(linked)) {
    const reference = asObject(value, "linked artifact");
    for (const key of ["path", "signature_path"]) {
      const path = requireString(reference, key, "linked artifact");
      if (!included.has(path)) throw new Error(`Checkpoint omits referenced signed artifact: ${path}`);
    }
  }
  const migrations = reconciledMigrations(index);
  if (migrations.length > 32) throw new Error("Checkpoint migration chain exceeds automatic verification limit");
  let previousAuthority: string | null = null;
  const migrationAuthorities = new Set<string>();
  const classicalAuthorizationPaths = new Set<string>();
  let previousHash: string | null = null;
  let sequence = 0;
  for (const value of migrations) {
    const reference = asObject(value, "migration reference");
    const path = requireString(reference, "path", "migration");
    const sigPath = requireString(reference, "signature_path", "migration");
    if (!included.has(path) || !included.has(sigPath)) throw new Error("Checkpoint omits migration payload or authorization");
    const migration = validateRootAuthorityMigration(parseStrictJson((await readSafeFile(root, path)).toString("utf8")));
    const authorization = validateSignatureFile(parseStrictJson((await readSafeFile(root, sigPath)).toString("utf8")));
    if (reference.hash !== undefined && reference.hash !== sha256CanonicalJson(migration)) throw new Error("Migration reference payload hash mismatch");
    if (reference.signature_hash !== undefined && reference.signature_hash !== sha256CanonicalJson(authorization)) throw new Error("Migration reference authorization hash mismatch");
    let acceptance;
    if (migration.version === "2.0") {
      const acceptancePath = requireString(reference, "acceptance_path", "migration");
      if (!included.has(acceptancePath)) throw new Error("Checkpoint omits migration acceptance");
      acceptance = validateSignatureFile(parseStrictJson((await readSafeFile(root, acceptancePath)).toString("utf8")));
      if (reference.acceptance_hash !== undefined && reference.acceptance_hash !== sha256CanonicalJson(acceptance)) throw new Error("Migration reference acceptance hash mismatch");
      if (migration.previous_migration_hash !== previousHash || migration.sequence !== sequence + 1) throw new Error("Checkpoint migration hash link or sequence mismatch");
    }
    const checked = verifyMigrationSignatures(migration, authorization, acceptance);
    if (!checked.ok) throw new Error(`Checkpoint migration invalid: ${checked.errors.join("; ")}`);
    if (previousAuthority && migration.old_root_authority_hash !== previousAuthority) throw new Error("Checkpoint migration authority chain is broken");
    migrationAuthorities.add(migration.old_root_authority_hash);
    migrationAuthorities.add(migration.new_root_authority_hash);
    if (migration.old_root_authority.version === "1.0") {
      classicalAuthorizationPaths.add(path);
      classicalAuthorizationPaths.add(sigPath);
      if (typeof reference.acceptance_path === "string") classicalAuthorizationPaths.add(reference.acceptance_path);
    }
    previousAuthority = migration.new_root_authority_hash;
    previousHash = sha256CanonicalJson(migration);
    sequence = Number(migration.sequence ?? 0);
  }
  if (migrations.length && previousAuthority !== sha256CanonicalJson(authority)) throw new Error("Checkpoint migration does not end at snapshot authority");
  return { authority, statement, classicalAuthorizationPaths, migrationAuthorities };
}

function reconciledMigrations(index: Record<string, JsonValue>): Record<string, JsonValue>[] {
  const history = index.migration_history === undefined ? {} : asObject(index.migration_history, "migration_history");
  const continuity = index.root_continuity === undefined ? {} : asObject(index.root_continuity, "root_continuity");
  if (history.migrations !== undefined && !Array.isArray(history.migrations)) throw new Error("migration_history.migrations must be an array");
  if (continuity.migration_chain !== undefined && !Array.isArray(continuity.migration_chain)) throw new Error("root_continuity.migration_chain must be an array");
  const primary = Array.isArray(history.migrations) ? history.migrations : [];
  const duplicate = Array.isArray(continuity.migration_chain) ? continuity.migration_chain : [];
  const declaresHistory = history.status === "PASS" || history.status === "SIGNATURE_CHAIN_VERIFIED" ||
    continuity.status === "MIGRATION_CHAIN_VERIFIED" ||
    Array.isArray(continuity.previous_root_authorities) && continuity.previous_root_authorities.length > 0;
  if (!primary.length && !duplicate.length) {
    if (declaresHistory) throw new Error("Declared migration continuity omits its migration artifacts");
    return [];
  }
  if (!Array.isArray(history.migrations) || !Array.isArray(continuity.migration_chain) || primary.length !== duplicate.length) {
    throw new Error("Migration indexes disagree or omit declared migration artifacts");
  }
  if (history.status !== undefined && history.status !== "PASS" && history.status !== "SIGNATURE_CHAIN_VERIFIED" ||
    continuity.status !== undefined && continuity.status !== "MIGRATION_CHAIN_VERIFIED") {
    throw new Error("Migration index status contradicts its declared migration artifacts");
  }
  const commitments = ["path", "hash", "signature_path", "signature_hash", "acceptance_path", "acceptance_hash"];
  return primary.map((value, i) => {
    const reference = asObject(value, "migration reference");
    const other = asObject(duplicate[i] ?? null, "root continuity migration reference");
    if (commitments.some((key) => reference[key] !== other[key])) throw new Error("Migration indexes disagree on artifact commitments");
    return reference;
  });
}

async function readSafeFile(root: string, path: string): Promise<Buffer> {
  assertSafePath(path);
  let current = root;
  if ((await lstat(root)).isSymbolicLink()) throw new Error("Checkpoint root must not be a symbolic link");
  for (const part of path.split("/")) {
    current = join(current, part);
    if ((await lstat(current)).isSymbolicLink()) throw new Error("Checkpoint paths must not contain symbolic links");
  }
  const stat = await lstat(current);
  if (!stat.isFile() || stat.size > MAX_FILE_BYTES) throw new Error("Checkpoint path is not a bounded regular file");
  return readFile(current);
}

function assertSafePath(path: string): void {
  if (!path || isAbsolute(path) || /[\\:\x00-\x1f]/.test(path) || path.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("Unsafe checkpoint relative path");
}
