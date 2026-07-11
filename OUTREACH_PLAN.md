# OrgAnchor Public Understanding And Outreach Plan

Status: Fireseed Alpha outreach plan.

中文名：OrgAnchor 公共理解包与 Fireseed 外部验证推进计划。

## Purpose

This plan is not meant to package OrgAnchor as a mature finished product. It is meant to turn OrgAnchor into a public seed that outside people can understand, reproduce, challenge, try, support, and help improve.

Fireseed Alpha does not try to prove that OrgAnchor has already succeeded. It tries to test whether, after AI-generated content makes "seeing is believing" increasingly unreliable, a non-monopolistic, inspectable, AI-agent-friendly substrate for organization identity and evidence is worth building with more people.

## Core Message

OrgAnchor's core message is that an organization should not have to prove itself only through platform accounts, domains, websites, cloud infrastructure, or polished promotional material.

OrgAnchor adds a signed, inspectable, migratable, machine-readable identity and evidence history layer on top of ordinary public entrypoints. A website can still be the main human-facing entrance, but it no longer has to carry the full burden of identity continuity, evidence history, and AI-agent verification by itself.

OrgAnchor turns "who we are, where we are official, what we claim, what evidence supports it, what remains uncertain, and what an external AI agent should check next" into a public package that can be verified across carrier changes.

OrgAnchor does not make final trust, purchase, partnership, safety, or policy decisions. It lowers the cost for people, organizations, directories, and AI agents to discover, verify, understand, and compare organization-provided identity and evidence materials.

Core advantages to reuse in public materials:

- Identity root is separated from domains, websites, platform accounts, and cloud providers. The organization's root authority is the continuity anchor.
- Single-carrier failure is less likely to make years of organizational effort hard to trace. Domains may expire, accounts may be disabled, websites may move, and cloud services may fail, but signed statements, evidence packages, migration records, and historical anchors can remain traceable.
- A traditional website is upgraded from a current display surface into a verifiable entrypoint through `/verify`, `/.well-known/organchor.json`, signatures, hashes, and machine-readable indexes.
- Important history becomes harder to rewrite silently. Changed statements require new signed records, new hashes, or explicit migration/supersession paths.
- Root authority can evolve. A small organization can start simple, then migrate toward threshold authority and better custody without discarding history.
- AI agents get a low-friction route: discover the Beacon, fetch the verify package, verify signatures and hashes, inspect evidence, read gaps, and decide what to check next.
- `PASS` is not a trust badge. OrgAnchor verifies identity and evidence structure while keeping the final decision outside OrgAnchor.
- Claims and evidence are bound together. Claims, evidence, hashes, methods, limitations, freshness, risk gaps, and next actions can be inspected together instead of scattered across marketing pages.
- Evidence is judged by purpose-fit sufficiency, not raw paperwork volume. OrgAnchor should not reward organizations for filling the most optional fields.
- S1-S3 gives a minimum evidence baseline: first-party evidence, organization-submitted third-party material, and random purchase / sampling structure.
- Beacon-first discovery lets every adopter emit an origin-owned discovery signal before any Directory includes it.
- Directories can reduce search cost without becoming identity roots, certification authorities, or monopoly discovery gates.
- Commercial-fit signals can reduce wasted verification effort by exposing price disclosure mode, quote path, lead time, MOQ, region, and validity where appropriate.
- Capability audits, package smoke tests, visible demos, and agent demos reduce the gap between documentation claims and implementation reality.

OrgAnchor is not:

- a trust badge;
- a marketplace;
- a certification authority;
- a government identity replacement;
- a guarantee that a product or organization is good;
- a guarantee that any carrier will remain online;
- stable v1.

## Why This Problem Will Get Worse

AI-generated content is lowering the cost of convincing appearances. Product photos, videos, websites, testimonials, certificates, and marketing pages can look credible without being reliable.

At the same time, traditional public entrypoints are weak historical proof layers. A website can be edited, old pages can disappear, platform accounts can be suspended, and domain or infrastructure failures can break the trail that outsiders use to understand what was official before. Without signed history, outsiders cannot easily distinguish continuity from later rewriting.

That changes the verification problem:

- "looks real" becomes weaker evidence;
- ordinary websites are no longer enough to preserve signed, inspectable history;
- imitation gets cheaper while serious organizations need cheaper ways to expose durable evidence;
- centralized recommendations and review systems can become expensive, captured, pay-to-play, or polluted by synthetic activity;
- traditional certification remains useful, but often costs too much, moves too slowly, or covers too little context;
- AI agents will evaluate many more candidates than humans can, so unstructured verification cost becomes a scaling problem;
- demand-side AI agents need low-cost first-pass verification before deeper due diligence;
- small and serious organizations need a way to prove identity continuity and evidence quality without depending on a single platform gatekeeper.

## Public Understanding Package

The public understanding package should make OrgAnchor understandable at three depths and for two kinds of readers: humans and AI agents.

Depths:

1. quick understanding: what problem OrgAnchor addresses and why it matters;
2. visible proof: what the current alpha can actually demonstrate;
3. external action: how reviewers, pilot organizations, AI-agent builders, Directory builders, and sponsors can participate.

Human-facing materials:

- `PUBLIC_EXPLAINER.md`: one-page explanation for first-time readers.
- `VIDEO_SCRIPT_SHORT.md`: bilingual 90-second concept video review script, with English as the canonical voiceover and Chinese meaning alignment.
- `VIDEO_SCRIPT_90S.md`: public English 90-second concept script for the same message.
- `VIDEO_SCRIPT_DEMO.md`: 6-8 minute demo script showing visible verification and AI-agent verification.
- `VIDEO_SCRIPT_DEEP_DIVE.md`: 20-minute script for architecture, evidence, S1-S3, Directory, and commercial-fit explanation.
- `FIRESEED_DECK_OUTLINE.md`: 12-15 slide PPT / deck outline for sponsors, collaborators, and serious reviewers.

AI-agent-facing materials:

- `README.md`: first-pass project overview, install path, current status, and boundaries.
- `DOCS_INDEX.md`: map of current public docs, design records, implementation status, examples, and known gaps.
- `PUBLIC_EXPLAINER.md`: short project positioning that is also useful for first-pass AI summarization.
- `AGENT_VERIFICATION_CONTRACT.md`: stable discovery and verification result contract.
- `AGENT_INTEGRATION_GUIDE.md`: practical instructions for external AI agents and automated verifiers.
- `CAPABILITY_TRACEABILITY_MATRIX.md`: implementation-audit map separating implemented, partial, design-only, and not-implemented capabilities.
- `CLAIMS_EVIDENCE_PROTOCOL.md`: evidence and claim model for interpreting organization-provided assertions.
- `examples/agent-verification/`: compact verification and Beacon query examples.
- `examples/agent-discovery-loop/`: runnable local discovery-loop example.

Action-facing materials:

- `FIRESEED_VALIDATION_TRACKING_ISSUE.md`: copyable GitHub issue for Wave 1 external validation.
- `FIRESEED_OUTREACH_KIT.md`: operational review and pilot starter kit.
- `SPONSOR_LETTER.md`: sponsor/supporter letter template for defined Fireseed Alpha validation support.

## Publishing Order

1. Align the installable Alpha package, GitHub source, public `/verify` package, and Agent contract.
2. Keep the existing GitHub tracking issue as the canonical Fireseed feedback record.
3. Publish the first Bluesky discussion thread from an OrgAnchor-specific account and link it to the GitHub issue.
4. Publish the LinkedIn post with a professional supply-chain, AI-agent, and open-infrastructure framing.
5. Record all public post URLs and material feedback in the GitHub tracking issue.
6. Publish the 90-second concept video, 6-8 minute demo, and deck only after their separate quality gates are met.
7. Pin the AI-agent quick path: `npm run visible:demo -- --out ./visible-demo --serve`, `npm run agent:demo`, and `organchor verify url <local-or-public-organchor-url> --compact`.
8. Invite technical reviewers, AI-agent builders, Directory builders, adopting organizations, and evidence/governance reviewers.
9. Open a sponsorship entry only after a concrete validation need and public review path exist.
10. Collect external review results, record friction points, and update the Fireseed gate before wider promotion.

CivitasX may cross-share OrgAnchor material as part of its broader project portfolio. That distribution relationship does not make CivitasX an identity root, protocol authority, prerequisite account, or launch dependency for OrgAnchor.

## Target Audiences

Do not target only open-source users. Fireseed outreach should separate audiences by the kind of help they can provide.

Primary audiences:

- AI-agent builders and automated-verification developers: test whether OrgAnchor packages are easy to discover, parse, verify, and route into external policy.
- Directory builders, search/index operators, and dataset maintainers: test whether Beacon and Directory records can reduce candidate-discovery cost without becoming a monopoly trust gate.
- Serious small organizations and early adopter operators: test whether a real organization can publish identity, endpoint, claim, evidence, and commercial-fit materials without excessive burden.
- Supply chain, procurement, manufacturing, and B2B service practitioners: test whether OrgAnchor reduces supplier discovery, verification, and first-contact cost.
- Evidence, provenance, anti-fraud, certification, and audit researchers: test whether the evidence model exposes gaps without pretending to be a central certification authority.
- Decentralized identity, DID, Web3 naming, ENS, IPFS, Arweave, timestamping, and open infrastructure communities: test whether OrgAnchor uses these carriers correctly without turning any carrier into the identity root.
- Open-source infrastructure maintainers: review release integrity, package safety, contribution flow, and long-term maintainability.
- Supporters of non-monopolistic public infrastructure: help fund, review, mirror, explain, or connect the Fireseed validation wave.

## Sponsorship Entry Strategy

Sponsorship is not the first public action. OrgAnchor should first make the problem, demo, review path, and Fireseed boundary understandable.

At the Fireseed Alpha stage, sponsorship should be treated as optional support for a defined validation wave, not as proof of traction and not as an indefinite project promise.

Default sequence:

1. publish the public understanding package;
2. open the Fireseed Wave 1 tracking issue;
3. invite reviewers and pilot candidates;
4. collect early external feedback;
5. open a lightweight sponsorship entry only if there is clear support interest or a concrete need for funded validation work.

Funding entry options:

1. GitHub Sponsors is the lightweight first option for direct open-source sponsorship if a simple public support path is needed.
2. Open Collective / Open Source Collective should be considered later if the project needs transparent budgets, fiscal hosting, expense processing, shared governance, or multi-person project operations.

Sponsorship funds should be framed as support for:

- first external validation wave;
- public documentation and video materials;
- examples and adopter packages;
- technical review;
- evidence/governance review;
- pilot support;
- AI-agent and Directory compatibility experiments.

Sponsorship must not buy:

- Directory priority;
- verification outcomes;
- trust status;
- ranking;
- certification;
- policy influence;
- preferential treatment in capability, evidence, or conformance reporting.

Operational rule:

Sponsorship should be tracked separately from verification. If a sponsor is also reviewed, listed, piloted, or included in a Directory, that relationship must be disclosed and must not change verification results.

## Fireseed Wave 1 Acceptance

Wave 1 is useful if it creates external evidence about whether OrgAnchor is understandable, reproducible, and worth improving.

Minimum useful outcomes:

- one real external organization or realistic pilot workspace completes a basic OrgAnchor package under realistic constraints;
- one external human reviewer can understand the public `/verify` page, visible demo, and boundary that `PASS` is not a trust badge;
- one technical reviewer reproduces the local demo or identifies a concrete implementation, packaging, signing, verification, or documentation issue;
- one evidence/governance reviewer identifies practical strengths, weaknesses, or abuse risks in S1-S3;
- one AI-agent or Directory builder tests discovery, compact verification, and whether the result gives enough next-step guidance;
- at least one documented failure, confusion, or friction point changes the next roadmap.

Negative findings count as useful Fireseed results if they are specific, reproducible, and improve the project boundary or implementation.

Wave 1 should be held or slowed if:

- external reviewers cannot understand what OrgAnchor does after reading the public understanding package;
- a technically capable reviewer cannot reproduce the demo path;
- the public `/verify` page or AI-agent output does not make the trust boundary visible;
- OrgAnchor is being interpreted as a trust badge, marketplace, certification authority, or final ranking system;
- public materials describe S1-S3 as more mature, automated, or proof-like than the implementation actually supports;
- documentation and implementation drift apart in a way that misleads reviewers;
- sponsorship language looks like pay-for-trust;
- review feedback exposes a security or integrity issue that should be fixed before further outreach.

## Operating Principle

Every public outreach asset must preserve these boundaries:

1. OrgAnchor provides a verifiable material substrate. It is not a trust badge, certification authority, marketplace ranking system, or recommendation platform.
2. The identity root belongs to the adopting organization, not to OrgAnchor, a Directory, a domain, a website, a platform account, or any storage / publication carrier.
3. Evidence gaps, expired materials, scope limits, uncertainty, and unresolved risks must remain visible. Public materials must not package them as "already trusted".
4. Public explanations must distinguish implemented alpha capabilities from design direction, future work, and open research questions.

Final trust, purchase, partnership, safety, and policy decisions remain with the external person, organization, AI agent, policy, or Directory.
