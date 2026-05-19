# OrgAnchor Purpose and Values

Status: Active project position.

## Purpose

OrgAnchor exists to help organizations keep their public identity, official entry points, claims, evidence, and migration history verifiable across domains, platforms, infrastructure providers, and storage carriers.

The technical goal is identity continuity.

The deeper purpose is to help long-term, evidence-bearing organizations become easier to verify, remember, migrate, and trust over time.

OrgAnchor should not be only a tool for keeping a name alive. It should help make durable public value easier to inspect.

## Technical Purpose

OrgAnchor provides:

- Root authority records.
- Signed official endpoint statements.
- Signed migration statements.
- Signed claims and evidence manifests.
- Public `/verify` pages.
- Publication receipts across carriers such as websites, IPFS, Arweave, Onion, ENS, and OpenTimestamps.

These mechanisms answer questions such as:

```text
Who is authorized to speak for this organization?
What did the organization officially publish?
Has this statement changed?
Can this current entry point be linked to earlier roots and statements?
Where were the public artifacts mirrored, archived, or timestamped?
What evidence does the organization offer for its claims?
```

## Civic Purpose

OrgAnchor is built for a world where images, videos, polished websites, platform badges, and marketing claims are increasingly cheap to generate and manipulate.

In that world, a serious organization should be able to show:

- What it claims.
- What evidence supports those claims.
- What changed over time.
- Which official entry points are current.
- How to verify historical continuity.
- How corrections and migrations are handled.

OrgAnchor cannot make the world good by itself. It can make long-term accountability easier to practice and easier to inspect.

## Values

OrgAnchor values:

- **Identity self-custody**: the root of continuity should not depend only on a domain, platform, registrar, hosting provider, social account, or government database.
- **Evidence over spectacle**: polished media is not enough; claims should be linked to signed, hash-verifiable evidence.
- **Long-term accountability**: organizations should be able to carry history forward, including corrections and migrations.
- **Freedom to migrate**: changing infrastructure should not erase identity continuity.
- **Human and agent readability**: people and AI agents should both be able to inspect the verification trail.
- **Transparent limits**: signatures prove publication and continuity; they do not automatically prove virtue, truth, legality, scientific sufficiency, or product quality.
- **Refusal to launder harm**: OrgAnchor should not be framed as a credibility badge for fraud, impersonation, exploitation, or deliberate deception.

## What OrgAnchor Does Not Certify

OrgAnchor does not certify that an organization is good, lawful, ethical, effective, or worthy of support.

It can show that:

```text
This organization controlled this root authority.
This root authority signed this statement.
This statement had this hash.
This evidence manifest listed these artifacts.
This migration links these roots.
These carriers published or timestamped these bytes.
```

It cannot automatically show that:

```text
The organization deserves trust.
The claim is true.
The product works.
The organization treats people well.
The evidence is sufficient.
The organization should be endorsed.
```

This boundary matters. Continuity is not a moral washing machine.

## Project Stance

The open-source toolchain should remain technically verifiable and broadly usable.

The official OrgAnchor project, website, examples, showcase, and adoption materials may still choose a value stance:

- Encourage long-term builders.
- Encourage public evidence.
- Encourage correction rather than silent rewriting.
- Avoid presenting OrgAnchor use as automatic trustworthiness.
- Avoid official promotion of organizations using continuity tooling to impersonate, deceive, exploit, or obscure accountability.

Open-source software cannot prevent every bad use. The project can still refuse to make bad use look noble.

## Practical Consequences

This position should affect the project in practical ways:

- The README should describe OrgAnchor as identity and evidence continuity, not as a trust badge.
- Adoption documents should favor organizations willing to publish evidence and accept long-term scrutiny.
- Evidence manifests should separate claims, supporting evidence, limitations, corrections, and superseded material.
- `/verify` pages should show proof trails and limits in language that non-experts can understand.
- Official showcase listings should be selective and revocable.
- Release checks should protect against overclaiming, not only broken code.

## Short Form

OrgAnchor is not just a way for an organization to say "we are still here."

It is a way for an organization to say:

```text
Here is who may speak for us.
Here is what we claimed.
Here is the evidence we offered.
Here is what changed.
Here is how to verify the continuity yourself.
```

That is the part of the toolchain that can help make the world a little less dependent on spectacle, platform power, and unverifiable claims.
