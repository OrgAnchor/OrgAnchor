# OrgAnchor V1 Release Checklist

Status: Active release hygiene checklist for `0.1.0-alpha.1`.

## Purpose

This checklist defines the minimum release hygiene before OrgAnchor is presented as a v1-ready open-source toolchain.

It is not a product roadmap. It is the final gate for packaging, documentation, examples, and safety.

## Release Identity

- [x] Release version chosen: `0.1.0-alpha.1`.
- [x] Release tag chosen: `v0.1.0-alpha.1`.
- [x] Release notes drafted in `CHANGELOG.md`.
- [x] NPM package name occupied on the public registry: `organchor@0.1.0-alpha.1`.
- [x] `package.json` defaults publish tag to `alpha`.
- [x] NPM publisher account is created, protected with 2FA, and logged in locally.
- [x] NPM alpha package published: `organchor@0.1.0-alpha.1`.
- [x] NPM alpha install verified with `organchor --help`.
- [ ] NPM `latest` dist-tag cleanup is deferred; current registry state also exposes `0.1.0-alpha.1` as `latest`, so public docs must keep calling it alpha-only.
- [x] Local Git repository is initialized.
- [x] Source repository is pushed to a public GitHub repository: `https://github.com/OrgAnchor/OrgAnchor`.
- [x] Release tag pushed: `v0.1.0-alpha.1`.
- [ ] README status reflects the actual stage.
- [ ] Public claims avoid "permanent identity", "absolute censorship resistance", "fully decentralized", and "legal identity replacement".
- [ ] Apache-2.0 license file is present.

## Build and Package

- [x] `npm run build` produces `dist/`.
- [x] `dist/cli.js` exists and keeps the Node shebang.
- [x] `package.json` `bin.organchor` points to `dist/cli.js`.
- [x] `npm pack --dry-run` contains `dist/`, schemas, templates, examples, curated user/operator docs, README, changelog, and license.
- [x] `npm pack --dry-run` excludes internal self-pilot, Cloudflare handoff, domain-candidate, and release-checklist notes.
- [x] `node --run package:smoke` passes as a local fallback when `npm pack --dry-run` is unavailable.
- [x] A clean temporary install can run `organchor --help`.
- [ ] A clean temporary install can run the Stage 1 flow.
- [x] `node --run install:smoke` passes against a simulated `node_modules/organchor` install and `.bin/organchor` shim.
- [x] `node --run release:smoke` passes against the built `dist/cli.js`.
- [x] `npm publish --dry-run --tag alpha` passes before any real publish.

## Tests

- [x] TypeScript typecheck passes.
- [x] Full test suite passes.
- [ ] Example artifacts verify.
- [x] Page generation includes visible proof trail.
- [x] Page generation includes `root_continuity`.
- [x] Page generation includes carrier receipt summaries from `organchor.lock.json`.
- [x] Migration tests verify old-root-to-new-root continuity.
- [x] Negative tests fail as expected.

## Examples

- [ ] `examples/complete` exists.
- [ ] Example contains no private keys.
- [ ] Example statement verifies with the example root authority.
- [ ] Example README includes verification command.
- [ ] Example is clearly marked unsafe for real identity use.

## Documentation

- [ ] `README.md` links to the adoption documents.
- [ ] `ADOPTION_GUIDE.md` explains levels and safe adoption boundaries.
- [ ] `EXTERNAL_PILOT_RUNBOOK.md` gives a short repeatable external pilot path.
- [ ] `ORG_ONBOARDING_CHECKLIST.md` separates public and private files.
- [ ] `ROOT_AUTHORITY_CUSTODY_GUIDE.md` explains key loss and compromise.
- [ ] `MIGRATION_GUIDE.md` explains root authority evolution and historical verification.
- [ ] `PUBLISHING_GUIDE.md` explains IPFS, Arweave, and OpenTimestamps honestly.
- [ ] `DOMAIN_HARDENING_GUIDE.md` separates automatic checks from manual checks.
- [ ] `EVIDENCE_ONBOARDING_GUIDE.md` explains claims and evidence limits.

## Secret Safety

- [ ] No `keys/*.private.json` under source-controlled examples.
- [ ] No provider tokens.
- [ ] No Cloudflare credentials.
- [ ] No Pinata JWT.
- [ ] No Arweave wallet body.
- [ ] No payment data.
- [ ] Lockfile examples contain receipts only, not secret material.

Recommended scan:

```bash
rg -n "private\\.json|BEGIN PRIVATE|api[_-]?key|secret|token|jwt|wallet|cloudflare|pinata" .
```

Review matches manually because documentation may mention these words safely.

## Public Self-Pilot

- [ ] `https://organchor.org/verify/` loads.
- [ ] `https://organchor.org/verify/organchor.json` loads.
- [ ] Public statement verifies from downloaded artifacts.
- [ ] Public `/verify` shows visible proof trail.
- [ ] Public `/verify` shows root continuity.
- [ ] Current IPFS CID is recorded.
- [ ] Current Arweave TX ids or manual package status are recorded.
- [ ] OpenTimestamps status is recorded.
- [ ] Domain audit status is recorded.
- [ ] Known gaps are explicit.

## Release Integrity Gate

- [x] Release integrity protocol is recorded in `RELEASE_INTEGRITY.md`.
- [ ] Release state matrix is completed for the target release or milestone.
- [ ] Source commit, package version, Git tag, npm dist-tag, and release notes describe the same state.
- [ ] Public `/verify` artifact hashes are recorded.
- [ ] IPFS, Arweave, OpenTimestamps, and website receipts are recorded or explicitly marked out of scope.
- [ ] Content-addressing self-reference gaps are documented instead of hidden.
- [ ] Carrier receipts are treated as receipts, not as identity roots.

## Release Decision

Do not publish v1 if:

- The CLI only works from the source tree.
- The npm package cannot run after install.
- Private keys or provider secrets appear in publishable files.
- The README overclaims trust, permanence, or decentralization.
- The example cannot be independently verified.
- The self-pilot public artifacts cannot be verified.

Release may proceed when:

```text
Build passes.
Tests pass.
Package installs.
Example verifies.
Self-pilot verifies.
Docs explain the limits honestly.
```
