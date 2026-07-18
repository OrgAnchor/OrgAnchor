# OrgAnchor v1 Acceptance Criteria

Status: Accepted.

## Purpose

This document defines what must be true for OrgAnchor v1 to be considered complete.

OrgAnchor v1 is not complete when it merely signs a JSON file. It is complete when it supports a full identity continuity workflow across root authority, signed statements, product/service claims, evidence manifests, publication receipts, mirrors, archives, disaster recovery, domain audit, auxiliary names, and migration.

Milestone definitions:

```text
Stage 3 = self-pilot ready
Stage 5 = v1 functional scope complete
Stable v1 release = Stage 5 scope + release consistency + external validation decision
```

The OrgAnchor self-pilot is required after Stage 3, while v1 functional-scope completion requires Stage 5. Stable-v1 publication is a separate decision: meeting the functional checklist does not replace package alignment, compatibility checks, operator usability review, or external validation.

Release packaging and publication hygiene are tracked separately in `docs/operations/V1_RELEASE_CHECKLIST.md`.

## Current State

The accepted v1 functional scope is implemented for the current Fireseed Alpha,
but stable v1 is **not released**. The current published package is
`organchor@0.1.0-alpha.5`.

The remaining maturity questions are not hidden feature checkboxes. They are
release consistency, operator usability, compatibility, a first low-risk
external organization pilot, and evidence that independent agents can interpret
the public package without project-specific assistance. Passing the criteria
below proves coverage of the accepted functional baseline; it does not by
itself authorize a stable-v1 claim.

## Global Acceptance Criteria

OrgAnchor v1 must satisfy:

- The identity root is the organization root authority.
- External systems are not treated as identity roots.
- All signed JSON is canonicalized before hashing and signing.
- Statement hashes use SHA-256.
- Unsupported algorithms fail closed.
- Signature verification checks both cryptographic validity and root authority threshold rules.
- Private key files are ignored by Git by default.
- Private key files are created with reasonable filesystem permissions where supported.
- Publish operations output hashes and receipts.
- Publish operations write non-sensitive receipt data to `organchor.lock.json`.
- No command stores private keys, wallets, seeds, or API tokens in `organchor.lock.json`.
- Reports and CLI output distinguish trust, availability, and manual checks.
- Public verification output makes important work visible to humans and machine-readable to AI agents.

## Required Commands

v1 must provide:

```bash
organchor init

organchor key generate
organchor key public
organchor key rotate-plan

organchor authority create
organchor authority verify
organchor authority change-plan

organchor statement create
organchor statement sign
organchor statement verify
organchor statement hash

organchor page generate

organchor claims create
organchor claims sign
organchor claims verify

organchor evidence create
organchor evidence add
organchor evidence sign
organchor evidence verify
organchor evidence hash

organchor archive arweave publish
organchor archive arweave upload
organchor archive arweave verify
organchor anchor opentimestamps stamp
organchor anchor opentimestamps upgrade
organchor anchor opentimestamps verify

organchor mirror ipfs publish
organchor mirror ipfs pin
organchor mirror ipfs upload
organchor mirror ipfs verify

organchor onion init
organchor onion config generate
organchor onion verify

organchor domain audit

organchor ens inspect
organchor ens plan
organchor ens verify

organchor migrate create
organchor migrate sign
organchor migrate verify
```

`organchor ens apply` is optional after v1 and must not be required for v1 completion.

## Required Artifacts

v1 must be able to generate:

```text
organchor.config.json
organchor.lock.json
root-authority.json
keys/root-2026.private.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
statements/migration-*.json
statements/migration-*.json.sig
statements/root-authority-change-plan-*.json
claims/product-claims.json
claims/product-claims.json.sig
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
public/verify/index.html
public/verify/organchor.json
public/verify/official-endpoints.json
public/verify/official-endpoints.json.sig
public/verify/root-authority.json
reports/domain-security-report.json
reports/domain-security-report.md
arweave-manifest.json
anchors/opentimestamps/*.ots
```

v1 may also generate individual public key files for convenience, but `root-authority.json` is the public authority record.

## Identity Core Acceptance

Acceptance tests must prove:

- `organchor key generate` creates an Ed25519 private key file with metadata.
- Generated private key files are ignored by `.gitignore`.
- `organchor key public` exports public key material.
- `organchor authority create` creates a valid `1-of-1` root authority.
- `organchor authority create --keys ... --threshold ...` creates a valid threshold root authority.
- Root authority records include explicit key IDs and algorithms.
- `organchor statement create` creates a schema-valid statement.
- `organchor statement hash` hashes canonical JSON.
- `organchor statement sign` creates a detached signature file.
- `organchor statement sign --append` appends an independent root member signature.
- `organchor statement verify` verifies a valid statement.
- Verification fails after any statement field is changed.
- Verification fails with the wrong root authority.
- Verification fails when required fields are missing.
- Verification fails when JSON contains duplicate keys in signed artifacts.
- Verification fails when an unsupported algorithm appears.
- Verification fails when the signature set does not satisfy the root authority threshold.

## Static Verify Page Acceptance

Acceptance tests must prove:

- `organchor page generate` creates `public/verify/index.html`.
- `organchor page generate` creates `public/verify/organchor.json` as a machine-readable index.
- The verify directory contains the statement, signature file, and root authority record.
- The verify directory contains signed claims and evidence manifests when available.
- The page displays organization metadata.
- The page displays the organization's declared official presence endpoints.
- The page displays statement hash.
- The page displays root authority fingerprint.
- The page displays a visible proof trail for generated and verified artifacts.
- The page explains root continuity: current root authority, previous root authorities when present, migration status, and the historical verification rule.
- The page displays migration history when valid migration artifacts are supplied.
- The page does not claim that browser display alone proves identity.
- CLI verification works against artifacts copied into `public/verify`.
- AI agents can discover verification artifacts from `public/verify/organchor.json`.
- AI agents can discover signed claims and evidence manifests from `public/verify/organchor.json` when available.
- AI agents can inspect `visible_proof.status`, checks, and summary from `public/verify/organchor.json`.
- AI agents can inspect `root_continuity.status`, current root authority, previous root authorities, migration chain, and historical verification rule from `public/verify/organchor.json`.
- AI agents can inspect `migration_history.status` and migration artifacts from `public/verify/organchor.json`.
- AI agents can inspect `lockfile_integrity.status`, `path`, `hash`, `signature_path`, and `valid_signatures` from `public/verify/organchor.json` when a lockfile snapshot is included.

## Lockfile Acceptance

Acceptance tests must prove:

- `organchor.lock.json` is created when publish-like operations run.
- Lockfile entries are keyed by artifact hashes.
- Lockfile entries include timestamps and provider names.
- Lockfile entries do not include secrets.
- `organchor lockfile hash --in organchor.lock.json` emits the canonical SHA-256 lockfile hash.
- `organchor lockfile sign --key <root-member-private-key> --authority root-authority.json --in organchor.lock.json` creates `organchor.lock.json.sig`.
- `organchor lockfile verify --authority root-authority.json --in organchor.lock.json --sig organchor.lock.json.sig` passes for an unchanged signed lockfile.
- Modifying any signed lockfile field causes `organchor lockfile verify` to fail.
- `page generate` copies `organchor.lock.json` and `organchor.lock.json.sig` into `/verify` when available, and refuses to include an invalid lockfile signature.
- `verify url` fetches the indexed lockfile snapshot and verifies its hash/signature when `lockfile_integrity` is present.
- A stale or mismatched lockfile is reported as stale, mismatched, or failed when hashes differ.

## Claims and Evidence Acceptance

Acceptance tests must prove:

- `claims create` creates a schema-valid product/service claims manifest.
- `claims sign` creates a detached signature file.
- `claims verify` verifies a valid signed claims manifest.
- Claims include product/service scope and version where applicable.
- Claims include limitations or caveats when relevant.
- Claims reference existing evidence IDs.
- `evidence create` creates a schema-valid evidence manifest.
- `evidence add` records artifact media type, size, hash, issuer type, location, and relation to claims.
- `evidence sign` creates a detached signature file.
- `claims sign --append` and `evidence sign --append` can satisfy threshold root authority rules.
- `evidence verify` verifies a valid signed evidence manifest.
- `evidence hash` computes artifact hashes.
- Evidence verification fails when an artifact hash does not match.
- Evidence verification fails when a claim references a missing evidence item.
- Evidence verification distinguishes first-party, third-party, community, regulator, and automated-system evidence.
- CLI output states that OrgAnchor proves publication, integrity, and traceability, not objective product effectiveness.
- The manifest format is readable by AI agents without scraping human-only pages.
- Large evidence artifacts may be stored on HTTPS, object storage, CDN, Git releases, IPFS, or Arweave, but must be bound by hash in the evidence manifest.
- Large evidence artifacts are not part of the default `public/verify` IPFS mirror unless explicitly intended.
- Critical signed manifests are mirrored to IPFS and archived to Arweave or included in the Arweave manual package.

## IPFS Acceptance

Acceptance tests must prove:

- `mirror ipfs publish --dry-run` reports planned files and hashes.
- `mirror ipfs publish --dir public/verify` works with local Kubo when available.
- `mirror ipfs publish` refuses oversized default verify directories unless explicitly allowed.
- The resulting CID is written to `organchor.lock.json`.
- `mirror ipfs pin --cid <CID> --service-url <API>` can request a remote pin through an IPFS Pinning Service compatible API.
- Remote pin receipts are written to `organchor.lock.json` without storing API tokens.
- `mirror ipfs upload --provider pinata --dir public/verify` can upload and pin the default verify directory through Pinata without storing API tokens.
- `mirror ipfs verify --cid <CID> --expected-hash <SHA256>` passes when content matches.
- IPFS verify fails when expected hash does not match.
- CLI output does not claim that IPFS guarantees availability.

## Arweave Acceptance

Acceptance tests must prove:

- `archive arweave publish` creates a manual upload package when no wallet or provider credentials are configured.
- `arweave-manifest.json` is generated.
- Statement, signature, and root authority artifacts are included in the package.
- Signed claims and evidence manifests are included in the package when available.
- Publish receipts are written to `organchor.lock.json`.
- `archive arweave upload --provider turbo` uploads package artifacts through Turbo SDK when an Arweave/Turbo wallet is supplied.
- Turbo upload receipts include TX ids, file hashes, provider metadata, and no wallet material.
- `archive arweave verify --tx <TX> --gateway <GATEWAY_URL> --expected-hash <SHA256>` passes when content matches.
- Arweave verify fails when expected hash does not match.
- CLI output does not claim that Arweave is the identity root.
- CLI output and documentation do not claim that Arweave is an absolute permanence guarantee.
- Documentation explains that Arweave is a long-term archival carrier with one-time upload economics and external gateway/provider dependencies.

If no Arweave wallet or provider credentials are configured, dry-run/manual package mode must still work.

## OpenTimestamps / Bitcoin Acceptance

Acceptance tests must prove:

- `anchor opentimestamps stamp --file <FILE>` creates a `.ots` proof.
- Stamp receipts are written to `organchor.lock.json`.
- `anchor opentimestamps verify --file <FILE> --proof <PROOF>` passes when the file hash matches the proof.
- OpenTimestamps verify fails when the file content is modified.
- Verification distinguishes pending calendar attestations from Bitcoin-anchored proofs.
- `anchor opentimestamps upgrade --proof <PROOF>` can merge a later Bitcoin attestation from a calendar.
- Bitcoin verification checks the attested commitment against a Bitcoin block merkle root through a configurable API.
- CLI output does not claim that OpenTimestamps stores the file content or proves claim truth.

OpenTimestamps is a time anchor for hashes, not a storage layer and not an identity root.

## Onion Acceptance

Acceptance tests must prove:

- `onion verify` accepts valid v3 `.onion` addresses.
- `onion verify` rejects invalid, malformed, or v2 onion addresses.
- `onion config generate` outputs a Tor Hidden Service configuration snippet.
- Output includes `HiddenServiceDir` guidance.
- Output includes `HiddenServicePort` guidance.
- Output explains how to deploy `/verify` to the onion service.
- Output explains how to bind the onion address into the signed official statement.
- CLI output does not claim that OrgAnchor can keep the onion service online.

Current implementation note: the foundation for these Onion checks exists. A real onion service is not required for the unit tests because OrgAnchor records, validates, and documents the entry; it does not operate Tor.

## Domain Audit Acceptance

Acceptance tests must prove:

- `domain audit example.com` produces JSON and Markdown reports.
- Reports use only `PASS`, `WARN`, `FAIL`, and `MANUAL_CHECK_REQUIRED` statuses.
- DNSSEC is checked where data is available.
- SPF is checked.
- DMARC is checked.
- MX is checked.
- CAA is checked.
- HTTPS availability is checked.
- Certificate expiration is reported.
- `/.well-known/security.txt` is checked.
- `/verify` is checked.
- `official-endpoints.json` is checked.
- `official-endpoints.json.sig` is checked.
- Domain registration data is queried through RDAP where possible.
- Registry Lock is marked as manual when it cannot be reliably detected.
- Auto-renewal is marked as manual when it cannot be reliably detected.
- Reports distinguish domain security from identity authority.

## ENS Acceptance

Acceptance tests must prove:

- `ens inspect` reads available resolver records.
- `ens plan` generates suggested text records.
- `ens plan` generates suggested contenthash guidance when IPFS data exists.
- `ens verify` checks ENS records against the signed statement.
- ENS verify fails when ENS records do not match the statement.
- CLI output states that ENS is an auxiliary name, not the identity root.

Current implementation note: offline ENS planning and snapshot verification exist. Live ENS resolver reads require an Ethereum RPC adapter and remain a provider-integration step.

## Migration Acceptance

Current implementation note: `key rotate-plan`, `authority change-plan`, root authority migration `create`, `sign`, `verify`, `/verify` migration-history publication, and `/verify` root continuity publication now exist for the core old-authority-to-new-authority continuity flow. The OrgAnchor self-pilot has completed a local migration rehearsal without replacing the public root authority. `docs/guides/MIGRATION_GUIDE.md` records the migration operator runbook, and `docs/guides/EXTERNAL_PILOT_RUNBOOK.md` records the repeatable path for the first low-risk external organization pilot.

Acceptance tests must prove:

- `migrate create` creates a schema-valid migration statement.
- `migrate sign` signs a migration statement.
- `migrate verify` verifies continuity between old and new authority records.
- `authority change-plan` creates a next authority and plan for `1-of-1` to `2-of-3`, `2-of-3` to `3-of-5`, retained-key, removed-key, added-key, and threshold-change scenarios.
- `authority change-plan` requires an explicit threshold.
- Migration verification fails when the old authority has not signed the migration.
- Migration verification fails when the signature threshold is not met.
- Migration verification fails when hashes or authority IDs do not match.
- Historical statements remain verifiable after a migration.
- `/verify` includes valid migration history only when the supplied migration chain ends at the current root authority.

## Documentation Acceptance

v1 documentation must include:

- Project positioning.
- Product shape and user-facing surface model.
- Threat model.
- Architecture.
- Cryptography policy.
- Evidence model.
- Technical decisions.
- Pilot plan.
- Roadmap.
- CLI usage.
- Key management warnings.
- Private key backup guidance.
- Domain audit limitations.
- IPFS and Arweave limitations.
- Onion limitations.
- ENS limitations.
- Quantum and post-quantum positioning.
- Migration guidance.

Documentation must not claim:

- Permanent identity.
- Absolute censorship resistance.
- Complete decentralization.
- Replacement for domains.
- Replacement for legal identity.
- Replacement for government registration.
- Quantum-proof security in v1.

## OrgAnchor Self-Pilot Acceptance

After Stage 3, OrgAnchor must run its own public pilot before recommending external production adoption.

This is a self-pilot milestone, not v1 completion.

In this self-pilot, OrgAnchor is the first adopting organization using OrgAnchor's own generated `/verify` artifacts. This does not mean every `/verify` page belongs to the OrgAnchor project.

The self-pilot must prove:

- OrgAnchor has its own root authority record.
- OrgAnchor has a signed official-presence statement.
- OrgAnchor has a generated verify page.
- OrgAnchor has IPFS receipt data in `organchor.lock.json`.
- OrgAnchor has Arweave dry-run/manual package or real receipt data.
- OrgAnchor has signed claims and evidence manifests for its own project documents.
- A fresh clone can verify OrgAnchor's statement using public artifacts.

## Final v1 End-to-End Flow

The following flow must work:

```bash
organchor init

organchor key generate --id root-2026

organchor authority create \
  --key keys/root-2026.private.json \
  --out root-authority.json

organchor statement create \
  --config organchor.config.json \
  --authority root-authority.json \
  --out statements/official-endpoints.json

organchor statement sign \
  --key keys/root-2026.private.json \
  --authority root-authority.json \
  --in statements/official-endpoints.json \
  --out statements/official-endpoints.json.sig

organchor statement verify \
  --authority root-authority.json \
  --in statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig

organchor page generate \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority.json \
  --out public/verify

organchor claims create
organchor claims sign
organchor claims verify

organchor evidence create
organchor evidence add --file PROJECT_BRIEF.md
organchor evidence sign
organchor evidence verify

organchor mirror ipfs publish --dir public/verify

organchor archive arweave publish \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority.json

organchor domain audit example.com

organchor onion config generate --domain exampleonionaddress.onion

organchor ens plan exampleorg.eth \
  --statement statements/official-endpoints.json

organchor key generate --id root-2027-a
organchor key generate --id root-2027-b
organchor key generate --id root-2027-c
organchor key public --key keys/root-2027-a.private.json
organchor key public --key keys/root-2027-b.private.json
organchor key public --key keys/root-2027-c.private.json

organchor authority change-plan \
  --old-authority root-authority.json \
  --replace-all \
  --add-keys keys/root-2027-a.public.json,keys/root-2027-b.public.json,keys/root-2027-c.public.json \
  --threshold 2 \
  --out root-authority-next.json \
  --plan-out statements/root-authority-change-plan-2027-001.json

organchor migrate create \
  --old-authority root-authority.json \
  --new-authority root-authority-next.json \
  --out statements/migration-2027-001.json \
  --statement statements/official-endpoints.json

organchor migrate sign \
  --key keys/root-2026.private.json \
  --old-authority root-authority.json \
  --in statements/migration-2027-001.json \
  --out statements/migration-2027-001.json.sig

organchor migrate verify \
  --old-authority root-authority.json \
  --new-authority root-authority-next.json \
  --in statements/migration-2027-001.json \
  --sig statements/migration-2027-001.json.sig
```

If this flow does not work, v1 is not complete.
