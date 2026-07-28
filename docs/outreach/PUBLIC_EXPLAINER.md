# OrgAnchor Public Explainer

Status: Fireseed Alpha public explainer.

Guided public entry: https://organchor.org/start/

## Short Version

OrgAnchor helps organizations publish signed, recheckable public records that
link identity, official presence, claims, evidence, and migration history. It is
designed to lower the practical cost for people and AI agents to discover,
screen, verify, understand, and compare candidate organizations across domain,
platform, website, or infrastructure changes.

Its main goal is to reduce the cost of deciding whether an organization is worth deeper review, contact, partnership, purchase, or support.

OrgAnchor does not ask you to trust a claim because it looks polished. It puts checkable material in front of you: signed records, declared official presence, evidence summaries, hashes, freshness signals, visible gaps, and suggested next checks.

## Why This Matters

Organizations usually present themselves through websites, domains, platform accounts, product pages, reports, certificates, videos, and public statements.

All of these materials matter, but they are often scattered. A website presents the organization. A platform account distributes updates. A report or certificate may support a specific fact. Historical changes may live in old pages, announcements, repositories, press releases, or third-party records. These materials can help people understand an organization, but they rarely form a single verifiable chain by default.

That creates a practical problem. When an outside person or AI agent wants to decide whether an organization is worth deeper contact, review, purchase, partnership, or support, they often have to reassemble basic context from scratch:

- Is this the same organization?
- Where is its current official presence?
- What did it claim before?
- What does it claim now?
- Where is the evidence?
- Is the evidence still fresh and relevant?
- What migrations, corrections, or disputes happened over time?
- What should be checked next?

AI-generated media makes this problem more visible. Polished pages, promotional videos, product descriptions, and certificate-like materials are becoming easier to produce. A professional appearance does not mean the underlying claims have enough evidence behind them.

OrgAnchor is not trying to replace websites, domains, or platforms. It addresses the missing link between scattered materials.

It helps organizations organize identity, official presence, claims, evidence, migrations, and history into signed, recheckable, traceable, and portable public materials. That way, outside people and AI agents do not have to start from zero and piece everything together manually. They can discover, screen, verify, understand, and compare an organization at lower cost.

## Verifiable History Over Time

OrgAnchor is not limited to checking one current snapshot. Used over time, it
lets an organization accumulate a **verifiable longitudinal record**: a sequence
of signed public states connected to publication receipts, external time
anchors, corrections, evidence updates, and migration records.

AI can make a convincing current website, report, certificate-like document, or
organization profile quickly. It is much harder to backfill a long history that
was already published at multiple real moments, signed by the relevant
authority, externally time-anchored, and kept consistent with product versions,
evidence, corrections, migrations, and independent observations.

This changes what an outside person or AI agent can inspect. Instead of asking
only "what does the organization say today?", the reviewer can also ask:

- What did the organization publish at earlier verifiable moments?
- Which authority signed each state?
- Which records have independent time anchors rather than only declared dates?
- How did claims and supporting evidence change?
- Were corrections appended transparently or was context silently removed?
- Are there unexplained gaps, abrupt discontinuities, contradictions, or
  concentrated late backfills?

The mechanism matters. A date written inside a signed file is not independent
proof that the file existed on that date. Stronger temporal evidence comes from
separately published signed snapshots, content hashes, signed receipt history,
and external anchors such as OpenTimestamps/Bitcoin or append-only archival
publication.

Longer history is not automatic proof of truth, and a new organization is not
presumed untrustworthy. The value is narrower and more defensible: time becomes
an inspectable evidence dimension, raising the cost of silently rewriting or
retrospectively fabricating a coherent past while lowering the cost of reviewing
change.

## What OrgAnchor Makes Visible

An OrgAnchor package should help an outside person or AI agent answer:

- Who is speaking?
- Is this the same organization over time?
- Where can the organization's official presence be found now?
- Which records are signed?
- Which claims are being made?
- Which evidence supports those claims?
- What is stale, missing, contradicted, or outside scope?
- What should be checked next before a real decision is made?

The point is not to make the final decision for the reader. The point is to reduce the cost of reaching a better-informed next step.

## How It Works

OrgAnchor separates the identity root from the carriers that publish it.

An adopting organization publishes signed records of who it is, where its official presence can be found now, what it claims, what evidence it exposes, and what has changed over time.

The basic verification path is:

1. Organization root authority: the long-lived authority chain controlled by the adopting organization.
2. Signed official-presence records: the current website, verify page, contact paths, repositories, documentation, or other declared public channels.
3. Public `/verify` package: a human-readable summary layer plus machine-readable verification materials.
4. AI-agent entrypoint: `/.well-known/organchor.json` plus compact verification output.
5. Claims and evidence manifests: signed claim/evidence structures with hashes, methods, gaps, freshness, limitations, and support summaries.
6. Optional carriers and anchors: website, IPFS, Arweave, OpenTimestamps/Bitcoin, Onion, ENS, GitHub, DNS, and Directory snapshots.

The carrier is not the root. A website, storage network, platform account, Directory, or domain may help publish or discover materials, but the verification path returns to the organization's authority records, signatures, hashes, migration records, and evidence structure.

A verifiable history emerges when an organization preserves successive
snapshots instead of silently replacing the only visible copy. Corrections,
withdrawals, and migrations should point backward to the state they supersede,
while external time anchors help distinguish contemporaneous publication from a
date declared later.

## Human And Agent Views

The `/verify` page is the first human-readable summary layer. It should help a person understand the current identity state, official presence, signed path, evidence summary, and visible gaps without reading every underlying record.

The full package may contain many more signed records and evidence entries. AI agents and verification tools can read, filter, and check that complete record set in detail.

From a known origin, supplied seed, sitemap, bounded crawl start, or open
Directory snapshot, an agent-facing flow can:

1. check whether a website exposes a standard OrgAnchor signal;
2. read that signal;
3. record the organization as a candidate;
4. compare it with a current need;
5. verify the signed source package from the organization's own site;
6. return a compact briefing with statuses, risk gaps, and next checks.

This is not a global search engine and not a final recommendation system. Discovery signals and Directory records reduce search cost, but selected candidates still require direct verification at their own source.

## Commercial Fit Without Becoming A Marketplace

Implementation boundary: this is an accepted design direction, not a current
Fireseed Alpha manifest or quote-verification capability.

Verification can still waste time if basic commercial-fit signals are missing.

A candidate organization may be real, continuous, and technically capable, but still unsuitable for a specific need because price, lead time, minimum order quantity, service region, supported language, or quote route does not match the buyer's constraints.

OrgAnchor should expose these signals where useful:

- price disclosure mode: public, private quote, range, request-only, or not disclosed;
- signed public price sheets when public pricing is appropriate;
- signed private quote paths when public pricing is not appropriate;
- lead time and validity window;
- minimum order quantity or minimum engagement size;
- service region, support language, and contact route.

OrgAnchor does not force every organization to publish prices. It also does not decide which supplier is best. The goal is narrower: reduce useless inquiries and help people or AI agents decide whether a candidate is worth deeper review.

## What Fireseed Alpha Can Demonstrate

Fireseed Alpha can already demonstrate a visible minimum loop:

- Root authority records and threshold-style authority verification.
- Signed official-presence records.
- Static `/verify` page generation.
- Public Beacon discovery through `/.well-known/organchor.json`.
- AI-agent compact verification output.
- Signed claims and signed evidence manifests.
- S1-S3 evidence baseline:
  - S1 first-party evidence.
  - S2 organization-submitted third-party material with recheck routes.
  - S3 random purchase / sampling structure with bounded sample-slot thinking.
- Value audit summaries that expose support levels, gaps, risks, and next checks.
- Directory and Beacon discovery experiments without making OrgAnchor a marketplace or monopoly trust platform.
- Visible demo and agent demo commands that can be run locally without external credentials.
- Tamper-failure demonstration: changed signed material fails verification.

Fireseed Alpha is enough to inspect, reproduce, and criticize. It is not a claim that OrgAnchor is finished.

The current alpha has not yet demonstrated broad transaction-cost reduction
across many independent organizations or Agent implementations. That outcome
must be tested through external adoption and repeatable third-party evaluation.

## What It Does Not Claim

OrgAnchor does not claim:

- stable v1 maturity;
- product truth by itself;
- legal or government identity replacement;
- product quality certification;
- marketplace ranking;
- trust scoring;
- permanent availability;
- full decentralization;
- global search coverage;
- quantum-proof cryptography in v1.

`PASS` means the checked identity/evidence structure passed the current verification path. It does not mean "this organization is good" or "this supplier is the best choice."

OrgAnchor reports the material path it checked. The final decision to buy, partner, approve, list, support, or trust remains outside OrgAnchor.

## Who Should Read What Next

If you are seeing OrgAnchor for the first time:

- start at `https://organchor.org/start/` for the three-minute guided path;
- read `README.md` for the project overview;
- run `npm run visible:demo -- --out ./visible-demo --serve` to see the human-readable demo;
- run `npm run agent:demo` to see the local agent discovery loop.

If you are evaluating whether OrgAnchor is real enough to review:

- read `docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md`;
- read `docs/outreach/FIRESEED_OUTREACH_KIT.md`;
- reproduce the visible demo and agent demo.

If you build AI agents, search tools, or Directories:

- read `docs/protocol/AGENT_INTEGRATION_GUIDE.md`;
- read `docs/protocol/AGENT_VERIFICATION_CONTRACT.md`;
- inspect `examples/agent-discovery-loop/`.

If you care about evidence quality and abuse risks:

- read `docs/protocol/CLAIMS_EVIDENCE_PROTOCOL.md`;
- read `docs/protocol/S2_THIRD_PARTY_MATERIAL_MODEL.md`;
- read `docs/protocol/S3_RANDOM_SAMPLING_MODEL.md`;
- review the S4/S5 design preview boundaries.

## Why Fireseed Alpha Exists

Fireseed Alpha is the point where the working loop should leave the project's own hands.

The useful feedback now is:

- Can a real organization publish an OrgAnchor package without excessive effort?
- Can an external AI agent discover and verify it with low friction?
- Does the `/verify` page help humans understand the first summary layer?
- Are evidence gaps exposed clearly enough?
- Are S1-S3 practical, abuse-resistant, and not too heavy?
- Are S4/S5 directions clear enough for co-builders to improve?
- Can Directory builders help discovery without becoming a new monopoly trust gate?
- Where is the path confusing, weak, misleading, or too difficult to reproduce?

Negative findings are useful if they are specific, reproducible, and help improve the boundary or implementation.

## Fast Demo

```bash
npm run visible:demo -- --out ./visible-demo --serve
npm run agent:demo
organchor verify url <local-or-public-organchor-url> --compact
```

For a package-facing map, start with `README.md`, `DOCS_INDEX.md`, `docs/outreach/FIRESEED_OUTREACH_KIT.md`, and `docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md`.
