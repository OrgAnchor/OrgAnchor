# Changelog

All notable changes to OrgAnchor will be documented in this file.

OrgAnchor uses semantic versioning once the public package is released. Alpha releases may still change CLI flags, file schemas, and operator workflows before v1.

## Unreleased

No unreleased changes yet.

## 0.1.0-alpha.3 - 2026-05-25

Release alignment candidate for npm Trusted Publishing.

### Changed

- Bumps the MVP launch candidate from `0.1.0-alpha.2` to `0.1.0-alpha.3` so the package version, Git tag, GitHub release, and npm publish run can describe the same source state after adding the trusted publishing workflow.

### Notes

- `0.1.0-alpha.2` remains a superseded candidate because its tag was created before the npm Trusted Publishing workflow existed.

## 0.1.0-alpha.2 - 2026-05-25

MVP launch candidate for AI-agent-facing verification, Beacon-first discovery, open Directory experiments, adoption status reporting, and release-state alignment.

### Added

- `/verify` pages now summarize carrier receipts from `organchor.lock.json`, giving people and AI agents a visible view of IPFS, Arweave, OpenTimestamps, and other publication receipts without exposing the full local lockfile.
- Arweave manual packages can now include the public verify index and HTML page with `--verify-index` and `--verify-page`.
- Release integrity protocol documenting release-state alignment, carrier receipt self-reference limits, and release blockers.
- Project purpose, adoption principles, and showcase policy documents clarify OrgAnchor's value stance and misuse boundaries.
- `PROJECT_NORTH_STAR.md` defines the project alignment gate for keeping identity, evidence, AI-agent access, and discovery work focused on lowering real transaction cost without making OrgAnchor a trust authority.
- Value continuity model and `organchor value audit` reports for claim support levels, evidence quality, stale evidence, and unsupported claims.
- `/verify` pages and `organchor.json` can now publish value continuity report summaries.
- Agent verification contract, AI agent integration guide, compact verification result output, and compatibility iteration plan.
- `DOCS_INDEX.md` as the public documentation map for current guidance, design records, adoption guides, AI agent documents, examples, and historical self-pilot notes.
- `organchor verify url` now emits `policy_route` so external AI agents can route verified results to stop, request evidence, review warnings, or apply their own policy without treating `PASS` as a trust badge.
- `DISCOVERY_STRATEGY.md` records why OrgAnchor needs an open discovery layer, not only post-discovery verification, to reduce real transaction cost between organizations and AI agents.
- `ORGANCHOR_BEACON.md` records the Beacon-first discovery model so every adopter can emit origin-owned signals and be found without depending on official Directory inclusion.
- `ORGANCHOR_BEACON.md` now records the Beacon discovery efficiency, cacheability, abuse-resistance, polite-crawler, and audit checklist requirements for future implementation checks.
- `ORGANCHOR_BEACON.md` now defines conformance states that distinguish claimed OrgAnchor signals from strictly verified full compatibility.
- `DIRECTORY_MODEL.md` records the proposed post-v1 open discovery index model for helping people and AI agents find OrgAnchor-enabled organizations without turning discovery into a monopoly trust platform.
- `DIRECTORY_SNAPSHOT_SPEC.md` and `examples/directory/directory-snapshot.json` define the first static discovery snapshot shape for AI-agent candidate discovery before direct origin verification.
- `organchor directory build` and `organchor directory verify` implement the first static Directory snapshot MVP without making the Directory a trust root.
- `organchor directory build --verify-origins` can now fetch listed origin packages, reuse `organchor verify url` checks, require identity verification to pass, and write crawler-derived Directory records.
- `/verify/organchor.json` can now expose optional `directory_discovery` pointers so AI agents can discover Directory snapshots without treating them as trust roots.
- `organchor beacon inspect` can now distinguish claimed OrgAnchor signals, valid first-pass Beacon shapes, strict identity verification, value verification, full compatibility, partial adoption, and failed impostor signals.
- `organchor directory inspect` can now discover an organization's Directory pointer, fetch the linked snapshot/hash/policy, and fail on hash or trust-boundary mismatches.
- `organchor directory fetch` can now retrieve verified Directory snapshots, save them locally, and output candidate records with next-step direct origin verification commands.
- `organchor directory fetch` can now filter candidates by discovery fields, verification status, policy route, and result limit before agents spend work on direct origin verification.
- `organchor beacon sweep` can now consume seed files, Directory snapshots, sitemaps, and bounded crawl starts, with basic `robots.txt` respect for crawl mode.
- `organchor beacon index` and `organchor beacon query` can build a local discovery database and return AI-agent-facing need-match reports.
- `organchor beacon verify` can validate shared Beacon sweep NDJSON files as reusable discovery artifacts.
- `organchor beacon generate` can regenerate `/.well-known/organchor.json`, `robots.txt`, and `sitemap.xml` from an existing local verify package, but only after the verify index, signed statement, detached signature, and root authority hashes pass local checks.
- `organchor beacon report` can summarize local discovery quality from sweep artifacts, including Beacon find rate, origin verification success rate, stale-record rate, and cross-sweep reproducibility.
- `organchor beacon inspect` now includes first-pass HTTP publishing hints for Beacon content type, response size, and cache metadata.
- `organchor directory add` can maintain static Directory candidate source files without claiming that added candidates are verified.
- Generated Directory policy files now spell out inclusion, exclusion, ranking, payment, stale-record, and mirroring boundaries.
- `IMPLEMENTATION_STATUS.md` records the current implemented surface, remaining gaps, non-goals, and verification commands for alignment checks.
- `organchor directory build --beacon-index` can export a local Beacon index into a static Directory snapshot.
- `organchor directory build` now writes a machine-readable `directory-policy.json` by default.
- `organchor directory compare` can compare independent Directory snapshots and surface conflicting origin summaries without making trust decisions.
- `organchor directory export --format ndjson` can export Directory records as a line-oriented feed for mirroring, merging, and independent Directory nodes.
- `npm run agent:demo` runs a complete local discovery loop: temporary adopter, Beacon sweep, local index, Directory export, need query, and compact verification.
- `organchor adoption status` can generate public `ADOPTION_STATUS.md` and machine-readable adoption status reports from a local adoption workspace, while explicitly preserving the trust boundary.

### Notes

- This is still an alpha release, not stable v1.
- OrgAnchor remains a verification and evidence-continuity toolchain, not a certification authority, marketplace, ranking engine, or final trust oracle.
- The next product milestone is an external low-risk pilot using `EXTERNAL_PILOT_RUNBOOK.md`.

### Verification

The release candidate is expected to pass:

```bash
node --run release:check
npm pack --dry-run
npm publish --dry-run --tag alpha
```

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
