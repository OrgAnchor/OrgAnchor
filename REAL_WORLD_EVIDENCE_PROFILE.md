# Real-World Evidence Profile

Status: Active alpha profile for product and service evidence.

## Purpose

OrgAnchor identity continuity is useful only when the organization can also expose concrete, inspectable value evidence.

This profile defines the minimum useful package for real organizations with real products or services:

```text
one scoped claim
one product/service identity binding when the claim concerns a concrete product, batch, unit, delivery, or project
one hash-bound evidence item
one concrete recheck method
one limitation statement
optional independent attestation
optional challenge or correction record
```

The goal is low verification cost, not centralized certification.

OrgAnchor still does not decide whether an organization, product, vendor, or service is good. It exposes what is claimed, what supports it, how it can be rechecked, what remains weak, and where an external agent's policy must take over.

## Sufficiency Over Completeness

Real-world evidence profiles must not create a paperwork arms race.

The profile should separate:

```text
Core = fields required for the claim or evidence item to be valid and understandable
Extensions = additional context that may help stricter buyers, agents, or risk scenarios
```

Rules:

```text
missing Core = invalid or unsupported
missing Extension = not provided
partially filled Extension = expose gap, do not invalidate Core
```

The goal is not to make every organization fill every possible field. The goal is to show whether a claim is sufficiently supported for its intended purpose.

See `EVIDENCE_SUFFICIENCY_MODEL.md`.

## Why Photos, Videos, And Marketing Are Not Enough

AI-generated images, videos, screenshots, testimonials, and polished presentations are cheap to create and edit.

They can still be useful context, but they should not be treated as strong evidence unless they are bound to:

- a specific claim;
- a stable artifact hash;
- a source or issuer;
- a retrieval path;
- a method for rechecking what the artifact is supposed to prove;
- limitations explaining what it does not prove.

## Claim Shape

A real-world claim should be narrow enough for another party to inspect.

Weak:

```text
Our product is high quality.
Our service is reliable.
Our factory is advanced.
Our customers are satisfied.
```

Better:

```text
Batch B-2026-05 of product P passed test T under standard S on 2026-05-20.
The public API had monthly uptime >= 99.9% from 2026-04-01 through 2026-04-30.
Service project X was delivered to customer Y on 2026-05-10 and accepted under acceptance record A.
Dataset D version 1.2 contains N records and its published checksum is H.
```

Minimum claim fields:

- `id`
- `claim_text`
- `product_id` or service subject
- credential reference when the claim concerns a concrete model, batch, unit, service delivery, or project
- `claim_scope`
- `claim_category`
- `evidence_refs`
- `limitations`
- review or expiry date when the claim is time-sensitive

## Evidence Shape

Evidence is a concrete artifact or record bound by hash.

Useful evidence examples:

- test report;
- inspection report;
- benchmark output;
- public monitoring export;
- customer acceptance record;
- certification or compliance document;
- release artifact;
- dataset snapshot;
- incident or correction report.

Minimum evidence fields:

- `id`
- `title`
- `issuer_type`
- `media_type`
- `hash`
- `size`
- `locations`
- `relations`
- `limitations`
- `method_refs`

## Method Shape

A method explains how another person or AI agent can recheck the evidence.

`organchor evidence method add` records a method object inside `evidence/evidence-manifest.json` and links it to an evidence item through `method_refs`.

Minimum method fields:

- `id`
- `type: OrgAnchorEvidenceMethod`
- `method_kind`
- `title`
- `target_claim_ids`
- `target_evidence_ids`
- `cost_to_verify`
- `required_tools`
- `steps`
- `expected_results`
- `limitations`

Example:

```bash
organchor evidence method add \
  --id method-001 \
  --evidence-id evidence-001 \
  --steps "Download the public inspection report;Compute SHA-256;Compare with the signed evidence manifest" \
  --expected-results "The downloaded artifact hash equals the declared evidence hash" \
  --required-tools "curl;sha256sum" \
  --cost-to-verify low \
  --limitations "This verifies the published report artifact, not the lab's competence"
```

This command does not run the method. It records the method in a signed, machine-readable form.

Automatic method execution can be added later behind explicit opt-in, because arbitrary commands or network actions can create security risk.

## Support Interpretation

OrgAnchor should expose support level, not final truth.

```text
L0_UNSUPPORTED = claim references missing evidence or has no usable support path
L1_SIGNED_SELF_CLAIM = signed accountability exists, but support is still only self-assertion
L2_HASH_BOUND_EVIDENCE = evidence artifacts are hash-bound and retrievable
L3_REPRODUCIBLE_METHOD = evidence has reproducibility metadata or an explicit recheck method
L4_INDEPENDENT_ATTESTATION = support includes a dedicated independent attestation
TIME_OBSERVED = claim is time-observed and linked to supporting evidence
```

For real-world products and services, `L3_REPRODUCIBLE_METHOD` is the first level where a third-party agent can usually do useful low-cost rechecking without negotiating with the organization.

`L4_INDEPENDENT_ATTESTATION` is stronger, but OrgAnchor still does not decide whether the attester is reliable. That remains external policy.

## Observation Source Ladder

For real-world products and services, support should also expose the source class behind each evidence item or observation:

```text
S1_FIRST_PARTY_MATERIALS = self-published specifications, production notes, internal tests, manuals, or logs
S2_THIRD_PARTY_DOCUMENTS = lab, auditor, certifier, customer, platform, or regulator records, with sample source and relationship disclosed
S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING = market, warehouse, distributor, or customer-site samples not selected by the organization
S4_FIELD_USE_OBSERVATION = real-use records from customers, repairers, distributors, sensors, warranty, returns, support, or telemetry
S5_PUBLIC_CHALLENGE_AND_NEGATIVE_EVIDENCE = counterexamples, failed samples, complaints, failed retests, corrections, withdrawals, or unresolved disputes
```

The main anti-gaming value is in S3, S4, and S5.

S1 and S2 can be useful, but they are easy to curate. S3 addresses hand-picked sample risk. S4 captures normal operational reality. S5 prevents the evidence layer from becoming a positive-only showcase.

When a concrete product, batch, unit, service delivery, or project is involved, S3-S5 observations should bind to product/service credentials as described in `PRODUCT_SERVICE_CREDENTIAL_LAYER.md`.

## Entity Organization Templates

### Physical Product

Minimum package:

- product model or batch claim;
- product model passport, batch commitment, or unit credential when available;
- inspection or test report evidence;
- method describing how to verify report hash, batch identifier, standard, and pass/fail field;
- limitation stating whether this proves only one batch, one sample, or one standard.

### Service Delivery

Minimum package:

- narrow delivery claim;
- service delivery credential or customer/project reference hash when available;
- acceptance record, invoice record, or customer confirmation artifact;
- method describing how to verify dates, scope, and acceptance status;
- limitation covering confidentiality and whether the record proves quality or only delivery.

### SaaS / API

Minimum package:

- uptime, latency, incident-response, or release claim over a defined window;
- monitoring export or public status artifact;
- method describing how to recompute the metric;
- limitation covering monitoring regions, excluded incidents, and measurement bias.

### Certification / Compliance

Minimum package:

- certificate or compliance claim;
- certificate artifact or registry snapshot;
- method describing how to verify issuer, serial number, validity window, and scope;
- limitation stating what the certificate does not cover.

### Dataset / Research Output

Minimum package:

- dataset version, size, or result claim;
- dataset snapshot, metadata, or benchmark artifact;
- method describing how to recompute checksum, count, or result;
- limitation covering sampling, bias, collection window, and excluded data.

## Anti-Gaming Rules

OrgAnchor should make weak packages visible, not impossible.

Rules:

- first-party-only evidence remains visible as first-party-only;
- missing method keeps the support weaker or creates a risk gap;
- missing limitations create a risk gap;
- missing public retrieval creates a risk gap;
- stale evidence creates a warning;
- challenged, corrected, or withdrawn claims stay visible in history;
- positive and negative observations should bind to product or service credentials before being treated as attributable feedback;
- OrgAnchor never upgrades a claim to final trust by itself.

The practical effect is that honest small organizations can start with one narrow claim and one hash-bound evidence artifact, while deceptive organizations cannot cheaply turn marketing material into high-support evidence.

## Current Alpha Implementation

Implemented:

- `organchor evidence method add`
- `evidence.methods[]`
- evidence item `method_refs`
- method reference validation
- value audit recognition of explicit recheck methods
- claim support level upgrade to `L3_REPRODUCIBLE_METHOD` when a linked evidence item has a valid method
- compact agent output with support-level counts, risk-gap count, top risk gaps, and next actions
- category-specific profile validators for `physical_product`, `service_delivery`, `saas_api`, `certification_compliance`, and `dataset_research`
- compact agent output with profile-declared, profile-pass, and profile-gap counts

Not yet implemented:

- signed third-party attestation manifests;
- challenge/correction manifests;
- delegated product/service key statements;
- product model passports, batch commitments, unit credentials, and service delivery credentials;
- observation binding checks that attach feedback to concrete product or service credentials;
- automatic method execution;
- deeper industry-specific validators beyond the five generic profile categories;
- UI workflow for non-technical operators.

## Acceptance Rule

This profile is successful only if it lowers the cost for an external AI agent to answer:

```text
What exactly is claimed?
What artifact supports it?
Can I fetch and hash-check the artifact?
How do I recheck what the artifact is supposed to prove?
Who produced the artifact?
Is there independent support?
Is the observed product or service actually linked to the organization's authority chain?
What remains unproven?
What should I ask for next?
```

It must not become a centralized product-quality badge.
