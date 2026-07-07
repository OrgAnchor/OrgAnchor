# Public Release Checklist

Status: Active Fireseed Alpha public-release operating checklist.

## Purpose

This checklist controls the move from local project readiness to public outreach.

It is not part of the OrgAnchor verification protocol. It is an operating gate for the maintainers so public materials do not outrun implementation, and so human-owner intervention happens only where it is actually required.

## Release Premise

Use this premise consistently:

```text
OrgAnchor Fireseed Alpha is a working seed with a visible minimum loop.
It is ready for named external review, reproduction, critique, and low-risk pilot attempts.
It is not stable v1, not a trust badge, not a certification authority, not a marketplace, and not a final ranking system.
```

## Local Verification Gate

Before any public outreach wave, run:

```bash
npm run typecheck
npm test
npm run build
npm run package:smoke
npm run install:smoke
npm run agent:demo
npm run visible:demo -- --cleanup
```

If any command fails, hold public outreach until the failure is either fixed or documented as outside the current release path.

## Public Self-Pilot Gate

Before broad public posting, confirm:

```text
https://organchor.org/verify/ is reachable.
https://organchor.org/.well-known/organchor.json is reachable.
The public package can be verified with organchor verify url https://organchor.org --compact.
The compact result reports identity_status PASS, conformance_status FULL_COMPATIBLE, and trust_decision NOT_ASSIGNED_BY_ORGANCHOR.
The public self-pilot lockfile, if included or referenced, is served as JSON rather than HTML fallback and verifies with organchor lockfile verify.
The public page does not imply OrgAnchor endorsement, certification, supplier ranking, or stable v1 maturity.
No private keys, recovery codes, provider tokens, wallet files, payment records, or customer-private data are published.
```

If the public self-pilot is down, outreach may continue only as local technical review.

## Public Asset Gate

Confirm the current public materials are aligned:

```text
README.md
PUBLIC_EXPLAINER.md
DESIGN_RATIONALE.md
FIRESEED_OUTREACH_KIT.md
CALL_FOR_FIRESEED_REVIEW.md
FIRESEED_DECK_OUTLINE.md
VIDEO_SCRIPT_SHORT.md
VIDEO_SCRIPT_DEMO.md
VIDEO_SCRIPT_DEEP_DIVE.md
SPONSOR_LETTER.md
FIRESEED_VALIDATION_TRACKING_ISSUE.md
CAPABILITY_TRACEABILITY_MATRIX.md
```

Each public asset must preserve these boundaries:

```text
PASS is verification status, not trust status.
OrgAnchor's trust decision remains NOT_ASSIGNED_BY_ORGANCHOR.
S1-S3 are the Fireseed evidence baseline.
S4/S5 are design-preview areas unless a specific implemented command, schema, and test is cited.
Directory is an optional discovery accelerator, not a trust root.
Commercial-fit signals reduce useless screening, but OrgAnchor does not choose the best supplier.
Sponsorship does not buy ranking, trust status, Directory priority, verification outcomes, or policy influence.
```

## Human-Owner Intervention Gates

The AI execution lead may prepare drafts, commands, checks, issues, release notes, and local artifacts.

Stop for human-owner approval before:

```text
publishing videos or public posts;
publishing a PPT/PDF deck to a public platform;
opening or changing a sponsorship/payment entry;
sending direct outreach to named people or organizations;
creating paid promotions or paid infrastructure commitments;
making legal, tax, financial, safety, or ethical claims;
accepting a real external pilot organization into public materials;
claiming a public launch wave has succeeded;
changing project purpose, misuse boundaries, or trust-authority boundaries.
```

## Recommended Publishing Order

Use this order unless there is a specific reason to deviate:

```text
1. Keep GitHub repository, README, public explainer, docs index, and package checks green.
2. Publish the 90-second concept video.
3. Publish the 6-8 minute visible demo video.
4. Publish the deck or deck PDF.
5. Open the Fireseed Wave 1 GitHub tracking issue.
6. Invite a small named batch of reviewers.
7. Open sponsorship only if there is clear support interest or a concrete funding need for the validation wave.
8. Record external feedback, failures, and roadmap changes before wider promotion.
```

## Hold Criteria

Hold or narrow outreach if:

```text
the package cannot be installed by outsiders;
public verify is unavailable and the outreach is not explicitly local-only;
the visible demo or agent demo fails;
public materials imply endorsement, certification, marketplace ranking, or stable v1 maturity;
S1-S3 are described as stronger than the current implementation;
S4/S5 are described as finished governance;
sponsorship language looks like pay-for-trust;
reviewers repeatedly misunderstand OrgAnchor as a final trust authority;
participants risk exposing secrets because instructions are unclear.
```

## Feedback Intake

Route feedback by type:

```text
implementation defect -> GitHub technical review issue;
operator friction -> adopter trial issue;
evidence abuse or governance risk -> evidence/governance issue;
agent discovery or Directory experiment -> technical or evidence issue depending on the failure mode;
sponsorship/payment discussion -> separate maintainer-controlled channel, not verification status.
```

Useful Fireseed feedback should include:

```text
what was tried;
which command, document, URL, or package was used;
expected result;
actual result;
whether this affects Fireseed readiness;
suggested fix or open question.
```
