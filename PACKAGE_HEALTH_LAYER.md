# Package Health Layer

Status: Accepted design model, not yet fully implemented.

## Purpose

The Package Health Layer protects external AI agents, crawlers, directories, and human reviewers from repeatedly spending effort on stale, expired, broken, or low-value OrgAnchor packages.

It does not decide whether an organization is good, trustworthy, or suitable for a transaction. It only reports whether the public package is fresh, reachable, internally coherent, and worth fetching further.

Core rule:

```text
An organization may fail to maintain its package, but OrgAnchor should make that failure visible and cheap to skip.
```

## Responsibility Principle

For S1 and S2, use the responsibility rule:

```text
Who claims, publishes.
Who benefits, bears maintenance cost.
Who controls the source, bears update and correction responsibility.
OrgAnchor provides structure, signatures, hashes, anchors, health signals, and gap exposure; it does not become the storage provider or truth guarantor.
```

For S1:

```text
The organization publishes and maintains first-party materials.
```

For S2:

```text
The organization publishes and maintains third-party material metadata, claimed linkage, hashes, external recheck anchors, validity windows, corrections, and withdrawals.
```

If a third-party issuer later signs or OrgAnchor-backs the material, that strengthens the S2 record. It does not move the default publication burden away from the organization that benefits from the claim.

## Storage Boundary

OrgAnchor should not become a central repository for all S1 and S2 raw files.

Recommended S1/S2 storage roles:

```text
organization package = metadata, claim linkage, hashes, validity, status, route, and limitations
organization or third-party origin = original documents, pages, records, reports, and fallback copies
content-addressed mirrors = optional IPFS/R2/S3/GitHub Release mirrors for larger artifacts
archive/timestamp carriers = small manifest snapshots, hashes, receipts, and historical anchors
```

This keeps storage cost and legal responsibility aligned with the party using the evidence to support its own claims.

## Self-Declared Health

The organization should publish a signed, machine-readable health summary in its own package and Beacon.

It should include:

```text
last_self_check_at
maintenance_policy
package_health_status
evidence_health_summary
reference_health_summary
known_stale_items
known_broken_items
known_expired_items
known_withdrawn_items
known_superseded_items
agent_fetch_recommendation
```

Recommended maintenance policy fields:

```text
review_interval_days
stale_after_days
broken_link_response_days
evidence_expiry_handling
contact_for_corrections
```

Recommended health statuses:

```text
FRESH
STALE
EXPIRED
BROKEN_LINK
REVIEW_OVERDUE
WITHDRAWN
SUPERSEDED
UNKNOWN
```

Recommended fetch recommendations:

```text
FETCH
FETCH_WITH_CAUTION
SKIP_STALE
SKIP_BROKEN
SKIP_WITHDRAWN
```

These are not trust ratings. They are package usability signals.

## Observed Health

Self-declared health is not enough. External agents, crawlers, directories, buyers, mirrors, or independent observers may publish observed health reports.

Observed health should record:

```text
observer
observed_at
target_origin
package_hash
verify_status
beacon_status
broken_reference_count
expired_evidence_count
stale_evidence_count
s2_anchor_check_sample
agent_fetch_recommendation
limitations
signature optional
```

Observed health can live in:

```text
agent-side cache
directory snapshot
crawler report
health-sweep NDJSON
independent observation hub
organization-cited external report
```

It does not need to be stored in the organization's official package, and it must not become a central trust root.

## External Agent Source Order

A third-party AI agent should prefer this order:

1. Read the organization's Beacon health summary.
2. Read recent Directory or crawler health snapshots if available.
3. Run its own lightweight direct inspection when the candidate is relevant.
4. Compare self-declared and observed health for conflicts.

The minimum independent path is:

```text
Agent runs a direct health inspection against the origin.
```

Directory or crawler snapshots are accelerators. They are not final truth.

## Conflict Handling

If organization self-declared health and observed health disagree, OrgAnchor-compatible outputs should expose the conflict directly.

Example:

```text
self_declared_fetch_recommendation = FETCH
observed_fetch_recommendation = SKIP_BROKEN
health_conflict = true
recommended_next_action = inspect directly or skip until refreshed
```

The consuming agent owns the final policy decision.

## Honest Expiry Rule

Expired or withdrawn material is not automatically a failure.

Healthy behavior:

```text
mark expired evidence as expired
mark superseded claims as superseded
withdraw inaccurate claims
publish corrections
update Beacon health summary
```

Unhealthy behavior:

```text
hide expired records
present broken links as current
keep withdrawn claims looking active
force agents to download full packages before discovering obvious stale state
```

OrgAnchor should reward honest visibility by making it easy for agents to distinguish maintained packages from neglected ones.

## Beacon And Directory Boundary

Beacon health summaries should be lightweight so agents can decide whether to fetch the full package.

Directory and crawler health reports may record:

```text
last_seen
last_successful_verify
stale_record_ratio
broken_reference_ratio
expired_evidence_ratio
package_health_status
observed_fetch_recommendation
```

These are operational health diagnostics, not certification, ranking, or supplier recommendation.

## Implementation Direction

Future implementation should add:

1. `organchor health self` to generate signed self-declared health summaries from local package state.
2. `organchor health inspect <origin>` to produce observed health reports from direct origin inspection.
3. Beacon fields for package health status, evidence health summary, and fetch recommendation.
4. Directory and crawler support for health observations without turning them into trust scores.
5. Value audit integration so stale, broken, expired, withdrawn, and superseded evidence affects purpose-fit output.

## Acceptance Rule

This layer succeeds if an external AI agent can answer cheaply:

```text
Is this package fresh enough to fetch?
Are obvious links or anchors broken?
Are important evidence items expired, withdrawn, or superseded?
Does the organization admit the same health state observers see?
Should I fetch, fetch with caution, or skip until refresh?
```

It fails if OrgAnchor becomes:

```text
a central evidence host
a trust score
a paid visibility gate
a hidden penalty system
a substitute for direct origin verification
```
