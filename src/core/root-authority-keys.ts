import { readJsonFile } from "./json.ts";
import { asObject, validatePrivateKey, validatePublicKey } from "./validate.ts";
import { rootAuthorityKeyFromPrivate } from "../crypto/ed25519.ts";
import type { RootAuthorityKey } from "../types/artifacts.ts";

export async function readRootAuthorityKey(path: string): Promise<RootAuthorityKey> {
  const value = await readJsonFile(path);
  const object = asObject(value, "root authority key input");
  if (object.type === "OrgAnchorPrivateKey") {
    return rootAuthorityKeyFromPrivate(validatePrivateKey(value));
  }
  if (object.type === "OrgAnchorPublicKey") {
    const publicKey = validatePublicKey(value);
    return {
      id: publicKey.id,
      algorithm: publicKey.algorithm,
      public_key: publicKey.public_key
    };
  }
  throw new Error("Root authority key input must be an OrgAnchor private key or public key file");
}
