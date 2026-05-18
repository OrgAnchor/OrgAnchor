# OrgAnchor Publishing Guide

Status: Draft operator guide.

## Purpose

This guide explains how to publish OrgAnchor artifacts through practical carriers.

Publishing is not the same as identity authority.

The identity root is:

```text
root-authority.json + valid threshold signatures
```

Publishing carriers help other people and machines find, retrieve, mirror, archive, and audit the signed artifacts.

## Publishing Targets

OrgAnchor uses several carrier types.

### Traditional Website

Purpose:

- Human-friendly discovery.
- Normal public entry point.
- `/verify/` page.

Typical URL:

```text
https://example.org/verify/
```

### IPFS

Purpose:

- Content-addressed mirror.
- CID-based integrity reference.
- Alternative retrieval path.

Good for:

- Small `public/verify` package.
- Signed JSON artifacts.
- Evidence indexes.

Not good for:

- Assuming guaranteed availability without pinning.
- Large default evidence dumps.

### Arweave

Purpose:

- Long-term public archive for small final artifacts.
- Historical traceability.

Good for:

- Root authority records.
- Signed statements.
- Signature files.
- Claims and evidence manifests.
- Arweave package manifest.

Not good for:

- Private material.
- Drafts.
- Large video archives by default.
- Content that may need removal or correction.

### OpenTimestamps

Purpose:

- Public time anchor for hashes.

Good for:

- Proving a file hash existed before a later Bitcoin block time.

Not good for:

- Storing content.
- Proving claims are true.
- Replacing OrgAnchor signatures.

### Onion

Purpose:

- Disaster-recovery access path.

Good for:

- Alternative `/verify` access.

Not good for:

- Guaranteeing uptime.
- Replacing the root authority.

### ENS

Purpose:

- Auxiliary name and Web3 discovery.

Good for:

- Text records.
- contenthash pointers.
- Auxiliary metadata.

Not good for:

- Identity root.
- Mandatory v1 trust path.

## Pre-Publish Checklist

Before publishing:

- [ ] Statement verifies locally.
- [ ] Signature threshold is satisfied.
- [ ] `public/verify` generated.
- [ ] No private key is in `public/verify`.
- [ ] Claims and evidence manifests verify if included.
- [ ] `organchor.lock.json` does not contain secrets.
- [ ] Human approval obtained for paid or append-only publishing.
- [ ] Public wording does not overclaim permanence or objective truth.

## Traditional Website Publishing

Publish:

```text
public/verify/
```

to:

```text
https://example.org/verify/
```

Recommended additional paths:

```text
/.well-known/organchor.json
/.well-known/security.txt
/security.txt
/robots.txt
/sitemap.xml
```

After publishing, verify:

- `https://example.org/verify/`
- `https://example.org/verify/organchor.json`
- `https://example.org/verify/official-endpoints.json`
- `https://example.org/verify/official-endpoints.json.sig`
- `https://example.org/verify/root-authority.json`

Record:

- Deployment URL.
- Deployment timestamp.
- Directory hash.
- Provider receipt if available.

Do not upload:

- `keys/*.private.json`
- Provider tokens.
- Upload wallets.
- Local credential files.

## IPFS Publishing

Default package:

```text
public/verify/
```

Dry run:

```bash
organchor mirror ipfs publish --dir public/verify --dry-run
```

Local Kubo:

```bash
organchor mirror ipfs publish --dir public/verify --api http://127.0.0.1:5001
```

Pinning provider upload:

```bash
organchor mirror ipfs upload --provider pinata --dir public/verify --token-file pinata-jwt.local.secret
```

Remote pin of an existing CID, when provider supports it:

```bash
organchor mirror ipfs pin --cid <CID> --service-url <PINNING_SERVICE_API> --token-file pinning-token.local.secret
```

Verify:

```bash
organchor mirror ipfs verify --dir public/verify --expected-hash sha256:<DIRECTORY_HASH>
```

Best practice:

- Keep the default verify mirror small.
- Use `--allow-large` only when intentionally publishing a large mirror.
- Record provider-specific behavior. Some providers cannot pin an existing CID without a paid feature.
- Do not treat a CID as proof of availability.

## Arweave Publishing

Prepare a manual package:

```bash
organchor archive arweave publish \
  --statement statements/official-endpoints.json \
  --sig statements/official-endpoints.json.sig \
  --authority root-authority.json
```

Estimate:

```bash
organchor archive arweave estimate --dir arweave-package
```

Upload through Turbo when SDK and wallet are available:

```bash
organchor archive arweave upload \
  --provider turbo \
  --dir arweave-package \
  --wallet-file arweave-wallet.local.json
```

Verify a TX:

```bash
organchor archive arweave verify \
  --tx <ARWEAVE_TX_ID> \
  --gateway https://arweave.net \
  --expected-hash sha256:<FILE_HASH>
```

Best practice:

- Use a dedicated upload wallet.
- Never use root authority keys as upload wallets.
- Check the package for private files before upload.
- Prefer small, final, public artifacts.
- If a mistake is made, publish a new signed correction or superseding statement.

## OpenTimestamps Publishing

Stamp:

```bash
organchor anchor opentimestamps stamp --file statements/official-endpoints.json
```

Verify:

```bash
organchor anchor opentimestamps verify \
  --file statements/official-endpoints.json \
  --proof anchors/opentimestamps/official-endpoints.json.ots
```

Upgrade later:

```bash
organchor anchor opentimestamps upgrade \
  --proof anchors/opentimestamps/official-endpoints.json.ots
```

Best practice:

- Stamp important hashes after public milestones.
- Record pending versus Bitcoin-anchored status.
- Keep `.ots` files in the adoption package.

## Publication Receipts

Every publishing action should write to:

```text
organchor.lock.json
```

Receipts may include:

- Artifact hash.
- Directory hash.
- CID.
- Arweave TX id.
- Gateway URL.
- Provider name.
- Timestamp.
- Verification result.

Receipts must not include:

- Root private keys.
- Wallet bodies.
- API tokens.
- Passwords.
- Payment data.

## Re-Publishing After Changes

If the organization changes an official endpoint:

1. Create a new statement.
2. Sign it with the current root authority.
3. Generate a new `/verify` package.
4. Publish to website.
5. Mirror to IPFS.
6. Archive to Arweave if appropriate.
7. Stamp key hashes.
8. Record receipts.

Do not silently edit a signed statement and keep using the old signature.

## Publishing Status Language

Use precise words:

```text
Signed statement verified.
Website carrier active.
IPFS mirror recorded.
Arweave TX content hash verified through gateway X.
OpenTimestamps proof pending Bitcoin attestation.
```

Avoid:

```text
Permanent identity.
Uncensorable forever.
Fully decentralized.
Guaranteed available.
Arweave proves the claim is true.
IPFS proves the organization is legitimate.
```

## Stop Conditions

Stop and ask for human confirmation before:

- Paying.
- Accepting provider terms.
- Uploading to append-only archives.
- Publishing legal or high-stakes claims.
- Rotating root authority keys.
- Deleting or replacing official public artifacts.

## Publishing Complete

Publishing is complete for a given adoption level when:

- Public artifacts are retrievable.
- Local verification passes.
- At least one independent retrieval path is tested when required.
- Receipts are recorded.
- Secrets are absent from public artifacts and lockfiles.
- Limitations are documented.
