# Fireseed Alpha External Validation Wave 1 Tracking Issue

Status: Copyable GitHub tracking issue draft.

Use this file to open the first public GitHub issue for external validation.

## Issue Title

Fireseed Alpha External Validation Wave 1

## Labels

Suggested labels:

- `fireseed`
- `external-validation`
- `alpha`
- `review`
- `needs-participants`

## Issue Body

```markdown
# Fireseed Alpha External Validation Wave 1

OrgAnchor is in Fireseed Alpha. This issue tracks the first external validation wave.

The goal is not to prove that OrgAnchor is finished. The goal is to make the current direction understandable, reproducible, criticizable, and useful enough for serious early collaborators.

## What OrgAnchor Is

OrgAnchor helps organizations publish signed, recheckable public records that link identity, official presence, claims, evidence, and migration history so people and AI agents can discover, screen, verify, understand, and compare candidate organizations at lower cost across domain, platform, website, or infrastructure changes.

## What OrgAnchor Is Not

OrgAnchor is not:

- a trust badge;
- a marketplace;
- a certification authority;
- a government identity replacement;
- a product truth oracle;
- stable v1.

`PASS` does not mean "this organization is good." It means the checked identity/evidence path passed the current verification checks. OrgAnchor's own trust decision remains `NOT_ASSIGNED_BY_ORGANCHOR`.

## Review Tracks

### Track A: Adopting Organization Trial

Goal: Test whether a real or realistic organization can publish a useful OrgAnchor package without excessive effort.

Useful output:

- friction points;
- unclear docs;
- missing templates;
- excessive setup cost;
- evidence fields that are too vague or too heavy.

### Track B: Technical Review

Goal: Test the implementation.

Focus:

- canonical JSON;
- Ed25519 signing and verification;
- root authority migration;
- `/verify` generation;
- Beacon discovery;
- `organchor verify url --compact`;
- package safety;
- tamper failure;
- test coverage.

### Track C: Evidence And Governance Review

Goal: Test whether S1-S3 evidence handling is practical and abuse-resistant.

Focus:

- S1 first-party evidence;
- S2 organization-submitted third-party material;
- S3 random purchase / sampling;
- sample-slot and anti-brushing design;
- stale or misleading evidence;
- S4/S5 design-preview gaps.

### Track D: AI Agent Or Directory Builder

Goal: Test whether an external AI Agent or Directory can discover, filter, and verify OrgAnchor adopters with low friction.

Focus:

- `/.well-known/organchor.json`;
- `organchor beacon sweep`;
- local Beacon index;
- `organchor beacon query`;
- Directory snapshot;
- compact verification result;
- risk gaps and next actions.
- adversarial evidence interpretation where identity and package integrity pass but a product claim remains insufficiently supported.

## Retired Internal Calibration

The former homepage-only versus OrgAnchor retrieval comparison is preserved as an internal integration calibration, not as a transaction-cost experiment. Structured machine data being easier to retrieve than homepage prose is a design premise and is no longer a Wave 1 success criterion.

The active uncertainty is whether an unfamiliar Agent can keep valid identity and package integrity separate from insufficient, mismatched, stale, or missing claim evidence. See `EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md`.

## Internal Fresh-Context Baseline

The first isolated internal Agent run completed on 2026-07-16 and scored `96/100 SAFE_AND_USEFUL` with no hard failure. It correctly rejected insufficient and out-of-scope evidence without turning insufficiency into falsity or fraud. It did not order the follow-up checks by lowest cost, so the result also produced a concrete machine-contract improvement target. Raw output and scoring are preserved under `evaluation-results/evidence-interpretation/2026-07-16-internal-fresh-context/`.

This baseline does not satisfy the independent external review criteria by itself.

## Fast Local Checks

```bash
npm install -g organchor@alpha
organchor doctor https://organchor.org
organchor beacon inspect https://organchor.org
organchor verify url https://organchor.org --compact
```

From a source checkout, run the local demos:

```bash
npm ci
npm run visible:demo -- --out ./visible-demo --serve
npm run agent:demo
npm run evaluation:evidence -- build --out ./.local/evidence-interpretation-run
npm run evaluation:evidence -- exercise --package ./.local/evidence-interpretation-run
```

## Useful Public Docs

- `README.md`
- `PUBLIC_EXPLAINER.md`
- `FIRESEED_OUTREACH_KIT.md`
- `PUBLIC_SELF_VERIFICATION_2026-07-15.md`
- `EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md`
- `CAPABILITY_TRACEABILITY_MATRIX.md`
- `VISIBLE_ACCEPTANCE.md`
- `CLAIMS_EVIDENCE_PROTOCOL.md`
- `S2_THIRD_PARTY_MATERIAL_MODEL.md`
- `S3_RANDOM_SAMPLING_MODEL.md`
- `DIRECTORY_MODEL.md`
- `COMMERCIAL_FIT_LAYER.md`

## Wave 1 Success Criteria

Wave 1 is useful if it produces:

- at least one external organization or realistic pilot workspace;
- at least one independent technical review;
- at least one evidence/governance review;
- at least one AI-agent or Directory discovery experiment;
- at least one adversarial evidence-interpretation result that distinguishes package validity from claim support;
- at least one documented failure, confusion, or gap that changes the roadmap.

## Hold Criteria

Slow or hold public promotion if:

- reviewers cannot understand what OrgAnchor does;
- demos cannot be reproduced;
- public materials make OrgAnchor look like a trust badge;
- S1-S3 claims exceed implementation maturity;
- sponsorship language looks like pay-for-trust.

## How To Comment

Please include:

- review track;
- what you tried;
- command or document path;
- expected result;
- actual result;
- whether this affects Fireseed readiness;
- suggested fix or open question.
```
