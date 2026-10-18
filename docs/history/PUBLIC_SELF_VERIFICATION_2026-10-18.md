# OrgAnchor Alpha.6 Public Release Verification

Status: Historical record. Alpha.6 tool publication and registry-install
acceptance completed on 2026-10-18; real authority migration was not performed.

[Chinese companion](./PUBLIC_SELF_VERIFICATION_2026-10-18.zh-CN.md).

## Release Linkage

```text
version: 0.1.0-alpha.6
source commit: cd4995b10a7f68ad9ea1f7bd06214d13c46b617f
annotated tag object: d57f133834c0fc7207c30ba9739f6d7f59633530
tag: v0.1.0-alpha.6
npm publication time: 2026-10-18T16:46:25.085Z
npm alpha: 0.1.0-alpha.6
npm latest: 0.1.0-alpha.1 (unchanged historical prerelease)
```

- [Cross-platform quality and install gate](https://github.com/OrgAnchor/OrgAnchor/actions/runs/39145385949): PASS.
- [Security baseline](https://github.com/OrgAnchor/OrgAnchor/actions/runs/39145386094): PASS.
- [Tag-triggered npm Trusted Publishing](https://github.com/OrgAnchor/OrgAnchor/actions/runs/39145911601): PASS.
- [GitHub prerelease and schema assets](https://github.com/OrgAnchor/OrgAnchor/releases/tag/v0.1.0-alpha.6).
- [Exact npm version](https://www.npmjs.com/package/organchor/v/0.1.0-alpha.6).

The final candidate passed 309 tests on Windows and Linux and the full local
release gate. Local/Windows coverage was 88.36% lines, 94.12% functions and
61.61% branches; Linux measured 88.25%, 94.12% and 61.52% respectively. All
exceed the unchanged 80%/85%/50% gates. Dependency audit and CodeQL passed with
no open medium-or-higher CodeQL alert.

## Registry Integrity And Provenance

```text
integrity: sha512-OiYrB4+So37gED6Mpct6ZKBlSUnaHJS3oil8x62+drb4kq3MTgDC8/DFgHRqpAOU77RAZxE6utFHeZCQgquXYg==
shasum: 194ab33ee1cc016129a28d789dd3018091eb1f49
tarball bytes: 708220
Rekor index: 3313924139
```

A fresh public tarball download matched the registry's SHA-512 integrity.
`npm audit signatures` on a clean exact-version installation verified one
registry signature and one attestation. The
[provenance bundle](https://registry.npmjs.org/-/npm/v1/attestations/organchor@0.1.0-alpha.6)
names the exact release commit, tag, `OrgAnchor/OrgAnchor` repository,
`publish-npm.yml` workflow and publication run above; its SHA-512 subject digest
matches the artifact.

## Actual Installed-Package Acceptance

A new temporary workspace installed `organchor@0.1.0-alpha.6` from the public
registry, with install scripts disabled. Using only that installed CLI:

- Help and pinned live-site identity verification passed.
- Existing v1 records remained byte-for-byte unchanged and verifiable.
- Disposable Ed25519 and ML-DSA keys created a hybrid authority; old
  authorization and complete new-authority acceptance verified.
- Missing new acceptance and a stripped PQ signature were rejected.
- Public-package generation, checkpoint creation, both holder signatures,
  sealing and checkpoint verification passed.
- Local checkpoint time remained `NOT_CHECKED`, not a claim of external time.

The five schema assets (v1 authority/signature and the three v2 schemas) were
checked against both the exact Git source and the installed npm package. Public
GitHub downloads parsed as JSON, matched those files byte-for-byte and matched
the release asset SHA-256 digests. Canonical schema IDs are not online trust
dependencies; the existing website can return an HTML fallback at those IDs.

## Unchanged Live Identity

Before/after raw SHA-256 comparisons matched for all seven public surfaces:
homepage, human verify page, Beacon, verify index, root authority, official
statement and its detached signature. They all returned HTTP 200.

```text
canonical live authority: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
raw authority SHA-256: ecfe6159c909ffc76e4c89ee95ca60157cff186a4ef3fd1df168d8f58a1c08c4
raw statement SHA-256: 764df104432b8fe855c2f36bcbac00a545f4c0e0cecf8736629a19661c3add32
raw signature SHA-256: 0a466cfb6516b45c74bc52d5dcce4dee34b0d2307af5c741c3f03655d342c2bc
live identity_status: PASS
live crypto profile: CLASSICAL_ONLY
```

Tool publication did not regenerate the self-pilot, change a real key or
activate any migration. No new live Bitcoin timestamp or Arweave upload was
submitted. Disposable test keys are not organization root keys.

## Observed Publication Delay

The publisher returned success at 16:42:16Z, while registry publication time was
16:46:25.085Z, about four minutes later. Earlier 404 responses also remained
cached briefly on the ordinary tarball path. No duplicate publish was attempted.
Acceptance was held until the ordinary npm install path and artifact checks
worked, not inferred from the workflow's success alone.

## Remaining Boundary

This is still an Alpha, not stable v1, independent cryptographic certification,
absolute quantum-proof security or proof of real-world claims. Independent
security review remains pending. Real root-authority migration is the next
separate owner-confirmation gate; other adopters must not be silently migrated.
