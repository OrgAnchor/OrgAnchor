# Demo Video Script

Status: Practical demo script for Fireseed Alpha.

Target length: 6-8 minutes.

## Goal

Show that OrgAnchor is not only an idea. Viewers should see a local AI-agent demo, a visible `/verify` page, compact verification output, and a tamper-failure proof.

## Segment 1: Set The Boundary

Duration: 30 seconds.

Say:

"This is OrgAnchor Fireseed Alpha. It is not stable v1, not a trust badge, and not a product certification system. The goal today is to show the minimum useful loop: identity continuity, public verification, evidence summary, and AI-agent-readable output."

Show:

- `README.md`.
- `PUBLIC_EXPLAINER.md`.
- `FIRESEED_OUTREACH_KIT.md`.

## Segment 2: Run The Agent Discovery Demo

Duration: 90 seconds.

Command:

```bash
npm run agent:demo
```

Explain:

- The demo creates a temporary adopting organization.
- It serves a local `/verify` package.
- It runs Beacon sweep, local indexing, Directory snapshot export, need-match query, and direct compact verification.
- It does not require external credentials.

Point at:

- PASS line.
- Generated temporary output path.
- Candidate query result.
- Compact verification result.

## Segment 3: Run The Visible Demo

Duration: 90 seconds.

Command:

```bash
npm run visible:demo -- --out ./visible-demo --serve
```

Open the local URL shown by the command.

Explain:

- Human-readable `/verify` page.
- Root authority and endpoint statement.
- Agent Verification View.
- Carrier receipts, if present.
- Value continuity and evidence support summaries.

Then stop the server after recording.

## Segment 4: Show Compact Public Verification

Duration: 60 seconds.

Command:

```bash
organchor verify url https://organchor.org --compact
```

Explain these fields:

- `overall_status`: whether this verification path passed.
- `identity_status`: whether signed identity continuity checks passed.
- `value_status`: whether evidence summary checks passed.
- `conformance_status`: whether the target looks fully compatible or partial.
- `trust_decision`: should say `NOT_ASSIGNED_BY_ORGANCHOR`.
- `policy_route`: what an external agent should do next.

State:

"This is designed for AI agents that need a cheap first-pass result before deeper due diligence."

## Segment 5: Show Tamper Failure

Duration: 90 seconds.

Use the visible demo tamper output or rerun:

```bash
npm run visible:demo
```

Point at the tamper-failure proof.

Explain:

"If signed content changes without a matching valid signature, verification fails. This is the minimum line that prevents a pretty page from silently rewriting its identity statement."

## Segment 6: Show Evidence Limits

Duration: 60 seconds.

Open:

- `CLAIMS_EVIDENCE_PROTOCOL.md`.
- `S2_THIRD_PARTY_MATERIAL_MODEL.md`.
- `S3_RANDOM_SAMPLING_MODEL.md`.
- `CAPABILITY_TRACEABILITY_MATRIX.md`.

Say:

"The evidence layer is intentionally explicit about maturity. S1-S3 has an alpha baseline. S4/S5 is documented as a design preview. OrgAnchor exposes gaps instead of hiding them."

## Segment 7: Close With The Fireseed Ask

Duration: 45 seconds.

Open:

- `CALL_FOR_FIRESEED_REVIEW.md`.
- `FIRESEED_OUTREACH_KIT.md`.
- `SPONSOR_LETTER.md`.

Say:

"The next step is external validation: pilot organizations, technical reviewers, evidence/governance reviewers, AI-agent builders, Directory builders, and sponsors. The project is ready to be tested as a serious seed, not presented as a finished trust infrastructure."

