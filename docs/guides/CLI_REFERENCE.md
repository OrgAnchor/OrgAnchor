# OrgAnchor CLI Reference

Status: Active Alpha.5 command-family reference.

This page keeps operational commands out of the public README. It is a compact
reference, not a substitute for custody, publishing, or pilot guidance. Run
`organchor --help` against the installed package for the exact command surface
of that version.

## Install And Inspect

```bash
npm install -g organchor@alpha
organchor --help
```

Use `@alpha` explicitly. The npm `latest` tag currently points to an older alpha
and is not a stability claim.

## Workspace And Readiness

```bash
organchor init
organchor adoption status --verify-dir public/verify --origin https://example.org --level 3
organchor doctor https://example.org
```

## Keys And Root Authority

```bash
organchor key generate --id root-2026
organchor key public --key keys/root-2026.private.json
organchor authority create --key keys/root-2026.private.json
organchor authority create --keys keys/root-a.private.json,keys/root-b.private.json,keys/root-c.private.json --threshold 2
organchor authority verify --authority root-authority.json
organchor key rotate-plan --authority root-authority.json --replace-key root-a --new-key keys/root-d.public.json
organchor authority change-plan --old-authority root-authority.json --add-keys keys/root-d.public.json,keys/root-e.public.json --threshold 3
```

## Official Presence And Verify Page

```bash
organchor statement create --config organchor.config.json --authority root-authority.json
organchor statement hash --in statements/official-endpoints.json
organchor statement sign --key keys/root-2026.private.json --authority root-authority.json --in statements/official-endpoints.json
organchor statement sign --key keys/root-b.private.json --authority root-authority.json --in statements/official-endpoints.json --append
organchor statement verify --authority root-authority.json --in statements/official-endpoints.json --sig statements/official-endpoints.json.sig
organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --out public/verify
organchor verify url https://example.org
organchor verify url https://example.org --brief
organchor verify url https://example.org --compact
```

## Claims, Evidence, And Value Audit

```bash
organchor claims create --config organchor.config.json
organchor claims sign --key keys/root-2026.private.json --authority root-authority.json
organchor claims verify --authority root-authority.json --in claims/product-claims.json --sig claims/product-claims.json.sig
organchor evidence create --config organchor.config.json
organchor evidence hash --file README.md
organchor evidence add --file README.md --id evidence-001
organchor evidence add --file demo.mp4 --uri https://example.org/evidence/demo.mp4 --location-type https --subject-type product --subject-id primary-product
organchor evidence method add --id method-001 --evidence-id evidence-001 --steps "Fetch artifact;Compute SHA-256;Compare with signed manifest" --expected-results "Hash matches"
organchor evidence sign --key keys/root-2026.private.json --authority root-authority.json
organchor evidence verify --authority root-authority.json --in evidence/evidence-manifest.json --sig evidence/evidence-manifest.json.sig
organchor value audit --claims claims/product-claims.json --evidence evidence/evidence-manifest.json --check-files
```

## S2, S3, And S4 Helpers

```bash
organchor evidence s2 template --template certification_record
organchor evidence s2 attach --evidence-id evidence-001 --template certification_record --issuer-name "Example Certification Body" --anchor-url https://registry.example/records/ABC-123 --scope "Certificate supports claim-001 for model-x1"
organchor evidence s3 template --template market_purchase
organchor evidence s3 attach --evidence-id evidence-001 --template market_purchase --sampler-type buyer --acquired-at 2026-05-28T00:00:00Z --subject-type product_model --subject-id model-x1 --claim-id claim-001 --claim-version 2026-05 --sample-pool-id s3-pool-claim-001-2026-05 --max-active-samples 24 --credential-hash sha256:... --sample-nullifier sha256:... --credential-verified-against-root --selector-control buyer --scope "Random market purchase sample supports claim-001 for model-x1"
organchor evidence observe route --text "Recent 90 day on-time delivery for model-x1 orders"
organchor evidence observe template --route S4_RECOMMENDED --subject-type product_family --subject-id model-x1
organchor evidence s4 template --template order_delivery
organchor evidence s4 attach --evidence-id evidence-001 --template order_delivery --observer-id buyer.example --window-start 2026-05-01 --window-end 2026-05-31 --subject-type product_family --subject-id model-x1 --scope "Observed delivery performance supports claim-001 for model-x1" --raw-bundle-hash sha256:... --vault-uri https://vault.example/evidence/orders
```

S2 material is organization-submitted third-party material. S3 is bounded
sampling structure. S4 helpers are partial alpha tooling, not a mature public
observer network. See the evidence protocol documents before relying on these
records.

## Beacon Discovery

```bash
organchor beacon generate --verify-dir public/verify --origin https://example.org
organchor beacon inspect https://example.org
organchor beacon sweep --seeds seeds.txt --out beacon-sweep.ndjson --concurrency 4 --timeout-ms 10000
organchor beacon sweep --sitemap https://example.org/sitemap.xml --out beacon-sweep.ndjson
organchor beacon sweep --crawl https://example.org --crawl-max-pages 25 --crawl-max-depth 1 --out beacon-sweep.ndjson
organchor beacon verify --in beacon-sweep.ndjson
organchor beacon report --sweeps beacon-sweep.ndjson --out beacon-discovery-report.json
organchor beacon index --in beacon-sweep.ndjson --out beacon-index.json
organchor beacon index --previous beacon-index.json --in beacon-sweep-latest.ndjson --out beacon-index.json
organchor beacon query --index beacon-index.json --need "identity continuity support" --capability identity-continuity --conformance FULL_COMPATIBLE --limit 10
```

Beacon makes a known origin cheap to inspect and lets bounded crawlers build
their own indexes. It does not guarantee global discovery.

## Directory Snapshots

```bash
organchor directory add --origins directory-origins.json --origin https://example.org --category software --capability identity-continuity
organchor directory build --origins directory-origins.json --out public/directory --verify-origins
organchor directory build --beacon-index beacon-index.json --node-origin https://directory.example --out public/directory
organchor directory verify --snapshot public/directory/directory-snapshot.json
organchor directory inspect https://directory.example
organchor directory fetch https://directory.example --capability identity-continuity --identity-status PASS --limit 5
organchor directory compare --snapshots directory-a.json,directory-b.json --out directory-compare.json
organchor directory export --snapshot public/directory/directory-snapshot.json --format ndjson --out directory-feed.ndjson
```

Directory inclusion and ranking are external policy. A Directory is not an
OrgAnchor trust root, certification authority, or privileged registry.

## Publication Ledger

```bash
organchor lockfile hash --in organchor.lock.json
organchor lockfile sign --key keys/root-2026.private.json --authority root-authority.json --in organchor.lock.json
organchor lockfile verify --authority root-authority.json --in organchor.lock.json --sig organchor.lock.json.sig
```

The lockfile records publication receipts. It is not the identity root.

## IPFS

```bash
organchor mirror ipfs publish --dir public/verify --dry-run
organchor mirror ipfs publish --dir public/verify --api http://127.0.0.1:5001
organchor mirror ipfs pin --cid bafy... --service-url https://api.pinata.cloud/psa --token-env ORGANCHOR_IPFS_PINNING_JWT
organchor mirror ipfs upload --provider pinata --dir public/verify --token-env ORGANCHOR_IPFS_PINNING_JWT
organchor mirror ipfs verify --cid bafy... --api http://127.0.0.1:5001 --expected-hash sha256:...
```

A CID identifies content; it does not guarantee that the content remains
available without pinning or another serving party.

## Arweave And OpenTimestamps

```bash
organchor archive arweave publish --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json
organchor archive arweave estimate --dir arweave-package
organchor archive arweave upload --provider turbo --dir arweave-package --wallet-file arweave-wallet.local.json
organchor archive arweave verify --tx ARWEAVE_TX_ID --gateway https://arweave.net --expected-hash sha256:...
organchor anchor opentimestamps stamp --file statements/official-endpoints.json
organchor anchor opentimestamps upgrade --proof anchors/opentimestamps/official-endpoints.json.ots
organchor anchor opentimestamps verify --file statements/official-endpoints.json --proof anchors/opentimestamps/official-endpoints.json.ots
```

Arweave is an archival carrier. OpenTimestamps anchors a hash to public time.
Neither proves that a real-world claim is true.

## Domain, Onion, And ENS

```bash
organchor domain audit example.org
organchor onion init
organchor onion verify <v3-address.onion>
organchor onion config generate --domain <v3-address.onion>
organchor ens inspect example.eth --records ens-records.json
organchor ens plan example.eth --statement statements/official-endpoints.json
organchor ens verify example.eth --statement statements/official-endpoints.json --records ens-records.json
```

OrgAnchor checks or plans these supporting surfaces. It does not operate a Tor
service, control a registrar, or replace a live ENS RPC/provider integration.

## Root Authority Migration

```bash
organchor migrate create --old-authority root-authority.json --new-authority root-authority-next.json
organchor migrate sign --key keys/root-a.private.json --old-authority root-authority.json --in statements/migration-2026-001.json
organchor migrate verify --old-authority root-authority.json --new-authority root-authority-next.json --in statements/migration-2026-001.json --sig statements/migration-2026-001.json.sig
organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority-next.json --migration statements/migration-2026-001.json --migration-sig statements/migration-2026-001.json.sig
```

Preserve old signed packages and publish a signed migration chain. A new
OrgAnchor version must not silently rewrite an adopter's authority history.

## Safety Boundary

Do not publish private keys, recovery codes, provider tokens, wallets, payment
records, or confidential evidence. Stop for explicit review before the first
root publication, append-only archive upload, authority migration, or any
high-stakes product or service claim.
