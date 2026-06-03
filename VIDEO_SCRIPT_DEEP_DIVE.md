# Deep Dive Video Script

Status: Fireseed Alpha 20-minute deep-dive script.

中文名：20 分钟深度视频脚本。

Target length: 20 minutes.

Purpose: Explain the architecture, evidence layer, S1-S3 boundary, Directory strategy, and commercial-fit layer without turning the video into a CLI tutorial.

## Segment 1: Why OrgAnchor Exists

Duration: 2 minutes.

Message:

The online verification problem is changing. AI-generated content makes visual polish cheap, while organizations still depend on fragile carriers such as domains, platforms, websites, cloud providers, and certification pages.

Say:

"OrgAnchor is not trying to create an immortal website. It is trying to make organizational identity continuity and evidence packages easier to verify when carriers change."

Show:

- domain;
- platform account;
- website;
- archive;
- IPFS/Arweave;
- AI Agent asking who is official.

## Segment 2: The Root Principle

Duration: 2 minutes.

Message:

The organization root authority is the identity root. Carriers are not roots.

Explain:

- Root authority signs current official endpoints.
- Migration records preserve continuity when authority evolves.
- Website, IPFS, Arweave, Onion, ENS, Directory, and lockfiles are carriers or discovery aids.
- If a carrier fails, the signed chain should still be interpretable through another carrier.

Boundary:

"A domain can help discovery, but it should not be the final identity root."

## Segment 3: Minimum Useful Loop

Duration: 3 minutes.

Flow:

1. Organization creates root authority.
2. It signs an official endpoint statement.
3. It generates a public `/verify` package.
4. It exposes `/.well-known/organchor.json`.
5. An AI Agent runs compact verification.
6. The Agent gets identity status, value status, conformance status, policy route, risk gaps, and next actions.

Show command:

```bash
organchor verify url https://organchor.org --compact
```

Explain:

`NOT_ASSIGNED_BY_ORGANCHOR` is deliberate. OrgAnchor does not make the final trust decision.

## Segment 4: Evidence Layer

Duration: 4 minutes.

Message:

Identity continuity alone is not enough. A real buyer or partner also needs to know whether the organization's product/service claims have support.

Explain:

- Claims are signed statements about products, services, capabilities, commercial fit, or continuity.
- Evidence manifests record artifacts, hashes, locations, methods, limitations, freshness, and support relations.
- Value audit exposes support levels and gaps.
- Evidence is not treated as a paperwork race.

Use this line:

"OrgAnchor should help an AI Agent ask better next questions. It should not hide gaps behind a badge."

## Segment 5: S1-S3 Fireseed Baseline

Duration: 4 minutes.

S1: First-party evidence.

- Submitted by the organization.
- Useful for specifications, policies, official explanations, signed price sheets, public docs, demos, and product/service descriptions.
- Trust meaning: this is what the organization officially claims and is accountable for.

S2: Organization-submitted third-party material.

- Still submitted by the organization.
- Useful for certificates, lab reports, audit letters, public registry records, or third-party-looking documents.
- OrgAnchor should expose recheck routes and mechanical consistency checks.
- Trust meaning: stronger than pure self-claim only when scope, issuer, dates, subject binding, and recheck path are clear.

S3: Random purchase / sampling structure.

- Designed to reduce hand-picked-sample bias.
- Requires sample identity, sample source, acquisition route, bounded active sample pool, and raw availability state.
- Trust meaning: evidence about market/customer-site sample conformance, not long-term operational continuity.

Boundary:

"Fireseed Alpha treats S1-S3 as the minimum evidence closure. S4/S5 are important, but still design-preview areas for co-builders."

## Segment 6: Directory Without Monopoly

Duration: 3 minutes.

Problem:

If no one can find OrgAnchor-enabled organizations, verification value is weakened.

Architecture:

- Beacon: every adopter can publish an origin-owned discovery signal.
- Sweep: third parties can collect public Beacons.
- Local index: any organization or AI Agent can build its own database.
- Directory: optional accelerator, not a trust root.

State:

"OrgAnchor should make every adopter visible like a discoverable signal, while avoiding a single official platform becoming the gatekeeper."

## Segment 7: Commercial Fit Layer

Duration: 2 minutes.

Problem:

Verification still wastes time if price, lead time, MOQ, service region, language, or quote route are invisible.

OrgAnchor direction:

- price disclosure mode;
- signed public price sheet when appropriate;
- private signed quote path when public pricing is not suitable;
- lead time;
- MOQ;
- validity window;
- support/contact route.

Boundary:

"OrgAnchor reduces commercial screening cost. It does not decide which supplier is best."

## Segment 8: What Is Already Done And What Is Missing

Duration: 1.5 minutes.

Already done:

- CLI;
- root authority and signatures;
- `/verify`;
- Beacon discovery;
- compact agent verification;
- signed claims/evidence;
- S2/S3 alpha checks;
- visible demo;
- agent demo;
- package and capability audits.

Missing:

- broad external pilot;
- S4/S5 implementation maturity;
- delegated product/service credential layer;
- stronger real-world evidence workflows;
- external Directory builders;
- funding and review for sustained Fireseed validation.

## Segment 9: Fireseed Ask

Duration: 30 seconds.

Ask for:

- early reviewers;
- pilot organizations;
- AI-agent builders;
- Directory builders;
- evidence/governance reviewers;
- sponsors for a defined Fireseed Alpha validation wave.

Close:

"We are not asking the world to trust OrgAnchor. We are asking serious people to verify the direction, reproduce the demos, find weak points, and help build a lower-cost evidence substrate for organizations."

