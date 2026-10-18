# ADR 0002: Crypto Agility and Post-Quantum Readiness

## Status

Accepted

Implementation update, 2026-10-18: v1 remains unchanged; the accepted
[post-quantum migration plan](../protocol/POST_QUANTUM_MIGRATION.md) defines the
v2 implementation and its acceptance gates. See the
[operator guide](../guides/POST_QUANTUM_MIGRATION_GUIDE.md) for the migration flow.

## Context

OrgAnchor needs digital signatures for long-term identity continuity.

Ed25519 is a good v1 choice because it is mature, compact, widely implemented, and supported by Node.js crypto.

However, Ed25519 is an elliptic-curve signature algorithm. A future cryptographically relevant quantum computer would threaten elliptic-curve and other classical public-key systems.

OrgAnchor is intended to preserve organizational identity continuity over long periods, so it must not make its identity model depend on one algorithm forever.

## Decision

OrgAnchor will use Ed25519 as the v1 default signature algorithm.

OrgAnchor will also require crypto agility from the beginning:

- Every key has an explicit `algorithm`.
- Every signature has an explicit `algorithm`.
- Signature files support multiple signatures.
- Root authority records support multiple keys.
- Verification checks both cryptographic validity and root authority threshold rules.
- Migration statements can move an organization from one root authority to another.
- Future post-quantum signatures can be added without redefining the whole product model.

The identity root is the organization root authority, not Ed25519 itself.

## V2 Implementation

Native Node.js/OpenSSL ML-DSA-65 implements the post-quantum primitive; OrgAnchor
does not implement low-level signature cryptography. Native vetted primitives
and a standardized algorithm do not establish completion of an independent
audit of OrgAnchor or its integration.

- [Key handling](../../src/crypto/keys.ts) preserves Ed25519 JWK and uses base64url
  PKCS#8 DER private material and SPKI DER public material for ML-DSA-65.
- [Authority validation](../../src/core/validate.ts) and
  [policy evaluation](../../src/core/crypto-policy.ts) enforce `holder_id`, explicit
  `hybrid-ed25519-ml-dsa-65` or `ml-dsa-65` policy, and complete-holder thresholds.
  A hybrid vote requires Ed25519 AND ML-DSA-65 from the same holder.
- [Signature handling](../../src/crypto/signature.ts) binds the payload,
  `authority_hash`, `key_id`, `algorithm`, and `signed_at` through the canonical
  domain-separated v2 signing input. The v1 signing input is unchanged.
- [Migration verification](../../src/core/migration.ts) requires old-authority
  authorization and separate successor acceptance for v2 migration records.
  Expected authority hashes must be independently pinned; PQ protection cannot
  be dropped by migration to a classical-only authority.
- V2 migration sequence numbers and predecessor hashes bind successive records.
  History checkpoint seals commit to the exact checkpoint, detached signature
  and authority bytes before timestamping. Trusted-time verification requires
  independently acquired chain pins and externally supplied cutoff policy.
- Separate [authority](../../src/schema/root-authority.v2.schema.json),
  [signature](../../src/schema/signature.v2.schema.json), and
  [migration](../../src/schema/root-authority-migration.v2.schema.json) schemas
  describe v2 structure without changing v1 schemas. Runtime validation remains
  necessary for cross-field rules, key decoding, hashes and signatures.

Legacy Ed25519 key files may carry `holder_id` while retaining version 1.0.
Payload formats that have not changed retain their versions even when embedding
a v2 authority. A v1 authority signs its authorization of a v2 migration using
its existing envelope semantics; the v2 successor uses v2 acceptance signatures.

## Consequences

Benefits:

- v1 can ship with a mature and practical signing system.
- The file format can survive future algorithm migration.
- V2 supports hybrid classical/post-quantum and ML-DSA-65-only root authorities.
- Historical Ed25519 signatures remain mathematically verifiable under v1 rules;
  historical attribution also needs suitable pre-compromise external time evidence.

Costs:

- The v1 schema and signature format are slightly more complex than a single-key format.
- Verification must understand algorithm identifiers and fail closed on unsupported algorithms.
- Documentation must explain that v1 is not quantum-proof.

## Post-Quantum Position

V2 uses ML-DSA-65; SLH-DSA remains a reviewed future diversity option. Unsupported
algorithms, versions and native runtimes fail closed, without a classical-only
fallback. The accepted plan, rather than this ADR, tracks implementation
completion and testing.

Mathematical signature validity, current algorithm suitability, and independently
verified publication time are separate judgments. Authenticated `signed_at`, a
CID, an archive reference, or a pending timestamp receipt alone cannot establish
pre-compromise history. Historical evidence and renewal must follow the
[cryptography policy](../project/CRYPTO_POLICY.md) and accepted migration plan.

## Non-Goals

OrgAnchor does not use quantum key distribution.

OrgAnchor does not claim v1 is quantum-proof.

V2 is not a promise of absolute quantum-proof security or completed independent
audit. Migration must precede compromise, and a self-contained package cannot
prove that no newer valid authority or package exists elsewhere.

OrgAnchor does not replace organizational key governance with cryptographic branding.

## References

- NIST Post-Quantum Cryptography overview: https://www.nist.gov/cybersecurity-and-privacy/what-post-quantum-cryptography
- NIST FIPS 204, ML-DSA: https://csrc.nist.gov/pubs/fips/204/final
- NIST FIPS 205, SLH-DSA: https://csrc.nist.gov/pubs/fips/205/final
- NSA Post-Quantum Cybersecurity Resources: https://www.nsa.gov/Cybersecurity/Post-Quantum-Cybersecurity-Resources/
