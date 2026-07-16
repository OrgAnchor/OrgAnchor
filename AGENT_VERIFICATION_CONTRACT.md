# Agent Verification Contract

Status: Accepted for v1 alpha.

## Purpose

OrgAnchor's primary verification consumer is expected to be an external AI agent acting for another person, organization, buyer, partner, auditor, journalist, maintainer, or marketplace.

The contract goal is low-friction verification:

```text
discover -> download -> hash -> verify signatures -> inspect claims/evidence -> return structured findings
```

Chinese terms used in product discussions:

- Agent Verification Contract = AI 代理验证契约
- external AI agent = 外部 AI 代理
- claim = 主张 / 声明
- evidence = 证据 / 支撑材料
- value continuity = 价值连续性
- trust decision = 信任决策

OrgAnchor does not assign the final trust decision. It exposes signed identity continuity, evidence structure, visible gaps, and machine-readable findings so the external agent can apply its own policy.

## Version And Legacy Behavior

Agent-facing verification must distinguish version evolution from tampering.

A known older OrgAnchor package should be verified under the schema and verification rules that created it. If it passes those checks but lacks newer optional capabilities, a newer verifier should report a legacy or gap-bearing status rather than treating it as invalid.

Recommended interpretation:

```text
LEGACY_BUT_VERIFIABLE
  The package verifies under an older known version.

LEGACY_WITH_GAPS
  The package verifies under an older known version but lacks newer evidence, discovery, or agent-output capabilities.

UNSUPPORTED_VERSION
  The verifier cannot safely evaluate this version.

INVALID_OR_TAMPERED
  A supported package failed hash, signature, schema, root authority, or required-artifact checks.
```

This keeps historical adopter snapshots useful while still letting agents see that newer packages may provide stronger evidence or lower verification cost.

## Non-Goal

OrgAnchor must not become a self-awarded trust badge.

It must not say:

```text
This organization is good.
This product is true.
This vendor is safe to buy from.
This entity is legally or ethically certified.
```

It may say:

```text
The official-presence statement signature is valid or invalid.
The root authority hash matches or does not match.
The claims manifest is signed or missing.
The evidence manifest is signed or missing.
The lockfile snapshot is signed, unsigned, missing, or hash-mismatched.
The value continuity report contains PASS/WARN/FAIL/MANUAL_CHECK_REQUIRED counts.
The agent should review these gaps before making a transaction decision.
```

## Discovery

An agent should try the organization's origin first:

```text
https://example.org/.well-known/organchor.json
```

If that is unavailable, it may try:

```text
https://example.org/verify/organchor.json
```

The index should include:

```json
{
  "type": "OrgAnchorVerifyIndex",
  "version": "1.0",
  "agent_verification": {
    "contract": "https://organchor.org/specs/agent-verification.v1",
    "contract_version": "1.0",
    "primary_entrypoint": "/.well-known/organchor.json",
    "artifact_base_path": "/verify/",
    "command": "organchor verify url <organization-url>",
    "compact_command": "organchor verify url <organization-url> --compact",
    "result_type": "OrgAnchorAgentVerificationResult",
    "compact_result_type": "OrgAnchorAgentVerificationCompactResult",
    "trust_decision": "not_assigned_by_organchor"
  },
  "directory_discovery": {
    "status": "PRESENT",
    "role": "open-directory-discovery",
    "trust_boundary": {
      "directory_is_trust_root": false,
      "final_trust_decision": "EXTERNAL_AGENT",
      "records_must_verify_at_origin": true
    },
    "snapshot": {
      "path": "/directory/directory-snapshot.json",
      "hash": "sha256:<hash>",
      "hash_path": "/directory/directory-snapshot.json.sha256",
      "record_count": 1
    },
    "policy": {
      "path": "/directory/directory-policy.json",
      "hash": "sha256:<hash>"
    },
    "agent_flow": {
      "use": "candidate_discovery_only",
      "command": "organchor verify url <origin> --compact"
    }
  }
}
```

`artifact_base_path` tells the agent where relative artifact paths resolve. This prevents the agent from guessing whether files beside `/.well-known/organchor.json` or under `/verify/` are authoritative.

`directory_discovery`, when present, tells the agent where to find an optional Directory snapshot. The Directory is only a candidate-discovery surface. It is not the organization's identity root and does not replace direct origin verification.

`lockfile_integrity`, when present, tells the agent where to find the publication receipt ledger snapshot and its detached signature:

```json
{
  "lockfile_integrity": {
    "status": "SIGNED",
    "path": "organchor.lock.json",
    "hash": "sha256:<hash>",
    "signature_path": "organchor.lock.json.sig",
    "signature_hash": "sha256:<hash>",
    "valid_signatures": ["root-2026"],
    "required_signatures": 1,
    "trust_boundary": {
      "lockfile_is_identity_root": false,
      "carriers_are_identity_root": false,
      "purpose": "publication_receipt_history"
    }
  }
}
```

The lockfile is not the identity root. It is a root-signed publication receipt ledger. If a CID, transaction id, timestamp, artifact hash, or receipt field is changed after signing, the lockfile hash/signature check fails.

## Discovery Query Contract

When an agent does not already know which organization to verify, it may build or receive a local Beacon index and query it before running direct origin verification.

Recommended flow:

```text
collect seeds -> beacon sweep -> beacon index -> beacon query -> direct origin verification -> external policy
```

CLI shape:

```bash
organchor beacon sweep --seeds seeds.txt --out beacon-sweep.ndjson
organchor beacon index --in beacon-sweep.ndjson --out beacon-index.json
organchor beacon query --index beacon-index.json --need "identity continuity support" --capability identity-continuity --limit 10
```

`organchor beacon query` emits an `OrgAnchorBeaconQueryResult` object. This object is for candidate discovery and triage only. It must not be treated as a recommendation, ranking, certification, or final trust decision.

Stable top-level fields:

```json
{
  "type": "OrgAnchorBeaconQueryResult",
  "version": "0.1",
  "trust_boundary": {
    "local_index_is_trust_root": false,
    "final_trust_decision": "EXTERNAL_AGENT",
    "records_must_verify_at_origin": true
  },
  "match_report": {
    "type": "OrgAnchorBeaconNeedMatchReport",
    "version": "0.1",
    "boundary": {
      "discovery_match_is_not_recommendation": true,
      "no_paid_ranking": true,
      "final_decision": "EXTERNAL_AGENT"
    }
  },
  "candidates": []
}
```

Each candidate should include:

```text
origin
candidate_priority
organization
discovery
verification_summary
match_explanation
need_match
risk_gaps
verification_plan
next_step
```

`candidate_priority` is an execution hint, not a ranking promise:

```text
HIGH = reserved for a strong purpose-specific discovery match under an explicitly disclosed Directory policy
MEDIUM = usable discovery match, but less complete than HIGH
REVIEW = relevant but requires value-layer or compatibility review
LOW = signal exists but is incomplete or weak
REJECT = failed or unsafe local observation; recheck only if the origin has been repaired
```

`third_party_claims`, `reproducible_claims`, evidence volume, or `unsupported_claims == 0` must not by themselves produce `HIGH`. They describe structure and declared relations, not claim-scope fit, evidence sufficiency, product quality, or supplier trust.

`need_match.status` is also non-binding:

```text
STRONG_DISCOVERY_MATCH
POSSIBLE_DISCOVERY_MATCH
NEEDS_IDENTITY_VERIFICATION
NEEDS_VALUE_REVIEW
REJECT_OR_RECHECK
```

The required rule is:

```text
No candidate from beacon query is trusted until direct origin verification passes.
```

The next command for a selected candidate should usually be:

```bash
organchor verify url <origin> --compact
```

## Required Identity Checks

An agent verifying an organization should check at least:

```text
index.type == OrgAnchorVerifyIndex
statement hash matches index.statement.hash
signature hash matches index.signature.hash
root authority hash matches index.root_authority.hash
statement.root_authority_hash matches fetched root authority hash
official-presence statement signature meets root authority threshold
```

If any required identity check fails, the agent should treat the OrgAnchor identity result as failed.

## History And Carrier Checks

If present, the agent should also check:

```text
lockfile hash matches lockfile_integrity.hash
lockfile signature hash matches lockfile_integrity.signature_hash
lockfile signature meets root authority threshold
carrier receipts are treated as durability/discovery metadata, not identity roots
OpenTimestamps/Bitcoin proofs are treated as time anchors for hashes, not truth proofs
```

If `lockfile_integrity.status == "UNSIGNED"`, the agent may still inspect carrier receipts, but should treat them as unsigned metadata. If publication history matters for the decision, the recommended next step is to request a root-signed lockfile snapshot.

## Claims And Evidence Checks

If present, the agent should also check:

```text
claims manifest hash matches linked_artifacts.claims.hash
claims manifest signature meets root authority threshold
evidence manifest hash matches linked_artifacts.evidence.hash
evidence manifest signature meets root authority threshold
claim evidence_refs resolve to evidence ids
value continuity report hash matches value_continuity.hash
value continuity summary has no hidden PASS-only interpretation
```

These checks do not prove product quality by themselves. They reduce the cost of finding what is claimed, what supports it, what is missing, and what needs human or policy-level review.

## Result Object

`organchor verify url --compact` emits the preferred first-pass routing object:

```json
{
  "type": "OrgAnchorAgentVerificationCompactResult",
  "version": "1.0",
  "overall_status": "PASS",
  "identity_status": "PASS",
  "value_status": "PASS",
  "trust_decision": "NOT_ASSIGNED_BY_ORGANCHOR",
  "status_scope": {
    "identity_status": "CRYPTOGRAPHIC_AUTHORITY_AND_CONTINUITY",
    "value_status": "REPORT_INTEGRITY_AND_DECLARED_RELATION_CHECKS",
    "conformance_status": "ORGANCHOR_PROTOCOL_COMPATIBILITY",
    "evidence_sufficiency": "EXTERNAL_POLICY_DECISION",
    "claim_truth": "NOT_PROVEN_BY_ORGANCHOR_STATUS"
  },
  "evidence_summary": {
    "claims": "PASS",
    "evidence": "PASS",
    "value": "PASS",
    "unsupported_claims": 0,
    "total_evidence_items": 34,
    "third_party_claims": 0,
    "reproducible_claims": 1,
    "metric_semantics": {
      "unsupported_claims": "STRUCTURAL_LINKAGE_GAP_COUNT_NOT_EVIDENCE_SUFFICIENCY",
      "reproducible_claims": "DECLARED_RECHECK_METHOD_COUNT_NOT_VERIFIED_OUTCOME"
    },
    "manual_checks": 34,
    "profile_declared_claims": 0,
    "profile_pass_claims": 0,
    "profile_gap_claims": 0,
    "claim_support_levels": {
      "L0_UNSUPPORTED": 0,
      "L1_SIGNED_SELF_CLAIM": 0,
      "L2_HASH_BOUND_EVIDENCE": 33,
      "L3_REPRODUCIBLE_METHOD": 1,
      "L4_INDEPENDENT_ATTESTATION": 0,
      "TIME_OBSERVED": 0
    },
    "risk_gaps": 34,
    "top_risk_gaps": [
      "Only first-party evidence is linked.",
      "No explicit recheck method or reproducibility metadata is linked."
    ],
    "next_best_actions": [
      "Add an independent attestation or external evidence source for the exact claim.",
      "Add a concrete recheck method with steps, expected results, tools, cost, and limitations."
    ],
    "s2_summary": {
      "effective_s2_count": 0,
      "candidate_unverified_external_material_count": 0,
      "s2_state_counts": {
        "S2_1_GENERIC_ROUTE_PROVIDED": 0,
        "S2_2_VERIFIED_ROUTE_CHECKED": 0,
        "S2_3_ISSUER_BACKED": 0
      },
      "expired_s2_count": 0,
      "broken_s2_anchor_count": 0,
      "manual_check_s2_count": 0,
      "unknown_sample_source_count": 0,
      "unknown_relationship_count": 0,
      "top_s2_gaps": [],
      "next_actions": [
        "No S2 material is declared; request S2 only if the target purpose requires external support."
      ],
      "not_a_trust_decision": true
    },
    "s3_summary": {
      "effective_s3_count": 0,
      "candidate_unverified_sampling_count": 0,
      "s3_state_counts": {
        "S3_1_SAMPLING_ROUTE_PROVIDED": 0,
        "S3_2_CUSTODY_DOCUMENTED": 0,
        "S3_3_INDEPENDENT_TEST_RECORDED": 0
      },
      "organization_selected_sample_count": 0,
      "organization_provided_sample_count": 0,
      "missing_sample_identity_count": 0,
      "missing_claim_binding_count": 0,
      "missing_sample_pool_count": 0,
      "missing_sample_slot_count": 0,
      "missing_finite_policy_count": 0,
      "missing_duplicate_control_count": 0,
      "missing_credential_binding_count": 0,
      "missing_sampling_plan_count": 0,
      "organization_can_choose_samples_count": 0,
      "missing_raw_evidence_reference_count": 0,
      "organization_controlled_storage_count": 0,
      "missing_custody_count": 0,
      "manual_check_s3_count": 0,
      "top_s3_gaps": [],
      "next_actions": [
        "No S3 sampling evidence is declared; request S3 only if the target purpose requires random sampling or anti-hand-picked-sample support."
      ],
      "not_a_trust_decision": true
    }
  },
  "policy_route": {
    "route": "EXTERNAL_POLICY_REVIEW",
    "policy_owner": "EXTERNAL_AGENT",
    "trust_decision": "NOT_ASSIGNED_BY_ORGANCHOR",
    "reasons": [
      "manual_checks_present",
      "no_third_party_claims"
    ]
  },
  "failures": [],
  "warnings": []
}
```

`organchor verify url` emits the full machine-readable result:

```json
{
  "type": "OrgAnchorAgentVerificationResult",
  "version": "1.0",
  "overall_status": "PASS",
  "identity_status": "PASS",
  "value_status": "PASS",
  "trust_decision": "NOT_ASSIGNED_BY_ORGANCHOR",
  "status_scope": {
    "identity_status": "CRYPTOGRAPHIC_AUTHORITY_AND_CONTINUITY",
    "value_status": "REPORT_INTEGRITY_AND_DECLARED_RELATION_CHECKS",
    "conformance_status": "ORGANCHOR_PROTOCOL_COMPATIBILITY",
    "evidence_sufficiency": "EXTERNAL_POLICY_DECISION",
    "claim_truth": "NOT_PROVEN_BY_ORGANCHOR_STATUS"
  },
  "policy_route": {
    "route": "EXTERNAL_POLICY_REVIEW",
    "policy_owner": "EXTERNAL_AGENT",
    "trust_decision": "NOT_ASSIGNED_BY_ORGANCHOR"
  },
  "checks": []
}
```

The result separates:

- `identity_status`: cryptographic and root-authority verification.
- `value_status`: integrity and declared-relation checks for the claims/evidence/value-continuity report. `PASS` does not mean that evidence is sufficient or that a claim is true.
- `overall_status`: CLI summary for automation.
- `trust_decision`: always not assigned by OrgAnchor.
- `policy_route`: a non-binding routing hint for the external agent's own policy.
- `status_scope`: machine-readable limits for interpreting each status. Evidence sufficiency remains an external policy decision, and OrgAnchor status does not prove claim truth.

For older value reports that do not contain current claim-level support details, the verifier must remain conservative: expose the missing detail as a risk gap, preserve visible manual-check and first-party-only limitations, and recommend regenerating the report. Legacy verification must not turn absent fields into an apparent zero-risk result.

External agents should treat this result as input, not as the final answer.

## Future Purpose/Evidence/Challenge Fields

Future compact and full results should follow `PURPOSE_EVIDENCE_CHALLENGE_MODEL.md`.

The direction is to expose:

```text
purpose_profile
purpose_status
fit_for
not_enough_for
missing_for_purpose
missing_optional_context
source_classes_present
credential_binding_status
challenge_state
organization_response_status
remaining_policy_questions
next_best_actions
not_a_trust_decision
```

These fields are routing and sufficiency signals. They are not a ranking, recommendation, trust score, or purchase decision.

## Policy Route Values

`policy_route.route` is a low-friction routing hint. It does not certify the organization.

```text
STOP_IDENTITY_FAILURE
REVIEW_FAILED_CHECKS
REQUEST_VALUE_EVIDENCE
REVIEW_VALUE_WARNINGS
EXTERNAL_POLICY_REVIEW
READY_FOR_EXTERNAL_POLICY
```

The safest default is to treat anything other than `READY_FOR_EXTERNAL_POLICY` as requiring additional review by the agent owner's policy. Even `READY_FOR_EXTERNAL_POLICY` is not a trust badge; it only means OrgAnchor found no built-in reason to stop or request more evidence.

## Agent Policy Example

A conservative buying agent might require:

```text
identity_status == PASS
value_status != NOT_INCLUDED
no identity FAIL checks
value continuity FAIL count == 0
unsupported_claims == 0
at least one external evidence location for product claims
claim-to-evidence scope and purpose-fit sufficiency reviewed under the agent owner's policy
manual checks reviewed for high-value transactions
```

`unsupported_claims == 0` means the local audit found no missing declared evidence links or self-asserted-only claim state. It does not mean the linked evidence is scientifically sufficient, in scope, independent, current, or true.

A lower-risk discovery agent might only require:

```text
identity_status == PASS
official endpoints are current
claims/evidence are present enough to continue research
```

The key point: OrgAnchor lowers discovery and verification cost, while the agent's owner controls the policy.

## CLI

```bash
organchor verify url https://example.org
organchor verify url https://example.org --compact
```

The command:

```text
discovers the machine index
resolves artifact paths
downloads public artifacts
validates strict JSON
verifies canonical hashes
verifies root-authority signatures
checks optional claims/evidence/value reports
prints an OrgAnchorAgentVerificationResult JSON object
exits non-zero only when verification has FAIL checks
```

## Design Boundary

OrgAnchor should keep optimizing for:

```text
minimum external-agent friction
machine-readable artifacts
human-readable verification pages
explicit gaps and warnings
no final trust badge
no hidden dependence on OrgAnchor's own server
```

This is the core product axis: make it cheap for another will-bearing party, represented by an AI agent, to know what it needs to know before deciding whether to trust, transact, cooperate, or investigate further.

For an implementation-oriented guide, see `AGENT_INTEGRATION_GUIDE.md`.
