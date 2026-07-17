# OrgAnchor Documentation Index

Status: Active documentation map.

## Purpose

This index explains which OrgAnchor documents are current operating guidance, which are design records, and which are historical or local self-pilot notes.

OrgAnchor has intentionally grown beyond a small signing utility. Without a map, readers can confuse current instructions with early planning notes. Treat this file as the first stop after `README.md`.

## Recommended Reading Paths

If you are seeing OrgAnchor for the first time:

- Start with `PUBLIC_EXPLAINER.md` for the public explanation.
- Then read `DESIGN_RATIONALE.md` for the full goal -> mechanism -> effect -> limit logic.
- Then read `README.md` for install, demo, current status, and boundaries.
- Use `VISIBLE_ACCEPTANCE.md` to see the local `/verify` page, agent summary, and tamper-failure demo.

If you are an AI-agent builder, verifier, crawler, or Directory builder:

- Start with `AGENT_INTEGRATION_GUIDE.md` and `AGENT_VERIFICATION_CONTRACT.md`.
- Then inspect `examples/agent-discovery-loop/` and the Beacon / Directory documents.
- Use `CAPABILITY_TRACEABILITY_MATRIX.md` and `CAPABILITY_AUDIT_SCENARIOS.md` to check whether public claims are implemented, tested, or only documented.

If you are reviewing evidence quality, abuse risk, or real-world usefulness:

- Start with `CLAIMS_EVIDENCE_PROTOCOL.md`, `EVIDENCE_SUFFICIENCY_MODEL.md`, `S2_THIRD_PARTY_MATERIAL_MODEL.md`, and `S3_RANDOM_SAMPLING_MODEL.md`.
- Treat S1-S3 as the current Fireseed Alpha evidence baseline.
- Treat S4/S5 as design-preview territory unless a specific implemented command, schema, and test is cited.

If you are preparing publication material:

- Use this source repository for verified project facts, boundaries, and reproducible commands.
- Keep video scripts, rendered media, platform post drafts, presentation outlines, and sponsorship letters outside the source repository and npm package.
- Keep the boundary clear: OrgAnchor is not a trust badge, certification authority, marketplace, official registry, or final ranking system.

If you are reviewing how the project is operated by a human owner and AI execution lead:

- Start with `AI_OPERATING_MODEL.md`.
- Then use `PROJECT_NORTH_STAR.md`, `DESIGN_RATIONALE.md`, `IMPLEMENTATION_STATUS.md`, and `CAPABILITY_TRACEABILITY_MATRIX.md` to check whether execution stays aligned with the accepted project purpose and current implementation state.

## Current Public Entry Points

- `README.md`: project overview, alpha install, quick start, current status, and safety boundaries.
- `DOCS_INDEX.md`: this documentation map.
- `CAPABILITY_TRACEABILITY_MATRIX.md`: implementation-audit map linking public capability claims to status, commands, tests, artifacts, and limits.
- `CAPABILITY_AUDIT_SCENARIOS.md`: executable scenario audit map linking capability groups to runnable command paths and generated reports.
- `VISIBLE_ACCEPTANCE.md`: human-visible acceptance guide for seeing the local `/verify` page, agent summary, and tamper-failure demo.
- `VISIBLE_ACCEPTANCE_REVIEW_2026-06-01.md`: current review snapshot for the visible acceptance page, including the Fireseed language gap caveat.
- `PUBLIC_LAUNCH_REVIEW_2026-06-06.md`: current pre-public-asset consistency review covering positioning, implementation/documentation alignment, public-material hygiene, Fireseed boundaries, AI-agent path, and verification results.
- `PUBLIC_SELF_PILOT_MINIMAL_REVIEW_2026-07-06.md`: current external-view public self-pilot review against the minimal pilot path, including verified identity/evidence results and the resolved public root-signed lockfile verification result.
- `LANGUAGE_COMPATIBILITY.md`: active policy for stable machine contracts and localized human explanation.
- `CONTRIBUTING.md`: Fireseed contributor guide for adopter trials, technical review, evidence/governance review, PR hygiene, and scope boundaries.
- `CALL_FOR_FIRESEED_REVIEW.md`: public Fireseed review invitation and success condition.
- `FIRESEED_OUTREACH_KIT.md`: practical external-validation starter kit with track-specific tasks, commands, feedback routing, success/hold criteria, and invitation text.
- `PUBLIC_EXPLAINER.md`: public entrance explanation for first-time readers, non-specialist reviewers, and first-pass AI summaries.
- `DESIGN_RATIONALE.md`: full explanatory design rationale connecting the core goal to required properties, mechanisms, expected effects, and limits.
- `AI_OPERATING_MODEL.md`: active project operating model for human-owner and AI-execution-lead collaboration, including default execution authority and required owner decision gates.
- `PUBLIC_RELEASE_CHECKLIST.md`: active public-release operating gate for local checks, public self-pilot checks, asset alignment, owner intervention gates, publishing order, and hold criteria.
- `PUBLIC_SELF_VERIFICATION_2026-07-17.md`: current Alpha.5 tag, npm provenance, clean-install, public endpoint, Agent-interface, and disclosed-limit verification result; `PUBLIC_SELF_VERIFICATION_2026-07-17.zh-CN.md` is its Chinese translation.
- `EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md`: active runnable Fireseed evaluation for testing whether an unfamiliar Agent separates valid identity/package integrity from insufficient product-claim evidence.
- `EVIDENCE_STALENESS_ADVERSARIAL_EVALUATION.md`: active Wave 2 evaluation for testing whether an Agent preserves expired evidence as history without treating it as current support.
- `EVIDENCE_CONFLICT_ADVERSARIAL_EVALUATION.md`: active Wave 3 evaluation for testing whether an Agent preserves conflicting current S2/S3 evidence, bounded scope, and unresolved uncertainty.
- `EXTERNAL_AGENT_EVALUATION_RUNBOOK.md`: isolation, raw-result preservation, scoring, semantic review, and GitHub submission procedure for independent Agent repetitions.
- `FIRESEED_TRANSACTION_COST_BENCHMARK.md`: retired internal retrieval-calibration record; preserved for history but no longer an active Fireseed target or packaged npm document.
- `PUBLIC_RELEASE_PRECHECK_2026-07-06.md`: historical pre-Alpha.4 local release gate, capability audit, public self-pilot, public root-signed lockfile, and diff-hygiene snapshot.
- `CURRENT_PROJECT_STATE_2026-07-02.md`: historical source-repository state snapshot as of 2026-07-02, including the Fireseed boundary, repository boundary, next-work order, and hold conditions at that date.
- `ADOPTER_QUICKSTART.md`: shortest practical path for an adopting organization to create a root authority, signed official-presence statement, public `/verify` package, and first adoption status.
- `PILOT_MINIMAL_PATH.md`: minimal external pilot definition, required artifacts, approval gates, independent verification path, and pilot feedback record.
- `FIRESEED_VALIDATION_TRACKING_ISSUE.md`: copyable GitHub tracking issue for Fireseed Alpha External Validation Wave 1.
- `ROADMAP.md`: implementation stages and current project direction.
- `V1_ACCEPTANCE.md`: definition of v1 completeness.
- `IMPLEMENTATION_STATUS.md`: current implemented surface, remaining gaps, non-goals, and verification commands.
- `MVP_LAUNCH_CHECKLIST.md`: alpha MVP launch gate for package publication and first external pilot readiness.
- `FIRESEED_ALPHA_PLAN.md`: accepted Fireseed Alpha boundary for S3-focused minimum evidence closure, S4/S5 design preview, freeze rules, and co-builder invitation.
- `FIRESEED_ALPHA_COMPLETION_AUDIT_2026-07-06.md`: current requirement-by-requirement completion audit for Fireseed Alpha public-release preparation.
- `FIRESEED_ALPHA4_LOCAL_CONVERGENCE_2026-07-11.md`: local Alpha.4 release-convergence result covering Agent status semantics, legacy-report fallback, package size, tests, and unchanged external state.
- `FIRESEED_READINESS_GATE.md`: active GO/HOLD gate for deciding whether Fireseed outreach can begin without overclaiming readiness.
- `FIRESEED_LAUNCH_DECISION_2026-06-01.md`: Fireseed GO decision record for named early adopter, technical, and evidence/governance outreach.
- `CHANGELOG.md`: release-facing change history.
- `RELEASE_INTEGRITY.md`: release consistency gate for source, package, public `/verify`, carrier receipts, and notes.
- `RELEASE_PUBLISHING_PLAN.md`: operator publishing plan for npm, GitHub tags, GitHub releases, and trusted publishing.
- `NPM_TRUSTED_PUBLISHING.md`: GitHub Actions OIDC publishing setup so npm releases do not rely on repeated local login or long-lived publish tokens.

## Core Design Documents

- `PROJECT_NORTH_STAR.md`: active alignment gate for keeping features focused on lower-friction discovery, verification, understanding, and non-monopolistic trust decisions.
- `DESIGN_RATIONALE.md`: system-level explanation of why OrgAnchor's layers should reduce discovery, verification, understanding, and transaction-friction costs without making OrgAnchor a final trust authority.
- `AI_OPERATING_MODEL.md`: project operating model for AI-assisted execution, owner decision gates, feedback intake, anti-drift controls, and security boundaries. This is not part of the OrgAnchor verification protocol.
- `PROTOCOL_EVOLUTION_POLICY.md`: accepted policy for schema/version evolution, legacy verification, historical package preservation, and migration without retroactively invalidating old adopter records.
- `PROJECT_BRIEF.md`: original project brief and positioning.
- `PRODUCT_SHAPE.md`: accepted product surfaces: core library, CLI, future local-first studio, and adopting-organization `/verify` page.
- `ARCHITECTURE.md`: layered trust model and implementation structure.
- `TECHNICAL_DECISIONS.md`: accumulated technical decisions.
- `CRYPTO_POLICY.md`: cryptographic policy, algorithm agility, and post-quantum stance.
- `THREAT_MODEL.md`: risks OrgAnchor does and does not address.
- `LANGUAGE_COMPATIBILITY.md`: language policy for keeping AI-agent protocol fields stable while allowing human-facing localization.
- `docs/adr/*.md`: accepted architecture decision records.

## Adoption And Operator Guides

- `ADOPTION_MODEL.md`: adoption levels and repeatability model.
- `ADOPTION_PRINCIPLES.md`: good-fit and poor-fit adopter guidance.
- `ADOPTION_GUIDE.md`: operator-oriented adoption explanation.
- `ADOPTER_QUICKSTART.md`: concise adopter path for reaching the minimum identity -> verify -> agent-readable loop.
- `ORG_ONBOARDING_CHECKLIST.md`: checklist for an adopting organization.
- `PILOT_MINIMAL_PATH.md`: narrow Fireseed Alpha external pilot path before using the full runbook.
- `EXTERNAL_PILOT_RUNBOOK.md`: shortest repeatable path for the first low-risk external organization pilot.
- `ROOT_AUTHORITY_CUSTODY_GUIDE.md`: root authority custody, loss, compromise, and governance guidance.
- `PROTOCOL_EVOLUTION_POLICY.md`: protocol evolution and legacy-verification rules for adopters that need old snapshots to remain historically verifiable.
- `MIGRATION_GUIDE.md`: root authority migration and historical continuity runbook.
- `PUBLISHING_GUIDE.md`: website, IPFS, Arweave, OpenTimestamps, and publishing limits.
- `DOMAIN_HARDENING_GUIDE.md`: traditional domain audit and hardening guidance.

## Value, Evidence, And Showcase

- `PURPOSE_AND_VALUES.md`: project purpose and misuse boundaries.
- `CLAIMS_EVIDENCE_PROTOCOL.md`: protocol baseline for structured claims, evidence, methods, third-party attestations, challenges, and AI-agent claim-support output.
- `CLAIMS_EVIDENCE_IMPLEMENTATION_PLAN.md`: implementation map showing what is already alpha-ready and what remains for method, attestation, challenge, and agent-output work.
- `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`: canonical three-axis model for purpose profiles, observation source classes, and challenge/correction/accountability lifecycle.
- `EVIDENCE_SUFFICIENCY_MODEL.md`: accepted design principle that OrgAnchor should judge evidence by purpose-fit sufficiency, not raw field count, completeness scores, or paperwork volume.
- `EVIDENCE_RETENTION_REALITY_PRINCIPLE.md`: accepted design principle for S3-S5 raw evidence storage reality, availability states, downgrade semantics, and future ledger readiness.
- `SUBJECT_BINDING_MODEL.md`: accepted design model for binding discovery units, claims, evidence, samples, observations, credentials, and challenges to the exact subject they cover.
- `OBSERVATION_ROUTING_GUIDE.md`: accepted operator and tool guidance for routing observation records to S3 sample conformance, S4 performance continuity, mixed records, or unclear cases, including the current route/template CLI flow.
- `S2_THIRD_PARTY_MATERIAL_MODEL.md`: implementation-facing S2 model for third-party material fields, Core/Extension boundaries, mechanical checks, and agent summaries.
- `S3_RANDOM_SAMPLING_MODEL.md`: implementation-facing S3 model for real market/customer-site sample acquisition, sample-control checks, Evidence Vault storage, sample sufficiency, historical retention, and agent summaries.
- `S3_INTAKE_AND_SLOT_MODEL.md`: accepted S3 intake and anti-brushing model for candidate signals, sample-slot admission, bounded active pools, raw-vault admission, storage roles, and spam/storage-exhaustion risks.
- `S3_SAMPLE_RECORD_SPEC.md`: protocol shape, JSON examples, and schema references for standalone S3 sample event and sample-set records.
- `S4_REAL_WORLD_OBSERVATION_MODEL.md`: implementation-facing S4 model for real delivery, real use, supply continuity, support, repair, monitoring, and field-observation records, strictly separated from S3 sample testing.
- `PACKAGE_HEALTH_LAYER.md`: accepted design model for self-declared and observed package health, maintenance responsibility, stale/broken/expired evidence visibility, and low-cost agent fetch decisions.
- `COMMERCIAL_FIT_LAYER.md`: accepted design direction for price disclosure modes, public price sheets, private signed quotes, lead time, MOQ, validity, and commercial-fit routing without becoming a marketplace.
- `REAL_WORLD_EVIDENCE_PROFILE.md`: minimum evidence profile for real products and services, including scoped claims, hash-bound evidence, recheck methods, limitations, and anti-gaming rules.
- `PRODUCT_SERVICE_CREDENTIAL_LAYER.md`: accepted design direction for delegated product/service signing keys, model/batch/unit credentials, service delivery credentials, and feedback attribution to the organization root authority chain.
- `VALUE_CONTINUITY_MODEL.md`: claims, evidence, outcomes, corrections, and value audit model.
- `EVIDENCE_MODEL.md`: evidence and claims data model.
- `EVIDENCE_ONBOARDING_GUIDE.md`: practical evidence onboarding guide.
- `SHOWCASE_POLICY.md`: rules for examples, case studies, and public listings.

OrgAnchor does not certify that an organization is good or truthful. It makes signed claims, evidence, methods, attestations, gaps, challenges, and corrections easier to inspect.

## Discovery, Beacon, And Directory

- `DISCOVERY_STRATEGY.md`: post-v1 discovery strategy explaining why OrgAnchor needs both verification and discoverability to reduce real transaction cost between organizations and agents.
- `DISCOVERY_UNIT_MODEL.md`: accepted design model for default AI-agent discovery granularity, product/service-family Discovery Units, coverage previews, and anti-SKU-marketplace boundaries.
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
- `VISIBLE_ACCEPTANCE.md`: plain-language bridge between human-visible `/verify` review and machine-readable `agent_review` output.
- `EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md`: scenario definition and scorer boundary for adversarial evidence interpretation.
- `EVIDENCE_STALENESS_ADVERSARIAL_EVALUATION.md`: fixed-time scenario and scorer boundary for historical-versus-current evidence interpretation.
- `EVIDENCE_CONFLICT_ADVERSARIAL_EVALUATION.md`: fixed-time scenario and scorer boundary for conflicting-current-evidence interpretation.
- `EXTERNAL_AGENT_EVALUATION_RUNBOOK.md`: operator procedure for producing comparable fresh-context external Agent results without exposing the answer key.
- `evaluation-results/evidence-interpretation/WAVE1_SUMMARY.md`: bounded results and limitations from the first three isolated Agent evidence-interpretation runs.
- `evaluation-results/evidence-interpretation/WAVE2_CALIBRATION_SUMMARY.md`: internal stale-evidence calibration, low-friction machine-path comparison, and remaining external-validation requirement.
- `evaluation-results/evidence-interpretation/WAVE3_CALIBRATION_SUMMARY.md`: retained conflicting-current-evidence results, corrected defects, and the ordinary external-signature verification gap.

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
npm run visible:demo -- --out ./visible-demo --serve
```

## Examples And Templates

- `examples/complete/`: public minimal example artifacts. These are test/example artifacts, not a real organization identity.
- `examples/adopter-minimal/`: safe adopter skeleton with placeholder config and the shortest local command path. It is not a real organization identity.
- `examples/s2-third-party-material/`: S2 third-party material example showing the template and attach workflow for certification-style evidence.
- `examples/s3-random-sampling/`: S3 random purchase / sampling example showing the template and attach workflow for anti-hand-picked-sample evidence, plus standalone sample event and sample-set examples.
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
- The purpose/evidence/challenge model is documented as the canonical design. Local S2 third-party material checks and local S3 random purchase / sampling checks are implemented. The S3 intake and sample-slot model is documented, while slot issuance, slot verification, slot-use ledgers, raw-vault admission workflows, P1-P5 purpose-profile validators, broader S1/S4/S5 source-class fields, S2 network route adapters, issuer-backed S2 signatures, S3 custody/independent-test route adapters, S4 delivery/use observation commands, and S5 challenge/correction/accountability lifecycle extraction are not implemented yet.
- The product/service credential layer is documented as an accepted direction, but delegated key statements, model/batch/unit credentials, service delivery credentials, and observation binding are not implemented yet.
- The commercial fit layer is documented as an accepted direction, but public commercial-fit manifests, signed price sheets, delegated commercial keys, private signed quote verification, and compact commercial-fit summaries are not implemented yet.
- ENS live resolver reads still require choosing an Ethereum RPC/provider path.
- No real Onion disaster-recovery address has been registered.
- OpenTimestamps proofs may remain pending until calendar proofs are upgraded to Bitcoin attestations.
- The discovery strategy, Beacon model, verification-gated Beacon generation, static Directory snapshot shape, controlled discovery taxonomy, first-pass doctor report, seed/sitemap/Directory/bounded-crawl Beacon sweep, local Beacon index, local Beacon need-match query result, local discovery-quality reporting, static Directory candidate source maintenance, Beacon-index-to-Directory export, Directory export, and Directory snapshot comparison are documented or implemented; broad internet-scale crawling is still intentionally outside the local CLI.
- The open Directory model is documented, but broad third-party Directory adoption has not begun yet.
- OrgAnchor is still alpha software; CLI flags, schemas, and operator workflow may change before v1.
