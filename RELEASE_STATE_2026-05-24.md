# OrgAnchor Release State - 2026-05-24

Status: current-state snapshot, not a stable release declaration.

This file records the current alignment between:

```text
source state
npm package state
public self-pilot verification state
carrier receipt state
```

It exists so the project can continue scientifically: facts first, then decisions.

## Executive Summary

Current verdict:

```text
Public self-pilot verification: PASS
Public agent conformance: FULL_COMPATIBLE
Self-pilot adoption status: READY at Level 3
Dedicated public Beacon: PASS
Local source tree: DIRTY, not release-candidate clean
Stable v1 declaration: not ready
```

The public OrgAnchor self-pilot is working as an alpha proof. The source repository has moved beyond the published npm alpha and contains many uncommitted implementation and documentation changes. The next release-quality work is therefore release alignment, not broad feature expansion.

## Source State

Observed on 2026-05-24:

```text
branch: main
HEAD: 62a1a9d1f1d4dbfa7c29260bfc94bafbddbf7a99
HEAD summary: Add beacon conformance inspection
describe: v0.1.0-alpha.1-27-g62a1a9d-dirty
remote: https://github.com/OrgAnchor/OrgAnchor.git
working tree changed/untracked entries: 54
```

Interpretation:

- The current local workspace is not a clean release candidate.
- The current local workspace contains substantial work after `v0.1.0-alpha.1`.
- A stable release or next alpha should not be declared until the working tree is reviewed, split into sensible commits, and rechecked.

Implementation review snapshot:

```text
DIFF_REVIEW_2026-05-24.md
Beacon / Directory / agent-discovery diff review: no release-blocking issue found
node --run release:check: PASS, 86 tests
secret-like local filename scan: no matching source-repo files found
```

## Package State

Observed npm registry state:

```json
{
  "version": "0.1.0-alpha.1",
  "dist-tags": {
    "alpha": "0.1.0-alpha.1",
    "latest": "0.1.0-alpha.1"
  }
}
```

Interpretation:

- The public npm package is still the first alpha.
- Public documentation must continue to describe the package as alpha.
- The `latest` tag currently also points to the alpha package; this is not a stability claim.

## Public Verification State

Public target:

```text
https://organchor.org
```

Direct agent verification:

```text
organchor verify url https://organchor.org --compact
overall_status: PASS
identity_status: PASS
value_status: PASS
conformance_status: FULL_COMPATIBLE
root_authority_hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
statement_hash: sha256:5811e45488c093e8820b35edf144a8dbae0c20a79063a44993043bfdf26a0a36
policy_route: EXTERNAL_POLICY_REVIEW
```

Doctor check:

```text
organchor doctor https://organchor.org
status: READY
conformance_status: FULL_COMPATIBLE
blocking_issues: none
warnings: none
missing_capabilities:
  none
```

Interpretation:

- Identity verification passes.
- Value evidence verification passes.
- Agent-facing conformance is full-compatible.
- The current public discovery path works through a dedicated compact Beacon.

## Public Artifact Hashes

Fetched from `https://organchor.org` on 2026-05-24:

| URL | Status | SHA-256 | Bytes |
| --- | --- | --- | --- |
| `/verify/organchor.json` | 200 | `sha256:2bc764411b876dfbb40f52e47224c186a9c703f65b1da195ad34ebab857d694d` | 46,786 |
| `/.well-known/organchor.json` | 200 | `sha256:d3f961ef697c117c273f73303299ee3001974dda1896dacb6f92254d03a0a884` | 1,561 |
| `/verify/index.html` | 200 | `sha256:0d8e5a572c35e0fefcb55b6443286d3c0a1c41424c56100620cec34839081765` | 56,356 |
| `/verify/official-endpoints.json` | 200 | `sha256:764df104432b8fe855c2f36bcbac00a545f4c0e0cecf8736629a19661c3add32` | 2,421 |
| `/verify/official-endpoints.json.sig` | 200 | `sha256:0a466cfb6516b45c74bc52d5dcce4dee34b0d2307af5c741c3f03655d342c2bc` | 723 |
| `/verify/root-authority.json` | 200 | `sha256:ecfe6159c909ffc76e4c89ee95ca60157cff186a4ef3fd1df168d8f58a1c08c4` | 1,109 |
| `/verify/claims/product-claims.json` | 200 | `sha256:9cc44bef187b2b3f109f544d1b5804ee41f08af9217c950c98f9ea5c87cb9b13` | 3,760 |
| `/verify/claims/product-claims.json.sig` | 200 | `sha256:92141a7fe8568842c625569b13fd5b5de24e3a285a37233b6b2e825938f1b0c4` | 723 |
| `/verify/evidence/evidence-manifest.json` | 200 | `sha256:2e8ce206538f791df944f978f5c6dcae59a9d156a2edd2effb8a78fd704dafe3` | 35,739 |
| `/verify/evidence/evidence-manifest.json.sig` | 200 | `sha256:928dfc94aee6fa278c25f3aef28de31e1d393b05d17ed4c987c991d999b2e657` | 723 |
| `/verify/reports/value-continuity-report.json` | 200 | `sha256:f339cb7d3e8fa5bc05dd1aff160511390b7c221538a3d62f1b308c6200abac5e` | 41,836 |

Public cache header observed:

```text
cache-control: public, max-age=0, must-revalidate
```

## Public Verify Index Summary

From the current public/local self-pilot verify index:

```text
type: OrgAnchorVerifyIndex
generated_at: 2026-05-23T15:15:12.894Z
statement_hash: sha256:5811e45488c093e8820b35edf144a8dbae0c20a79063a44993043bfdf26a0a36
root_authority_hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
visible_proof: PASS
root_continuity: CURRENT_ROOT_ONLY
value_continuity: PRESENT
directory_discovery: PRESENT
carrier receipt count: 49
```

## Dedicated Beacon State

The public `/.well-known/organchor.json` now serves a compact `OrgAnchorBeacon` instead of reusing the full verify index.

```text
type: OrgAnchorBeacon
version: 1.0
origin: https://organchor.org
verify_index_url: https://organchor.org/verify/organchor.json
hash: sha256:d3f961ef697c117c273f73303299ee3001974dda1896dacb6f92254d03a0a884
bytes: 1,561
categories: software
capabilities: identity-continuity, value-continuity, agent-verification, discovery
regions: global
languages: en, zh
```

Beacon inspection result:

```text
organchor beacon inspect https://organchor.org
status: PASS
conformance_status: FULL_COMPATIBLE
signal.kind: beacon
strict_identity_verification: PASS
strict_value_verification: PASS
risk_gaps: none
```

This resolves the earlier doctor recommendation to publish a dedicated Beacon.

## Self-Pilot Adoption Status

Command:

```bash
organchor adoption status \
  --verify-dir E:\CivX\OrgAnchor-self-pilot\public\verify \
  --public-root E:\CivX\OrgAnchor-self-pilot\public \
  --origin https://organchor.org \
  --level 3 \
  --domain-report E:\CivX\OrgAnchor-self-pilot\reports\domain-security-report.json
```

Result:

```text
status: READY
identity_status: PASS
known_gap_count: 0
```

Operational note:

- When this command is run from outside the adoption workspace, pass `--domain-report`.
- Without that explicit path, the command looks for `reports/domain-security-report.json` relative to the current working directory and may report a false gap.

## Domain Audit State

Current self-pilot domain audit summary:

```text
domain: organchor.org
PASS: 7
WARN: 5
FAIL: 0
MANUAL_CHECK_REQUIRED: 3
```

Interpretation:

- No automatic domain audit failure is currently recorded.
- Manual checks remain part of the domain-risk layer and are not identity-root checks.

## Carrier Receipt State

Self-pilot `organchor.lock.json` summary:

```text
type: OrgAnchorLockfile
version: 1.0
artifact_count: 34
receipt_count: 49
providers:
  - arweave
  - arweave-turbo
  - cloudflare-pages
  - ipfs
  - ipfs-pinata
  - ipfs-pinning-service
  - opentimestamps
```

Important boundary:

```text
organchor.lock.json is a receipt log, not an identity root.
```

## Cloudflare Pages State

Latest deployment receipt in the self-pilot workspace:

```text
project_name: organchor-verify
custom_domain: organchor.org
deployment_url: https://2a50e510.organchor-verify.pages.dev
deployment_created_on: 2026-05-24T15:55:41.847451Z
deployment_status: success
custom_domain_status: active
public_dir_hash: sha256:b2f3ea2aea760071bf43a64ff7cb54c6695e93b0caf146108d9cee78797b6ef5
public beacon hash: sha256:d3f961ef697c117c273f73303299ee3001974dda1896dacb6f92254d03a0a884
public verify index hash: sha256:2bc764411b876dfbb40f52e47224c186a9c703f65b1da195ad34ebab857d694d
```

Self-reference note:

- The public verify index was generated before the final Cloudflare deployment.
- Therefore the current public page cannot contain its own final Cloudflare deployment receipt without changing itself again.
- This is an expected content-addressing self-reference gap, not a verification failure.

## IPFS State

Current and historical IPFS receipts exist in the self-pilot lockfile.

Recent embedded public-index receipt examples include:

```text
provider: ipfs-pinata
status: PUBLISHED
cid: bafybeidn3uriwpj66wyc3qwrc6lgepis56bew34xablgid56kjcz35t734
directory_hash: sha256:7f92137c9271d28e835df59c0a3cd83a7cea0eaa0e51663fd90cfbbf808dbe61
```

Interpretation:

- IPFS mirroring has been proven for self-pilot artifacts.
- The current final website deployment may be newer than the latest IPFS receipt embedded in the public verify index.
- This is not an identity failure; it is a release alignment item before the next promoted milestone.

## Arweave State

Arweave/Turbo receipts exist for self-pilot artifacts.

Recent embedded public-index receipt examples include:

```text
provider: arweave-turbo
status: PUBLISHED
recorded_at: 2026-05-21T08:43:47.123Z
manifest_canonical_hash: sha256:3d1bfc97289aa4cbe940350fef3501cd93082d0091ead8b2c6799d2c216aa11d
verify_page_tx_id: EEiyPP7qjwchyc9Nfi_bz4ibW-umtCdIx-Iahh9bZ4o
verify_index_tx_id: bSq2mtzphTnDFJoS1nvShAnB3zyziPq-YzzKNEKzXfc
statement_tx_id: pIpAvhpl6VekhCqftES3WoUmf69BIiqOBWFbwuCV5t4
signature_tx_id: 6oucTDs7woIN8dKUhsnUIDOTxv7FATIIH39TrmxilCw
root_authority_tx_id: NLsNnFXeGm_UOcS7hcF0r-5ewbjMX60gJU9WPvMs6FU
```

Interpretation:

- Arweave/Turbo archival has been proven for self-pilot artifacts.
- The current final public website hash is newer than the latest Arweave receipt embedded in the public verify index.
- Before a promoted release, decide whether to archive the newest verify package or explicitly mark the Arweave receipt as a prior historical anchor.

## OpenTimestamps State

Current self-pilot report:

```text
OpenTimestamps stamp: completed
Bitcoin anchor status: PENDING
Calendar used: https://a.pool.opentimestamps.org
Account required: no
Wallet required: no
Payment required: no
```

Interpretation:

- OpenTimestamps file binding has been exercised.
- Bitcoin anchoring is pending until calendar proofs are upgraded.
- This is expected behavior and should not be described as final Bitcoin anchoring yet.

## Known Alignment Gaps

These are not proof failures, but they block a clean release declaration:

1. The source tree is dirty and ahead of `v0.1.0-alpha.1`.
2. The npm package is still `0.1.0-alpha.1`, while local source has substantial unreleased changes.
3. The public verify index does not contain the final 2026-05-23 Cloudflare deployment receipt because of the normal self-reference gap.
4. Current public site hash appears newer than the latest embedded IPFS and Arweave receipts.
5. OpenTimestamps proofs are pending Bitcoin attestation.
6. The newest dedicated Beacon deployment is not itself embedded inside the already-generated verify index receipts. This is the same normal self-reference limit.

## Recommended Next Steps

Recommended order:

1. Decide whether to mirror/archive the current final verify package and Beacon again, or document the current IPFS/Arweave receipts as prior historical anchors.
2. Split the current source changes into clean commits.
3. Re-run `node --run release:check`.
4. Run a final secret scan and inspect matches manually.
5. Prepare the next alpha release notes if the current post-alpha work should be published.
6. Only after source/package/public/carrier states line up, consider a promoted milestone.

## Decision

Current recommended decision:

```text
Continue alpha hardening.
Do not declare stable v1 yet.
Treat OrgAnchor self-pilot as publicly verifiable but not release-aligned for a new promoted milestone.
```
