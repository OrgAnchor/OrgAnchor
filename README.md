# OrgAnchor

OrgAnchor helps organizations publish signed official endpoint statements so that their online presence remains verifiable across domain, platform, and infrastructure changes.

OrgAnchor 帮助组织发布经过签名的官方入口声明，使组织在域名、平台和基础设施发生变化时，仍然能够保持可验证的在线身份连续性。

## What It Is

OrgAnchor is an open-source identity continuity toolkit.

It is designed around:

- An organization root authority.
- Signed official endpoint statements.
- Static adopting-organization `/verify` pages.
- Machine-readable verification artifacts.
- Claims and evidence manifests.
- Optional carriers such as IPFS, Arweave, Onion, ENS, and traditional websites.

The identity root is the adopting organization's root authority, not OrgAnchor's website, a domain, a platform account, IPFS, Arweave, ENS, or a lockfile.

## Purpose and Values

OrgAnchor is not only a tool for keeping an organizational name alive. Its purpose is to help long-term, evidence-bearing organizations make their public identity, claims, evidence, corrections, and migrations easier to verify over time.

OrgAnchor does not certify that an organization is good, lawful, ethical, effective, or worthy of support. It makes continuity and public evidence more inspectable. The official project should not present signed continuity as a trust badge or help launder fraud, impersonation, exploitation, or deliberate deception.

See `DOCS_INDEX.md`, `PURPOSE_AND_VALUES.md`, `ADOPTION_PRINCIPLES.md`, and `SHOWCASE_POLICY.md` for the project stance and document map.

The proposed post-v1 `DIRECTORY_MODEL.md` describes an open discovery index for helping people and AI agents find OrgAnchor-enabled organizations. It is not a marketplace, certification authority, or v1 trust root.

## Current Status

Stage 5 implementation is in release-hygiene mode. The core v1 surface now includes root authority records, signed endpoint statements, claims/evidence manifests, value continuity reports, carrier receipts, domain audit, Onion/ENS support, OpenTimestamps anchoring, root authority migration, AI-agent verification discovery, policy-route hints, and `/verify` root continuity publication.

OrgAnchor's own public self-pilot is active at `https://organchor.org/verify/`. Its real operational artifacts live outside this source repository so that the publishable project remains clean: no private keys, provider tokens, payment records, or deployment credentials are stored here.

Implemented so far:

- Strict JSON loading with duplicate-key rejection.
- Canonical JSON hashing.
- SHA-256 statement hashes.
- Ed25519 root member key generation.
- Root authority records, including threshold authority creation.
- Detached statement signatures, including appended signatures from independent root member keys.
- Statement verification with root authority threshold checks.
- Anchored verification with an expected root authority hash.
- Stage 1 test vectors.
- Static adopting-organization `/verify` page generation.
- Machine-readable `public/verify/organchor.json`.
- Agent-facing discovery and verification contract for `/.well-known/organchor.json`.
- Third-party AI agent integration guide with compact-result examples.
- `organchor verify url` for external AI agents and other verifiers.
- Compact `organchor verify url --compact` output for low-cost first-pass agent routing.
- Human-visible and machine-readable carrier receipt summaries from `organchor.lock.json`.
- Signed claims/evidence manifests are copied into `/verify` and indexed when available.
- Value continuity audit reports for claim support levels, evidence quality, stale evidence, and unsupported claims.
- `organchor.lock.json` publish receipt records.
- IPFS verify-directory dry-run receipts.
- Local Kubo IPFS publish support with CID receipts.
- Pinata directory upload support for the default verify mirror.
- IPFS local directory hash verification and Kubo CID content hash verification.
- Arweave manual upload package generation, including optional signed claims/evidence manifests.
- Arweave Turbo SDK upload adapter for real archival receipts.
- Arweave local package artifact hash verification and gateway TX content hash verification.
- Signed product claims manifests, including appended threshold signatures.
- Signed evidence manifests with local artifact hash checks and appended threshold signatures.
- Domain security audit reports with `PASS`, `WARN`, `FAIL`, and `MANUAL_CHECK_REQUIRED`.
- HTTPS, certificate expiration, DNSSEC, SPF, DMARC, MX, CAA, security.txt, `/verify`, statement, and signature checks.
- Onion v3 address validation and Tor Hidden Service config guidance.
- ENS auxiliary-name planning and offline records snapshot verification.
- Root member key rotation planning that generates a next-authority draft.
- General root authority change planning for retained, removed, and added members with explicit threshold changes.
- Root authority migration statement creation, signing, and verification.
- Self-pilot root authority migration rehearsal with positive and negative verification checks.
- Operator migration guidance for root authority evolution.
- `/verify` migration-history publication for migration chains that end at the current root authority.
- `/verify` root continuity publication through human-visible page content and machine-readable `root_continuity`.
- `/verify` value continuity publication through human-visible page content and machine-readable `value_continuity`.
- External pilot runbook for repeatable low-risk organization adoption.
- NPM build configuration that packages the CLI from `dist/cli.js`.
- Public complete minimal example artifacts under `examples/complete`.

## Install Alpha

The current public package is a prerelease:

```bash
npm install -g organchor@alpha
organchor --help
```

Use the explicit `@alpha` tag until OrgAnchor has a stable release. The npm registry may also show this first prerelease under `latest`, but that is not a stability claim.

## CLI Quick Start

Run from an empty working directory:

```bash
organchor init
organchor key generate --id root-2026
organchor authority create --key keys/root-2026.private.json
organchor statement create --config organchor.config.json --authority root-authority.json
organchor statement sign --key keys/root-2026.private.json --authority root-authority.json --in statements/official-endpoints.json
organchor statement verify --authority root-authority.json --in statements/official-endpoints.json --sig statements/official-endpoints.json.sig
organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --out public/verify
organchor mirror ipfs publish --dir public/verify --dry-run
organchor mirror ipfs publish --dir public/verify --api http://127.0.0.1:5001
organchor mirror ipfs pin --cid <CID> --service-url <PINNING_SERVICE_API> --token-env ORGANCHOR_IPFS_PINNING_JWT
organchor mirror ipfs upload --provider pinata --dir public/verify --token-env ORGANCHOR_IPFS_PINNING_JWT
organchor mirror ipfs verify --cid <CID> --api http://127.0.0.1:5001 --expected-hash sha256:<HASH>
organchor archive arweave publish --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --verify-index public/verify/organchor.json --verify-page public/verify/index.html
organchor archive arweave estimate --dir arweave-package
organchor archive arweave upload --provider turbo --dir arweave-package --wallet-file arweave-wallet.local.json
organchor archive arweave verify --tx <ARWEAVE_TX_ID> --gateway https://arweave.net --expected-hash sha256:<HASH>
organchor anchor opentimestamps stamp --file statements/official-endpoints.json
organchor anchor opentimestamps upgrade --proof anchors/opentimestamps/official-endpoints.json.ots
organchor anchor opentimestamps verify --file statements/official-endpoints.json --proof anchors/opentimestamps/official-endpoints.json.ots
organchor claims create --config organchor.config.json
organchor claims sign --key keys/root-2026.private.json --authority root-authority.json
organchor evidence create --config organchor.config.json
organchor evidence add --file README.md
organchor evidence add --file demo.mp4 --uri https://example.com/evidence/demo.mp4 --location-type https
organchor evidence sign --key keys/root-2026.private.json --authority root-authority.json
organchor value audit --claims claims/product-claims.json --evidence evidence/evidence-manifest.json --check-files
organchor verify url https://example.org
organchor verify url https://example.org --compact
organchor domain audit example.com
organchor onion verify <v3-address.onion>
organchor onion config generate --domain <v3-address.onion>
organchor ens plan example.eth --statement statements/official-endpoints.json
organchor ens verify example.eth --statement statements/official-endpoints.json --records ens-records.json
organchor key rotate-plan --authority root-authority.json --replace-key root-c --new-key keys/root-d.public.json --out root-authority-next.json
organchor authority change-plan --old-authority root-authority.json --add-keys keys/root-d.public.json,keys/root-e.public.json --threshold 3 --out root-authority-next.json
organchor migrate create --old-authority root-authority.json --new-authority root-authority-next.json
organchor migrate sign --key keys/root-a.private.json --old-authority root-authority.json --in statements/migration-2026-001.json
organchor migrate verify --old-authority root-authority.json --new-authority root-authority-next.json --in statements/migration-2026-001.json --sig statements/migration-2026-001.json.sig
organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority-next.json --migration statements/migration-2026-001.json --migration-sig statements/migration-2026-001.json.sig
```

After packaging, the intended command name is:

```bash
organchor
```

## Safety Notes

Private key files are sensitive.

OrgAnchor initializes `.gitignore` rules for:

```text
keys/*.private.json
*.private.json
```

Do not publish private keys, wallet seeds, provider tokens, or credentials.

## What OrgAnchor Does Not Claim

OrgAnchor does not claim:

- Permanent identity.
- Absolute censorship resistance.
- Complete decentralization.
- Replacement for domains.
- Replacement for legal identity.
- Replacement for government registration.
- Quantum-proof security in v1.

OrgAnchor improves verifiability and continuity. It does not make an organization automatically trustworthy.

## Carrier Notes

Arweave is treated as a long-term append-only archival carrier with one-time upload economics, not as OrgAnchor's identity root, current authority layer, general evidence storage backend, or sole durability guarantee. Corrections are made by publishing a new signed statement that supersedes an older one.

OpenTimestamps/Bitcoin anchoring is treated as a public time anchor for hashes. It proves that a hash existed before a Bitcoin block time; it does not store the file content and does not prove that the claim is true.

IPFS CIDs identify content, but they do not guarantee that someone will keep serving it.

The default IPFS mirror is the small `public/verify` verification package, not a large evidence repository. Large media, datasets, PDFs, and other heavy artifacts should be recorded in the signed evidence manifest with hashes and external locations such as HTTPS, R2/S3, GitHub Releases, or independent IPFS CIDs.

Traditional domains, Cloudflare, ENS, Onion, IPFS, and Arweave are all carriers or discovery surfaces. The trust path returns to the root authority, signatures, hashes, and migration history.

## Product Shape

OrgAnchor has four product surfaces:

- Core verification library.
- CLI.
- Future local-first OrgAnchor Studio.
- Adopting organization `/verify` page.

See `PRODUCT_SHAPE.md` for the accepted product shape.

## Adoption

OrgAnchor is intended to be repeatable by other organizations, not only usable by the OrgAnchor self-pilot.

The adoption model is recorded in `ADOPTION_MODEL.md`.

Start with `DOCS_INDEX.md` when choosing what to read next.

For AI agents, `PASS` is not a trust badge. `organchor verify url --compact` includes `policy_route` so an external agent can distinguish identity verification from its own transaction, partnership, listing, or safety policy.

Operator-facing adoption and verification documents:

- `DOCS_INDEX.md`
- `PURPOSE_AND_VALUES.md`
- `ADOPTION_PRINCIPLES.md`
- `ADOPTION_GUIDE.md`
- `AGENT_COMPATIBILITY_PLAN.md`
- `AGENT_INTEGRATION_GUIDE.md`
- `AGENT_VERIFICATION_CONTRACT.md`
- `EXTERNAL_PILOT_RUNBOOK.md`
- `ORG_ONBOARDING_CHECKLIST.md`
- `ROOT_AUTHORITY_CUSTODY_GUIDE.md`
- `MIGRATION_GUIDE.md`
- `PUBLISHING_GUIDE.md`
- `RELEASE_INTEGRITY.md`
- `SHOWCASE_POLICY.md`
- `VALUE_CONTINUITY_MODEL.md`
- `DOMAIN_HARDENING_GUIDE.md`
- `DIRECTORY_MODEL.md`
- `EVIDENCE_ONBOARDING_GUIDE.md`

## Release Hygiene

Before publishing or promoting a release, use `RELEASE_INTEGRITY.md` as the consistency gate for source state, public `/verify` state, carrier receipts, package metadata, and release notes.

Useful local checks:

```bash
node --run build
node --run check
node --run release:smoke
node --run package:smoke
node --run install:smoke
node --run release:check
```
