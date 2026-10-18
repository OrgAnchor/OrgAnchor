import { createPrivateKey, createPublicKey, generateKeyPairSync, sign, verify } from "node:crypto";
import { fromBase64Url, toBase64Url } from "../core/base64url.ts";
import { fail } from "../core/errors.ts";
import type { Algorithm, OrgAnchorPrivateKey, OrgAnchorPublicKey, RootAuthorityKey } from "../types/artifacts.ts";
import { exportPublicKey as exportEd25519PublicKey, generateEd25519PrivateKey, signEd25519, verifyEd25519 } from "./ed25519.ts";

export function generatePrivateKey(id: string, algorithm: Algorithm = "ed25519", holderId?: string): OrgAnchorPrivateKey {
  if (algorithm === "ed25519") {
    const key = generateEd25519PrivateKey(id);
    if (holderId) key.holder_id = holderId;
    return key;
  }
  if (algorithm !== "ml-dsa-65") fail("UNSUPPORTED_ALGORITHM", `Unsupported signing algorithm: ${algorithm}`);
  try {
    const { privateKey } = generateKeyPairSync("ml-dsa-65");
    return {
      type: "OrgAnchorPrivateKey", version: "2.0", id, algorithm,
      created_at: new Date().toISOString(),
      ...(holderId ? { holder_id: holderId } : {}),
      key_material: { format: "pkcs8-der", data: toBase64Url(privateKey.export({ format: "der", type: "pkcs8" })) }
    };
  } catch {
    fail("UNSUPPORTED_RUNTIME", "ML-DSA-65 requires a Node.js build with native ML-DSA/OpenSSL support (Node 24.6+). Upgrade the runtime; no fallback is allowed.");
  }
}

export function exportPublicKey(privateKey: OrgAnchorPrivateKey): OrgAnchorPublicKey {
  if (privateKey.algorithm === "ed25519") {
    const key = exportEd25519PublicKey(privateKey);
    if (typeof privateKey.holder_id === "string") key.holder_id = privateKey.holder_id;
    return key;
  }
  const material = privateKey.key_material;
  if (material.format !== "pkcs8-der") fail("VALIDATION_ERROR", "ML-DSA private keys require PKCS#8 DER");
  const key = createPrivateKey({ key: fromBase64Url(material.data), format: "der", type: "pkcs8" });
  if (key.asymmetricKeyType !== "ml-dsa-65") fail("VALIDATION_ERROR", "Private key type does not match ML-DSA-65");
  return {
    type: "OrgAnchorPublicKey", version: "2.0", id: privateKey.id, algorithm: privateKey.algorithm,
    created_at: new Date().toISOString(),
    ...(typeof privateKey.holder_id === "string" ? { holder_id: privateKey.holder_id } : {}),
    public_key: { format: "spki-der", data: toBase64Url(createPublicKey(key).export({ format: "der", type: "spki" })) }
  };
}

export function rootAuthorityKeyFromPrivate(privateKey: OrgAnchorPrivateKey): RootAuthorityKey {
  const key = exportPublicKey(privateKey);
  return {
    id: key.id, algorithm: key.algorithm, public_key: key.public_key,
    ...(typeof key.holder_id === "string" ? { holder_id: key.holder_id } : {})
  };
}

export function signBytes(data: Buffer, key: OrgAnchorPrivateKey): string {
  if (key.algorithm === "ed25519") return signEd25519(data, key);
  if (key.algorithm !== "ml-dsa-65" || key.key_material.format !== "pkcs8-der") {
    fail("UNSUPPORTED_ALGORITHM", "Unsupported private signing key");
  }
  const native = createPrivateKey({ key: fromBase64Url(key.key_material.data), format: "der", type: "pkcs8" });
  if (native.asymmetricKeyType !== key.algorithm) fail("VALIDATION_ERROR", "Private key algorithm mismatch");
  return toBase64Url(sign(null, data, native));
}

export function verifyBytes(data: Buffer, signature: string, key: RootAuthorityKey): boolean {
  if (key.algorithm === "ed25519") return verifyEd25519(data, signature, key);
  if (key.algorithm !== "ml-dsa-65" || key.public_key.format !== "spki-der") return false;
  try {
    const native = createPublicKey({ key: fromBase64Url(key.public_key.data), format: "der", type: "spki" });
    return native.asymmetricKeyType === key.algorithm && verify(null, data, native, fromBase64Url(signature));
  } catch { return false; }
}
