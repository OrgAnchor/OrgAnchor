# Purpose, Evidence, And Challenge Model

Status: Accepted design model, not yet fully implemented.

## Purpose

This document is the canonical model for combining:

```text
Purpose Profiles
Observation Source Classes
Challenge and Correction Lifecycle
Evidence Sufficiency
Product and Service Credential Binding
```

It exists to prevent concept drift.

OrgAnchor should not treat "more fields" as "more trust." It should expose whether an organization's public package is sufficient for a stated purpose, what kinds of evidence or observations support it, and whether the relevant claims have been challenged, corrected, withdrawn, or superseded.

## Core Rule

Use three independent axes:

```text
P-axis = purpose profile
S-axis = observation source class
C-axis = challenge and correction lifecycle
```

These axes answer different questions:

```text
P-axis: What purpose can this package support?
S-axis: Where did the supporting material or observation come from?
C-axis: Has this claim, evidence, product, service, or observation been challenged or corrected over time?
```

They must not be collapsed into one trust score.

## P-Axis: Purpose Profiles

Purpose profiles describe what kind of decision the package is structurally fit to support.

They do not mean that OrgAnchor trusts, recommends, certifies, ranks, or endorses the organization.

Recommended built-in profiles:

```text
P1_LOW_RISK_DISCOVERY
P2_BASIC_CONTACT_SCREENING
P3_ORDINARY_PROCUREMENT_REVIEW
P4_HIGH_VALUE_PROCUREMENT_REVIEW
P5_SAFETY_CRITICAL_REVIEW
```

### P1 Low-Risk Discovery

Purpose:

```text
Know who the organization is, where its official entry points are, and what it broadly does.
```

Minimum structure:

```text
identity continuity verified
official endpoint statement signed
organization description present
contact or official endpoint present
```

Not enough for:

```text
product trust
service reliability
procurement
technical, legal, safety, or compliance reliance
```

### P2 Basic Contact Screening

Purpose:

```text
Decide whether it is worth starting an initial conversation.
```

Minimum structure:

```text
P1 minimum structure
clear product or service category
at least one scoped claim
S1 Core self-declaration package
limitations present
```

Not enough for:

```text
supplier selection
product performance reliance
independent verification
large transaction decisions
```

### P3 Ordinary Procurement Review

Purpose:

```text
Decide whether the organization should enter an ordinary supplier candidate set.
```

Minimum structure:

```text
P2 minimum structure
claim scoped to product, service, model, version, or time window
evidence hash present
evidence retrieval path present
issuer or source disclosed
limitations present
S2 Core third-party document or method-backed evidence present
```

Not enough for:

```text
final supplier approval
high-value procurement
safety-critical use
assuming the issuer is reliable
assuming sample selection was strong
```

### P4 High-Value Procurement Review

Purpose:

```text
Support review for purchases where transaction value, replacement cost, downtime cost, or supplier failure impact is high.
```

Minimum structure:

```text
P3 minimum structure
product or service credential binding when relevant
delegated key chain when relevant
S2 sample source disclosed
sample selected_by disclosed
commercial relationship disclosed
recheck method present
challenge and correction status visible
```

Strongly recommended but external-policy controlled:

```text
S3 random purchase or random sampling
S4 field-use observation
```

Not enough for:

```text
automatic purchase approval
safety-critical reliance
legal or regulatory substitution
guarantee that future delivery will match past records
```

### P5 Safety-Critical Review

Purpose:

```text
Support review for food, medical, industrial safety, child products, critical infrastructure, or other domains where failure may create serious harm.
```

Minimum structure:

```text
P4 minimum structure
third-party or regulatory evidence where applicable
scope explicitly covers the safety-critical claim
sample source and custody chain disclosed
standard or regulatory reference present
known limitations and exclusions present
S5 public challenge and negative-evidence route visible
```

Not enough for:

```text
replacement for professional testing
replacement for regulator approval
legal clearance
universal safety endorsement
```

## Challenge Review Is Not P6

Public challenge review should not be modeled as a sixth ascending purpose profile.

It is a horizontal review mode that applies across P1-P5.

Reason:

```text
Any long-running organization, product, service, claim, credential, or evidence item can be challenged, corrected, withdrawn, or superseded.
```

Therefore every purpose profile should expose challenge and correction state where relevant.

## S-Axis: Observation Source Classes

Observation source classes describe where evidence, observations, or challenges come from.

They are not a trust score.

Accepted source classes:

```text
S1_FIRST_PARTY_MATERIALS
S2_THIRD_PARTY_DOCUMENTS
S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING
S4_FIELD_USE_OBSERVATION
S5_PUBLIC_CHALLENGE_AND_NEGATIVE_EVIDENCE
```

Summary:

| Source | Meaning | Main value |
| --- | --- | --- |
| S1 | First-party specifications, production notes, internal tests, manuals, logs, or self-declarations | Low-cost accountability |
| S2 | Lab, auditor, certifier, customer, platform, regulator, or other external records | External reference with disclosed scope |
| S3 | Market-bought, warehouse-sampled, distributor-held, or customer-site samples not selected by the organization | Reduces hand-picked sample risk |
| S4 | Customer, repair, distributor, sensor, warranty, return, support, telemetry, or real-use records | Captures operational reality |
| S5 | Counterexamples, failed samples, complaints, failed retests, corrections, withdrawals, contradictions, or unresolved disputes | Prevents positive-only evidence |

S1 and S2 can support lower-friction discovery and screening.

S3, S4, and S5 provide the main anti-gaming value for higher-risk or higher-value purposes.

## C-Axis: Challenge And Correction Lifecycle

Challenge and correction states describe time, dispute, and revision status.

Recommended states:

```text
NO_KNOWN_CHALLENGE
OPEN_CHALLENGE
RESPONDED
CORRECTED
WITHDRAWN
SUPERSEDED
CONTRADICTED
UNDER_REVIEW
```

Meanings:

| State | Meaning |
| --- | --- |
| `NO_KNOWN_CHALLENGE` | No known challenge is visible in the current package or indexed records |
| `OPEN_CHALLENGE` | A challenge exists and has not been resolved |
| `RESPONDED` | The organization has responded, but the record may still be disputed |
| `CORRECTED` | The organization published a correction |
| `WITHDRAWN` | The organization withdrew the prior claim |
| `SUPERSEDED` | A newer signed claim replaced the older claim |
| `CONTRADICTED` | There is visible evidence that conflicts with the claim |
| `UNDER_REVIEW` | The organization or relevant parties are still reviewing the matter |

These states must be visible across all P profiles where relevant.

## Integrated Matrix

Minimum useful structure by purpose:

| Purpose profile | Minimum structure | Challenge lifecycle visibility |
| --- | --- | --- |
| P1 Low-risk discovery | Identity continuity, signed official endpoints, organization description, contact or official endpoint | Show known organization-level warnings if present |
| P2 Basic contact screening | P1 plus scoped claim, S1 Core, limitations | Show known claim-level challenge state if present |
| P3 Ordinary procurement review | P2 plus hash-bound evidence, retrieval path, source disclosure, S2 Core or method-backed evidence | Show challenge/correction status for claims and evidence |
| P4 High-value procurement review | P3 plus product/service credential binding, delegated key chain where relevant, sample source, selected_by, commercial relationship, recheck method | Show challenge/correction/withdrawal/supersession records for product/service lineage |
| P5 Safety-critical review | P4 plus safety-specific third-party or regulatory evidence, standards, custody chain, limitations/exclusions, S5 route visible | Show negative evidence route, open challenges, contradictions, corrections, and withdrawals |

## Evidence Sufficiency Rule

Purpose profiles must follow `EVIDENCE_SUFFICIENCY_MODEL.md`.

This means:

```text
required_for_validity = missing this makes the record invalid or unsupported
optional_for_context = useful but not a protocol failure when absent
required_by_external_policy = required only for a specific buyer, agent, regulator, or risk profile
```

Do not turn P4/P5 optional context into hidden requirements for P1/P2.

Do not penalize an organization for failing to prove claims it did not make.

## Product And Service Credential Rule

When evidence or observation concerns a concrete product, batch, unit, service delivery, project, or customer outcome, the record should bind to the product/service credential chain described in `PRODUCT_SERVICE_CREDENTIAL_LAYER.md`.

This is especially important for:

```text
S3 random purchase or random sampling
S4 field-use observation
S5 public challenge and negative evidence
```

Without credential binding, the record may still be useful, but OrgAnchor should expose a linkage gap.

## Agent Output Direction

Agent-facing outputs should prefer:

```text
purpose_profile
purpose_status
fit_for
not_enough_for
missing_for_purpose
missing_optional_context
source_classes_present
credential_binding_status
challenge_state
organization_response_status
remaining_policy_questions
next_best_actions
not_a_trust_decision
```

Recommended purpose statuses:

```text
MEETS_MINIMUM_STRUCTURE
NEEDS_MORE_CONTEXT
INSUFFICIENT_FOR_PURPOSE
NOT_APPLICABLE
```

Avoid:

```text
trusted
recommended
best supplier
universal score
completeness percentage
official badge
```

## Storage And Submission Boundary

This model does not require OrgAnchor to become a global storage network or central truth database.

Recommended storage roles:

```text
organization official package = organization-owned official claims, evidence, credentials, responses, corrections, and withdrawals
observation or challenge hub = external submissions, standardized records, receipts, and indexes
directory or crawler = discovery and candidate indexing, not final truth
archive or timestamp carrier = small manifest snapshots, hashes, receipts, and historical anchors
```

Recommended submission boundary:

```text
S1 = organization-submitted
S2 = organization, issuer, registry, hub, or crawler-submitted with issuer/source disclosure
S3 = external sampler, buyer, lab, platform, channel, or hub-submitted
S4 = customer, repairer, channel, platform, system, or hub-submitted; organization-controlled sources must be labeled
S5 = externally submitter-open but structurally validated and graded by identity, credential binding, artifact hashes, and response state
```

Open submission does not mean high trust.

Organization control does not mean external records vanish.

## Implementation Direction

Future implementation should add:

1. Purpose-profile validators for P1-P5.
2. Source-class fields and validation for S1-S5.
3. Challenge/correction lifecycle manifests and status extraction.
4. Purpose-fit compact agent output.
5. Value audit integration for P/S/C axes.
6. Directory and Beacon outputs that expose purpose fit without ranking by field count.
7. Templates that ask the target purpose first and generate only the minimum relevant core fields.

## Acceptance Rule

This model succeeds if an external AI agent can answer:

```text
What purpose can this package minimally support?
What source classes support the relevant claims?
Are the relevant claims or credentials challenged, corrected, withdrawn, superseded, or contradicted?
Is a concrete product or service observation bound to the organization authority chain?
What remains a policy question for the consuming party?
What should be requested next, only if the target purpose requires it?
```

It fails if OrgAnchor becomes:

```text
a trust score
a field-count ranking system
a positive-only showcase
a certification authority
a storage monopoly
```
