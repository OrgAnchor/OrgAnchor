# OrgAnchor Discovery Strategy

Status: Proposed post-v1 strategy; accepted as a product direction, not a v1 completion blocker.

## Purpose

OrgAnchor's core verifier answers:

```text
If I have found this organization, can I verify its identity continuity, public claims, evidence, receipts, and migrations?
```

That is necessary, but it does not answer:

```text
How does a demand-side agent find suitable supply-side organizations in the first place?
```

If suitable organizations cannot be found cheaply, OrgAnchor reduces verification cost after discovery but does not yet minimize the whole transaction cost.

The discovery strategy exists to close that gap.

## Core Thesis

OrgAnchor needs two connected layers:

```text
verification layer = reduce the cost of knowing whether a found organization is speaking for itself
discovery layer = reduce the cost of finding candidate organizations worth verifying
```

The discovery layer must be open and repeatable. It should not turn OrgAnchor into a monopoly marketplace, paid ranking service, or central trust authority.

## Why Discovery Matters

For a small company, buyer, supplier, researcher, grant maker, auditor, or AI agent, the first expensive question is often:

```text
Who should I even look at?
```

The next expensive questions are:

```text
What do they claim to provide?
What evidence do they expose?
Are they reachable?
Are they fresh or stale?
Are there obvious risks before deeper review?
```

If every agent must crawl the entire web from scratch, good organizations remain invisible and weak organizations can still win attention through advertising, platform placement, or search-engine luck.

OrgAnchor should make credible discovery easier without pretending to pick the final best supplier.

## Discovery Is Not Verification

Discovery can say:

```text
This organization appears in this index.
This record points to a verifiable OrgAnchor package.
This package last verified at this time.
This package claims these capabilities.
This package exposes this level of evidence summary.
```

Discovery must not say:

```text
This is the best supplier.
This organization is good.
This evidence is sufficient for your risk.
This paid listing is more trustworthy.
```

Final selection belongs to the demand-side party or its agent.

## Discovery Stack

OrgAnchor should support discovery through layered, substitutable surfaces.

### 1. Origin-Published Discovery Facts

Each adopting organization should publish enough structured data at its own origin:

```text
/.well-known/organchor.json
/verify/organchor.json
claims/product-claims.json
evidence/evidence-manifest.json
reports/value-continuity-report.json
```

This is the source-of-truth layer.

### 2. Search-Friendly Hints

Organizations may expose ordinary web discovery hints:

```text
sitemap.xml
robots.txt
security.txt
public documentation pages
schema.org-style metadata where appropriate
```

These are convenience hints. They are not authority.

### 3. Open Directory Snapshots

Directory nodes can crawl known origins, run compact verification, and publish static snapshots.

This is the preferred low-cost first implementation because it can be hosted as static files and mirrored by anyone.

See `DIRECTORY_MODEL.md`.

### 4. Query Services

Later, a Directory node may offer a richer query API over the same exportable records.

The API is only a convenience surface. It must not be the only way to access the directory data.

### 5. External Marketplaces And Search Engines

Existing platforms may consume OrgAnchor records.

That is useful, but OrgAnchor should not depend on any one platform. Every platform recommendation should remain checkable back to the organization's own OrgAnchor package.

## Minimal Matching Fields

To help an AI agent find candidate supply-side organizations, OrgAnchor discovery records should eventually support structured fields such as:

```text
organization name and display name
origin URL
official website and verify URL
service or product categories
capabilities
regions served
languages
commercial contact or inquiry endpoint
claim summaries
evidence summary
third-party evidence count
reproducible evidence count
manual-check count
freshness timestamps
known limitations
identity status
value status
policy route
carrier availability
last verified time
```

The first version should stay conservative. It should prefer broad categories and evidence summaries over overfitted ranking fields.

## Demand-Side Agent Flow

A demand-side agent should follow this pattern:

```text
state the need
search one or more open directory snapshots
filter by capability, region, freshness, and evidence summary
fetch the organization's own /.well-known/organchor.json
run organchor verify url <origin> --compact
fetch the full verification result when needed
inspect claims and evidence for shortlisted candidates
apply the demand-side party's own policy
```

This keeps discovery cheap while preserving direct verification.

## Supply-Side Organization Flow

A supply-side organization should not need to beg one central platform for visibility.

Its basic path should be:

```text
publish an OrgAnchor verify package
publish claims and evidence manifests
make product or service categories machine-readable
submit or expose the origin to one or more Directory nodes
allow agents to verify directly from origin
keep evidence fresh and corrections visible
```

The burden should stay close to materials a serious organization already maintains.

## Anti-Monopoly Requirements

The discovery layer should be designed against capture:

1. Directory data must be exportable.
2. Directory policies must be public.
3. Anyone should be able to run a competing Directory node.
4. Agents should be able to compare multiple Directory nodes.
5. Paid placement, if ever introduced, must be explicitly labeled.
6. Paid placement must never change verification status.
7. A record must point back to origin-owned signed artifacts.
8. A removed or excluded record should be explainable by policy when practical.

The goal is a multi-polar discovery ecosystem, not one official gatekeeper.

## Success Metrics

Discovery work should be judged by:

```text
candidate_find_rate
time_to_first_verified_candidate
agent_http_request_count
directory_snapshot_size
record_freshness
stale_record_rate
false_positive_candidate_rate
false_negative_candidate_rate
origin_verification_success_rate
multi_directory_overlap
policy_transparency
```

Preferred direction:

```text
candidate_find_rate up
time_to_first_verified_candidate down
agent_http_request_count down
stale_record_rate down
origin_verification_success_rate up
policy_transparency up
```

## Near-Term Implementation Path

OrgAnchor should not start with a heavy marketplace.

The practical order is:

1. Keep v1 focused on verifiable identity, evidence, and migration.
2. Define discovery fields that can be added to claims, evidence, or verify indexes without breaking existing agents.
3. Create a static Directory snapshot format.
4. Publish a tiny reference snapshot containing OrgAnchor's self-pilot and example records.
5. Add a CLI builder that fetches origins, runs compact verification, and emits snapshot files.
6. Add comparison tools for multiple Directory nodes.

The first useful Directory can be static files. A hosted search service can come later if the need is proven.

## Relationship To V1

V1 should not be delayed until the full discovery layer exists.

However, v1 data structures should avoid blocking discovery later. In particular:

- `organchor.json` should stay machine-readable.
- claim and evidence summaries should remain agent-friendly.
- `policy_route` should remain clear.
- unknown fields should be safe to ignore.
- future discovery fields should be optional first.

## Non-Goals

The discovery strategy does not create:

- a central marketplace
- a bidding system
- a paid recommendation engine
- an official supplier ranking
- a legal due-diligence replacement
- a universal taxonomy for every industry in v1

It creates a path from:

```text
I need a suitable organization
```

to:

```text
Here are candidates whose identity packages, claims, evidence, and gaps I can verify cheaply.
```

That is the missing bridge between identity continuity and lower real-world transaction cost.
