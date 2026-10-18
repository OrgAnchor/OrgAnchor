# OrgAnchor Release Publishing Plan

Status: Alpha.6 tool publication and public registry-install acceptance completed
on 2026-10-18. Real root-authority migration remains an owner-confirmation gate.

See the [completed release verification](../history/PUBLIC_SELF_VERIFICATION_2026-10-18.md)
or its [Chinese companion](../history/PUBLIC_SELF_VERIFICATION_2026-10-18.zh-CN.md).

## Release Scope

```text
published tool: organchor@0.1.0-alpha.6
tag: v0.1.0-alpha.6
publish dist-tag: alpha
repository: https://github.com/OrgAnchor/OrgAnchor
previous published alpha: 0.1.0-alpha.5
```

Alpha.6 adds opt-in ML-DSA-65/hybrid signing, authenticated authority migration,
sealed public-package checkpoints, explicit time/policy boundaries and public
output safety checks. It also packages the adoption/documentation improvements
since Alpha.5. It is not stable v1 or an independent security certification.

This is a **tool release**, not a real identity migration. Do not generate or
replace real root keys, re-sign the live self-pilot, activate a migration or
submit new identity/time-anchor records under this approval. Stop for explicit
owner approval before any real root-authority migration.

Existing v1 bytes, schemas, hashes and signing input stay unchanged. Upgrade
verification tools before adopting v2. Native ML-DSA requires Node 24.6+;
classical-only behavior remains available on the existing Node 24 baseline.

## Pre-Release Gates

Against the exact release candidate:

```bash
npm run release:check
npm pack --dry-run
npm publish --dry-run --tag alpha
npm audit --audit-level=high
```

Also verify:

- Package and lockfile versions agree with the tag and changelog.
- No private key, credential, wallet, local operation note or production media
  enters Git or the npm file list.
- Original v1 schemas and fixture hashes remain unchanged.
- A clean installed package preserves v1 verification and exercises new opt-in
  signing, authenticated migration and sealed-checkpoint verification.
- Current public homepage, verify index and Beacon remain reachable; their
  authority and signed statement must not change merely because tools upgrade.
- Windows/Linux quality CI and the security baseline pass on the candidate.
- No matching npm version or remote tag already exists.

Publish v2 schemas with the package and versioned GitHub source/release assets.
Canonical schema identifiers are not trusted network dependencies: offline
validators must register the versioned schema files explicitly. A schema URL
returning the site's HTML fallback is not schema availability.

## Publication Sequence

1. Finish review and local gates; commit the complete candidate without secrets.
2. Push the candidate source and wait for cross-platform quality/security CI.
3. Reconfirm npm state, then push the annotated matching tag once.
4. Watch `publish-npm.yml`; it checks the version, repeats release gates and
   publishes using npm Trusted Publishing/OIDC without a local publish token.
5. Check npm `alpha` resolves to Alpha.6 and its provenance names the intended
   GitHub repository, workflow and release commit.
6. Install the exact registry version into a new temporary workspace; check CLI
   behavior, included v2 schemas, old public identity verification and a local
   opt-in PQ/hybrid exercise with disposable keys only.
7. Create the GitHub prerelease with the Alpha.6 changelog, exact tag, npm link
   and versioned schema assets. Do not mark a prerelease as stable.
8. Recheck public identity hashes and record the completed release linkage.

The npm `latest` tag remains the historical Alpha.1; use `organchor@alpha` for
the current Alpha. Never run a second local publish or workflow dispatch after
the tag-triggered publication has succeeded: npm versions are immutable.

## Hold And Recovery

Hold if any release gate fails, CI reports a security finding, package contents
leak private state, versions disagree, the candidate already exists, or OIDC
does not match the expected publisher. Fix and rerun before publishing.

If a workflow fails, inspect npm first. If nothing was published, repair the
failure and use a controlled workflow rerun only after confirming the immutable
version is absent. If npm succeeded but a later carrier check failed, do not
republish: repair that carrier and disclose the partial state.

Independent cryptographic review, actual adopter migration and independently
checked live time anchoring remain separate milestones. Local tests with
synthetic Bitcoin headers do not establish those outcomes.

## Prior Release Record

Alpha.5 completed on 2026-07-17. Preserve its immutable tag/package and
[publication verification](../history/PUBLIC_SELF_VERIFICATION_2026-07-17.md).

## References

- [Release integrity](./RELEASE_INTEGRITY.md)
- [Npm Trusted Publishing](./NPM_TRUSTED_PUBLISHING.md)
- [Post-quantum migration](../guides/POST_QUANTUM_MIGRATION_GUIDE.md)
