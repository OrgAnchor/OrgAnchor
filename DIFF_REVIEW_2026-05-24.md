# OrgAnchor Diff Review - 2026-05-24

Status: implementation review snapshot.

This review checks the largest current source diffs before commit planning. It is not a stable release declaration and does not replace a final release review.

## Review Scope

Primary files reviewed:

```text
ARCHITECTURE.md
THREAT_MODEL.md
src/commands/beacon-inspect.ts
src/commands/directory-build.ts
src/commands/directory-fetch.ts
src/commands/beacon-query.ts
src/commands/beacon-sweep.ts
src/commands/beacon-index.ts
src/directory/snapshot.ts
tests/beacon-inspect.test.ts
tests/directory-snapshot.test.ts
```

Additional related checks:

```text
tests/agent-verify.test.ts
tests/page-generate.test.ts
tests/agent-discovery-demo.test.ts
```

## Verdict

The Beacon, Directory, and agent-discovery changes are suitable for the next alpha review path.

No release-blocking issue was found in the reviewed diff.

The implementation remains aligned with OrgAnchor's core goal:

```text
third-party agents can discover an organization,
verify identity continuity at the organization's own origin,
see value-evidence status and gaps,
and apply their own external policy without treating OrgAnchor or a Directory as the final trust authority.
```

## Alignment Checks

### Core Boundary

Pass.

The reviewed code and docs keep the main trust boundary intact:

```text
OrgAnchor verifies signed artifacts, hashes, continuity, and evidence structure.
OrgAnchor does not certify that an organization is good.
OrgAnchor does not rank suppliers as a final decision.
OrgAnchor Directory is discovery infrastructure, not a trust root.
```

### Beacon Anti-Impostor Behavior

Pass.

`beacon inspect` now distinguishes:

```text
no signal
OrgAnchor-like unsupported signal
valid Beacon shape
strict identity verification pass/fail
value layer pass/warn/not included
declared hash mismatch
full compatibility
partial compatibility
claimed signal only
```

The important anti-impostor behavior is covered: a Beacon can claim `PASS`, but if its declared root authority hash or statement hash does not match strict verification, the result becomes `FAILED`.

### Directory Boundary

Pass.

Directory snapshots require:

```text
directory_is_trust_root: false
final_trust_decision: EXTERNAL_AGENT
records_must_verify_at_origin: true
origin-owned /.well-known/organchor.json
origin-owned /verify/organchor.json
```

`directory fetch` returns candidates with match explanations, risk gaps, and direct origin verification commands. This is the right shape for AI-agent discovery without letting the Directory become a hidden certification platform.

### Beacon Sweep / Local Index

Pass for alpha.

The local discovery loop is now implemented:

```text
seeds / sitemap / bounded crawl / Directory snapshot
-> beacon sweep
-> beacon index
-> beacon query
-> direct origin verification
-> external policy
```

The crawler respects `robots.txt` in crawl mode and keeps the output as reusable NDJSON records. This supports the "adopters can shine without depending on one central Directory" direction.

## Non-Blocking Review Notes

### 1. Query Matching Is Still Basic

Current `beacon query` uses indexed organization/discovery terms, filters, and simple need matching. This is correct for an alpha implementation, but it is not semantic procurement matching.

Future improvement:

```text
add a scored query layer that combines explicit filters, synonym expansion, capability taxonomy, evidence quality, freshness, and agent-supplied policy
```

This should still remain discovery and triage, not final recommendation.

### 2. Directory From Beacon Index Accepts Partial Records

`directory build --beacon-index` exports records when both root authority hash and statement hash are present. It does not require every record to be `FULL_COMPATIBLE`.

This is acceptable because the exported record carries identity status, value status, conformance status, Beacon status, and direct verification requirements.

Future improvement:

```text
add optional flags such as --require-full-compatible or --min-conformance FULL_COMPATIBLE
```

This would let stricter Directory operators publish only fully compatible candidates.

### 3. Discovery Metrics Are Local, Not Global

`beacon report` measures local sweep quality. It does not prove global OrgAnchor adoption coverage.

This limitation is documented and should remain explicit.

## Checks Run

```text
node --test tests\beacon-inspect.test.ts tests\directory-snapshot.test.ts
PASS: 19 tests

node --test tests\agent-verify.test.ts tests\page-generate.test.ts tests\agent-discovery-demo.test.ts
PASS: 6 tests

git diff --check
PASS
```

Previous broader check also passed:

```text
node --run release:check
PASS: 86 tests
```

## Current Release Meaning

The source tree is not yet release-candidate clean because it still contains many unstaged changes and untracked files.

The current state is best described as:

```text
alpha implementation review passed for Beacon / Directory / agent-discovery changes
stable v1 release not yet declared
next alpha packaging still requires changeset staging, final release check, final secret scan, and release notes
```

## Recommended Next Step

Continue with the changeset plan:

```text
1. Stage and commit agent verification contract.
2. Stage and commit Beacon discovery loop.
3. Stage and commit Directory candidate lifecycle.
4. Stage and commit verify page / visible receipt updates.
5. Stage and commit adoption status.
6. Stage and commit architecture and status docs.
7. Stage and commit package hygiene.
```

Before any publish:

```text
node --run release:check
final secret filename scan
review npm package contents
confirm public self-pilot verification still passes
```
