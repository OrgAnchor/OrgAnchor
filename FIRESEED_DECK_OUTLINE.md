# Fireseed Deck Outline

Status: Public presentation outline for Fireseed Alpha.

Use this as the structure for a short public deck. It is intentionally not a sales deck for a finished product. It presents OrgAnchor as a serious seed project with working alpha loops, explicit limits, and a request for reviewers and early pilots.

## Slide 1: Title

Title: OrgAnchor

Subtitle: Signed organization identity and evidence continuity for people and AI agents.

Speaker note: Open by saying this is Fireseed Alpha, not stable v1.

## Slide 2: The Shift

Message: In the AI era, polished appearance is no longer strong evidence.

Points:

- Polished images, videos, websites, ads, testimonials, and certificate-like materials are becoming cheaper to generate.
- Domains, websites, cloud infrastructure, and platform accounts remain useful, but they are not stable identity roots.
- A serious organization needs a low-cost way to show who it is, who it has been, where it is official now, and which evidence supports its important claims.

## Slide 3: The Core Problem

Question: If a domain expires, a platform account is disabled, or a website moves, how can the outside world verify that the same organization is still speaking?

Show:

- Old website may be gone.
- New website may not yet be trusted.
- Platform account may be disabled, captured, or impersonated.
- Historical materials may be deleted, rewritten, or hard to connect.
- Mirror or archive may preserve content but not automatically prove current authority.
- AI agent needs a low-cost answer: what is official now, what changed, what is signed, and what should be checked next.

## Slide 4: The Design Principle

Message: The root authority signs what the organization currently recognizes as official. Everything else is a carrier or auxiliary discovery surface.

Trust path:

- Root or delegated authority.
- Signed official-presence records.
- Signed claims and evidence indexes.
- Migration / supersession records.
- Public `/verify` package.
- External carrier receipts: website, IPFS, Arweave, GitHub, DNS, Directory.

## Slide 5: The Minimum Useful Loop

Flow:

1. Organization creates a root authority.
2. It signs official-presence records and verification metadata.
3. It publishes a public `/verify` package.
4. It exposes `/.well-known/organchor.json` as the low-friction discovery signal.
5. AI agents verify signatures, hashes, freshness, evidence summaries, and visible gaps.
6. Agents return a structured result: what passed, what is missing, and what remains a policy or commercial decision.

## Slide 6: Working Alpha Surfaces

Show implemented surfaces:

- CLI for keys, statements, signatures, verification, pages, evidence, Directory, and demos.
- `/verify` page.
- Compact agent verification.
- Beacon discovery through `/.well-known/organchor.json`.
- Claims/evidence manifests and package health checks.
- S1-S3 evidence structure with current alpha validators.
- Visible demo.
- Local agent demo.
- Directory and sweep experiments.

Keep "alpha" visible. Do not present Directory, S1-S3, or evidence governance as finished infrastructure.

## Slide 7: Evidence Without A Paperwork Race

Message: Evidence is not proof by volume. It is a structured map of claims, supporting materials, limits, freshness, and next checks.

Evidence baseline:

- S1: organization self-evidence.
- S2: organization-submitted third-party material with recheck routes.
- S3: random purchase / sampling structure for launched product or service claims.
- S4/S5: design preview for real-use observation and public challenge.

Decision rule: enough evidence for a stated purpose, with visible gaps. Not maximum paperwork, not automatic trust.

## Slide 8: AI-Agent Friendliness

Show:

```bash
npm run visible:demo -- --out ./visible-demo --serve
organchor verify url <local-or-public-organchor-url> --compact
```

Explain output fields:

- `identity_status`.
- `value_status`.
- `conformance_status`.
- `trust_decision: NOT_ASSIGNED_BY_ORGANCHOR`.
- `policy_route`.
- `claim_scope`.
- `freshness`.
- `risk_gaps`.
- `next_best_actions`.
- `source_urls`.

For a public slide, show only the most important fields visually and keep the full field list in speaker notes.

The output is a verification briefing, not a final recommendation.

## Slide 9: Discovery Without Monopoly

Message: Every adopter should emit an origin-owned discovery signal before any Directory includes it.

Layers:

- Beacon: origin-owned signal at `/.well-known/organchor.json`.
- Sweep: reusable crawl result that records where Beacon signals were found.
- Local index: each buyer, agent, or organization can maintain its own candidate database.
- Directory: optional accelerator that reduces search cost, but does not become the identity root.

A Directory may improve discovery and package-health monitoring, but it must not become a certification authority, monopoly trust gate, or root identity issuer.

## Slide 10: Commercial Fit

Message: Trust is not enough if the commercial path is opaque.

OrgAnchor can expose:

- Price disclosure mode: public, range, quote-only, contract-only, or unavailable.
- Signed public price sheet, when appropriate.
- Private signed quote path.
- Lead time and capacity window.
- MOQ or minimum engagement size.
- Region and service constraints.
- Validity window.
- Official contact route.

OrgAnchor should reduce wasted screening and negotiation cost without forcing every organization to publish exact prices.

## Slide 11: What OrgAnchor Does Not Decide

Message: OrgAnchor lowers verification cost, but it does not make the final judgment.

Keep visible:

- OrgAnchor is not a trust badge, certification authority, marketplace, or final ranking system.
- It does not decide whether an organization is good, safe, lawful, affordable, or the best choice.
- It does not guarantee that any website, domain, platform, storage network, or Directory will stay online.
- It exposes signed structure, continuity, hashes, freshness signals, declared evidence relationships, and visible gaps.
- Final trust, purchase, partnership, safety, and policy decisions remain outside OrgAnchor.

## Slide 12: What Is Ready To Test

Message: Fireseed Alpha has enough working surface to be tested by outsiders, but not enough to claim broad adoption readiness.

Testable loops:

- Create or inspect an OrgAnchor identity package.
- Open the public `/verify` page and understand the trust boundary.
- Run compact AI-agent verification.
- Check Beacon discovery through `/.well-known/organchor.json`.
- Inspect claims, evidence summaries, freshness, and gaps.
- Try a small Directory or local discovery experiment.
- Report friction, confusion, missing fields, or misleading wording.

## Slide 13: Fireseed Alpha: First Validation Wave

Message: Fireseed Alpha is a controlled external validation phase, not a public claim that OrgAnchor is finished.

Wave 1 should produce:

- one external or realistic pilot package;
- one human-readable `/verify` review;
- one technical review;
- one AI-agent or Directory discovery experiment;
- one evidence / abuse-risk review for S1-S3;
- one documented failure or friction point that changes the roadmap.

## Slide 14: How People Can Help

Message: The first external value is review, reproduction, criticism, and small real-world trials.

Useful help:

- Try OrgAnchor on a low-risk organization or realistic pilot workspace.
- Reproduce the CLI, `/verify`, visible demo, or agent demo.
- Test discovery from an AI-agent or Directory-builder perspective.
- Challenge the S1-S3 evidence model, abuse controls, and boundary wording.
- Improve examples, docs, translations, videos, and onboarding.
- Support a defined Fireseed validation wave if funding becomes useful.

Boundary: Support does not buy ranking, certification, verification outcomes, Directory priority, or trust status.

## Slide 15: Fireseed Ask

Ask:

- Try it.
- Reproduce it.
- Challenge it.
- Explain where it is confusing.
- Use it for one low-risk pilot.
- Help make organization identity and evidence cheaper to verify without creating a new monopoly gate.

Close with:

- `README.md`
- `PUBLIC_EXPLAINER.md`
- `FIRESEED_OUTREACH_KIT.md`
- `CALL_FOR_FIRESEED_REVIEW.md`
