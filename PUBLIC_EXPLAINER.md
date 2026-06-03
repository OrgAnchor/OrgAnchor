# OrgAnchor Public Explainer

Status: Fireseed Alpha public explainer.

## One Sentence

OrgAnchor helps organizations publish signed official endpoint and evidence packages so that people and AI agents can verify identity continuity, evidence structure, carrier receipts, and migration history across domain, platform, and infrastructure changes.

## The Problem

Online identity is still too dependent on fragile carriers:

- A domain can expire, be misconfigured, or be captured.
- A platform account can be suspended, renamed, sold, or impersonated.
- A website can be redesigned, deleted, or moved.
- Cloud infrastructure can fail or become inaccessible.
- AI-generated media and polished pages make appearance cheaper than evidence.

For buyers, partners, funders, journalists, auditors, and AI agents, the hard question is not only "Does this page look real?" It is:

- Who is speaking?
- Is this the same organization over time?
- Which endpoint is official now?
- Which claims are signed?
- Which evidence supports those claims?
- What is stale, missing, contradicted, or outside scope?
- What should be checked next before a real decision is made?

## The OrgAnchor Answer

OrgAnchor separates the identity root from the carriers that publish it.

The trust path is:

1. Organization root authority: the long-lived authority chain controlled by the adopting organization.
2. Signed official endpoint statement: the current official website, verify page, contact paths, and carriers.
3. Public `/verify` package: human-readable and machine-readable verification materials.
4. AI-agent entrypoint: `/.well-known/organchor.json` plus `organchor verify url --compact`.
5. Claims and evidence manifests: signed claim/evidence structures with hashes, methods, gaps, freshness, and support summaries.
6. Optional carriers: website, IPFS, Arweave, OpenTimestamps/Bitcoin, Onion, ENS, and Directory snapshots.

The carrier is not the root. The root authority, signatures, hashes, migration records, and published evidence structure are the root of verification.

## What It Currently Demonstrates

The Fireseed Alpha can already demonstrate:

- Root authority records and threshold-style authority verification.
- Signed endpoint statements.
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

## What It Does Not Claim

OrgAnchor does not claim:

- Stable v1 maturity.
- Product truth by itself.
- Legal or government identity replacement.
- Product quality certification.
- Marketplace ranking.
- Trust scoring.
- Permanent availability.
- Full decentralization.
- Quantum-proof cryptography in v1.

`PASS` means the checked identity/evidence structure passed the current verification path. It does not mean "this organization is good" or "this supplier is the best choice."

## Why Fireseed Alpha Exists

Fireseed Alpha is the point where OrgAnchor is useful enough to be reviewed publicly, but still early enough for serious external critique to shape the protocol before it hardens.

The useful feedback now is:

- Can a real organization publish an OrgAnchor package without excessive effort?
- Can an external AI agent discover and verify it with low friction?
- Are the evidence gaps exposed clearly enough?
- Are S1-S3 practical, abuse-resistant, and not too heavy?
- Are S4/S5 directions clear enough for co-builders to improve?
- Can Directory builders help discovery without becoming a new monopoly trust gate?

## Fast Demo

```bash
npm run agent:demo
npm run visible:demo
organchor verify url https://organchor.org --compact
```

For a package-facing map, start with `README.md`, `DOCS_INDEX.md`, `FIRESEED_OUTREACH_KIT.md`, and `CAPABILITY_TRACEABILITY_MATRIX.md`.

