# OrgAnchor Product Shape

Status: Accepted.

## Purpose

This document records what OrgAnchor should feel like as a product.

OrgAnchor must be technically trustworthy, but it must also be usable by real organizations that do not want to think in raw JSON, hashes, signatures, CIDs, or transaction ids.

The product should therefore have several surfaces, each serving a different audience, while keeping the same trust model underneath.

## Core Principle

OrgAnchor is not primarily "an app" or "a website".

OrgAnchor is:

```text
an open-source identity continuity toolchain
+ standard file formats
+ verification libraries
+ static public verification artifacts
+ optional user-friendly interfaces
```

The identity root remains:

```text
organization root authority
```

No app, website, cloud service, platform account, domain, ENS name, IPFS CID, Arweave TX, or lockfile becomes the identity root.

## Visible Proof Principle

OrgAnchor must make important work visible.

A technically valid workflow can still feel untrustworthy if the operator only sees files, hashes, and background commands. A dishonest or broken workflow can look similar from the outside unless OrgAnchor produces clear confirmation artifacts.

Therefore every major workflow should produce:

- Human-readable status.
- Machine-readable status.
- Hashes and file paths.
- PASS/WARN/FAIL style checks where applicable.
- A clear distinction between verified, merely present, not included, and manual-check-required items.
- A visible trail on the adopting organization's `/verify` page when the result is public.

This is a product requirement, not decoration.

OrgAnchor should avoid vague success messages such as:

```text
Done.
Setup complete.
Published.
```

Prefer concrete status:

```text
Statement signed by 2 of 3 root members.
Root authority hash matches the statement.
Evidence manifest included and verified.
Migration history not included yet.
Arweave upload prepared but not published.
```

The goal is that a non-expert can see that something real happened, while an AI agent or auditor can inspect the same status in JSON.

## Four Product Faces

OrgAnchor should eventually have four visible faces.

### 1. OrgAnchor Core

Audience:

- Developers.
- AI agents.
- Auditors.
- Other tools that need independent verification.

Responsibilities:

- Strict JSON parsing.
- Canonical JSON.
- Hashing.
- Signature creation and verification.
- Root authority threshold verification.
- Schema validation.
- Evidence and claims verification.

Core must stay small, testable, and independent from any user interface.

Core is the engine.

### 2. OrgAnchor CLI

Audience:

- Technical maintainers.
- Open-source project operators.
- DevOps teams.
- CI/CD systems.
- Security reviewers.

Responsibilities:

- Initialize an OrgAnchor workspace.
- Generate root member keys.
- Create and verify root authority records.
- Create, sign, hash, and verify statements.
- Generate the static `/verify` page.
- Create claims and evidence manifests.
- Publish or prepare IPFS and Arweave artifacts.
- Run domain, onion, and ENS workflows.

Example:

```bash
organchor init
organchor key generate --id root-2026
organchor authority create
organchor statement create
organchor statement sign
organchor statement verify
organchor page generate
```

CLI is the first implementation surface because it is scriptable, testable, and suitable for open-source distribution.

CLI is not the final human experience for every organization.

### 3. OrgAnchor Studio

Audience:

- Non-expert organization operators.
- Small teams.
- Nonprofits.
- Project maintainers who prefer a guided interface.

Status:

```text
Future product surface, not required for early v1 core correctness.
```

OrgAnchor Studio should be a user-friendly interface over the same core formats and commands.

Possible forms:

- Local desktop app.
- Local web UI.
- Later, a carefully bounded hosted helper.

Preferred early direction:

```text
local-first Studio
```

Why:

- It avoids turning OrgAnchor into a new central identity platform.
- It can help users without receiving private keys or becoming a trust root.
- It can generate the same public artifacts as the CLI.

Studio should support guided workflows:

- Create organization profile.
- Choose simple `1-of-1` root authority or a future threshold authority.
- Generate key material with clear offline backup warnings.
- Fill official endpoints.
- Generate and sign statements.
- Generate `/verify`.
- Create evidence and claims manifests.
- Produce IPFS/Arweave dry-run packages or publish through configured adapters.
- Run domain audit and show plain-language risk reports.
- Show exactly what files should be published.

Studio must not:

- Become the identity root.
- Require a hosted OrgAnchor account.
- Store private keys in a cloud service by default.
- Hide the signed files from users.
- Replace CLI verification.

Studio is the usability layer.

### 4. Adopting Organization `/verify` Page

Audience:

- Public visitors.
- Journalists.
- Partners.
- Customers.
- AI agents.
- Incident responders.
- Future maintainers.

Responsibilities:

- Present the adopting organization's current official endpoints.
- Display the root authority fingerprint.
- Link to the signed statement and signature.
- Link to root authority public data.
- Link to claims and evidence manifests when available.
- Show a visible proof trail of generated and verified artifacts.
- Provide CLI verification instructions.
- Expose machine-readable files for AI agents.

Expected files:

```text
public/verify/index.html
public/verify/organchor.json
public/verify/root-authority.json
public/verify/official-endpoints.json
public/verify/official-endpoints.json.sig
public/verify/claims/product-claims.json
public/verify/evidence/evidence-manifest.json
```

The `/verify` page is what most outsiders will see.

This page belongs to the organization adopting OrgAnchor. It is not limited to the OrgAnchor project itself.

For example:

```text
https://example.org/verify/
https://research-lab.example/verify/
https://open-source-project.example/verify/
```

OrgAnchor's own future page, such as `https://organchor.org/verify/`, is simply the first self-pilot instance after Stage 3.

It should be readable by humans and easy for machines to inspect.

It must not claim that simply seeing the page proves identity. The page points to verifiable artifacts; the artifacts and root authority do the trust work.

The page should make the trust work visible. A visitor should be able to see, at a glance, what was signed, what threshold was satisfied, which supporting manifests were included, and which items remain absent or manual.

## Convenience Without Centralization

OrgAnchor should make the safe path easy.

That means:

- Users should not need to hand-edit JSON for normal workflows.
- Users should see guided warnings before generating or using private keys.
- Users should get clear PASS/WARN/FAIL/MANUAL_CHECK_REQUIRED results.
- Users should get plain-language explanations of what is trusted, what is merely available, and what requires manual confirmation.
- AI agents should have structured JSON indexes instead of scraping visual pages.

But convenience must not introduce a new identity monopoly.

Therefore:

- The CLI must remain fully functional without OrgAnchor's website.
- The generated files must be verifiable by independent implementations.
- The verify page must be static.
- Studio must be an interface over public formats, not a private database where truth lives.
- Any future hosted service must be optional and must not be required for verification.

## Recommended Product Evolution

### Stage 1 and Stage 2

Primary visible surfaces:

- Core.
- CLI.
- Static adopting organization `/verify` page.

Goal:

Prove that the trust model works.

### Stage 3

Primary visible surfaces:

- CLI.
- Adopting organization `/verify` page.
- Machine-readable `organchor.json`.
- Claims and evidence manifests.
- IPFS/Arweave receipt flows.

Goal:

Make OrgAnchor self-pilot ready.

This is the point where OrgAnchor can use itself as the first public pilot.

In that pilot, OrgAnchor is both the tool project and the adopting organization using its own generated `/verify` artifacts.

### Stage 4 and Stage 5

Primary visible surfaces:

- CLI.
- Adopting organization `/verify` page.
- Reports.
- Migration statements.
- Real-world domain/onion/ENS workflows.

Goal:

Make OrgAnchor complete enough for careful external pilots and v1 completion.

### After v1 Core Stability

Primary new surface:

- OrgAnchor Studio.

Goal:

Make OrgAnchor practical for organizations that need the model but do not want to operate it entirely through CLI commands.

## Product Boundary

OrgAnchor can eventually provide:

- Core library.
- CLI.
- Static verify page generator.
- Local-first Studio.
- Documentation website.
- Example verify site.
- Test vectors.
- JSON schemas.
- Optional helper services.

OrgAnchor should not become:

- A central certification authority.
- A hosted identity registry that users must trust.
- A SaaS account system.
- A CMS.
- A legal identity provider.
- A replacement for government or institutional registration.
- A platform that claims to decide whether organizations or product claims are objectively true.

## One-Sentence Product Shape

OrgAnchor should become:

> a local-first, open-source identity continuity toolkit whose CLI and Studio help organizations generate signed public verification artifacts, while the organization's own `/verify` page and machine-readable manifests let humans and AI agents independently verify continuity.
