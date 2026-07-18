# Documentation And Workspace Consolidation - 2026-07-18

Status: Historical record. This report records the consolidation completed on
2026-07-18; current project truth remains in `docs/project/` and `DOCS_INDEX.md`.

## Why This Was Needed

OrgAnchor development had accumulated isolated Agent-evaluation workspaces,
publication-production files, a real self-pilot workspace, and 107 Markdown
files at the repository root. Their names did not reliably distinguish current
protocol truth, historical evidence, private operational state, or disposable
working material.

The consolidation used four boundaries:

1. public source and current documentation stay in the repository;
2. private keys and provider state stay in a private workspace;
3. reproducibility records and retired work stay in an archive;
4. current, historical, and design-only claims must be visibly different.

## Workspace Result

Only `E:\CivX\OrgAnchor` remains as an OrgAnchor-prefixed project directory at
the `E:\CivX` root.

| Previous material | New location | Reason |
| --- | --- | --- |
| 12 isolated Agent-evaluation workspaces | `E:\CivX\_archive\OrgAnchor\external-agent-evaluations-2026-07` | Preserve raw runs and failed calibration diagnostics without presenting them as product source. |
| 2 publication-production workspaces | `E:\CivX\_archive\OrgAnchor\publication-materials-2026-07` | Keep scripts, drafts, and rendered assets outside the public source repository. |
| Real OrgAnchor self-pilot | `E:\CivX\_private\OrgAnchor\self-pilot` | Contains operational state, heavy local tools, and four private-key files. It must not be public or casually deleted. |
| Cloudflare and self-pilot operation notes | `E:\CivX\_private\OrgAnchor\operations-notes` | Operational context may expose account or deployment details. |
| Early domain-selection report | `E:\CivX\_archive\OrgAnchor\domain-selection-2026-05` | Retain the decision record without treating it as current guidance. |

The moved self-pilot scripts now derive their workspace from their own file
location instead of depending on the retired `E:\CivX\OrgAnchor-self-pilot`
path.

## Documentation Result

Repository-root Markdown was reduced from 107 files to four intentional entry
documents:

- `README.md`
- `DOCS_INDEX.md`
- `CONTRIBUTING.md`
- `CHANGELOG.md`

The remaining documents are separated by role:

| Area | Role |
| --- | --- |
| `docs/project/` | current goal, architecture, implementation state, roadmap, and governance |
| `docs/protocol/` | machine contracts, evidence models, discovery, and protocol evolution |
| `docs/guides/` | adopter and operator guidance |
| `docs/operations/` | current release, pilot, and acceptance gates |
| `docs/evaluations/` | capability traceability and adversarial Agent evaluations |
| `docs/outreach/` | bounded public explanation and review entry points |
| `docs/history/` | dated, retired, or superseded records that do not override current truth |

The retired Fireseed transaction-cost comparison was moved from active
evaluations into history and is excluded from npm packaging.

## Permanent Consistency Gates

`npm run docs:audit` now checks:

- only the four approved Markdown files exist at repository root;
- all required documentation areas exist;
- active documents declare a status;
- historical documents declare historical status;
- local Markdown links resolve;
- active documents do not refer to the retired self-pilot path.

The capability audit and its tests were updated to understand the categorized
documentation map and npm's directory include/exclude rules. Historical source
records remain auditable in Git but are intentionally omitted from the npm
package.

## Final Verification

The final `npm run release:check` completed successfully:

- automated tests: 181 passed, 0 failed;
- documentation audit: passed, 126 local links checked;
- release smoke: passed;
- package smoke: passed;
- simulated npm package: 242 files, 2,120,427 bytes;
- isolated install smoke: passed.

This report does not claim that all OrgAnchor product goals are complete. It
records that the workspace and documentation structure were consolidated and
that the current release gates still passed afterward.
