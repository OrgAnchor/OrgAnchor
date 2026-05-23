# Agent Integration Guide

Status: Accepted for v1 alpha.

Chinese name: AI 代理接入指南.

## Purpose

This guide is for third-party AI agents, agent developers, marketplaces, buyers, auditors, maintainers, and research tools that want to verify an organization's OrgAnchor public identity package with low friction.

The goal is not to make an agent "trust OrgAnchor." The goal is to help an agent cheaply answer:

```text
Is there a signed organization endpoint statement?
Which root authority signed it?
Did the public files change after signing?
Are claims and evidence present?
What is missing or only manual-checkable?
Where should the agent's own policy take over?
```

OrgAnchor reports verification facts, gaps, and warnings. It does not assign the final trust decision.

## Terms

```text
AI agent = AI 代理，代表某个用户、组织、买家、平台或审计方做查询和判断的程序
origin = 组织主入口，例如 https://example.org
well-known entrypoint = 标准发现入口 /.well-known/organchor.json
verify package = 验证包，通常位于 /verify/
compact result = 极简验证结果，适合第一轮快速判断
full result = 完整验证结果，适合深入审查
root authority = 根权威，由组织长期维护的根公钥集合和签名阈值
carrier = 承载体，例如域名、IPFS、Arweave、ENS、Onion、Cloudflare、GitHub
trust decision = 信任决策，由外部代理自己的策略决定
```

## Minimal Flow

An external agent should follow this order:

```text
discover -> compact verify -> policy route -> full verify if needed -> fetch evidence if needed
```

For an origin such as:

```text
https://example.org
```

try:

```text
https://example.org/.well-known/organchor.json
```

If unavailable, try:

```text
https://example.org/verify/organchor.json
```

Then run:

```bash
organchor verify url https://example.org --compact
```

If the compact result is insufficient for the transaction or risk level, run:

```bash
organchor verify url https://example.org
```

## Optional Directory Discovery

Some organizations may also publish a Directory discovery pointer in `/.well-known/organchor.json` or `/verify/organchor.json`:

```json
{
  "directory_discovery": {
    "status": "PRESENT",
    "snapshot": {
      "path": "/directory/directory-snapshot.json",
      "hash": "sha256:<hash>",
      "hash_path": "/directory/directory-snapshot.json.sha256",
      "record_count": 1
    },
    "policy": {
      "path": "/directory/directory-policy.json",
      "hash": "sha256:<hash>"
    }
  }
}
```

Agents can use this to find candidate organizations with lower discovery cost. The Directory is not a trust root. For every selected record, the agent should still run:

```bash
organchor verify url <origin> --compact
```

To inspect a published Directory pointer before using it:

```bash
organchor directory inspect https://example.org
```

This command checks the verify-index pointer, snapshot shape, snapshot hash, optional hash file, policy hash, and trust-boundary flags.

To retrieve verified candidate records:

```bash
organchor directory fetch https://example.org
```

The fetch result includes candidate origins and a `next_step` field for each record. That next step remains direct origin verification, not trust by Directory listing.

Agents should filter before deep verification when a Directory contains many records:

```bash
organchor directory fetch https://example.org --capability identity-continuity --identity-status PASS --limit 5
```

Supported filters are category, capability, region, language, identity status, value status, policy route, and limit. This keeps discovery cheap while preserving the rule that selected organizations must still be verified at their own origin.

## Compact Result

The compact result is the preferred first-pass object.

Example:

```json
{
  "type": "OrgAnchorAgentVerificationCompactResult",
  "version": "1.0",
  "target": "https://organchor.org",
  "overall_status": "PASS",
  "identity_status": "PASS",
  "value_status": "PASS",
  "trust_decision": "NOT_ASSIGNED_BY_ORGANCHOR",
  "organization": {
    "name": "OrgAnchor",
    "display_name": "OrgAnchor"
  },
  "root_authority_hash": "sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9",
  "statement_hash": "sha256:5811e45488c093e8820b35edf144a8dbae0c20a79063a44993043bfdf26a0a36",
  "evidence_summary": {
    "claims": "PASS",
    "evidence": "PASS",
    "value": "PASS",
    "unsupported_claims": 0,
    "total_evidence_items": 34,
    "third_party_claims": 0,
    "reproducible_claims": 1,
    "manual_checks": 34
  },
  "policy_route": {
    "route": "EXTERNAL_POLICY_REVIEW",
    "policy_owner": "EXTERNAL_AGENT",
    "trust_decision": "NOT_ASSIGNED_BY_ORGANCHOR",
    "reasons": [
      "manual_checks_present",
      "no_third_party_claims"
    ],
    "guidance": "Verification passed, but external policy still needs to decide whether first-party evidence and manual checks are sufficient."
  },
  "failures": [],
  "warnings": [],
  "next_step": "Use the verified artifacts as inputs to your own policy; OrgAnchor does not assign final trust."
}
```

The same example is stored at:

```text
examples/agent-verification/organchor-compact-result.json
```

## Policy Route

`policy_route` means strategy routing / 策略路由. It is not a final trust decision.

It helps an external agent avoid a common mistake:

```text
identity PASS -> therefore organization is trustworthy
```

The correct interpretation is:

```text
identity PASS -> the signed identity package verified
policy_route -> what the external agent should do next
trust_decision -> still NOT_ASSIGNED_BY_ORGANCHOR
```

Current route values:

```text
STOP_IDENTITY_FAILURE = stop using the endpoint statement as verified OrgAnchor identity
REVIEW_FAILED_CHECKS = identity passed, but other verification checks failed
REQUEST_VALUE_EVIDENCE = identity passed, but claims/evidence/value layer is missing
REVIEW_VALUE_WARNINGS = value layer exists but has warnings or unsupported claims
EXTERNAL_POLICY_REVIEW = verification passed, but manual checks or first-party-only evidence remain
READY_FOR_EXTERNAL_POLICY = package is ready as input to the agent's own policy
```

For example, OrgAnchor's own self-pilot can verify as `PASS` while still routing to `EXTERNAL_POLICY_REVIEW`, because it has first-party evidence and manual checks but not independent third-party claims. That is intentional.

## Status Meaning

```text
PASS = the checked item passed
WARN = the item is present but needs review
FAIL = the item failed and should not be ignored
NOT_INCLUDED = the item was not included in this OrgAnchor package
```

An agent should treat identity failures as hard failures for OrgAnchor identity continuity.

An agent should not treat missing claims or missing evidence as proof of bad behavior. It should treat them as missing support for product or service evaluation.

## Recommended Policy Routing

A low-risk discovery agent may continue when:

```text
identity_status == PASS
overall_status != FAIL
```

A buying, listing, funding, or partnership agent should usually require:

```text
identity_status == PASS
value_status == PASS
failures.length == 0
evidence_summary.unsupported_claims == 0
```

For high-value or safety-sensitive decisions, the agent should additionally require its own review of:

```text
manual_checks
third-party evidence
freshness of evidence
legal or compliance requirements
independent reputation signals
```

## What Agents Must Not Infer

Agents must not infer:

```text
PASS means the organization is good
PASS means the product works
PASS means the vendor is safe
Arweave/IPFS/ENS/domain presence means identity authority
OrgAnchor has certified the organization
missing evidence means fraud
```

Agents may infer:

```text
the signed identity statement passed or failed verification
the root authority hash matched or did not match
the claims/evidence/value layers were present, missing, or invalid
the organization exposed enough structured material for the agent's own policy to evaluate further
```

## Full Result

Use the full result when an agent needs the detailed check list:

```bash
organchor verify url https://example.org
```

The full result includes:

```text
index_url
artifact_base_url
organization
identity
value_continuity
policy_route
checks[]
recommended_next_steps[]
```

Every `FAIL` and `WARN` should be traceable through `checks[]`.

## HTTP-Only Fallback

If the OrgAnchor CLI is not available, an agent can still use the public index:

```text
GET /.well-known/organchor.json
read statement.path, signature.path, root_authority.path
resolve paths against agent_verification.artifact_base_path
download the statement, signature, and root authority
validate JSON
canonicalize JSON
check SHA-256 hashes
verify root authority threshold signatures
inspect linked_artifacts and value_continuity if present
```

The CLI is recommended because it implements these checks consistently.

## Compatibility Rules

Agents should:

```text
ignore unknown fields
respect type and version fields
treat trust_decision as informational, not final
prefer --compact for first-pass routing
use the full result before high-risk decisions
cache results only with a short TTL unless a policy says otherwise
surface failures to the user instead of hiding them
```

OrgAnchor should:

```text
keep compact fields stable
add optional fields before changing stable fields
avoid turning PASS into a trust badge
make all failures explicit
keep carrier receipts separate from identity authority
```

See `AGENT_COMPATIBILITY_PLAN.md` for the iteration rules.

## Reference Commands

```bash
organchor verify url https://organchor.org --compact
organchor verify url https://organchor.org
```

The OrgAnchor self-pilot is available at:

```text
https://organchor.org/verify/
https://organchor.org/.well-known/organchor.json
```

Use the self-pilot as a reference implementation, not as a universal trust authority.
