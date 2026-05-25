# OrgAnchor Release Publishing Plan

Status: Operator plan for the `0.1.0-alpha.2` MVP launch candidate, with `0.1.0-alpha.1` kept as the published baseline.

Last checked: 2026-05-25.

## Current Readiness

The package is buildable and installable locally:

```text
package name: organchor
candidate version: 0.1.0-alpha.2
default publish tag: alpha
public registry: https://registry.npmjs.org/
source repository: https://github.com/OrgAnchor/OrgAnchor
```

Local checks already expected before publishing:

```bash
npm run release:check
npm pack --dry-run
npm publish --dry-run --tag alpha
```

For `0.1.0-alpha.2` and later, run the release integrity gate in `RELEASE_INTEGRITY.md` before npm publishing or GitHub release creation. The gate keeps source state, public `/verify` state, carrier receipts, package metadata, and release notes aligned.

Current `0.1.0-alpha.2` candidate status:

```text
node --run release:check: PASS
npm pack --dry-run: PASS
npm publish --dry-run --tag alpha: PASS
npm publish --tag alpha: not started; human approval and 2FA required
```

Published baseline:

```text
organchor@0.1.0-alpha.1: published
v0.1.0-alpha.1: pushed
GitHub prerelease for v0.1.0-alpha.1: draft prerelease
```

## Current External State

As of 2026-05-18:

- `npm view organchor` against the public npm registry returns `0.1.0-alpha.1`.
- NPM package `organchor@0.1.0-alpha.1` is published.
- NPM dist-tags currently show both `alpha` and `latest` pointing to `0.1.0-alpha.1`.
- The `latest` dist-tag should not be advertised as stable; public install instructions should use `organchor@alpha` until a stable release exists.
- Long-lived npm credentials are not stored in this repository.
- `E:\CivX\OrgAnchor` is initialized as a local Git repository.
- `main` is pushed to `https://github.com/OrgAnchor/OrgAnchor`.
- `v0.1.0-alpha.1` is pushed to GitHub.
- A GitHub prerelease draft exists for `v0.1.0-alpha.1`.

This means the first public alpha is available. It is still not a v1 stable release.

## Recommended Release Order

### 1. Create The Source Repository

Completed.

Recommended repository name:

```text
OrgAnchor
```

Recommended owner:

```text
OrgAnchor project account or organization
```

Avoid publishing first only to npm. For an open-source identity toolchain, source review matters.

### 2. Prepare Local Git

Completed.

```bash
git add .
git commit -m "Prepare 0.1.0-alpha.1 release candidate"
git branch -M main
git remote add origin <GITHUB_REPOSITORY_URL>
git push -u origin main
```

Before `git add .`, run a secret scan and review the files manually.

The public repository should not include local operations notes such as:

```text
CLOUDFLARE_*.md
SELF_PILOT_*.md
DOMAIN_CANDIDATE_REPORT.md
vps-entry-layout-*.svg
```

Those files are useful local project memory, but they are not part of the clean public source release.

### 3. Create NPM Publisher Identity

Use a project-controlled npm account rather than a personal account.

Recommended account email:

```text
organchor.admin@proton.me
```

Security settings:

- Enable 2FA.
- Prefer `auth-and-writes` protection.
- Save recovery codes offline.
- Do not store npm password, recovery codes, or long-lived tokens in this repository.

### 4. Log In Locally

Use npm's normal login flow:

```bash
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
```

This is a human approval gate. The operator should type credentials and 2FA directly.

### 5. Dry-Run Publish

Run:

```bash
npm publish --dry-run --tag alpha
```

Confirm:

- Package name is `organchor`.
- Version is `0.1.0-alpha.2`.
- Tag is `alpha`, not `latest`.
- `RELEASE_INTEGRITY.md` has been reviewed for the target release.
- File list excludes private keys, provider tokens, wallets, payment data, Cloudflare handoff docs, self-pilot operational notes, and local secret files.

### 6. Tag Git And Draft GitHub Release

After the source repository is pushed:

```bash
git tag v0.1.0-alpha.2
git push origin v0.1.0-alpha.2
```

Draft a GitHub Release using `CHANGELOG.md` as the base release notes.

### 7. Publish To NPM

Only after the previous steps pass:

```bash
npm publish --tag alpha
```

After publishing, verify:

```bash
npm view organchor dist-tags version
npm install -g organchor@alpha
organchor --help
```

Do not intentionally promote the package as stable until after at least one external pilot has run through the documented adoption path.

Current caveat: npm's first published version is also visible under `latest`. Treat this as a registry tag hygiene issue, not a stability claim. Correct it later when npm write authentication allows dist-tag cleanup, or let the first stable release replace `latest` with a non-prerelease version.

## Trusted Publishing Later

NPM trusted publishing can publish from GitHub Actions or GitLab CI/CD using OIDC and can generate provenance attestations. This is a better long-term path, but it requires the public repository and CI workflow first.

For alpha releases before trusted publishing is configured, manual `alpha` publishing is acceptable if the npm account uses 2FA and the package is dry-run checked first.

## Human Approval Gates

Pause for explicit human approval before:

- Creating an npm account.
- Entering npm credentials or 2FA.
- Creating a public GitHub repository under a permanent owner.
- Running real `npm publish`.
- Moving any version to the `latest` dist-tag.

## References

- NPM publish command: https://docs.npmjs.com/cli/v11/commands/npm-publish/
- NPM two-factor authentication: https://docs.npmjs.com/about-two-factor-authentication/
- NPM trusted publishing: https://docs.npmjs.com/trusted-publishers/
