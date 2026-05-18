# OrgAnchor Root Authority Custody Guide

Status: Draft custody guide.

## Purpose

This guide explains how an organization should think about OrgAnchor root authority custody.

The root authority is the long-term identity continuity root. If root authority custody is sloppy, every carrier integration becomes less meaningful.

## Core Rule

Do not confuse root authority keys with provider credentials.

Root authority keys sign organizational statements.

Provider credentials publish or host files.

Examples of provider credentials:

- Cloudflare API token.
- GitHub token.
- Pinata JWT.
- Arweave/Turbo upload wallet.
- ENS wallet.

These are not root authority keys.

## Root Authority Models

### 1-of-1

One private key can sign official statements.

Use only for:

- Local rehearsal.
- Very small early projects.
- Disposable demos.

Risks:

- If the key is lost, the organization can be stuck.
- If the key is compromised, an attacker can sign false statements.
- If one person controls the key, governance depends on that person.

### 2-of-3

Three independent root member keys exist. Any two can sign.

Recommended for:

- Public pilots.
- Small organizations with more than one responsible operator.
- Projects that need practical resilience without heavy governance.

Benefits:

- One lost key does not freeze the organization.
- One compromised key cannot sign alone.
- No single person needs to share a secret.

Risks:

- Two colluding members can sign.
- Poor custody can still lose multiple keys.
- Internal disputes require governance rules outside OrgAnchor.

### m-of-n

General threshold authority.

Use for:

- Mature organizations.
- Multisig-like governance.
- Separate operational, legal, and technical stakeholders.

Risks:

- Too high a threshold can cause deadlock.
- Too low a threshold can cause capture.
- Keyholder changes require migration planning.

## Custody Roles

Every root member key should have a custody role.

Examples:

```text
technical maintainer key
organization officer key
offline recovery key
board or foundation key
legal custodian key
```

Avoid vague custody:

```text
someone has it
stored somewhere
shared in a password manager
kept in chat history
```

## Storage Rules

Root private keys should be:

- Generated locally.
- Stored encrypted where possible.
- Backed up offline.
- Excluded by `.gitignore`.
- Never pasted into chat.
- Never uploaded to cloud dashboards.
- Never bundled into `/verify`.
- Never uploaded to IPFS or Arweave.

Root private keys should not be:

- Stored in the source repository.
- Stored in provider credentials files.
- Stored in `organchor.lock.json`.
- Mixed with upload wallets.
- Shared by email.
- Shared as screenshots.

## Backup Rules

Each root member key needs a backup plan.

Minimum:

- One primary local copy.
- One offline backup.
- Clear recovery instructions.

Better:

- Encrypted offline backup.
- Separate physical location.
- Written custody record.
- Periodic restore test.

Do not rely on memory, one laptop, or one cloud account.

## Loss Scenarios

### One Key Lost in 2-of-3

The organization can still sign with the remaining two keys.

Recommended response:

- Create a root authority migration plan.
- Introduce a replacement key.
- Sign the migration with the remaining valid threshold.
- Archive the migration statement.

### Two Keys Lost in 2-of-3

The old root authority may no longer be able to sign migration.

Recommended response:

- Use any pre-existing recovery plan.
- If no threshold can sign, continuity may be broken.
- Publish an incident explanation through every still-controlled carrier.

This is why backups matter.

## Compromise Scenarios

### One Key Compromised in 2-of-3

An attacker cannot sign alone, but risk is serious.

Recommended response:

- Stop using the compromised key.
- Sign a migration to a new root authority with uncompromised threshold.
- Publish the migration through `/verify`, IPFS, Arweave, and other carriers.
- Mark old key as compromised in the migration record.

### Threshold Compromised

If enough keys are compromised to satisfy the threshold, attackers can sign false statements.

Recommended response:

- Treat as identity-root incident.
- Publish incident reports through all still-controlled channels.
- Use external evidence and historical anchors to explain timeline.
- Establish a new root authority only with clear disclosure.

OrgAnchor cannot magically preserve continuity after threshold compromise. It can help make the incident traceable.

## Rotation and Migration

Root authority changes should happen through migration statements.

A proper migration should include:

- Old root authority hash.
- New root authority hash.
- Reason for migration.
- Effective time.
- Signatures from the old authority threshold.
- Signatures from the new authority if supported.
- References to archived historical statements.

Do not silently replace `root-authority.json` without a signed migration.

Technical flow:

```bash
organchor key rotate-plan \
  --authority root-authority.json \
  --replace-key root-c \
  --new-key keys/root-d.public.json \
  --out root-authority-next.json

# For broader changes such as 1-of-1 -> 2-of-3 or 2-of-3 -> 3-of-5:
organchor authority change-plan \
  --old-authority root-authority.json \
  --add-keys keys/root-d.public.json,keys/root-e.public.json \
  --threshold 3 \
  --out root-authority-next.json

organchor migrate create \
  --old-authority root-authority.json \
  --new-authority root-authority-next.json

organchor migrate sign \
  --key keys/root-a.private.json \
  --old-authority root-authority.json \
  --in statements/migration-2026-001.json

organchor migrate sign \
  --key keys/root-b.private.json \
  --old-authority root-authority.json \
  --in statements/migration-2026-001.json \
  --append

organchor migrate verify \
  --old-authority root-authority.json \
  --new-authority root-authority-next.json \
  --in statements/migration-2026-001.json \
  --sig statements/migration-2026-001.json.sig
```

`key rotate-plan` only prepares the next root authority draft. The old root authority migration signatures are what create continuity.

For the full operator runbook, including rehearsal, negative tests, publication order, and compromise cases, see `MIGRATION_GUIDE.md`.

## Operational Separation

Keep these separate:

```text
root authority keys
Arweave/Turbo upload wallet
Cloudflare API credentials
IPFS pinning tokens
ENS wallet
GitHub tokens
```

If a carrier credential leaks, rotate that carrier credential.

If a root authority key leaks, publish a signed migration or incident response.

The response levels are different.

## Recommended Public Pilot Setup

For an organization similar to the OrgAnchor self-pilot:

```text
2-of-3 root authority
key A: technical operator
key B: project owner or governance representative
key C: offline recovery custodian
```

Initial launch can be done by two keys.

Key C should remain offline unless needed.

## Custody Checklist

- [ ] Root authority mode chosen.
- [ ] Each root member key has a named custodian.
- [ ] No private key is shared between custodians.
- [ ] Every custodian understands the key purpose.
- [ ] Backups exist.
- [ ] Restore process is documented.
- [ ] Compromise process is documented.
- [ ] Migration process is documented.
- [ ] Carrier credentials are stored separately.
- [ ] Public artifacts contain only public key material.

## Plain-Language Summary

OrgAnchor works only if the organization can keep its root authority meaningful over time.

The root authority should be treated like the organization's public continuity seal.

Carriers can change. Domains can change. Platforms can fail. Provider accounts can be rotated.

The root authority is what lets the organization explain those changes in a way others can verify.
