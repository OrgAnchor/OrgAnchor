# Fireseed Transaction-Cost Benchmark

Status: Initial executable benchmark protocol for Fireseed external validation.

## Purpose

OrgAnchor's North Star is to lower the practical cost of finding, verifying, and understanding organizations without making OrgAnchor the final trust authority.

This benchmark turns that goal into a falsifiable comparison. The same organization and the same fact questions are tested under two conditions:

```text
WEBSITE_ONLY
The reviewer or Agent may read only the ordinary homepage response.

ORGANCHOR_ENABLED
The reviewer or Agent starts from the same origin and may use the well-known Beacon,
the machine-readable verify index, and OrgAnchor verification tools.
```

The benchmark does not assume that OrgAnchor wins. It records whether the OrgAnchor-enabled condition improves exact fact coverage, avoids unsupported assertions, preserves the external trust boundary, and changes measurable review cost.

## What Is Measured

Each run records:

- exact facts recovered;
- facts left unknown;
- incorrect assertions;
- whether `PASS` was confused with a final trust decision;
- elapsed time;
- HTTP request count and bytes read when observable;
- command count and output bytes when observable;
- prompt and completion tokens when the Agent provider exposes them.

Unknown is not treated as an error. A reviewer should return `null` when a fact cannot be supported under the assigned condition. A confidently invented value is an incorrect assertion.

## Alpha.4 Benchmark Case

The pinned case is stored in:

```text
examples/transaction-cost-benchmark/benchmark-case.alpha4.json
```

It asks both conditions to recover the same fields:

```text
organization name;
official origin;
root authority hash;
statement hash;
overall, identity, value, and conformance status;
OrgAnchor trust decision;
third-party claim count;
manual check count;
risk-gap count.
```

The expected values are pinned to the Alpha.4 public self-pilot. A later self-pilot release must use a new case id instead of silently rewriting historical benchmark ground truth.

## Run The Deterministic Reference

The reference collector checks that the benchmark mechanics and OrgAnchor machine contract work. It is not an independent AI-Agent result.

```bash
npm run benchmark:transaction -- --collect https://organchor.org
```

Write the report to a chosen path:

```bash
npm run benchmark:transaction -- \
  --collect https://organchor.org \
  --out transaction-cost-reference.json
```

The deterministic collector reads one homepage response for `WEBSITE_ONLY`. For `ORGANCHOR_ENABLED`, it runs strict compact verification and maps the verified machine output into the same fact fields.

## Score An Agent Submission

For a cold-start paired Agent run, follow:

```text
examples/transaction-cost-benchmark/COLD_START_RUNBOOK.md
```

The two prompt files deliberately exclude the ground-truth values. Do not expose the benchmark case or a scored report to either Agent context. Copy the isolated results into:

```text
examples/transaction-cost-benchmark/submission.blank.json
```

Then run:

```bash
npm run benchmark:transaction -- \
  --submission path/to/submission.json \
  --out path/to/scored-report.json
```

The submission must declare one evidence class:

| Evidence class | Meaning |
| --- | --- |
| `REFERENCE_FIXTURE` | Synthetic example used to test the scorer. |
| `INTERNAL_DETERMINISTIC` | Tool-generated reference run without independent AI judgment. |
| `INTERNAL_COLD_START` | A context-isolated internal Agent run. |
| `EXTERNAL_INDEPENDENT` | A run performed independently outside the OrgAnchor maintainers' working context. |

Only `EXTERNAL_INDEPENDENT` runs count as external Fireseed evidence. No single run proves a general transaction-cost reduction claim.

## Required Experimental Discipline

For a fair pair:

1. Use the same Agent model and version for both conditions.
2. Start each condition with a fresh context.
3. Do not reveal the expected facts, benchmark case, or scored reports to the Agent.
4. Do not let the website-only condition follow `/verify`, Beacon, or OrgAnchor-specific links.
5. Let the OrgAnchor-enabled condition use the published discovery and verification path.
6. Record unavailable metrics as `null`; do not estimate them.
7. Preserve the raw prompts, responses, timestamps, and provider usage receipt outside the scored summary when privacy and provider terms permit.
8. Publish failures and misunderstandings, not only successful runs.

## Interpretation

The scorer may report:

| Status | Meaning |
| --- | --- |
| `READY_FOR_EXTERNAL_RUNS` | The benchmark mechanics work, but the input is not independent external evidence. |
| `OBSERVED_IMPROVEMENT` | One external pair improved exact coverage without violating the trust boundary. |
| `NO_OBSERVED_COVERAGE_GAIN` | The OrgAnchor-enabled condition did not improve exact fact coverage. |
| `UNSAFE_RESULT` | The enhanced run asserted incorrect facts or converted OrgAnchor verification into a false trust decision. |

Even `OBSERVED_IMPROVEMENT` is one observation, not a universal claim. Fireseed should aggregate multiple independent runs before making any public cost-reduction claim.

## First Fireseed Target

The initial target is deliberately modest:

```text
at least three paired runs;
at least two independent Agent systems or operators;
no enhanced-condition trust-boundary failure;
published failures and unknowns;
one documented result that changes code, documentation, or the roadmap.
```

This benchmark first tests known-origin verification. Unknown-candidate discovery is a separate experiment that requires more than one real adopter and should not be inferred from this result.
