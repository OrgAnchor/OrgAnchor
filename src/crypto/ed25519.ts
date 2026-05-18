import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  sign as nodeSign,
  verify as nodeVerify
} from "node:crypto";
import type { JsonWebKey as NodeJsonWebKey, KeyObject } from "node:crypto";
import type { Jwk, OrgAnchorPrivateKey, OrgAnchorPublicKey, RootAuthorityKey } from "../types/artifacts.ts";
import { fromBase64Url, toBase64Url } from "../core/base64url.ts";

export function generateEd25519PrivateKey(id: string, now = new Date()): OrgAnchorPrivateKey {
  const { privateKey } = generateKeyPairSync("ed25519");
  return {
    type: "OrgAnchorPrivateKey",
    version: "1.0",
    id,
    algorithm: "ed25519",
    created_at: now.toISOString(),
    key_material: {
      format: "jwk",
      jwk: privateKey.export({ format: "jwk" }) as unknown as Jwk
    }
  };
}

export function exportPublicKey(privateKey: OrgAnchorPrivateKey): OrgAnchorPublicKey {
  const privateKeyObject = importPrivateKey(privateKey);
  const publicKey = createPublicKey(privateKeyObject);
  return {
    type: "OrgAnchorPublicKey",
    version: "1.0",
    id: privateKey.id,
    algorithm: privateKey.algorithm,
    created_at: new Date().toISOString(),
    public_key: {
      format: "jwk",
      jwk: publicKey.export({ format: "jwk" }) as unknown as Jwk
    }
  };
}

export function rootAuthorityKeyFromPrivate(privateKey: OrgAnchorPrivateKey): RootAuthorityKey {
  const publicKey = exportPublicKey(privateKey);
  return {
    id: publicKey.id,
    algorithm: publicKey.algorithm,
    public_key: publicKey.public_key
  };
}

export function signEd25519(data: Buffer, privateKey: OrgAnchorPrivateKey): string {
  const signature = nodeSign(null, data, importPrivateKey(privateKey));
  return toBase64Url(signature);
}

export function verifyEd25519(data: Buffer, signature: string, key: RootAuthorityKey): boolean {
  return nodeVerify(null, data, importPublicKey(key), fromBase64Url(signature));
}

function importPrivateKey(privateKey: OrgAnchorPrivateKey): KeyObject {
  return createPrivateKey({
    key: privateKey.key_material.jwk as unknown as NodeJsonWebKey,
    format: "jwk"
  });
}

function importPublicKey(key: RootAuthorityKey): KeyObject {
  return createPublicKey({
    key: key.public_key.jwk as unknown as NodeJsonWebKey,
    format: "jwk"
  });
}
