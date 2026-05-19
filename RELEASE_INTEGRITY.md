# OrgAnchor Release Integrity Gate

Status: Active release gate for alpha and future stable releases.

## Purpose

OrgAnchor is a continuity toolchain, so the project itself must avoid drifting into a pile of disconnected receipts.

This document defines the release integrity gate: the checks that keep source code, package metadata, public self-pilot artifacts, carrier receipts, and release notes describing the same project state.

It is not a new trust root. The trust root remains the adopting organization's root authority and valid signatures.

## Core Principle

Each OrgAnchor release should make three things line up:

```text
source state
public verification state
release/package state
```

If a carrier receipt, deployment URL, archive transaction, CID, timestamp proof, or public hash is stale, missing, or intentionally one step behind, the release must say that plainly.

## What Counts As Authority

Authoritative for identity continuity:

- `root-authority.json`
- valid threshold signatures from the root authority
- signed official endpoint statements
- signed migration statements
- signed claims and evidence manifests, when used

Not authoritative by themselves:

- `organchor.lock.json`
- IPFS CIDs
- Arweave transaction ids
- OpenTimestamps proofs
- ENS records
- Onion addresses
- Cloudflare deployments
- GitHub releases
- npm package metadata

Those are carriers, discovery surfaces, archives, mirrors, receipts, or timestamps. They improve verification and continuity, but they do not replace the root authority.

## Self-Reference Rule

A generated `/verify` page cannot contain the final content hash, CID, Arweave transaction id, or deployment hash of itself without changing itself again.

Therefore release notes and public status pages must distinguish:

- Current public artifact hash.
- Latest archived or mirrored prior artifact hash.
- Final website deployment receipt.
- Known self-reference gap, if the current page displays the receipt for a previous package.

This is normal for content-addressed publication. Do not chase infinite regeneration loops.

## Release Order

Use this order for alpha, stable, and self-pilot milestone releases.

1. Freeze the target source commit and version.
2. Generate or update statements, claims, evidence, and migration artifacts.
3. Sign all required artifacts with the current root authority.
4. Generate `public/verify`.
5. Verify local statements, claims, evidence, and root continuity.
6. Mirror the verify package to IPFS when required.
7. Archive small final public artifacts to Arweave when required.
8. Stamp or upgrade important hashes with OpenTimestamps when required.
9. Regenerate `public/verify` so it displays the newest carrier receipts.
10. Deploy the traditional website carrier.
11. Verify the public website, including `/verify/organchor.json` and `/.well-known/organchor.json`.
12. Record the final deployment receipt without trying to make the page contain its own final deployment hash.
13. Run source, package, and install checks.
14. Tag Git, publish npm, and create the GitHub release.

## Release State Matrix

Complete this matrix before publishing a release or declaring a self-pilot milestone.

```text
release version:
git commit:
git tag:
npm version:
npm dist-tag:
github release:

public verify URL:
public organchor.json hash:
public index.html hash:
public statement hash:
public root authority hash:
public claims manifest hash:
public evidence manifest hash:

ipfs CID:
ipfs directory hash:
ipfs verification status:

arweave manifest hash:
arweave verify index TX:
arweave verify page TX:
arweave verification status:

opentimestamps proof status:
cloudflare deployment URL:
cloudflare deployment hash:
domain audit status:
known self-reference gap:
known release gaps:
```

## Minimum Checks

Run the normal release checks:

```bash
node --run release:check
```

Run a manual secret scan and inspect matches:

```bash
rg -n "private\\.json|BEGIN PRIVATE|api[_-]?key|secret|token|jwt|wallet|cloudflare|pinata" .
```

Verify the public identity artifacts from a clean retrieval path whenever possible:

```bash
organchor statement verify \
  --authority public/verify/root-authority.json \
  --in public/verify/official-endpoints.json \
  --sig public/verify/official-endpoints.json.sig
```

If claims and evidence are published:

```bash
organchor evidence verify \
  --authority public/verify/root-authority.json \
  --in public/verify/evidence/evidence-manifest.json \
  --sig public/verify/evidence/evidence-manifest.json.sig

organchor claims verify \
  --authority public/verify/root-authority.json \
  --in public/verify/claims/product-claims.json \
  --sig public/verify/claims/product-claims.json.sig \
  --evidence public/verify/evidence/evidence-manifest.json
```

If Arweave receipts are claimed:

```bash
organchor archive arweave verify \
  --tx <ARWEAVE_TX_ID> \
  --gateway https://arweave.net \
  --expected-hash sha256:<EXPECTED_HASH>
```

If IPFS receipts are claimed:

```bash
organchor mirror ipfs verify \
  --cid <CID> \
  --api http://127.0.0.1:5001 \
  --expected-hash sha256:<EXPECTED_HASH>
```

Use another gateway or local node if a provider gateway is unavailable. Record gateway-specific limitations instead of hiding them.

## Release Blockers

Do not publish or promote a release if any of these are true:

- Private keys, wallets, provider tokens, passwords, payment data, or recovery codes appear in publishable files.
- The statement does not verify against the advertised root authority.
- Root continuity or migration history is broken.
- The public `/verify` page is unreachable for the claimed website carrier.
- `organchor.json` is missing the visible proof trail, root continuity, or claimed carrier receipts.
- README, changelog, npm version, Git tag, and release notes describe different release states.
- A content-addressing self-reference gap exists but is not documented.
- The release claims permanence, absolute censorship resistance, legal identity, or full decentralization.

## Release May Proceed When

Release may proceed when:

```text
source checks pass
package checks pass
install checks pass
public self-pilot state is verified or gaps are explicit
carrier receipts are recorded with hashes
self-reference limits are stated
release notes match the package version and Git tag
```

## Operator Habit

Treat every release as a reproducible continuity rehearsal.

If a step required manual intervention, provider-specific behavior, credentials, a payment decision, or a workaround, record it in the relevant runbook so the next organization can repeat the path with fewer surprises.
