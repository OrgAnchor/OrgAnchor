# OrgAnchor Migration Guide

Status: Draft operator runbook.

## Purpose

This guide explains how an organization should migrate from one OrgAnchor root authority to another without breaking historical identity continuity.

Root authority migration is a governance event. It is not a routine website deploy, domain update, IPFS pin, Arweave upload, or lockfile edit.

The core rule is:

```text
The old root authority must authorize the new root authority.
```

A proposed new root authority cannot approve itself into existence.

## When Migration Is Needed

Use a root authority migration when the identity root itself changes.

Good reasons:

- Replacing a lost root member key while the old threshold can still sign.
- Replacing a compromised root member key before threshold compromise.
- Moving from `1-of-1` to a threshold authority.
- Moving from a temporary pilot authority to a durable production authority.
- Adding or removing custodians as the organization grows.
- Changing threshold policy, such as `2-of-3` to `3-of-5`.
- Preparing a future cryptographic transition.
- Restructuring organization governance.

Do not use root authority migration for ordinary carrier changes.

Use a new official endpoint statement instead when changing:

- Website URL.
- Cloudflare account or Pages project.
- IPFS CID.
- Arweave TX references.
- Onion address.
- ENS record.
- Product claims.
- Evidence manifests.

Those are important changes, but they are signed by the current root authority. They do not require changing the root authority.

## Key Terms

```text
old root authority
  The currently trusted authority that signed the existing official statements.

new root authority
  The proposed authority that will sign future official statements after migration.

migration statement
  A signed JSON artifact that links the old authority hash to the new authority hash.

migration signature
  A detached signature file produced by enough members of the old root authority.

historical statement
  A statement signed before migration. It should remain verifiable against the old authority.

current statement
  A statement signed after migration. It should verify against the new authority.
```

## Migration Principle

A valid migration proves continuity, not superiority.

It proves:

```text
The old root authority, according to its threshold rule, recognized this new root authority.
```

It does not prove:

- The organization is legally valid.
- The new custodians are trustworthy.
- The old authority was never compromised.
- The content of future claims is true.

OrgAnchor records and verifies the continuity chain. It does not replace governance judgment.

## Current v1 Capability

Implemented:

- `key rotate-plan` creates a next-authority draft for replacing one root member key.
- `authority change-plan` creates a next-authority draft for retained, removed, and added root members with an explicit threshold.
- `migrate create` creates a migration statement.
- `migrate sign` signs the migration with old root member keys.
- `migrate verify` verifies the migration against old and new authority records.
- Verification fails if the old threshold is not met.
- Verification fails if the supplied new authority does not match the migration.

Still operator-guided in v1:

- Choosing effective time.
- Republishing through IPFS, Arweave, OpenTimestamps, ENS, or Onion.
- Incident wording after compromise.

## Safety Rules

Before migration:

- Back up the old root member keys.
- Back up the current public artifacts.
- Record the old root authority hash.
- Decide whether this is a rehearsal or a real public migration.
- Use rehearsal filenames until the governance decision is final.

During migration:

- Do not overwrite `root-authority.json` silently.
- Do not delete the old root authority record.
- Do not publish private keys.
- Do not sign with the new authority and treat that as continuity.
- Do not upload draft migration artifacts to append-only archives.

After migration:

- Keep old authority records available for historical verification.
- Keep migration statements available beside current verification artifacts.
- Sign new official statements with the new authority.
- Archive the migration statement and signature after final review.

## Recommended File Layout

During rehearsal:

```text
root-authority.json
root-authority-rehearsal-next.json
statements/key-rotation-plan-rehearsal-YYYY-NNN.json
statements/migration-rehearsal-YYYY-NNN.json
statements/migration-rehearsal-YYYY-NNN.json.sig
```

For a real migration:

```text
authorities/root-authority-2026.json
authorities/root-authority-2027.json
root-authority.json
statements/migration-2027-001.json
statements/migration-2027-001.json.sig
statements/official-endpoints.json
statements/official-endpoints.json.sig
public/verify/migrations/migration-2027-001.json
public/verify/migrations/migration-2027-001.json.sig
```

After a real migration, `root-authority.json` may point to the current authority, but the old authority must remain available by stable historical filename.

## Standard Migration Flow

### 1. State The Reason

Write a short reason before running commands.

Good examples:

```text
Replace offline recovery key after custody handoff.
Move from pilot 1-of-1 authority to production 2-of-3 authority.
Remove compromised root member key before threshold compromise.
```

Bad examples:

```text
Cleaning up files.
Trying something.
Provider changed.
```

### 2. Generate Replacement Key If Needed

Example:

```bash
organchor key generate --id root-d-2027
organchor key public --key keys/root-d-2027.private.json
```

The private key must remain local and protected.

### 3. Create A Next-Authority Draft

For a single root member replacement, use the narrower rotation helper:

```bash
organchor key rotate-plan \
  --authority root-authority.json \
  --replace-key root-c-2026 \
  --new-key keys/root-d-2027.public.json \
  --out root-authority-next.json \
  --plan-out statements/key-rotation-plan-2027-001.json \
  --new-authority-id root-authority-2027
```

Review the old and new authority hashes before signing anything.

For broader authority changes, such as moving from `1-of-1` to `2-of-3` or `2-of-3` to `3-of-5`, use `authority change-plan`:

```bash
organchor authority change-plan \
  --old-authority root-authority.json \
  --add-keys keys/root-d-2027.public.json,keys/root-e-2027.public.json \
  --threshold 3 \
  --out root-authority-next.json \
  --plan-out statements/root-authority-change-plan-2027-001.json \
  --new-authority-id root-authority-2027
```

By default, `authority change-plan` keeps existing root members unless they are removed with `--remove`.

Use `--replace-all` only when the next authority should contain none of the old members:

```bash
organchor authority change-plan \
  --old-authority root-authority.json \
  --replace-all \
  --add-keys keys/root-a-2027.public.json,keys/root-b-2027.public.json,keys/root-c-2027.public.json \
  --threshold 2 \
  --out root-authority-next.json
```

`authority change-plan` requires `--threshold` explicitly. This is intentional: adding keys without thinking about the threshold can accidentally preserve a single-custodian authority.

### 4. Create The Migration Statement

```bash
organchor migrate create \
  --old-authority root-authority.json \
  --new-authority root-authority-next.json \
  --out statements/migration-2027-001.json \
  --id organchor-migration-2027-001 \
  --reason "Replace root member root-c-2026 with root-d-2027 after custody handoff." \
  --statement statements/official-endpoints.json
```

The migration statement should include:

- Old authority hash.
- New authority hash.
- Reason.
- Issued time.
- Effective time.
- Superseded statement hashes when relevant.

### 5. Sign With The Old Authority Threshold

Example for `2-of-3`:

```bash
organchor migrate sign \
  --key keys/root-a-2026.private.json \
  --old-authority root-authority.json \
  --in statements/migration-2027-001.json \
  --out statements/migration-2027-001.json.sig

organchor migrate sign \
  --key keys/root-b-2026.private.json \
  --old-authority root-authority.json \
  --in statements/migration-2027-001.json \
  --out statements/migration-2027-001.json.sig \
  --append
```

Use enough old root member keys to meet the old threshold.

### 6. Verify Continuity

```bash
organchor migrate verify \
  --old-authority root-authority.json \
  --new-authority root-authority-next.json \
  --in statements/migration-2027-001.json \
  --sig statements/migration-2027-001.json.sig
```

Expected result:

```text
PASS
```

Record:

- Migration hash.
- Old authority hash.
- New authority hash.
- Valid old-authority signatures.

### 7. Run Negative Tests

A real migration should include failure checks before publication.

Check that insufficient signatures fail:

```bash
organchor migrate verify \
  --old-authority root-authority.json \
  --new-authority root-authority-next.json \
  --in statements/migration-2027-001.json \
  --sig statements/migration-insufficient.json.sig
```

Expected result:

```text
FAIL
```

Check that the wrong new authority fails:

```bash
organchor migrate verify \
  --old-authority root-authority.json \
  --new-authority wrong-root-authority.json \
  --in statements/migration-2027-001.json \
  --sig statements/migration-2027-001.json.sig
```

Expected result:

```text
FAIL
```

These checks prove the migration is actually bound to the intended authority and threshold.

### 8. Preserve Historical Verification

Verify that old statements still verify with the old authority:

```bash
organchor statement verify \
  --authority root-authority.json \
  --in statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig
```

After migration, do not reinterpret old signatures under the new authority.

Historical statements belong to the authority that signed them.

### 9. Create A New Current Statement

After governance approval and effective time, create a new official endpoint statement bound to the new authority.

The new statement should reference current endpoints and may include migration notes.

Then sign with the new authority threshold.

### 10. Publish The Migration

Publish final migration artifacts to the same carriers used for ordinary verification:

- Traditional `/verify` page.
- `/verify/migrations/`.
- `organchor.lock.json`.
- IPFS mirror.
- Arweave archive for the small final artifacts.
- OpenTimestamps proof for the migration statement and signature.
- ENS text records or contenthash plan when used.
- Onion verify page when used.

Do not publish rehearsal artifacts as official migration artifacts.

When generating `/verify`, include the final migration artifacts:

```bash
organchor page generate \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority-next.json \
  --migration statements/migration-2027-001.json \
  --migration-sig statements/migration-2027-001.json.sig \
  --out public/verify
```

The page generator verifies that the migration is signed by the old authority threshold and that the migration chain ends at the current root authority. It refuses to include migration history that does not connect to the current root.

## Publication Order For A Real Migration

Recommended order:

1. Freeze old public artifacts.
2. Create next authority.
3. Create and sign migration with old threshold.
4. Verify positive and negative cases.
5. Create new official endpoint statement with new authority.
6. Sign new statement with new threshold.
7. Generate updated `/verify`.
8. Include migration history in `/verify`.
9. Deploy to traditional website.
10. Mirror to IPFS.
11. Archive final small artifacts to Arweave.
12. Stamp hashes with OpenTimestamps.
13. Update ENS or Onion guidance if used.
14. Publish a human-readable migration note.

## Human Approval Gates

Pause for human approval before:

- Promoting a rehearsal authority to public use.
- Replacing the public `root-authority.json`.
- Publishing migration artifacts to Arweave.
- Declaring a compromised key.
- Declaring threshold compromise.
- Changing threshold policy.
- Removing a custodian from the authority set.

## Key Loss Cases

### One Key Lost In 2-of-3

If two valid old keys remain, migration can preserve continuity.

Recommended action:

- Generate a replacement key.
- Create a next-authority draft.
- Sign migration with the remaining two old keys.
- Publish migration after review.

### Two Keys Lost In 2-of-3

If the old threshold can no longer sign, normal cryptographic continuity may be broken.

Recommended action:

- Use any pre-planned recovery path.
- Publish a disclosure through every still-controlled carrier.
- Use historical archives and timestamps to explain the situation.
- Establish a new root authority with clear wording that continuity could not be cryptographically migrated.

## Compromise Cases

### One Key Compromised In 2-of-3

If the attacker has only one key, they cannot sign alone, but the organization should act quickly.

Recommended action:

- Stop using the compromised key.
- Create a next authority without that key.
- Sign migration with an uncompromised old threshold.
- Publish incident wording and migration artifacts.
- Archive the final migration.

### Threshold Compromised

If enough old keys are compromised to satisfy threshold, OrgAnchor cannot prove a clean migration by signatures alone.

Recommended action:

- Treat it as an identity-root incident.
- Publish disclosures through all still-controlled carriers.
- Use Arweave, OpenTimestamps, old website records, third-party attestations, and public history to explain the timeline.
- Establish a new root authority with explicit disclosure.

Do not describe this as a normal verified migration.

## Self-Pilot Rehearsal Result

OrgAnchor rehearsed migration locally on 2026-05-14.

The rehearsal:

- Replaced one root member in a next-authority draft.
- Signed the migration with `2-of-3` old root members.
- Verified the correct migration successfully.
- Confirmed insufficient signatures failed.
- Confirmed a wrong new authority failed.
- Confirmed the existing official statement remained verifiable against the current public authority.

The report is stored in the separate self-pilot workspace:

```text
E:\CivX\OrgAnchor-self-pilot\migration-rehearsal-report.md
```

## Plain-Language Summary

Root authority migration is how an organization says:

```text
The same organizational identity continues, but the signing authority has changed.
```

The trust comes from the old authority signing the transition.

Domains, IPFS, Arweave, ENS, Onion, and lockfiles help carry and preserve the evidence. They do not create the continuity by themselves.
