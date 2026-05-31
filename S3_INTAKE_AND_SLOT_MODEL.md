# S3 Intake And Slot Model

Status: Accepted design model. Implementation remains partial: value audit currently checks bounded sample pools, credential binding, duplicate control, and sampling plans, but dedicated intake queues, sample-slot issuance, slot verification, and raw-vault admission workflows are future work.

## Purpose

S3 must not become an unlimited upload or review system.

The S3 intake model separates:

```text
the ability to report a possible sample;
the ability to enter an indexed candidate record;
the ability to become effective S3;
the ability to consume raw evidence storage.
```

This keeps S3 open enough to expose useful signals, but closed enough to prevent spam, paid review inflation, duplicated material, and storage exhaustion.

## Core Rule

```text
Open reporting is cheap.
Effective S3 is slot-gated.
Raw storage is admission-gated.
```

Anyone may report a small candidate signal, but only samples accepted by a declared sampling plan and bound to a valid sample slot may become effective S3.

## S3 Meaning

S3 means:

```text
for a specific listed product or service claim;
under a declared sampling plan;
within a declared time window;
up to a declared active sample limit;
the active sample pool contains externally selected samples;
each sample is bound to the organization's product/service credential chain;
duplicates are controlled;
raw evidence availability and limits are visible.
```

S3 does not mean:

```text
the product is always good;
the organization is trustworthy;
all batches, regions, customers, or future production are covered;
large numbers of observations are better;
ordinary user reviews become proof;
OrgAnchor assigns the final trust decision.
```

## Submission Layers

S3 has four submission layers.

| Layer | Name | Who may submit | Storage | Agent meaning |
| --- | --- | --- | --- | --- |
| L0 | Candidate signal | Anyone | Small JSON only | A possible sample or issue was reported. Not effective S3. |
| L1 | Indexed candidate | Reporter, buyer, directory, sampler, organization | Evidence index entry | Basic fields exist, but one or more S3 gates are missing. |
| L2 | Effective S3 event | A sampling plan participant with a valid slot | Public receipt plus raw-vault pointer | A slot-accepted sample event can count in the active S3 pool. |
| L3 | Reviewed S3 sample set | Directory, buyer agent, sampler, auditor, or accepted review party | Sample-set summary plus vault attestations | A bounded active pool has been reviewed for a declared purpose. |

OrgAnchor should expose the layer, not hide it.

## Who Submits

Effective S3 should come from one of these routes:

| Route | Meaning |
| --- | --- |
| Buyer or buyer-agent sampling plan | A demand-side party obtains samples for a decision. |
| Directory sampling plan | A directory samples organizations it lists, screens, or recommends. |
| Independent sampler or auditor | A declared sampler obtains samples under a plan. |
| Organization-funded blind plan | The organization funds sampling but cannot choose, exclude, or replace samples. |
| Customer-site sample acquisition | A customer or controller permits a concrete sample acquisition, not broad usage review. |

The evaluated organization may:

```text
publish the claim;
publish product/service credentials;
fund blind sampling;
acknowledge, respond, correct, or dispute;
mirror records or raw bundles.
```

The evaluated organization must not by itself make a sample strong S3 by selecting the sample.

## Sample Slot

`sample_slot_id` is the admission ticket for effective S3.

Reason:

```text
sample_nullifier prevents the same unit or credential from being counted twice;
max_active_samples caps the active pool;
but neither prevents a motivated actor from buying many real units and flooding the pool.
```

The sample slot closes that gap.

A sample slot should be issued by the sampling plan controller, not by the evaluated organization alone.

Recommended slot fields:

```text
sample_slot_id
sample_pool_id
claim_id
claim_version
subject_type
subject_id
issued_by
issued_at
valid_until
eligible_channel
eligible_region
slot_selection_method
slot_status
slot_signature
```

Recommended `slot_status` values:

```text
ISSUED
USED
EXPIRED
REVOKED
DISPUTED
```

Rules:

```text
one slot can produce at most one active S3 event;
a used slot cannot be reused;
a sample event without a valid slot remains candidate S3;
slots must be scoped to one claim version and sample pool;
slots may be replaced or expired according to the sampling plan;
slot issuance history should be auditable by hash or signed log.
```

## Duplicate Control

S3 duplicate control uses two different mechanisms.

| Mechanism | Prevents |
| --- | --- |
| `sample_nullifier` | Reusing the same unit, batch token, or service-delivery credential inside the same claim pool. |
| `sample_slot_id` | Creating unlimited valid samples by acquiring many real units outside the sampling plan. |

Both are required for effective S3.

If only `sample_nullifier` exists, the record can prove non-reuse of a unit, but it does not prove sampling-plan admission.

If only `sample_slot_id` exists, the record can prove slot admission, but it does not prove product/service credential uniqueness.

## Storage Admission

Raw S3 material can be large and expensive.

S3 therefore separates:

```text
candidate signal;
public receipt;
sample-set summary;
raw evidence bundle;
hash or timestamp anchor.
```

Raw evidence should enter a vault only when one of these is true:

```text
the sample was accepted by a valid slot;
the material is needed for a reviewed sample set;
the material is negative, disputed, safety-relevant, or public-interest significant;
the vault operator independently chooses to preserve it.
```

Otherwise, the system may keep only:

```text
small metadata;
hashes;
rejection or downgrade reason;
optional low-cost preview;
link to submitter-controlled storage if available.
```

## Storage Roles

S3 raw evidence storage should use the roles from `EVIDENCE_RETENTION_REALITY_PRINCIPLE.md`.

| Storage role | S3 meaning |
| --- | --- |
| `ORGANIZATION_CONTROLLED` | Useful mirror or self-published receipt. Weak as the only store for externally controlled S3. |
| `DIRECTORY_VAULT` | Practical default for directory-screened or recommendation-relevant S3. |
| `PUBLIC_INTEREST_ARCHIVE` | Suitable for safety, fraud, major dispute, public-interest, or negative evidence preservation. |

Other actors may submit, sign, review, or fund, but the storage role should remain one of these limited categories unless the protocol is intentionally extended.

## Required Fields

Effective S3 should require:

```text
organization_id or root authority reference
product_id or service_id
claim_id
claim_version
sample_pool_id
sample_slot_id
sample_policy.max_active_samples
sample_policy.replacement_policy
sample_policy.uniqueness_basis
sampling_plan
sample_identity
credential_binding
sample_nullifier
acquisition timestamp
sample source
selected_by
organization_provided_sample
organization_can_choose_samples
raw_evidence bundle hash or receipt hash
vault pointer or availability state
limitations
not_a_trust_decision
```

If any of the following are missing, the record should be candidate S3 at most:

```text
claim binding;
sample pool;
sample slot;
finite sample policy;
credential binding;
sample nullifier;
sampling plan;
external selection;
raw evidence hash or availability state.
```

## Optional Extensions

Optional S3 extensions include:

```text
purchase invoice hash;
shipping or custody chain;
photos or videos;
test report;
lab result;
device logs;
third-party review signature;
vault custody attestation;
OpenTimestamps or other timestamp anchor;
public challenge window;
dispute, correction, or withdrawal record.
```

These can strengthen S3, but they do not replace the required intake gates.

## Brush And Spam Risks

Known attack patterns:

| Attack | Risk | Mitigation |
| --- | --- | --- |
| Duplicate unit submissions | One sample looks like many. | `sample_nullifier` scoped to claim and pool. |
| Mass real-unit submissions | Many real purchases flood S3. | `sample_slot_id` and `max_active_samples`. |
| Hand-picked good samples | Organization selects favorable units. | External sampling plan and `organization_can_choose_samples=false`. |
| Storage exhaustion | Large raw files consume public or nonprofit vaults. | Small signal first; raw-vault admission gate. |
| Review inflation | Many low-value observations resemble proof. | S3 is not a review system; only slot-accepted samples count. |
| Subject mismatch | Evidence covers a different model, batch, or claim. | Subject binding and claim binding checks. |
| Privacy leakage | Unit/customer identifiers become public. | Nullifiers, hashes, redaction, selective disclosure. |
| Old-good-history abuse | Old samples are used as current proof. | Rolling active pool and historical downgrade. |

## Current Tooling Boundary

Current alpha tooling checks:

```text
claim binding;
sample pool id;
finite sample policy;
credential binding;
sample nullifier;
sampling plan;
organization-selected or organization-provided samples;
candidate versus effective S3 state;
agent-facing S3 summary gaps.
```

Current alpha tooling does not yet implement:

```text
sample slot issuance;
sample slot verification;
slot-use ledger;
raw-vault admission workflow;
near-duplicate media detection;
sampling-plan controller signatures;
S3 sample-set review workflow.
```

Until those exist, any S3 without slot evidence should be treated as weaker than fully slot-gated S3, even if other S3 fields are present.

## Agent Interpretation

Agents should ask:

```text
Is this S3 record only a candidate signal?
Does it bind to a specific claim, version, and subject?
Does it have a finite active sample pool?
Does it have a valid sample slot?
Does it have duplicate control through sample_nullifier?
Was sample selection controlled outside the evaluated organization?
Who stores the raw evidence, and under what availability status?
Is the active sample pool current enough for this decision?
What remains unproven?
```

The final decision remains external policy.

