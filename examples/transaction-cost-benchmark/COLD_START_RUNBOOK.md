# Cold-Start Paired Agent Run

Status: Retired internal calibration. Do not use this runbook as an active transaction-cost experiment or Fireseed external target. See `docs/evaluations/EVIDENCE_INTERPRETATION_ADVERSARIAL_EVALUATION.md` for the active falsifiable evaluation direction.

Use this kit to compare the same Agent under two information conditions without leaking the benchmark ground truth.

## Isolation Rules

1. Use the same Agent model, version, tool access, and settings for both runs.
2. Start each run in a fresh context with no OrgAnchor repository or prior conversation attached.
3. Give the Agent only one prompt file:
   - `prompt.website-only.md`, or
   - `prompt.organchor-enabled.md`.
4. Do not give either Agent `benchmark-case.alpha4.json`, a scored report, or the other condition's response.
5. Save the raw response and provider usage receipt before scoring.
6. Copy the two run results into `submission.blank.json`; fill only metrics actually reported by the provider or runner.
7. Score the completed submission with:

```bash
npm run benchmark:transaction -- \
  --submission path/to/completed-submission.json \
  --out path/to/scored-report.json
```

## What This Pair Tests

This Alpha.4 pair is a controlled known-origin recovery test. The website-only condition is deliberately limited to one ordinary homepage response. It tests how much of the requested machine-relevant record is available without the OrgAnchor discovery and verification path.

It is not yet a full comparison against unrestricted ordinary web research. A later bounded-web study should give both conditions equal time and request budgets while allowing the baseline Agent to follow ordinary same-origin pages and search results. Unknown-candidate discovery also requires multiple real adopters and is outside this case.

## Evidence Boundary

- A maintainer-run pair is `INTERNAL_COLD_START`.
- A pair run independently outside the maintainers' working context is `EXTERNAL_INDEPENDENT`.
- One pair is an observation, not proof of a general reduction in transaction cost.
- Publish failures, unknowns, and unsafe trust interpretations as well as successful results.
