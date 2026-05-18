import { copyFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { hashFile } from "../core/artifacts.ts";
import { validateClaimsManifest, validateEvidenceManifest } from "../core/evidence-validate.ts";
import { ensureDir, pathExists, writeJsonFile } from "../core/files.ts";
import { sha256CanonicalJson } from "../core/hash.ts";
import { readJsonFile } from "../core/json.ts";
import { appendLockReceipt } from "../core/lockfile.ts";
import { validateOfficialStatement, validateRootAuthority, validateSignatureFile } from "../core/validate.ts";
import { verifySignatureFile } from "../crypto/signature.ts";
import type { JsonValue } from "../core/json.ts";
import type { RootAuthority } from "../types/artifacts.ts";

export async function arweavePublishCommand(options: Record<string, string | boolean>): Promise<void> {
  const statementPath = requireOption(options.statement, "--statement is required");
  const signaturePath = requireOption(options.sig, "--sig is required");
  const authorityPath = requireOption(options.authority, "--authority is required");
  const lockfilePath = typeof options.lockfile === "string" ? options.lockfile : "organchor.lock.json";
  const packageDir = typeof options.out === "string" ? options.out : "arweave-package";
  const manifestPath = typeof options.manifest === "string" ? options.manifest : "arweave-manifest.json";
  const claimsPath = typeof options.claims === "string" ? options.claims : "claims/product-claims.json";
  const claimsSigPath = typeof options["claims-sig"] === "string" ? options["claims-sig"] : `${claimsPath}.sig`;
  const evidencePath = typeof options.evidence === "string" ? options.evidence : "evidence/evidence-manifest.json";
  const evidenceSigPath = typeof options["evidence-sig"] === "string" ? options["evidence-sig"] : `${evidencePath}.sig`;
  const now = new Date();

  const authority = validateRootAuthority(await readJsonFile(authorityPath));
  const statement = validateOfficialStatement(await readJsonFile(statementPath));
  const signature = validateSignatureFile(await readJsonFile(signaturePath));
  const authorityHash = sha256CanonicalJson(authority);
  const errors: string[] = [];
  if (statement.root_authority_hash !== authorityHash) {
    errors.push("Statement root_authority_hash does not match authority file");
  }
  errors.push(...verifySignatureFile(statement, signature, authority).errors);
  if (errors.length > 0) {
    throw new Error(`Cannot prepare Arweave package for invalid artifacts: ${errors.join("; ")}`);
  }

  await ensureDir(packageDir);

  const inputs = [
    { role: "statement", source: statementPath, target: "official-endpoints.json" },
    { role: "signature", source: signaturePath, target: "official-endpoints.json.sig" },
    { role: "root-authority", source: authorityPath, target: "root-authority.json" }
  ];
  await includeOptionalSignedManifest(inputs, {
    label: "Product claims manifest",
    role: "claims",
    source: claimsPath,
    signatureSource: claimsSigPath,
    target: "claims/product-claims.json",
    signatureTarget: "claims/product-claims.json.sig",
    authority,
    validate: validateClaimsManifest,
    explicit: typeof options.claims === "string" || typeof options["claims-sig"] === "string"
  });
  await includeOptionalSignedManifest(inputs, {
    label: "Evidence manifest",
    role: "evidence",
    source: evidencePath,
    signatureSource: evidenceSigPath,
    target: "evidence/evidence-manifest.json",
    signatureTarget: "evidence/evidence-manifest.json.sig",
    authority,
    validate: validateEvidenceManifest,
    explicit: typeof options.evidence === "string" || typeof options["evidence-sig"] === "string"
  });

  const artifacts: JsonValue[] = [];
  for (const input of inputs) {
    const artifact = await hashFile(input.source);
    const target = join(packageDir, input.target);
    await ensureDir(dirname(target));
    await copyFile(input.source, target);
    artifacts.push({
      role: input.role,
      source_path: input.source,
      package_path: `${packageDir}/${input.target}`,
      file_name: basename(input.target),
      hash: artifact.hash,
      size: artifact.size
    });
  }

  const manifest: JsonValue = {
    type: "OrgAnchorArweaveManifest",
    version: "1.0",
    mode: "manual-package",
    created_at: now.toISOString(),
    package_dir: packageDir,
    artifacts,
    note: "Manual package only. Upload these files to Arweave through a trusted wallet/provider, then record resulting TX ids."
  };
  const manifestCanonicalHash = sha256CanonicalJson(manifest);
  await writeJsonFile(manifestPath, manifest);
  const manifestFileArtifact = await hashFile(manifestPath);
  await copyFile(manifestPath, join(packageDir, basename(manifestPath)));

  await appendLockReceipt({
    artifactHash: manifestCanonicalHash,
    artifactKind: "arweave-manual-package",
    artifactPath: manifestPath,
    provider: "arweave",
    action: "archive.arweave.publish",
    status: "MANUAL_PACKAGE",
    lockfilePath,
    now,
    receipt: {
      mode: "manual-package",
      manifest_path: manifestPath,
      manifest_hash: manifestCanonicalHash,
      manifest_canonical_hash: manifestCanonicalHash,
      manifest_file_hash: manifestFileArtifact.hash,
      package_dir: packageDir,
      artifacts,
      note: "No Arweave TX id was produced. This package is prepared for manual upload."
    }
  });

  console.log("Arweave manual package created.");
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Manifest canonical hash: ${manifestCanonicalHash}`);
  console.log(`Manifest file hash: ${manifestFileArtifact.hash}`);
  console.log(`Package directory: ${packageDir}`);
  console.log(`Updated lockfile: ${lockfilePath}`);
}

function requireOption(value: string | boolean | undefined, message: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(message);
  return value;
}

async function includeOptionalSignedManifest(
  inputs: Array<{ role: string; source: string; target: string }>,
  options: {
    label: string;
    role: string;
    source: string;
    signatureSource: string;
    target: string;
    signatureTarget: string;
    authority: RootAuthority;
    validate: (value: JsonValue) => JsonValue;
    explicit: boolean;
  }
): Promise<void> {
  const manifestExists = await pathExists(options.source);
  const signatureExists = await pathExists(options.signatureSource);
  if (!manifestExists && !options.explicit) return;
  if (!manifestExists) throw new Error(`Missing ${options.label}: ${options.source}`);
  if (!signatureExists && !options.explicit) {
    console.log(`WARN: Skipping unsigned ${options.label}: ${options.signatureSource} not found.`);
    return;
  }
  if (!signatureExists) throw new Error(`Missing ${options.label} signature: ${options.signatureSource}`);

  const manifest = options.validate(await readJsonFile(options.source));
  const signature = validateSignatureFile(await readJsonFile(options.signatureSource));
  const result = verifySignatureFile(manifest, signature, options.authority);
  if (!result.ok) {
    throw new Error(`Cannot include invalid ${options.label}: ${result.errors.join("; ")}`);
  }

  inputs.push(
    { role: options.role, source: options.source, target: options.target },
    { role: `${options.role}-signature`, source: options.signatureSource, target: options.signatureTarget }
  );
}
