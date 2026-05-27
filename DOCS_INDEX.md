# OrgAnchor Documentation Index

Status: Active documentation map.

## Purpose

This index explains which OrgAnchor documents are current operating guidance, which are design records, and which are historical or local self-pilot notes.

OrgAnchor has intentionally grown beyond a small signing utility. Without a map, readers can confuse current instructions with early planning notes. Treat this file as the first stop after `README.md`.

## Current Public Entry Points

- `README.md`: project overview, alpha install, quick start, current status, and safety boundaries.
- `DOCS_INDEX.md`: this documentation map.
- `ROADMAP.md`: implementation stages and current project direction.
- `V1_ACCEPTANCE.md`: definition of v1 completeness.
- `IMPLEMENTATION_STATUS.md`: current implemented surface, remaining gaps, non-goals, and verification commands.
- `MVP_LAUNCH_CHECKLIST.md`: alpha MVP launch gate for package publication and first external pilot readiness.
- `CHANGELOG.md`: release-facing change history.
- `RELEASE_INTEGRITY.md`: release consistency gate for source, package, public `/verify`, carrier receipts, and notes.
- `RELEASE_PUBLISHING_PLAN.md`: operator publishing plan for npm, GitHub tags, GitHub releases, and trusted publishing.
- `NPM_TRUSTED_PUBLISHING.md`: GitHub Actions OIDC publishing setup so npm releases do not rely on repeated local login or long-lived publish tokens.

## Core Design Documents

- `PROJECT_NORTH_STAR.md`: active alignment gate for keeping features focused on lower-friction discovery, verification, understanding, and non-monopolistic trust decisions.
- `PROJECT_BRIEF.md`: original project brief and positioning.
- `PRODUCT_SHAPE.md`: accepted product surfaces: core library, CLI, future local-first studio, and adopting-organization `/verify` page.
- `ARCHITECTURE.md`: layered trust model and implementation structure.
- `TECHNICAL_DECISIONS.md`: accumulated technical decisions.
- `CRYPTO_POLICY.md`: cryptographic policy, algorithm agility, and post-quantum stance.
- `THREAT_MODEL.md`: risks OrgAnchor does and does not address.
- `docs/adr/*.md`: accepted architecture decision records.

## Adoption And Operator Guides

- `ADOPTION_MODEL.md`: adoption levels and repeatability model.
- `ADOPTION_PRINCIPLES.md`: good-fit and poor-fit adopter guidance.
- `ADOPTION_GUIDE.md`: operator-oriented adoption explanation.
- `ORG_ONBOARDING_CHECKLIST.md`: checklist for an adopting organization.
- `EXTERNAL_PILOT_RUNBOOK.md`: shortest repeatable path for the first low-risk external organization pilot.
- `ROOT_AUTHORITY_CUSTODY_GUIDE.md`: root authority custody, loss, compromise, and governance guidance.
- `MIGRATION_GUIDE.md`: root authority migration and historical continuity runbook.
- `PUBLISHING_GUIDE.md`: website, IPFS, Arweave, OpenTimestamps, and publishing limits.
- `DOMAIN_HARDENING_GUIDE.md`: traditional domain audit and hardening guidance.

## Value, Evidence, And Showcase

- `PURPOSE_AND_VALUES.md`: project purpose and misuse boundaries.
- `CLAIMS_EVIDENCE_PROTOCOL.md`: protocol baseline for structured claims, evidence, methods, third-party attestations, challenges, and AI-agent claim-support output.
- `CLAIMS_EVIDENCE_IMPLEMENTATION_PLAN.md`: implementation map showing what is already alpha-ready and what remains for method, attestation, challenge, and agent-output work.
- `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`: canonical three-axis model for purpose profiles, observation source classes, and challenge/correction lifecycle.
- `EVIDENCE_SUFFICIENCY_MODEL.md`: accepted design principle that OrgAnchor should judge evidence by purpose-fit sufficiency, not raw field count, completeness scores, or paperwork volume.
- `PACKAGE_HEALTH_LAYER.md`: accepted design model for self-declared and observed package health, maintenance responsibility, stale/broken/expired evidence visibility, and low-cost agent fetch decisions.
- `REAL_WORLD_EVIDENCE_PROFILE.md`: minimum evidence profile for real products and services, including scoped claims, hash-bound evidence, recheck methods, limitations, and anti-gaming rules.
- `PRODUCT_SERVICE_CREDENTIAL_LAYER.md`: accepted design direction for delegated product/service signing keys, model/batch/unit credentials, service delivery credentials, and feedback attribution to the organization root authority chain.
- `VALUE_CONTINUITY_MODEL.md`: claims, evidence, outcomes, corrections, and value audit model.
- `EVIDENCE_MODEL.md`: evidence and claims data model.
- `EVIDENCE_ONBOARDING_GUIDE.md`: practical evidence onboarding guide.
- `SHOWCASE_POLICY.md`: rules for examples, case studies, and public listings.

OrgAnchor does not certify that an organization is good or truthful. It makes signed claims, evidence, methods, attestations, gaps, challenges, and corrections easier to inspect.

## Discovery, Beacon, And Directory

- `DISCOVERY_STRATEGY.md`: post-v1 discovery strategy explaining why OrgAnchor needs both verification and discoverability to reduce real transaction cost between organizations and agents.
- `ORGANCHOR_BEACON.md`: Beacon-first discoverability model so every adopter can emit origin-owned machine-readable signals before any Directory includes it.
- `DISCOVERY_TAXONOMY.md`: controlled-but-extensible category, capability, region, and language vocabulary for low-cost candidate discovery.
- `DIRECTORY_MODEL.md`: proposed post-v1 open discovery index model for helping people and AI agents find OrgAnchor-enabled organizations without creating a monopoly trust platform.
- `DIRECTORY_SNAPSHOT_SPEC.md`: proposed static Directory snapshot format, optional origin verification mode, inspect/fetch commands, and verify-index discovery pointer for low-cost AI-agent candidate discovery before direct origin verification.

The Beacon layer is the preferred anti-capture foundation for discovery. The Directory is an optional accelerator over public Beacons and verifiable organization packages, not a certification authority or final ranking service.

## AI Agent Documents

- `AGENT_VERIFICATION_CONTRACT.md`: stable discovery and verification result contract.
- `AGENT_INTEGRATION_GUIDE.md`: practical integration guide for third-party AI agents and automated verifiers.
- `AGENT_COMPATIBILITY_PLAN.md`: iteration plan for improving cross-agent compatibility.
- `examples/agent-verification/organchor-compact-result.json`: compact verification result example.
- `examples/agent-verification/organchor-beacon-query-result.json`: Beacon need-match discovery result example.
- `examples/agent-discovery-loop/`: runnable seed -> sweep -> index -> query -> verify discovery-loop example.

The preferred low-friction agent path is `/.well-known/organchor.json` plus:

```bash
organchor verify url https://example.org --compact
organchor doctor https://example.org
organchor beacon sweep --seeds seeds.txt --out beacon-sweep.ndjson
organchor beacon sweep --crawl https://example.org --crawl-max-pages 25 --crawl-max-depth 1 --out beacon-sweep.ndjson
organchor beacon sweep --directory-snapshot public/directory/directory-snapshot.json --out beacon-sweep.ndjson
organchor beacon verify --in beacon-sweep.ndjson
organchor beacon index --in beacon-sweep.ndjson --out beacon-index.json
organchor beacon query --index beacon-index.json --need "identity continuity support" --capability identity-continuity --limit 10
organchor adoption status --verify-dir public/verify --origin https://example.org --level 3
organchor directory build --beacon-index beacon-index.json --node-origin https://directory.example --out public/directory
organchor directory compare --snapshots directory-a.json,directory-b.json
organchor directory export --snapshot public/directory/directory-snapshot.json --format ndjson
npm run agent:demo
```

## Examples And Templates

- `examples/complete/`: public minimal example artifacts. These are test/example artifacts, not a real organization identity.
- `examples/agent-discovery-loop/`: local AI-agent discovery loop example, backed by `npm run agent:demo`.
- `examples/directory/directory-snapshot.json`: static Directory snapshot example for AI-agent discovery tests.
- `examples/directory/directory-origins.json`: static Directory build input example.
- `templates/self-pilot/`: templates for creating a separate OrgAnchor self-pilot workspace.

## Source-Only Historical Or Local Notes

The source repository may also contain milestone review, release hygiene, pilot decision, or ignored local notes such as `PILOT_PLAN.md`, `V1_RELEASE_CHECKLIST.md`, `ACCEPTANCE_REVIEW_*.md`, `RELEASE_STATE_*.md`, `CHANGESET_PLAN_*.md`, `DIFF_REVIEW_*.md`, `SELF_PILOT_*.md`, `CLOUDFLARE_*.md`, and `DOMAIN_CANDIDATE_REPORT.md`. These record decisions, review snapshots, release-state snapshots, commit planning, and provider-specific experience from OrgAnchor's own self-pilot, but they are not package-facing operator instructions.

The current operational self-pilot fact source lives outside this source repository:

```text
E:\CivX\OrgAnchor-self-pilot\SELF_PILOT_STATUS.md
```

That workspace may contain private keys, provider credentials, wallets, local receipts, and deployment outputs. It must not be copied into the public package.

## Current Known Gaps

- No broad external organization pilot has completed yet.
- The claims/evidence protocol is stronger than the current alpha implementation: signed claims, signed evidence, value audit, and `/verify` publication exist, while dedicated method, attestation, and challenge manifests remain future work.
- The purpose/evidence/challenge model is documented as the canonical design, but P1-P5 purpose-profile validators, S1-S5 source-class fields, and challenge/correction lifecycle extraction are not implemented yet.
- The product/service credential layer is documented as an accepted direction, but delegated key statements, model/batch/unit credentials, service delivery credentials, and observation binding are not implemented yet.
- ENS live resolver reads still require choosing an Ethereum RPC/provider path.
- No real Onion disaster-recovery address has been registered.
- OpenTimestamps proofs may remain pending until calendar proofs are upgraded to Bitcoin attestations.
- The discovery strategy, Beacon model, verification-gated Beacon generation, static Directory snapshot shape, controlled discovery taxonomy, first-pass doctor report, seed/sitemap/Directory/bounded-crawl Beacon sweep, local Beacon index, local Beacon need-match query result, local discovery-quality reporting, static Directory candidate source maintenance, Beacon-index-to-Directory export, Directory export, and Directory snapshot comparison are documented or implemented; broad internet-scale crawling is still intentionally outside the local CLI.
- The open Directory model is documented, but broad third-party Directory adoption has not begun yet.
- OrgAnchor is still alpha software; CLI flags, schemas, and operator workflow may change before v1.
