# Claims and Evidence Implementation Plan

Status: Active implementation map for `docs/protocol/CLAIMS_EVIDENCE_PROTOCOL.md`.

## Purpose

`docs/protocol/CLAIMS_EVIDENCE_PROTOCOL.md` defines the target protocol. This file keeps the implementation honest by separating:

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
- local S2 third-party material classification and checks;
- `evidence s2 template` and `evidence s2 attach` for low-friction S2 metadata creation;
- value-audit and compact-verification `s2_summary`;
- local S3 random purchase / sampling classification and checks;
- `evidence s3 template` and `evidence s3 attach` for low-friction S3 metadata creation;
- value-audit and compact-verification `s3_summary`;
- value continuity report JSON and Markdown outputs;
- value continuity summary copied into `/verify/organchor.json`;
- `organchor verify url --compact` summary fields for unsupported, third-party, reproducible, manual-check, claim-support-level, risk-gap counts, top risk gaps, and next actions.
- compact profile counts for declared, passing, and gap-bearing real-world profiles.
- `docs/protocol/REAL_WORLD_EVIDENCE_PROFILE.md` for minimum useful product and service evidence packages.

Current limitation:

```text
The alpha value layer verifies evidence structure and support signals.
It does not prove product truth, service quality, or claim sufficiency.
```

Accepted design principle:

- `docs/protocol/PURPOSE_EVIDENCE_CHALLENGE_MODEL.md` defines the three-axis model: P1-P5 purpose profiles, S1-S5 observation source classes, and challenge/correction lifecycle states.
- `docs/protocol/EVIDENCE_SUFFICIENCY_MODEL.md` defines purpose-fit sufficiency over raw completeness, so validators and agent outputs should avoid field-count ranking and hidden mandatory extension fields.
- `docs/protocol/S2_THIRD_PARTY_MATERIAL_MODEL.md` defines the implementation-facing S2 fields, Core/Extension boundary, mechanical checks, and compact agent summary.
- `docs/protocol/S3_RANDOM_SAMPLING_MODEL.md` defines the implementation-facing S3 fields, Core/Extension boundary, sample-control checks, and compact agent summary.
- `docs/protocol/SUBJECT_BINDING_MODEL.md` defines the rule that discovery matches, claims, evidence, samples, observations, credentials, and challenges must declare their covered subject and must not silently widen coverage.

Accepted but not yet implemented:

- delegated product/service key statements;
- product model passports;
- batch commitments;
- unit credentials;
- service delivery credentials;
- common subject binding helpers and claim/evidence subject-coverage checks;
- observation source classification for first-party materials, field-use observation, and public challenge or negative evidence;
- observation, complaint, challenge, and correction records bound to those credentials.

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

## Remaining Protocol Work

Future CLI/schema slices should add, in priority order only after current alpha
behavior remains stable and external validation identifies the need:

1. Attestation manifests
   - Add signed third-party or automated attestations.
   - Bind attestations to exact claim IDs, evidence IDs, methods, time windows, and results.
   - Avoid raw attestation-count scoring.

2. Challenge/correction manifests
   - Add public challenge and correction records.
   - Bind challenges to exact claims or evidence items.
   - Preserve older claims while making supersession visible.

3. Product/service credential layer
   - Add delegated key statements scoped to brand, product line, model family, factory, region, service line, or batch.
   - Add product model, batch, and unit credential schemas.
   - Add service delivery credential schemas with optional customer co-signature.
   - Classify observations as first-party, third-party, random purchase/sampling, field-use, or public challenge/negative evidence.
   - Bind positive and negative observations to product or service credentials before treating them as claim support.

4. Low-burden templates
   - Provide starter templates for software, API uptime, professional service, physical product, and dataset claims.
   - Keep the minimum useful path to one narrow claim plus one hash-bound evidence item.
   - Separate Core fields from Extensions so missing optional context does not invalidate a narrow valid claim.
   - Add purpose-fit outputs such as `fit_for`, `not_enough_for`, and `missing_optional_context` instead of universal completeness scores.

5. Purpose/evidence/challenge model outputs
   - Add P1-P5 purpose-profile validators.
   - Add remaining S1/S4/S5 observation source-class fields.
   - Extend the implemented local S2 checks into bounded network verified-route adapters for `VR-S2-001 ISSUER_ORIGIN_CONFIRMATION` and `VR-S2-002 PUBLIC_REGISTRY_CONFIRMATION`.
   - Extend the implemented same-origin, hash-bound external JSON evidence signature routes into institution-origin adapters and real-world issuer identity/reputation checks where policy requires them.
   - Extend the implemented local S3 checks into custody and independent-test route adapters.
   - Add challenge/correction lifecycle states across all purpose profiles.
   - Treat public challenge review as a horizontal lifecycle mode, not as a sixth ascending purpose profile.

6. Package health layer
   - Add `organchor health inspect <origin>` so a third-party agent can produce an observed health report without becoming an OrgAnchor adopter.
   - Add `organchor observation lookup <origin> --directory <snapshot-or-url>` so agents can cheaply read existing Directory health summaries before fetching full packages.
   - Add Directory `observed_health_summary` fields and optional `health-observations.ndjson` exports.
   - Add self-declared package health summaries and Beacon-level fetch recommendations after the observed-health read path exists.
   - Keep package health separate from trust scoring or supplier ranking.

## Later Work

Later versions may add:

- importers for GitHub Actions, GitHub Releases, monitoring services, benchmark outputs, audits, and public datasets;
- issuer reputation or issuer directory inputs controlled by the consuming agent, not OrgAnchor;
- richer JSON Schema files for methods, attestations, and challenges;
- optional W3C Verifiable Credentials or C2PA compatibility;
- claim-category-specific validation profiles;
- Merkle-friendly batch commitment and selective-disclosure unit membership proofs;
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
Is the observed product or service actually linked to the organization's authority chain?
Is the evidence package sufficient for this purpose without rewarding unnecessary field volume?
What source classes and challenge/correction states apply?
Which S2 materials have external recheck anchors, and which are only unverified external material?
Is the package fresh, reachable, and worth fetching further?
```

It must not turn OrgAnchor into a centralized rating authority.
