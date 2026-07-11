#!/usr/bin/env node
import { OrgAnchorError } from "./core/errors.ts";
import { adoptionStatusCommand } from "./commands/adoption-status.ts";
import { arweavePublishCommand } from "./commands/arweave-publish.ts";
import { arweaveEstimateCommand } from "./commands/arweave-estimate.ts";
import { arweaveUploadCommand } from "./commands/arweave-upload.ts";
import { arweaveVerifyCommand } from "./commands/arweave-verify.ts";
import { authorityChangePlanCommand } from "./commands/authority-change-plan.ts";
import { authorityCreateCommand } from "./commands/authority-create.ts";
import { beaconGenerateCommand } from "./commands/beacon-generate.ts";
import { beaconIndexCommand } from "./commands/beacon-index.ts";
import { beaconInspectCommand } from "./commands/beacon-inspect.ts";
import { beaconQueryCommand } from "./commands/beacon-query.ts";
import { beaconReportCommand } from "./commands/beacon-report.ts";
import { beaconSweepCommand } from "./commands/beacon-sweep.ts";
import { beaconVerifyCommand } from "./commands/beacon-verify.ts";
import { claimsCreateCommand } from "./commands/claims-create.ts";
import { claimsSignCommand } from "./commands/claims-sign.ts";
import { claimsVerifyCommand } from "./commands/claims-verify.ts";
import { directoryAddCommand } from "./commands/directory-add.ts";
import { directoryBuildCommand } from "./commands/directory-build.ts";
import { directoryCompareCommand } from "./commands/directory-compare.ts";
import { directoryExportCommand } from "./commands/directory-export.ts";
import { directoryFetchCommand } from "./commands/directory-fetch.ts";
import { directoryInspectCommand } from "./commands/directory-inspect.ts";
import { directoryVerifyCommand } from "./commands/directory-verify.ts";
import { doctorCommand } from "./commands/doctor.ts";
import { evidenceAddCommand } from "./commands/evidence-add.ts";
import { evidenceCreateCommand } from "./commands/evidence-create.ts";
import { evidenceHashCommand } from "./commands/evidence-hash.ts";
import { evidenceMethodAddCommand } from "./commands/evidence-method-add.ts";
import { evidenceObserveRouteCommand } from "./commands/evidence-observe-route.ts";
import { evidenceObserveTemplateCommand } from "./commands/evidence-observe-template.ts";
import { evidenceS2AttachCommand, evidenceS2TemplateCommand } from "./commands/evidence-s2.ts";
import { evidenceS3AttachCommand, evidenceS3TemplateCommand } from "./commands/evidence-s3.ts";
import { evidenceS4AttachCommand, evidenceS4TemplateCommand } from "./commands/evidence-s4.ts";
import { evidenceSignCommand } from "./commands/evidence-sign.ts";
import { evidenceVerifyCommand } from "./commands/evidence-verify.ts";
import { domainAuditCommand } from "./commands/domain-audit.ts";
import { ensInspectCommand } from "./commands/ens-inspect.ts";
import { ensPlanCommand } from "./commands/ens-plan.ts";
import { ensVerifyCommand } from "./commands/ens-verify.ts";
import { ipfsPinCommand } from "./commands/ipfs-pin.ts";
import { ipfsPublishCommand } from "./commands/ipfs-publish.ts";
import { ipfsUploadCommand } from "./commands/ipfs-upload.ts";
import { ipfsVerifyCommand } from "./commands/ipfs-verify.ts";
import { authorityVerifyCommand } from "./commands/authority-verify.ts";
import { initCommand } from "./commands/init.ts";
import { keyGenerateCommand } from "./commands/key-generate.ts";
import { keyPublicCommand } from "./commands/key-public.ts";
import { keyRotatePlanCommand } from "./commands/key-rotate-plan.ts";
import { lockfileHashCommand } from "./commands/lockfile-hash.ts";
import { lockfileSignCommand } from "./commands/lockfile-sign.ts";
import { lockfileVerifyCommand } from "./commands/lockfile-verify.ts";
import { migrateCreateCommand } from "./commands/migrate-create.ts";
import { migrateSignCommand } from "./commands/migrate-sign.ts";
import { migrateVerifyCommand } from "./commands/migrate-verify.ts";
import { onionConfigGenerateCommand } from "./commands/onion-config-generate.ts";
import { onionInitCommand } from "./commands/onion-init.ts";
import { onionVerifyCommand } from "./commands/onion-verify.ts";
import { opentimestampsStampCommand } from "./commands/opentimestamps-stamp.ts";
import { opentimestampsUpgradeCommand } from "./commands/opentimestamps-upgrade.ts";
import { opentimestampsVerifyCommand } from "./commands/opentimestamps-verify.ts";
import { pageGenerateCommand } from "./commands/page-generate.ts";
import { statementCreateCommand } from "./commands/statement-create.ts";
import { statementHashCommand } from "./commands/statement-hash.ts";
import { statementSignCommand } from "./commands/statement-sign.ts";
import { statementVerifyCommand } from "./commands/statement-verify.ts";
import { valueAuditCommand } from "./commands/value-audit.ts";
import { verifyUrlCommand } from "./commands/verify-url.ts";

type CommandHandler = (options: Record<string, string | boolean>) => Promise<void>;

const commands: Record<string, CommandHandler> = {
  "adoption status": adoptionStatusCommand,
  "archive arweave estimate": arweaveEstimateCommand,
  "archive arweave publish": arweavePublishCommand,
  "archive arweave upload": arweaveUploadCommand,
  "archive arweave verify": arweaveVerifyCommand,
  "authority change-plan": authorityChangePlanCommand,
  "beacon generate": beaconGenerateCommand,
  "beacon index": beaconIndexCommand,
  "beacon inspect": beaconInspectCommand,
  "beacon query": beaconQueryCommand,
  "beacon report": beaconReportCommand,
  "beacon sweep": beaconSweepCommand,
  "beacon verify": beaconVerifyCommand,
  "claims create": claimsCreateCommand,
  "claims sign": claimsSignCommand,
  "claims verify": claimsVerifyCommand,
  "directory add": directoryAddCommand,
  "directory compare": directoryCompareCommand,
  "directory export": directoryExportCommand,
  "directory build": directoryBuildCommand,
  "directory fetch": directoryFetchCommand,
  "directory inspect": directoryInspectCommand,
  "directory verify": directoryVerifyCommand,
  "doctor": doctorCommand,
  "domain audit": domainAuditCommand,
  "ens inspect": ensInspectCommand,
  "ens plan": ensPlanCommand,
  "ens verify": ensVerifyCommand,
  "evidence add": evidenceAddCommand,
  "evidence create": evidenceCreateCommand,
  "evidence hash": evidenceHashCommand,
  "evidence method add": evidenceMethodAddCommand,
  "evidence observe route": evidenceObserveRouteCommand,
  "evidence observe template": evidenceObserveTemplateCommand,
  "evidence s2 attach": evidenceS2AttachCommand,
  "evidence s2 template": evidenceS2TemplateCommand,
  "evidence s3 attach": evidenceS3AttachCommand,
  "evidence s3 template": evidenceS3TemplateCommand,
  "evidence s4 attach": evidenceS4AttachCommand,
  "evidence s4 template": evidenceS4TemplateCommand,
  "evidence sign": evidenceSignCommand,
  "evidence verify": evidenceVerifyCommand,
  "init": initCommand,
  "key generate": keyGenerateCommand,
  "key public": keyPublicCommand,
  "key rotate-plan": keyRotatePlanCommand,
  "lockfile hash": lockfileHashCommand,
  "lockfile sign": lockfileSignCommand,
  "lockfile verify": lockfileVerifyCommand,
  "mirror ipfs pin": ipfsPinCommand,
  "mirror ipfs publish": ipfsPublishCommand,
  "mirror ipfs upload": ipfsUploadCommand,
  "mirror ipfs verify": ipfsVerifyCommand,
  "migrate create": migrateCreateCommand,
  "migrate sign": migrateSignCommand,
  "migrate verify": migrateVerifyCommand,
  "onion config generate": onionConfigGenerateCommand,
  "onion init": onionInitCommand,
  "onion verify": onionVerifyCommand,
  "anchor opentimestamps stamp": opentimestampsStampCommand,
  "anchor opentimestamps upgrade": opentimestampsUpgradeCommand,
  "anchor opentimestamps verify": opentimestampsVerifyCommand,
  "authority create": authorityCreateCommand,
  "authority verify": authorityVerifyCommand,
  "page generate": pageGenerateCommand,
  "statement create": statementCreateCommand,
  "statement hash": statementHashCommand,
  "statement sign": statementSignCommand,
  "statement verify": statementVerifyCommand,
  "value audit": valueAuditCommand,
  "verify url": verifyUrlCommand
};

async function main(argv: string[]): Promise<void> {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }

  const command = resolveCommand(argv);
  if (!command) {
    throw new Error(`Unknown command: ${argv.join(" ")}`);
  }
  await command.handler(command.options);
}

function resolveCommand(argv: string[]): { handler: CommandHandler; options: Record<string, string | boolean> } | null {
  for (let commandLength = Math.min(3, argv.length); commandLength >= 1; commandLength--) {
    const name = argv.slice(0, commandLength).join(" ");
    const handler = commands[name];
    if (handler) {
      return {
        handler,
        options: parseOptions(argv.slice(commandLength))
      };
    }
  }
  return null;
}

function parseOptions(args: string[]): Record<string, string | boolean> {
  const options: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === undefined) {
      throw new Error("Unexpected empty argument");
    }
    if (!arg.startsWith("--")) {
      if (options._ === undefined) {
        options._ = arg;
        continue;
      }
      throw new Error(`Unexpected argument "${arg}"`);
    }
    const withoutPrefix = arg.slice(2);
    const equalsIndex = withoutPrefix.indexOf("=");
    if (equalsIndex >= 0) {
      options[withoutPrefix.slice(0, equalsIndex)] = withoutPrefix.slice(equalsIndex + 1);
      continue;
    }
    const next = args[i + 1];
    if (next === undefined || next.startsWith("--")) {
      options[withoutPrefix] = true;
      continue;
    }
    options[withoutPrefix] = next;
    i++;
  }
  return options;
}

function printHelp(): void {
  console.log(`OrgAnchor

Usage:
  organchor adoption status --verify-dir public/verify --origin https://example.org --level 3
  organchor init
  organchor key generate --id root-2026
  organchor key public --key keys/root-2026.private.json
  organchor key rotate-plan --authority root-authority.json --replace-key root-a --new-key keys/root-d.public.json
  organchor lockfile hash --in organchor.lock.json
  organchor lockfile sign --key keys/root-2026.private.json --authority root-authority.json --in organchor.lock.json
  organchor lockfile verify --authority root-authority.json --in organchor.lock.json --sig organchor.lock.json.sig
  organchor authority change-plan --old-authority root-authority.json --add-keys keys/root-d.public.json,keys/root-e.public.json --threshold 3
  organchor authority create --key keys/root-2026.private.json
  organchor authority create --keys keys/root-a.private.json,keys/root-b.private.json,keys/root-c.private.json --threshold 2
  organchor authority verify --authority root-authority.json
  organchor beacon generate --verify-dir public/verify --origin https://example.org
  organchor beacon index --in beacon-sweep.ndjson --out beacon-index.json
  organchor beacon index --previous beacon-index.json --in beacon-sweep-latest.ndjson --out beacon-index.json
  organchor beacon inspect https://example.org
  organchor beacon query --index beacon-index.json --need "identity continuity support" --capability identity-continuity --conformance FULL_COMPATIBLE --limit 10
  organchor beacon report --sweeps beacon-sweep-a.ndjson,beacon-sweep-b.ndjson --out beacon-discovery-report.json
  organchor beacon sweep --seeds seeds.txt --out beacon-sweep.ndjson --concurrency 4 --timeout-ms 10000
  organchor beacon sweep --directory-snapshot public/directory/directory-snapshot.json --out beacon-sweep.ndjson
  organchor beacon sweep --sitemap https://example.org/sitemap.xml --out beacon-sweep.ndjson
  organchor beacon sweep --crawl https://example.org --crawl-max-pages 25 --crawl-max-depth 1 --out beacon-sweep.ndjson
  organchor beacon verify --in beacon-sweep.ndjson
  organchor mirror ipfs publish --dir public/verify --dry-run
  organchor mirror ipfs publish --dir public/verify --api http://127.0.0.1:5001
  organchor mirror ipfs publish --dir public/verify --allow-large
  organchor mirror ipfs pin --cid bafy... --service-url https://api.pinata.cloud/psa --token-env ORGANCHOR_IPFS_PINNING_JWT
  organchor mirror ipfs upload --provider pinata --dir public/verify --token-env ORGANCHOR_IPFS_PINNING_JWT
  organchor mirror ipfs verify --dir public/verify --expected-hash sha256:...
  organchor mirror ipfs verify --cid bafy... --api http://127.0.0.1:5001 --expected-hash sha256:...
  organchor migrate create --old-authority root-authority.json --new-authority root-authority-next.json
  organchor migrate sign --key keys/root-a.private.json --old-authority root-authority.json --in statements/migration-2026-001.json
  organchor migrate verify --old-authority root-authority.json --new-authority root-authority-next.json --in statements/migration-2026-001.json --sig statements/migration-2026-001.json.sig
  organchor onion init
  organchor onion verify <v3-address.onion>
  organchor onion config generate --domain <v3-address.onion>
  organchor anchor opentimestamps stamp --file statements/official-endpoints.json
  organchor anchor opentimestamps upgrade --proof anchors/opentimestamps/official-endpoints.json.ots
  organchor anchor opentimestamps verify --file statements/official-endpoints.json --proof anchors/opentimestamps/official-endpoints.json.ots
  organchor archive arweave estimate --dir arweave-package
  organchor archive arweave estimate --dir arweave-package --offline
  organchor archive arweave publish --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --overwrite
  organchor archive arweave upload --provider turbo --dir arweave-package --wallet-file arweave-wallet.local.json
  organchor archive arweave verify --file arweave-package/official-endpoints.json --expected-hash sha256:...
  organchor archive arweave verify --tx ARWEAVE_TX_ID --gateway https://arweave.net --expected-hash sha256:...
  organchor claims create --config organchor.config.json
  organchor claims sign --key keys/root-2026.private.json --authority root-authority.json
  organchor claims sign --key keys/root-b.private.json --authority root-authority.json --append
  organchor claims verify --authority root-authority.json --in claims/product-claims.json --sig claims/product-claims.json.sig
  organchor directory add --origins examples/directory/directory-origins.json --origin https://example.org --category software --capability identity-continuity
  organchor directory build --origins examples/directory/directory-origins.json --out public/directory
  organchor directory build --origins examples/directory/directory-origins.json --out public/directory --verify-origins
  organchor directory build --beacon-index beacon-index.json --node-origin https://directory.example --out public/directory
  organchor directory compare --snapshots directory-a.json,directory-b.json --out directory-compare.json
  organchor directory export --snapshot public/directory/directory-snapshot.json --format ndjson --out directory-feed.ndjson
  organchor directory fetch https://example.org
  organchor directory fetch https://example.org --capability identity-continuity --identity-status PASS --limit 5
  organchor directory inspect https://example.org
  organchor directory verify --snapshot public/directory/directory-snapshot.json
  organchor doctor https://example.org
  organchor domain audit example.com
  organchor evidence create --config organchor.config.json
  organchor evidence add --file README.md
  organchor evidence add --file demo.mp4 --uri https://example.com/evidence/demo.mp4 --location-type https --subject-type product --subject-id primary-product
  organchor evidence method add --id method-001 --evidence-id evidence-001 --steps "Fetch the public artifact;Compare the SHA-256 hash" --expected-results "The artifact hash matches the signed manifest"
  organchor evidence observe route --text "Recent 90 day on-time delivery for model-x1 orders"
  organchor evidence observe template --route S4_RECOMMENDED --subject-type product_family --subject-id model-x1
  organchor evidence s2 template --template certification_record
  organchor evidence s2 attach --evidence-id evidence-001 --template certification_record --issuer-name "Example Certification Body" --anchor-url https://registry.example/records/ABC-123 --scope "Certificate supports claim-001 for model-x1"
  organchor evidence s3 template --template market_purchase
  organchor evidence s3 attach --evidence-id evidence-001 --template market_purchase --sampler-type buyer --acquired-at 2026-05-28T00:00:00Z --subject-type product_model --subject-id model-x1 --claim-id claim-001 --claim-version 2026-05 --sample-pool-id s3-pool-claim-001-2026-05 --max-active-samples 24 --credential-hash sha256:... --sample-nullifier sha256:... --credential-verified-against-root --selector-control buyer --scope "Random market purchase sample supports claim-001 for model-x1"
  organchor evidence s4 template --template order_delivery
  organchor evidence s4 attach --evidence-id evidence-001 --template order_delivery --observer-id buyer.example --window-start 2026-05-01 --window-end 2026-05-31 --subject-type product_family --subject-id model-x1 --scope "Observed delivery performance supports claim-001 for model-x1" --raw-bundle-hash sha256:... --vault-uri https://vault.example/evidence/orders
  organchor evidence hash --file README.md
  organchor evidence sign --key keys/root-2026.private.json --authority root-authority.json
  organchor evidence sign --key keys/root-b.private.json --authority root-authority.json --append
  organchor evidence verify --authority root-authority.json --in evidence/evidence-manifest.json --sig evidence/evidence-manifest.json.sig
  organchor ens inspect example.eth --records ens-records.json
  organchor ens plan example.eth --statement statements/official-endpoints.json
  organchor ens verify example.eth --statement statements/official-endpoints.json --records ens-records.json
  organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json
  organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --value-report reports/value-continuity-report.json
  organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --directory-snapshot public/directory/directory-snapshot.json
  organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --migration statements/migration-2027-001.json --migration-sig statements/migration-2027-001.json.sig
  organchor statement create --config organchor.config.json --authority root-authority.json
  organchor statement hash --in statements/official-endpoints.json
  organchor statement sign --key keys/root-2026.private.json --authority root-authority.json --in statements/official-endpoints.json
  organchor statement sign --key keys/root-b.private.json --authority root-authority.json --in statements/official-endpoints.json --append
  organchor statement verify --authority root-authority.json --expected-authority-hash sha256:... --in statements/official-endpoints.json --sig statements/official-endpoints.json.sig
  organchor value audit --claims claims/product-claims.json --evidence evidence/evidence-manifest.json --check-files
  organchor verify url https://example.org
  organchor verify url https://example.org --compact
`);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  if (error instanceof OrgAnchorError) {
    console.error(`${error.code}: ${error.message}`);
  } else if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exitCode = 1;
});
