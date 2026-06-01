# Fireseed Alpha Plan

Status: Accepted launch-and-collaboration gate.

## Purpose

OrgAnchor is a long-horizon infrastructure project. It should not wait for every evidence, directory, storage, governance, and challenge mechanism to be complete before outside people can inspect and improve it.

Fireseed Alpha defines the first stable public collaboration point:

```text
minimum necessary loop;
clear unfinished boundaries;
invitation for long-term co-builders.
```

It is intentionally smaller than v1.

## Fireseed Thesis

The project should first prove a compact loop:

```text
an organization can anchor its identity;
publish signed official endpoints;
publish an AI-readable /verify package;
bind claims to hash-bound evidence;
expose S1-S3 evidence structure and gaps;
let external agents verify facts without accepting OrgAnchor as a trust authority.
```

S4 and S5 are important, but they are not Fireseed acceptance gates.

They enter Fireseed as design previews so outside contributors can help shape them without mistaking them for finished governance systems.

## What Fireseed Alpha Is

Fireseed Alpha is:

```text
a public alpha release;
a self-pilot reference;
a practical CLI toolchain;
a verifiable /verify package;
an AI-agent-readable verification path;
a claims/evidence baseline;
an S1-S3 evidence-layer baseline;
a documented invitation for technical, organizational, and evidence-model critique.
```

Fireseed Alpha is not:

```text
stable v1;
a certification service;
a product-quality oracle;
a hosted marketplace;
a universal directory monopoly;
a finished S4/S5 public observation and challenge network;
a claim that OrgAnchor can decide who is trustworthy.
```

## Fireseed Acceptance Scope

Fireseed Alpha accepts these as launch-scope:

| Area | Fireseed status | Meaning |
| --- | --- | --- |
| Identity continuity | Acceptance gate | Root authority, signed endpoint statement, migration path, and /verify must work. |
| Public verification | Acceptance gate | Humans and AI agents can fetch and verify the public package. |
| Carrier durability | Acceptance gate | Traditional web, IPFS, Arweave/manual or upload package, and timestamp/receipt paths are present or clearly marked. |
| Beacon discoverability | Acceptance gate | Adopters can emit origin-owned discovery signals. |
| Directory | Limited accelerator | Static/local directory tools may exist, but no official directory trust privilege. |
| Claims/evidence | Acceptance gate | Signed claims/evidence manifests, hash-bound artifacts, and value audit must work. |
| S1 | Acceptance gate | First-party evidence is supported and clearly labeled. |
| S2 | Acceptance gate | Organization-submitted third-party material is supported with route and gap checks. |
| S3 | Acceptance gate | Random purchase/sampling baseline is supported with bounded pool, credential, nullifier, sampling-plan, and documented slot gates. |
| S4 | Design Preview | Real-use/real-delivery observation direction is documented and partially tooled, but not mature. |
| S5 | Design Preview | Public challenge/negative evidence direction is documented, but governance and abuse handling are not mature. |

## Why Stop Acceptance At S3

S3 is the smallest non-self-referential evidence layer that can be meaningfully tool-checked in an alpha CLI.

S3 can be constrained by engineering primitives:

```text
claim_id;
claim_version;
sample_pool_id;
sample_slot_id;
sample_nullifier;
max_active_samples;
sampling_plan;
credential binding;
raw hash;
vault pointer.
```

S4 and S5 require more ecosystem governance:

```text
long-running observers;
privacy-sensitive customer or repair data;
directory and buyer incentives;
negative-evidence abuse resistance;
dispute handling;
public-interest archival;
correction and response workflows.
```

Shipping them as finished Fireseed acceptance gates would overclaim.

The correct Fireseed boundary is:

```text
S3 proves the evidence layer is not merely self-assertion.
S4/S5 show the direction and invite co-design.
```

## S3 Completion Target For Fireseed

Before Fireseed Alpha outreach, S3 should be treated as "baseline complete" when:

```text
S3 rules are documented;
S3 intake and slot risks are documented;
S3 template and attach commands emit bounded-pool, sample-slot, raw-evidence, and storage-role fields;
value audit checks bounded-pool, sample-slot, credential, nullifier, sampling-plan, raw-evidence, and storage-role gates;
compact agent output exposes S3 gaps;
missing gates downgrade to candidate S3;
sample-slot issuance and verification are explicitly documented as future work, not silently implied.
```

Fireseed does not require full S3 slot infrastructure.

The boundary must be visible:

```text
Current tooling checks S3 gates.
Future tooling should issue, verify, and ledger sample slots.
```

## S4 Design Preview

S4 means:

```text
real use, real delivery, support, repair, uptime, supply, or field behavior observed over a time window.
```

S4 should eventually answer:

```text
Does this product or service continue to perform in real operating conditions?
Is there recent observation over a meaningful window?
Who observed it?
What metrics were used?
Where are raw bundles or summaries held?
What privacy and sampling limits exist?
```

Fireseed only claims:

```text
S4 concept, boundary with S3, template/attach basics, and audit gaps are visible.
```

Fireseed does not claim:

```text
S4 observer networks are mature;
S4 storage incentives are solved;
S4 privacy and commercial confidentiality are solved;
S4 can make final delivery-quality decisions.
```

## S5 Design Preview

S5 means:

```text
public challenge, negative evidence, contradiction, dispute, correction, withdrawal, or supersession.
```

S5 is essential because a system that accepts only favorable evidence becomes marketing infrastructure.

S5 should eventually answer:

```text
What negative or contradictory evidence exists?
Who submitted it?
How is abuse or false reporting handled?
Did the organization respond?
Was the claim corrected, withdrawn, superseded, or disputed?
Who stores the high-value negative evidence?
```

Fireseed only claims:

```text
S5 principle and challenge/correction direction are documented.
```

Fireseed does not claim:

```text
public challenge governance is solved;
malicious reporting is solved;
directory-wide health observation is mature;
external agents should treat S5 absence as proof of safety.
```

## Fireseed Freeze Rules

During Fireseed Freeze:

```text
do not expand S4/S5 into new large engineering tracks;
do not build a hosted marketplace;
do not claim official directory authority;
do not keep adding evidence theory before the public loop is understandable;
do not present unfinished governance as product maturity.
```

Allowed work:

```text
fix correctness bugs;
improve README and onboarding clarity;
keep npm/GitHub/public /verify green;
make Fireseed boundaries visible;
improve S3 baseline checks where they directly prevent overclaiming;
prepare contributor entry points.
```

## Co-Builder Profiles

Fireseed should invite three kinds of early participants.

### 1. Adopting Organizations

They should test:

```text
Can they create a root authority?
Can they publish /verify?
Can they explain their claims and evidence without overwork?
Can an external agent verify the package?
Where does onboarding fail?
```

### 2. Technical Reviewers

They should test:

```text
signature verification;
canonical JSON;
threshold authority and migration;
package integrity;
release process;
CLI ergonomics;
agent output contracts.
```

### 3. Evidence And Governance Critics

They should test:

```text
S1-S3 abuse cases;
S3 brushing and sample-slot assumptions;
S4/S5 design gaps;
storage incentives;
directory risks;
misuse by bad organizations;
how to expose gaps without becoming a central trust judge.
```

## Fireseed Public Message

Use this framing:

```text
OrgAnchor helps organizations publish signed official endpoint and evidence packages so their identity and claims remain verifiable across domain, platform, and infrastructure changes.

Fireseed Alpha proves the minimum loop and invites co-builders to harden the evidence, discovery, storage, and challenge layers.
```

Avoid:

```text
permanent identity;
guaranteed truth;
anti-censorship guarantee;
decentralized certification;
official quality rating;
replacement for buyer policy, legal review, safety review, or procurement judgment.
```

## Fireseed Launch Checklist

Before Fireseed Alpha outreach:

```text
main is green;
npm alpha is installable;
GitHub repository is public and understandable;
README explains Fireseed scope;
organchor.org/verify is public and verifiable;
agent compact output is stable enough for first adopters;
S1/S2/S3 boundaries are documented;
S3 intake and sample-slot risks are documented;
S4/S5 are marked Design Preview;
CONTRIBUTING or equivalent contributor entry path exists;
known gaps are easy to find;
the project explicitly says OrgAnchor is not a trust authority.
```

The operational GO/HOLD decision is maintained in `FIRESEED_READINESS_GATE.md`.

## Post-Fireseed Rhythm

After Fireseed Alpha:

```text
collect external review;
prioritize fixes that reduce verification cost;
prioritize evidence-model attacks before feature expansion;
run one low-risk external organization pilot;
turn repeated pilot friction into CLI or onboarding improvements;
delay broad promotion until at least one external pilot is reproducible.
```

The fire must stay small enough to keep alive, but real enough for others to gather around.
