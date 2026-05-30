# OrgAnchor Evidence Model

Status: Accepted model; core claims/evidence commands, value audit, and `/verify` publication are implemented for alpha. `CLAIMS_EVIDENCE_PROTOCOL.md` is the stricter protocol baseline for claim support levels, reproducible methods, third-party attestations, and challenges.

## Purpose

OrgAnchor must not only help an organization prove where its official endpoints are. A real organization also needs to make its products, services, claims, proof materials, and historical evidence verifiable.

The Evidence Model defines how OrgAnchor represents product/service claims and supporting materials in a way that is:

- Signed by the organization root authority or an authorized evidence signing key.
- Machine-readable for AI agents.
- Hash-addressed so files cannot be silently replaced.
- Storage-efficient for large files.
- Compatible with websites, IPFS, Arweave, object storage, Git releases, and other carriers.
- Honest about what can and cannot be proven.

## Core Position

OrgAnchor can prove:

```text
This organization published this claim/evidence manifest.
This manifest existed in this signed form.
These listed artifacts had these hashes, locations, issuers, dates, and relations to claims.
```

OrgAnchor cannot automatically prove:

```text
The product works.
The claim is objectively true.
The evidence is scientifically sufficient.
The third party is trustworthy.
The customer case is representative.
```

OrgAnchor makes evidence verifiable and inspectable. It does not replace testing, auditing, regulation, expert judgment, or real-world validation.

This means current `value_status` or value audit output must not be read as "the product is true" or "the organization is good." It is closer to:

```text
claim support structure is present or missing;
evidence artifacts are linked or absent;
hashes and signatures verify or fail;
reproducibility, freshness, issuer type, and limitations are visible.
```

See `CLAIMS_EVIDENCE_PROTOCOL.md` for the protocol direction that turns claims into scoped, method-backed, attestable, and challengeable units.

## Value Orientation

The evidence layer carries an important part of OrgAnchor's spirit.

OrgAnchor should shift attention away from spectacle and toward inspectable claims:

```text
What is being claimed?
Who published the claim?
What evidence is offered?
What are the limits of the evidence?
What changed or was corrected later?
Can people and AI agents verify the artifact trail?
```

This does not turn OrgAnchor into a moral judge. It does make the tool more useful for organizations that want to be accountable over time instead of merely polished in the moment.

See `VALUE_CONTINUITY_MODEL.md` for the broader claim/evidence/outcome/correction chain and the `organchor value audit` command.

## Relationship to Existing OrgAnchor Artifacts

```text
root-authority.json
  -> who may speak for the organization

official-endpoints.json
  -> where the organization says its official entry points are

claims/product-claims.json
  -> what the organization claims about its products or services

evidence/evidence-manifest.json
  -> which artifacts support, contextualize, qualify, or challenge those claims

organchor.lock.json
  -> where these artifacts were published and what receipts were produced
```

The official endpoint statement should stay small. Product claims and evidence should live in their own signed manifests.

## Stage Placement

Evidence manifests are part of Stage 3.

Stage 3 becomes:

```text
Publishing Receipts, IPFS, Arweave, OpenTimestamps, and Evidence Manifests
```

Reason:

The OrgAnchor self-pilot should prove more than "this project has official endpoints." It should also prove that OrgAnchor's own project brief, architecture, threat model, cryptography policy, technical decisions, roadmap, and pilot plan are part of a signed and hash-verifiable evidence chain.

## File Layout

Recommended v1 layout:

```text
claims/product-claims.json
claims/product-claims.json.sig

evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig

evidence/artifacts/
  project-brief.md
  architecture.md
  threat-model.md
  crypto-policy.md
  technical-decisions.md
  roadmap.md
```

The large files or source artifacts may also live outside the repository:

```text
https://example.org/evidence/...
ipfs://...
ar://...
https://github.com/.../releases/...
s3:// or object storage URLs, if publicly resolvable through HTTPS mirrors
```

The signed manifests contain references, hashes, metadata, and relations.

## Product Claims Manifest

`claims/product-claims.json` answers:

```text
What does the organization claim about its product or service?
```

Recommended shape:

```json
{
  "schema": "https://organchor.org/schemas/product-claims.v1.json",
  "type": "OrgAnchorProductClaims",
  "version": "1.0",
  "statement_id": "organchor-claims-2026-001",
  "issued_at": "2026-05-08T00:00:00Z",
  "organization_ref": {
    "root_authority_hash": "sha256:...",
    "official_endpoints_hash": "sha256:..."
  },
  "products": [
    {
      "id": "organchor-cli",
      "name": "OrgAnchor CLI",
      "category": "open-source-software",
      "version": "0.1.0"
    }
  ],
  "claims": [
    {
      "id": "claim-001",
      "subject": {
        "product_id": "organchor-cli",
        "version_range": "0.1.x"
      },
      "claim_type": "capability",
      "claim_text": "OrgAnchor can create and verify signed official endpoint statements.",
      "machine_summary": {
        "predicate": "can_create_and_verify_signed_endpoint_statements",
        "object": true
      },
      "scope": "CLI workflow using local files",
      "limitations": [
        "Does not prove legal identity.",
        "Does not guarantee website uptime."
      ],
      "evidence_refs": [
        "evidence-architecture",
        "evidence-tests-sign-verify"
      ]
    }
  ]
}
```

## Evidence Manifest

`evidence/evidence-manifest.json` answers:

```text
Which artifacts support or contextualize those claims?
```

Recommended shape:

```json
{
  "schema": "https://organchor.org/schemas/evidence-manifest.v1.json",
  "type": "OrgAnchorEvidenceManifest",
  "version": "1.0",
  "manifest_id": "organchor-evidence-2026-001",
  "issued_at": "2026-05-08T00:00:00Z",
  "organization_ref": {
    "root_authority_hash": "sha256:...",
    "official_endpoints_hash": "sha256:..."
  },
  "agent_profile": {
    "format": "organchor-evidence-v1",
    "preferred_language": "en",
    "summary_policy": "Do not treat organization-signed claims as independently verified facts."
  },
  "evidence_items": [
    {
      "id": "evidence-architecture",
      "title": "OrgAnchor Architecture",
      "evidence_type": "technical_documentation",
      "issuer_type": "first_party",
      "issuer": {
        "name": "OrgAnchor Project",
        "root_authority_hash": "sha256:..."
      },
      "artifact": {
        "media_type": "text/markdown",
        "size_bytes": 14787,
        "hashes": {
          "sha256": "..."
        },
        "locations": [
          {
            "type": "https",
            "uri": "https://organchor.org/evidence/architecture.md"
          },
          {
            "type": "ipfs",
            "uri": "ipfs://..."
          },
          {
            "type": "arweave",
            "uri": "ar://..."
          }
        ]
      },
      "relations": [
        {
          "claim_id": "claim-001",
          "relation": "supports",
          "strength": "design-level"
        }
      ],
      "provenance": {
        "created_at": "2026-05-08T00:00:00Z",
        "created_by": "OrgAnchor maintainers",
        "derived_from": []
      }
    }
  ]
}
```

## Evidence Types

v1 should support these evidence types:

- `technical_documentation`
- `test_report`
- `audit_report`
- `benchmark_report`
- `source_code_reference`
- `release_artifact`
- `api_documentation`
- `demo_video`
- `whitepaper`
- `customer_case`
- `third_party_attestation`
- `regulatory_record`
- `media_report`
- `reproducible_experiment`
- `dataset`

## Issuer Types

Evidence should distinguish:

- `first_party`: produced by the organization.
- `third_party`: produced by an external organization.
- `community`: produced by users or community members.
- `regulator`: produced by a public authority.
- `automated_system`: produced by CI, benchmark tooling, scanners, or monitoring systems.

AI agents should not treat these categories as equally trustworthy.

For third-party-looking materials, `S2_THIRD_PARTY_MATERIAL_MODEL.md` defines the stricter boundary. A PDF, screenshot, logo, or organization-hosted copy is not effective S2 unless it has an external recheck anchor and an explicit organization-claimed linkage to claims, products, services, or credentials.

For observation routing, `OBSERVATION_ROUTING_GUIDE.md` defines the recommended distinction between S3 sample conformance, S4 performance continuity, mixed records, and unclear records.

For real market or customer-site sample acquisition, `S3_RANDOM_SAMPLING_MODEL.md` defines the stricter S3 boundary. `S3_SAMPLE_RECORD_SPEC.md` defines standalone S3 Event and Sample Set JSON shapes. S3 is for externally controlled sample facts, not reviews or broad delivery-performance claims.

For real delivery, real use, supply continuity, support, repair, monitoring, and field-operation observations, `S4_REAL_WORLD_OBSERVATION_MODEL.md` defines the S4 boundary. S4 should remain separate from S3 so a sample test is not misread as long-term supply continuity, and ordinary delivery observations are not misread as product sample tests.

## Claim Relations

Evidence can relate to a claim in different ways:

- `supports`
- `partially_supports`
- `contextualizes`
- `qualifies`
- `contradicts`
- `supersedes`
- `reproduces`
- `measures`

This is important because not every artifact is simple proof. Some evidence narrows a claim, explains a limitation, or replaces older evidence.

## AI Agent Requirements

The evidence layer should be easy for AI agents to evaluate.

Required properties:

- Stable IDs for claims and evidence items.
- Explicit product and version scope.
- Explicit issuer type.
- Explicit relation between evidence and claim.
- Explicit artifact media type.
- Explicit hash for every referenced artifact.
- Explicit locations for retrieval.
- Explicit limitations and caveats.
- Explicit machine-readable summaries.
- Explicit warning that first-party claims are not independent verification.

AI agents should be able to answer:

```text
What does this organization claim?
Which artifacts support each claim?
Are the artifacts still retrievable?
Do retrieved artifacts match their hashes?
Are any artifacts independently issued?
Are claims scoped to a specific product version?
Are there stated limitations?
Have any claims or evidence items been superseded?
```

## Storage Strategy

Large files should not be embedded in claims or evidence manifests.

Use:

- HTTPS for normal web access.
- IPFS for content-addressed mirroring.
- Arweave for long-term archival of key artifacts and manifests.
- Git releases or tags for source-code-related evidence.
- Object storage for large media, mirrored by hash and optionally IPFS/Arweave.

The manifest stores:

- Hashes.
- Content size.
- Media type.
- Locations.
- Provenance metadata.
- Relation to claims.

## Stage 3 Carrier Strategy

Stage 3 uses a layered carrier strategy:

```text
website /verify = discovery and human-readable entry
IPFS = content-addressed mirror and CID verification
Arweave = long-term archive for critical manifests and selected artifacts
OpenTimestamps / Bitcoin = public time anchor for key hashes
object storage / CDN / Git releases = practical hosting for large artifacts
organchor.lock.json = local publish receipt ledger
```

No carrier is the identity root. The root authority and signed manifests remain the trust basis.

### Website `/verify`

The website is the main real-world discovery entry.

Recommended layout:

```text
public/verify/index.html
public/verify/organchor.json
public/verify/root-authority.json
public/verify/official-endpoints.json
public/verify/official-endpoints.json.sig
public/verify/claims/product-claims.json
public/verify/claims/product-claims.json.sig
public/verify/evidence/evidence-manifest.json
public/verify/evidence/evidence-manifest.json.sig
```

`organchor.json` acts as an AI-agent-friendly index.

It should point to:

- Root authority record.
- Official endpoint statement.
- Product claims manifest.
- Evidence manifest.
- Signature files.
- IPFS CIDs.
- Arweave TX ids.
- OpenTimestamps proof paths.
- Bitcoin anchor status.
- Verification instructions.
- Expected hashes.

Reason:

- Traditional websites remain the easiest entry point for humans and crawlers.
- `/verify` keeps the verification surface predictable.
- AI agents should not have to scrape arbitrary marketing pages to find machine-readable trust artifacts.

Limit:

- The website is a discovery carrier, not a trust root.
- A compromised website can present misleading pages, so independent signature verification remains necessary.

### IPFS

IPFS is the Stage 3 mirror and content-addressing carrier.

Recommended content:

- Entire `public/verify` directory.
- `product-claims.json`.
- `evidence-manifest.json`.
- Small verification assets.
- Independent CIDs for large evidence artifacts only when their availability strategy and cost are intentional.

Reason:

- CID binds content to its bytes.
- AI agents can compare CID content with manifest hashes.
- IPFS is useful for mirroring when the traditional website is unavailable.

Limit:

- IPFS does not guarantee availability.
- Content should be pinned or mirrored elsewhere.
- CID equality proves content identity, not claim truth.
- The default IPFS mirror should stay small. Large media and datasets should be listed in the evidence manifest as independently hosted artifacts.

### Arweave

Arweave is the Stage 3 archival carrier.

Recommended content:

- `root-authority.json`.
- `official-endpoints.json`.
- `official-endpoints.json.sig`.
- `product-claims.json`.
- `product-claims.json.sig`.
- `evidence-manifest.json`.
- `evidence-manifest.json.sig`.
- Selected small, public, final project or product evidence artifacts.
- Important signed version snapshots.

Reason:

- Arweave is useful for long-term archival of high-value public records.
- It can preserve critical manifests even if websites or IPFS pins disappear.
- TX ids can be recorded in `organchor.lock.json`.
- Its protocol is based on one-time upload economics and a storage endowment rather than ordinary monthly renewal.

Limit:

- OrgAnchor must not market Arweave as making identity permanent.
- Arweave should be described as a long-term archival carrier, not as an absolute permanence guarantee.
- The long-term durability model depends on network economics, storage incentives, and continued protocol viability.
- Very large media may be expensive or inefficient to archive fully.
- Gateway access and upload providers are external dependencies.
- A gateway URL such as `https://arweave.net/<txid>` is an access path, not the storage guarantee itself.
- Arweave is append-only. A bad upload should be corrected by a later signed statement or manifest, not by assuming the old object can be modified.
- Large media, private evidence, and non-final drafts should not be uploaded by default.

### Object Storage, CDN, and Git Releases

Large artifacts may live on ordinary infrastructure:

- HTTPS website/CDN.
- Object storage such as S3 or R2.
- GitHub or GitLab releases.
- Package registries where appropriate.

Reason:

- Large files such as videos, datasets, binaries, or many images may be impractical to store entirely in Arweave or publish only through IPFS.
- Ordinary hosting is cheap and operationally familiar.
- Hashes in the evidence manifest prevent silent replacement from going undetected.

Limit:

- URLs can rot.
- Providers can remove content.
- These locations should be treated as retrieval options, not trust roots.

### `organchor.lock.json`

The lockfile records publish receipts:

- Artifact hash.
- IPFS CID.
- Arweave TX id.
- Provider name.
- Timestamp.
- Verification status.

Reason:

- Publishing produces receipts that should be tracked.
- The lockfile helps reproduce and audit what was published.

Limit:

- The lockfile is not a trust root.
- It can help find evidence, but signatures and hashes decide validity.

## Carrier Selection Rationale

This design is intentionally hybrid.

It avoids three weak extremes:

- Website-only: easy to discover but fragile and mutable.
- IPFS-only: content-addressed but availability depends on pinning.
- Arweave-only: strong archival story for key records but not always practical for all large artifacts.

The recommended pattern is:

```text
signed manifests are small and widely mirrored
large artifacts are externally hosted
every artifact is hash-bound
critical artifacts are archived
publish receipts are recorded
AI agents read the manifests first
```

This keeps the system practical while preserving verifiability.

## Arweave Positioning Rule

Use this wording:

```text
Arweave is used as a long-term append-only archival carrier with one-time upload economics.
```

Avoid this wording:

```text
Arweave guarantees permanent identity.
Arweave makes the organization permanent.
Published forever.
```

The OrgAnchor identity root remains the root authority. Arweave TX ids are archival receipts and retrieval references.

Corrections are handled by publishing a new signed statement or manifest that supersedes the older one. Arweave is not the current truth layer and not the general evidence storage backend.

### OpenTimestamps / Bitcoin

OpenTimestamps is the Stage 3 time-anchor carrier.

Recommended content:

- Hashes of root authority records.
- Hashes of official endpoint statements.
- Hashes of statement signatures.
- Hashes of claims manifests.
- Hashes of evidence manifests.
- Hashes of Arweave manifests.

Reason:

- It proves that a hash existed before a Bitcoin block time.
- It does not require storing the file content in Bitcoin.
- It complements Arweave: Arweave helps retrieve historical content, while OpenTimestamps/Bitcoin helps prove when the content hash existed.

Limit:

- It does not prove that a claim is true.
- It does not prove that an organization is trustworthy.
- A newly stamped proof may be pending until upgraded.
- Public calendar servers and Bitcoin API providers are access paths, not OrgAnchor trust roots.
- It is not a storage layer and not an identity root.

## Future Optimization Points

Future versions may revisit:

- Which artifacts should be automatically archived to Arweave.
- Whether large media should be chunked or packaged with CAR files.
- Whether to support dedicated dataset repositories.
- Whether to support C2PA manifests for media files.
- Whether to support W3C Verifiable Credentials for third-party attestations.
- Whether to support richer provenance graphs using PROV-O or JSON-LD.
- Whether to support additional timestamping services beyond OpenTimestamps.
- Whether to support trust scoring for evidence issuers.
- Whether to support AI-agent retrieval profiles for cost-aware verification.

These optimizations should not change the core principle:

```text
claims and evidence are signed manifests; carriers store bytes; hashes connect them.
```

## Signature Strategy

Both manifests should be signed:

```text
claims/product-claims.json.sig
evidence/evidence-manifest.json.sig
```

v1 can use the same root authority used for official endpoint statements.

Future versions may support delegated evidence signing keys authorized by the root authority.

## Compatibility Strategy

OrgAnchor should use plain JSON plus JSON Schema as the v1 enforcement layer.

It may include optional compatibility fields inspired by:

- Schema.org Product, Review, and ClaimReview vocabulary.
- W3C PROV-O provenance concepts.
- W3C Verifiable Credentials for third-party attestations.
- C2PA Content Credentials for media provenance.

OrgAnchor should not make full JSON-LD processing or Verifiable Credentials mandatory in v1.

Reason:

- AI agents can parse plain JSON reliably.
- JSON Schema validation is straightforward.
- RFC 8785 canonicalization stays simple.
- Full JSON-LD graph canonicalization would add complexity before the core model is proven.

## Commands

Recommended v1 commands:

```bash
organchor claims create
organchor claims sign
organchor claims verify

organchor evidence create
organchor evidence add
organchor evidence s2 template
organchor evidence s2 attach
organchor evidence sign
organchor evidence verify
organchor evidence hash
```

Stage 3 minimum:

- Create a product claims manifest.
- Create an evidence manifest.
- Sign both.
- Verify both.
- Include both in the verify page and publish receipts.

## Verification Boundary

When OrgAnchor verifies evidence, it checks:

- Manifest schema validity.
- Manifest signature validity.
- Root authority threshold satisfaction.
- Artifact hash matches.
- Locations are well-formed.
- Claims reference existing evidence items.
- Evidence items reference existing artifacts.

OrgAnchor does not decide:

- Whether the evidence is scientifically sufficient.
- Whether a benchmark is fair.
- Whether a customer case is representative.
- Whether a third-party issuer is trustworthy.

Those judgments can be assisted by AI agents, auditors, regulators, users, or domain experts.

## OrgAnchor Self-Pilot Evidence

The OrgAnchor self-pilot should include evidence items for:

- Project brief.
- Threat model.
- Architecture.
- Cryptography policy.
- Technical decisions.
- Roadmap.
- v1 acceptance criteria.
- Pilot plan.
- ADRs.
- Test reports when available.

This lets AI agents evaluate not only where OrgAnchor is located, but what OrgAnchor claims to be and which project artifacts support those claims.

## External References

- W3C Verifiable Credentials Data Model 2.0: https://www.w3.org/TR/vc-data-model-2.0/
- W3C PROV-O: https://www.w3.org/TR/prov-o/
- C2PA specifications: https://spec.c2pa.org/specifications/specifications/2.4/index.html
- Schema.org Product: https://schema.org/Product
- Schema.org ClaimReview: https://schema.org/ClaimReview
