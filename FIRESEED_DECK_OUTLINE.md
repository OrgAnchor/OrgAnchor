# Fireseed Deck Outline

Status: Public presentation outline for Fireseed Alpha.

Use this as the structure for a short public deck. It is intentionally not a sales deck for a finished product. It presents OrgAnchor as a serious seed project with working alpha loops, explicit limits, and a request for reviewers and early pilots.

## Slide 1: Title

Title: OrgAnchor

Subtitle: Verifiable organization identity continuity for people and AI agents.

Speaker note: Open by saying this is Fireseed Alpha, not stable v1.

## Slide 2: The Shift

Message: In the AI era, polished appearance is no longer strong evidence.

Points:

- Images, videos, websites, and ads are becoming cheaper to generate.
- Domains and platform accounts remain useful but fragile.
- Buyers and agents need verifiable continuity, evidence, and next-check guidance.

## Slide 3: The Core Problem

Question: When an organization changes domain, platform, server, or public endpoint, how does the outside world know what is still official?

Show:

- Old website.
- New website.
- Platform account.
- Mirror.
- Archive.
- Agent needing a low-cost answer.

## Slide 4: The Design Principle

Message: The organization root authority is the identity root. Everything else is a carrier or auxiliary discovery surface.

Trust path:

- Root authority.
- Signed endpoint statement.
- Signed claims/evidence.
- Migration history.
- Public `/verify` package.
- Carrier receipts.

## Slide 5: The Minimum Useful Loop

Flow:

1. Organization creates a root authority.
2. It signs official endpoints.
3. It publishes `/verify`.
4. AI agents discover `/.well-known/organchor.json`.
5. Agents verify signatures, hashes, evidence summaries, and gaps.
6. Agents decide what policy or commercial checks remain.

## Slide 6: What The Alpha Already Has

Show implemented surfaces:

- CLI.
- `/verify` page.
- Compact agent verification.
- Claims/evidence manifests.
- Value audit summaries.
- Beacon and Directory experiments.
- Visible demo.
- Agent demo.

Keep the word "alpha" visible.

## Slide 7: Evidence Without A Paperwork Race

Message: OrgAnchor should not reward raw field count.

Evidence baseline:

- S1: organization self-evidence.
- S2: organization-submitted third-party material with recheck routes.
- S3: random purchase / sampling structure for anti-hand-picked evidence.
- S4/S5: design preview for real-use observation and public challenge.

Decision rule: enough evidence for a stated purpose, not maximum paperwork.

## Slide 8: AI-Agent Friendliness

Show:

```bash
organchor verify url https://organchor.org --compact
```

Explain output fields:

- `identity_status`.
- `value_status`.
- `conformance_status`.
- `trust_decision: NOT_ASSIGNED_BY_ORGANCHOR`.
- `policy_route`.
- `risk_gaps`.
- `next_best_actions`.

## Slide 9: Discovery Without Monopoly

Message: Every adopter should be natively discoverable.

Layers:

- Beacon: origin-owned signal.
- Sweep: reusable discovery result.
- Local index: independent agent or organization database.
- Directory: optional accelerator.

Directory is not a certification authority, not a monopoly trust gate, and not the identity root.

## Slide 10: Commercial Fit

Message: Verification is not enough if commercial screening is too costly.

OrgAnchor can expose:

- Price disclosure mode.
- Signed public price sheet, when appropriate.
- Private signed quote path.
- Lead time.
- MOQ.
- Validity window.
- Contact route.

It should reduce screening cost without forcing every organization to publish prices.

## Slide 11: Boundaries

State clearly:

- Not a trust badge.
- Not a marketplace.
- Not a government/legal identity replacement.
- Not a product truth oracle.
- Not stable v1.
- Not a guarantee of permanence.

## Slide 12: What Still Needs External Validation

Message: The alpha is ready to be tested, not declared finished.

Needs:

- External adopter trial.
- Independent technical review.
- Evidence and governance review.
- AI-agent and Directory discovery test.
- Sponsor-supported documentation, video, examples, and pilot operations.

## Slide 13: Fireseed Plan

Message: Fireseed Alpha is a bounded validation phase.

Wave 1 should produce:

- one external or realistic pilot package;
- one technical review;
- one evidence/governance review;
- one AI-agent or Directory experiment;
- one documented failure or friction point that changes the roadmap.

## Slide 14: What Sponsorship Supports

Message: Sponsor a defined validation phase, not an indefinite promise.

Sponsor support funds:

- public explainers and demo videos;
- first pilot support;
- technical review;
- evidence/governance review;
- examples and documentation;
- AI-agent and Directory compatibility experiments.

Boundary: Sponsorship does not buy ranking, certification, verification outcomes, Directory priority, or trust status.

## Slide 15: Fireseed Ask

Ask for:

- One or two low-risk external adopter trials.
- Technical reviewers.
- Evidence/governance reviewers.
- AI-agent / Directory builders.
- Sponsors for public validation, documentation, examples, and pilot support.

Close with:

- `README.md`
- `PUBLIC_EXPLAINER.md`
- `FIRESEED_OUTREACH_KIT.md`
- `CALL_FOR_FIRESEED_REVIEW.md`
