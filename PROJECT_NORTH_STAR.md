# OrgAnchor Project North Star

Status: Active alignment gate.

## Purpose

This document keeps OrgAnchor pointed at its core goal while the project grows.

OrgAnchor now touches identity continuity, evidence manifests, AI-agent verification, publishing carriers, migration history, and future discovery. Without a north star, it could drift into a signing utility, a certification badge, a marketplace, or a broad governance platform.

The north star prevents that drift.

## Core Goal

OrgAnchor's core goal is:

```text
Help AI agents representing demand-side or supply-side parties discover, verify, and understand an organization's identity continuity, product or service claims, evidence, gaps, risks, and commercial-fit constraints with the lowest practical friction, so organizations can reduce the cost of establishing trust and starting useful transactions.
```

Short form:

```text
lower the cost of finding, verifying, and understanding organizations
without making OrgAnchor the final trust authority
```

## Core Loop

Every major feature should strengthen this loop:

```text
discover candidate organizations
fetch their OrgAnchor package
verify identity continuity
inspect claims and evidence
surface gaps, risks, and commercial-fit constraints
let the external party or agent decide
```

If a feature does not help this loop, it is probably outside the current product.

## Five Product Pillars

### 1. Verifiable Identity Continuity

Questions answered:

```text
Who is speaking?
Which root authority signed the current statement?
Can current and historical entry points be linked?
Was any statement changed after signing?
```

Current artifacts:

- `root-authority.json`
- `official-endpoints.json`
- `official-endpoints.json.sig`
- `migration-*.json`
- `migration-*.json.sig`

### 2. Verifiable Value Evidence

Questions answered:

```text
What does the organization claim to provide?
What evidence supports, qualifies, or limits the claim?
Can the observed product, batch, unit, service delivery, or project be linked back to the organization's authority chain?
Is the evidence first-party, third-party, reproducible, stale, missing, or manual-check-only?
What was corrected, superseded, or withdrawn?
```

Current artifacts:

- `claims/product-claims.json`
- `evidence/evidence-manifest.json`
- future `credentials/*` and `observations/*` artifacts for product/service attribution
- `reports/value-continuity-report.json`
- `reports/value-continuity-report.md`

### 3. Low-Friction AI Agent Access

Questions answered:

```text
Can an external agent discover the package?
Can it get a compact first-pass result?
Can it distinguish identity verification from final trust?
Can it route the result into its own policy?
```

Current surfaces:

- `/.well-known/organchor.json`
- `/verify/organchor.json`
- `organchor verify url <origin>`
- `organchor verify url <origin> --compact`
- `policy_route`

### 4. Native Discoverability And Open Discovery

Questions answered:

```text
Can each adopter be discovered from its own origin-owned web signals?
How can suitable organizations be found before verification starts?
How can discovery stay open and multi-polar?
How can directories reduce search cost without becoming trust monopolies or prerequisites?
```

Current design records:

- `DISCOVERY_STRATEGY.md`
- `ORGANCHOR_BEACON.md`
- `DIRECTORY_MODEL.md`
- `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`

### 5. Commercial Fit Without Marketplace Capture

Questions answered:

```text
Is this candidate commercially worth contacting for this need?
Is there a public price band, signed price sheet, or signed private quote path?
Are minimum order, lead time, region, currency, validity, and quote-response limits visible?
Can an agent avoid spending verification effort on candidates that are clearly outside budget or procurement constraints?
```

Current design record:

- `COMMERCIAL_FIT_LAYER.md`

Commercial fit is not a price recommendation, procurement decision, or trust score. It is a set of signed or declared routing signals that help external agents decide whether to request a quote, continue verification, or skip a candidate under their own policy.

## Alignment Questions

Before adding or expanding a major feature, answer these questions:

1. Does it reduce discovery cost, verification cost, understanding cost, or commercial-screening cost?
2. Does it make AI-agent consumption easier, smaller, clearer, or more reliable?
3. Does it preserve the adopting organization's root authority as the identity root?
4. Does it keep the final trust decision outside OrgAnchor?
5. Does it expose evidence, gaps, warnings, and limitations instead of hiding them?
6. Does it avoid creating a closed marketplace, paid trust badge, or central gatekeeper?
7. Can the result be exported, mirrored, verified, or reproduced by others?
8. Is the operational burden reasonable for a serious small organization?
9. Does it prefer purpose-fit sufficiency over raw completeness or field-count competition?

If the answer is mostly no, the feature should be rejected, postponed, or treated as an experiment.

## What OrgAnchor Should Optimize For

OrgAnchor should optimize for:

- stable machine-readable verification
- low-cost AI-agent first-pass checks
- clear separation between facts, warnings, and final judgment
- signed claims and evidence
- commercial-fit signals that can be checked without forcing universal public pricing
- transparent gaps and corrections
- repeatable adoption by small and serious organizations
- purpose-fit sufficiency instead of paperwork volume
- explicit separation of purpose profiles, evidence source classes, and challenge/correction lifecycle
- portable public artifacts
- native adopter discoverability through origin-owned Beacon signals
- open discovery that can be mirrored or forked
- resistance to platform lock-in

## What OrgAnchor Should Not Optimize For

OrgAnchor should not optimize for:

- becoming a certification authority
- assigning universal trust scores
- assigning universal price scores
- selling trust badges
- hosting all evidence for everyone
- becoming a marketplace
- becoming a social network
- maximizing paid placement
- locking discovery into one official index
- rewarding organizations for filling the most optional fields
- turning optional context into hidden mandatory paperwork
- replacing legal, scientific, financial, or safety review

Those may look adjacent, but they pull the project away from the core loop.

## Trust Boundary

OrgAnchor may report:

```text
identity verification passed or failed
statement hashes matched or did not match
claims and evidence are present, missing, stale, unsupported, or manual-check-only
public commercial-fit signals are present, missing, stale, expired, or quote-required
carrier receipts exist or do not exist
migration continuity can or cannot be verified
```

OrgAnchor must not report:

```text
this organization is good
this organization is the best supplier
this product works
this price is fair
this evidence is sufficient for every use case
this organization deserves trust
```

The external party or agent owns the final decision.

## Directory Boundary

The Directory direction is valid only if it remains an open discovery accelerator over origin-owned Beacons.

Valid:

```text
Beacon-first origin discovery
static snapshots
exportable records
public inclusion policy
multiple directory nodes
records that point back to origin-owned signed packages
```

Invalid:

```text
Directory as the identity root
Directory as final ranking authority
paid placement disguised as trust
closed records that cannot be exported
exclusive official listing as a requirement for legitimacy
```

## Product Decision Rule

When uncertain, choose the path that:

```text
makes organizations easier to find without asking permission from one index
makes claims and evidence easier to verify
makes limitations harder to hide
makes commercial mismatch cheaper to discover
makes AI agents spend less effort
keeps final trust decentralized
keeps OrgAnchor from becoming the gatekeeper
```

This rule is the project compass.

## Current Priority

The current priority is not to build a large platform.

The current priority is:

```text
finish a reliable v1 verification toolchain
keep OrgAnchor's own self-pilot verifiable
make claims and evidence useful to external agents
define a minimal Beacon-first open discovery path
test the whole path with real or realistic organizations
```

OrgAnchor earns its scope by making this path work end to end.
