# Fireseed Alpha.4 Local Release Convergence - 2026-07-11

Status: READY FOR HUMAN-OWNER REVIEW. EXTERNAL PUBLICATION NOT AUTHORIZED OR PERFORMED.

## Purpose

This record closes the local `0.1.0-alpha.4` candidate before any npm publication, GitHub push or tag, GitHub release, public self-pilot deployment, social post, video upload, or sponsorship action.

The convergence goal is narrower than stable-v1 readiness:

```text
make the source, installable candidate, Agent contract, evidence-gap semantics,
release documentation, and package boundary describe one coherent Alpha state.
```

## Changes Included

### Agent Status Semantics

- Compact and full Agent results now expose `status_scope`.
- `value_status: PASS` is explicitly scoped to report integrity and declared-relation checks.
- Evidence sufficiency remains an external policy decision.
- OrgAnchor status does not prove claim truth.
- Legacy reports without current claim-level support fields are interpreted conservatively.
- Manual checks, first-party-only support, and missing claim-level details become visible risk gaps and next actions rather than apparent zero-risk results.
- Empty S2, S3, and S4 summaries provide purpose-conditional next actions and remain explicitly outside OrgAnchor trust decisions.

### Package Boundary

- Local package version is `0.1.0-alpha.4`.
- Video, audio, thumbnail, and outreach-media assets remain in the source repository but are excluded from the CLI package.
- Package smoke now rejects `public-assets/` and enforces a 4 MiB unpacked package budget.
- The complete Apache-2.0 license appendix is present.

### Public And Release Documentation

- OrgAnchor Fireseed review no longer depends on a CivitasX parent-channel launch.
- CivitasX may cross-share OrgAnchor, but is not a protocol authority, identity root, prerequisite account, or launch dependency.
- Stage 5 is described as v1 functional-scope completion; stable-v1 publication remains a separate maturity decision.
- The active order is release alignment -> GitHub feedback record -> Bluesky discussion -> LinkedIn professional outreach -> later video/deck after separate quality gates.
- Pushing a `v*` Git tag is recorded as a human approval gate because it triggers the npm publishing workflow.

## Local Verification Results

```text
npm run release:check
  tests: 157 passed, 0 failed
  release smoke: PASS
  package smoke: PASS
  install smoke: PASS

npm run capability:audit
  capabilities: 27
  warnings: 0

npm run capability:scenarios
  local scenarios: 5 passed
  network scenario: 1 skipped by default

npm publish --dry-run --tag alpha
  PASS
  package: organchor@0.1.0-alpha.4
  compressed size: 473,058 bytes
  unpacked size: 1,813,345 bytes
  files: 219
  public-assets included: no
```

The skipped scenario is the separately checked public-network self-pilot scenario, not a failed local capability.

## Public Legacy-Package Compatibility Check

The local Alpha.4 CLI verified the current public package at `https://organchor.org` without changing it.

Observed result:

```text
overall_status: PASS
identity_status: PASS
value_status: PASS
conformance_status: FULL_COMPATIBLE
value_status scope: REPORT_INTEGRITY_AND_DECLARED_RELATION_CHECKS
evidence sufficiency: EXTERNAL_POLICY_DECISION
claim truth: NOT_PROVEN_BY_ORGANCHOR_STATUS
manual checks: 34
risk gaps: 3
```

Visible conservative gaps:

```text
Evidence includes 34 manual check(s).
Only first-party evidence is linked.
Claim-level support details are unavailable in this report.
```

This proves the intended compatibility behavior: the older signed package remains verifiable, while the newer verifier exposes information that the older value report could not express. It does not retroactively invalidate the old package or silently treat absent fields as zero risk.

## External State Intentionally Unchanged

At the end of this local convergence batch:

```text
npm alpha dist-tag: still 0.1.0-alpha.3
GitHub main: not updated by this batch
v0.1.0-alpha.4 tag: does not exist
GitHub Alpha.4 release: does not exist
public https://organchor.org package: not redeployed
Bluesky / LinkedIn / X posts: not published
video: not uploaded
sponsorship: not activated
```

## Owner-Gated Publication Sequence

After human-owner approval:

1. Review and commit the local candidate.
2. Push `main` to GitHub.
3. Preserve the current public `/verify` package as a historical snapshot before replacement.
4. Push `v0.1.0-alpha.4` only when npm publication is intended; the tag triggers the trusted-publishing workflow.
5. Verify the public npm package from a clean install.
6. Create the GitHub Alpha.4 prerelease from the same tag and changelog.
7. Regenerate and sign the OrgAnchor self-pilot value report, lockfile, and `/verify` package with the aligned toolchain.
8. Deploy the new public self-pilot and verify it with the published Alpha.4 package.
9. Record the new public hashes, compatibility result, and accepted gaps.
10. Only then begin the Bluesky-led Fireseed feedback wave.

No step in this sequence is authorized merely by this local readiness record.
