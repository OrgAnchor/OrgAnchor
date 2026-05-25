# OrgAnchor Implementation Status

Status: active alpha implementation snapshot

Last updated: 2026-05-25

This document records what is already implemented, what remains external or future work, and what OrgAnchor intentionally does not do. It exists to keep development aligned with the project north star: lower the cost for third-party AI agents, organizations, and people to discover, verify, understand, and compare organization-controlled identity and value evidence without turning OrgAnchor into a central trust authority.

## Implemented Core

Identity continuity:

- Root key and threshold root authority creation.
- Signed official endpoint statements.
- Canonical JSON and SHA-256 hashing.
- Detached Ed25519 signatures.
- Statement verification and tamper rejection.
- Root authority migration planning, signing, verification, and `/verify` publication.

Public verification surface:

- Static `/verify` page.
- Machine-readable `/verify/organchor.json`.
- Machine-readable `/.well-known/organchor.json` Beacon.
- `robots.txt` and `sitemap.xml` discovery hints.
- Visible proof trail for people.
- Compact and full agent verification results.

Value evidence layer:

- Signed claims manifests.
- Signed evidence manifests.
- Evidence hash checks.
- External large-artifact references by URI and hash.
- Value continuity reports.
- Policy-route hints for external AI agents.

Carriers and auxiliary surfaces:

- IPFS dry-run, Kubo publish/verify, remote pinning, and Pinata upload receipts.
- Arweave manual packages, Turbo upload receipts, gateway TX verification, and size estimation.
- OpenTimestamps proof creation, upgrade, and verification.
- Domain audit reports.
- Onion address validation and Tor hidden-service config guidance.
- ENS offline plan and snapshot verification.

Discovery and anti-capture:

- Beacon generation from a verified local package.
- Beacon inspection that distinguishes self-claims, malformed signals, impostors, partial adoption, and full compatibility.
- Beacon HTTP publishing hints for content type, response size, and cache metadata.
- Beacon sweep from seeds, Directory snapshots, sitemaps, and bounded crawl starts.
- Basic robots.txt respect during bounded crawl.
- Beacon sweep structural verification.
- Local Beacon index merging repeated sweeps.
- Beacon query with candidate explanation, risk gaps, verification plans, and explicit trust boundary.
- Beacon discovery report with local find rate, origin verification success rate, stale-record rate, and cross-sweep reproducibility.
- Static Directory candidate source maintenance.
- Static Directory snapshot build, verify, inspect, fetch, compare, and export.
- Directory snapshots can be built from live origin verification or a local Beacon index.
- Directory policy files explicitly record inclusion, exclusion, ranking, payment, stale-record, and mirroring boundaries.
- Local agent discovery demo covering seed -> sweep -> report -> index -> query -> Directory -> direct verify.

Release hygiene:

- Type checking.
- Node test suite.
- Release smoke.
- Package smoke.
- Install smoke.
- Package inclusion checks that reject private keys, local credentials, wallets, Cloudflare notes, and self-pilot private artifacts.
- Alpha-line release-state matrix and checklist alignment merged into `main`.
- `organchor@0.1.0-alpha.3` published through npm Trusted Publishing under the `alpha` dist-tag.
- Public self-pilot release-state hashes and carrier receipts recorded in `RELEASE_STATE_2026-05-25.md`.

## Current MVP Launch Focus

The shortest useful launch path is:

1. Keep `main` green and installable.
2. Keep `https://organchor.org` publicly verifiable as the reference self-pilot.
3. Keep future alpha publishes under new release ids, not as stable v1 claims.
4. Run the first low-risk external pilot using `EXTERNAL_PILOT_RUNBOOK.md`.
5. Feed pilot lessons back into onboarding, evidence, and agent-facing verification outputs.

## Not Yet Complete

These are not considered done:

- Broad external organization pilot.
- Live ENS resolver reads through a chosen Ethereum RPC/provider path.
- Real Onion disaster-recovery address registration.
- Broad internet-scale crawling or search infrastructure.
- Third-party Directory adoption outside the project.
- Local-first graphical OrgAnchor Studio.
- Long-running public ecosystem metrics from many independent sweepers.

## Intentionally Outside The Local CLI

OrgAnchor should not become:

- A central certification authority.
- A supplier ranking monopoly.
- A hosted marketplace.
- A SaaS account system.
- A global web crawler by itself.
- A product-quality oracle.
- A replacement for direct origin verification.
- A replacement for external legal, safety, procurement, or buyer policy review.

## Verification Commands

Use these commands for the current local health check:

```bash
node --run release:check
npm run agent:demo
```

Useful focused checks:

```bash
organchor beacon generate --verify-dir public/verify --origin https://example.org
organchor beacon inspect https://example.org
organchor beacon sweep --seeds seeds.txt --out beacon-sweep.ndjson
organchor beacon report --sweeps beacon-sweep.ndjson --out beacon-discovery-report.json
organchor beacon index --in beacon-sweep.ndjson --out beacon-index.json
organchor beacon query --index beacon-index.json --need "identity continuity support"
organchor directory add --origins directory-origins.json --origin https://example.org --category software
organchor directory build --origins directory-origins.json --out public/directory --verify-origins
organchor directory compare --snapshots a.json,b.json
organchor adoption status --verify-dir public/verify --origin https://example.org --level 3
```
