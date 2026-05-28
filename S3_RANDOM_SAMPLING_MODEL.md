# S3 Random Purchase And Sampling Model

Status: Accepted implementation-facing design model. S3 basic usability is implemented: template generation, attach command, local Core checks, candidate/effective classification, value-audit summary, and compact agent summary. Custody route adapters and independent-test route adapters remain future work.

## Purpose

S3 covers evidence created from random purchase, random sampling, or field sample acquisition.

Its core anti-gaming question is:

```text
Was the tested or observed sample selected and acquired outside organization control?
```

S3 is not a trust badge. It only means:

```text
the organization or package declares a sample-based evidence item;
the sample is bound to a concrete product, service, model, batch, or unit;
the acquisition route, selector, source, scope, and limitations are visible;
OrgAnchor can expose whether the sample appears organization-selected or organization-provided.
```

## Placement

S3 extends the existing signed evidence manifest:

```text
evidence/evidence-manifest.json
  evidence[]
    s_class
    s3
```

Reason:

```text
The evidence manifest is already signed, published, copied into /verify, archived, and audited.
Adding S3 metadata there keeps random sampling low-burden and agent-readable.
```

## Low-Friction CLI

Generate a fillable S3 snippet:

```bash
organchor evidence s3 template --template market_purchase
```

Attach S3 metadata to an existing evidence item:

```bash
organchor evidence s3 attach \
  --evidence-id evidence-001 \
  --template market_purchase \
  --sampler-type buyer \
  --sampler-name "Example Buyer" \
  --acquired-at 2026-05-28T00:00:00Z \
  --subject-type product_model \
  --subject-id model-x1 \
  --batch-id batch-2026-05 \
  --scope "Random market purchase sample supports claim-001 for model-x1."
```

Supported starter templates:

```text
market_purchase
distributor_sampling
warehouse_sampling
customer_site_sampling
```

## Effective States

Recommended S3 states:

```text
CANDIDATE_UNVERIFIED_SAMPLING
S3_1_SAMPLING_ROUTE_PROVIDED
S3_2_CUSTODY_DOCUMENTED
S3_3_INDEPENDENT_TEST_RECORDED
```

Rules:

```text
CANDIDATE_UNVERIFIED_SAMPLING = not effective S3
S3_1_SAMPLING_ROUTE_PROVIDED = minimum effective S3
S3_2_CUSTODY_DOCUMENTED = custody path is documented and reviewed
S3_3_INDEPENDENT_TEST_RECORDED = independent test record is present and reviewed
```

Current local implementation boundary:

```text
Local value audit can promote material to S3_1 when Core fields are present and the sample does not appear organization-selected or organization-provided.
S3_2 requires custody route review.
S3_3 requires independent-test route review.
Until those workflows exist, declared S3_2 or S3_3 material is reported as requiring manual review and counted as S3_1 at most.
```

## Minimal Shape

Recommended evidence item shape:

```json
{
  "id": "evidence-sample-001",
  "title": "Random market purchase sample report",
  "issuer_type": "third_party",
  "media_type": "text/markdown",
  "hash": "sha256:<artifact-or-record-hash>",
  "size": 12345,
  "locations": [
    {
      "type": "https",
      "uri": "https://example.org/evidence/random-sample-report.md"
    }
  ],
  "relations": [
    {
      "type": "supports_claim",
      "claim_id": "claim-001"
    }
  ],
  "s_class": "S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING",
  "s3": {
    "state": "S3_1_SAMPLING_ROUTE_PROVIDED",
    "sample_type": "market_purchase",
    "sampler": {
      "type": "buyer",
      "name": "Example Buyer"
    },
    "sample_identity": {
      "subject_type": "product_model",
      "subject_id": "model-x1",
      "batch_id": "batch-2026-05"
    },
    "sampling_event": {
      "acquired_at": "2026-05-28T00:00:00Z",
      "acquisition_channel": "retail_market",
      "sample_source": "retail_market",
      "selected_by": "buyer",
      "organization_provided_sample": false,
      "sampling_method": "random_purchase",
      "sample_size": 1
    },
    "custody": {
      "custody_documented": false,
      "custody_notes": "Describe custody handoff, packaging state, and who held the sample before testing."
    },
    "organization_claimed_support": {
      "support_type": "supports_claim",
      "claim_refs": ["claim-001"],
      "scope_text": "Random market purchase sample supports claim-001 for model-x1.",
      "limitations": [
        "One market sample does not prove all batches, regions, or future production."
      ]
    },
    "health": {
      "last_checked_at": "2026-05-28T00:00:00Z",
      "maintenance_status": "FRESH"
    }
  }
}
```

## Core Fields

Core fields are required for effective S3:

```text
s_class = S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING
s3.state
s3.sample_type
s3.sampler.type
s3.sample_identity.subject_type
s3.sample_identity.subject_id
s3.sampling_event.acquired_at
s3.sampling_event.sample_source
s3.sampling_event.selected_by
s3.sampling_event.organization_provided_sample
s3.sampling_event.sample_size
s3.organization_claimed_support.claim_refs
s3.organization_claimed_support.scope_text
s3.organization_claimed_support.limitations
```

The sample is downgraded to candidate if:

```text
the sample source is missing or unknown;
the selector is missing or unknown;
the sample appears organization-selected;
the sample appears organization-provided;
the sample cannot be bound to a concrete subject;
claim references do not resolve.
```

## Agent Summary

`organchor value audit` and `organchor verify url --compact` expose `s3_summary`.

The summary includes:

```text
effective_s3_count
candidate_unverified_sampling_count
s3_state_counts
organization_selected_sample_count
organization_provided_sample_count
missing_sample_identity_count
missing_custody_count
manual_check_s3_count
top_s3_gaps
next_actions
not_a_trust_decision
```

The boundary remains explicit:

```text
OrgAnchor reports sample-route facts and gaps.
The consuming agent decides whether the sample is enough for its own legal, safety, procurement, or transaction policy.
```
