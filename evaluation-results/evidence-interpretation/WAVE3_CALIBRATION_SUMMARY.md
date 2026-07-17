# External Agent Evidence Interpretation: Wave 3 Summary

Status: one pre-remediation internal calibration, one independent fresh-context run, and one post-remediation internal calibration completed on 2026-07-17. All retained the active conflict with no hard failure. A different provider remains optional portability sampling, not a Fireseed Alpha release gate.

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
| post-remediation | Codex 5.6 Sol, low reasoning, ephemeral CLI | 96 | 0 | INTERNAL_CALIBRATION |

Both runs preserved the active conflict, bounded the two sample populations, refused unsupported truth or fraud conclusions, and ordered lower-cost documentary and provenance checks before new repeat sampling.

The pre-remediation Sol run manually verified both external evidence-artifact signatures and canonical hashes. Terra used the ordinary brief-first URL flow and conservatively marked those external signatures `NOT_VERIFIED`; that caused its five-point provenance deduction. The post-remediation Sol run used the same ordinary brief-first flow, received both signatures as `VERIFIED` from the generic verifier, and did not repeat the cryptographic work. Its four-point deduction was only for omitting the two manifest paths from the final reference list.

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

After the first two retained runs were archived, the source implementation added a generic hash-bound `external_signatures` route and ordinary full/brief verification output. Tests cover two valid routes, artifact tampering, invalid detached-signature bytes, an unavailable authority file, path escape, bounded network work, and legacy packages with no declared routes. The pre-remediation Agent outputs remain unchanged.

The post-remediation calibration then exercised that ordinary interface from a fresh isolated session. It confirmed the intended division of work: OrgAnchor performed deterministic hash and signature checks; the Agent interpreted evidence scope, conflict, uncertainty, and next actions. One initial execution reached the correct intermediate state but did not emit a final answer before timeout; a fresh retry completed and is the only post-remediation answer scored and archived.

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

Wave 3 shows that isolated configurations can preserve a difficult current-evidence conflict without making a hidden trust or policy decision. More importantly, it found one fixture-integrity defect and one ordinary-verifier capability gap, both received mechanical regression coverage, and the post-remediation run verified that the ordinary low-friction interface now exposes exact cryptographic provenance status. Further provider repetition is not a release gate; the next useful evaluation work should add materially different evidence risks or real external adopters.
