# OrgAnchor Public Quality Assurance Baseline

Status: Historical record.

- Date: 2026-07-18
- Package under review: `organchor@0.1.0-alpha.5`

## Purpose

This record preserves the first attempt to turn OrgAnchor's internal quality
claims into publicly repeatable evidence. It records both the failed first run
and the corrected successful run. It does not certify security or production
readiness.

## Baseline Added

- Windows and Linux GitHub quality checks on Node.js 24.
- 181 automated tests with minimum coverage gates of 80% lines, 85% functions,
  and 50% branches.
- Release, package-content, and clean-install smoke checks.
- npm dependency audit and pull-request dependency review.
- CodeQL analysis for JavaScript and TypeScript.
- Weekly Dependabot updates.
- GitHub secret scanning, push protection, and Dependabot security updates.
- Human-readable and machine-readable assurance status documents.

## Failed First Public Run

Baseline commit: `6e58d3d2c3c9584433d45d819746a71f189371a6`

- [Failed quality run](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29640146892)
- [Completed security run](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29640146911)

The first quality run exposed two defects that local Windows testing did not
reveal:

1. The documentation audit constructed local paths with Windows-only path
   separators, so Linux treated valid repository links as missing.
2. Windows checkout could convert archived JSON line endings to CRLF, changing
   the byte hash of retained Agent evaluation results.

The first run therefore failed. It was not rerun unchanged or presented as a
pass.

## Correction

Correction commit: `85a6e5d05f7432e3da5bec31ebb3623753e4b9ea`

- Replaced Windows-specific documentation path handling with platform-native
  path handling.
- Added `.gitattributes` to require LF for repository text while retaining CRLF
  only for Windows batch and command files.
- Rechecked the affected archived Wave 3 hash test locally before pushing.

## Successful Public Result

- [Successful quality run](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29642949524)
- [Completed security run](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29642949522)

The corrected public run established:

- Ubuntu quality gate: PASS, 181 of 181 tests.
- Windows quality gate: PASS, 181 of 181 tests.
- Coverage thresholds: PASS.
- Documentation and assurance-boundary audits: PASS.
- Release smoke: PASS.
- Package-content smoke: PASS.
- Clean package installation: PASS.
- npm high/critical vulnerability gate: PASS.
- CodeQL JavaScript/TypeScript analysis completed, but the initial workflow did
  not fail when uploaded analysis contained open alerts.

## Security Result Correction

Inspection of the uploaded CodeQL results found six open alerts: five high
severity and one medium severity. They covered incomplete Markdown escaping,
double XML entity decoding, an imprecise URL assertion, and Windows smoke-test
shell invocation. Treating workflow completion as a clean security result was
therefore incorrect.

The follow-up remediation:

- centralizes Markdown table-cell escaping and tests backslashes, pipes, and
  line breaks;
- prevents nested XML entities from being recursively decoded;
- replaces the imprecise URL substring assertion with exact comparison;
- removes the Windows shell invocation from the clean-install smoke test; and
- adds a workflow gate that rejects any open medium, high, or critical CodeQL
  alert after analysis.

This historical record intentionally retains both the original workflow result
and the later interpretation correction. A clean public security result must be
recorded only after the strengthened workflow runs and the repository reports no
open medium-or-higher CodeQL alerts.

## Strengthened Public Result

Remediation commit: `aa211ada3ba82de4ddb126c36a252f35f4829110`

- [Successful strengthened quality run](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29644175382)
- [Successful strengthened security run](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29644175383)
- [Successful pull-request dependency review](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29640167379/attempts/2)

The public rerun established:

- Ubuntu quality gate: PASS, 183 of 183 tests.
- Windows quality gate: PASS, 183 of 183 tests.
- Release, package-content, and clean-install smoke checks: PASS.
- npm high/critical dependency findings: 0.
- Open medium-or-higher CodeQL alerts after analysis: 0.
- Repository dependency graph and SBOM endpoint: available.
- Pull-request dependency review against an actual Dependabot change: PASS.

## Boundary

This is machine-generated evidence for the checked code and declared scenarios.
It does not replace an independent security or cryptographic implementation
review, and it does not demonstrate adoption by an unfamiliar organization or
real-world transaction-cost reduction.
