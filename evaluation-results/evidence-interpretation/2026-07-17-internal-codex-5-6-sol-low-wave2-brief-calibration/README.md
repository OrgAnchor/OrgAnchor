# Internal Agent Calibration: Stale Evidence, Brief First

This directory preserves an uncorrected fresh-context Agent result for the fixed-time Wave 2 stale-evidence scenario.

The run tested whether an unfamiliar Agent could use the low-friction `organchor verify url <origin> --brief` path and still distinguish:

- verified identity and package integrity;
- preserved historical evidence;
- expired evidence that does not establish current support;
- undetermined claim truth;
- insufficient evidence that does not establish fraud.

## Result

- deterministic score: `100/100`;
- hard failures: `0`;
- classification: `INTERNAL_CALIBRATION`;
- external independence: `false`;
- human verify HTML fetched: `false`.

The first complete answer is preserved in `agent-result.raw.json`. It was not corrected before scoring.

## Why This Run Matters

An earlier controlled run used the larger `--compact` result and reached the same score, but consumed more Agent commands, command output, and model input. The brief-first run reduced:

- command count from `16` to `7`;
- command output from `101252` to `45052` characters;
- cumulative input from `380408` to `198190` tokens;
- noncached input from `66808` to `33326` tokens.

This is evidence of lower machine-reading friction for this scenario, not a general latency, cost, or model-quality benchmark.

## Files

- `task.md`: isolated Agent task;
- `response-schema.json`: required structured output;
- `agent-result.raw.json`: first complete uncorrected result;
- `score.json`: deterministic score report;
- `run-metadata.json`: metadata written by the Agent;
- `operator-invocation.json`: exact operator configuration, hashes, and transport metrics;
- `reviewer-notes.json`: bounded review and limitations.

The much larger CLI event log is retained outside the Git repository. Its SHA-256 hash is recorded in `operator-invocation.json`.
