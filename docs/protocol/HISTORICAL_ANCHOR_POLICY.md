# OrgAnchor Historical Anchor Policy

Status: Accepted protocol-governance baseline. The event-classification rules
are current design guidance. Automated historical-event generation, checkpoint
batching, and Merkle-root publication are not yet shipped alpha capabilities.

## Purpose

OrgAnchor needs durable history without turning every operational action into a
permanent public record.

The governing rule is:

```text
Anchor material public facts whose later silent alteration would damage
identity continuity, evidence interpretation, or protocol accountability.
Batch high-frequency material events. Keep ordinary operations local.
Never publicly anchor secrets, private data, or unconfirmed drafts.
```

This policy decides:

- which events deserve a signed public historical record;
- which events should be externally archived or time-anchored immediately;
- which events should be included in a periodic checkpoint;
- which events should remain in Git, local receipts, or private operations
  records;
- what an external anchor proves and does not prove.

It complements:

- [EVIDENCE_MODEL.md](./EVIDENCE_MODEL.md), which defines carrier roles;
- [PROTOCOL_EVOLUTION_POLICY.md](./PROTOCOL_EVOLUTION_POLICY.md), which protects
  legacy verification and signed migration;
- [EVIDENCE_RETENTION_REALITY_PRINCIPLE.md](./EVIDENCE_RETENTION_REALITY_PRINCIPLE.md),
  which separates compact public receipts from heavy raw evidence;
- [AGENT_VERIFICATION_CONTRACT.md](./AGENT_VERIFICATION_CONTRACT.md), which
  defines how agents inspect signed lockfiles and carrier receipts.

## Non-Goals

This policy does not:

- make an event true merely because it was signed or timestamped;
- require all organizational activity to become public;
- require raw evidence, personal data, or large media to be stored on Arweave;
- make Arweave, Bitcoin, IPFS, GitHub, or OrgAnchor the identity root;
- require an organization to publish an empty checkpoint when no material
  event occurred;
- prevent later correction.

Historical anchoring proves that specific bytes existed by a time and have not
been silently replaced. It does not prove that the described real-world event
was complete, honest, lawful, or correctly interpreted.

## Four Publication Outcomes

Every candidate event is classified into exactly one public-history outcome.

### `ANCHOR_NOW`

Create a signed event record and externally archive or time-anchor it without
waiting for a routine checkpoint.

Use this when delayed publication would create a meaningful ambiguity about:

- who controls the organization identity;
- which root authority or delegated authority is valid;
- where the organization currently declares its official presence;
- whether a high-impact public claim or credential has been withdrawn;
- whether a published history has been migrated, revoked, or corrected.

### `INCLUDE_IN_CHECKPOINT`

Create a signed receipt or event hash now, then include it in the next compact
checkpoint.

Use this for material but higher-frequency events such as:

- ordinary signed claim-manifest revisions;
- delegated product or service key issuance;
- completed evidence-set summaries;
- S3 sample-set closure;
- S4 observation-window summaries;
- Directory snapshot roots;
- promoted software release records that do not change identity or protocol
  semantics.

### `RECORD_LOCALLY`

Keep the event in Git history, CI logs, a private operations log, or the local
signed receipt ledger. Do not add it to the external historical chain.

Use this for:

- routine deployments;
- documentation wording and translation changes;
- outreach messages and non-response;
- design iterations;
- ordinary test runs and failed development experiments;
- temporary service incidents that did not affect identity or published
  verification;
- unpromoted prerelease work.

### `DO_NOT_PUBLICLY_ANCHOR`

Do not publish the event or even a reversible or low-entropy hash of its secret
contents.

Use this for:

- private keys, recovery material, credentials, wallet secrets, and tokens;
- personal data or customer-confidential data;
- embargoed vulnerabilities;
- unconfirmed accusations;
- draft claims that have not been approved for public reliance;
- evidence whose publication would violate consent, contract, safety, or law.

A hash is not anonymization. A public hash of predictable private data can
still reveal or confirm the underlying data.

## Decision Order

Classify events in this order:

```text
1. Is the content secret, private, unsafe, unlawful, or unconfirmed?
   -> DO_NOT_PUBLICLY_ANCHOR

2. Is the event public and final, and does it change identity authority,
   continuity, current official presence, urgent revocation, or correction?
   -> ANCHOR_NOW

3. Is the event public, final, and material to claims, evidence, discovery,
   protocol accountability, or product/service authority?
   -> INCLUDE_IN_CHECKPOINT

4. Otherwise:
   -> RECORD_LOCALLY
```

When uncertain, do not publish automatically. Record the classification reason
and require manual review.

## Event Classes

### Root Authority And Organizational Continuity

| Event | Default outcome | Reason |
| --- | --- | --- |
| First public root-authority declaration | `ANCHOR_NOW` | Establishes the identity lineage |
| Root threshold or membership change | `ANCHOR_NOW` | Changes who can authorize the organization |
| Root-key compromise, revocation, or recovery | `ANCHOR_NOW` | Delay creates active impersonation risk |
| Root migration | `ANCHOR_NOW` | Links old and new authority |
| Merger, split, legal succession, or dissolution | `ANCHOR_NOW` | Changes organizational continuity |
| Routine custody drill with no authority change | `RECORD_LOCALLY` | Operational evidence, not a public identity change |

### Official Presence

| Event | Default outcome | Reason |
| --- | --- | --- |
| Primary domain or main official-presence migration | `ANCHOR_NOW` | Prevents ambiguity during transition |
| Recovery after domain, website, or platform compromise | `ANCHOR_NOW` | Re-establishes the current signed route |
| Material removal of an official endpoint | `ANCHOR_NOW` | External users must stop relying on it |
| Addition of a routine mirror or documentation endpoint | `INCLUDE_IN_CHECKPOINT` | Useful but not normally urgent |
| Routine deployment at an unchanged endpoint | `RECORD_LOCALLY` | Does not change identity continuity |

### Product And Service Authority

| Event | Default outcome | Reason |
| --- | --- | --- |
| Delegated product/service key issuance | `INCLUDE_IN_CHECKPOINT` | Establishes scoped authority without changing the root |
| Delegated key compromise or revocation | `ANCHOR_NOW` | Stops future reliance on the compromised key |
| Product/service credential issuance | `INCLUDE_IN_CHECKPOINT` | Material, potentially high-frequency lineage event |
| Product/service credential withdrawal or correction | `ANCHOR_NOW` when reliance risk is active; otherwise `INCLUDE_IN_CHECKPOINT` | External users need a clear supersession path |
| Internal SKU, catalog, or draft naming changes | `RECORD_LOCALLY` | Not a public authority event |

### Claims And Evidence

| Event | Default outcome | Reason |
| --- | --- | --- |
| First promoted signed claims/evidence package | `INCLUDE_IN_CHECKPOINT` | Establishes a public evidence epoch |
| High-impact safety, compliance, or transaction claim withdrawal | `ANCHOR_NOW` | Continued reliance may cause harm |
| Ordinary claim or evidence-manifest revision | `INCLUDE_IN_CHECKPOINT` | Material but usually batchable |
| S2 material verification, expiry, withdrawal, or route failure | `INCLUDE_IN_CHECKPOINT`; use `ANCHOR_NOW` for an urgent correction | Preserves what support existed and when |
| S3 sample-set closure and sufficiency summary | `INCLUDE_IN_CHECKPOINT` | The set conclusion matters more than each raw sample |
| S4 observation-window summary | `INCLUDE_IN_CHECKPOINT` | Preserves longitudinal state without anchoring every observation |
| Confirmed material challenge or correction resolution | `ANCHOR_NOW` when current reliance changes; otherwise `INCLUDE_IN_CHECKPOINT` | Prevents repeated hidden failure |
| Individual photo, video, invoice, sample, log line, or telemetry point | `RECORD_LOCALLY` or retain in an Evidence Vault | Raw volume does not belong in the public anchor layer |

Raw evidence remains hash-bound through a manifest. The signed manifest, compact
receipt, summary, and bundle hash may be anchored; the large or sensitive raw
bundle normally remains in an Evidence Vault, object storage, or another
declared retrieval location.

### Protocol And Software Releases

For the OrgAnchor project itself:

| Event | Default outcome | Reason |
| --- | --- | --- |
| Stable v1 or later major protocol release | `ANCHOR_NOW` | Establishes a public verification contract |
| Schema-line or signature-semantics change | `ANCHOR_NOW` | Changes how public records are interpreted |
| Protocol migration or compatibility-policy change | `ANCHOR_NOW` | Affects historical verification guarantees |
| Promoted alpha/minor release with no incompatible semantics | `INCLUDE_IN_CHECKPOINT` | Useful release history, but not every build needs an immediate anchor |
| Patch release, CI run, or ordinary commit | `RECORD_LOCALLY` | Git, release provenance, and CI already retain the operational record |
| Security correction affecting authenticity or verification | `ANCHOR_NOW` after safe disclosure | External verifiers must know which behavior is unsafe |

For an adopter, a software-tool release does not automatically require a new
organization identity snapshot. The adopter should publish a new snapshot only
when its own signed identity, claims, evidence, migration, or protocol profile
changes.

### Directory And Discovery

| Event | Default outcome | Reason |
| --- | --- | --- |
| Directory policy or trust-boundary change | `ANCHOR_NOW` | Changes how the index should be interpreted |
| Periodic Directory snapshot root | `INCLUDE_IN_CHECKPOINT` | Supports independent comparison without anchoring every record |
| Addition or removal of one candidate | `RECORD_LOCALLY` and include in the next snapshot | A Directory is an index, not the identity root |
| Beacon regeneration with unchanged signed package | `RECORD_LOCALLY` | Discovery refresh does not create a new identity fact |

Every Directory candidate must still be verified at the adopting organization's
origin. Anchoring a Directory snapshot does not certify its entries.

## Checkpoint Policy

A checkpoint is a small signed summary of pending
`INCLUDE_IN_CHECKPOINT` events.

Create a checkpoint when the first of these conditions occurs:

```text
- a promoted public package or release is about to be announced;
- a material transaction-facing evidence epoch is about to be relied upon;
- the operator's configured event-count threshold is reached;
- the operator's configured maximum checkpoint interval is reached;
- an ANCHOR_NOW event requires the current pending history to be closed first.
```

Recommended defaults:

```text
small or low-activity organization:
  checkpoint only when material pending events exist, before a promoted
  package, or within 90 days of the oldest pending event

active organization or Directory:
  checkpoint within 30 days or at the configured event-count threshold

high-risk or regulated context:
  use a shorter interval set by the organization's external policy
```

OrgAnchor must not imply that these defaults satisfy a legal, regulatory, or
industry retention requirement.

A checkpoint should contain:

- checkpoint ID and version;
- organization and root-authority hash;
- time window;
- sorted event IDs and event hashes;
- previous checkpoint hash;
- Merkle root or deterministic aggregate hash;
- included and excluded event counts;
- known gaps;
- detached root-authority signatures.

The checkpoint stores compact event commitments, not every raw artifact.

## Minimum Historical Event Record

A dedicated future event record should be equivalent to:

```json
{
  "schema": "https://organchor.org/schemas/historical-event.v1.json",
  "type": "OrgAnchorHistoricalEvent",
  "version": "1.0",
  "event_id": "oa-event-2026-001",
  "classification": "ANCHOR_NOW",
  "event_type": "ROOT_AUTHORITY_MIGRATION",
  "issued_at": "2026-07-28T00:00:00Z",
  "effective_at": "2026-07-28T00:00:00Z",
  "organization": {
    "name": "Example Organization",
    "root_authority_hash": "sha256:..."
  },
  "summary": "Root authority migrated under the prior threshold.",
  "artifacts": [
    {
      "type": "migration_statement",
      "hash": "sha256:...",
      "media_type": "application/json"
    }
  ],
  "previous_event_hash": "sha256:...",
  "supersedes": [],
  "known_limits": [],
  "privacy_review": {
    "public_release_approved": true,
    "contains_personal_or_secret_data": false
  }
}
```

This shape is an accepted design example, not a currently published JSON
Schema. Existing signed statements, migrations, claim manifests, evidence
manifests, and lockfile snapshots remain the implemented historical artifacts.

## Carrier Use

Use carriers according to their actual properties:

| Carrier | Historical role |
| --- | --- |
| Organization website and `/verify` | Current discovery and human-readable history index |
| IPFS | Content-addressed mirror; availability still requires pinning or another host |
| Arweave | Long-term append-only archive for small, public, final manifests and checkpoints |
| OpenTimestamps / Bitcoin | Public time proof for hashes or checkpoint roots; not content storage |
| Git tags, releases, and package provenance | Software release context and source lineage |
| Object storage or Evidence Vault | Large, private, controlled, or high-volume raw evidence |
| `organchor.lock.json` | Root-signed publication receipt ledger |

For high-value events, the preferred pattern is:

```text
signed event or existing signed artifact
  -> website /verify
  -> IPFS mirror when useful
  -> Arweave archive for the small final record
  -> OpenTimestamps / Bitcoin proof for the record hash
  -> carrier receipts appended to organchor.lock.json
```

No single carrier is mandatory for identity validity. External policy may
require a carrier combination before relying on a historical event.

## Two-Phase Publication And Receipt Recursion

An artifact cannot contain the final immutable receipt for publishing itself
without changing its own bytes and hash.

OrgAnchor therefore uses a two-phase model:

```text
1. Freeze, canonicalize, hash, and sign event artifact M.
2. Publish M and obtain carrier receipts.
3. Append those receipts to organchor.lock.json.
4. Hash and sign lockfile snapshot L.
5. Publish L.
6. Record L's own publication receipt in the next checkpoint or a separate
   receipt envelope.
```

Do not create recursive self-hashes or claim that a package fully contains its
own final publication receipt. The next signed checkpoint closes the prior
receipt history.

## Correction And Supersession

Append-only history must remain correctable.

When a published event is wrong:

1. Do not silently replace or delete the old record.
2. Publish a new signed correction event.
3. Identify the old event through `supersedes`, `corrects`, or an equivalent
   hash-bound reference.
4. Explain what changed and why.
5. Update the current `/verify` index to prefer the correction.
6. Preserve the old event as historical evidence.

An old Arweave object remains an old statement, not the current truth.

## Completeness And Omission Boundary

A valid event chain proves integrity of included events. It does not prove that
the organization disclosed every relevant event.

External agents should distinguish:

```text
history_integrity:
  included records form a valid signed and hash-linked history

history_completeness:
  whether material events may have been omitted remains an external judgment
```

Independent observations, challenges, public registries, Directory health
checks, and evidence-vault receipts may expose omissions. OrgAnchor must not
convert a clean self-published history into a claim of complete behavior.

## OrgAnchor Project Application

For the current OrgAnchor project:

| Project event | Classification |
| --- | --- |
| Four Fireseed follow-up emails and recipient non-response | `RECORD_LOCALLY` in private operations records |
| Logo and profile-image iterations | `RECORD_LOCALLY` |
| Routine website wording or documentation edits | `RECORD_LOCALLY` |
| Published alpha release with provenance and no incompatible protocol change | `INCLUDE_IN_CHECKPOINT` |
| This accepted historical-anchor policy | `INCLUDE_IN_CHECKPOINT` at the next promoted protocol checkpoint |
| First consenting external organization publishes a verifiable adoption package | `ANCHOR_NOW` for that adopter's signed snapshot; include the bounded pilot outcome in the OrgAnchor project checkpoint |
| Stable v1 protocol release | `ANCHOR_NOW` |
| Root-authority, official-presence, or protocol-compatibility migration | `ANCHOR_NOW` |
| Authenticity-affecting security incident and safe public correction | `ANCHOR_NOW` |

The project should not retroactively upload every past development record. The
next promoted checkpoint may commit to selected prior release and decision
hashes while clearly identifying them as retrospective inclusions rather than
proofs that were externally anchored at their original dates.

## Implementation Gate

Before OrgAnchor describes historical-event classification as implemented, it
must add:

- a versioned event or checkpoint schema;
- canonical hashing and detached-signature support;
- deterministic checkpoint aggregation;
- CLI classification and manual-override output;
- privacy and finality confirmation before external publication;
- lockfile receipt integration;
- tests for correction, supersession, event ordering, omitted previous hashes,
  conflicting checkpoints, and receipt recursion;
- Agent output that separates integrity, timeliness, completeness, and truth.

Until then, this document is the accepted selection policy for using existing
signed artifacts and carrier commands. It is not a claim that the future event
manifest and checkpoint workflow already exist.
