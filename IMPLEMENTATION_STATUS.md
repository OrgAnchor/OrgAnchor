# OrgAnchor Implementation Status

Status: active alpha implementation snapshot

Last updated: 2026-07-06

This document records what is already implemented, what remains external or future work, and what OrgAnchor intentionally does not do. It exists to keep development aligned with the project north star: lower the cost for third-party AI agents, organizations, and people to discover, verify, understand, and compare organization-controlled identity and value evidence without turning OrgAnchor into a central trust authority.

## Implemented Core

Identity continuity:

- Root key and threshold root authority creation.
- Signed official-presence statements.
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
- Root-signed lockfile snapshots through `lockfile hash`, `lockfile sign`, and `lockfile verify`.
- `/verify` publication of `organchor.lock.json`, `organchor.lock.json.sig`, and machine-readable `lockfile_integrity` when a signed lockfile is available.

Value evidence layer:

- Signed claims manifests.
- Signed evidence manifests.
- Evidence hash checks.
- External large-artifact references by URI and hash.
- Evidence recheck method objects linked by `method_refs`.
- Value continuity reports.
- Claim-level protocol support levels, support axes, risk gaps, next best actions, and compact support-level counts for external AI agents.
- Real-world profile gap validators for physical product, service delivery, SaaS/API, certification/compliance, and dataset/research claims.
- Policy-route hints for external AI agents.
- Claims/evidence protocol baseline for claim support levels, reproducible methods, third-party attestations, challenges, and low-cost AI-agent evaluation.
- Purpose/evidence/challenge model documented as the accepted three-axis direction for P1-P5 purpose profiles, S1-S5 observation source classes, S2 effective third-party material boundaries, and challenge/correction/accountability lifecycle states.
- S2 third-party material basic usability implemented: optional `s_class`/`s2` metadata, `evidence s2 template`, `evidence s2 attach`, candidate versus effective S2 classification, local Core checks, S2 gap extraction, value-audit `s2_summary`, and compact agent `s2_summary`.
- S3 random purchase / sampling basic usability implemented: optional `s_class`/`s3` metadata, `evidence s3 template`, `evidence s3 attach`, candidate versus effective S3 classification, sample identity/source/selector checks, sample slot declaration, bounded active pool checks, credential/nullifier checks, raw evidence availability and storage-role checks, organization-selected/provided sample exposure, custody gap extraction, value-audit `s3_summary`, and compact agent `s3_summary`.
- Package health layer documented as the accepted direction for self-declared and observed package health, maintenance responsibility, stale/broken/expired evidence visibility, and low-cost agent fetch recommendations.
- Product/service credential layer documented as an accepted design direction for delegated operational keys, five-class observation sources, and attribution of observations, complaints, tests, and corrections to the organization root authority chain.
- Commercial fit layer documented as an accepted design direction for price disclosure modes, signed public price sheets, private signed quotes, lead time, MOQ, validity windows, and commercial-fit routing without turning OrgAnchor into a marketplace or price judge.
- Evidence sufficiency model documented as an accepted design principle so OrgAnchor can avoid field-count competition and report purpose-fit support instead of universal completeness scores.
- Subject binding model documented as the accepted rule that discovery matches, claims, evidence, samples, observations, credentials, and challenges must declare the subject they cover and must not silently widen evidence coverage.

Carriers and auxiliary surfaces:

- IPFS dry-run, Kubo publish/verify, remote pinning, and Pinata upload receipts.
- Arweave manual packages, Turbo upload receipts, gateway TX verification, and size estimation.
- OpenTimestamps proof creation, upgrade, and verification.
- Signed publication receipt ledger integrity for carrier receipt history.
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
- Discovery Unit model documented as the accepted direction for default AI-agent discovery granularity, featured sellable units, coverage profiles, disclosure maturity, coverage previews, exact/family/capability match classes, and avoiding both organization-only search and SKU-level marketplace explosion.
- Local agent discovery demo covering seed -> sweep -> report -> index -> query -> Directory -> direct verify.

Release hygiene:

- Type checking.
- Node test suite.
- Release smoke.
- Package smoke.
- Install smoke.
- Package inclusion checks that reject private keys, local credentials, wallets, Cloudflare notes, and self-pilot private artifacts.
- Alpha-line release-state matrix and checklist alignment merged into `main`.
- `organchor@0.1.0-alpha.4` published through npm Trusted Publishing under the `alpha` dist-tag, with npm provenance metadata and an aligned GitHub prerelease.
- Public self-pilot release-state hashes and carrier receipts recorded in `RELEASE_STATE_2026-05-25.md`.
- Public self-pilot minimal review recorded in `PUBLIC_SELF_PILOT_MINIMAL_REVIEW_2026-07-06.md`, including public compact verification, doctor readiness, signed statement verification, signed claims/evidence verification, and root-signed lockfile verification.
- Alpha.4 public release linkage, clean npm install, homepage, `/verify`, Beacon, machine index, and installed-CLI verification recorded in `PUBLIC_SELF_VERIFICATION_2026-07-15.md`.

## Current Fireseed Launch Focus

The `0.1.0-alpha.4` release-convergence batch is published and publicly verified. The current task is no longer release preparation; it is Fireseed external falsification: measure whether independent reviewers and Agents can reproduce the loop, preserve the trust boundary, and lower fact-recovery and screening cost compared with ordinary website-only review.

The current launch path is Fireseed Alpha, defined in `FIRESEED_ALPHA_PLAN.md`, with the operational GO/HOLD decision in `FIRESEED_READINESS_GATE.md` and the first GO decision in `FIRESEED_LAUNCH_DECISION_2026-06-01.md`.

Fireseed Alpha is the minimum necessary public collaboration loop:

```text
identity continuity;
public /verify;
AI-agent-readable verification;
signed claims/evidence;
S1-S3 evidence baseline;
S4/S5 design preview;
clear invitation for external review and co-builders.
```

The shortest useful launch path is now:

1. Keep `main` green and installable.
2. Keep `https://organchor.org` publicly verifiable as the reference self-pilot.
3. Keep future alpha publishes under new release ids, not as stable v1 claims.
4. Keep Fireseed boundaries visible: S1-S3 are the current evidence baseline, while S4/S5, product/service credentials, package health, and commercial fit remain design or partial surfaces unless a specific implemented command and test is cited.
5. Use `PUBLIC_SELF_PILOT_MINIMAL_REVIEW_2026-07-06.md`, `PUBLIC_RELEASE_CHECKLIST.md`, and `FIRESEED_READINESS_GATE.md` as the public-release evidence gate.
6. Invite named early adopting organizations, technical reviewers, and evidence/governance critics according to `FIRESEED_LAUNCH_DECISION_2026-06-01.md`.
7. Run the first low-risk external pilot using `PILOT_MINIMAL_PATH.md` first, then `EXTERNAL_PILOT_RUNBOOK.md` if the pilot needs the full path.
8. Feed pilot lessons back into onboarding, evidence, and agent-facing verification outputs.
9. Use `FIRESEED_TRANSACTION_COST_BENCHMARK.md` to compare website-only and OrgAnchor-enabled review before making any public transaction-cost reduction claim.

## Not Yet Complete

These are not considered done:

- Broad external organization pilot.
- Dedicated method, attestation, and challenge manifests from `CLAIMS_EVIDENCE_PROTOCOL.md`.
- Delegated product/service key statements, product model passports, batch commitments, unit credentials, service delivery credentials, and observation binding checks from `PRODUCT_SERVICE_CREDENTIAL_LAYER.md`.
- Commercial-fit manifests, signed public price sheets, delegated commercial keys, private signed quote verification, and compact commercial-fit summaries from `COMMERCIAL_FIT_LAYER.md`.
- Common subject binding helpers, subject relation checks, and compact subject coverage outputs from `SUBJECT_BINDING_MODEL.md`.
- Purpose-fit evidence outputs such as `fit_for`, `not_enough_for`, and `missing_optional_context` from `EVIDENCE_SUFFICIENCY_MODEL.md`.
- Discovery Unit schemas, validators, Beacon fields, Directory fields, and coverage-preview query behavior from `DISCOVERY_UNIT_MODEL.md`.
- P1-P5 purpose-profile validators, broader S1/S4/S5 source-class fields, S2 network verified-route adapters, issuer-backed S2 signatures from `S2_THIRD_PARTY_MATERIAL_MODEL.md`, S3 custody/independent-test route adapters from `S3_RANDOM_SAMPLING_MODEL.md`, and S5 challenge/correction/accountability lifecycle extraction from `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`.
- Fireseed Alpha intentionally treats S4 and S5 as Design Preview, not launch acceptance gates. Their concepts are documented, but mature observer networks, privacy handling, negative-evidence governance, public challenge abuse controls, historical accountability interpretation, and durable storage incentives remain future/co-builder work.
- Package health commands, observed health lookup, Beacon health summaries, Directory health observation summaries, observed health reports, and agent fetch recommendations from `PACKAGE_HEALTH_LAYER.md`.
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
organchor evidence s2 template --template certification_record
organchor evidence s2 attach --evidence-id evidence-001 --template certification_record --issuer-name "Example Certification Body" --anchor-url https://registry.example/records/ABC-123 --scope "Certificate supports claim-001 for model-x1"
organchor evidence s3 template --template market_purchase
organchor evidence s3 attach --evidence-id evidence-001 --template market_purchase --sampler-type buyer --acquired-at 2026-05-28T00:00:00Z --subject-type product_model --subject-id model-x1 --sample-slot-id sample-slot-claim-001-2026-05-001 --storage-role DIRECTORY_VAULT --raw-availability-status REQUEST_REQUIRED --scope "Random market purchase sample supports claim-001 for model-x1"
```
