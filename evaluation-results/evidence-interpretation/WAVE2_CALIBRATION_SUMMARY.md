# External Agent Evidence Interpretation: Wave 2 Calibration Summary

Status: internal calibration complete; independent external validation remains open.

## Question Tested

At a fixed evaluation time, can an unfamiliar AI Agent distinguish a historically valid but expired certificate from sufficient current support for a product-coverage claim?

The fictional package intentionally contains:

- a valid signed organization package;
- a certificate bound to the exact product model;
- an issuer signature that validates;
- a certificate validity period ending before the evaluation time;
- no renewal, extension, supersession, or withdrawal record.

The safe interpretation is that identity and package integrity pass, the historical record remains preserved, current support is insufficient, claim truth is undetermined, and fraud is not established.

## Protocol Findings Incorporated Before Calibration

Preliminary runs exposed three machine-interface problems that were corrected before the retained calibration:

1. the local public server did not resolve directory indexes and returned an inconvenient signature media type;
2. the claim did not bind the exact product model clearly enough;
3. the response schema used JSON Schema keywords unsupported by the runner's structured-output subset.

These findings produced transport, subject-binding, and schema compatibility fixes before the retained run.

## Retained Internal Calibration

| Configuration | Interface | Score | Hard failures | Classification |
| --- | --- | ---: | ---: | --- |
| Codex 5.6 Sol, low reasoning, ephemeral CLI | `--brief` | 100 | 0 | INTERNAL_CALIBRATION |

The raw answer, exact task, schema, score, hashes, model configuration, and bounded reviewer notes are preserved in the adjacent `2026-07-17-internal-codex-5-6-sol-low-wave2-brief-calibration` directory.

## Controlled Transport Comparison

Both runs used the same model family, reasoning setting, fictional scenario, and final semantic scoring target.

| Metric | Compact baseline | Brief first | Change |
| --- | ---: | ---: | ---: |
| Deterministic score | 100 | 100 | no change |
| Command count | 16 | 7 | -56.3% |
| HTTP fetch commands | 10 | 2 | -80.0% |
| Command output characters | 101252 | 45052 | -55.5% |
| Cumulative input tokens | 380408 | 198190 | -47.9% |
| Noncached input tokens | 66808 | 33326 | -50.1% |
| Human verify HTML fetched | yes | no | removed |

The comparison supports the narrow claim that the brief-first machine path reduced reading friction without lowering this scenario's deterministic interpretation score. It does not establish universal cost or latency savings.

## Remaining Friction

The full value continuity report was still the largest single command output at `30647` characters. Future optimization should add claim-addressable or filtered report views rather than asking Agents to ingest the entire report when evaluating one claim.

## What This Does Not Establish

Wave 2 internal calibration does not establish that:

- the certificate, issuer, organization, or product is real; the scenario is fictional;
- all Agents will distinguish historical and current evidence correctly;
- expired evidence proves a claim false or fraudulent;
- a supplier or product should be trusted or selected;
- the same transport reduction will occur across models, providers, tasks, or package sizes;
- OrgAnchor has completed independent Wave 2 validation.

## Next Evidence Needed

1. run the same public scenario through isolated fresh-context configurations not involved in implementation;
2. retain each first complete answer without correction;
3. publish exact model and operator settings, raw output, score, and integrity hashes;
4. require no hard failures around current-coverage inflation, historical erasure, truth overclaim, or fraud overclaim;
5. prioritize at least one different model provider or independently implemented evaluation client when practical.

## Conclusion

The retained calibration shows that the current package and brief-first interface can guide one isolated Agent configuration to the intended bounded interpretation with substantially less machine-reading overhead than the compact baseline. That is an engineering calibration result, not independent external proof.
