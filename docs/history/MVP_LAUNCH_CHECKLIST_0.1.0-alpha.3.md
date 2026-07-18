# OrgAnchor MVP Launch Checklist

Status: Historical record. Completed checklist for the `0.1.0-alpha.3` MVP launch candidate.

## Purpose

This checklist defines the shortest practical path from the current alpha implementation to a usable public MVP.

MVP here means:

```text
An external operator can install OrgAnchor, create a verifiable organization package, publish a static /verify page, expose a Beacon, and let a third-party AI agent verify identity continuity and evidence structure at low cost.
```

It does not mean stable v1, legal certification, product-quality certification, hosted SaaS, or a global marketplace.

## Launch Target

```text
package: organchor
candidate version: 0.1.0-alpha.3
publish tag: alpha
stable v1: not yet
```

## Must Be True Before Publishing

- [x] `main` contains the merged discovery, Beacon, Directory, adoption-status, and release-state baseline.
- [x] `package.json` version is set to `0.1.0-alpha.3`.
- [x] `CHANGELOG.md` has `0.1.0-alpha.3` release notes.
- [x] Public self-pilot status is recorded in `docs/history/RELEASE_STATE_2026-05-25.md`.
- [x] Public `https://organchor.org` doctor check is `READY`.
- [x] Release integrity self-reference limits are documented.
- [x] `node --run release:check` passes on the launch candidate.
- [x] `npm pack --dry-run` passes and the file list is reviewed.
- [x] `npm publish --dry-run --tag alpha` passes.
- [x] No private keys, provider tokens, wallets, payment data, or local self-pilot secrets are in the package file list.
- [x] GitHub Actions trusted publishing workflow is prepared in `.github/workflows/publish-npm.yml`.
- [x] npm package trusted publisher is configured on npmjs.com for `OrgAnchor/OrgAnchor` and `publish-npm.yml`.
- [x] GitHub Actions trusted-publishing run publishes `organchor@0.1.0-alpha.3` with the `alpha` dist-tag.
- [x] Git tag `v0.1.0-alpha.3` is created only after the candidate source is frozen.
- [x] GitHub prerelease notes are drafted from `CHANGELOG.md`.
- [x] Real `npm publish --tag alpha` through Trusted Publishing is approved by the operator and completed.
- [x] Fresh install from npm can run `organchor --help`.
- [x] Fresh install from npm can run `organchor doctor https://organchor.org`.

## Must Be True Before Calling It V1

- [ ] At least one low-risk external organization pilot completes the `docs/guides/EXTERNAL_PILOT_RUNBOOK.md` flow.
- [ ] Pilot lessons are folded back into onboarding docs and CLI output.
- [ ] The external pilot can be verified without access to private operator workspaces.
- [ ] Remaining ENS live-read and Onion real-address gaps are either completed or explicitly scoped out of v1 stable.
- [ ] Public docs clearly say OrgAnchor verifies continuity and evidence structure, not final trustworthiness.

## Immediate MVP Launch Sequence

1. Freeze the `0.1.0-alpha.3` candidate.
2. Run `node --run release:check`.
3. Run `npm pack --dry-run` and inspect package contents.
4. Run `npm publish --dry-run --tag alpha`.
5. Tag `v0.1.0-alpha.3`.
6. Draft GitHub prerelease.
7. Publish to npm under `alpha` after operator approval and 2FA.
8. Install from npm and verify `https://organchor.org`.
9. Start the first low-risk external pilot.

## External Pilot Entry Criteria

The first external pilot can start when:

- The pilot organization agrees that its root authority is the identity root.
- It accepts that domains, IPFS, Arweave, OpenTimestamps, Onion, ENS, lockfiles, and Directory entries are carriers or discovery surfaces, not trust roots.
- It has a low-risk public claim set suitable for an alpha pilot.
- It has a domain or static hosting surface where `/verify` can be published.
- It can name a root authority custody model, even if the first pilot uses `1-of-1`.
