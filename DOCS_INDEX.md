# OrgAnchor Documentation Index

Status: Active canonical documentation map.

OrgAnchor separates current project truth, protocol design, operating guidance,
evaluation evidence, public explanation, and historical records. This prevents a
dated audit or early design note from being mistaken for current behavior.

## What To Trust First

For current project direction and implementation state:

1. [Project North Star](./docs/project/PROJECT_NORTH_STAR.md)
2. [Implementation Status](./docs/project/IMPLEMENTATION_STATUS.md)
3. [Quality Assurance Status](./docs/project/QUALITY_ASSURANCE_STATUS.md)
4. [Capability Traceability Matrix](./docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md)
5. [Roadmap](./docs/project/ROADMAP.md)
6. [V1 Acceptance](./docs/project/V1_ACCEPTANCE.md)

The implementation status and executable capability evidence take precedence
over an older plan that describes intended work.

## Documentation Areas

- [Project design and state](./docs/project/README.md): purpose, architecture,
  current implementation, roadmap, governance, and accepted boundaries.
- [Protocol and data models](./docs/protocol/README.md): identity, evidence,
  discovery, Agent contracts, S2-S4 models, and protocol evolution.
- [Adoption and operator guides](./docs/guides/README.md): quick start, pilot,
  custody, publishing, migration, and domain hardening.
- [Release and project operations](./docs/operations/README.md): current release
  gates, publishing procedures, Fireseed readiness, and visible acceptance.
- [Evaluations and audits](./docs/evaluations/README.md): implementation
  traceability and adversarial Agent-evaluation scenarios.
- [Public explanation and outreach](./docs/outreach/README.md): public explanation,
  bounded review invitations, and showcase policy.
- [Historical records](./docs/history/README.md): dated decisions, audits,
  prechecks, and superseded project-state snapshots.
- [Architecture decision records](./docs/adr/): accepted architectural decisions.
- [Versioned brand assets](./docs/assets/brand/): adopted public brand files and
  their integrity records.

## Reading Paths

### First-Time Reader

1. [Public Explainer](./docs/outreach/PUBLIC_EXPLAINER.md)
2. [Design Rationale](./docs/project/DESIGN_RATIONALE.md)
3. [README](./README.md)
4. [Visible Acceptance](./docs/operations/VISIBLE_ACCEPTANCE.md)

### Adopting Organization

1. [Adopter Quickstart](./docs/guides/ADOPTER_QUICKSTART.md)
2. [Adoption Guide](./docs/guides/ADOPTION_GUIDE.md)
3. [Root Authority Custody Guide](./docs/guides/ROOT_AUTHORITY_CUSTODY_GUIDE.md)
4. [Publishing Guide](./docs/guides/PUBLISHING_GUIDE.md)

### AI Agent Or Verifier Builder

1. [Agent Integration Guide](./docs/protocol/AGENT_INTEGRATION_GUIDE.md)
2. [Agent Verification Contract](./docs/protocol/AGENT_VERIFICATION_CONTRACT.md)
3. [OrgAnchor Beacon](./docs/protocol/ORGANCHOR_BEACON.md)
4. [External Agent Evaluation Runbook](./docs/evaluations/EXTERNAL_AGENT_EVALUATION_RUNBOOK.md)

### Evidence Or Governance Reviewer

1. [Claims And Evidence Protocol](./docs/protocol/CLAIMS_EVIDENCE_PROTOCOL.md)
2. [Evidence Sufficiency Model](./docs/protocol/EVIDENCE_SUFFICIENCY_MODEL.md)
3. [S2 Third-Party Material Model](./docs/protocol/S2_THIRD_PARTY_MATERIAL_MODEL.md)
4. [S3 Random Sampling Model](./docs/protocol/S3_RANDOM_SAMPLING_MODEL.md)
5. [Adversarial Evaluations](./docs/evaluations/README.md)

## Status Language

- `Active`: current operating guidance or source of truth.
- `Accepted`: approved design direction; implementation may still be partial.
- `Implemented`: backed by identified code and tests.
- `Design preview`: retained direction, not a shipped capability claim.
- `Historical`: a preserved record that does not override current documents.

OrgAnchor does not certify that an organization is truthful or good. It provides
signed, recheckable, traceable, and migratable material so people and AI agents
can make lower-friction decisions without relying on an OrgAnchor trust badge.
