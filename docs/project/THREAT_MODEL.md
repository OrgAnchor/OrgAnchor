# OrgAnchor Threat Model

Status: Accepted baseline, actively implemented

This document defines what OrgAnchor tries to defend against, what it does not defend against, and which residual risks remain.

OrgAnchor does not make an online identity absolutely safe. It reduces single-point failure risk and makes identity, endpoint, discovery, and value-evidence claims easier to verify after domains, platforms, infrastructure, archives, or naming systems change.

## Protected Assets

OrgAnchor focuses on these assets:

- root private keys,
- root authority public key set,
- threshold rule,
- root authority migration statements,
- official endpoint statements,
- detached signatures,
- claims manifests,
- evidence manifests,
- evidence artifact hashes,
- value continuity reports,
- `/verify` static package,
- `/.well-known/organchor.json` Beacon,
- Directory snapshots and records,
- Arweave transaction receipts,
- IPFS CIDs and pinning receipts,
- OpenTimestamps proofs,
- onion disaster-recovery addresses,
- ENS auxiliary records,
- domain security reports,
- `organchor.lock.json` publication receipts.

## Trust Base

The final OrgAnchor verification question is:

```text
Does the current statement satisfy the current root authority rule,
or does it connect to that authority through a valid migration chain?
```

All other systems are carriers, hints, mirrors, archives, or discovery aids.

## Threats And Mitigations

### 1. Domain loss, DNS failure, or website outage

Risk:

- domain expires,
- DNS records are changed or broken,
- registrar account is compromised,
- website or CDN becomes unavailable,
- users assume the domain itself is the identity root.

Mitigation:

- signed endpoint statements are verified against root authority, not domain control,
- statements can be mirrored to IPFS and archived to Arweave,
- high-value hashes can be timestamped through OpenTimestamps,
- onion and auxiliary names can be declared as disaster routes,
- domain audit reports surface DNSSEC, SPF, DMARC, CAA, HTTPS, security.txt, `/verify`, and manual registrar checks.

Residual risk:

- if no one saved historical root authority records or statements, external observers may struggle to establish continuity after a complete disappearance,
- short-term users can still be misled if they only read a web page and do not verify signatures.

### 2. Platform account loss or censorship

Risk:

- GitHub, social, app-store, document, or cloud accounts are suspended, stolen, or abandoned,
- external observers confuse platform accounts with organization identity.

Mitigation:

- platform accounts are only signed endpoints,
- a new signed statement can replace them,
- old and new statements can be linked through the same root authority or a migration chain.

Residual risk:

- if the organization never published root authority material before the platform loss, rebuilding external confidence is harder.

### 3. Website compromise or artifact replacement

Risk:

- attacker replaces `official-endpoints.json`,
- attacker replaces `/verify/index.html`,
- attacker publishes fake endpoints,
- attacker publishes a fake Beacon.

Mitigation:

- statements use canonical JSON hashes,
- detached signatures must satisfy the root authority threshold,
- verify index records expected hashes,
- Beacon declared hashes must match strict verification results,
- external agents should run `organchor verify url` or an independent verifier,
- mirrors and archives provide cross-checking.

Residual risk:

- a human who only reads the page and never verifies can still be deceived,
- if an attacker controls enough root keys to meet threshold, OrgAnchor cannot distinguish them from the legitimate authority.

### 4. Root private key leakage

Risk:

- in `1-of-1`, one leaked private key can sign false statements,
- in `m-of-n`, an attacker who obtains enough keys can meet threshold,
- shared private keys destroy accountability.

Mitigation:

- private keys are ignored by `.gitignore`,
- private key files use restrictive permissions where supported,
- root authority sets support threshold signing,
- each root member should hold a separate key,
- migrations allow movement from `1-of-1` to `m-of-n`,
- custody guidance recommends offline storage, recovery planning, and periodic review.

Residual risk:

- enough leaked threshold keys is a highest-severity event,
- software alone cannot repair a root compromise without previously trusted migration or external social/legal proof.

### 5. Root key loss or governance deadlock

Risk:

- a solo holder loses a `1-of-1` key,
- too many members lose keys in `m-of-n`,
- threshold is too high and the organization cannot sign,
- threshold is too low and one faction can over-control the identity.

Mitigation:

- start simple, migrate as governance matures,
- document custody roles,
- use migration statements to change root authority membership,
- keep public root records and historical statements archived.

Residual risk:

- poor governance choices cannot be fully solved by cryptography.

### 6. Fake or partial OrgAnchor adopters

Risk:

- a site copies OrgAnchor wording but omits strict verification artifacts,
- a fake Beacon declares hashes that do not match signed artifacts,
- unknown extension fields try to override core semantics,
- Directory records index unverified origins.

Mitigation:

- Beacon inspection distinguishes claimed signals from verified conformance,
- unknown Beacon fields are ignored,
- declared Beacon hashes must match strict verification,
- Directory records must point back to origin-owned verification URLs,
- Directory snapshots declare they are not trust roots,
- `conformance_status` lets agents reject partial or failed adoption.

Residual risk:

- crawlers will still see spam or malformed signals,
- external agents need filtering, rate limits, deduplication, and direct origin verification.

### 7. Directory capture or monopoly

Risk:

- one Directory becomes a de facto gatekeeper,
- Directory operator biases ranking,
- Directory includes paid or manipulated recommendations,
- adopters become invisible if they are not in the dominant Directory.

Mitigation:

- every adopter publishes its own Beacon,
- anyone can crawl and build an alternative Directory,
- Directory records are summaries only,
- agents must verify at origin,
- official Directory output must explain why a candidate was returned and which risks remain,
- OrgAnchor does not assign final trust decisions.

Residual risk:

- discovery convenience can still concentrate attention,
- external ecosystems may prefer a few popular indexes.

### 8. Evidence laundering and value overclaiming

Risk:

- an organization publishes true identity but weak or misleading product claims,
- first-party evidence is presented as independent proof,
- stale evidence remains visible,
- large media artifacts are used to impress humans but do not prove claims.

Mitigation:

- claims and evidence are separate signed artifacts,
- value audit distinguishes first-party, third-party, reproducible, stale, unsupported, and manual-check items,
- evidence artifacts are hashed,
- reports expose gaps instead of hiding them,
- OrgAnchor refuses to assign a final trust score.

Residual risk:

- product efficacy often requires domain-specific external evaluation,
- dishonest organizations can still publish selective evidence,
- third-party evidence can itself be low quality or captured.

### 9. Carrier failure or carrier capture

Risk:

- IPFS content is not pinned,
- Arweave upload fails,
- gateways become unavailable,
- timestamp services are temporarily unavailable,
- users confuse a carrier receipt with identity authority.

Mitigation:

- carrier receipts are recorded in `organchor.lock.json`,
- publish commands output hashes,
- verify commands compare remote content to expected hashes,
- carriers are documented as optional durability/discovery layers,
- multiple carriers can cross-check the same artifact.

Residual risk:

- no carrier guarantees universal availability forever,
- large evidence artifacts can create storage cost and retention tradeoffs.

### 10. Cryptographic obsolescence

Risk:

- Ed25519 could become insufficient in the future,
- quantum-capable adversaries could eventually threaten current public-key signatures,
- old statements may need historical interpretation after algorithm migration.

Mitigation:

- algorithm identifiers are explicit,
- canonical hashing is separate from signing,
- root authority migration can introduce new key algorithms,
- post-quantum migration is an explicit design path,
- high-value historical hashes can be timestamped.

Residual risk:

- quantum-safe operational migration depends on future mature libraries, standards, and adoption,
- old signatures may become historical evidence rather than future-proof authentication.

### 11. AI-agent misuse

Risk:

- agents treat OrgAnchor PASS as final trust,
- agents ignore warnings or manual checks,
- agents trust Directory ranking without origin verification,
- agents fail to understand unsupported claims.

Mitigation:

- result fields say `trust_decision: NOT_ASSIGNED_BY_ORGANCHOR`,
- policy routes are owned by the external agent,
- compact and full results expose failures, warnings, gaps, and next steps,
- Directory candidate results include match explanations and verification plans.

Residual risk:

- weak agents or bad integrations can still misuse the data,
- OrgAnchor can reduce ambiguity but cannot control all downstream decisions.

## Non-Goals

OrgAnchor does not provide:

- a blockchain,
- a DID method,
- a government registry replacement,
- a complete wallet,
- a VC issuance platform,
- DAO governance,
- internal organization permissions,
- SaaS user accounts,
- hosting,
- search monopoly,
- final supplier ranking,
- legal, medical, or financial assurance.

## Severity Rule

If identity verification fails, agents must stop before evaluating value claims.

If identity passes but value evidence is missing or weak, agents can use the identity result for endpoint continuity, but they should not use product or service claims as trusted transaction inputs without external review.
