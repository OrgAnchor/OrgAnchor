# OrgAnchor Adoption Model

Status: Accepted direction.

## Purpose

This document defines how another organization can adopt OrgAnchor without needing to understand every underlying technology.

OrgAnchor should not remain a one-off self-pilot. The goal is a repeatable adoption path:

```text
organization root authority
signed official endpoint statement
static /verify page
machine-readable claims and evidence manifests
publish receipts across practical carriers
clear migration path
```

The adopting organization remains the identity root. OrgAnchor, domains, Cloudflare, IPFS, Arweave, ENS, Onion, and lockfiles are supporting tools.

## Visibility Requirement

Adoption should not feel like invisible background magic.

Every adoption level should leave visible confirmation for humans and structured confirmation for machines:

- What was generated.
- What was signed.
- Which threshold was satisfied.
- Which carriers were published, prepared, or skipped.
- Which checks passed, warned, failed, or still require manual review.
- Which artifacts a third party can inspect.

This matters because a correct setup and a fake setup can look similar to a non-expert if the output is only a folder full of JSON. OrgAnchor should make the evidence trail visible without asking the user to become a cryptographer.

## Adoption Surfaces

OrgAnchor should support three adoption surfaces.

### 1. CLI Adoption

For technical users and maintainers.

Expected flow:

```bash
organchor init
organchor key generate
organchor authority create
organchor statement create
organchor statement sign
organchor page generate
organchor mirror ipfs publish
organchor archive arweave publish
organchor domain audit
```

This is the current implementation center.

### 2. Operator Runbook Adoption

For real organizations with limited technical depth.

The operator should follow a checklist instead of learning the carrier stack.

Required future materials:

```text
ADOPTION_GUIDE.md
EXTERNAL_PILOT_RUNBOOK.md
ORG_ONBOARDING_CHECKLIST.md
ROOT_AUTHORITY_CUSTODY_GUIDE.md
PUBLISHING_GUIDE.md
DOMAIN_HARDENING_GUIDE.md
EVIDENCE_ONBOARDING_GUIDE.md
```

Current status:

```text
ADOPTION_GUIDE.md: drafted
EXTERNAL_PILOT_RUNBOOK.md: drafted
ORG_ONBOARDING_CHECKLIST.md: drafted
ROOT_AUTHORITY_CUSTODY_GUIDE.md: drafted
PUBLISHING_GUIDE.md: drafted
DOMAIN_HARDENING_GUIDE.md: drafted
EVIDENCE_ONBOARDING_GUIDE.md: drafted
```

The runbook must separate:

- What OrgAnchor can automate.
- What an operator must decide.
- What requires provider account access.
- What requires payment or terms acceptance.
- What must never be uploaded.

### 3. Future Local-First Studio

For non-technical organizations.

The Studio should guide users through:

- Organization profile.
- Root authority mode.
- Key custody warnings.
- Statement generation.
- `/verify` page generation.
- Evidence manifest setup.
- Carrier publishing receipts.
- Domain audit results.
- Migration planning.

The Studio must not become the identity root. It is only a safer interface over the same open files and CLI-verifiable artifacts.

## Adoption Levels

OrgAnchor should offer clear levels rather than one vague "setup complete" state.

### Level 1: Minimal Verifiable Identity

Purpose:

Create a root authority and a signed official endpoint statement.

Required:

- `root-authority.json`
- `statements/official-endpoints.json`
- `statements/official-endpoints.json.sig`
- `public/verify/index.html`
- Visible proof trail on `/verify`
- CLI verification pass

Not required:

- Arweave.
- IPFS.
- ENS.
- Onion.
- Full evidence model.

Use case:

Small projects, early pilots, internal tests.

### Level 2: Public Verification Presence

Purpose:

Make the signed statement discoverable through a normal website.

Required:

- Level 1.
- Traditional website or static hosting.
- `/verify/` public endpoint.
- `/.well-known/organchor.json` if available.
- Domain audit report.

Use case:

Organizations that want a public verification page but are not yet ready for full carrier redundancy.

### Level 3: Mirrored and Archived Identity

Purpose:

Reduce single-carrier risk.

Required:

- Level 2.
- IPFS mirror receipt.
- Arweave manual package or real TX receipts.
- `organchor.lock.json` publish receipts.
- Claims and evidence manifests if the organization needs product/service credibility.

Use case:

Public-facing organizations that want identity continuity across domain/platform changes.

### Level 4: Disaster Recovery and Auxiliary Names

Purpose:

Add external-world resilience.

Required:

- Level 3.
- Onion address plan or deployed onion service.
- ENS plan or verification snapshot when relevant.
- Updated domain hardening.

Use case:

Organizations exposed to platform, registrar, hosting, or jurisdictional risk.

### Level 5: Governance and Migration Ready

Purpose:

Support long-lived organizations.

Required:

- Threshold root authority.
- Backup and custody plan.
- Migration statements.
- Root authority rotation plan.
- Historical verification plan.

Use case:

Organizations that expect leadership changes, custody changes, legal restructuring, or long time horizons.

## Standard Adoption Package

An OrgAnchor adoption package should contain:

```text
organchor.config.json
root-authority.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
claims/product-claims.json
claims/product-claims.json.sig
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
public/verify/
organchor.lock.json
reports/domain-security-report.json
reports/domain-security-report.md
arweave-manifest.json
anchors/opentimestamps/
```

Private files must stay outside the public package:

```text
keys/*.private.json
arweave-wallet.local.json
provider tokens
cloud credentials
payment data
```

## Human Approval Gates

OrgAnchor or an agent may prepare files and commands, but a human must approve:

- Buying or transferring a domain.
- Accepting provider terms.
- Starting subscriptions.
- Making payments.
- Publishing official root authority material for the first time.
- Rotating or replacing root authority keys.
- Publishing legal, medical, financial, regulatory, or high-stakes claims.
- Uploading content to append-only systems such as Arweave.

## Agent-Assisted Adoption

An AI agent can help with:

- Preparing configuration.
- Generating statements.
- Running verification.
- Producing reports.
- Publishing static files when credentials are provided.
- Recording receipts.
- Explaining provider choices.

An AI agent must not:

- Become the root authority.
- Store secrets in public artifacts.
- Bypass payment confirmation.
- Claim that carrier publication proves objective truth.
- Replace organizational governance.

## Replication Promise

OrgAnchor should eventually let a new organization say:

```text
I do not understand Arweave, IPFS, ENS, or Tor.
I understand that my organization has a root authority.
OrgAnchor guided me to publish signed statements and verifiable evidence across carriers.
Another party can independently verify the result.
```

That is the adoption target.
