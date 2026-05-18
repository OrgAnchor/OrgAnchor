import { readJsonFile } from "./json.ts";
import { pathExists, writeJsonFile } from "./files.ts";
import type { JsonValue } from "./json.ts";

export interface LockReceiptInput {
  artifactHash: string;
  artifactKind: string;
  artifactPath: string;
  provider: string;
  action: string;
  status: "DRY_RUN" | "MANUAL_PACKAGE" | "PUBLISHED" | "VERIFIED";
  receipt: Record<string, JsonValue>;
  lockfilePath?: string;
  now?: Date;
}

export async function appendLockReceipt(input: LockReceiptInput): Promise<JsonValue> {
  const lockfilePath = input.lockfilePath ?? "organchor.lock.json";
  const now = input.now ?? new Date();
  const lockfile = await readOrCreateLockfile(lockfilePath, now);
  const lockObject = asRecord(lockfile);
  const artifacts = asRecord(lockObject.artifacts);
  const existing = artifacts[input.artifactHash];
  const artifact = existing && typeof existing === "object" && !Array.isArray(existing) ? asRecord(existing) : {};
  const receipts = Array.isArray(artifact.receipts) ? artifact.receipts : [];

  artifact.hash = input.artifactHash;
  artifact.kind = input.artifactKind;
  artifact.path = input.artifactPath;
  artifact.updated_at = now.toISOString();
  artifact.receipts = [
    ...receipts,
    {
      provider: input.provider,
      action: input.action,
      status: input.status,
      recorded_at: now.toISOString(),
      receipt: input.receipt
    }
  ];

  artifacts[input.artifactHash] = artifact;
  lockObject.artifacts = artifacts;
  lockObject.updated_at = now.toISOString();
  await writeJsonFile(lockfilePath, lockObject);
  return lockObject;
}

async function readOrCreateLockfile(path: string, now: Date): Promise<JsonValue> {
  if (!(await pathExists(path))) {
    return {
      type: "OrgAnchorLockfile",
      version: "1.0",
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      artifacts: {}
    };
  }
  const value = await readJsonFile(path);
  const object = asRecord(value);
  if (object.type !== "OrgAnchorLockfile") {
    throw new Error("Invalid organchor.lock.json type");
  }
  if (object.version !== "1.0") {
    throw new Error("Unsupported organchor.lock.json version");
  }
  if (!object.artifacts || typeof object.artifacts !== "object" || Array.isArray(object.artifacts)) {
    object.artifacts = {};
  }
  return object;
}

function asRecord(value: JsonValue | undefined): Record<string, JsonValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value;
}
