# Fireseed Readiness Gate

Status: Active Fireseed release gate.

## Purpose

This gate decides whether OrgAnchor is ready to invite first public Fireseed collaborators.

It is not a v1 release gate and not a certification gate.

The question is narrower:

```text
Is the minimum public loop clear, reproducible, bounded, and honest enough for early adopters and reviewers to inspect?
```

## Decision States

Use only these states:

| State | Meaning |
| --- | --- |
| GO | Fireseed outreach can begin. Known gaps are visible and do not contradict the launch boundary. |
| HOLD | Do not invite external adopters yet. A required gate is missing, misleading, or not reproducible. |
| LIMITED_GO | Invite only named reviewers for a narrow track. Do not broadly present Fireseed as ready. |

## Required Gates

### 1. Source And Package Health

Fireseed cannot start unless:

```bash
npm run typecheck
npm test
npm run package:smoke
npm run agent:demo
```

pass from a clean source checkout.

`release:check` should pass before any new npm or GitHub release is promoted.

### 2. Public Self-Pilot

The OrgAnchor reference self-pilot must expose:

- a public `/verify` package;
- a public `/.well-known/organchor.json` Beacon;
- a current signed official endpoint statement;
- a current root authority record;
- machine-readable verification output that an external agent can fetch without private context.

If the public self-pilot is temporarily broken, Fireseed can continue only as `LIMITED_GO` for local technical review.

### 3. Identity Continuity

The package must support:

- root authority creation;
- signed endpoint statements;
- threshold verification;
- root authority migration planning and verification;
- `/verify` migration-history publication;
- direct origin verification with `organchor verify url`.

Failure here is always `HOLD`.

### 4. Discovery

The package must support origin-owned discovery:

- `/.well-known/organchor.json`;
- Beacon generation from verified local artifacts;
- Beacon inspection;
- seed/sitemap/Directory/bounded-crawl sweep;
- local index and query output;
- direct verification after candidate discovery.

Directory tooling is allowed only as an accelerator over origin verification. Any wording that implies official Directory trust privilege is `HOLD`.

### 5. Agent Verification Contract

The compact result must expose enough information for a third-party AI agent to route decisions without trusting OrgAnchor as a judge:

- identity verification status;
- conformance status;
- policy route;
- evidence summary;
- S2 summary;
- S3 summary;
- risk gaps;
- next verification steps.

If compact output hides material gaps, Fireseed is `HOLD`.

### 6. S1-S3 Evidence Baseline

Fireseed accepts S1-S3 as the minimum evidence closure.

S1 must clearly mean organization-submitted first-party material.

S2 must clearly mean organization-submitted third-party material with route, scope, expiry, disclosure, and recheck gaps visible.

S3 must clearly mean random purchase, customer-site, market, or independent sampling records bound to a concrete claim and subject.

S3 baseline requires visible checks for:

- `claim_id`;
- `claim_version`;
- `subject_type`;
- `subject_id`;
- `sample_id`;
- `sample_pool_id`;
- `sample_slot_id`;
- `sample_nullifier`;
- bounded active sample pool;
- sample acquisition source;
- selector or sampling method;
- organization-provided sample disclosure;
- credential or eligibility gate;
- sampling plan;
- raw evidence hash or bundle reference;
- raw evidence availability status;
- storage role;
- limitations.

Missing S3 gates must downgrade the record to candidate S3 or expose clear next actions. They must not silently appear as strong evidence.

### 7. S4/S5 Boundary

S4 and S5 are Design Preview during Fireseed.

S4 can expose templates, attach basics, and audit gaps for real-use or real-delivery observation.

S5 can expose principles and challenge/correction direction.

Fireseed must not claim:

- mature observer networks;
- solved privacy handling;
- solved durable storage incentives;
- solved public challenge governance;
- reliable negative-evidence reputation;
- final product-quality decisions.

Any broad S4/S5 implementation push before Fireseed review is a scope-expansion risk.

### 8. Contributor Entry Points

The repository must expose:

- Fireseed plan;
- readiness gate;
- public review call;
- contributor guide;
- issue templates for adopter trial, technical review, and evidence/governance review;
- known gaps.

If a reviewer cannot tell where to report feedback, Fireseed is `HOLD`.

### 9. No Trust Overclaim

OrgAnchor must continue to say:

```text
OrgAnchor verifies signatures, hashes, continuity, publication structure, and declared evidence relationships.
OrgAnchor does not certify that an organization is good, lawful, ethical, safe, effective, or truthful.
```

Any release, README, package description, website copy, or issue template that turns OrgAnchor compatibility into a trust badge must be corrected before outreach.

## Launch Decision Record

Before inviting first public Fireseed participants, record a short decision note with:

- date;
- commit hash;
- package version;
- public self-pilot URL;
- verification command results;
- readiness state;
- known gaps accepted for Fireseed;
- tracks being invited first.

The decision note can live in a GitHub issue, release note, or repository document. It must not include secrets, private keys, private customer evidence, wallets, provider tokens, or unpublished organization data.

## Default Decision

If all required gates pass:

```text
GO for Fireseed outreach to named early adopters, technical reviewers, and evidence/governance critics.
```

If any required gate fails:

```text
HOLD until the failure is fixed or clearly moved outside the Fireseed acceptance boundary.
```

