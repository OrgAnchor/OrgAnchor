# Fireseed Alpha.4 Public Self-Verification

Status: PASS FOR EXTERNAL FIRESEED REVIEW

Checked at: `2026-07-15T01:40:59Z`

Release: `organchor@0.1.0-alpha.4`

Chinese translation: `PUBLIC_SELF_VERIFICATION_2026-07-15.zh-CN.md`

## Purpose

This record checks whether an outside reviewer can reach the public OrgAnchor surfaces, install the published package, discover the OrgAnchor Beacon, and independently run the public verification path.

It is a reproducibility and release-alignment record. It is not a certification of OrgAnchor, proof that every published claim is true, a supplier recommendation, or a stable-v1 declaration.

## Acceptance Checklist

- [x] The source commit, release tag, and npm package `gitHead` resolve to the same commit.
- [x] The GitHub prerelease is public and reachable.
- [x] npm publishes `0.1.0-alpha.4` under the `alpha` tag.
- [x] The package installs successfully in a clean temporary directory on Node.js 24.
- [x] The public homepage is reachable as HTML.
- [x] The human-readable `/verify/` page is reachable as HTML.
- [x] The well-known Beacon is reachable as JSON.
- [x] The machine-readable verification index is reachable as JSON.
- [x] `organchor doctor` reports `READY` with no blocking issues or warnings.
- [x] `organchor beacon inspect` reports `PASS` and performs strict verification.
- [x] `organchor verify url --compact` reports identity, value, and conformance verification results.
- [x] The compact result keeps the final trust decision outside OrgAnchor.
- [x] The public lockfile and carrier receipts verify through the public package.
- [x] Alpha limits and evidence gaps remain visible.

## Release Linkage

| Surface | Observed result |
| --- | --- |
| Source commit | `7a77fb69748a5b65c112f68c66ec15ba419e7cee` |
| Git tag | `v0.1.0-alpha.4` resolves to the same source commit |
| GitHub Release | Public prerelease: `OrgAnchor 0.1.0-alpha.4` |
| npm package | `organchor@0.1.0-alpha.4` |
| npm `gitHead` | Same source commit |
| npm dist-tag | `alpha -> 0.1.0-alpha.4` |
| npm provenance | Registry metadata exposes SLSA provenance attestations |
| Publish workflow | GitHub Actions run `29378132847`: `success` |

Public release: https://github.com/OrgAnchor/OrgAnchor/releases/tag/v0.1.0-alpha.4

npm package: https://www.npmjs.com/package/organchor/v/0.1.0-alpha.4

## Public Endpoint Check

All endpoint hashes below are observations of the HTTP response bytes at the check time. They are useful for reproducing this check, but they are not protocol trust roots and may change after a legitimate deployment.

| Surface | HTTP | Content type | SHA-256 |
| --- | ---: | --- | --- |
| `https://organchor.org/` | `200` | `text/html; charset=utf-8` | `bf4a8a3fd8ae6404c52c2b7ebf187f40d45236ca90cfb2b30b66973d29022947` |
| `https://organchor.org/verify/` | `200` | `text/html; charset=utf-8` | `805b48ec4844ab0d3db69a9cd43dbae9dd100ae5a78b5a1dc2ab2ac81cb8f549` |
| `https://organchor.org/.well-known/organchor.json` | `200` | `application/json; charset=utf-8` | `18b94c020de16abd6c5db89940fab134004e6763ba870826aaf03a3a998ea1b6` |
| `https://organchor.org/verify/organchor.json` | `200` | `application/json; charset=utf-8` | `5cd8c8b12d9c948c05377a52a725a68edc97cb2ec9a4d376302e9fa5726d12d8` |

Observed page titles:

```text
Homepage: OrgAnchor - Verifiable Organization Continuity
Verify page: OrgAnchor Verification
```

## Clean Installation Check

The published package was installed from npm in a new temporary directory:

```text
Node.js: v24.15.0
Package: organchor@0.1.0-alpha.4
Install result: PASS
```

The installed CLI, rather than the source checkout, was used for the public checks below.

## Agent Verification Results

Observed Doctor result:

```text
status: READY
conformance_status: FULL_COMPATIBLE
blocking_issues: none
warnings: none
missing_capabilities: none
```

Observed Beacon inspection result:

```text
status: PASS
conformance_status: FULL_COMPATIBLE
signal_url: https://organchor.org/.well-known/organchor.json
strict_identity_verification: PASS
strict_value_verification: PASS
```

Observed compact verification result:

```text
overall_status: PASS
identity_status: PASS
value_status: PASS
conformance_status: FULL_COMPATIBLE
trust_decision: NOT_ASSIGNED_BY_ORGANCHOR
lockfile: PASS
carrier_receipts: PASS
```

The verified public identifiers were:

```text
root_authority_hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
statement_hash: sha256:5811e45488c093e8820b35edf144a8dbae0c20a79063a44993043bfdf26a0a36
lockfile_hash: sha256:f67473676a29ccd17008a22a46e94047d6b8b66a85f8c4fe35309e8aab92b471
```

## Reproduce the Check

Node.js 24 or newer is required by this Alpha package.

```bash
mkdir organchor-alpha4-review
cd organchor-alpha4-review
npm init -y
npm install organchor@alpha
npx organchor doctor https://organchor.org
npx organchor beacon inspect https://organchor.org
npx organchor verify url https://organchor.org --compact
```

Release metadata can be checked without installing the package:

```bash
npm view organchor dist-tags --json
npm view organchor@0.1.0-alpha.4 version gitHead dist.integrity dist.attestations --json
```

## Disclosed Evidence Limits

The current public package reports:

```text
evidence items: 36
reproducible claims: 1
third-party claims: 0
manual checks: 37
risk gaps: 3
```

The top disclosed gaps are:

- only first-party evidence is linked;
- some evidence does not yet have sufficiently exact subject binding for mechanical coverage review;
- manual evidence checks remain.

The self-pilot currently declares no effective S2 third-party material, S3 random-sampling evidence, or S4 real-world observation evidence. These absences are exposed to the external policy rather than converted into a false trust decision.

`value_status: PASS` means that the signed value report, hashes, and declared relations passed the implemented checks. It does not prove claim truth or evidence sufficiency. The external reviewer or Agent still owns the policy decision.

## Non-Blocking Follow-Ups

- The CLI does not yet implement the conventional `organchor --version` flag. Reviewers can confirm the installed release through npm metadata or the installed package manifest.
- npm `latest` remains on `0.1.0-alpha.1`; reviewers must use `organchor@alpha` or the exact `0.1.0-alpha.4` version during Fireseed review. This prevents the prerelease from silently replacing the current default tag.

## Decision

```text
PUBLIC SELF-VERIFICATION: PASS
EXTERNAL FIRESEED REVIEW: READY
STABLE V1: NOT CLAIMED
FINAL TRUST DECISION: NOT ASSIGNED BY ORGANCHOR
```

This result supports external reproduction, critique, Agent-compatibility testing, and low-risk pilot attempts. It does not authorize claims of certification, endorsement, evidence sufficiency, production stability, or successful broad adoption.
