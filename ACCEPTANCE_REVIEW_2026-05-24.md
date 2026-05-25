# OrgAnchor Acceptance Review - 2026-05-24

Status: draft for founder review.

This review records the current project state after the alpha implementation push. It is meant to answer one practical question:

```text
Can we start a serious acceptance review now, and what still blocks a v1-quality declaration?
```

Short answer:

```text
Alpha implementation review: ready.
Stable v1 declaration: not ready yet.
External ecosystem validation: not ready yet.
```

OrgAnchor has reached the point where the founder and maintainer should stop adding features blindly and review the whole system against the core goal:

```text
Help third-party AI agents, organizations, and people discover, verify, understand, and compare organization-controlled identity and value evidence at low cost, without turning OrgAnchor into a central trust authority.
```

## Current Verification Snapshot

Latest local verification result:

```text
node --run release:check
86 tests PASS
Release smoke PASS
Package smoke PASS
Install smoke PASS
git diff --check PASS
```

What this proves:

- The source TypeScript code typechecks.
- The test suite passes.
- The built CLI works from `dist/cli.js`.
- The simulated npm package includes the expected public files.
- The simulated installed package can run through smoke flows.
- The package smoke now checks that `organchor adoption status` is present and works from a fresh workspace.

What this does not prove:

- It does not prove external organizations will adopt OrgAnchor.
- It does not prove third-party AI agents will all interpret OrgAnchor equally well.
- It does not prove ENS, Onion, IPFS, Arweave, or any gateway will always be available.
- It does not prove that a signed claim is true; it proves publication, integrity, continuity, and traceability.

## Acceptance Verdict

| Area | Current verdict | Blocks v1? | Notes |
| --- | --- | --- | --- |
| Identity core | Pass | No | Root authority, threshold signatures, canonical JSON, SHA-256, detached Ed25519 signatures, statement verification, and tamper rejection are implemented and tested. |
| Static `/verify` page | Pass | No | Human-visible page and machine-readable `organchor.json` exist, including visible proof and root continuity. |
| Claims and evidence layer | Pass for alpha | No | Signed claims/evidence manifests, hash checks, external artifact locations, and value continuity audit exist. More real evidence practice is still needed. |
| IPFS mirror | Pass for alpha | No | Dry-run, local Kubo, remote pinning, Pinata upload, and verification paths are implemented and tested. |
| Arweave archive | Pass for alpha | No | Manual package, manifest, Turbo upload adapter, TX receipt recording, and gateway verification exist. |
| OpenTimestamps / Bitcoin anchor | Pass for alpha | No | Stamping, pending verification, upgrade, and Bitcoin-attestation verification paths exist. Some real proofs may remain pending until calendars return attestations. |
| Domain audit | Pass for alpha | No | Automatic and manual checks are separated. Reports use `PASS`, `WARN`, `FAIL`, and `MANUAL_CHECK_REQUIRED`. |
| Onion disaster recovery | Pass for software foundation | No | v3 validation and Tor Hidden Service config guidance exist. A real onion address is an adoption decision, not a CLI requirement. |
| ENS auxiliary name | Partial | Maybe, if strict v1 requires live ENS reads | Offline plan and snapshot verification exist. Live ENS resolver reads still require a chosen Ethereum RPC/provider path. |
| Root migration | Pass | No | Change plans, migration create/sign/verify, rehearsal, and `/verify` publication semantics exist. |
| Beacon discovery | Pass for post-v1 alpha | No | Beacon generation, inspection, sweep, index, query, report, and verification exist. This supports the core goal but is outside v1 core. |
| Directory discovery | Pass for post-v1 alpha | No | Static add/build/verify/fetch/inspect/compare/export and policy publication exist. Directory is explicitly not a trust root. |
| Adoption status reporting | Pass | No | `organchor adoption status` generates `ADOPTION_STATUS.md` and machine-readable JSON. |
| Release integrity | Partial | Yes for stable release | The protocol exists, but the release state matrix still needs final source/package/public-carrier alignment for a target milestone. |
| External pilot | Not complete | No for alpha, yes for adoption confidence | No broad external organization pilot has completed. This should happen before public v1 confidence claims. |

## Stage Review

### Stage 1 - Identity Core

Verdict: accepted for alpha.

Completed:

- `organchor init`
- root key generation
- root authority creation
- threshold authority support
- official endpoint statement creation
- canonical JSON signing
- detached signature verification
- schema validation
- duplicate-key and malformed JSON rejection
- negative tests for tampering, wrong authority, and threshold failure

Remaining concern:

- No major software blocker found.

### Stage 2 - Static Verification Page

Verdict: accepted for alpha.

Completed:

- `public/verify/index.html`
- `public/verify/organchor.json`
- copied statement, signature, and root authority
- visible proof trail
- root continuity publication
- machine-readable discovery for AI agents

Remaining concern:

- The page can keep improving visually, but this is not a v1 blocker.

### Stage 3 - Publishing Receipts And Evidence

Verdict: accepted for alpha and self-pilot.

Completed:

- `organchor.lock.json` receipt recording
- IPFS dry-run, Kubo, remote pin, and Pinata paths
- Arweave manual package and Turbo upload adapter
- OpenTimestamps stamping and verification
- signed claims/evidence manifests
- value continuity audit
- large artifact strategy by hash plus external URI

Remaining concern:

- Real-world evidence practice still needs examples from actual organizations.
- Carrier receipts must be aligned carefully before each public milestone because content-addressed systems create normal self-reference gaps.

### Stage 4 - Real-World Surface Area

Verdict: software foundation accepted for alpha; some live integrations remain.

Completed:

- domain audit
- Onion v3 validation
- Tor Hidden Service config guidance
- ENS plan
- ENS offline records snapshot verification

Remaining concern:

- Live ENS resolver reads are not implemented.
- No real onion disaster-recovery address has been registered.
- Registry Lock and auto-renewal remain manual checks where provider APIs do not expose reliable data.

### Stage 5 - Root Authority Evolution

Verdict: accepted for alpha.

Completed:

- key rotation planning
- root authority change planning
- migration statement creation
- migration signing
- migration verification
- self-pilot migration rehearsal
- `/verify` migration history and root continuity semantics

Remaining concern:

- More operator examples would help, but no core software blocker is currently visible.

### Stage 6 - Beacon And Directory Discovery

Verdict: implemented as post-v1 alpha support; not required for v1 core but strongly aligned with the project north star.

Completed:

- origin-owned Beacon signals
- verification-gated Beacon generation
- Beacon inspect with conformance states
- seed/sitemap/Directory/bounded-crawl sweep
- local index
- need-match query with explanations, risk gaps, and verification plans
- discovery quality report
- static Directory snapshot lifecycle
- Directory policy publication
- Directory compare and export

Remaining concern:

- Broad internet-scale crawling is intentionally outside the local CLI.
- Third-party Directory nodes do not exist yet.
- The taxonomy and query model will need iteration after real AI-agent and organization usage.

## Current Gaps

### Stable Release Blockers

These should be handled before calling anything v1 stable:

1. Complete the release state matrix in `RELEASE_INTEGRITY.md`.
2. Align source commit, Git tag, npm version, changelog, README, public `/verify`, and carrier receipts for the target release.
3. Decide whether live ENS resolver reads are mandatory for v1 or can remain a provider-integration step after v1.
4. Run a final secret scan and manually inspect matches.
5. Create clean commits from the current large working tree.
6. Re-run `node --run release:check` after the final commit-ready state.

### Adoption Confidence Gaps

These do not necessarily block alpha software, but they block strong public confidence claims:

1. No broad external organization pilot has completed.
2. No real third-party AI-agent integration feedback loop exists yet.
3. No independent Directory mirror or third-party Directory node exists yet.
4. No long-running discovery metrics exist from independent sweepers.
5. No real onion disaster-recovery endpoint has been published.

### Product Experience Gaps

These are important for future adoption but should not distract from the current review:

1. No local-first graphical OrgAnchor Studio.
2. Some flows still require command-line comfort.
3. Some status outputs are machine-friendly but not yet emotionally reassuring for non-technical operators.
4. Real organizations will need better templates for claims, evidence, corrections, and limitations.

## Risks To Watch

### Scope Drift

OrgAnchor can easily drift into being a marketplace, certification authority, crawler company, or hosted SaaS. The current design avoids that by keeping:

- root authority at the organization;
- evidence claims signed by the organization;
- carriers as carriers only;
- Directory as discovery only;
- final trust decisions outside OrgAnchor.

Review question:

```text
Does every feature reduce discovery, verification, understanding, or comparison cost without making OrgAnchor the judge of truth?
```

### False Trust Badges

`PASS` must never mean "this organization is good." It means a specific verification check passed.

Current mitigation:

- `policy_route`
- `conformance_status`
- visible proof trail
- value audit warnings
- adoption status trust boundary
- Directory trust-boundary language

Review question:

```text
Could a bad organization use this output as a fake endorsement?
```

### Discovery Capture

If only one Directory matters, the project can be captured by the ranking layer.

Current mitigation:

- Beacon-first discovery
- origin-owned `/.well-known/organchor.json`
- static Directory snapshots
- NDJSON export
- mirror/fork/compare support
- direct origin verification after discovery

Review question:

```text
Can a small organization still be discovered without paying or pleasing a central platform?
```

### Evidence Theater

Organizations may publish polished but weak claims.

Current mitigation:

- claims separated from identity
- evidence manifests with issuer type, hash, location, limitations, and reproducibility
- value continuity audit
- unsupported/stale/first-party-only warnings

Review question:

```text
Does the evidence layer help agents identify gaps, not just admire a well-formatted claim?
```

## Recommended Acceptance Review Agenda

Use this order for the human review:

1. North star review: confirm the core goal has not drifted.
2. Stage 1-5 review: decide whether the v1 core is functionally complete.
3. Stage 6 review: decide whether Beacon/Directory belong as post-v1 alpha features or should be partially promoted.
4. Trust boundary review: search for language that sounds like certification, permanence, or objective truth.
5. Adoption review: decide the first external pilot criteria.
6. Release review: complete the release integrity matrix.
7. Commit review: split the current working tree into sensible commits.

## Proposed Decision

Recommended decision:

```text
Accept current codebase as alpha implementation review-ready.
Do not declare stable v1 yet.
Prepare a release-integrity pass and external pilot pass next.
```

Suggested next concrete steps:

1. Review this document with the founder.
2. Update any verdicts the founder disagrees with.
3. Decide whether live ENS reads are required before v1.
4. Complete `RELEASE_INTEGRITY.md` matrix for the next milestone.
5. Run final secret scan.
6. Commit the current work in structured batches.
7. Start the first low-risk external organization pilot.

## Acceptance Review Checklist

- [ ] Founder agrees the current alpha implementation is review-ready.
- [ ] Founder agrees stable v1 should not be declared yet.
- [ ] Stage 1 verdict accepted or revised.
- [ ] Stage 2 verdict accepted or revised.
- [ ] Stage 3 verdict accepted or revised.
- [ ] Stage 4 verdict accepted or revised.
- [ ] Stage 5 verdict accepted or revised.
- [ ] Stage 6 verdict accepted or revised.
- [ ] ENS live-read decision made.
- [ ] Release integrity matrix owner assigned.
- [ ] External pilot criteria accepted.
- [ ] Current working tree commit plan accepted.
