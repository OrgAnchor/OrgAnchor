export interface OnionValidationResult {
  ok: boolean;
  normalized: string;
  version?: "v3";
  reason?: string;
}

const ONION_V3_PATTERN = /^[a-z2-7]{56}\.onion$/;

export function normalizeOnionAddress(input: string): string {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return new URL(trimmed).hostname;
  }
  return trimmed.replace(/\/+$/, "");
}

export function validateOnionAddress(input: string): OnionValidationResult {
  const normalized = normalizeOnionAddress(input);
  if (!normalized.endsWith(".onion")) {
    return { ok: false, normalized, reason: "Address must end with .onion." };
  }
  const label = normalized.slice(0, -".onion".length);
  if (label.length === 16) {
    return { ok: false, normalized, reason: "Onion v2 addresses are not supported. Use a 56-character v3 address." };
  }
  if (!ONION_V3_PATTERN.test(normalized)) {
    return {
      ok: false,
      normalized,
      reason: "Onion v3 addresses must be 56 lowercase base32 characters followed by .onion."
    };
  }
  return { ok: true, normalized, version: "v3" };
}
