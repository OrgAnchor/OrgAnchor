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
- Future hybrid signatures.
- Future post-quantum signature algorithms.
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

OrgAnchor should track ML-DSA and SLH-DSA for future signature support.

v1 should not require a post-quantum JavaScript implementation as a hard dependency unless the implementation is mature, audited, actively maintained, and license-compatible.

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
    "value": "BASE64URL_OR_HEX_HASH"
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

Add a post-quantum key alongside existing Ed25519 keys:

```json
{
  "root_authority": {
    "id": "root-authority-2027",
    "threshold": {
      "required": 2,
      "total": 2
    },
    "keys": [
      {
        "id": "root-ed25519-2026",
        "algorithm": "ed25519",
        "public_key": "..."
      },
      {
        "id": "root-ml-dsa-2027",
        "algorithm": "ml-dsa",
        "public_key": "..."
      }
    ]
  }
}
```

This lets a statement require both a classical and a post-quantum signature during the transition period.

### Phase 3: Post-Quantum Primary

When implementation quality, ecosystem support, and interoperability are strong enough, OrgAnchor can make post-quantum signatures the recommended default for new root authorities.

Ed25519 can remain supported for historical verification.

## Historical Protection

OrgAnchor statements are public. The main quantum risk is not decryption of old secrets; it is future forgery of signatures if old public-key algorithms become breakable.

To make historical forgery harder to confuse with genuine history, OrgAnchor should encourage timestamped and independently archived records:

- Arweave publication.
- IPFS CID records.
- Git tags or releases.
- Traditional website history.
- Third-party mirrors.
- Future timestamping receipts.

These records do not replace signatures, but they help show that a specific statement existed before a later cryptographic break.

## Forbidden Claims

OrgAnchor must not claim:

- Ed25519 is permanently secure.
- OrgAnchor is quantum-proof in v1.
- A signed statement proves legal identity.
- Arweave or IPFS makes a statement automatically trustworthy.
- Quantum key distribution is needed for OrgAnchor.
- Post-quantum support removes the need for key management.

Correct claims:

- OrgAnchor v1 uses mature classical signatures.
- OrgAnchor is designed for cryptographic migration.
- OrgAnchor can add post-quantum signatures without changing its core product model.
- The root authority, not a fixed algorithm, is the identity continuity concept.

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

Use Ed25519 for v1 implementation.

Design all data structures as if post-quantum signatures will be added later.

Do not implement low-level cryptography ourselves.

Do not add experimental post-quantum signing as a default dependency in v1.
