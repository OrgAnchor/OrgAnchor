# Fireseed Alpha External Validation Wave 1

Status: Active public external-validation and recruitment funnel.

OrgAnchor Fireseed `0.1.0-alpha.5` is open for its first external validation
wave. This issue is the canonical public place to reproduce the current release,
report friction, and record findings that should change the implementation or
roadmap.

The immediate uncertainty is not whether a willing adopting organization already
exists. It is whether unfamiliar people and organizations can understand the
value, complete a low-commitment check, and choose to continue without excessive
cost.

## New To OrgAnchor? Start Here First

Use the three-minute guided entry before running commands:

https://organchor.org/start/

It explains the problem, walks through the live self-pilot, separates what the
current Alpha can and cannot establish, and lets a reviewer choose between
reading, visible inspection, command-line reproduction, or a non-public assisted
trial. No installation or adoption decision is required to use that page.

## Current Public Release

- GitHub prerelease: https://github.com/OrgAnchor/OrgAnchor/releases/tag/v0.1.0-alpha.5
- npm package: https://www.npmjs.com/package/organchor/v/0.1.0-alpha.5
- public site: https://organchor.org/
- guided first look: https://organchor.org/start/
- human-readable verification page: https://organchor.org/verify/
- machine-readable Beacon: https://organchor.org/.well-known/organchor.json
- public release verification: https://github.com/OrgAnchor/OrgAnchor/blob/main/docs/history/PUBLIC_SELF_VERIFICATION_2026-07-17.md

## What OrgAnchor Is Testing

OrgAnchor links an organization's identity, official presence, claims, evidence,
migration history, and verification routes into signed, recheckable public
records. The intended result is lower discovery, verification, interpretation,
and comparison cost for people and AI agents.

`PASS` is a verification result, not a trust badge. It does not mean that an
organization is good, that a product claim is true, or that a buyer should
transact. OrgAnchor's trust decision remains `NOT_ASSIGNED_BY_ORGANCHOR`.

## Start Here: 15-Minute Public Check

No source checkout and no OrgAnchor adoption are required:

```bash
npx --yes organchor@alpha doctor https://organchor.org
npx --yes organchor@alpha beacon inspect https://organchor.org
npx --yes organchor@alpha verify url https://organchor.org --brief
```

On Windows PowerShell, use `npx.cmd` instead of `npx` if the execution policy
blocks `npx.ps1`.

Report just one concrete result: a failed command, confusing field, hidden gap,
misleading status, unnecessary step, or missing next action. A useful negative
result is more valuable than general approval.

## Continue Only As Far As Useful

Participation is intentionally progressive:

1. Understand the model and boundaries at `https://organchor.org/start/`.
2. Run the 15-minute public check.
3. Report one concrete finding.
4. Try a fictional or local-only sandbox package.
5. Use real organization material in a non-public assisted workspace.
6. Publish a real pilot only after the organization explicitly approves it.

An organization may stop at any step. A non-public trial is still useful Fireseed
evidence and creates no obligation to publish.

For non-public pilot interest, contact `organchor.admin@proton.me`. Do not email
private keys, recovery codes, provider tokens, wallet files, customer-private
data, or confidential evidence.

## What A Pilot Participant Receives

The first named pilot is assisted by the OrgAnchor operator. The participant
receives:

- a local adoption workspace;
- a root-authority and custody plan controlled by the organization;
- a generated `/verify` package and Beacon preview;
- a domain-security report;
- a record of actual time, direct cost, friction, and unresolved gaps;
- the right to stop before public or append-only publication.

Participation is not certification, endorsement, ranking, or a final trust
decision.

## Review Tracks

### Adopting Organization Trial

Test whether a real or realistic organization can create a useful package without
excessive effort. Local-only trials count. Useful findings include setup friction,
unclear decisions, missing templates, and maintenance work that would prevent
adoption.

### Technical Review

Test canonical JSON, Ed25519 verification, threshold root authority, migration,
`/verify` generation, Beacon discovery, package safety, tamper failure, and
release reproducibility.

### Evidence And Governance Review

Challenge whether S1-S3 evidence handling is practical and abuse-resistant.
Focus on weak, mismatched, stale, or conflicting evidence and on places where
honest adopters carry too much cost.

### AI Agent Or Directory Review

Test whether an unfamiliar Agent can discover an adopter, retrieve the signed
package, preserve evidence gaps and conflicts, and avoid turning package validity
into claim truth or trust.

## Retired Internal Calibration

The former homepage-only versus OrgAnchor retrieval comparison remains a
historical integration calibration. Structured machine data being easier to
retrieve than homepage prose is a design premise and is no longer a Wave 1
success criterion.

The active Agent uncertainty is whether an unfamiliar Agent preserves the
boundary between valid identity/package integrity and insufficient, mismatched,
stale, or conflicting claim evidence.

## Deeper Adversarial Checks

From a source checkout:

```bash
npm ci
npm run evaluation:evidence -- build --out ./.local/evidence-weak-run
npm run evaluation:evidence -- exercise --package ./.local/evidence-weak-run
npm run evaluation:evidence -- build-stale --out ./.local/evidence-stale-run
npm run evaluation:evidence -- exercise-stale --package ./.local/evidence-stale-run
npm run evaluation:evidence -- build-conflict --out ./.local/evidence-conflict-run
npm run evaluation:evidence -- exercise-conflict --package ./.local/evidence-conflict-run
```

Reference material:

- https://github.com/OrgAnchor/OrgAnchor/blob/main/docs/outreach/FIRESEED_OUTREACH_KIT.md
- https://github.com/OrgAnchor/OrgAnchor/blob/main/docs/evaluations/EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md
- https://github.com/OrgAnchor/OrgAnchor/blob/main/docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md
- https://github.com/OrgAnchor/OrgAnchor/blob/main/docs/protocol/CLAIMS_EVIDENCE_PROTOCOL.md
- https://github.com/OrgAnchor/OrgAnchor/blob/main/docs/operations/FIRESEED_READINESS_GATE.md

## What Counts As Progress

This wave is informative when it produces movement through the participation
ladder, not merely impressions or stars. Record:

- targeted invitations sent;
- substantive replies;
- completed public checks;
- concrete findings;
- sandbox trials;
- non-public real-material trials;
- public pilots.

After roughly 20 carefully matched invitations, a near-zero substantive response
is a signal to revisit the value proposition, participant benefit, or adoption
cost before expanding promotion.

## Hold Conditions

Narrow or pause promotion if reviewers cannot reproduce the public check, public
materials imply trust certification, S1-S3 claims exceed implementation maturity,
participants are pushed toward premature public adoption, or sponsorship appears
able to buy ranking, trust, verification outcomes, or policy influence.

## Report A Finding

Please include only what is necessary:

```text
Participation step:
What you tried:
Command, URL, or document:
Expected result:
Actual result:
Why it matters:
Suggested fix or open question:
```
