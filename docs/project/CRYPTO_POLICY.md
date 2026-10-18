# OrgAnchor Cryptography Policy

Status: Active cryptographic policy; accepted architecture decisions are recorded separately under `docs/adr/`.

## Purpose

OrgAnchor is a long-term identity continuity tool. Its cryptographic design must be practical today and migratable tomorrow.

This policy defines how OrgAnchor chooses signature algorithms, how it avoids locking the project into one algorithm forever, and how it should prepare for post-quantum migration.

## Core Position

OrgAnchor v1 uses Ed25519 because it is mature, widely implemented, compact, and available in Node.js without implementing low-level cryptography ourselves.

However, OrgAnchor must not treat Ed25519 as a permanent identity root by itself.

The permanent identity concept is:

```text
organization root authority
```

not:

```text
a specific algorithm forever
```

The root authority format, signature format, schema, and migration statements must support algorithm agility from the beginning.

## Required Properties

OrgAnchor cryptography must support:

- Explicit algorithm identifiers.
- Multiple keys in one root authority.
- Multiple signatures over one canonical statement.
- Threshold rules such as `1-of-1`, `2-of-3`, and `3-of-5`.
- V2 per-holder hybrid Ed25519 AND ML-DSA-65 signatures.
- V2 ML-DSA-65-only signing and explicit future algorithm review.
- Migration statements that connect old root authority records to new ones.
- Verification of historical statements even after newer algorithms are introduced.

## v1 Signature Algorithm

v1 default:

```text
Ed25519
```

Rationale:

- Mature and widely deployed.
- Compact public keys and signatures.
- Deterministic signatures.
- Supported by Node.js crypto.
- Suitable for CLI-first signing and verification.
- Reasonable dependency footprint.

Security boundary:

- Ed25519 is not post-quantum secure.
- If a cryptographically relevant quantum computer becomes practical, elliptic-curve signatures such as Ed25519 should be considered vulnerable.
- OrgAnchor must provide a migration path instead of assuming Ed25519 lasts forever.

## Post-Quantum Position

NIST has standardized post-quantum algorithms, including:

- ML-DSA for digital signatures.
- SLH-DSA for stateless hash-based digital signatures.
- ML-KEM for key encapsulation, which is not the main primitive OrgAnchor needs for signed public statements.

V2 uses native Node.js/OpenSSL ML-DSA-65 with either
`hybrid-ed25519-ml-dsa-65` or `ml-dsa-65` signing policy. V1 Ed25519
verification and signing input remain unchanged. SLH-DSA is a future diversity
option, not an enabled signing algorithm.

Use vetted native primitives; do not implement low-level cryptography or silently
fall back to Ed25519 when native ML-DSA support is unavailable. Native support
requires an ML-DSA-capable Node.js/OpenSSL build (Node 24.6+). Standardization and
use of native primitives do not establish that OrgAnchor's integration has
completed an independent security audit.

ML-DSA private material is base64url PKCS#8 DER; public material is base64url
SPKI DER (`public_key.format: "spki-der"`, `public_key.data`). Ed25519 remains
JWK encoded. A legacy Ed25519 key file can retain `version: "1.0"` and carry
`holder_id`; participating in a v2 authority does not convert it to an ML-DSA key.

## Recommended Migration Path

### Phase 1: Ed25519 with Algorithm Agility

Use Ed25519 for signing and verification.

Require every key and signature to include an explicit `algorithm` field.

Use a signature file format that can contain multiple signatures:

```json
{
  "type": "OrgAnchorSignature",
  "version": "1.0",
  "canonicalization": "RFC8785-JCS",
  "hash": {
    "algorithm": "sha256",
    "value": "sha256:0000000000000000000000000000000000000000000000000000000000000000"
  },
  "signatures": [
    {
      "key_id": "root-ed25519-2026",
      "algorithm": "ed25519",
      "signature": "BASE64URL_SIGNATURE",
      "signed_at": "2026-05-08T00:00:00Z"
    }
  ]
}
```

### Phase 2: Hybrid Root Authority

Create a v2 authority that gives each holder both required algorithms. This
structural illustration omits usable key material; generate actual keys with the
CLI rather than publishing these placeholders:

```json
{
  "schema": "https://organchor.org/schemas/root-authority.v2.json",
  "type": "OrgAnchorRootAuthority",
  "version": "2.0",
  "authority_id": "root-authority-hybrid-2026",
  "created_at": "2026-10-18T00:00:00Z",
  "signing_policy": "hybrid-ed25519-ml-dsa-65",
  "threshold": { "required": 1, "total": 1 },
  "keys": [
    {
      "id": "alice-ed25519",
      "holder_id": "alice",
      "algorithm": "ed25519",
      "public_key": {
        "format": "jwk",
        "jwk": { "kty": "OKP", "crv": "Ed25519", "x": "PUBLIC_KEY_PLACEHOLDER" }
      }
    },
    {
      "id": "alice-ml-dsa-65",
      "holder_id": "alice",
      "algorithm": "ml-dsa-65",
      "public_key": { "format": "spki-der", "data": "PUBLIC_KEY_PLACEHOLDER" }
    }
  ]
}
```

This is **1-of-1 holders**, not 2-of-2 keys. Alice counts only after both her
Ed25519 and ML-DSA-65 signatures verify. A 2-of-3 hybrid authority has three
complete holder pairs and needs both signatures from each of two holders;
Ed25519 from Alice plus ML-DSA-65 from Bob is not a complete vote.

V2 signature envelopes require `authority_hash`. Each signature covers the
canonical domain-separated `OrgAnchorSigningInput` v2 object containing that
hash, `key_id`, `algorithm`, `signed_at`, and the entire payload. The envelope's
`hash.value` remains the SHA-256 digest of the canonical payload. V1 continues
to sign the canonical payload directly. Unknown versions and algorithms fail
closed; algorithm labels alone do not implement these rules.

Any migration involving a v2 authority uses a v2 migration payload, old-authority
authorization, and separate new-authority acceptance over the same payload.
Envelope versions follow the respective signing authorities: an existing v1
authority can authorize the v2 migration with a v1 envelope, while its v2
successor accepts with a v2 envelope. Preserve the existing old-only v1-to-v1
workflow. Independently pin the expected authority hashes; prohibit migration
from a PQ-requiring authority to an Ed25519-only authority.

V2 migration records also require positive integer `sequence` and
`previous_migration_hash` (a canonical SHA-256 digest or null). Creating a
successive migration with `--previous-migration` binds its predecessor and
increments the sequence. Verify hash links and authority continuity across the
whole chain; a valid isolated migration is not proof that it is the latest one.

### Phase 3: Post-Quantum Primary

The v2 `ml-dsa-65` policy requires one ML-DSA-65 key and signature per counted
holder. Moving from hybrid to PQ-only requires another authenticated migration,
not removal of the classical signatures from an existing hybrid envelope.
Changing defaults requires review of implementation quality, ecosystem support,
and interoperability; it must not rewrite v1 history.

Ed25519 can remain supported for historical verification.

## Historical Protection

OrgAnchor statements are public. The main quantum risk is not decryption of old secrets; it is future forgery of signatures if old public-key algorithms become breakable.

Keep three separate judgments: mathematical signature validity, suitability of
the algorithm for current use, and independently established publication time.
A signed date, including v2 authenticated `signed_at`, is not an independent
timestamp. After an algorithm becomes forgeable, a new signature made with it
cannot by itself establish the legitimate history or successor authority.

Preserve exact public artifact bytes, authority records, detached signatures,
migration authorization and acceptance, checkpoints, and proof chains. Archives
and carriers provide durability and retrieval, but the following alone do not
prove pre-compromise existence:

- Arweave publication.
- IPFS CID records.
- Git tags or releases.
- Traditional website history.
- Third-party mirrors.
- A pending OpenTimestamps calendar receipt without a checked attestation.

Create and sign a history checkpoint, then create an `OrgAnchorHistorySeal`
version 1.0 object containing SHA-256 and SHA-512 digests of the exact checkpoint,
detached signature and authority files. Timestamp the **seal**, not the unsigned
checkpoint alone, so the anchor also commits to the existing signatures. Keep
all sealed files byte-for-byte; changing signature metadata also changes its
sealed digest.

Strong historical attribution requires a verified pre-cutoff anchor over the
exact artifacts under the consumer's trusted chain/anchor policy, with
independently obtained block/hash pins where required. An unchecked block API
response, local clock, CID, Git tag, or self-reported lockfile is insufficient.
Evidence renewal must bind the prior checkpoint and signature, retain prior
proofs, and occur before the relevant signature, hash, or anchor assumptions
fail. SHA-512 checkpoint digests supplement rather than replace v1 SHA-256
hashes. Local signature or migration PASS must not be reported as externally
time-anchored; absent, pending, and verified time evidence remain distinct.
Trusted-time verification supplies the seal, its OTS proof, and an independently
acquired Bitcoin block pin containing `height`, `block_hash` and `header_hex`.
Consumers must establish canonical-chain membership and confirmations themselves;
checking a header hash is not equivalent to that trust decision. Supply
`--classical-cutoff` from external algorithm-retirement policy and `--before`
for an explicit anchor cutoff. OrgAnchor must not invent retirement dates.

## Forbidden Claims

OrgAnchor must not claim:

- Ed25519 is permanently secure.
- OrgAnchor is quantum-proof in v1.
- V2 is absolutely quantum-proof or its independent security audit is complete.
- A signed statement proves legal identity.
- Arweave or IPFS makes a statement automatically trustworthy.
- Quantum key distribution is needed for OrgAnchor.
- Post-quantum support removes the need for key management.

Correct claims:

- OrgAnchor v1 uses mature classical signatures.
- OrgAnchor is designed for cryptographic migration.
- V2 supports explicit per-holder hybrid and ML-DSA-65-only signing policies.
- The root authority, not a fixed algorithm, is the identity continuity concept.
- Signature validity alone does not establish historical publication time or claim truth.

## Testing Requirements

Cryptographic tests must cover:

- Canonical JSON hash stability.
- Signature verification succeeds for valid signatures.
- Signature verification fails after any statement modification.
- Wrong public key fails verification.
- Unsupported algorithm fails closed.
- Missing algorithm field fails validation.
- Multi-signature files are parsed deterministically.
- Threshold rules fail if too few valid signatures are present.
- Historical Ed25519 verification still works after new algorithms are introduced.
- Partial or cross-holder hybrid signatures never satisfy the holder threshold.
- V2 authority, algorithm, key ID and signed-at changes invalidate signatures.
- V2 migration needs both authorities, pinned expected hashes, and no PQ downgrade.
- Historical outputs distinguish absent, pending, and checked external time evidence.

## Review Requirements

Before enabling any new signature algorithm by default, OrgAnchor should check:

- Standard status.
- Implementation maturity.
- Security review or audit history.
- Active maintenance.
- License compatibility.
- Browser and Node.js support.
- Key and signature sizes.
- Performance.
- Long-term archival readability.
- Test vectors.

## External References

OrgAnchor's post-quantum posture should be reviewed against primary public sources:

- NIST Post-Quantum Cryptography overview: https://www.nist.gov/cybersecurity-and-privacy/what-post-quantum-cryptography
- NIST FIPS 204, ML-DSA: https://csrc.nist.gov/pubs/fips/204/final
- NIST FIPS 205, SLH-DSA: https://csrc.nist.gov/pubs/fips/205/final
- NISTIR 8105, Report on Post-Quantum Cryptography: https://nvlpubs.nist.gov/nistpubs/ir/2016/nist.ir.8105.pdf
- NSA Post-Quantum Cybersecurity Resources: https://www.nsa.gov/Cybersecurity/Post-Quantum-Cybersecurity-Resources/

## Current Recommendation

Follow the accepted 2026-10-18 implementation plan in
[POST_QUANTUM_MIGRATION.md](../protocol/POST_QUANTUM_MIGRATION.md) and the operator
[POST_QUANTUM_MIGRATION_GUIDE.md](../guides/POST_QUANTUM_MIGRATION_GUIDE.md).
The plan's acceptance checklist tracks completion; this policy is not a claim
that every checkpoint, integration, audit, or release gate is complete.

Historical verifiability does not mean that an algorithm remains secure forever.
Independent pre-compromise time evidence and evidence renewal are required for
strong long-term historical attribution. A migration must precede compromise.

Preserve existing v1 schemas, bytes, hashes and signing input. Use separate v2
schemas for new cryptographic semantics, native vetted primitives, complete
holder thresholds, and authenticated migration before algorithm retirement.
