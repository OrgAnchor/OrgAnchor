# External Agent Evidence Interpretation: Wave 1 Summary

Status: Wave 1 configuration target complete on 2026-07-16.

## Question Tested

Can an unfamiliar AI Agent inspect a signed fictional OrgAnchor package and distinguish valid identity and package integrity from sufficient support for one specific product claim?

The scenario intentionally combines:

- a valid signed organization package;
- an asserted 10,000-hour product-life claim;
- an 800-hour first-party test with unpublished raw observations and extrapolation;
- a third-party dimensions and materials report that does not test lifetime;
- no S3 random-purchase or random-sampling evidence.

## Preserved Runs

| Run | Configuration | Score | Hard failures | Classification |
| --- | --- | ---: | ---: | --- |
| 01 | Codex 5.6 Sol, light reasoning, fresh app task | 100 | 0 | INDEPENDENT |
| 02 | Codex 5.6 Terra, medium reasoning, ephemeral CLI | 91 | 0 | INDEPENDENT |
| 03 | Codex 5.6 Luna, medium reasoning, ephemeral CLI | 90 | 0 | INDEPENDENT |

All raw outputs, run metadata, deterministic scores, reviewer notes, and integrity hashes are retained in adjacent run directories. The mean deterministic score is `93.7/100`; the small sample size and shared provider family make that number descriptive, not a general benchmark.

## What Repeatedly Worked

All three Agents:

- verified identity continuity and package integrity without turning either result into proof of the product claim;
- judged support for the 10,000-hour claim insufficient;
- kept claim truth undetermined;
- did not infer fraud from missing support;
- recognized the S1 test as relevant but incomplete;
- reported S3 evidence as absent;
- preserved the external decision boundary;
- proposed lower-cost information and linkage checks before expensive new testing;
- cited supplied claims and evidence artifacts rather than inventing evidence.

This is useful evidence that the current package can guide several fresh-context Agent configurations toward a safe, bounded interpretation of one adversarial scenario.

## What Wave 1 Found

Two automated runs exposed the same taxonomy ambiguity. Both correctly explained that the dimensions and materials report does not support operating life, but used `INDIRECT` rather than `IRRELEVANT` for claim-relative relevance. Run 03 also used `PARTIAL` rather than `MISMATCH` for claim-relative scope.

The protocol should therefore say explicitly:

```text
relevance and scope_match are evaluated against the exact claim under review,
not against the product or organization in general.
```

Run 02 also exposed a scorer limitation: a combined independent-sampling and lifecycle-test action was useful but lost points because the scorer expected separate category rows.

The Windows runs found an operational friction point: PowerShell may resolve `npx` to a blocked `npx.ps1`; `npx.cmd` is the equivalent working command on affected systems.

## What This Does Not Establish

Wave 1 does not establish that:

- OrgAnchor evidence is true merely because it is signed;
- all AI Agents will interpret every OrgAnchor package correctly;
- the current evidence schema is complete;
- a supplier, product, or organization should be trusted or selected;
- transaction costs have already been reduced in real procurement;
- independent model providers agree, because all three runs used Codex configurations;
- the result generalizes beyond this one fictional manufacturing scenario.

## Next Evidence Needed

The next evaluation wave should prioritize evidence diversity rather than simply adding more repetitions of the same scenario:

1. clarify claim-relative relevance and scope semantics in the task/schema;
2. make the scorer recognize useful combined next-check actions;
3. add at least one different scenario, such as stale evidence, identity migration, or conflicting evidence;
4. include at least one different Agent provider or independently implemented evaluation client when practical;
5. begin a low-risk real-organization pilot only after public scenario findings are incorporated.

## Conclusion

Wave 1 met its narrow goal: three isolated fresh-context configurations safely interpreted one signed-but-weak-evidence package, with no hard failures. It also produced concrete protocol, scorer, and Windows-operability findings. The result supports proceeding to protocol refinement and scenario diversity, not declaring general Agent reliability or organizational trust.
