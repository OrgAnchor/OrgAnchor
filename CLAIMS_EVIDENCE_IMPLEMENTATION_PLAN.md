# Claims and Evidence Implementation Plan

Status: Active implementation map for `CLAIMS_EVIDENCE_PROTOCOL.md`.

## Purpose

`CLAIMS_EVIDENCE_PROTOCOL.md` defines the target protocol. This file keeps the implementation honest by separating:

- what already works in the current alpha;
- what must be exposed next in CLI, schemas, reports, and `/verify`;
- what remains future work.

The goal is to prevent OrgAnchor from sounding stronger than it is while still moving toward low-cost self-claim, evidence, method, attestation, and challenge verification.

## Current Alpha Baseline

Already implemented:

- signed product claims manifests;
- signed evidence manifests;
- claim-to-evidence references;
- evidence artifact SHA-256 hashes;
- explicit evidence recheck method objects;
- evidence-to-method references;
- five real-world profile validators for physical product, service delivery, SaaS/API, certification/compliance, and dataset/research claims;
- local artifact hash checking for local evidence locations;
- first-party versus external evidence metadata;
- reproducibility metadata;
- valid-until stale evidence checks;
- limitations checks;
- scope checks;
- broad marketing-language warnings;
- correction policy presence check;
- value continuity report JSON and Markdown outputs;
- value continuity summary copied into `/verify/organchor.json`;
- `organchor verify url --compact` summary fields for unsupported, third-party, reproducible, manual-check, claim-support-level, risk-gap counts, top risk gaps, and next actions.
- compact profile counts for declared, passing, and gap-bearing real-world profiles.
- `REAL_WORLD_EVIDENCE_PROFILE.md` for minimum useful product and service evidence packages.

Current limitation:

```text
The alpha value layer verifies evidence structure and support signals.
It does not prove product truth, service quality, or claim sufficiency.
```

## First Implementation Slice

The first practical protocol slice is claim-level AI-agent support output inside the existing value audit report. This slice is implemented in the current alpha line.

For every claim, `organchor value audit` exposes:

- protocol support level;
- support axes;
- risk gaps;
- next best actions;
- policy route;
- explicit `NOT_ASSIGNED_BY_ORGANCHOR` trust decision.

`organchor verify url` now copies a compact claim-support summary from the value report, and `organchor verify url --compact` exposes stable support-level counts, a total risk-gap count, top risk gaps, and next actions.

This was intentionally cheaper than adding new manifest types first. It makes existing claims/evidence output more useful to AI agents immediately.

## Next Alpha Work

Next CLI/schema work should add:

1. Attestation manifests
   - Add signed third-party or automated attestations.
   - Bind attestations to exact claim IDs, evidence IDs, methods, time windows, and results.
   - Avoid raw attestation-count scoring.

2. Challenge/correction manifests
   - Add public challenge and correction records.
   - Bind challenges to exact claims or evidence items.
   - Preserve older claims while making supersession visible.

3. Low-burden templates
   - Provide starter templates for software, API uptime, professional service, physical product, and dataset claims.
   - Keep the minimum useful path to one narrow claim plus one hash-bound evidence item.

## Later Work

Later versions may add:

- importers for GitHub Actions, GitHub Releases, monitoring services, benchmark outputs, audits, and public datasets;
- issuer reputation or issuer directory inputs controlled by the consuming agent, not OrgAnchor;
- richer JSON Schema files for methods, attestations, and challenges;
- optional W3C Verifiable Credentials or C2PA compatibility;
- claim-category-specific validation profiles;
- cross-directory claim-support comparison.

## Acceptance Rule

This layer improves only when it reduces the cost for an external AI agent to answer:

```text
What is claimed?
What supports it?
What does the support fail to prove?
Who else attests to it?
Can it be cheaply rechecked?
What should I ask for next?
```

It must not turn OrgAnchor into a centralized rating authority.
