# OrgAnchor Beacon Layer

Status: Accepted product direction; partially implemented through existing `/.well-known/organchor.json`, `/verify/organchor.json`, and static verify-page generation.

## Purpose

The OrgAnchor Beacon layer exists so that every adopting organization can become natively discoverable on the open web.

Short form:

```text
Any adopter should emit enough public, machine-readable signals that agents can find it without depending on one official Directory.
```

This is a core value point, not a cosmetic add-on. If OrgAnchor only verifies organizations after someone already knows where to look, it lowers post-discovery verification cost but does not fully lower transaction cost.

The Beacon layer closes that gap.

## Core Thesis

OrgAnchor discovery should not depend on one central index.

The preferred model is:

```text
Beacon = each organization emits discoverable, verifiable signals from its own origin
Directory = any party can crawl, cache, filter, and republish Beacon-derived summaries
Agent = final verifier and policy decision maker
```

The Directory becomes a convenience layer over Beacons, not a prerequisite for being found.

## Design Goal

An AI agent representing a buyer, supplier, auditor, funder, researcher, or ecosystem builder should be able to spend a bounded amount of time and produce its own local database of OrgAnchor-enabled organizations.

That means a serious small organization can choose:

```text
low effort path = use the official Directory or a third-party Directory
higher effort path = run its own Beacon sweep and build its own database
```

Both paths must remain valid.

## What A Beacon Is

An OrgAnchor Beacon is not a new trust root.

It is a bundle of discoverability hints that point back to the organization's signed OrgAnchor package:

```text
origin URL
verify URL
machine-readable verify index
root authority hash
statement hash
capability and category hints
identity and value status summaries
freshness timestamps
direct verification command
```

The Beacon helps an agent find and triage the organization. The agent must still verify the signed package directly.

## Primary Beacon Surfaces

Every adopter should publish these first:

```text
/.well-known/organchor.json
/verify/organchor.json
/verify/index.html
```

`/.well-known/organchor.json` is the primary machine entrypoint.

`/verify/organchor.json` is the full machine-readable verification index.

`/verify/index.html` is the human-readable proof page and a fallback surface for crawlers that inspect ordinary HTML.

## Secondary Beacon Surfaces

To make the adopter easier to find across ordinary web tooling, OrgAnchor should also support:

```text
/sitemap.xml entry for /verify/ and /.well-known/organchor.json
/robots.txt sitemap hint
HTML <link> hint pointing to /verify/organchor.json
HTML structured data hint for the organization and verify URL
optional DNS TXT hint at _organchor.<domain>
optional GitHub topic or repository metadata for open-source projects
optional ENS, IPFS, Arweave, or other carrier pointers
```

These are discovery hints only. They do not replace signature verification.

## Recommended Beacon Object

The compact Beacon object should be small enough for cheap first-pass crawling:

```json
{
  "type": "OrgAnchorBeacon",
  "version": "1.0",
  "origin": "https://example.org",
  "verify_url": "https://example.org/verify/",
  "well_known_url": "https://example.org/.well-known/organchor.json",
  "verify_index_url": "https://example.org/verify/organchor.json",
  "root_authority_hash": "sha256:<hash>",
  "statement_hash": "sha256:<hash>",
  "organization": {
    "name": "Example Org",
    "display_name": "Example Organization"
  },
  "discovery": {
    "categories": ["software"],
    "capabilities": ["identity-continuity", "ai-agent-verification"],
    "regions": ["global"],
    "languages": ["en", "zh"]
  },
  "summary_status": {
    "identity_status": "PASS",
    "value_status": "PASS",
    "policy_route": "EXTERNAL_POLICY_REVIEW",
    "updated_at": "2026-05-24T00:00:00Z"
  },
  "agent_flow": {
    "first_pass": "organchor verify url https://example.org --compact",
    "deep_verify": "organchor verify url https://example.org",
    "trust_decision": "EXTERNAL_AGENT"
  }
}
```

The Beacon may be embedded inside `organchor.json` instead of existing as a separate file, as long as agents can discover it reliably.

## Beacon Sweep

A Beacon sweep is an agent or crawler process that tries to find OrgAnchor adopters directly.

Expected flow:

```text
collect seed domains from user input, search results, public lists, industry pages, code repositories, or existing Directory snapshots
try /.well-known/organchor.json
try /verify/organchor.json
inspect sitemap.xml and robots.txt hints
inspect homepage HTML hints when needed
validate the Beacon shape
run organchor verify url <origin> --compact
store origin, hashes, statuses, capabilities, evidence summary, and freshness in a local database
revisit periodically
```

This makes OrgAnchor useful even if no Directory has listed a new adopter yet.

## Relationship To Directory

The Directory should be treated as an accelerator:

```text
Directory = shared Beacon sweep result
```

A Directory can save time, reduce repeated crawling, and provide filtering. But the ecosystem must work even when a user ignores the official Directory and performs a direct sweep.

Healthy ecosystem:

```text
many organizations emit Beacons
many independent sweepers can find them
many Directory nodes can cache them
agents can compare, ignore, fork, or rebuild indexes
verification always returns to the origin package
```

Unhealthy ecosystem:

```text
an organization is only visible if one official Directory includes it
Directory payment becomes mistaken for trust
Directory ranking becomes the final decision
agents stop verifying at origin
```

## What The Beacon Should Optimize For

The Beacon should optimize for:

- crawler discoverability
- low request count
- stable JSON shape
- small compact object
- explicit verification commands
- clear separation between discovery, verification, and trust decision
- direct origin ownership
- easy mirroring and re-crawling
- compatibility with ordinary web infrastructure

## What The Beacon Should Not Do

The Beacon must not:

- claim the organization is good
- claim the organization is the best supplier
- replace the signed statement
- replace evidence review
- require official Directory inclusion
- depend on a paid platform
- hide gaps behind a polished badge

## Future CLI Shape

Possible commands:

```bash
organchor beacon generate
organchor beacon inspect https://example.org
organchor beacon sweep --seeds seeds.txt --out discovered-organchor.ndjson
organchor beacon verify --in discovered-organchor.ndjson
```

Near-term implementation should first extend `page generate` so every verify package emits the best possible Beacon surfaces by default.

After that, a simple `beacon inspect` command can validate a single origin. A broader `beacon sweep` command can come later.

## Acceptance Criteria

The Beacon layer is working when:

- a new adopter can publish OrgAnchor without requesting official Directory inclusion
- an external agent can find the adopter from standard origin-owned web signals
- the agent can get a compact machine-readable first-pass result
- the agent can see why the organization may be relevant
- the agent can run direct origin verification
- a third party can build a local database from repeated sweeps
- official and third-party Directories can be rebuilt from the same public signals

## Success Metrics

Useful metrics:

```text
beacon_find_rate
time_to_first_beacon
http_requests_per_found_adopter
origin_verification_success_rate
stale_beacon_rate
directory_independence_rate
third_party_sweep_reproducibility
```

Preferred direction:

```text
beacon_find_rate up
time_to_first_beacon down
http_requests_per_found_adopter down
origin_verification_success_rate up
stale_beacon_rate down
third_party_sweep_reproducibility up
```

## Product Rule

When choosing between a Directory-only feature and a Beacon-first feature, prefer the Beacon-first feature if it makes adopters easier to find without asking permission from a central index.

Directory can help users save time.

Beacon prevents visibility from being captured.
