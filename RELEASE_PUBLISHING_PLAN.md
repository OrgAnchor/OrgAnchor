# OrgAnchor Release Publishing Plan

Status: `0.1.0-alpha.5` owner gate approved on 2026-07-17; execute and verify the tag-triggered publication sequence once.

Last checked: 2026-07-17.

## Current State

```text
package name: organchor
local candidate: 0.1.0-alpha.5
current npm alpha: 0.1.0-alpha.4
current GitHub prerelease: v0.1.0-alpha.4
publish dist-tag: alpha
source repository: https://github.com/OrgAnchor/OrgAnchor
public self-pilot: https://organchor.org
```

The npm `latest` tag still points to the historical `0.1.0-alpha.1`. Public Alpha installation instructions must use `organchor@alpha`; no prerelease should be promoted as stable.

## Candidate Purpose

Alpha.5 packages the work learned from Fireseed Agent falsification after Alpha.4:

- ordinary brief-first URL verification for low-friction Agents;
- generic hash-bound verification of declared external evidence signatures;
- explicit separation of cryptographic provenance, evidence sufficiency, claim truth, and external policy;
- runnable weak-evidence, stale-evidence, and conflicting-current-evidence scenarios;
- deterministic scorers, unsafe hard failures, preserved raw results, and regression tests;
- fixture arithmetic and overclaim corrections found by those evaluations.

This is a protocol and Agent-interface Alpha. It is not stable v1, a trust badge, a certification decision, or a supplier ranking.

## Local Gate

Before requesting publication approval, all of these must pass against the exact candidate commit:

```bash
npm run release:check
npm pack --dry-run
npm publish --dry-run --tag alpha
```

Also confirm:

```text
package.json and package-lock.json both say 0.1.0-alpha.5;
CHANGELOG.md describes the candidate without implying stable maturity;
the npm file list contains no private key, token, wallet, payment data, production media, or local operator notes;
the public self-pilot remains reachable and verifies, or any unrelated carrier gap is recorded explicitly;
main is clean and pushed;
no v0.1.0-alpha.5 tag or npm version already exists.
```

## Human-Owner Gate

Approval to publish `v0.1.0-alpha.5` was recorded on 2026-07-17. A future version still requires a new explicit approval.

That tag push is not reversible as an ordinary edit: the GitHub Actions Trusted Publishing workflow runs the release checks and publishes `organchor@0.1.0-alpha.5` to npm under `alpha`. Npm versions are immutable.

Do not run local `npm publish` and do not trigger the manual workflow after a successful tag-triggered publication.

## Publication Sequence

After owner approval:

1. Freeze and record the candidate commit.
2. Push the signed or annotated `v0.1.0-alpha.5` tag once.
3. Watch `.github/workflows/publish-npm.yml` through completion.
4. Verify `npm view organchor@alpha version` returns `0.1.0-alpha.5`.
5. Install `organchor@alpha` in a clean temporary workspace and run `organchor --help` plus one URL verification.
6. Create the GitHub prerelease from the Alpha.5 changelog section and link the exact tag and npm package.
7. Recheck `https://organchor.org`, `/verify/`, `/.well-known/organchor.json`, and installed-CLI verification.
8. Record whether the website package was regenerated. A package-version release alone does not silently rewrite the organization's signed identity history.

## Hold Conditions

Do not publish if:

- any release, package, install, secret, or public-self-pilot check fails;
- package, tag, changelog, and release notes do not name the same version;
- public material describes signature validity as claim truth or real-world issuer identity;
- the release implies external Agent results are universal benchmarks;
- the tag already exists or npm already contains the candidate version;
- GitHub Trusted Publishing configuration is unavailable or points at a different repository/workflow.

## Recovery Rule

If the tag workflow fails before npm publication, diagnose and fix the workflow, then use the documented recovery path only after checking npm state. If npm publication succeeded but a later GitHub Release or website check failed, never republish the same npm version; record the partial state and repair the remaining carrier separately.

## References

- `RELEASE_INTEGRITY.md`
- `PUBLIC_RELEASE_CHECKLIST.md`
- `NPM_TRUSTED_PUBLISHING.md`
- `.github/workflows/publish-npm.yml`
