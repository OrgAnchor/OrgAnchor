# Call For Fireseed Review

Status: Active public review invitation.

## Why This Exists

OrgAnchor is a long-horizon project. Waiting for every evidence, storage, directory, challenge, and governance problem to be fully solved would delay the point where outside people can inspect the core loop.

Fireseed Alpha is the first public collaboration point:

```text
identity continuity works;
public /verify works;
AI-agent-readable verification works;
signed claims and evidence exist;
S1-S3 evidence structure is visible;
S4/S5 are clearly marked as design preview;
the project invites co-builders before pretending to be complete.
```

## What We Are Asking People To Review

### Adopting Organizations

Test whether a real or realistic organization can publish a useful OrgAnchor package without excessive effort.

Focus on:

- Root authority creation.
- Official endpoint statement signing.
- `/verify` and Beacon publication.
- Claims and evidence manifests.
- S1-S3 evidence records.
- Whether an outside AI agent can verify the package without private context.

### Technical Reviewers

Test whether the implementation is coherent and reproducible.

Focus on:

- Canonical JSON and hashing.
- Signature and threshold verification.
- Root authority migration.
- CLI ergonomics.
- Package safety.
- Release integrity.
- Agent verification output.

### Evidence And Governance Critics

Test where the model can be gamed, misunderstood, or made too expensive for honest adopters.

Focus on:

- S1-S3 abuse cases.
- S3 random sampling and anti-brushing limits.
- Stale or misleading evidence.
- Directory capture and ranking risks.
- S4/S5 observation and challenge gaps.
- Ways to expose uncertainty without making OrgAnchor a central judge.

## What Fireseed Does Not Claim

Fireseed Alpha does not claim:

- Stable v1 readiness.
- Product quality certification.
- Legal, safety, procurement, or ethical approval.
- Guaranteed truth.
- Permanent identity.
- Anti-censorship guarantees.
- Official Directory privilege.
- A solved public challenge network.

OrgAnchor verifies signatures, hashes, continuity, publication structure, and declared evidence relationships. Final trust decisions remain with external agents, buyers, reviewers, directories, regulators, communities, and people.

## How To Start

1. Read `README.md`.
2. Read `FIRESEED_ALPHA_PLAN.md`.
3. Read `FIRESEED_READINESS_GATE.md` to understand what is in scope for Fireseed and what remains unfinished.
4. Run `npm run agent:demo` from a source checkout, or install with `npm install -g organchor@alpha`.
5. Use the GitHub issue templates for adopter trials, technical review, or evidence/governance review.

## Fireseed Success Condition

Fireseed Alpha is successful when:

- A technically capable outsider can reproduce the core verification loop.
- At least one real or realistic adopting organization can complete the package flow.
- Reviewers can see exactly where S1-S3 are strong, weak, or unfinished.
- S4/S5 are understood as design previews, not finished governance.
- The project gains useful critique without expanding into a marketplace, certification authority, or central trust platform.
