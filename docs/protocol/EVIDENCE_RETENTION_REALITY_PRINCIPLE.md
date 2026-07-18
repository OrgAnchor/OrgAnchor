# Evidence Retention Reality Principle

Status: Accepted design principle for S3-S5 raw evidence retention.

## Purpose

OrgAnchor cannot guarantee that every organization, buyer, sampler, Directory, or evidence operator will preserve every raw S3-S5 evidence bundle forever.

The protocol should not pretend otherwise.

The correct responsibility is:

```text
make raw evidence availability visible;
make retention responsibility explicit;
make missing or expired raw evidence machine-readable;
downgrade records honestly when raw evidence is unavailable;
never turn an unavailable raw bundle into a fake trust signal.
```

## Core Principle

If nobody has a durable incentive to store a raw S3-S5 bundle, OrgAnchor accepts that reality.

The result is not protocol failure. The result is an evidence-quality downgrade:

```text
the public receipt may still exist;
the hash may still prove what was declared;
the timestamp may still prove when it was declared;
but the raw fact is weaker for current transaction decisions.
```

OrgAnchor must expose this downgrade to agents and humans.

## Storage Separation

S3-S5 records should separate small public facts from heavy raw materials.

| Layer | What it contains | Retention expectation |
| --- | --- | --- |
| Public receipt | IDs, subject binding, observation type, summary, hash, signer, timestamp, availability state | Small, public, easy to mirror |
| Summary | Aggregated sample or observation results, limitations, sufficiency notes | Small to medium, public or semi-public |
| Raw bundle | Invoices, photos, videos, reports, logs, tickets, telemetry, contracts, custody notes | Heavy, privacy-sensitive, vault-managed |
| Anchor | Hashes, signature references, timestamp or ledger event | Very small, public, append-only |

Raw bundles should stay off-chain and out of the default organization package unless they are small and safe to publish.

## Realistic Storage Actors

The protocol should distinguish likely storage incentives from merely possible storage locations.

Primary realistic actors:

| Actor | Why it may store raw bundles |
| --- | --- |
| Directory or recommendation operator | It benefits from better screening quality and should support the evidence health of organizations it lists or recommends. |
| Organization-funded independent vault | The organization wants stronger evidence, but sample selection and vault control must be independent for stronger S3/S4/S5 meaning. |
| Buyer, procurement network, or buyer coalition | It stores evidence to reduce future procurement risk and repeated verification cost. |

Secondary or conditional actors:

| Actor | Boundary |
| --- | --- |
| Laboratory or testing provider | Usually stores reports only under paid service or regulatory retention. |
| Industry association | Works only when members fund a shared evidence or compliance program. |
| Regulated archive | Suitable for high-value, regulated, safety-critical, or legal contexts. |
| Evaluated organization | Useful as an additional mirror or self-published operational record, but not the sole strong vault for externally controlled evidence. |
| Individual customer or ordinary user | Should not be assumed to provide long-term raw storage. Treat as lightweight submission or challenge source unless a vault accepts custody. |

## Responsibility Rules

Use these rules consistently:

```text
Who asserts a claim must publish the minimum receipt, hash, scope, and limitations.
Who benefits from stronger discovery or procurement trust should fund stronger evidence.
Who recommends or ranks organizations should preserve or inspect evidence for its recommendation scope.
Who controls a sample, observation, or challenge should be visible in the record.
Who stores raw evidence must publish availability, access, and retention status.
```

OrgAnchor itself is not the default global raw-evidence warehouse.

## Availability States

S3-S5 public records should expose raw evidence availability.

Current status vocabulary:

| Status | Meaning |
| --- | --- |
| `AVAILABLE` | Raw bundle is available through the declared location or vault under the declared access policy. |
| `REQUEST_REQUIRED` | Raw bundle exists, but access requires request, authorization, payment, NDA, or privacy review. |
| `RESTRICTED` | Raw bundle is retained but cannot generally be disclosed because of privacy, contract, safety, legal, or regulatory constraints. |
| `MIXED` | A sample set or observation set contains multiple raw availability states. |
| `EXPIRED_SUMMARY_ONLY` | Raw retention period ended; only signed summary, hash, metadata, or prior review remains. |
| `WITHDRAWN` | Raw bundle or record was intentionally withdrawn; reasons should be linked if available. |
| `LOST` | Raw bundle is no longer available and cannot currently be recovered. |
| `DISPUTED` | Raw bundle, summary, custody, or interpretation is under challenge. |

Semantic condition:

```text
NOT_PROVIDED = no raw bundle was ever provided.
```

In the current alpha, `NOT_PROVIDED` is represented by missing raw hash/location fields, candidate states, and value-audit warnings rather than a standalone schema enum in every S3/S4 record shape.

## Downgrade Semantics

Raw availability affects trust meaning.

| Condition | Agent interpretation |
| --- | --- |
| Current window + raw available | Stronger input, still not a final trust decision. |
| Current window + request/restricted raw | Potentially useful, but external policy must decide whether access limits are acceptable. |
| Current window + no raw bundle | Weak or candidate-only for high-value decisions. |
| Historical summary + raw expired | Trend/accountability signal only; not current proof. |
| Hash without raw bundle | Proves a declared artifact or summary existed, not that the underlying fact can still be rechecked. |
| Disputed or withdrawn | Route to S5 challenge/correction review before reliance. |
| Lost raw evidence | Downgrade; do not treat as current evidence sufficiency. |

## Ledger-Ready, Not Chain-First

If S3-S5 later become a distributed ledger, the ledger should store only small append-only events:

```text
record id;
organization root or subject credential reference;
subject id;
S3/S4/S5 class;
summary hash;
raw bundle hash;
vault pointer;
availability state;
signer;
timestamp;
challenge, response, correction, withdrawal, or dispute event.
```

The ledger should not store large raw evidence files.

This keeps OrgAnchor future-compatible with distributed ledgers without forcing the project into premature blockchain design.

## Boundary

This principle does not reduce the importance of S3-S5. It prevents false completeness.

OrgAnchor should make the following visible:

```text
there is strong raw evidence;
there is only restricted raw evidence;
there is only a summary;
there is expired history;
there is no raw evidence;
there is a dispute.
```

The consuming agent decides what is sufficient for its own policy.

