# OrgAnchor Evidence Onboarding Guide

Status: Draft operator guide.

## Purpose

This guide explains how an organization should use OrgAnchor's claims and evidence layer.

OrgAnchor identity continuity answers:

```text
Is this the organization's signed official endpoint statement?
```

The evidence layer helps answer:

```text
What claims does the organization make?
What evidence does it attach?
Who issued that evidence?
Where can the evidence be retrieved?
Can the artifact hash be verified?
What are the limitations?
```

OrgAnchor does not prove that a product claim is objectively true. It makes claims, evidence, publication, integrity, and traceability easier to verify.

## Why Evidence Matters

As AI-generated text, images, video, and websites become cheaper, human-only visual trust becomes weaker.

A future verifier, including an AI agent, should not rely only on polished marketing pages.

It should be able to inspect:

- Signed claims.
- Evidence references.
- Artifact hashes.
- Issuer type.
- Limitations.
- Publication receipts.
- Historical changes.

## Core Files

Claims:

```text
claims/product-claims.json
claims/product-claims.json.sig
```

Evidence:

```text
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
```

These files may be copied into:

```text
public/verify/
```

and referenced by:

```text
public/verify/organchor.json
```

## Claims

A claim is something the organization publicly asserts.

Examples:

- Product exists.
- Service is available.
- Software version was released.
- A benchmark was run.
- A report was published.
- A security policy exists.

A claim should include:

- Stable id.
- Product or service scope.
- Summary.
- Limitations.
- Evidence ids.
- Issuer information.
- Date or version when relevant.

Bad claim:

```text
Our product is the best.
```

Better claim:

```text
Version 1.2.0 of ExampleApp passed the documented integration test suite on 2026-05-14.
```

## Evidence

Evidence is an artifact or reference that supports a claim.

Examples:

- Test report.
- Benchmark output.
- Audit report.
- Source release.
- Build artifact.
- Signed customer attestation.
- Regulator filing.
- Public dataset.
- Screenshot or video with hash.

Evidence should include:

- Stable id.
- Media type.
- Size.
- SHA-256 hash.
- Location.
- Issuer type.
- Relation to claims.
- Limitations.

## Issuer Types

Issuer type helps AI agents and human reviewers rank evidence.

Recommended categories:

```text
first-party
third-party
community
regulator
automated-system
```

Meaning:

- `first-party`: produced by the organization itself.
- `third-party`: produced by an independent organization.
- `community`: produced by users, contributors, or public observers.
- `regulator`: produced by government or regulatory body.
- `automated-system`: produced by CI, monitoring, build, or test systems.

First-party evidence is useful, but it should not be treated the same as independent third-party evidence.

## Artifact Locations

Large evidence artifacts do not need to be inside `public/verify`.

Valid location types may include:

```text
https
ipfs
arweave
github-release
r2
s3
other-object-storage
```

The important rule:

```text
The evidence manifest records the artifact hash.
```

If the location changes, the verifier can still detect whether the artifact content matches the recorded hash.

## Large Files

Do not put large videos, datasets, or PDFs into the default IPFS verify mirror unless intentionally doing so.

Recommended pattern:

```text
large file stored on HTTPS/R2/S3/GitHub Release/IPFS
evidence manifest records hash, size, media type, and location
claims manifest references evidence id
```

This keeps the default verification package small while still making large evidence verifiable.

## Workflow

### 1. Create Claims Manifest

```bash
organchor claims create --config organchor.config.json
```

Edit claims to match the organization's real product/service assertions.

### 2. Create Evidence Manifest

```bash
organchor evidence create --config organchor.config.json
```

### 3. Add Local Evidence

```bash
organchor evidence add --file reports/test-report.pdf
```

### 4. Add External Evidence

```bash
organchor evidence add \
  --file local-copy/demo.mp4 \
  --uri https://example.org/evidence/demo.mp4 \
  --location-type https
```

The local file is used to compute the hash. The URI is recorded as a retrieval location.

### 5. Sign Claims

```bash
organchor claims sign \
  --key keys/root-a.private.json \
  --authority root-authority.json
```

Append signatures if threshold authority requires it:

```bash
organchor claims sign \
  --key keys/root-b.private.json \
  --authority root-authority.json \
  --append
```

### 6. Sign Evidence

```bash
organchor evidence sign \
  --key keys/root-a.private.json \
  --authority root-authority.json
```

### 7. Verify

```bash
organchor claims verify \
  --authority root-authority.json \
  --in claims/product-claims.json \
  --sig claims/product-claims.json.sig
```

```bash
organchor evidence verify \
  --authority root-authority.json \
  --in evidence/evidence-manifest.json \
  --sig evidence/evidence-manifest.json.sig
```

Use file checking when local artifacts are present:

```bash
organchor evidence verify --check-files
```

## Evidence Quality Levels

### Level A: First-Party Publication

The organization signs claims and references its own evidence.

Useful for:

- Accountability.
- Version history.
- Public declarations.

Limitation:

- Not independent proof.

### Level B: Automated System Evidence

Evidence comes from CI, monitoring, build logs, or repeatable test systems.

Useful for:

- Reproducibility.
- Technical claims.

Limitation:

- System configuration may still be controlled by the organization.

### Level C: Third-Party Evidence

Evidence comes from an independent auditor, partner, lab, or customer.

Useful for:

- Stronger credibility.

Limitation:

- The third party must itself be evaluated.

### Level D: Regulator or Public Authority Evidence

Evidence comes from an official filing, license, or public registry.

Useful for:

- Legal or compliance claims.

Limitation:

- Jurisdiction-specific.
- May not cover product performance.

## AI-Agent-Friendly Requirements

Evidence manifests should be easy for AI agents to parse.

Avoid:

- Evidence only hidden inside marketing pages.
- Unstructured PDF-only claims.
- Vague statements without artifact hashes.
- Missing issuer type.
- Missing limitations.

Prefer:

- Stable ids.
- Plain JSON.
- Hashes.
- Media types.
- Sizes.
- Locations.
- Claim-evidence relations.
- Clear caveats.

## What Not To Claim

Do not say:

```text
OrgAnchor proves our product works.
OrgAnchor proves customers are satisfied.
OrgAnchor proves this evidence is objectively true.
```

Say:

```text
OrgAnchor records that the organization signed this claim and linked it to these evidence artifacts.
The artifacts can be checked by hash.
The evidence issuer type and limitations are visible.
```

## Privacy and Legal Review

Before publishing evidence:

- [ ] Remove private keys.
- [ ] Remove personal data unless explicitly intended.
- [ ] Remove confidential customer information.
- [ ] Check copyright and licensing.
- [ ] Check export-control or regulatory constraints if relevant.
- [ ] Confirm append-only archive suitability before Arweave upload.

Do not upload sensitive evidence to Arweave unless permanent public exposure is acceptable.

## Updating Evidence

If evidence changes:

1. Add a new artifact.
2. Record its hash.
3. Update claim references if needed.
4. Re-sign claims and evidence manifests.
5. Re-publish `/verify`.
6. Mirror/archive updated manifests.
7. Keep older manifests verifiable.

Do not overwrite history silently.

## Minimum Evidence Package

For a public pilot:

- [ ] One claims manifest.
- [ ] One evidence manifest.
- [ ] At least one evidence item.
- [ ] Clear limitations.
- [ ] Signed claims.
- [ ] Signed evidence.
- [ ] Machine-readable discovery through `/verify/organchor.json`.

## Mature Evidence Package

For stronger trust:

- [ ] Third-party evidence.
- [ ] Automated-system evidence.
- [ ] Public release artifacts.
- [ ] Hash-bound large files.
- [ ] Archived signed manifests.
- [ ] Timestamped hashes.
- [ ] Clear supersession history.

## Plain-Language Summary

OrgAnchor evidence is not magic truth.

It is a structured public accountability layer:

```text
who claimed what
what evidence they pointed to
where that evidence can be found
whether the evidence content matches the recorded hash
when key records were published or archived
```

That is what makes it useful to humans and AI agents.
