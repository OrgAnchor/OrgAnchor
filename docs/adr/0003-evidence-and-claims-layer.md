# ADR 0003: Add an Evidence and Claims Layer

## Status

Accepted

## Context

OrgAnchor originally focused on organizational identity continuity:

```text
root authority -> signed official endpoint statement -> carriers and archives
```

This proves where an organization says its official online entry points are. But a real organization also needs to present products, services, claims, proof materials, audits, reports, demos, and historical evidence.

If OrgAnchor only verifies official endpoints, it helps users find the organization but does not help them evaluate the organization's substantive claims.

Future AI agents are likely to be major verifiers of organizational claims. They need structured, machine-readable, hash-verifiable evidence rather than only human-facing web pages.

## Decision

OrgAnchor will include an Evidence and Claims Layer as part of the Stage 3 self-pilot milestone.

The layer will use signed manifests:

```text
claims/product-claims.json
claims/product-claims.json.sig
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
```

Large files are not embedded in the manifests. They are stored on carriers such as HTTPS, IPFS, Arweave, Git releases, or object storage. The manifests store hashes, locations, provenance metadata, and claim-evidence relations.

## Consequences

Benefits:

- OrgAnchor can prove both official endpoints and signed claim/evidence history.
- AI agents can evaluate claims and retrieve supporting artifacts.
- Large evidence files remain outside the signed JSON while still being hash-bound.
- The OrgAnchor self-pilot can demonstrate real value beyond endpoint continuity.

Costs:

- Stage 3 becomes larger.
- Additional schemas and commands are needed.
- Documentation must clearly state that OrgAnchor verifies publication and integrity, not objective truth.

## Non-Goals

OrgAnchor does not automatically prove product effectiveness.

OrgAnchor does not rank truthfulness of claims in v1.

OrgAnchor does not replace auditors, regulators, laboratories, user testing, scientific validation, or expert review.

OrgAnchor does not require full Verifiable Credentials, JSON-LD, or C2PA processing in v1.

## References

- EVIDENCE_MODEL.md
- W3C Verifiable Credentials Data Model 2.0: https://www.w3.org/TR/vc-data-model-2.0/
- W3C PROV-O: https://www.w3.org/TR/prov-o/
- C2PA specifications: https://spec.c2pa.org/specifications/specifications/2.4/index.html
- Schema.org Product: https://schema.org/Product
