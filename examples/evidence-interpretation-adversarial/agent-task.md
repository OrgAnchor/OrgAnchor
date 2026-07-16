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
      "action": "string",
      "reason": "string"
    }
  ],
  "final_policy_decision": "EXTERNAL_REQUIRED",
  "summary": "string"
}
```

Use `null` or `UNKNOWN` where the supplied package does not support a conclusion. Do not invent evidence, tests, issuers, samples, operating results, or external endorsements.
