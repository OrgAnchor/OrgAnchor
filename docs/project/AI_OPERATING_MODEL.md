# AI Operating Model

Status: Active project operating model.

## Purpose

OrgAnchor is being developed through a human project owner plus AI execution lead model.

This document defines:

```text
what the AI execution lead may do by default;
what must remain under human owner control;
how external feedback becomes project work;
how the project prevents drift, overclaiming, and hidden authority transfer.
```

It is not part of the OrgAnchor verification protocol. It is an operating model for advancing the open-source project.

## Operating Thesis

OrgAnchor itself is about lowering the cost for people and AI agents to discover, screen, verify, understand, and compare candidate organizations without turning OrgAnchor into a central trust authority.

The project can be advanced in the same spirit:

```text
AI can execute, audit, draft, test, and maintain momentum;
the human owner keeps final authority over purpose, values, public commitments, accounts, spending, and real-world relationships;
the repository records decisions, implementation status, tests, and known limits so outsiders can inspect the work.
```

## Roles

### Human Project Owner

The human project owner is responsible for:

- project purpose and value boundaries;
- final approval of major direction changes;
- public commitments made in the project's name;
- real-world relationship building;
- platform accounts, payments, sponsorship accounts, and legal risk;
- deciding whether feedback changes the project's north star;
- deciding when a public release, video, sponsor outreach, or external announcement actually goes live.

The owner should not need to manually drive routine implementation, documentation, test maintenance, issue triage, or draft preparation.

### AI Execution Lead

The AI execution lead is responsible for:

- proposing the next practical step when no higher-priority blocker exists;
- editing documentation, code, tests, examples, scripts, and public materials;
- keeping `README.md`, `DOCS_INDEX.md`, `docs/project/IMPLEMENTATION_STATUS.md`, `docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md`, and relevant tests aligned;
- running typecheck, tests, build, smoke checks, and focused audits after meaningful changes;
- converting owner decisions into durable project records;
- converting external feedback into issues, document changes, code changes, tests, or explicit non-goals;
- flagging overclaiming, hidden centralization, trust-badge language, scope creep, and security risks;
- stopping for owner input when a required decision gate is reached.

## Default Execution Authority

The AI execution lead may proceed without additional confirmation for:

- documentation edits that preserve the accepted north star;
- code and test changes within existing product boundaries;
- examples, templates, visible demos, and local verification flows;
- README, documentation index, public explanation, deck outline, video script, and sponsor-letter drafts;
- issue templates, tracking issue drafts, review checklists, and release-prep checklists;
- consistency scans, capability audits, typecheck, tests, build, and local smoke checks;
- mechanical refactors that do not change public behavior or project direction;
- drafting public materials before publication.

Default execution does not include public posting, paid actions, account changes, permission expansion, or final release publication unless separately authorized.

## Required Owner Decision Gates

The AI execution lead must stop and ask the owner before:

- spending money or creating paid infrastructure;
- creating, deleting, or materially changing external accounts;
- requesting broad account permissions, long-lived secrets, or publish credentials;
- publishing a public video, sponsor page, press-style announcement, npm release, GitHub release, or major website change;
- making legal, compliance, financial, medical, regulatory, or safety claims;
- changing the project north star, values, non-goals, or trust-boundary language;
- removing public history or rewriting accepted decision records;
- representing that a third-party organization has adopted, endorsed, certified, sponsored, or reviewed OrgAnchor;
- accepting sponsorship terms that could affect ranking, verification, trust, or project independence;
- handling private keys, wallets, recovery codes, payment details, or sensitive credentials in repository files.

If a decision is ambiguous and could affect public trust, security, money, law, or project values, treat it as an owner decision gate.

## Work Loop

The default work loop is:

```text
1. Identify the next highest-leverage project step.
2. Check existing docs, tests, and implementation before changing anything.
3. Make the smallest coherent set of changes.
4. Update docs, examples, package files, and tests together when public surface changes.
5. Run the relevant verification commands.
6. Summarize what changed, what passed, what remains open, and the recommended next step.
```

For broad or public-facing work, prefer durable artifacts over chat-only decisions.

## Feedback Intake

External feedback should be routed into one of these categories:

```text
bug or implementation defect
documentation misunderstanding
public-positioning weakness
AI-agent integration friction
adopter onboarding friction
evidence-governance concern
S1-S3 evidence baseline concern
S4/S5 design-preview concern
Directory or discovery concern
security or abuse risk
sponsorship or support opportunity
out-of-scope request
```

The AI execution lead should convert useful feedback into:

- a code change;
- a documentation change;
- a test;
- a tracking issue;
- a known gap;
- a design question for owner review;
- or an explicit rejection with rationale.

Feedback should not automatically become project scope.

## Anti-Drift Controls

The project must use these files as alignment gates:

- `docs/project/PROJECT_NORTH_STAR.md`;
- `docs/project/DESIGN_RATIONALE.md`;
- `docs/project/PURPOSE_AND_VALUES.md`;
- `docs/evaluations/CAPABILITY_TRACEABILITY_MATRIX.md`;
- `docs/project/IMPLEMENTATION_STATUS.md`;
- `docs/operations/FIRESEED_READINESS_GATE.md`;
- `DOCS_INDEX.md`.

Before expanding scope, check:

```text
Does this lower discovery, verification, understanding, comparison, or transaction-friction cost?
Does this preserve external final judgment?
Does this avoid making OrgAnchor a trust badge, marketplace, certification authority, official registry, or storage monopoly?
Does this keep current implementation claims honest?
Does this help Fireseed Alpha reach external review sooner?
```

If the answer is unclear, defer the expansion or route it to owner review.

## Public Communication Rules

Public-facing claims must distinguish:

```text
implemented and tested;
implemented but manual or external;
partial;
design preview;
future work;
non-goal.
```

Use English as the canonical public and machine-contract language. Chinese explanations may be maintained for owner review and Chinese-speaking audiences, but they must not contradict the English public artifacts.

Never describe OrgAnchor as:

```text
permanent identity;
guaranteed truth;
absolute anti-censorship;
trust badge;
official registry;
marketplace ranking;
product certification;
replacement for law, regulators, professional testing, or buyer policy.
```

## Security And Secret Handling

Repository files must not contain:

- private root keys;
- recovery codes;
- wallet secrets;
- API tokens;
- payment details;
- hidden sponsor terms;
- private external-organization data.

Local self-pilot workspaces may contain operational artifacts, but public package-facing docs must not instruct users to copy secrets into the repository.

## Current Operating Priority

The current priority is Fireseed Alpha external validation.

That means:

```text
make the public explanation understandable;
make the visible verification loop easy to run;
make AI-agent verification easy to inspect;
make implementation/documentation gaps explicit;
prepare public deck, video scripts, sponsor letter, and tracking issue;
invite named reviewers and early adopters;
avoid expanding S4/S5 or Directory into large new systems before external review.
```

## Success Criteria

This operating model is working if:

- the owner does not need to manually push every small step;
- the AI execution lead keeps moving without crossing decision gates;
- important decisions are recorded in files, not only chat;
- tests and capability audits catch documentation/implementation drift;
- public readers can tell what is real, what is alpha, and what is future work;
- external feedback becomes structured project work instead of scattered discussion.

It fails if:

- the AI execution lead silently changes the north star;
- public materials overclaim implementation maturity;
- account, money, release, legal, or value decisions happen without owner approval;
- feedback becomes uncontrolled scope creep;
- the project becomes dependent on hidden private context instead of inspectable artifacts.
