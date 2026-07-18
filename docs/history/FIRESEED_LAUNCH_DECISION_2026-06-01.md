# Fireseed Launch Decision - 2026-06-01

Status: Historical record. Original status at publication: GO for named Fireseed outreach.

## Decision

OrgAnchor may begin Fireseed outreach to named early adopters, technical reviewers, and evidence/governance critics.

This is not stable v1, not broad promotion, and not a claim that the evidence, Directory, observation, or challenge layers are complete.

## Decision Basis

| Field | Value |
| --- | --- |
| Decision date | 2026-06-01 |
| Source state evaluated | `da1d2a5cec4538e7af805c20b8920847aedfd6ab` |
| Package version | `0.1.0-alpha.3` |
| Public self-pilot | `https://organchor.org/verify/` |
| Public Beacon origin | `https://organchor.org/.well-known/organchor.json` |
| Readiness gate | `docs/operations/FIRESEED_READINESS_GATE.md` |
| Decision state | `GO` |

The decision source state already contains the Fireseed readiness gate, S3 gate tightening, public review entry points, issue templates, and package-facing documentation links.

## Verification Results

The following checks passed from the local source checkout:

```text
npm.cmd run typecheck
npm.cmd test
npm.cmd run package:smoke
npm.cmd run agent:demo
npm.cmd run release:smoke
npm.cmd run install:smoke
node src/cli.ts verify url https://organchor.org --compact
```

Observed public self-pilot result:

```text
overall_status: PASS
identity_status: PASS
value_status: PASS
conformance_status: FULL_COMPATIBLE
trust_decision: NOT_ASSIGNED_BY_ORGANCHOR
```

The public self-pilot remains a reference implementation and does not certify OrgAnchor itself as complete, good, safe, or final.

## What Is Ready For Fireseed

Fireseed outreach can ask reviewers to inspect:

- root authority and signed endpoint continuity;
- `/verify` publication;
- `/.well-known/organchor.json` Beacon discovery;
- compact AI-agent verification output;
- claims and evidence manifests;
- S1 first-party evidence labeling;
- S2 organization-submitted third-party material gaps;
- S3 random purchase / sampling baseline gates;
- static/local Directory tooling as a discovery accelerator, not a trust root;
- issue templates and contributor paths.

## Accepted Known Gaps

These gaps are accepted for Fireseed and must remain visible:

- no broad external organization pilot has completed yet;
- no stable v1 release exists;
- S3 slot issuance, slot verification, slot-use ledgers, and raw-vault admission workflows are not complete;
- S4 real-use observation remains Design Preview;
- S5 public challenge, correction, negative evidence, and historical accountability remains Design Preview;
- public challenge governance, malicious-reporting controls, privacy handling, and durable storage incentives are not solved;
- delegated product/service key credentials are documented but not implemented;
- live ENS resolver reads still require choosing an Ethereum RPC/provider path;
- no real Onion disaster-recovery address has been registered;
- broad internet-scale crawling is intentionally outside the local CLI;
- third-party Directory adoption has not begun.

These gaps do not block Fireseed because the launch claim is limited to the minimum inspectable loop and co-builder invitation.

## First Outreach Tracks

Use three tracks only.

### 1. Adopting Organization Trial

Goal:

```text
Can a real or realistic organization publish an OrgAnchor package without excessive effort?
```

Ask for:

- onboarding friction;
- public `/verify` clarity;
- S1-S3 evidence friction;
- whether a third-party AI agent can verify the package without private context.

### 2. Technical Review

Goal:

```text
Can a technical reviewer reproduce the verification loop and find implementation or release defects?
```

Ask for review of:

- canonical JSON and duplicate-key rejection;
- Ed25519 and threshold verification;
- root authority migration;
- package safety;
- release checks;
- compact agent output.

### 3. Evidence And Governance Review

Goal:

```text
Can reviewers find where the evidence model misleads agents, punishes honest adopters, or allows abuse?
```

Ask for critique of:

- S1-S3 abuse cases;
- S3 sampling and anti-brushing assumptions;
- stale or misleading evidence;
- S4/S5 observation, challenge, correction, and accountability design gaps;
- Directory capture and ranking risks;
- storage incentives.

## Non-Claims

This launch decision does not claim:

- v1 completeness;
- product quality certification;
- legal, safety, procurement, or ethical approval;
- permanent identity;
- guaranteed truth;
- anti-censorship guarantees;
- official Directory privilege;
- a solved public challenge, correction, and accountability network;
- that OrgAnchor can decide which organization should be trusted.

OrgAnchor verifies signatures, hashes, continuity, publication structure, and declared evidence relationships. External agents and people still own final policy and trust decisions.

## Immediate Next Step

Open Fireseed outreach with named participants and require feedback to use the existing GitHub issue templates:

- `Adopter Trial / Fireseed`;
- `Technical Review / Fireseed`;
- `Evidence / Governance Review`.

Do not expand S4/S5 into large implementation tracks until initial Fireseed feedback has been collected and triaged.
