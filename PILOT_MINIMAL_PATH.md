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

## Minimum Pilot Level

Target:

```text
Level 3: Mirrored and Archived Identity
```

Minimum acceptable for a first dry external rehearsal:

```text
Level 2: Public Verify Package
```

Do not call the pilot complete if the public `/verify` package cannot be verified from downloaded public artifacts.

## Required Artifacts

Required for every pilot:

```text
root-authority.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
public/verify/index.html
public/verify/organchor.json
public/verify/root-authority.json
public/verify/official-endpoints.json
public/verify/official-endpoints.json.sig
ADOPTION_STATUS.md
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

Recommended:

```text
reports/domain-security-report.json
reports/domain-security-report.md
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

## Minimal Work Sequence

1. Create a separate adoption workspace.
2. Run `organchor init`.
3. Edit `organchor.config.json`.
4. Create root authority.
5. Create and sign official-presence statement.
6. Verify the signature locally.
7. Generate `/verify`.
8. Publish `/verify` to the organization's website.
9. Run `organchor verify url`.
10. Run `organchor adoption status`.
11. Add claims/evidence only if the organization has concrete public claims to expose.
12. Add IPFS, Arweave, OpenTimestamps, lockfile, and domain audit after the identity loop works.

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

These notes should feed back into `ADOPTER_QUICKSTART.md`, `EXTERNAL_PILOT_RUNBOOK.md`, tests, and CLI ergonomics.
