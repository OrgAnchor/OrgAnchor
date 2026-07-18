# Subject Binding Model

Status: Accepted design model. Partially implemented through claim scopes, S1 evidence subjects, S2 covered subjects, S3 sample identity, and value-audit subject coverage checks. Full schema and validator coverage remain future work.

## Purpose

OrgAnchor has two different questions:

```text
Discovery: can an AI agent find a plausible supplier, product family, service family, or offering?
Evidence: does a signed claim or evidence item actually support the exact object being evaluated?
```

These questions must not be merged.

Discovery Units help an organization become findable. Subject binding prevents broad discovery from being misread as proof for a specific product, model, batch, unit, service, deployment, or project.

## Core Rule

```text
Discovery match is not evidence coverage.
Evidence coverage requires explicit subject binding.
```

In practical terms:

```text
A Discovery Unit can make a supplier discoverable.
A claim says what the organization asserts.
An evidence item says what object it supports.
An external agent decides whether the bound evidence is enough for its purpose.
```

No record may silently widen itself.

## Subject

A subject is the object a claim, evidence item, observation, sample, certificate, or service record is about.

Recommended subject types:

```text
organization
brand
capability
discovery_unit
product_line
product_family
product
product_model
variant
batch
lot
unit
service_line
service
service_plan
service_delivery
project
deployment
dataset
api
region
time_window
```

Minimum subject shape:

```json
{
  "subject_type": "product_model",
  "subject_id": "NK12/16",
  "scope_text": "Applies only to NK12/16 needle roller bearings sold in the EU in 2026."
}
```

For claim manifests, the subject may be represented through `subject`, `product_id`, `service_id`, or `claim_scope`. For evidence manifests, source-class fields may use class-specific names such as `covered_subject_type`, `covered_subject_id`, or `sample_identity`.

The implementation should converge on a common logical interpretation even if field names differ in early alpha files.

## Granularity Rule

OrgAnchor does not require a universal product granularity.

Instead, it requires granularity honesty:

```text
organization-level evidence supports only organization-level claims;
family-level evidence supports only family-level claims unless its scope explicitly covers included models;
model-level evidence supports only that model unless its scope explicitly covers variants;
batch-level evidence supports only that batch unless its scope explicitly covers other batches;
unit-level evidence supports only that unit;
service-line evidence supports only that service line;
service-delivery evidence supports only that delivery or project.
```

External agents may decide to accept broader evidence for lower-risk purposes, but OrgAnchor must expose the breadth rather than hiding it.

## Narrow-To-Broad And Broad-To-Narrow

The two common errors are:

```text
narrow evidence -> broad claim
broad evidence -> exact object claim
```

Examples:

| Evidence | Claim | Default interpretation |
| --- | --- | --- |
| One model test | Whole product family is compliant | Not supported without explicit scope |
| One batch inspection | All future batches are compliant | Not supported |
| Organization certificate | Exact model performance claim | Not supported unless certificate scope covers that model and claim type |
| Family-level catalog | Exact variant availability | Discovery lead only |
| One customer project | All service deliveries perform similarly | Not supported |

## Discovery Unit Boundary

Discovery Units are discovery subjects, not proof subjects.

They may say:

```text
this organization should be considered for this product or service family;
these featured sellable units are current focus offers;
this coverage profile suggests possible fit.
```

They do not say:

```text
all listed models are proven;
all variants are available;
all claims are evidence-backed;
the buyer's exact object is covered.
```

Therefore every Discovery Unit or Featured Sellable Unit should expose disclosure maturity:

```text
M1_DISCOVERABLE = findable only
M2_CLAIM_BACKED = explicit claims exist
M3_EVIDENCE_BACKED = claims are linked to evidence
```

M1 must never be presented as M3.

## Source-Class Binding

### S1 First-Party Materials

S1 is organization-submitted material.

Subject binding rule:

```text
S1 without a subject is general organization material.
S1 with a product/service subject can support only the declared subject and scope.
```

Examples:

```text
company overview -> organization subject
product datasheet -> product_model or product_family subject
manual -> product_model or variant subject
internal test summary -> model, batch, service plan, deployment, or dataset subject
```

### S2 Third-Party Materials

S2 is organization-submitted third-party material with an external recheck anchor.

Subject binding rule:

```text
S2 must declare covered subject when it is used for a concrete product/service claim.
```

In current alpha fields:

```text
s2.organization_claimed_support.covered_subject_type
s2.organization_claimed_support.covered_subject_id
s2.organization_claimed_support.scope_text
```

If S2 lacks a covered subject, it may remain effective as generic S2 for broad screening, but it should not be treated as exact support for a model, batch, unit, service delivery, or project.

### S3 Random Purchase / Sampling

S3 is a sample acquisition record.

Subject binding rule:

```text
S3 must identify the sampled subject.
```

In current alpha fields:

```text
s3.sample_identity.subject_type
s3.sample_identity.subject_id
s3.sample_identity.batch_id
s3.sample_identity.serial_or_unit_id
```

S3 without sample identity is only candidate sampling and must not be treated as effective S3.

### S4 Field-Use Observation

S4 should bind observations to:

```text
product model
batch
unit
service delivery
project
deployment
customer segment
time window
```

S4 templates, attach commands, routing helpers, and audit gaps are partially
implemented. Observer networks, privacy handling, storage incentives, and full
subject-coverage validation remain incomplete; the subject binding rule applies
to every S4 record from the start.

### S5 Public Challenge / Negative Evidence

S5 should bind challenges, complaints, failed samples, contradictions, corrections, withdrawals, and supersessions to exact subjects wherever possible.

If a challenge is broad, it must declare that breadth.

## Agent Output

Agent-facing outputs should eventually distinguish:

```text
discovery_match_subject
claim_subject
evidence_subject
subject_coverage_relation
coverage_granularity
coverage_gaps
not_a_trust_decision
```

Recommended coverage relation values:

```text
EXACT_SUBJECT_MATCH
SUBJECT_ID_MISMATCH
EVIDENCE_BROADER_THAN_CLAIM
EVIDENCE_NARROWER_THAN_CLAIM
FAMILY_TO_MODEL_REVIEW_REQUIRED
BATCH_TO_FUTURE_BATCH_UNSUPPORTED
ORGANIZATION_TO_PRODUCT_UNSUPPORTED
SUBJECT_UNKNOWN
```

`SUBJECT_ID_MISMATCH` means the claim and evidence use the same subject type but point to different subject ids, for example `product_model:model-x1` versus `product_model:model-y1`. This is not a trust judgment, but it must be surfaced because the evidence is not mechanically tied to the claimed object.

## Low-Burden Path

Subject binding should not make adoption heavy.

Minimum practical path:

```text
1. Publish one Discovery Unit.
2. Publish one Featured Sellable Unit.
3. Add one claim scoped to that unit.
4. Add one evidence item bound to the same subject.
5. Let the value audit expose remaining gaps.
```

This keeps the start small while preventing vague organization-level material from being used as exact product proof.

## Implementation Direction

Implementation should continue with:

1. A common subject object helper for claims, evidence, S2, S3, and future S4/S5.
2. More complete schema validation for subject objects and recognized subject types.
3. Directory/Beacon Discovery Unit fields that link featured units to claim/evidence subject ids.
4. Compact agent output for subject coverage gaps.
5. Migration guidance for early alpha files that used `claim_scope`, `covered_subject_*`, or `sample_identity` fields before a common subject helper existed.

Current implementation:

```text
value audit extracts claim subjects from claim.subject, claim_scope, product_id, or service_id;
value audit extracts evidence subjects from S3 sample_identity, S2 covered_subject fields, or evidence.subject;
value audit reports subject_coverage for each claim;
evidence add supports optional --subject-type and --subject-id for low-burden S1 subject binding.
```

## Success Criteria

This model succeeds if an external AI agent can answer:

```text
What exact object is being discovered?
What exact object is being claimed about?
What exact object does each evidence item support?
Is the evidence broader, narrower, exact, or unknown relative to the claim?
What drilldown remains before relying on the claim?
```

It fails if:

```text
Discovery Unit match is treated as evidence support;
organization-level material is used to support model-level claims;
one model or batch is used to imply whole-family or future-batch performance;
agents must manually inspect every raw document to discover obvious subject mismatch.
```
