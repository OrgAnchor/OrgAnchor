# OrgAnchor Capability Audit Scenarios

Status: Active scenario-level implementation audit.

## Purpose

`docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md` is the first layer: it maps every public capability claim to status, commands, tests, artifacts, and limits.

This file is the second layer: it defines executable scenarios that combine those capabilities into end-to-end loops. The goal is to repeatedly check that:

```text
documentation claim -> named capability -> runnable command path -> observable output
```

This is especially important because OrgAnchor is meant for AI-agent verification. A capability that only sounds plausible in prose is not enough; it should either be runnable, explicitly manual, or clearly marked as design-only.

Run:

```bash
npm run capability:scenarios
```

The scenario runner writes:

```text
reports/capability-scenarios.json
reports/capability-scenarios.md
```

Use this together with:

```bash
npm run capability:audit
```

## What These Scenarios Prove

They prove implementation/documentation alignment for the tested toolchain paths:

- the documented commands still exist;
- the commands still compose into usable workflows;
- generated artifacts have the expected machine-readable shape;
- core reports expose the fields promised to AI agents;
- package-facing files include the audit surfaces needed by external reviewers.

## What They Do Not Prove

They do not prove that an adopting organization is good, truthful, solvent, ethical, lawful, or the best supplier for a demand. They also do not prove that every future external carrier is online.

OrgAnchor's job is to make identity, claims, evidence, gaps, carrier receipts, and verification routes easier to inspect. Final trust and procurement decisions remain outside OrgAnchor.

## Scenario Status Vocabulary

| Status | Meaning |
| --- | --- |
| LOCAL_EXECUTABLE | Runs locally without provider credentials or payment. |
| EXTERNAL_OPTIONAL | Runs only when network, public infrastructure, or provider state is intentionally included. |
| MANUAL_EXTERNAL | Requires human/provider action and is represented by manual checks or operator guidance. |
| DESIGN_PREVIEW | Accepted direction, but not part of the executable Fireseed gate. |

## Scenarios

| Scenario ID | Scenario | Status | Covered Capabilities | Primary Command |
| --- | --- | --- | --- | --- |
| CAS-001 | Identity, `/verify`, signed claims/evidence, IPFS dry-run, and Arweave manual package smoke | LOCAL_EXECUTABLE | OA-001; OA-002; OA-003; OA-007; OA-008; OA-014; OA-015; OA-022 | `node scripts/release-smoke.mjs` |
| CAS-002 | Local AI-agent discovery loop: Beacon, sweep, index, Directory export, query, compact verification | LOCAL_EXECUTABLE | OA-004; OA-005; OA-006; OA-020 | `node scripts/agent-discovery-demo.mjs --cleanup` |
| CAS-003 | Package-facing and installed CLI smoke gates | LOCAL_EXECUTABLE | OA-021; OA-022 | `node scripts/package-smoke.mjs` and `node scripts/install-smoke.mjs` |
| CAS-004 | S1/S2/S3/S4 value-evidence summary path for AI-agent reports | LOCAL_EXECUTABLE | OA-007; OA-008; OA-009; OA-010; OA-012 | built into `scripts/capability-scenarios.mjs` |
| CAS-005 | Capability traceability matrix validation | LOCAL_EXECUTABLE | OA-001 through OA-026 | `node scripts/capability-audit.mjs --check` |
| CAS-006 | Public OrgAnchor self-pilot compact verification | EXTERNAL_OPTIONAL | OA-004; OA-023 | `node src/cli.ts verify url https://organchor.org --compact` |

## Fireseed Gate Interpretation

For Fireseed Alpha, a capability should not be treated as operationally real only because it appears in design prose.

The minimum rule is:

```text
Fireseed-required implementation claim
= present in CAPABILITY_TRACEABILITY_MATRIX.md
+ either covered by a local executable scenario
+ or explicitly marked as manual/external with known limits.
```

This keeps the project from drifting into self-description without executable evidence.

## Operator Notes

- Default `npm run capability:scenarios` runs local scenarios only.
- Use `node scripts/capability-scenarios.mjs --include-network` when intentionally checking the public self-pilot.
- Use `node scripts/capability-scenarios.mjs --manifest-only` when checking only scenario definitions and file references.
- Use `node scripts/capability-scenarios.mjs --list` for machine-readable scenario metadata.

## Acceptance Bar

This scenario layer is acceptable only if the generated report can tell a reviewer:

- which scenario ran;
- which capabilities it covered;
- which command path was used;
- whether it passed, failed, skipped, or required external state;
- what observable artifact or summary was checked;
- which limitations remain.

That is the practical answer to "implementation must match documentation" for an AI-facing project.
