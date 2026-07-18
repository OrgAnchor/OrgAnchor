# Project Semantic Consistency Audit - 2026-07-18

Status: Historical record.

## Purpose

This audit checked whether OrgAnchor's current project, protocol, operator,
evaluation, outreach, and package-facing documents describe the same project
state as the implementation and executable capability evidence.

It followed the current source-of-truth order:

1. `docs/project/PROJECT_NORTH_STAR.md`
2. `docs/project/IMPLEMENTATION_STATUS.md`
3. `docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md`
4. executable tests and smoke checks
5. roadmap, acceptance, guides, and public explanation

Historical records were checked for archival labeling and link integrity, but
were not treated as current instructions.

## Authoritative Baseline

At the audit date:

```text
lifecycle: FIRESEED_ALPHA
published package: organchor@0.1.0-alpha.5
stable v1: NOT_RELEASED
Stages 1-5 functional scope: implemented for alpha with disclosed external gaps
S1-S3 evidence baseline: implemented and tested
S4 evidence layer: partial
S5 evidence layer: design only
delegated product/service credentials: design only
package health commands/network: design only
commercial-fit protocol: design only
broad external organization pilot: not completed
broad internet discovery coverage: not implemented
```

## Material Findings

The project architecture remained aligned with the North Star, but several
active documents had time and status drift:

- implemented Beacon and Directory tools were still described as a post-v1
  future stage;
- an alpha.3 launch checklist remained under active operations;
- npm publishing guidance contained alpha.4-specific normal-path commands;
- the v1 release checklist still named alpha.3 as the current release;
- an evidence guide still described alpha.1 as current;
- the S4 subject-binding note said S4 was entirely unimplemented;
- the first adversarial evaluation still said independent fresh-context results
  had not been collected;
- some Beacon wording could be read as a guarantee of global discovery;
- README tests forced historical and specialist links back into a flat first
  page instead of validating the two-level documentation map.

## Corrections

- Added an explicit current-state summary to `IMPLEMENTATION_STATUS.md`.
- Aligned the North Star, architecture, design rationale, roadmap, v1
  acceptance, README, and public explainer with the same alpha boundary.
- Reframed Stage 6 as a parallel alpha track: bounded tools are implemented,
  while broad coverage and independent adoption remain open.
- Clarified that Beacon exposes a standard recognizable signal after an origin
  enters a crawler's discovery frontier; it does not guarantee global discovery.
- Distinguished current alpha artifacts from accepted future protocol artifacts.
- Marked S1-S3 as implemented, S4 as partial, and S5 as design-only wherever
  those evidence-layer labels could be confused with roadmap stage numbers.
- Archived the completed alpha.3 MVP checklist under `docs/history/`.
- Updated current release gates and made npm trusted-publishing instructions
  version-independent.
- Updated the Wave 1 evaluation document to reference preserved fresh-context
  results without treating them as universal compatibility evidence.
- Simplified README into a current public entry point and made
  `DOCS_INDEX.md` plus category indexes responsible for complete navigation.

## Permanent Guardrail

`npm run docs:audit` now checks:

- only four Markdown entry documents remain at repository root;
- active areas and historical status labels are present;
- local documentation links resolve;
- retired local self-pilot paths do not return to active documents;
- README, implementation status, and release checklist agree with the package
  version;
- stable-v1, external-pilot, and broad-discovery boundaries remain explicit;
- architecture and Beacon documents retain the non-global discovery boundary;
- design-only commercial-fit language remains visible;
- retired roadmap wording and stale external-evaluation wording do not return;
- the version-specific MVP checklist remains archived.

This guardrail checks declared consistency. It does not replace cryptographic,
behavioral, usability, security, or external validation.

## Verification

The final local gate completed successfully:

```text
targeted semantic and documentation tests: 43 passed, 0 failed
full automated tests: 181 passed, 0 failed
documentation audit: PASS
release smoke: PASS
package smoke: PASS
simulated npm package: 241 files, 2,123,640 bytes
clean install smoke: PASS
```

## Remaining Open Work

This audit does not close the following real gaps:

- complete the first low-risk external organization pilot;
- test adoption friction and evidence interpretation outside the project team;
- measure real-world Beacon and Directory discovery coverage;
- mature S4 and design/implement S5;
- decide whether and when delegated credentials, package-health networking, and
  commercial-fit manifests earn implementation priority;
- make a separate evidence-based decision before claiming stable v1.

The audit conclusion is therefore narrow: the active documents, package state,
and implemented alpha capability map are materially aligned. It is not a claim
that OrgAnchor is finished or universally validated.
