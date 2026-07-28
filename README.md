# OrgAnchor

[![Quality baseline](https://github.com/OrgAnchor/OrgAnchor/actions/workflows/quality.yml/badge.svg)](https://github.com/OrgAnchor/OrgAnchor/actions/workflows/quality.yml)
[![Security baseline](https://github.com/OrgAnchor/OrgAnchor/actions/workflows/security.yml/badge.svg)](https://github.com/OrgAnchor/OrgAnchor/actions/workflows/security.yml)

OrgAnchor helps organizations publish signed, recheckable public records that
connect identity, official presence, claims, evidence, and migration history.
It provides people and AI agents with a common verification path intended to
reduce repeated search, due-diligence, and comparison work when domains,
platform accounts, websites, or infrastructure change.

OrgAnchor 帮助组织发布经过签名、可复查的公开资料，将身份、官方入口、主张、证据和迁移历史串联起来。它为外部用户和 AI Agent 提供共同的验证路径，旨在降低发现、核验、理解和比较组织时的重复成本，同时避免将某个域名、平台或 OrgAnchor 官方目录变成身份根。

> **Fireseed Alpha:** `organchor@0.1.0-alpha.5` is ready for public inspection
> and low-risk pilots. It is not stable v1 and must not be an organization's
> only production identity control.

[Live self-pilot](https://organchor.org/verify/) ·
[Machine-readable Beacon](https://organchor.org/.well-known/organchor.json) ·
[Public explainer](docs/outreach/PUBLIC_EXPLAINER.md) ·
[Quality status](docs/project/QUALITY_ASSURANCE_STATUS.md)

## Why OrgAnchor

Organizations normally present themselves through domains, websites, platform
accounts, cloud services, product pages, certificates, reports, and media.
Those materials are useful, but they are usually scattered and do not naturally
form one signed, recheckable chain of identity continuity and evidence history.

This leaves every buyer, partner, reviewer, and AI agent to reconstruct basic
answers repeatedly:

- Is this the same organization seen before?
- Where is its current official presence?
- What exactly does it claim, and which product, service, or time window does
  the claim cover?
- What evidence supports it, what is stale or missing, and what should be
  checked next?
- What changed after a domain, platform, authority, or infrastructure migration?

AI-generated media makes polished presentation cheaper, but it does not make
real evidence cheaper. OrgAnchor addresses this structural gap by making the
verification path explicit and machine-readable. Whether that path reduces
total transaction cost in real organizations remains an external pilot question,
not an established project claim.

OrgAnchor also makes time an inspectable evidence dimension. A convincing
current snapshot can be assembled quickly; backfilling a long, internally
coherent history that was separately signed and externally time-anchored at
multiple earlier moments is harder and more likely to expose contradictions.
OrgAnchor calls this a **verifiable longitudinal record**. It is not a trust
score: a longer history does not prove truth, and a new organization is not
presumed untrustworthy.

## How It Works

```text
organization root authority
        |
        v
signed official-presence, claim, evidence, and migration records
        |
        v
human-readable /verify page + machine-readable OrgAnchor package
        |
        v
website / Beacon / IPFS / Arweave / Onion / ENS / Directory carriers
        |
        v
independent verification -> visible gaps -> external policy decision
```

The adopting organization's root authority is the identity root. Websites,
domains, IPFS, Arweave, Onion, ENS, cloud services, and Directory snapshots are
carriers, archives, or discovery aids. None of them, including OrgAnchor's own
website or Directory, receives protocol privilege over the organization.

Old signed packages remain historical evidence under the rules that created
them. Protocol evolution adds new package versions and migration links rather
than retroactively erasing valid old snapshots. See the
[protocol evolution policy](docs/protocol/PROTOCOL_EVOLUTION_POLICY.md).

## See It Working

The public self-pilot exposes the same organization record in two views:

- [Human-readable verification summary](https://organchor.org/verify/)
- [Machine-readable discovery record](https://organchor.org/.well-known/organchor.json)

An Agent or verifier can inspect the public origin directly:

```bash
npm install -g organchor@alpha
organchor verify url https://organchor.org --compact
```

`PASS` means the checked identity and package-integrity conditions passed. It
does **not** mean the organization, product, claim, or evidence is trustworthy.
It is not a trust badge.
OrgAnchor's trust decision remains `NOT_ASSIGNED_BY_ORGANCHOR`; the external
user or Agent still applies its own purchasing, safety, legal, partnership, or
listing policy.

## Current Alpha Boundary

| Area | Current state | Important limit |
| --- | --- | --- |
| Root authority, threshold signatures, official presence, migration, `/verify`, and direct URL verification | Implemented and tested | Independent cryptographic review is still pending. |
| Claims, signed evidence manifests, S1 first-party material, S2 organization-submitted third-party material, and S3 sampling structure | S1-S3 evidence baseline implemented | OrgAnchor exposes support and gaps; it does not certify claim truth. |
| Beacon and bounded Directory sweep, index, query, compare, and direct-origin verification | Implemented for bounded discovery | Broad internet discovery coverage and independent Directory adoption are not established. |
| S4 real-use observation and S5 challenge, correction, and accountability | S4/S5 design preview; S4 is partial | Mature observer networks, abuse controls, privacy handling, and durable storage incentives are unfinished. |
| Delegated product/service credentials, package health, and commercial fit | Accepted design direction | These are not complete shipped surfaces. |
| External adoption and transaction-cost effect | Not completed | No unfamiliar organization has completed the full pilot, and real cost reduction is not yet established. |

The authoritative detail lives in
[Implementation Status](docs/project/IMPLEMENTATION_STATUS.md),
[Quality Assurance Status](docs/project/QUALITY_ASSURANCE_STATUS.md), and the
[Capability Traceability Matrix](docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md).

## Install And Create A First Package

The public package is a prerelease. Use the explicit `alpha` tag:

```bash
npm install -g organchor@alpha
organchor --help
```

For a disposable 1-of-1 trial in an empty directory:

```bash
organchor init
# Edit organchor.config.json before creating the statement.
organchor key generate --id root-2026
organchor authority create --key keys/root-2026.private.json
organchor statement create --config organchor.config.json --authority root-authority.json
organchor statement sign --key keys/root-2026.private.json --authority root-authority.json --in statements/official-endpoints.json
organchor statement verify --authority root-authority.json --in statements/official-endpoints.json --sig statements/official-endpoints.json.sig
organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --out public/verify
```

A serious public pilot should use independent key holders and threshold
authority rather than sharing one private key. Follow the
[Adopter Quickstart](docs/guides/ADOPTER_QUICKSTART.md),
[Root Authority Custody Guide](docs/guides/ROOT_AUTHORITY_CUSTODY_GUIDE.md), and
[CLI Reference](docs/guides/CLI_REFERENCE.md) before publishing or archiving a
real package.

## Local Demos

From a source checkout:

```bash
npm ci
npm run visible:demo -- --out ./visible-demo --serve
npm run agent:demo
```

The visible demo shows a human `/verify` page, the corresponding Agent result,
and a tamper failure. The Agent demo runs a local
`seed -> sweep -> index -> query -> verify` loop without real domains, wallets,
tokens, or paid services. See
[Visible Acceptance](docs/operations/VISIBLE_ACCEPTANCE.md) and the
[Agent Integration Guide](docs/protocol/AGENT_INTEGRATION_GUIDE.md).

Runnable adversarial scenarios also test whether Agents keep valid package
integrity separate from weak, stale, or conflicting product evidence. Their
scope and raw-result rules are documented in the
[External Agent Evaluation Runbook](docs/evaluations/EXTERNAL_AGENT_EVALUATION_RUNBOOK.md).

## Fireseed Alpha

Fireseed Alpha is the first public collaboration boundary, not a finished trust
system. Its minimum loop is:

```text
identity continuity;
public /verify;
AI-agent-readable verification;
signed claims/evidence;
S1-S3 evidence baseline;
S4/S5 design preview;
external review and low-risk pilots.
```

The operating boundary is defined by the
[Fireseed Alpha Plan](docs/operations/FIRESEED_ALPHA_PLAN.md),
[Readiness Gate](docs/operations/FIRESEED_READINESS_GATE.md), and preserved
[first GO decision](docs/history/FIRESEED_LAUNCH_DECISION_2026-06-01.md).

## Fireseed Review Tracks

- **Adopting organization trial:** test whether a real organization can publish
  and maintain a useful package without excessive effort.
- **Technical review:** test canonicalization, signatures, threshold authority,
  migration, package safety, and release integrity.
- **Evidence and governance review:** test misleading evidence, sampling,
  staleness, conflicts, challenge handling, and Directory risks.
- **External Agent evaluation:** test whether a fresh-context Agent separates
  identity integrity from actual claim support.

Start with the [Fireseed Outreach Kit](docs/outreach/FIRESEED_OUTREACH_KIT.md),
[Call for Review](docs/outreach/CALL_FOR_FIRESEED_REVIEW.md), and
[Contributing Guide](CONTRIBUTING.md). Security findings should follow the
[private reporting policy](.github/SECURITY.md).

## Safety And Non-Claims

Never publish private keys, recovery material, wallet seeds, provider tokens,
payment records, or confidential evidence. Generated private-key files are
ignored by default, but custody remains the adopting organization's
responsibility.

OrgAnchor is not:

- a trust badge, certification authority, supplier ranking, or marketplace;
- proof that an organization is good, truthful, safe, lawful, cheap, or best;
- a replacement for legal identity, government registration, domains, or
  direct origin verification;
- a guarantee of permanent availability, complete decentralization, or
  censorship resistance; or
- quantum-proof security in the current alpha.

## Documentation

- [Project North Star](docs/project/PROJECT_NORTH_STAR.md): the goal and
  non-negotiable boundaries.
- [Design Rationale](docs/project/DESIGN_RATIONALE.md):
  goal -> properties -> mechanisms -> effects -> limits.
- [Implementation Status](docs/project/IMPLEMENTATION_STATUS.md): shipped,
  partial, design-only, and incomplete capabilities.
- [Quality Assurance Status](docs/project/QUALITY_ASSURANCE_STATUS.md): public
  machine evidence and remaining external assurance gaps.
- [Public Release Checklist](docs/operations/PUBLIC_RELEASE_CHECKLIST.md):
  repeatable release gates and human-owner stop points.
- [Capability Audit Scenarios](docs/evaluations/CAPABILITY_AUDIT_SCENARIOS.md):
  executable cross-module checks.
- [Commercial Fit Layer](docs/protocol/COMMERCIAL_FIT_LAYER.md): accepted design
  for price, MOQ, lead-time, and quote paths without becoming a marketplace.
- [Documentation Index](DOCS_INDEX.md): role-based reading paths and source-of-truth order.
- [Historical records](docs/history/): dated decisions and retired experiments
  that do not override current guidance.

## License

Apache-2.0. See [LICENSE](LICENSE).
