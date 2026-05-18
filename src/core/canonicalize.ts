import { fail } from "./errors.ts";
import type { JsonValue } from "./json.ts";

export function canonicalizeJson(value: JsonValue): string {
  return canonicalizeValue(value);
}

function canonicalizeValue(value: JsonValue): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      fail("INVALID_JSON_VALUE", "Cannot canonicalize non-finite number");
    }
    if (Object.is(value, -0)) return "0";
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeValue(item)).join(",")}]`;
  }
  if (typeof value === "object") {
    const keys = Object.keys(value).sort();
    const fields = keys.map((key) => {
      const fieldValue = value[key];
      if (fieldValue === undefined) {
        fail("INVALID_JSON_VALUE", `Cannot canonicalize undefined field "${key}"`);
      }
      return `${JSON.stringify(key)}:${canonicalizeValue(fieldValue)}`;
    });
    return `{${fields.join(",")}}`;
  }
  fail("INVALID_JSON_VALUE", "Unsupported JSON value");
}
