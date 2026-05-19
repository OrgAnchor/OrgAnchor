#!/usr/bin/env node
import { OrgAnchorError } from "./core/errors.ts";
import { arweavePublishCommand } from "./commands/arweave-publish.ts";
import { arweaveEstimateCommand } from "./commands/arweave-estimate.ts";
import { arweaveUploadCommand } from "./commands/arweave-upload.ts";
import { arweaveVerifyCommand } from "./commands/arweave-verify.ts";
import { authorityChangePlanCommand } from "./commands/authority-change-plan.ts";
import { authorityCreateCommand } from "./commands/authority-create.ts";
import { claimsCreateCommand } from "./commands/claims-create.ts";
import { claimsSignCommand } from "./commands/claims-sign.ts";
import { claimsVerifyCommand } from "./commands/claims-verify.ts";
import { evidenceAddCommand } from "./commands/evidence-add.ts";
import { evidenceCreateCommand } from "./commands/evidence-create.ts";
import { evidenceHashCommand } from "./commands/evidence-hash.ts";
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

type CommandHandler = (options: Record<string, string | boolean>) => Promise<void>;

const commands: Record<string, CommandHandler> = {
  "archive arweave estimate": arweaveEstimateCommand,
  "archive arweave publish": arweavePublishCommand,
  "archive arweave upload": arweaveUploadCommand,
  "archive arweave verify": arweaveVerifyCommand,
  "authority change-plan": authorityChangePlanCommand,
  "claims create": claimsCreateCommand,
  "claims sign": claimsSignCommand,
  "claims verify": claimsVerifyCommand,
  "domain audit": domainAuditCommand,
  "ens inspect": ensInspectCommand,
  "ens plan": ensPlanCommand,
  "ens verify": ensVerifyCommand,
  "evidence add": evidenceAddCommand,
  "evidence create": evidenceCreateCommand,
  "evidence hash": evidenceHashCommand,
  "evidence sign": evidenceSignCommand,
  "evidence verify": evidenceVerifyCommand,
  "init": initCommand,
  "key generate": keyGenerateCommand,
  "key public": keyPublicCommand,
  "key rotate-plan": keyRotatePlanCommand,
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
  "value audit": valueAuditCommand
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
  organchor init
  organchor key generate --id root-2026
  organchor key public --key keys/root-2026.private.json
  organchor key rotate-plan --authority root-authority.json --replace-key root-a --new-key keys/root-d.public.json
  organchor authority change-plan --old-authority root-authority.json --add-keys keys/root-d.public.json,keys/root-e.public.json --threshold 3
  organchor authority create --key keys/root-2026.private.json
  organchor authority create --keys keys/root-a.private.json,keys/root-b.private.json,keys/root-c.private.json --threshold 2
  organchor authority verify --authority root-authority.json
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
  organchor archive arweave publish --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json
  organchor archive arweave upload --provider turbo --dir arweave-package --wallet-file arweave-wallet.local.json
  organchor archive arweave verify --file arweave-package/official-endpoints.json --expected-hash sha256:...
  organchor archive arweave verify --tx ARWEAVE_TX_ID --gateway https://arweave.net --expected-hash sha256:...
  organchor claims create --config organchor.config.json
  organchor claims sign --key keys/root-2026.private.json --authority root-authority.json
  organchor claims sign --key keys/root-b.private.json --authority root-authority.json --append
  organchor claims verify --authority root-authority.json --in claims/product-claims.json --sig claims/product-claims.json.sig
  organchor domain audit example.com
  organchor evidence create --config organchor.config.json
  organchor evidence add --file README.md
  organchor evidence add --file demo.mp4 --uri https://example.com/evidence/demo.mp4 --location-type https
  organchor evidence hash --file README.md
  organchor evidence sign --key keys/root-2026.private.json --authority root-authority.json
  organchor evidence sign --key keys/root-b.private.json --authority root-authority.json --append
  organchor evidence verify --authority root-authority.json --in evidence/evidence-manifest.json --sig evidence/evidence-manifest.json.sig
  organchor ens inspect example.eth --records ens-records.json
  organchor ens plan example.eth --statement statements/official-endpoints.json
  organchor ens verify example.eth --statement statements/official-endpoints.json --records ens-records.json
  organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json
  organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --value-report reports/value-continuity-report.json
  organchor page generate --statement statements/official-endpoints.json --sig statements/official-endpoints.json.sig --authority root-authority.json --migration statements/migration-2027-001.json --migration-sig statements/migration-2027-001.json.sig
  organchor statement create --config organchor.config.json --authority root-authority.json
  organchor statement hash --in statements/official-endpoints.json
  organchor statement sign --key keys/root-2026.private.json --authority root-authority.json --in statements/official-endpoints.json
  organchor statement sign --key keys/root-b.private.json --authority root-authority.json --in statements/official-endpoints.json --append
  organchor statement verify --authority root-authority.json --expected-authority-hash sha256:... --in statements/official-endpoints.json --sig statements/official-endpoints.json.sig
  organchor value audit --claims claims/product-claims.json --evidence evidence/evidence-manifest.json --check-files
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
