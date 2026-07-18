# OrgAnchor Quality Assurance Status

Status: Active public assurance boundary.

- Assessed: 2026-07-18
- Package: `organchor@0.1.0-alpha.5`
- Current decision: `ALPHA_REVIEW_READY`
- Production decision: `PRODUCTION_IDENTITY_ASSURANCE_NOT_ESTABLISHED`

This page answers a narrow question: what evidence currently supports
OrgAnchor's own quality claims, and what remains unverified? It is not a trust
badge or security certification. The machine-readable companion is
[`quality-assurance-status.json`](./quality-assurance-status.json).

## How To Read The Statuses

- **Machine verified**: repeatable automated checks exist and pass locally; the
  public workflow provides the independently visible execution record.
- **Internally evaluated**: a controlled evaluation exists, but its scope or
  independence is limited.
- **Public run pending**: the public automation is configured but must complete
  its first successful GitHub run.
- **External verification pending**: an outsider with the relevant expertise
  has not yet supplied an independent result.
- **Not completed**: the claimed real-world outcome has not yet been shown.
- **Out of scope**: OrgAnchor intentionally does not make this assurance.

## Current Evidence

| Area | Status | What is actually established | Important limit |
| --- | --- | --- | --- |
| Canonical JSON, SHA-256, Ed25519, threshold authority, migration, and tamper rejection | Machine verified | Focused automated tests exercise the declared behavior. | An independent security and cryptographic review has not been completed. |
| Windows and Linux clean-environment checks | Machine verified | The first public GitHub run passed the full quality gate on Node.js 24 for both systems. | The matrix does not represent every downstream operating environment. |
| Test coverage | Machine verified | The current local run passed 183 tests and measured 87.77% lines, 93.99% functions, and 57.36% branches. CI rejects drops below 80%, 85%, and 50% respectively. | Coverage measures executed code, not correctness of every assumption. |
| Package and clean installation | Machine verified | Package contents, private-material exclusions, CLI behavior, and clean installation have executable smoke checks. | Downstream environments outside the tested matrix can still fail. |
| Dependency and static security checks | Public recheck in progress | npm audit passed publicly. The first CodeQL analysis completed but exposed five high-severity and one medium-severity findings; local fixes now pass the full quality gate and await a new public scan. Dependency graph, pull-request dependency review, weekly Dependabot updates, secret scanning, and push protection are active. | Automated scanners cannot establish that no vulnerability exists. |
| Documentation and implementation alignment | Machine verified | Documentation links, required state language, and capability traceability are checked mechanically. | Internal consistency is not independent proof of usability or correctness. |
| Bounded Agent evidence interpretation | Internally evaluated | Fresh-context runs preserved key identity-versus-evidence boundaries in three adversarial scenarios. | The scenarios are bounded and mostly use one Agent family. |
| Independent security and cryptographic review | External verification pending | A public review route and private vulnerability route exist. | No independent review report is available yet. |
| External organization adoption | Not completed | Pilot procedures and a guided entry exist. | No unfamiliar organization has completed the loop yet. |
| Real transaction-cost reduction | Not completed | The project defines measurable discovery and verification tasks. | The effect has not been established across real organizations. |
| Final organization or product truth | Out of scope | OrgAnchor can expose signed records, evidence structure, gaps, and recheck paths. | It does not certify that an organization is truthful, safe, lawful, or best. |

## Public Evidence Links

- [Quality workflow](https://github.com/OrgAnchor/OrgAnchor/actions/workflows/quality.yml)
- [Security workflow](https://github.com/OrgAnchor/OrgAnchor/actions/workflows/security.yml)
- [First successful Windows/Linux quality run](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29642949524)
- [First completed dependency and CodeQL run](https://github.com/OrgAnchor/OrgAnchor/actions/runs/29642949522) (the workflow completed, but its initial design did not reject open CodeQL alerts)
- [Repository security overview](https://github.com/OrgAnchor/OrgAnchor/security)
- [Capability traceability matrix](../evaluations/CAPABILITY_TRACEABILITY_MATRIX.md)
- [Implementation status](./IMPLEMENTATION_STATUS.md)
- [Security reporting policy](https://github.com/OrgAnchor/OrgAnchor/blob/main/.github/SECURITY.md)

## Release Boundary

The current evidence supports public inspection, bounded external evaluation,
and low-risk pilots. It does not support asking an organization to treat this
alpha as its only production identity control. The cross-platform quality
baseline passes; the strengthened security baseline is awaiting its public
recheck. Promotion beyond this boundary still requires an independent technical
and cryptographic review and one external organization pilot with preserved raw
results.
