export function toBase64Url(data: Buffer | Uint8Array): string {
  return Buffer.from(data).toString("base64url");
}

export function fromBase64Url(value: string): Buffer {
  return Buffer.from(value, "base64url");
}
