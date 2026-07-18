# OrgAnchor Release State - 2026-05-25

Status: Historical record. Original status at publication: alpha-line release-state matrix after the `0.1.0-alpha.3` MVP alpha publication and public self-pilot verification.

This snapshot records the alignment between:

```text
current source branch
published alpha release commit
published npm alpha package
Git tag and GitHub release state
public self-pilot verification state
carrier receipt state
```

It is a consistency checkpoint so the project does not confuse the moving `main` branch, the published alpha release commit, and the public self-pilot state.

## Executive Summary

Current verdict:

```text
Public self-pilot verification: PASS
Public agent conformance: FULL_COMPATIBLE
Public doctor status: READY
Current source branch: main
Published npm alpha: 0.1.0-alpha.3
Published alpha tag: v0.1.0-alpha.3
GitHub prerelease: published
Stable v1 declaration: not ready
```

The public OrgAnchor self-pilot at `https://organchor.org` is currently machine-verifiable and agent-ready. `organchor@alpha` now points to `0.1.0-alpha.3`.

The moving `main` branch is one documentation/status commit ahead of the `v0.1.0-alpha.3` release commit. That is expected: the release artifact is anchored at the tag commit, while `main` records post-release status.

## Source And Package Matrix

Observed on 2026-05-25:

| Field | Value | Status |
| --- | --- | --- |
| Current branch | `main` | Active development branch |
| Current HEAD | `406213dae06c882eec6c5635fa99d6bdd9c7175a` | Post-release status documentation commit |
| Release source commit | `aeadaeddc5d736320cbda73929bda11154d1f2e7` | Commit used by `v0.1.0-alpha.3`, npm publish, and GitHub Actions |
| Release source subject | `Prepare alpha.3 aligned release candidate` | Frozen release source |
| Post-release status subject | `Record alpha.3 publication status` | Documentation-only follow-up on `main` |
| Published package | `organchor@0.1.0-alpha.3` | Current npm alpha |
| npm `alpha` dist-tag | `0.1.0-alpha.3` | Current alpha install target |
| npm `latest` dist-tag | `0.1.0-alpha.1` | Intentionally not promoted to the newest alpha |
| Git tag | `v0.1.0-alpha.3` | Annotated release tag |
| Git tag commit | `aeadaeddc5d736320cbda73929bda11154d1f2e7` | Published alpha source point |
| GitHub release | `OrgAnchor 0.1.0-alpha.3` | Published prerelease |
| GitHub Actions run | `26382217438` | Successful Trusted Publishing run |

Interpretation:

- `v0.1.0-alpha.3`, the npm package `organchor@0.1.0-alpha.3`, the npm `alpha` dist-tag, and the GitHub prerelease describe the same release source commit.
- `main` is allowed to move after a release, but post-release commits must not be retroactively described as part of the already-published tag.
- The npm `latest` tag still points to `0.1.0-alpha.1`. Public docs must use `organchor@alpha` and avoid implying stable readiness.

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

## Publication Automation State

The publication path was rechecked on 2026-05-25:

```text
GitHub repository: OrgAnchor/OrgAnchor
Trusted publisher provider: GitHub Actions
Trusted publisher workflow: .github/workflows/publish-npm.yml
Trusted publisher npm configuration: OrgAnchor/OrgAnchor, publish-npm.yml, npm publish permission
Workflow run: 26382217438
Workflow conclusion: success
npm alpha package: organchor@0.1.0-alpha.3
GitHub release: https://github.com/OrgAnchor/OrgAnchor/releases/tag/v0.1.0-alpha.3
```

Interpretation:

- OrgAnchor now publishes npm alpha releases through short-lived GitHub Actions OIDC, not a long-lived npm token.
- `v0.1.0-alpha.3` is the first release published through this path.

## Known Gaps

- `main` is ahead of the `v0.1.0-alpha.3` release tag by a post-release documentation/status commit.
- The npm `latest` dist-tag currently points to `0.1.0-alpha.1`; documentation must keep calling the package alpha and recommend `organchor@alpha`.
- No broad external organization pilot has completed yet.
- Directory state is self-pilot alpha with one record, not ecosystem coverage.
- ENS live resolver reads still require a chosen Ethereum RPC/provider path.
- No real Onion disaster-recovery address has been registered.
- OpenTimestamps public receipt state is recorded, but this pass did not independently re-run proof verification.

## Release Integrity Gate Result

Completed for this milestone:

- Release state matrix recorded in this file.
- `v0.1.0-alpha.3`, npm `alpha`, GitHub release, and Trusted Publishing workflow run aligned to the same release source commit.
- Public `/verify` artifact hashes recorded.
- Website, IPFS, Arweave, and OpenTimestamps receipt states recorded.
- Content-addressing self-reference gap documented.
- Carrier receipts explicitly treated as receipts, not identity roots.

Not complete:

- Stable v1 declaration is not ready.
- A broad external organization pilot has not yet completed.
- `latest` is not promoted to a stable package version.
