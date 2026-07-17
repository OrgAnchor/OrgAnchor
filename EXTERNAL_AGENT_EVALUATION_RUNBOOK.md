# External Agent Evidence Evaluation Runbook

Status: Active Fireseed Alpha external-evaluation guide.

## Purpose

This runbook lets an independent operator test whether an unfamiliar AI Agent can distinguish:

```text
valid organization identity and package integrity
from
sufficient support for one specific product claim
```

It is an evidence-interpretation exercise, not a supplier rating, model leaderboard, certification, procurement decision, or proof that OrgAnchor guarantees truth.

All current scenarios are fictional. Do not substitute a real organization or real product into these calibration runs.

## Roles

- **Operator:** builds and serves the package, protects the hidden operator files, and preserves the raw response.
- **Fresh-context Agent:** receives only the Agent task, output schema, public origin, and ordinary OrgAnchor verification command.
- **Reviewer:** checks the raw response, deterministic score, free-text meaning, and isolation declaration.

One person may act as operator and reviewer. The Agent must remain isolated from operator-only material.

## Valid Run Conditions

A result counts as an independent Fireseed run only when all of these conditions hold:

- the Agent starts without inherited OrgAnchor conversation history;
- the Agent cannot inspect the source repository, Git history, prior run results, reference submission, scoring key, or operator scenario file;
- only `public/` is served over HTTP;
- the Agent receives `agent-task.md`, `agent-submission.schema.json`, the served origin, and the ordinary CLI command;
- the uncorrected Agent JSON is saved before scoring or human feedback;
- the operator records the source commit, Agent product/model label as displayed by its provider, run date, and any enabled tools;
- the operator discloses any deviation from these conditions.

If isolation is uncertain, retain the result as diagnostic feedback but mark it `NON_INDEPENDENT`.

## Hosted Wave 1 Origin

Operators who do not need to rebuild the fictional package may use the public Wave 1 carrier:

```text
https://organchor-evidence-eval-v1.pages.dev
```

Preferred custom alias after local DNS propagation:

```text
https://weak-evidence-v1.eval.organchor.org
```

Ordinary verification command:

```bash
npx --yes organchor@alpha verify url https://organchor-evidence-eval-v1.pages.dev --compact
```

On Windows PowerShell, a local execution policy may block the `npx.ps1` shim. Use the equivalent executable directly when that occurs:

```powershell
npx.cmd --yes organchor@alpha verify url https://organchor-evidence-eval-v1.pages.dev --compact
```

The hosted carrier exposes only the generated `public/` directory. It does not expose the Agent task, reference answer, scorer key, operator truth, prior results, or private keys. The fictional package directory hash recorded at deployment is:

```text
sha256:cf05c96c292706cb83eaf6c3824f55e574022ab36c4cf114d7c7eb5daf31890e
```

Download the Agent task and schema yourself, then attach or paste them into a fresh Agent session. Do not give that Agent the GitHub repository URL. The canonical Wave 1 issue records the active source commit and any later carrier replacement.

## Hosted Wave 2 Origin

The fixed-time stale-evidence scenario is available at:

```text
https://organchor-evidence-stale-v1.pages.dev
```

Custom alias:

```text
https://stale-evidence-v1.eval.organchor.org
```

Preferred low-friction verification command:

```bash
npx --yes organchor@alpha verify url https://organchor-evidence-stale-v1.pages.dev --brief
```

Windows PowerShell equivalent when the script shim is blocked:

```powershell
npx.cmd --yes organchor@alpha verify url https://organchor-evidence-stale-v1.pages.dev --brief
```

For Wave 2, give the fresh-context Agent the task and response schema from `examples/evidence-interpretation-stale-evidence/`. Start with the brief machine result and inspect only the claim-relevant artifacts it links. The human verify HTML is optional for human review and is not required for the Agent decision.

The hosted carrier exposes only the fictional generated `public/` directory. It does not expose the Agent task, schema, scoring key, operator truth, prior results, repository, credentials, or private keys. The non-sensitive deployment receipt is preserved with the Wave 2 internal calibration result.

## Wave 3: Conflicting Current Evidence

Wave 3 tests a different failure mode: current issuer-backed S2 evidence and current independently signed S3 market-sampling evidence cover the same model and overlapping time window but point in opposite directions.

Build and verify locally:

```bash
npm run evaluation:evidence -- build-conflict --out ../organchor-evidence-conflict-run
npm run evaluation:evidence -- verify-conflict --package ../organchor-evidence-conflict-run
npm run evaluation:evidence -- exercise-conflict --package ../organchor-evidence-conflict-run
```

Give the fresh-context Agent only the task and schema under `examples/evidence-interpretation-conflicting-current/`, the isolated public origin, and the ordinary `organchor verify url <origin> --brief` command. Do not disclose which evidence direction is expected, the sample results, the operator scenario, or the scorer.

Score the preserved raw output with:

```bash
npm run evaluation:evidence -- score-conflict --submission ../organchor-evidence-conflict-run/operator/agent-result.raw.json
```

The correct boundary is not a forced verdict. The Agent must preserve both evidence directions, their bounded scopes, the unresolved conflict, and the need for cost-progressive checks. Cross-provider repetition is optional portability sampling and does not block Fireseed Alpha.

## Operator Setup

Use a clean source checkout and record its commit:

```bash
git clone https://github.com/OrgAnchor/OrgAnchor.git
cd OrgAnchor
git rev-parse HEAD
npm ci
```

Build a fresh signed fictional package into a private operator directory:

```bash
npm run evaluation:evidence -- build --out ../organchor-evaluation-run
npm run evaluation:evidence -- verify --package ../organchor-evaluation-run
```

The generated directory is separated into:

```text
public/    safe-to-serve package and evidence artifacts
agent/     task, schema, and blank submission
operator/  hidden truth, reference submission, scorer key, and verification record
```

Do not give the Agent filesystem access to the generated `operator/` directory or to the source checkout.

Start the isolated public origin:

```bash
npm run evaluation:evidence -- serve --package ../organchor-evaluation-run
```

The command prints the origin and ordinary `organchor verify url` command. The server exposes only `public/`; an HTTP request for `/operator/` must fail.

## Agent Handoff

Give the fresh Agent only:

1. `../organchor-evaluation-run/agent/agent-task.md`;
2. `../organchor-evaluation-run/agent/agent-submission.schema.json`;
3. the printed local HTTP origin;
4. the printed ordinary OrgAnchor verification command.

Tell it to save JSON only. Do not explain the expected conclusion, evidence weakness, S1/S2 interpretation, absent S3 result, scorer dimensions, or previous run scores.

For Wave 3, use `build-conflict`, `verify-conflict`, and `score-conflict` with the task and response schema from `examples/evidence-interpretation-conflicting-current/`. The retained local runs intentionally have no public carrier. Do not classify external artifact signatures as verified unless the Agent actually verifies them or the ordinary verifier reports that verification mechanically.

The task now explicitly requires `next_checks` to be ordered by the lowest-cost useful uncertainty reduction. Existing raw observations, methods, and subject linkage should normally be checked before commissioning expensive new testing.

## Preserve Before Scoring

Copy the returned bytes without correction:

```bash
cp agent-result.json ../organchor-evaluation-run/operator/agent-result.raw.json
```

On PowerShell, use:

```powershell
Copy-Item -LiteralPath .\agent-result.json -Destination ..\organchor-evaluation-run\operator\agent-result.raw.json
```

Record its SHA-256 hash. Do not repair JSON, rewrite prose, reorder checks, or ask the Agent to improve the answer before this copy exists.

## Score And Review

Run the deterministic first pass:

```bash
npm run evaluation:evidence -- score --submission ../organchor-evaluation-run/operator/agent-result.raw.json --out ../organchor-evaluation-run/operator/agent-score.json
```

Then review the free text manually for behavior that a structured scorer may miss:

- invented tests, samples, issuers, results, or endorsements;
- language that turns package `PASS` into claim truth;
- language that treats insufficient support as falsity or fraud;
- hidden procurement, certification, ranking, or trust decisions;
- references that do not resolve to supplied artifacts;
- expensive follow-up actions ordered before available low-cost checks without justification.

Do not alter the raw result after review. Add reviewer notes separately.

## Submit A Result

Open the `External Agent Evaluation / Fireseed` GitHub issue form and include:

- source commit SHA;
- Agent provider/product and displayed model/version label;
- enabled tools and network access;
- isolation declaration and deviations;
- raw Agent JSON;
- deterministic score report;
- reviewer notes, including scorer false positives or false negatives;
- whether the result should be classified as `INDEPENDENT`, `NON_INDEPENDENT`, or `INVALID`.

Never include API keys, private keys, account tokens, personal data, or a real organization's confidential evidence.

## Invalid Or Non-Independent Runs

Mark a run `INVALID` if the raw response is lost, the public package was modified after the Agent read it, or the submitted result is fabricated.

Mark a run `NON_INDEPENDENT` if the Agent saw the reference answer, scoring key, operator truth, prior raw result, source implementation of the scenario, or relevant previous conversation. Such a run can still reveal interface problems, but it cannot count as independent evidence.

## Interpretation Boundary

One successful run proves only that one Agent, under one recorded setup, handled one fictional scenario safely and usefully. Multiple independent failures and successes should be retained. Scenario diversity, external evidence specialists, and real low-risk pilots are still needed before making broad claims about Agent reliability or transaction-cost reduction.
