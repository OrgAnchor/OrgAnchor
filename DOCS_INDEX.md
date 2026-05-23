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
- `CHANGELOG.md`: release-facing change history.
- `RELEASE_INTEGRITY.md`: release consistency gate for source, package, public `/verify`, carrier receipts, and notes.

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
- `VALUE_CONTINUITY_MODEL.md`: claims, evidence, outcomes, corrections, and value audit model.
- `EVIDENCE_MODEL.md`: evidence and claims data model.
- `EVIDENCE_ONBOARDING_GUIDE.md`: practical evidence onboarding guide.
- `SHOWCASE_POLICY.md`: rules for examples, case studies, and public listings.

OrgAnchor does not certify that an organization is good or truthful. It makes signed claims, evidence, gaps, and corrections easier to inspect.

## Discovery And Directory

- `DISCOVERY_STRATEGY.md`: post-v1 discovery strategy explaining why OrgAnchor needs both verification and discoverability to reduce real transaction cost between organizations and agents.
- `DIRECTORY_MODEL.md`: proposed post-v1 open discovery index model for helping people and AI agents find OrgAnchor-enabled organizations without creating a monopoly trust platform.

The Directory is not part of the v1 core requirement. It is a future discovery layer over verifiable organization packages, not a certification authority or final ranking service.

## AI Agent Documents

- `AGENT_VERIFICATION_CONTRACT.md`: stable discovery and verification result contract.
- `AGENT_INTEGRATION_GUIDE.md`: practical integration guide for third-party AI agents and automated verifiers.
- `AGENT_COMPATIBILITY_PLAN.md`: iteration plan for improving cross-agent compatibility.
- `examples/agent-verification/organchor-compact-result.json`: compact verification result example.

The preferred low-friction agent path is `/.well-known/organchor.json` plus:

```bash
organchor verify url https://example.org --compact
```

## Examples And Templates

- `examples/complete/`: public minimal example artifacts. These are test/example artifacts, not a real organization identity.
- `templates/self-pilot/`: templates for creating a separate OrgAnchor self-pilot workspace.

## Historical Or Local Notes

The source repository may also contain ignored local notes such as `SELF_PILOT_*.md`, `CLOUDFLARE_*.md`, and `DOMAIN_CANDIDATE_REPORT.md`. These record decisions and provider-specific experience from OrgAnchor's own self-pilot, but they are not package-facing operator instructions.

The current operational self-pilot fact source lives outside this source repository:

```text
E:\CivX\OrgAnchor-self-pilot\SELF_PILOT_STATUS.md
```

That workspace may contain private keys, provider credentials, wallets, local receipts, and deployment outputs. It must not be copied into the public package.

## Current Known Gaps

- No broad external organization pilot has completed yet.
- ENS live resolver reads still require choosing an Ethereum RPC/provider path.
- No real Onion disaster-recovery address has been registered.
- OpenTimestamps proofs may remain pending until calendar proofs are upgraded to Bitcoin attestations.
- The discovery strategy is documented, but no discovery fields, static Directory snapshot, or Directory CLI has been implemented yet.
- The open Directory model is documented, but no Directory CLI or public index has been implemented yet.
- OrgAnchor is still alpha software; CLI flags, schemas, and operator workflow may change before v1.
