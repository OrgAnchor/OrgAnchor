# OrgAnchor Changeset Plan - 2026-05-24

Status: Historical record. Original status at publication: draft commit and review plan.

This plan groups the current dirty working tree into reviewable changesets. It should be used before staging, committing, tagging, or publishing the next alpha.

Current source state:

```text
branch: main
working tree: dirty
baseline tag: v0.1.0-alpha.1
current local state: post-alpha discovery, adoption-status, release-state, and agent-compatibility work
last full check: node --run release:check PASS, 86 tests
```

## Review Principle

Do not commit the whole tree as one opaque blob.

Each changeset should answer:

```text
What user or agent problem does this solve?
What files are part of the behavior?
What tests prove it?
What trust boundary must remain true?
```

## Proposed Changesets

### 1. Agent Verification Contract And Compatibility

Purpose:

Make third-party AI agents able to consume OrgAnchor results with lower ambiguity.

Files:

```text
AGENT_COMPATIBILITY_PLAN.md
AGENT_INTEGRATION_GUIDE.md
AGENT_VERIFICATION_CONTRACT.md
examples/agent-verification/organchor-compact-result.json
examples/agent-verification/organchor-beacon-query-result.json
src/commands/verify-url.ts
tests/agent-integration-docs.test.ts
tests/agent-verify.test.ts
```

Main behavior:

- Compact agent verification output.
- `conformance_status`.
- `policy_route`.
- Clear trust boundary: OrgAnchor verifies artifacts, not final trust.

Recommended commit message:

```text
Add agent verification contract and policy routing
```

Focused checks:

```bash
node --test tests/agent-integration-docs.test.ts tests/agent-verify.test.ts
```

Review risk:

- Ensure `PASS` is not described as an endorsement.

### 2. Beacon Discovery Surface And Local Discovery Loop

Purpose:

Make every adopter naturally discoverable from its own origin, without requiring official Directory inclusion.

Files:

```text
ORGANCHOR_BEACON.md
src/beacon/surfaces.ts
src/commands/beacon-generate.ts
src/commands/beacon-inspect.ts
src/commands/beacon-sweep.ts
src/commands/beacon-index.ts
src/commands/beacon-query.ts
src/commands/beacon-report.ts
src/commands/beacon-verify.ts
src/schema/organchor-beacon.schema.json
scripts/agent-discovery-demo.mjs
examples/agent-discovery-loop/README.md
examples/agent-discovery-loop/seeds.example.txt
tests/beacon-inspect.test.ts
tests/agent-discovery-demo.test.ts
```

Main behavior:

- Dedicated `OrgAnchorBeacon` generation.
- Beacon inspection with `CLAIMED_SIGNAL`, `PARTIAL`, and `FULL_COMPATIBLE` states.
- Seed, sitemap, Directory, and bounded-crawl sweeps.
- Local index and need-match query.
- Discovery quality report.
- Full local agent discovery demo.

Recommended commit message:

```text
Add Beacon discovery and local agent discovery loop
```

Focused checks:

```bash
node --test tests/beacon-inspect.test.ts tests/agent-discovery-demo.test.ts
npm run agent:demo
```

Review risk:

- Bounded crawl must remain polite and limited.
- Beacon discovery must not become a centralized ranking claim.

### 3. Directory Candidate Lifecycle And Anti-Capture Exports

Purpose:

Make Directory snapshots useful as open discovery aids while keeping direct origin verification as the trust path.

Files:

```text
DIRECTORY_MODEL.md
DIRECTORY_SNAPSHOT_SPEC.md
DISCOVERY_TAXONOMY.md
src/commands/directory-add.ts
src/commands/directory-build.ts
src/commands/directory-fetch.ts
src/commands/directory-inspect.ts
src/commands/directory-compare.ts
src/commands/directory-export.ts
tests/directory-snapshot.test.ts
```

Main behavior:

- Static Directory candidate source maintenance.
- Directory build from origins or Beacon index.
- Machine-readable `directory-policy.json`.
- Candidate explanations, matched filters, risk gaps, and verification plans.
- Snapshot compare and NDJSON export.

Recommended commit message:

```text
Expand Directory snapshots into open discovery feeds
```

Focused checks:

```bash
node --test tests/directory-snapshot.test.ts
```

Review risk:

- Directory must not become a trust root.
- Paid or curated inclusion must stay separate from verification status.

### 4. Verify Page Discovery Metadata And Visible Receipts

Purpose:

Expose more visible and machine-readable proof surfaces from `/verify`.

Files:

```text
src/commands/page-generate.ts
src/page/template.ts
tests/page-generate.test.ts
README.md
```

Main behavior:

- Automatic discovery links and JSON-LD metadata.
- Carrier receipt summaries.
- Directory discovery pointers.
- More visible proof information for humans and agents.

Recommended commit message:

```text
Expose discovery metadata and receipts on verify pages
```

Focused checks:

```bash
node --test tests/page-generate.test.ts
```

Review risk:

- Public receipt summaries must not include secrets or imply that carriers are identity roots.

### 5. Adoption Status And External Pilot Readiness

Purpose:

Give adopters a visible workspace health report instead of making invisible CLI work feel untrustworthy.

Files:

```text
src/commands/adoption-status.ts
tests/adoption-status.test.ts
ADOPTION_GUIDE.md
EXTERNAL_PILOT_RUNBOOK.md
README.md
scripts/package-smoke.mjs
```

Main behavior:

- `organchor adoption status`.
- Public `ADOPTION_STATUS.md`.
- Machine-readable adoption status JSON.
- Package smoke coverage for the installed command.

Recommended commit message:

```text
Add adoption status reports for pilot workspaces
```

Focused checks:

```bash
node --test tests/adoption-status.test.ts
node --run package:smoke
```

Review risk:

- Adoption status must remain a transparency report, not a trust badge.

### 6. Alignment, Architecture, Threat Model, And Current Status

Purpose:

Keep the project from drifting after the discovery expansion.

Files:

```text
ARCHITECTURE.md
THREAT_MODEL.md
ROADMAP.md
IMPLEMENTATION_STATUS.md
ACCEPTANCE_REVIEW_2026-05-24.md
RELEASE_STATE_2026-05-24.md
DIFF_REVIEW_2026-05-24.md
DOCS_INDEX.md
CHANGELOG.md
```

Main behavior:

- Current implementation inventory.
- Alpha acceptance review.
- Release-state fact table.
- Reduced or refocused architecture and threat model language.
- Stage 6 discovery recorded as post-v1 alpha support.

Recommended commit message:

```text
Record implementation status and release-state review
```

Focused checks:

```bash
node --test tests/docs-index.test.ts
node --run release:check
```

If `tests/docs-index.test.ts` is not a standalone test file in the local tree, run the full release check.

Review risk:

- Do not let milestone review files be confused with long-term operator guidance.

### 7. Package Metadata And Release Hygiene

Purpose:

Keep package contents and smoke tests aligned with the new public files and commands.

Files:

```text
package.json
scripts/package-smoke.mjs
CHANGELOG.md
DOCS_INDEX.md
```

Main behavior:

- Package includes new public-facing docs and demo script.
- Package smoke checks new command availability and adoption status flow.

Recommended commit message:

```text
Update package smoke coverage for discovery alpha
```

Focused checks:

```bash
node --run package:smoke
node --run install:smoke
```

Review risk:

- Package must exclude self-pilot private files, credentials, wallets, local provider notes, and private keys.

## Suggested Commit Order

Recommended order:

1. Agent verification contract and compatibility.
2. Beacon discovery surface and local discovery loop.
3. Directory candidate lifecycle and anti-capture exports.
4. Verify page discovery metadata and visible receipts.
5. Adoption status and external pilot readiness.
6. Alignment, architecture, threat model, and current status.
7. Package metadata and release hygiene.

Reason:

- Agent verification is the base contract.
- Beacon uses that contract for origin-owned discovery.
- Directory builds on Beacon results.
- Verify page changes expose the surfaces publicly.
- Adoption status makes operator progress visible.
- Status/review docs should reflect all behavior after the code is grouped.
- Package hygiene comes last so it can include all public files.

## Full Verification Before Any Push

Run:

```bash
node --run release:check
git diff --check
```

Run a secret scan and manually inspect matches:

```bash
rg -n "private\\.json|BEGIN PRIVATE|api[_-]?key|secret|token|jwt|wallet|cloudflare|pinata|recovery code|password" . -g "!node_modules/**" -g "!dist/**" -g "!.git/**"
rg --files -g "*.local.*" -g "*secret*" -g "*wallet*" -g "*credentials*" -g "keys/*.private.json" -g "!node_modules/**" -g "!dist/**" -g "!.git/**"
```

Current scan observation on 2026-05-24:

- The content scan returns expected documentation and test references.
- The filename scan returns no actual local secret, wallet, credential, or private-key files in the source repository.

## Do Not Commit

Do not commit:

```text
E:\CivX\OrgAnchor-self-pilot\
E:\CivX\OrgAnchor-self-pilot-rehearsal\
Cloudflare credentials
Pinata tokens
Arweave wallets
root private keys
payment records
local deployment scripts containing secrets
```

The self-pilot workspace is evidence for operations, not source-package content.

## Next Decision

After reviewing this plan, choose one:

```text
A. Stage and commit these changesets locally.
B. First inspect the largest diffs: ARCHITECTURE.md, THREAT_MODEL.md, beacon-inspect, directory-build, directory-snapshot tests.
C. Defer commits and continue alpha hardening.
```

Recommended path:

```text
B first, then A.
```

The code passes, but the largest diffs should still be read before they become project history.
