# Agent Compatibility Iteration Plan

Status: Accepted for v1 alpha.

## Purpose

OrgAnchor should be easy for third-party AI agents to discover, verify, and summarize without special prior coordination.

The product goal is not only "can a human read the `/verify` page?" It is:

```text
Can an external AI agent reach a low-cost, policy-ready verification result?
```

Low-cost means fewer guesses, fewer network requests, smaller output, explicit failures, stable field names, and no hidden trust badge.

## Compatibility Layers

OrgAnchor exposes four layers. Each layer has a different stability expectation.

```text
stable verification core
compact first-pass result
explainable full result
optional extension fields
```

### Stable Verification Core

This layer must change slowly:

```text
/.well-known/organchor.json discovery
OrgAnchorVerifyIndex type/version
statement/signature/root_authority paths and hashes
root authority threshold signature verification
identity_status / value_status / trust_decision result fields
```

Breaking this layer breaks agents.

### Compact First-Pass Result

`organchor verify url <origin> --compact` is the preferred first pass for agents.

It should stay small, deterministic, and policy-friendly:

```text
overall_status
identity_status
value_status
trust_decision
organization
root_authority_hash
statement_hash
evidence_summary
failures
warnings
next_step
```

The compact result is not a trust badge. It is a routing object that helps an agent decide whether to stop, fetch the full result, request manual review, or continue transaction evaluation.

### Explainable Full Result

`organchor verify url <origin>` emits the full `OrgAnchorAgentVerificationResult`.

It may include richer details, but it should still avoid ambiguity. Every status must be explainable through a `checks[]` item.

### Optional Extension Fields

New provider receipts, evidence categories, policy hints, or model-facing summaries should start as optional fields.

Agents must be able to ignore unknown fields and still verify identity continuity.

## Iteration Metrics

Each agent-compatibility change should be judged against these metrics:

```text
discovery_success_rate
http_request_count
json_size_bytes
required_field_count
field_name_stability
schema_guesswork_required
failure_reason_clarity
false_positive_risk
false_negative_risk
backward_compatibility
test_fixture_pass_rate
```

Preferred direction:

```text
discovery_success_rate up
http_request_count down
json_size_bytes down for compact output
required_field_count stable or down
failure_reason_clarity up
schema_guesswork_required down
false_positive_risk down
false_negative_risk down
```

## Compatibility Rules

1. Do not remove or rename v1 stable fields without a versioned replacement.
2. Add optional fields before changing existing fields.
3. Keep `--compact` output small enough for first-pass agent routing.
4. Keep final trust outside OrgAnchor. `trust_decision` must remain explicit.
5. Every `PASS`, `WARN`, `FAIL`, or `NOT_INCLUDED` must have a machine-readable reason in the full result.
6. A missing value/evidence layer must never be interpreted as product quality.
7. Unknown fields must be safe to ignore.
8. Provider carriers such as domains, IPFS, Arweave, ENS, Onion, Cloudflare, GitHub, or NPM must never become the identity root.

## Test Fixtures

Agent-facing changes should be tested against at least these scenarios:

```text
valid identity and value evidence
tampered statement
wrong root authority
missing claims manifest
missing evidence manifest
unsupported claim
stale evidence
value report warning
carrier receipts missing
migration history present
```

The compact result should be covered separately because it is the object most external agents will likely consume first.

## Release Gate

Before promoting an agent-facing change, run:

```bash
node --run release:check
organchor verify url https://organchor.org
organchor verify url https://organchor.org --compact
```

For public releases, the OrgAnchor self-pilot should be regenerated and verified after source changes that affect `organchor.json`, the `/verify` page, or the verification result shape.

The integration guide and compact example should also remain valid:

```text
AGENT_INTEGRATION_GUIDE.md
examples/agent-verification/organchor-compact-result.json
```

## Feedback Loop

Compatibility work should collect failures from real agents:

```text
agent could not discover OrgAnchor
agent fetched the wrong artifact base path
agent confused carrier availability with identity authority
agent treated PASS as a final trust decision
agent could not distinguish missing evidence from failed evidence
agent output became too long or expensive
agent needed fields that were only present in prose
```

Each real failure should become one of:

```text
schema clarification
compact result field
full result check detail
documentation update
fixture test
breaking-change proposal for a future major version
```

## North Star

OrgAnchor succeeds when another agent, acting for another will-bearing party, can cheaply answer:

```text
Who is claiming this?
What root authority signed it?
Has the current official endpoint statement been changed or tampered with?
What product/service claims are being made?
What evidence supports them?
What is missing, stale, self-asserted, or manual-check-only?
Where should my own policy take over?
```

That is the iteration standard: lower the cost of knowing, without pretending to decide trust for everyone.
