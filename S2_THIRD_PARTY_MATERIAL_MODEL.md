# S2 Third-Party Material Model

Status: Accepted implementation-facing design model. S2 basic usability is implemented: template generation, attach command, local Core checks, candidate/effective classification, value-audit summary, and compact agent summary. Network route adapters and issuer-backed signatures remain future work.

## Purpose

This document defines the minimum practical shape for S2 third-party materials.

It turns the S2 boundary from `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md` into fields, checks, and agent-facing summaries that can be implemented in schemas, `value audit`, `/verify`, and Directory health summaries.

S2 is not a trust badge. It only means:

```text
the organization formally references third-party material;
the material has at least one external recheck anchor;
the organization claims a linkage between the material and one or more claims;
OrgAnchor can expose linkage, limits, expiry, route, and mechanical-check results.
```

## Placement

S2 should extend the existing signed evidence manifest instead of creating a separate required manifest.

Recommended placement:

```text
evidence/evidence-manifest.json
  evidence[]
    s_class
    s2
```

Reason:

```text
The evidence manifest is already signed, published, copied into /verify, archived, and audited.
Adding S2 metadata there is lower-burden than introducing a new package type first.
```

Future versions may add dedicated attestation or issuer-backed manifests, but the first implementation should not require them.

## Low-Friction CLI

Organizations should not have to hand-write S2 JSON.

Generate a fillable S2 snippet:

```bash
organchor evidence s2 template --template certification_record
```

Attach S2 metadata to an existing evidence item:

```bash
organchor evidence s2 attach \
  --evidence-id evidence-001 \
  --template certification_record \
  --issuer-name "Example Certification Body" \
  --anchor-url https://registry.example/records/ABC-123 \
  --anchor-record-id ABC-123 \
  --scope "Certificate supports claim-001 for model-x1." \
  --covered-subject-type product_model \
  --covered-subject-id model-x1 \
  --valid-until 2027-05-28T00:00:00Z
```

Supported starter templates:

```text
certification_record
laboratory_report
platform_public_record
customer_confirmation
```

The attach command defaults unknown fields to explicit `unknown` values instead of hiding them. That keeps the path low-friction while still exposing gaps to external agents.

## Submission And Storage Boundary

Default S2 submitter:

```text
the organization that benefits from the third-party material
```

Reason:

```text
The organization is the party claiming that a third-party material supports its product, service, credential, or claim.
Therefore the organization should bear the cost and responsibility of publishing the material metadata, hash, scope linkage, recheck route, expiry status, limitations, and corrections.
```

Default S2 storage:

```text
organization package = metadata, artifact hash, locations, claimed linkage, route, limits, health
issuer or public registry = preferred external recheck anchor
organization website/object storage/IPFS = optional retrieval mirrors
Arweave/OpenTimestamps = optional small historical anchors or receipts
```

OrgAnchor should not become the required storage host for third-party documents. It should make the material inspectable, hash-bound, recheckable, and honestly scoped.

Issuer-backed S2 is a strengthening path, not a requirement for the first low-friction workflow. A third-party issuer may later sign, host, or OrgAnchor-back the material or linkage, but the organization-submitted route remains the default.

## Effective States

Recommended material states:

```text
CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL
S2_1_GENERIC_ROUTE_PROVIDED
S2_2_VERIFIED_ROUTE_CHECKED
S2_3_ISSUER_BACKED
```

Rules:

```text
CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL = not effective S2
S2_1_GENERIC_ROUTE_PROVIDED = minimum effective S2
S2_2_VERIFIED_ROUTE_CHECKED = bounded mechanical route check passed
S2_3_ISSUER_BACKED = issuer signed, hosted, or OrgAnchor-backed the material or linkage
```

Current local implementation boundary:

```text
Local value audit can promote material to S2_1 when Core fields and an external anchor are present.
S2_2 requires a route adapter check.
S2_3 requires issuer-backed signature or issuer-hosted verification.
Until those workflows exist, declared S2_2 or S2_3 material is reported as requiring manual review and counted as S2_1 at most.
```

## Minimal Shape

Recommended evidence item shape:

```json
{
  "id": "evidence-cert-001",
  "title": "Example certification record",
  "issuer_type": "third_party",
  "media_type": "application/pdf",
  "hash": "sha256:<artifact-or-record-hash>",
  "size": 123456,
  "locations": [
    {
      "type": "https",
      "uri": "https://example.org/evidence/certification-record.pdf"
    }
  ],
  "relations": [
    {
      "type": "supports_claim",
      "claim_id": "claim-001"
    }
  ],
  "s_class": "S2_THIRD_PARTY_DOCUMENTS",
  "s2": {
    "state": "S2_1_GENERIC_ROUTE_PROVIDED",
    "material_type": "certification_record",
    "issuer_name": "Example Certification Body",
    "organization_claimed_support": {
      "support_type": "supports_claim",
      "claim_refs": ["claim-001"],
      "covered_subject_type": "product_model",
      "covered_subject_id": "model-x1",
      "scope_text": "Certification scope claimed by the organization.",
      "limitations": [
        "Scope and legal sufficiency require external policy review."
      ]
    },
    "verification_route": {
      "route_id": "VR-S2-002",
      "route_kind": "PUBLIC_REGISTRY_CONFIRMATION",
      "route_template": "public_registry_record",
      "verification_mode": "manual_check"
    },
    "external_recheck_anchor": {
      "anchor_type": "public_registry_record",
      "url": "https://registry.example/records/ABC-123",
      "record_id": "ABC-123",
      "checked_at": "2026-05-28T00:00:00Z"
    },
    "health": {
      "valid_until": "2027-05-28T00:00:00Z",
      "last_checked_at": "2026-05-28T00:00:00Z",
      "maintenance_status": "FRESH"
    },
    "disclosures": {
      "sample_source": "unknown",
      "selected_by": "unknown",
      "relationship_to_organization": "paid_certification"
    }
  }
}
```

The current alpha evidence item already has `id`, `title`, `issuer_type`, `media_type`, `hash`, `size`, `locations`, and `relations`. The S2 model adds `s_class` and `s2`.

## Core Fields

Core fields are required for effective S2.

Missing Core means the item should be downgraded to:

```text
CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL
```

Core fields:

```text
id
title
issuer_type
media_type
hash
size
locations
relations[].claim_id or s2.organization_claimed_support.claim_refs
s_class = S2_THIRD_PARTY_DOCUMENTS
s2.state
s2.material_type
s2.issuer_name
s2.organization_claimed_support
s2.organization_claimed_support.scope_text
s2.organization_claimed_support.limitations
s2.verification_route
s2.external_recheck_anchor
s2.external_recheck_anchor.checked_at or issued_at
s2.health.maintenance_status
```

Core rule:

```text
No external_recheck_anchor = not effective S2.
No claim linkage = not claim support.
No scope or limitations = not useful for P3+ without manual review.
```

## Extension Fields

Extension fields are not required for minimum effective S2, but they affect purpose fit.

Recommended extension fields:

```text
issuer_domain
issuer_type_detail
report_id
certificate_id
valid_until
sample_source
selected_by
relationship_to_organization
covered_subject_type
covered_subject_id
source_snapshot_hash
translated_summary
machine_readable_extract
accreditation_reference
issuer_signature
issuer_organchor_signature
```

`unknown` is allowed for fields such as:

```text
sample_source
selected_by
relationship_to_organization
covered_subject_id
```

But `unknown` must be explicit. Hidden unknowns should become warnings.

## Verification Routes

Initial route families:

```text
VR-S2-001 ISSUER_ORIGIN_CONFIRMATION
VR-S2-002 PUBLIC_REGISTRY_CONFIRMATION
```

Generic route templates:

```text
issuer_origin_page
issuer_lookup_page
public_registry_record
report_or_certificate_lookup
platform_public_record
manual_document_reference
```

Custom routes may exist, but they should be downgraded:

```text
CUSTOM_UNVERIFIED_ROUTE = manual check only, not S2_2
```

## Mechanical Checks

OrgAnchor may run bounded mechanical checks.

Recommended check IDs:

```text
S2_CORE_FIELDS_PRESENT
S2_EXTERNAL_RECHECK_ANCHOR_PRESENT
S2_ROUTE_KNOWN
S2_CLAIM_REFS_RESOLVE
S2_HASH_PRESENT
S2_VALID_UNTIL_NOT_EXPIRED
S2_ANCHOR_URL_REACHABLE
S2_SCOPE_DECLARED
S2_LIMITATIONS_DECLARED
S2_SAMPLE_SOURCE_DISCLOSED
S2_SELECTED_BY_DISCLOSED
S2_RELATIONSHIP_DISCLOSED
S2_ISSUER_BACKING_PRESENT
```

Recommended check statuses:

```text
PASS
WARN
FAIL
MANUAL_CHECK_REQUIRED
NOT_APPLICABLE
```

Default boundary:

```text
OrgAnchor may check structure, hashes, dates, route names, claim references, and URL reachability.
OrgAnchor should not infer complex legal, scientific, regulatory, or procurement sufficiency.
```

## Purpose Fit

Purpose guidance:

```text
P1 = S2 not required
P2 = S2 optional
P3 = requires effective S2 or method-backed evidence when ordinary procurement review needs external support
P4 = requires effective S2 plus sample/source/relationship disclosures, or exposes gaps
P5 = requires domain-specific external or regulatory evidence where applicable, plus visible S5 challenge route
```

`unknown` disclosures do not invalidate S2, but they reduce purpose fit for P4/P5.

## Agent Summary

Agent-facing outputs should avoid raw field overload.

Recommended compact summary:

```json
{
  "s2_summary": {
    "effective_s2_count": 2,
    "candidate_unverified_external_material_count": 1,
    "s2_state_counts": {
      "S2_1_GENERIC_ROUTE_PROVIDED": 1,
      "S2_2_VERIFIED_ROUTE_CHECKED": 1,
      "S2_3_ISSUER_BACKED": 0
    },
    "expired_s2_count": 0,
    "broken_s2_anchor_count": 0,
    "manual_check_s2_count": 2,
    "unknown_sample_source_count": 1,
    "unknown_relationship_count": 0,
    "next_actions": [
      "Review whether S2 evidence scope covers the target product or service claim.",
      "Request sample source and selected_by disclosure before high-value procurement reliance."
    ],
    "not_a_trust_decision": true
  }
}
```

Per-claim output may include:

```text
effective_s2_refs
candidate_unverified_external_material_refs
s2_gaps
remaining_policy_questions
```

## First Implementation Slice

The implemented basic-usable S2 slice includes:

1. Accept optional `s_class` and `s2` metadata in evidence items.
2. Generate template snippets with `organchor evidence s2 template`.
3. Attach S2 metadata with `organchor evidence s2 attach`.
4. Add S2 Core checks to `organchor value audit`.
5. Downgrade unanchored third-party-looking material to `CANDIDATE_UNVERIFIED_EXTERNAL_MATERIAL`.
6. Add `s2_summary` to value audit JSON and compact `verify url` output.
7. Treat URL and registry route checking as bounded optional checks, not required for the first local-only pass.

Not implemented in the first slice:

```text
global route adapter registry
issuer reputation scoring
full PDF semantic parsing
legal coverage analysis
network registry checks
issuer-backed signature workflows
transparent observation logs
automatic dispute arbitration
```

## Acceptance Rule

This S2 model succeeds if an external agent can quickly answer:

```text
Which third-party-looking materials are not effective S2?
Which S2 materials have external recheck anchors?
Which claims does each S2 item supposedly support?
What scope and limitations did the organization declare?
Are dates, links, or anchors obviously stale or broken?
What still requires external policy review?
```

It fails if:

```text
an uploaded PDF is treated as effective S2 without an external anchor;
OrgAnchor implies that S2 proves the organization is trustworthy;
optional context becomes hidden mandatory paperwork for low-risk uses;
agents must inspect raw documents before seeing obvious S2 gaps.
```
