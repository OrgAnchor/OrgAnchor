# ADR 0002: Crypto Agility and Post-Quantum Readiness

## Status

Accepted

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

## Consequences

Benefits:

- v1 can ship with a mature and practical signing system.
- The file format can survive future algorithm migration.
- Hybrid classical/post-quantum root authorities are possible later.
- Historical Ed25519 statements remain verifiable.

Costs:

- The v1 schema and signature format are slightly more complex than a single-key format.
- Verification must understand algorithm identifiers and fail closed on unsupported algorithms.
- Documentation must explain that v1 is not quantum-proof.

## Post-Quantum Position

OrgAnchor should track NIST post-quantum signature standards, especially:

- ML-DSA.
- SLH-DSA.

OrgAnchor should not make an experimental post-quantum JavaScript implementation a required v1 dependency unless it is mature, audited, actively maintained, license-compatible, and has usable test vectors.

## Non-Goals

OrgAnchor does not use quantum key distribution.

OrgAnchor does not claim v1 is quantum-proof.

OrgAnchor does not replace organizational key governance with cryptographic branding.

## References

- NIST Post-Quantum Cryptography overview: https://www.nist.gov/cybersecurity-and-privacy/what-post-quantum-cryptography
- NIST FIPS 204, ML-DSA: https://csrc.nist.gov/pubs/fips/204/final
- NIST FIPS 205, SLH-DSA: https://csrc.nist.gov/pubs/fips/205/final
- NSA Post-Quantum Cybersecurity Resources: https://www.nsa.gov/Cybersecurity/Post-Quantum-Cybersecurity-Resources/
