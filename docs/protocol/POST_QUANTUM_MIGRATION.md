# Post-Quantum Migration and Historical Evidence

Status: Local implementation and acceptance checks completed, 2026-10-18.
Included in Alpha.6; publication status is tracked in the
[release plan](../operations/RELEASE_PUBLISHING_PLAN.md).
No real adopter authority has been migrated.

## Purpose and Scope

Protect organizational identity continuity as signature algorithms age. This
work implements three bounded changes: post-quantum signing, authenticated
forward migration, and explicit historical-evidence verification. It does not
change any adopter's real keys or publish a migration on their behalf.

## Compatibility Contract

- Existing v1 Ed25519 keys, authorities, statements, signatures and migration
  records retain their original bytes, hashes and signing input.
- New cryptographic semantics use version 2.0. Old implementations must reject
  the unknown version; they must not interpret a hybrid policy as ordinary v1.
- Statement and evidence payloads retain their existing versions when their
  payload semantics have not changed. Their embedded authority can be v2.
- Historical mathematical signature validity is distinct from current
  algorithm suitability and independently established publication time.
- No new requirement silently invalidates old history. A retired algorithm
  must not be represented as safe merely because its old equation verifies.

## 1. Post-Quantum Signing

Use Node.js/OpenSSL ML-DSA-65 (FIPS 204). Do not implement cryptographic
primitives. Preserve Ed25519 for existing records. Native runtime support must
be checked and unsupported runtimes must fail with an actionable error.

V2 keys use PKCS#8 DER for private ML-DSA material and SPKI DER for public
material, base64url encoded. Public validators must reject private material
and algorithm/key-type mismatches. V1 Ed25519 JWK encoding is unchanged.

V2 root authorities have an explicit signature policy:

- `hybrid-ed25519-ml-dsa-65`: each counted holder supplies both algorithms;
- `ml-dsa-65`: each counted holder supplies ML-DSA-65.

Keys declare `holder_id`. The authority's m-of-n threshold counts distinct
complete holders, not raw signatures or keys. A hybrid holder's two keys
represent one governance vote. Duplicate public keys, missing algorithm pairs,
unknown policies and incomplete holder sets are rejected.

V2 signatures bind the canonical payload, authority hash, algorithm, key ID
and signed-at metadata through a domain-separated signing input. Both hybrid
requirements must verify. Stripping one signature, changing policy metadata,
relabeling an algorithm or reverting the envelope to v1 must fail.

## 2. Migration Before Algorithm Retirement

Existing v1-to-v1 migration remains supported. A migration involving v2 uses a
v2 migration record and separate old-authority authorization and new-authority
acceptance. Both thresholds must verify over the same migration payload.

The migration binds both authority hashes, predecessor statement hashes and
its effective time. Post-quantum protection cannot be dropped by migrating to
an Ed25519-only authority. Pinning the expected predecessor/current authority
is necessary to resist rollback; a self-contained package cannot prove that
there is no newer version elsewhere.

Adopter sequence:

1. Keep and back up the existing published package at a dated immutable path.
2. Upgrade verification tools before changing the public authority.
3. Generate new ML-DSA keys for the existing independent key holders.
4. Prepare a hybrid authority with the existing governance threshold.
5. Create a migration; collect old authorization and new acceptance signatures.
6. Verify locally with pinned authority hashes; generate and inspect the new
   public package and Agent output.
7. Prepare a checkpoint covering authority, payload, signatures and migration.
8. Obtain the organization's approval, then publish and independently anchor
   the checkpoint. Retain the previous package, proof and verification tools.
9. Share the new pinned authority with verifiers. PQ-only operation can follow
   through a second authenticated migration when interoperability is ready.

An Ed25519 signature after Ed25519 has become forgeable cannot establish a
unique legitimate successor. A self-declared old date cannot repair this.
Successful local migration checks must not claim external time anchoring.

## 3. Historical Evidence and Renewal

Add a portable checkpoint that binds exact public artifact bytes, including
signatures, root authorities and migration acceptance, using SHA-256 and
SHA-512. The SHA-512 digest preserves an additional independent digest; it does
not change existing v1 hashes. Checkpoints must exclude secrets and reject
symlinks and unsafe paths.

A checkpoint can be signed by the current authority. An outer history seal
binds the exact checkpoint, detached signature and authority bytes. Timestamp
this seal through OpenTimestamps, not the unsigned checkpoint alone. Renewals
bind the exact previous checkpoint, signature and authority, retaining the
prior snapshot and proof chain.
The verifier must distinguish:

- mathematical signature validity;
- classical-only, hybrid or PQ-only policy;
- external time proof absent, pending, or actually checked;
- current use versus historical interpretation under a verifier's policy.

Full historical acceptance requires a verified pre-cutoff anchor under the
consumer's trusted chain/anchor policy. A pending calendar receipt, a CID,
local clock, unsigned `signed_at`, self-reported lockfile or unchecked block
API response alone must not establish that a record predates compromise.
Independent block/hash pins are verifier inputs, never supplied as trusted
facts by the organization being verified. Anchor networks and hash algorithms
also need review and renewal before their assumptions fail.

Renewal verification rechecks the preserved prior snapshot and reconciles all
declared migration indexes. Removing migration references from a later package
must not erase earlier classical-signature cutoff obligations. Deeper renewal
ancestry requires a verifier-owned cache pin from a successful verification
under the same or stricter policy; publisher-signed lineage claims are not a
substitute. A changed retirement policy requires rechecking the earlier proof
chain rather than reusing a weaker cached judgment.

## Acceptance and Implementation Progress

- [x] V1 fixture bytes/hashes and existing verification remain unchanged.
- [x] Native ML-DSA key generation, export, signing and verification work.
- [x] Hybrid m-of-n counts complete holders; classical-only bypass fails.
- [x] Unsupported algorithms and versions fail closed.
- [x] Both migration authorities must approve a v2 transition.
- [x] Downgrade, wrong successor, signature stripping and rollback against a
      pinned expected authority are rejected.
- [x] Checkpoint creation/verification binds all required public artifacts and
      prior checkpoint/signature on renewal.
- [x] Historical output separates time evidence and algorithm assurance.
- [x] Local CLI, public verify page, URL/Agent verification, package schemas
      and adopter instructions agree.
- [x] Focused tests, full quality gates and installed-package smoke pass.

### Verification Record

- Full `node --run release:check`: 296 tests passed; coverage 87.89% lines,
  61.09% branches and 93.83% functions. Documentation, assurance, release,
  package and installed-package smoke gates passed. Five additional history
  regressions were finalized afterward without further production-code changes;
  the final history suite passed 75/75. The combined final PQ, migration,
  checkpoint and OpenTimestamps rerun passed 115/115.
- Native-minimum runtime Node 24.6.0: post-quantum suite passed 28/28. Native
  signatures were also cross-checked against the exact domain-separated input.
- The adopter CLI rehearsal preserved archived v1 bytes, migrated v1 to hybrid
  and then PQ-only, verified both roles and the public chain, and rejected
  missing acceptance, wrong pins, downgrade and malformed policy options.
- Hybrid 2-of-3 was checked across all 64 subsets of its six component keys;
  mixed-holder or classical-only signatures never formed a complete vote.
- History regressions reject payload-only anchoring, altered sealed bytes,
  inconsistent migration indexes and inherited-cutoff laundering. A pre-cutoff
  checkpoint followed by valid post-cutoff renewals works with an independently
  established verifier cache pin; publisher-supplied trust claims do not suffice.
- All existing schema files remain unchanged. A read-only check of
  `https://organchor.org` passed with the new verifier, correctly reporting
  `CLASSICAL_ONLY` and unchecked historical time; the live site was not changed.

### Release And Real-Adopter Boundary

`organchor@0.1.0-alpha.5` remains Ed25519-only; Alpha.6 adds the opt-in tool support.
Test anchors are
synthetic fixtures, not claims that a new real Bitcoin timestamp or Arweave
publication was obtained. This work does not constitute an independent security
audit or a guarantee against all future quantum attacks.

A subsequent rollout must first release upgraded tools and publish the v2
schemas, then rehearse each adopter's unchanged archived package. The adopter
approves its holder map, successor authority and independent pins before any
real migration, publication or timestamp submission. Preserve the old package
and proof chain. Do not bulk-rewrite adopters or retire their v1 history.

## Sources

- [NIST FIPS 204, ML-DSA](https://csrc.nist.gov/pubs/fips/204/final)
- [NIST FIPS 205, SLH-DSA](https://csrc.nist.gov/pubs/fips/205/final)
- [Node.js crypto](https://nodejs.org/api/crypto.html)
- [RFC 4998, evidence renewal](https://www.rfc-editor.org/rfc/rfc4998.html)
- [RFC 9958, PQC for engineers](https://www.rfc-editor.org/rfc/rfc9958.html)

SLH-DSA remains a reviewed future diversity option. No additional algorithm is
enabled merely because a runtime happens to expose it.
