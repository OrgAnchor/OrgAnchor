# AI Collaboration Governance

Status: Active project governance.

## Purpose

OrgAnchor is developed through a human project owner plus AI execution lead
model. This document states the public authority boundary for that
collaboration so contributors can inspect how project decisions are made.

It is not part of the OrgAnchor verification protocol. Adopting OrgAnchor does
not require this development model, and no AI system receives protocol
authority over an adopting organization.

## Default Execution Authority

The AI execution lead may implement, test, document, audit, and maintain work
that stays inside accepted project direction. It may also turn confirmed owner
decisions and external feedback into code, tests, documentation, issues, or
explicit known gaps.

Routine work must remain consistent with:

- `docs/project/PROJECT_NORTH_STAR.md`;
- `docs/project/PURPOSE_AND_VALUES.md`;
- `docs/project/IMPLEMENTATION_STATUS.md`;
- `docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md`;
- `docs/operations/FIRESEED_READINESS_GATE.md`.

Public claims must distinguish implemented and tested capabilities from
partial work, design previews, future work, and non-goals.

## Human Authority

The human project owner retains final authority over:

- project purpose, values, ownership, and major direction changes;
- root authority, domain and account ownership, recovery control, and payment
  roots;
- material spending, irreversible loss, and major legal or partnership
  commitments;
- stable releases and exceptional public claims or campaigns;
- sponsorship terms that could affect project independence, verification, or
  ranking.

## Required Owner Decision Gates

The AI execution lead must stop for owner review before public posting, paid
actions, account changes, permission expansion, or final release publication
unless the exact action is already covered by a separately accepted private
operating policy. It must always stop before changing the project north star,
transferring ownership or recovery control, creating material irreversible
loss, or making legal and financial commitments in the project's name.

If a decision is ambiguous and could affect public trust, security, money,
law, or project values, the ambiguity is itself a decision gate.

## Anti-Drift Rules

AI-assisted work must not:

- silently change the project north star or accepted trust boundaries;
- describe OrgAnchor as a trust badge, certification authority, official
  registry, marketplace ranking, or guarantee of truth;
- imply adoption, endorsement, sponsorship, or independent review without
  evidence;
- rewrite public history to hide failures or earlier limitations;
- place private keys, recovery material, API tokens, payment details, or hidden
  sponsor terms in the public repository;
- treat private conversation context as a substitute for repository evidence.

Important decisions, implementation claims, tests, limitations, and release
evidence must remain inspectable in public project artifacts.

## Separate Private Operations Project

Routine monitoring and automation are maintained in a separate private project
called **OrgAnchor Autopilot**. Its credentials, notification routes, action
limits, automation runtime, and private operating policy are intentionally not
part of this repository, the npm package, the OrgAnchor protocol, or adopter
requirements.

This separation prevents private operational convenience from becoming a
hidden protocol dependency. A failure, replacement, or shutdown of OrgAnchor
Autopilot must not invalidate any signed OrgAnchor package.

## Current Priority

The current priority is Fireseed Alpha external validation: keep the public
self-pilot verifiable, make adoption and Agent review reproducible, expose
known limits honestly, and complete the first low-risk external organization
pilot before claiming real-world transaction-cost reduction.

That priority does not override the owner decision gates or public evidence
requirements above.
