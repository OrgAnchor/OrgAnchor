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

export function validateLockfile(value: JsonValue): JsonValue {
  const object = asRecord(value);
  if (object.type !== "OrgAnchorLockfile") {
    throw new Error("Invalid organchor.lock.json type");
  }
  if (object.version !== "1.0") {
    throw new Error("Unsupported organchor.lock.json version");
  }
  if (!object.artifacts || typeof object.artifacts !== "object" || Array.isArray(object.artifacts)) {
    throw new Error("organchor.lock.json artifacts must be an object");
  }
  assertNoSensitiveLockfileKeys(object, "$");
  return value;
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

function assertNoSensitiveLockfileKeys(value: JsonValue, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoSensitiveLockfileKeys(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, child] of Object.entries(value)) {
    if (isSensitiveKeyName(key)) {
      throw new Error(`Refusing to publish/sign lockfile with sensitive-looking key at ${path}.${key}`);
    }
    assertNoSensitiveLockfileKeys(child, `${path}.${key}`);
  }
}

function isSensitiveKeyName(key: string): boolean {
  const normalized = key.toLowerCase().replaceAll(/[^a-z0-9]+/g, "_");
  return [
    "token",
    "access_token",
    "api_token",
    "api_key",
    "apikey",
    "secret",
    "api_secret",
    "client_secret",
    "private",
    "private_key",
    "wallet",
    "seed",
    "mnemonic",
    "password",
    "authorization"
  ].includes(normalized);
}
