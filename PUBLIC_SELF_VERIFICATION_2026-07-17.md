# OrgAnchor Alpha.5 Public Release Verification

Status: PASS with disclosed evidence limitations.

Verification date: 2026-07-17.

## Release Linkage

```text
version: 0.1.0-alpha.5
source commit: 8ed000cc75f1b1220e2b11a0b40170e0746955b4
annotated tag object: 336d31d29664a033e91a81786442e09e8022932e
git tag: v0.1.0-alpha.5
GitHub Actions run: 29561056597 (PASS)
GitHub prerelease: https://github.com/OrgAnchor/OrgAnchor/releases/tag/v0.1.0-alpha.5
npm package: organchor@0.1.0-alpha.5
npm dist-tag: alpha -> 0.1.0-alpha.5
```

The GitHub tag workflow checked the exact release commit, installed dependencies in a clean Linux runner, passed the full release gate, previewed the package, and published through npm Trusted Publishing.

## Registry Integrity

```text
sha512 integrity: sha512-oJxjaI9YvozW3ebEToRl8GEdZZY60/B+QLEcosIZF980lA/9n339yTbSkoPLTrSBuTnU0WaHu1kgrHWzYR5V2w==
sha1 shasum: f495adb0521e4d7b2056beb9c1f04b1886fbe217
provenance predicate: https://slsa.dev/provenance/v1
provenance record: https://registry.npmjs.org/-/npm/v1/attestations/organchor@0.1.0-alpha.5
```

The npm `latest` tag remains on historical Alpha.1. Alpha users must install `organchor@alpha`; Alpha.5 is not presented as stable v1.

## Clean Install Check

A new temporary workspace installed the package directly from the public npm registry. The installed package reported `organchor@0.1.0-alpha.5`, exposed the CLI help and verification commands, and included the new `external_evidence_signatures` Agent result surface.

The installed CLI then ran:

```bash
organchor verify url https://organchor.org --brief
```

Result:

```text
overall_status: PASS
identity_status: PASS
conformance_status: FULL_COMPATIBLE
trust_decision: NOT_ASSIGNED_BY_ORGANCHOR
```

## Public Self-Pilot Boundary

The public OrgAnchor self-pilot was not regenerated merely because the software package version changed. Its signed organization history remains a separate continuity record.

The live package currently exposes first-party evidence, manual checks, and no declared external-evidence signature routes. Alpha.5 therefore reports those gaps instead of pretending that package integrity establishes evidence sufficiency or claim truth.

This verification establishes release linkage, registry publication, clean installation, public endpoint reachability, identity verification, and availability of the new Agent surface. It does not establish that:

- OrgAnchor is stable v1;
- OrgAnchor's own product claim is independently proven;
- a valid external signature proves real-world issuer identity or evidence truth;
- the retained Agent evaluations are universal model benchmarks;
- any organization, product, or supplier should be trusted or selected.
