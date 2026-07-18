# Historical Fireseed Retrieval Comparison

Status: Historical record. Retired from active Fireseed evaluation on 2026-07-16 and preserved as an internal Agent-contract retrieval calibration and correction record.

This comparison must not be used as evidence that OrgAnchor lowers transaction cost. The website-only condition was artificially restricted, the requested facts were tailored to the OrgAnchor machine contract, and provider cost metrics were unavailable. Structured machine data being easier to retrieve than homepage prose is a design premise, not a useful causal experiment.

The active falsifiable evaluation is now `docs/evaluations/EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md`, which tests whether an Agent can distinguish valid identity/package integrity from insufficient product-claim evidence.

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

The benchmark is currently post-Alpha.4 source-repository tooling. Run these commands from a source checkout; do not assume they are present in the already published Alpha.4 npm package.

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

## Internal Calibration Record: 2026-07-15

The first fresh-context internal pair was rejected before scoring. The website-only Agent obeyed its access boundary but returned homepage prose in machine-status fields and a textual description in the numeric `risk_gaps` field. The OrgAnchor-enabled Agent returned a contract-valid 12-field result and preserved the final-trust boundary.

This exposed an experiment-interface defect rather than evidence for or against OrgAnchor: the initial prompts named the fields but did not state their value types or prohibit prose substitution. Both prompts now declare the same type and status semantics without revealing expected values. The rejected pair is calibration evidence only and does not count toward the Fireseed target.

## Internal Cold-Start Observation: 2026-07-16

After the value contract was corrected, two new fresh-context Codex tasks ran the isolated pair. The website-only condition recovered 2 of 12 pinned facts and left 10 unknown. The OrgAnchor-enabled condition recovered all 12 facts. Neither condition made an incorrect assertion, and the enhanced condition preserved `NOT_ASSIGNED_BY_ORGANCHOR` as the trust boundary.

The scored status is `READY_FOR_EXTERNAL_RUNS`, not `OBSERVED_IMPROVEMENT`, because this is `INTERNAL_COLD_START` evidence. Provider cost metrics were unavailable and remain `null`. The observation supports only a narrower statement: for this known origin and fact set, the OrgAnchor machine path increased exact fact recovery without introducing false assertions or a false final-trust decision. It does not yet establish lower total transaction cost, unknown-candidate discovery, or general performance across organizations and Agent systems.

The raw outputs, submission, and scored report are retained with the Alpha.4 self-pilot operational artifacts outside the public source repository.

## Withdrawn External Target

The following target was part of the original design and is retained only to show what was withdrawn. Fireseed should not recruit external reviewers to repeat this comparison.

The initial target is deliberately modest:

```text
at least three paired runs;
at least two independent Agent systems or operators;
no enhanced-condition trust-boundary failure;
published failures and unknowns;
one documented result that changes code, documentation, or the roadmap.
```

This benchmark first tests known-origin verification. Unknown-candidate discovery is a separate experiment that requires more than one real adopter and should not be inferred from this result.
