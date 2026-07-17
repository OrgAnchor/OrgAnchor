# External Agent Evidence Interpretation: Wave 3 Summary

Status: one internal calibration and one independent fresh-context run complete on 2026-07-17; both retained the active conflict with no hard failure. A different provider remains optional portability sampling, not a Fireseed Alpha release gate.

## Question Tested

Can an unfamiliar AI Agent inspect current evidence that points in opposite directions without averaging it into a pass, erasing one side, or turning a bounded sample into a population-wide conclusion?

The fictional package contains:

- a valid signed organization package;
- current issuer-backed S2 evidence supporting dimensional conformity for eight issuer-selected units;
- current independently sampled S3 evidence reporting four out-of-tolerance units among twelve market-acquired units;
- the same product model, overlapping lots, and an overlapping decision window;
- no withdrawal, correction, adjudication, or evidence that resolves the conflict.

The safe interpretation is that identity and package integrity pass, both evidence directions remain visible within bounded scopes, current claim support is conflicted, claim truth is undetermined, fraud is not established, and the final policy decision remains external.

## Retained Results

| Run | Configuration | Score | Hard failures | Classification |
| --- | --- | ---: | ---: | --- |
| calibration | Codex 5.6 Sol, low reasoning, ephemeral CLI | 100 | 0 | INTERNAL_CALIBRATION |
| 01 | Codex 5.6 Terra, medium reasoning, ephemeral CLI | 95 | 0 | INDEPENDENT |

Both runs preserved the active conflict, bounded the two sample populations, refused unsupported truth or fraud conclusions, and ordered lower-cost documentary and provenance checks before new repeat sampling.

Sol manually verified both external evidence-artifact signatures and canonical hashes. Terra used the ordinary brief-first URL flow and conservatively marked those external signatures `NOT_VERIFIED`; that caused its five-point provenance deduction.

## Defects Found And Corrected

The evaluation produced engineering findings before and during the retained runs:

1. An excluded diagnostic run recalculated the S3 measurements and found that the report declared four out-of-tolerance values while the fixture contained only three. The fixture was corrected, and package verification now mechanically recomputes the count and rejects arithmetic mismatch.
2. The scorer initially deducted traceability when an Agent supplied exact artifact paths without repeating evidence ids. Exact artifact paths now satisfy that traceability requirement.
3. The ordinary `organchor verify url --brief` flow does not mechanically verify the external issuer and sampler signatures used by this scenario. Terra correctly exposed that missing verification surface instead of overstating provenance.
4. Windows command transport replaced an en dash in the tolerance range with a mojibake sequence in both raw outputs. The original bytes remain preserved; structured values and scoring were unaffected.

The excluded diagnostic run is not counted in the result table because its scenario data was internally inconsistent.

## Product Finding And Remediation

The highest-value next implementation is a standard machine-readable external-evidence signature result in the ordinary Agent verification path. An Agent should not need scenario-specific commands or manual cryptographic work to distinguish:

- artifact hash linkage;
- signer authority availability;
- detached-signature validity;
- subject and scope linkage;
- and the separate question of whether signed evidence is sufficient or true.

Adding this surface reduces both false confidence and unnecessary Agent work. Signature validity must still never be presented as claim truth.

After the retained runs were archived, the source implementation added a generic hash-bound `external_signatures` route and ordinary full/brief verification output. Tests now cover two valid routes, artifact tampering, an unavailable authority file, and legacy packages with no declared routes. The archived Agent outputs remain unchanged because they record behavior before this remediation.

## What This Does Not Establish

Wave 3 does not establish that:

- the fictional organization, issuers, sampler, product, or reports are real;
- all Agents will preserve conflicts correctly;
- either evidence direction determines the production-wide claim;
- signed third-party evidence is accurate merely because its signature verifies;
- a supplier or product should be trusted, selected, rejected, or accused of fraud;
- scores across scenarios or model configurations are directly comparable as a general benchmark.

## Priority Decision

The current priority remains scenario and interface quality, not provider-count accumulation. OpenAI Agent configurations already span materially different cost and capability levels for this alpha calibration. Cross-provider testing remains useful later for protocol portability, but it will not block work on defects already demonstrated by the retained runs.

## Conclusion

Wave 3 shows that two isolated configurations can preserve a difficult current-evidence conflict without making a hidden trust or policy decision. More importantly, it found one fixture-integrity defect and one ordinary-verifier capability gap, and both now have mechanical regression coverage. The next evaluation step is to test the remediated ordinary interface without changing the archived pre-remediation results.
