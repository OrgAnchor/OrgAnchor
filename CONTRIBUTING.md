# Contributing To OrgAnchor

Status: Active Fireseed contributor guide.

## Purpose

OrgAnchor is currently in Fireseed Alpha.

Fireseed Alpha means:

```text
the minimum public loop is visible;
the unfinished boundaries are explicit;
outside adopters, technical reviewers, and evidence/governance critics can start improving the project.
```

This is not stable v1. OrgAnchor is not a certification service, marketplace, product-quality oracle, or central trust authority.

## Ground Rules

- Do not submit private keys, recovery codes, provider tokens, wallets, payment records, customer-private data, or confidential organization evidence.
- Do not describe OrgAnchor compatibility as a trust badge, official quality rating, or proof that an organization is good or truthful.
- Keep broad design changes tied to the project north star: lower-friction discovery, verification, and evidence review for third-party AI agents and people.
- Open an issue before large protocol, schema, command, or documentation-architecture changes.
- Prefer small pull requests with tests or concrete before/after examples.

## Contributor Paths

### 1. Adopting Organization Trial

Use this path if you want to try OrgAnchor for a real or realistic organization.

From a source checkout, start with:

```bash
npm ci
npm run agent:demo
```

From the published alpha package, start with:

```bash
npm install -g organchor@alpha
organchor --help
```

Then follow `ADOPTION_GUIDE.md`, `ORG_ONBOARDING_CHECKLIST.md`, and `EXTERNAL_PILOT_RUNBOOK.md`.

Use `FIRESEED_READINESS_GATE.md` to distinguish Fireseed launch blockers from normal alpha feedback.

The current named-outreach decision is recorded in `FIRESEED_LAUNCH_DECISION_2026-06-01.md`.

Useful issue type:

```text
Adopter Trial / Fireseed
```

Report:

- What kind of organization or product/service you tried to represent.
- Whether you could create a root authority, statement, `/verify` package, Beacon, claims, evidence, and S1-S3 records.
- Which step was confusing, too heavy, or impossible.
- Whether a third-party AI agent could verify the public package without private context.

### 2. Technical Review

Use this path if you are reviewing implementation correctness.

Good review targets:

- Canonical JSON and duplicate-key rejection.
- Ed25519 signing and verification.
- Threshold root authority and migration verification.
- `/verify` and `/.well-known/organchor.json` machine-readable output.
- `organchor verify url --compact` output stability.
- Package contents, release checks, and npm trusted publishing workflow.

Before opening a technical PR, run:

```bash
npm ci
npm run typecheck
npm test
npm run package:smoke
```

Useful issue type:

```text
Technical Review / Fireseed
```

Include exact command output, fixture paths, and expected versus actual behavior.

If a finding makes any required readiness gate fail, call that out explicitly.

### 3. Evidence And Governance Review

Use this path if you are testing whether the evidence model can survive real-world abuse, low-effort adoption, or misleading claims.

Good review targets:

- S1 first-party evidence minimum package and optional extensions.
- S2 organization-submitted third-party material and route gaps.
- S3 random purchase / sampling records, bounded sample pools, nullifiers, and anti-brushing limits.
- S4 real-use observation boundaries.
- S5 public challenge and negative-evidence boundaries.
- Directory and Beacon incentives, capture risks, and stale-package risks.

Useful issue type:

```text
Evidence / Governance Review
```

Report the smallest concrete scenario that breaks clarity, creates misleading confidence, or imposes unnecessary cost on honest adopters.

Use `FIRESEED_READINESS_GATE.md` to separate S1-S3 acceptance-gate issues from S4/S5 design-preview issues.

## Pull Request Checklist

Before opening a pull request:

- Keep `npm run typecheck` and `npm test` green.
- Run `npm run package:smoke` when package-facing files, examples, schemas, CLI output, or release files change.
- Update `DOCS_INDEX.md` when adding package-facing documentation.
- Update `package.json` `files` when a new document should ship in the npm package.
- Add or update tests for public contracts, schemas, CLI output, or documentation gates.
- State whether the change affects Fireseed Alpha scope, stable v1 scope, or post-v1 design only.

## Scope Boundaries

OrgAnchor welcomes work that improves:

- Organization-controlled identity continuity.
- Public signed endpoint statements.
- Root authority migration.
- AI-agent-readable verification.
- Claims, evidence, methods, and gap reporting.
- Beacon discoverability.
- Open Directory interoperability without central trust privilege.
- S1-S3 Fireseed evidence baseline.
- S4/S5 design clarity and future co-builder paths.

OrgAnchor should not expand into:

- A central certification authority.
- A hosted supplier marketplace.
- A universal ranking or recommendation monopoly.
- A SaaS user-account system.
- A complete DID wallet or VC issuance platform.
- A product-quality oracle.
- A replacement for buyer policy, legal review, safety review, or procurement judgment.
