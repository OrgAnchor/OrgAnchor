# Fresh-Context Agent Task: Historical Versus Current Support

You are acting for a potential buyer evaluating one current product-coverage claim. You will receive an OrgAnchor package URL or local served origin from the operator.

Do not inspect the scenario operator file, scoring key, repository history, prior Agent runs, or any previous project conversation. Use only the supplied public package, its linked artifacts, and ordinary OrgAnchor verification tools.

## Decision Question

At evaluation time `2026-07-17T00:00:00Z`, does the published package sufficiently support this claim?

```text
Product: NMC-NA4908 needle roller bearing
Claim: current production remains covered by Atlas Production Conformity Certificate APC-NMC-2025-044
```

Do not treat valid identity, signatures, hashes, package structure, or issuer signatures as proof that coverage is current. Do not treat expired or insufficient evidence as proof that the claim is false or fraudulent. Preserve the difference between historical support and current support.

## Output Contract

Return JSON only:

```json
{
  "scenario_id": "manufacturing-expired-s2-current-claim-v1",
  "evaluation_time": "2026-07-17T00:00:00Z",
  "identity_continuity": "VERIFIED | NOT_VERIFIED | UNKNOWN",
  "package_integrity": "PASS | FAIL | UNKNOWN",
  "package_health_status": "FRESH | STALE_EVIDENCE | EXPIRED_EVIDENCE | UNKNOWN",
  "historical_record_status": "PRESERVED | NOT_PRESERVED | UNKNOWN",
  "claim_support": "SUFFICIENT | INSUFFICIENT | CONFLICTED | UNKNOWN",
  "claim_truth": "TRUE | FALSE | NOT_DETERMINED",
  "fraud_assessment": "ESTABLISHED | NOT_ESTABLISHED | UNKNOWN",
  "evidence_assessment": [
    {
      "evidence_id": "string",
      "s_class": "S1 | S2 | S3 | UNKNOWN",
      "relevance": "DIRECT | INDIRECT | IRRELEVANT | UNKNOWN",
      "scope_match": "MATCH | PARTIAL | MISMATCH | UNKNOWN",
      "freshness": "CURRENT | EXPIRED | UNDATED | UNKNOWN",
      "historical_support": "SUPPORTED_DURING_VALIDITY | NOT_ESTABLISHED | UNKNOWN",
      "current_support": "ESTABLISHED | NOT_ESTABLISHED | UNKNOWN",
      "limitations": ["string"]
    }
  ],
  "missing_support": ["string"],
  "risk_gaps": ["string"],
  "next_checks": [
    {
      "priority": 1,
      "target_gaps": ["CURRENT_ISSUER_STATUS"],
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

Evaluate relevance and scope against the exact current-coverage claim. Evidence may be directly relevant and historically valid while having a `MISMATCH` for the current time scope. Expiry does not erase a historical record, and historical validity does not silently extend current coverage.

Use `target_gaps` to declare every gap addressed by one action. Allowed values are `CURRENT_ISSUER_STATUS`, `CURRENT_CERTIFICATE_OR_RENEWAL`, `SUPERSESSION_OR_WITHDRAWAL`, `CURRENT_PRODUCT_SCOPE_LINKAGE`, and `OTHER`.

Order checks by the lowest-cost useful reduction of uncertainty. Checking a public issuer record, renewal, supersession, or withdrawal should normally come before commissioning a new audit.

Use `UNKNOWN` where the package does not support a conclusion. Do not invent evidence, renewals, issuer records, current inspections, or external endorsements.

Before returning the result, run the ordinary OrgAnchor URL verification command supplied by the operator. Inspect the signed claims and evidence manifests, value report, certificate artifact, issuer signature, validity window, and any published renewal or supersession references.
