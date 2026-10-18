import { sha256CanonicalJson } from "./hash.ts";
import type { Algorithm, RootAuthority } from "../types/artifacts.ts";

export type SigningPolicy = "hybrid-ed25519-ml-dsa-65" | "ml-dsa-65";

export function requiredAlgorithms(authority: RootAuthority): Algorithm[] {
  if (authority.version === "1.0") return ["ed25519"];
  if (authority.signing_policy === "hybrid-ed25519-ml-dsa-65") return ["ed25519", "ml-dsa-65"];
  if (authority.signing_policy === "ml-dsa-65") return ["ml-dsa-65"];
  throw new Error("Unsupported v2 root authority signing policy");
}

export function completeAuthorizers(authority: RootAuthority, validKeyIds: string[]): string[] {
  if (authority.version === "1.0") return [...new Set(validKeyIds)];
  const algorithms = requiredAlgorithms(authority);
  const valid = new Set(validKeyIds);
  const holders = [...new Set(authority.keys.map((key) => String(key.holder_id)))];
  return holders.filter((holder) => algorithms.every((algorithm) => authority.keys.some(
    (key) => key.holder_id === holder && key.algorithm === algorithm && valid.has(key.id)
  )));
}

export function cryptoAssurance(authority: RootAuthority) {
  const algorithms = requiredAlgorithms(authority);
  return {
    authority_hash: sha256CanonicalJson(authority),
    profile: authority.version === "1.0" ? "CLASSICAL_ONLY" :
      authority.signing_policy === "ml-dsa-65" ? "POST_QUANTUM_ONLY" : "HYBRID",
    algorithms,
    post_quantum_required: algorithms.includes("ml-dsa-65"),
    algorithm_security: authority.version === "1.0" ? "QUANTUM_VULNERABLE" : "POST_QUANTUM_STANDARD_IN_USE",
    historical_time_evidence: "NOT_CHECKED",
    limitation: "Signature validity is separate from real-world truth, trusted authority bootstrap, algorithm retirement and independently checked publication time."
  };
}

export function assertNoCryptoDowngrade(oldAuthority: RootAuthority, newAuthority: RootAuthority): void {
  if (requiredAlgorithms(oldAuthority).includes("ml-dsa-65") && !requiredAlgorithms(newAuthority).includes("ml-dsa-65")) {
    throw new Error("Cryptographic downgrade: a post-quantum authority cannot migrate to classical-only signing");
  }
}
