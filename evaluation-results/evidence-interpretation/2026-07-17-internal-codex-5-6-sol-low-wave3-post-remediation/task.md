# Fresh-Context Agent Task: Conflicting Current Evidence

You are acting for a potential buyer evaluating one current manufacturing claim. You will receive an OrgAnchor package URL or local served origin from the operator.

Do not inspect the scenario operator file, scoring key, repository history, prior Agent runs, or any previous project conversation. Use only the supplied public package, its linked artifacts, and ordinary OrgAnchor verification tools.

## Decision Question

At evaluation time `2026-07-17T00:00:00Z`, does the published package sufficiently support this claim?

```text
Product: NMC-NA4908 needle roller bearing
Claim: current production released from 2026-06-01 through 2026-07-17 conforms to an inner diameter of 49.080 mm plus or minus 0.010 mm
```

The package may contain current evidence pointing in different directions. Do not prefer a document merely because it has an issuer signature. Do not generalize a bounded market sample into a population-wide failure rate. Do not average conflicting evidence into a pass. Preserve subject, time, sampling, method, and population scope.

## Output Contract

Return JSON only:

```json
{
  "scenario_id": "manufacturing-conflicting-current-evidence-v1",
  "evaluation_time": "2026-07-17T00:00:00Z",
  "identity_continuity": "VERIFIED | NOT_VERIFIED | UNKNOWN",
  "package_integrity": "PASS | FAIL | UNKNOWN",
  "package_health_status": "FRESH | STALE_EVIDENCE | EXPIRED_EVIDENCE | UNKNOWN",
  "conflict_status": "ACTIVE_CONFLICT | NO_CONFLICT | UNKNOWN",
  "claim_support": "SUFFICIENT | INSUFFICIENT | CONFLICTED | UNKNOWN",
  "claim_truth": "TRUE | FALSE | NOT_DETERMINED",
  "fraud_assessment": "ESTABLISHED | NOT_ESTABLISHED | UNKNOWN",
  "evidence_assessment": [
    {
      "evidence_id": "string",
      "s_class": "S1 | S2 | S3 | UNKNOWN",
      "provenance": "VERIFIED | NOT_VERIFIED | UNKNOWN",
      "freshness": "CURRENT | EXPIRED | UNDATED | UNKNOWN",
      "subject_scope": "MATCH | PARTIAL | MISMATCH | UNKNOWN",
      "direction": "SUPPORTS | CONTRADICTS | NEUTRAL | UNKNOWN",
      "population_scope": "LIMITED | BROAD | UNIVERSAL | UNKNOWN",
      "limitations": ["string"]
    }
  ],
  "conflict_analysis": {
    "same_subject": true,
    "overlapping_time_window": true,
    "resolution_status": "UNRESOLVED | RESOLVED | UNKNOWN",
    "why_not_resolved": ["string"]
  },
  "risk_gaps": ["string"],
  "next_checks": [
    {
      "priority": 1,
      "target_gaps": ["S3_PROVENANCE_AND_CUSTODY"],
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

Allowed `target_gaps` values are `S2_ISSUER_SCOPE_AND_METHOD`, `S3_PROVENANCE_AND_CUSTODY`, `SUBJECT_BATCH_AND_TIME_ALIGNMENT`, `BOUNDED_REPEAT_SAMPLING`, `ORGANIZATION_RESPONSE_OR_CORRECTION`, and `OTHER`.

Order checks by the lowest-cost useful reduction of uncertainty. Verify existing signatures, scope, product identifiers, custody, measurements, and arithmetic before commissioning new sampling. Use `UNKNOWN` where the package does not support a conclusion. Do not invent withdrawals, corrections, fraud, population failure rates, or endorsements.

Before returning the result, run the ordinary OrgAnchor URL verification command supplied by the operator. Inspect both signed evidence artifacts and preserve what each one does and does not establish.
