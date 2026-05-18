# OrgAnchor External Pilot Runbook

Status: Draft repeatable path for the first low-risk external organization pilot.

## Purpose

This runbook is the shortest practical path for helping a real organization copy the OrgAnchor self-pilot pattern.

It is written for an operator or assisting agent. The adopting organization does not need to understand every carrier. It must understand one rule:

```text
The organization's root authority is the identity root.
Domains, Cloudflare, IPFS, Arweave, OpenTimestamps, Onion, ENS, and lockfiles are carriers, receipts, mirrors, archives, or discovery surfaces.
```

## Target Outcome

At the end of a successful first pilot, the organization has:

```text
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
arweave-manifest.json or Arweave TX receipts
anchors/opentimestamps/
ADOPTION_STATUS.md
```

The public must be able to visit:

```text
https://example.org/verify/
```

and an independent verifier must be able to run:

```bash
organchor statement verify \
  --authority root-authority.json \
  --expected-authority-hash sha256:<ROOT_AUTHORITY_HASH> \
  --in official-endpoints.json \
  --sig official-endpoints.json.sig
```

## Pilot Level

The first external pilot should target:

```text
Level 3: Mirrored and Archived Identity
```

That means:

- A public website `/verify` page works.
- The signed statement verifies locally and from copied public artifacts.
- The default `public/verify` package is mirrored to IPFS.
- Critical signed artifacts are archived to Arweave or prepared as a manual package.
- Claims and evidence manifests are signed if the organization has public product/service claims.
- A root authority migration is rehearsed locally before long-term reliance, but no real migration is published unless governance requires it.

## Roles

Minimum roles:

- Organization decision maker: approves public wording, domain, payments, append-only uploads, and root authority membership.
- Technical operator: runs commands, deploys static files, records receipts.
- Root authority member or custodian: controls a root private key.

For a small organization, one person may hold multiple roles. The roles should still be named explicitly.

## Human Approval Gates

Pause for human approval before:

- Buying or transferring a domain.
- Accepting provider terms.
- Starting subscriptions.
- Making payments.
- Publishing the first official root authority statement.
- Uploading anything to Arweave or another append-only archive.
- Publishing legal, medical, financial, regulatory, or high-stakes claims.
- Replacing or migrating root authority keys.

An assisting agent may prepare commands and files, but these gates are organizational decisions.

## Workspace Layout

Keep source code and adoption artifacts separate.

Example:

```text
source repository: E:\CivX\OrgAnchor
adoption workspace: E:\CivX\ExampleOrg-OrgAnchor
```

The adoption workspace may contain provider tokens, publish receipts, upload wallets, and real public artifacts.

Never put real root private keys in the source repository.

## Private and Public Files

Private local-only:

```text
keys/*.private.json
provider tokens
cloud credentials
arweave-wallet.local.json
payment data
```

Public by design:

```text
root-authority.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
claims/product-claims.json
claims/product-claims.json.sig
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
public/verify/
reports/
organchor.lock.json
```

## 1. Prepare the Organization Profile

Decide:

```text
organization canonical name
organization display name
short description
primary domain
security contact
official website
verify URL
GitHub or source repository URL
documentation URL
API URL if any
claims that require evidence
```

Edit `organchor.config.json` after `init`.

Do not put marketing claims, product effectiveness claims, or customer promises directly into the official endpoint statement. Put those in signed claims and evidence manifests.

## 2. Initialize the Adoption Workspace

From the adoption workspace:

```bash
organchor init
```

If using the source checkout directly before npm packaging:

```bash
node E:\CivX\OrgAnchor\src\cli.ts init
```

Then edit:

```text
organchor.config.json
```

Visible check:

- `.gitignore` exists.
- Private key patterns are ignored.
- The organization profile is accurate.

## 3. Choose Root Authority Mode

Recommended for the first serious public pilot:

```text
2-of-3 root authority
```

Acceptable for a small early pilot:

```text
1-of-1 root authority
```

Use `1-of-1` only when the organization understands that losing or leaking the key is a severe continuity event.

Do not let multiple people share the same root private key. Use multiple independent keys and a threshold.

## 4. Generate Root Member Keys

For a simple `1-of-1` pilot:

```bash
organchor key generate --id root-2026
organchor authority create \
  --key keys/root-2026.private.json \
  --out root-authority.json
```

For a `2-of-3` pilot:

```bash
organchor key generate --id root-a-2026
organchor key generate --id root-b-2026
organchor key generate --id root-c-2026
organchor authority create \
  --keys keys/root-a-2026.private.json,keys/root-b-2026.private.json,keys/root-c-2026.private.json \
  --threshold 2 \
  --out root-authority.json
```

Visible check:

```bash
organchor authority verify --authority root-authority.json
```

Record:

```text
root authority hash
threshold
root member key ids
custody owner for each key
```

## 5. Create and Sign the Official Endpoint Statement

```bash
organchor statement create \
  --config organchor.config.json \
  --authority root-authority.json \
  --out statements/official-endpoints.json
```

For `1-of-1`:

```bash
organchor statement sign \
  --key keys/root-2026.private.json \
  --authority root-authority.json \
  --in statements/official-endpoints.json \
  --out statements/official-endpoints.json.sig
```

For `2-of-3`:

```bash
organchor statement sign \
  --key keys/root-a-2026.private.json \
  --authority root-authority.json \
  --in statements/official-endpoints.json \
  --out statements/official-endpoints.json.sig

organchor statement sign \
  --key keys/root-b-2026.private.json \
  --authority root-authority.json \
  --in statements/official-endpoints.json \
  --out statements/official-endpoints.json.sig \
  --append
```

Verify:

```bash
organchor statement verify \
  --authority root-authority.json \
  --in statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig
```

Visible check:

- Verification prints `PASS`.
- Valid signature count meets the threshold.
- Statement root authority hash matches `root-authority.json`.

## 6. Create Claims and Evidence Manifests

If the organization has product/service claims, create the AI-agent-readable evidence layer.

```bash
organchor claims create --config organchor.config.json
organchor evidence create --config organchor.config.json
```

Add evidence:

```bash
organchor evidence add \
  --file README.md \
  --id evidence-001
```

For externally hosted large evidence:

```bash
organchor evidence add \
  --file demo.mp4 \
  --uri https://example.org/evidence/demo.mp4 \
  --location-type https \
  --id evidence-video-001
```

Sign and verify:

```bash
organchor claims sign --key keys/root-a-2026.private.json --authority root-authority.json
organchor claims sign --key keys/root-b-2026.private.json --authority root-authority.json --append
organchor evidence sign --key keys/root-a-2026.private.json --authority root-authority.json
organchor evidence sign --key keys/root-b-2026.private.json --authority root-authority.json --append

organchor evidence verify \
  --authority root-authority.json \
  --in evidence/evidence-manifest.json \
  --sig evidence/evidence-manifest.json.sig

organchor claims verify \
  --authority root-authority.json \
  --in claims/product-claims.json \
  --sig claims/product-claims.json.sig \
  --evidence evidence/evidence-manifest.json
```

For a `1-of-1` pilot, sign claims and evidence with `keys/root-2026.private.json` instead of the two appended `root-a` and `root-b` signatures.

Visible check:

- Claims and evidence verification print `PASS`.
- Large evidence is hash-bound, not blindly trusted because of location.

## 7. Generate the Public Verify Package

```bash
organchor page generate \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority.json \
  --claims claims/product-claims.json \
  --claims-sig claims/product-claims.json.sig \
  --evidence evidence/evidence-manifest.json \
  --evidence-sig evidence/evidence-manifest.json.sig \
  --out public/verify
```

Visible checks:

- `public/verify/index.html` exists.
- `public/verify/organchor.json` exists.
- The page shows Visible Proof Trail.
- The page shows Root Continuity.
- `organchor.json` includes `visible_proof` and `root_continuity`.
- No private key appears anywhere inside `public/verify`.

Machine check:

```bash
organchor statement verify \
  --authority public/verify/root-authority.json \
  --expected-authority-hash sha256:<ROOT_AUTHORITY_HASH> \
  --in public/verify/official-endpoints.json \
  --sig public/verify/official-endpoints.json.sig
```

## 8. Publish the Traditional Website Carrier

Deploy:

```text
public/verify/
```

to:

```text
https://example.org/verify/
```

Recommended companion files:

```text
/.well-known/organchor.json
/.well-known/security.txt
/security.txt
/robots.txt
/sitemap.xml
```

Important policy:

- Do not globally block AI agents from `/verify/*`.
- Do not put private keys or provider tokens into the static site.
- Treat the website as a discovery carrier, not the identity root.

Visible check:

```text
https://example.org/verify/
https://example.org/verify/organchor.json
https://example.org/verify/official-endpoints.json
https://example.org/verify/official-endpoints.json.sig
https://example.org/verify/root-authority.json
```

all return public content.

## 9. Run Domain Audit

```bash
organchor domain audit example.org
```

Outputs:

```text
reports/domain-security-report.json
reports/domain-security-report.md
```

Interpretation:

- `PASS`: detected and healthy.
- `WARN`: detected but needs attention.
- `FAIL`: broken or missing for a required check.
- `MANUAL_CHECK_REQUIRED`: the operator must check registrar or provider settings.

Manual items commonly include:

- Registry Lock.
- Auto-renewal.
- Registrar 2FA.
- Billing continuity.

## 10. Mirror the Verify Package to IPFS

Default mirror target:

```text
public/verify
```

Dry run first:

```bash
organchor mirror ipfs publish --dir public/verify --dry-run
```

Local Kubo option:

```bash
organchor mirror ipfs publish --dir public/verify --api http://127.0.0.1:5001
```

Pinata upload option:

```bash
organchor mirror ipfs upload \
  --provider pinata \
  --dir public/verify \
  --token-file pinata-jwt.local.secret
```

Verify local directory hash:

```bash
organchor mirror ipfs verify \
  --cid <CID> \
  --expected-hash sha256:<VERIFY_DIRECTORY_HASH> \
  --dir public/verify
```

Record:

```text
CID
directory hash
gateway URLs that worked
gateway limitations
```

Do not use the default IPFS verify mirror for large evidence videos or datasets. Store large artifacts separately and reference them from signed evidence manifests by hash.

## 11. Archive Critical Artifacts to Arweave

Prepare a manual package:

```bash
organchor archive arweave publish \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority.json \
  --claims claims/product-claims.json \
  --claims-sig claims/product-claims.json.sig \
  --evidence evidence/evidence-manifest.json \
  --evidence-sig evidence/evidence-manifest.json.sig
```

Estimate:

```bash
organchor archive arweave estimate --dir arweave-package
```

Human approval required before real upload.

Turbo upload option:

```bash
organchor archive arweave upload \
  --provider turbo \
  --dir arweave-package \
  --wallet-file arweave-wallet.local.json
```

Verify TX content:

```bash
organchor archive arweave verify \
  --tx <ARWEAVE_TX_ID> \
  --gateway https://arweave.net \
  --expected-hash sha256:<FILE_HASH>
```

Rules:

- Use a dedicated upload wallet, never a root authority key.
- Upload only small, public, final artifacts.
- Corrections are new signed statements, not edits to old Arweave content.

## 12. Stamp Hashes with OpenTimestamps

Stamp key public artifacts:

```bash
organchor anchor opentimestamps stamp --file root-authority.json
organchor anchor opentimestamps stamp --file statements/official-endpoints.json
organchor anchor opentimestamps stamp --file statements/official-endpoints.json.sig
organchor anchor opentimestamps stamp --file claims/product-claims.json
organchor anchor opentimestamps stamp --file evidence/evidence-manifest.json
```

Later:

```bash
organchor anchor opentimestamps upgrade --proof anchors/opentimestamps/official-endpoints.json.ots
organchor anchor opentimestamps verify \
  --file statements/official-endpoints.json \
  --proof anchors/opentimestamps/official-endpoints.json.ots
```

Record pending versus Bitcoin-anchored status honestly.

## 13. Rehearse Root Authority Migration

Before long-term reliance, rehearse a migration without replacing the public root.

Example:

```bash
organchor key generate --id root-d-2026
organchor key public --key keys/root-d-2026.private.json

organchor authority change-plan \
  --old-authority root-authority.json \
  --remove root-c-2026 \
  --add-keys keys/root-d-2026.public.json \
  --threshold 2 \
  --out root-authority-rehearsal-next.json \
  --plan-out statements/root-authority-change-plan-rehearsal.json

organchor migrate create \
  --old-authority root-authority.json \
  --new-authority root-authority-rehearsal-next.json \
  --out statements/migration-rehearsal-001.json

organchor migrate sign \
  --key keys/root-a-2026.private.json \
  --old-authority root-authority.json \
  --in statements/migration-rehearsal-001.json

organchor migrate sign \
  --key keys/root-b-2026.private.json \
  --old-authority root-authority.json \
  --in statements/migration-rehearsal-001.json \
  --append

organchor migrate verify \
  --old-authority root-authority.json \
  --new-authority root-authority-rehearsal-next.json \
  --in statements/migration-rehearsal-001.json \
  --sig statements/migration-rehearsal-001.json.sig
```

Visible check:

- Valid migration verifies with the old authority threshold.
- Insufficient signatures fail in a negative test.
- Wrong new authority fails in a negative test.
- Historical statements still verify under the root that signed them.

Do not publish rehearsal migrations as real migrations.

## 14. Write `ADOPTION_STATUS.md`

Create a short public-facing status report in the adoption workspace.

Template:

```text
# Example Org OrgAnchor Adoption Status

Status:
Date:
Adoption level:

Verification URL:
Well-known URL:

Root authority hash:
Root authority threshold:
Root member key ids:

Official statement hash:
Signature hash:
Valid signature count:

Claims hash:
Evidence manifest hash:

IPFS CID:
IPFS directory hash:
IPFS gateways tested:

Arweave TX ids:
Arweave gateways tested:

OpenTimestamps status:

Domain audit:
PASS:
WARN:
FAIL:
MANUAL_CHECK_REQUIRED:

Root continuity:
Current root authority:
Migration status:
Historical verification rule:

Known limitations:
Operator notes:
```

## 15. Final Independent Verification

Use a fresh directory or fresh clone.

Download public artifacts from:

```text
https://example.org/verify/
```

Then verify:

```bash
organchor statement verify \
  --authority root-authority.json \
  --expected-authority-hash sha256:<ROOT_AUTHORITY_HASH> \
  --in official-endpoints.json \
  --sig official-endpoints.json.sig
```

Inspect:

```text
organchor.json
visible_proof.status
root_continuity.status
linked_artifacts
migration_history.status
```

The pilot is not complete until a verifier can do this without access to the operator's private workspace.

## Pilot Success Criteria

The external pilot succeeds when:

- The organization has named its root authority and custody plan.
- Public `/verify` loads.
- Statement verification passes from public artifacts.
- Claims and evidence verify if used.
- IPFS CID and directory hash are recorded.
- Arweave package or TX ids are recorded.
- OpenTimestamps proofs are generated or status is recorded.
- Domain audit report exists.
- `organchor.lock.json` contains receipts and no secrets.
- `ADOPTION_STATUS.md` summarizes the result for humans.
- `organchor.json` exposes the result for machines and AI agents.
- Root authority migration has been rehearsed locally.

## Common Failure Modes

- Treating Cloudflare, IPFS, Arweave, ENS, or a domain as the identity root.
- Sharing one root private key between multiple people.
- Uploading a private key, provider token, or upload wallet into public artifacts.
- Publishing claims that are not separated into signed claims/evidence manifests.
- Putting large videos into the default IPFS verify mirror.
- Assuming Arweave content can be edited later.
- Assuming a CID guarantees availability.
- Publishing a migration signed only by the new root authority.
- Failing to preserve old root authority records for historical verification.

## Recommended Next Step After Pilot

After the first successful external pilot:

1. Rotate or revoke broad temporary provider credentials.
2. Review domain audit warnings.
3. Decide whether DNSSEC, CAA, mail authentication, ENS, or Onion are worth adding.
4. Upgrade pending OpenTimestamps proofs later.
5. Preserve the full adoption workspace backup.
6. Write lessons back into `SELF_PILOT_LESSONS.md` or a pilot-specific lessons file.
