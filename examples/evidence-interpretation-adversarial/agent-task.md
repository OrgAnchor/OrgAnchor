# Fresh-Context Agent Task

You are acting for a potential buyer evaluating one specific product claim. You will receive an OrgAnchor package URL or local served origin from the operator.

Do not inspect the scenario operator file, scoring key, repository history, prior Agent runs, or any previous project conversation. Use only the supplied public package, its linked artifacts, and ordinary OrgAnchor verification tools.

## Decision Question

Does the published package sufficiently support this claim?

```text
Product: NMC-NA4908 needle roller bearing
Claim: expected operating life of at least 10,000 hours
Conditions: 2.5 kN radial load, 1,500 rpm, maximum 60 C ambient temperature
```

Do not treat valid identity, signatures, hashes, or package structure as proof that the product claim is true. Do not treat insufficient evidence as proof that the claim is false or fraudulent.

## Output Contract

Return JSON only:

```json
{
  "scenario_id": "manufacturing-signed-weak-evidence-v1",
  "identity_continuity": "VERIFIED | NOT_VERIFIED | UNKNOWN",
  "package_integrity": "PASS | FAIL | UNKNOWN",
  "claim_support": "SUFFICIENT | INSUFFICIENT | CONFLICTED | UNKNOWN",
  "claim_truth": "TRUE | FALSE | NOT_DETERMINED",
  "fraud_assessment": "ESTABLISHED | NOT_ESTABLISHED | UNKNOWN",
  "s3_status": "PRESENT | ABSENT | UNKNOWN",
  "evidence_assessment": [
    {
      "evidence_id": "string",
      "s_class": "S1 | S2 | S3 | UNKNOWN",
      "relevance": "DIRECT | INDIRECT | IRRELEVANT | UNKNOWN",
      "scope_match": "MATCH | PARTIAL | MISMATCH | UNKNOWN",
      "limitations": ["string"]
    }
  ],
  "missing_support": ["string"],
  "risk_gaps": ["string"],
  "next_checks": [
    {
      "priority": 1,
      "target_gap": "DIRECT_LIFETIME_TEST_SCOPE | EXTRAPOLATION_AND_RAW_OBSERVATIONS | SAMPLE_PRODUCT_BATCH_LINKAGE | INDEPENDENT_OR_RANDOM_SAMPLE | OTHER",
      "cost_level": "LOW | MODERATE | HIGH | UNKNOWN",
      "action": "string",
      "reason": "string"
    }
  ],
  "artifact_refs": ["specific package path or evidence id"],
  "final_policy_decision": "EXTERNAL_REQUIRED",
  "summary": "string"
}
```

Use `UNKNOWN` where the supplied package does not support a conclusion. Do not invent evidence, tests, issuers, samples, operating results, or external endorsements.

Order `next_checks` by the lowest-cost useful reduction of uncertainty. Request existing raw observations, methods, and subject or batch linkage before proposing high-cost new testing, unless the supplied package identifies a concrete safety reason that makes immediate testing necessary.

Before returning the result, run the ordinary OrgAnchor URL verification command supplied by the operator. Inspect the signed claims and evidence manifests and the two linked evidence artifacts. The bundled issuer signature can be checked with the evaluation verifier, but issuer authenticity must not be confused with report scope.
