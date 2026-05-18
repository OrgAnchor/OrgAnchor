import { createHash } from "node:crypto";
import { canonicalizeJson } from "./canonicalize.ts";
import type { JsonValue } from "./json.ts";

export function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

export function sha256Digest(data: Buffer | string): string {
  return `sha256:${sha256Hex(data)}`;
}

export function sha256CanonicalJson(value: JsonValue): string {
  return sha256Digest(canonicalizeJson(value));
}
