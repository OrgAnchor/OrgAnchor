# OrgAnchor Organization Onboarding Checklist

Status: Draft operational checklist.

## Purpose

This checklist is for an organization adopting OrgAnchor.

It is intentionally practical. Each item should be checked by a human operator or an assisting agent.

## 0. Scope

- [ ] We understand that OrgAnchor is an identity continuity toolchain, not a legal identity authority.
- [ ] We understand that the root authority is the identity root.
- [ ] We understand that domains, Cloudflare, IPFS, Arweave, ENS, Onion, and lockfiles are carriers or receipts.
- [ ] We chose an adoption level: Level 1, 2, 3, 4, or 5.
- [ ] We chose a pilot wording that does not overclaim permanence, censorship resistance, or legal identity.
- [ ] For a first external pilot, we are following `docs/guides/EXTERNAL_PILOT_RUNBOOK.md`.

## 1. Workspace

- [ ] We created a separate adoption workspace outside the source repository.
- [ ] We confirmed `.gitignore` excludes private keys and local secrets.
- [ ] We know which files are public artifacts.
- [ ] We know which files are private local-only material.

Public by default:

```text
root-authority.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
public/verify/
organchor.lock.json
reports/
```

Private by default:

```text
keys/*.private.json
provider tokens
cloud credentials
arweave-wallet.local.json
payment data
```

## 2. Organization Profile

- [ ] Organization canonical name chosen.
- [ ] Organization display name chosen.
- [ ] Short public description written.
- [ ] Primary domain chosen.
- [ ] Security contact chosen.
- [ ] Current official endpoints listed.
- [ ] Claims that require evidence are separated from endpoint data.

## 3. Root Authority

- [ ] Root authority mode chosen.
- [ ] `1-of-1` accepted only for early/simple use.
- [ ] `2-of-3` or another threshold chosen for public long-term use.
- [ ] Each root member key has an owner or custody method.
- [ ] No private key is shared between multiple people.
- [ ] Key backup plan exists.
- [ ] Key loss plan exists.
- [ ] Key compromise plan exists.
- [ ] Root authority fingerprint will be published and recorded.

## 4. Statement and Signature

- [ ] `root-authority.json` generated.
- [ ] `official-endpoints.json` generated.
- [ ] Statement root authority hash matches `root-authority.json`.
- [ ] Statement signed by enough root authority members.
- [ ] Statement verifies locally.
- [ ] Tamper test performed or covered by tests.
- [ ] Signature file stored beside the statement.

## 5. Verify Page

- [ ] `public/verify/index.html` generated.
- [ ] `public/verify/organchor.json` generated.
- [ ] Public statement copied into `public/verify`.
- [ ] Public signature copied into `public/verify`.
- [ ] Root authority copied into `public/verify`.
- [ ] Claims/evidence manifests copied when available.
- [ ] Local verification works against `public/verify`.
- [ ] Private key scan completed for public files.

## 6. Traditional Website Carrier

- [ ] Website host selected.
- [ ] Domain account owner confirmed.
- [ ] `/verify/` deployed.
- [ ] `/.well-known/organchor.json` deployed if supported.
- [ ] `security.txt` deployed if supported.
- [ ] HTTPS works.
- [ ] Published statement and signature are fetchable.
- [ ] Website deployment receipt recorded in `organchor.lock.json`.

## 7. Domain Audit

- [ ] `organchor domain audit <domain>` run.
- [ ] JSON report generated.
- [ ] Markdown report generated.
- [ ] DNSSEC checked.
- [ ] SPF checked if mail is used.
- [ ] DMARC checked if mail is used.
- [ ] MX checked if mail is used.
- [ ] CAA checked.
- [ ] HTTPS certificate expiration checked.
- [ ] Registry Lock marked as manual if not automatically detectable.
- [ ] Auto-renewal marked as manual if not automatically detectable.
- [ ] Manual registrar account checks completed.

## 8. IPFS Mirror

- [ ] Verify directory size checked.
- [ ] Large files kept out of default `public/verify`.
- [ ] Local Kubo publish or provider upload completed.
- [ ] CID recorded.
- [ ] Gateway fetch tested.
- [ ] Hash verification passed.
- [ ] Provider limitations recorded honestly.

## 9. Arweave Archive

- [ ] Arweave manual package generated.
- [ ] Package contains only intended public artifacts.
- [ ] No private key or provider secret included.
- [ ] Upload cost estimated.
- [ ] Human approval obtained if payment or terms acceptance is required.
- [ ] Arweave/Turbo upload wallet is separate from root authority keys.
- [ ] TX ids recorded.
- [ ] Gateway hash verification passed.
- [ ] Gateway limitations recorded honestly.

## 10. OpenTimestamps

- [ ] Root authority hash stamped.
- [ ] Statement hash stamped.
- [ ] Signature hash stamped.
- [ ] Claims/evidence hashes stamped if available.
- [ ] `.ots` files stored in adoption package.
- [ ] Pending versus Bitcoin-anchored status recorded.
- [ ] Upgrade reminder created if proofs are pending.

## 11. Claims and Evidence

- [ ] Product/service claims manifest created if needed.
- [ ] Claims include limitations.
- [ ] Evidence manifest created if needed.
- [ ] Evidence items include issuer type.
- [ ] Evidence items include artifact hashes.
- [ ] Evidence items include locations.
- [ ] Claims reference existing evidence ids.
- [ ] Claims manifest signed.
- [ ] Evidence manifest signed.
- [ ] Verification passes.
- [ ] Large evidence artifacts are stored externally and hash-bound.

## 12. Disaster Recovery and Auxiliary Names

- [ ] Onion need assessed.
- [ ] Onion v3 address generated or deferred.
- [ ] Onion config generated if used.
- [ ] Onion service limitations documented.
- [ ] ENS need assessed.
- [ ] ENS plan generated if used.
- [ ] ENS records verified or marked pending.
- [ ] Neither Onion nor ENS is described as the identity root.

## 13. Adoption Status Report

- [ ] Human-readable status report written.
- [ ] Root authority hash included.
- [ ] Statement hash included.
- [ ] Verify URL included.
- [ ] IPFS CID included if available.
- [ ] Arweave TX ids included if available.
- [ ] OpenTimestamps status included.
- [ ] Domain audit summary included.
- [ ] Known limitations included.

## 14. Governance and Migration

- [ ] Root key custody documented.
- [ ] Backup procedure documented.
- [ ] Recovery procedure documented.
- [ ] Compromise response documented.
- [ ] Migration plan exists before long-term reliance.
- [ ] `docs/guides/MIGRATION_GUIDE.md` reviewed before any real root authority change.
- [ ] `authority change-plan` used for broader root set or threshold changes.
- [ ] Root authority migration rehearsed with non-public rehearsal filenames.
- [ ] Positive migration verification passed.
- [ ] Insufficient-signature negative test failed as expected.
- [ ] Wrong-new-authority negative test failed as expected.
- [ ] Old root authority record preservation plan exists.
- [ ] Historical statement preservation plan exists.

## 15. Final Safety Check

- [ ] No private root key in public artifacts.
- [ ] No upload wallet body in lockfile or reports.
- [ ] No provider token in lockfile or reports.
- [ ] No payment data in project files.
- [ ] Public wording avoids overclaiming.
- [ ] Verification commands have been run from public artifacts.

## Adoption Complete For Chosen Level

Write the final level:

```text
OrgAnchor adoption level: Level __
date:
operator:
remaining known gaps:
```
