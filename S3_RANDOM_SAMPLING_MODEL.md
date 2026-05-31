# S3 Random Purchase And Sampling Model

Status: Accepted implementation-facing design model. S3 basic usability is implemented: template generation, attach command, local Core checks, candidate/effective classification, value-audit summary, and compact agent summary. Custody route adapters and independent-test route adapters remain future work.

## Purpose

S3 covers evidence created from random purchase, random sampling, or field sample acquisition.

For product or service quality claims, S3 is specifically:

```text
a finite rolling random-sample pool for an active, listed Product Claim or Service Claim.
```

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

## Boundary With S4

S3 and S4 must stay separate.

S3 is about sample acquisition:

```text
A concrete sample was obtained from market, distributor inventory, warehouse inventory, or a customer site.
The record explains who selected it, where it came from, when it was acquired, and whether the organization provided it.
```

S4 is about real-use observation:

```text
Customer usage records, repair history, warranty claims, returns, sensor telemetry, support tickets, field failure rates, and long-term operational feedback.
```

Boundary examples:

| Scenario | Class |
| --- | --- |
| A buyer purchases one unit from open market and sends it for testing | S3 |
| An auditor randomly selects units from distributor inventory | S3 |
| A customer allows one installed unit to be sampled for inspection | S3 |
| A customer reports 18 months of uptime, failures, repairs, and maintenance history | S4 |
| Warranty return statistics across many customers | S4 |
| Sensor telemetry from deployed equipment | S4 |

Therefore `customer_site_sampling` in the CLI means customer-site sample acquisition. It does not mean broad customer-site performance observation.

S3 subject binding follows `SUBJECT_BINDING_MODEL.md`. An effective S3 record must identify the sampled subject through `sample_identity`. Without sample identity, the record is only candidate sampling because external agents cannot know which product, model, batch, unit, service, deployment, or dataset the sample represents.

S3 intake, sample-slot admission, raw-vault admission, and brush/spam risk controls are defined in `S3_INTAKE_AND_SLOT_MODEL.md`.

## Claim-Bound Rolling Sample Pool

S3 must not become an unlimited upload channel.

For organization-listed products or services, effective S3 should be scoped to a concrete claim:

```text
organization_id
product_id or service_id
claim_id
claim_version
sample_pool_id
sample_slot_id
```

The organization may publish many claims, but each S3 sample pool is bounded by a declared `sample_policy`.

Recommended `sample_policy` fields:

```text
purpose_id
risk_level
target_confidence_note
time_window
max_active_samples
replacement_policy
uniqueness_basis
refresh_rule
limitations
```

For effective S3, a sample should also carry a valid `sample_slot_id` from the declared sampling plan. `sample_nullifier` prevents duplicate unit reuse; `sample_slot_id` prevents unlimited real-unit submissions from becoming active S3.

The default replacement policy is:

```text
NEWEST_VALID_SAMPLE_REPLACES_OLDEST_ACTIVE_SAMPLE
```

This means:

```text
once max_active_samples is reached, a new valid sample does not increase the active sample count;
the new valid sample replaces the oldest active sample in that pool;
the replaced sample moves to historical summary/hash status;
historical samples can support trend and accountability, but not current sufficiency.
```

S3 therefore uses "enough current valid samples" rather than "more records is always stronger."

## Product Or Service Credential Gate

Every effective S3 submission should prove that the sampled item belongs to the evaluated organization's authority chain.

The preferred gate is a product or service credential from `PRODUCT_SERVICE_CREDENTIAL_LAYER.md`:

```text
organization root authority
  -> delegated product/service key
    -> model/service passport
      -> batch/unit/service-delivery credential
        -> S3 sample event
```

An S3 event should include a credential reference or proof such as:

```text
product_unit_credential_hash
batch_credential_hash
service_delivery_credential_hash
credential_issuer_delegated_key_id
credential_verified_against_root
```

The organization root key should not sign high-frequency sample events. It should authorize delegated product or service keys. Those delegated keys can later be revoked or rotated without destroying root continuity.

## Duplicate And Abuse Control

A single product unit, batch token, or service-delivery credential must not be used to inflate S3.

Recommended duplicate-control field:

```text
sample_nullifier = sha256(product_or_service_credential_secret_or_token + claim_id + claim_version + sample_pool_id)
```

The nullifier lets a pool detect duplicate submissions without necessarily exposing a serial number, customer identity, or supply-chain token.

Rules:

```text
the same sample_slot_id may produce at most one active S3 event;
the same sample_nullifier may enter the same claim sample pool only once;
duplicate nullifiers are rejected from active S3;
samples without valid slots are candidate S3 at most;
missing or unverifiable credentials downgrade the record to candidate S3 or route it to S4/S5;
samples that do not match the claim subject are rejected from that S3 pool;
samples beyond max_active_samples are not accepted as extra active evidence.
```

Different photos, videos, or reports about the same unit do not create new active S3 samples. They are additional artifacts for the same sample event or later S4/S5 observations, depending on context.

## Sampling Plan Gate

A valid organization credential only proves:

```text
this sample belongs to the organization's product or service lineage.
```

It does not prove:

```text
the sample was randomly selected;
the sample was representative;
the organization did not bias selection;
the result supports the claim for all future production.
```

Therefore each effective S3 sample set should expose a `sampling_plan`:

```text
who selected samples;
who acquired samples;
which channels were eligible;
which time window was eligible;
whether the organization funded sampling;
whether the organization could choose, exclude, or replace samples;
how max_active_samples was chosen;
known biases and exclusions.
```

S3 confidence comes from the combination:

```text
credential binding + duplicate control + finite sample policy + sampling plan + current raw availability.
```

No single component is enough by itself.

## Not A Review System

S3 must not become a star-rating, comment, review, or promotion system.

Traditional review systems degrade when:

```text
reviewer identity is unclear;
sample source is unclear;
purchase or usage is not verifiable;
positive feedback is incentivized;
negative feedback is suppressed;
large counts hide low information density;
ranking becomes paid promotion.
```

S3 records structured sample facts instead:

```text
what subject was sampled;
where the sample came from;
who selected and acquired it;
whether the organization provided it;
what method was used;
what result was observed;
where the raw evidence bundle is or was held;
which hash, signature, and timestamp bind the record.
```

OrgAnchor does not aggregate "good reviews." It exposes verifiable sample observations and their limits.

## Who Submits

Effective S3 should be submitted or co-signed by a party that controlled the sample outside the evaluated organization's control.

Recommended submitter classes:

| Submitter | S3 meaning |
| --- | --- |
| Buyer or buyer agent | A demand-side party acquired a real market sample for its own decision. |
| Directory operator | A directory maintains sample evidence for organizations it recommends or lists. |
| Independent sampler or auditor | A sampling party acquired samples under a declared route. |
| Distributor, warehouse, or customer-site controller | A sample came from inventory or field deployment outside direct organization selection. |
| Organization | May fund, initiate, cite, respond, or sign acknowledgements, but cannot by itself make the sample strong S3. |

Responsibility rule:

```text
Who benefits from being discovered, recommended, or trusted should carry the matching evidence cost.
```

For organizations:

```text
S1 and S2 can be organization-managed.
S3 should be organization-funded or organization-supported only under blind or externally controlled sample selection.
The organization should publish whether it accepts random sampling, funds blind sampling, responds to negative samples, and permits evidence vault retention.
```

For directories:

```text
A directory that profits from recommendation, ranking, screening, or procurement support should maintain evidence health for the organizations it covers.
It should not merely list claims; it should preserve S3 receipts, sample-set summaries, raw bundle hashes, availability status, and dispute state for its own recommendation set.
```

## Incentive Model

S3 cannot rely on strangers doing free work.

Practical sources of S3 are:

```text
demand-side procurement checks;
directory-funded sampling for better directory quality;
organization-funded blind sampling where the organization cannot choose the sample;
buyer incentives for complete verifiable sample receipts;
challenge rewards for confirmed negative samples or contradictions.
```

Incentives should reward record completeness and verifiability, not positive results.

Bad incentive:

```text
submit a good review and receive a reward
```

Acceptable incentive:

```text
submit a complete sample receipt, raw bundle hash, acquisition proof, and method result; reward is independent of outcome
```

## Storage And Raw Evidence Vaults

S3 raw data is too heavy to place entirely in the organization package, OrgAnchor official infrastructure, Arweave, IPFS, or any single universal store.

S3 storage follows `EVIDENCE_RETENTION_REALITY_PRINCIPLE.md`.

S3 therefore separates:

| Layer | Content | Storage burden |
| --- | --- | --- |
| Public receipt | Sample identity, source, selector, method, result summary, bundle hash, vault pointers | Small |
| Sample-set summary | Aggregated sample count, channels, time window, result distribution, sufficiency note | Small to medium |
| Raw evidence bundle | Invoices, photos, videos, test reports, logs, telemetry export, custody notes | Heavy |
| Anchor | Hashes of receipts, summaries, and bundle manifests | Very small |

Raw evidence should be held by one or more Evidence Vaults when someone has a durable reason to pay for storage and custody.

The realistic default actors are:

```text
directory or recommendation operator;
organization-funded independent vault where the organization cannot select the sample or control the only raw store;
buyer, procurement network, or buyer coalition.
```

Other actors such as laboratories, industry associations, regulated archives, independent samplers, and ordinary customers may participate, but OrgAnchor should not assume they will provide durable raw storage by default.

The organization may mirror raw files or publish its own receipt. That is useful for availability, but it is not the sole strong vault for externally controlled S3 evidence.

S3 public records should state:

```text
bundle_hash
bundle_manifest_hash
vault_operator
vault_independence
raw_availability_status
raw_retention_until
access_policy
last_availability_check
```

Recommended availability states:

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

If raw material was never provided, current alpha tooling represents that condition through missing raw hash/location fields, candidate states, and value-audit warnings. It must not be represented as available.

The organization package may cite S3 receipts and summaries, but it should not be the only place where negative or externally controlled raw evidence survives.

## Event, Sample Set, And Sufficiency

A single S3 event is valuable as a fact, but usually weak as product-wide support.

S3 should distinguish:

```text
S3_EVENT = one sample acquisition or observation event
S3_SAMPLE_SET = a bounded set of S3 events for one subject, window, method, channel, or sampling plan
S3_STRATIFIED_SAMPLE_SET = a sample set intentionally covering strata such as batch, region, channel, or time window
```

For active product or service claims, the sample set should be treated as a bounded active pool:

```text
S3_ACTIVE_SAMPLE_POOL = current valid sample events counted against max_active_samples for one claim and window
S3_HISTORICAL_SAMPLE_SUMMARY = replaced or expired samples kept as summary/hash/history, not current sufficiency
```

S3 does not use a "more is always better" rule.

The correct rule is:

```text
Enough valid samples for the declared purpose, subject, time window, and risk level.
```

Examples:

| Purpose | More useful S3 window |
| --- | --- |
| Consumer product screening | Recent 30-90 day market samples |
| Industrial component purchase | Current batch, lot, or recent production window |
| SaaS/API sample test | Recent version and region-specific check window |
| Safety-critical product | Current batch plus stronger sampling plan and independent method review |

S3 should expose a sufficiency note rather than pretend to calculate universal truth:

```text
sample_count
sample_window
sampling_method
coverage_dimensions
known_biases
confidence_note
not_a_statistical_certification
```

The standalone record shape is defined in `S3_SAMPLE_RECORD_SPEC.md`:

```text
S3_EVENT = one concrete sample acquisition and observation event
S3_SAMPLE_SET = a bounded sample-set summary for a subject, window, purpose, method, and coverage pattern
```

## Historical Retention

Historical S3 should not require raw evidence to be preserved forever.

Recommended retention policy:

```text
current effective window = raw evidence should be available;
ordinary positive history = signed summary, hashes, and who verified while raw evidence was available;
major negative event, safety issue, legal dispute, recall, or unresolved challenge = raw evidence should be retained longer;
expired raw bundles = may become summary-only and must be downgraded for current decisions.
```

Important boundary:

```text
Historical summary and hash do not re-prove the old fact once raw evidence is gone.
They prove that a signed summary existed, was not silently altered, and was vouched for by specified parties at that time.
```

Historical value comes from:

```text
who verified the raw bundle while it was available;
who signed the summary;
whether a vault attested custody;
whether a directory or buyer agent reviewed it;
whether it was timestamped;
whether it passed a public challenge window;
whether disputes or corrections were recorded.
```

Recommended historical levels:

| Level | Meaning |
| --- | --- |
| H0 | Organization-only historical summary; weak signal. |
| H1 | Vault signed that it held a raw bundle matching the hash. |
| H2 | Directory, buyer, sampler, or auditor signed that it reviewed the raw bundle. |
| H3 | Multi-party signatures plus timestamp anchor and challenge window. |
| H4 | Significant incident or dispute with longer raw retention. |

Historical S3 supports trend and accountability. It must not be treated as current sample sufficiency unless the current window still has valid evidence.

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
  --claim-id claim-001 \
  --claim-version 2026-05 \
  --sample-pool-id s3-pool-claim-001-2026-05 \
  --max-active-samples 24 \
  --credential-hash sha256:<64-hex> \
  --sample-nullifier sha256:<64-hex> \
  --credential-verified-against-root \
  --selector-control buyer \
  --scope "Random market purchase sample supports claim-001 for model-x1."
```

If the bounded-pool and credential fields are missing, current tooling downgrades the record to candidate S3 and exposes the missing gates to agents.

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
s3.claim_binding.claim_id
s3.claim_binding.claim_version
s3.claim_binding.sample_pool_id
s3.sample_slot_id or equivalent slot reference
s3.sample_policy.max_active_samples
s3.sample_policy.replacement_policy
s3.sample_policy.uniqueness_basis
s3.credential_binding.credential_hash
s3.credential_binding.sample_nullifier
s3.sampling_plan
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
the sample is missing bounded-pool, slot, credential, nullifier, or sampling-plan gates.
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
missing_sample_pool_count
missing_duplicate_control_count
missing_credential_binding_count
missing_sampling_plan_count
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
