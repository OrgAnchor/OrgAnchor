# OrgAnchor

OrgAnchor helps organizations publish signed, recheckable public records that link identity, official presence, claims, evidence, and migration history so people and AI agents can discover, screen, verify, understand, and compare candidate organizations at lower cost across domain, platform, website, or infrastructure changes.

OrgAnchor 帮助组织发布经过签名、可复查的公开资料，将身份、官方入口、主张、证据和迁移历史串联起来，使外部用户和 AI Agent 即使面对域名、平台账号、官网或基础设施变化，也能以更低成本发现、初筛、验证、理解和比较候选组织。

## 3-Minute Version

OrgAnchor is a Fireseed Alpha project for organization identity continuity and evidence-aware verification.

The short version:

- It helps an organization publish signed records of who it is, where its official presence can be found, what it claims, what evidence it exposes, and what changed over time.
- It helps people and AI agents reduce the cost of deciding whether an organization is worth deeper review, contact, partnership, purchase, or support.
- It gives external AI agents a low-friction path to discover `/.well-known/organchor.json`, verify signatures and hashes, inspect evidence gaps, and decide what to check next.
- It treats websites, IPFS, Arweave, Onion, ENS, Directory snapshots, and cloud platforms as carriers or discovery aids, not as the identity root.
- It does not certify that an organization is good, truthful, safe, lawful, cheap, or the best supplier. `PASS` is identity/evidence-structure verification, not a trust badge; OrgAnchor's own trust decision field remains `NOT_ASSIGNED_BY_ORGANCHOR`.
- It is not stable v1 yet. The current public phase is for named early adopters, technical reviewers, evidence/governance reviewers, directory builders, and sponsors who can help test the minimum useful loop.

Fast visible checks:

```bash
npm run visible:demo -- --out ./visible-demo --serve
npm run agent:demo
organchor verify url <local-or-public-organchor-url> --compact
```

Best public starting points:

- `CURRENT_PROJECT_STATE_2026-07-02.md`: historical source-repository snapshot as of 2026-07-02, including the Fireseed boundary, repository boundary, and next-work order at that date.
- `PUBLIC_EXPLAINER.md`: plain-language explanation for first-time readers.
- `DESIGN_RATIONALE.md`: full design logic from core goal to mechanisms, effects, and limits.
- `ADOPTER_QUICKSTART.md`: shortest practical path for an adopting organization.
- `PILOT_MINIMAL_PATH.md`: minimal external pilot definition and verification gate.
- `PUBLIC_SELF_PILOT_MINIMAL_REVIEW_2026-07-06.md`: current external-view review of OrgAnchor's own public self-pilot against the minimal path.
- `PUBLIC_RELEASE_CHECKLIST.md`: practical release gate for public assets, local checks, owner approvals, and hold criteria.
- `PUBLIC_SELF_VERIFICATION_2026-07-15.md`: current Alpha.4 public release-linkage, endpoint, clean-install, Beacon, CLI, and disclosed-limit verification result; a Chinese translation is provided alongside it.
- `EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md`: runnable evaluation for testing whether an Agent can keep valid identity and package verification separate from insufficient product-claim evidence.
- `EVIDENCE_STALENESS_ADVERSARIAL_EVALUATION.md`: runnable evaluation for testing whether an Agent preserves expired evidence as history without treating it as current support.
- `PUBLIC_RELEASE_PRECHECK_2026-07-06.md`: historical pre-Alpha.4 release-preparation check for local gates, capability audit, public self-pilot, and public root-signed lockfile verification.
- `FIRESEED_VALIDATION_TRACKING_ISSUE.md`: copyable GitHub tracking issue for Fireseed Wave 1.
- `FIRESEED_OUTREACH_KIT.md`: concrete external review and pilot starter kit.
- `FIRESEED_ALPHA_COMPLETION_AUDIT_2026-07-06.md`: requirement-by-requirement completion audit for Fireseed Alpha public-release preparation.
- `FIRESEED_ALPHA4_LOCAL_CONVERGENCE_2026-07-11.md`: local Alpha.4 release-convergence record; no npm, GitHub, website, or public-post action is implied.
- `AI_OPERATING_MODEL.md`: project operating model for human-owner and AI-execution-lead collaboration.

Publication production materials such as video scripts, rendered media, platform post drafts, presentation outlines, and sponsorship letters are intentionally kept outside the source repository and npm package. This repository is for the software, protocol, examples, verification artifacts, and external-review boundaries.

## What It Is

OrgAnchor is an open-source identity continuity toolkit.

It is designed around:

- An organization root authority.
- Signed official-presence records.
- Static adopting-organization `/verify` pages.
- Machine-readable verification artifacts.
- Claims and evidence manifests.
- Optional carriers such as IPFS, Arweave, Onion, ENS, and traditional websites.

The identity root is the adopting organization's root authority, not OrgAnchor's website, a domain, a platform account, IPFS, Arweave, ENS, or a lockfile.

## Fireseed Alpha

OrgAnchor is currently in Fireseed Alpha: the first public collaboration point where the minimum useful loop is visible enough for named early adopters and reviewers.

Fireseed Alpha focuses on:

- Organization root authority and migration continuity.
- Signed official-presence records.
- Public `/verify` packages.
- AI-agent-readable verification through `/.well-known/organchor.json` and `organchor verify url --compact`.
- Signed claims and evidence manifests.
- S1-S3 evidence baseline: first-party evidence, organization-submitted third-party material, and random purchase / sampling structure.
- S4/S5 design preview only: real-use observation, public challenge, correction, and historical accountability are important, but not finished acceptance gates.

Start with `FIRESEED_OUTREACH_KIT.md`, `FIRESEED_ALPHA_PLAN.md`, `FIRESEED_READINESS_GATE.md`, `FIRESEED_LAUNCH_DECISION_2026-06-01.md`, `CAPABILITY_TRACEABILITY_MATRIX.md`, `CALL_FOR_FIRESEED_REVIEW.md`, and `CONTRIBUTING.md` if you want to try, review, or critique the project.

## Purpose and Values

OrgAnchor is not only a tool for keeping an organizational name alive. Its purpose is to help long-term, evidence-bearing organizations make their public identity, claims, evidence, corrections, and migrations easier to verify over time, while reducing the cost of deciding whether they are worth deeper review, contact, partnership, purchase, or support.

OrgAnchor does not certify that an organization is good, lawful, ethical, effective, or worthy of support. It makes continuity and public evidence more inspectable. The official project should not present signed continuity as a trust badge or help launder fraud, impersonation, exploitation, or deliberate deception.

See `PROJECT_NORTH_STAR.md`, `DESIGN_RATIONALE.md`, `AI_OPERATING_MODEL.md`, `DOCS_INDEX.md`, `CAPABILITY_TRACEABILITY_MATRIX.md`, `CAPABILITY_AUDIT_SCENARIOS.md`, `VISIBLE_ACCEPTANCE.md`, `VISIBLE_ACCEPTANCE_REVIEW_2026-06-01.md`, `PUBLIC_LAUNCH_REVIEW_2026-06-06.md`, `PUBLIC_RELEASE_CHECKLIST.md`, `LANGUAGE_COMPATIBILITY.md`, `FIRESEED_OUTREACH_KIT.md`, `FIRESEED_ALPHA_PLAN.md`, `FIRESEED_READINESS_GATE.md`, `FIRESEED_LAUNCH_DECISION_2026-06-01.md`, `IMPLEMENTATION_STATUS.md`, `CALL_FOR_FIRESEED_REVIEW.md`, `CONTRIBUTING.md`, `PURPOSE_AND_VALUES.md`, `CLAIMS_EVIDENCE_PROTOCOL.md`, `CLAIMS_EVIDENCE_IMPLEMENTATION_PLAN.md`, `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`, `EVIDENCE_SUFFICIENCY_MODEL.md`, `S2_THIRD_PARTY_MATERIAL_MODEL.md`, `PACKAGE_HEALTH_LAYER.md`, `COMMERCIAL_FIT_LAYER.md`, `REAL_WORLD_EVIDENCE_PROFILE.md`, `PRODUCT_SERVICE_CREDENTIAL_LAYER.md`, `ADOPTION_PRINCIPLES.md`, and `SHOWCASE_POLICY.md` for the project stance, current implementation status, operating model, design rationale, visible acceptance flow, public launch consistency review, public release gate, language compatibility, Fireseed outreach kit, evidence protocol, purpose/evidence/challenge model, purpose-fit evidence sufficiency model, S2 third-party material model, package health model, commercial-fit model, real-world evidence profile, product/service credential direction, implementation map, executable scenario audit, and document map.

Protocol evolution is governed by `PROTOCOL_EVOLUTION_POLICY.md`: old adopter packages should remain verifiable under the schema, signatures, hashes, root authority, and verification rules that created them. Newer OrgAnchor versions may expose legacy gaps, but they must not retroactively erase valid historical snapshots.

The proposed post-v1 `DISCOVERY_STRATEGY.md`, `ORGANCHOR_BEACON.md`, `DISCOVERY_TAXONOMY.md`, `DIRECTORY_MODEL.md`, and `DIRECTORY_SNAPSHOT_SPEC.md` describe how OrgAnchor can help people and AI agents find OrgAnchor-enabled organizations without becoming a marketplace, certification authority, or v1 trust root.

OrgAnchor does not issue organization IDs or require official Directory inclusion. Any organization can adopt the standard by publishing a verifiable origin-owned package; Directory nodes are discovery aids with no protocol privilege.

The accepted but not yet implemented `PRODUCT_SERVICE_CREDENTIAL_LAYER.md` defines how delegated operational keys, model/batch/unit credentials, service delivery credentials, and observation binding should make positive and negative feedback attributable to an organization's root authority chain.

The accepted `EVIDENCE_SUFFICIENCY_MODEL.md` prevents the evidence layer from becoming a paperwork race: OrgAnchor should report whether evidence is sufficient for a stated purpose, not reward raw field count.

The accepted but not yet fully implemented `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md` defines the three-axis model for purpose profiles, observation source classes, and challenge/correction/accountability lifecycle. Public challenge review is a horizontal lifecycle mode, not a sixth ascending purpose profile. Product/service history and broader accountability observations are routed through S5 instead of becoming a separate Historical Layer.

The accepted but not yet implemented `PACKAGE_HEALTH_LAYER.md` defines how organizations and external observers should expose freshness, broken links, expired evidence, withdrawn claims, maintenance policy, and low-cost agent fetch recommendations without turning health into a trust score.

The accepted but not yet implemented `COMMERCIAL_FIT_LAYER.md` defines how price disclosure modes, signed public price sheets, private signed quotes, lead time, MOQ, and validity windows should reduce commercial-screening cost without forcing public pricing or turning OrgAnchor into a marketplace.

## Current Status

The current published package is `organchor@0.1.0-alpha.4` under the npm `alpha` dist-tag, with Git tag `v0.1.0-alpha.4`, a public GitHub prerelease, and an aligned public self-pilot at `https://organchor.org`. The source, npm package, GitHub Release, homepage, `/verify` page, Beacon, machine index, and installed-CLI verification path were publicly rechecked on 2026-07-15. Fireseed Alpha has a GO decision for named early adopter, technical, Agent, and evidence/governance review. It is not stable v1, and broader promotion remains subject to the current release gate. The core alpha surface includes root authority records, signed official-presence records, claims/evidence manifests, value continuity reports, carrier receipts, domain audit, Onion/ENS support, OpenTimestamps anchoring, root authority migration, AI-agent verification discovery, policy-route hints, and `/verify` root continuity publication.

The `main` branch also contains post-Alpha.4 evidence-interpretation evaluation design. This work has not been republished to npm, does not change the Alpha.4 signed-artifact or verification protocol, and is explicitly marked as not yet implemented where runnable artifacts are still missing.

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
- Automatic Beacon discovery surfaces: `/.well-known/organchor.json`, `robots.txt`, `sitemap.xml`, HTML discovery links, and JSON-LD metadata.
- Machine-readable `public/verify/organchor.json`.
- Human-readable Agent Verification View on `/verify/index.html`, backed by the same `agent_review` data exposed in `organchor.json`.
- Agent-facing discovery and verification contract for `/.well-known/organchor.json`.
- Third-party AI agent integration guide with compact-result examples.
- `organchor verify url` for external AI agents and other verifiers.
- Compact `organchor verify url --compact` output for low-cost first-pass agent routing.
- `conformance_status` in agent verification output so integrations can separate claimed, partial, failed, and full-compatible adoption.
- Human-visible and machine-readable carrier receipt summaries from `organchor.lock.json`.
- `organchor lockfile hash`, `organchor lockfile sign`, and `organchor lockfile verify` for root-signed publication ledger snapshots.
- `/verify` publication of `organchor.lock.json`, `organchor.lock.json.sig`, and machine-readable `lockfile_integrity` when a signed lockfile is available.
- Signed claims/evidence manifests are copied into `/verify` and indexed when available.
- Value continuity audit reports for claim support levels, evidence quality, stale evidence, and unsupported claims.
- Claim-level support axes, risk gaps, next best actions, and compact support-level counts for low-friction external AI-agent review.
- Claims/evidence protocol baseline for structured claims, evidence, reproducible methods, third-party attestations, challenges, and AI-agent claim-support output.
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
- Evidence recheck method objects through `organchor evidence method add`, linking signed evidence to concrete steps, expected results, tools, verification cost, and limitations.
- Real-world profile validators for physical product, service delivery, SaaS/API, certification/compliance, and dataset/research claims.
- S2 third-party material template and attach commands plus local checks for candidate versus effective S2, external recheck anchors, claim linkage, scope, limitations, expiry, disclosures, and compact `s2_summary`.
- S3 random purchase / sampling template and attach commands plus local checks for candidate versus effective S3, sample identity, sample source, selector, organization-provided samples, custody gaps, and compact `s3_summary`.
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
- `/verify` and `/.well-known` Directory discovery pointers through machine-readable `directory_discovery`.
- Beacon-first discovery direction for making every adopter natively discoverable without requiring official Directory inclusion.
- `organchor beacon index` for merging repeated sweep NDJSON files into an incremental local discovery index.
- `organchor beacon inspect` for distinguishing claimed OrgAnchor signals, partial implementations, impostor Beacons, and strictly verified full compatibility.
- `organchor beacon generate` for regenerating `/.well-known/organchor.json`, `robots.txt`, and `sitemap.xml` from an already verified local `/verify` package without rebuilding the whole page.
- `organchor beacon query` for filtering a local Beacon index and returning agent-facing need-match reports, candidate explanations, risk gaps, and verification plans.
- `organchor beacon report` for measuring local discovery quality from sweep artifacts, including find rate, verification success rate, stale rate, and cross-sweep reproducibility.
- `organchor beacon sweep` for checking seed files, Directory snapshots, sitemaps, and bounded crawl starts, then writing reusable NDJSON discovery results.
- `organchor beacon verify` for checking that shared sweep NDJSON files are structurally valid discovery artifacts.
- `node scripts/agent-discovery-demo.mjs` for running a complete local seed -> sweep -> index -> query -> verify loop without external credentials.
- `organchor doctor` for adopter-facing readiness diagnosis and concrete next actions.
- `organchor adoption status` for producing human-readable and machine-readable adoption workspace status without turning status into a trust badge.
- External pilot runbook for repeatable low-risk organization adoption.
- NPM build configuration that packages the CLI from `dist/cli.js`.
- Static Directory snapshot build and verification commands for post-v1 discovery experiments.
- Static Directory candidate source maintenance with `organchor directory add`, without treating additions as verification.
- Directory snapshots can be generated directly from a local Beacon index.
- Directory build writes a machine-readable `directory-policy.json` so Directory boundaries are public by default.
- Directory snapshots can be exported as NDJSON feeds for mirroring, merging, and independent Directory nodes.
- Optional Directory origin verification that fetches each listed organization's OrgAnchor package before writing crawler-derived records.
- `organchor directory inspect` for checking whether an organization exposes a machine-readable Directory pointer and whether the linked snapshot/hash/policy are consistent.
- `organchor directory fetch` for retrieving verified Directory candidate records and next-step `verify url` commands.
- `organchor directory fetch` filtering by category, capability, region, language, identity status, value status, policy route, and limit so AI agents can reduce candidate sets before direct origin verification.
- Directory candidate explanations with priority, matched filters, risk gaps, and verification plans.
- `organchor directory compare` for comparing independent Directory snapshots and surfacing conflicting origin summaries without making trust decisions.
- Public complete minimal example artifacts under `examples/complete`.

## Install Alpha

The current public package is a prerelease:

```bash
npm install -g organchor@alpha
organchor --help
```

Use the explicit `@alpha` tag until OrgAnchor has a stable release. The npm registry still exposes an older alpha under `latest`, but that is not a stability claim and should not be used in public install instructions.

## Local Agent Discovery Demo

To see the AI-agent discovery loop without Cloudflare, IPFS, Arweave, wallets, tokens, or real domains, run:

```bash
npm run agent:demo
```

The demo creates a temporary adopting organization, serves its `/verify` package on localhost, then runs Beacon sweep, local indexing, Directory snapshot export, need-match query, and direct compact verification. It writes observable outputs under a temporary workspace so people can inspect what actually happened.

## Evidence Interpretation Evaluation

To build a fictional but cryptographically valid manufacturing package whose 10,000-hour lifetime claim has relevant but insufficient evidence, run:

```bash
npm run evaluation:evidence -- build --out ./.local/evidence-interpretation-run
npm run evaluation:evidence -- exercise --package ./.local/evidence-interpretation-run
```

The output separates the safe-to-serve public package, the fresh-context Agent task, and operator-only ground truth. Synthetic private keys are removed after build. Use the scorer only for this scenario; it is not a general model benchmark or supplier trust rating. See `EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md` for the isolation and interpretation rules.

To run the fixed-time Wave 2 scenario that separates an expired certificate's historical value from current claim support:

```bash
npm run evaluation:evidence -- build-stale --out ./.local/evidence-staleness-run
npm run evaluation:evidence -- exercise-stale --package ./.local/evidence-staleness-run
```

See `EVIDENCE_STALENESS_ADVERSARIAL_EVALUATION.md` for the decision question, hard failures, and scorer boundary.

## Visible Acceptance Demo

To see the human-readable `/verify` page, the matching `agent_review` JSON, and a tamper-failure proof without external credentials, run:

```bash
npm run visible:demo -- --out ./visible-demo --serve
```

For a browser URL that stays open until stopped, run:

```bash
npm run visible:demo -- --out ./visible-demo --serve
```

Use `VISIBLE_ACCEPTANCE.md` for the Chinese acceptance checklist and boundary notes.

Language policy: machine-readable JSON keys, status enums, policy route codes, schemas, commands, and artifact filenames stay stable English / ASCII. Human explanations and future `/verify` page variants can be localized. See `LANGUAGE_COMPATIBILITY.md`.

## Fireseed Review Tracks

Fireseed Alpha has three broad review paths and one focused Agent-evaluation path:

- Adopting organization trial: test whether a real or realistic organization can publish a useful OrgAnchor package without excessive effort.
- Technical review: test signatures, canonicalization, threshold authority, migration, `/verify`, Beacon, package safety, and release checks.
- Evidence/governance review: test S1-S3 abuse cases, S3 sampling assumptions, S4/S5 design gaps, Directory risks, and stale or misleading evidence.
- External Agent evaluation: give an unfamiliar Agent the isolated fictional package, preserve its uncorrected JSON, and test whether it separates valid package structure from actual claim support.

Use `CONTRIBUTING.md` for contribution rules, `CALL_FOR_FIRESEED_REVIEW.md` for the public review brief, and `EXTERNAL_AGENT_EVALUATION_RUNBOOK.md` for the controlled fresh-context procedure.

Use `FIRESEED_OUTREACH_KIT.md` as the practical starter kit for named external outreach. It includes track-specific task lists, useful commands, feedback routing, success criteria, hold criteria, and copyable invitation text.

## Capability Audit

OrgAnchor keeps a package-facing capability traceability matrix so implementation maturity is not inferred from prose alone. It also keeps executable capability scenarios so cross-module workflows can be checked by machines instead of manual reading.

Run:

```bash
npm run capability:audit
npm run capability:scenarios
```

`npm run capability:audit` validates `CAPABILITY_TRACEABILITY_MATRIX.md` and writes `reports/capability-audit.json` plus `reports/capability-audit.md`.

`npm run capability:scenarios` runs the local scenario layer from `CAPABILITY_AUDIT_SCENARIOS.md` and writes `reports/capability-scenarios.json` plus `reports/capability-scenarios.md`. Use `node scripts/capability-scenarios.mjs --include-network` when intentionally checking the public OrgAnchor self-pilot.

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
organchor evidence add --file demo.mp4 --uri https://example.com/evidence/demo.mp4 --location-type https --subject-type product --subject-id primary-product
organchor evidence method add --id method-001 --evidence-id evidence-001 --steps "Fetch artifact;Compute SHA-256;Compare with signed manifest" --expected-results "Hash matches"
organchor evidence s2 template --template certification_record
organchor evidence s2 attach --evidence-id evidence-001 --template certification_record --issuer-name "Example Certification Body" --anchor-url https://registry.example/records/ABC-123 --scope "Certificate supports claim-001 for model-x1"
organchor evidence s3 template --template market_purchase
organchor evidence s3 attach --evidence-id evidence-001 --template market_purchase --sampler-type buyer --acquired-at 2026-05-28T00:00:00Z --subject-type product_model --subject-id model-x1 --sample-slot-id sample-slot-claim-001-2026-05-001 --storage-role DIRECTORY_VAULT --raw-availability-status REQUEST_REQUIRED --scope "Random market purchase sample supports claim-001 for model-x1"
organchor evidence sign --key keys/root-2026.private.json --authority root-authority.json
organchor value audit --claims claims/product-claims.json --evidence evidence/evidence-manifest.json --check-files
organchor beacon index --in beacon-sweep.ndjson --out beacon-index.json
organchor beacon index --previous beacon-index.json --in beacon-sweep-latest.ndjson --out beacon-index.json
organchor beacon query --index beacon-index.json --need "identity continuity support" --capability identity-continuity --conformance FULL_COMPATIBLE --limit 10
organchor beacon inspect https://example.org
organchor beacon sweep --seeds seeds.txt --out beacon-sweep.ndjson --concurrency 4 --timeout-ms 10000
organchor beacon sweep --crawl https://example.org --crawl-max-pages 25 --crawl-max-depth 1 --out beacon-sweep.ndjson
organchor beacon sweep --directory-snapshot public/directory/directory-snapshot.json --out beacon-sweep.ndjson
organchor beacon sweep --sitemap https://example.org/sitemap.xml --out beacon-sweep.ndjson
organchor beacon verify --in beacon-sweep.ndjson
organchor doctor https://example.org
organchor adoption status --verify-dir public/verify --origin https://example.org --level 3
organchor directory build --origins examples/directory/directory-origins.json --out public/directory
organchor directory build --origins examples/directory/directory-origins.json --out public/directory --verify-origins
organchor directory build --beacon-index beacon-index.json --node-origin https://directory.example --out public/directory
organchor directory compare --snapshots directory-a.json,directory-b.json --out directory-compare.json
organchor directory export --snapshot public/directory/directory-snapshot.json --format ndjson --out directory-feed.ndjson
organchor directory fetch https://example.org
organchor directory fetch https://example.org --capability identity-continuity --identity-status PASS --limit 5
organchor directory inspect https://example.org
organchor directory verify --snapshot public/directory/directory-snapshot.json
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

`archive arweave publish` refuses to reuse a non-empty package directory by default, so stale files are not accidentally archived. Use `--overwrite` only when you intentionally want to replace the existing `arweave-package` directory.

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

`organchor.lock.json` is the publication receipt ledger. It records non-sensitive receipt metadata such as artifact hashes, provider names, CIDs, transaction ids, and timestamps. When the adopting organization's root authority signs the lockfile, changing any recorded receipt changes the canonical hash and breaks `organchor lockfile verify`.

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
- `CURRENT_PROJECT_STATE_2026-07-02.md`
- `PUBLIC_SELF_PILOT_MINIMAL_REVIEW_2026-07-06.md`
- `PROJECT_NORTH_STAR.md`
- `PROTOCOL_EVOLUTION_POLICY.md`
- `PURPOSE_AND_VALUES.md`
- `ADOPTER_QUICKSTART.md`
- `ADOPTION_PRINCIPLES.md`
- `ADOPTION_GUIDE.md`
- `AGENT_COMPATIBILITY_PLAN.md`
- `AGENT_INTEGRATION_GUIDE.md`
- `AGENT_VERIFICATION_CONTRACT.md`
- `COMMERCIAL_FIT_LAYER.md`
- `PILOT_MINIMAL_PATH.md`
- `EXTERNAL_PILOT_RUNBOOK.md`
- `ORG_ONBOARDING_CHECKLIST.md`
- `ROOT_AUTHORITY_CUSTODY_GUIDE.md`
- `MIGRATION_GUIDE.md`
- `PUBLISHING_GUIDE.md`
- `RELEASE_INTEGRITY.md`
- `SHOWCASE_POLICY.md`
- `VALUE_CONTINUITY_MODEL.md`
- `DOMAIN_HARDENING_GUIDE.md`
- `DISCOVERY_STRATEGY.md`
- `DISCOVERY_TAXONOMY.md`
- `DIRECTORY_MODEL.md`
- `DIRECTORY_SNAPSHOT_SPEC.md`
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
