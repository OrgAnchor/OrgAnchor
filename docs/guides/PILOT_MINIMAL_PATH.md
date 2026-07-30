# Pilot Minimal Path

Status: Fireseed Alpha minimal external pilot path.

## Purpose

This document defines the smallest pilot that proves OrgAnchor is useful outside its own self-pilot.

It is intentionally narrower than the full architecture. The goal is to prove that a real organization can publish a verifiable identity and evidence entry point without turning OrgAnchor into a marketplace, certification authority, or trust badge.

## Pilot Success Definition

A pilot succeeds when an independent reviewer can:

1. find the organization's OrgAnchor signal
2. open the public `/verify` page
3. fetch the machine-readable verify package
4. verify the signed official-presence statement
5. inspect root authority continuity
6. inspect claims/evidence if the organization publishes product or service claims
7. see evidence gaps and next verification actions
8. confirm no OrgAnchor claim implies final trust, ranking, or certification

## Three Distinct Checkpoints

Do not collapse a local rehearsal, a public pilot, and a resilient deployment
into one vague "pilot complete" state.

```text
Checkpoint A: Assisted local preview
No publication, no provider account, no payment, and no claim of public adoption.
The package, human page, Agent result, and tamper rejection must work locally.
```

Run:

```bash
npm run pilot:rehearsal
```

The report records elapsed time, automated CLI steps, organization inputs,
human approval gates, public artifact count, and whether a private key entered
the public output.

```text
Checkpoint B: Level 2 Public Verification Presence
The organization has approved its wording and real root authority, published
/verify on an organization-controlled origin, completed a domain audit, and
passed public URL verification.
```

This is the minimum completed external pilot.

```text
Checkpoint C: Level 3 Mirrored and Archived Identity
The Level 2 package also has recorded mirror/archive receipts and the selected
claims/evidence layer where relevant.
```

This is the target after the public identity loop is stable. Do not call an
external pilot complete if the public `/verify` package cannot be verified from
downloaded public artifacts.

## Required Artifacts

Required for the local preview and every public pilot:

```text
root-authority.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
public/verify/index.html
public/verify/organchor.json
public/verify/root-authority.json
public/verify/official-endpoints.json
public/verify/official-endpoints.json.sig
```

Required for a completed Level 2 public pilot:

```text
ADOPTION_STATUS.md
reports/adoption-status-report.json
reports/domain-security-report.json
reports/domain-security-report.md
```

Required if public claims are included:

```text
claims/product-claims.json
claims/product-claims.json.sig
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
reports/value-continuity-report.json
reports/value-continuity-report.md
```

Recommended after Level 2:

```text
organchor.lock.json
organchor.lock.json.sig
arweave-manifest.json or Arweave TX receipts
IPFS CID receipt
OpenTimestamps proofs
```

## Human Approval Gates

Human approval is required before:

- public root authority publication
- first public `/verify` deployment
- real payments
- domain purchase or transfer
- append-only Arweave upload
- public high-stakes claims
- root authority migration

An assisting AI agent may prepare files and commands. It should not silently cross these gates.

## Response-To-Preview Sequence

When an organization first replies:

1. Run the local fictional rehearsal without organization data.
2. Show the generated human page, compact Agent result, and tamper failure.
3. Ask only for organization name, official endpoints, custody preference, and
   one bounded claim/evidence artifact if evidence is in scope.
4. Generate an organization-specific package in a private adoption workspace.
5. Let the organization correct wording and decide whether to stop locally.
6. Cross public approval gates only after explicit approval.

This path should require no provider account, payment, DNS change, or public
commitment.

The automated local loop should finish in one working session. A same-day
public Level 2 pilot is feasible only when the organization can approve the
wording and root authority, already controls the target origin, and can deploy
and review the domain audit that day. Do not report waiting on people, DNS, or
hosting approval as CLI execution time.

## Public Level 2 Sequence

1. Confirm organization-specific wording and official endpoints.
2. Confirm the real root authority and custody plan.
3. Create and sign the official-presence statement.
4. Verify the signature locally.
5. Generate `/verify` and inspect it for accidental secrets.
6. Obtain explicit approval for first publication.
7. Publish `/verify` and the Beacon to the organization's website.
8. Run `organchor verify url` and `organchor doctor`.
9. Run `organchor domain audit`.
10. Run `organchor adoption status --level 2`.
11. Add claims/evidence only when the organization has a concrete public claim.
12. Add IPFS, Arweave, OpenTimestamps, and signed receipts after Level 2 works.

Before public deployment, `adoption status` can report `NEEDS_WORK` for the selected level. Treat that as a readiness signal, not as a failed local generation step.

## Evidence Boundary

For Fireseed Alpha:

- S1 first-party evidence can be used.
- S2 organization-submitted third-party material can be used.
- S3 random purchase / sampling structure can be used where the organization has a concrete product/service claim and a bounded sample pool.
- S4 real-world observation is design preview.
- S5 challenge/correction/accountability is design preview.

The pilot should not pretend that S4/S5 are mature governance systems.

## Minimal Independent Verification

A reviewer should be able to run:

```bash
organchor verify url https://example.org --compact
organchor doctor https://example.org
```

Then, after downloading public artifacts:

```bash
organchor statement verify --authority root-authority.json --in official-endpoints.json --sig official-endpoints.json.sig
```

If claims/evidence are published:

```bash
organchor claims verify --authority root-authority.json --in product-claims.json --sig product-claims.json.sig --evidence evidence-manifest.json
organchor evidence verify --authority root-authority.json --in evidence-manifest.json --sig evidence-manifest.json.sig
```

## What To Record After The Pilot

Record:

- adoption level reached
- root authority mode used
- public verify URL
- authority hash
- statement hash
- valid signature count
- carrier receipts
- evidence areas used
- evidence gaps
- broken links or stale fields
- commands that failed
- human steps that were confusing
- time spent by the adopting organization
- security issues or overclaiming risks

These notes should feed back into `docs/guides/ADOPTER_QUICKSTART.md`, `docs/guides/EXTERNAL_PILOT_RUNBOOK.md`, tests, and CLI ergonomics.
