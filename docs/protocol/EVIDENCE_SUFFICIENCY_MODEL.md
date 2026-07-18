# Evidence Sufficiency Model

Status: Accepted design principle, not a scoring system.

## Purpose

OrgAnchor must not become a field-count competition.

If the protocol rewards organizations for filling the most fields, serious small organizations will be pushed into unnecessary paperwork and marketing-driven over-disclosure. That would violate the project's low-friction goal.

This model defines the project-wide rule:

```text
Sufficiency over completeness.
```

OrgAnchor should report whether a claim's evidence is sufficient for a stated purpose, not whether the organization has filled the largest possible data package.

The purpose profiles, observation source classes, and challenge/correction lifecycle that make "stated purpose" concrete are defined in `docs/protocol/PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`.

## Core Rule

OrgAnchor does not reward volume.

It exposes:

```text
what the organization claims
what supports the claim
what the support is fit for
what the support is not enough for
which optional context is absent
which gaps matter for the consuming agent's purpose
```

A narrow, honest, low-risk claim with a small evidence package can be valid. A large evidence package with irrelevant artifacts should not be treated as stronger merely because it is larger.

## Required Versus Optional

Every evidence profile should separate fields into:

```text
required_for_validity
optional_for_context
required_by_external_policy
```

Definitions:

```text
required_for_validity = missing this means the record cannot be understood or verified at the protocol level
optional_for_context = useful detail, but absence is not a protocol failure
required_by_external_policy = required only for a specific buyer, agent, regulator, domain, or risk scenario
```

Missing optional context should be reported as `NOT_PROVIDED`, not as `FAIL`.

Only missing required-for-validity fields should make the record invalid.

## Purpose-Fit Output

Agent-facing reports should prefer purpose-fit language over absolute scoring.

Preferred:

```json
{
  "basic_validity": "PASS",
  "support_level": "S1_CORE_VALID",
  "fit_for": [
    "identity-linked self-declaration",
    "low-risk discovery"
  ],
  "not_enough_for": [
    "safety-critical procurement",
    "large-volume purchase"
  ],
  "missing_optional_context": [
    "third_party_report",
    "field_observation"
  ],
  "policy_note": "Optional context is not a protocol failure. Request it only if the use case requires it."
}
```

Avoid:

```text
completeness score
universal trust score
field-count ranking
badge based on filling more optional fields
```

## Adoption Tiers

The product experience should expose a small number of adoption tiers, while the schema remains richer underneath.

Recommended public-facing tiers:

```text
Basic
Stronger
Observed
```

Meaning:

```text
Basic = organization-linked claim with minimum valid self-declaration and hash-bound artifacts where relevant
Stronger = adds third-party documents, clearer scope, recheck methods, and disclosed limitations
Observed = adds credential-bound external observations, random sampling, field-use records, challenges, or corrections
```

These are not universal scores. They are capability descriptions.

An organization should choose a tier based on the purpose it wants to support:

```text
low-risk discovery
ordinary buyer screening
high-value procurement
safety-critical use
regulatory or compliance review
public challenge handling
```

## S1 And S2 Packages

S1 and S2 should both support:

```text
Core package
Extension package
```

Both must also follow the subject binding rule in `docs/protocol/SUBJECT_BINDING_MODEL.md`: a record can support only the subject and scope it actually declares. Broad organization or family material should not be silently upgraded into exact model, batch, unit, service delivery, or project support.

Core package:

```text
minimum fields needed to make the claim or third-party document understandable, signed or attributable, and hash-bound
```

For S2, Core also requires an external recheck anchor. A third-party-looking PDF, scan, screenshot, logo, or organization-hosted copy without such an anchor is not effective S2; it should be exposed as `UNVERIFIED_EXTERNAL_MATERIAL`.

Extension package:

```text
additional context that may reduce uncertainty for stricter use cases
```

Rules:

```text
missing Core = invalid or unsupported
missing Extension = not provided
partially filled Extension = expose gaps, do not invalidate Core
```

This lets a small organization start with one narrow claim while giving more mature organizations room to expose more context without making that context mandatory for everyone.

## Anti-Pressure Rule

OrgAnchor should not pressure organizations into proving more than they claim or more than their intended use case requires.

Examples:

```text
A small manufacturer may publish a signed specification for one model without claiming broad field performance.
A service provider may publish one delivery workflow claim without exposing all customer projects.
A software project may publish release/test evidence without claiming formal security certification.
```

If an organization makes a stronger claim, the evidence requirements rise with that claim. If it does not make that claim, OrgAnchor should not penalize it for not proving it.

## Directory And Discovery Boundary

Directories and discovery tools should not rank organizations by raw field count.

They may expose:

```text
support level
purpose fit
known risk gaps
missing optional context
freshness
credential binding
observation source classes
policy route
```

They should not present:

```text
more fields = better organization
more artifacts = more trustworthy
official score = final trust decision
```

The consuming agent or user owns the final policy decision.

## Implementation Rules

Validators should:

1. Distinguish invalid records from optional omissions.
2. Mark optional omissions as `NOT_PROVIDED` or `MAY_REQUEST_IF_POLICY_REQUIRES`.
3. Avoid turning extension fields into hidden mandatory requirements.
4. Report `fit_for` and `not_enough_for` where possible.
5. Keep templates narrow by default.
6. Ask for target purpose before recommending additional fields.
7. Avoid universal completeness percentages.

Commands and wizards should start from a minimal path:

```text
one narrow claim
one scope
one limitation
one evidence item or credential binding where relevant
one verification path
```

Additional fields should be presented as purpose-specific upgrades, not as signs that the organization is incomplete.

## Acceptance Rule

This model succeeds if:

```text
organizations can show enough for their intended purpose without being pushed into unnecessary disclosure
AI agents can still see when a package is not enough for stricter purposes
directories cannot turn optional detail into a monopoly ranking mechanism
small serious organizations can participate without a paperwork arms race
```

The goal is the lowest practical friction for the intended verification purpose, while preserving room for stronger evidence when the organization actually needs it.
