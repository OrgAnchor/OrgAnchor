# Public Self-Pilot Minimal Review - 2026-07-06

Status: Active public self-pilot review snapshot.

## Purpose

This review checks whether OrgAnchor's own public self-pilot can be verified from an external reviewer's point of view using the current `PILOT_MINIMAL_PATH.md`.

The review uses public URLs and public artifacts only. It does not use the private self-pilot workspace, provider credentials, root private keys, upload wallets, or deployment secrets.

## Target

```text
https://organchor.org
https://organchor.org/verify/
https://organchor.org/.well-known/organchor.json
```

## Review Question

```text
Can an independent reviewer discover OrgAnchor's public OrgAnchor signal, fetch the verify package, verify identity continuity, verify published claims/evidence, and see the current trust boundary without private context?
```

## Commands Run

```bash
node E:\CivX\OrgAnchor\src\cli.ts verify url https://organchor.org --compact
node E:\CivX\OrgAnchor\src\cli.ts doctor https://organchor.org
```

Downloaded public artifacts:

```text
https://organchor.org/verify/
https://organchor.org/.well-known/organchor.json
https://organchor.org/verify/organchor.json
https://organchor.org/verify/root-authority.json
https://organchor.org/verify/official-endpoints.json
https://organchor.org/verify/official-endpoints.json.sig
https://organchor.org/verify/claims/product-claims.json
https://organchor.org/verify/claims/product-claims.json.sig
https://organchor.org/verify/evidence/evidence-manifest.json
https://organchor.org/verify/evidence/evidence-manifest.json.sig
https://organchor.org/verify/reports/value-continuity-report.json
https://organchor.org/verify/reports/value-continuity-report.md
```

Then verified downloaded artifacts locally:

```bash
node E:\CivX\OrgAnchor\src\cli.ts statement verify --authority root-authority.json --in official-endpoints.json --sig official-endpoints.json.sig
node E:\CivX\OrgAnchor\src\cli.ts evidence verify --authority root-authority.json --in evidence/evidence-manifest.json --sig evidence/evidence-manifest.json.sig
node E:\CivX\OrgAnchor\src\cli.ts claims verify --authority root-authority.json --in claims/product-claims.json --sig claims/product-claims.json.sig --evidence evidence/evidence-manifest.json
```

## Results

### Agent Verification

`organchor verify url https://organchor.org --compact` returned:

```text
overall_status: PASS
identity_status: PASS
value_status: PASS
conformance_status: FULL_COMPATIBLE
trust_decision: NOT_ASSIGNED_BY_ORGANCHOR
```

Observed hashes:

```text
root_authority_hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
statement_hash: sha256:5811e45488c093e8820b35edf144a8dbae0c20a79063a44993043bfdf26a0a36
```

`organchor doctor https://organchor.org` returned:

```text
status: READY
conformance_status: FULL_COMPATIBLE
blocking_issues: none
warnings: none
missing_capabilities: none
```

### Direct Statement Verification

Downloaded public `root-authority.json`, `official-endpoints.json`, and `official-endpoints.json.sig` verified locally.

Result:

```text
PASS
Statement hash: sha256:5811e45488c093e8820b35edf144a8dbae0c20a79063a44993043bfdf26a0a36
Authority hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
Valid signatures: organchor-root-a-2026, organchor-root-b-2026
```

The public root authority threshold is visible in `organchor.json`:

```text
required signatures: 2
total root members: 3
```

### Claims And Evidence Verification

Downloaded public claims and evidence artifacts verified locally.

Evidence result:

```text
PASS
Evidence manifest hash: sha256:98e09592668e63f03ce3f262f613242988b458fc2abd82bf573492a21971768b
Authority hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
Valid signatures: organchor-root-a-2026, organchor-root-b-2026
```

Claims result:

```text
PASS
Claims hash: sha256:9d27f1b5f19debde55b6550bbc1d9fc8fcaa3a71e4feb33010eaaf742168d771
Authority hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
Valid signatures: organchor-root-a-2026, organchor-root-b-2026
```

The compact result reported:

```text
claims: PASS
evidence: PASS
value: PASS
unsupported_claims: 0
total_evidence_items: 34
manual_checks: 34
third_party_claims: 0
reproducible_claims: 1
```

This is an acceptable Fireseed Alpha self-pilot result. It verifies structure and published evidence relationships, while still routing final trust to the external reviewer.

## Minimal Path Assessment

Against `PILOT_MINIMAL_PATH.md`:

| Gate | Result | Notes |
| --- | --- | --- |
| Find OrgAnchor signal | PASS | `/.well-known/organchor.json` reachable and detected as Beacon. |
| Open `/verify` page | PASS | `/verify/` reachable. |
| Fetch machine-readable package | PASS | `/verify/organchor.json` reachable and parseable. |
| Verify signed official-presence statement | PASS | Public artifacts verify locally. |
| Inspect root authority continuity | PASS | Current 2-of-3 root authority visible; no migration history included. |
| Inspect claims/evidence | PASS | Claims and evidence manifests verify. |
| See evidence gaps and next steps | PASS | Compact output exposes manual checks and external-policy route. |
| Avoid trust-badge overclaim | PASS | Compact result keeps `trust_decision: NOT_ASSIGNED_BY_ORGANCHOR`. |

Current self-pilot status:

```text
Minimal public identity/evidence loop: PASS
Fireseed public self-pilot gate: PASS
Broad stable-v1 claim: NOT APPLICABLE
```

## Resolved Public Lockfile Verification

Initial check during this review found a public lockfile serving gap.

The earlier compact result reported:

```text
history_summary.lockfile: NOT_INCLUDED
next_step: Ask the organization to publish a root-signed lockfile snapshot if publication history matters.
```

Earlier manual URL checks showed:

```text
https://organchor.org/verify/organchor.lock.json
https://organchor.org/verify/organchor.lock.json.sig
```

returned HTTP 200, but the downloaded bodies began with:

```html
<!doctype html>
<html lang="en">
```

That meant the public paths fell back to the verify HTML page instead of serving real JSON/signature files.

Result:

```text
root-signed lockfile verification from public URL: FAIL / NOT AVAILABLE before redeploy
```

The deployment source was missing the copied lockfile files under `public/verify/`. The self-pilot lockfile was then signed by the 2-of-3 root authority, the verify page was regenerated with explicit lockfile inputs, and Cloudflare Pages was redeployed.

Redeployment:

```text
completed_at: 2026-07-06T03:11:46.047Z
deployment_url: https://192fca46.organchor-verify.pages.dev
custom_domain: https://organchor.org
file_count: 23
directory_hash: sha256:25608ca46d8f1b4a74f923ae87dc73437c7ab10cb7f4826a2ceaa4ed81ba5f2c
```

After redeploy, public downloads showed real JSON bodies:

```text
https://organchor.org/verify/organchor.lock.json      -> OrgAnchorLockfile JSON
https://organchor.org/verify/organchor.lock.json.sig  -> OrgAnchorSignature JSON
```

Public lockfile verification then passed:

```text
PASS
Lockfile hash: sha256:f67473676a29ccd17008a22a46e94047d6b8b66a85f8c4fe35309e8aab92b471
Authority hash: sha256:7d720aa028e4b3b94d47b8e8789b0d7f5c8bb0564e80fac7f0ad7b275718e1b9
Valid signatures: organchor-root-a-2026, organchor-root-b-2026
```

The compact result now reports:

```text
history_summary.lockfile: PASS
history_summary.lockfile_hash: sha256:f67473676a29ccd17008a22a46e94047d6b8b66a85f8c4fe35309e8aab92b471
history_summary.carrier_receipts: PASS
```

## Accepted Boundary

This review supports Fireseed Alpha outreach because:

- public identity verification passes;
- public claims/evidence verification passes;
- AI-agent compact output is available;
- final trust remains external;
- public root-signed lockfile verification now passes.

This review does not support claims that:

- OrgAnchor is stable v1;
- OrgAnchor certifies itself or others;
- S4/S5 are finished governance systems.

## Decision

```text
GO for continued Fireseed Alpha external review.
PUBLIC MINIMAL LOOP: PASS.
PUBLIC ROOT-SIGNED LOCKFILE VERIFICATION: PASS.
```
