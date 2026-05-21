# Changelog

All notable changes to OrgAnchor will be documented in this file.

OrgAnchor uses semantic versioning once the public package is released. Alpha releases may still change CLI flags, file schemas, and operator workflows before v1.

## Unreleased

### Added

- `/verify` pages now summarize carrier receipts from `organchor.lock.json`, giving people and AI agents a visible view of IPFS, Arweave, OpenTimestamps, and other publication receipts without exposing the full local lockfile.
- Arweave manual packages can now include the public verify index and HTML page with `--verify-index` and `--verify-page`.
- Release integrity protocol documenting release-state alignment, carrier receipt self-reference limits, and release blockers.
- Project purpose, adoption principles, and showcase policy documents clarify OrgAnchor's value stance and misuse boundaries.
- Value continuity model and `organchor value audit` reports for claim support levels, evidence quality, stale evidence, and unsupported claims.
- `/verify` pages and `organchor.json` can now publish value continuity report summaries.
- Agent verification contract, AI agent integration guide, compact verification result output, and compatibility iteration plan.
- `DOCS_INDEX.md` as the public documentation map for current guidance, design records, adoption guides, AI agent documents, examples, and historical self-pilot notes.

## 0.1.0-alpha.1 - 2026-05-14

First public alpha candidate for the OrgAnchor identity-continuity toolchain.

### Added

- Organization root authority records, including threshold authority support.
- Ed25519 root member key generation and public key export.
- Canonical JSON hashing and signed official endpoint statements.
- Statement signing and verification with root authority threshold checks.
- Static adopting-organization `/verify` page generation.
- Machine-readable `public/verify/organchor.json` with visible proof and root continuity data.
- Signed claims and evidence manifests for AI-agent-friendly product and service evidence.
- IPFS dry-run, local Kubo publish, generic pinning API, and Pinata upload support.
- Arweave manual package, Turbo upload adapter, package estimation, and gateway hash verification.
- OpenTimestamps stamp, upgrade, and verify commands.
- Domain security audit reports.
- Onion v3 validation and Tor Hidden Service config guidance.
- ENS planning and offline verification.
- Root authority change plans, migration statements, migration signing, and migration verification.
- Complete public example artifacts under `examples/complete`.
- Release, package, and install smoke tests.

### Notes

- This release is an alpha candidate, not a v1 stability promise.
- OrgAnchor's own self-pilot is live, but broad external organization pilots have not yet been completed.
- The identity root remains the adopting organization's root authority. Domains, Cloudflare, IPFS, Arweave, ENS, Onion, OpenTimestamps, and lockfiles are carriers, mirrors, archives, receipts, or discovery surfaces.
- Private keys, provider tokens, wallets, payment data, and deployment credentials must never be published in an OrgAnchor package or adoption workspace.

### Verification

The release candidate is expected to pass:

```bash
node --run release:check
npm pack --dry-run
```
