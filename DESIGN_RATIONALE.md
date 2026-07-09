# OrgAnchor Design Rationale

Status: Active explanatory design document.

## Purpose

This document explains why OrgAnchor is designed as a system instead of a single signing tool, badge, registry, marketplace, or storage service.

It connects:

```text
core goal -> required properties -> design mechanisms -> expected effects -> limits
```

The goal is not to make readers memorize every artifact. The goal is to make the design logic obvious enough that a reviewer can see why each layer exists and where its boundary is.

## Core Goal

OrgAnchor's core goal is to lower the cost of finding, verifying, understanding, and comparing organizations, especially for AI agents acting for demand-side or supply-side parties.

More precisely:

```text
Help external parties and AI agents discover an organization, verify who is speaking, inspect what it claims, see what evidence supports or fails to support those claims, understand gaps and commercial-fit constraints, and make their own decision without relying on OrgAnchor as a final trust authority.
```

This goal requires more than "a signed website URL". A signed URL only answers a narrow question:

```text
Did this key sign this official-presence statement?
```

OrgAnchor must answer a wider transaction-cost question:

```text
Can an external party cheaply decide whether this organization is worth deeper review, contact, purchase, partnership, support, or rejection?
```

## Main Thesis

OrgAnchor works by separating four things that are usually mixed together:

1. Identity root: who has authority to speak for the organization.
2. Carriers: where signed materials are published, mirrored, archived, or discovered.
3. Evidence: what the organization claims and what supports, limits, or challenges those claims.
4. Judgment: the final decision made by the external party or its AI agent.

The design only gives OrgAnchor authority over the verification substrate:

```text
signatures, hashes, schemas, discovery signals, evidence structure, gaps, receipts, and migration history
```

It does not give OrgAnchor authority over the final trust decision.

That separation is the core reason the project can be useful without becoming a certification monopoly.

## Required Properties

To reduce real transaction cost, the system needs these properties.

| Required property | Why it is required |
| --- | --- |
| Discoverability | An agent cannot verify an organization it cannot find. |
| Identity continuity | A domain, platform account, server, or homepage can change or disappear. |
| Artifact integrity | Published records must fail verification when altered. |
| Historical traceability | Past states, migrations, and publication receipts should not be silently rewritten. |
| Evidence visibility | Identity continuity alone can preserve a useless or deceptive organization. |
| Gap visibility | Missing, stale, weak, or unsupported evidence must be visible rather than hidden. |
| Purpose-fit evidence | Organizations should not be forced into unlimited paperwork or field-count competition. |
| Commercial-fit routing | Price, lead time, MOQ, quote validity, and region can decide whether deeper review is worth doing. |
| Anti-capture discovery | Directories can help discovery, but the protocol must work without one official gatekeeper. |
| Agent-readable outputs | AI agents need stable, compact, machine-readable results instead of human-only pages. |
| Evolvability | Keys, algorithms, carriers, evidence profiles, and discovery routes must improve without erasing history or retroactively invalidating old adopter packages. |

OrgAnchor's layers exist because each property covers a specific failure mode.

## Design Chain

The full design can be read as a chain:

```text
Root authority
  -> signed official-presence statement
  -> verify package
  -> Beacon discovery signal
  -> agent verification result
  -> signed claims and evidence
  -> value continuity report
  -> carrier receipts and signed lockfile
  -> optional archives, mirrors, timestamps, and directories
  -> external policy decision
```

No single link is enough. The useful effect comes from the chain.

## Layer 1: Root Authority

### Failure Mode

Organizations often identify themselves through fragile carriers:

```text
domain names, websites, platform accounts, cloud services, social profiles, marketplace pages
```

Those carriers can expire, be suspended, be compromised, be migrated, or be replaced.

If the carrier is treated as the identity root, the organization can face a one-night wipeout:

```text
the platform account is gone, therefore the public identity is gone
```

### Mechanism

OrgAnchor moves identity continuity to an organization-controlled root authority:

```text
root public keys + threshold rule + signed migration history
```

Small organizations can start with `1-of-1`. Larger organizations can migrate to `2-of-3`, `3-of-5`, or another threshold model.

### Effect

The organization can change its website, domain, platform account, cloud provider, or public endpoint while preserving a verifiable continuity chain.

An external verifier asks:

```text
Does the current statement verify against the expected root authority?
```

instead of:

```text
Does this website look official?
```

### Limit

The root authority proves continuity of control over signed statements. It does not prove that the organization is good, legal, solvent, safe, or effective.

## Layer 2: Signed Official-Presence Statement

### Failure Mode

A website page can be edited. A domain can be redirected. A profile can be impersonated. A screenshot can be forged.

### Mechanism

OrgAnchor signs canonical JSON statements that declare the organization's current official presence:

```text
website, verify page, security contact, source repositories, API, documentation, auxiliary names, disaster routes, and related endpoints
```

The verifier canonicalizes the JSON and verifies the detached signature against the root authority threshold.

### Effect

Any field change changes the canonical hash and breaks the signature check unless the organization signs a new statement.

This gives a clear rule:

```text
trust the signed statement, not the carrier that happens to host it
```

### Limit

The statement says where the organization currently claims to be found. It does not by itself prove product quality or service truth.

## Layer 3: Verify Package

### Failure Mode

If verification requires custom human investigation each time, transaction cost stays high.

### Mechanism

An adopting organization publishes a static `/verify` package containing:

```text
human-readable page
machine-readable verify index
statement
signature
root authority
optional claims/evidence
optional reports
optional migration history
optional signed lockfile
```

The package gives both people and machines the same verification path.

### Effect

Humans can see what exists. Agents can fetch stable JSON, recompute hashes, verify signatures, and produce compact first-pass results.

### Limit

The page is not the proof. Browser display is only a readable interface. The proof is in the signed artifacts and verification result.

## Layer 4: Beacon-First Discovery

### Failure Mode

If every adopter must be listed by one official Directory before anyone can find it, OrgAnchor becomes a central registry and a capture risk.

### Mechanism

Each adopter can publish an origin-owned discovery signal:

```text
/.well-known/organchor.json
```

The Beacon points to the verify package and declares expected hashes.

### Effect

Any crawler, directory builder, or AI agent can discover OrgAnchor-like organizations directly from public web signals, then verify them at their own origin.

This makes each adopter more like a visible signal on the open web, instead of a hidden entry waiting for a central platform to list it.

### Limit

Beacon discovery does not mean trust. It only says:

```text
an OrgAnchor-shaped signal exists here; verify it before relying
```

## Layer 5: Agent Verification Contract

### Failure Mode

Different AI agents may interpret documents differently, miss important gaps, or waste tokens reading large pages.

### Mechanism

OrgAnchor exposes stable machine-readable outputs:

```text
organchor verify url <origin>
organchor verify url <origin> --compact
policy_route
conformance_status
identity_status
value_status
recommended_next_steps
```

### Effect

An external agent can cheaply separate:

```text
identity failed
identity passed but evidence missing
identity and value package passed first-pass checks
external policy still required
```

This lowers the cost of first-pass filtering and reduces accidental overtrust.

### Limit

Agent-readable output improves interoperability. It does not force all agents to use the same final policy.

## Layer 6: Claims And Evidence

### Failure Mode

Identity continuity alone can preserve a low-quality, empty, deceptive, or harmful organization.

### Mechanism

OrgAnchor separates claims from evidence:

```text
claims/product-claims.json
evidence/evidence-manifest.json
reports/value-continuity-report.json
```

Claims can be linked to evidence items by hash, source class, recheck method, expiry, limitation, and subject binding.

Current evidence classes include:

```text
S1 first-party material
S2 organization-submitted third-party material
S3 random purchase or random sampling structure
S4 real-use observation design preview
S5 public challenge, correction, and historical accountability design preview
```

OrgAnchor intentionally does not add a separate Historical Layer. Product/service history and broader accountability observations are routed through S5 when they become challenge, correction, dispute, negative-evidence, response, or accountability records. S3 remains about how a sample was acquired and checked; S4 remains about real-use or real-delivery observation.

### Effect

External agents can see not only what the organization claims, but also:

```text
what supports it
what is stale
what is missing
what is manual-check-only
what is first-party
what is third-party
what is sampled
what has been challenged, corrected, withdrawn, superseded, or left unresolved
what is only a design-preview signal
```

This shifts the system from promotion to inspectable evidence.

### Limit

OrgAnchor does not make evidence automatically true. It makes evidence structured, hash-bound where possible, and easier to challenge or recheck.

## Layer 7: Subject Binding And Delegated Product/Service Authority

### Failure Mode

Evidence can be misattributed:

```text
right report, wrong product
right product, wrong batch
right sample, wrong organization
right review, wrong service scope
```

### Mechanism

The design direction binds product/service records through scoped credentials:

```text
root authority -> delegated product/service key -> model/batch/unit or service-delivery credential -> observation/challenge/correction/accountability record
```

The root remains high-security and low-frequency. Delegated keys handle bounded operational signing.

### Effect

Positive and negative feedback can be attached to the correct organization authority chain without requiring the root private key to sign every product event.

### Limit

This does not remove all real-world fraud risk. It creates a better attribution path and makes unsupported attribution easier to identify.

## Layer 8: Purpose-Fit Evidence

### Failure Mode

If the system rewards "more fields" or "more documents", serious small organizations get buried under paperwork and low-quality organizations can game volume.

### Mechanism

OrgAnchor treats evidence as purpose-fit:

```text
What decision is this package meant to support?
What minimum evidence is enough for that purpose?
What gaps remain for that purpose?
```

The goal is not universal completeness. The goal is sufficient support for a declared use case.

### Effect

Organizations are not punished for refusing to fill irrelevant optional fields, but they do face a clear disadvantage when they do not support a use case they want agents to consider.

This keeps low-friction adoption compatible with meaningful evidence.

### Limit

Different industries and risk levels need different profiles. OrgAnchor should expose gaps rather than pretend one universal checklist fits all decisions.

## Layer 9: Carrier Receipts, Signed Lockfile, And External Anchors

### Failure Mode

Even if a statement is signed, publication history can still be confusing:

```text
Which CID was published?
Which Arweave TX id was recorded?
When was the package mirrored?
Was a receipt later edited?
Was a timestamp proof produced?
```

### Mechanism

Publish-like operations write non-sensitive receipt metadata to `organchor.lock.json`.

The lockfile can be:

```text
hashed
signed by the root authority
published inside /verify
verified by external agents
mirrored or archived through carriers
```

Optional carriers add durability or time anchoring:

```text
IPFS for content-addressed mirrors
Arweave for append-only archival publication of small final artifacts
OpenTimestamps/Bitcoin for public time anchoring of hashes
traditional website for common entry
Onion for disaster access
ENS for auxiliary naming
```

The lockfile is not the identity root. It is a signed ledger of publication receipts and artifact hashes.

### Effect

If a receipt, timestamp, CID, TX id, or artifact hash is changed after signing, the lockfile hash changes and the signature fails.

This does not make history impossible to delete everywhere. It makes surviving history tamper-evident and cross-checkable.

### Limit

Carriers are not the identity root. A carrier can be unavailable, stale, censored, expensive, or incomplete. The trust path returns to root authority signatures and hashes.

## Layer 10: Migration History

### Failure Mode

A root key can be lost, compromised, retired, or outgrown by organizational governance.

If key evolution is not designed in, long-term identity becomes brittle.

### Mechanism

OrgAnchor supports root authority migration:

```text
old root authority signs a migration statement to the new root authority
historical statements remain verified by the authority that signed them
future statements verify against the current authority
```

OrgAnchor also treats public adopter packages as versioned historical snapshots. A future protocol version may expose new gaps in an old package, but it must not mark a previously valid package as invalid merely because the new version expects stronger evidence, richer agent output, or a different optional carrier model.

### Effect

The organization can evolve from a small founder-controlled key to a multi-person threshold authority without erasing the previous chain.

An older package can remain historically meaningful as:

```text
valid under the OrgAnchor schema and verification rules that signed it
```

even if the current recommended package shape is stronger.

### Limit

Migration cannot repair a root compromise that was never detected or never transparently corrected. It provides a mechanism for explicit continuity, not magical recovery.

## Layer 11: Directory-Assisted Discovery

### Failure Mode

Beacon-first discovery is open, but broad discovery can still be expensive. A demand-side agent may not know where to start.

### Mechanism

Any party can build a Directory snapshot over public Beacons and verify packages.

The Directory is an accelerator:

```text
candidate discovery, filtering, explanation, freshness checks, and routing
```

It is not a root authority, certification body, or exclusive registry.

### Effect

Directory builders can reduce search cost while remaining replaceable. Agents can compare multiple Directories, crawl Beacons directly, or build private indexes.

### Limit

Directories can still be biased, stale, low-quality, or commercially captured. This is why every Directory record must point back to origin-owned verification.

## Layer 12: Commercial Fit

### Failure Mode

Verification can be wasted if a candidate is obviously outside budget, region, MOQ, lead time, quote validity, or procurement constraints.

### Mechanism

The commercial-fit layer is designed to expose routing signals such as:

```text
public price band
signed price sheet
private signed quote path
MOQ
lead time
region
currency
validity window
quote response expectation
```

It does not force universal public pricing.

### Effect

An agent can avoid spending verification effort on candidates that are commercially impossible for the current need.

This directly supports the main transaction-cost goal.

### Limit

OrgAnchor does not decide whether a price is fair or best. It exposes commercial constraints for external policy.

## What The Design Can Guarantee

OrgAnchor can mechanically guarantee these properties when artifacts are present and verification passes:

| Property | Guarantee |
| --- | --- |
| Statement integrity | Modified signed JSON fails verification. |
| Root binding | A statement can be checked against the expected root authority hash. |
| Threshold control | Verification can require multiple authorized root member signatures. |
| Current official presence | Current declared endpoints are signed by the authority. |
| Migration continuity | Valid migration statements can link old and new root authorities. |
| Lockfile integrity | Modified signed receipt history fails lockfile verification. |
| Content addressing | IPFS CIDs and SHA-256 hashes can detect content mismatch. |
| Time anchoring | OpenTimestamps/Bitcoin can prove a hash existed before a block time when upgraded. |
| Agent-readable status | Agents can get stable status codes, policy routes, warnings, and next steps. |
| Discovery openness | Any adopter can publish first-party Beacon signals without official registry inclusion. |

## What The Design Cannot Guarantee

OrgAnchor cannot, by itself, guarantee:

```text
the organization is good
the product works
the evidence is sufficient for every purpose
the price is fair
the organization will keep serving files forever
every customer will submit honest feedback
every Directory will be neutral
every carrier will stay available
every future cryptographic assumption will remain strong forever
```

These are external policy, operational, market, legal, scientific, or governance questions.

OrgAnchor's role is to make the facts, claims, signatures, gaps, receipts, and routes easier to inspect.

For schema and protocol evolution, the project follows `PROTOCOL_EVOLUTION_POLICY.md`: new versions can add stronger checks and clearer gap visibility, but historical adopter packages must remain verifiable under their original version-specific rules when those rules are supported.

## Why This Can Lower Transaction Cost

Transaction cost falls when an external party can cheaply answer:

```text
Can I find this organization?
Is this the same organization over time?
Where is its current official presence?
What does it claim?
What evidence is attached?
What gaps are visible?
Is it worth deeper review?
What should I verify next?
```

OrgAnchor lowers this cost by making those answers:

```text
public
signed
hash-bound
machine-readable
portable
carrier-independent
gap-explicit
directory-accelerable but not directory-dependent
```

The final trust decision remains external, but the cost of reaching an informed decision is reduced.

That is the central design claim.

## Success Condition

OrgAnchor succeeds if serious organizations can publish verifiable identity and evidence packages with reasonable effort, and external agents can discover, verify, compare, and route those packages with lower cost than ad hoc web research or platform-controlled recommendation systems.

OrgAnchor fails if it becomes any of these:

```text
a trust badge
a pay-to-rank marketplace
a central organization registry
a storage platform for everyone
a certification authority
a vague philosophy without machine-verifiable artifacts
```

The design should be judged by whether it strengthens the core loop:

```text
discover -> verify identity -> inspect evidence -> expose gaps -> screen commercial fit -> external decision
```
