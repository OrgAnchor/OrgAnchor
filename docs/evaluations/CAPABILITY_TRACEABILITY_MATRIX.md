# OrgAnchor Capability Traceability Matrix

Status: Active implementation-audit map.

## Purpose

This matrix maps public OrgAnchor capability claims to implementation status, commands, tests, artifacts, and known limits.

It exists to prevent a common failure mode:

```text
documentation sounds complete;
implementation is only partial;
readers cannot tell the difference.
```

Use this file together with:

```bash
npm run capability:audit
```

The audit script validates the matrix and writes:

```text
reports/capability-audit.json
reports/capability-audit.md
```

## Status Vocabulary

Only these status values are allowed:

| Status | Meaning |
| --- | --- |
| IMPLEMENTED_AND_TESTED | Implemented in the CLI/library and backed by automated tests or smoke tests. |
| IMPLEMENTED_MANUAL_CHECK | Implemented, but full confirmation requires external services, public infrastructure, or operator action. |
| PARTIAL | Some implementation exists, but the capability is not mature enough to describe as complete. |
| DESIGN_ONLY | Accepted design direction, but not implemented as product capability. |
| NOT_IMPLEMENTED | Not implemented. |

## Matrix

| Capability ID | Capability | Status | Fireseed Gate | Docs | Commands | Tests | Evidence Artifacts | Known Limits |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OA-001 | Root authority creation and threshold verification | IMPLEMENTED_AND_TESTED | Required | docs/project/ARCHITECTURE.md; docs/guides/ROOT_AUTHORITY_CUSTODY_GUIDE.md; docs/project/PROJECT_NORTH_STAR.md | organchor key generate; organchor authority create; organchor authority verify | tests/cli-e2e.test.ts; tests/sign-verify.test.ts; tests/migration.test.ts | root-authority.json; keys/*.public.json | Private-key custody and recovery remain operator responsibility. |
| OA-002 | Signed official endpoint statement | IMPLEMENTED_AND_TESTED | Required | docs/project/ARCHITECTURE.md; README.md; docs/project/V1_ACCEPTANCE.md | organchor statement create; organchor statement sign; organchor statement verify; organchor statement hash | tests/cli-e2e.test.ts; tests/sign-verify.test.ts; tests/json.test.ts | statements/official-endpoints.json; statements/official-endpoints.json.sig | The signature proves statement integrity and authority, not that the organization is trustworthy. |
| OA-003 | Static /verify package generation | IMPLEMENTED_AND_TESTED | Required | README.md; docs/project/PRODUCT_SHAPE.md; docs/protocol/AGENT_INTEGRATION_GUIDE.md | organchor page generate | tests/page-generate.test.ts; tests/agent-verify.test.ts; tests/beacon-inspect.test.ts | public/verify/index.html; public/verify/organchor.json | Hosting, CDN, and domain availability remain external carrier concerns. |
| OA-004 | Direct AI-agent URL verification | IMPLEMENTED_AND_TESTED | Required | docs/protocol/AGENT_VERIFICATION_CONTRACT.md; docs/protocol/AGENT_INTEGRATION_GUIDE.md; README.md | organchor verify url; organchor verify url --compact | tests/agent-verify.test.ts; tests/agent-integration-docs.test.ts | compact verification result JSON | PASS is not a trust badge; external policy still decides. |
| OA-005 | Beacon origin-owned discovery | IMPLEMENTED_AND_TESTED | Required | docs/protocol/ORGANCHOR_BEACON.md; docs/protocol/DISCOVERY_STRATEGY.md; README.md | organchor beacon generate; organchor beacon inspect; organchor beacon sweep; organchor beacon verify | tests/beacon-inspect.test.ts; tests/beacon-docs.test.ts; tests/agent-discovery-demo.test.ts | .well-known/organchor.json; robots.txt; sitemap.xml | Beacon exposes a standard recognizable signal once an origin enters a crawler's discovery frontier; it does not guarantee global discovery or prove claims true. |
| OA-006 | Local discovery loop for agents | IMPLEMENTED_AND_TESTED | Required | docs/protocol/AGENT_INTEGRATION_GUIDE.md; DOCS_INDEX.md; examples/agent-discovery-loop/README.md | npm run agent:demo; organchor beacon index; organchor beacon query | tests/agent-discovery-demo.test.ts; tests/beacon-inspect.test.ts | beacon-sweep.ndjson; beacon-index.json; beacon-query-result.json | This is local discovery, not broad internet-scale crawling. |
| OA-007 | Signed claims and evidence manifests | IMPLEMENTED_AND_TESTED | Required | docs/protocol/CLAIMS_EVIDENCE_PROTOCOL.md; docs/protocol/VALUE_CONTINUITY_MODEL.md; docs/protocol/EVIDENCE_MODEL.md | organchor claims create; organchor claims sign; organchor evidence create; organchor evidence sign; organchor evidence verify | tests/stage3-evidence.test.ts; tests/value-audit.test.ts; tests/page-generate.test.ts | claims/product-claims.json; evidence/evidence-manifest.json | Current implementation is stronger than simple self-claims but weaker than mature external attestation networks. |
| OA-008 | S1 first-party evidence records | IMPLEMENTED_AND_TESTED | Required | docs/guides/EVIDENCE_ONBOARDING_GUIDE.md; docs/protocol/CLAIMS_EVIDENCE_PROTOCOL.md; docs/operations/FIRESEED_ALPHA_PLAN.md | organchor evidence add; organchor evidence method add; organchor value audit | tests/stage3-evidence.test.ts; tests/value-audit.test.ts | evidence/evidence-manifest.json; reports/value-continuity-report.json | S1 is organization-submitted material; it must not be treated as independent proof. |
| OA-009 | S2 organization-submitted third-party material | IMPLEMENTED_AND_TESTED | Required | docs/protocol/S2_THIRD_PARTY_MATERIAL_MODEL.md; docs/operations/FIRESEED_ALPHA_PLAN.md; docs/protocol/AGENT_VERIFICATION_CONTRACT.md | organchor evidence s2 template; organchor evidence s2 attach; organchor value audit | tests/value-audit.test.ts; tests/agent-integration-docs.test.ts | evidence/evidence-manifest.json; compact s2_summary | OrgAnchor performs mechanical checks and gap reporting; it does not certify third-party institutions. |
| OA-010 | S3 random purchase or sampling baseline | IMPLEMENTED_AND_TESTED | Required | docs/protocol/S3_RANDOM_SAMPLING_MODEL.md; docs/protocol/S3_INTAKE_AND_SLOT_MODEL.md; docs/protocol/S3_SAMPLE_RECORD_SPEC.md | organchor evidence s3 template; organchor evidence s3 attach; organchor value audit | tests/value-audit.test.ts; tests/s3-intake-slot-model.test.ts; tests/s3-sample-record-spec.test.ts | evidence/evidence-manifest.json; compact s3_summary; examples/s3-random-sampling/sample-event.example.json | The tooling checks declared gates; it does not yet issue or verify sample slots on a network ledger. |
| OA-011 | S3 sample-slot issuance and ledger | DESIGN_ONLY | Future | docs/protocol/S3_INTAKE_AND_SLOT_MODEL.md; docs/protocol/S3_RANDOM_SAMPLING_MODEL.md; docs/operations/FIRESEED_READINESS_GATE.md | none | tests/s3-intake-slot-model.test.ts | none | Slot issuance, slot verification, and slot-use ledgers are explicitly future work. |
| OA-012 | S4 real-use or delivery observation | PARTIAL | Design Preview | docs/protocol/S4_REAL_WORLD_OBSERVATION_MODEL.md; docs/protocol/OBSERVATION_ROUTING_GUIDE.md; docs/operations/FIRESEED_ALPHA_PLAN.md | organchor evidence s4 template; organchor evidence s4 attach; organchor evidence observe route; organchor evidence observe template | tests/evidence-s4.test.ts; tests/evidence-observe-route.test.ts; tests/evidence-observe-template.test.ts | evidence/evidence-manifest.json; compact s4_summary | Templates and audit gaps exist, but observer networks, privacy handling, and storage incentives are not mature. |
| OA-013 | S5 public challenge, correction, negative evidence, and historical accountability | DESIGN_ONLY | Design Preview | docs/protocol/PURPOSE_EVIDENCE_CHALLENGE_MODEL.md; docs/operations/FIRESEED_ALPHA_PLAN.md; docs/history/FIRESEED_LAUNCH_DECISION_2026-06-01.md | none | tests/fireseed-alpha-plan.test.ts | none | Challenge governance, malicious-reporting controls, historical accountability interpretation, and durable storage are not solved. |
| OA-014 | IPFS verify-package mirror | IMPLEMENTED_AND_TESTED | Required Carrier | docs/guides/PUBLISHING_GUIDE.md; README.md; docs/project/IMPLEMENTATION_STATUS.md | organchor mirror ipfs publish; organchor mirror ipfs verify; organchor mirror ipfs pin; organchor mirror ipfs upload | tests/stage3-publish.test.ts | organchor.lock.json; IPFS CID receipts | IPFS CIDs identify content but do not guarantee long-term availability without pinning. |
| OA-015 | Arweave archival package and verification | IMPLEMENTED_AND_TESTED | Required Carrier | docs/guides/PUBLISHING_GUIDE.md; README.md; docs/project/IMPLEMENTATION_STATUS.md | organchor archive arweave publish; organchor archive arweave estimate; organchor archive arweave upload; organchor archive arweave verify | tests/stage3-publish.test.ts | arweave-package; organchor.lock.json; Arweave TX receipts | Real upload requires wallet, funding, provider availability, and public-only artifacts. |
| OA-016 | OpenTimestamps and Bitcoin hash anchoring | IMPLEMENTED_AND_TESTED | Required Carrier | docs/guides/PUBLISHING_GUIDE.md; README.md; docs/operations/RELEASE_INTEGRITY.md | organchor anchor opentimestamps stamp; organchor anchor opentimestamps upgrade; organchor anchor opentimestamps verify | tests/opentimestamps.test.ts | anchors/opentimestamps/*.ots | Timestamping proves hash existence before a time, not truth of the claim. |
| OA-017 | Domain security audit | IMPLEMENTED_AND_TESTED | Supporting | docs/guides/DOMAIN_HARDENING_GUIDE.md; README.md; docs/project/IMPLEMENTATION_STATUS.md | organchor domain audit | tests/domain-audit.test.ts | reports/domain-security-report.json; reports/domain-security-report.md | Registry lock, renewal settings, and registrar-only facts may remain manual checks. |
| OA-018 | Onion disaster-recovery guidance | IMPLEMENTED_MANUAL_CHECK | Supporting | README.md; docs/project/IMPLEMENTATION_STATUS.md; docs/guides/PUBLISHING_GUIDE.md | organchor onion verify; organchor onion config generate; organchor onion init | tests/onion.test.ts | torrc guidance; onion address validation output | OrgAnchor generates guidance and validates addresses; it does not run or guarantee Tor service availability. |
| OA-019 | ENS auxiliary-name planning and offline verification | IMPLEMENTED_MANUAL_CHECK | Supporting | README.md; docs/project/IMPLEMENTATION_STATUS.md; docs/guides/PUBLISHING_GUIDE.md | organchor ens plan; organchor ens verify | tests/ens.test.ts | ens-records.json; ENS plan output | Live resolver reads still require a chosen Ethereum RPC/provider path. |
| OA-020 | Static Directory snapshot tooling | IMPLEMENTED_AND_TESTED | Limited Accelerator | docs/protocol/DIRECTORY_MODEL.md; docs/protocol/DIRECTORY_SNAPSHOT_SPEC.md; docs/protocol/DISCOVERY_STRATEGY.md | organchor directory add; organchor directory build; organchor directory verify; organchor directory inspect; organchor directory fetch; organchor directory compare; organchor directory export | tests/directory-snapshot.test.ts; tests/agent-discovery-demo.test.ts | public/directory/directory-snapshot.json; public/directory/directory-policy.json | Directory records are discovery aids and must not become identity roots or trust badges. |
| OA-021 | Adopter-facing diagnosis | IMPLEMENTED_AND_TESTED | Supporting | docs/guides/ADOPTION_GUIDE.md; docs/guides/ORG_ONBOARDING_CHECKLIST.md; docs/project/IMPLEMENTATION_STATUS.md | organchor doctor; organchor adoption status | tests/adoption-status.test.ts; tests/beacon-inspect.test.ts | reports/adoption-status-report.json; ADOPTION_STATUS.md | Readiness status is operational guidance, not proof that an organization is good. |
| OA-022 | Package and release smoke gates | IMPLEMENTED_AND_TESTED | Required | docs/operations/RELEASE_INTEGRITY.md; docs/operations/RELEASE_PUBLISHING_PLAN.md; docs/operations/NPM_TRUSTED_PUBLISHING.md | npm run typecheck; npm test; npm run package:smoke; npm run release:smoke; npm run install:smoke; npm run release:check | tests/docs-index.test.ts; tests/fireseed-entry-points.test.ts | npm package contents; release smoke workspace | npm alpha publication is manual or CI-mediated release work, not automatic from this matrix. |
| OA-023 | Public OrgAnchor self-pilot verification | IMPLEMENTED_MANUAL_CHECK | Required | docs/history/FIRESEED_LAUNCH_DECISION_2026-06-01.md; docs/history/PUBLIC_SELF_PILOT_MINIMAL_REVIEW_2026-07-06.md; docs/operations/PUBLIC_RELEASE_CHECKLIST.md; README.md; docs/operations/RELEASE_INTEGRITY.md | node src/cli.ts verify url https://organchor.org --compact; node src/cli.ts doctor https://organchor.org; organchor lockfile verify | tests/fireseed-alpha-plan.test.ts; tests/public-launch-prep.test.ts | https://organchor.org/verify/; https://organchor.org/.well-known/organchor.json; public root-signed lockfile verification result | Depends on public web availability and current deployment state; it is manual infrastructure evidence, not proof of stable v1 or trustworthiness. |
| OA-024 | Delegated product or service credentials | DESIGN_ONLY | Future | docs/protocol/PRODUCT_SERVICE_CREDENTIAL_LAYER.md; docs/protocol/SUBJECT_BINDING_MODEL.md; docs/project/PROJECT_NORTH_STAR.md | none | none | none | Delegated keys, model passports, batch commitments, unit credentials, and service delivery credentials are not implemented. |
| OA-025 | Package health layer commands | DESIGN_ONLY | Future | docs/protocol/PACKAGE_HEALTH_LAYER.md; docs/project/IMPLEMENTATION_STATUS.md; docs/history/FIRESEED_LAUNCH_DECISION_2026-06-01.md | none | none | none | Health commands, observed health lookup, and Directory health summaries are not implemented. |
| OA-026 | Broad external organization pilot | NOT_IMPLEMENTED | Post-Fireseed | docs/guides/EXTERNAL_PILOT_RUNBOOK.md; docs/history/FIRESEED_LAUNCH_DECISION_2026-06-01.md; docs/project/IMPLEMENTATION_STATUS.md | none | none | none | No broad external organization pilot has completed yet. |
| OA-027 | Commercial fit layer | DESIGN_ONLY | Future | docs/protocol/COMMERCIAL_FIT_LAYER.md; docs/project/PROJECT_NORTH_STAR.md; docs/project/IMPLEMENTATION_STATUS.md | none | tests/commercial-fit-layer.test.ts | none | Public commercial-fit manifests, signed price sheets, delegated commercial keys, private quote verification, and compact commercial-fit summaries are not implemented. |
| OA-028 | Historical event classification and checkpoint aggregation | DESIGN_ONLY | Future | docs/protocol/HISTORICAL_ANCHOR_POLICY.md; docs/protocol/EVIDENCE_MODEL.md; docs/project/ARCHITECTURE.md | none | none | none | Existing signed artifacts, Arweave/IPFS publication, OpenTimestamps proofs, and signed lockfile receipts are implemented, but the dedicated event schema, classifier, deterministic checkpoint aggregation, and Agent completeness output are not. |

## Audit Rules

`npm run capability:audit` checks that:

- every row uses an allowed status;
- referenced documents and test files exist;
- `IMPLEMENTED_AND_TESTED` rows name at least one command, one test, and one evidence artifact;
- `IMPLEMENTED_MANUAL_CHECK`, `PARTIAL`, `DESIGN_ONLY`, and `NOT_IMPLEMENTED` rows expose limits;
- Fireseed-required rows are not silently marked `DESIGN_ONLY` or `NOT_IMPLEMENTED`.

This is not a proof that the software is correct. It is a guardrail against documentation overstating implementation maturity.
