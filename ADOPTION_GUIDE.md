# OrgAnchor Adoption Guide

Status: Draft operator guide.

## Purpose

This guide explains how a real organization can adopt OrgAnchor.

The reader does not need to understand IPFS, Arweave, ENS, Onion, or OpenTimestamps in detail. The important idea is:

```text
The organization controls a root authority.
The root authority signs official endpoint statements.
Everything else helps publish, mirror, archive, or discover those statements.
```

OrgAnchor does not replace domains, legal registration, government records, or normal security operations. It reduces single-carrier identity risk and makes endpoint changes more verifiable.

Adoption should also reflect the project values in `PURPOSE_AND_VALUES.md`: OrgAnchor is strongest when used by organizations willing to publish evidence, accept long-term scrutiny, and correct history visibly instead of treating signed continuity as a trust badge.

## Who Should Adopt First

Good early adopters:

- Open-source projects.
- Research groups.
- Public-interest organizations.
- Small companies with technical operators.
- Organizations that already publish public technical artifacts.
- Organizations willing to publish structured claims, evidence, limitations, and corrections.

Wait or use a pilot-only setup if:

- The organization cannot safely back up keys.
- The organization has unresolved internal authority disputes.
- The organization needs legal identity verification as the primary goal.
- The organization wants a hosted account system rather than a local-first toolchain.
- The organization mainly wants credibility theater without public evidence.

## Adoption Levels

Choose one level before starting.

### Level 1: Minimal Verifiable Identity

Use this when the organization only needs a signed official endpoint statement.

Deliverables:

```text
root-authority.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
public/verify/
```

Minimum success:

```text
organchor statement verify
```

### Level 2: Public Verification Presence

Use this when the organization wants a normal public `/verify` page.

Adds:

```text
website /verify deployment
domain-security-report.json
domain-security-report.md
```

Minimum success:

```text
https://example.org/verify/
```

loads the public verification package and local CLI verification still passes.

### Level 3: Mirrored and Archived Identity

Use this when the organization wants practical resilience.

Adds:

```text
IPFS mirror receipt
Arweave manual package or TX receipts
organchor.lock.json
OpenTimestamps proofs
```

Minimum success:

- The website version verifies.
- At least one IPFS or pinning-provider mirror is recorded.
- Critical signed artifacts are archived or prepared for Arweave.
- Receipts are written without secrets.

### Level 4: Disaster Recovery and Auxiliary Names

Use this when the organization needs alternative access paths.

Adds:

```text
onion config or deployed onion service
ENS plan or verification snapshot
updated domain hardening
```

Minimum success:

- Onion and ENS are documented as carriers, not identity roots.
- Domain audit separates automatic checks from manual checks.

### Level 5: Governance and Migration Ready

Use this when the organization expects leadership or custody changes.

Adds:

```text
threshold root authority
root custody plan
migration statements
rotation plan
historical verification plan
```

Minimum success:

- A future root authority can be linked to the old one by signed migration.
- Historical statements remain verifiable.

## Recommended First Adoption Path

For most organizations:

```text
Start with Level 2.
Move to Level 3 after the first public verification page works.
Move to Level 5 before depending on OrgAnchor for long-term governance.
```

OrgAnchor's own self-pilot is now a Level 3-style pilot with real website, IPFS, Arweave/Turbo, signed claims, signed evidence, and receipt tracking. It is not v1 complete until Stage 5 guidance and packaging are finished.

The self-pilot has also rehearsed root authority migration locally. Organizations that want Level 5 should read `MIGRATION_GUIDE.md` before any real root change.

For the first low-risk external organization pilot, use `EXTERNAL_PILOT_RUNBOOK.md`. This guide explains the model and levels; the external pilot runbook is the concrete shortest path for copying the self-pilot pattern.

## Step-by-Step Operator Flow

### 1. Create a Separate Adoption Workspace

Do not create real organization private keys inside the source repository.

Example:

```text
source repository: ./OrgAnchor
adoption workspace: ./ExampleOrg-OrgAnchor
```

The adoption workspace contains real artifacts, local secrets, provider tokens, and publish receipts.

### 2. Decide the Root Authority Mode

Small early organization:

```text
1-of-1 root authority
```

Recommended public pilot:

```text
2-of-3 root authority
```

Long-lived organization:

```text
m-of-n root authority with documented custody
```

Do not let multiple people share the same private key.

### 3. Generate Keys Locally

Generate root member keys only on trusted local machines.

Never upload root private keys to:

- Website hosting providers.
- GitHub.
- Cloudflare.
- IPFS.
- Arweave.
- Pinning providers.
- Chat tools.
- Issue trackers.

### 4. Create and Sign the Official Endpoint Statement

The statement says:

```text
This organization currently recognizes these official endpoints.
```

It does not prove the organization is good, legal, effective, or endorsed by anyone.

### 5. Generate `/verify`

Generate a static verification package.

Publish it to a normal website first.

The page should help humans, but the JSON files beside it are what machines and AI agents need.

### 6. Run Local Verification

Before public publishing, verify:

- Root authority record is valid.
- Statement signatures satisfy the threshold.
- Statement hash is stable.
- Tampering fails.
- Verify page contains the expected public artifacts.
- No private key is in `public/verify`.

### 7. Publish the Traditional Website Carrier

Deploy:

```text
public/verify/
```

to:

```text
https://example.org/verify/
```

This is a discovery carrier, not the root authority.

### 8. Run Domain Audit

Run:

```bash
organchor domain audit example.org
```

Treat results as risk control.

Registry Lock, billing, registrar 2FA, and auto-renewal may require manual checks.

### 9. Mirror with IPFS

Mirror the small verification package.

Best practice:

- Keep `public/verify` small.
- Use large external evidence artifacts only when explicitly needed.
- Record CIDs in `organchor.lock.json`.
- Do not claim IPFS guarantees availability.

### 10. Archive Critical Artifacts to Arweave

Archive small final public artifacts:

- Statement.
- Signature.
- Root authority.
- Claims manifest.
- Evidence manifest.
- Arweave manifest.

Do not upload private, draft, or legally risky material by mistake.

Corrections should be new signed statements, not edits to old archived content.

### 11. Stamp Key Hashes with OpenTimestamps

Stamp important hashes.

Remember:

```text
OpenTimestamps proves hash existence before a time.
It does not store content.
It does not prove a claim is true.
```

### 12. Create Claims and Evidence Manifests

If the organization wants to make public product/service claims, keep them separate from official endpoints.

Claims and evidence should include:

- Claim scope.
- Limitations.
- Evidence ids.
- Evidence issuer type.
- Artifact hash.
- Artifact location.
- Value audit status for unsupported, first-party-only, stale, or non-reproducible evidence.

This is the AI-agent-friendly layer.

### 13. Publish the Adoption Status

Create a human-readable status report:

```bash
organchor adoption status \
  --verify-dir public/verify \
  --origin https://example.org \
  --level 3 \
  --out ADOPTION_STATUS.md \
  --json reports/adoption-status-report.json
```

The command checks the local adoption workspace, writes a public `ADOPTION_STATUS.md`, and writes a machine-readable report for AI agents and maintainers. It summarizes the root authority hash, statement hash, verification URL, carrier receipts, domain audit, value evidence, discovery surfaces, and known gaps for the selected adoption level.

This status is not a trust badge. It is a transparent workspace health report; external agents still verify the origin package and apply their own policy.

### 14. Plan Migration

Before relying on OrgAnchor long term, document:

- Who controls each root member key.
- What happens if one key is lost.
- What happens if one key is compromised.
- How a new root authority will be introduced.
- How historical statements remain verifiable.

The technical migration flow is:

```bash
organchor authority change-plan --old-authority root-authority.json --add-keys keys/new-root-d.public.json,keys/new-root-e.public.json --threshold 3 --out root-authority-next.json
organchor migrate create --old-authority root-authority.json --new-authority root-authority-next.json
organchor migrate sign --key keys/old-root-a.private.json --old-authority root-authority.json --in statements/migration-2026-001.json
organchor migrate sign --key keys/old-root-b.private.json --old-authority root-authority.json --in statements/migration-2026-001.json --append
organchor migrate verify --old-authority root-authority.json --new-authority root-authority-next.json --in statements/migration-2026-001.json --sig statements/migration-2026-001.json.sig
```

For the full operator sequence, including rehearsal, negative tests, publication order, and compromise cases, use `MIGRATION_GUIDE.md`.

## Human Approval Gates

Pause for a human decision before:

- Buying a domain.
- Accepting provider terms.
- Paying for storage or subscriptions.
- Uploading to append-only archives.
- Publishing official root authority material for the first time.
- Rotating root authority keys.
- Publishing high-stakes claims.

## What Good Looks Like

A successful adoption should let a third party say:

```text
I can find the organization's verification package.
I can verify the signed statement against the root authority.
I can see where the statement and evidence were mirrored or archived.
I can distinguish the organization's own claims from third-party evidence.
I can follow migration history if the official endpoints changed.
```

That is the product experience OrgAnchor should optimize for.
