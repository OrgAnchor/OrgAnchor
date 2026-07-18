# Current Project State - 2026-07-02

Status: Historical record. Original status at publication: Active source-repository snapshot.

## Purpose

This document is the current source-repository state summary for OrgAnchor after the Fireseed Alpha design and implementation pass.

It exists to reduce drift. If a reader asks "what is actually true right now?", this file should point them to the current boundary before they read older planning notes.

## Current Position

OrgAnchor is Fireseed Alpha software, not stable v1.

The current project goal is:

```text
Help organizations publish signed identity, official-presence, claim, evidence, and migration records so people and AI agents can lower the cost of discovering, verifying, understanding, and comparing organizations across domain, platform, and infrastructure changes.
```

OrgAnchor is not:

```text
a trust badge
a certification authority
a marketplace
a ranking system
an official registry
a government/legal identity replacement
```

The identity root is the adopting organization's root authority. Websites, domains, IPFS, Arweave, Onion, ENS, Directory snapshots, and lockfiles are carriers, discovery aids, mirrors, archives, or receipts.

## Working Alpha Loop

The current source tree supports this minimum useful loop:

1. Create a root authority.
2. Create a signed official-presence statement.
3. Verify the statement with canonical JSON, SHA-256 hashes, Ed25519 signatures, and root-authority threshold rules.
4. Generate a public `/verify` package.
5. Expose AI-agent-readable discovery through `/.well-known/organchor.json` and `/verify/organchor.json`.
6. Run local visible acceptance and agent discovery demos.
7. Publish and verify small carrier receipts through lockfile, IPFS, Arweave package/Turbo path, and OpenTimestamps support.
8. Create signed claims and evidence manifests.
9. Attach S2 third-party material and S3 random sampling records at alpha level.
10. Run value, capability, adoption, domain, Beacon, Directory, and public-release checks.

## Fireseed Alpha Scope

Current acceptance focus:

```text
identity continuity
public verify package
agent-readable verification
signed claims and evidence manifests
S1 first-party evidence
S2 organization-submitted third-party material
S3 bounded random purchase / sampling structure
```

Design preview only:

```text
S4 real-world use and delivery observation
S5 public challenge, correction, negative evidence, and historical accountability
product/service delegated credential implementation
commercial-fit implementation
broad internet-scale crawling
GUI Studio
third-party Directory ecosystem
```

Do not present design-preview areas as finished product capability.

## Current Public Entry Points

Use these first:

- `README.md`
- `DOCS_INDEX.md`
- `docs/project/PROJECT_NORTH_STAR.md`
- `docs/project/DESIGN_RATIONALE.md`
- `docs/outreach/PUBLIC_EXPLAINER.md`
- `docs/project/IMPLEMENTATION_STATUS.md`
- `docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md`
- `docs/operations/VISIBLE_ACCEPTANCE.md`
- `docs/guides/ADOPTER_QUICKSTART.md`
- `docs/guides/PILOT_MINIMAL_PATH.md`
- `docs/guides/EXTERNAL_PILOT_RUNBOOK.md`
- `docs/operations/FIRESEED_READINESS_GATE.md`
- `docs/operations/PUBLIC_RELEASE_CHECKLIST.md`

## Current Public Self-Pilot Evidence

As of the 2026-07-06 public self-pilot review, OrgAnchor's own public package at `https://organchor.org/verify/` passes the minimal public identity/evidence loop and exposes a root-signed lockfile snapshot.

Current public verification evidence is recorded in `docs/history/PUBLIC_SELF_PILOT_MINIMAL_REVIEW_2026-07-06.md`:

- `organchor verify url https://organchor.org --compact`: `PASS`;
- `organchor doctor https://organchor.org`: `READY`;
- direct statement, claims, evidence, and public lockfile verification: `PASS`;
- `trust_decision`: `NOT_ASSIGNED_BY_ORGANCHOR`.

This supports continued Fireseed Alpha external review. It does not support stable-v1, certification, marketplace-ranking, or trust-badge claims.

## Current Source Repository Boundary

This repository should contain:

- source code
- schemas
- tests
- public examples
- public documentation
- public outreach/review material

This repository must not contain:

- real private root keys
- provider API tokens
- payment details
- upload wallets
- real deployment secrets
- private self-pilot operational receipts

OrgAnchor's operational self-pilot workspace is separate:

```text
E:\CivX\OrgAnchor-self-pilot
```

That workspace can contain real deployment artifacts and local secrets. It must not be copied into the public package.

## Current Recommended Next Work

The next work should not expand the theory surface. It should make external reproduction easier.

Priority order:

1. Keep documentation and implementation status aligned.
2. Make adopter onboarding shorter and more repeatable.
3. Keep examples small, safe, and non-fake.
4. Keep Fireseed Alpha claims bounded.
5. Run external review with named people or organizations.
6. Only after external review, decide which S4/S5/product-credential/commercial-fit pieces deserve implementation first.

## Verification Commands

Recommended local checks before public claims or release work:

```bash
npm run typecheck
npm test
npm run capability:audit
npm run capability:scenarios
npm run visible:demo -- --out ./visible-demo --serve
npm run agent:demo
npm run package:smoke
```

Use network-enabled checks only when deliberately reviewing the public self-pilot or external pilot.

## Current Hold Conditions

Hold public expansion if:

- README or public materials imply OrgAnchor certifies trust.
- S4/S5 are described as implemented acceptance gates.
- private keys or provider credentials appear in the source repository.
- examples look like real endorsed organizations.
- a release is promoted without passing local verification.
- external pilots cannot reproduce the minimum identity -> verify -> agent-readable loop.
