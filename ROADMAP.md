# OrgAnchor Roadmap

Status: Accepted.

## Purpose

This roadmap turns the OrgAnchor architecture into an implementation sequence.

The roadmap follows one rule:

> Build the identity continuity core first, then add carriers, audits, auxiliary names, and migration.

Key milestone definitions:

```text
Stage 3 = self-pilot ready
Stage 5 = v1 complete
```

Stage 3 means OrgAnchor can use itself as the first public pilot. Stage 5 means the first complete v1 scope is finished.

## Stage 0: Foundation Documents

Status:

```text
Completed
```

Purpose:

Define the project before writing production code.

Required outputs:

- `PROJECT_BRIEF.md`
- `PROJECT_NORTH_STAR.md`
- `PRODUCT_SHAPE.md`
- `THREAT_MODEL.md`
- `ARCHITECTURE.md`
- `CRYPTO_POLICY.md`
- `TECHNICAL_DECISIONS.md`
- `PILOT_PLAN.md`
- `SELF_PILOT_RUNBOOK.md`
- `ADOPTION_MODEL.md`
- `SELF_PILOT_LESSONS.md`
- `ADOPTION_GUIDE.md`
- `EXTERNAL_PILOT_RUNBOOK.md`
- `ORG_ONBOARDING_CHECKLIST.md`
- `ROOT_AUTHORITY_CUSTODY_GUIDE.md`
- `MIGRATION_GUIDE.md`
- `PUBLISHING_GUIDE.md`
- `DOMAIN_HARDENING_GUIDE.md`
- `EVIDENCE_ONBOARDING_GUIDE.md`
- `SELF_PILOT_DECISION_BRIEF.md`
- `CLOUDFLARE_PROJECT_ACCOUNT_PLAN.md`
- `DOMAIN_CANDIDATE_REPORT.md`
- `CLOUDFLARE_HUMAN_HANDOFF.md`
- `CLOUDFLARE_PAGES_VERIFY_PLAN.md`
- `CLOUDFLARE_BOT_POLICY.md`
- `ROADMAP.md`
- `V1_ACCEPTANCE.md`
- `V1_RELEASE_CHECKLIST.md`
- ADRs for major architecture decisions

Exit criteria:

- Product boundary is clear.
- Project north star and feature alignment gate are clear.
- Product shape and user-facing surfaces are clear.
- Root authority model is accepted.
- Cryptography policy is accepted.
- Technical decisions are recorded.
- Stage 3 OrgAnchor self-pilot is recorded.
- v1 acceptance criteria are defined.
- The future replication/adoption model is recorded.
- Self-pilot lessons feed back into best practices.

## Stage 1: Identity Core

Status:

```text
Completed
```

Purpose:

Make OrgAnchor a real signed-statement verifier, not yet a full publishing toolchain.

Required capabilities:

- Initialize a project with `organchor init`.
- Generate Ed25519 root member keys.
- Export public key material.
- Create a `root-authority.json` record.
- Create threshold root authority records from multiple root member keys.
- Create `statements/official-endpoints.json`.
- Canonicalize JSON using RFC 8785 JCS.
- Hash canonical statements with SHA-256.
- Sign statements.
- Append signatures from multiple root member keys.
- Verify statements.
- Validate schemas.
- Reject malformed or ambiguous signed JSON.
- Fail closed on unsupported algorithms.
- Verify `1-of-1` root authority with the multi-signature file shape.

Representative commands:

```bash
organchor init
organchor key generate --id root-2026
organchor authority create
organchor authority create --keys keys/root-a.private.json,keys/root-b.private.json,keys/root-c.private.json --threshold 2
organchor statement create
organchor statement hash
organchor statement sign
organchor statement sign --key keys/root-b.private.json --append
organchor statement verify
```

Expected files:

```text
organchor.config.json
.gitignore
keys/root-2026.private.json
root-authority.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
```

Exit criteria:

- A statement signed by the root authority verifies.
- A modified statement fails verification.
- A wrong key fails verification.
- A missing required field fails schema validation.
- A duplicate-key JSON fixture fails before signing or verification.
- Tests cover canonicalization, hashing, signing, verification, schema, and threshold checks.

## Stage 2: Static Verification Page

Status:

```text
Completed
```

Purpose:

Make the signed statement publishable on a normal website without requiring a backend.

Required capabilities:

- Generate `public/verify/index.html`.
- Generate `public/verify/organchor.json` as a machine-readable index.
- Copy signed statement, signature file, and root authority record.
- Display organization metadata.
- Display official endpoints.
- Display statement hash.
- Display root authority fingerprint.
- Display signature metadata.
- Display a visible proof trail for generated and verified artifacts.
- Display CLI verification instructions.
- Avoid claiming browser verification is the only trust path.

Representative command:

```bash
organchor page generate \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority.json \
  --out public/verify
```

Expected files:

```text
public/verify/index.html
public/verify/organchor.json
public/verify/official-endpoints.json
public/verify/official-endpoints.json.sig
public/verify/root-authority.json
```

Exit criteria:

- The page is static and can be opened locally.
- The page is understandable to a human reviewer.
- The page shows visible proof checks for statement, root authority, threshold signatures, claims/evidence inclusion, and migration history status.
- Machine artifacts are available beside the page.
- CLI verification works against the files in `public/verify`.

Pilot status:

- Internal trials allowed.
- No public production claim.

## Stage 3: Publishing Receipts, IPFS, Arweave, OpenTimestamps, and Evidence Manifests

Status:

```text
Implementation complete for alpha; OrgAnchor self-pilot active on Cloudflare Pages, with local Kubo and Pinata IPFS receipts, Arweave manual package receipts, Arweave/Turbo TX receipts, OpenTimestamps proofs, signed claims/evidence manifests, and value continuity reporting
```

Purpose:

Make OrgAnchor's signed statements and evidence manifests mirrorable, archivable, and publicly timestampable, with receipts recorded in `organchor.lock.json`.

Required capabilities:

- Create and update `organchor.lock.json`.
- Record statement hash, signature hash, root authority hash, publish timestamps, provider names, and receipts.
- Generate publish receipts without treating the lockfile as a trust root.
- Publish verify directory or statement artifacts to local Kubo.
- Request remote pins through an IPFS Pinning Service compatible API.
- Upload the default verify directory through a provider-specific pinning path when the common remote-pin API is unavailable or paywalled.
- Verify IPFS CID content against expected hash.
- Keep the default IPFS mirror small; require explicit `--allow-large` for intentionally large mirror directories.
- Generate Arweave dry-run/manual upload package.
- Generate `arweave-manifest.json`.
- Publish through the first real Arweave adapter using Turbo SDK when credentials are available.
- Verify Arweave content hash when a TX is provided.
- Create OpenTimestamps proofs for key hashes.
- Upgrade OpenTimestamps proofs when Bitcoin attestations become available.
- Verify OpenTimestamps file binding and Bitcoin block merkle-root attestations.
- Create signed product/service claims manifest.
- Create signed evidence manifest.
- Record artifact hashes and locations for evidence materials.
- Record external evidence locations such as HTTPS, R2/S3, GitHub Releases, or independent IPFS CIDs.
- Make claims and evidence readable by AI agents without scraping human-only pages.
- Publish machine-readable index data under `/verify`.
- Include signed claims and evidence manifests in `/verify/organchor.json` when available.
- Mirror signed manifests to IPFS.
- Archive critical signed manifests to Arweave or prepare manual upload package.
- Allow large evidence artifacts to remain on HTTPS/object storage/Git releases while binding them by hash.

Representative commands:

```bash
organchor mirror ipfs publish --dir public/verify
organchor mirror ipfs publish --dir public/verify --api http://127.0.0.1:5001
organchor mirror ipfs pin --cid <CID> --service-url <PINNING_SERVICE_API>
organchor mirror ipfs upload --provider pinata --dir public/verify
organchor mirror ipfs verify --cid <CID> --expected-hash <SHA256>

organchor archive arweave publish \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority.json

organchor archive arweave verify \
  --tx <ARWEAVE_TX_ID> \
  --expected-hash <SHA256>

organchor archive arweave upload \
  --provider turbo \
  --dir arweave-package \
  --wallet-file arweave-wallet.local.json

organchor anchor opentimestamps stamp --file statements/official-endpoints.json
organchor anchor opentimestamps upgrade --proof anchors/opentimestamps/official-endpoints.json.ots
organchor anchor opentimestamps verify \
  --file statements/official-endpoints.json \
  --proof anchors/opentimestamps/official-endpoints.json.ots

organchor claims create
organchor claims sign
organchor claims verify

organchor evidence create
organchor evidence add
organchor evidence sign
organchor evidence verify
```

Expected files:

```text
organchor.lock.json
anchors/opentimestamps/*.ots
arweave-manifest.json
claims/product-claims.json
claims/product-claims.json.sig
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
```

Exit criteria:

- `organchor.lock.json` records publish receipts keyed by artifact hash.
- IPFS publish supports dry-run and real local Kubo.
- IPFS remote pin requests support an external pinning service without writing tokens to `organchor.lock.json`.
- IPFS provider-specific directory upload works without writing tokens to `organchor.lock.json`.
- IPFS publish refuses oversized default verify mirrors unless `--allow-large` is explicitly provided.
- IPFS verify fails when expected hash does not match.
- Arweave manual package is generated without credentials.
- Arweave manual package includes signed claims and evidence manifests when available.
- Arweave Turbo upload records per-file TX ids and does not write wallet material to `organchor.lock.json`.
- Arweave verify fails when expected hash does not match.
- Arweave TX verification can fetch content through a configurable gateway and compare the expected hash.
- OpenTimestamps stamp creates `.ots` proof files without requiring a wallet or account.
- OpenTimestamps verify fails when the proof is checked against modified file content.
- OpenTimestamps verify can distinguish pending calendar receipts from Bitcoin-anchored proofs.
- Publish commands clearly output what was published and what was only prepared.
- Claims manifest is signed and verifies.
- Evidence manifest is signed and verifies.
- Claims and evidence signatures can be appended to satisfy threshold root authority rules.
- Evidence artifact hashes are checked.
- Evidence items can reference independently hosted large artifacts by hash and location without putting those artifacts into `public/verify`.
- AI agents can read claims, evidence items, issuer types, limitations, and claim-evidence relations from JSON.
- AI agents can discover signed endpoint, claims, and evidence artifacts from `/verify/organchor.json`.
- AI agents can inspect `visible_proof` status from `/verify/organchor.json`.
- Stage 3 carrier choices are recorded in `organchor.lock.json` where publish receipts exist.

Pilot status:

- OrgAnchor self-pilot has begun after Stage 3 exit criteria.
- The first public pilot organization is OrgAnchor itself.
- Traditional public carrier: `https://organchor.org`.
- No external production adoption is recommended before Stage 4.
- Stage 3 is self-pilot ready, not v1 complete.
- The OrgAnchor self-pilot includes OrgAnchor's own project documents as signed evidence artifacts.

## Stage 4: Real-World Surface Area

Status:

```text
Basic implementation complete for alpha; domain audit, Onion foundation, ENS offline planning, and ENS records snapshot verification are implemented; live ENS RPC and real Onion registration remain external adoption decisions
```

Purpose:

Cover the external systems that a real organization needs around the signed statement.

Required capabilities:

- Domain security audit.
- Onion v3 address validation. Basic implementation complete.
- Tor Hidden Service configuration generation. Basic implementation complete.
- Onion verify deployment instructions. Basic implementation complete.
- ENS inspect. Snapshot mode implemented; live RPC pending.
- ENS plan. Offline planning implemented.
- ENS verify. Offline records snapshot verification implemented; live RPC pending.
- Clear `PASS`, `WARN`, `FAIL`, `MANUAL_CHECK_REQUIRED` reporting.

Representative commands:

```bash
organchor domain audit example.com
organchor onion init
organchor onion verify exampleonionaddress.onion
organchor onion config generate --domain exampleonionaddress.onion
organchor ens inspect exampleorg.eth
organchor ens plan exampleorg.eth --statement statements/official-endpoints.json
organchor ens verify exampleorg.eth --statement statements/official-endpoints.json
```

Expected files:

```text
reports/domain-security-report.json
reports/domain-security-report.md
```

Exit criteria:

- Domain audit separates automatic checks from manual checks. Basic implementation complete.
- Onion v3 format validation rejects invalid addresses. Basic implementation complete.
- Onion config output does not claim uptime or availability. Basic implementation complete.
- ENS verify fails when ENS records do not match the statement. Snapshot verification implemented.
- Reports are useful to non-expert organization operators.

Pilot status:

- External low-risk public pilots may begin after Stage 4.

## Stage 5: Migration and Root Authority Evolution

Status:

```text
Basic implementation complete for alpha; key rotate-plan, authority change-plan, root authority migration create/sign/verify, /verify migration-history publication, machine-readable root continuity explanation, self-pilot migration rehearsal, operator migration guide, and external pilot runbook are in place
```

Purpose:

Support long-term organizational change.

Required capabilities:

- Create migration statements. Basic implementation complete.
- Sign migration statements. Basic implementation complete.
- Verify migration statements. Basic implementation complete.
- Create key rotation plans. Basic implementation complete.
- Create root authority change plans. Basic implementation complete.
- Verify continuity between old and new root authority records. Basic implementation complete.
- Publish verified migration history through `/verify`. Basic implementation complete.
- Publish current/previous root authority continuity semantics through `/verify/organchor.json`. Basic implementation complete.
- Preserve historical verification.

Representative commands:

```bash
organchor key rotate-plan
organchor authority change-plan
organchor migrate create
organchor migrate sign
organchor migrate verify
```

Expected files:

```text
statements/migration-*.json
statements/migration-*.json.sig
```

Exit criteria:

- A new root authority can be linked to an old root authority by a valid migration statement. Basic implementation complete.
- Invalid or unsigned migration statements fail verification. Basic implementation complete.
- Threshold rules are respected during migration. Basic implementation complete.
- OrgAnchor self-pilot migration rehearsal proves the flow without replacing the public root authority. Complete.
- Operator migration guidance explains when to migrate, who signs, how to test failure cases, and how to publish history. Draft complete.
- Root authority change planning covers adding/removing retained keys and threshold changes. Basic implementation complete.
- `/verify` can include migration statements and signatures when they verify as a chain to the current root authority. Basic implementation complete.
- `/verify` explains the current root, previous roots, migration chain, and historical verification rule for humans and AI agents. Basic implementation complete.
- Documentation explains what happens if a key is lost or compromised. Basic custody documentation complete.
- A repeatable external organization pilot runbook exists, with approval gates, visible outputs, and independent verification steps. Draft complete.

Pilot status:

- Organizations with long-term governance needs should wait for Stage 5 before treating OrgAnchor as a durable production identity continuity process.

## V1 Completion Definition

OrgAnchor v1 is complete when Stages 1 through 5 meet their exit criteria.

v1 is not complete if it only signs and verifies a statement.

v1 is also not complete at Stage 3. Stage 3 is the OrgAnchor self-pilot milestone.

v1 must cover:

- Root authority.
- Signed official endpoint statements.
- Static verify page.
- Product/service claims and evidence manifests.
- IPFS mirroring.
- Arweave archival or manual upload package.
- Onion disaster recovery configuration.
- Domain security audit.
- ENS auxiliary name planning and verification.
- Migration statements.

## Stage 6 / Post-v1: Open Directory And Discovery Anti-Capture

Status:

```text
Design direction recorded; static snapshot spec, example, build command, verify command, and optional origin verification implemented; not part of v1 core completion
```

Purpose:

Help people, organizations, platforms, and AI agents discover OrgAnchor-enabled organizations without depending on one closed marketplace or paid ranking platform.

The discovery strategy answers the product-level problem: verification only lowers transaction cost after two parties can find each other. The Directory is the first proposed open discovery index for that strategy. It stores summary records, verification status, policy-route hints, and pointers back to each organization's own `/.well-known/organchor.json` and `/verify/organchor.json`. It does not become the identity root, certification authority, evidence host, or final ranking engine.

Required capabilities for a future implementation:

- Define directory record shape.
- Define optional discovery fields for organization capabilities, regions, service categories, freshness, and evidence summaries.
- Define static Directory snapshot format.
- Build and verify static Directory snapshots. Basic implementation complete.
- Optionally verify each listed origin before writing crawler-derived records. Basic implementation complete.
- Publish directory policy in machine-readable form.
- Build static directory snapshots from known OrgAnchor origins.
- Sign or hash directory snapshots.
- Export snapshots as JSON and NDJSON.
- Keep records verifiable back to each organization's own OrgAnchor package.
- Make inclusion, exclusion, ranking, payment, and stale-record policy explicit.
- Allow mirrors, forks, and independent Directory nodes.
- Keep large evidence artifacts outside the Directory by default.

Representative future commands:

```bash
organchor directory inspect https://example.org
organchor directory add https://example.org
organchor directory build --in directory-sources.json --out public/directory
organchor directory build --in directory-sources.json --out public/directory --verify-origins
organchor directory verify --snapshot public/directory/directory-snapshot.json
organchor directory export --format ndjson
```

Exit criteria for a future stage:

- A static Directory snapshot can be generated without a hosted database. Basic implementation complete.
- A static Directory snapshot can be verified as a discovery aid and not a trust root. Basic implementation complete.
- A Directory snapshot can be generated from live origin verification results without treating the Directory as the trust root. Basic implementation complete.
- A third-party agent can use the snapshot to find candidate organizations and then verify each organization at its own origin.
- The Directory policy is public and machine-readable.
- Paid discovery, if ever introduced, cannot be confused with verification status.
- Mirrors and forks can reproduce the published snapshot.

Reference:

- `DISCOVERY_STRATEGY.md`
- `DIRECTORY_MODEL.md`
- `DIRECTORY_SNAPSHOT_SPEC.md`

## Recommended Implementation Rhythm

Implement one stage at a time.

At the end of each stage:

- Run tests.
- Update docs.
- Add examples.
- Re-check product claims.
- Avoid expanding scope beyond the current stage.

## Current Direction

Stage 1 and Stage 2 are complete. Stage 3 implementation is complete for the alpha self-pilot path: threshold root authority creation, appended independent signatures, `organchor.lock.json`, IPFS dry-run receipts, local Kubo publish/verify paths, Pinata directory upload receipts, Arweave manual packages, Arweave/Turbo upload receipts, Arweave gateway TX verification, OpenTimestamps proof creation, signed claims/evidence manifests, and value continuity reports are working and tested.

The selected self-pilot domain is `organchor.org`. The official `2-of-3` self-pilot root authority has been generated locally outside the source repository. The public `/verify` site is active through Cloudflare Pages, and the Cloudflare publish receipt is recorded in the self-pilot `organchor.lock.json`.

The first Stage 4 capabilities, `domain audit`, Onion config/validation, ENS offline planning, and ENS snapshot verification are implemented. `domain audit` has been run against `organchor.org`. The current self-pilot report has no `FAIL` results; remaining warnings and manual checks are recorded in the separate self-pilot workspace. Onion support can validate v3 addresses and generate Tor Hidden Service deployment guidance, but OrgAnchor has not registered a real onion address yet. ENS support can generate a suggested `organchor.eth` plan and verify a captured records snapshot, but live ENS resolver reads require choosing an Ethereum RPC provider or dependency path.

The implemented Stage 5 migration commands have now been exercised in the OrgAnchor self-pilot workspace without replacing the public root authority. `MIGRATION_GUIDE.md` records the operator runbook. `authority change-plan` now covers basic 1-of-1 to 2-of-3 and 2-of-3 to 3-of-5 planning flows. The `/verify` page now includes a visible proof trail for generated artifacts, can publish verified migration history when a real migration exists, and exposes `root_continuity` so AI agents can distinguish current root authority, previous root authority, migration chain, and historical verification rules.

The current emphasis is release hygiene and repeatable adoption: keep `PROJECT_NORTH_STAR.md`, `README.md`, `DOCS_INDEX.md`, `CHANGELOG.md`, `V1_RELEASE_CHECKLIST.md`, public self-pilot state, npm package metadata, GitHub state, and carrier receipts aligned before promoting the next alpha or declaring v1 readiness.

The next product-design frontier is the software value evidence layer: make OrgAnchor's own claims, evidence, reproducible checks, gaps, corrections, and policy-routing hints increasingly easy for third-party AI agents to inspect at low cost. `VALUE_CONTINUITY_MODEL.md`, `EVIDENCE_MODEL.md`, and `AGENT_INTEGRATION_GUIDE.md` are the current starting points.

The longer post-v1 discovery frontier is `DISCOVERY_STRATEGY.md`, `DIRECTORY_MODEL.md`, and `DIRECTORY_SNAPSHOT_SPEC.md`: an open, forkable discovery model that can help agents find OrgAnchor-enabled organizations while preventing the discovery layer from becoming a monopoly trust platform.
