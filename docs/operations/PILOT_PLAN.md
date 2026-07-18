# OrgAnchor Pilot Plan

Status: Accepted; OrgAnchor self-pilot has been executed publicly after Stage 3. This document records the pilot decision model. Current operational self-pilot state is intentionally kept in a private workspace outside the source repository.

## Decision

OrgAnchor's first real-world public pilot will be OrgAnchor itself.

The pilot starts after Stage 3 is complete.

Milestone definition:

```text
Stage 3 = self-pilot ready
Stage 5 = v1 functional scope complete; stable v1 remains a separate release decision
```

The self-pilot does not mean OrgAnchor v1 is complete.

## Why OrgAnchor Itself

OrgAnchor should prove its own model before asking other organizations to depend on it.

Using OrgAnchor as the first pilot lets the project test:

- Root authority setup.
- Signed official endpoint statements.
- Static `/verify` page generation.
- IPFS mirroring.
- Arweave archival or manual upload package.
- `organchor.lock.json` publish receipt tracking.
- Product/service claims manifest.
- Evidence manifest for project documents and proof materials.
- AI-agent-readable claim/evidence relations.
- Human-readable verification instructions.
- Whether the public positioning is honest and understandable.

## Pilot Timing

### Before Stage 3

No public pilot.

The project can run local examples and development fixtures, but should not present itself as a real-world identity continuity deployment.

### After Stage 2

Internal trials are allowed.

Purpose:

- Test CLI usability.
- Test key generation and signing.
- Test verify page generation.
- Test documentation clarity.

These trials should not be framed as production adoption.

### After Stage 3

OrgAnchor public pilot begins.

Required capabilities:

- `organchor init`
- root authority setup, at least `1-of-1`
- statement creation
- statement signing
- statement verification
- static `/verify` page generation
- IPFS dry-run and real Kubo publish path
- Arweave dry-run/manual package, and optionally first real provider adapter
- signed product/service claims manifest
- signed evidence manifest
- `organchor.lock.json`

Expected pilot artifacts:

```text
organchor.config.json
organchor.lock.json
root-authority.json
keys/<organchor-root>.private.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
claims/product-claims.json
claims/product-claims.json.sig
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
public/verify/index.html
public/verify/organchor.json
public/verify/official-endpoints.json
public/verify/official-endpoints.json.sig
public/verify/root-authority.json
```

Private keys must not be committed or published.

Execution details, human approval gates, and agent delegation boundaries are recorded in `SELF_PILOT_RUNBOOK.md`.

The public self-pilot approval package is summarized in `SELF_PILOT_DECISION_BRIEF.md`.

Replication and future organization adoption are defined in `docs/project/ADOPTION_MODEL.md`.

Self-pilot operational lessons are recorded in `SELF_PILOT_LESSONS.md` so the experiment can become a repeatable best-practice path.

## Pilot Success Criteria

The OrgAnchor self-pilot is successful when:

- A fresh clone can verify OrgAnchor's official endpoint statement using the published root authority record.
- The statement hash is stable under canonical JSON.
- The signature fails after any statement mutation.
- The verify page clearly displays the root authority fingerprint.
- The verify page and `organchor.json` clearly explain current root authority, migration status, and historical verification rules.
- IPFS CID records in `organchor.lock.json` match local artifact hashes.
- Arweave dry-run/manual package or real TX records match local artifact hashes.
- Claims and evidence manifests verify.
- AI agents can read OrgAnchor's claims, evidence items, limitations, issuer types, and artifact hashes from JSON.
- Documentation does not overclaim permanence, censorship resistance, legal identity, or platform replacement.

## What the Pilot Must Not Claim

The self-pilot must not claim:

- OrgAnchor is production complete.
- OrgAnchor is quantum-proof.
- OrgAnchor makes identity permanent.
- Arweave or IPFS makes the organization automatically trustworthy.
- The lockfile is a trust root.
- OrgAnchor can automatically prove product effectiveness.

Correct claim:

> OrgAnchor is using its own signed endpoint statement, evidence manifests, and public verification flow as an early public pilot after the core publishing workflow is implemented.

## Next Adoption Gate

After the OrgAnchor self-pilot, the project may consider one external low-risk organization for a public pilot.

That external pilot should wait until Stage 4 unless there is a clear reason to test earlier.
