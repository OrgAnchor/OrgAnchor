import { copyFile, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join } from "node:path";
import { validateClaimsManifest, validateEvidenceManifest } from "../core/evidence-validate.ts";
import { ensureDir, pathExists, writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import {
  validateOfficialStatement,
  validateRootAuthority,
  validateRootAuthorityMigration,
  validateSignatureFile
} from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";
import { renderVerifyPage } from "../page/template.ts";
import type { JsonValue } from "../core/json.ts";
import type {
  VerifyCarrierReceipt,
  VerifyLinkedArtifact,
  VerifyMigrationArtifact,
  VerifyProofCheck,
  VerifyRootContinuity
} from "../page/template.ts";
import type { RootAuthority } from "../types/artifacts.ts";

const STATEMENT_FILE = "official-endpoints.json";
const SIGNATURE_FILE = "official-endpoints.json.sig";
const AUTHORITY_FILE = "root-authority.json";
const INDEX_FILE = "organchor.json";

export async function pageGenerateCommand(options: Record<string, string | boolean>): Promise<void> {
  const statementPath = typeof options.statement === "string" ? options.statement : "statements/official-endpoints.json";
  const signaturePath = typeof options.sig === "string" ? options.sig : `${statementPath}.sig`;
  const authorityPath = typeof options.authority === "string" ? options.authority : "root-authority.json";
  const claimsPath = typeof options.claims === "string" ? options.claims : "claims/product-claims.json";
  const claimsSigPath = typeof options["claims-sig"] === "string" ? options["claims-sig"] : `${claimsPath}.sig`;
  const evidencePath = typeof options.evidence === "string" ? options.evidence : "evidence/evidence-manifest.json";
  const evidenceSigPath = typeof options["evidence-sig"] === "string" ? options["evidence-sig"] : `${evidencePath}.sig`;
  const migrationPaths = parseCsv(options.migration ?? options.migrations);
  const migrationSigPaths = parseCsv(options["migration-sig"] ?? options["migration-sigs"]);
  const out = typeof options.out === "string" ? options.out : "public/verify";
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const explicitLockfile = typeof options.lockfile === "string";
  const generatedAt = new Date().toISOString();

  const statement = validateOfficialStatement(await readJsonFile(statementPath));
  const signature = validateSignatureFile(await readJsonFile(signaturePath));
  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  const authorityHash = sha256CanonicalJson(authority);
  const statementHash = sha256CanonicalJson(statement);
  const signatureHash = sha256CanonicalJson(signature);

  const errors: string[] = [];
  if (statement.root_authority_hash !== authorityHash) {
    errors.push("Statement root_authority_hash does not match authority file");
  }

  const verification = verifySignatureFile(statement, signature, authority);
  errors.push(...verification.errors);

  if (errors.length > 0) {
    throw new Error(`Cannot generate verify page for invalid artifacts: ${errors.join("; ")}`);
  }

  await ensureDir(out);
  await copyFile(statementPath, join(out, STATEMENT_FILE));
  await copyFile(signaturePath, join(out, SIGNATURE_FILE));
  await copyFile(authorityPath, join(out, AUTHORITY_FILE));
  const linkedArtifacts: VerifyLinkedArtifact[] = [];
  const linkedIndex: Record<string, JsonValue> = {};
  const claimsArtifact = await includeSignedManifest({
    label: "Product Claims Manifest",
    manifestPath: claimsPath,
    signaturePath: claimsSigPath,
    targetDir: join(out, "claims"),
    targetPath: "claims/product-claims.json",
    targetSignaturePath: "claims/product-claims.json.sig",
    authority,
    validate: validateClaimsManifest,
    explicit: typeof options.claims === "string" || typeof options["claims-sig"] === "string"
  });
  if (claimsArtifact) {
    linkedArtifacts.push(claimsArtifact);
    linkedIndex.claims = artifactIndex(claimsArtifact);
  }

  const evidenceArtifact = await includeSignedManifest({
    label: "Evidence Manifest",
    manifestPath: evidencePath,
    signaturePath: evidenceSigPath,
    targetDir: join(out, "evidence"),
    targetPath: "evidence/evidence-manifest.json",
    targetSignaturePath: "evidence/evidence-manifest.json.sig",
    authority,
    validate: validateEvidenceManifest,
    explicit: typeof options.evidence === "string" || typeof options["evidence-sig"] === "string"
  });
  if (evidenceArtifact) {
    linkedArtifacts.push(evidenceArtifact);
    linkedIndex.evidence = artifactIndex(evidenceArtifact);
  }

  const migrationArtifacts = await includeMigrations({
    migrationPaths,
    migrationSigPaths,
    targetDir: join(out, "migrations"),
    currentAuthorityHash: authorityHash
  });
  const carrierReceipts = await includeCarrierReceipts(lockfilePath, explicitLockfile);
  const rootContinuity = buildRootContinuity({
    authority,
    authorityHash,
    migrationArtifacts
  });

  const proofChecks = buildProofChecks({
    authority,
    authorityHash,
    statementHash,
    signatureHash,
    validSignatures: verification.valid_signatures,
    linkedArtifacts,
    migrationArtifacts,
    carrierReceipts
  });

  const index: JsonValue = {
    type: "OrgAnchorVerifyIndex",
    version: "1.0",
    generated_at: generatedAt,
    role: "adopting-organization-verify-index",
    organization: statement.organization,
    statement: {
      path: STATEMENT_FILE,
      hash: statementHash
    },
    signature: {
      path: SIGNATURE_FILE,
      hash: signatureHash
    },
    root_authority: {
      path: AUTHORITY_FILE,
      hash: authorityHash,
      authority_id: authority.authority_id,
      threshold: authority.threshold
    },
    verification: {
      command: `organchor statement verify --authority ${AUTHORITY_FILE} --expected-authority-hash ${authorityHash} --in ${STATEMENT_FILE} --sig ${SIGNATURE_FILE}`
    },
    visible_proof: {
      status: "PASS",
      generated_at: generatedAt,
      checks: proofChecks.map((check) => ({
        label: check.label,
        status: check.status,
        detail: check.detail
      })),
      summary: {
        statement_signed: true,
        threshold_met: true,
        valid_signature_count: verification.valid_signatures.length,
        required_signature_count: verification.required_signatures,
        linked_artifact_count: linkedArtifacts.length,
        migration_count: migrationArtifacts.length,
        carrier_receipt_count: carrierReceipts.length
      }
    },
    root_continuity: {
      status: rootContinuity.status,
      current_root_authority: {
        path: rootContinuity.currentRootAuthority.path,
        hash: rootContinuity.currentRootAuthority.hash,
        authority_id: rootContinuity.currentRootAuthority.authorityId,
        threshold: {
          required: rootContinuity.currentRootAuthority.thresholdRequired,
          total: rootContinuity.currentRootAuthority.thresholdTotal
        }
      },
      previous_root_authorities: rootContinuity.previousRootAuthorities.map((authority) => ({
        source_migration_path: authority.sourceMigrationPath,
        hash: authority.hash,
        authority_id: authority.authorityId,
        threshold: {
          required: authority.thresholdRequired,
          total: authority.thresholdTotal
        }
      })),
      migration_chain: migrationArtifacts.map((migration) => ({
        migration_id: migration.migrationId,
        path: migration.path,
        hash: migration.hash,
        signature_path: migration.signaturePath,
        signature_hash: migration.signatureHash,
        old_root_authority: {
          authority_id: migration.oldAuthorityId,
          hash: migration.oldAuthorityHash,
          threshold: migration.oldAuthorityThreshold
        },
        new_root_authority: {
          authority_id: migration.newAuthorityId,
          hash: migration.newAuthorityHash,
          threshold: migration.newAuthorityThreshold
        },
        effective_at: migration.effectiveAt,
        old_root_valid_signatures: migration.validSignatures,
        old_root_required_signatures: migration.requiredSignatures
      })),
      historical_verification_rule: rootContinuity.historicalVerificationRule,
      future_statement_rule: rootContinuity.futureStatementRule
    },
    carrier_receipts: {
      status: carrierReceipts.length > 0 ? "PRESENT" : "NOT_INCLUDED",
      source_lockfile: carrierReceipts.length > 0 ? basename(lockfilePath) : null,
      receipts: carrierReceipts.map((receipt) => ({
        artifact_hash: receipt.artifactHash,
        artifact_kind: receipt.artifactKind,
        artifact_path: receipt.artifactPath,
        provider: receipt.provider,
        action: receipt.action,
        status: receipt.status,
        recorded_at: receipt.recordedAt,
        summary: receipt.summary
      }))
    },
    linked_artifacts: linkedIndex,
    migration_history: {
      status: migrationArtifacts.length > 0 ? "PASS" : "NOT_INCLUDED",
      migrations: migrationArtifacts.map((migration) => ({
        migration_id: migration.migrationId,
        path: migration.path,
        hash: migration.hash,
        signature_path: migration.signaturePath,
        signature_hash: migration.signatureHash,
        old_root_authority_hash: migration.oldAuthorityHash,
        new_root_authority_hash: migration.newAuthorityHash,
        effective_at: migration.effectiveAt,
        valid_signatures: migration.validSignatures,
        required_signatures: migration.requiredSignatures
      }))
    },
    notes: [
      "This index belongs to the adopting organization using OrgAnchor.",
      "This index is not a trust root.",
      "Verify signatures and root authority before trusting endpoint claims."
    ]
  };
  await writeJsonFile(join(out, INDEX_FILE), index);

  const html = renderVerifyPage({
    generatedAt,
    statementHash,
    signatureHash,
    authorityHash,
    statementFile: STATEMENT_FILE,
    signatureFile: SIGNATURE_FILE,
    authorityFile: AUTHORITY_FILE,
    indexFile: INDEX_FILE,
    statement,
    authority,
    signature,
    linkedArtifacts,
    migrationArtifacts,
    carrierReceipts,
    rootContinuity,
    proofChecks
  });
  await writeFile(join(out, "index.html"), html, "utf8");

  console.log(`Generated verify page: ${join(out, "index.html")}`);
  console.log(`Statement hash: ${statementHash}`);
  console.log(`Authority hash: ${authorityHash}`);
}

function buildRootContinuity(options: {
  authority: RootAuthority;
  authorityHash: string;
  migrationArtifacts: VerifyMigrationArtifact[];
}): VerifyRootContinuity {
  const previousRootAuthorities = options.migrationArtifacts.map((migration) => ({
    authorityId: migration.oldAuthorityId,
    hash: migration.oldAuthorityHash,
    path: migration.path,
    thresholdRequired: migration.oldAuthorityThreshold.required,
    thresholdTotal: migration.oldAuthorityThreshold.total,
    sourceMigrationPath: migration.path
  }));

  return {
    status: options.migrationArtifacts.length > 0 ? "MIGRATION_CHAIN_VERIFIED" : "CURRENT_ROOT_ONLY",
    currentRootAuthority: {
      authorityId: options.authority.authority_id,
      hash: options.authorityHash,
      path: AUTHORITY_FILE,
      thresholdRequired: options.authority.threshold.required,
      thresholdTotal: options.authority.threshold.total
    },
    previousRootAuthorities,
    migrationCount: options.migrationArtifacts.length,
    historicalVerificationRule: "Historical statements use the root authority that signed them.",
    futureStatementRule: "New statements should be verified against the current root authority unless a later valid migration supersedes it."
  };
}

function buildProofChecks(options: {
  authority: RootAuthority;
  authorityHash: string;
  statementHash: string;
  signatureHash: string;
  validSignatures: string[];
  linkedArtifacts: VerifyLinkedArtifact[];
  migrationArtifacts: VerifyMigrationArtifact[];
  carrierReceipts: VerifyCarrierReceipt[];
}): VerifyProofCheck[] {
  const claimsIncluded = options.linkedArtifacts.some((artifact) => artifact.path === "claims/product-claims.json");
  const evidenceIncluded = options.linkedArtifacts.some((artifact) => artifact.path === "evidence/evidence-manifest.json");
  return [
    {
      label: "Official endpoint statement",
      status: "PASS",
      detail: `Canonical hash recorded as ${options.statementHash}.`
    },
    {
      label: "Root authority binding",
      status: "PASS",
      detail: `Statement root authority hash matches ${options.authorityHash}.`
    },
    {
      label: "Signature threshold",
      status: "PASS",
      detail: `${options.validSignatures.length} valid signature(s) found; ${options.authority.threshold.required} required.`
    },
    {
      label: "Signature file",
      status: "PASS",
      detail: `Detached signature hash recorded as ${options.signatureHash}.`
    },
    {
      label: "Claims manifest",
      status: claimsIncluded ? "PASS" : "NOT_INCLUDED",
      detail: claimsIncluded ?
        "Signed claims manifest was included and verified against this root authority." :
        "No signed claims manifest was included in this verify package."
    },
    {
      label: "Evidence manifest",
      status: evidenceIncluded ? "PASS" : "NOT_INCLUDED",
      detail: evidenceIncluded ?
        "Signed evidence manifest was included and verified against this root authority." :
        "No signed evidence manifest was included in this verify package."
    },
    {
      label: "Migration history",
      status: options.migrationArtifacts.length > 0 ? "PASS" : "NOT_INCLUDED",
      detail: options.migrationArtifacts.length > 0 ?
        `${options.migrationArtifacts.length} migration statement(s) included and verified as a chain to the current root authority.` :
        "No migration history is included in this verify package yet."
    },
    {
      label: "Carrier receipts",
      status: options.carrierReceipts.length > 0 ? "PRESENT" : "NOT_INCLUDED",
      detail: options.carrierReceipts.length > 0 ?
        `${options.carrierReceipts.length} carrier receipt(s) summarized from organchor.lock.json.` :
        "No IPFS, Arweave, OpenTimestamps, or other carrier receipts were included."
    }
  ];
}

async function includeCarrierReceipts(lockfilePath: string, explicit: boolean): Promise<VerifyCarrierReceipt[]> {
  if (!(await pathExists(lockfilePath))) {
    if (explicit) throw new Error(`Missing lockfile: ${lockfilePath}`);
    return [];
  }

  const lockfile = asRecord(await readJsonFile(lockfilePath));
  if (lockfile.type !== "OrgAnchorLockfile") throw new Error(`Invalid lockfile type: ${lockfilePath}`);
  if (lockfile.version !== "1.0") throw new Error(`Unsupported lockfile version: ${lockfilePath}`);

  const artifacts = asRecord(lockfile.artifacts);
  const receipts: VerifyCarrierReceipt[] = [];
  for (const [artifactHash, artifactValue] of Object.entries(artifacts)) {
    const artifact = asRecord(artifactValue);
    const artifactReceipts = Array.isArray(artifact.receipts) ? artifact.receipts : [];
    for (const receiptValue of artifactReceipts) {
      const receipt = asRecord(receiptValue);
      receipts.push({
        artifactHash,
        artifactKind: stringValue(artifact.kind) || "unknown-artifact",
        artifactPath: publicPathLabel(stringValue(artifact.path)),
        provider: stringValue(receipt.provider) || "unknown-provider",
        action: stringValue(receipt.action) || "unknown-action",
        status: stringValue(receipt.status) || "UNKNOWN",
        recordedAt: stringValue(receipt.recorded_at),
        summary: summarizeReceipt(asRecord(receipt.receipt))
      });
    }
  }

  return receipts.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

function summarizeReceipt(receipt: Record<string, JsonValue>): Record<string, JsonValue> {
  const summary: Record<string, JsonValue> = {};
  for (const key of [
    "mode",
    "cid",
    "directory_hash",
    "total_size",
    "file_count",
    "pin_status",
    "requestid",
    "manifest_hash",
    "manifest_canonical_hash",
    "manifest_file_hash",
    "bitcoin_anchor_status",
    "tx_id",
    "gateway_url",
    "public_dir_hash",
    "deployment_url",
    "pages_url",
    "pages_subdomain",
    "custom_domain",
    "domain_status"
  ]) {
    const value = receipt[key];
    if (isPublicSummaryValue(value)) summary[key] = value;
  }

  const files = receipt.files;
  if (Array.isArray(files)) {
    const txIds = files
      .map((file) => stringValue(asRecord(file).tx_id))
      .filter(Boolean)
      .slice(0, 8);
    if (txIds.length > 0) summary.tx_ids = txIds;
    summary.receipt_file_count = files.length;
  }

  return summary;
}

function isPublicSummaryValue(value: JsonValue | undefined): value is JsonValue {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

async function includeMigrations(options: {
  migrationPaths: string[];
  migrationSigPaths: string[];
  targetDir: string;
  currentAuthorityHash: string;
}): Promise<VerifyMigrationArtifact[]> {
  if (options.migrationPaths.length === 0 && options.migrationSigPaths.length === 0) return [];
  if (options.migrationPaths.length === 0) throw new Error("--migration is required when --migration-sig is provided");
  const signaturePaths = options.migrationSigPaths.length > 0 ?
    options.migrationSigPaths :
    options.migrationPaths.map((path) => `${path}.sig`);
  if (signaturePaths.length !== options.migrationPaths.length) {
    throw new Error("--migration and --migration-sig must contain the same number of comma-separated paths");
  }

  await ensureDir(options.targetDir);
  const artifacts: VerifyMigrationArtifact[] = [];
  let previousNewAuthorityHash: string | null = null;
  for (let index = 0; index < options.migrationPaths.length; index++) {
    const migrationPath = options.migrationPaths[index];
    const signaturePath = signaturePaths[index];
    if (!migrationPath || !signaturePath) throw new Error("Invalid migration path");
    const migration = validateRootAuthorityMigration(await readJsonFile(migrationPath));
    const signature = validateSignatureFile(await readJsonFile(signaturePath));
    const result = verifySignatureFile(migration, signature, migration.old_root_authority);
    if (!result.ok) {
      throw new Error(`Cannot include invalid migration ${migrationPath}: ${result.errors.join("; ")}`);
    }
    if (previousNewAuthorityHash && migration.old_root_authority_hash !== previousNewAuthorityHash) {
      throw new Error(`Migration chain is broken before ${migrationPath}`);
    }

    const targetPath = `migrations/${basename(migrationPath)}`;
    const targetSignaturePath = `migrations/${basename(signaturePath)}`;
    await copyFile(migrationPath, join(options.targetDir, basename(migrationPath)));
    await copyFile(signaturePath, join(options.targetDir, basename(signaturePath)));
    artifacts.push({
      migrationId: migration.migration_id,
      path: targetPath,
      hash: sha256CanonicalJson(migration),
      signaturePath: targetSignaturePath,
      signatureHash: sha256CanonicalJson(signature),
      oldAuthorityId: migration.old_root_authority.authority_id,
      oldAuthorityHash: migration.old_root_authority_hash,
      oldAuthorityThreshold: migration.old_root_authority.threshold,
      newAuthorityId: migration.new_root_authority.authority_id,
      newAuthorityHash: migration.new_root_authority_hash,
      newAuthorityThreshold: migration.new_root_authority.threshold,
      effectiveAt: migration.effective_at,
      validSignatures: result.valid_signatures,
      requiredSignatures: result.required_signatures
    });
    previousNewAuthorityHash = migration.new_root_authority_hash;
  }

  const finalMigration = artifacts.at(-1);
  if (!finalMigration || finalMigration.newAuthorityHash !== options.currentAuthorityHash) {
    throw new Error("Migration history does not end at the current root authority");
  }
  return artifacts;
}

async function includeSignedManifest(options: {
  label: string;
  manifestPath: string;
  signaturePath: string;
  targetDir: string;
  targetPath: string;
  targetSignaturePath: string;
  authority: RootAuthority;
  validate: (value: JsonValue) => JsonValue;
  explicit: boolean;
}): Promise<VerifyLinkedArtifact | null> {
  const manifestExists = await pathExists(options.manifestPath);
  const signatureExists = await pathExists(options.signaturePath);
  if (!manifestExists && !options.explicit) return null;
  if (!manifestExists) throw new Error(`Missing ${options.label}: ${options.manifestPath}`);
  if (!signatureExists && !options.explicit) {
    console.log(`WARN: Skipping unsigned ${options.label}: ${options.signaturePath} not found.`);
    return null;
  }
  if (!signatureExists) throw new Error(`Missing ${options.label} signature: ${options.signaturePath}`);

  const manifest = options.validate(await readJsonFile(options.manifestPath));
  const signature = validateSignatureFile(await readJsonFile(options.signaturePath));
  const result = verifySignatureFile(manifest, signature, options.authority);
  if (!result.ok) {
    throw new Error(`Cannot include invalid ${options.label}: ${result.errors.join("; ")}`);
  }

  await ensureDir(options.targetDir);
  await copyFile(options.manifestPath, join(options.targetDir, options.targetPath.split("/").at(-1) ?? options.targetPath));
  await copyFile(
    options.signaturePath,
    join(options.targetDir, options.targetSignaturePath.split("/").at(-1) ?? options.targetSignaturePath)
  );

  return {
    label: options.label,
    path: options.targetPath,
    hash: sha256CanonicalJson(manifest),
    signaturePath: options.targetSignaturePath,
    signatureHash: sha256CanonicalJson(signature)
  };
}

function artifactIndex(artifact: VerifyLinkedArtifact): JsonValue {
  return {
    path: artifact.path,
    hash: artifact.hash,
    signature_path: artifact.signaturePath,
    signature_hash: artifact.signatureHash
  };
}

function parseCsv(value: string | boolean | undefined): string[] {
  if (typeof value !== "string" || value.length === 0) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function stringValue(value: JsonValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function publicPathLabel(value: string): string {
  if (!value) return "";
  return isAbsolute(value) ? basename(value) : value;
}
