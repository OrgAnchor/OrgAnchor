# OrgAnchor Adopter Quickstart

Status: Fireseed Alpha quick path for an adopting organization.

## Purpose

This is the shortest practical guide for a real organization that wants to try OrgAnchor without learning the whole architecture first.

The adoption rule is:

```text
Your root authority is the identity root.
Everything else is a carrier, mirror, archive, receipt, discovery surface, or explanation layer.
```

## Good Fit

Use this quickstart if the organization wants to publish:

- who it is
- where its official presence can be found
- what changed over time
- what claims it makes
- what evidence supports those claims
- what is still uncertain or incomplete
- what an external AI agent should verify next

Do not use OrgAnchor as a badge that says the organization is good, safe, lawful, cheap, or best.

## Minimum Result

The minimum useful result is:

```text
root-authority.json
statements/official-endpoints.json
statements/official-endpoints.json.sig
public/verify/
ADOPTION_STATUS.md
```

Optional but recommended after the first pass:

```text
claims/product-claims.json
claims/product-claims.json.sig
evidence/evidence-manifest.json
evidence/evidence-manifest.json.sig
reports/domain-security-report.json
reports/domain-security-report.md
organchor.lock.json
```

## 1. Create A Separate Adoption Workspace

Do not run a real adopter pilot inside the OrgAnchor source repository.

Example:

```text
source repository: E:\CivX\OrgAnchor
adoption workspace: E:\CivX\ExampleOrg-OrgAnchor
```

From the adoption workspace:

```bash
organchor init
```

If using the source checkout before a package install:

```bash
node E:\CivX\OrgAnchor\src\cli.ts init
```

Then edit:

```text
organchor.config.json
```

## 2. Choose Root Authority Mode

Recommended for a serious public pilot:

```text
2-of-3 root authority
```

Acceptable for a very small first test:

```text
1-of-1 root authority
```

Do not share one private key between several people. If several people should hold power, use several keys and a threshold.

## 3. Generate Root Authority

Simple 1-of-1:

```bash
organchor key generate --id root-2026
organchor authority create --key keys/root-2026.private.json --out root-authority.json
organchor authority verify --authority root-authority.json
```

Recommended 2-of-3:

```bash
organchor key generate --id root-a-2026
organchor key generate --id root-b-2026
organchor key generate --id root-c-2026
organchor authority create --keys keys/root-a-2026.private.json,keys/root-b-2026.private.json,keys/root-c-2026.private.json --threshold 2 --out root-authority.json
organchor authority verify --authority root-authority.json
```

Private keys stay offline or in the adoption workspace only. Never publish them.

## 4. Create And Sign Official Presence

```bash
organchor statement create --config organchor.config.json --authority root-authority.json --out statements/official-endpoints.json
organchor statement sign --key keys/root-2026.private.json --authority root-authority.json --in statements/official-endpoints.json --out statements/official-endpoints.json.sig
organchor statement verify --authority root-authority.json --in statements/official-endpoints.json --sig statements/official-endpoints.json.sig
```

For threshold authority, append signatures from enough independent root member keys:

```bash
organchor statement sign --key keys/root-a-2026.private.json --authority root-authority.json --in statements/official-endpoints.json --out statements/official-endpoints.json.sig
organchor statement sign --key keys/root-b-2026.private.json --authority root-authority.json --in statements/official-endpoints.json --out statements/official-endpoints.json.sig --append
organchor statement verify --authority root-authority.json --in statements/official-endpoints.json --sig statements/official-endpoints.json.sig
```

## 5. Generate The Public Verify Package

```bash
organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --out public/verify
```

Publish this directory to:

```text
https://example.org/verify/
```

Also expose:

```text
/.well-known/organchor.json
```

The website is not the identity root. It is the easiest discovery carrier.

After the first public package is published, treat it as a versioned adoption snapshot. If OrgAnchor later changes package shape or schema expectations, preserve the old package under a dated path such as `/verify/2026-07-09/`, publish the new package at `/verify/`, and use migration or continuity records when the root authority or package lineage changes. See `PROTOCOL_EVOLUTION_POLICY.md`.

## 6. Run Local And Public Verification

Local package check:

```bash
organchor statement verify --authority public/verify/root-authority.json --in public/verify/official-endpoints.json --sig public/verify/official-endpoints.json.sig
```

Public URL check:

```bash
organchor verify url https://example.org --compact
organchor doctor https://example.org
```

Human-visible check:

- open `/verify/`
- confirm the visible proof trail is understandable
- confirm no private key or provider secret appears in public files

## 7. Add Claims And Evidence Only When Needed

If the organization makes public product/service claims, add the evidence layer.

```bash
organchor claims create --config organchor.config.json
organchor evidence create --config organchor.config.json
organchor evidence add --file README.md --id evidence-001
organchor evidence method add --id method-001 --evidence-id evidence-001 --steps "Fetch artifact;Compute SHA-256;Compare with signed manifest" --expected-results "Hash matches"
organchor claims sign --key keys/root-2026.private.json --authority root-authority.json
organchor evidence sign --key keys/root-2026.private.json --authority root-authority.json
organchor claims verify --authority root-authority.json --in claims/product-claims.json --sig claims/product-claims.json.sig --evidence evidence/evidence-manifest.json
organchor evidence verify --authority root-authority.json --in evidence/evidence-manifest.json --sig evidence/evidence-manifest.json.sig
```

For S2 third-party material:

```bash
organchor evidence s2 template --template certification_record
organchor evidence s2 attach --evidence-id evidence-001 --template certification_record --issuer-name "Example Certification Body" --anchor-url https://registry.example/records/ABC-123 --scope "Certificate supports claim-001 for model-x1"
```

For S3 random purchase / sampling:

```bash
organchor evidence s3 template --template market_purchase
organchor evidence s3 attach --evidence-id evidence-001 --template market_purchase --sampler-type buyer --acquired-at 2026-05-28T00:00:00Z --subject-type product_model --subject-id model-x1 --sample-slot-id sample-slot-claim-001-2026-05-001 --storage-role DIRECTORY_VAULT --raw-availability-status REQUEST_REQUIRED --scope "Random market purchase sample supports claim-001 for model-x1"
```

S1-S3 are the Fireseed Alpha evidence baseline. S4/S5 are design previews.

## 8. Decide Carrier Depth

Minimum:

```text
public website /verify
```

Recommended Level 3:

```text
public website /verify
IPFS mirror
Arweave package or TX receipts
OpenTimestamps hash proofs
domain audit report
root-signed lockfile
```

Do not upload large raw evidence into the default verify mirror. Put large artifacts in a suitable evidence vault and reference them by signed hash.

## 9. Write Adoption Status

```bash
organchor adoption status --verify-dir public/verify --origin https://example.org --level 3 --out ADOPTION_STATUS.md --json reports/adoption-status-report.json
```

`ADOPTION_STATUS.md` is a transparency report, not a certification.

If this is run before the package is publicly deployed, the status may correctly report `NEEDS_WORK`. That means the local files exist, but the selected adoption level is not externally reachable yet.

## 10. Stop Conditions

Stop and review before:

- publishing the first root authority
- uploading to append-only archives
- making high-stakes claims
- buying domains or starting subscriptions
- migrating root authority
- publishing credentials, secrets, private keys, upload wallets, or payment data

For the full operator path, use `PILOT_MINIMAL_PATH.md` and `EXTERNAL_PILOT_RUNBOOK.md`.
