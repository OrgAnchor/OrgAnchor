# OrgAnchor Release State - 2026-05-25

Status: alpha-line release-state matrix for the current PR and public self-pilot.

This snapshot records the alignment between:

```text
current source branch
published npm alpha package
Git tag and GitHub release state
public self-pilot verification state
carrier receipt state
```

It is not a new release declaration. It is a consistency checkpoint so the project does not confuse a working public self-pilot with a promoted package release.

## Executive Summary

Current verdict:

```text
Public self-pilot verification: PASS
Public agent conformance: FULL_COMPATIBLE
Public doctor status: READY
Current source PR: draft, mergeable
Published npm alpha: 0.1.0-alpha.1
Published alpha tag: v0.1.0-alpha.1
Stable v1 declaration: not ready
```

The public OrgAnchor self-pilot at `https://organchor.org` is currently machine-verifiable and agent-ready. The current source branch is ahead of the published `0.1.0-alpha.1` tag and package, so the next release decision must choose a new release id before publishing or promoting this branch.

## Source And Package Matrix

Observed on 2026-05-25:

| Field | Value | Status |
| --- | --- | --- |
| Current branch | `codex/alpha-release-alignment-20260525` | Active PR branch |
| Current HEAD | `c25093e24a2b05952e534077ad6f770e67cc3a80` | Current source state |
| Current PR | `https://github.com/OrgAnchor/OrgAnchor/pull/1` | Draft, mergeable |
| PR title | `[codex] Align discovery alpha and release review` | Current review surface |
| Base branch | `main` | PR target |
| `origin/main` | `62a1a9d1f1d4dbfa7c29260bfc94bafbddbf7a99` | Behind current PR |
| Published package | `organchor@0.1.0-alpha.1` | Existing npm alpha |
| npm `alpha` dist-tag | `0.1.0-alpha.1` | Alpha tag points to alpha |
| npm `latest` dist-tag | `0.1.0-alpha.1` | Must still be described as alpha-only |
| Git tag | `v0.1.0-alpha.1` | Existing alpha tag |
| Git tag object | `b70881e73d17b37bbe6cb5faa9e25b22c3db5271` | Annotated tag |
| Git tag commit | `866b0d7d739a937996109f10fac276f31963f9ee` | Published alpha source point |
| GitHub release | `OrgAnchor 0.1.0-alpha.1` | Draft prerelease |

Interpretation:

- The current PR is not the same state as `organchor@0.1.0-alpha.1`.
- The current PR should not be described as the already-published alpha package.
- A future package publish should use a new release id, for example `0.1.0-alpha.2` or another explicitly chosen version.
- The npm `latest` tag currently points to the alpha package. Public docs must avoid implying stable readiness.

## Public Verification State

Public target:

```text
https://organchor.org
```

Direct agent verification:

```text
node src/cli.ts verify url https://organchor.org --compact
overall_status: PASS
identity_status: PASS
value_status: PASS
conformance_status: FULL_COMPATIBLE
trust_decision: NOT_ASSIGNED_BY_ORGANCHOR
root_authority_hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
statement_hash: sha256:5811e45488c093e8820b35edf144a8dbae0c20a79063a44993043bfdf26a0a36
policy_route: EXTERNAL_POLICY_REVIEW
```

Doctor check:

```text
node src/cli.ts doctor https://organchor.org
status: READY
signal_kind: beacon
signal_url: https://organchor.org/.well-known/organchor.json
identity_status: PASS
value_status: PASS
conformance_status: FULL_COMPATIBLE
blocking_issues: none
warnings: none
missing_capabilities: none
```

Interpretation:

- The public Beacon is discoverable at `/.well-known/organchor.json`.
- The public verify package passes identity verification and value-evidence verification.
- OrgAnchor still does not assign the final trust decision; external users or AI agents must apply their own policy.

## Public Artifact Hashes

These hashes are byte-level retrieval hashes from the public website on 2026-05-25.

| URL | Status | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `https://organchor.org/verify/` | 200 | 56356 | `sha256:0d8e5a572c35e0fefcb55b6443286d3c0a1c41424c56100620cec34839081765` |
| `https://organchor.org/verify/organchor.json` | 200 | 46786 | `sha256:2bc764411b876dfbb40f52e47224c186a9c703f65b1da195ad34ebab857d694d` |
| `https://organchor.org/verify/official-endpoints.json` | 200 | 2421 | `sha256:764df104432b8fe855c2f36bcbac00a545f4c0e0cecf8736629a19661c3add32` |
| `https://organchor.org/verify/root-authority.json` | 200 | 1109 | `sha256:ecfe6159c909ffc76e4c89ee95ca60157cff186a4ef3fd1df168d8f58a1c08c4` |
| `https://organchor.org/.well-known/organchor.json` | 200 | 1561 | `sha256:d3f961ef697c117c273f73303299ee3001974dda1896dacb6f92254d03a0a884` |

Important distinction:

- The byte-level hash of `root-authority.json` is `sha256:ecfe6159c909ffc76e4c89ee95ca60157cff186a4ef3fd1df168d8f58a1c08c4`.
- The canonical root authority hash reported by verification is `sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9`.
- Both can be valid in context. Byte hashes measure fetched file bytes; canonical hashes measure the normalized verification object.

## Value And Discovery State

The public verify index reports:

```text
value_continuity.status: PRESENT
value report hash: sha256:ea8a9921342a88ff43c2fac262c96cb97852e0067afed46cce706dd163d8c764
value markdown hash: sha256:c84a066996d90cee2f42a2d2737de3371cc772510963d1be3d52d1fc93d0e7c2
total_claims: 1
evidence_linked_claims: 1
unsupported_claims: 0
total_evidence_items: 34
external_evidence_items: 34
reproducible_claims: 1
manual_checks: 34
```

Directory discovery state:

```text
directory_discovery.status: PRESENT
snapshot: /directory/directory-snapshot.json
snapshot hash: sha256:3e246b52d68e05621944b1ccc62f37f42cc6b0feb53d2f8f73df18800cc7c765
snapshot_id: organchor-directory-self-pilot-2026-001
record_count: 1
policy hash: sha256:d74f953c5f8643ffdf20d8d83b7467cfaa7c4d2dc5e6689b115834151d5fd3d0
```

Interpretation:

- The value layer is present and verifiable, but still alpha-level and self-pilot centered.
- The Directory layer is present as a one-record self-pilot discovery proof, not as a broad ecosystem directory.

## Carrier Receipts

Carrier receipts are public evidence that artifacts were mirrored, archived, timestamped, or deployed. They are not identity roots.

Latest website carrier receipt:

```text
provider: cloudflare-pages
status: PUBLISHED
recorded_at: 2026-05-22T06:53:25.740Z
deployment_url: https://575fc761.organchor-verify.pages.dev
custom_domain: organchor.org
domain_status: active
public_dir_hash: sha256:be313137fb5c24f75d8f9a7f6bb15423b91ac35cfc7f48f63b99194aecf0c69b
```

Latest IPFS carrier receipt:

```text
provider: ipfs-pinata
status: PUBLISHED
recorded_at: 2026-05-21T08:27:35.985Z
cid: bafybeidn3uriwpj66wyc3qwrc6lgepis56bew34xablgid56kjcz35t734
directory_hash: sha256:7f92137c9271d28e835df59c0a3cd83a7cea0eaa0e51663fd90cfbbf808dbe61
total_size: 192781
file_count: 11
```

Latest Arweave Turbo carrier receipt:

```text
provider: arweave-turbo
status: PUBLISHED
recorded_at: 2026-05-21T08:43:47.123Z
manifest_canonical_hash: sha256:3d1bfc97289aa4cbe940350fef3501cd93082d0091ead8b2c6799d2c216aa11d
directory_hash: sha256:5dd704d2132d6d4c9ccdcd3147820f4f217d1f743e32c314add6b9faef895ace
claims_tx_id: BThOZHoeYDAvfjQo5oNbP7pCKX8TStRqSpr-tlvK6qo
evidence_tx_id: _tK3XLL-8ndkbmqYYBBv6FnJDDe10mgNBeyI2mmBfek
statement_tx_id: pIpAvhpl6VekhCqftES3WoUmf69BIiqOBWFbwuCV5t4
signature_tx_id: 6oucTDs7woIN8dKUhsnUIDOTxv7FATIIH39TrmxilCw
root_authority_tx_id: NLsNnFXeGm_UOcS7hcF0r-5ewbjMX60gJU9WPvMs6FU
verify_page_tx_id: EEiyPP7qjwchyc9Nfi_bz4ibW-umtCdIx-Iahh9bZ4o
verify_index_tx_id: bSq2mtzphTnDFJoS1nvShAnB3zyziPq-YzzKNEKzXfc
```

OpenTimestamps receipt state:

```text
official-endpoints proof artifact: anchors\opentimestamps\official-endpoints.json.ots
artifact hash: sha256:764df104432b8fe855c2f36bcbac00a545f4c0e0cecf8736629a19661c3add32
latest recorded action: anchor.opentimestamps.upgrade
status: PUBLISHED
recorded_at: 2026-05-13T07:07:56.429Z
```

This pass records the public receipt state. It did not independently re-run OpenTimestamps calendar or Bitcoin-attestation verification.

## Self-Reference Gap

The public verify page cannot contain the final content hash, CID, Arweave transaction id, or Cloudflare deployment hash of itself without changing itself.

Current observed example:

- Public `/verify/` byte hash: `sha256:0d8e5a572c35e0fefcb55b6443286d3c0a1c41424c56100620cec34839081765`.
- Latest embedded Cloudflare public directory receipt hash: `sha256:be313137fb5c24f75d8f9a7f6bb15423b91ac35cfc7f48f63b99194aecf0c69b`.

This difference is expected. It is a content-addressing self-reference limit, not a verification failure.

## GitHub Connector State

The GitHub connector was rechecked on 2026-05-25:

```text
GitHub App: chatgpt-codex-connector
Organization: OrgAnchor
Repository scope: selected repository only
Repository: OrgAnchor/OrgAnchor
Connector write test: PR update succeeded
```

Interpretation:

- The connector can read and update the OrgAnchor repository and PR #1.
- The installation is not organization-wide for future repositories.

## Known Gaps

- Current source branch is ahead of the published `0.1.0-alpha.1` package and tag.
- GitHub release `OrgAnchor 0.1.0-alpha.1` is still a draft prerelease.
- The npm `latest` dist-tag currently points to the alpha package; documentation must keep calling it alpha.
- No broad external organization pilot has completed yet.
- Directory state is self-pilot alpha with one record, not ecosystem coverage.
- ENS live resolver reads still require a chosen Ethereum RPC/provider path.
- No real Onion disaster-recovery address has been registered.
- OpenTimestamps public receipt state is recorded, but this pass did not independently re-run proof verification.

## Release Integrity Gate Result

Completed for this milestone:

- Release state matrix recorded in this file.
- Public `/verify` artifact hashes recorded.
- Website, IPFS, Arweave, and OpenTimestamps receipt states recorded.
- Content-addressing self-reference gap documented.
- Carrier receipts explicitly treated as receipts, not identity roots.

Not complete:

- Source commit, package version, Git tag, npm dist-tag, and GitHub release do not yet describe the same current source state.
- A new release id and release candidate freeze are required before publishing this PR as a package or promoted release.
