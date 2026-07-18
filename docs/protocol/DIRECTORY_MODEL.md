# OrgAnchor Directory Model

Status: Bounded alpha tooling implemented; broad independent Directory adoption remains future work and is not a stable-v1 completion gate.

## Purpose

OrgAnchor solves the verifiability problem for one organization:

```text
Can this public entry point be linked to a signed root authority, statements, evidence, receipts, and migration history?
```

A directory solves a different problem:

```text
How can a person, organization, platform, or AI agent discover many OrgAnchor-enabled organizations without relying on one monopoly marketplace?
```

The OrgAnchor Directory is therefore an open discovery index, not a certification authority.

The Directory is built on top of the OrgAnchor Beacon model. A Beacon is the origin-owned machine-readable signal emitted by each adopter; a Directory is a shared cache or index of Beacon-derived summaries.

## Core Position

The Directory should help third-party AI agents cheaply find and pre-check OrgAnchor public packages.

It must not become:

```text
a paid trust badge
a final ranking authority
a closed marketplace
a central gatekeeper
a replacement for each organization's own /.well-known/organchor.json
a prerequisite for native discoverability
```

The trust path must always return to the adopting organization's own root authority, signed statements, hashes, evidence manifests, and migration history.

## Why A Directory Exists

In theory, an AI agent can crawl the web directly and look for:

```text
/.well-known/organchor.json
/verify/organchor.json
```

That direct path should remain supported.

`docs/protocol/ORGANCHOR_BEACON.md` records this direct path as a first-class product layer. The Directory should make discovery cheaper, not make direct discovery unnecessary.

In practice, discovery still has costs:

- finding candidate organizations
- avoiding repeated crawling
- filtering spam and dead endpoints
- grouping by category, region, language, or capability
- comparing many suppliers for a buyer's need
- giving agents a small first-pass object before they fetch full evidence

The Directory exists to reduce those costs without owning the final trust decision.

It is best understood as:

```text
Directory = shared Beacon sweep result
```

## What A Directory Record Is

A directory record is a small index entry about an OrgAnchor package.

It stores summary facts and pointers. It does not store the full evidence body by default.

Directory records should eventually expose Discovery Units: product/service-family-level discovery objects with featured sellable units, coverage profiles, disclosure maturity, and coverage previews. This avoids two bad extremes:

```text
organization-only discovery = too broad
SKU-level discovery = too noisy and expensive
```

See `docs/protocol/DISCOVERY_UNIT_MODEL.md`.

Minimal record shape:

```json
{
  "type": "OrgAnchorDirectoryRecord",
  "version": "0.1",
  "origin": "https://example.org",
  "well_known_url": "https://example.org/.well-known/organchor.json",
  "verify_index_url": "https://example.org/verify/organchor.json",
  "organization": {
    "name": "Example Org",
    "display_name": "Example Organization"
  },
  "root_authority_hash": "sha256:<hash>",
  "statement_hash": "sha256:<hash>",
  "identity_status": "PASS",
  "value_status": "PASS",
  "policy_route": {
    "route": "EXTERNAL_POLICY_REVIEW",
    "policy_owner": "EXTERNAL_AGENT"
  },
  "evidence_summary": {
    "unsupported_claims": 0,
    "total_evidence_items": 12,
    "third_party_claims": 2,
    "reproducible_claims": 1,
    "manual_checks": 5
  },
  "carriers": {
    "website": true,
    "ipfs": true,
    "arweave": true,
    "opentimestamps": true,
    "onion": false,
    "ens": false
  },
  "tags": ["software", "security"],
  "regions": ["global"],
  "discovery_units": [
    {
      "unit_id": "signed-endpoint-verification-api",
      "name": "Signed endpoint verification API",
      "capability_tags": ["identity-continuity", "agent-verification"],
      "disclosure_maturity": "M2_CLAIM_BACKED",
      "featured_units": [
        {
          "featured_unit_id": "open-source-cli",
          "subject_type": "service_plan",
          "subject_id": "open-source-cli",
          "name": "Open-source CLI",
          "featured_reason": "organization_featured",
          "disclosure_maturity": "M3_EVIDENCE_BACKED"
        }
      ],
      "coverage_profile": {
        "coverage_mode": "partial_catalog",
        "catalog_url": "https://example.org/verify/discovery-units.json",
        "catalog_hash": "sha256:<hash>"
      },
      "coverage_preview": {
        "match_granularity": "service_family",
        "coverage_level": "family_broad",
        "catalog_mode": "partial_list",
        "included_services": ["open-source-cli", "hosted-api"],
        "excluded_scope": ["hosted marketplace", "custodial identity wallet"],
        "requires_drilldown_for": ["pricing", "deployment model", "service-level terms"]
      }
    }
  ],
  "last_seen_at": "2026-05-22T00:00:00Z",
  "last_verified_at": "2026-05-22T00:00:00Z",
  "limitations": [
    "Directory record is a summary only.",
    "Final trust decision belongs to the external reviewer or agent."
  ]
}
```

## Directory Node

A Directory node is any publisher of directory records.

It may be run by:

- the official OrgAnchor project
- a community mirror
- an industry association
- an auditor
- a buyer network
- a research group
- a regional ecosystem

Multiple Directory nodes should be normal. A healthy ecosystem has competing and cross-checkable indexes rather than one gatekeeper.

## Directory Feed And Snapshot

A Directory node should publish small signed exports:

```text
directory-feed.ndjson
directory-snapshot.json
directory-policy.json
directory-signature.json
```

Recommended roles:

- `directory-feed.ndjson`: append-friendly record stream.
- `directory-snapshot.json`: current aggregated view.
- `directory-policy.json`: crawl, inclusion, exclusion, ranking, and payment policy.
- `directory-signature.json`: signature over the exported snapshot or feed hash.
- `health-observations.ndjson`: optional structured package-health observations produced by Directory sweeps or accepted external observations.

Large evidence files do not belong in the default Directory snapshot. The Directory records links, hashes, verification summaries, and raw-availability state.

If a Directory profits from recommendation, ranking, procurement support, or curated discovery, it may also operate or fund an Evidence Vault for the organizations it covers. That vault role is optional, but the Directory must be explicit:

```text
which raw evidence it stores;
which raw evidence it only links to;
which raw evidence is request-restricted;
which raw evidence has expired, been withdrawn, been lost, or is disputed.
```

This follows `docs/protocol/EVIDENCE_RETENTION_REALITY_PRINCIPLE.md`: a Directory is not required to preserve every raw bundle, but it must not hide missing or degraded raw availability.

## Cost Model

The Directory should stay cheap by design:

- store summaries, not evidence bodies
- publish static snapshots
- use CDN/static hosting for normal reads
- mirror snapshots to IPFS when useful
- archive important snapshot hashes or releases to Arweave/OpenTimestamps/Bitcoin anchors when useful
- let anyone fork or mirror the feed
- let anyone rebuild comparable records from public Beacons

The default Directory should not require a database server, account system, or heavy storage backend.

If a richer search service is added later, it should be an optional convenience layer over exportable data.

## Anti-Capture Rules

An official OrgAnchor Directory, if one exists, is a reference Directory node. It has no protocol privilege.

OrgAnchor does not issue organization IDs, grant OrgAnchor status, or make official Directory inclusion a condition of adoption. A complete adopter can publish an origin-owned Beacon and verifiable package without asking the OrgAnchor project for approval.

The official OrgAnchor Directory, if built, should follow these rules:

1. Export all public records in machine-readable form.
2. Publish the inclusion and ranking policy.
3. Keep paid placement, if ever introduced, separate from verification status.
4. Never treat payment as stronger trust.
5. Allow mirrors and forks.
6. Keep each organization's own OrgAnchor package as the source of truth.
7. Make stale, unreachable, failed, or manually limited records visible instead of silently hiding them.
8. Let external agents apply their own policy.

These rules are meant to prevent the discovery layer from capturing the value of the verification layer.

Third-party Directory nodes may use the same OrgAnchor data formats while applying their own explicit inclusion, exclusion, filtering, update-frequency, category, region, health, payment, and display rules. This is normal. A Directory policy only explains how that Directory produced its records; it does not define whether an organization is a valid OrgAnchor adopter.

## Relationship To AI Agents

The Directory is a low-cost discovery aid for agents.

Expected agent flow:

```text
search directory snapshot
select candidate records
fetch each organization's own /.well-known/organchor.json
run organchor verify url <origin> --compact
fetch full result or evidence only when needed
apply the agent's own policy
```

The Directory should reduce search cost. It should not replace direct verification.

Agents that distrust all Directory nodes should still be able to run their own Beacon sweeps and build a local database.

Directory nodes should record verifier-derived `conformance_status` values. They must not promote an origin from `CLAIMED_SIGNAL` or `BEACON_SHAPE_PASS` to full adoption based on self-declared Beacon fields.

Directory nodes that publish health observations should treat them as operational findings, not trust judgments. A Directory may expose broken links, expired evidence, hash mismatches, stale packages, reproduction status, and observation state counts. It should also publish how often it sweeps, which checks it performs, whether it accepts external observations, and whether it reproduces observations before marking them confirmed.

Demand-side agents should not need to implement this from scratch. The planned low-friction path is:

```bash
organchor observation lookup https://example.org --directory directory-snapshot.json
organchor health inspect https://example.org --out health-observation.json
```

## Current And Future CLI Shape

Implemented commands:

```bash
organchor directory inspect https://example.org
organchor directory add --origins directory-origins.json --origin https://example.org --category software --capability identity-continuity
organchor directory build --origins examples/directory/directory-origins.json --out public/directory
organchor directory build --beacon-index beacon-index.json --node-origin https://directory.example --out public/directory
organchor directory verify --snapshot public/directory/directory-snapshot.json
organchor directory fetch https://example.org
organchor directory compare --snapshots directory-a.json,directory-b.json
organchor directory export --snapshot public/directory/directory-snapshot.json --format ndjson
organchor beacon inspect https://example.org
organchor beacon sweep --seeds seeds.txt --out discovered-organchor.ndjson
```

`directory add` only maintains a static candidate source file. It does not mark the candidate as verified; use `directory build --verify-origins` or direct origin verification before relying on the record.

Generated Directory policy files explicitly record inclusion, exclusion, ranking, payment, stale-record, and mirroring rules. The important rule is stable: Directory inclusion helps discovery, but it never replaces direct origin verification and never becomes proof that a supplier is best.

The first implementation prefers static files over a hosted service.

Planned package-health commands:

```bash
organchor health inspect https://example.org --out health-observation.json
organchor observation lookup https://example.org --directory directory-snapshot.json
```

## Implementation Track

### Phase 0: Boundaries - Complete

Record the Directory model and boundaries.

No v1 release should be blocked on Directory implementation.

### Phase 1: Static Reference Snapshot - Complete

Create a small manually curated snapshot that includes OrgAnchor's own self-pilot and a few test/example records.

### Phase 2: CLI Builder - Bounded Alpha Complete

The alpha can maintain candidate sources, optionally verify origins, build and
verify static snapshots, fetch and inspect published snapshots, and export
records. Snapshot signing by a Directory authority is not yet a general
interoperable workflow.

### Phase 3: Federated Nodes - Partial

Support comparison between independent Directory nodes:

```text
Which records overlap?
Which records disagree?
Which records are stale?
Which policy included or excluded a record?
```

`organchor directory compare --snapshots a.json,b.json` implements the first static comparison path. It is a consistency check, not a ranking or trust decision. It helps agents see whether independent Directory nodes agree on listed origins and whether cached root authority hash, statement hash, identity status, value status, or policy route disagree. Any selected origin still requires direct origin verification.

## Success Criteria

The Directory direction is successful if:

- agents can find candidates faster
- records remain verifiable back to origin
- snapshots are easy to mirror and fork
- records can be rebuilt from origin-owned Beacons
- evidence storage costs stay with the organization or chosen carriers
- the official OrgAnchor project does not become a trust monopoly
- paid discovery, if it ever exists, cannot pretend to be verification

## Non-Goals

The Directory does not:

- certify that an organization is good
- decide the best supplier for a buyer
- host all evidence files
- replace search engines
- replace marketplaces
- replace legal due diligence
- become the identity root

It is an open discovery layer over verifiable public identity and evidence packages.
