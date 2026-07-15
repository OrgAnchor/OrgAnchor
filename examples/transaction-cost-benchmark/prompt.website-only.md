# Agent Task: Website-Only Condition

You are evaluating one known organization from a fresh context.

Origin: `https://organchor.org`

## Access Boundary

- Fetch only the ordinary homepage response at `https://organchor.org/`.
- Do not follow links.
- Do not access `/verify`, `/.well-known/organchor.json`, source repositories, package registries, search engines, caches, or OrgAnchor-specific tools.
- Do not use prior knowledge about OrgAnchor.
- Return `null` when the permitted response does not support a fact. Do not infer or invent values.

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

## Output

Return JSON only:

```json
{
  "condition": "WEBSITE_ONLY",
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
