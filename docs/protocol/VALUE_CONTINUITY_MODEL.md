# OrgAnchor Value Continuity Model

Status: Active model for claims, evidence, outcomes, corrections, and value audits.

## Purpose

Identity continuity proves that an organization can still be linked to its root authority and historical statements.

That is necessary, but not sufficient.

OrgAnchor also needs a value continuity layer: a way for organizations to make their long-term claims, evidence, outcomes, limitations, and corrections inspectable without turning OrgAnchor into a centralized judge.

The goal is:

```text
Make real long-term value easier to prove.
Make empty packaging harder to pass off as proof.
Keep honest organizations' operational burden low.
```

## Core Position

OrgAnchor should not declare:

```text
This is a good organization.
This product works.
This evidence is sufficient.
```

OrgAnchor should help people and AI agents see:

```text
This claim is only self-asserted.
This claim links to evidence.
This evidence is first-party or third-party.
This evidence is reproducible or not.
This evidence is fresh or stale.
This claim has limits.
This claim was corrected, superseded, or withdrawn.
```

This makes high-quality organizations easier to inspect while making shallow imitation more visible.

See `docs/protocol/CLAIMS_EVIDENCE_PROTOCOL.md` for the stricter protocol baseline. In that protocol, OrgAnchor reports claim support structure and risk gaps; the consuming AI agent, buyer, partner, or auditor applies its own policy.

## The Five Chains

### 1. Identity Chain

Answers:

```text
Who may speak for the organization?
Can this current entry point be linked to earlier roots and statements?
```

Artifacts:

- `root-authority.json`
- `official-endpoints.json`
- `official-endpoints.json.sig`
- `migration-*.json`
- `migration-*.json.sig`

### 2. Claim Chain

Answers:

```text
What does the organization claim to provide?
What is the scope of the claim?
What limits are acknowledged?
Which evidence is referenced?
```

Artifact:

- `claims/product-claims.json`

### 3. Evidence Chain

Answers:

```text
What artifacts support, contextualize, qualify, or challenge the claim?
Who issued them?
Can they be retrieved?
Can they be reproduced?
Are they current?
```

Artifact:

- `evidence/evidence-manifest.json`

### 4. Outcome Chain

Answers:

```text
What actually happened over time?
What was shipped, maintained, measured, cited, audited, used, or corrected?
```

Outcome records may initially live inside claims and evidence manifests. Later versions may introduce a dedicated outcome manifest when the model needs more structure.

### 5. Correction Chain

Answers:

```text
What was wrong, stale, overstated, superseded, or withdrawn?
How was it corrected?
Which older claim or evidence item does the correction affect?
```

Corrections can be represented through:

- claim `status`
- claim `supersedes`
- claim `superseded_by`
- manifest-level `correction_policy`
- signed replacement manifests

The important rule is that correction should be visible, not silently rewritten.

## Claim Levels

OrgAnchor uses value levels to describe how much support a claim has. These are support descriptors, not truth ratings.

```text
SELF_ASSERTED
EVIDENCE_LINKED
THIRD_PARTY
REPRODUCIBLE
TIME_PROVEN
```

### SELF_ASSERTED

The organization says it, but no supporting evidence is linked.

This is allowed, but it should be visibly weaker.

### EVIDENCE_LINKED

The claim references one or more evidence items.

This is the minimum useful level for serious public claims.

### THIRD_PARTY

At least one referenced evidence item is issued outside the organization.

This does not automatically make the claim true. It only means the evidence is not purely self-issued.

### REPRODUCIBLE

At least one referenced evidence item is marked as reproducible or independently reproducible.

Examples:

- test report with method
- benchmark with dataset
- source code plus build instructions
- signed release generated from a Git commit

### TIME_PROVEN

The claim has survived a meaningful period with historical receipts, outcomes, or repeated evidence.

This should be used carefully. A self-declared old date is not enough; the audit should push this toward human or third-party review unless the history is strongly anchored.

## Evidence Quality Fields

Evidence items should prefer explicit quality metadata:

```json
{
  "issuer_type": "first_party | third_party | auditor | customer | researcher | public_dataset",
  "reproducibility": "not_specified | not_reproducible | partially_reproducible | reproducible | independently_reproducible",
  "evidence_strength": "not_assessed | weak | moderate | strong",
  "valid_until": "2027-01-01T00:00:00Z",
  "limitations": ["What this evidence does not prove"]
}
```

This is not about bureaucracy. It is about preventing a single pretty image, testimonial, or vague page from pretending to be strong proof.

## Low Burden For Good Organizations

Good organizations should not need to perform ceremonial work.

OrgAnchor should make use of artifacts they already have:

- Git commits and releases.
- test reports.
- release notes.
- documentation.
- public datasets.
- audit reports.
- security reports.
- customer case studies.
- operational metrics.
- independent reviews.

The job of OrgAnchor is to hash, structure, sign, publish, and explain the trail.

## Higher Cost For Empty Imitation

Weak or deceptive organizations can still write claims.

But the audit should expose:

- unsupported claims
- missing evidence references
- only first-party evidence
- unverifiable evidence
- stale evidence
- broad marketing language
- missing limitations
- missing correction policy
- lack of public retrieval paths

This does not stop misuse completely. It reduces the chance that shallow packaging looks the same as durable value.

## Value Audit

The first executable piece of this model is:

```bash
organchor value audit \
  --claims claims/product-claims.json \
  --evidence evidence/evidence-manifest.json \
  --check-files
```

It generates:

```text
reports/value-continuity-report.json
reports/value-continuity-report.md
```

The audit reports:

- claim support levels
- missing evidence references
- first-party versus external evidence
- reproducibility metadata
- stale evidence
- local hash mismatches when `--check-files` is used
- broad marketing language requiring human review
- correction policy presence

It uses `PASS`, `WARN`, `FAIL`, and `MANUAL_CHECK_REQUIRED`.

Important boundary:

```text
PASS means the checked evidence structure passed OrgAnchor's mechanical checks.
PASS does not mean the claim is true, sufficient, representative, or the best available option.
```

When `reports/value-continuity-report.json` exists, `organchor page generate` includes it in the public verify package by default:

```text
public/verify/reports/value-continuity-report.json
public/verify/reports/value-continuity-report.md
public/verify/organchor.json -> value_continuity
```

This makes value continuity visible to people and machine-readable for AI agents without turning the report into a trust root.

## Software Project Evidence Profile

For an open-source software project such as OrgAnchor, the default value evidence profile should stay close to artifacts the project already produces.

Minimum useful evidence:

- Source repository URL and commit hash.
- Release tag and package version.
- Build, test, package, and install smoke results.
- Public verification of the project's own `/verify` endpoint.
- Signed claims and evidence manifests.
- Current known gaps and limitations.

Stronger evidence:

- Reproducible build instructions.
- CI logs or independently rerunnable test scripts.
- Security policy and domain audit report.
- Public release artifacts with hashes.
- Third-party review, audit, citation, or adoption records.
- Correction or incident history when something was wrong.

For software, `REPRODUCIBLE` should mean more than "there is a document." It should mean a verifier or AI agent can find the command, input commit, expected output, and resulting hash or report. OrgAnchor's own release checks are therefore evidence, not just development chores.

The first OrgAnchor self-pilot claim should remain narrow:

```text
OrgAnchor publishes signed official endpoint statements, claims/evidence manifests, visible verification pages, carrier receipts, and AI-agent-readable verification results for its own public self-pilot.
```

It should not claim:

```text
OrgAnchor is proven secure.
OrgAnchor is production-ready for all organizations.
OrgAnchor makes organizations trustworthy.
```

## What The Audit Must Not Do

The audit must not say:

```text
This organization is good.
This claim is true.
This product works.
This organization deserves trust.
```

It may say:

```text
This claim is unsupported.
This claim references existing evidence.
This evidence is first-party only.
This evidence is marked reproducible.
This evidence is stale.
This broad claim requires human review.
```

## Future Work

Future versions may add:

- dedicated outcome manifests
- third-party attestation manifests
- evidence issuer directories
- signed correction manifests
- stricter reproducibility profiles
- AI-agent-readable value summaries in `public/verify/organchor.json`
- importers for GitHub Releases, CI reports, audits, benchmarks, and public datasets

The direction should stay consistent:

```text
make real value easier to inspect
make shallow claims easier to spot
avoid becoming a centralized moral authority
```
