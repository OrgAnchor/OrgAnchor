# OrgAnchor Directory Model

Status: Proposed post-v1 design; accepted direction, not a v1 core requirement.

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

`ORGANCHOR_BEACON.md` records this direct path as a first-class product layer. The Directory should make discovery cheaper, not make direct discovery unnecessary.

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

Large evidence files remain at the organization's own locations. The Directory records links, hashes, and verification summaries.

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

## Future CLI Shape

Possible post-v1 commands:

```bash
organchor directory inspect https://example.org
organchor directory add https://example.org
organchor directory build --in directory-sources.json --out public/directory
organchor directory verify --snapshot public/directory/directory-snapshot.json
organchor directory export --format ndjson
organchor beacon inspect https://example.org
organchor beacon sweep --seeds seeds.txt --out discovered-organchor.ndjson
```

The first implementation should prefer static files over a hosted service.

## Roadmap

### Phase 0: Design Only

Record the Directory model and boundaries.

No v1 release should be blocked on Directory implementation.

### Phase 1: Static Reference Snapshot

Create a small manually curated snapshot that includes OrgAnchor's own self-pilot and a few test/example records.

### Phase 2: CLI Builder

Add commands that fetch candidate `/.well-known/organchor.json` files, run compact verification, and export a signed snapshot.

### Phase 3: Federated Nodes

Support comparison between independent Directory nodes:

```text
Which records overlap?
Which records disagree?
Which records are stale?
Which policy included or excluded a record?
```

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
