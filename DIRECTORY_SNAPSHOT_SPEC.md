# OrgAnchor Directory Snapshot Specification

Status: Proposed post-v1 static discovery snapshot format; not a v1 completion blocker.

## Purpose

A Directory snapshot is a small, static, machine-readable discovery artifact.

It helps an AI agent answer:

```text
Which organizations should I verify next?
```

It must not answer:

```text
Which organization should I trust?
```

The snapshot exists to reduce discovery cost before direct origin verification begins.

## Relationship To Other Documents

This specification implements the first concrete artifact shape for:

- `PROJECT_NORTH_STAR.md`
- `DISCOVERY_STRATEGY.md`
- `DIRECTORY_MODEL.md`

The north star says OrgAnchor should lower the cost of finding, verifying, and understanding organizations without becoming the final trust authority.

The discovery strategy explains why discovery is needed.

The Directory model explains how open Directory nodes can exist.

This document defines the minimal static file those nodes can publish.

The Directory should be treated as an optional index over OrgAnchor Beacons. `ORGANCHOR_BEACON.md` defines the origin-owned signals that let adopters be found even before a Directory includes them.

## Core Boundary

A Directory snapshot is not a trust root.

It is a discovery aid that points back to origin-owned OrgAnchor packages:

```text
/.well-known/organchor.json
/verify/organchor.json
```

An agent that finds a record in a snapshot should still fetch the origin package and run direct verification.

Recommended first-pass command:

```bash
organchor verify url <origin> --compact
```

## Snapshot File

Recommended file name:

```text
directory-snapshot.json
```

Recommended media type:

```text
application/json
```

Recommended hosting:

```text
static website
CDN
GitHub Pages
Cloudflare Pages
IPFS mirror
Arweave release archive for important snapshots
```

The default path for an official Directory node may be:

```text
/directory/directory-snapshot.json
```

Organizations that publish a Directory should also expose a machine-readable pointer from their OrgAnchor verify index:

```text
/.well-known/organchor.json
/verify/organchor.json
```

The pointer field is:

```text
directory_discovery
```

This lets agents discover the Directory without relying on sitemap scanning or a human-supplied URL.

## Minimal Snapshot Shape

```json
{
  "type": "OrgAnchorDirectorySnapshot",
  "version": "0.1",
  "snapshot_id": "example-directory-2026-001",
  "generated_at": "2026-05-23T00:00:00.000Z",
  "directory_node": {
    "name": "Example Directory Node",
    "origin": "https://directory.example",
    "policy_url": "https://directory.example/directory-policy.json"
  },
  "trust_boundary": {
    "directory_is_trust_root": false,
    "final_trust_decision": "EXTERNAL_AGENT",
    "records_must_verify_at_origin": true
  },
  "records": []
}
```

## Required Top-Level Fields

### `type`

Must be:

```text
OrgAnchorDirectorySnapshot
```

### `version`

Format version of this snapshot shape.

The initial proposed version is:

```text
0.1
```

### `snapshot_id`

Directory-node-local identifier.

It should be stable for the published snapshot.

### `generated_at`

ISO 8601 timestamp for snapshot generation.

### `directory_node`

Identifies the Directory node that published the snapshot.

Required fields:

```text
name
origin
policy_url
```

### `trust_boundary`

Machine-readable warning that the snapshot is not the final authority.

Required fields:

```text
directory_is_trust_root = false
final_trust_decision = EXTERNAL_AGENT
records_must_verify_at_origin = true
```

### `records`

Array of `OrgAnchorDirectoryRecord` items.

## Minimal Record Shape

```json
{
  "type": "OrgAnchorDirectoryRecord",
  "version": "0.1",
  "record_id": "example-org",
  "origin": "https://example.org",
  "well_known_url": "https://example.org/.well-known/organchor.json",
  "verify_index_url": "https://example.org/verify/organchor.json",
  "organization": {
    "name": "Example Org",
    "display_name": "Example Organization"
  },
  "discovery": {
    "categories": ["software"],
    "capabilities": ["identity-continuity"],
    "regions": ["global"],
    "languages": ["en"]
  },
  "verification_summary": {
    "identity_status": "PASS",
    "value_status": "PASS",
    "policy_route": "EXTERNAL_POLICY_REVIEW",
    "root_authority_hash": "sha256:<hash>",
    "statement_hash": "sha256:<hash>",
    "last_verified_at": "2026-05-23T00:00:00.000Z"
  },
  "evidence_summary": {
    "total_evidence_items": 0,
    "third_party_claims": 0,
    "reproducible_claims": 0,
    "manual_checks": 0,
    "unsupported_claims": 0
  },
  "source": {
    "method": "manual | crawler | submitted | imported",
    "added_at": "2026-05-23T00:00:00.000Z"
  },
  "limitations": [
    "Directory record is a summary only.",
    "Agent must verify against the origin package before relying on it."
  ]
}
```

## Required Record Fields

### `origin`

Canonical organization origin.

Example:

```text
https://example.org
```

### `well_known_url`

Preferred discovery URL:

```text
https://example.org/.well-known/organchor.json
```

### `verify_index_url`

Fallback or direct verify index URL:

```text
https://example.org/verify/organchor.json
```

### `organization`

Human-readable organization identity summary.

This does not replace the signed statement.

### `discovery`

Machine-readable matching hints.

Initial fields:

```text
categories
capabilities
regions
languages
```

These fields are intentionally broad. They are meant for first-pass candidate discovery, not final ranking.

### `verification_summary`

Compact summary from the latest known verification pass.

Required fields:

```text
identity_status
value_status
policy_route
root_authority_hash
statement_hash
last_verified_at
```

This summary may be stale. Agents should verify the origin package directly before acting.

### `evidence_summary`

Small count-based evidence summary.

It should help agents decide whether to fetch full claims and evidence.

It must not claim that the evidence is sufficient.

### `source`

How the record entered the snapshot.

Expected values:

```text
manual
crawler
submitted
imported
```

### `limitations`

Plain-language warnings.

Every record should remind agents that the record is a summary and that direct origin verification is required.

## Agent Flow

An AI agent should use a snapshot like this:

```text
load directory-snapshot.json
filter records by discovery hints
discard records with failed or stale identity summaries if policy requires
fetch the selected origin's /.well-known/organchor.json
run organchor verify url <origin> --compact
fetch full verification or evidence only for shortlisted records
apply the demand-side party's own policy
```

The snapshot lowers the number of candidate origins an agent must inspect. It does not replace origin verification.

## Snapshot Freshness

Directory nodes should prefer explicit freshness fields:

```text
generated_at
record.source.added_at
record.verification_summary.last_verified_at
```

Agents should treat old snapshots as stale unless their own policy allows historical lookup.

## Signing And Hashing

The first static version may be unsigned if it is only an example.

Real Directory nodes should publish at least:

```text
directory-snapshot.json
directory-snapshot.json.sha256
directory-policy.json
```

Later versions may add:

```text
directory-snapshot.json.sig
directory-feed.ndjson
directory-feed.ndjson.sig
```

Directory signatures prove who published the snapshot. They do not prove that listed organizations are trustworthy.

## Anti-Capture Requirements

Directory snapshots should remain:

- exportable
- mirrorable
- forkable
- policy-explainable
- origin-verifiable

They should not require:

- paid inclusion
- exclusive official listing
- closed ranking rules
- one central API
- evidence files hosted by the Directory node

## Example

A minimal example snapshot is stored at:

```text
examples/directory/directory-snapshot.json
```

The matching build input is stored at:

```text
examples/directory/directory-origins.json
```

That example is not a real Directory service and does not identify a real organization. It exists to keep the static record shape testable.

## Reference CLI

The first executable MVP supports static build, optional origin verification, and snapshot verification:

```bash
organchor directory build \
  --origins examples/directory/directory-origins.json \
  --out public/directory \
  --generated-at 2026-05-23T00:00:00.000Z

organchor directory build \
  --origins examples/directory/directory-origins.json \
  --out public/directory \
  --verify-origins

organchor directory build \
  --beacon-index beacon-index.json \
  --node-origin https://directory.example \
  --out public/directory

organchor directory fetch https://example.org
organchor directory fetch https://example.org --out downloaded-directory-snapshot.json
organchor directory fetch https://example.org \
  --category software \
  --capability identity-continuity \
  --region global \
  --language en \
  --identity-status PASS \
  --value-status PASS,WARN \
  --limit 5

organchor directory compare \
  --snapshots directory-a.json,directory-b.json \
  --out directory-compare.json

organchor directory export \
  --snapshot public/directory/directory-snapshot.json \
  --format ndjson \
  --out directory-feed.ndjson

organchor directory inspect https://example.org

organchor directory verify \
  --snapshot public/directory/directory-snapshot.json
```

`directory build` writes:

```text
directory-snapshot.json
directory-snapshot.json.sha256
directory-policy.json
```

`directory build --verify-origins` fetches each listed origin's OrgAnchor package, reuses the same checks as `organchor verify url`, requires identity verification to pass, and writes crawler-derived hashes, status, evidence counts, and policy-route hints into the Directory record.

`directory build --beacon-index` converts a local `OrgAnchorBeaconLocalIndex` into a static Directory snapshot. This is the bridge between independent Beacon sweeping and forkable Directory publication. Records without both `root_authority_hash` and `statement_hash` are not usable as Directory records because selected candidates must still point agents back to verifiable origin-owned packages.

`directory inspect` fetches an organization's verify index, discovers `directory_discovery`, fetches the linked snapshot/hash/policy, validates the snapshot shape and trust boundary, and fails if the published hashes do not match.

`directory fetch` performs the same inspection checks, then outputs candidate records and the recommended next command for each candidate:

```text
organchor verify url <origin> --compact
```

Agents can filter fetched candidates before spending more verification work:

```text
--category <category>
--capability <capability>
--region <region>
--language <language>
--identity-status <PASS|FAIL|NOT_VERIFIED>
--value-status <PASS|WARN|FAIL|NOT_INCLUDED|NOT_VERIFIED>
--policy-route <route>
--limit <positive-integer>
```

Comma-separated values are supported for a single filter flag. Filtering only narrows the candidate list; it does not make the Directory a certification authority.

`directory verify` validates the snapshot shape, trust boundary, and origin-owned discovery links. It verifies the Directory artifact itself; agents should still fetch selected origins and run direct verification before acting.

`directory compare` compares two or more static snapshots. It reports overlapping origins, origins missing from some snapshots, and conflicts in cached root authority hash, statement hash, identity status, value status, and policy route. A conflict is not proof that either Directory is malicious; snapshots may be stale or generated with different policies. The required next step remains direct origin verification.

`directory export --format ndjson` writes one `OrgAnchorDirectoryRecord` per line. This makes Directory records cheap to mirror, merge, diff, archive, and import into independent Directory nodes without requiring a database server.

## Non-Goals

This specification does not define:

- a full search API
- marketplace bidding
- paid placement
- universal supplier scoring
- legal due diligence
- a global industry taxonomy
- a replacement for direct OrgAnchor verification

It defines the smallest useful static discovery file that can help an agent find candidates before verification.
