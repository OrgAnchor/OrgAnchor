# S3 Sample Event And Sample Set Specification

Status: Accepted protocol shape. JSON Schema files are included for early implementers. CLI generation and value-audit sample-set checks remain future work.

## Purpose

S3 needs two separate record shapes:

```text
S3_EVENT = one concrete sample acquisition and observation event
S3_SAMPLE_SET = a bounded summary of multiple S3_EVENT records for a purpose, subject, time window, method, and coverage pattern
```

This split prevents two common mistakes:

```text
one sample is overstated as product-wide proof;
many unstructured observations are mistaken for high-quality evidence.
```

S3 records are not reviews. They are sample facts with explicit boundaries.

## Design Goals

The record shape should be:

```text
small enough for public indexing;
specific enough for AI agents to screen;
hash-bound to raw evidence bundles;
clear about sample control and organization influence;
honest about confidence and limits;
usable by organizations, directories, buyers, and independent samplers.
```

The public S3 record should not carry all raw files. It should carry:

```text
what was sampled;
how it was acquired;
who controlled selection;
what was observed;
where raw evidence is or was held;
what the sample can and cannot support.
```

## S3 Event

An S3 Event records one sample acquisition and observation event.

Minimum shape:

```json
{
  "schema": "https://organchor.org/schemas/s3-sample-event.v1.json",
  "type": "OrgAnchorS3SampleEvent",
  "version": "1.0",
  "sample_event_id": "s3-event-2026-001",
  "created_at": "2026-05-30T00:00:00Z",
  "subject": {
    "subject_type": "product_model",
    "subject_id": "model-x1",
    "batch_id": "batch-2026-05"
  },
  "claim_binding": {
    "claim_id": "claim-001",
    "claim_version": "2026-05",
    "sample_pool_id": "s3-pool-claim-001-2026-05"
  },
  "sample_slot_id": "sample-slot-claim-001-2026-05-001",
  "sample_slot": {
    "sample_slot_id": "sample-slot-claim-001-2026-05-001",
    "sample_pool_id": "s3-pool-claim-001-2026-05",
    "slot_status": "ISSUED_OR_RESERVED",
    "slot_verification_status": "NOT_VERIFIED_BY_ALPHA_TOOLING"
  },
  "credential_binding": {
    "credential_type": "OrgAnchorProductUnitCredential",
    "credential_hash": "sha256:9999999999999999999999999999999999999999999999999999999999999999",
    "issuer_delegated_key_id": "product-key-2026",
    "credential_verified_against_root": true,
    "sample_nullifier": "sha256:8888888888888888888888888888888888888888888888888888888888888888"
  },
  "submitter": {
    "submitter_type": "buyer_agent",
    "name": "Example Buyer Agent",
    "origin": "https://buyer.example"
  },
  "acquisition": {
    "sample_type": "market_purchase",
    "acquired_at": "2026-05-20T10:00:00Z",
    "sample_source": "retail_market",
    "selected_by": "buyer_agent",
    "organization_provided_sample": false,
    "sample_size": 1,
    "region": "EU",
    "channel": "retail"
  },
  "method": {
    "method_ref": "method-dimensional-check-001",
    "method_summary": "Public dimensional tolerance check using declared spec sheet."
  },
  "result": {
    "outcome": "PASS",
    "summary": "The sampled unit matched declared dimensional tolerance under the stated method.",
    "observed_at": "2026-05-21T09:00:00Z"
  },
  "raw_evidence": {
    "bundle_hash": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    "bundle_manifest_hash": "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    "vaults": [
      {
        "vault_operator": "Example Directory",
        "vault_origin": "https://directory.example",
        "vault_independence": "directory_operator",
        "raw_availability_status": "AVAILABLE",
        "access_policy": "request_required",
        "raw_retention_until": "2026-12-31T00:00:00Z",
        "last_availability_check": "2026-05-30T00:00:00Z"
      }
    ]
  },
  "limitations": [
    "One sample does not prove all batches, regions, channels, or future production."
  ],
  "not_a_trust_decision": true
}
```

### Required Event Fields

Required:

```text
schema
type
version
sample_event_id
created_at
subject.subject_type
subject.subject_id
claim_binding.claim_id
claim_binding.claim_version
claim_binding.sample_pool_id
sample_slot_id
credential_binding.credential_hash
credential_binding.sample_nullifier
submitter.submitter_type
acquisition.sample_type
acquisition.acquired_at
acquisition.sample_source
acquisition.selected_by
acquisition.organization_provided_sample
acquisition.sample_size
result.outcome
result.summary
raw_evidence.bundle_hash
raw_evidence.vaults
limitations
not_a_trust_decision
```

Fireseed Alpha requires `sample_slot_id` to be present for effective S3, but current alpha tooling does not yet verify slot issuer signatures or slot-use ledgers. Agents should treat `slot_verification_status = NOT_VERIFIED_BY_ALPHA_TOOLING` as an explicit limitation, not as proof that slot issuance is solved.

Important rule:

```text
organization_provided_sample = true does not make the event invalid,
but it weakens S3 and should be visible to agents.
```

Duplicate-control rule:

```text
The same sample_nullifier may enter the same claim_id / claim_version / sample_pool_id only once.
More photos, videos, or reports for the same nullifier are additional artifacts for the same sample event, not extra active S3 samples.
```

## S3 Sample Set

An S3 Sample Set summarizes a bounded group of S3 events.

The sample set is the unit most useful for decision support because one event rarely gives enough confidence.

Minimum shape:

```json
{
  "schema": "https://organchor.org/schemas/s3-sample-set.v1.json",
  "type": "OrgAnchorS3SampleSet",
  "version": "1.0",
  "sample_set_id": "s3-set-2026-001",
  "created_at": "2026-05-30T00:00:00Z",
  "purpose": {
    "purpose_id": "industrial_component_screening",
    "risk_level": "medium",
    "decision_context": "Initial supplier screening for a non-safety-critical industrial component."
  },
  "subject": {
    "subject_type": "product_model",
    "subject_id": "model-x1"
  },
  "claim_binding": {
    "claim_id": "claim-001",
    "claim_version": "2026-05",
    "sample_pool_id": "s3-pool-claim-001-2026-05"
  },
  "sample_policy": {
    "purpose_id": "industrial_component_screening",
    "risk_level": "medium",
    "target_confidence_note": "Directory policy requires at most 24 active valid samples for this screening purpose.",
    "max_active_samples": 24,
    "replacement_policy": "NEWEST_VALID_SAMPLE_REPLACES_OLDEST_ACTIVE_SAMPLE",
    "refresh_rule": "rolling_30_day_window",
    "uniqueness_basis": "sample_nullifier"
  },
  "time_window": {
    "from": "2026-05-01T00:00:00Z",
    "to": "2026-05-30T00:00:00Z"
  },
  "sample_events": [
    {
      "sample_event_id": "s3-event-2026-001",
      "event_hash": "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc"
    }
  ],
  "sample_count": 24,
  "active_sample_count": 24,
  "historical_replaced_sample_count": 3,
  "sampling_method": {
    "method_type": "market_purchase_randomized",
    "selected_by": "buyer_agent",
    "organization_selected_sample": false,
    "organization_funded_sampling": true,
    "funding_independence_note": "Organization funded the blind sampling pool but did not select samples."
  },
  "sampling_plan": {
    "plan_id": "sampling-plan-claim-001-2026-05",
    "eligible_channels": ["retail", "distributor"],
    "eligible_regions": ["EU", "US"],
    "selector_control": "directory_operator",
    "organization_can_choose_samples": false,
    "known_biases": [
      "Does not cover direct enterprise-only shipments outside listed channels."
    ]
  },
  "coverage": {
    "regions": ["EU", "US"],
    "channels": ["retail", "distributor"],
    "batches": ["batch-2026-04", "batch-2026-05"],
    "coverage_note": "Covers recent market availability in two regions; does not cover all global channels."
  },
  "result_summary": {
    "pass_count": 22,
    "fail_count": 2,
    "inconclusive_count": 0,
    "summary": "22 of 24 samples passed the declared dimensional tolerance check."
  },
  "sufficiency": {
    "status": "PURPOSE_SUFFICIENT",
    "threshold_basis": "Directory policy for medium-risk supplier screening.",
    "confidence_note": "Useful for screening; not a statistical certification or safety approval."
  },
  "raw_evidence": {
    "sample_set_manifest_hash": "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
    "event_receipt_manifest_hash": "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    "raw_availability_status": "MIXED",
    "vaults": [
      {
        "vault_operator": "Example Directory",
        "vault_origin": "https://directory.example",
        "vault_independence": "directory_operator",
        "raw_availability_status": "AVAILABLE",
        "access_policy": "request_required",
        "raw_retention_until": "2026-12-31T00:00:00Z",
        "last_availability_check": "2026-05-30T00:00:00Z"
      }
    ]
  },
  "limitations": [
    "Does not prove all future batches.",
    "Does not replace buyer-specific acceptance testing."
  ],
  "not_a_trust_decision": true
}
```

### Required Sample Set Fields

Required:

```text
schema
type
version
sample_set_id
created_at
purpose.purpose_id
subject.subject_type
subject.subject_id
claim_binding.claim_id
claim_binding.claim_version
claim_binding.sample_pool_id
sample_policy.max_active_samples
sample_policy.replacement_policy
sample_policy.uniqueness_basis
time_window.from
time_window.to
sample_events
sample_count
active_sample_count
sampling_method.method_type
sampling_method.selected_by
sampling_method.organization_selected_sample
sampling_plan
coverage
result_summary
sufficiency.status
raw_evidence.sample_set_manifest_hash
limitations
not_a_trust_decision
```

## Sufficiency Status

Recommended values:

```text
INSUFFICIENT
PARTIAL
PURPOSE_SUFFICIENT
OVERDUE_FOR_REFRESH
NOT_ASSESSED
```

Meaning:

| Status | Meaning |
| --- | --- |
| INSUFFICIENT | Not enough valid samples or coverage for the declared purpose. |
| PARTIAL | Some useful signal exists, but gaps remain. |
| PURPOSE_SUFFICIENT | Enough for the stated purpose and risk level, not universal proof. |
| OVERDUE_FOR_REFRESH | Once useful, but the window is stale. |
| NOT_ASSESSED | No sufficiency judgment has been made. |

`PURPOSE_SUFFICIENT` must always be scoped:

```text
sufficient for what purpose;
under whose policy;
for which subject;
over which time window;
with which limitations.
```

## Rolling Active Pool Rules

S3 sample sets for active product or service claims should act as bounded rolling pools.

The sample set must not reward unlimited uploads. It should expose:

```text
claim_binding.claim_id
claim_binding.claim_version
claim_binding.sample_pool_id
sample_policy.max_active_samples
sample_policy.replacement_policy
sample_policy.uniqueness_basis
active_sample_count
historical_replaced_sample_count
```

Recommended replacement policy:

```text
NEWEST_VALID_SAMPLE_REPLACES_OLDEST_ACTIVE_SAMPLE
```

Meaning:

```text
valid samples enter the active pool until active_sample_count reaches max_active_samples;
after that, a newer valid sample replaces the oldest active sample;
replaced samples move to historical summary/hash status;
historical samples are useful for trend and accountability, not current sufficiency;
unlimited extra submissions cannot strengthen the active sample set.
```

Recommended uniqueness basis:

```text
sample_nullifier
```

The sample nullifier should be derived from a product or service credential plus claim and pool context. It prevents duplicate active S3 entries without requiring public serial-number disclosure.

## Raw Evidence Availability

Raw evidence availability follows `EVIDENCE_RETENTION_REALITY_PRINCIPLE.md`.

Recommended raw availability values:

```text
AVAILABLE
REQUEST_REQUIRED
RESTRICTED
MIXED
EXPIRED_SUMMARY_ONLY
WITHDRAWN
LOST
DISPUTED
```

The availability status affects how much an agent should rely on the record:

```text
current window + raw available = stronger;
current window + raw unavailable = weak or manual-review;
historical summary-only = trend/accountability only;
disputed raw evidence = route to S5 challenge/correction flow.
```

## Relationship To Evidence Manifest

S3 Event and Sample Set records may be used in two ways:

```text
embedded as s3 metadata on an evidence item;
published as standalone JSON artifacts referenced by evidence/evidence-manifest.json.
```

For low-burden alpha use, an evidence item can carry simplified S3 metadata directly.

For higher-quality S3, prefer standalone records:

```text
evidence/s3/events/s3-event-2026-001.json
evidence/s3/sample-sets/s3-set-2026-001.json
```

Then the evidence manifest should list their hashes, locations, and relations to claims.

## Agent Interpretation

Agents should read S3 records in this order:

```text
1. Is the subject bound to the exact product, model, batch, unit, service, or dataset?
2. Was the sample selected and acquired outside organization control?
3. Is the raw evidence bundle available through at least one credible vault?
4. Is the sample set current enough for the decision?
5. Is the sample count and coverage sufficient for the declared purpose?
6. Are failures, inconclusive results, limitations, and disputes visible?
7. Is this being used only for sample quality, not S4 supply continuity?
```

Agents should not infer:

```text
product-wide proof from one event;
future-batch proof from an old sample set;
supply continuity from sample quality;
trustworthiness from a directory ranking;
truth from summary-only history without prior verifier signatures.
```

## Implementation Direction

Future implementation should add:

1. `organchor evidence s3 event template`.
2. `organchor evidence s3 sample-set template`.
3. Schema validation for standalone S3 records.
4. Value-audit sample-set checks:
   - exact subject coverage;
   - sample source and selector;
   - organization-selected and organization-provided flags;
   - raw evidence vault availability;
   - current window freshness;
   - sufficiency status;
   - failure and inconclusive counts.
5. Compact agent output that separates:
   - S3 event count;
   - effective sample-set count;
   - current sample sufficiency;
   - stale/history-only sample sets;
   - raw evidence availability.

## Schema Files

Current schema files:

```text
src/schema/s3-sample-event.schema.json
src/schema/s3-sample-set.schema.json
```

Example files:

```text
examples/s3-random-sampling/sample-event.example.json
examples/s3-random-sampling/sample-set.example.json
```
