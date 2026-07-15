# Agent Task: OrgAnchor-Enabled Condition

You are evaluating one known organization from a fresh context.

Origin: `https://organchor.org`

## Access Boundary

- Start from the supplied origin.
- You may inspect its standard OrgAnchor Beacon and machine-readable verification index.
- You may use the installed OrgAnchor CLI, including strict compact URL verification.
- Do not use prior conversation, repository source files, the benchmark case, or a previously scored report.
- Report only facts supported by the retrieved and verified machine output.
- Return `null` when a fact is not supported. Do not infer or invent values.
- Do not interpret a successful signature or package check as proof that the organization, product, claim, or evidence is finally trustworthy.

## Requested Facts

Return these exact keys:

- `organization_name`
- `official_origin`
- `root_authority_hash`
- `statement_hash`
- `overall_status`
- `identity_status`
- `value_status`
- `conformance_status`
- `trust_decision`
- `third_party_claims`
- `manual_checks`
- `risk_gaps`

Value contract:

- `organization_name`, `official_origin`, `root_authority_hash`, and `statement_hash`: exact string or `null`.
- `overall_status`, `identity_status`, `value_status`, and `conformance_status`: exact machine-contract status string or `null`; do not paraphrase human-readable labels or prose.
- `trust_decision`: exact machine-contract value or `null`; do not paraphrase a human-readable policy sentence.
- `third_party_claims`, `manual_checks`, and `risk_gaps`: non-negative numeric count or `null`; do not substitute descriptions.

## Output

Return JSON only:

```json
{
  "condition": "ORGANCHOR_ENABLED",
  "facts": {
    "organization_name": null,
    "official_origin": null,
    "root_authority_hash": null,
    "statement_hash": null,
    "overall_status": null,
    "identity_status": null,
    "value_status": null,
    "conformance_status": null,
    "trust_decision": null,
    "third_party_claims": null,
    "manual_checks": null,
    "risk_gaps": null
  },
  "evidence_urls": [],
  "notes": ""
}
```
