# Post-Quantum Migration Guide

Status: Operator runbook for the v2 implementation included in Alpha.6.
Alpha.5 does not implement these new commands or policies.

Use this guide with the [accepted implementation plan](../protocol/POST_QUANTUM_MIGRATION.md),
[cryptography policy](../project/CRYPTO_POLICY.md), and
[general migration guide](./MIGRATION_GUIDE.md). These instructions prepare local
artifacts; they do not authorize changing an adopter's real keys or publishing a
migration. Obtain the organization's explicit governance approval first.

## Compatibility And Prerequisites

- Preserve existing v1 authority records, schemas, exact artifact bytes, hashes,
  detached signatures and signing input. Keep the prior public package at a
  stable dated or content-addressed location.
- Upgrade verifiers before changing public authority. Use a Node.js/OpenSSL build
  with native ML-DSA-65 support (Node 24.6+); unsupported runtimes must fail with
  an actionable error, never silently fall back to classical signing.
- Use vetted native primitives. Neither this guide nor a local PASS establishes
  completion of independent security review or absolute quantum-proof security.
- Back up each holder's keys independently. Keep private files outside public
  output; never upload PKCS#8 private material, private JWKs, or recovery secrets.
- Independently authenticate and pin the expected old and proposed new authority
  hashes. A hash printed by the package or fetched from the same untrusted origin
  is a consistency check, not an independent trust anchor.

## Holder And Envelope Rules

V2 authorities require `holder_id` on every root key. Their m-of-n threshold
counts distinct complete holders, not raw keys or signatures:

- `hybrid-ed25519-ml-dsa-65`: each counted holder supplies both an Ed25519 and an
  ML-DSA-65 signature. Alice's Ed25519 plus Bob's ML-DSA-65 is not a complete vote.
- `ml-dsa-65`: each counted holder supplies an ML-DSA-65 signature.

The authority must have unique key IDs and public key material, exactly one key
per required algorithm for each holder, and `threshold.total` equal to its
complete-holder count. A two-key hybrid pair is one holder, not two votes.

ML-DSA key files use version 2.0 and base64url PKCS#8 DER private material;
public records use `public_key: { "format": "spki-der", "data": "..." }`.
Legacy Ed25519 keys retain version 1.0 and JWK material, even when carrying
`holder_id` or signing for a v2 authority. Holder mapping on a new authority
does not rewrite the archived v1 authority or require editing an old key file.

V2 envelopes require `authority_hash`. Each signature covers the RFC8785-JCS
UTF-8 encoding of this domain-separated input, with actual field values:

```text
{
  "type": "OrgAnchorSigningInput",
  "version": "2.0",
  "authority_hash": "<canonical-authority-sha256>",
  "key_id": "<signing-key-id>",
  "algorithm": "<ed25519-or-ml-dsa-65>",
  "signed_at": "<UTC-timestamp>",
  "payload": <complete-payload>
}
```

The envelope's `hash.value` still hashes the canonical payload, not this wrapper.
V1 signs the canonical payload directly. Authenticated v2 `signed_at` is still
a holder's declared time, not an independently verified timestamp.

## Rehearse A V1 To Hybrid Migration

The example starts from an existing 1-of-1 Ed25519 authority at
`root-authority.json`, Alice's existing key at
`keys/alice-ed25519.private.json`, and its signed endpoint statement at
`statements/official-endpoints.json`. Use a rehearsal workspace and fresh output
names. Do not overwrite the active public package or discard its signatures.

### 1. Generate And Review The Successor

```sh
organchor key public --key keys/alice-ed25519.private.json --out keys/alice-ed25519.public.json
organchor key generate --id alice-ml-dsa-65 --algorithm ml-dsa-65 --holder alice --out keys/alice-ml-dsa-65.private.json
organchor key public --key keys/alice-ml-dsa-65.private.json --out keys/alice-ml-dsa-65.public.json
organchor authority create --keys keys/alice-ed25519.public.json,keys/alice-ml-dsa-65.public.json --holder-ids alice,alice --policy hybrid-ed25519-ml-dsa-65 --threshold 1 --id root-authority-hybrid-2026 --out next.json
organchor authority verify --authority next.json
```

Review `next.json`: version 2.0, the explicit hybrid policy, two keys with the
same `holder_id`, and threshold 1-of-1. For m-of-n custody, add a complete pair
for every independent holder and retain the approved holder threshold. Do not
raise `threshold.total` merely because the number of component keys doubled.

Authenticate the proposed canonical authority hash through the organization's
independent review process, alongside the already trusted old authority hash.
In the commands below, `OLD_AUTHORITY_HASH` and `NEW_AUTHORITY_HASH` are shell
variables populated with those independently authenticated `sha256:<64 hex>`
values. Do not populate them solely from the publisher's untrusted response.

### 2. Create The Migration Payload

```sh
organchor migrate create --old-authority root-authority.json --new-authority next.json --statement statements/official-endpoints.json --reason "Introduce per-holder hybrid signing" --out statements/migration-pq-2026-001.json
```

The record uses version 2.0 because the successor is v2. It binds both embedded
authority hashes, the predecessor statement hash, and `effective_at`.
V2 also requires integer `sequence >= 1` and `previous_migration_hash`, which is
either a canonical `sha256:<64 hex>` digest or null. This first migration starts
at sequence 1 with a null predecessor. When continuing an existing history,
pass `--previous-migration prev.json` to `migrate create`; it checks that the
predecessor ends at the supplied old authority, binds its canonical hash, and
increments its sequence (an unnumbered legacy predecessor starts the v2 sequence
at 1). Do not restart the chain or hand-edit these fields after signing.

The effective time must not precede issuance; a chosen effective time is not
proof that the migration was published then. Review and freeze the payload
before collecting either role's signatures.

### 3. Collect Authorization And Acceptance

The old authority authorizes the successor:

```sh
organchor migrate sign --role old --old-authority root-authority.json --key keys/alice-ed25519.private.json --in statements/migration-pq-2026-001.json
```

The new authority separately accepts the same migration. Both of Alice's keys
are required for its hybrid 1-of-1 threshold:

```sh
organchor migrate sign --role new --new-authority next.json --key keys/alice-ed25519.private.json --in statements/migration-pq-2026-001.json
organchor migrate sign --role new --new-authority next.json --key keys/alice-ml-dsa-65.private.json --in statements/migration-pq-2026-001.json --append
```

The default old-role output is `statements/migration-pq-2026-001.json.sig`;
the new-role output is `statements/migration-pq-2026-001.json.acceptance.sig`.
The first invocation for each role creates its output; subsequent signatures for
that role must use `--append`. For threshold custody, collect enough old
authorizers and enough complete new holders independently.

The old v1 authority uses a v1 signature envelope over this v2 migration payload;
the new v2 authority uses a v2 authority-bound envelope. Both signature files
cover the same migration payload. Never copy a payload signature into an
envelope with a different authority, version, algorithm, key ID or signed-at time.

### 4. Verify With Independent Pins

```sh
organchor migrate verify --old-authority root-authority.json --new-authority next.json --in statements/migration-pq-2026-001.json --sig statements/migration-pq-2026-001.json.sig --acceptance-sig statements/migration-pq-2026-001.json.acceptance.sig --expected-old-authority-hash "$OLD_AUTHORITY_HASH" --expected-new-authority-hash "$NEW_AUTHORITY_HASH"
```

Stop if either threshold, either pin, the hash bindings, the effective-time
ordering or the no-PQ-downgrade rule fails. A v2 successor cannot replace an
old authority merely by signing its own proposal. Preserve both authorities and
both detached signature files. Existing v1-to-v1 migrations retain the legacy
old-authorization workflow and do not gain an acceptance requirement retroactively.

`migrate verify` checks one transition, not the complete earlier history. For a
linked v2 transition, `--previous-migration prev.json` also checks its predecessor
hash, sequence, authority endpoint and time order, but not that predecessor's
signatures. Without the file, the predecessor link is explicitly `NOT_CHECKED`.
Use generated-package URL verification to verify the complete declared chain;
independent authority pins and time proofs remain separate requirements.

### 5. Prepare New Statements And Public Output

```sh
organchor statement create --authority next.json --out statements/official-endpoints-pq.json
organchor statement sign --authority next.json --key keys/alice-ed25519.private.json --in statements/official-endpoints-pq.json
organchor statement sign --authority next.json --key keys/alice-ml-dsa-65.private.json --in statements/official-endpoints-pq.json --append
organchor statement verify --authority next.json --expected-authority-hash "$NEW_AUTHORITY_HASH" --in statements/official-endpoints-pq.json --sig statements/official-endpoints-pq.json.sig
organchor page generate --authority next.json --statement statements/official-endpoints-pq.json --sig statements/official-endpoints-pq.json.sig --migration statements/migration-pq-2026-001.json --migration-sig statements/migration-pq-2026-001.json.sig --migration-acceptance-sig statements/migration-pq-2026-001.json.acceptance.sig --origin https://example.org --out public-rehearsal/verify
```

The statement payload remains version 1.0 when its semantics are unchanged; its
embedded authority and detached signature envelope are v2. Do not relabel v1
payloads, Beacon files or verify indexes merely because their authority changed.

If claims, evidence or a lockfile are included, prepare separate working copies
and collect the successor's required signatures using `claims sign`,
`evidence sign` and `lockfile sign` with `--authority next.json` and `--append`.
Do not attach old-root signatures to a new-root package, or rewrite archived
signed history to make it appear PQ-protected. Page generation rechecks included
artifacts; resolve their authority mismatches before treating the output as ready.
Pass the working-copy paths and their detached signature paths to `page generate`
instead of relying on defaults that may still refer to old-root artifacts.

Inspect the generated JSON, human page, migration authorization and acceptance
references, and Agent output with upgraded tools. Verify each hop of a longer
chain, not just the current root's ability to sign a new statement.

### 6. Create, Sign And Seal The History Checkpoint

Keep checkpoint outputs outside the snapshotted directory to avoid self-reference.
The following commands use fresh files and the same complete hybrid holder:

```sh
organchor history checkpoint create --verify-dir public-rehearsal/verify --out history/checkpoint-001.json
organchor history checkpoint sign --in history/checkpoint-001.json --authority next.json --key keys/alice-ed25519.private.json
organchor history checkpoint sign --in history/checkpoint-001.json --authority next.json --key keys/alice-ml-dsa-65.private.json --append
organchor history checkpoint seal --in history/checkpoint-001.json --sig history/checkpoint-001.json.sig --authority next.json --out history/checkpoint-001.json.seal.json
organchor history checkpoint verify --in history/checkpoint-001.json --sig history/checkpoint-001.json.sig --authority next.json --expected-authority-hash "$NEW_AUTHORITY_HASH" --verify-dir public-rehearsal/verify
```

Sealing refuses an invalid or incomplete checkpoint signature. The outer seal
is an `OrgAnchorHistorySeal` version 1.0 object with this structure:

```text
{
  "type": "OrgAnchorHistorySeal",
  "version": "1.0",
  "checkpoint": { "sha256": "<digest>", "sha512": "<digest>" },
  "signature": { "sha256": "<digest>", "sha512": "<digest>" },
  "authority": { "sha256": "<digest>", "sha512": "<digest>" }
}
```

Each digest pair binds the exact bytes of its separate file, not an embedded
signature object. Preserve those files without reformatting. The local verify
command above deliberately has no time proof: inspect `time_evidence` rather
than interpreting mathematical PASS as externally anchored history.

### 7. Timestamp The Seal And Verify Trusted Time

Submitting a digest to timestamp calendars is an external publication step;
obtain approval before running it. Timestamp the **seal file**, not the unsigned
checkpoint alone, so the anchor proves the commitment to checkpoint signatures
already existed. Keep the receipt ledger outside the frozen snapshot:

```sh
organchor anchor opentimestamps stamp --file history/checkpoint-001.json.seal.json --out history/checkpoint-001.json.seal.json.ots --lockfile history/anchor-receipts.lock.json
organchor anchor opentimestamps upgrade --proof history/checkpoint-001.json.seal.json.ots --lockfile history/anchor-receipts.lock.json
```

Run upgrade after the calendar can return a Bitcoin attestation. A pending
calendar receipt or successful upgrade alone is not trusted-time verification.
Independently acquire `pin.json` containing `height` (a nonnegative integer),
`block_hash` (64 hexadecimal characters), and `header_hex` (the 80-byte header
encoded as 160 hexadecimal characters). Establish the block's canonical-chain
membership and sufficient confirmations through the consumer's trusted process;
do not trust a block pin supplied only by the organization being checked.

Set `CLASSICAL_CUTOFF` to the retirement date supplied by the consumer's external
algorithm policy, and `ANCHOR_BEFORE` to its explicit anchor cutoff, both as UTC
timestamps. There is no guessed or built-in retirement date in this runbook.
The retirement policy and the requested anchor cutoff are different inputs:
`--before` requires a checked anchor strictly earlier than its supplied cutoff.

```sh
organchor history checkpoint verify --in history/checkpoint-001.json --sig history/checkpoint-001.json.sig --authority next.json --expected-authority-hash "$NEW_AUTHORITY_HASH" --verify-dir public-rehearsal/verify --seal history/checkpoint-001.json.seal.json --proof history/checkpoint-001.json.seal.json.ots --trusted-bitcoin-block pin.json --classical-cutoff "$CLASSICAL_CUTOFF" --before "$ANCHOR_BEFORE"
```

Check `signature_valid`, `crypto_assurance`, `time_evidence` and
`historical_policy` separately. A matching header and OTS path anchor the seal
to the supplied block; they do not establish canonical-chain membership by
themselves. Block header time is an approximate chain timestamp, not an exact
wall-clock signing time. The current cutoff policy does not declare ML-DSA
permanently safe or apply an automatic retirement date to it.

## Renew The Evidence

A renewal binds the exact prior checkpoint, detached signature and authority
files. It does not retroactively repair missing pre-compromise time evidence.
Create a fresh checkpoint and preserve the prior seal, proof and pins:

```sh
organchor history checkpoint create --verify-dir public-rehearsal/verify --previous history/checkpoint-001.json --previous-sig history/checkpoint-001.json.sig --previous-authority public-rehearsal/verify/root-authority.json --out history/checkpoint-002.json
organchor history checkpoint sign --in history/checkpoint-002.json --authority next.json --key keys/alice-ed25519.private.json
organchor history checkpoint sign --in history/checkpoint-002.json --authority next.json --key keys/alice-ml-dsa-65.private.json --append
organchor history checkpoint seal --in history/checkpoint-002.json --sig history/checkpoint-002.json.sig --authority next.json --out history/checkpoint-002.json.seal.json
organchor anchor opentimestamps stamp --file history/checkpoint-002.json.seal.json --out history/checkpoint-002.json.seal.json.ots --lockfile history/anchor-receipts.lock.json
organchor anchor opentimestamps upgrade --proof history/checkpoint-002.json.seal.json.ots --lockfile history/anchor-receipts.lock.json
```

For a changed current authority, first complete its authenticated migration and
use the corresponding new snapshot and signing keys; keep the previous-authority
file fixed. For trusted renewal verification, supply all three previous files,
the prior seal/proof/pin, and independently acquired evidence for the new seal:

```sh
organchor history checkpoint verify --in history/checkpoint-002.json --sig history/checkpoint-002.json.sig --authority next.json --expected-authority-hash "$NEW_AUTHORITY_HASH" --verify-dir public-rehearsal/verify --previous history/checkpoint-001.json --previous-sig history/checkpoint-001.json.sig --previous-authority public-rehearsal/verify/root-authority.json --previous-seal history/checkpoint-001.json.seal.json --previous-proof history/checkpoint-001.json.seal.json.ots --previous-trusted-bitcoin-block pin.json --seal history/checkpoint-002.json.seal.json --proof history/checkpoint-002.json.seal.json.ots --trusted-bitcoin-block renewal-pin.json --classical-cutoff "$CLASSICAL_CUTOFF" --before "$ANCHOR_BEFORE"
```

A classical predecessor subject to retirement policy needs its own verified
pre-cutoff proof; hashing its old signature into a later PQ checkpoint is not
enough. Renew before signature, hash or anchor assumptions fail, and retain the
full earlier evidence chain rather than only the latest seal.

Verification rechecks the exact earlier snapshot. Supply `--previous-verify-dir`
with its preserved directory whenever it differs from `--verify-dir`; the current
directory is usable as a fallback only if every earlier committed byte still
matches. Both declared migration indexes must agree. Omitting old migration
references in the new snapshot cannot remove inherited cutoff obligations.

If the previous checkpoint is itself a renewal, supply
`--trusted-previous-checkpoint-hash sha256:<64 hex>` from the verifier's own
successful prior verification cache under the same or stricter policy. The
result exposes the exact `checkpoint_file_hash`, `cache_eligible`,
`verifier_policy` and `previous_lineage` for this purpose. Never take the trusted
cache pin from the publisher being evaluated; a signed digest is not a prior
verification. Without that independently established pin, deeper ancestry fails
closed instead of being silently accepted. Recheck from the earlier checkpoint
and proof chain when the consumer's retirement policy becomes stricter.

## Publication, History And Later Transitions

Publish only after organizational approval and the chosen activation time.
Retain stable old-package locations and distribute the independently approved
new authority pin to consumers. A valid self-contained package cannot prove
that no newer package or successor exists elsewhere; consumers must maintain
their trusted current/predecessor pins to resist rollback.

Local signature or migration PASS is not independent proof of publication time.
Preserve exact public bytes and, under the accepted plan, checkpoints covering
authorities, payloads, detached signatures, migration authorization and acceptance.
SHA-512 checkpoint digests supplement existing SHA-256 hashes; they do not change
v1 hashes. Retain prior checkpoints, signatures and proof chains on renewal.

Strong historical attribution requires a verified pre-cutoff anchor under the
consumer's trusted chain/anchor policy, not a CID, local clock, Git tag,
self-reported lockfile, unchecked block API response or pending calendar receipt.
Independently obtain required block/hash pins and distinguish absent, pending
and actually checked time evidence. Local acceptance results and the remaining
real-release and independent-review boundaries are recorded in the accepted
plan, not established by this runbook.

Migrate and renew evidence before the relevant algorithm or anchor assumptions
fail. An Ed25519 signature created after Ed25519 becomes forgeable cannot
establish a unique legitimate successor by declaring an earlier date.

A later move to `ml-dsa-65`-only policy requires a separately approved authority
and another dual-authority migration. Do not strip Ed25519 signatures from an
existing hybrid package or migrate a PQ-requiring authority back to classical-only
signing. Preserve old records for version-specific historical verification.

## Schema And Verification Boundary

The separate [root authority](../../src/schema/root-authority.v2.schema.json),
[signature](../../src/schema/signature.v2.schema.json), and
[migration](../../src/schema/root-authority-migration.v2.schema.json) schemas
describe v2 structure. Register their `$id` values and the existing v1 authority
schema for offline reference resolution. Existing v1 schema files are unchanged.

Canonical `$id` values identify schemas; OrgAnchor does not fetch them as a
trusted network dependency. The current website carrier can return an HTML
fallback at those identifiers. Obtain actual JSON from the installed package's
`src/schema/` directory or the versioned GitHub release assets, and register the
files explicitly instead of treating an HTTP 200 response as a schema.

Schema validity alone does not prove complete holder sets, distinct public keys,
valid native DER, matching canonical hashes, both signature thresholds,
independently trusted pins or pre-compromise publication time. Run the runtime
validators and cryptographic verification, then apply the consumer's historical
and governance policy. No signature establishes real-world claim truth by itself.
