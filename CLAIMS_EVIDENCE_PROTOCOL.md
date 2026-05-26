# OrgAnchor Claims and Evidence Protocol

Status: Design baseline for strengthening OrgAnchor's value evidence layer. Current alpha implements signed claims, signed evidence manifests, value audit reports, hash checks, explicit evidence method objects, and `/verify` publication. This protocol defines the stricter direction for verifiable claims, reproducible methods, third-party attestations, and challenges.

## Purpose

Identity continuity answers:

```text
Is this organization still linked to the same root authority?
Did this organization sign this public statement?
Can the historical entry points and migrations be traced?
```

That is necessary, but not enough.

An organization also makes product and service claims:

```text
This product has this capability.
This service reaches this availability.
This model, API, material, machine, report, or process has these properties.
This customer outcome, benchmark, certification, or operational record supports the claim.
```

OrgAnchor must make those claims easier to inspect without becoming a centralized rating agency or truth oracle.

The protocol goal is:

```text
Turn organization claims into low-cost, machine-readable, signed, hash-bound, challengeable, and independently attestable evidence graphs.
```

## Core Thesis

Centralized rating systems can be useful because they discover, collect, normalize, interpret, and endorse information.

But when ratings become a scarce platform product, they can introduce:

- high fees;
- ranking capture;
- pay-to-play incentives;
- opaque methodology;
- dependency on a single interpretation layer;
- exclusion of small organizations that cannot afford the gatekeeper.

OrgAnchor's alternative is not "everyone self-certifies and should be believed."

The alternative is:

```text
self-claims are signed and scoped;
evidence is hash-bound and retrievable;
methods are explicit and repeatable where possible;
third parties can attest to narrow facts;
others can challenge or correct claims;
AI agents apply their own policy over open evidence.
```

This keeps the expensive judgment layer optional and plural instead of mandatory and monopolistic.

## Non-Goal

OrgAnchor must not say:

```text
This product is objectively good.
This service is the best choice.
This organization is ethical.
This claim is true because OrgAnchor says PASS.
```

OrgAnchor may say:

```text
This claim was signed by this root authority.
This evidence artifact matches its declared hash.
This claim has no linked evidence.
This claim has only first-party evidence.
This claim has a reproducible method.
This claim has one or more independent attestations.
This claim has open challenges or stale evidence.
This claim requires external policy review.
```

## Protocol Objects

The evidence layer should be modeled as five linked object types.

### 1. Claim

A claim is a scoped assertion by an organization.

Good claims are narrow enough to inspect:

```text
Bad: We are reliable.
Better: Our public API had monthly uptime >= 99.9% for 2026-04-01 through 2026-04-30, measured from three named regions by this monitoring method.
```

Required claim fields:

- stable `id`;
- subject product, service, version, region, or time window;
- claim type;
- machine-readable predicate;
- human-readable text;
- scope;
- limitations;
- referenced evidence IDs;
- status such as active, superseded, withdrawn, or disputed;
- expiry or review date when the claim depends on time-sensitive data.

### 2. Evidence

Evidence is a hash-bound artifact or record that supports, qualifies, contextualizes, contradicts, or reproduces a claim.

Evidence may be:

- first-party documentation;
- test output;
- benchmark data;
- source code and release artifacts;
- public monitoring records;
- customer case records;
- audit reports;
- regulatory filings;
- datasets;
- reproducible scripts;
- third-party reports;
- incident or correction records.

OrgAnchor should also classify evidence and observations by source class:

```text
S1_FIRST_PARTY_MATERIALS = specifications, manuals, internal tests, production descriptions, or self-issued logs
S2_THIRD_PARTY_DOCUMENTS = lab reports, inspections, certifications, audits, customer confirmations, or platform records
S3_RANDOM_PURCHASE_OR_RANDOM_SAMPLING = tests or observations over market-bought, warehouse-sampled, distributor-held, or customer-site samples not selected by the organization
S4_FIELD_USE_OBSERVATION = customer, repair, distributor, sensor, warranty, return, support, or telemetry records from real use
S5_PUBLIC_CHALLENGE_AND_NEGATIVE_EVIDENCE = counterexamples, failed samples, complaints, failed retests, contradictions, corrections, withdrawals, or unresolved disputes
```

This ladder is not a score. It is a provenance and observation model. A consuming agent can prefer stronger or more relevant classes according to its own policy.

For product and service claims, S3, S4, and S5 are especially important because they reduce dependence on supplier-selected proof material.

Required evidence fields:

- stable `id`;
- issuer identity and issuer type;
- media type;
- size where available;
- hash, at minimum SHA-256;
- retrieval locations;
- relation to claim IDs;
- time coverage;
- limitations;
- reproducibility metadata;
- freshness metadata.

### 3. Method

A method explains how a claim or evidence item can be checked.

For low-cost verification, methods should be practical and explicit. In the current alpha, `organchor evidence method add` records methods in `evidence.methods[]` and links evidence items through `method_refs`.

- input data;
- tools and versions;
- commands or procedures;
- sample size;
- measurement window;
- environment;
- expected outputs;
- failure conditions;
- cost class for rechecking.

Not every claim can be fully reproducible. OrgAnchor should still force the gap to be visible.

### 4. Attestation

An attestation is a third-party or external-system statement about a specific claim, evidence item, method, or result.

Attestations should be narrow:

```text
Good: Monitor X observed endpoint Y with method Z and recorded uptime 99.94% during April 2026.
Weak: We endorse this company.
```

Attesters may be:

- customers;
- auditors;
- test labs;
- monitoring systems;
- open-source maintainers;
- CI systems;
- regulators;
- partners;
- domain experts;
- independent directories.

OrgAnchor verifies attestation signatures and linkage. It does not automatically decide that the attester is trustworthy.

### 5. Challenge

A challenge records a dispute, contradiction, correction request, incident, stale evidence warning, or failed reproduction.

Challenges matter because a trustworthy evidence system must not only publish positive proof.

Challenge fields should include:

- target claim or evidence ID;
- challenger identity if public;
- challenge type;
- evidence or method behind the challenge;
- status;
- organization response;
- superseding claim or correction reference when resolved.

## Claim Support Levels

OrgAnchor should use support levels as descriptors, not final ratings.

### L0 UNSUPPORTED

The claim exists but has no linked evidence.

Meaning:

```text
The organization said it, but OrgAnchor found no support path.
```

### L1 SIGNED_SELF_CLAIM

The claim is signed by the organization's root authority but still has no meaningful evidence beyond the claim itself.

Meaning:

```text
Accountability exists, truth is not established.
```

### L2 HASH_BOUND_EVIDENCE

The claim links to one or more evidence artifacts with hashes and retrieval paths.

Meaning:

```text
The artifacts can be checked for integrity and continuity.
The conclusion may still be weak, biased, or incomplete.
```

### L3 REPRODUCIBLE_METHOD

The claim links to a method and data or scripts that a third party or AI agent can rerun at reasonable cost.

Meaning:

```text
The claim is not only documented; it is at least partly testable.
```

### L4 INDEPENDENT_ATTESTATION

The claim has one or more linked attestations from outside the organization or from independently operated systems.

Meaning:

```text
The support is no longer purely self-issued.
Attester quality still requires external policy.
```

### Optional TIME_OBSERVED

For long-running claims, repeated evidence across time can be recorded.

Meaning:

```text
The claim has a history, not only a one-time proof.
```

Time-observed status must not be assigned only from a self-declared old date. It should require dated artifacts, receipts, monitoring records, release history, or third-party records.

## Evidence Strength Axes

Avoid a single universal score in the protocol. Different agents and buyers care about different risks.

Use independent axes:

- `identity_linkage`: can the claim be linked to the organization's root authority?
- `artifact_integrity`: do retrieved artifacts match declared hashes?
- `retrievability`: are evidence locations reachable?
- `specificity`: is the claim narrow or vague?
- `scope_fit`: does evidence actually cover the claim scope?
- `issuer_independence`: first party, customer, auditor, regulator, automated system, or community;
- `method_reproducibility`: none, partial, full, independent;
- `freshness`: current, stale, expired, unknown;
- `challenge_status`: none, open, resolved, contradicted, withdrawn;
- `cost_to_verify`: low, medium, high, unavailable.

AI agents can then apply their own policy:

```text
Procurement agent: require independent attestations.
Developer agent: require reproducible scripts.
Consumer agent: prefer recent customer outcomes.
Safety agent: require regulator or lab evidence.
Directory agent: index but do not rank unsupported claims highly.
```

## Sufficiency Over Completeness

OrgAnchor should evaluate evidence by purpose-fit sufficiency, not by raw field count.

The protocol must distinguish:

```text
required_for_validity
optional_for_context
required_by_external_policy
```

Missing optional context is not a protocol failure. It should be reported as `NOT_PROVIDED` or `MAY_REQUEST_IF_POLICY_REQUIRES`, not as `FAIL`.

Agent-facing outputs should prefer:

```text
fit_for
not_enough_for
missing_optional_context
policy_note
```

They should avoid:

```text
universal completeness score
field-count ranking
trust badge based on paperwork volume
```

If an organization makes a narrow claim, OrgAnchor should not pressure it to prove claims it did not make. If it makes a stronger claim or targets a stricter use case, the evidence requirements rise with that purpose.

## Low-Cost Default Profile

The protocol should not require a small organization to build a compliance department.

The minimum useful profile for a serious claim is:

```text
one narrow claim
one explicit scope
one limitation
one evidence item
one hash
one retrieval URL
one freshness or review date
one machine-readable summary
```

For example:

```json
{
  "id": "claim-api-uptime-2026-04",
  "subject": {
    "service_id": "public-api",
    "time_window": "2026-04-01/2026-04-30"
  },
  "claim_type": "operational_metric",
  "claim_text": "The public API had uptime >= 99.9% during April 2026.",
  "machine_summary": {
    "metric": "uptime",
    "operator": ">=",
    "value": 99.9,
    "unit": "percent",
    "period": "2026-04"
  },
  "scope": "Public HTTPS API, three monitored regions, excluding scheduled maintenance listed in evidence.",
  "limitations": [
    "Does not cover private beta endpoints.",
    "Does not prove latency or correctness."
  ],
  "evidence_refs": ["evidence-api-monitoring-2026-04"],
  "review_after": "2026-05-15T00:00:00Z"
}
```

This keeps adoption cheap while still making empty marketing claims visibly weaker.

## Large Artifact Strategy

Large files should not be copied everywhere by default.

The default strategy:

- store the artifact on practical infrastructure such as the organization's website, object storage, GitHub Releases, or a dataset host;
- record hash, size, media type, and URL in the evidence manifest;
- mirror selected small or high-value artifacts to IPFS;
- archive key signed manifests and final critical evidence snapshots to Arweave;
- timestamp important hashes with OpenTimestamps or a later anchor.

This lets organizations publish evidence without turning storage cost into the main barrier.

## Third-Party Attestation Strategy

Third-party attestations must be cheap enough that many actors can participate.

OrgAnchor should support multiple levels:

### Informal Public Attestation

Example:

```text
A customer signs that they used product version X for task Y during time window Z.
```

Useful for early-stage organizations, but not equivalent to an audit.

### Automated Attestation

Example:

```text
CI system signs build/test result for commit X.
Monitoring service signs availability result for endpoint Y.
Scanner signs vulnerability scan result for package Z.
```

Useful because it is repeatable and low marginal cost.

### Professional Attestation

Example:

```text
Audit firm, lab, regulator, or certified assessor signs a narrow report.
```

Useful for high-risk domains, but should not be the only path to credibility.

### Community Reproduction

Example:

```text
Independent maintainer reruns a benchmark script and signs the result.
```

Useful for software, datasets, and open technical claims.

## Anti-Abuse Rules

The protocol must make shallow imitation harder.

Rules:

- unsupported claims must remain visibly unsupported;
- first-party-only evidence must be marked as first-party-only;
- broad claims without scope must trigger warnings;
- stale or expired evidence must trigger warnings;
- missing limitations must trigger warnings;
- evidence that cannot be retrieved must degrade support level;
- hash mismatch must fail the affected evidence item;
- attestations must identify what exact claim or result they cover;
- OrgAnchor must not aggregate attestation count into a raw popularity score;
- challenges and corrections must be publishable and visible.

This does not prevent deception. It reduces the chance that deception has the same machine-readable shape as strong evidence.

## AI Agent Output Contract

For each claim, an agent-facing result should include:

```json
{
  "claim_id": "claim-api-uptime-2026-04",
  "claim_support_level": "L3_REPRODUCIBLE_METHOD",
  "identity_linkage": "PASS",
  "artifact_integrity": "PASS",
  "retrievability": "PASS",
  "issuer_independence": "FIRST_PARTY_ONLY",
  "method_reproducibility": "PARTIAL",
  "freshness": "CURRENT",
  "challenge_status": "NO_KNOWN_CHALLENGE",
  "risk_gaps": [
    "No independent monitoring attestation linked.",
    "Method covers uptime but not response correctness."
  ],
  "next_best_actions": [
    "Request third-party monitoring attestation.",
    "Run published check script if endpoint access is available."
  ],
  "organchor_trust_decision": "NOT_ASSIGNED_BY_ORGANCHOR",
  "policy_route": "EXTERNAL_POLICY_REVIEW"
}
```

The important rule:

```text
OrgAnchor can report support structure. The consuming agent makes the trust decision.
```

## Relationship To Current Alpha

Already implemented:

- signed product claims manifests;
- signed evidence manifests;
- evidence artifact hashes;
- local artifact hash checks;
- evidence references from claims;
- value audit reports;
- value summaries in `/verify/organchor.json`;
- first-party, external, reproducibility, stale evidence, and unsupported-claim checks;
- AI-agent-readable policy routing.

Not yet fully implemented:

- dedicated method objects;
- signed third-party attestation manifests;
- signed challenge or correction manifests;
- independent issuer directories;
- automated importers for monitoring, CI, audit, benchmark, and customer records;
- richer claim-level support output in compact verification results;
- low-cost templates for common product/service claim categories.

## Adoption Path

The practical adoption sequence should be:

1. Keep identity continuity working first.
2. Add one narrow product or service claim.
3. Link one existing evidence artifact with a hash.
4. Add limitations and review date.
5. Run value audit.
6. Publish the claim and evidence through `/verify`.
7. Add reproducible method only where it is affordable.
8. Add third-party attestations over time.
9. Publish corrections instead of silently rewriting history.

This lets a small organization start cheaply while leaving a path toward stronger proof.

## Future CLI Direction

Future commands should make the protocol low-friction:

```bash
organchor claim add
organchor claim inspect
organchor method add
organchor attestation create
organchor attestation sign
organchor challenge create
organchor value audit --claim-levels
organchor value explain --claim <id>
```

The first target should not be a perfect universal scoring engine. The first target should be:

```text
one claim, one evidence item, one method or attestation, one clear AI-agent explanation.
```

## Design Rule

The protocol succeeds when:

```text
honest organizations can publish useful evidence cheaply;
weak claims are visibly weak;
strong claims can accumulate reproducible and independent support;
AI agents can compare support structure without trusting OrgAnchor as a central authority.
```
